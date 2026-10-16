-- =====================================================================
-- Etapa 2 · Bloque 1 — Reglas de base y captación
-- (parche 2.0 secciones 6.3, 10.2 y 12.2; bloques 2.1, 2.2, 2.4 y 2.9)
--
-- Qué agrega (todo aditivo: la versión publicada no lo usa):
--  * Origen de cada salida (`messages.origin`) y atención entrante 24 h por
--    perfil (`rubros.inbound_24h_enabled`, APAGADA por defecto).
--  * Oportunidad: resultado posterior a la derivación (otra dimensión),
--    advertencias de captación, zona en tres valores, categoría y motivo de
--    la atención humana, ruta jurídica (fases / directa).
--  * `capture_events`: la captación es un evento único por oportunidad,
--    con evidencia. `capture_notices`: un aviso interno por evento y
--    destinatario; sin destinatario queda pendiente y visible.
--  * Citas: tipo (ia / profesional; la de IA no consume turnos humanos),
--    mensaje de inicio realmente enviado y cita de origen (un solo
--    reagendamiento). `cita_tareas`: inicio de cita y reagendamiento, una
--    sola tarea de cada tipo por cita.
--  * `capture_register(...)`: registra la captación en una sola operación
--    atómica e idempotente (repetir el cierre no duplica evento ni aviso) y
--    cancela los contactos pendientes del mismo cierre.
--
-- Nada se envía ni se habilita: no hay disparadores que contacten a nadie.
-- Repetible sin error. Reversión: docs/etapa2/sql/revertir_0203_0207.sql.
-- =====================================================================

set lock_timeout = '5s';

-- ---------------------------------------------------------------------
-- 1) Origen de las salidas y atención entrante 24 h
-- ---------------------------------------------------------------------
alter table public.messages add column if not exists origin text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'messages_origin_check') then
    alter table public.messages add constraint messages_origin_check check (origin is null or origin in (
      'respuesta_entrante', 'inicio_campana', 'seguimiento', 'reagendamiento',
      'inicio_cita', 'recuperacion', 'atencion_humana'));
  end if;
end $$;

alter table public.rubros
  add column if not exists inbound_24h_enabled boolean not null default false,
  -- Destinatarios de los avisos internos de captación: [{ "clave": "...", "nombre": "..." }].
  -- Vacío: el aviso queda pendiente y visible en el panel.
  add column if not exists capture_notice_recipients jsonb not null default '[]'::jsonb;

-- Registro de accesos: cambiar la atención entrante 24 h, la biblioteca de
-- agentes o la política de publicación pide el PIN y queda registrado.
alter table public.access_events drop constraint if exists access_events_kind_check;
alter table public.access_events add constraint access_events_kind_check check (kind in (
  'ingreso', 'ingreso_fallido', 'bloqueo_origen', 'intento_bloqueado', 'salida',
  'cambio_pin', 'cambio_pin_fallido', 'recuperacion_pin', 'pin_inicial',
  'cierre_todas_sesiones', 'pausa_general', 'seguimiento_automatico',
  'atencion_entrante_24h', 'biblioteca_agentes', 'politica_publicacion'));

