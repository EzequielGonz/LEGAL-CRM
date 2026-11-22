# Plan de simplificación del CRM

Objetivo: que cada pantalla responda UNA pregunta, con 3–4 bloques, anillos y movimiento simple. Nada se borra: lo que sale de la vista va a «Más».

Aviso sobre las alturas: `main` del panel es un contenedor con scroll interno (`lg:h-screen lg:overflow-y-auto` en `marco-perfil.tsx`), así que las capturas de Hoy, Chats, Resultados y Salud quedan cortadas en 900 px. Su alto real es mayor; lo estimo por el contenido. Medidos de verdad: Perfiles 2129 px, Cerebro 9558 px, Asistente 1570 px.

## 1. Diagnóstico por pantalla

| Pantalla | Alto | Qué sobra | Qué confunde |
|---|---|---|---|
| Perfiles | 2129 | 22 botones (5 por perfil), listas de captados con nombres, bloque «Conocimiento del bot» con comparativas v1/v2 | Parece un panel entero y es una puerta. Dos accesos al Cerebro y al Asistente |
| Hoy | ~2500–3000 (est.) | 2 carteles de aviso arriba (código de ingreso, crisis), 4 pestañas, 6 chips de estado repetidos (Wasender dos veces, campaña pausada tres veces), tarjetas con listas largas | Qué es lo urgente: todo grita. Nombres técnicos («Wasender», «Línea CIVIL») |
| Chats | ~2000 (est.) | Banner naranja que repite lo de Hoy, 4 contadores más una línea de «Sin nadie ahora…», pestañas Todos/Descartados/Incidencias | Se pisa con Hoy («Responder desde Hoy») |
| Resultados | ~1800 (est.) | 7 tarjetas de embudo con 3 datos cada una, filtro de 5 períodos | Muchas cifras sin una lectura. Mini-anillos de 24 px que no se entienden |
| Salud | ~1500 (est.) | 4 contadores, lista de fallas, lista de problemas, otra lista de controles | Dice lo mismo tres veces |
| Cerebro | 9558 | 11 secciones apiladas, esfera de puntos de 800 px, menú de 11 anclas | Mezcla memoria, agentes, alertas y propuestas |
| Menú lateral | 9 secciones + 2 tarjetas + 3 enlaces | «Bot IA», «WhatsApp oficial», «WhatsApp por QR», «Redes», «Ajustes», Bandeja, Pedile algo, Cambiar de perfil | Es configuración técnica mezclada con el trabajo diario |

## 2. Navegación nueva: 5 destinos + «Más»

Barra lateral (y barra inferior del celular):

1. **Hoy** (con Jarvis)
2. **Chats**
3. **Campañas**
4. **Resultados**
5. **Salud**
6. **Más** (un solo ítem que abre un panel con tarjetas grandes, no una lista)

Dónde queda el Cerebro: en el pie de la barra, junto al selector de perfil y el modo oscuro, como «Cerebro» (lo pide el brief: Salud y Cerebro van separados por una línea). Entonces son 5 destinos de trabajo, «Más» y el pie fijo.

**Qué va en «Más»** (todo lo que hoy es sección o pestaña y sale de la barra):
- Contactos (Etapas, Citas, Seguimiento, Por base, Prioritarios, Piden presupuesto)
- Bot IA
- WhatsApp oficial (Líneas, Plantillas, Perfil)
- WhatsApp por QR
- Redes (Accesos, Publicaciones, Contenido, Publicidad)
- Ajustes
- Historial (`/estadisticas`), Descartados, Incidencias, Todos los chats
- Bandeja para Claude, Asistente general
- Bases, Extraer negocios (Marketing)
- Cambiar de perfil

**Archivos a tocar:**
- `src/lib/menu.ts`: hoy arma 9 secciones con `grupo: "trabajo" | "configurar"`. Cambiar `seccionesDeFabrica` para devolver 5 secciones de trabajo y mover las demás a un `grupo: "mas"`. La interfaz `SeccionMenu` ya tiene `oculta`, y `seccionActiva` sigue resolviendo la ruta aunque la sección no esté en la barra. Contactos pasa a `grupo: "mas"`.
- `src/components/menu-perfil.tsx`: renderiza los grupos y la barra inferior del celular (líneas ~156–180 y ~228–250). Agregar el ítem «Más» y el panel de tarjetas.
- `src/components/perfiles/encabezado-panel.tsx` (`PestanasSeccion`): se acaban las pestañas en Hoy y Chats; en Más sí.
- `src/lib/personalizacion/menu.ts`: `aplicarMenuPersonal` debe respetar el grupo nuevo.
- `src/lib/asistente/motor.ts` importa `seccionesDePerfil`: revisar que siga hallando rutas.

## 3. Pantallas principales

