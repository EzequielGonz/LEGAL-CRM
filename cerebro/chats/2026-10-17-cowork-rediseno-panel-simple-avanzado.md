# Cowork · Rediseño integral del panel (selector Simple/Avanzado, bloques 1 a 5)

## 1. Encabezado

- **Título del chat:** Rediseño integral del panel (selector Simple/Avanzado, bloques 1 a 5). Proyecto «crm» en Cowork. Origen: `cerebro/chats/cowork/cowork-e-chat4.md` (transcripción redactada, con resumen de compactación en el anexo A y cronología en el anexo B).
- **Fecha de inicio:** (no confirmado). La transcripción conservada empieza el 2026-10-17 20:33 UTC, justo tras una compactación; lo anterior (16–17/10/2026) solo existe como resumen. El proyecto venía de sesiones previas.
- **Fecha de fin:** 2026-11-21 07:26 UTC (último registro; pedido de cierre del 21/11).
- **Origen:** Cowork (navegador), proyecto «crm», repo `EzequielGonz/LEGAL-CRM`. Id de sesión de la transcripción: `aaed1adc-1125-5a3b-b879-37b5b5a6cc16`. Modelos: Opus 5.5, Fable 5.1, Haiku 5.5 y Sonnet 5.5 (cambios hechos por la responsable con `/model`).
- **Perfiles o marcas que toca:** Jurídico (Estudio Jurídico Integral Vita, Civil y Penal), Coberturas médicas, Autos 0 km y Marketing (agencia ORVIAN, ver CONTRADICE). El rediseño es común a los cuatro perfiles.
- **Proyecto Vercel:** `prj_liUp46HbkMc0lPlhX1hX5CVLwsYt` (legal-crm, `legal-crm-nine.vercel.app`).
- **Alcance:** 202 mensajes y herramientas (resultados resumidos a 300 caracteres). Sin razonamientos internos. Secretos, correos y teléfonos redactados.

## 2. Objetivo

Terminar el rediseño del panel del CRM multirubro con un selector global Simple/Avanzado, sin cambiar datos, reglas ni estado operativo. Bloques: (1) navegación, (2) marca fuente única, Inicio, Contenido y Configuración, (3) resumen Simple en todas las secciones, (4) sistema visual y movimiento (Inter, sin 3D, CSS consolidado), (5) verificación integral (cuatro perfiles, 320–1440 px, zoom, teclado, movimiento reducido).

Orden final de la responsable: subir todos los bloques, implementarlos, y dejar revisiones y verificaciones para el final.

## 3. Órdenes y decisiones de la responsable (textuales)

### 3.1 Antes de la compactación del 17/10 (sin fecha exacta; sesión del 16–17/10)

- «no tengo mas uso deja un punto de control ahora y frena para despues retomar»
- «retoma, lee el texto antes (directiva larga: contexto, estados de avance, revisión visual, bloque 3, bloques 4 y 5, herramientas de diseño, caché, brand_name y método de reporte)»
- «cambie el modelo, pone un punto de recontinuacion pausa y decime»
- «para terminar todo esto, que modelo y esfuerzo me recomendas? cuanto tardas en terminar?»
- «retoma, puse opus en alto. subi e implementa todo, termina todo.»
- «deja un punto de retorno. pausa un segundo»
- «subi todos los bloques, implementalos, las revisiones y verificaciones dejalo para lo ultimo, hace lo mas mas complejo ahora y las revisiones bajamos a un modelo inferior que no es tanto. cuando termines lo mas pesado y empiecen cosas sencillas deja un punto de control, pausa y avisame asi cambio el modelo, cual me recomendas?»

### 3.2 Desde el 17/10/2026 20:33 UTC (con fecha)

