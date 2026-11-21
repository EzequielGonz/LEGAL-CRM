# Cowork · Etapa 2, herramientas y entrega consolidada (CRM multirubro)

## 1. Encabezado

- **Título del chat:** Etapa 2 (rubros y fases), herramientas, bloque 1.12 y entrega consolidada. Origen: `cerebro/chats/cowork/cowork-a-etapa2-herramientas-1013.md` (transcripción redactada, con resúmenes de compactación).
- **Fecha de inicio:** 2026-10-13 04:17 UTC (primera transcripción; viene de una sesión anterior compactada).
- **Fecha de fin:** 2026-11-21 07:16 UTC (último registro: pedido de historial completo).
- **Origen:** Cowork (Claude Code en Cowork, proyecto CRM). Modelos usados: Fable 5.1 (esfuerzo alto), Opus 5.5, Haiku 5.5 (cambios hechos por la responsable con `/model`).
- **Id de sesión:** `21eae99c-728a-51a2-8d84-1efd5dbf7574` (la que aparece en los resúmenes de compactación de la transcripción).
- **Marcas o perfiles:** Estudio Jurídico Integral Vita (Jurídico con Civil y Penal) como cliente; Coberturas médicas, Autos 0 km y Marketing; agencia de la responsable: ORVIAN (ver CONTRADICE sobre «Kocos»).
- **Repo y despliegue:** GitHub `EzequielGonz/LEGAL-CRM`; Vercel proyecto `prj_liUp46HbkMc0lPlhX1hX5CVLwsYt` (legal-crm); Supabase proyecto `enhgkeqiqcuwafsedaza`.
- **Estado al cierre de la transcripción:** sin cierre técnico. La Etapa 2 consolidada no quedó verificada con dependencias reales ni entregada como ZIP único al programador.

## 2. Objetivo

Ordenar las entregas recibidas (parche 2.0 del 13/10, Etapa 2 verificada, herramientas-1), integrarlas en un único código vigente sobre el repo, cerrar el bloque de seguridad 1.12 y dejar una guía de 5 pasos con SQL en orden. La responsable pidió que todo lo del parche 2.0, salvo el entrenamiento, quedara integrado en esta etapa, y que lo pesado se hiciera primero y la seguridad (0202) al final.

## 3. Órdenes y decisiones de la responsable

Las órdenes del mensaje grande del 13/10 (04:17 UTC) llegan citadas en el resumen de compactación; el texto de cada una es el que aparece en ese resumen.

