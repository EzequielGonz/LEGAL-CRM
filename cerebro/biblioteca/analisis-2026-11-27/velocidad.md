# Análisis del panel · velocidad (27/11)

Informe de un subagente en solo lectura (código, recorrido del panel y agregados de la base). Sin datos de prospectos ni claves. El plan que lo ordena está en `cerebro/22-plan-panel-2711.md`.

## Resumen

La velocidad del panel tiene dos problemas distintos. 1) Cuatro rutas tardan unos 12 s: /hoy, /salud, /panel/coberturas_medicas y /panel/agencia_0km, que redirigen a /hoy. Son las que consultan a Meta, y las dos de perfil tienen la línea con el token vencido. La causa más probable son consultas a Meta con tope de 7 s que se repiten una detrás de otra; las bases son chicas y tienen índices. 2) Todo lo demás tiene un piso de 1,8 a 2,9 s por trabajo repetido en cada pantalla (marco, Jarvis, 15 archivos CSS globales, 4 familias de fuentes). El peso de JS no es el problema, salvo /cerebro. Importante: la causa de los 12 s es una hipótesis fuerte, no un hallazgo comprobado. No se miró el tiempo de cada pieza ni los logs de Vercel. Todo se puede arreglar sin tocar ninguna animación ni efecto. Nota: el build que hay en .next es del 22/11 (5 días atrás); los tamaños de JS son de ese build.

## Hallazgos

### 1. 1. /hoy (y /panel/<perfil>, que redirige a /hoy): hasta 12 s por cascada de esperas y consultas a Meta repetidas

