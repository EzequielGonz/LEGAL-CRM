# Traspaso · ejecución del plan del 27/11 (leer primero al retomar)

**Estado a las 9:10 (Argentina) del 27/11:** el plan `22-plan-panel-2711.md` está aprobado y en ejecución. Todavía **no hay nada publicado en el panel**.

## Regla nueva del dueño (27/11, 9:10)

«Ojo que hay campañas corriendo en el panel, que no se pausen ni nada». Mientras se integra y publica:
- No pausar, archivar ni editar campañas, ni tocar su estado en la base.
- No aplicar con campañas enviando ninguna migración que toque `campaigns`, `campaign_contacts`, líneas o plantillas (en especial las de la fase A4: línea única de Jurídico y archivo de Penal). Esas se aplican fuera del horario de envío (8 a 21) o cuando no haya campañas `en_curso`, comprobándolo antes en la base.
- Antes de publicar, revisar que el cambio no altere el envío de campañas (tick, plantillas, línea asignada). Después de publicar, comprobar en la base que las campañas siguen `en_curso` y avanzando.

## Qué está corriendo

Flujo en segundo plano `plan-panel-2711-fases-0-y-A` (tarea `wj72v3r7z`, corrida `wf_6a348c3b-a19`): fase 0 y después A1 a A8 en paralelo, cada una con revisor de otro modelo.
- Copias de trabajo: `/home/user/p27/f0` y `/home/user/p27/a1` … `a8`; ramas `p27/f0`, `p27/a1` … `p27/a8`. Sin push.
- Resultado por agente: `/root/.claude/projects/-home-user/8c59649c-cc60-5c57-bbe5-216901928a02/subagents/workflows/wf_6a348c3b-a19/journal.jsonl`.
- Si la corrida se corta, se retoma con el mismo guion y `resumeFromRunId`.

## Qué sigue cuando termine

1. Leer cada resultado y su revisión; no integrar lo que diga `no_integrar`.
2. Integrar las ramas en `integracion/rediseno-2211` de a una (f0, después a7, a6, a4, a5, a8, a1, a2, a3), con typecheck, lint, pruebas unitarias y `npm run build` al final.
3. Aplicar las migraciones (repetibles, sin borrados) respetando la regla de campañas de arriba. Recién después publicar a `main` y verificar en producción en solo lectura.
4. Fases siguientes, con otro flujo: B1 (menús, quitar «asistente general», Ctrl+K), B2 (Hoy compacto y recordatorios por contacto), B3 (Jarvis dispara conversaciones y el bot usa el Excel), C (retoque visual: tonos profundos en vez de pasteles, sin tocar animaciones) y D (repaso cruzado, `docs/etapa6/`).
5. Preparar para el dueño la lista de los 36 captados actuales (con prueba / sin prueba): los decide él.
6. Cerrar cada fase con bitácora, `07` y `08`, y un informe corto al dueño: implementado, probado, publicado, qué falta y qué herramientas se usaron.

## Decisiones que mandan

En `02-ordenes-vigentes.md`, secciones del 27/11. Las que más se olvidan: el panel se conserva (retoque, no rediseño); ficha sin ocultar datos; plantilla directa desde el chat sin topes; enviar sin código; Gemini solo por botón; internet del Cerebro encendido dentro del tope; los captados actuales no se reclasifican solos; no inventar reglas que el dueño no dijo.

## Arena de la Oficina

No hay una skill «arena» instalada. Se arma propia: con Gemini arranca en 3 respuestas y un juez (sube mientras el tope de USD 30 lo permita); con Claude, cada escritorio compite con subagentes de distintos modelos.

## Pendientes del dueño

Mañana 28/11: cargar `OFICINA_DISPARO_URL` y `OFICINA_DISPARO_TOKEN` en Vercel y cambiar el código de ingreso.

## Cuidados de siempre

El código de ingreso no se escribe en archivos. Sin datos de prospectos en documentos. No tocar `docs/redes/`, `.claude/referencias/redes/` ni `src/app/redes/**` (otra sesión). PRs 77, 80 y 40 quedan para después: desuscribirse si llegan avisos. Respuestas cortas, en rioplatense; el dueño es varón.

## Checkpoint 27/11 · 13:45 (hora argentina)

