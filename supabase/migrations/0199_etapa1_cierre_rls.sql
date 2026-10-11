-- =====================================================================
-- Etapa 1 · Bloque 1.1 (cierre) — La clave pública deja de leer datos
--
-- APLICAR SOLO DESPUÉS de publicar la versión nueva del panel: desde esa
-- versión todas las lecturas y escrituras se hacen del lado del servidor
-- (clave de servicio, después de verificar el PIN). Si se aplica antes, la
-- versión anterior del panel deja de mostrar datos.
--
-- Qué hace:
--  * quita las políticas abiertas ("admins_full_access" en 21 tablas y las
--    2 de admin_profiles): con RLS activo y sin políticas, la clave
--    pública (anon/authenticated) no ve ni modifica nada;
--  * quita los permisos de tabla y de funciones a anon/authenticated,
--    también para las tablas que se creen en el futuro;
--  * saca contactos y mensajes de la publicación de tiempo real (el panel
--    ya no la usa: consulta al servidor cada pocos segundos).
-- La clave de servicio (servidor) no se ve afectada.
-- =====================================================================

set lock_timeout = '5s';

do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
      from pg_policies
     where schemaname = 'public'
       and (policyname = 'admins_full_access' or tablename = 'admin_profiles')
  loop
    execute format('drop policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- RLS activo en todas las tablas de public (las que no lo tengan, por las dudas).
do $$
declare
  r record;
begin
  for r in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
  loop
    execute format('alter table public.%I enable row level security', r.relname);
  end loop;
end $$;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from anon, authenticated;

do $$
begin
  if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'contacts') then
    execute 'alter publication supabase_realtime drop table public.contacts';
  end if;
  if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    execute 'alter publication supabase_realtime drop table public.messages';
  end if;
end $$;