- **Tipo:** velocidad · **Esfuerzo:** M · **Punto del pedido:** None
- **Cómo está hoy:** Tiempos del recorrido (_rutas.json, milisegundos hasta red en reposo): /hoy 11 823, /panel/agencia_0km 12 327, /panel/coberturas_medicas 12 443. /panel/juridico y /panel/marketing dieron 2 384 y 2 464: es el mismo código con un perfil distinto. Las tres lentas muestran el cartel «Un problema frena la operación» o un token de Meta vencido (02__hoy.txt, 31__panel_agencia_0km.txt, 37__panel_coberturas_medicas.txt). Las dos de perfil son /panel/<perfil> que redirige a /hoy?perfil= (src/app/panel/agencia_0km/page.tsx:3-6). /hoy sin perfil usa el perfil recordado en la cookie (src/lib/perfil-activo.ts). En src/app/hoy/page.tsx hay una primera tanda en paralelo, y recién después TableroHoy (src/components/inicio/tablero-hoy.tsx:140-146) arma otra tanda. Dentro de ese componente, en serie: consultarEstadosLineas a Meta (línea 150), getCampaignMetrics más contarFallidos24h (línea 175), getAutomationPause (línea 191) y ai_agents (línea 192). Dentro de la tanda de TableroHoy va saludResumida() (línea 142), que ejecuta leerSalud() entero: unas 14 consultas más una consulta a Meta por cada línea activa (src/lib/salud/index.ts:107-116). Las dos consultas a Meta usan el mismo tope de 7 s (src/lib/whatsapp/estado-linea.ts:129). La memoria de 2 minutos solo vive en esa instancia y no guarda las respuestas «no_comprobado» (estado-linea.ts:98-101). Si Meta tarda o corta, se espera 7 s en la salud y otros 7 s en la línea del tablero, y eso explica los casi 12 s. Los datos descartan la base como causa: 15 196 oportunidades, 9 220 mensajes, 1 150 turnos del bot, 8 retenidos sin revisar, y hay índices por rubro (opportunities_rubro_capture_idx, _rubro_updated_idx, webhook_quarantine_rubro_pending_idx).
- **Por qué:** Hay tres causas que se suman. a) Cascada: la página espera una tanda, luego el tablero otra, luego más consultas sueltas. b) Doble consulta a Meta por la misma línea, una dentro de la salud y otra en el tablero, con 7 s de tope cada una y sin guardar el «no se pudo comprobar». c) Toda la pantalla espera a lo más lento: el Suspense de page.tsx envuelve CuerpoHoy completo, y TableroHoy se resuelve entero antes de pintar algo. Cuando una línea falla, falla justo lo que más tarda.
- **Evidencia:** _rutas.json: n=2 /hoy 11 823 ms; n=31 12 327 ms; n=37 12 443 ms; n=23 y n=43 unos 2 400 ms. Texto: 02__hoy.txt, 31__panel_agencia_0km.txt, 37__panel_coberturas_medicas.txt. Código: tablero-hoy.tsx:140-146 y 150, estado-linea.ts:129 y 98-101, index.ts:107-116.
- **Riesgo:** Bajo si se mantiene la misma salida. El riesgo real es mostrar un estado de línea desactualizado: el latido ya corre cada pocos minutos y el panel dice «se actualiza cada vez que entrás» en /salud, donde conviene seguir leyendo en vivo. No se cambia ninguna animación ni diseño.
- **Pasos:**
  1. Medir primero (sección de medición): confirmar con logs de Vercel o con console.time cuánto tarda cada pieza. Si Meta no es la lenta, esta hipótesis cae.
  2. Quitar la segunda consulta a Meta: sacar de tablero-hoy.tsx la llamada a consultarEstadosLineas y leer el estado de las líneas del resultado de saludResumida(). Hay que exponer accesoLineas desde leerSalud (ya se calcula en src/lib/salud/index.ts:107-116 y itemsDelPerfil lo filtra). Ganancia: hasta -7 s.
  3. Bajar el tope de Meta de 7 000 a 2 500 ms en el camino de lectura de pantallas (timeoutMs en estado-linea.ts). Guardar también el resultado «no_comprobado» por 30-60 s con el mismo mecanismo, para que una línea caída no re-pague el tope en cada visita.
  4. Pasar la comprobación de Meta fuera del camino de render: que la haga el latido (ya existe CLAVE_LATIDO y leerEstadoCalidad) y la pantalla lea el último resultado de la base (system_settings), igual que ya hace con la calidad. La pantalla no llama nunca a Meta. Ganancia: -2 a -7 s, el cambio más grande.
  5. Paralelizar el tramo final de TableroHoy: meter getAutomationPause, la consulta de ai_agents, getCampaignMetrics y contarFallidos24h en un único Promise.all, o iniciarlos junto con la tanda anterior (iniciar la promesa y esperar tarde). Ganancia: -300 a -800 ms.
  6. Dividir con Suspense: separar de TableroHoy la franja de estado y los chips (salud, líneas) en componentes con su propio fallback, para que las colas de trabajo (lo útil) se pinten sin esperar a Meta. Pasar a Promise.all las consultas de page.tsx y TableroHoy que no dependen entre sí (por ejemplo listarIndicador de captados, que se pide en la página y se lista de nuevo en el tablero).
  7. Evitar el doble conteo: contarIndicador y listarIndicador con count exact sobre las mismas condiciones se piden más de una vez por carga (page.tsx y tablero-hoy.tsx líneas 146-147). Compartir con React.cache() por petición.
- **Archivos:** `src/app/hoy/page.tsx`, `src/components/inicio/tablero-hoy.tsx`, `src/lib/salud/index.ts`, `src/lib/whatsapp/estado-linea.ts`, `src/components/salud/barra-salud.tsx`

### 2. 2. /salud: 11,7 s porque lee todo en vivo, sin caché, y consulta a Meta