**Publicado en producción**
- Tanda A1 (Oficina y Bandeja): commits `c3c60b4`, `2d2d0dd` y `1a96ec9`. Migraciones 0651 y 0652 aplicadas.
- «Arrancar ahora» usa Gemini cuando Claude no tiene disparo (orden del dueño, en `02`). Lo hace la interfaz: llama a `/api/oficina/[id]` con `accion: gemini` tarea por tarea.
- Prueba real hecha con permiso del dueño: una tarea de alcance «todo el panel» resuelta por Gemini (3 respuestas y juez, USD 0,02). Mostró dos fallas, ya corregidas y publicadas: el juez leía las respuestas cortadas a 2500 caracteres y la ruta por Ingeniería marcaba «código» por sí sola.

**En curso al cerrar este checkpoint**
- Workflow `wf_6a348c3b-a19` reanudado (tarea `wqm2fzzvj`): se había cortado por el límite de uso de 5 horas. Hechas: f0, a1, a2 (`p27/a2`, commit `ce83275`) y a4 (`p27/a4`, commit `e763104`). Faltan: a3, a5, a6, a7, a8 y las revisiones de a1, a2 y a4.
- Prueba de todas las áreas de la Oficina (pedida por el dueño: «la idea es que pruebes todos los agentes»): 7 tareas, una por área, corriendo con Gemini desde el panel. Guion en el scratchpad (`ofi/todas.js`); el código de ingreso va solo por variable.

**Qué sigue**
1. Leer el resultado de la prueba de las 7 áreas y corregir lo que falle.
2. Integrar a2 (Jarvis) cuando tenga su revisión; a4 (plantillas y línea única) solo con sus migraciones aplicadas sin campañas en curso.
3. Integrar el resto a medida que termine; después B1, B2, B3, C y D.
4. Pendientes menores: la prueba 209 falla desde antes; la 790 (Search Console) falla de a ratos.

**Pendiente de decisión del dueño**
- Lo que hace Gemini queda «sin repasar» y no se puede aprobar hasta que Claude lo repase. Sin disparo de Claude, eso deja las tareas trabadas en «Para repasar». Se le preguntó si quiere poder aprobar directo.

**Regla viva**: hay 2 campañas en curso; no se pausan ni se tocan. Comprobar en la base antes y después de cada migración o publicación.

**Retome programado**: 14:30 (tarea programada de esta sesión).

## Checkpoint 27/11 · tarde (para compactar)

**Leer primero al retomar:** este archivo, `02-ordenes-vigentes.md` (tres órdenes nuevas del 27/11 sobre la Oficina y Gemini) y la bitácora.

**Publicado hoy en producción (último commit `14e279f` más este)**
- Oficina completa: alcance libre, colas, Gemini con arena (3 respuestas y juez; máximo 20 por corrida), «Arrancar» usa Gemini sin disparo de Claude (también desde el Cerebro), refresco solo de la escena, y desde hoy Gemini recibe contexto del cerebro y de los mapas en cada tarea.
- Auditoría del panel: 54 fallas nuevas; dos tandas de arreglos publicadas. Informe en `docs/oficina/2026-11-27-auditoria-panel.md`.
- Migraciones aplicadas: 0651 y 0652.

**Corrección del dueño (27/11 tarde):** «el cerebro que estás usando vos acá no está actualizado como el del panel». Causa encontrada: la carpeta `/home/user/LEGAL-CRM`, de donde la sesión carga CLAUDE.md y las skills, estaba en la rama `cerebro-chats` del 22/11, 172 commits atrás. Se dejó en la versión publicada (`git checkout --detach origin/main`; la rama `cerebro-chats` quedó intacta y todos sus archivos existen en main). Al retomar: trabajar siempre en `/home/user/crm-main` y, si esa carpeta vuelve a atrasarse, ponerla al día igual.

**Pedidos nuevos del dueño, pendientes**
1. **Auditoría del Laboratorio de bots** («está re mal hecho»): agente lanzado en segundo plano; al terminar, armar el informe, dejarlo en la Oficina y aplicar lo que corresponda con la tanda A7 (Bots).
2. **Más modelos en la arena de la Oficina** (DeepSeek y otros con API gratuita, «que se peleen muchos modelos»): no hecho. Requiere que el dueño cargue las claves en Vercel; armar un proveedor genérico compatible con la API de OpenAI para sumar cualquiera con su clave. Nada pago sin su autorización. Avisarle que los planes gratuitos pueden usar lo enviado para entrenar: sin datos personales (la Oficina ya los bloquea).
3. Reconocido al dueño: la auditoría de hoy NO fue exhaustiva. No cubrió Laboratorio, Bot IA, Biblioteca, Wasender, importador de bases, la vista de teléfono, modo claro ni nada medido en navegador.

