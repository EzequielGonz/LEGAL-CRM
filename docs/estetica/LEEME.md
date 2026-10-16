# Sistema visual por perfil (16/10)

- Paletas: `src/app/globals.css` define `--c-slate-*` (base) y `--c-gold-*` (acento) por perfil con `data-tema="<slug>"`. Tailwind (`tailwind.config.ts`) lee esas variables, así que todas las clases `slate-*`/`gold-*` existentes cambian de color según el perfil.
- Colores de origen: los entregados por la responsable para cada marca (VITA, Compara tu Obra Social, Automotores Kocos, Kocos Marketing). Los tonos intermedios se interpolaron y se ajustaron para contraste AA: texto 500 sobre fondo 50 ≥ 4,5:1 y texto 400 sobre fondo 900 ≥ 4,5:1.
- Marca y logo: `src/lib/marca.ts`. Si `brand_briefs.logo_ref` tiene una URL https, el menú usa esa.
- Menú unificado: `src/lib/menu.ts` (grupos Trabajo diario, Captación, Agentes, Ajustes) y `src/components/menu-perfil.tsx`.
- Para cambiar una paleta: editar los anclajes en el generador (copia en el historial del bloque) y reemplazar el bloque de variables en `globals.css`.
