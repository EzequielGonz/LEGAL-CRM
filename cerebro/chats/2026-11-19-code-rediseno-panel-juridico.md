# Rediseño del panel jurídico (Hoy, Activos, Descartados, archivo de prospectos)

## 1. Encabezado

- **Título del chat:** «PANEL JURIDICO LEGAL - CRM (RE-DISEÑO)».
- **Inicio:** 19/11/2026. **Fin:** el trabajo de código terminó el 19/11/2026; el pedido de volcado a la memoria llegó el 21/11/2026 (mismo chat).
- **Origen:** Code (Claude Code, sesión en la nube, modelo configurado `claude-sonnet-5-5`).
- **Perfiles que toca:** Jurídico de forma explícita (pedido hecho sobre «Panel jurídico»). Los cambios de código están en componentes comunes (Hoy, Activos, Descartados, marco de chats), así que **también alcanzan a Coberturas médicas, Autos 0 km y Marketing** (cada uno ve solo lo suyo). El cambio del marco de «Todos los chats» se aplicó a los cuatro perfiles.
- Sesión: https://claude.ai/code/session_01FuLgniyC2tDGbRPYKqpwJN

## 2. Objetivo

La responsable pidió **simplificar y ordenar el panel jurídico** (https://legal-crm-nine.vercel.app/perfiles): sacar elementos innecesarios, arreglar un enlace roto, sumar un botón para **archivar prospectos** desde Hoy y Para cerrar, crear una sección de **archivados** con archivado automático al mes en Descartados, arreglar márgenes de «Todos los chats» y dar una vista previa gráfica de Resultados en Hoy. Después de aplicar esas correcciones, pidió que entrara a su Chrome a buscar más errores de diseño, que los comentara en el chat y que ella diera el ok para empezar el **rediseño**. Para qué: que el panel sea más rápido y eficiente de operar.

## 3. Órdenes y decisiones (textuales)

Mensaje del 19/11/2026 (todo en un mismo mensaje):

1. «Al principio; "https://legal-crm-nine.vercel.app/perfiles" el menu de "EN VIVO" sacarlo, ya que las estadisticas aparecen en cada perfil cuando entramos. Seria algo innecesario»
2. «ORDENAR LOS CASOS; DERIVADOS - NO DERIVADOS - PERDIDOS - ETC» (ambigua; ver pendientes y preguntas abiertas).
3. «Me gustaria que en "Hoy" en cada persona/caso que haya, al lado de derivar o responder, haya un boton de como archivo, la cual ahi directamente se archiva ese prospecto, asi se puede ordenar todo de manera mas eficiente y rapida.»
4. «"Buenas tardes / Jueves, 19 de noviembre · personas, no mensajes" El "Personas, no mensajes" sacarlo.»
5. «"Bot . 35 de 100 y en captacion y trato" Eso sacarlo»
6. «La opcion ver los 13 (en este caso son 13) que aparece en "Captados para derivar" no funciona. Me tendria que enviar al listado donde estan los captados para derivar (en este caso 13 casos)»
7. «Tambien Hoy - Sacarlo, y agregar otra forma de llegar a la seccion de resultados. Como que se sepa en el panel que esta esa seccion. Capaz algun boton o un cartel que sea una vista previa de los resultados, asi tipo graficamente, y que de ahi se puedan entrar a resultados.» (Interpretado como: sacar la sección «También hoy»; no está confirmado que fuera eso.)
8. En CHATS → Activos: «"Sin nadie por ahora: Posible captación a revisar · Agendaron." SACARLO»
9. «Tendrias que agregar lo mismo de [botón de archivo] … solamente que en la seccion "Para cerrar"»
10. «La seccion de "Todos los chats" tiene muchos problemas de margin y padding la cual se tendrian que arreglar, para verificarlo podes entrar al panel desde mi chrome y verificarlo»
11. «En la seccion "Descartados", si ya paso mas de un mes de ese contacto descartado, directamente archivarlo y que pase a una seccion la cual estarian todos los prospectos archivados»
12. «"Sin nadie por ahora: Quedaron sin respuesta." sacarlo» (en Descartados)
13. «Incidencias dejarlo tal cual como esta»
14. «La seccion contactos dejarla tal como esta»
15. «La seccion campañas dejarla tal como esta»
16. «Si queres luego de agregar mis correcciones, podes entrar a mi chrome, y verificar mas errores de diseño o problemas de diseño que haya en el panel. Cuando los tengas, me los comentas en el chat y yo te doy el ok para que arranques a re-diseñar»
17. Mensaje del 21/11/2026: pidió volcar todo el contexto del chat a `cerebro-chats` (este archivo), sin secretos ni datos personales.

No hubo órdenes que reemplacen a otras anteriores dentro de este chat. Las instrucciones del proyecto (CLAUDE.md, fechadas hasta el 15/11) siguen vigentes; ver sección 12.

## 4. Correcciones de la responsable

- No hubo correcciones posteriores a mi trabajo en este chat. Lo que no le gustaba está en las órdenes de la sección 3 (cada «sacarlo»/«no funciona»). No dio feedback sobre mi entrega antes del pedido de volcado.

## 5. Qué se hizo, con estado

Estados: especificado / implementado / probado / publicado / habilitado. Versión comprobada: commit `0773432` en la rama `claude/pensive-galileo-d6ephy`.

| Pedido | Estado |
|---|---|
| Sacar «En vivo» de Perfiles (componente fuera de la página y se quitó el espacio reservado a la derecha) | Implementado; typecheck y lint ok; no probado en pantalla; **no publicado** |
| Hoy: sacar «· personas, no mensajes» | Implementado; no publicado |
| Hoy: sacar el chip «Bot · N de 100…» (y la lectura de métricas que lo alimentaba) | Implementado; no publicado |
| Hoy: «Ver los N» de Captados para derivar lleva a `/oportunidades?perfil=…&indicador=captado_sin_derivar` | Implementado; no publicado. «Ver los N» de Atención humana se dejó como estaba (muestra todas en la misma pantalla) |
| Hoy: sacar «También hoy» (Citas próximas, Derivados sin resultado, «El bot se trabó») | Implementado; no publicado. Efecto: esos accesos ya no están en Hoy |
| Hoy: vista previa gráfica de Resultados (cuatro barras de la semana: personas que escribieron, citas, captados, derivados) + botón «Ver todos los resultados» | Implementado; no publicado |
| Botón **Archivar** en cada fila de Hoy (Atención humana y Captados para derivar) | Implementado; **requiere la migración 0634 (no aplicada)**; no publicado |
| Botón Archivar en las fichas del grupo «Para cerrar» de Chats → Activos | Implementado; igual condición |
| Activos y Descartados: sacar el renglón «Sin nadie por ahora: …» (se conserva solo en Contactos, que debía quedar igual) | Implementado; no publicado |
| Descartados: nuevo grupo «Archivados» | Implementado; no publicado |
| Archivo automático a los 30 días en Descartados | Implementado en el latido (cada hora, minuto 20 UTC); **APAGADO**: corre solo si existe `system_settings.archivo_automatico` con `{"desde": …}`. Probado solo la función pura (7 pruebas). Nada se escribió en esa clave |
| Archivo: desarchivado automático si la persona vuelve a escribir | Implementado en SQL (disparador de la migración 0634); **no aplicado** |
| «Todos los chats»: márgenes/relleno | Implementado por análisis de código (no se pudo ver la pantalla): el margen negativo superior pisaba las pestañas y el alto no descontaba pestañas/barras; se unificó el marco en los cuatro perfiles. **No confirmado que sea todo lo que ella veía** |
| Incidencias, Contactos, Campañas | Sin tocar (como se pidió) |
| Verificación de diseño en el Chrome de la responsable | **No hecha**: no se pudo acceder al navegador (ver sección 8) |
| «Ordenar los casos: derivados – no derivados – perdidos» | **No hecho** (ambiguo; se preguntó) |

Verificaciones corridas: `npm ci`, `npm run typecheck` (ok), `npm run lint` (sin avisos), pruebas unitarias nuevas `tests/unitarias/archivo.test.ts` junto con otras de colas (16 pasan, 0 fallan). **No se corrió** `npm run build`, las pruebas de integración (`tests/integracion/correr.sh`), `npm audit` ni se recorrió el panel como usuaria.

## 6. Todo lo concreto

Rutas y archivos (repo `EzequielGonz/LEGAL-CRM`):

- Perfiles: `src/app/perfiles/page.tsx` (se quitó `EnVivoRubros` y la clase de relleno `min-[1024px]:max-[1823px]:pr-[21.5rem]`). `src/components/perfiles/en-vivo-rubros.tsx` y `/api/perfiles/en-vivo` **quedaron en el repo sin usar** (no se borraron).
- Hoy: `src/app/hoy/page.tsx`, `src/components/inicio/tablero-hoy.tsx`, nuevo `src/components/inicio/vista-previa-resultados.tsx`.
- Archivo: nuevo `src/lib/archivo/archivo.ts` (`debeArchivarse`, `archivarOportunidad`, `desarchivarOportunidad`, `archivarDescartadosViejos`; constantes `DIAS_PARA_ARCHIVAR = 30`, `CLAVE_ARCHIVO = "archivo_automatico"`), nuevo `src/components/archivo/boton-archivar.tsx`, `src/app/api/oportunidades/[id]/route.ts` (acciones nuevas `archivar` y `desarchivar`; el evento queda en `opportunity_events` con dimensión `ficha`), `src/app/api/campaigns/tick/route.ts` (paso «archivo», responde la clave `archivo`).
- Listas: `src/lib/indicadores.ts` (nuevo indicador `archivados`; toda lista y conteo excluye archivados salvo ese), `src/lib/hoy/colas.ts` (excluye archivados; `oportunidadId` en las filas), `src/lib/cartera.ts` (grupo `archivados` en Descartados), `src/components/cartera/vista-cartera.tsx` (Archivar solo en el grupo `captados` de la vista `conversaciones`; renglón de vacíos solo en `contactos`).
- Marco de chats: `src/app/controles.css` (`.marco-inbox`: margen superior 0.75rem y borde superior), `src/app/(dashboard)/inbox/layout.tsx` (alto `calc(100vh-17rem)` con mínimo 26rem) y `src/app/panel/{agencia_0km,coberturas_medicas,marketing}/chats/layout.tsx` (se quitó `!mt-0`).
- Documentación: `docs/ESTADO.md` (sección «Rediseño del panel jurídico (19/11, en curso)»). **No se creó** `docs/etapaN/` (`ENTREGA.md`, `INFORME.md`, `MIGRACIONES.md`), que CLAUDE.md exige por entrega: pendiente.
- Migración: `supabase/migrations/0634_archivo_de_prospectos.sql`.
- Pruebas: `tests/unitarias/archivo.test.ts`.
- Reglas del archivo automático: se archivan solo descartados (perdido, caído o detenido) sin captados, con `updated_at` y `last_inbound_at` de más de 30 días; máximo 200 por perfil por corrida; actor «sistema».
- Ids de Metricool, publicaciones programadas, campañas y plantillas: **ninguno**; este chat no tocó redes, campañas ni plantillas.
- Enlaces: sesión de Claude Code (arriba); panel https://legal-crm-nine.vercel.app/perfiles. Sin artefactos ni documentos de Claude Docs.

## 7. Datos del negocio que aparecieron

- Ejemplo de cifra mostrada por la responsable: **13 captados para derivar** (jurídico) y bot «35 de 100» el 19/11 (jueves 19 de noviembre, «Buenas tardes»).
- Contexto de CLAUDE.md y `docs/ESTADO.md` (ya existente, no nuevo de este chat): cuatro perfiles (Jurídico con Civil y Penal, Coberturas médicas, Autos 0 km, Marketing); stack Next.js 14, Supabase, API oficial de Meta, Vercel; seguimiento automático encendido; caídos automáticos; descartes automáticos a las 6 horas; sin pausa general. Todo eso se leyó y no se cambió.
- Sin precios, roles del equipo ni proveedores nuevos.

## 8. Pendiente, a medias o bloqueado

- **Bloqueado:** revisión de diseño en el Chrome de la responsable. El conector de navegador (Opera MCP) respondió «Browser not connected»; no hay máquina adjunta. Hay que reconectarlo o recibir capturas.
- **Pendiente de decisión:** qué significa «ORDENAR LOS CASOS; DERIVADOS - NO DERIVADOS - PERDIDOS - ETC» (¿la tabla oculta «Captados y casos», o los grupos de Etapas/Descartados? Contactos debía quedar igual).
- **Pendiente de ok:** aplicar la migración 0634, publicar a `main`/producción, y encender el archivo automático (la primera pasada archivaría de una vez todos los descartados viejos existentes).
- **Pendiente:** lista de errores de diseño del resto del panel y ok para el rediseño visual.
- **A medias / a confirmar:** que el arreglo de «Todos los chats» cubra lo que ella veía; que «También hoy» fuera lo que quiso sacar; si «Ver los N» de Atención humana también debe ir a una lista.
- **Pendiente de documentación:** `docs/etapaN/` (ENTREGA, INFORME, MIGRACIONES) de esta entrega.
- No se archivó un seguimiento: personas archivadas con `capture_state = captado` siguen contando como captados en métricas y Resultados (solo se ocultan de las listas de trabajo).
- Efecto colateral conocido: la agenda (citas) y los conteos de semana en Resultados no excluyen archivados.

## 9. Lo que aprendí

- El repo exige leer antes `.claude/referencias/reglas-comunes.md` y `docs/ESTADO.md`; las reglas «nada se borra, se archiva», «nada se activa solo» y «publicar no habilita» condicionaron el diseño del archivo (apagado por defecto, reversible, con motivo).
- Las listas de Hoy/Activos salen de `src/lib/indicadores.ts` (una definición por indicador, usada por contador y lista); filtrar archivados ahí cubre casi todo. `colas.ts` tenía consultas propias que hubo que filtrar aparte.
- `opportunities` no tenía noción de archivado (sí bases y campañas). `opportunity_events` solo admite dimensiones fijas; se usó `ficha`.
- Causa probable de los problemas de «Todos los chats»: `.marco-inbox` usaba márgenes negativos pensados para otro relleno, el layout de Jurídico no anulaba el margen superior (los otros tres sí con `!mt-0`) y el alto de Jurídico (`100vh-4rem`) no descontaba pestañas ni barras.
- El «Ver los 13» actual solo ponía `?todo=1` en la misma pantalla (mostraba todas ahí mismo), no llevaba a la lista.
- `next lint` y `tsc` corren bien en el contenedor tras `npm ci` (10 s). No hizo falta `build`.
- Error no resuelto: sin acceso al navegador de la responsable, la revisión visual quedó sin hacer. El conector de navegador debe estar habilitado («Allow AI connection») y con sesión.

## 10. Preguntas abiertas

1. ¿Qué pantalla es «ordenar los casos: derivados – no derivados – perdidos – etc.»?
2. ¿Aplicamos la migración 0634 y publicamos? ¿Encendemos el archivo automático a los 30 días (y con qué fecha de «desde»)?
3. ¿«Tambien Hoy – Sacarlo» era la sección «También hoy»? ¿Aceptás perder esos accesos (Citas próximas, Derivados sin resultado, «El bot se trabó»)?
4. ¿El «Ver los N» de Atención humana también debe ir a su lista?
5. ¿Dónde reconectamos el navegador para revisar diseño, o preferís capturas?
6. ¿Archivar un captado debe afectar sus métricas de captación o solo la lista de trabajo (hoy solo la lista)?

## 11. RAMAS Y CAMBIOS

**Ramas usadas (repo `EzequielGonz/LEGAL-CRM`):**

- `claude/pensive-galileo-d6ephy`: rama de trabajo asignada a esta sesión. Salió de la punta de trabajo anterior (el commit padre `d4e7a58` «Botones que cambiaban de perfil y velocidad de Hoy y Campañas»; no confirmé desde qué rama exacta se creó). Contiene todo el trabajo de este chat en un commit. **No está integrada a main** (main está en `66c457b`). **Sin PR** (no se pidió crear). Acción sugerida: revisar y, con el ok de la responsable, integrar a `main` (publicación directa según ESTADO) o abrir un PR; antes aplicar 0634.
- `cerebro-chats`: creada en este paso desde `main` (`66c457b`) para esta memoria; contiene solo este archivo en `cerebro/chats/`. Sin PR. Acción: dejar como archivo de memoria (no integrar a main salvo que se decida).

Otros repos de la lista de acceso (`estudio-juridico-vita-final`, `coberturas-sociales-landing`, `agencia-kocos-mkt`, `0km-kocos-agencia`): **no se usaron**.

**Commits:**

- `0773432` · 19/11/2026 · «Rediseño panel: Hoy más limpio, archivar prospectos, Archivados en Descartados y marco de chats unificado» (20 archivos, +313 −78).
- Commits previos en la rama, no hechos en este chat: `d4e7a58`, `f581a9e`.
- Commit de este archivo en `cerebro-chats`: ver el resultado del push (se informa en la respuesta del chat).

**Archivos tocados por carpeta** (commit `0773432`):

- `docs/`: `ESTADO.md`.
- `src/app/`: `controles.css`, `perfiles/page.tsx`, `hoy/page.tsx`, `(dashboard)/inbox/layout.tsx`, `panel/{agencia_0km,coberturas_medicas,marketing}/chats/layout.tsx`, `api/campaigns/tick/route.ts`, `api/oportunidades/[id]/route.ts`.
- `src/components/`: `archivo/boton-archivar.tsx` (nuevo), `cartera/vista-cartera.tsx`, `inicio/tablero-hoy.tsx`, `inicio/vista-previa-resultados.tsx` (nuevo).
- `src/lib/`: `archivo/archivo.ts` (nuevo), `cartera.ts`, `hoy/colas.ts`, `indicadores.ts`.
- `supabase/migrations/`: `0634_archivo_de_prospectos.sql` (nuevo).
- `tests/unitarias/`: `archivo.test.ts` (nuevo).

**Migraciones:** `0634_archivo_de_prospectos.sql`: agrega a `public.opportunities` las columnas `archived_at`, `archived_by`, `archive_reason`, un índice parcial y el disparador `messages_zz_desarchivar` (desarchiva al llegar un mensaje entrante). Repetible, sin borrados. **NO aplicada** (ni a la base de producción ni a ninguna otra). Revertir: eliminar el disparador; las columnas pueden quedar.

**Despliegues:** ninguno. Nada se publicó a Vercel ni a `main` por este chat. (Es posible que Vercel genere una Preview automática de la rama; no se comprobó.)

**Cambios de configuración fuera del código:** ninguno (sin variables de Vercel, Supabase, Meta, Metricool, Google ni redes tocados).

**Qué quedó encendido o apagado por este chat:** nada encendido. El archivo automático está implementado pero apagado (clave `archivo_automatico` sin escribir). Lo ya encendido (seguimiento, caídos, descartes a 6 h, etc.) no se tocó.

## 12. CONTRADICE:

- CONTRADICE: ninguna instrucción previa fue contradicha de forma directa. Puntos a vigilar:
  - La orden de sacar «También hoy» elimina accesos que `docs/ESTADO.md`/Hoy del 13/11 definían («en Hoy queda solo lo que lleva a una acción»): Citas próximas, Derivados sin resultado, El bot se trabó. La orden de la responsable (19/11) prevalece, pero esos accesos dejaron de estar visibles en Hoy.
  - La responsable pidió el 13/11 que los números de semana estuvieran solo en Resultados; ahora Hoy muestra una vista previa con cifras de la semana (pedido expreso del 19/11).
  - La regla «Nada se borra, se archiva con motivo» se cumple; la regla «Nada se activa solo» se respetó dejando el archivo automático apagado aunque la responsable pidió «directamente archivarlo» (queda a su ok).
  - Texto que decía en `docs/ESTADO.md` «Última actualización: 14/11/2026» se actualizó a 19/11/2026.

---
_Memoria generada el 21/11/2026 desde el chat de Code. Sin secretos ni datos personales._