**Workflow `wf_6a348c3b-a19` (tarea `wqm2fzzvj`)**: terminados: ['f0:contratos', 'impl:a1', 'impl:a2', 'impl:a3', 'impl:a4', 'impl:a5', 'impl:a6', 'impl:a7'] | en marcha o cortados: ['impl:a3', 'impl:a5', 'impl:a6', 'impl:a7', 'impl:a8', 'rev:a1', 'rev:a2', 'rev:a4']
- Listas sin publicar: `p27/a2` (Jarvis, commit `ce83275`) y `p27/a4` (plantillas y línea única, commit `e763104`). Esperan su revisión cruzada.
- Ojo al integrar: las tandas salieron de una base anterior a los arreglos de hoy; puede haber conflictos en `src/lib/oficina`, `src/components/cerebro`, `campaign-controls.tsx`, `tablero-hoy.tsx` y `agenda.ts`. Integrar de a una, con tipos, lint, pruebas y build.

**Campañas:** «Campaña Graves 2711» y «ART - Noviembre 2411» se pausaron solas a las 11:19 (hora argentina) por calidad baja de la línea Civil en Meta. No se tocaron. Reanudarlas es decisión del dueño. Mientras estén pausadas se puede aplicar la migración de A4.

**Sigue pendiente del pedido original:** Cerebro funcional, captados, chats y ficha, bots por rubro, menús y Ctrl+K, Hoy compacto y recordatorios, Jarvis con plantillas, retoque visual y entrada 3D, lista de los 36 captados, verificar Graphify. Del dueño: cargar `OFICINA_DISPARO_URL` y `OFICINA_DISPARO_TOKEN` en Vercel y cambiar el código de ingreso.

## Checkpoint 27/11 · 14:30 (pausa pedida por el dueño; retomar 18:31 hora de Argentina)

El dueño, textual: «pausa todo y pone un checkpoint para retomar, programa retomar todo otra vez tal cual como quedo ahora y con las mismas instrucciones a las 6 31 pm de argentina».

**Qué se frenó (los tres flujos, sin resultados perdidos de lo ya terminado):**

| Flujo | Run | Estado al frenar |
|---|---|---|
| Auditoría web, solo lectura (12 zonas + revisor por zona) | `wf_8e9edcef-4cc` | Recién arrancaban `entrada-hoy` y `juridico`; ninguna zona terminó. |
| Pruebas con acciones (5 recorridos) | `wf_7a9b68b6-95d` | Recién arrancaban `acc-oficina` y `acc-laboratorio`; ninguna terminó. No crearon nada en producción (comprobado en la base). |
| Plan aprobado, fases 0 y A1–A8 | `wf_6a348c3b-a19` | Implementación A1–A8 terminada; revisiones de A1 y A2 terminadas; A3 y A4 cortadas; A5–A8 sin revisar. |

**Cómo retomar (mismo orden):**
1. Leer `cerebro/00-arranque-para-agentes.md`, `02-ordenes-vigentes.md` (últimas tres secciones del 27/11) y este traspaso.
2. Auditoría primero. Si el scratchpad sobrevivió, relanzar los dos flujos con su `scriptPath` y `resumeFromRunId`. Si no, están copiados en `docs/oficina/auditoria-web/` (`flujo-solo-lectura.js`, `flujo-con-acciones.js`, `nav.js`, `entrar.js`): copiar `nav.js` y `entrar.js` a una carpeta `aud-web/` del scratchpad nuevo, crear `shots/`, iniciar sesión con `PANEL_CODE=… node entrar.js` (el código va solo en línea, nunca en archivos), corregir la ruta `D` de los flujos y lanzarlos.
3. La máquina tiene 4 núcleos: cada flujo corre de a 2 agentes. Conviene lanzar primero el de solo lectura y, cuando avance, el de acciones.
4. Al terminar: juntar hallazgos confirmados, escribir `docs/oficina/2026-11-27-auditoria-web.md`, dejar la tarea en la Oficina y arreglar lo que corresponda junto con las tandas del plan.
5. Recién después, el plan: relanzar `wf_6a348c3b-a19` con `resumeFromRunId` para las revisiones que faltan (A3–A8) e integrar de a una tanda en `integracion/rediseno-2211`.

**Límites de la auditoría:** el dueño dijo «toca todo lo que quieras, solo no lances campañas». Por criterio de Claude se mantiene además: no pausar ni editar campañas, ningún mensaje a personas reales, no cambiar el bot en vivo ni datos de prospectos, nada se borra, lo creado se llama «PRUEBA AUDITORÍA 27/11». `nav.js` lo hace cumplir (modo `escribir:true` con lista de rutas vedadas).

