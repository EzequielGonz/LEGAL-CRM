-- ---------------------------------------------------------------------
-- Reorganización 18/10: asistente del panel, redes y marca.
-- Solo agrega: una tabla nueva, un depósito público para logos y una fila
-- de ajustes. No cambia ni borra datos existentes. Repetible.
-- ---------------------------------------------------------------------

-- 1. Acciones propuestas por el asistente. El asistente nunca ejecuta solo:
--    deja la propuesta acá y se ejecuta cuando la responsable confirma.
create table if not exists public.asistente_acciones (
  id uuid primary key default gen_random_uuid(),
  rubro_id uuid not null references public.rubros(id),
  tipo text not null check (tipo in ('publicaciones', 'cambio_agente', 'pausar_campana')),
  titulo text not null,
  resumen text not null default '',
  payload jsonb not null default '{}'::jsonb,
  estado text not null default 'propuesta' check (estado in ('propuesta', 'ejecutando', 'ejecutada', 'descartada', 'error')),
  resultado jsonb,
  created_at timestamptz not null default now(),
  decidida_at timestamptz
);
create index if not exists asistente_acciones_rubro_idx on public.asistente_acciones (rubro_id, created_at desc);
alter table public.asistente_acciones enable row level security;
revoke all on public.asistente_acciones from anon, authenticated;

-- 2. Depósito público para los logos del panel (lápiz de la pantalla de
--    perfiles). Solo imágenes, hasta 2 MB. La escritura es del servidor.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('marca', 'marca', true, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

-- 3. Publicidad: configuración apagada (no gasta nada hasta habilitarla).
insert into public.system_settings (key, value, updated_by)
values ('publicidad', '{"habilitada": false, "perfiles": {}}'::jsonb, 'migracion_0500')
on conflict (key) do nothing;
