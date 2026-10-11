# Etapa 1 — Estructura general del CRM · Informe de implementación

Autorización: Vita, 9/10/2026 (bloques 1.0 a 1.9).
Continuación: respuestas del 10/10/2026 a las preguntas 12, 21, 22, 24, 28, 32, 34 y 39 (ver
"Respuestas del 10/10" al final de los bloques), y correcciones de la revisión del 10/10 con el
guardado privado de originales (11/10, ver "Revisión del 10/10 antes del despliegue").
La Etapa 2 y la Etapa 3 no empezaron.
Este informe se completa bloque por bloque. Cada bloque indica qué se hizo,
cómo se comprobó y qué queda pendiente de configuración o de prueba.

Reglas vigentes durante toda la etapa (pregunta 38):

- Campaña "BASE 21 9" pausada, con sus 725 destinatarios en cola, historial y contadores.
- Respuestas automáticas de la IA pausadas. El estado de cada conversación
  (IA activa o pausada por atención humana) se conserva tal cual.
- Los mensajes entrantes se siguen recibiendo, guardando y mostrando para atención manual.
- Nada se reactiva automáticamente al terminar la etapa.

---

## 1.0 Preparación, respaldo y seguridad operativa

### Inventario

| Elemento | Estado encontrado |
|---|---|
| Código | GitHub `EzequielGonz/LEGAL-CRM`, rama `main`, commit `7c721bf` ("Aplicar pipeline de Marketing"). Next.js 14 + Supabase. |
| Base | Supabase `legal-crm` (sa-east-1, PostgreSQL 17). 22 tablas en `public`, 10 tipos, 23 políticas (todas abiertas: `is_admin()` devuelve verdadero), 26 relaciones, 45 índices. |
| Archivos | Bucket privado `bases-originales`: `1500_NUEVOS_PRIORIDAD.xlsx` (6,2 MB, vinculado a la base "ART - NUEVOS PRIORIDAD 1") y `ART_Caba_Pba.xlsx` (36 KB, sin base registrada). |
| Tarea programada | No es un cron de Vercel: es `pg_cron` dentro de Supabase (job 1 `campaigns-tick`, cada minuto, llama a `/api/campaigns/tick` con la clave del cron). |
| Vercel | Proyecto `legal-crm`, producción en `legal-crm-nine.vercel.app`. 29 variables privadas (solo se leyeron los nombres). Las de Supabase, Gemini y el cron existen solo en Producción. |
| Líneas | Variables para WhatsApp Civil, Penal y Marketing; Facebook/Instagram Civil y Penal. Agencia 0km y Coberturas no tienen línea configurada. |

### Pausa operativa (pregunta 38)

| Acción | Antes | Después | Registro |
|---|---|---|---|
| Agentes IA (5 perfiles) | activos | `active = false` | `ops_change_log` #1 |
| Tarea `campaigns-tick` | activa | inactiva (no borrada) | `ops_change_log` #2 |
| Campaña "BASE 21 9" | pausada, 725 en cola, 200 enviados | sin cambios | `ops_change_log` #3 |
| Conversaciones | 1.572 con IA activa, 38 pausadas por atención humana | sin cambios | `ops_change_log` #4 |
| Interruptor general | — | `system_settings.automation_pause` (IA y envíos automáticos en pausa; reactivación solo por decisión expresa) | — |

El ingreso de mensajes no se tocó: el webhook sigue guardando cada mensaje y
la conversación queda visible en el Inbox. Con el agente inactivo, el
código existente corta antes de responder (`runAgentTurn` sale si el agente no está activo).

### Respaldo y restauración probada

1. **Copia dentro de Supabase** (esquema privado `respaldo_etapa1`, 9/10/2026 22:08 UTC):
   22 tablas + registro de archivos de Storage + definición del cron.
   Huella por tabla (cantidad de filas y md5 del contenido ordenado): 22/22 idénticas a producción.
2. **Copia fuera de Supabase**: los datos se exportaron y se restauraron en
   una base PostgreSQL 16 separada. Resultado: 22/22 tablas con la misma
   huella; 10 tipos, 23 políticas, 26 relaciones validadas, 45 índices,
   0 registros huérfanos.
3. **Lectura por la misma capa de API del panel** (PostgREST sobre la copia):
   4.266 contactos; Inbox con contacto vinculado; mensajes por conversación;
   725 destinatarios en cola; 1.489 filas de la base importada.
4. **Archivo de respaldo entregado** (`Respaldo_Etapa1_2026-10-09.zip`):
   volcado estándar de PostgreSQL + datos por tabla + estructura + scripts.
   Se restauró en otra base vacía: 22/22 tablas idénticas.

### Prompts actuales como historial

Tabla `ai_agent_prompt_history`: 5 capturas (civil, penal, agencia_0km,
coberturas_medicas, marketing) con huella SHA-256. Son de solo lectura
(un disparador impide modificarlas o borrarlas, probado) y por diseño
no pueden marcarse como publicables ni usarse para volver a una versión anterior.

### Pendientes del bloque

