-- =====================================================================
-- Etapa 2 · Cierre de seguridad (se aplica AL FINAL, después de 0202–0206)
--
-- Barrido idempotente que deja el esquema public como lo pide la Etapa 1
-- (0199 y 0202), también para todo lo que agregaron 0203–0206:
--  1. RLS activo en toda tabla del esquema public.
--  2. Ningún permiso de tablas, secuencias ni funciones para la clave
--     pública (anon) ni para authenticated; tampoco el permiso general
--     PUBLIC de ejecución. La clave de servicio (servidor) conserva todo.
--  3. search_path fijo en toda función propia del esquema public.
--  4. Lo que se cree después tampoco recibe esos permisos.
--
-- No crea ni borra tablas, no toca filas y no cambia el comportamiento del
-- panel (el servidor usa la clave de servicio). Repetible sin error.
-- Comprobación: docs/etapa2/sql/verificar_seguridad.sql (debe dar 0 en todo).
-- =====================================================================

set lock_timeout = '5s';

do $$
declare r record;
begin
  -- 1) RLS en todas las tablas (las políticas existentes no se tocan).
  for r in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity
  loop
    execute format('alter table public.%I enable row level security', r.relname);
  end loop;

  -- 3) search_path fijo en funciones propias (no en las de extensiones).
  for r in
    select p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prokind in ('f', 'p')
       and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
       and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
  loop
    execute format('alter function public.%I(%s) set search_path = public, pg_temp', r.proname, r.args);
  end loop;

  -- 2) Ejecución de funciones: ni PUBLIC ni anon ni authenticated.
  for r in
    select p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind in ('f', 'p')
       and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
       and (has_function_privilege('anon', p.oid, 'EXECUTE') or has_function_privilege('authenticated', p.oid, 'EXECUTE'))
  loop
    execute format('revoke execute on function public.%I(%s) from public, anon, authenticated', r.proname, r.args);
    execute format('grant execute on function public.%I(%s) to service_role', r.proname, r.args);
  end loop;
end $$;

-- 2) Tablas y secuencias: sin permisos para la clave pública.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- 4) Lo que se cree después.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
