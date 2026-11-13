-- 13/11 · Seguimiento automático y rotación de plantillas de inicio.
-- Repetible sin error. No borra nada. No cambia el camino de Meta.

-- 1) Seguimiento sin interruptor: un perfil nuevo nace con el seguimiento
--    encendido. Los que estaban apagados quedan encendidos desde el 12/11 a las
--    8:00 (hora de Argentina) para que entren quienes respondieron ese día.
--    Apagarlo sigue siendo posible desde Ajustes (queda en null).
alter table public.rubros alter column followup_enabled_since set default now();

-- 2) Plantillas de Wasender: grupo «inicio» = primer mensaje en frío que puede
--    rotar dentro de una misma campaña.
alter table public.wasender_plantillas add column if not exists grupo text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'wasender_plantillas_grupo_check') then
    alter table public.wasender_plantillas add constraint wasender_plantillas_grupo_check check (grupo is null or grupo in ('inicio'));
  end if;
end $$;
create index if not exists wasender_plantillas_grupo_idx on public.wasender_plantillas (rubro_id, grupo) where archivada_at is null and grupo is not null;

-- 3) Campañas por Wasender: rotar entre todas las plantillas de inicio activas
--    del perfil en vez de usar una sola. Apagado por defecto: las campañas que
--    existen siguen igual.
alter table public.campaigns add column if not exists wasender_rotar_inicio boolean not null default false;
