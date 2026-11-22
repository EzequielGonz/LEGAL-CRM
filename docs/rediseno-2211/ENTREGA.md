# Rediseño del panel · 22/11

Pedido del dueño: «ese rediseño, animaciones, mejoras, aplicalo en cada detalle del panel». Referencia: la pantalla `/cerebro` (oscuro, tarjetas bento, Inter Tight con detalles en JetBrains Mono, luces de estado que laten, revelados suaves). Se llevó ese lenguaje a todo el panel **sin tocar el color de cada perfil** (dorado VITA, verde Coberturas, celeste Autos, naranja Marketing) ni los dos modos (claro y oscuro).

Rama `diseno/rediseno-panel-2211`. **Solo presentación**: no cambia reglas de negocio, consultas a la base, rutas de API ni textos de los bots. Nada se borró.

Estado: especificado, implementado y probado (tipos, lint, pruebas unitarias, compilación y capturas locales con datos sintéticos). **No publicado** (sin push a `main`) y **no recorrido con sesión real**: las pantallas con datos solo se pueden ver con el código de ingreso, que no se usó.

## Sistema de diseño común

| Pieza | Dónde | Qué es |
| --- | --- | --- |
| Tokens | `src/app/diseno.css` (va última en `layout.tsx`) | Espacios (4/8 px), radios, sombras, movimiento (curvas y tiempos), superficies y texto por modo, colores de estado. Lo que depende de la paleta del perfil se declara en cada `[data-tema]`. |
| Tipografía | `src/app/layout.tsx` | Inter Tight para todo el panel y JetBrains Mono para rótulos y cifras chicas, como `/cerebro`. Playfair queda solo en la marca y el ingreso. Títulos y cifras dejan la serif en oscuro. |
| Componentes base | `src/components/ui/diseno.tsx` | `Bento`, `Tarjeta` (con enlace, brillo del color del perfil, borde de estado), `Kicker`, `Estadistica` (cifra que cuenta al aparecer, «—» = sin dato), `Luz` y `ChipEstado` (luz que late solo si algo pasa ahora), `Vacio`, `Esqueleto`, `Cargando`, `Revelar`, `CabezaPantalla`. |
| Textos de pantalla | `src/lib/textos/pantalla.ts` + `tests/unitarias/textos-pantalla.test.ts` | Funciones puras: `cantidad` (plurales sin «(s)»), `motivoPausaLegible`, `nombreConexion`, `estadoDeTono`. 5 pruebas. |
| Contadores | `src/components/ui/efectos-vidrio.tsx` | El contador que ya existía ahora también anima `[data-contar]` (las cifras de `Estadistica`). La cifra real queda en su lugar: no se corre nada. |

Movimiento: solo `transform` y `opacity`; entrada escalonada de tarjetas (55 ms entre una y otra), luces que laten, brillo de carga, elevación al pasar el mouse, transición de la pestaña activa. Con «reducir movimiento» del sistema no se mueve nada.

## Qué cambió por pantalla

| Pantalla | Cambio |
| --- | --- |
| Todo el panel | Tipografía nueva, botones en píldora, 44 px táctiles en pantallas táctiles, chips de estado que se parten en vez de cortarse. Arreglos de desborde en el celular (menús desplegables con nombres de bases largos, grillas de una columna automática, tablas que se deslizan dentro de su tarjeta). |
| Ingreso | Rótulo mono «Acceso privado · 4 perfiles» arriba del título. La lámpara queda igual. |
| Perfiles | Rótulos mono, cifras de la semana que cuentan, brillo del color de cada marca. **Sin el cuadro «En vivo»** (orden del 19/11; el componente queda en el repo). |
| Hoy | Encabezado nuevo (fecha en mono, saludo, bajada). Las dos listas en tarjetas bento con luz, contador y vacío con contexto. Chips con luz (late solo si la campaña envía). «También hoy» en tarjetas con cifra. Esqueleto nuevo. Sin «personas, no mensajes» (orden del 19/11). |
| Resultados | Embudo en una columna en pantallas muy angostas; tarjetas comunes; vacío con contexto; esqueleto nuevo. Paginador en dos renglones con botones de 44 px. |
| Salud | Tira bento con cuatro cifras (frenan, para revisar, en orden, fallas de 24 h) con su luz; problemas en la tarjeta común con borde de estado; vacío de fallas. |
| Bot IA (`/agentes`) | Encabezado nuevo, tarjeta del puntaje con brillo y nota que cuenta. |
| Campañas | Luz de estado por campaña (late mientras envía), borde de estado, lista escalonada. Estructura igual (orden del 19/11). |
| Chats y detalle | Ver arreglo (c). Ícono de adjuntar dibujado (antes un emoji). |
| Bandeja para Claude | Rótulo mono, tres cifras en bento con luz, tarjeta de pedido con brillo, vacío con contexto. |
| Menú y pestañas | Nombres bajo los íconos de la barra del celular; flecha y desvanecido cuando hay más pestañas; contraste de la tarjeta «Bandeja para Claude». |
| Avisos | Aviso del código de ingreso en una línea; aviso de captados con el estilo común. |

## Lista del 20/11 (ítem 15 de `08`) y §3 ítem 11 de `15`

