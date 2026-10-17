-- Rediseño 17/10 · bloque 2: fuente única de marca.
-- `brand_briefs.logo_panel`: logo que muestra el panel (menú, selector de
-- perfiles, Teléfono). Vacío = el logo original entregado por la responsable
-- (/public/logos/<perfil>.svg). `logo_ref` sigue siendo el logo de las piezas
-- de Contenido (el de cada landing). Solo agrega una columna opcional: no
-- cambia ni borra datos y la versión publicada la ignora. Repetible.
alter table public.brand_briefs add column if not exists logo_panel text;
alter table public.brand_briefs drop constraint if exists brand_briefs_logo_panel_formato;
alter table public.brand_briefs add constraint brand_briefs_logo_panel_formato
  check (logo_panel is null or logo_panel ~ '^/logos/[a-z0-9_-]+\.(svg|png|webp)$' or (logo_panel ~ '^https://' and length(logo_panel) <= 500));
comment on column public.brand_briefs.logo_panel is 'Logo del panel (menú, selector, Teléfono). Null = logo original de /public/logos.';