- ~~Copia del contenido de los 2 archivos de Storage~~: resuelto el 10/10. Vita los
  descargó y los compartió; coinciden byte a byte con Storage (mismo tamaño y md5 = eTag).
- Este entorno de trabajo no puede descargar dependencias de npm (el
  registro está bloqueado por la política de red), así que el panel no se
  ejecuta acá. La lógica se verifica con pruebas unitarias y de integración
  contra la copia restaurada de la base; la compilación completa la hace Vercel al publicar.

Migración documentada: `supabase/migrations/0100_etapa1_preparacion.sql`.

---

## 1.1 Acceso y seguridad

### Qué se implementó

- **PIN general de 6 números** (`/login`). Sin cuentas personales ni correo. El PIN se guarda solo como hash (scrypt) en `access_pin`.
  - Valor inicial: variable privada `ACCESS_PIN` (se usa una vez, si todavía no hay PIN guardado).
  - Cambio: Configuración → Acceso, pidiendo el PIN actual. Rechaza PIN repetidos o seguidos (000000, 123456…).
  - Recuperación: variable privada `ACCESS_PIN_RESET`; cada valor nuevo se aplica una sola vez.
- **Sesión sin vencimiento programado**: cookie firmada (HttpOnly) que se renueva sola mientras se usa. Se cierra a mano ("Cerrar sesión" en el menú, en el teléfono y en las pantallas de inicio). "Cerrar sesión en los demás dispositivos" pide el PIN.
- **5 intentos fallidos → pausa de 15 minutos solo para ese origen** (IP guardada con hash). No cierra sesiones abiertas ni bloquea a los demás. Registro de accesos en Configuración.
- **Todo el panel y la API exigen sesión** (middleware). Quedan públicas solo: ingreso, webhooks de Meta (con firma), tarea programada (con su clave) y la landing (con límite de 5 envíos por hora por origen).
- **Firma de Meta (X-Hub-Signature-256)** en los webhooks de WhatsApp e Instagram/Facebook. Lo que llega sin firma válida, de una línea sin perfil o con error al guardarse **no se pierde**: queda en Revisión → Mensajes retenidos para reprocesar o descartar.
- **Mensajes de cualquier tipo**: audios, imágenes, documentos, ubicaciones, contactos compartidos, reacciones y respuestas de botones se guardan y se ven en el Inbox (antes solo se guardaban texto y botones). La IA solo recibe los que puede leer.
- **Deduplicación**: un mensaje repetido por Meta no se guarda dos veces ni dispara respuestas (índice único + verificación previa). El único duplicado histórico (21/9) se conservó y quedó marcado.
- **Pausa general dentro del código**: con la pausa activa no responde la IA ni sale ningún envío automático (campañas, seguimientos, prospección, plantilla de landing). Se cambia solo desde Configuración → Pausa general, con PIN. Reanudar no activa agentes ni campañas.
- **Lecturas del lado del servidor**: el panel ya no usa la clave pública para leer tablas (Inbox y perfiles consultan al servidor cada pocos segundos).
- **Cierre de la clave pública** (`0199_etapa1_cierre_rls.sql`): se aplica **después** de publicar esta versión. Hoy la clave pública todavía puede leer todos los contactos; el cierre lo corrige.

### Comprobaciones

| Comprobación | Resultado |
|---|---|
| Pruebas unitarias (sesión, PIN, firma de Meta, tipos de mensaje, estados de entrega, redirección segura) | 10/10 |
| Pausa por origen en la base: 5 fallos → 15 min; otro origen libre; al vencer vuelve a contar | OK (copia local) |
| Mensaje repetido rechazado por el índice único | OK (copia local) |
| Cierre de la clave pública: anon y authenticated sin acceso; clave de servicio lee todo | OK (copia local, en transacción revertida) |
| Revisión de tipos de todo `src` | Sin errores |
| Compilación completa de Next.js | Pendiente: se hace en Vercel al publicar (ver Comprobaciones de la etapa) |

---

## 1.2 y 1.3 Detención persistente, modelo de datos y migración

### Modelo nuevo (aditivo: no se borró ni se cambió ninguna columna existente)

- `opportunities`: oportunidad separada del contacto con dimensiones que coexisten:
  contacto y respuesta, captación, seguimiento, atención y derivación (manual).
  Guarda el valor histórico de contacto y conversación, el grupo de la reconciliación y una marca que la excluye del seguimiento automático nuevo.
- `opportunity_events`: historial de cada cambio con autor (IA, operador, sistema o migración). Solo admite agregar filas.
- `contact_detentions`: detención por perfil y por teléfono normalizado, con motivo y todos los motivos registrados. Sigue vigente ante una carga nueva, otra campaña, otra línea u otro agente. No se borra: se levanta con motivo escrito (con confirmación extra si es un pedido de no contacto o el número de una menor).
- `incidences`: incidencias para revisar desde el panel (Revisión).
- Estados de entrega y lectura en cada mensaje (`delivery_status`) y en el historial `message_status_events`.
- La base mantiene la oportunidad al día sola (disparadores): contacto nuevo → oportunidad; mensaje entrante → "Respondió"; envío → "Contactado". Si algo falla, el mensaje se guarda igual.