Regla común: máximo 4 bloques visibles, un anillo grande como protagonista, el resto detrás de «Ver más». Animación única: el anillo se llena 0→valor en 900 ms con conteo, y un punto que respira (BRIEF §3 y §5; sin movimiento con `prefers-reduced-motion`). Componente nuevo: `src/components/ui/anillo.tsx` (SVG, dos `<circle>`, `role="img"` y `aria-label`).

### Hoy con Jarvis
- **Objetivo:** «Qué pasó y qué tengo que decidir».
- **Bloques:**
  1. Jarvis: 2 frases y 2 botones máximo («Responder 5», «Derivar 15»).
  2. Anillo grande: **captados sin derivar** (ej. 15 de 20). Debajo, 3 anillos chicos: Escribieron / Captados / Derivados esta semana.
  3. «Para decidir»: máx. 3 filas con verbo y botón (Responder, Derivar).
  4. Una sola franja de estado: «Todo en orden» o «1 problema · Ver» (reemplaza los 6 chips y los 2 carteles).
- **A «Ver más»:** listas completas de atención humana y de captados, los avisos de campañas pausadas, el aviso del código de ingreso (pasa a una campanita).
- **Interacción:** tocar el anillo abre la lista de esas personas en un panel lateral; Derivar con deshacer de 5 s.
- **Archivos:** `src/app/hoy/page.tsx`, `src/components/inicio/tablero-hoy.tsx` (410 líneas, partir en `jarvis.tsx` y `para-decidir.tsx`), `src/components/perfiles/cartel-crisis.tsx`, `src/components/acceso/aviso-codigo-anterior.tsx`, `src/components/perfiles/marco-perfil.tsx` (los carteles se funden en la franja).

### Chats
- **Objetivo:** «Responder».
- **Bloques:** 1) Anillo: personas esperando respuesta (6) con cuánto llevan. 2) Fila de 3 filtros en pastilla: Para cerrar 15 · Te escribieron 6 · Oportunidades 3. 3) Lista y conversación en dos paneles. Sin 4.º bloque.
- **A «Ver más»:** Hablando ahora, Posible captación, Agendaron, Todos, Descartados, Incidencias.
- **Interacción:** la pastilla filtra la lista sin recargar; atajo para pasar al siguiente chat.
- **Archivos:** `src/app/conversaciones/page.tsx`, `src/components/inbox/conversation-list.tsx`, `src/components/inbox/conversation-thread.tsx`.

### Campañas
- **Objetivo:** «Ver si funcionan».
- **Bloques:** 1) Anillo grande: tasa de respuesta de la campaña activa. 2) Tarjeta por campaña (máx. 3): estado, anillo chico de respuesta, botón «Dejar lista». 3) Una línea de salud de la línea de envío.
- **A «Ver más»:** Bases, límites de envío, entrenamiento, destinatarios, historial de campañas.
- **Regla:** el lanzamiento queda en los dueños; el botón dice «Dejar lista», nunca «Lanzar».
- **Rutas:** Jurídico usa `/campanas`; los otros, `/panel/<slug>/campanas` (la captura dio 404 porque probó `/panel/juridico/campanas`).
- **Archivos:** `src/app/(dashboard)/campanas/page.tsx` y las `app/panel/*/campanas/page.tsx`, `src/components/campanas/campanas-list-view.tsx`, `campaign-detail-view.tsx`, `campaign-metrics-panel.tsx`.

### Resultados
- **Objetivo:** «Cuánto conseguí».
- **Bloques:** 1) Anillo grande: captados vs. meta del período. 2) Embudo en 4 anillos chicos con conteo: Contactados → Respondieron → Oportunidades → Captados. 3) Una frase de lectura: «Captaste 4, más que la semana pasada». Selector de período como pastillas (se mantiene).
- **A «Ver más»:** Derivados y Ventas, comparaciones, «Ver quiénes», gráfico por período, Historial.
- **Interacción:** al elegir otro período, los anillos se re-animan; tocar un anillo muestra quiénes.
- **Archivos:** `src/app/resultados/page.tsx`, `src/components/resultados/embudo-periodo.tsx`, `grafico-periodo.tsx`.

### Salud
- **Objetivo:** «¿Anda todo?».
- **Bloques:** 1) Anillo grande: % de servicios en orden (5 de 7). 2) Máx. 3 filas «Frena» con botón de acción. 3) Estado de las líneas (Meta, QR) como puntos verde/ámbar/rojo con texto.
- **A «Ver más»:** controles en orden, fallas de las últimas 24 h, detalle técnico.
- **Archivos:** `src/app/salud/page.tsx`, `src/components/salud/barra-salud.tsx` (80 líneas; la barra superior se reutiliza como la franja de Hoy).

