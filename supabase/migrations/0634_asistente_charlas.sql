-- ---------------------------------------------------------------------
-- 0634 · Charlas guardadas del asistente (20/11, pedido de la Bandeja para
-- Claude): las conversaciones del asistente general (/asistente) y del
-- asistente del Laboratorio del bot quedan guardadas para retomarlas.
--
-- Solo agrega dos tablas nuevas. No cambia ni borra datos existentes ni
-- toca otras tablas. Repetible (create … if not exists / or replace, sin
-- drop). RLS activo y sin permisos para la clave pública: se leen y se
-- escriben solo desde el servidor con la clave de servicio.
--
-- Qué se guarda: el texto de cada mensaje, las propuestas tal como se
-- mostraron (su estado se vuelve a leer de asistente_acciones al abrir la
-- charla) y los botones a pantallas. No se guardan imágenes, PDF ni filas de
-- planillas (de las planillas el asistente solo ve un resumen enmascarado).
--
-- Nada se borra: una charla se archiva (archivada_at) y deja de listarse.
--
-- Para volver atrás sin borrar datos: no hace falta tocar la base; el panel
-- anterior simplemente no usa estas tablas.
-- ---------------------------------------------------------------------
set lock_timeout = '5s';

create table if not exists public.asistente_charlas (
  id uuid primary key default gen_random_uuid(),
  -- general: pantalla /asistente · laboratorio: asistente del Laboratorio del bot
  ambito text not null check (ambito in ('general', 'laboratorio')),
  -- Perfil del Laboratorio (slug). Vacío en las charlas generales.
  perfil text check (perfil is null or perfil ~ '^[a-z0-9_]{1,40}$'),
  titulo text not null check (char_length(btrim(titulo)) between 1 and 120),
  archivada_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint asistente_charlas_perfil_segun_ambito
    check ((ambito = 'laboratorio') = (perfil is not null))
);

create table if not exists public.asistente_charla_mensajes (
  id bigint generated always as identity primary key,
  charla_id uuid not null references public.asistente_charlas(id),
  rol text not null check (rol in ('usuario', 'asistente')),
  texto text not null check (char_length(texto) between 1 and 8000),
  propuestas jsonb not null default '[]'::jsonb check (jsonb_typeof(propuestas) = 'array' and pg_column_size(propuestas) <= 262144),
  enlaces jsonb not null default '[]'::jsonb check (jsonb_typeof(enlaces) = 'array' and pg_column_size(enlaces) <= 16384),
  created_at timestamptz not null default now()
);

create index if not exists asistente_charlas_lista_idx
  on public.asistente_charlas (ambito, perfil, updated_at desc)
  where archivada_at is null;
create index if not exists asistente_charla_mensajes_charla_idx
  on public.asistente_charla_mensajes (charla_id, id);

alter table public.asistente_charlas enable row level security;
alter table public.asistente_charla_mensajes enable row level security;
revoke all on public.asistente_charlas from anon, authenticated;
revoke all on public.asistente_charla_mensajes from anon, authenticated;

-- Nada se borra: ni siquiera la clave de servicio puede borrar filas.
create or replace function public.asistente_charlas_sin_borrados()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'asistente_charlas: las charlas no se borran; se archivan.';
end;
$$;

create or replace trigger asistente_charlas_sin_borrados
  before delete on public.asistente_charlas
  for each row execute function public.asistente_charlas_sin_borrados();

create or replace trigger asistente_charla_mensajes_sin_borrados
  before delete on public.asistente_charla_mensajes
  for each row execute function public.asistente_charlas_sin_borrados();

-- Agregar mensajes a una charla en un solo paso: inserta los mensajes y
-- pone al día updated_at (así la charla sube al principio de la lista).
-- Comprueba que la charla sea de la misma lista (general o Laboratorio del
-- mismo perfil). Devuelve false si no existe, está archivada o es de otra
-- lista (no inserta nada). Tope de 500 mensajes por charla.
create or replace function public.asistente_charla_agregar(p_charla uuid, p_ambito text, p_perfil text, p_mensajes jsonb)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_mensajes is null or jsonb_typeof(p_mensajes) is distinct from 'array' then
    raise exception 'asistente_charla_agregar: mensajes no válidos';
  end if;
  if jsonb_array_length(p_mensajes) not between 1 and 20 then
    raise exception 'asistente_charla_agregar: mensajes no válidos';
  end if;
  update public.asistente_charlas set updated_at = now()
    where id = p_charla and archivada_at is null and ambito = p_ambito and perfil is not distinct from p_perfil;
  if not found then
    return false;
  end if;
  if (select count(*) from public.asistente_charla_mensajes where charla_id = p_charla) + jsonb_array_length(p_mensajes) > 500 then
    raise exception 'asistente_charla_agregar: la charla llegó al máximo de mensajes';
  end if;
  insert into public.asistente_charla_mensajes (charla_id, rol, texto, propuestas, enlaces)
  select p_charla, m->>'rol', m->>'texto', coalesce(m->'propuestas', '[]'::jsonb), coalesce(m->'enlaces', '[]'::jsonb)
  from jsonb_array_elements(p_mensajes) with ordinality as t(m, n)
  order by n;
  return true;
end;
$$;

-- Crear una charla con sus primeros mensajes en una sola transacción
-- (si falla algo, no queda una charla vacía en la lista).
create or replace function public.asistente_charla_crear(p_ambito text, p_perfil text, p_titulo text, p_mensajes jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.asistente_charlas (ambito, perfil, titulo)
    values (p_ambito, p_perfil, p_titulo)
    returning id into v_id;
  if not public.asistente_charla_agregar(v_id, p_ambito, p_perfil, p_mensajes) then
    raise exception 'asistente_charla_crear: no se pudieron guardar los mensajes';
  end if;
  return v_id;
end;
$$;

-- Datos personales: si hiciera falta suprimir el contenido de una charla
-- (pedido de supresión), se reemplaza sin borrar filas:
--   update public.asistente_charla_mensajes set texto = '[suprimido]', propuestas = '[]', enlaces = '[]' where charla_id = '<id>';

revoke all on function public.asistente_charlas_sin_borrados() from public, anon, authenticated;
revoke all on function public.asistente_charla_agregar(uuid, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.asistente_charla_crear(text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.asistente_charla_agregar(uuid, text, text, jsonb) to service_role;
grant execute on function public.asistente_charla_crear(text, text, text, jsonb) to service_role;