- **2026-10-17 20:39 UTC:** «Para lo sencillo (subir ramas, correr comandos de verificación, comparar salidas y armar el reporte) alcanza con Haiku 5.5, que es el modelo en el que estoy ahora. Si aparecen regresiones de lógica que haya que corregir en el código, pasá a Sonnet con esfuerzo medio. Opus solo si hace falta juicio visual fino sobre el diseño. ok hagamos eso. cuando reconozcas cada cosa que requiera cambiar modelo, frena pone un punto de control y pedime el cambio. sigo con haiku.» Regla de modelos: Haiku para correr y reportar; Sonnet medio para corregir código; Opus solo para juicio visual fino.
- **2026-10-17 20:39 UTC:** «Ya lo autorice en esta sesion, antes de seguir decime si ya esta implementado. Yo te digo cuando retomar.»
- **2026-10-17 20:41 UTC** (según el resumen, respondiendo al punto de control en `claude/PUNTO_DE_CONTROL.md`): «Como lo agrego a las fuentes esto de github? No sigas todavia»
- **2026-10-17 20:45 UTC:** «Ya esta aplicado lo de escritura, fijate si podes intentalo. no retomes todo aun»
- **2026-10-17 20:48 UTC:** «Proba ahora si te deja. no sigas todavia con todo»
- **2026-10-17 20:49 UTC:** «no tendria que iniciar un nuevo chat para que se agregue? no retomes todavia»
- **2026-10-17 20:50 UTC:** «Y esos archivos de github los puedo cargar manualmente? no retomes aun»
- **2026-10-17 20:51 UTC:** «Bueno podes seguir con todo el resto y yo cargo manualmente eso? decime donde lo cargo. no sigas aun»
- **2026-10-17 20:53 UTC:** «Para reducir costo y hacerlo desde aca, un modelo barato me sirve? no sigas aun»
- **2026-10-17 20:53 UTC:** «no conviene mejor, enviarnos un .zip con los cambios? Y mediante el apply pipeline kocos, se agrega automaticamente»
- **2026-10-17 20:54 UTC:** «Ok arma eso y despues retoma el resto como acordamos, podes seguir con cosas mientras lo cargo? no sigas aun»
- **2026-10-17 20:55 UTC:** «Cargo esto directamente al MAIN?» (respuesta del asistente: no, a `rediseno-b4`).
- **2026-10-17 20:59 UTC:** «Esto se va a poder ver al ingresar al link de Panel de Captación Legal» (respuesta del asistente: no aparecería en ese link al cargarlo en `rediseno-b4`; la producción sigue en su rama).
- **2026-10-17 21:00 UTC:** «Ahora mismo se esta subiendo a github el archivo .zip que me enviaste. Si vercel lo recibe bien, lo paso a main asi lo podemos ver en produccion?» (respuesta: no, falta verificación y autorización expresa).
- **2026-10-17 21:08 UTC:** «bueno ya esta cargado, retoma con lo que sigue y acordate lo de los modelos que hablamos».
- **2026-10-17 21:10 UTC:** «Como puede quedar de la mejor manera para que lo hagas automatico vos? no sigas con todo aun»
- **2026-10-17 21:13 UTC:** «hacelo, retoma con todo, acordate los cambios de modelos. Si hay que hacer algo manualmente, cuando termines con TODO, dejame lo que tengo que hacer yo manualmente, corto y simplificado y dejame el contexto actual con todo lo que agregamos en esta sesion.»
- **2026-10-17 21:18 UTC:** «1 si 2 si 3 si se genera. se confirmo la subida del commit a la rama rediseno-b4 segui con todo.» (autoriza: borrado de 9 archivos vía conector, restaurar sandbox de Vercel para verificar, y confirma que la Preview se genera).
- **2026-10-17 21:24 UTC:** «Segui y termina con todo, no pauses mas. terminalo e implementalo.»
- **2026-10-17 21:31 UTC:** «Dame todo el contexto y donde nos quedamos en este chat actual para abrir uno nuevo y retomar por favor. con todas las tareas que quedan pendientes»
- **2026-11-21 07:25 UTC:** «Quiero que hagas el trabajo completo de cierre de este chat y me entregues un archivo, sin preguntar nada salvo que falte un dato imprescindible.» Incluye: «Si la escritura sigue bloqueada, no simules nada: decime el error exacto y seguí con la entrega en archivo.» Y «No escribas en GitHub, no hagas commits ni pushes, y no crees ramas sin mi “dale” explícito.»

