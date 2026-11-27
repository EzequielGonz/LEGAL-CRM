-- 0650 · Conocimiento que se le enseña al cerebro desde el panel (22/11).
-- Aditiva y repetible: no toca nada existente. Solo la clave de servicio la lee y escribe
-- (RLS activo y sin permisos para la clave pública). Nada se borra: se archiva con `archivada_at`.
-- Sin datos de personas: la validación del panel los rechaza antes de guardar.

create table if not exists public.cerebro_conocimiento (
  id uuid primary key default gen_random_uuid(),
  rubro_id uuid,
  tipo text not null default 'nota' check (tipo in ('nota', 'regla', 'documento', 'enlace', 'aprendizaje')),
  titulo text not null check (char_length(titulo) between 3 and 120),
  contenido text not null check (char_length(contenido) between 5 and 4000),
  fuente text check (fuente is null or char_length(fuente) <= 500),
  creado_por text not null default 'operador',
  created_at timestamptz not null default now(),
  archivada_at timestamptz
);

create index if not exists cerebro_conocimiento_vigente_idx on public.cerebro_conocimiento (created_at desc) where archivada_at is null;
create index if not exists cerebro_conocimiento_rubro_idx on public.cerebro_conocimiento (rubro_id) where archivada_at is null;

alter table public.cerebro_conocimiento enable row level security;
revoke all on public.cerebro_conocimiento from anon, authenticated;
grant all on public.cerebro_conocimiento to service_role;
