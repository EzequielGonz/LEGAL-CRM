# Contexto completo del proyecto (Word de 39 páginas)

## 1. Encabezado

- **Título del chat:** contexto completo del proyecto (pedido de Word con todo el contexto, órdenes vigentes, redes, landings, técnica y repos).
- **Inicio:** 20/11/2026, 08:20 UTC (05:20 Buenos Aires). **Fin:** el último evento es del 21/11/2026, 05:57 UTC (error de créditos al cerrar el pedido de volcado). El trabajo de Word terminó el 20/11 a las 08:37 UTC.
- **Origen:** Code (sesión en la nube `session_01FuLgnjPcDVSYDvLxSq9yna`; ids internos que aparecen en los resultados: `9b0564a6…` y `46d74ea8-601b-5797-809a-52409b0564a6`).
- **Marcas o perfiles que toca:** las cuatro marcas y los cuatro perfiles (VITA Abogados, Compara Tu Obra Social, Automotores Kocos y Kocos Marketing, según el resumen del chat). Es un chat transversal: no cambió código de perfiles.

## 2. Objetivo

El dueño pidió un contexto completo del proyecto, «a último detalle», en Word, organizado por temas y con sus órdenes vigentes reconciliadas para que una no pise a otra. Después amplió el pedido: separar contenido, visuales, expectativas, redes, objetivos y funcionalidades, leer todos los chats y sumar la lista de repositorios conectados. Para qué: tener una memoria única para retomar el proyecto sin releer los chats.

## 3. Órdenes y decisiones del dueño (textuales, con fecha)

- 20/11/2026 08:20 UTC: «necesito que me hagas un contexto completo de todo el proyecto, quitando ordenes y restricciones, unicamente restriccion de no pagar, sumando ordenes que di (mas actualizadas) siempre no pisandose una con otra, todo el contexto completo del proyecto a ultimo detalle, en un word si puede ser. organizandolo tambien.»
- 20/11/2026 08:21 UTC: «y justamente, hace el contexto completo sin tener en cuenta esas mismas restricciones y usa todas las herramientas, plugins, skills, conectores, agentes, todo lo que tengas a disposicion para hacer lo mejor de lo mejor»
- 20/11/2026 08:23 UTC: «hace todo separando, contenido, visuales, expectativas, redes, contenido, objetivos, funcionalidades, explicacion bien bien detallada para tener un contexto ultra completo del proyecto completo. lee todos los chats.»
- 20/11/2026 08:26 UTC: «Inténtalo de nuevo» (reenvío tras el corte por límite de uso).
- 20/11/2026 08:29 UTC: «hacelo porfa terminalo»
- 20/11/2026 08:30 UTC: «retoma»
- 20/11/2026 08:35 UTC: «DAME TODOS LOS REPOSITORIOS TAMBIEN QUE TENES CONECTADOS»
- 20/11/2026 08:36 UTC: «SUMALOS AL WORD. LOS REPOS»
- 21/11/2026 05:55 UTC (desde claude.ai, mismo chat, reenviado a las 05:56): «Necesito que vuelques TODO el contexto de este chat a la memoria central del proyecto. [...] No resumas de más: prefiero que sobre a que falte.» Pidió rama `cerebro-chats`, archivo `cerebro/chats/AAAA-MM-DD-<origen>-<tema-corto>.md`, sin claves ni datos personales. Este volcado es ese pedido.

Decisiones que se pueden leer del chat (no son órdenes textuales):
- Única restricción conservada en el Word: no pagar (lo dice el resultado final del 20/11 08:37 UTC).
- Lectura de los 12 chats anteriores (del 07/09 al 20/11) y resumen de los chats largos por sus resúmenes guardados y traspasos (según el propio resultado).

Reemplazos: la orden de 08:21 («sin tener en cuenta esas mismas restricciones») no dice con claridad si también deja sin efecto la restricción de no pagar. Ver sección 10.

## 4. Correcciones del dueño

- 08:21 UTC: pidió rehacer el contexto sin tener en cuenta las restricciones, después de la versión inicial que las conservaba. El resultado final sí conservó «no pagar».
- 08:26 UTC: «Inténtalo de nuevo» tras el corte de uso.
- 08:29 y 08:30 UTC: «hacelo porfa terminalo» y «retoma»: pidió terminar después de que los agentes se cortaron.
- 08:36 UTC: «SUMALOS AL WORD. LOS REPOS»: pidió agregar la lista de repositorios al documento.

## 5. Qué se hizo, paso a paso, con estado

