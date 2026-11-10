-- 0603 · Paso de líneas de Meta a Wasender (10/11, bloque 2).
-- Una línea de Wasender puede reemplazar a una línea de Meta: los chats de esa
-- línea de Meta pasan a salir por Wasender. Y una línea por perfil puede llevar
-- los avisos internos al equipo. Solo agrega columnas: la línea de Meta no se
-- modifica ni se borra. Se puede repetir sin error.

alter table public.wasender_lineas
  add column if not exists reemplaza_linea_meta_id uuid references public.profile_lines(id),
  add column if not exists reemplaza_desde timestamptz,
  add column if not exists para_avisos boolean not null default false;

-- Una línea de Meta la reemplaza como mucho una línea de Wasender activa.
create unique index if not exists wasender_lineas_reemplaza_unica
  on public.wasender_lineas (reemplaza_linea_meta_id)
  where reemplaza_linea_meta_id is not null and archivada_at is null;

-- Una sola línea de avisos por perfil.
create unique index if not exists wasender_lineas_avisos_unica
  on public.wasender_lineas (rubro_id)
  where para_avisos and archivada_at is null;
