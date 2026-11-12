-- 12/11 · Ritmo de envío de Wasender: calentamiento de la línea.
-- Solo agrega. Repetible sin error. No toca nada de Meta.
-- Una línea nueva (o que se volvió a vincular después de caerse) envía poco y
-- sube de a escalones: el límite del día sale de esta fecha.

alter table public.wasender_lineas add column if not exists calentamiento_desde timestamptz;

update public.wasender_lineas set calentamiento_desde = coalesce(created_at, now()) where calentamiento_desde is null;

alter table public.wasender_lineas alter column calentamiento_desde set default now();
alter table public.wasender_lineas alter column calentamiento_desde set not null;

comment on column public.wasender_lineas.calentamiento_desde is
  'Desde cuándo se cuenta el calentamiento. Se reinicia cuando la línea se vuelve a vincular después de caerse.';