**Estado comprobado en la base a las 14:28:** «Campaña Graves 2711» y «ART - Noviembre 2411» figuran otra vez `en_curso` (Claude no las tocó). Mientras estén en curso no se aplica la migración de A4. Oficina: 7 tareas `lista` esperando el OK del dueño.

**Sin publicar en producción:** los commits `df06743` y este están solo en la rama `integracion/rediseno-2211`; main sigue en `920569d`. Se publica junto con el informe de la auditoría.

**Ya hecho hoy que no hay que repetir:** auditoría del Laboratorio por código (`docs/oficina/2026-11-27-auditoria-laboratorio.md`, 20 hallazgos); carpeta `/home/user/LEGAL-CRM` puesta en la versión publicada.

**Pendiente de respuesta al dueño:** lista verificada de IA con plan gratuito (DeepSeek y otras) para sumar a la arena de la Oficina; necesita que él cargue las claves en Vercel.

**Sumado a las 14:40 (pedido del dueño, «dale, cuando retomes actualizalo»):** al retomar, actualizar el artefacto «Cerebro del negocio» (https://claude.ai/artifact/7EC3JRaX1oFAdraThQhWTv, versión del 21/11) con lo de esta semana. Leerlo primero con la herramienta de artefactos y publicar sobre la misma dirección; sin datos personales ni claves.

## Checkpoint 27/11 · 18:50 (para compactar; todo sigue corriendo)

**Retomado a las 18:31 como pidió el dueño.** El scratchpad sobrevivió y la sesión del navegador seguía vigente.

**Corriendo ahora (no dependen de la compactación; avisan al terminar):**

| Flujo | Run | Tarea | Qué hace |
|---|---|---|---|
| Auditoría web, solo lectura | `wf_8e9edcef-4cc` | `wev3jq9mb` | 12 zonas en navegador + revisor por zona |
| Pruebas con acciones | `wf_7a9b68b6-95d` | `wh2qg1vug` | 5 recorridos haciendo clic (sin campañas ni mensajes a personas) |
| Código por capas (agentes nuevos) | `wf_536bd726-0f1` | `whrmp10mv` | Supabase/RLS, ingreso, fallas silenciosas, WhatsApp/webhooks, bots e IA, rendimiento; cada una con revisor |

Scripts en la carpeta de flujos de la sesión y copia en `docs/oficina/auditoria-web/`. Informes parciales de cada agente en el scratchpad `aud-web/<zona>/informe.md` (con capturas que tienen datos personales: no copiar al repo). La máquina corre de a 2 agentes por flujo: son varias horas. Si un flujo se corta por límite de uso, relanzar con `scriptPath` + `resumeFromRunId`.

**Al terminar los tres:** 1) juntar solo lo confirmado por los revisores, sin duplicar los 54 + 20 hallazgos previos; 2) verificar en la base qué crearon las pruebas («PRUEBA AUDITORÍA 27/11») y que quedó descartado o archivado; 3) escribir `docs/oficina/2026-11-27-auditoria-web.md` y dejar la tarea en la Oficina; 4) arreglar lo que corresponda; 5) recién entonces retomar el plan (`wf_6a348c3b-a19`, revisiones A3–A8; integrar de a una tanda; antes de publicar, mirar campañas en la base; migración de A4 solo sin campañas `en_curso`).

**Hecho en esta vuelta:** artefacto «Cerebro del negocio» actualizado (versión 6, misma dirección) con datos de la base del 27/11: 15.197 contactos, 41 captados (26 Jurídico, 7 Marketing, 4 Coberturas, 4 Autos); Jurídico 864 envíos y 162 respuestas en 7 días; último entrante: Jurídico 27/11, Coberturas 26/11, Marketing 06/11, Autos 26/10. Captado se cuenta en `opportunities.capture_state = 'captado'`. A las 18:40 había 1 campaña `en_curso` y 9 tareas `lista` en la Oficina.

**Pedidos del dueño de esta vuelta:** «revisa todas las skills plugins y conectores nuevos, podes ayudarte con muchas cosas» (hecho: tercera pata con agentes de `cartographer`, `pr-review-toolkit` y `vercel`; los de diseño —`naksha`, `ui-ux-behaves`, `audit-suite`, `uxkin`, `refero`— quedan para cuando se arreglen pantallas). También mandó un adjunto con «y esto fijate» que NO llegó: se le pidió que lo reenvíe.

**Sin publicar en producción:** main sigue en `920569d`; la rama `integracion/rediseno-2211` tiene además los commits de cerebro y docs de hoy. Se publica junto con el informe de la auditoría.

**Pendiente de respuesta al dueño:** lista verificada de IA con plan gratuito para la arena de la Oficina.