### 3.3 Decisiones firmes que quedaron

- Una tarea por vez. La Fase 3 sigue pausada. Sin campañas, envíos, contactos, pagos ni entrenamiento.
- Pausas, agentes apagados, campañas pausadas y seguimiento sin cambios.
- Preview = solo mirar (comparte base con producción).
- Orden de trabajo: lo pesado primero; revisiones y verificaciones al final; punto de control antes de cambiar de modelo.
- La regla de cambio de modelos se sigue «por acá» y no se pasa a `CONTEXTO_ACTUAL_CRM.md`.
- No pasar nada a `main` todavía: se carga en `rediseno-b4`. Pasa a `main` solo con autorización expresa, después de verificar.
- El ZIP `kocos-pipeline-rediseno-b4.zip` se carga a GitHub y lo aplica el pipeline.

## 4. Correcciones que hizo la responsable

- Corrigió los estados de avance del rediseño: la directiva de retomada pedía distinguir implementado, desplegado, comprobado, revisado y probado. Un despliegue READY solo acredita el despliegue.
- Pidió separar `rubros.brand_name` (identidad del agente) de `brand_briefs.nombre_publico` (marca del panel). Quedó separado y probado 11/11.
- Corrigió el orden de trabajo: primero lo complejo, revisiones al final, y un modelo inferior para lo sencillo.
- Aclaró que la regla de modelos no va a `CONTEXTO_ACTUAL_CRM.md`.
- Preguntó si cargar al `main` (20:55 UTC). La respuesta del asistente fue «No. Cargalo en `rediseno-b4`, no en `main`»; quedó como regla.
- Recordó el cambio de modelos al retomar («acordate lo de los modelos»).
- Corrigió la memoria del asistente: la empresa es ORVIAN, no Kocos (ver sección 12 sobre la versión posterior).

## 5. Qué se hizo (paso a paso, con estado)

Estados: especificado · implementado · probado · publicado · habilitado. «Publicado» = en producción. **Ningún bloque del rediseño está publicado ni habilitado.** Producción sigue en `176e067` y `main` no se tocó (según el chat, 17/10; hoy `main` está en `66c457b`, ver sección 11).

| Bloque / tarea | Especificado | Implementado | Probado (evidencia) | Publicado | Habilitado |
|---|---|---|---|---|---|
| Bloque 1 navegación (`rediseno-b1-navegacion` = `e820872`) | sí | sí, en la rama | navegador B1 48/48 (entorno aislado, sesión previa, según resumen) | no (solo Preview READY previa) | no |
| Bloque 2 marca / Inicio / Contenido / Configuración | sí | sí, en la rama; migración aditiva `0400` (según `CONTEXTO_ACTUAL_CRM`: aplicada en la base de producción; no verificado en este chat) | B2-3 45/45 (según resumen) | no | no |
| Bloque 3 resumen Simple en 35 secciones (`rediseno-b3` = `23d3ab7`) | sí | sí | typecheck, lint, unitarias y build en 0; B3 31/31; marca-agente 11/11 (según resumen, sesión previa) | no | no |
| Bloque 4 sistema visual (`rediseno-b4` = `0fff75c`; local `8fe7a8b`) | sí | sí, en GitHub (ZIP + pipeline + 9 borrados con el conector) | typecheck de app y tests OK, lint sin avisos, unitarias 170/170, build limpio en sandbox `rediseno-b4-verif` (17/10) | no | no |
| Pruebas de navegador del bloque 4 (B1, B2-3, B3, B4, marca-agente) | sí | scripts listos (`pruebas-b4.mjs`) | **no corridas** | — | — |
| Medición de caché (con/sin `no-store`) | sí | scripts listos | **sin resultado confiable** (1 consulta por carga, probable falta de sesión) | — | — |
| Bloque 5 verificación integral | sí | **no iniciado** | no | — | — |
| Revisión visual de la Preview de `rediseno-b4` | sí | pendiente de la responsable o el programador | no | — | — |
| Entrega ZIP `kocos-pipeline-rediseno-b4.zip` | sí | enviada por chat; aplicada por el pipeline en la rama | verificación: `rediseno-b4` = `8fe7a8b` tras borrar 9 archivos (diferencia vacía) | no | no |
| `CONTEXTO_ACTUAL_CRM.md` y `PUNTO_DE_CONTROL.md` (proyecto) | sí | actualizados el 17/10 | — | — | — |
| `docs/rediseno/PLAN.md` del repo | sí | **no actualizado** | — | — | — |

