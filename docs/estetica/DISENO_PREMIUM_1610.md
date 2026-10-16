# Diseño premium del panel · 16/10 (noche)

Pedido de la responsable: subir un nivel el diseño desde el ingreso hasta el CRM completo, sin rediseñar; detalles premium, animaciones suaves y una lámpara de inicio mucho más trabajada. Las otras líneas (landings, Meta, Fase 3) siguen en espera.

## Qué cambia (solo presentación)

| Pieza | Archivo | Cambio |
|---|---|---|
| Lámpara de ingreso | `src/components/acceso/lampara-ingreso.tsx` | Escena en SVG: pie de latón, pantalla con degradé, foco, cono de luz volumétrico, charco de luz, polvo flotando, grano y viñeta. El cordón se tira con puntero o dedo, vuelve con resorte y rebote y prende/apaga la luz con parpadeo. Teclado: Enter o Espacio (rol `switch`). En teléfono la lámpara se ve, más chica. |
| Tarjeta del PIN | `src/components/acceso/pin-login-form.tsx` | Borde dorado, indicador de 6 segmentos, sacudida al error (`role="alert"`), spinner al ingresar. El ingreso no cambia. |
| Inicio y Perfiles | `src/app/inicio/page.tsx`, `src/app/perfiles/page.tsx`, `src/components/ui/tarjeta-luz.tsx`, `src/components/perfiles/perfil-selector.tsx` | Fondo con grano, tarjetas con foco de luz que sigue al puntero, íconos SVG en vez de emojis, entrada escalonada, perfil activo con anillo. |
| Menú lateral | `src/components/menu-perfil.tsx` | Ítem activo con pastilla, títulos con línea, menú del teléfono con deslizamiento y velo. |
| Tarjetas, insignias, salud | `src/components/ui/stat-card.tsx`, `badge.tsx`, `salud/barra-salud.tsx` | Cifras tabulares, flecha que se desliza, punto vivo en «Sistema en orden», estados con punto. |
| Capa global | `src/app/premium.css` (importado en `src/app/layout.tsx`) | Lienzo con resplandor, entrada suave de cada página, superficies con sombra fina, filas de tabla con respuesta, brillo en el botón principal. |

## Reglas que se respetaron
- Sin dependencias nuevas, sin fuentes nuevas, sin cambios de datos ni de rutas. Toda la capa nueva es CSS plano en `src/app/premium.css`: se revierte quitando su import de `layout.tsx`.
- `prefers-reduced-motion`: sin resorte, balanceo, polvo, entrada de páginas ni brillos; la lámpara y el cordón siguen funcionando.
- Foco visible, teclado y objetivo táctil conservados; el cordón tiene zona de toque amplia.

## Cómo probar
`npm run typecheck && npm run lint && npm run build`, y mirar la Preview de la rama: `/login` (tirar el cordón con mouse, dedo y teclado; probar con «reducir movimiento»), `/inicio`, `/perfiles` y cualquier panel en los cuatro perfiles, en PC y teléfono.
