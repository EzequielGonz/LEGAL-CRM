-- 0506 · Fotos y videos salientes (22/10): desde el chat y junto al presupuesto.
-- Depósito privado: se sube con enlace firmado y Meta descarga con enlace firmado temporal.
insert into storage.buckets (id, name, public, file_size_limit)
values ('chat-salientes', 'chat-salientes', false, 16777216)
on conflict (id) do nothing;

-- Fotos o videos extra del presupuesto: [{ path, nombre, mime }].
alter table public.marketing_budgets add column if not exists adjuntos jsonb not null default '[]'::jsonb;