- **2026-10-13 (mensaje grande):** «Simplificame toda la entrega porque hay demasiados archivos y versiones. Prepará un único ZIP de código vigente, con las correcciones y las skills integradas, conservando los cambios actuales del proyecto. Acompañalo con una guía de máximo 5 pasos: qué tengo que subir, dónde, qué hacer en Supabase y cómo comprobar que quedó bien. Incluí los archivos SQL necesarios e indicá su orden exacto. Integrá y comprobá vos todo lo que puedas. De mi lado dejá únicamente las acciones que requieren mi acceso.» Reemplaza a las entregas anteriores («la original del 12/10 y la “corregida” quedan superadas»).
- **2026-10-13 (mismo mensaje):** «Mantené las reglas aprobadas y las pausas actuales. No habilites envíos automáticamente.»
- **2026-10-13 (mismo mensaje):** «No levantes pausas, envíes a prospectos, publiques en producción, habilites publicación externa ni inicies trabajos pagos por el solo hecho de recibir este prompt.»
- **2026-10-13 (mismo mensaje):** «Conservá las pausas y el seguimiento apagado» y «Mantené la pausa general, agentes apagados, tarea programada inactiva, campañas pausadas y seguimiento apagado. Publicar código no equivale a habilitar envíos.»
- **2026-10-13 (mismo mensaje):** «No reapliques migraciones ni descartes controles existentes por inferencia.» Regla de migraciones: revisar versión e historial, aplicar solo la actualización necesaria verificada.
- **2026-10-13 (mismo mensaje):** «No incorpores el complemento Vercel.»
- **2026-10-13 (mismo mensaje):** «No declares el sistema inhackeable, posiciones SEO garantizadas, modelo reentrenado ni producción actualizada sin evidencia» y «No declares instalado un plugin por haber escrito instrucciones.»
- **2026-10-13 (mismo mensaje):** «No me pidas que pegue contraseñas, tokens privados o claves de servicio en el chat.» Y sobre el PIN: no repetirlo, no guardarlo, no cargarlo en Vercel ni en la base; lo carga la responsable.
- **2026-10-13 (mismo mensaje):** «No vuelvas a preguntarme qué tipo de entorno prefiero si podés reutilizar ese método» (sandbox aislado con datos inventados, base separada, sin variables de producción, Meta simulado).
- **2026-10-13 (autorización del bloque 1.12):** «Te autorizo a desarrollar y probar este bloque en la copia de trabajo y en un entorno aislado.» Alcance: sesión y autorización verificadas en el servidor, sin borrar sesiones ni cambiar la política de permanencia; endpoints públicos sin tocar; revisar advisories de dependencias sin declarar 1.11 cerrado.
- **2026-10-13 (sobre el orden):** «todo lo que te pase ya tiene que integrarse en esta etapa, los parches y las actualizaciones menos el entrenamiento, ya tiene que estar hecho aca». Reemplaza a la idea previa de presentar las mejoras «por bloques después de la seguridad».
- **2026-10-13 06:43 UTC:** «nadie va a ver eso, dejalo para el final. hace todo primero y esto lo mas largo de la puerta cerrada dejalo para lo ultimo, te cambio el modelo para todo lo primero y despues cuando estes por terminar la etapa 2 con esto ya al final pausa todo y avisame asi cambio el modelo para bajar el consumo» (la seguridad 0202 y el cierre quedan para el final).
- **2026-10-13 06:56 UTC:** «ok hace los bloques 1 y 2 super completos con fable 5 esfuerzo alto y cuando los termines avisame y pasamos a opus 5.5 extra. y terminamos el cierre con opus 5.5 medio. esta bien?» Respuesta de la responsable 06:58: «ok dale. hagamos 1 y 2 ya puse fable 5 esfuerzo alto.»
- **2026-10-13 07:05 UTC:** «no entonces / frena».
- **2026-10-13 07:07 UTC:** «dame el zip. abro otra conversacion y q le digo mandame un texto corto voy con opus medio?»
- **2026-10-13 07:14 UTC:** «bueno decile que arranque con lo ultimo que ibamos a hacer todo en un prompt, que no frene, lo haga de corrido con el mismo modelo que lo pongo».
- **2026-10-14 01:00 UTC:** «Perfecto, como lo integro a github?» y «Que credenciales faltarian?»; luego «necesito que me digas como conseguir las keys de VAPID_PUBLIC_KEY y etc».
- **2026-10-15 17:11 UTC:** «Quiero hacer que tengas el control total de mi cuenta de github.» Respuesta del asistente: no se recomienda; se propone acceso limitado a un solo repo con aprobación.
- **2026-10-15 (mitad de turno):** «ponele 8- cambiamos las reglas tenes acceso total a github siempre preguntandome y te digo asi como me dijiste, 'dale'». Regla nueva: cada acción en GitHub se propone y se ejecuta solo con «dale».
- **2026-10-15 17:28 UTC:** «Quiero verificar que tenés acceso de escritura al repositorio EzequielGonz/LEGAL-CRM» y «Si no tenés permisos, no simules la operación ni afirmes que se realizó. Mostrame el error exacto y qué permiso falta.»
- **2026-11-21 07:07 UTC:** «Necesito que vuelques TODO el contexto de este chat a la memoria central del proyecto. Usá todas las skills, plugins y conectores que tengas. No resumas de más: prefiero que sobre a que falte.»
- **2026-11-21 07:11–07:16 UTC:** «hacelo bien, con todo el contexto a fondo, como te conecto el repo?»; «ok hace una rama nueva y decime cual es»; «dale»; «en vez de una rama si me das un zip?»; «el historial completo necesito, de todo este chat».

