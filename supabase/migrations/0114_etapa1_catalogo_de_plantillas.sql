-- =====================================================================
-- Etapa 1 · Bloque 1.8 + pregunta 22 — Catálogo de plantillas de WhatsApp
--  * Las plantillas se reconocen leyendo la cuenta de WhatsApp Business de
--    cada línea por la integración autorizada de Meta, con su estado real,
--    idioma, categoría, variables y uso. Nada se da por aprobado sin esa
--    lectura: un nombre escrito a mano o un texto de ejemplo no cuenta.
--  * Se eligen por perfil, línea y propósito (template_assignments). En la
--    Etapa 1 solo se habilita el propósito "campana" (primer contacto de una
--    campaña); los demás quedan preparados y se habilitan en la etapa que
--    los usa.
--  * Una campaña apunta a una plantilla del catálogo (template_id). El
--    nombre que se escribió antes (message_template_name) se conserva como
--    historial y deja de alcanzar para lanzar.
--  * Nada se borra: una plantilla que deja de aparecer en Meta queda con
--    la fecha en que dejó de figurar; las asignaciones se desactivan.
--  * Pregunta 39: horario general de lunes a sábado de 8 a 21 (hora de
--    Argentina). Las campañas nuevas empiezan a las 8; el motor aplica ese
--    límite a todas, también a las que ya existían.
-- Solo agrega. No envía nada ni consulta a Meta.
-- =====================================================================

set lock_timeout = '5s';

create table if not exists public.whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  waba_id text not null,
  meta_template_id text,
  name text not null,
  language text not null,
  category text,
  sub_category text,
  -- Tal como lo informa Meta (APPROVED, PENDING, REJECTED, PAUSED, DISABLED, ...).
  status text not null,
  previous_status text,
  status_changed_at timestamptz,
  parameter_format text,
  quality_score text,
  rejected_reason text,
  components jsonb not null default '[]'::jsonb,
  body_text text,
  -- Resumen calculado de las variables (cuerpo, encabezado y botones).
  variables jsonb not null default '{}'::jsonb,
  -- ¿Se puede enviar desde una campaña tal como está construido el envío?
  campaign_compatible boolean not null default false,
  incompatibilities jsonb not null default '[]'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  missing_since timestamptz,
  last_sync_id bigint,
  last_send_error text,
  last_send_error_at timestamptz,
  unique (waba_id, name, language)
);
create index if not exists whatsapp_templates_waba_idx on public.whatsapp_templates (waba_id, status);

create table if not exists public.whatsapp_template_syncs (
  id bigint generated always as identity primary key,
  waba_id text not null,
  line_id uuid references public.profile_lines(id) on delete restrict,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'en_curso' check (status in ('en_curso', 'ok', 'error')),
  http_status int,
  error text,
  total int,
  nuevas int,
  cambiaron int,
  sin_cambios int,
  ya_no_figuran int,
  -- El número de la línea figura en esa cuenta (true), no figura (false) o no se pudo comprobar (null).
  line_verified boolean,
  line_check_note text,
  triggered_by text not null default 'panel'
);
create index if not exists whatsapp_template_syncs_line_idx on public.whatsapp_template_syncs (line_id, started_at desc);

create table if not exists public.template_assignments (
  id uuid primary key default gen_random_uuid(),
  rubro_id uuid not null references public.rubros(id) on delete restrict,
  line_id uuid not null references public.profile_lines(id) on delete restrict,
  purpose text not null check (purpose in ('campana', 'seguimiento', 'reagendamiento', 'inicio_cita', 'aviso_interno', 'formulario')),
  template_id uuid not null references public.whatsapp_templates(id) on delete restrict,
  -- Una fuente por variable del cuerpo, en el orden en que se envían.
  variable_sources jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deactivated_at timestamptz
);
create unique index if not exists template_assignments_one_active
  on public.template_assignments (line_id, purpose, template_id) where active;
create index if not exists template_assignments_rubro_idx on public.template_assignments (rubro_id, purpose) where active;

-- La línea de una asignación tiene que ser del mismo perfil.
create or replace function public.template_assignment_check()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_rubro uuid;
begin
  select rubro_id into v_rubro from public.profile_lines where id = new.line_id;
  if v_rubro is null or v_rubro <> new.rubro_id then
    raise exception 'La línea no pertenece al perfil de la asignación';
  end if;
  new.updated_at := now();
  return new;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'template_assignments_check') then
    create trigger template_assignments_check before insert or update on public.template_assignments
      for each row execute function public.template_assignment_check();
  end if;
end $$;

-- Campañas: plantilla del catálogo. El nombre escrito antes queda como historial.
alter table public.campaigns add column if not exists template_id uuid references public.whatsapp_templates(id) on delete restrict;
alter table public.campaigns alter column message_template_name drop not null;
alter table public.campaigns alter column send_window_start_hour set default 8;
create index if not exists campaigns_template_idx on public.campaigns (template_id) where template_id is not null;

-- Solo el servidor (clave de servicio) lee y escribe estas tablas.
alter table public.whatsapp_templates enable row level security;
alter table public.whatsapp_template_syncs enable row level security;
alter table public.template_assignments enable row level security;
revoke all on public.whatsapp_templates from anon, authenticated;
revoke all on public.whatsapp_template_syncs from anon, authenticated;
revoke all on public.template_assignments from anon, authenticated;
grant select, insert, update on public.whatsapp_templates to service_role;
grant select, insert, update on public.whatsapp_template_syncs to service_role;
grant select, insert, update on public.template_assignments to service_role;
grant usage, select on sequence public.whatsapp_template_syncs_id_seq to service_role;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'whatsapp_templates_no_delete') then
    create trigger whatsapp_templates_no_delete before delete on public.whatsapp_templates
      for each row execute function public.prevent_row_changes('Las plantillas del catálogo no se borran: quedan con la fecha en que dejaron de figurar en Meta');
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'whatsapp_template_syncs_no_delete') then
    create trigger whatsapp_template_syncs_no_delete before delete on public.whatsapp_template_syncs
      for each row execute function public.prevent_row_changes('El historial de lecturas del catálogo no se borra');
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'template_assignments_no_delete') then
    create trigger template_assignments_no_delete before delete on public.template_assignments
      for each row execute function public.prevent_row_changes('Las asignaciones de plantillas no se borran: se desactivan');
  end if;
end $$;

-- Uso histórico por nombre: envíos registrados con cada nombre de plantilla
-- (los mensajes guardan el nombre en metadata.template).
create or replace function public.template_name_usage(p_names text[])
returns table (name text, mensajes bigint, ultimo timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select m.metadata->>'template' as name, count(*) as mensajes, max(m.created_at) as ultimo
  from public.messages m
  where m.direction = 'saliente'
    and m.metadata ? 'template'
    and m.metadata->>'template' = any (p_names)
  group by 1
$$;
revoke all on function public.template_name_usage(text[]) from public, anon, authenticated;
grant execute on function public.template_name_usage(text[]) to service_role;
