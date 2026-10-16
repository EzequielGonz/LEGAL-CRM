-- Etapa 2 · Reversión de 0201 y 0200 (solo si no hay información nueva).
--
-- No hace falta para volver a la versión anterior del panel: esa versión
-- funciona igual con estas migraciones aplicadas (comprobado con sus 39
-- pruebas de integración). Usalo solo si querés quitar la estructura nueva.
--
-- No borra información: si encuentra cualquier dato cargado con la Etapa 2
-- (excepciones del calendario, tareas de seguimiento, perfiles con el
-- seguimiento activado o con otra espera, oportunidades marcadas, plantillas
-- asignadas al contacto 3 o eventos de activación), se detiene sin cambiar nada.
-- Se ejecuta completo en el editor SQL de Supabase; es una sola transacción.

begin;

do $$
declare
  n bigint;
begin
  if to_regclass('public.followup_tasks') is not null then
    execute 'select count(*) from public.followup_tasks' into n;
    if n > 0 then
      raise exception 'Hay % tareas de seguimiento: no se revierte, se conservan.', n;
    end if;
  end if;
  if to_regclass('public.contact_calendar_exceptions') is not null then
    execute 'select count(*) from public.contact_calendar_exceptions' into n;
    if n > 0 then
      raise exception 'Hay % excepciones del calendario: no se revierte, se conservan.', n;
    end if;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'rubros' and column_name = 'followup_enabled_since') then
    execute 'select count(*) from public.rubros where followup_enabled_since is not null or followup_target_hours <> 60' into n;
    if n > 0 then
      raise exception 'Hay % perfiles con el seguimiento activado o con otra espera: no se revierte.', n;
    end if;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'opportunities' and column_name = 'followup_exhausted_at') then
    execute 'select count(*) from public.opportunities where followup_exhausted_at is not null or repesca_base_id is not null' into n;
    if n > 0 then
      raise exception 'Hay % oportunidades con datos del seguimiento: no se revierte.', n;
    end if;
  end if;
  select count(*) into n from public.template_assignments where purpose = 'seguimiento_3';
  if n > 0 then
    raise exception 'Hay % plantillas asignadas al contacto 3: no se revierte.', n;
  end if;
  select count(*) into n from public.access_events where kind = 'seguimiento_automatico';
  if n > 0 then
    raise exception 'Hay % eventos de activación del seguimiento: no se revierte, se conservan.', n;
  end if;
end $$;

-- 0201: funciones, tabla y columnas del seguimiento.
drop function if exists public.followup_candidates(integer, timestamptz, timestamptz, uuid);
drop function if exists public.followup_candidates(integer);
drop function if exists public.followup_release(uuid, uuid, text, text, timestamptz, integer);
drop function if exists public.followup_recover_stale(integer);
drop function if exists public.followup_finish(uuid, uuid, text, text, uuid, text, timestamptz);
drop function if exists public.followup_gate(uuid, uuid);
drop function if exists public.followup_claim(uuid, uuid);
drop table if exists public.followup_tasks;

alter table public.opportunities
  drop column if exists followup_exhausted_at,
  drop column if exists repesca_base_id;

alter table public.rubros drop constraint if exists rubros_followup_target_hours_range;
alter table public.rubros
  drop column if exists followup_target_hours,
  drop column if exists followup_enabled_since;

-- Las listas de valores vuelven a ser las de antes de 0201 (iguales a producción al 12/10).
alter table public.template_assignments drop constraint if exists template_assignments_purpose_check;
alter table public.template_assignments add constraint template_assignments_purpose_check
  check (purpose in ('campana', 'seguimiento', 'reagendamiento', 'inicio_cita', 'aviso_interno', 'formulario'));

alter table public.access_events drop constraint if exists access_events_kind_check;
alter table public.access_events add constraint access_events_kind_check check (kind in (
  'ingreso', 'ingreso_fallido', 'bloqueo_origen', 'intento_bloqueado', 'salida',
  'cambio_pin', 'cambio_pin_fallido', 'recuperacion_pin', 'pin_inicial',
  'cierre_todas_sesiones', 'pausa_general'));

-- 0200: calendario de excepciones.
drop table if exists public.contact_calendar_exceptions;

commit;