## 4. Correcciones que hizo la responsable

- **Alcance del parche 2.0:** el asistente había dicho que el rediseño y las mejoras iban por bloques después de la seguridad. La responsable lo corrigió: todo entra en esta etapa, salvo el entrenamiento (06:38–06:39 UTC).
- **Orden:** la seguridad (0202) y el cierre pasan al final, no antes (06:43 UTC).
- **Estimación de tiempo:** el asistente dio 9 h hasta el aviso de cierre; la responsable dijo «pero no tenes que rehacer todo de 0… 9 horas sigue siendo muchisimo» y el asistente bajó a 4–6 h estimadas sin medición confiable.
- **Capturas:** el asistente iba a mandar capturas del bloque 2; la responsable: «mandarme capturas no hace falta en el bloque 2» (06:50 UTC).
- **Estado de la Etapa 2:** el asistente escribió que la Etapa 2 estaba «implementada y probada». Lo corrigió el propio asistente con la responsable: 2.1, 2.2 y 2.4 a 2.9 son especificados, no implementados.
- **Presentación de la entrega:** el asistente afirmó que la entrega verificada del 12/10 estaba probada con dependencias reales. Según el resumen final, eso aplica solo a la entrega del 12/10, que quedó superada por el consolidado; no al consolidado.
- **GitHub:** el asistente rechazó «control total» y propuso acceso a un solo repo con «dale»; la responsable aceptó esa regla (15/10).

## 5. Qué se hizo (paso a paso, con estado)

Estados: E = especificado · I = implementado · P = probado · Pub = publicado · H = habilitado.

