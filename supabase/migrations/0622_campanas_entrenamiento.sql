-- 0622 · Modo entrenamiento de campañas y resultado del día 7 (15/11, decisión de la responsable).
-- entrenamiento_desde: cuándo se eligió el ritmo de entrenamiento (20 por día, 7 días).
--   Nulo = sin entrenamiento (ritmo elegido a mano). Un límite mayor lo apaga.
-- resultado_semana: lo que cargó la responsable al día 7 (avanzó / no avanzó / vendido).
-- Solo agrega columnas: no cambia ni borra datos. Repetible sin error.
-- Para volver atrás: drop de las cuatro columnas (la app deja de mostrarlas).

alter table public.campaigns add column if not exists entrenamiento_desde timestamptz;
alter table public.campaigns add column if not exists resultado_semana text;
alter table public.campaigns add column if not exists resultado_semana_at timestamptz;
alter table public.campaigns add column if not exists resultado_semana_nota text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'campaigns_resultado_semana_check') then
    alter table public.campaigns add constraint campaigns_resultado_semana_check
      check (resultado_semana is null or resultado_semana in ('avanzo', 'no_avanzo', 'vendido'));
  end if;
end $$;
