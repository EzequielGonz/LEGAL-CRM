-- =====================================================================
-- Reversión de 0300 (Etapa 3: agentes, simulador, evaluación, corpus,
-- ajuste, brief y auditorías).
--
-- PRIMERO volver el código a la versión anterior (Instant Rollback en
-- Vercel): el código nuevo usa estas tablas y columnas.
--
-- Se DETIENE sin tocar nada si ya hay datos de esta etapa (nada se borra:
-- en ese caso se decide con la responsable qué conservar). Después de
-- revertir, 0300 se puede volver a aplicar sin errores.
-- =====================================================================

set lock_timeout = '5s';

do $$
declare v_motivo text;
begin
  select string_agg(m, '; ') into v_motivo from (
    select 'agentes creados en la Etapa 3: ' || count(*) m from public.agent_library where creado_desde is not null having count(*) > 0
    union all select 'asignaciones: ' || count(*) from public.agent_assignments having count(*) > 0
    union all select 'corridas del simulador: ' || count(*) from public.simulation_runs having count(*) > 0
    union all select 'resultados de evaluación: ' || count(*) from public.eval_results having count(*) > 0
    union all select 'casos del corpus: ' || count(*) from public.training_cases having count(*) > 0
    union all select 'trabajos de ajuste: ' || count(*) from public.tuning_jobs having count(*) > 0
    union all select 'comparaciones: ' || count(*) from public.model_comparisons having count(*) > 0
    union all select 'briefs de marca: ' || count(*) from public.brand_briefs having count(*) > 0
    union all select 'auditorías de landing: ' || count(*) from public.landing_audits having count(*) > 0
    union all select 'pedidos de mejora: ' || count(*) from public.agent_requests having count(*) > 0
    union all select 'eventos de acceso de la etapa: ' || count(*) from public.access_events where kind in ('asignacion_agente', 'ajuste_autorizado', 'ejecutor_tareas') having count(*) > 0
  ) x;
  if v_motivo is not null then
    raise exception 'No se revierte: ya hay datos de la Etapa 3 (%). Nada se borró.', v_motivo;
  end if;
end $$;

-- Tablas nuevas (sin datos, comprobado arriba). Orden por dependencias.
drop table if exists public.eval_results;
drop table if exists public.simulation_turns;
drop table if exists public.simulation_runs;
drop table if exists public.model_comparisons;
drop table if exists public.tuning_jobs;
drop table if exists public.training_cases;
drop table if exists public.training_sets;
drop table if exists public.eval_cases;
drop table if exists public.agent_requests;
drop table if exists public.agent_assignments;
drop table if exists public.agent_modules;
drop table if exists public.brand_briefs;
drop table if exists public.landing_audits;

-- Columnas y restricciones agregadas a la biblioteca.
alter table public.agent_library drop constraint if exists agent_library_modelo_proveedor_check;
alter table public.agent_library drop constraint if exists agent_library_publicacion_check;
alter table public.agent_library
  drop column if exists instrucciones,
  drop column if exists modelo_proveedor,
  drop column if exists modelo_identificador,
  drop column if exists publicacion,
  drop column if exists version_aprobada,
  drop column if exists ultima_evaluacion,
  drop column if exists creado_desde;
-- Claves: vuelve la lista cerrada de 0205 (solo si no quedó ninguna clave nueva; ya comprobado arriba).
alter table public.agent_library drop constraint if exists agent_library_clave_check;
alter table public.agent_library add constraint agent_library_clave_check
  check (clave in ('principal', 'juridico', 'coberturas_medicas', 'agencia_0km', 'marketing'));

-- Tipos de evento de acceso: lista de 0203.
alter table public.access_events drop constraint if exists access_events_kind_check;
alter table public.access_events add constraint access_events_kind_check check (kind in (
  'ingreso', 'ingreso_fallido', 'bloqueo_origen', 'intento_bloqueado', 'salida',
  'cambio_pin', 'cambio_pin_fallido', 'recuperacion_pin', 'pin_inicial',
  'cierre_todas_sesiones', 'pausa_general', 'seguimiento_automatico',
  'atencion_entrante_24h', 'biblioteca_agentes', 'politica_publicacion'));

-- Ejecutor de tareas: se quita la configuración (sin fila = apagado).
delete from public.system_settings where key = 'tareas_servidor';
