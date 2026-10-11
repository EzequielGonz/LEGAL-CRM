-- =====================================================================
-- Etapa 1 · Bloque 1.0 — Preparación, respaldo y pausa operativa
-- Aplicada en producción el 9/10/2026 (UTC 22:08–22:20) por sentencias
-- individuales. Este archivo documenta exactamente lo ejecutado para que
-- pueda reproducirse en una copia. Es idempotente salvo el respaldo, que
-- conserva la foto del 9/10/2026 y no debe volver a tomarse encima.
-- =====================================================================

set lock_timeout = '5s';

-- ---------------------------------------------------------------------
-- 1) Respaldo dentro de la base: esquema privado con copia de las 22
--    tablas de public + metadatos de Storage y del cron.
--    (Se ejecutó UNA vez; en producción ya existe.)
-- ---------------------------------------------------------------------
-- create schema respaldo_etapa1;
-- create table respaldo_etapa1.<tabla> as table public.<tabla>;   -- x22
-- create table respaldo_etapa1._storage_objects as
--   select id, bucket_id, name, owner, created_at, updated_at, metadata
--   from storage.objects;
-- create table respaldo_etapa1._cron_jobs as
--   select jobname, schedule, active from cron.job;                -- sin el comando (contiene el secreto)
-- create table respaldo_etapa1._meta as
--   select now() as tomado_en, 'Respaldo previo a la Etapa 1, autorizado por Vita el 9/10/2026'::text as nota;
-- alter table respaldo_etapa1.<cada tabla> enable row level security;
-- revoke all on schema respaldo_etapa1 from public, anon, authenticated;
-- revoke all on all tables in schema respaldo_etapa1 from public, anon, authenticated;

create or replace function respaldo_etapa1.huella(esquema text, tabla text)
returns table(filas bigint, huella text)
language plpgsql
set search_path to ''
as $function$
begin
  return query execute format(
    'select count(*)::bigint, md5(coalesce(string_agg(t::text, %L order by t::text), %L)) from %I.%I t',
    E'\n', '', esquema, tabla);
end $function$;
revoke all on function respaldo_etapa1.huella(text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 2) Registros de solo lectura / solo agregar
-- ---------------------------------------------------------------------
create or replace function public.prevent_row_changes()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  raise exception '%', coalesce(tg_argv[0], 'Registro de solo lectura');
end $function$;

create table if not exists public.ops_change_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text not null,
  action text not null,
  target text not null,
  before jsonb,
  after jsonb,
  note text
);
alter table public.ops_change_log enable row level security;
revoke all on public.ops_change_log from anon, authenticated;
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'ops_change_log_append_only') then
    create trigger ops_change_log_append_only
      before update or delete on public.ops_change_log
      for each row execute function public.prevent_row_changes('El registro operativo solo admite agregar filas');
  end if;
end $$;

create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text not null default 'sistema'
);
alter table public.system_settings enable row level security;
revoke all on public.system_settings from anon, authenticated;

-- ---------------------------------------------------------------------
-- 3) Prompts vigentes conservados como historial (no aprobables, no publicables)
-- ---------------------------------------------------------------------
create table if not exists public.ai_agent_prompt_history (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.ai_agents(id) on delete restrict,
  area area_type not null,
  display_name text not null,
  system_prompt text not null,
  qualification_criteria jsonb not null,
  required_fields jsonb not null,
  active_at_capture boolean not null,
  agent_updated_at timestamptz,
  captured_at timestamptz not null default now(),
  kind text not null default 'historial' check (kind = 'historial'),
  publishable boolean not null default false check (publishable = false),
  prompt_sha256 text not null,
  note text
);
alter table public.ai_agent_prompt_history enable row level security;
revoke all on public.ai_agent_prompt_history from anon, authenticated;
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'ai_agent_prompt_history_read_only') then
    create trigger ai_agent_prompt_history_read_only
      before update or delete on public.ai_agent_prompt_history
      for each row execute function public.prevent_row_changes('El historial de prompts es de solo lectura y no se puede publicar');
  end if;
end $$;

-- Captura (se ejecutó una vez; 5 filas: civil, penal, agencia_0km, coberturas_medicas, marketing)
-- insert into public.ai_agent_prompt_history
--   (agent_id, area, display_name, system_prompt, qualification_criteria, required_fields,
--    active_at_capture, agent_updated_at, prompt_sha256, note)
-- select id, area, display_name, system_prompt, qualification_criteria, required_fields,
--        active, updated_at, encode(sha256(convert_to(system_prompt, 'UTF8')), 'hex'),
--        'Captura previa a la Etapa 1. Solo consulta: no es una versión aprobada ni se puede reactivar.'
-- from public.ai_agents;

-- ---------------------------------------------------------------------
-- 4) Pausa operativa (pregunta 38). Cada cambio quedó en ops_change_log.
-- ---------------------------------------------------------------------
insert into public.system_settings (key, value, updated_by)
values ('automation_pause', jsonb_build_object(
  'ai_replies_paused', true,
  'outbound_automations_paused', true,
  'since', now(),
  'reason', 'Etapa 1: implementación. Pregunta 38 respondida por Vita el 9/10/2026.',
  'reactivation', 'Solo por decisión expresa; no se reactiva al terminar la etapa.'), 'etapa1')
on conflict (key) do nothing;

-- Agentes IA: respuestas automáticas pausadas (no toca ai_enabled de cada conversación).
update public.ai_agents set active = false
 where active = true
   and area in ('civil','penal','agencia_0km','coberturas_medicas','marketing');

-- Cron de campañas (pg_cron, jobid 1 "campaigns-tick"): desactivado, sin borrar.
-- select cron.alter_job(job_id := 1, active := false);

-- La campaña "BASE 21 9" ya estaba en estado 'pausada' (725 destinatarios en
-- cola, 200 enviados). No se modificó: se registró su estado en ops_change_log.