1. **Ordenamiento de entregas (13/10).** Se verificó el estado real: GitHub `main` = `fb5cdc3`, sin rama `etapa2`; Vercel producción = `fb5cdc3`; Supabase: 23 políticas públicas, 308 grants a clave pública, 0199 no aplicada, 0200 y 0201 sin tablas, pausa activa desde el 9/10, una campaña `pausada`, último mensaje 5/10. **E** sí · **P** sí (lectura de base y repo) · **Pub** no · **H** no.
2. **Etapa 2 entrega 1 verificada (12/10).** Según el chat, verificada con dependencias reales en sandbox ese día; reemplazada por el consolidado. **I** sí · **P** sí (ese día, según el chat) · **Pub** no · **H** no.
3. **Herramientas-1 (skills y documentos).** Se reescribieron las skills `kocos-crm-contexto`, `kocos-crm-reglas-de-captacion`, `kocos-crm-diseno-y-accesibilidad`, `kocos-crm-pruebas-de-aceptacion`, `kocos-landings-seo-y-conversion`, `kocos-agentes-entrenamiento-y-evaluacion` y se creó `kocos-contenido-y-publicacion`. Se escribieron `.claude/referencias/reglas-comunes.md` (v1.0), `.claude/referencias/casos-de-aceptacion.md` (A01–A35) y `.claude/skills/PROCEDENCIA.md`. **E** sí · **I** sí en copia de trabajo · **P** parcial: tres salidas de `claude -p` que cargan las skills (`docs/herramientas/PRUEBAS-SKILLS.md`), sin pruebas de producto · **Pub** no · **H** no.
4. **Bloque 1.12 (sesión por operación en servidor).** `validateSession`, `currentSessionVersion` con caché 30 s y cierre ante falla, `requireSession` en 62 archivos de rutas (68 handlers), `requirePageSession` en layouts y páginas privadas, middleware que responde 503 recuperable ante falla de base, y filtros seguros de búsqueda (`textoBusquedaSeguro`). Cabeceras de seguridad en `next.config.mjs` (sin CSP todavía). **E** sí · **I** sí en copia de trabajo · **P** en entorno local (PostgreSQL y PostgREST simulado): unitarias 73/73 e integración 61/61 (53 previas + 8 nuevas de sesión), según el chat; **no** con dependencias reales · **Pub** no · **H** no.
5. **Migración 0202** (`supabase/migrations/0202_etapa1_funciones_sin_acceso_publico.sql`). Revoca EXECUTE de PUBLIC, anon y authenticated en funciones públicas y fija `search_path` en `is_admin()` y `set_updated_at()`. **I** sí (archivo) · **P** en copia tipo producción (`crm_0202`, copiada de `crm_secuencia`): funciones ejecutables por anon de 45 a 0, idempotente, los triggers siguen disparando · **Pub** no · **H** no (no aplicada a la base real).
6. **Bloque 1.11 (dependencias).** Advisories: `next` 14.2.35 (crítico), `postcss` dentro de next, `source-map-js`, `xlsx` 0.18.5 (sin fix en npm). Se propuso probar Next 15.5.x y SheetJS 0.20.3 en el sandbox. **E** sí · **I** no · **P** no · **Pub** no · **H** no. **No cerrado.**
7. **Verificación con dependencias reales (sandbox Vercel).** Sandbox `sbx_V8ayJetxeIpSHjvSGpTGF0c2dud4` (repo en `/vercel/LEGAL-CRM`, fb5cdc3). Se subieron las partes del paquete en base64. Hubo dos caídas (HTTP 410 `sandbox_stopped`) y se recreó como `verificacion-consolidada-1310c` desde snapshot. Descarga de PostgREST 12.2.3 (asset `postgrest-v12.2.3-linux-static-x64.tar.xz`). **Estado final: no terminada.** Faltaba subir y verificar hashes de las partes 03 a 07, reconstruir el paquete, tipado, lint, build, pruebas y `npm audit`. **P** no. **Pub** no.
8. **Copia de trabajo (13/10, 07:08 UTC).** `kocos-copia-de-trabajo-1310.zip` con 854 archivos (huella SHA-256 que empieza en `f0708fc8`) y `CONTEXTO_ACTUAL_CRM.md`, enviados a la responsable para continuar en otra tarea. No es entrega para el programador. **I** sí · **Pub** no.
9. **Bloque 1 «reglas de base» (13/10, 07:05 UTC).** Se empezó: dos archivos nuevos de reglas puras (origen de la tarea y política de horario; captación por rubro, resultado posterior a derivación y clasificación de atención humana). Sin migración, sin cambios en código existente, sin pruebas. La responsable frenó. **I** parcial · **P** no · **Pub** no. La migración prevista era `0203`.
10. **Bloques 2 a 5 y cierre.** Especificados según el plan de 13/10 (rediseño del panel, operación diaria, biblioteca de agentes apagada, SEO y contenido sin conectar, cierre con verificación y SQL en orden). Estimado por el asistente: 12–18 h en total, con cierre en Opus 5.5 esfuerzo medio. **E** sí · **I** no.
11. **Documentación de contexto.** `CLAUDE.md` reescrito (9 reglas no negociables, convención de requireSession, cinco estados). `CONTEXTO_ACTUAL_CRM.md` y `CONTEXTO_COMPLETO_CRM.md` (14 secciones, en `.md` y PDF). Documento de Claude Docs `b5fb8ad6-926b-4bd2-8675-298c2730d216` (plan) y `ab17bffa-8e18-4342-b6af-b5d5f8ff804b` (análisis, con 14 hallazgos). **I** sí · **Pub** no.
12. **Paquete para GitHub (14/10).** `kocos-pipeline-trabajo-1410.zip` con 855 archivos (huella SHA-256 que empieza en `5562866c`). El asistente recomendó no integrarlo a `main`: solo como resguardo en una rama aparte, sin PR ni migraciones. **I** sí (ZIP) · **P** no · **Pub** no · **H** no.
13. **Subida del paquete a GitHub (15/10).** Intento de escritura: lectura OK (`main` = `fb5cdc3`, `etapa1-correcciones` = `23669fd`, `trabajo-1410` = `e3eb799`), escritura **403**: «GitHub access to this repository is not enabled for this session». No se subió nada. Commit local `13acc7f` en rama `prueba-escritura-claude` de un clon temporal, sin subir. **P** del error, no de la escritura.
14. **Respaldo del chat (21/11).** Se intentó crear la rama `cerebro-chats-2026-11-21`: **403** («Write access to this GitHub API path is not permitted through this proxy»). Nada creado. Se entregó `cerebro-chats-2026-11-21.zip` con `cerebro/chats/2026-10-13-cowork-crm-multirubro.md`.

