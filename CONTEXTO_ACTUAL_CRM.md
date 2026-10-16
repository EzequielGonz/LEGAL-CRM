# CONTEXTO ACTUAL · CRM multirubro

Actualizado: 15/10/2026. Sin secretos ni datos de prospectos.

## Estado al 15/10 (bloque: integración Etapa 3 + Gemini 3.8 + plantillas + redes)
- Autorización 15/10: la responsable pidió implementar directamente (código, base, configuración y despliegue) conservando las pausas. Restricción: autorización antes de cualquier pago.
- Código: rama local `etapa3` = `fb5cdc3` + entrega 13/10 (commit `173d010`) + **Gemini 3.8 Flash** como cambio independiente (commit `4494102`). Unitarias 118/118 con imitaciones (npm bloqueado en el entorno de Claude). Rama `etapa3` creada en GitHub (aún = `main`); el push directo está bloqueado para la sesión → ZIP `kocos-pipeline-etapa3-gemini38-1510.zip` para subir a esa rama.
- Gemini 3.8: `MODELO_POR_DEFECTO = gemini-3.8-flash`, `identificadorModelo()` único; sin temperature/top_p/top_k; FunctionResponse con `id`. En Vercel `GEMINI_MODEL=gemini-3.8-flash` y `GEMINI_API_KEY` nueva (Production), redeploy de producción hecho el 15/10 (sigue `fb5cdc3`). Sin errores de ejecución; conversación real todavía sin probar.
- Fine tuning: 3.8 Flash no figura como ajustable en la documentación revisada; candidato documentado: 3.5 Flash en Vertex (us-central1/europe-west4). Sin proyecto de Google Cloud ni presupuesto: solo preparado, nada enviado.
- Base: respaldo completo en el esquema privado `respaldo_20261015` (43 tablas + definiciones de políticas y funciones). Migraciones 0199–0300 **no aplicadas**: el permiso de la sesión rechazó modificar producción.
- Plantillas WhatsApp: 33 propuestas (apertura A/B/C, Fase 2, seguimiento 2 y 3, reagendamiento, aviso interno y formulario por rubro), con payloads para Meta. Catálogo real vacío; sin conector de Meta → no presentadas.
- Redes: estrategia y calendario de 30 días (lun/mié/vie 11:00, desde 19/10) con 48 piezas 1080×1350 y textos por red. Borrador: faltan identidad, logo y CTA. Metricool: solo la marca «Kocos Marketing» con Facebook.
- Siguiente paso: subir ZIP a `etapa3` → revisar Preview → aplicar SQL 01–12 y 13 → merge y deploy → prueba real de conversación (Probar conversación) → datos de marca → conectar Metricool por rubro y Meta.

## Versión base anterior (13/10)
## Versión base
- Producción y GitHub `main`: `fb5cdc3` (Etapa 1 publicada). Nada de lo de abajo está publicado.
- Esta copia de trabajo = `fb5cdc3` + Etapa 2 + Etapa 3, sin publicar. Entrega vigente: `entrega-crm-etapa3-1310.zip` (contiene todo; reemplaza a la de la Etapa 2). Documento único: `docs/etapa3/ENTREGA.md`.

## Qué contiene la copia de trabajo (cinco estados)
| Parte | Especificado | Implementado | Probado | Publicado | Habilitado |
| --- | --- | --- | --- | --- | --- |
| Etapa 2 · 2.0 horarios y calendario (migración 0200) | sí | sí | sí, también con dependencias reales (12/10) | no | no |
| Etapa 2 · 2.3 circuito de seguimiento (0201) | sí | sí | sí, también con dependencias reales | no | no (apagado en los 4 perfiles) |
| Bloque 1.12 sesión comprobada en cada operación privada | sí | sí | sí, con reemplazos locales (73 unitarias, 61 integración) | no | — |
| Migración 0202 (funciones sin acceso público) | sí | sí | sí, sobre copia de la base | no | — |
| Skills `kocos-*`, `CLAUDE.md`, `.claude/referencias/` | sí | sí | sí | no | — |
| Bloque 5 · contenido automático y SEO (migración 0206) | sí | sí (política, cola, panel, Search Console OAuth) | sí, con destinos simulados (90 unitarias, 80 integración) | no | no (políticas apagadas y calendario en pausa en los 4 perfiles; sin ejecutor programado; Search Console sin variables) |
| Bloque 4 · biblioteca de agentes (migración 0205) | sí | sí (solo configuración y vista) | sí, con imitaciones (87 unitarias, 77 integración) | no | no (los 5 apagados; la base no admite «activo») |
| Bloque 3 · operación diaria (migración 0204) | sí | sí (fuente, pedido de texto, búsqueda en columnas importadas, agenda IA) | sí, con imitaciones (86 unitarias, 76 integración) | no | — |
| Bloque 2 · panel (indicadores clickeables, ficha con resultado posterior, accesibilidad) | sí | sí | sí, con imitaciones (84 unitarias, 73 integración; tipos de pantallas con tipos sustitutos) | no | — |
| Bloque 1 · reglas de base y captación (migración 0203) | sí | sí | sí, con imitaciones locales (83 unitarias, 71 integración) | no | no (24 h apagada en los 4 perfiles; tareas de cita sin ejecutor programado) |