-- ---------------------------------------------------------------------
-- 2) Oportunidad: resultado posterior, captación, zona y atención
-- ---------------------------------------------------------------------
alter table public.opportunities
  add column if not exists post_derivation_state text,
  add column if not exists post_derivation_at timestamptz,
  add column if not exists post_derivation_source text,
  add column if not exists post_derivation_reason text,
  add column if not exists post_derivation_note text,
  add column if not exists post_derivation_contact_expected_at timestamptz,
  add column if not exists capture_warnings jsonb not null default '[]'::jsonb,
  add column if not exists location_zone text not null default 'sin_confirmar',
  add column if not exists attention_category text,
  add column if not exists attention_reason text,
  add column if not exists legal_route text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'opportunities_post_derivation_state_check') then
    alter table public.opportunities add constraint opportunities_post_derivation_state_check check (
      post_derivation_state is null or post_derivation_state in (
        'contacto_previsto', 'pendiente_actualizacion', 'contactado_por_profesional',
        'avanzo', 'operacion_concretada', 'no_avanzo', 'necesita_nueva_gestion'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'opportunities_post_derivation_source_check') then
    alter table public.opportunities add constraint opportunities_post_derivation_source_check check (
      post_derivation_source is null or post_derivation_source in ('profesional', 'operador', 'prospecto'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'opportunities_location_zone_check') then
    alter table public.opportunities add constraint opportunities_location_zone_check check (
      location_zone in ('amba', 'fuera', 'sin_confirmar'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'opportunities_attention_category_check') then
    alter table public.opportunities add constraint opportunities_attention_category_check check (
      attention_category is null or attention_category in (
        'comercial', 'detencion', 'procedencia', 'solicitud_datos', 'excepcion_datos',
        'incidencia_operativa', 'registro_historico'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'opportunities_legal_route_check') then
    alter table public.opportunities add constraint opportunities_legal_route_check check (
      legal_route is null or legal_route in ('fases', 'directa'));
  end if;
end $$;

create index if not exists opportunities_post_derivation_idx
  on public.opportunities (rubro_id, post_derivation_state) where derivation_state = 'derivado';
create index if not exists opportunities_attention_idx
  on public.opportunities (rubro_id, attention_state, attention_category);

-- Historial: el resultado posterior es una dimensión propia.
alter table public.opportunity_events drop constraint if exists opportunity_events_dimension_check;
alter table public.opportunity_events add constraint opportunity_events_dimension_check check (dimension in (
  'contacto', 'captacion', 'seguimiento', 'atencion', 'derivacion', 'ficha', 'detencion', 'revision',
  'resultado_posterior', 'cita'));

-- ---------------------------------------------------------------------
-- 3) Evento único de captación y avisos internos
-- ---------------------------------------------------------------------
create table if not exists public.capture_events (
  id uuid primary key default gen_random_uuid(),
  -- Identificador estable del evento (lo usan los avisos y los reintentos).
  event_key text not null unique,
  rubro_id uuid not null references public.rubros(id),
  opportunity_id uuid not null unique references public.opportunities(id) on delete restrict,
  contact_id uuid not null references public.contacts(id) on delete restrict,
  conversation_id uuid references public.conversations(id) on delete set null,
  actor text not null check (actor in ('ia', 'operador', 'sistema')),
  evidence text not null check (length(btrim(evidence)) > 0),
  warnings jsonb not null default '[]'::jsonb,
  location_zone text not null default 'sin_confirmar' check (location_zone in ('amba', 'fuera', 'sin_confirmar')),
  created_at timestamptz not null default now()
);

create table if not exists public.capture_notices (
  id uuid primary key default gen_random_uuid(),
  capture_event_id uuid not null references public.capture_events(id) on delete restrict,
  rubro_id uuid not null references public.rubros(id),
  -- 'sin_destinatario' cuando el perfil todavía no tiene destinatarios.
  recipient_key text not null,
  recipient_label text,
  status text not null default 'pendiente' check (status in ('pendiente', 'enviado', 'error', 'sin_destinatario')),
  attempts smallint not null default 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (capture_event_id, recipient_key)
);
create index if not exists capture_notices_pending_idx
  on public.capture_notices (rubro_id, status) where status in ('pendiente', 'error', 'sin_destinatario');

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'capture_events_no_delete') then
    create trigger capture_events_no_delete before delete on public.capture_events
      for each row execute function public.prevent_hard_delete();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'capture_notices_no_delete') then
    create trigger capture_notices_no_delete before delete on public.capture_notices
      for each row execute function public.prevent_hard_delete();
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 4) Citas: tipo, inicio enviado y un solo reagendamiento
-- ---------------------------------------------------------------------
alter table public.appointments
  add column if not exists kind text not null default 'profesional',
  add column if not exists start_message_id uuid references public.messages(id) on delete set null,
  add column if not exists start_sent_at timestamptz,
  add column if not exists reschedule_of uuid references public.appointments(id) on delete restrict,
  add column if not exists opportunity_id uuid references public.opportunities(id) on delete set null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'appointments_kind_check') then
    alter table public.appointments add constraint appointments_kind_check check (kind in ('ia', 'profesional'));
  end if;
end $$;
-- Una cita se reagenda como mucho una vez.
create unique index if not exists appointments_reschedule_once
  on public.appointments (reschedule_of) where reschedule_of is not null;

create table if not exists public.cita_tareas (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete restrict,
  rubro_id uuid not null references public.rubros(id),
  opportunity_id uuid references public.opportunities(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  kind text not null check (kind in ('inicio_cita', 'reagendamiento')),
  -- El origen es el mismo nombre que el tipo; se guarda para el registro.
  origin text not null check (origin in ('inicio_cita', 'reagendamiento')),
  scheduled_at timestamptz not null,
  status text not null default 'programada' check (status in (
    'programada', 'enviando', 'enviada', 'cancelada', 'a_revisar', 'fallida')),
  status_reason text,
  claim_token uuid,
  claimed_at timestamptz,
  message_id uuid references public.messages(id) on delete set null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Una sola tarea de cada tipo por cita (exactamente un reagendamiento).
  unique (appointment_id, kind)
);
create index if not exists cita_tareas_due_idx on public.cita_tareas (status, scheduled_at) where status = 'programada';

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'cita_tareas_no_delete') then
    create trigger cita_tareas_no_delete before delete on public.cita_tareas
      for each row execute function public.prevent_hard_delete();
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 5) Registro atómico de la captación
-- ---------------------------------------------------------------------
-- Devuelve el evento (nuevo o el ya existente) y si se creó ahora. Con la
-- oportunidad bloqueada: dos cierres simultáneos dejan un solo evento, un
-- solo cambio de estado y un solo juego de avisos.
create or replace function public.capture_register(
  p_opportunity uuid,
  p_actor text,
  p_evidence text,
  p_warnings jsonb default '[]'::jsonb,
  p_zone text default 'sin_confirmar'
)
returns table (event_id uuid, created boolean)
language plpgsql
set search_path = public
as $$
declare
  v_opp public.opportunities%rowtype;
  v_event uuid;
  v_recipients jsonb;
  v_zone text := case when p_zone in ('amba', 'fuera', 'sin_confirmar') then p_zone else 'sin_confirmar' end;
  r jsonb;
