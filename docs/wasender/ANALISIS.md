# Wasender en el panel · análisis y plan

10/11/2026. Rama `wasender-integracion`, creada desde `main` (`6fd973b`).

**Estado:** especificado. Todavía no hay código, migración ni cambios en Vercel.

## 1. Qué se pidió

Del documento de la responsable («Prompt · Claude nueva integración · Wasender») y de sus respuestas del 10/11:

- **Sección «Wasender»** debajo de Campañas, en los cuatro perfiles, con:
  1. Conexión de la línea por QR.
  2. «Plantillas» propias dentro del panel.
  3. Calidad estimada del número.
  4. Estadísticas de las líneas.
  5. Más adelante, campañas con el mismo armado que las de Meta, pero disparadas por Wasender.
- **Chats:** el chat global se mantiene. Lo que entra y sale por Wasender se ve y se maneja igual que hoy:
  - escribir;
  - prender o apagar el agente;
  - mandar fotos, videos y documentos.
- **Bot:** responde igual que con Meta, con Gemini, el conocimiento v1 y v2 y el entrenamiento actual. Solo cambia el medio de salida.
- **Estadísticas:** correctas y en tiempo real, como el seguimiento en vivo de campañas.
- **Meta no se toca:** se sigue usando, y lo ya hecho con Meta no se pisa, no se rehace ni se edita.
- **Decisiones del 10/11:**
  - Se usan los 3 chips nuevos. Las líneas de Meta quedan como están.
  - Las claves de cada línea se guardan cifradas en la base.
  - La prueba real se hace en la Preview con la base real. Es una excepción expresa a la regla «la Preview solo se mira».
  - Se trabaja en una rama nueva, con análisis completo del código antes de implementar.

## 2. Cómo funciona hoy el panel

Se revisó el código de `main`: 551 archivos y unas 60.000 líneas. Lo que importa para Wasender:

| Pieza | Dónde | Qué hace | ¿Depende de Meta? |
| --- | --- | --- | --- |
| Salida del chat | `src/lib/messaging.ts`, `sendOutboundMessage` | Punto único por donde salen el chat manual, el bot, las citas, el recontacto, el pedido de texto y la disculpa por datos. Antes de enviar revalida pausa, horario, detención y chat tomado; después envía y guarda el mensaje. | Solo en el paso final, que llama a la API de Meta. |
| Cliente de WhatsApp | `src/lib/whatsapp/client.ts` | Texto, foto, video, documento y plantillas por la Graph API, con las variables de cada línea. | Sí. |
| Plantillas de Meta | `campaigns.ts`, `seguimiento/motor.ts`, `landing-seguimiento.ts`, `marketing/presupuestos.ts` | Mandan plantillas aprobadas por Meta. | Sí. |
| Avisos internos | `notify.ts`, `notify-marketing.ts` | Avisan a los teléfonos internos. | Sí. |
| Entrada | `/api/webhooks/whatsapp` → `webhooks/process.ts` → `handleInboundMessage` (`inbound.ts`) | Valida la firma de Meta, deduplica y guarda el mensaje. Actualiza la oportunidad y le pasa el turno al bot. | La ruta y la traducción del formato, sí. `handleInboundMessage`, no. |
| Estados de entrega | `delivery-status.ts`, `applyDeliveryStatus` | Marca enviado, entregado, leído o falló en el mensaje y en la campaña. | Recibe el formato de Meta, pero acepta uno equivalente. |
| Bot | `ai-agent/agent.ts`, `runAgentTurn` | Gemini con conocimiento v1 y v2, registro en `agent_turn_logs`, lectura de las plantillas enviadas desde el historial. | No. Decide el texto y se lo pasa a `sendOutboundMessage`. |
| Chats | `inbox/conversation-thread.tsx` (consulta cada 5 s) y `/api/conversations/[id]/messages` | Chat global, tomar el chat o devolverlo a la IA, adjuntos. | No. |
| Adjuntos entrantes | `adjuntos/guardar.ts`, bucket privado `adjuntos-originales` | Descarga el original de Meta por `media_id` y lo guarda. | La descarga, sí. |
| Líneas | Tabla `profile_lines`, `profiles.ts`, `estado-linea.ts`, `calidad-servidor.ts`, Salud del sistema | `credential_key` es el prefijo de las variables de Vercel. El estado y la calidad se consultan a Meta. | Sí. |
| Menú | `src/lib/menu.ts` | Hoy · Chats · Contactos · Campañas, y en Configurar: Bot IA · Línea y plantillas · Redes · Ajustes. | No. |

