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