| Punto | Estado | Cómo |
| --- | --- | --- |
| (c) encabezado del chat cortado al abrir | Hecho | El chat baja solo dentro de su columna; antes `scrollIntoView` movía toda la página. En el celular el encabezado queda fijo arriba. |
| (c) «Más opciones» tapa donde se escribe | Hecho | En las pantallas de chat va arriba del chat, a la derecha; en el celular el cuadro para escribir queda fijo abajo. |
| (c) estados contradictorios del chat | **Para lógica** | «Cerrado (ganado)» + «Requiere atención humana» sale de los datos. |
| (e) `WHATSAPP_*` en pantalla | Hecho | «Conexión Civil»; el prefijo interno queda en Más opciones (Ajustes de líneas y Plantillas). |
| (e) motivos «ad», «domingo» | Hecho | «pausada a mano con la nota «domingo»» en Hoy, lista y detalle de Campañas. |
| (f) plurales «(s)» | Hecho en pantalla | Salud, barra de salud, Campañas, Plantillas, Bot IA, Incidencias, Redes, asistente, Marketing, Ajustes, Perfiles. Quedan los textos que arma `src/lib/salud*` («1 mensaje(s) retenidos…»): son de la lógica de Salud, que trabaja otro escritorio. |
| (f) encabezado «Hoy» en Salud | Parcial | La pantalla ahora dice «Salud del sistema» arriba del título; la miga sigue diciendo la sección «Hoy» porque Salud vive en esa sección del menú. |
| (i) aviso del PIN enorme | Hecho | Una línea con luz y enlace. |
| (i) pestañas cortadas sin señal | Hecho | Desvanecido y flecha solo cuando hay más a un costado. |
| (i) aviso de Wasender truncado | Hecho | Los chips se parten en dos líneas. |
| (i) íconos sin texto | Hecho | Cada ícono de la barra inferior lleva su nombre. |
| (j) contraste 1,91:1 en «Tareas para Claude» | Hecho | Color propio: más de 10:1 en oscuro y en claro. |
| §3.11 `/agentes` y `/resultados` se desbordan | Hecho (verificado en réplica) | `/resultados`: el paginador no se partía (409 px). `/agentes`: menús desplegables con nombres de bases largos; ahora no pasan el ancho de su columna. En la réplica local, con el arreglo 374 px de borde derecho; sin el arreglo, 819 px. |
| Accesibilidad AA | Hecho en lo tocado | Foco visible con anillo del acento (paso 700, 4,5:1 en los dos modos), 44 px táctiles, luces con texto al lado (el estado no depende solo del color), `aria-label` en cifras y tarjetas-enlace, subtítulos de `slate-400` pasados a `slate-500/600`. |

## Qué no se tocó y por qué

- **Chip del bot en Hoy y bloque «También hoy»** (órdenes del 19/11 de sacarlos): quitar el chip deja sin uso una lectura de la base (`getProfileMetrics`), y eso es lógica. Se restilaron; queda para decidir junto con la rama del 19/11.
- **Contactos e Incidencias**: «dejarlo tal como está» (19/11). Solo toman la tipografía y los arreglos generales.
- **Ajustes y Bases**: toman los arreglos generales (tipografía, botones, desborde, foco); no se rearmaron.
- **`/cerebro`**: es la referencia; no se tocó.
- **Medidor del bot siempre amarillo** (no toma el color del perfil): es un color de nivel (bien/mejorable/ajustar), no de marca; se dejó.

## Para lógica (otro escritorio)

1. Estados contradictorios del detalle de chat (punto c).
2. PENAL rotulada «PENAL · Civil» y ofrecida para asignar en otros perfiles (punto d): ahora se lee «Conexión Penal · asignar», pero sigue apareciendo fuera de Jurídico.
3. Plurales «(s)» que arma `src/lib/salud*` y el aviso global de mensajes retenidos.
4. Cifras que no coinciden entre pantallas (puntos g y h) y Salud que no revisa el acceso de Meta (a, b).

## Cómo se probó

- `npm run typecheck`, `npx tsc -p tests/tsconfig.json --noEmit`: sin errores.
- Lint (`eslint` con la configuración del repo): sin errores. Nota: dentro de esta copia aislada `npm run lint` toma también el `.eslintrc.json` de la carpeta de arriba y falla al cargar `next/core-web-vitals`; se corrió `npx eslint --no-eslintrc -c .eslintrc.json --ext .ts,.tsx src`.
- `npm run build`: compila.
- Pruebas unitarias: 608 de 608 (5 nuevas).
- Capturas con Playwright en `npm run dev`, 390 y 1280 px, sin desborde a lo ancho: el ingreso y una página de prueba local con los componentes y datos sintéticos (no se subió) en Jurídico y Marketing oscuro, Autos oscuro y Coberturas claro. En `capturas/`. No contienen datos de personas.
- **No probado**: las pantallas con datos reales (necesitan sesión), lector de pantalla, zoom al 200 %.

## Cómo revertir

Cada pantalla es un commit aparte; `git revert <commit>` deshace una sin tocar las demás. Para sacar todo el lenguaje nuevo de una vez: quitar `import "./diseno.css"` de `src/app/layout.tsx` (los componentes siguen compilando, sin estilo).