## 6. Todo lo concreto

**Archivos (copia de trabajo, `/home/claude/legal-crm`, no en el repo):**
- Sesión y autorización: `src/lib/acceso/session.ts` (versión de sesión, `validateSession`), `src/lib/acceso/autorizacion.ts` (nuevo: `requireSession`, respuestas 401 y 503 con `Retry-After: 5`), `src/lib/acceso/pagina.tsx` (nuevo: `requirePageSession`, componente de reintento), `src/middleware.ts`.
- Layouts y páginas privadas con `requirePageSession`: `src/app/(dashboard)/layout.tsx`, `src/app/panel/agencia_0km/layout.tsx`, `src/app/panel/coberturas_medicas/layout.tsx`, `src/app/panel/marketing/layout.tsx`, `src/app/panel/[slug]/page.tsx`, `src/app/telefono/layout.tsx`, `src/app/ficha/[id]/page.tsx`, `src/app/derivar/page.tsx`, `src/app/perfiles/page.tsx`, `src/app/inicio/page.tsx`.
- Rutas públicas sin tocar: `acceso/ingresar`, `acceso/salir`, `webhooks/meta`, `webhooks/whatsapp`, `campaigns/tick`, `landing`.
- Búsqueda segura: `src/lib/busqueda.ts` (nuevo), aplicado en `src/app/api/inbox/route.ts`, `src/components/casos/casos-list.tsx`, `src/app/telefono/[slug]/clientes/page.tsx`, `src/app/(dashboard)/prospectos/page.tsx`.
- Cabeceras: `next.config.mjs` (X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy).
- Pruebas: `tests/integracion/soporte/entorno.ts`, `tests/integracion/sesion-por-operacion.int.test.ts` (nuevo, 8 casos), `tests/unitarias/acceso-y-webhooks.test.ts`, `tests/sin-npm/next-server.ts`, `tests/sin-npm/supabase-js.ts`.
- Documentos: `docs/herramientas/ENTREGA.md`, `docs/herramientas/PRUEBAS-SKILLS.md`, `docs/etapa2/{ENTREGA,INFORME,MIGRACIONES}.md`, `.claude/referencias/reglas-comunes.md`, `.claude/referencias/casos-de-aceptacion.md`, `.claude/skills/PROCEDENCIA.md`, `CLAUDE.md`.
- Migraciones: `supabase/migrations/0202_etapa1_funciones_sin_acceso_publico.sql` (nueva). Pendiente de numerar: `0203` (reglas de base del bloque 1).

**Ramas, commits y repos:**
- `main`: `fb5cdc3` (13/10). Desde el 14/10 el chat no tocó `main`. Hoy (21/11, lectura de esta sesión) `main` = `66c457b`. Lo que entró entre medio no está confirmado.
- `etapa1-correcciones`: `23669fd` (rama local de trabajo del 15/10; árbol igual a `fb5cdc3`, según el chat).
- `trabajo-1410`: `e3eb799` (existe en remoto el 15/10; no se sabe quién la creó: no confirmado).
- `prueba-escritura-claude`: commit local `13acc7f`, sin remoto. Descartable.
- Sin PR abierto ni a `main` desde este chat.

