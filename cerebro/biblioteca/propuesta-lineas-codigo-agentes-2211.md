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

## 5. Ampliación (22/11): cómo manejar 7 teléfonos, algunos doble SIM, desde la computadora

Pregunta del dueño: «¿cómo controlo 7 dispositivos, algunos dual SIM, conectando QR o recibiendo códigos? Necesito una especie de emulador».

**Cómo funciona WhatsApp con varios teléfonos**
- Cada número tiene un **teléfono principal** (donde está instalado WhatsApp con ese chip). Evolution API se conecta como **dispositivo vinculado** (igual que WhatsApp Web): el teléfono no tiene que estar prendido todo el tiempo, pero hay que abrir WhatsApp en él cada 14 días o se desvincula.
- Un teléfono doble SIM puede tener **2 números**: uno en WhatsApp y otro en WhatsApp Business (o con «apps duplicadas» en Android). 7 teléfonos con doble SIM ≈ hasta 14 números.
- Vincular se hace con **QR o con código de 8 dígitos**. Con código no hace falta cámara: el panel pide el código a Evolution API y lo muestra; se escribe en el teléfono (WhatsApp → Dispositivos vinculados → Vincular con número).

**La «especie de emulador»: una granja de teléfonos que manejás desde el panel**
1. **Mini PC en la oficina** (o una notebook vieja) siempre prendida, con un **hub USB con alimentación** y los 7 teléfonos enchufados y cargando.
2. **DeviceFarmer (ex OpenSTF)**, gratis y de código abierto: muestra la **pantalla de cada teléfono en el navegador** y deja tocarla con el mouse (abrir WhatsApp, escribir el código, aceptar). Es exactamente «un emulador» pero con los teléfonos reales, así WhatsApp no los marca.
3. **scrcpy + ADB** como respaldo para controlar cualquier teléfono desde la PC.
4. **Reenviador de SMS** en cada teléfono (app gratuita tipo «SMS Forwarder») que manda los códigos que llegan por SMS a un webhook del panel: cuando registrás o re-registrás un número, el código aparece solo en el panel.
5. **Evolution API** (en la misma mini PC o en un servidor) con una instancia por número: envía, recibe y avisa el estado de cada línea.
6. **Pantalla «Teléfonos» en el panel**: los 7 equipos y sus números, batería, conectado o no, «Vincular con código», «Ver pantalla del teléfono» (abre DeviceFarmer), últimos códigos SMS, pausar y límites por línea.

**Por qué no emuladores puros (Android en la nube)**: WhatsApp detecta emuladores y bloquea más rápido; además el código de registro llega por SMS al chip físico. Con teléfonos reales + control remoto se evita las dos cosas.

**Qué hace cada pieza**
| Pieza | Para qué | Costo |
|---|---|---|
| Mini PC + hub USB alimentado | Mantener los 7 teléfonos conectados y cargando | Compra única (requiere OK) |
| DeviceFarmer + scrcpy | Ver y tocar cada teléfono desde el navegador | Gratis |
| Reenviador de SMS | Códigos de verificación al panel | Gratis |
| Evolution API | Enviar, recibir, estado y reconexión de cada número | Gratis (corre en la mini PC o en un servidor USD 6–20/mes) |
| Pantalla «Teléfonos» del panel | Todo junto, en un lugar | Desarrollo propio |

**Fases**
1. Probar con **1 teléfono** en una PC: DeviceFarmer + Evolution API + una línea, solo consultas (no bases frías).
2. Pantalla «Teléfonos» en el panel con estado, vincular con código y ver pantalla.
3. Sumar los 7 teléfonos y el reenviador de SMS.
4. Pasar campañas desde Wasender de a una línea, con ritmo humano y tope por línea.

**Lo que necesito de vos**: OK para comprar la mini PC y el hub (o usar una PC que tengan), y decidir si Evolution API corre en esa PC o en un servidor.

## 6. ¿Qué es «Panel» (sin inteligencia artificial) en la Oficina?

Son puestos que no usan Gemini ni Claude: funciones del propio panel que corren solas con reglas fijas (programar un posteo, medir cifras, vigilar que las líneas estén conectadas, avisar errores, enviar con tu confirmación). No gastan créditos de IA y no «piensan»: hacen siempre lo mismo.
