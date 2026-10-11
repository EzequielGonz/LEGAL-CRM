-- =====================================================================
-- Etapa 1 · Bloques 1.2 y 1.3 — Detención persistente, oportunidad
-- separada del contacto, estados que coexisten, historial con autor e
-- incidencias para revisión.
--
-- Aditiva: no modifica ni borra columnas existentes. contacts.status y
-- conversations.status quedan como valores históricos (el código anterior
-- los sigue leyendo); el estado nuevo vive en `opportunities`.
-- =====================================================================

set lock_timeout = '5s';

-- ---------------------------------------------------------------------
-- Teléfono: valor original y normalización única (misma regla que
-- src/lib/phone.ts: 549 + área + abonado, sin 0 ni 15).
-- ---------------------------------------------------------------------
create or replace function public.normalize_phone_ar(raw text)
returns text
language plpgsql
immutable
set search_path to ''
as $function$
declare
  d text;
begin
  if raw is null then
    return null;
  end if;
  d := regexp_replace(raw, '[^0-9]', '', 'g');
  if d = '' then
    return null;
  end if;
  if left(d, 2) = '54' then
    d := substr(d, 3);
  end if;
  if left(d, 1) = '9' and length(d) > 10 then
    d := substr(d, 2);
  end if;
  d := regexp_replace(d, '^0', '');
  if length(d) = 12 and left(d, 4) = '1115' then
    d := '11' || substr(d, 5);
  end if;
  if length(d) >= 9 then
    return '549' || d;
  end if;
  return null;
end $function$;

alter table public.contacts add column if not exists phone_original text;

-- ---------------------------------------------------------------------
-- Detención persistente (por perfil). Se busca por teléfono normalizado,
-- así sigue vigente ante una carga nueva, otra campaña, otra línea u otro
-- agente. "No responder" nunca crea una detención; agotar intentos tampoco.
-- ---------------------------------------------------------------------
create table if not exists public.contact_detentions (
  id uuid primary key default gen_random_uuid(),
  rubro_id uuid not null references public.rubros(id),
  contact_id uuid references public.contacts(id) on delete set null,
  phone_normalized text,
  motive text not null check (motive in (
    'necesidad_resuelta', 'compra_otro_canal', 'desinteres', 'no_contacto', 'enojo',
    'numero_equivocado', 'abogado_existente', 'motivo_no_confirmado')),
  motives text[] not null default '{}',
  minor_reported boolean not null default false,
  source text not null check (source in ('migracion', 'agente', 'operador', 'importacion')),
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'vigente' check (status in ('vigente', 'levantada')),
  created_at timestamptz not null default now(),
  created_by text not null default 'sistema',
  lifted_at timestamptz,
  lifted_by text,
  lift_reason text,
  check (phone_normalized is not null or contact_id is not null)
);
create index if not exists contact_detentions_phone_idx
  on public.contact_detentions (rubro_id, phone_normalized) where status = 'vigente';
create index if not exists contact_detentions_contact_idx
  on public.contact_detentions (contact_id) where status = 'vigente';

-- Un pedido de no contacto o un número de una menor no se levantan desde
-- una acción común: solo con motivo escrito (queda registrado quién y por qué).
create or replace function public.contact_detentions_guard()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  if tg_op = 'DELETE' then
    raise exception 'Las detenciones no se borran: se levantan con motivo.';
  end if;
  if new.status = 'levantada' and old.status = 'vigente' then
    if coalesce(trim(new.lift_reason), '') = '' then
      raise exception 'Para levantar una detención hay que escribir el motivo.';
    end if;
    new.lifted_at := coalesce(new.lifted_at, now());
  end if;
  return new;
end $function$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'contact_detentions_guard') then
    create trigger contact_detentions_guard
      before update or delete on public.contact_detentions
      for each row execute function public.contact_detentions_guard();
  end if;
end $$;

-- ¿Está detenido este contacto en su perfil? (por id o por teléfono)
create or replace function public.contact_detention(p_contact_id uuid)
returns table (detention_id uuid, motive text, minor_reported boolean, hard_block boolean)
language sql
stable
set search_path to ''
as $function$
  select d.id, d.motive, d.minor_reported,
         (d.motive = 'no_contacto' or d.minor_reported) as hard_block
    from public.contacts c
    join public.contact_detentions d
      on d.status = 'vigente'
     and d.rubro_id = c.rubro_id
     and (d.contact_id = c.id
          or (d.phone_normalized is not null
              and d.phone_normalized = public.normalize_phone_ar(c.phone)))
   where c.id = p_contact_id
   order by (d.motive = 'no_contacto' or d.minor_reported) desc, d.created_at
   limit 1
$function$;