### Cerebro con la Oficina
- **Objetivo:** «Qué sabe el negocio y qué está haciendo Claude».
- **Bloques:** 1) Buscador grande («Preguntale al cerebro») con la cifra de memoria en un anillo (sin esfera de 800 px). 2) La Oficina: 8 escritorios como tarjetas planas con punto de estado y una tarea abierta. 3) «Para aprobar»: pendientes y propuestas (máx. 3). 4) «Hablale a Claude».
- **A «Ver más» (pestañas internas):** Lo que veo, Alertas, Preguntas, Asistente, Laboratorio, Lo que entiendo, Lo que corregí.
- **Interacción:** al dejar una tarea, el escritorio cambia a «trabajando» con el punto que respira; esa tarea aparece en «Para aprobar».
- **Archivos:** `src/app/cerebro/page.tsx` (458 líneas, 11 secciones), `src/components/cerebro/oficina.tsx`, `escena-cerebro.tsx`, `tablero-pendientes.tsx`, `hablar-con-claude.tsx`, `src/app/cerebro/cerebro.css`.
- Perfiles (`src/app/perfiles/page.tsx`, 104 líneas) pasa a 4 tarjetas de un anillo y el botón «Entrar»; «Conocimiento del bot» va a Más → Bot IA.

## 4. Rutas que quedan solo en «Más»

`/contactos`, `/agenda`, `/seguimiento`, `/prospectos-por-base`, `/oportunidades`, `/casos-cerrados`, `/estadisticas` (Historial), `/descartados`, `/incidencias`, `/limpieza`, `/inbox` y `/chats`, `/agentes` (Bot IA), `/meta/lineas`, `/redes/plantillas`, `/redes/perfiles`, `/wasender` y `/wasender/plantillas`, `/redes`, `/redes/accesos`, `/redes/publicidad`, `/contenido`, `/bases`, `/configuracion`, `/bandeja`, `/asistente`, `/biblioteca-agentes`, `/comparacion-agentes`; en Marketing también `/extraer`, `/captacion`, `/presupuestos`, `/consultas-directas`, `/prospectos`. Todas siguen abriendo por su dirección.

## 5. Textos simples: antes / después

| Antes | Después |
|---|---|
| Un problema frena la operación. 5 mensajes que entraron quedaron retenidos por seguridad y no se respondieron. | 5 mensajes sin responder. Revisalos |
| Cambiá el código de ingreso por uno de 8 números. | Reforzá tu código de ingreso (campanita en Más) |
| Wasender Asesoria Vita - 2 · desconectada: hay que escanear el QR | WhatsApp por QR desconectado · Escanear |
| Captados para derivar | Para pasar al profesional |
| Atención humana: escribieron y el bot no les contesta: respondeles vos | Te esperan: 5 |
| Oportunidades reales | Con interés real |
| Hay algo que frena el trabajo | 2 cosas para arreglar |
| Controles en orden: 5 | 5 funcionan bien |
| 8,3 % de los contactados | 8 de cada 100 respondieron |
| Los agentes, trabajando. Dejá una tarea: Gemini la ordena… | Contale a la oficina qué necesitás |

## 6. Riesgos: qué no romper

- **Rubros separados:** nada de un perfil se ve ni se abre desde otro. Los anillos de Hoy se leen con `perfilActivo()` y `RUBRO_IDS[slug]`; el panel «Más» arma enlaces solo del perfil activo. Jurídico va sin prefijo, los otros bajo `/panel/<slug>`.
- **Nada se borra:** ocultar es mover de grupo en `menu.ts` o plegar con `NivelProvider` / «Más opciones». Sin migraciones ni eliminación de rutas.
- **Campañas:** el botón nunca lanza; mantener el copy «Dejar lista».
- **Cartel de crisis y salud:** una persona en crisis o una línea caída no puede quedar detrás de un «Ver más». La franja de estado debe ser roja y visible con 1 problema.
- **Personalización por perfil** (`leerMenuPersonal`, `aplicarMenuPersonal`): el menú a medida de cada perfil debe seguir funcionando con los grupos nuevos.
- **Asistente y Bandeja:** `lib/asistente/motor.ts` depende de `seccionesDePerfil`; probar que «Pedile algo» siga encontrando las pantallas movidas.
- **Accesibilidad AA:** el anillo con `aria-label`, la cifra como texto, contraste de acento con la pista y foco visible. Movimiento reducido: valor final sin animar. Tema claro y oscuro (`SelectorModo`).
- **Preview comparte base con producción:** probar ahí tiene efectos reales; no usar «Derivar» ni envíos en las pruebas.
- **Pruebas:** hay pruebas unitarias de `lib/menu.ts` y casos A01–A35; actualizarlas junto con el menú y correr `typecheck`, `lint`, `build` y las pruebas de integración antes de publicar.
- **Datos personales:** los listados de captados con nombres y teléfonos no deben aparecer en Hoy ni en capturas de revisión.
- **Orden de entrega sugerido:** 1) componente anillo; 2) menú y «Más»; 3) Hoy; 4) Chats, Resultados y Salud; 5) Campañas; 6) Cerebro y Perfiles.