Notas:
- Los 55 errores de prerender `Cannot find module './module.compiled'` aparecieron en la primera corrida del build en el sandbox nuevo (EXIT 0). No se repitieron en una segunda corrida de `rediseno-b4` (0 errores, EXIT 0); `rediseno-b3` dio 0. Se atribuyen al entorno, sin causa comprobada.
- El bloque 4 se verificó en el sandbox, pero las pruebas de navegador no se corrieron. No está probado en navegador.

**Pasos de la sesión del 17/10 (cronología resumida):**
1. Se confirmó que el chat no podía hacer `git push` (403 del proxy: el repo no estaba en las fuentes autorizadas de la sesión). Lectura sí; escritura no.
2. Se usó el conector de GitHub para escribir: subida del ZIP por el pipeline (commit `e3748c9` «Add files via upload»; `f83e946` «Aplicar pipeline de Marketing»). El pipeline no borró 5 archivos y dejó auxiliares en la raíz (`GUIA.md`, `borrar.txt`, `cambios.txt`, `rediseno-b4.patch`).
3. Se preparó localmente un commit que quita esos archivos (rama `rediseno-b4-pipeline`), pero no se pudo subir por 403.
4. Con la autorización «1 si 2 si 3 si», el conector borró 9 archivos en `rediseno-b4` (9 commits, uno por archivo) y se verificó que el remoto quedó igual a `8fe7a8b`.
5. Se restauró el sandbox de Vercel y se verificó el bloque 4 (typecheck, lint, unitarias, build). Las pruebas de navegador quedaron pendientes.
6. Los bloques 1 a 3 se subieron antes por el conector (según el chat).

## 6. Archivos, rutas, ramas, commits, migraciones, despliegues y configuración

**Ramas (GitHub, `EzequielGonz/LEGAL-CRM`):**
- `main` = `176e067` (17/10, sin cambios); hoy `66c457b` (21/11, lectura de esta sesión).
- `rediseno-b1-navegacion` = `e820872`.
- `rediseno-b3` = `23d3ab7`.
- `rediseno-b4` = `0fff75c` (después de los 9 borrados).
- Rama local `rediseno-b4-pipeline` (sin remoto): 34 commits sobre `origin/main`, con el commit que quita 9 archivos sobrantes. Sin uso porque el conector hizo lo mismo.
- Rama local `rediseno-b4` = `8fe7a8b` (no subida, la versión del bloque 4 sin el pipeline).
- Sin PR abierto desde este chat (no se menciona ninguno).

**Commits:** `566ade8` (cliente de servicio con `no-store`), `00bb928` (B3 lote 6/6), `23d3ab7` (B3 etiqueta del intervalo de seguimiento y anclas), `8fe7a8b` (B4 local), `e3748c9` (subida del ZIP), `f83e946` («Aplicar pipeline de Marketing»), y 9 commits del conector en `rediseno-b4`: `0709ca3`, `c1c1f28`, `e697525`, `056116e`, `01289df`, `34dc488`, `d25063f`, `4d73575`, `0fff75c`. Los 9 borrados: `src/app/premium.css`, `src/app/estudio.css`, `src/app/inmersivo.css`, `src/app/escena.css`, `src/components/ui/efectos-3d.tsx`, `GUIA.md`, `borrar.txt`, `cambios.txt`, `rediseno-b4.patch`.

