-- 0505 · Marketing: envío programado de presupuestos (21/10).
-- La responsable elige día y hora (Buenos Aires) y el latido lo manda.
-- Repetible, sin borrados; la tabla ya tiene RLS y bloqueo de borrado (0311).
alter table public.marketing_budgets add column if not exists envio_programado_at timestamptz;
alter table public.marketing_budgets add column if not exists programado_procesado_at timestamptz;
alter table public.marketing_budgets add column if not exists programado_error text;

create index if not exists marketing_budgets_programados_idx
  on public.marketing_budgets (envio_programado_at)
  where estado = 'listo' and programado_procesado_at is null and envio_programado_at is not null;

comment on column public.marketing_budgets.envio_programado_at is 'Hora elegida para enviar el presupuesto (se carga en hora de Buenos Aires).';
comment on column public.marketing_budgets.programado_procesado_at is 'Cuándo el latido tomó el envío programado (se toma una sola vez).';
comment on column public.marketing_budgets.programado_error is 'Error del envío programado, si falló (no se reintenta solo).';
