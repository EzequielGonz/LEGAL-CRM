# Migrar proyecto de Cowork a Code
- Origen: Claude común (exportación de datos 21/11/2026)
- Creado: 2026-11-21T05:43 · Actualizado: 2026-11-21T05:57
- Mensajes: 4
- Texto tal cual, con claves, códigos y teléfonos tachados.

## RESPONSABLE · 2026-11-21T05:43

como migro un proyecto completo de aca cowork a code?

## CLAUDE · 2026-11-21T05:43

```
This block is not supported on your current device yet.
```

No hay un botón que pase un proyecto entero de Cowork a Claude Code. Según la ayuda de Anthropic, los proyectos existen solo en Cowork y no en Claude Code, aunque está previsto sumarlos más adelante. Así que el proyecto se rearma pieza por pieza. En tu caso del CRM, quedaría así:

**1. El código: clonar el repo.** El CRM ya tiene su repositorio de GitHub sincronizado con el proyecto. En Claude Code clonás ese repo y abrís la carpeta; ahí va a ser la base de trabajo.

**2. Las instrucciones del proyecto van a un `CLAUDE.md`.** Las reglas del proyecto (una tarea por vez, Fase 3 en pausa, no iniciar agentes sin autorización, responder en rioplatense, etc.) se copian en un archivo `CLAUDE.md` en la raíz del repo. Claude Code lo lee al empezar cada sesión. Así no tenés que pegarlas en cada pedido.

**3. Los documentos del proyecto se copian al repo.** Los 16 docs (`CONTEXTO_ACTUAL_CRM.md`, `PUNTO_DE_CONTROL.md`, los de landings, SEO, etc.) no se pasan solos. Lo más simple es guardarlos en una carpeta `docs/` del repo y mencionar en el `CLAUDE.md` cuáles leer según la tarea.

**4. Conectores, skills y plugins siguen a tu cuenta.** Si entrás a Claude Code con la misma cuenta de claude.ai, los conectores que agregaste ahí aparecen solos. Los plugins también quedan guardados en la cuenta. La excepción son los servidores MCP locales que corrían desde la app de escritorio: esos los agregás vos en la configuración de Claude Code.

**5. Tareas puntuales de Cowork (opcional).** Una guía de terceros cita este método de la ayuda de Anthropic: abrir la tarea, elegir "Download task data", descomprimir el archivo, abrir esa carpeta en Claude Code y correr `/port-task-data` para traer el contexto. No lo pude confirmar en la página oficial, así que fijate si te aparece esa opción.

**Qué no se pasa:** la memoria del proyecto y el historial de conversaciones. Por eso conviene que `CONTEXTO_ACTUAL_CRM.md` esté al día antes de migrar, porque es lo que le da continuidad a Claude Code.

Si querés, te armo ahora el paquete: un `CLAUDE.md` con las reglas vigentes y una carpeta `docs/` con los 16 documentos, listo para que el programador lo suba al repo.

## RESPONSABLE · 2026-11-21T05:56

Necesito que vuelques TODO el contexto de este chat a la memoria central del proyecto. Usá todas las skills, plugins y conectores que tengas. No resumas de más: prefiero que sobre a que falte.
DÓNDE (obligatorio, no generes archivos para descargar):

* Repo EzequielGonz/LEGAL-CRM, rama `cerebro-chats`. Si la rama no existe, creala desde main. Escribí SOLO en esa rama: no toques main ni ninguna otra rama ni otro archivo.
* Archivo: `cerebro/chats/AAAA-MM-DD-<origen>-<tema-corto>.md` (fecha en que empezó este chat; origen = code, cowork o claude).
* Si de verdad no podés escribir en esa rama, no me des un archivo: creá un documento en Claude Docs con ese mismo nombre como título y el mismo contenido, y decímelo.

QUÉ PONER (en español, en este orden):

1. Encabezado: título del chat, fechas de inicio y fin, origen (Code / Cowork / Claude común), marcas o perfiles que toca.
2. Objetivo: qué pedí y para qué.
3. Mis órdenes y decisiones, TEXTUALES entre comillas, cada una con fecha. Si una reemplazó a otra: «reemplaza a …».
4. Correcciones que te hice (lo que no me gustó y qué quería en su lugar).
5. Qué se hizo, paso a paso, con estado: especificado / implementado / probado / publicado / habilitado.
6. Todo lo concreto: archivos y rutas, ids de Metricool, publicaciones programadas (fecha, hora, marca), campañas, plantillas, enlaces a documentos y artefactos.
7. Datos del negocio que aparecieron (precios, procesos, roles del equipo, horarios, cuentas, proveedores).
8. Lo pendiente, a medias o bloqueado, y por qué.
9. Lo que aprendiste: qué funcionó, qué no, errores y cómo se resolvieron.
10. Preguntas que quedaron abiertas.
11. RAMAS Y CAMBIOS, explícito y completo:

* Cada repo y rama que usaste: para qué se creó, de qué rama salió, qué contiene, si está integrada a main o no, si tiene PR (número y estado) y qué habría que hacer con ella (integrar, rescatar o archivar).
* Lista de commits: hash corto, fecha y qué cambió cada uno.
* Archivos tocados, agrupados por carpeta.
* Migraciones de base: número, qué hacen, si se aplicaron y cuándo.
* Despliegues: qué se publicó, cuándo y en qué proyecto.
* Cambios de configuración fuera del código: variables de Vercel (solo el nombre, nunca el valor), Supabase, Meta, Metricool, Google, redes.
* Qué quedó encendido o apagado por este chat.

12. Todo lo que contradiga información de antes, marcado «CONTRADICE:».

REGLAS:

* Nada de claves, tokens, contraseñas ni códigos de acceso. Si apareció uno, poné «[secreto: <qué era> — hay que cambiarlo]» sin el valor.
* Nada de datos personales de prospectos o clientes (nombres, teléfonos, mails, textos de chats): solo cantidades y casos sin identificar.
* No inventes: si dudás, escribí «(no confirmado)».
* Si otro chat ya subió archivos a la rama, no los toques: solo agregá el tuyo (si el push choca, traé los cambios de la rama y volvé a subir).

AL TERMINAR: respondeme en 2 líneas: ruta del archivo en `cerebro-chats` y commit (o título del documento de Claude Docs, si no pudiste usar GitHub).

## CLAUDE · 2026-11-21T05:57

```
This block is not supported on your current device yet.
```


```
This block is not supported on your current device yet.
```


```
This block is not supported on your current device yet.
```


```
This block is not supported on your current device yet.
```