**Archivos principales del bloque 4:** `src/app/panel.css` (nuevo, consolidado: tokens, paleta neutra, sala de ingreso, tarjetas sin 3D, reglas de tipografía, contraste y animaciones con `prefers-reduced-motion`), `src/app/layout.tsx`, `src/app/globals.css`, `src/app/controles.css`, `src/components/acceso/lampara-ingreso.tsx`, `src/components/ui/lampara-dibujo.tsx`, `src/components/ui/tarjeta-luz.tsx`, `src/components/ui/stat-card.tsx`, `src/components/perfiles/perfil-selector.tsx`, `src/app/inicio/page.tsx`, `src/app/perfiles/page.tsx`, `src/app/panel/[slug]/page.tsx`, `src/app/biblioteca-agentes/page.tsx`, `tests/unitarias/marca.test.ts`; reemplazo de `text-[10px]` y `text-[11px]` por `text-xs` en 38 archivos.

**Archivos clave del bloque 3:** `src/components/nivel/resumen-seccion.tsx`, `src/lib/salud/reglas.ts`, `src/lib/inicio.ts`, `src/components/estadisticas/estadisticas-perfil.tsx`, `src/components/campanas/*`, `src/components/seguimiento/*`, `src/app/comparacion-agentes/page.tsx`, `src/app/(dashboard)/revision/page.tsx`, `src/components/bases/import-flow.tsx`, `src/app/(dashboard)/prospectos/page.tsx`, `src/app/oportunidades/page.tsx`, `src/components/inbox/*`, `src/components/agenda/agenda-supervision.tsx`, `src/components/telefono/*`, `src/lib/menu.ts`.

**Migraciones:** `0400_rediseno_logo_panel.sql` (aditiva). Según `CONTEXTO_ACTUAL_CRM`, aplicada antes en la base de producción; no verificado en este chat. En esta parte del chat no se aplicó ninguna migración ni se tocó la base.

**Despliegues:**
- Producción: `dpl_HqzDKxM7ViGxxd6WkSCDqKUukN7P` READY = `176e067` (sin cambios).
- Preview previa de B1: `dpl_D4Yw3szy3eq6JEf9bNoC6pEAEGNr` (solo acredita despliegue).
- Preview de `rediseno-b4`: la responsable confirmó que se genera (sin id registrado).

**Sandboxes de Vercel (solo pruebas, datos inventados):**
- `sbx_8EokZgtOqLrHEpHecRmCVo69HnnG` (detenido), snapshot `snap_wOOSK4E1H2xCjNh7RhprRLb9I7Lj` (expirado). Nombre `rediseno-arnes-b1`.
- `sbx_APsEPstFyovMmO0YhVXpie4dHBA3`, nombre `rediseno-b4-verif` (clon de `rediseno-b4`, apagado con `stop_session`).
- Repo en `/vercel/LEGAL-CRM`. Arnés de pruebas (PostgreSQL + PostgREST + Playwright) en `/tmp/arnes`: sus scripts pueden perderse.
- Higiene: en el sandbox de medición de caché se quitó temporalmente la línea de `src/lib/supabase/admin.ts` (`global.fetch` con `cache: "no-store"`). Hay que restaurarla con `git checkout -- src/lib/supabase/admin.ts` antes de usar ese sandbox de nuevo.

