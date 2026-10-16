-- =====================================================================
-- Reversión de 0310 (comparación de agentes A/B/C).
-- PRIMERO volver el código a la versión anterior (Instant Rollback en Vercel).
-- Se DETIENE sin tocar nada si el experimento ya tiene datos reales
-- (asignaciones, turnos, informes, votos o incidentes): nada se borra.
-- =====================================================================
set lock_timeout = '5s';
do $$
declare v text;
begin
  select string_agg(m, '; ') into v from (
    select 'asignaciones: ' || count(*) m from public.agent_experiment_assignments having count(*) > 0
    union all select 'turnos registrados: ' || count(*) from public.agent_turn_logs having count(*) > 0
    union all select 'informes: ' || count(*) from public.agent_experiment_reports having count(*) > 0
    union all select 'votos: ' || count(*) from public.agent_experiment_votes having count(*) > 0
    union all select 'incidentes: ' || count(*) from public.agent_incidents having count(*) > 0
    union all select 'evaluaciones de plantillas: ' || count(*) from public.template_evaluations having count(*) > 0
  ) x;
  if v is not null then
    raise exception 'No se revierte 0310: ya hay datos (%). Decidir con la responsable qué conservar.', v;
  end if;
end $$;
do $$
declare t text;
begin
  foreach t in array array['template_evaluations', 'agent_incidents', 'agent_experiment_votes', 'agent_experiment_reports',
                           'agent_turn_logs', 'agent_experiment_assignments', 'agent_experiment_candidates', 'agent_experiments'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_no_delete', t);
    execute format('drop table if exists public.%I', t);
  end loop;
end $$;
