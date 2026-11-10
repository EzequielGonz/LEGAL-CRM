-- ---------------------------------------------------------------------
-- Wasender (10/11): origen de las plantillas propias. Al pasar todo a
-- Wasender, las plantillas aprobadas de Meta se copian como base (sin
-- tocar las de Meta). Se guarda de dónde vino cada una para no copiarla
-- dos veces y para saber cuál era su nombre en Meta.
-- Solo agrega columnas e índice. Repetible. Sin borrados.
-- ---------------------------------------------------------------------

set lock_timeout = '5s';

alter table public.wasender_plantillas
  add column if not exists origen text not null default 'panel';
alter table public.wasender_plantillas
  add column if not exists meta_nombre text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'wasender_plantillas_origen_valido') then
    alter table public.wasender_plantillas
      add constraint wasender_plantillas_origen_valido check (origen in ('panel', 'meta'));
  end if;
end $$;

-- Una plantilla de Meta se copia una sola vez por perfil.
create unique index if not exists wasender_plantillas_meta_unica
  on public.wasender_plantillas (rubro_id, meta_nombre) where meta_nombre is not null;
-- Dos plantillas activas del mismo perfil no comparten nombre.
create unique index if not exists wasender_plantillas_nombre_activo
  on public.wasender_plantillas (rubro_id, nombre) where archivada_at is null;