- **Tipo:** velocidad · **Esfuerzo:** M · **Punto del pedido:** None
- **Cómo está hoy:** /salud tardó 11 755 ms. src/app/salud/page.tsx:25 llama leerSalud(), leerSaludWasender() y leerFallas(slug) a la vez, sin caché. leerSalud() son unas 14 consultas más Meta por línea (con el tope de 7 s). Además trae hasta 1 000 filas de webhook_quarantine con el campo detail, que es de tamaño libre (index.ts:73-75), cuando hoy hay 8 sin revisar.
- **Por qué:** La pantalla elige estar siempre en vivo, y el peor tiempo lo marca la consulta a Meta con 7 s de espera. leerSalud() también la llaman /cerebro (page.tsx:58), Resumen (src/lib/resumen/lista.ts:92, servidor.ts:31) y la barra de salud (caché de 60 s). Se calcula una versión distinta en cada lugar.
- **Evidencia:** _rutas.json n=11 11 755 ms; 11__salud.txt muestra el tablero con «Frena la operación · Sistema y WhatsApp oficial (Meta)»; index.ts:66-69 y 73-75.
- **Riesgo:** Medio-bajo: hay que decidir cuándo se considera «vigente» el estado de una línea. Se mitiga con el botón de comprobar ahora.
- **Pasos:**
  1. Una sola fuente de lectura: dos niveles de lectura. leerSalud() rápido (sin Meta, lo último que dejó el latido) para barra, Hoy, Cerebro y Resumen; /salud agrega un botón «Volver a comprobar ahora» que sí consulta a Meta, para quien quiere la lectura en vivo.
  2. Reducir la consulta de retenidos: seleccionar solo rubro_id, reason y detail truncado (o contar con head:true por perfil) en lugar de traer 1 000 filas con payload.
  3. Mostrar en /salud la lista de problemas primero y completar los datos lentos con Suspense (fallas, Wasender), sin bloquear el resto.
- **Archivos:** `src/app/salud/page.tsx`, `src/lib/salud/index.ts`, `src/lib/salud/fallas.ts`, `src/lib/resumen/lista.ts`, `src/lib/resumen/servidor.ts`

### 3. 3. Piso de 1,8 a 2,9 s en casi todas las pantallas: marco + Jarvis + CSS y fuentes globales

- **Tipo:** velocidad · **Esfuerzo:** M · **Punto del pedido:** None
- **Cómo está hoy:** Hasta pantallas simples como /oficina (1 801 ms), /configuracion (1 852), /incidencias (1 807) o /resultados (1 821) tardan casi 2 s. Cada pantalla de perfil monta MarcoPerfil (src/components/perfiles/marco-perfil.tsx) con varias lecturas propias (marca, menú personal, CartelCrisis, BarraSalud, EncabezadoPanel). Cada una está en su Suspense, bien, pero la sesión se valida en el middleware, en el layout y otra vez en la página (requirePageSession en src/lib/acceso/pagina.tsx). Jarvis se monta siempre y hace fetch de /api/jarvis/parte al cargar (jarvis.tsx:121). El layout raíz importa 15 archivos CSS globales: 249 KB crudos, unos 37 KB comprimidos, que bloquean el pintado. Además carga 4 familias de Google Fonts (Inter Tight, JetBrains Mono, Instrument Serif, Playfair Display) en src/app/layout.tsx:19-23.
- **Por qué:** Trabajo repetido por pantalla y recursos que bloquean el pintado, no una consulta puntual. La Supabase de validateSession se consulta con una memoria de 30 s (session.ts:158) separada para el middleware (entorno edge) y para el servidor: en frío son dos consultas por visita.
- **Evidencia:** _rutas.json (varias rutas entre 1 800 y 2 900 ms). CSS: suma de los 15 archivos importados en layout.tsx = 249 107 bytes. Fuentes: layout.tsx:19-23.
- **Riesgo:** Bajo con mapa de pruebas visuales antes y después. El riesgo es cambiar el orden de las reglas CSS y cambiar el aspecto: mover los archivos sin reordenar las reglas, y comparar capturas contra tour2711.
- **Pasos:**
  1. Validar la sesión una sola vez por petición: envolver validateSession/currentSessionVersion en React.cache(), y que el layout de dashboard y las páginas la comparten. Ganancia: 50-150 ms en frío.
  2. Jarvis: retrasar el fetch de /api/jarvis/parte hasta la inactividad del navegador (requestIdleCallback, ya está en las reglas de la skill) o hasta abrir la hoja, sin tocar el orbe. Hoy compite con la carga inicial.
  3. CSS: unificar los archivos con reglas repetidas y sacar del layout raíz los que solo usa una zona. Candidatos: vivo.css (48 KB), vidrio.css (18 KB), motion.css (16 KB), tema-premium*.css. Conservar las mismas reglas visibles: es mover, no quitar. Ganancia: 15-25 KB comprimidos menos en el camino crítico.
  4. Fuentes: dejar solo las que usa cada pantalla. /cerebro vuelve a declarar Inter Tight, JetBrains Mono e Instrument Serif con otros pesos (src/app/cerebro/page.tsx:25-28): una segunda copia. Reutilizar las del layout con las mismas variables. Playfair Display (solo marca e ingreso) pasar a cargarse con preload:false o solo en esas pantallas. Elegir la fuente definitiva en el rediseño estético antes de tocar esto (punto 6 del pedido) para no hacerlo dos veces.
  5. Prefetch: los enlaces ya usan prefetch={false} en muchas partes; revisar el menú (MenuPerfil) para precargar solo las 5 pantallas principales al pasar el mouse.