**Hechos que condicionan el diseño**
- **Una conversación por área:** cada persona tiene una sola conversación de WhatsApp por área. `conversations` es única por contacto y canal, y `channels` es única por área y tipo. Si alguien escribe a una línea de Meta y a una de Wasender del mismo perfil, cae en la misma conversación.
- **Tabla de líneas:** las líneas de Meta viven en `profile_lines`, y Salud, el estado de línea y la calidad recorren toda esa tabla consultando a Meta. Una línea de Wasender ahí adentro aparecería con errores en esas pantallas. Por eso va en una tabla propia.
- **Base real** (consulta de solo lectura del 10/11):
  - 4 líneas de Meta activas;
  - 45 migraciones aplicadas;
  - ninguna tabla de Wasender.
- **Vercel:** protege las Preview con inicio de sesión (Standard Protection). Wasender no puede llamar a la Preview sin el bypass para automatización.
- **Recontacto IA:** está activo en los cuatro perfiles desde el 24/10. Escribe 2 h después de la última respuesta del bot si la persona dejó de responder, dentro de las 24 h.

## 3. Qué ofrece Wasender

Documentación leída el 10/11 en wasenderapi.com/api-docs.

**Autenticación**
- Un token de cuenta (Personal Access Token) para crear, ver y borrar líneas («sesiones»).
- Cada línea tiene su propia clave para enviar y consultar su estado.
- Al crear una línea, la respuesta trae su clave y su secreto de webhook.

**Conexión**
- Se pide el QR: llega como texto y el panel lo dibuja.
- Estados posibles: conectando, conectada, desconectada, necesita QR, necesita passkey, sesión cerrada y vencida.
- **No figura:** cuánto dura el QR ni cuánto dura una sesión conectada.

**Envío**
- Un solo endpoint (`/api/send-message`) para texto, imagen, video, documento (hasta 100 MB), audio, sticker, contacto y ubicación, siempre por enlace.
- También permite citar un mensaje, marcarlo como leído y mostrar «escribiendo…».
- La respuesta trae un `msgId` numérico.

**Webhook**
- Eventos: mensaje recibido, mensaje nuevo (entrante o saliente), mensaje enviado, cambio de estado, estado de la línea y QR actualizado.
- Estados de entrega: 0 error, 1 pendiente, 2 enviado, 3 entregado, 4 leído y 5 reproducido.
- El encabezado `X-Webhook-Signature` tiene que coincidir con el secreto de la línea.
- **No figura:**
  - si reintentan;
  - si el `msgId` del envío coincide con el id de los avisos de entrega;
  - si los mensajes escritos desde el propio celular llegan al webhook.
- Algunos contactos llegan con un identificador interno de WhatsApp («LID») en vez del número; el número viene aparte (`senderPn` o `cleanedSenderPn`).

**Archivos recibidos**
- Se descifran con `/api/decrypt-media`, que devuelve un enlace válido por 1 hora.

**Historial**
- No hay forma documentada de traer chats ni mensajes anteriores: los chats empiezan cuando se conecta la línea.

**Límites**
- Prueba gratis: 3 días, 1 mensaje por minuto y 50 por día.
- Planes pagos: 256 por minuto.
- Con la «protección de cuenta»: 1 mensaje cada 5 s.
- Recomiendan de 1 a 5 envíos en paralelo por línea y avisan que la concurrencia alta es una de las causas más comunes de bloqueo.

**Precios** (home, mensuales)
- Basic: US$6, 1 número.
- Pro: US$15, 3 números.
- Plus: US$30, 6 números.
- Business: US$45, 10 números.
- Reembolso dentro de los 7 días.

**Términos**
- No están afiliados a WhatsApp, y quien los usa acepta posibles bloqueos.
- Exigen consentimiento previo del destinatario y prohíben el spam y los envíos masivos.

## 4. Cómo lo implementaría sin tocar Meta

### Principio

Todo lo de Wasender es nuevo: tablas propias, el módulo `src/lib/wasender/`, el webhook `/api/webhooks/wasender` y pantallas propias. Lo de Meta no se reescribe ni se edita.

