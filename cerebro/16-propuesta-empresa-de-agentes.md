---
description: Propuesta (22/11) para convertir el cerebro en director ejecutivo de una "empresa" de agentes por área, con escritorios visibles en el panel, un asistente personal tipo Jarvis y automatización por etapas. Nada aplicado.
actualizado: 2026-11-22
---

# El cerebro como director de una empresa de agentes (propuesta, sin aplicar)

Pedido del dueño (22/11): un supercerebro que entienda todo, esté conectado a todas las sesiones, orqueste los cambios con lo ya aprendido, arme áreas con agentes (SEO, redes, diseño, análisis…), lea estadísticas e informes, rehaga estrategias con lo que funciona, y un asistente personal tipo Jarvis dentro del panel. Siempre enfocado en los 4 rubros.

## 1. La idea en una frase

Un **director** (el cerebro) que no trabaja con las manos: lee todo, decide qué hace falta, reparte tareas a **escritorios** especializados, revisa lo que entregan y guarda lo aprendido. Ustedes hablan con él (desde este chat, desde el panel o desde el celular) y aprueban.

## 2. Lo que ya existe y sirve de base

| Pieza | Estado |
|---|---|
| Memoria compartida (`cerebro/` en el repo) | Hecho. Cada sesión de Code del repo la carga sola al arrancar (hook `cerebro-al-arrancar.sh`) |
| Pantalla `/cerebro` en el panel con cifras vivas, salud y pedidos | Hecho (21/11) |
| Bandeja para Claude (cola de pedidos) | Hecho; hoy es una sola fila de tareas sin área |
| Asistente del panel (Gemini) y Laboratorio de bots | Hechos |
| Crear y mandar mensajes a otras sesiones de Code desde esta | Disponible (herramientas de sesiones remotas) |
| Tareas programadas | Disponibles; las pausaron el 21/11 |
| Skills por área (redes, SEO, diseño, datos, bots) | Instaladas; lista en `11-equipo-y-herramientas.md` |

## 3. El organigrama

| Escritorio | Qué hace | Lee | Entrega | Skills principales |
|---|---|---|---|---|
| **Dirección (cerebro)** | Prioriza, reparte, revisa, guarda memoria. Plan semanal | Todo | Plan de la semana, decisiones, pedidos a los escritorios | todas; `task-observer` |
| **Análisis** | Cifras de campañas, bots, redes, landings. Qué funciona y qué no | Supabase, Metricool (analítica), Search Console/GA4 cuando los conecten | Informe diario, semanal y mensual (lo pidieron en Perfiles) | `dataviz`, `windsor-ai`/Metricool, `analytics-and-reporting` |
| **Redes y contenido** | Estrategia por rubro, bocetos, producción y programación en Metricool | Informe de Análisis, lo que mejor rindió | Boceto de un rubro → aprueban → produce → programa | `social-media-skills:*`, `kocos-contenido-y-publicacion`, `remotion`, `hook-writer` |
| **Diseño y animación** | Panel, landings, piezas. Calidad visual y animación | Guía de estilo del dueño (`14`), referencias | Propuestas visuales con vista previa | `frontend-design`, `ui-ux-pro-max`, `interface-design`, `21st`, `remotion` |
| **SEO y landings** | SEO técnico, contenido, IA (AEO), conversión | Search Console, auditorías | Mejoras por PR, informe mensual | `seo-audit`, `ai-seo`, `schema`, `cro`, `kocos-landings-seo-y-conversion` |
| **Bots y captación** | Calidad de los bots, plantillas, laboratorio | Chats, informes de mejora, Salud | Propuestas de versión (suman, no borran) | `kocos-agentes-entrenamiento-y-evaluacion`, `kocos-crm-reglas-de-captacion` |
| **Ingeniería** | Errores (72 h, separación por rubro), gestor de chips, salud | Código, Salud, Vercel | PR con pruebas; producción solo con OK | `superpowers:*`, `backend-design`, `kocos-crm-pruebas-de-aceptacion` |
| **Asistente personal (Jarvis)** | Ponerlos al día: qué pasó, qué falta, qué decidir | Todo lo anterior resumido | Resumen al abrir el panel, recordatorios, respuestas | asistente del panel + memoria del cerebro |

**Enfoque fijo de todos:** los 4 rubros, captar y derivar. Lo que no sirve al negocio no entra.

## 4. Cómo trabajan juntos

1. **Una cola por área.** La Bandeja para Claude suma el campo «área» (Dirección, Análisis, Redes, Diseño, SEO, Bots, Ingeniería). Cualquiera (ustedes, el cerebro o un escritorio) deja un pedido; el escritorio de esa área lo toma.
2. **Un chat por escritorio.** En Claude Code, una sesión fija por área con nombre claro («Cerebro · Dirección», «Diseño», «Redes», «SEO y landings», «Bots», «Ingeniería», «Análisis»). Todas cargan el cerebro al arrancar y, al cerrar, escriben lo aprendido en `cerebro/areas/<área>.md` y en la bitácora. Así cada chat se especializa sin perder el contexto general.
3. **El cerebro reparte.** Desde la sesión de Dirección se pueden crear sesiones y mandarles tareas; el cerebro revisa la entrega antes de mostrársela a ustedes.
4. **Ritmo automático (con su OK).** Tareas programadas: lunes a primera hora, Análisis arma el informe semanal y Redes propone la estrategia de la semana; cada mañana, el resumen para Jarvis. Hoy están pausadas por pedido de ustedes.
5. **Aprende de las correcciones.** Cada vez que corrigen algo, queda en la tabla de errores de `14-estilo-del-dueno.md` y la skill del área se actualiza (`task-observer`). La idea es que la misma corrección no haga falta dos veces.

## 5. Lo que se ve en el panel

- **Oficina** dentro de `/cerebro`: un escritorio por área, como en el video de referencia, con su estado (trabajando, esperando su OK, listo), la última entrega y la próxima tarea. Animado, con la estética del cerebro.
- **Jarvis**: al abrir el panel, un resumen corto: qué pasó desde la última vez, qué espera su decisión, qué conviene mirar hoy. Se le puede preguntar cualquier cosa del negocio; lo simple lo contesta el asistente (Gemini, ya pago dentro de los USD 30); lo complejo lo manda a la bandeja del escritorio que corresponda.
- **Informes** diario, semanal y mensual en Perfiles (ya lo habían pedido).

## 6. Etapas

| Etapa | Qué | Costo | Requiere |
|---|---|---|---|
| 1 | Bandeja con área + `cerebro/areas/` + reglas de cierre por escritorio | Nada | Su OK |
| 2 | Oficina en `/cerebro` (escritorios con estado) | Nada | Su OK |
| 3 | Jarvis: resumen al abrir el panel y preguntas con contexto del cerebro | Gemini dentro de los USD 30 | Su OK |
| 4 | Informes diario/semanal/mensual en Perfiles | Nada (lee la base) | Su OK |
| 5 | Ritmo automático con tareas programadas por escritorio | Uso de Claude (créditos del plan) | Su OK y tope de uso |
| 6 | Conectar Search Console, GA4 y analítica de Metricool para Análisis | Nada | Accesos de ustedes |

## 7. Límites honestos

- Los escritorios en la nube no pueden publicar ni lanzar campañas solos: la publicidad y las campañas las lanzan ustedes; la producción del panel, solo con su OK.
- Cada sesión automática consume uso del plan de Claude; por eso el ritmo automático tiene un tope que definen ustedes.
- Jarvis dentro del panel corre con Gemini (rápido y barato). Claude trabaja desde las sesiones, no dentro del panel, salvo que autoricen usar la API de Claude con costo.