- **Archivos:** `src/app/layout.tsx`, `src/lib/acceso/pagina.tsx`, `src/lib/acceso/session.ts`, `src/components/jarvis/jarvis.tsx`, `src/components/perfiles/marco-perfil.tsx`, `src/app/cerebro/page.tsx`

### 4. 4. /cerebro: la página más pesada (169 KB de JS comprimido) y sin Suspense

- **Tipo:** velocidad · **Esfuerzo:** M · **Punto del pedido:** None
- **Cómo está hoy:** En el build del 22/11, /cerebro/page carga 12 chunks y 169 KB comprimidos, el máximo de todas las rutas (la mediana de las demás ronda 126-139 KB). Tardó 2 882 ms. src/app/cerebro/page.tsx:55-65 espera 9 lecturas juntas (semana, contactos, leerSalud() con Meta, pedidos, rubros, oficina, aprendido, propuestas, grafo) antes de mostrar nada. También entran 58 KB y 69 KB de CSS (cerebro.css, centro.css) y las fuentes propias.
- **Por qué:** Una sola espera para todo, incluyendo la salud completa en vivo, y mucho cliente: cerebro-vista.tsx más las piezas de la Oficina (oficina-visual, oficina-reel-*), el mapa y las pantallas.
- **Evidencia:** Medición de .next/app-build-manifest.json (suma gzip por ruta): /cerebro/page 169 KB, 12 chunks; /contactos 139 KB; /oficina 136 KB. _rutas.json n=4: 2 882 ms.
- **Riesgo:** Bajo. Hay que cuidar que el cartel de la animación del Cerebro (que el dueño ve superpuesto) no cambie de posición con los fallbacks de Suspense: reservar la altura.
- **Pasos:**
  1. Pasar leerSalud() a la lectura rápida (ver hallazgo 2) y envolver en Suspense las partes lentas o secundarias: salud, oficina, aprendido, grafo. Que el anillo y la barra para hablarle se pinten primero.
  2. Cargar la Oficina y el mapa a pedido con next/dynamic cuando el usuario abre su pestaña (la escena 3D ya es dinámica con ssr:false, oficina-visual.tsx:25-31, bien; falta lo mismo para las pestañas que traen el resto del código).
  3. Medir con el análisis de bundle (ver «Cómo medir») para ver qué entra en los 12 chunks antes de partir nada.
- **Archivos:** `src/app/cerebro/page.tsx`, `src/components/cerebro/cerebro-vista.tsx`, `src/components/cerebro/oficina-visual.tsx`

### 5. 5. Oficina 3D y animaciones: ya están bien resueltas, falta precargar con criterio

