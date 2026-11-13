# Bitácora detallada del 13/11 (para retomar después de compactar la conversación)

Sin datos personales, claves ni códigos de acceso. Complementa `PLAN-3.md` (qué falta) y `docs/ESTADO.md` (qué está encendido).

## Entorno y forma de trabajo

- Repo `/home/user/LEGAL-CRM`, rama `mejoras-1211`; se publica con `git push origin mejoras-1211:main` (avance rápido). Producción: `legal-crm-nine.vercel.app`. Vercel: equipo `team_DGPKq7VRI79P0koUBcsxu1IH`, proyecto `prj_liUp46HbkMc0lPlhX1hX5CVLwsYt`, región `gru1`. Supabase: proyecto `enhgkeqiqcuwafsedaza`.
- Verificación antes de publicar: `npm run typecheck`, `npx tsc -p tests/tsconfig.json --noEmit`, `npm run lint`, `npx --yes tsx@4.23.12 --tsconfig tests/tsconfig.json --test tests/unitarias/*.test.ts` (386 pasan; falla 1 anterior y ajena: «asistente: cada tipo permitido…»), `npm run build`.
- Vercel cancela los despliegues en cola cuando llega otro push: después de varios pushes seguidos, esperar al último antes de probar en producción (`list_deployments` con `target: production`).
- No hay `.env.local`: no se puede levantar el panel local con datos. Se verifica en producción, solo mirando, y las pruebas con efectos se hacen con casos viejos.
- Recorridos con Playwright (ya instalado): guiones en el scratchpad de la sesión, carpeta `panel/` (`recorrer.js` mide y captura una lista de rutas; `p4/usar.js` y `p4/usar2.js` recorren los flujos nuevos; `p4/medir.js` mide tiempos; `p4/comparar.js` compara Hoy con el filtro de chats; `ficha/probar.js` prueba «Devolver al bot»; `plantillas/cargar.js` carga plantillas por la API). Todos entran con `POST /api/acceso/ingresar` y toman el código de una variable de entorno. Si el scratchpad ya no existe, se rehacen con ese mismo patrón. Las capturas tienen datos reales: no van al repo.
- Cargas grandes de datos: por la API del panel con sesión iniciada (así se cargaron las 40 plantillas), no pegando SQL largo en la herramienta de base.
- Las tareas en segundo plano con otros modelos se cortaron por el límite de uso de la cuenta sin entregar nada. Regla de la responsable desde el 13/11: se trabaja con el modelo principal; otro modelo solo para tareas muy sencillas y sin margen de error.

## Commits del día (rama `mejoras-1211`, todos en `main`)

| Commit | Qué |
|--------|-----|
| 52fd382 | Criterio del bot antes del seguimiento; descartes automáticos; migración 0606 |
| 467d937 | «Resultados» y pantalla de Seguimiento con la ruta |
| 76e6881 | Plantillas de inicio con 40 variantes y rotación en campañas |
| 954ec63 | Bot v2: 14 fichas; reacciones sin pedido de texto |
| 927de73 | Ficha: quién atiende y «Devolver al bot» |
| 344088e | Hoy y cartera con marco inmediato; métricas en memoria |
| 7109266 | Lista de chats en palabras; Incidencias; menú de Contactos |
| 9df543d | Ficha: etapa y origen; cambio de quién atiende al instante |
| c135d98 | Filtros de chats plegados; reglas comunes; documentos de la entrega |
| fd3fbda, 4dd77f5 | Filtros «Esperan tu respuesta» y «Los atiende una persona» por estado real del chat |
| 574699a | Correcciones de la auditoría de experiencia |
| 6b9bd9e | `docs/ESTADO.md` |

## Archivos nuevos o con cambios importantes