**No se tocan:**
- `whatsapp/client.ts`, `meta/client.ts` y la ruta `/api/webhooks/whatsapp`;
- `webhooks/process.ts` y `whatsapp-parse.ts`;
- `campaigns.ts` y `plantillas/*`;
- `seguimiento/motor.ts` y `landing-seguimiento.ts`;
- `marketing/presupuestos.ts`, `notify*.ts`, `estado-linea.ts` y `calidad-servidor.ts`;
- la tabla `profile_lines`, la pantalla de líneas y plantillas, y Salud.

### El único agregado en un archivo compartido

**`sendOutboundMessage`** es el punto por donde salen el chat manual y el bot. Para que el bot y el chat respondan por Wasender sin duplicar el chat ni el bot, ahí hace falta un agregado de unas pocas líneas.

**Antes del envío por Meta** se pregunta si la conversación habla por Wasender:
- Si habla por Wasender, el mensaje sale por Wasender.
- Si no, sigue exactamente el código de hoy.

Las validaciones previas quedan como están y valen igual para Wasender: pausa, horario, detención y chat tomado. Las pruebas actuales tienen que seguir pasando sin cambios.

**Otros dos agregados chicos, que no son de Meta:**
- el ítem «Wasender» en `menu.ts`;
- opcionalmente, una etiqueta «Wasender» en el encabezado del chat.

### Por dónde sale cada mensaje

- **Línea de origen:** cada mensaje que entra por Wasender se guarda con `proveedor: wasender` y la línea por la que llegó.
- **Respuestas:** si el último mensaje de la persona llegó por Wasender, la respuesta (bot o manual) sale por esa misma línea de Wasender. Si llegó por Meta, sale como hoy.
- **Sin mensajes de la persona:** si la conversación la empezó una campaña de Wasender, sale por esa línea.
- **Línea caída:** si la línea de Wasender está desconectada o archivada, el mensaje no sale y el chat muestra por qué. Nunca se pasa a otra línea sola, igual que la regla de hoy entre perfiles.
- **`line_id` de Meta:** Wasender no lo toca. Usa una columna propia (`wasender_line_id`).

### Líneas por QR

**Agregar línea:**
- El panel crea la sesión con el token de la cuenta, con protección de cuenta activada.
- Se configuran el webhook propio y estos filtros: ignorar grupos, canales y difusiones, no guardar mensajes en Wasender y no marcar como leído solo.
- Después muestra el QR, que se escanea desde el celular del chip.

**Estado:**
- Se ve en vivo: conectada, necesita QR, desconectada.
- Hay botones de reconectar y desconectar.
- La clave y el secreto de la línea se guardan cifrados con AES-256-GCM, el mismo esquema del token de Search Console, con una clave propia (`WASENDER_CLAVE_CIFRADO`).

**Al crearse:** la línea queda **apagada**. Prenderla, y prender que responda el bot, es una decisión en la pantalla.

### Entrada (webhook propio)

- **Línea y firma:** `/api/webhooks/wasender?linea=<id>` ubica la línea y compara la firma con su secreto, en tiempo constante. Sin firma válida no se procesa nada y el evento queda retenido.
- **Mensaje recibido:**
  1. Se traduce: número, nombre, tipo y texto.
  2. Si llega con LID, se usa `senderPn`. Si no hay número, queda retenido sin adivinar.
  3. Va a `handleInboundMessage`, sin modificarlo.
  4. De ahí siguen igual que hoy: deduplicación, contacto (el mismo de Meta si es el mismo número), oportunidad, fuente, detenciones y bot con v1 y v2.
- **Estados de entrega:** se convierten al formato equivalente y se guardan con `applyDeliveryStatus`, también sin modificarlo.
- **Estado de la línea y QR:** se guardan en la línea, para la pantalla.
- **Tiempo de respuesta:** al principio se procesa en el momento, como el webhook de Meta, que tiene 60 s. Si Wasender corta antes, se responde enseguida y se procesa después. Un reintento no duplica nada, por la deduplicación.

### Mensajes escritos desde el celular

Como hay acceso total al WhatsApp, alguien puede escribir desde el teléfono.

**Si Wasender los informa:**
- aparecen en el chat del panel como mensaje de una persona;
- el chat queda tomado por una persona, con la misma función que usa «Tomar el chat», y el bot deja de responder ahí.

**Eco de lo que manda el panel:** Wasender también avisa los mensajes que salen desde el panel. Como no está documentado si su id coincide con el `msgId`, cada envío del panel queda marcado como pendiente de confirmación. El aviso que llega se empareja por conversación, texto y hora, así no se duplica ni pausa al bot por error.