Migraciones de la base real: 0199 a 0203 **no aplicadas**. Orden previsto: 0199 → `select etapa1_reconciliar_posteriores();` → 0200 → 0201 → 0202 → 0203 → 0204 → 0205 → 0206 → 0207 (seguridad al final) → `verificar_seguridad.sql`. **El SQL va antes del código** (el código nuevo lee columnas de 0203; si faltan, los mensajes se guardan igual sin origen).

## Decisiones vigentes
- Pausa general activa, agentes apagados, tarea programada inactiva, campañas pausadas, seguimiento apagado. Publicar código no habilita envíos.
- Etapa 3 **construida el 13/10 por pedido expreso** («hace todo la etapa 3 ahora»), sin publicar ni habilitar: sin asignaciones activas, sin trabajos de ajuste en el proveedor, ejecutor de tareas apagado, sin publicación en redes. Instalar skills no autoriza etapas, envíos, publicaciones ni gastos.
- Entrega por un único ZIP + guía de máximo 5 pasos + SQL en orden. Claude no escribe en GitHub. La responsable decidió dejar la seguridad (0202 y verificación final) **para el final**.
- La Preview comparte base y líneas con producción: solo se mira. Pruebas con efectos: entorno aislado (sandbox de Vercel, datos ficticios, Meta simulado).
- Todo el parche 2.0 **menos el entrenamiento** se integra en esta etapa, sumando sobre lo existente (no se rehace nada).

## Bloque 1 (cerrado el 13/10, sin publicar)
- `messages.origin` en toda salida (respuesta entrante, campaña, seguimiento, cita, reagendamiento, atención humana); las salidas de la empresa revalidan pausa de envíos y franja L–S 8–21 en `sendOutboundMessage`.
- Entrantes: `decidirRespuestaEntrante` en `inbound.ts` (24 h solo con `rubros.inbound_24h_enabled`, apagado; nunca con pausa, chat tomado, agente apagado). Captado que vuelve a escribir → atención humana `mensaje_posterior_captado`, sin IA. Activar 24 h: `/api/perfiles/atencion-24h` con PIN.
- Captación: `capture_register` (evento único atómico, cancela pendientes, avisos por destinatario o «sin_destinatario»), `src/lib/captacion/index.ts`; API `captar` usa el evento; acciones nuevas `resultado_posterior`, `atencion_motivo`, `zona`.
- Agente: modelo inyectable (`usarModeloAgente`), herramientas `captar`, `detener_contacto` (disculpa y detención después de enviarla), `escalar_a_humano` con categoría 12.2, `registrar_ubicacion`, `elegir_ruta_juridica`, `programar_fase2`; criterio por rubro desde configuración. Sin cambios de prompts editables ni entrenamiento.
- Citas: tipo `ia` (no ocupa turnos humanos), `cita_tareas` (inicio y un solo reagendamiento 1 h después del inicio enviado). Sin ejecutor programado: la tarea programada sigue inactiva.
- Pruebas nuevas: `tests/unitarias/reglas-base-captacion.test.ts` (A08, A09, A13, A14, A15, A17, A18, A20, C06, C07), `tests/integracion/captacion-y-atencion.int.test.ts` (A08, A13, A14, A15, A17, A18, A20, C07, C10, C12, PIN 24 h).