- Seguimiento: `src/lib/seguimiento/criterio.ts` (reglas puras: `instruccionSeguimiento`, `leerCriterio`, `motivoNoInsistir`, `RUTA_SEGUIMIENTO`), `criterio-servidor.ts` (`consultarCriterio`: arma el mismo contexto del agente y pregunta al modelo; devuelve null si no puede decidir), `motor.ts` (`noInsistir`; el criterio se consulta en `processTask` por Meta y en `processTaskWasender`, donde además el bot redacta), `wasender.ts` (`plantillaOpcional`), `segundo-intento-motor.ts`.
- Descartes: `src/lib/hoy/descartes-motor.ts` (`descartesVencidos`, `cerrarDescartesAutomaticos`), llamado cada 10 minutos desde `src/app/api/campaigns/tick/route.ts`.
- Resultados: `src/lib/resultados.ts` (`leerResultados`, `origenEnPalabras`, `fuenteDe`, `agruparOrigenes`, `quienLoHizo`), `src/app/resultados/page.tsx`, enlaces «Ver quiénes» en `src/components/inicio/presentacion-hoy.tsx`, pestaña en `src/lib/menu.ts`.
- Plantillas y rotación: `src/lib/wasender/plantillas-servidor.ts` (`MAXIMO_VARIANTES = 60`, campo `grupo`), `src/components/wasender/plantillas-wasender.tsx`, `src/lib/wasender/campanas.ts` (`plantillasDeInicioUsables`, `elegirPlantillaDeInicio`, `preparacionWasender` con `rotacion`, `opcionesWasender` con el conteo), `src/lib/campaigns.ts` (elige la plantilla por persona), `src/app/api/campaigns/route.ts` y `[id]/route.ts` (`wasender_rotar_inicio`), formularios en `src/components/campanas/`.
- Ficha: `src/components/ficha/ficha-actions.tsx` (bloque «Quién atiende este chat»), `ficha-section.tsx` (etapa, origen, historial en palabras), `src/app/api/oportunidades/[id]/route.ts` (al devolver: estado del chat y respuesta del bot al mensaje pendiente de las últimas 23 h), `src/lib/ai-agent/rescate.ts` (`rescatarConversacion` exportada con franja ampliable).
- Velocidad: `src/app/hoy/page.tsx` (`CuerpoHoy` dentro de `Suspense`), `src/components/cartera/vista-cartera.tsx` (`CuerpoCartera`), `src/lib/metrics.ts` (`unstable_cache` de 60 s).
- Chats: `src/components/inbox/conversation-list.tsx`, `src/lib/cartera.ts` (`previaLegible`), `src/app/api/inbox/route.ts` (`atencion=esperan` y `tomados`).
- Otros: `src/lib/inbound.ts` (reacciones), `src/app/(dashboard)/revision/page.tsx` (Incidencias), `src/lib/inicio.ts` (texto del siguiente paso).
- Pruebas nuevas: `tests/unitarias/seguimiento-criterio.test.ts`, `resultados.test.ts`; agregados en `wasender-ritmo.test.ts` y `cartera-y-horario.test.ts`.

## Cambios en la base (todos con registro en `ops_change_log`)

- Migración 0606 aplicada (valor por defecto de `rubros.followup_enabled_since`, `wasender_plantillas.grupo`, `campaigns.wasender_rotar_inicio`).
- Registro 172: seguimiento encendido en los cuatro perfiles con fecha 12/11 11:00 UTC; `segundo_intento_desde` = 13/11; plantillas `…_segundo_intento` activadas.
- 14 fichas de conocimiento versión 2 con `fuente = 'mejora 13/11'` (texto en `conocimiento-v2-agregados.sql`).
- 40 plantillas de inicio (13 nuevas, 27 con variantes sumadas), `grupo = 'inicio'`, activas.
- Prueba de la ficha con la conversación `c18c12b1-d190-4ee8-9e3a-8fc913536a24`: se devolvió al bot, no salió ningún mensaje y se restauró (`ai_enabled = false`, `status = requiere_atencion_humana`).

## Medidas tomadas en producción