### Uso de la detención

- Nada automático sale a un contacto detenido: IA, campañas (queda "opt_out" con el motivo, sin enviar), seguimientos y plantillas.
- A mano se puede escribir, salvo pedido de no contacto o número de una menor (solo si la persona vuelve a escribir).
- Si escribe un contacto detenido, la IA no responde y la oportunidad queda en "Requiere intervención humana".

### Migración de la sección 5.1 (aplicada en producción el 10/10/2026, 00:55 UTC)

| Grupo | Contactos | Estado nuevo |
|---|---|---|
| A1 | 1.931 | Sin contactar |
| A2 | 725 | Sin contactar, en la cola de la campaña pausada (no se reanudó) |
| A3 | 190 | Contactado sin respuesta (envío con identificador) |
| A4 | 1.350 | Contactado sin respuesta (evidencia más débil) |
| B1–B7 | 55 | Respondió · Perdido · detenido con su motivo |
| B8–B11 | 9 | Respondió · resultado histórico · motivo no confirmado (retenido, sin recontacto) |
| B12–B14 | 6 | Respondió · con su incidencia (B14 no es Captado) |
| **Total** | **4.266** | |

Diferencias con la tabla aprobada, por la regla "el pedido de no contacto prevalece siempre": 3 contactos pasan a B5 (uno de B4, el de B6 y uno de B8). Se guardaron ambos motivos y el grupo original. Por eso B4 = 10, B5 = 6, B6 = 0 y B8 = 4.

Incidencias creadas: 14 último mensaje sin respuesta, 3 preguntaron por el origen de sus datos (la tabla decía 2), 1 número de una menor (bloqueado; no figura en otras bases), 1 número de un tercero (no se usa), 20 estados distintos entre contacto y conversación, 2 cierres ganados sin aceptación, 2 conversaciones abiertas, 9 motivos no confirmados, 1 pedido de supresión de datos (no se borró nada; decide el estudio), y 2 informativas agregadas (1.410 plantillas sin identificador, 2.777 contactos sin base).

Comprobado: contactos (columnas originales), conversaciones, mensajes, destinatarios de campaña, campaña, identidades, filas de bases, citas y avisos quedaron **idénticos al respaldo** (huella md5). No se generó ningún mensaje, tarea ni aviso. La migración se ensayó dos veces sobre la copia restaurada con el mismo resultado.

Para los mensajes que entren antes de publicar la versión nueva: `select etapa1_reconciliar_posteriores();` crea lo que falte y deja una incidencia por cada mensaje posterior a la migración (probado).

---

## Pregunta 20 — Archivar en lugar de eliminar

- Bases y campañas tienen "Archivar" y "Recuperar"; las listas muestran las activas y un enlace "Ver archivadas".
- Archivar una campaña en curso la pausa con motivo "Archivada"; recuperarla la deja pausada. Una campaña archivada no se puede lanzar.
- La base de datos impide borrar bases, campañas y perfiles (aunque se intente por fuera del panel). Cada archivado queda en `ops_change_log`.
- Las pausas guardan su motivo y su momento (manual, límite diario, archivada).

---

## 1.4 Perfiles y configuración manual

- Cada perfil conserva su identificador permanente. En Configuración → Perfil se editan a mano: nombre del perfil, **nombre del perfil o marca** y **nombre de presentación del agente** (arrancan vacíos: ningún nombre viene del código ni de documentos).
- **Líneas por perfil** (`profile_lines`): una o varias, con su etiqueta, el prefijo de sus credenciales privadas, si atiende con el agente, si se usa en campañas y su límite diario. No se registró ninguna línea automáticamente: las conexiones actuales siguen funcionando como hasta ahora.
- **Control de faltantes**: antes de lanzar una campaña o de que responda un agente se listan los faltantes (nombre de marca, nombre de presentación, línea asignada, línea activa y habilitada, credenciales, plantilla). Solo se deshabilita la acción que depende de lo que falta.
- Civil y Penal quedan como áreas internas de Jurídico. Los perfiles no se pueden eliminar (también bloqueado en la base).
- El agente, las campañas y Marketing toman los nombres del perfil; si faltan, no envían.

Estado: **funciona y verificado** (copia local y producción). Pendiente de configuración: nombres y líneas de los 4 perfiles.

## 1.5 Lecturas y números

- Listados paginados en el servidor con total visible y filtros que cubren todo el conjunto: Prospectos, Inbox, Casos/Clientes cerrados, filas de bases, destinatarios de campañas y Agenda. Se corrigieron los topes de 1.000, 200 y 100 filas (incluidos el detalle de bases y el detalle de campañas).
- Un solo cálculo de cifras por perfil (`profile_metrics`) y por campaña (`campaign_metrics`), usados por la computadora y por el teléfono. Cada tasa muestra su numerador y su denominador; con denominador cero dice "Sin datos".

