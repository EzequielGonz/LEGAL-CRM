-- =====================================================================
-- Etapa 1 · Bloque 1.12 — Funciones antiguas sin acceso para la clave pública
--
-- Qué corrige: dos funciones creadas antes de la Etapa 1 (`is_admin`, que
-- además corre con SECURITY DEFINER, y `normalize_phone_ar`) conservan el
-- permiso general de ejecución (PUBLIC), que `0199` no quita porque ese
-- permiso no está otorgado a `anon` ni a `authenticated` en particular. El
-- asesor de seguridad de Supabase las marca por eso. También fija el
-- `search_path` de `is_admin` y `set_updated_at`, como pide el asesor.
--
-- Cómo se aplica: se puede correr antes o después de 0199, 0200 y 0201, y
-- se puede repetir sin error. No crea ni modifica tablas, no toca datos y
-- no cambia el comportamiento del panel: el servidor usa la clave de
-- servicio, que conserva el permiso.
--
-- Qué hace:
--  1. A toda función del esquema public que todavía tenga permiso de
--     ejecución para PUBLIC, anon o authenticated, se lo quita y deja el
--     permiso a service_role (y al dueño, que lo conserva siempre).
--  2. Las funciones que se creen en el futuro no reciben el permiso PUBLIC.
--  3. search_path fijo en `is_admin` y `set_updated_at`.
-- Reversión: no hace falta; si alguna vez se necesitara volver a dar el
-- permiso, `grant execute on function public.<f>(...) to anon;` lo hace.
-- =====================================================================

set lock_timeout = '5s';

do $$
declare
  r record;
begin
  for r in
    select p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and (
         has_function_privilege('anon', p.oid, 'EXECUTE')
         or has_function_privilege('authenticated', p.oid, 'EXECUTE')
       )
  loop
    execute format('revoke execute on function public.%I(%s) from public, anon, authenticated', r.proname, r.args);
    execute format('grant execute on function public.%I(%s) to service_role', r.proname, r.args);
  end loop;
end $$;

-- Funciones futuras: sin permiso PUBLIC por defecto (lo mismo que ya hace
-- 0199 para anon y authenticated).
alter default privileges in schema public revoke execute on functions from public;

do $$
begin
  if to_regprocedure('public.is_admin()') is not null then
    execute 'alter function public.is_admin() set search_path = public, pg_temp';
  end if;
  if to_regprocedure('public.set_updated_at()') is not null then
    execute 'alter function public.set_updated_at() set search_path = public, pg_temp';
  end if;
end $$;
