# Oficina 3D (22/11): informe del repaso

Versión comprobada: rama `diseno/oficina-3d-repaso-2211`, desde `origin/main` en `b2cce2f`.

## Resumen

| Qué | Estado |
|---|---|
| Especificado | Sí: la escena, la versión liviana, la lista accesible y la regla de festejo por parte terminada |
| Implementado | Sí, en esta rama |
| Probado | Tipos, pruebas unitarias, build y capturas con datos de ejemplo (detalle abajo) |
| Publicado | No: la rama queda para revisión, nada se integró a main |
| Habilitado | No aplica (es presentación; no hay interruptor ni migración) |

## Qué se probó (resultado real)

- `npm run typecheck` y `npx tsc -p tests/tsconfig.json --noEmit`: sin errores.
- Pruebas unitarias: 763 pasan, 0 fallan. Hay 22 propias de `oficina-escena`; las nuevas cubren que festeje el escritorio que terminó su parte (Análisis y después Redes), que no festeje al cargar ni al aprobar, y el texto «Ya dejó su parte».
- `npm run build`: compila. El paso de ESLint del build falla en este entorno con «Failed to load config next/core-web-vitals» porque toma el `.eslintrc.json` de la carpeta padre; lo mismo pasa con `npm run lint`. Corrido a mano con el `.eslintrc.json` de la rama, sin avisos.
- Peso de `/cerebro`: carga inicial de 146,1 KB gz (la base antes de la Oficina 3D era 141,4 KB). La escena 3D es un chunk aparte de unos 239 KB gz, que no se baja en celular ni con movimiento reducido.
- Capturas con Playwright y WebGL por swiftshader, con datos de ejemplo y sin Supabase: sala con agentes tecleando, festejo de Análisis y Dirección, vista de planta, primer plano con panel, celular a 390 px sin scroll horizontal y movimiento reducido. Carpeta `/tmp/claude-0/-home-user/8c59649c-cc60-5c57-bbe5-216901928a02/scratchpad/oficina3d/` (la 21 es el festejo, la 20 la sala trabajando y la 10 el celular).

## Revisión de calidad y accesibilidad

Se revisó contra `kocos-crm-diseno-y-accesibilidad`, las pautas de Vercel, `design:design-critique`, `design:accessibility-review`, `ui-consistency:verifying` y el estilo del dueño (`cerebro/14`): simple, premium y sobrio, sin fondo raro, pocas funciones por pantalla.

| Criterio WCAG 2.2 | Resultado |
|---|---|
| 1.1.1 Texto para lo no textual | Cumple: la escena es decorativa y toda la información está en la lista |
| 1.3.1 Estructura | Cumple: lista con botones, panel como complementario con nombre, grupos con nombre |
| 1.4.1 Uso del color | Cumple: cada estado lleva ícono y texto |
| 1.4.3 Contraste | Cumple en la lista, el panel, las tarjetas y la leyenda (corregida). Las tarjetas lejanas con opacidad reducida bajan de 4,5:1, pero son un espejo decorativo de la lista |
| 1.4.11 Contraste de no texto | Cumple en foco y botones. El borde gris de «Libre» es decorativo: el estado está en el texto |
| 1.4.13 Contenido al pasar el puntero | Cumple: la tarjeta ampliada no oculta nada que no se pueda recuperar desde la lista |
| 2.1.1 Teclado | Cumple: lista, botones del panel y de la vista; flechas entre escritorios y Esc. Las tarjetas dentro de la escena no se enfocan a propósito |
| 2.4.3 Orden del foco | Cumple: vista, panel, leyenda y lista. Al abrir el panel el foco pasa al panel y con Esc vuelve al botón de la lista |
| 2.4.7 y 2.4.11 Foco visible | Cumple: anillo de 3 px azul claro, más de 3:1 |
| 2.5.3 Etiqueta en el nombre | Cumple: el nombre accesible empieza con el texto visible |
| 2.5.8 Tamaño del objetivo | Cumple: 44 px en botones de la vista, ajustes, panel y lista |
| 2.3.3 y movimiento | Cumple: con `prefers-reduced-motion` se usa el diorama sin animaciones; hay «Pausar animaciones» |
| 4.1.3 Mensajes de estado | Cumple: `aria-live` con aviso de entrega, como mucho uno cada 10 s |
| Transparencia reducida y alto contraste | Cumple: panel, tarjetas y botones pasan a fondo sólido |
| Lector de pantalla real (VoiceOver, NVDA) | **No comprobado**: solo por lectura del código y del árbol de accesibilidad |
| Zoom al 200 % | **No comprobado** en pantalla; el diseño no usa anchos fijos en el celular |

El agente `fairmind-design:fairmind-accessibility-orchestrator` no estaba disponible en esta sesión (la búsqueda de herramientas no lo encontró y no hay una herramienta para lanzar agentes). La revisión la hizo el mismo agente que escribió la escena en la primera vuelta, con las skills de accesibilidad; no cuenta como revisión independiente. Queda pendiente pasarla por ese agente desde la sesión principal.

## Qué no se probó

- La ruta real `/cerebro` con Supabase y sesión, ni la Preview de Vercel.
- GPU real ni celular físico: solo swiftshader, que es lento. No se midieron fps.
- Lector de pantalla real y zoom al 200 %.
- La pausa fuera de pantalla y con la pestaña oculta (implementada, sin probar).
- No se usaron referencias de A1 ni de 21st: la escena sigue el video del dueño y no hacía falta otra.

## Límites conocidos

- Deslizar sobre el diorama para cambiar de agente no está hecho; en celular se elige desde la lista.
- No hay glifos por rubro (Jurídico, Autos); son por escritorio.
- El festejo depende de que el escritorio deje una nota en el recorrido de la tarea; si un agente trabaja sin dejarla, no hay festejo.