Comprobado contra consultas directas en producción (10/10): 4.266 oportunidades y contactos, 70 respondieron, 0 captados, 55 detenidos, 1.707 mensajes enviados; campaña "BASE 21 9": 925 destinatarios, 725 en cola, 200 enviados, 10 personas que responden. Estado: **funciona y verificado**.

## 1.6 Importación y calidad de bases

- **Un solo flujo** para Bases, la carga desde una campaña y el teléfono: elegir archivo → hoja, filas y columnas propuestas (teléfono, nombre y DNI, corregibles) → validación con motivos (la misma función en el navegador y en el servidor) → guardar. Todas las columnas del archivo se conservan tal cual, también las que el CRM no reconoce; el archivo original queda en Storage.
- **Guardar nunca envía** ni agrega a nadie a una campaña. Sumar contactos a una campaña es una confirmación aparte que muestra perfil, canal, línea, estado y cuántos entran o quedan afuera.
- **Resultado de la carga**: nuevos + duplicados + inválidos = filas del archivo (se muestra la suma). Duplicados separados en: repetidos dentro del archivo, ya estaban en una base anterior, contacto existente por otra vía.
- **Por fila**: tipo de coincidencia; "contactado anteriormente" con el criterio de la sección 5.1 y la fecha, campaña y línea del último contacto anterior a la carga (no se recalcula después); detención vigente; conflicto de nombre (no se pisa el contacto existente; queda para revisar). Los teléfonos inválidos se guardan con su motivo; no se inventan dígitos.
- **Doble ejecución**: el mismo contenido no se importa dos veces sin confirmarlo (huella del contenido + índice único). Si una carga se corta, queda marcada como incompleta con lo que alcanzó a guardarse y se puede reintentar.
- **Calidad por base** con su denominador (los que respondieron): números equivocados, consultas negadas, contestadores automáticos y "desconocido (sin clasificar)". Ejemplo real, "ART - NUEVOS PRIORIDAD 1": 1.489 contactos, 434 contactados, 35 respondieron: 8 números equivocados, 4 consultas negadas, 0 contestadores, 23 desconocidos; 33 detenidos.
- **Destinatarios**: los detenidos nunca entran; los ya contactados quedan afuera salvo decisión explícita y visible; nadie se duplica en una campaña; una campaña en curso no acepta contactos nuevos hasta pausarla.
- Los otros tres perfiles ahora tienen su sección Bases y su Agenda. El camino anterior de carga dentro de una campaña usa el mismo importador (reutiliza la base si el archivo ya estaba cargado).
- Pendiente (pregunta 14): la importación de conversaciones antiguas que vengan en las bases, hasta que entregues una muestra.

Comprobado en la copia local con un archivo de prueba (8 filas: 3 nuevas, 1 repetida, 2 sin teléfono utilizable, 1 ya contactada, 1 detenida): la suma da el total, las marcas quedan guardadas, la columna desconocida se conserva, el contacto existente no se modifica, se crean las oportunidades, la repetición se rechaza, y no se crea ningún mensaje ni destinatario. Estado: **funciona y verificado** (copia local); en producción se aplicó la base de datos y la pantalla llega con la publicación.

## 1.7 Derivación y ficha

- Ficha interna completa (la misma en Prospectos, Inbox, Casos, Agenda, Bases y el teléfono): estados que coexisten, detención, acciones e historial con autor.
- Texto para compartir: nombre y apellido, barrio y teléfono por defecto; extras elegidos con casillas y vista previa; origen, notas y conversación nunca salen solos. Muestra los datos faltantes sin bloquear la entrega.
- **Copiar o Compartir no cambia ningún estado.** "Derivado" solo con "Marcar Derivado" (destinatario y nota opcionales); volver a No derivado pide motivo. Todo queda en el historial.
- La pantalla anterior del teléfono ("Casos listos para derivar") marcaba Derivado al tocar el botón y mandaba la conversación completa: se reemplazó por el modo teléfono nuevo (la dirección vieja redirige).

Estado: **funciona y verificado** (copia local). Pendiente de prueba tuya: compartir desde un teléfono real.

## 1.8 Vistas compartidas, Agenda y campañas

- **Mismas acciones y un solo registro**: todas las vistas usan la misma ficha y la misma ruta. Repetir una acción desde otra vista no cambia nada ni deja otro evento (probado: captar, derivar, cerrar seguimiento y resultado de cita, dos veces cada una → un solo evento).
- **Agenda con supervisión** (Jurídico y los otros tres perfiles): citas, captados sin derivar, seguimientos y atención humana, con contador por pestaña. Al elegir un pendiente se abre su ficha al costado y se resuelve ahí mismo: resultado de la cita, marcar Derivado, cerrar el seguimiento (completado o caído, con nota), tomar la atención humana, etc. Iniciar seguimientos automáticos queda para la Etapa 2.
- **Campañas**: días de ejecución, línea asignada, límite diario por línea, motivo de pausa guardado, detalle con las cifras de `campaign_metrics` y destinatarios paginados con filtros por estado.
- Se habilita cada campaña cuando tenga línea asignada y una plantilla del catálogo aprobada según Meta (pregunta 22, ver "Respuestas del 10/10"). Un nombre escrito a mano ya no alcanza.