**Migraciones (estado a 13/10):**
- `0199`: no aplicada en la base real. Se pidió aplicarla antes que 0200.
- `0200`, `0201`: no aplicadas (sin tablas en la base real). `0201` corregida, según el chat.
- Orden de aplicación pedido: 0199 → `etapa1_reconciliar_posteriores()` → 0200 → 0201 corregida → 0202. Cada una con precondiciones, verificaciones posteriores y rollback. Ninguna aplicada desde este chat.

**Despliegues:** producción `dpl_CcXg2KJFKoCtJFB8dGDA3rR6vGUU` = `fb5cdc3`. Sin despliegues nuevos en este chat.

**Sandboxes de Vercel (datos inventados, ya detenidos o expirados):** `sbx_V8ayJetxeIpSHjvSGpTGF0c2dud4` (410, detenido), `verificacion-consolidada-1310c` (persistente, incompleto). Hay un snapshot que se reanudó con `get_named_sandbox resume=true`.

**Documentos de Claude Docs:** plan `b5fb8ad6-926b-4bd2-8675-298c2730d216`; análisis `ab17bffa-8e18-4342-b6af-b5d5f8ff804b`; en 11-21 el documento de respaldo se llama «2026-10-13-cowork-crm-multirubro» (enlace en el chat, no abierto).

**Configuración fuera del código:**
- Variables de Vercel mencionadas por nombre: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `SESSION_SECRET`, `GEMINI_MODEL`, `GEMINI_API_KEY`, `CRON_SECRET`, `ACCESS_PIN` (la responsable la carga). Faltaban en Coberturas, Autos, VAPID, SESSION_SECRET y GEMINI en Preview (según 14/10).
- Ninguna variable se cambió desde este chat. No se leyeron valores.

**Qué quedó encendido o apagado por este chat:** nada. Pausa general activa, agentes apagados, tarea programada inactiva, campañas `pausada`, seguimiento apagado (verificado en base el 13/10).

## 7. Datos del negocio

- Estudio Jurídico Integral Vita: Civil y Penal, Jurídico frío. Sus perfiles de captación tienen reglas de horario y circuito (ver `reglas-comunes.md`).
- Horario de contacto de la empresa: lunes a sábado de 8 a 21 (Argentina). Respuestas a entrantes: 24/7 si el perfil y el agente están habilitados (regla del parche 2.0).
- Seguimiento: slots de 48–72 h; circuito de tres contactos.
- Fine tuning (fuera de esta etapa, en Fase 3): candidato `gemini-3.5-flash` (según el parche), corpus 600/100/160, compuerta de preferencia ciega del 60%, un modelo principal afinado.
- Pausas y controles de negocio: no se levantan sin autorización expresa.
- Roles: responsable de la empresa (decide, carga credenciales, aprueba envíos); programador que revisa, integra y publica entregas (ver CONTRADICE).

## 8. Pendiente, a medias o bloqueado

1. Terminar la verificación con dependencias reales del consolidado (partes 03–07, hashes, tipado, lint, build, pruebas, `npm audit`). Bloqueada por caídas del sandbox.
2. Cerrar 1.11 (Next 15.5 y SheetJS 0.20.3): solo trial, sin resultado.
3. Bloque 1 (reglas de base), bloques 2 a 5 y cierre: especificados, no implementados. Migración `0203` pendiente.
4. ZIP único con guía de 5 pasos, SQL en orden (0199 → reconciliación → 0200 → 0201 → 0202) e informe: no entregado.
5. Subir el paquete a GitHub: bloqueado por 403 (15/10 y 21/11). Requiere que la sesión tenga el repo autorizado.
6. Aplicar migraciones en Supabase: ninguna aplicada desde este chat.
7. Cargar en Vercel las variables faltantes (Coberturas, Autos, VAPID, SESSION_SECRET, GEMINI en Preview): responsable.
8. Cambiar el PIN de ingreso después del despliegue (ver secreto en sección 12).
9. Revisar la lógica de `SESSION_SECRET` (respaldo con la clave de servicio) antes de publicar.

## 9. Aprendizajes