**Variables de configuración (solo nombres, sin valores):** del arnés local: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ACCESS_PIN`, `SESSION_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`, `NEXT_TELEMETRY_DISABLED`. Pendientes de producción mencionadas: `META_APP_SECRET`, `GCP_*`, `GCP_BUCKET`, `GEMINI_MODEL`, `GEMINI_API_KEY`. No se cambió ninguna variable ni configuración en este chat.

**Documentos del proyecto escritos:** `claude/PUNTO_DE_CONTROL.md` (doc_uuid `8a83a0cd-0660-4a36-a9ac-ff8339e18f7a`) y `claude/CONTEXTO_ACTUAL_CRM.md`. Los dos se actualizaron el 17/10.

**Archivos entregados como ZIP por chat:**
- `kocos-pipeline-rediseno-b4.zip` (17/10 21:08; el listado del chat reporta 82–83 archivos según la línea de cálculo). Contiene los archivos del bloque 4, la lista de 5 archivos a borrar, el parche y una guía. Sin secretos ni datos personales. Estado: «implementado, sin verificar» al momento de enviarlo.
- Parche `b4.patch` en el scratchpad de la sesión (md5 `96d109a66071f281f4138d44d9c4f200`, verificado que reproduce el commit). Fuera del proyecto.

## 7. Datos del negocio

- Perfiles: Jurídico, Coberturas médicas, Autos 0 km y Marketing (agencia ORVIAN). Rediseño común a los cuatro.
- Nivel Simple/Avanzado: cookie `crm_nivel`; el modo Simple muestra un resumen por sección y el Avanzado, el detalle. Se oculta con CSS (`.solo-simple` / `.solo-avanzado`) sin desmontar.
- Presupuesto de la fase candidata C: tope USD 30 (variables GCP y corpus no iniciados).
- Fase 3 (entrenamiento, evaluación, candidato C) pausada; no se inicia sin autorización.

## 8. Pendiente, a medias o bloqueado

- Pruebas de navegador del bloque 4 (B1, B2-3, B3, B4, marca-agente). Hay que reconstruir el arnés (PostgreSQL, PostgREST, Playwright, datos inventados) en un sandbox. Los scripts están en el scratchpad y pueden perderse; el snapshot anterior expiró.
- Medición de caché con sesión efectiva, con y sin `no-store`.
- Bloque 5: verificación integral (cuatro perfiles, escritorio y teléfono, 320–1440 px, zoom, teclado, movimiento reducido). No iniciado.
- Revisión visual de la Preview de `rediseno-b4` (PC y teléfono, Simple y Avanzado) por la responsable o el programador.
- Actualizar `docs/rediseno/PLAN.md` en el repo.
- Integrar a `main`: solo con autorización expresa, después de verificar. No se hizo.
- Bloqueo de escritura por `git push`: 403 del proxy. Error exacto: «remote: access denied by the git proxy: EzequielGonz/LEGAL-CRM is not in this session's authorized repository set, so the proxy will not inject a credential for it. To fix, add the repository to the session's sources.» La lectura (`ls-remote`, `fetch`) sí funciona. El conector de GitHub sí escribió el 17/10.
- Commit local `rediseno-b4-pipeline` (sin remoto) con 34 commits sobre `origin/main`: queda sin subir.
- Pipeline de Marketing: no aplica borrados y copia los auxiliares del ZIP al repo. Revisar antes del próximo ZIP.
- Fuera del rediseño: landings (hosting sin confirmar), Meta (`META_APP_SECRET`, plantillas, líneas), candidato C (variables GCP, corpus y ajuste no iniciados, tope USD 30). Fase 3 pausada.

## 9. Aprendizajes

- **Qué funcionó:**
  - Usar el conector de GitHub cuando `git push` no tenía permiso. Verificar después con `git fetch` y `git diff` (diferencia vacía).
  - Separar en la guía lo que hace el asistente de lo que hace la responsable.
  - Puntos de control al cambiar de modelo.
- **Qué no funcionó:**
  - `git push` directo: 403 del proxy de Git (no autorizado por fuentes de la sesión).
  - El pipeline no borró los 5 archivos y dejó auxiliares en el repo.
  - La subida de un comando de compresión (`tar | xz | wc`) fue bloqueada por el clasificador de exfiltración; `write_session_files` nunca se intentó (el 17/10 se atribuyó mal a permisos).
  - Hooks `stop-hook-git-check` piden commit y push repetidamente; no se ejecutó nada en origen sin «dale».
- **Errores y correcciones (según el resumen del chat):**
  - Un contexto anterior daba por pendientes las migraciones 0310–0312; ya estaban aplicadas.
  - Se registró como «verificado en producción» el PR #16, pero solo se desplegó sin revisión visual.
  - `npm view` sin red desde cloud: se usa el sandbox.

## 10. Preguntas abiertas

- ¿La sesión nueva abierta desde el proyecto arranca con el repo autorizado para `git push`? (no confirmado; se comprueba con un push de prueba a `rediseno-b4`, no a `main`).
- ¿Cuál es la rama de producción de Vercel? (se asume `main`; no confirmado).
- ¿El valor de `GEMINI_MODEL` en producción es el deseado? (no visible; cualquier cambio se hace en Vercel, no en el código).
- ¿Se aplicó `0400` en la base de producción? (según `CONTEXTO_ACTUAL_CRM`; no verificado en este chat).
- ¿Qué hay de la rama `rediseno-b1-navegacion` respecto de `main`: se apoya en `main`, en `rediseno-b3` o en otra? (no confirmado).
- ¿El flujo «Aplicar pipeline» (Marketing o Kocos) borra archivos o solo los agrega? (el 17/10 no borró los 5 archivos).

## 11. Ramas y cambios (explícito)

| Repo / rama | Para qué | De qué sale | Qué tiene | ¿Integrada a `main`? | PR | Qué hacer |
|---|---|---|---|---|---|---|
| `main` | producción | — | `176e067` (17/10); `66c457b` (21/11, lectura de esta sesión) | es la base | — | no tocar sin autorización; ver qué entró entre `176e067` y `66c457b` (no confirmado) |
| `rediseno-b1-navegacion` | bloque 1 | no confirmado | `e820872`, navegación | no | no | revisar, integrar con B3 o archivar |
| `rediseno-b3` | bloque 3 (resumen Simple) | `rediseno-b1-navegacion` (no confirmado) | `23d3ab7`, B3 lotes 1–6 | no | no | integrar tras B4 y verificación, o archivar |
| `rediseno-b4` | bloque 4 (visual) | `23d3ab7` (diff del paquete) | `0fff75c`, bloque 4 + 9 borrados | no | no | pruebas de navegador, revisión visual, luego PR a `main` con autorización |
| `rediseno-b4-pipeline` (local) | commit que quita 9 archivos | `origin/rediseno-b4` | 34 commits sobre `origin/main`, sin remoto | no | no | descartar (el conector ya hizo el cambio) |
| `rediseno-b4` (local) | copia del bloque 4 | `23d3ab7` (el diff del paquete sale de ese commit) | `8fe7a8b` (commit local, contenido igual al remoto tras los 9 borrados) | no | no | descartar o usar como referencia |

Archivos tocados por carpeta (bloque 4): `src/app/` (CSS consolidado, layout, páginas de Inicio, Perfiles, panel, biblioteca de agentes), `src/components/` (acceso, ui, perfiles), `tests/unitarias/`, y 38 archivos con `text-xs`.

Migraciones: `0400` (aditiva, según `CONTEXTO_ACTUAL_CRM`).

Despliegues: ninguno nuevo en este chat. Producción: `176e067`.

Configuración fuera del código: ninguna cambiada.

Qué quedó encendido o apagado: nada. Producción sin cambios; Preview de `rediseno-b4` generada (no habilitada); campañas pausadas, agentes apagados, seguimiento apagado y Fase 3 pausada, como en el inicio del chat.

## 12. CONTRADICE

- **Nombre de la agencia.** La memoria de la responsable (anterior al 20/10) dice «ORVIAN, no Kocos». Un perfil del proyecto (20/10) dice «Kocos Marketing (no ORVIAN)». Este cierre usa ORVIAN porque así lo escribió la responsable en el pedido del 21/11. Confirmar cuál es el nombre vigente.
- **GitHub, reglas.** El pedido del 21/11 dice «No escribas en GitHub, no hagas commits ni pushes, y no crees ramas sin mi “dale” explícito». El `CLAUDE.md` vigente (20/11) dice: «Todo lo demás Claude lo implementa, prueba, publica y verifica directo (GitHub, base, configuración, despliegue, Metricool), sin pedir «dale» por cada paso.» Única restricción de ese documento: pagos.
- **GitHub, resultado.** El pedido del 21/11 dice «Hasta ahora no pude escribir en GitHub (403)». Es cierto para `git push`, pero el conector de GitHub escribió con éxito el 17/10 (9 commits de borrado en `rediseno-b4`, con «1 si 2 si 3 si» de la responsable).
- **PR a `main`.** El chat dice «PR de `rediseno-b4` a `main`: solo con autorización expresa, después de verificar». El `CLAUDE.md` del 20/11 dice que Claude publica directo; el mismo documento dice que la Preview comparte base con producción y que las campañas las lanza la responsable. Hace falta decidir qué rige para publicar.
- **Borrados.** `CLAUDE.md` dice «Nada se borra: se archiva o pasa a borrador con motivo.» El chat borró 9 archivos de código (CSS viejo, `efectos-3d.tsx`, auxiliares) en `rediseno-b4`. La regla habla de datos; igual conviene dejar constancia.
- **Versión de Next.js.** El chat dice «Next.js 14 App Router». El `CLAUDE.md` del 20/11 dice Next.js 15.5.
- **Migraciones.** `CLAUDE.md` dice «numeradas por etapa (`01xx`, `02xx`)». El chat usa `0400`. Y el chat 1 usa `0199`–`0203`.
- **Pipeline.** El commit `f83e946` dice «Aplicar pipeline de Marketing»; el chat 1 dice «Aplicar pipeline Kocos».
- **Número de archivos.** Los 5 archivos a borrar (guía del 17/10) no coinciden con los 9 borrados en GitHub. Los archivos del ZIP se informan como 82 y como 83. El chat dice «47 archivos» al explicar la carga manual. No coinciden entre sí.
- **Build.** El chat dice «build limpio». La primera corrida tuvo 55 errores de prerender; la segunda, 0. Corresponde a la segunda corrida.
- **Migración `0400`.** `CONTEXTO_ACTUAL_CRM` dice que está aplicada en producción. Este chat no lo verificó y dice que no aplicó migraciones.
- **Producción `main`.** Según el chat, producción sigue en `176e067` (17/10). Hoy `main` está en `66c457b` (21/11): algo entró en el medio, no confirmado.
- **Estado del rediseño.** La directiva de retomada pedía «implementado, desplegado, comprobado, revisado y probado». El resumen de B1 dice «probado 48/48 en sesión previa»; sin evidencia adjunta en este chat.
- **Fase 3 / Etapa 3.** El chat 1 dice «Etapa 3 agents, not started». Este chat dice «Fase 3 pausada». Mismo tema, dos nombres.
- **Mensajes con sentido doble de la responsable** (20:51 UTC): «Bueno podes seguir con todo el resto y yo cargo manualmente eso? decime donde lo cargo. no sigas aun». Se respetó el «no sigas aún» y se construyó solo el ZIP; luego (21:08) pidió «retoma con lo que sigue».

**Secretos y datos (no copiados):**
- Ningún valor de variables de entorno, PIN, clave o token figura en este documento. Solo nombres (sección 6).
- Correos de commits y ids de sesión de Claude de los commits: redactados en la fuente; no se reproducen.