Comprobado en la copia local: campaña de prueba sin destinatarios reales; pausar con motivo e intentar reanudar con la pausa general activa conservan exactamente las cifras; no se envió ningún mensaje. Estado: **funciona y verificado** (copia local).

## 1.9 Modo teléfono y avisos web

- **Teléfono** (`/telefono`): todos los perfiles con nombre y foto (o emoji) y tres accesos.
  - **Iniciar campaña**: archivo del teléfono → misma validación que en la computadora → guardar la base → elegir una campaña (o crear una en borrador) → confirmar destinatarios → paso final "Confirmar e iniciar campaña", que muestra lo que falta y solo se habilita si la campaña está lista. Cargar no envía; solo esa confirmación inicia.
  - **Clientes cerrados**: búsqueda por nombre o teléfono, No derivado / Derivado, acceso a la ficha completa con "Compartir…" del teléfono.
  - **Estadísticas**: primero la campaña activa más reciente (con selector); si no hay activa, la última; si no hay campañas, lo dice. Mismas cifras que la computadora.
- **App instalable (PWA)**: manifiesto, íconos con el diseño del panel, service worker sin guardar datos del CRM en el teléfono (solo una página "sin conexión") e instrucciones de instalación para Android e iPhone.
- **Avisos web (Web Push)**: activar en el dispositivo, aviso de prueba, estado (activo, bloqueado o no compatible), y desde Configuración → Avisos web la lista de dispositivos para probar, desactivar o retirar (nada se borra). Historial por aviso y dispositivo (pendiente, enviado o error; "enviado" no significa leído). Al tocar un aviso se abre el registro correcto; si la sesión se cerró, pide el PIN y continúa. Sin dependencias nuevas: el cifrado y la firma se hicieron con las funciones de Node (probado con el ejemplo oficial del RFC 8291).
- Los avisos de cierre (evento único y aviso interno) son del bloque 2.9; queda lista la deduplicación por evento.

Comprobado: cifrado igual al ejemplo del RFC, ida y vuelta, firma VAPID; registro, prueba (con un servicio inexistente queda como error, sin romper nada), y retiro en la copia local. Estado: **implementado sin probar de punta a punta** (falta el teléfono real y las claves). Procedimiento: `docs/etapa1/PRUEBA_TELEFONO.md`.

---

## Respuestas del 10/10: qué se hizo en la Etapa 1 y qué quedó registrado

Las ocho respuestas quedaron registradas en el documento único (tabla de la sección 8, decisiones 5.2 y bloques 2.0 y 2.6).
Dos de ellas tocan bloques de la Etapa 1 y se implementaron; las demás son de la Etapa 2 y quedan registradas, sin construir.

### Pregunta 22 — Catálogo de plantillas (bloque 1.8)

- **Lectura desde Meta** (Configuración de cada perfil → Plantillas de WhatsApp → "Leer plantillas de Meta"): trae todas las plantillas de la cuenta de WhatsApp Business de la línea con su estado real, idioma, categoría, calidad, motivo de rechazo y variables. Solo lee: no crea, no cambia ni envía nada. Cada lectura queda registrada.
- **Accesos privados por línea**: usa el token que la línea ya tiene (`<PREFIJO>_ACCESS_TOKEN`) y una variable nueva con el identificador de la cuenta (`<PREFIJO>_WABA_ID`). Si falta, solo esa lectura queda deshabilitada y el panel dice qué falta. También comprueba que el número de la línea pertenezca a esa cuenta.
- **Nada se inventa ni se borra**: el estado es el que informa Meta (se muestra el valor original junto a su traducción); una plantilla que deja de figurar queda marcada con la fecha; un cambio de estado guarda el anterior.
- **Uso**: cada plantilla muestra a qué línea y propósito está asignada, qué campañas la usan, en qué campañas figura solo escrita a mano y cuántos envíos históricos hay con ese nombre (por ejemplo, `estudio_juridico_vita`: 1.610 envíos, el último el 5/10).
- **Selección por perfil, línea y propósito**: una plantilla aprobada se asigna a una línea para un propósito, eligiendo con qué dato se completa cada variable (nombre del contacto, nombre de presentación o nombre del perfil o marca; no hay valores por defecto). En la Etapa 1 se habilita solo "Primer contacto de campaña"; seguimiento, reagendamiento, inicio de cita, aviso interno y formulario quedan preparados y deshabilitados hasta su etapa.
- **Campañas**: la plantilla se elige del catálogo (en la computadora, al crear desde una base y en el teléfono); se puede dejar para después. Lanzar exige plantilla aprobada, de la cuenta de la línea, asignada a esa línea para campañas, con cada variable resuelta, y al lanzar se confirma el estado en Meta en ese momento.
- **Si falta una plantilla válida, ese envío queda pendiente**: la campaña no envía; si Meta rechaza la plantilla o la línea al enviar (pausada, deshabilitada, token, permisos), el contacto sigue pendiente y la campaña se pausa con el motivo. Si a un contacto le falta un dato de la plantilla (por ejemplo, el nombre), su envío no sale y queda registrado el motivo; nunca se manda una variable vacía. El idioma y las variables salen del catálogo (antes estaban fijos en "es_AR" y tres variables).
- **Otros envíos automáticos con nombre de la configuración privada** (plantilla de la landing y seguimientos de Marketing): solo salen si ese nombre figura aprobado en el catálogo. Siguen frenados por la pausa general y pasan al catálogo en la Etapa 2.
- "BASE 21 9" conserva su nombre escrito (`estudio_juridico_vita`) como referencia; para lanzarla habrá que elegirla del catálogo.