begin
  if p_actor not in ('ia', 'operador', 'sistema') then raise exception 'actor inválido'; end if;
  if p_evidence is null or length(btrim(p_evidence)) = 0 then raise exception 'La captación necesita evidencia'; end if;

  select * into v_opp from public.opportunities where id = p_opportunity for update;
  if not found then raise exception 'Oportunidad inexistente'; end if;

  select ce.id into v_event from public.capture_events ce where ce.opportunity_id = p_opportunity;
  if v_event is not null then
    return query select v_event, false;
    return;
  end if;

  insert into public.capture_events (event_key, rubro_id, opportunity_id, contact_id, conversation_id, actor, evidence, warnings, location_zone)
  values ('captacion:' || p_opportunity::text, v_opp.rubro_id, v_opp.id, v_opp.contact_id, v_opp.conversation_id,
          p_actor, left(btrim(p_evidence), 2000), coalesce(p_warnings, '[]'::jsonb), v_zone)
  returning id into v_event;

  update public.opportunities
     set capture_state = 'captado',
         captured_at = coalesce(captured_at, now()),
         capture_reason = null,
         capture_warnings = coalesce(p_warnings, '[]'::jsonb),
         location_zone = v_zone,
         updated_at = now()
   where id = p_opportunity;

  insert into public.opportunity_events (opportunity_id, actor, dimension, from_value, to_value, reason, detail)
  values (p_opportunity, p_actor, 'captacion', v_opp.capture_state, 'captado', left(btrim(p_evidence), 500),
          jsonb_build_object('evento', v_event, 'advertencias', coalesce(p_warnings, '[]'::jsonb), 'zona', v_zone));

  -- Después de captar se detiene la gestión comercial: se cancelan los
  -- contactos automáticos pendientes del mismo cierre.
  update public.followup_tasks
     set status = 'cancelada', status_reason = 'captado', resolved_at = now(), resolved_by = 'sistema', updated_at = now()
   where opportunity_id = p_opportunity and status in ('programada', 'pendiente', 'conflicto');
  update public.cita_tareas
     set status = 'cancelada', status_reason = 'captado', updated_at = now()
   where opportunity_id = p_opportunity and kind = 'reagendamiento' and status = 'programada';

  -- Avisos internos: uno por destinatario; sin destinatarios, uno pendiente y visible.
  select coalesce(capture_notice_recipients, '[]'::jsonb) into v_recipients from public.rubros where id = v_opp.rubro_id;
  if jsonb_typeof(v_recipients) <> 'array' or jsonb_array_length(v_recipients) = 0 then
    insert into public.capture_notices (capture_event_id, rubro_id, recipient_key, recipient_label, status)
    values (v_event, v_opp.rubro_id, 'sin_destinatario', null, 'sin_destinatario')
    on conflict (capture_event_id, recipient_key) do nothing;
  else
    for r in select * from jsonb_array_elements(v_recipients) loop
      if coalesce(r->>'clave', '') <> '' then
        insert into public.capture_notices (capture_event_id, rubro_id, recipient_key, recipient_label, status)
        values (v_event, v_opp.rubro_id, r->>'clave', r->>'nombre', 'pendiente')
        on conflict (capture_event_id, recipient_key) do nothing;
      end if;
    end loop;
  end if;

  return query select v_event, true;
end;
$$;

-- ---------------------------------------------------------------------
-- 6) Permisos: solo la clave de servicio (servidor, después del PIN)
-- ---------------------------------------------------------------------
alter table public.capture_events enable row level security;
alter table public.capture_notices enable row level security;
alter table public.cita_tareas enable row level security;
revoke all on public.capture_events, public.capture_notices, public.cita_tareas from anon, authenticated;
grant select, insert, update on public.capture_events, public.capture_notices, public.cita_tareas to service_role;
revoke all on function public.capture_register(uuid, text, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.capture_register(uuid, text, text, jsonb, text) to service_role;