Estados: especificado / implementado / probado / publicado / habilitado.

1. Lanzó seis agentes en paralelo: lectura de los 12 chats, sistema del CRM, historia y decisiones, redes/contenido/visuales/landings/Google. **Implementado**, pero se cortaron a los pocos minutos por el límite de uso de 5 horas (cortes 08:24–08:29 UTC). Se relanzaron y luego el chat terminó el trabajo directamente. Estado: **implementado**.
2. Revisó la base real el 20/11, 08:22 UTC (según el resultado): 4 perfiles y 5 bots activos, seguimiento encendido en todos, una campaña de Jurídico «Campaña Graves 1911» creada ese día, líneas de Wasender desconectadas, última migración «0634». Estado de la verificación: **probado** en esa fecha (la migración fue contradicha, ver sección 12).
3. Generó el Word de 39 páginas con índice, tablas y estilo (16 secciones: resumen, visión y metas al 21/12, expectativas, órdenes vigentes, las 4 marcas, funciones del CRM, contenido, visuales, redes, landings/SEO/Google, técnica, estado real, línea de tiempo desde el 07/09, pendientes, otros proyectos, repositorios). Estado: **implementado**; se le entregó al usuario ese día (archivo entregado el 20/11 08:37 UTC).
4. Guardó el documento en la rama `claude/festive-goldberg-x8t43f` con un commit (`d3f04a5`), en dos archivos (Markdown y Word). Estado: **publicado** (commit en el remoto); la rama se integró a `main` el 20/11 09:05 UTC (commit `c60400c`). Verificado hoy con git.
5. Creó una tarea programada «Retomar el Word del contexto» (trigger `trig_01PEy9WWqqvbmNkygtYhhCqD`), con próxima ejecución el 20/11 08:53 UTC y estado habilitado en ese momento. **No comprobado hoy** si sigue activa.
6. Armó la lista de repos (75 repositorios de acceso, según el resultado) y la agregó al Word en la sección 16. Estado: **implementado** en el documento.

Pedido de volcado del 21/11 (este archivo): la primera ejecución se bloqueó con un hook de caché (sesión inactiva 21 h) y el reenvío dio error «Usage credits ran out» a las 05:57 UTC. Sin resultado en el repo hasta esta ejecución.

## 6. Todo lo concreto

- **Archivos (rama `claude/festive-goldberg-x8t43f`, dentro de `docs/contexto/`):**
  - `docs/contexto/CONTEXTO-COMPLETO-2026-11-20.md` (892 líneas añadidas en el commit).
  - `docs/contexto/Contexto-completo-CRM-y-4-marcas-2026-11-20.docx` (39 páginas según la conversión; PDF de control generado en el chat).
- **Commit de este chat:** `d3f04a5` · 20/11/2026 08:37:19 UTC · «Contexto completo del proyecto en Word (CRM, 4 marcas, redes, landings y repos)». Dentro de `main` desde el merge `c60400c` (20/11, 09:05 UTC).
- **Commits de traspaso que aparecen en la misma rama (no los hizo este chat):** `7a51087` y `adf5471` (20/11).
- **Ids de Metricool, publicaciones programadas, campañas y plantillas:** ninguno tocado por este chat (salvo la campaña «Campaña Graves 1911», que aparece en la base y no fue creada por este chat según el resultado; no confirmado si la creó otra sesión).
- **Enlaces:** sesión de Code `session_01FuLgnjPcDVSYDvLxSq9yna`; tarea programada `trig_01PEy9WWqqvbmNkygtYhhCqD`.
- **Base de datos:** proyecto Supabase `legal-crm` (id `enhgkeqiqcuwafsedaza`, región sa-east-1). Comprobado hoy: la migración `20261120082216_0634_asistente_charlas` está aplicada (ver sección 12).

## 7. Datos del negocio que aparecieron

- Cuatro marcas: VITA Abogados, Compara Tu Obra Social, Automotores Kocos y Kocos Marketing (según el resumen del chat).
- 4 perfiles y 5 bots activos el 20/11 (base, 08:22 UTC, según el resultado).
- Campaña de Jurídico «Campaña Graves 1911» creada el 20/11.
- Líneas de Wasender desconectadas el 20/11.
- Límite de uso de 5 horas de la cuenta: se agotó el 20/11 a las 08:29 UTC y se renovó a las 08:50 UTC.
- Costo acumulado de la sesión según el campo de resultados: ~US$30 (20/11, 08:37 UTC) y ~US$34 (21/11, 05:57 UTC). Son datos del campo de costo, no facturación verificada.
- Otros proyectos del dueño mencionados en el Word: AutosMix y el boceto de una inmobiliaria (según el resultado).