### Pregunta 39 — Horario en las campañas (bloque 1.8)

- El motor de campañas aplica el horario general: lunes a sábado de 8 a 21, hora de Argentina, aunque sea feriado; los domingos no envía. Una campaña con un horario más chico conserva el suyo; "BASE 21 9" tenía 7 a 21 y ahora empieza a las 8 (sin modificar su registro).
- Los días de ejecución ya no ofrecen el domingo y las campañas nuevas empiezan a las 8. El calendario con excepciones cargadas a mano es del bloque 2.0 (Etapa 2).

### Registradas para la Etapa 2 (sin construir)

| Pregunta | Decisión | Bloque |
|---|---|---|
| 12 | AMBA: CABA y 40 municipios, lista editable; prioridad para Coberturas y Autos; fuera de zona no impide captar ni derivar (advertencia y filtro); sin ubicación, "No informada" | 2.4 |
| 21 | Guion mínimo jurídico solo para simulaciones y pruebas controladas (Fase 1, Fase 2, ruta rápida); no habilita contactos reales | 2.2 |
| 24 | Transcripción si el proveedor lo permite y está habilitada, y pedido de texto cuando el agente pueda responder (el guardado privado y la consulta de los originales se adelantaron a la Etapa 1, el 11/10) | 2.6 |
| 28 | Número interno de avisos de cierre por perfil, distinto de la línea y del profesional; sin número, cierre y ficha igual y aviso pendiente | 2.1, 2.9 |
| 32 | Mensajes de origen editables por perfil; sin evidencia, "No informada"; no se deduce pago u orgánico | 2.8 |
| 34 | Seguimiento de formularios verificados: preparado y desactivado hasta definir su cadencia (distinto del de Marketing) | 2.3 |
| Marketing | Contactos 1 a 3 con 48 a 72 h según el calendario, sin seguimiento a quien nunca respondió, base para campaña manual al final | 2.3 |

### Originales de audios y adjuntos

Resuelto el 11/10: se adelantó a la Etapa 1 solo el guardado privado de los originales y su consulta
desde la conversación y la ficha, sin transcripción, respuestas ni envíos (ver "Guardado privado de originales").

---

## Revisión del 10/10 antes del despliegue

Las 6 observaciones están corregidas. Cada una tiene pruebas que **reproducen el error con la versión
revisada** (`kocos-pipeline-etapa1.zip` sobre `7c721bf`: 6 de 6 reproducidos) y **pasan con la versión corregida**.
Las pruebas usan una base creada desde cero con datos inventados y la red simulada: ninguna puede enviar un mensaje real.