**Aviso para quien retome:** hay ganchos nuevos de plugins que frenan la subida al remoto (piden un barrido previo de claves y datos personales) y los comandos que nombran archivos de claves; si frenan, hacer el barrido, separar el paso y reintentar.

## Checkpoint 27/11 · 19:00 (para compactar; actualiza el de las 18:50)

**Límite de uso:** a las 18:45 se agotó el límite de 5 horas de la cuenta (se renueva 23:30 de Argentina, 02:30 UTC). Cortó 11 de las 12 zonas web y 4 de las 6 capas de código. Hay un aviso programado para las 23:36 (02:36 UTC) que relanza lo cortado; no borrarlo.

**Estado de los flujos a las 19:00:**

| Flujo | Run | Tarea actual | Estado |
|---|---|---|---|
| Web solo lectura | `wf_8e9edcef-4cc` | `wev3jq9mb` | 11 zonas cortadas por el límite, 1 corriendo. Cuando cierre: relanzar con `resumeFromRunId`. |
| Acciones | `wf_7a9b68b6-95d` | `wh2qg1vug` | Oficina y Laboratorio corriendo; faltan Jarvis/Cerebro, formularios y chats. |
| Código por capas | `wf_536bd726-0f1` | `w3o4mi3yo` (relanzado 18:53) | Hechas base-rls y sesion-permisos (sin revisor todavía); corriendo el resto. |

**Hallazgos de base-rls, SIN CONFIRMAR por el revisor** (informe en el scratchpad `aud-web/cod-base-rls/informe.md`): seguimiento, audios, análisis de leads de Marketing y relectura de chats llaman a Gemini sin tope ni registro de gasto; si faltan las migraciones 0638 o 0652 el tope queda apagado sin aviso (comprobar en la base qué hay aplicado de 0636 a 0652); consultas con límite mayor a 1000 que la API corta en silencio (exportar contactos, Resultados, cifras del asistente); avisos al teléfono atados a un solo rubro; vista «Detenidos» lee detenciones de todos los rubros; tablas principales sin protección contra borrado por fuera del panel; la base de pruebas no se crea desde la migración 0500. El informe de sesion-permisos está en `aud-web/cod-sesion-permisos/informe.md` y todavía no se leyó.

**Plugins archivados por pedido del dueño** (movidos, no borrados, a `/root/.claude/plugins/archivo-2026-11-27/`): `sixth-sense` (bloqueaba toda subida al remoto) y `naksha` (aviso de cierre que se repetía sin nada que hacer). Sigue activo el control de `superstack` antes de subir: pide un barrido de claves y datos personales; se hace el barrido y al reintentar el mismo comando pasa.

**Repo:** rama `integracion/rediseno-2211` subida con todo lo de hoy; main sigue en `920569d` (sin publicar hasta el informe de la auditoría). `.gitignore` ahora ignora `.simple-workflow/`, `.superstack/` y `.naksha/`.

## Checkpoint 27/11 · 19:10 (frenado por pedido del dueño; se reanuda 00:30)

**Orden del dueño:** «no esta bien, no me da el uso. pone un checkpoint frena y reanuda 00 30». Motivo: el límite de uso de la cuenta no alcanza para correr los tres flujos juntos.

**Estado:** los tres flujos quedaron **detenidos a propósito** a las 19:04 (no hay navegadores abiertos). Un relanzamiento hecho a las 19:03 por pedido suyo se frenó al minuto.

| Flujo | Run | Qué hay guardado |
|---|---|---|
| Código por capas | `wf_536bd726-0f1` | base-rls y sesion-permisos hechos (sin revisor); el resto se repite. |
| Web solo lectura | `wf_8e9edcef-4cc` | 1 zona de 12 terminada; 11 se repiten. |
| Acciones | `wf_7a9b68b6-95d` | 1 ruta de 5 terminada; Oficina y Laboratorio quedaron a medias. |

**Cómo reanudar (aviso programado `trig_01KjNdYAAh89rpNW6aPX3tnL`, 00:30 de Argentina = 03:30 UTC del 28/11):** cerrar navegadores colgados, comprobar la sesión (`node prueba.js` en `aud-web`), y relanzar con `scriptPath` + `resumeFromRunId` **de a un flujo por vez**: primero código, después web de solo lectura, al final acciones. Antes de dar por buenas las pruebas de acciones, verificar en la base qué quedó creado con el nombre «PRUEBA AUDITORÍA 27/11» por las rutas que se cortaron a medias.

**Sesión del panel:** vigente a las 19:02 (comprobada). **Repo:** rama subida hasta `e42c9e1`; main sigue en `920569d`.