- **Tipo:** anda bien · **Esfuerzo:** S · **Punto del pedido:** None
- **Cómo está hoy:** La escena 3D se carga con next/dynamic ssr:false (oficina-visual.tsx:31) y además empieza a bajar apenas carga el módulo, sin esperar el chequeo de WebGL (línea 29). Los modelos suman 1,9 MB (8 archivos GLB en public/modelos/oficina, el mayor de 385 KB) con caché pública de 7 días (next.config.mjs, cabecera /modelos). /oficina tardó 1 801 ms. Jarvis separa la hoja del orbe con next/dynamic (jarvis.tsx:25). optimizePackageImports ya incluye three y drei.
- **Por qué:** No hay un problema acá. Lo único a vigilar: el efecto 3D «WOW» de entrada y perfiles que pide el dueño (punto 6) puede traer más three.js al camino crítico.
- **Evidencia:** oficina-visual.tsx:25-31; ls public/modelos/oficina (1,9 MB en total); _rutas.json n=5 1 801 ms.
- **Riesgo:** Bajo.
- **Pasos:**
  1. Para el efecto 3D de la entrada y de los perfiles: mismo patrón. Componente cliente cargado con next/dynamic ssr:false, con una imagen estática (SVG o PNG) como respaldo mientras baja, y solo en pantallas que lo necesitan.
  2. Comprimir los GLB con meshopt o Draco (gltf-transform) y texturas KTX2 si hace falta: se estima -50 a -70 % de bytes sin cambio visible; verificar con captura.
  3. Pausar la animación fuera de pantalla y con la pestaña oculta (IntersectionObserver y document.hidden) y respetar prefers-reduced-motion: mejora CPU y batería sin cambiar nada de lo que se ve.
- **Archivos:** `src/components/cerebro/oficina-visual.tsx`, `src/components/cerebro/oficina-reel-3d.tsx`, `public/modelos/oficina`, `next.config.mjs`

### 6. 6. Rutas 404 en el recorrido: /jarvis, /chats, /citas, /mas, /piezas, /meta

- **Tipo:** existe y no se encuentra · **Esfuerzo:** S · **Punto del pedido:** None
- **Cómo está hoy:** _errores.txt: seis rutas responden 404 (/jarvis, /chats, /citas, /mas, /piezas, /meta). El menú usa «Chats», «Citas» y «Más», pero esos destinos viven dentro del perfil (/panel/<perfil>/chats, etc.). En una tercera de ellas, /hoy tiene los enlaces correctos, así que estas rutas no existen sueltas.
- **Por qué:** El recorrido supuso rutas sueltas que el código no define: no son pantallas rotas, pero algún enlace viejo o marcador puede llevar a un 404 lento (cada una tardó 1 a 2,5 s).
- **Evidencia:** _errores.txt (6 líneas); _rutas.json n=6, 13, 15, 16.
- **Riesgo:** Muy bajo.
- **Pasos:**
  1. Confirmar con grep que ningún enlace interno apunte a esas rutas.
  2. Agregar redirecciones en next.config.mjs (redirects, como ya hay para /telefono) a /perfiles o al destino correcto: es un cambio barato y evita pantallas vacías.
- **Archivos:** `next.config.mjs`, `src/app/not-found.tsx`

### 7. 7. Caché de datos: casi todo es force-dynamic y solo 8 lecturas usan caché

- **Tipo:** velocidad · **Esfuerzo:** M · **Punto del pedido:** None
- **Cómo está hoy:** 105 páginas con force-dynamic y solo 94 exportan dynamic o revalidate. unstable_cache se usa solo en barra-salud (60 s), perfiles-stats (rubros, 60 s), marca-servidor, personalizacion, metrics, campaign-metrics, semana-cache y campanas-list-view. El cliente de Supabase fuerza cache:'no-store' (src/lib/supabase/admin.ts:21), por diseño, para no ver datos viejos.
- **Por qué:** Decisión de seguridad y frescura razonable para un panel operativo. Las lecturas que no cambian cada segundo (menú personal, marca, lista de rubros, agentes por área, líneas del perfil) se repiten en cada pantalla.
- **Evidencia:** grep: 105 force-dynamic y 8 archivos con unstable_cache.
- **Riesgo:** Medio: un caché mal etiquetado muestra datos viejos. Se mitiga con vencimientos cortos y con probar guardar-y-leer por pantalla.
- **Pasos:**
  1. Cachear con unstable_cache y etiquetas, por perfil, y solo datos que no son de personas: líneas de perfil (profile_lines), ai_agents por área, cifras de periodo (cifrasDePeriodo) con 30-60 s. Invalidar con revalidateTag al guardar desde las pantallas de configuración.
  2. No cachear nada con nombres, teléfonos ni mensajes. La clave de caché lleva siempre el perfil (rubros separados: nada de un perfil se ve en otro).
  3. Cuidado con la barra de salud: la clave 'barra-salud' es global y itemsDelPerfil filtra después; eso está bien porque la lista de ítems no mezcla datos de personas.