## Bloque 2 (cerrado el 13/10, sin publicar)
- `src/lib/indicadores.ts`: catálogo único de indicadores; cifra y lista usan la misma consulta (`aplicarCondiciones`); prueba A03 contra `profile_metrics`.
- `/oportunidades?perfil=&indicador=&orden=&pagina=&volver=`: lista común a los 4 perfiles y al teléfono → ficha → conversación; el estado vive en la dirección (volver conserva filtros, orden y página). «Oportunidades» en los dos menús.
- `MetricsPanel`/`StatCard` clickeables (PC y teléfono); cifras sin lista (mensajes, detenidos) no son clickeables.
- Ficha: ubicación, advertencias, categoría de atención y resultado posterior, con formulario que solo dice «Guardado» si el servidor confirma.
- Accesibilidad: foco visible común, movimiento reducido, salto al contenido, `aria-current`, objetivo táctil 44 px en lo nuevo. No se declara toda la app accesible: falta auditoría navegando.

## Bloque 3 (cerrado el 13/10, sin publicar)
- 2.8 Fuente: `src/lib/fuente.ts` + `opportunities.first_source` (primera comprobable, nunca se pisa; sin referencia = «no informada»); textos identificadores por perfil en `rubros.source_identifiers` (vacío hasta que Vita los cargue). Indicadores por fuente en `/oportunidades`, fuente en ficha y lista.
- 2.6 Adjuntos: audio/imagen no legible → un solo pedido de texto cada 12 h si la IA podría responder (misma compuerta). **Transcripción no implementada**: requiere usar un servicio de IA con costo; queda pendiente de autorización.
- Búsqueda: `contacts.base_text` (disparador sobre filas de bases) suma las columnas importadas a Inbox y Prospectos, con conteo correcto (A06).
- Agenda: las citas de IA no ocupan turnos y se rotulan en Agenda.
- Sin cambios (ya existían y se conservan): panorama de bases (`bases-list-view`), cifras por campaña, creación de campañas siempre en borrador con vista previa de destinatarios y comprobación de requisitos; investigación de Marketing (`analyzeLead`). La consulta de precio va a una persona (bloque 1).

## Bloque 4 (cerrado el 13/10, sin publicar)
- `agent_library` (principal + 4 derivados, herencia de límites, conocimiento separado, modos) y `agent_library_versions` (solo agrega). Estado solo «apagado» o «borrador». No toca `ai_agents` ni sus prompts.
- `/agentes/biblioteca` (enlazada desde «Agentes IA» de cada perfil) y `/api/agentes/biblioteca` (editar pide PIN, versión con comparación y reemplazo, rechaza claves y teléfonos). Sin simulador, evaluación ni entrenamiento.

## Bloque 5 (cerrado el 13/10, sin publicar)
- `content_policies` (por perfil y canal: Instagram, Facebook, landing; apagadas, calendario en pausa), `content_pieces` (cola duradera con clave de deduplicación, estado, fecha, zona, destino, id y enlace de la plataforma), `content_publish_attempts` (solo agrega), `content_results` (nulo = sin datos), `content_requests`, `search_console_connections` (token cifrado).
- `src/lib/contenido/politica.ts` (retiene solo lo que necesita evidencia, información o decisión: precios, plazos, promociones, garantías, testimonios, placeholders, CTA no configurado), `cola.ts` (publicador inyectable; incierta se reconcilia antes de repetir; token vencido pausa el canal), `panel.ts`.
- `/contenido?perfil=` (próximas, publicadas con resultados reales, necesitan acción, «mejorá el contenido», cambiar objetivos, pausar/reanudar calendario con PIN, avanzado). Enlazado en los menús.
- Search Console: `/api/seo/search-console/conectar` y `/vuelta` (OAuth de solo lectura, estado firmado, token cifrado AES-GCM). Sin variables ni `SEARCH_CONSOLE_ENABLED=true` responde qué falta.
- Sin ejecutor programado de la cola y sin publicador real: el bloque nuevo de redes decide la vía (Metricool hoy).

