-- 24/10 · Ficha del negocio por rubro y rescate de turnos perdidos.
-- Repetible sin error. Solo agrega columnas; no borra ni cambia datos.

-- Ficha del negocio (la edita el equipo desde Bot IA; el bot la usa en cada respuesta).
alter table public.rubros add column if not exists business_sheet text;
alter table public.rubros add column if not exists business_sheet_updated_at timestamptz;

-- Último rescate de un turno perdido en la conversación (una vez por mensaje).
alter table public.conversations add column if not exists turn_rescue_at timestamptz;