| Punto | Qué pasaba | Qué cambió | Pruebas |
|---|---|---|---|
| 1. Pausa general incompleta | Sin registro, con valor nulo o sin campos, las dos pausas quedaban en `false` | Solo un `false` explícito levanta cada pausa; si falta el registro, es nulo, no es un objeto o le falta un campo, esa pausa queda activa. El panel muestra el problema en Configuración → Pausa general (se corrige guardando con el PIN). La base aplica la misma regla en la compuerta de la IA (`automation_pause_active`) | 4 unitarias, 6 de integración (sin registro, nulo, vacío, tipos inválidos, un campo, completa) |
| 2. Envíos duplicados | Dos ticks simultáneos tomaban el mismo destinatario | Bloqueo por campaña con vencimiento + reserva atómica del destinatario en la base (`pendiente → enviando` con `FOR UPDATE SKIP LOCKED`). Marca de inicio justo antes de llamar a Meta y cierre solo con la reserva vigente. Si guardar el resultado falla, se reintenta 3 veces; si sigue fallando, la reserva queda y al vencer pasa a **A revisar** (nunca se reenvía sola). Una ejecución cortada antes de llamar a Meta vuelve a la cola sin contar como intento | 7 de integración: 12 ticks simultáneos (cada destinatario recibe 1 envío), 20 reservas simultáneas sin repetir, bloqueo vencido, reintentos con límite, falla al guardar (parcial y total), corte antes y después de empezar el envío |
| 3. Intervención humana | `sendOutboundMessage` no revalidaba la pausa ni el chat pausado; la respuesta manual apagaba la IA después de enviar | La respuesta manual toma el chat **antes** de enviar (IA apagada, "Requiere atención humana", anula cualquier acuse pendiente). Toda salida automática pasa por una compuerta en la base, con la conversación bloqueada, inmediatamente antes de enviar: pausa general y chat tomado por una persona. El acuse final de la IA al derivar solo sale con un **permiso de un solo uso** (vence a los 5 minutos); si una persona ya tomó el chat, no se otorga. Los seguimientos automáticos de Marketing también revalidan, justo antes de enviar, la pausa general y si una persona tomó la conversación (en ese caso el seguimiento se cierra) | 8 de integración (el chat ya está pausado cuando Meta recibe el envío manual, falla del envío manual, pausa general, respuesta de la IA en curso, pausa desde el panel, acuse autorizado una sola vez: equivocado, vencido, anulado, con pausa) + 2 de seguimientos |
| 4. Entrega y lectura | El identificador de Meta quedaba en el destinatario pero no en el mensaje; el Inbox solo agregaba mensajes nuevos | El mensaje de campaña (y el manual y el seguimiento de Marketing) guarda el identificador de Meta, el estado "Enviado" y su hora. El polling del Inbox trae además el estado actual de los mensajes salientes y lo aplica a los que ya se ven | 3 unitarias, 3 de integración (campaña: enviado → entregado → leído, sin retroceder; polling sin mensajes nuevos que actualiza el existente; respuesta manual; seguimiento de Marketing) |
| 5. Errores técnicos | Sin código (red, tiempo vencido) se clasificaba como error del contacto | Solo un error **confirmado por Meta** para ese destinatario lo deja "fallido". Plantilla o cuenta: el envío queda pendiente y la campaña se pausa con el motivo. Falla temporal: vuelve a la cola, hasta 3 intentos. Sin respuesta, tiempo vencido, error 5xx sin formato de Meta o respuesta sin identificador: **A revisar** como incierto, sin reenvío automático; reintentarlo exige confirmar "podría llegarle dos veces". En los seguimientos de Marketing, un resultado incierto cierra el seguimiento para revisión | 6 unitarias, 4 de integración (campaña: red caída, tiempo vencido, 502, respuesta sin identificador, errores confirmados; seguimiento incierto) |
| 6. Domicilio como barrio | "domicilio" contaba como barrio y, según el orden, salía la dirección completa | El campo barrio tiene prioridad (después localidad, partido, ciudad y zona); domicilio, dirección, calle, piso o depto nunca son barrio. El domicilio completo (de la ficha o de la base original) aparece como dato opcional al compartir, sin marcar por defecto, y una sola vez si está repetido | 5 unitarias |

Encontrado y corregido mientras se probaba: si una persona tomaba el chat mientras la IA decidía derivar,
la IA igual podía obtener el permiso del acuse; ahora no se otorga ni se pisa el estado que dejó la persona.
También, "intentos" contaba reservas que nunca llegaron a Meta; ahora cuenta solo llamadas reales.

## Guardado privado de originales (pregunta 24, alcance acotado)

- **Qué se guarda**: audios, fotos, videos, documentos y stickers que manda una persona por WhatsApp,
  Instagram o Facebook. Cada original queda en `message_attachments`, vinculado al mensaje, la
  conversación, la ficha y el perfil, con su tipo, tamaño, huella SHA-256 (comparada con la que informa Meta) y estado.
- **Dónde**: bucket privado `adjuntos-originales` de Supabase. La ruta no lleva datos personales
  (área / conversación / identificador). HTML, SVG y tipos desconocidos se guardan como binario y solo se descargan.
- **Cuándo**: al llegar el mensaje, con tope de 12 segundos y 16 MB para no demorar la respuesta a Meta.
  Lo más pesado (hasta 50 MB) se guarda al abrirlo o con "Guardar ahora". Si Meta falla, el mensaje
  se guarda igual y el original queda para reintentar. WhatsApp deja descargar lo recibido **7 días**:
  después queda "Vencido en Meta" (el registro se conserva).
- **Acceso**: en la conversación ("Escuchar audio", "Ver foto", "Abrir documento"), en la ficha ("Archivos que mandó")
  y en Revisión → "Archivos sin guardar". Siempre con sesión: el panel entrega un enlace firmado que vence a los 2 minutos.
- **Sin transcripción, respuestas ni envíos**: guardar un audio no dispara al agente ni manda nada; las
  fotos y documentos no se agregan al texto para compartir.
- **Pruebas**: 7 unitarias y 9 de integración (audio de WhatsApp, entrega repetida, documento con su nombre,
  HTML solo descargable, página de error de Meta, falla y "Guardar ahora", pesado a pedido, tope de 50 MB,
  vencido, dos guardados simultáneos con una sola descarga, Instagram con dos fotos sin enviar el token de
  WhatsApp, mensaje anterior a la función, borrado rechazado).

## Entrega y cómo incorporarla

Ver `docs/etapa1/ENTREGA.md`: paquete completo para compilar, parche exacto sobre `7c721bf`,
huellas SHA-256, comandos de tipos, lint, build y pruebas con las dependencias reales, y pasos para Preview.

---

## Comprobaciones de la etapa: comprobado y pendiente

### Comprobado (11/10)