- **Qué funcionó:** verificar el estado real del repo y de la base antes de asumir (detectó que 0199 no estaba aplicada). Hacer pruebas de migraciones sobre copia tipo producción antes de tocar la base real.
- **Qué no funcionó:**
  - Sandbox de Vercel: dos caídas con HTTP 410; `extend_session_timeout` rechazado por exceder el máximo.
  - Consultas SQL con columnas o enums inexistentes (`automation_pause`, `paused`, `created_at` en `ops_change_log`). Corregidas: el estado de campaña es `pausada`.
  - Nombre de asset de PostgREST: `x86-64` no existe, es `x64`.
  - Tests: el valor de `fallasSesion` se consumía en la primera verificación (se pasó a 2); el helper de sesión de prueba insertaba un PIN distinto del configurado (se corrigió usando el hash de `ACCESS_PIN`).
  - Hooks `stop-hook-git-check` pidieron commit y push varias veces; nunca se ejecutó nada en origen. La regla del proyecto era «dale» explícito.
- **Errores de comunicación del asistente:** dijo «implementada y probada» la Etapa 2 y «verificada con dependencias reales» lo consolidado; ambas afirmaciones se corrigieron (ver sección 4 y CONTRADICE).

## 10. Preguntas abiertas

- ¿El repo `EzequielGonz/LEGAL-CRM` quedó autorizado para escritura en la sesión nueva? (no confirmado).
- ¿Cuál es la rama de producción de Vercel? (se asume `main`).
- ¿Qué entró a `main` entre `fb5cdc3` (13/10) y `66c457b` (21/11)? (no confirmado).
- ¿Quién creó la rama `trabajo-1410` (`e3eb799`)? (no confirmado).
- ¿El inventario de landings, el acceso a Search Console y la configuración de Meta (plantillas, líneas) están listos? La responsable debía responder el inventario de landings.
- ¿`GEMINI_MODEL` en producción vale lo que el proyecto espera? (el chat dice «gemini-3.6-flash» en código y «gemini-2.5-flash» en `env.example`: no confirmado).
- ¿El flujo «Aplicar pipeline Kocos» se corre automáticamente al subir un ZIP? (el chat no lo verificó).

## 11. Ramas y cambios (explícito)

| Repo / rama | Para qué | Sale de | Contenido | Estado de integración | PR | Qué hacer |
|---|---|---|---|---|---|---|
| `EzequielGonz/LEGAL-CRM` `main` | producción | — | `fb5cdc3` (13/10); hoy `66c457b` | es la base | no | no tocar sin autorización |
| `etapa1-correcciones` (local) | trabajo del 15/10 | `fb5cdc3` | `23669fd`, árbol igual a `fb5cdc3` (según el chat) | no integrada | no | archivar o borrar la local |
| `trabajo-1410` (remoto) | paquete de resguardo del 14/10 | no confirmado | `e3eb799` (15/10) | no integrada | no | revisar; integrar el ZIP único y archivar |
| `prueba-escritura-claude` (local, clon temporal) | prueba de permisos del 15/10 | `fb5cdc3` | commit `13acc7f` (archivo de prueba) | no subida | no | descartar |

**Commits de este chat:** solo `13acc7f` (local, prueba de escritura). Ningún commit subido.

**Archivos tocados por carpeta (copia de trabajo):**
- `src/lib/acceso/`: `session.ts`, `autorizacion.ts`, `pagina.tsx`.
- `src/app/**/`: 62 archivos de rutas (`requireSession`) y 10 layouts o páginas (`requirePageSession`).
- `src/middleware.ts`, `src/lib/busqueda.ts`, `next.config.mjs`.
- `tests/`: 5 archivos de prueba y soporte.
- `supabase/migrations/`: `0202_etapa1_funciones_sin_acceso_publico.sql`.
- `.claude/`, `CLAUDE.md`, `docs/`: skills, referencias, documentos.

**Migraciones:** `0202` (creada, probada en copia, no aplicada). `0199`, `0200`, `0201`: no aplicadas (13/10). `0203`: prevista, no creada.