## Cierre (13/10)
- 0207 (barrido final de seguridad) + `docs/etapa2/sql/verificar_seguridad.sql` (10 controles en 0) + `revertir_0203_0207.sql` (se detiene si hay datos). Probado en la base local; `fb5cdc3` pasa sus 39 pruebas con todo aplicado.
- Entrega única: ZIP de proyecto, parche sobre `fb5cdc3`, huellas, carpeta `sql/` numerada con reversión, guía de 5 pasos (`docs/etapa2/ENTREGA.md`), informe (`docs/etapa2/INFORME.md`). Entregas anteriores reemplazadas.
- **Verificación con dependencias reales NO hecha:** el entorno aislado de Vercel (`verificacion-cierre-1310`, apagado, instantánea `snap_41Ml…`) instaló npm, PostgreSQL y PostgREST, pero el control de permisos de la sesión bloqueó la subida del código como «salida de datos». No se forzó. Primera verificación real: compilación de la Preview (paso 2 de la guía).

## Etapa 3 (construida el 13/10, sin publicar)
- Migración `0300` (biblioteca ampliada, asignaciones, módulos, pedidos, simulador, casos y resultados, corpus, trabajos de ajuste, comparaciones, brief, auditorías, `tareas_servidor` apagado). Reversión `docs/etapa3/sql/revertir_0300.sql`; seguridad `docs/etapa3/sql/verificar_seguridad.sql` (14 controles en 0).
- `src/lib/agentes/`: `contrato.ts` (validador R07 + herramientas permitidas), `modulos.ts`, `contexto.ts`, `modelo.ts` (informe sin exponer claves; Vertex preparado y bloqueado; generador simulado), `simulador.ts` (herramientas simuladas, sin efectos reales), `evaluacion.ts` (controles, fallos críticos, rúbricas 16/14, umbrales fijos 14/60 %/regresión 1), `casos.ts` (16 casos W01–W10, C13–C18), `corpus.ts` (partición por familia, JSONL de Google Cloud, hash), `servicio.ts` (crear, asignar, publicar, simular, evaluar, sembrar, exportar, preparar/autorizar ajuste).
- `agent.ts`: con asignación activa usa el contexto de la biblioteca; valida la salida (una reparación, luego retención con atención humana). Sin asignación responde como hoy.
- API: `/api/agentes/{modelo,crear,asignaciones,publicar,simulador,evaluacion,corpus,ajuste,pedidos}`, `/api/acceso/tareas-servidor`, `/api/contenido/{brief,piezas,auditoria}`; tick con tareas de cita y contenido solo si el ejecutor está encendido.
- Panel: «Agentes IA» unificado (4 perfiles) con Probar conversación / Pedir mejora / Ver resultados / Crear agente / Asignar versión / Configurar; Configuración con Disponibilidad para citas (movida desde Agenda), Tareas del servidor y Conexiones; Inbox con motivo de atención y vista «Detenidos»; entrada con «Requiere acción»; Contenido con brief, generador (texto + SVG, calendario L/M/V) y auditoría de landing.
- Pruebas: 116 unitarias, 89 integración; tipos sin errores nuevos. No verificado con dependencias reales.
- Pendiente de Vita: cuentas y logos de redes, clave/variables de Vertex y autorización de gasto, carga del corpus hasta el piloto, comparación ciega, envío real del trabajo de ajuste.

## Plan pendiente (en orden)
1. Decidir con Vita cómo verificar con dependencias reales (Preview, autorizar la subida al entorno aislado o que el programador corra `npm ci && npm run typecheck && npm run lint && npm run build` y las pruebas).
2. **Bloque nuevo · Contenido y publicación en Instagram y Facebook (4 rubros):** espera datos de Vita (cuentas a conectar en Metricool, nombre ORVIAN vs. página «Kocos Marketing», CTA real, activos de marca, servicios autorizados). Conexión comprobada el 13/10: Metricool con una sola marca («Kocos Marketing») y solo su página de Facebook; sin Instagram; nada programado. Nada preparado, programado ni publicado.

## Siguiente paso
Esperar decisión de Vita sobre la verificación real (Preview), los datos de redes y las variables de Vertex. Nada más se implementa sin indicación. Entorno local de pruebas: PostgreSQL 16 en 55432 (datos fuera del scratchpad) + PostgREST 12.2.3 en 54331; la base se recrea antes de cada corrida de integración.

## Dónde leer (solo lo pertinente)
`CLAUDE.md` → `.claude/referencias/reglas-comunes.md` (secciones 3 a 7) → skill `kocos-crm-reglas-de-captacion` → `.claude/referencias/casos-de-aceptacion.md`.