| Comprobación | Dónde | Resultado |
|---|---|---|
| Pruebas unitarias (`tests/unitarias`) | Este entorno | 53/53 |
| Pruebas de integración (`tests/integracion`) sobre una base creada desde cero: estructura previa a la Etapa 1 + migraciones 0100 → 0117 y 0199 + datos inventados; Meta y Storage simulados | Este entorno (PostgreSQL 16 + PostgREST 12.2.3) | 39/39 |
| Reproducción de los 6 puntos con la versión revisada (`tests/reproduccion`) | Este entorno | 6/6 reproducidos |
| Pruebas anteriores contra la copia restaurada (importación, acciones, rutas, plantillas) | Este entorno | 5/5 (no se entregan: usan datos de la copia) |
| Revisión de tipos de `src` y de las pruebas, con declaraciones mínimas | Este entorno | Sin errores |
| Reglas de Next.js y entidades JSX | Este entorno | Sin problemas |
| Migraciones 0115 a 0117 en producción: funciones iguales a las probadas | Producción | 15/15 huellas iguales |
| Estado de producción después de aplicarlas | Producción | Pausa general activa, 0 agentes activos, tarea programada inactiva, "BASE 21 9" pausada con 725 en cola (925 / 200 enviados / 10 que responden), 0 en envío o a revisar, 1.818 mensajes |

### Pendiente (no se puede hacer en este entorno o necesita tu decisión)

| Pendiente | Por qué | Cómo |
|---|---|---|
| `npm ci`, tipos, lint y build con las dependencias reales | Este entorno no tiene acceso al registro de npm: acá se usaron imitaciones mínimas de `@supabase/supabase-js`, `next/server` y `@google/genai` | Lo hace el build de Vercel en Preview (revisa tipos y lint) y, completo, los comandos de `docs/etapa1/ENTREGA.md` o el flujo `docs/etapa1/ci/verificar.yml` |
| Pruebas con el cliente real de Supabase | Ídem | `bash tests/integracion/correr.sh` (Docker) o el mismo flujo |
| Verificación en Preview | Es tu paso previo a producción | Pasos y variables en `docs/etapa1/ENTREGA.md` |
| Publicar en producción, después `0199` y la reconciliación posterior | Después de Preview | Avisame cuando esté publicado |
| Originales con un teléfono real | Meta manda los mensajes solo a producción | `docs/etapa1/PRUEBA_TELEFONO.md`, pasos 6 y 7 |

## Fallos encontrados y cómo se resolvieron

- Revisión del 10/10: los 6 puntos de la tabla de arriba, más el acuse de la IA cuando una persona ya había tomado el chat y el conteo de intentos.

- Una carga cortada a mitad de camino dejaba la huella y bloqueaba el reintento: ahora queda marcada como incompleta y se libera.
- "Contactado anteriormente" podía tomar una oportunidad nueva sin contacto en lugar de la anterior: vale la evidencia más fuerte.
- Las listas largas de identificadores en la dirección de la consulta podían superar el largo máximo: ahora van en lotes de 150.
- El detalle de campañas y el de bases mostraban como máximo 1.000 filas: ahora se cuentan y paginan en el servidor.
- La pantalla anterior del teléfono marcaba Derivado al compartir: reemplazada (1.7).

## Pendientes de configuración o de prueba tuya

1. **Preview**: subir la entrega a una rama nueva y verificarla (`docs/etapa1/ENTREGA.md`). Para que Preview funcione hay que
   agregar al alcance Preview `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y
   `ACCESS_PIN` (hoy existen solo en Producción). Preview usa la base de producción: no respondas a prospectos desde ahí.
2. **Antes de publicar en producción**: `ACCESS_PIN` ya está cargado en Producción. El primer ingreso guarda el PIN en la base.
3. Publicar. Después, avisame para revisar el despliegue, aplicar `0199` (cierre de la clave pública: hasta entonces todavía puede leer los contactos) y ejecutar la reconciliación posterior.
4. Cargar a mano, en cada perfil, el nombre del perfil o marca, el nombre de presentación del agente y sus líneas (con el prefijo de sus credenciales).
5. Plantillas (pregunta 22), por línea: cargar en Vercel `<PREFIJO>_WABA_ID` (identificador de la cuenta de WhatsApp Business; el token tiene que tener permiso para administrar plantillas) → Configuración → Plantillas de WhatsApp → "Leer plantillas de Meta" → asignar la aprobada a la línea para "Primer contacto de campaña", eligiendo el dato de cada variable → elegirla en la campaña. Hasta entonces ninguna campaña se puede lanzar.
6. Avisos web: generar las claves en Configuración → Avisos web y cargarlas en Vercel.
7. Pruebas en teléfono real según `docs/etapa1/PRUEBA_TELEFONO.md` (incluye archivos y respuesta manual).
8. Pregunta 14: muestra de las conversaciones antiguas de las bases, si querés importarlas.
9. Recomendado: cambiar el PIN desde Configuración → Acceso después del primer ingreso.
10. Mantenimiento: la versión de la API de Meta que usa el sistema (v21.0) está disponible hasta el 21/1/2027; conviene actualizarla antes de esa fecha.

Nada se reactiva solo: la pausa general, los agentes, la tarea programada y la campaña siguen como están hasta que lo decidas.