- Antes: Hoy 6,7 s; Chats activos 3,4 s; Contactos 3,0 s. Después: título visible en 0,4 s; Hoy completo 2,5 a 4,4 s; Chats 2,5 a 2,9 s; Contactos 2,3 a 2,6 s.
- Base (`pg_stat_statements`): `profile_metrics` 229 ms de media con 26.000 llamadas (ahora en memoria un minuto); `campaign_metrics` 140 ms con 20.000 llamadas (sin tocar); `pg_timezone_names` 330 ms (interno).
- Bot v2, del 25/10 al 13/11: en conversaciones que terminaron detenidas, turnos con alguna ficha: Marketing 0 de 10, Autos 0 de 8, Jurídico 5 de 15.
- Hoy (Jurídico): «Atención humana» 3, «Captados para derivar» 8 (6 con «Te escribió»); filtro «Esperan tu respuesta» 7; «Los atiende una persona» 88. Incidencias: 55 (antes 270 contando 215 detenciones).
- Seguimiento: 2 contactos programados en Jurídico; el primero, 14/11 23:44 UTC.

## Hallazgos sin resolver (además de los de `PLAN-3.md`)

- `followup-panel.tsx`: la lista «Base para campaña manual» sigue mostrando hasta 50 filas sin paginar.
- `casos-list.tsx` (tabla vieja) está fijada a Jurídico y es la única tabla clásica que queda a la vista por dirección.
- En la ficha, «Marcar como derivado» no avisa a nadie: solo cambia el estado (correcto según las reglas, pero el botón no lo aclara).
- `campaign_metrics` se llama desde `cartera-servidor.ts` por cada campaña en cada carga.
- En el teléfono, los chips de Hoy miden 33 px de alto (el mínimo cómodo es 36 a 40).
- `window.prompt` / `window.confirm`: quitado de plantillas de Wasender; revisar el resto de las pantallas de Wasender (líneas).


## Corrida del 13/11 a las 8:51 (Plan 4)

**Commits:** `20d2faa` (cada rubro separado), `07e855e` (reglas del 13/11 y limpieza) y el que acompaña a este texto (desbordes en el celular, «Oportunidades reales» sin captados, documentos).

**Migraciones aplicadas** (historial comprobado antes; la última era la 0606): `0607_reglas_caidos_atencion_limpieza` (columnas `last_inbound_at`, `last_outbound_at`, `ultima_palabra`, `interest_*`, `posible_captacion*` en `opportunities`, con carga inicial desde los mensajes; disparador `messages_ultima_actividad`; función `caidos_candidatos`; plazo por defecto 72; tipos de incidencia `amenaza_legal` y `queja_cliente_captado`; tabla `limpieza_movimientos`) y `0608_categoria_reclamo` (categoría `reclamo`; una sola incidencia de reclamo abierta por persona y tipo).

**Cambios de datos, con registro en `ops_change_log`:** 217 (plazo de seguimiento 60 → 72 h en los cuatro perfiles), 218 (inicio de la limpieza, con la simulación), 219 (fin de la limpieza, con los conteos y el encendido del motor de caídos).

**Archivos nuevos:** `src/lib/perfil-ruta.ts`, `perfil-activo.ts`, `seguimiento/caidos.ts`, `seguimiento/caidos-motor.ts`, `atencion/reclamos.ts`, `atencion/interes.ts`, `limpieza/reglas.ts`, `limpieza/servidor.ts`, `components/configuracion/ajustes-generales.tsx`, `components/limpieza/boton-deshacer.tsx`, `app/incidencias/page.tsx` (movida desde `(dashboard)/revision`), `app/revision/page.tsx` (redirección), `app/limpieza/page.tsx`, `app/api/limpieza/route.ts`, y las pruebas `separacion-perfiles`, `seguimiento-caidos`, `atencion-reclamos-interes`, `limpieza-reglas`.

**Guiones de prueba** (directorio temporal de la sesión, no van al repositorio porque sus salidas tienen datos reales): `panel/mezcla/rastrear.js` (sigue cada enlace de un perfil y marca pantallas de otro), `ids.js` + `cruzar.js` (junta los identificadores de cada lista y le pregunta al panel de qué perfil son), `panel/limpieza/llamar.js` (simular, aplicar, releer, puntuar, encender), `panel/b/ver.js` y `desborde.js` (capturas y desbordes a 375 px).

**Aprendido:** la relectura de Marketing devolvió un error de tiempo en la primera tanda (66 chats); al repetir el pedido terminó sola porque cada movimiento se anota antes de aplicarse. El proveedor de Wasender no documenta la vinculación por código (solo `qr` y `passkey`).
