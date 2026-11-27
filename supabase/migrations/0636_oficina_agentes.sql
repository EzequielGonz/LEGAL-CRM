-- ---------------------------------------------------------------------
-- Oficina de agentes (22/11, pedido de los dueños). La Bandeja para Claude
-- pasa a ser la mesa de entrada de una oficina con escritorios por área
-- (Dirección, Análisis, Redes, Diseño, SEO, Bots, Ingeniería, Asistente).
--
-- Cómo funciona:
--   1. El dueño deja una tarea en la Oficina (pantalla /cerebro).
--   2. Gemini la ordena al instante: qué áreas la trabajan y en qué orden.
--   3. Cuando el dueño toca «Arrancar ahora», una sesión de Claude toma lo
--      pendiente, lo pasa por los agentes de cada área (queda anotado en
--      «recorrido»), lo revisa como director y lo deja «lista» y sin
--      decisión: eso es «esperando tu OK». Nada se publica sin ese OK.
--   4. El dueño aprueba, pide cambios (vuelve a la mesa de entrada) o la
--      descarta con motivo.
--
-- Solo agrega columnas y una tabla nueva. No cambia ni borra datos.
-- Repetible (if not exists). Sin datos personales de prospectos.
-- ---------------------------------------------------------------------

alter table public.bandeja_claude add column if not exists area text;
alter table public.bandeja_claude add column if not exists ruta jsonb not null default '[]'::jsonb;
alter table public.bandeja_claude add column if not exists recorrido jsonb not null default '[]'::jsonb;
alter table public.bandeja_claude add column if not exists titulo text;
alter table public.bandeja_claude add column if not exists triaje text;
alter table public.bandeja_claude add column if not exists origen text not null default 'bandeja';
alter table public.bandeja_claude add column if not exists decision text;
alter table public.bandeja_claude add column if not exists decision_nota text;
alter table public.bandeja_claude add column if not exists decision_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bandeja_claude_area_valida') then
    alter table public.bandeja_claude add constraint bandeja_claude_area_valida
      check (area is null or area in ('direccion', 'analisis', 'redes', 'diseno', 'seo', 'bots', 'ingenieria', 'asistente'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bandeja_claude_ruta_lista') then
    alter table public.bandeja_claude add constraint bandeja_claude_ruta_lista
      check (jsonb_typeof(ruta) = 'array' and jsonb_typeof(recorrido) = 'array');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bandeja_claude_origen_valido') then
    alter table public.bandeja_claude add constraint bandeja_claude_origen_valido
      check (origen in ('bandeja', 'cerebro', 'oficina', 'asistente', 'claude'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bandeja_claude_decision_valida') then
    alter table public.bandeja_claude add constraint bandeja_claude_decision_valida
      check (decision is null or decision in ('aprobada', 'cambios', 'rechazada'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bandeja_claude_titulo_corto') then
    alter table public.bandeja_claude add constraint bandeja_claude_titulo_corto
      check (titulo is null or char_length(titulo) <= 120);
  end if;
end;
$$;

create index if not exists bandeja_claude_area_idx on public.bandeja_claude (area, estado);

-- Cada vez que el dueño toca «Arrancar ahora». Sirve para no arrancar dos
-- veces seguidas (cada vuelta usa el plan de Claude) y para ver en la
-- Oficina cuándo trabajaron los agentes por última vez.
create table if not exists public.oficina_arranques (
  id uuid primary key default gen_random_uuid(),
  pedido_at timestamptz not null default now(),
  origen text not null default 'panel' check (origen in ('panel', 'chat')),
  estado text not null default 'pedido'
    check (estado in ('pedido', 'disparado', 'sin_disparador', 'fallo', 'tomado', 'terminado')),
  nota text check (nota is null or char_length(nota) <= 500),
  tareas integer,
  terminado_at timestamptz
);

create index if not exists oficina_arranques_fecha_idx on public.oficina_arranques (pedido_at desc);

alter table public.oficina_arranques enable row level security;
revoke all on public.oficina_arranques from anon, authenticated;

create or replace function public.oficina_arranques_sin_borrados()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'oficina_arranques: el historial de arranques no se borra.';
end;
$$;

create or replace trigger oficina_arranques_sin_borrados
  before delete on public.oficina_arranques
  for each row execute function public.oficina_arranques_sin_borrados();

revoke all on function public.oficina_arranques_sin_borrados() from public, anon, authenticated;