### Archivos

**Salientes:** salen por enlace firmado, igual que hoy.

**Entrantes:**
1. Se descifran con Wasender en el momento, porque el enlace dura 1 hora.
2. Se guardan en el mismo bucket privado y en la misma tabla de adjuntos, así el chat los muestra como siempre.
3. Al bot se le pide que lo escriba, con la regla de hoy.

### «Plantillas» propias

- **Dónde:** tabla propia por perfil, con nombre, uso (campaña, seguimiento o manual), texto y variables (`{{nombre}}`, `{{marca}}`, `{{asesor}}`).
- **Variantes:** cada plantilla puede tener variantes del mismo mensaje, así no salen todos idénticos.
- **Aprobación:** no hay aprobación de Meta. El panel avisa si falta una variable o si el texto es muy largo.
- **Historial:** cada envío guarda el nombre de la plantilla y el texto, así el bot lo ve en el historial como ve hoy las de Meta.

### Calidad estimada y estadísticas en vivo

**Calidad por línea**, con datos propios de los últimos 7 días:
- entregados sobre enviados;
- leídos;
- respuestas al primer mensaje;
- bajas y quejas;
- fallos;
- desconexiones;
- volumen diario frente a la antigüedad del número.

Da «Alta», «Media» o «Baja» con los motivos, y siempre dice que es una **estimación**, no un dato de WhatsApp.

**Estadísticas por línea y por perfil:** enviados, entregados, leídos, respuestas, respuestas del bot y captados. Se actualizan cada pocos segundos, como el seguimiento en vivo de campañas. Las estadísticas generales del panel siguen contando todo, porque los mensajes van a las mismas tablas.

### Campañas con Wasender (más adelante)

- **Motor:** propio, con el mismo armado que las de Meta: base, plantilla propia, línea y días.
- **Lo que reutiliza:** la selección de destinatarios y las reglas actuales:
  - lunes a sábado de 8 a 21;
  - pausa general y detenciones o bajas;
  - tres ciclos como máximo.
- **Lo que suma:** tope diario por línea con calentamiento del número y espera variable entre mensajes.
- **Campañas de Meta:** no se tocan.
- **Decisión pendiente para esa etapa:** Wasender exige consentimiento previo y las bases frías no lo tienen. Es el uso que más bloquea números.

## 5. Datos

Migración `0600_wasender`. Solo agrega, se puede repetir sin error y no borra nada.

- **`wasender_lineas`**:
  - perfil y área, nombre y número visible;
  - id de la sesión en Wasender, estado y último cambio;
  - clave y secreto cifrados;
  - si está habilitada (apagada por defecto) y si responde con el bot;
  - archivo con fecha y motivo.
- **`wasender_plantillas`**: perfil, nombre, uso, texto, variantes, activa y archivo con motivo.
- **`wasender_eventos`**: registro de lo que llega por el webhook, para seguimiento y para retener lo que no se puede procesar.
- **`conversations.wasender_line_id`**: columna nueva y opcional.

Todas las tablas nuevas llevan:
- RLS, sin permisos para la clave pública;
- disparador que impide borrar;
- registro de cambios en `ops_change_log` desde las rutas.

Antes de aplicarla se revisa el historial real de la base, como pide la regla. Se aplica en la etapa 2, cuando la Preview la necesite.

## 6. Configuración en Vercel (primero solo en Preview)

| Variable | Quién la carga | Para qué |
| --- | --- | --- |
| `WASENDER_PAT` | La responsable (token de la cuenta de Wasender) | Crear y manejar las líneas |
| `WASENDER_CLAVE_CIFRADO` | La responsable (una frase larga al azar) | Cifrar la clave y el secreto de cada línea en la base |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Vercel la agrega sola al activar «Protection Bypass for Automation» | Que Wasender pueda llamar al webhook de la Preview, que hoy pide inicio de sesión |
| `WASENDER_HABILITADO` | Se carga `true` solo en Preview | Interruptor general: sin esta variable, Wasender no envía nada aunque el código esté publicado |

Ninguna clave pasa por el chat, el código ni los registros.

## 7. Reglas del proyecto que siguen valiendo

- **Respuestas a quien escribe:** 24 h si el perfil lo tiene habilitado, el agente está activo, no hay pausa y el chat no está tomado.
- **Lo que inicia la empresa:** lunes a sábado de 8 a 21, con la pausa de envíos.
- **Detenciones y bajas:**
  - frenan lo que inicia la empresa;
  - el número de una menor no recibe nada automático.