-- ---------------------------------------------------------------------
-- Oportunidad de captación: separada del contacto, con estados que
-- coexisten (no se comprimen en una etiqueta única).
-- ---------------------------------------------------------------------
create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  rubro_id uuid not null references public.rubros(id),
  area area_type not null,
  contact_id uuid not null references public.contacts(id) on delete restrict,
  conversation_id uuid references public.conversations(id) on delete set null,
  origin_source text,
  campaign_id uuid references public.campaigns(id) on delete set null,
  imported_base_id uuid references public.imported_bases(id) on delete set null,

  -- Contacto y respuesta
  contact_state text not null default 'sin_contactar'
    check (contact_state in ('sin_contactar', 'contactado_sin_respuesta', 'respondio', 'error_contacto')),
  contact_evidence text
    check (contact_evidence in ('envio_con_id', 'envio_sin_id', 'respuesta', 'manual')),
  -- Captación
  capture_state text not null default 'nuevo'
    check (capture_state in ('nuevo', 'en_conversacion', 'en_seguimiento', 'captado', 'perdido')),
  capture_reason text,
  captured_at timestamptz,
  -- Seguimiento
  followup_state text not null default 'ninguno'
    check (followup_state in ('ninguno', 'activo', 'completado', 'caido')),
  followup_reason text,
  followup_next_at timestamptz,
  -- Atención
  attention_state text not null default 'ia'
    check (attention_state in ('ia', 'requiere_humano', 'humano_en_curso')),
  -- Derivación (solo manual)
  derivation_state text not null default 'no_derivado'
    check (derivation_state in ('no_derivado', 'derivado')),
  derived_at timestamptz,
  derived_by text,
  derivation_recipient text,
  derivation_notes text,

  -- Historia y revisión
  historical_result text,
  motive_unconfirmed boolean not null default false,
  review_required boolean not null default false,
  automation_hold boolean not null default false,
  automation_hold_reason text,
  legacy_contact_status conversation_status,
  legacy_conversation_status conversation_status,
  migration_group text,
  migration_group_table text,
  migrated_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists opportunities_migration_once
  on public.opportunities (contact_id) where migration_group is not null;
create index if not exists opportunities_contact_idx on public.opportunities (contact_id);
create index if not exists opportunities_conversation_idx on public.opportunities (conversation_id);
create index if not exists opportunities_rubro_capture_idx on public.opportunities (rubro_id, capture_state);
create index if not exists opportunities_rubro_contact_idx on public.opportunities (rubro_id, contact_state);
create index if not exists opportunities_rubro_derivation_idx
  on public.opportunities (rubro_id, derivation_state) where capture_state = 'captado';

-- Historial con autor (con PIN general no hay identidad personal: se
-- registra si fue la IA, una persona desde el panel, el sistema o la migración).
create table if not exists public.opportunity_events (
  id bigint generated always as identity primary key,
  opportunity_id uuid not null references public.opportunities(id) on delete restrict,
  at timestamptz not null default now(),
  actor text not null check (actor in ('ia', 'operador', 'sistema', 'migracion')),
  dimension text not null check (dimension in (
    'contacto', 'captacion', 'seguimiento', 'atencion', 'derivacion', 'ficha', 'detencion', 'revision')),
  from_value text,
  to_value text,
  reason text,
  detail jsonb not null default '{}'::jsonb
);
create index if not exists opportunity_events_opp_idx on public.opportunity_events (opportunity_id, at);

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'opportunity_events_append_only') then
    create trigger opportunity_events_append_only
      before update or delete on public.opportunity_events
      for each row execute function public.prevent_row_changes('El historial solo admite agregar filas');
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Incidencias para revisión desde el panel.
-- ---------------------------------------------------------------------
create table if not exists public.incidences (
  id uuid primary key default gen_random_uuid(),
  rubro_id uuid references public.rubros(id),
  kind text not null check (kind in (
    'ultimo_mensaje_sin_respuesta', 'pregunta_origen_datos', 'numero_menor', 'numero_tercero',
    'estado_contacto_conversacion', 'plantillas_sin_id', 'contactos_sin_base',
    'cierre_ganado_sin_aceptacion', 'conversacion_abierta', 'solicitud_supresion_datos',
    'motivo_no_confirmado', 'mensaje_posterior_migracion', 'otro')),
  contact_id uuid references public.contacts(id) on delete set null,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  affected_count integer,
  detail jsonb not null default '{}'::jsonb,
  status text not null default 'abierta' check (status in ('abierta', 'resuelta', 'descartada')),
  created_at timestamptz not null default now(),
  created_by text not null default 'sistema',
  resolved_at timestamptz,
  resolved_by text,
  resolution_note text
);
create unique index if not exists incidences_kind_contact_once
  on public.incidences (kind, contact_id) where contact_id is not null;
create unique index if not exists incidences_kind_aggregate_once
  on public.incidences (kind) where contact_id is null and created_by = 'migracion';
create index if not exists incidences_open_idx on public.incidences (rubro_id, status, created_at desc);

-- ---------------------------------------------------------------------
-- Formulario público (landing): límite por origen.
-- ---------------------------------------------------------------------
create table if not exists public.landing_submissions (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  origin_hash text not null,
  area area_type
);
create index if not exists landing_submissions_origin_idx on public.landing_submissions (origin_hash, at desc);

-- ---------------------------------------------------------------------
-- Permisos: nada accesible con la clave pública.
-- ---------------------------------------------------------------------
alter table public.contact_detentions enable row level security;
alter table public.opportunities enable row level security;
alter table public.opportunity_events enable row level security;
alter table public.incidences enable row level security;
alter table public.landing_submissions enable row level security;
revoke all on public.contact_detentions, public.opportunities, public.opportunity_events,
              public.incidences, public.landing_submissions from anon, authenticated;
revoke all on function public.contact_detention(uuid) from public, anon, authenticated;
grant execute on function public.contact_detention(uuid) to service_role;
