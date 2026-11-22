# 21 · Orden de ramas y Vercel (inventario y propuesta)

Fecha: 22/11/2026. Hecho por el Escritorio de Ingeniería. **Solo inventario y propuesta: no se borró, cerró, renombró ni desplegó nada.** Sin claves ni datos personales (de Vercel solo nombres de variables).

## 1. Resumen

| Repo | Ramas remotas (sin `main`) | PR abiertos |
|---|---|---|
| LEGAL-CRM (panel, producción) | 99 | 3 (#40, #77, #80) |
| estudio-juridico-vita-final | 2 | 1 (#1) |
| coberturas-sociales-landing | 2 | 1 (#1) |
| agencia-kocos-mkt | 2 | 1 (#1) |
| 0km-kocos-agencia | 2 | 1 (#1) |

Vercel: **un solo proyecto** en el equipo (`legal-crm`, prj_liUp46HbkMc0lPlhX1hX5CVLwsYt), un solo dominio (`legal-crm-nine.vercel.app`), sin entornos personalizados. Los proyectos de las landings están en otra cuenta y no se pudieron ver desde acá.

## 2. LEGAL-CRM · clasificación de las 99 ramas

| Cat. | Qué es | Cantidad |
|---|---|---|
| (a1) | Integradas en `main` por git (ancestro de `main`) | 13 |
| (a2) | PR cerrado y fusionado (squash): el contenido ya está en `main`, aunque git las muestre «por delante» | 69 |
| (d) | De agentes de hoy, ya integradas: `arreglos/captacion-y-cifras-2211`, `arreglos/hidratacion-2211`, `arreglos/operacion-2211`, `diseno/rediseno-panel-2211`, `integracion/arreglos-2211` | 5 |
| (c) | Pendiente por orden del dueño: `claude/pensive-galileo-d6ephy` (botón Archivar del 19/11, 1 commit, 20 archivos que difieren de `main`) | 1 |
| vigentes (no se tocan) | `cerebro-chats` y `claude/admiring-euler-ctf4sg` (mismo commit 01fd775; la segunda tuvo el PR #79 fusionado) | 2 |
| (b) | Trabajo sin integrar que sirve | 7 |
| (e) | Dudosas | 2 |

Verificado: en las 69 de (a2) la punta de la rama es exactamente el último commit del PR fusionado (nada agregado después). Las 13 de (a1) son ancestro de `main`.

### (a1) Integradas por git
`claude/festive-goldberg-x8t43f`, `claude/gracious-volta-rv2f3x`, `claude/relaxed-cerf-5oncz1`, `estetica-por-perfil`, `etapa1-correcciones`, `etapa3`, `landings-crm`, `mejoras-1211`, `plantillas-enviar-a-meta`, `rediseno-b1-navegacion`, `rediseno-b3`, `rediseno-b4`, `wasender-integracion`

### (a2) PR fusionado por squash (69)
`adjuntos-chat-presupuesto`, `afinado-diseno`, `afinado-diseno-2`, `ajustes-perdidos-estadisticas`, `asistente-charlas`, `asistente-completo`, `bandeja-claude`, `bandeja-posicion`, `bloque-1610`, `bot-24-10-contestadores-y-calidad`, `bot-24-10-deteccion-y-recontacto`, `bot-24-10-origen-sin-explicar`, `bot-general-y-rol-campana`, `bot-insiste-una-vez`, `capa-inmersiva`, `chat-alto`, `chat-campanas-ia`, `conocimiento-colores`, `conocimiento-v2`, `contexto-1610`, `contexto-afinado`, `contexto-afinado-2`, `contexto-asistente`, `contexto-estado-lineas`, `correccion-ahora-no`, `diseno-premium-1610`, `errores-explicados`, `escena-iconos`, `estado-real-lineas`, `feat/chat-adjuntar-pdf`, `fix-plantillas-archivo-aviso`, `hora-24`, `ingreso-grafito`, `inicio-campanas-activas`, `kocos-analisis-automatico`, `limite-diario-kocos-contexto`, `linea-codigo-vencido`, `logos-fondo-negro`, `logos-reales`, `mejora-visual-rendimiento`, `perfiles-campana-enviando`, `perfiles-cifras-en-vivo`, `perfiles-en-vivo`, `perfiles-pc`, `plantillas-base-fria`, `plantillas-pedido-por-tandas`, `plantillas-y-botones`, `presupuesto-escribe-antes`, `presupuesto-programado-y-hora`, `prompt-comun`, `recontacto-24h`, `redes-ampliacion-2410`, `redes-piezas-15-dias`, `rediseno-estudio`, `reorg-bot-ia`, `reorg-chat`, `reorg-cierre`, `reorg-parte-1`, `reorg-parte-3`, `reorganizacion-1810`, `reorganizacion-2`, `sala-lampara`, `salud-detenido-no-es-error`, `salud-error-ia-directo`, `salud-y-operacion-1610`, `sin-respuestas-dobles`, `t1-agentes-responden`, `t2-t6-chats-perfiles-cierre`, `verificar-numero`

### (b) Trabajo sin integrar que sirve

| Rama | Último commit | Delante/detrás de main | PR | Propuesta |
|---|---|---|---|---|
| `claude/happy-wozniak-ajfi1z` | 21/11 reels 22/11 | 44 / 114 | #77 abierto (base de #80 también) | Es el tronco de Redes (645 archivos, +5508). Integrar por PR #77 cuando el dueño lo apruebe |
| `claude/redes-autos-1` | 20/11 | 3 / 114 | sin PR | Integrar a `claude/happy-wozniak-ajfi1z` (2 commits propios) o PR |
| `claude/redes-autos-2` | 20/11 | 2 / 114 | sin PR | Idem (1 commit propio: motor de reels con fuentes) |
| `claude/redes-cob-1` | 20/11 | 2 / 114 | sin PR | Idem (1 commit propio) |
| `claude/redes-mkt-1` | 20/11 | 3 / 114 | sin PR | Idem (2 commits propios) |
| `landings-conexion` | 20/10 | 2 / 321 | #40 abierto | Decidir: integrar (aviso por correo de formularios) o cerrar si ya no aplica; lleva un mes abierto |
| `claude/confident-sagan-ey5hn5` | 22/11 cerebro: accesos, A2 y A3 | 1 / 38 | sin PR | Rescatar el commit a `cerebro` y archivar la rama |
| `claude/pensive-galileo-d6ephy` | ver (c) | 1 / 158 | sin PR | No se toca (orden del dueño) |

### (e) Dudosas, para preguntar
- `test-escritura-claude` (15/10, «prueba de escritura (borrable)»): probablemente se puede archivar.
- `trabajo-1410` (14/10, «Aplicar pipeline de Marketing» y «Add files via upload», del bot de GitHub): sin PR, 2 commits que no están en `main`. Preguntar si es descartable.

### Locales (no están en el remoto)
- `claude/cerebro-panel`: hoy apunta a `origin/main` (checkout en /home/user/crm-main). Es la rama de trabajo actual, no se toca.
- `captacion/recontacto-plantillas-y-gravedad`: en curso (worktree agent-ab7ce…). No se toca.
- `worktree-agent-*` (6 ramas locales): residuo de los agentes, ver sección 4.

## 3. Landings (4 repos)

Los cuatro tienen la misma estructura: `main`, `claude/gracious-volta-rv2f3x` y `claude/happy-wozniak-ajfi1z`.

| Rama | Estado | Clasificación | Propuesta |
|---|---|---|---|
| `claude/gracious-volta-rv2f3x` (9/11, publicaciones programadas hasta el 25/11) | integrada en `main` en los 4 | (a) | Archivar con etiqueta |
| `claude/happy-wozniak-ajfi1z` (20/11, «Medición (en curso, sin terminar)»: UTM y referencia en WhatsApp y formulario, robots sin /redes/) | 1 commit por delante (18 a 26 detrás); **PR abierto en cada repo** | (b), medición sin terminar | No archivar. Decidir con el dueño si se termina y se integra o se descarta |

## 4. Worktrees locales de LEGAL-CRM

Todos sin cambios sin commitear. Ninguno se borró.

| Worktree | Rama | Estado | ¿Hace falta? |
|---|---|---|---|
| /home/user/LEGAL-CRM | `cerebro-chats` | vigente | Sí |
| /home/user/crm-main | `claude/cerebro-panel` | = origin/main | Sí (checkout de trabajo) |
| agent-ab7ce… | `captacion/recontacto-plantillas-y-gravedad` | en curso (bloqueado) | Sí |
| agent-a9249… | `arreglos/captacion-y-cifras-2211` | integrada | No, se puede quitar |
| agent-a28c2… | `arreglos/hidratacion-2211` | integrada | No, se puede quitar |
| agent-a5d3b… | `arreglos/operacion-2211` | integrada | No, se puede quitar |
| agent-a36eb… | `diseno/rediseno-panel-2211` | integrada | No, se puede quitar |
| agent-ab918… | `integracion/arreglos-2211` | integrada | No, se puede quitar |

Más 6 ramas locales `worktree-agent-*` y las locales `claude/admiring-euler-ctf4sg` y `claude/happy-wozniak-ajfi1z` (muy atrasadas respecto de su remoto): sin valor, se pueden podar después de quitar los worktrees.

## 5. Vercel (solo lectura)

- **Proyectos del equipo:** 1 (`legal-crm`). Dominio: `legal-crm-nine.vercel.app` (producción, verificado). Sin dominios por rama ni entornos personalizados.
- **Producción:** `main`. Último despliegue: a89c510 (22/11), en construcción al momento de consultar; anterior ee9bca5 y add6a8c en READY (candidatos de rollback).
- **Previews:** en las últimas ~22 horas hay 100 despliegues de Preview. 86 son de `cerebro-chats` y `claude/admiring-euler-ctf4sg` (cada commit de documentación dispara una compilación, con 14 canceladas y 3 en cola). Hay 3 en ERROR: `arreglos/hidratacion-2211`, `integracion/arreglos-2211` y `claude/confident-sagan-ey5hn5`. Los de `arreglos/*`, `diseno/*` ya están integrados, así que esos Previews quedarían colgando al archivar la rama (no molestan, caducan solos y no se pueden «restaurar» por rama).
- **Variables de entorno (solo nombres):**
  - Producción: `WASENDER_HABILITADO`, `WASENDER_PAT`, `WHATSAPP_*` (Marketing, Coberturas, Agencia 0 km), `META_APP_SECRETS`, `CRON_SECRET`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `OUTSCRAPER_API_KEY`, `ADMIN_WHATSAPP_PHONES`.
  - Producción y Preview (compartidas): `ACCESS_PIN`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `WASENDER_CLAVE_CIFRADO`, `WHATSAPP_CIVIL_*`, `WHATSAPP_PENAL_*`, `WHATSAPP_VERIFY_TOKEN`, `META_APP_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN`, `FACEBOOK_*`, `INSTAGRAM_*`, `LANDING_WHATSAPP_TEMPLATE`, `ADMIN_WHATSAPP_PHONE`, `NEXT_PUBLIC_APP_URL`, `BLOB_STORE_ID` y `BLOB_WEBHOOK_PUBLIC_KEY` (también en Development).
  - **Atadas a rama:** `WASENDER_HABILITADO` y `WASENDER_PAT` en Preview solo para la rama `wasender-integracion`. Esa rama ya está integrada en `main`. Si se archiva, estas dos variables quedan huérfanas: conviene retirarlas (acción en Vercel, no hecha) o dejarlas hasta confirmar que Wasender corre bien en producción.
  - No hay otras variables atadas a ramas que ya no existan.
- **Riesgo conocido:** la Preview comparte base (clave de servicio de Supabase) y las líneas/tokens de WhatsApp Civil y Penal con producción. Cualquier Preview con datos reales tiene efectos reales. Los Previews de ramas viejas no se vuelven a abrir solos, pero las URLs siguen vivas hasta que caducan.

## 6. Plan propuesto (en pasos, nada ejecutado)

1. **Etiquetar antes de quitar.** Por cada rama de (a1), (a2), (d) y (a) de las landings: `git tag archivo/<rama> <sha de la punta>` y subir las etiquetas. Con eso el contenido sigue recuperable y se cumple «nada se borra».
2. **Verificar** que cada etiqueta existe en el remoto y que `main` sigue compilando (Vercel producción en READY).
3. **Quitar las ramas remotas archivadas** (87 en LEGAL-CRM: 13 + 69 + 5; 1 por landing). Aprobar primero la tanda chica (a1 + d, 18 ramas) y después las 69 de squash.
4. **Retirar los worktrees** de `arreglos/*`, `diseno/*` e `integracion/*` y podar las ramas locales `worktree-agent-*`.
5. **Integrar** (b): `claude/redes-*` hacia `claude/happy-wozniak-ajfi1z`, luego PR #77; rescatar el commit de `claude/confident-sagan-ey5hn5` y archivarla.
6. **Preguntar** (e), `landings-conexion` (#40) y la medición sin terminar de las landings.
7. **Vercel:** decidir sobre las dos variables de `wasender-integracion` y sobre frenar los Previews de ramas solo de documentación (por ejemplo un paso de «ignorar compilación» cuando solo cambia `cerebro/` o `docs/`), que hoy son el 86 % de las compilaciones.
8. **PR #80** (de `main` hacia `claude/happy-wozniak-ajfi1z`, abierto): cerrar o rehacer. Apunta al revés de lo normal y, si se fusiona, mezclaría todo `main` en la rama de Redes.
9. Mantener una convención de nombres (`arreglos/`, `diseno/`, `integracion/`, `captacion/`) y archivar con etiqueta al fusionar.

## 7. Riesgos

- Quitar una rama de squash con PR fusionado es seguro; igual se etiqueta primero.
- `cerebro-chats` está 43 commits atrás de `main`: este documento y los de cerebro quedan en esa rama hasta que se integre. Hay que traerlos a `main` cuando se decida.
- Quitar `claude/happy-wozniak-ajfi1z` o las `redes-*` perdería guiones y reels sin integrar. No se tocan hasta decidir.
- El PR #80 y el trabajo de medición de las landings tienen PR abierto en 4 repos más: cerrar un PR no debe hacerse sin avisar.

## 8. Qué tiene que aprobar el dueño

1. Si se etiquetan y quitan las 87 ramas ya integradas (empezando por 18) y los 5 worktrees de agentes.
2. Qué se hace con Redes (`claude/happy-wozniak-ajfi1z` + `redes-*`, PR #77) y con la medición sin terminar (PR abiertos en las 4 landings).
3. Qué pasa con `claude/pensive-galileo-d6ephy` (Archivar del 19/11), `landings-conexion` (#40), `trabajo-1410`, `test-escritura-claude`, el PR #80, y si se retiran las variables de Preview de `wasender-integracion` y se filtran los Previews de documentación.

## Decisión del dueño (22/11 noche)

- **Ramas:** no se toca nada. El inventario era para ordenarse; se archiva solo si hace falta de verdad.
- **PR sin integrar** (#77 Redes y ramas `redes-*`, #80 medición de landings, #40 aviso por correo): quedan para después.
- **Vistas previas de las ramas de documentos:** preguntó para qué sirven. Se le explicó; falta su respuesta sobre si se frenan las de `cerebro-chats` y `admiring-euler`.