- **Archivos:** `src/lib/supabase/admin.ts`, `src/lib/perfiles-stats.ts`, `src/components/inicio/tablero-hoy.tsx`, `src/lib/hoy/periodos.ts`

## Propuestas

- **Tablero de velocidad en la sección Salud** (M). Que el panel mida solo cuánto tarda cada pantalla y cada llamada a Meta (por perfil, p50 y p95, con fecha) y lo muestre en Salud. Hoy la velocidad se sabe solo cuando alguien se queja. Sirve también para comprobar cada arreglo contra el valor de antes.
- **Presupuesto de peso por pantalla en el pipeline** (S). Un chequeo que falle el build si una ruta pasa de, por ejemplo, 150 KB de JS comprimido o si el CSS global crece más de un límite. Hoy /cerebro lleva 169 KB y nadie lo ve crecer. Protege la velocidad cuando se sumen funciones nuevas y el efecto 3D de entrada.
- **Estado de líneas guardado por el latido** (M). Que el latido deje el estado de Meta de cada línea en la base y las pantallas lo lean, sin llamadas en vivo. Quita 7 a 12 s de Hoy, Salud, Cerebro y Resumen, y sirve a «Salud del panel» del Cerebro para accionar.
- **Imágenes y 3D a demanda con respaldo estático** (M). Para el efecto «WOW» de la entrada y los perfiles: renderizar una imagen o SVG igual de cuidada al instante y recién después montar la escena 3D, sin bajar nada de lo que se ve. Mantiene el efecto y la velocidad.

## Preguntas para el dueño

- ¿Prefieren que «Salud» muestre siempre el último estado que dejó el latido (rápido, de pocos minutos atrás) con un botón «Volver a comprobar ahora», o que siga consultando a Meta cada vez que se entra (más lento, hasta 12 s cuando una línea falla)? Recomendación: lo primero.
- Hoy hay líneas de Meta con el token vencido (Autos 0 km, Coberturas y Marketing sin línea): ¿quién renueva los tokens en Vercel? Mientras estén vencidas, esas pantallas van a seguir lentas aunque se arregle el código, porque la consulta a Meta cae al tope de espera.
- Para las fuentes: ¿mantienen las cuatro actuales (Inter Tight, JetBrains Mono, Instrument Serif, Playfair Display) o el rediseño premium va a elegir otras? Conviene decidirlo antes de optimizar la carga de fuentes, para no hacerlo dos veces.

## Herramientas usadas

- Skill vercel-react-best-practices
- Bash (lectura de _rutas.json y _errores.txt del recorrido, medición gzip de .next/app-build-manifest.json y .next/static/css, wc y grep sobre src)
- Read/lectura de código: next.config.mjs, src/app/layout.tsx, src/app/hoy/page.tsx, src/components/inicio/tablero-hoy.tsx, src/lib/salud/index.ts, src/lib/whatsapp/estado-linea.ts, src/components/salud/barra-salud.tsx, src/components/perfiles/marco-perfil.tsx, src/lib/acceso/*, src/middleware.ts, src/app/cerebro/page.tsx, jarvis.tsx, oficina-visual.tsx
- ToolSearch (para cargar las herramientas de Supabase)
- mcp__Supabase__execute_sql (solo SELECT: índices por tabla en pg_indexes y conteos agregados; sin datos de personas)
- No se pudo abrir graphify ni el cerebro (cerebro/07 y 03) por tiempo: se fue directo al código real. No se usaron los logs de Vercel (no se consultaron): queda como paso de medición
