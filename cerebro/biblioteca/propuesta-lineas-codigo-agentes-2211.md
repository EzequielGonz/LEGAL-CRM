# Propuesta 22/11: líneas, Jarvis con código y cómo corren los agentes

Pedido del dueño (22/11): oficina por sectores, el cerebro orquesta todo, Jarvis con acceso hasta al código, y un sistema propio para manejar todos los teléfonos (no solo QR, reconexión por código, que también envíe). Base: `telefonos-investigacion-2211.md`.

## 1. Cómo corren los agentes (Gemini o Claude)

| Motor | Qué hace | Cuándo corre | Costo |
|---|---|---|---|
| **Gemini** (dentro del panel) | Jarvis, recepción de pedidos, clasificar, resumir, analizar cifras, evaluar charlas | Al instante, cada vez que se usa | Por uso, dentro del tope de USD 30/mes ya configurado |
| **Claude** (sesiones de Claude Code) | Código del panel, diseño, guiones, textos largos, revisión, seguridad | Cuando la tarea arranca («Arrancar ahora» o tarea programada) | Plan de Claude de los dueños (tiene tope semanal: hoy está agotado hasta el 26/11) |
| **Panel** (sin IA) | Programar, medir, vigilar líneas, enviar con confirmación | Siempre | Sin costo de IA |

Cada puesto de la Oficina muestra su motor (`src/lib/oficina/sectores.ts`).

## 2. El cerebro como orquesta

Orden → **Cerebro (Dirección)** → sectores → Cerebro revisa → tu OK.
1. Recepción (Gemini) ordena el pedido y elige la ruta de sectores (ya existe en la Oficina).
2. El Orquestador (Claude) lee la memoria del cerebro (`cerebro/`, órdenes vigentes, bitácora y el **mapa del código de Graphify** en `cerebro/mapa-codigo/`) y reparte.
3. Cada sector trabaja con sus puestos; Control de calidad revisa; te llega «para tu OK».
4. Lo aprendido vuelve al cerebro (bitácora y `14` si fue una corrección tuya).

Hecho hoy: edificio con el Cerebro al centro y cables a cada sector (`/oficina`, también dentro de `/cerebro`); Dirección pasó a llamarse «Cerebro (dirección)»; mapa del código con Graphify en el cerebro.

## 3. Jarvis tocando el código (propuesta segura)

Jarvis no escribe en producción directo. Circuito:
1. Le pedís a Jarvis «agregá X en Hoy» → Jarvis arma la tarea (`pedir_cambio_de_codigo`) y te pregunta «¿Lo mando a Ingeniería?».
2. Ingeniería (Claude) hace el cambio en una rama aparte, corre pruebas y deja una **vista previa** de Vercel.
3. Jarvis te avisa: «Listo, miralo acá» con el enlace.
4. Si decís «publicalo», se publica. Si no, se descarta. Nada se borra.

Falta para encenderlo: que «Arrancar ahora» dispare una sesión de Claude Code en la nube por cada tarea de Ingeniería (tarea programada con el repositorio), y una ruta que publique la rama aprobada. Depende del plan de Claude (tope semanal).

## 4. Centro de líneas (teléfonos)

**Reparto de líneas**
- **Meta (API oficial)**: solo consultas que llegan directas (anuncios, landing, redes). Estable y sin riesgo de bloqueo. Plantillas para el recontacto.
- **Resto de las líneas**: bases frías, derivaciones automáticas y seguimiento sin plantillas → Centro de líneas propio.

**Qué proponemos**: reemplazar Wasender por un servicio propio corriendo en segundo plano en un servidor chico, con una API abierta y probada:
- **Evolution API** (código abierto, sobre Baileys) o **WAHA**. Recomiendo Evolution API: multilínea, webhooks, envío y recepción, y **vinculación por código de 8 dígitos** (además de QR).
- El panel se comunica por API: enviar, recibir, estado de cada línea (conectada, reconectando, pide vincular), reconectar con código desde el panel, pausar.
- **Reconexión automática** mientras la sesión siga válida; si WhatsApp la cierra, el panel avisa y muestra el código para vincular en un toque.
- Cuidados: ritmo humano (ya existe `ritmo-humano.ts`), tope por línea y calentamiento de chips nuevos, «no me escriban más», nunca la línea de Meta.

**Límites que no cambia ningún sistema**: WhatsApp puede bloquear líneas no oficiales que mandan a bases frías; el teléfono principal de cada número tiene que abrir WhatsApp cada 14 días.

**Costos (requieren tu OK, no se paga nada sin autorización)**: servidor USD 6–20/mes; chips ya estimados en USD 50–60/mes para 13 líneas.

**Fases**
1. Con tu OK, levantar Evolution API en un servidor y conectar **una línea de prueba** (sin bases frías).
2. Pantalla «Teléfonos» en el panel: estado, reconectar por código, pausar, enviar de prueba.
3. Pasar las campañas de una línea desde Wasender; comparar entregas una semana.
4. Migrar el resto; Wasender queda de respaldo hasta que todo ande estable.

**Lo que necesito de vos**: OK para el servidor (USD 6–20/mes) y elegir el proveedor (Railway, Fly.io o un VPS).