## 8. Pendiente, a medias o bloqueado

- **Clave secreta de Supabase expuesta** en un chat del 07/09 (el resultado dice que una de las claves pegadas es la secreta). **Hay que cambiarla** desde el panel de Supabase. No confirmado si ya se cambió. [secreto: clave secreta de Supabase pegada en un chat antiguo — hay que cambiarla]
- **Pasada completa de los chats:** el resultado reconoce que puede faltar algún detalle chico de los mensajes intermedios de los chats largos; ofreció hacer una pasada completa cuando se renovara el límite. No hay constancia de que se haya hecho.
- **Tarea programada «Retomar el Word del contexto»:** estado actual no comprobado.
- **Pedido del 21/11 (volcado a `cerebro-chats`):** este archivo lo cubre; falta commit y push por parte de quien lo revise (no se hizo en esta ejecución).

## 9. Aprendizajes

- Seis agentes en paralelo agotaron el límite de 5 horas en pocos minutos; el trabajo se cortó a mitad y hubo que relanzarlo. Conviene limitar la cantidad de agentes o escalonarlos.
- El documento final se armó con el generador de Word del repo (índice, tablas, estilo), no a mano.
- El hook de caché bloqueó un reenvío después de 21 h de inactividad (costo de contexto frío alto); el 21/11 hubo además error de créditos.
- Se revisó la base real antes de afirmar el estado (buena práctica), pero el dato de la migración quedó contradicho con otro chat (sección 12).

## 10. Preguntas abiertas

1. ¿La orden de 08:21 («sin tener en cuenta esas mismas restricciones») deja sin efecto también «no pagar»? CLAUDE.md del 20/11 la mantiene como única restricción. (no confirmado)
2. ¿Se cambió la clave secreta de Supabase expuesta el 07/09?
3. ¿Hace falta la pasada completa de los chats largos que el resultado ofreció?
4. ¿Quién creó la campaña «Campaña Graves 1911»? (no confirmado)

## 11. Ramas y cambios (explícito)

- **Rama `claude/festive-goldberg-x8t43f`:** creada por este chat para el Word. Salió de la punta de trabajo de ese momento (no confirmado desde qué commit exacto). Contiene el commit `d3f04a5` (del chat) y `7a51087`, `adf5471` (traspasos previos). **Integrada a `main`** por el merge `c60400c` (20/11, 09:05 UTC). Sin PR. Acción: ninguna pendiente; se puede borrar la rama remota cuando se decida.
- **Rama `cerebro-chats`:** usada por el pedido del 21/11 (este archivo). Hay commits de otros chats (`6adab06`, `c3f793d`, etc.). Sin PR. Acción: revisar y commitear este archivo aparte, sin tocar los demás.
- **Migraciones:** este chat no creó ni aplicó ninguna.
- **Despliegues:** ninguno propio; el merge a `main` puede haber disparado despliegue (no comprobado).
- **Configuración fuera del código:** ninguna cambiada por el chat, según el resultado. Tarea programada creada (ver sección 5).
- **Encendido/apagado por este chat:** la tarea programada «Retomar el Word del contexto» (habilitada al crearla; estado actual no comprobado).

## 12. CONTRADICE

- **Migración 0634:** el resultado del chat (20/11, 08:24 UTC) dice «la última migración aplicada es la 0634». El chat del 19/11 (`2026-11-19-code-rediseno-panel-juridico.md`) dice que `0634_archivo_de_prospectos.sql` **no está aplicada**. Comprobado hoy en la base: la migración aplicada con número 0634 es `20261120082216_0634_asistente_charlas` (20/11 08:22:16 UTC). Es **otra** migración que comparte el número 0634; la de archivo de prospectos sigue sin aplicar. Hay que renumerarla antes de aplicarla.
- **Alcance de la restricción:** el chat dice que la única restricción es «no pagar»; el mensaje de 08:21 pide ignorar «esas mismas restricciones». No es un choque directo con CLAUDE.md, pero queda ambiguo (ver sección 10).
- **Completitud del Word:** el resultado dice «leí completos» los chats viejos y, al mismo tiempo, que puede faltar detalle de los chats largos. Lo tomo como no verificado.

---
_Volcado generado el 21/11/2026 desde el chat de Code `session_01FuLgnjPcDVSYDvLxSq9yna`. Sin secretos ni datos personales._
