-- ---------------------------------------------------------------------
-- Bandeja para Claude (19/10): tareas complejas que la responsable deja en
-- el panel para que Claude las tome desde Cowork cuando ella dice «ok».
-- Solo agrega una tabla nueva. No cambia ni borra datos existentes.
-- Repetible (create … if not exists / or replace, sin drop). Sin datos
-- personales de prospectos: el pedido y los enlaces son referencias
-- (nombre de una base, una campaña, una landing).
--
-- Estados:
--   pendiente  → la dejó la responsable; Claude todavía no la tomó.
--   en_curso   → Claude la está trabajando.
--   en_espera  → Claude no pudo terminar (se agotó el uso del plan, falta
--                una decisión o un acceso); el motivo queda en motivo_espera.
--   lista      → terminada; el resultado y los enlaces quedan guardados.
--   descartada → no se hace; queda con motivo (nada se borra).
-- ---------------------------------------------------------------------

create table if not exists public.bandeja_claude (
  id uuid primary key default gen_random_uuid(),
  rubro_id uuid not null references public.rubros(id),
  pedido text not null check (char_length(pedido) between 1 and 4000),
  enlaces jsonb not null default '[]'::jsonb check (jsonb_typeof(enlaces) = 'array'),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'en_curso', 'en_espera', 'lista', 'descartada')),
  motivo_espera text,
  resultado text,
  resultado_enlaces jsonb not null default '[]'::jsonb check (jsonb_typeof(resultado_enlaces) = 'array'),
  motivo_descarte text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  tomada_at timestamptz,
  cerrada_at timestamptz,
  -- Una tarea descartada siempre dice por qué.
  constraint bandeja_claude_descarte_con_motivo
    check (estado <> 'descartada' or coalesce(btrim(motivo_descarte), '') <> '')
);

create index if not exists bandeja_claude_estado_idx on public.bandeja_claude (estado, created_at);
create index if not exists bandeja_claude_rubro_idx on public.bandeja_claude (rubro_id, created_at desc);

alter table public.bandeja_claude enable row level security;
revoke all on public.bandeja_claude from anon, authenticated;

-- Nada se borra: ni siquiera la clave de servicio puede borrar filas.
create or replace function public.bandeja_claude_sin_borrados()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'bandeja_claude: las tareas no se borran; se descartan con motivo.';
end;
$$;

create or replace trigger bandeja_claude_sin_borrados
  before delete on public.bandeja_claude
  for each row execute function public.bandeja_claude_sin_borrados();

-- updated_at al día en cada cambio (el panel usa este dato para avisar si
-- una tarea «en curso» lleva demasiado sin avance).
create or replace function public.bandeja_claude_tocar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger bandeja_claude_tocar
  before update on public.bandeja_claude
  for each row execute function public.bandeja_claude_tocar();

revoke all on function public.bandeja_claude_sin_borrados() from public, anon, authenticated;
revoke all on function public.bandeja_claude_tocar() from public, anon, authenticated;