- **Sin prospectos en las pruebas:**
  - ningún mensaje de prueba a terceros, solo entre números de la responsable;
  - ningún dato real en ejemplos.
- **Nada se borra:** se archiva con motivo.
- **Lo que se habilita:** publicar código no habilita envíos. Las líneas de Wasender nacen apagadas.

## 8. Riesgos y límites

- **Bloqueo del número:** es no oficial. Por eso se usan solo los 3 chips nuevos. Ritmo bajo, protección de cuenta y sin campañas frías hasta decidirlo.
- **Celular:** el número tiene que seguir activo en su teléfono. WhatsApp cierra los dispositivos vinculados si el celular no se usa por unos 14 días.
- **Historial:** no se pueden traer chats anteriores a la conexión.
- **Lo que no está documentado y se confirma en la prueba real:**
  - id del envío contra id del aviso de entrega;
  - reintentos del webhook;
  - si llegan los mensajes escritos desde el celular;
  - cuánto dura el QR y cuánto dura la sesión.
- **Producción durante la prueba:** la Preview y producción comparten la base, y producción no conoce Wasender.
  - Si en un chat de prueba el bot responde y el que prueba no contesta, a las 2 h el recontacto de producción intentaría escribir por Meta. Meta lo rechazaría, salvo que ese número le haya escrito a la línea de Meta en las últimas 24 h.
  - Para evitarlo: al terminar cada prueba, «Tomar el chat» (o que el que prueba escriba último). Otra opción es apagar el recontacto del perfil de prueba durante la prueba; esa decisión es de la responsable.
  - Al publicar Wasender en producción, el recontacto ya sale por la línea correcta.
- **Motores de Meta que no saben de Wasender** (no se tocan ahora; antes de usarlos con conversaciones de Wasender hay que decidir qué hacen):
  - el seguimiento automático, hoy apagado;
  - la entrega de presupuestos de Marketing;
  - las plantillas de seguimiento de landing.

## 9. Etapas

| Etapa | Qué incluye | Qué se ve en la Preview |
| --- | --- | --- |
| 1 | Módulo `wasender` (cliente, cifrado, traducción del webhook, regla de por dónde sale cada mensaje), el agregado en `sendOutboundMessage` y pruebas con Wasender simulado | Nada todavía: Meta sigue igual |
| 2 | Migración `0600` y sección «Wasender» en los cuatro perfiles: agregar línea, QR, estado en vivo, reconectar | Se conecta un chip escaneando el QR |
| 3 | Webhook: mensajes, bot, estados de entrega, archivos y mensajes desde el celular | Se escribe al chip desde otro celular tuyo y responde el bot en el chat del panel |
| 4 | Plantillas propias, calidad estimada y estadísticas en vivo | Plantillas y tablero de cada línea |
| 5 | Campañas con Wasender | Cuando se decida, con los resultados de las pruebas |

**Cada etapa:**
- pasa tipos, lint, build y pruebas unitarias antes de subir;
- se documenta en `docs/wasender/` (`ENTREGA.md`, `INFORME.md` y `MIGRACIONES.md`).

**`main` y producción:** se tocan solo cuando la responsable apruebe la Preview.

## 10. Lo que hace la responsable

1. **Cuenta de Wasender.** La prueba de 3 días, sin tarjeta, alcanza para conectar y chatear (1 mensaje por minuto). Para los 3 chips, el plan Pro (US$15 por mes) sale menos que 3 Basic (US$18). El pago lo decide y lo hace la responsable.
2. **Los 3 chips nuevos:** con WhatsApp instalado en un celular cada uno. Mejor WhatsApp Business, con el nombre y el logo de la marca. Nunca escanear el QR con una línea que ya está en Meta.
3. **Token de la cuenta:** en Wasender, Settings → Personal Access Token. Cargarlo en Vercel como `WASENDER_PAT`, solo en Preview.
4. **Clave de cifrado:** en Vercel, `WASENDER_CLAVE_CIFRADO` con una frase larga al azar, solo en Preview.
5. **Bypass para automatización:** en Vercel, Settings → Deployment Protection → Protection Bypass for Automation, botón para generar el secreto.
6. **Confirmar el agregado** en `sendOutboundMessage` para empezar la etapa 1.