**Despliegues:** ninguno desde este chat. Producción: `fb5cdc3` / `dpl_CcXg2KJFKoCtJFB8dGDA3rR6vGUU`.

**Configuración fuera del código:** ninguna cambiada. Supabase: sin cambios (pausa, campañas y seguimiento como estaban). Meta, Metricool, Google, Vercel: sin cambios.

## 12. CONTRADICE

- **Reglas de GitHub.** El chat (13/10 y 14/10) dice «en este proyecto no escribo en GitHub, todo va por ZIP». El 15/10 la responsable cambió a «acceso total… siempre preguntandome… dale». El `CLAUDE.md` vigente (20/11) dice «Todo lo demás Claude lo implementa, prueba, publica y verifica directo (GitHub, base, configuración, despliegue, Metricool), sin pedir «dale» por cada paso». Única restricción de ese documento: pagos. Son tres reglas distintas; prevalece la del 20/11 si la responsable no dice lo contrario.
- **Publicación.** El chat (13/10) dice que «un programador revisa, integra y publica tus entregas». El `CLAUDE.md` del 20/11 dice que Claude publica directo. Para la entrega de Etapa 2 hace falta confirmar quién integra a `main`.
- **Versión de Next.js.** El chat dice Next 14.2.35 (con advisory crítico y trial de 15.5 en curso). El `CLAUDE.md` del 20/11 dice Next 15.5. No se sabe si el 1.11 se hizo.
- **Migraciones.** `CLAUDE.md` del 20/11 dice «Migraciones en `supabase/migrations/`, numeradas por etapa (`01xx`, `02xx`)». El chat usa 0199–0203 (etapa 2 y 1.12), y el chat del rediseño usa `0400`.
- **Nombre de agencia.** El chat dice ORVIAN. La memoria de la responsable (según el chat de rediseño) dice «ORVIAN, no Kocos», pero una versión posterior del perfil dice «Kocos Marketing (no ORVIAN)». Las skills se llaman `kocos-*` y el pipeline se llama «Kocos» en el chat.
- **Estado de la Etapa 2.** El chat dijo «implementada y probada» (13/10 06:30) y luego «2.1, 2.2, 2.4 a 2.9 son especificados, no implementados». Se toma la versión corregida.
- **Entrega verificada.** El chat dice que la entrega del 12/10 fue «verificada con dependencias reales». El consolidado no: solo pruebas en entorno local.
- **Seguridad de la sesión.** Un resumen posterior del chat (14/10 o después) indica que `session.ts` usa `SUPABASE_SERVICE_ROLE_KEY` como respaldo si falta `SESSION_SECRET`. La regla vigente dice que las claves solo van en variables de Vercel y no deben usarse como fallback de firma: revisar.
- **PIN de ingreso.** `CLAUDE.md` dice «El código de ingreso al panel no se guarda en archivos». El helper de pruebas del chat tenía un valor de PIN de prueba por defecto. Hay que quitarlo del código y cambiar el PIN real.
- **Pipeline.** El chat (13/10) habla de «Aplicar pipeline Kocos»; el chat del rediseño (17/10) tiene un commit «Aplicar pipeline de Marketing».
- **Fase 3 / Etapa 3.** El chat (13/10) dice «Etapa 3 agents, not started». El chat del rediseño dice «Fase 3 pausada». Mismo tema, dos nombres.
- **Vercel.** La instrucción «No incorpores el complemento Vercel» (13/10) convive con el uso del conector Vercel para sandboxes y del conector de GitHub. El conector no es el complemento; se deja anotado.

**Secretos y datos (no copiados):**
- [secreto: PIN de ingreso del panel, que se pasó en el chat — hay que cambiarlo]
- [secreto: clave de firma de pruebas locales — es de prueba, no de producción; no usar fuera del entorno aislado]
- [secreto: valor por defecto de PIN de prueba en el código de pruebas — hay que quitarlo]
- Ningún secreto de Vercel o Supabase se leyó ni se copió.
