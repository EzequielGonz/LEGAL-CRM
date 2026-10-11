-- =====================================================================
-- Etapa 1 · Bloque 1.1 — Acceso con PIN y seguridad de entrada
-- Aditiva: no cambia nada de lo que usa el código anterior, así que puede
-- aplicarse antes de publicar la versión nueva del panel.
-- =====================================================================

set lock_timeout = '5s';

-- ---------------------------------------------------------------------
-- PIN general compartido (6 dígitos). Se guarda solo su hash (scrypt).
-- Fila única. session_version permite "cerrar sesión en todos los
-- dispositivos" sin vencer sesiones por tiempo.
-- ---------------------------------------------------------------------
create table if not exists public.access_pin (
  id boolean primary key default true check (id),
  pin_hash text not null,
  source text not null check (source in ('inicial', 'panel', 'recuperacion')),
  reset_fingerprint text,
  session_version integer not null default 1 check (session_version >= 1),
  updated_at timestamptz not null default now()
);

-- Intentos fallidos por origen (IP con hash, nunca la IP en claro).
create table if not exists public.access_origin_limits (
  origin_hash text primary key,
  failures integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

-- Registro de accesos (solo agregar).
create table if not exists public.access_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  kind text not null check (kind in (
    'ingreso', 'ingreso_fallido', 'bloqueo_origen', 'intento_bloqueado', 'salida',
    'cambio_pin', 'cambio_pin_fallido', 'recuperacion_pin', 'pin_inicial',
    'cierre_todas_sesiones', 'pausa_general')),
  origin_hash text,
  device text,
  detail jsonb not null default '{}'::jsonb
);
create index if not exists access_events_at_idx on public.access_events (at desc);

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'access_events_append_only') then
    create trigger access_events_append_only
      before update or delete on public.access_events
      for each row execute function public.prevent_row_changes('El registro de accesos solo admite agregar filas');
  end if;
end $$;

-- 5 fallos seguidos desde un mismo origen => pausa de 15 minutos solo para
-- ese origen. Los fallos viejos (más de 15 minutos sin intentos) no suman.
-- Devuelve hasta cuándo queda pausado el origen (null si no quedó pausado).
create or replace function public.access_register_failure(p_origin text)
returns timestamptz
language plpgsql
set search_path to ''
as $function$
declare
  v_failures integer;
  v_locked timestamptz;
  v_updated timestamptz;
begin
  insert into public.access_origin_limits (origin_hash, failures, updated_at)
  values (p_origin, 0, now())
  on conflict (origin_hash) do nothing;

  select failures, locked_until, updated_at
    into v_failures, v_locked, v_updated
    from public.access_origin_limits
   where origin_hash = p_origin
   for update;

  if v_locked is not null and v_locked > now() then
    return v_locked;
  end if;

  if v_updated < now() - interval '15 minutes' then
    v_failures := 0;
  end if;

  v_failures := v_failures + 1;

  if v_failures >= 5 then
    update public.access_origin_limits
       set failures = 0, locked_until = now() + interval '15 minutes', updated_at = now()
     where origin_hash = p_origin;
    return now() + interval '15 minutes';
  end if;

  update public.access_origin_limits
     set failures = v_failures, locked_until = null, updated_at = now()
   where origin_hash = p_origin;
  return null;
end $function$;

revoke all on function public.access_register_failure(text) from public, anon, authenticated;
grant execute on function public.access_register_failure(text) to service_role;

-- ---------------------------------------------------------------------
-- Webhooks: lo que no se puede procesar con seguridad se conserva acá
-- (firma inválida o ausente, línea sin asignar, error interno) en lugar de
-- perderse. Nada de esto se procesa solo: se revisa desde el panel.
-- ---------------------------------------------------------------------
create table if not exists public.webhook_quarantine (
  id bigint generated always as identity primary key,
  received_at timestamptz not null default now(),
  source text not null check (source in ('whatsapp', 'meta')),
  reason text not null check (reason in (
    'firma_invalida', 'firma_ausente', 'linea_no_asignada', 'error_procesamiento')),
  account_id text,
  payload jsonb not null,
  detail text,
  reviewed_at timestamptz,
  reviewed_action text check (reviewed_action in ('reprocesado', 'descartado')),
  note text
);
create index if not exists webhook_quarantine_pending_idx
  on public.webhook_quarantine (received_at desc) where reviewed_at is null;

-- ---------------------------------------------------------------------
-- Mensajes: deduplicación por id del proveedor y conservación de todos
-- los tipos (audio, imagen, documento, ubicación, etc.).
-- ---------------------------------------------------------------------
alter table public.messages add column if not exists message_type text not null default 'text';
alter table public.messages add column if not exists duplicate_of uuid references public.messages(id);

-- Único duplicado histórico (reentrega de Meta del 21/9/2026, 23 segundos
-- después, mismo texto): se conserva y se marca, no se borra.
update public.messages
   set duplicate_of = 'f86152e0-c909-4c92-954d-a15e13987664'
 where id = '7dfe9d30-5c3d-42b2-a158-c040bc4b62b5'
   and duplicate_of is null;

create unique index if not exists messages_external_message_id_unico
  on public.messages (external_message_id)
  where external_message_id is not null and duplicate_of is null;

-- ---------------------------------------------------------------------
-- Permisos: nada de esto es accesible con la clave pública.
-- ---------------------------------------------------------------------
alter table public.access_pin enable row level security;
alter table public.access_origin_limits enable row level security;
alter table public.access_events enable row level security;
alter table public.webhook_quarantine enable row level security;
revoke all on public.access_pin, public.access_origin_limits, public.access_events,
              public.webhook_quarantine from anon, authenticated;

-- ---------------------------------------------------------------------
-- Pausa general: el panel puede prender/apagar la tarea programada de
-- campañas (pg_cron "campaigns-tick") sin exponer el comando ni su clave.
-- Solo la usa el servidor (clave de servicio), y únicamente desde la
-- acción con PIN de Configuración → Pausa general.
-- ---------------------------------------------------------------------
create or replace function public.set_campaign_tick_active(p_active boolean)
returns boolean
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_job bigint;
begin
  select jobid into v_job from cron.job where jobname = 'campaigns-tick';
  if v_job is null then
    return false;
  end if;
  perform cron.alter_job(job_id := v_job, active := p_active);
  return true;
end $function$;

revoke all on function public.set_campaign_tick_active(boolean) from public, anon, authenticated;
grant execute on function public.set_campaign_tick_active(boolean) to service_role;
