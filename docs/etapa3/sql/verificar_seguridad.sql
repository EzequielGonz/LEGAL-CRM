-- Comprobación de seguridad (solo lectura). Correr en el editor SQL de
-- Supabase después de aplicar 0300. TODAS las cifras deben dar 0.
select 'tablas sin RLS' as control, count(*) as cantidad
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity
union all
select 'tablas con permisos para anon/authenticated', count(distinct table_name)
  from information_schema.role_table_grants
 where table_schema = 'public' and grantee in ('anon', 'authenticated')
union all
select 'políticas abiertas (true) para anon/authenticated/public', count(*)
  from pg_policies
 where schemaname = 'public'
   and (roles && array['anon', 'authenticated', 'public']::name[])
   and (coalesce(qual, 'true') = 'true' or coalesce(with_check, 'true') = 'true')
union all
select 'funciones ejecutables por anon/authenticated', count(*)
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.prokind in ('f', 'p')
   and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
   and (has_function_privilege('anon', p.oid, 'EXECUTE') or has_function_privilege('authenticated', p.oid, 'EXECUTE'))
union all
select 'funciones sin search_path fijo', count(*)
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.prokind in ('f', 'p')
   and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
   and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
union all
-- Estado operativo que tiene que seguir apagado después de aplicar todo.
select 'perfiles con seguimiento activado', count(*) from public.rubros where followup_enabled_since is not null
union all
select 'perfiles con atención entrante 24 h', count(*) from public.rubros where inbound_24h_enabled
union all
select 'políticas de publicación habilitadas', count(*) from public.content_policies where habilitada
union all
select 'agentes de la biblioteca no apagados', count(*) from public.agent_library where estado <> 'apagado'
union all
select 'pausa general levantada (debe seguir activa)', count(*)
  from public.system_settings
 where key = 'automation_pause'
   and ((value->>'ai_replies_paused') = 'false' or (value->>'outbound_automations_paused') = 'false')
union all
-- Etapa 3: nada activo ni autorizado sin decisión expresa.
select 'asignaciones de agentes activas', count(*) from public.agent_assignments where estado = 'activa'
union all
select 'versiones publicadas sin evaluación aprobada', count(*)
  from public.agent_library
 where publicacion = 'publicado'
   and (ultima_evaluacion is null or (ultima_evaluacion->>'fallos_criticos')::int > 0 or (ultima_evaluacion->>'comercial_min')::int < 14)
union all
select 'trabajos de ajuste en curso en el proveedor', count(*) from public.tuning_jobs where proveedor_job_id is not null
union all
select 'ejecutor de tareas encendido (citas o contenido)', count(*)
  from public.system_settings
 where key = 'tareas_servidor' and ((value->>'citas') = 'true' or (value->>'contenido') = 'true');
