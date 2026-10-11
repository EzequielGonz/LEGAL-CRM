-- =====================================================================
-- Pruebas de integración · 0/3 — Lo mínimo que Supabase trae de fábrica
-- Roles de la API, esquema auth, extensiones y permisos por defecto sobre
-- el esquema public (los mismos que concede Supabase: después las
-- migraciones revocan lo que corresponde, igual que en producción).
-- Solo para la base de pruebas: nunca se corre en producción.
-- =====================================================================
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then
    create role authenticator login noinherit password 'pruebas';
  end if;
end $$;
grant anon, authenticated, service_role to authenticator;

set timezone = 'UTC';
create extension if not exists pgcrypto;

create schema if not exists auth;
create table if not exists auth.users (id uuid primary key);
create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;

-- Esquema del respaldo interno que la migración 0100 da por existente
-- (en producción se creó con el respaldo del 9/10/2026).
create schema if not exists respaldo_etapa1;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
