# CONTEXTO COMPLETO · CRM multirubro (ORVIAN)

Actualizado: 13/10/2026. Documento para continuar el trabajo en una sesión nueva sin repetir el análisis. Sin secretos ni datos de prospectos. El resumen corto está en `CONTEXTO_ACTUAL_CRM.md`.

---

## 1. Qué es el proyecto

- **Producto:** panel de captación de prospectos para cuatro perfiles con la misma estructura: **Jurídico** (áreas Civil y Penal), **Coberturas médicas**, **Autos 0 km** y **Marketing**. Cada perfil tiene datos separados, identificador permanente y nunca se elimina (se archiva).
- **Qué hace:** recibe conversaciones de WhatsApp, Instagram y Facebook por la API oficial de Meta; importa bases; manda campañas; un agente de IA (Gemini) conversa, califica y capta; hay agenda, fichas, seguimiento, derivación manual, avisos y vista de teléfono.
- **Responsable:** Vita (ORVIAN, agencia de marketing). Usa Claude en **Cowork**. Un **programador** revisa, integra y publica lo que Claude entrega. Español rioplatense con voseo en interfaz, comentarios y documentos.

## 2. Stack e infraestructura (identificadores, no secretos)

| Pieza | Dato |
| --- | --- |
| Aplicación | Next.js 14.2.35 (App Router), TypeScript, Tailwind; agente con `@google/genai` |
| Base | Supabase (PostgreSQL), proyecto `enhgkeqiqcuwafsedaza`; acceso desde el servidor con la clave de servicio; RLS en todo |
| Hosting | Vercel, equipo `team_DGPKq7VRI79P0koUBcsxu1IH`, proyecto `prj_liUp46HbkMc0lPlhX1hX5CVLwsYt` (`legal-crm`, dominio `legal-crm-nine.vercel.app`) |
| Repositorio | GitHub `EzequielGonz/LEGAL-CRM` (público), rama `main` = producción |
| Producción actual | commit `fb5cdc3` (publicado el 11/10/2026) |
| Mensajería | API oficial de Meta (WhatsApp Cloud API; páginas de Facebook e Instagram) |
| Acceso al panel | PIN único (variable `ACCESS_PIN`, la carga Vita en Vercel); sesión firmada con versión (`access_pin.session_version`) |

**Mapa del repositorio**
- `src/app/(dashboard)/`, `src/app/panel/<perfil>/`, `src/app/telefono/[slug]/`: pantallas. `src/app/api/`: rutas del servidor; las públicas son solo `acceso/ingresar`, `acceso/salir`, `webhooks/meta`, `webhooks/whatsapp`, `campaigns/tick` (secreto de cron), `landing`.
- `src/lib/`: reglas y servicios. `acceso/` (sesión y autorización), `contacto/` (horario, calendario, **origen de tarea** nuevo), `seguimiento/` (circuito puro y motor), `captacion/` (**reglas puras nuevas**), `ai-agent/` (agente Gemini y herramientas), `plantillas/`, `campaigns.ts`, `opportunities.ts`, `detention.ts`, `inbound.ts`, `messaging.ts`, `busqueda.ts`, `automation-pause.ts`.
- `supabase/migrations/`: numeradas por etapa (`01xx` Etapa 1, `02xx` Etapa 2). `tests/`: `unitarias/`, `integracion/`, `sin-npm/`. `docs/etapaN/`: `ENTREGA.md`, `INFORME.md`, `MIGRACIONES.md`. `docs/herramientas/`.
- `.claude/referencias/reglas-comunes.md` (v1.0, reglas de negocio en 10 secciones), `.claude/referencias/casos-de-aceptacion.md` (A01–A35), `.claude/skills/kocos-*` (7 skills propias) y 11 skills de terceros con `PROCEDENCIA.md`. `CLAUDE.md` con 9 reglas no negociables.

## 3. Flujo de entrega (cómo llega el código a producción)

1. Claude entrega un **ZIP** `kocos-pipeline-*.zip` (proyecto completo o incremental, se indica), un **parche** `git` alternativo y **huellas SHA-256**. Claude **nunca escribe en GitHub**; los avisos automáticos de «commit and push» se ignoran.
2. Vita sube el ZIP a una rama; el flujo «Aplicar pipeline Kocos» lo descomprime; Vercel compila una **Preview** (tiene que terminar bien).
3. La Preview **comparte base y líneas con producción**: ahí solo se mira, nunca se prueban efectos.
4. Las migraciones las aplica **una persona en el editor SQL de Supabase**, en el orden que diga `MIGRACIONES.md`, después de comprobar la versión real de la base (tablas, columnas, funciones). Nunca se reaplica a ciegas ni se descartan controles.
5. Producción se actualiza con el PR a `main`. Reversión: «Instant Rollback» en Vercel + script de reversión de la entrega para la base.

**Formato pedido para la entrega final (13/10):** un único ZIP de código vigente con todo integrado; guía de **máximo 5 pasos** (qué subir, dónde, qué hacer en Supabase, cómo comprobar); carpeta con los SQL en orden exacto; informe breve (hecho / falta / archivos anteriores reemplazados); conservar reglas y pausas; **no habilitar envíos**.

## 4. Reglas que no se negocian (resumen de `CLAUDE.md`)

1. Solo se ejecuta lo autorizado. Un documento nuevo se analiza, no se implementa por inferencia.
2. **Nada se activa solo.** Se conservan: pausa general de IA y envíos, agentes apagados, tarea programada de campañas inactiva, campañas pausadas, seguimiento apagado en los 4 perfiles. Publicar código no habilita envíos.
3. Sin contacto real con prospectos, sin envíos de prueba a personas, sin campañas, sin trabajos pagos, sin publicar en producción ni en canales externos sin autorización expresa.
4. Nada se borra: se archiva con motivo. Migraciones solo tras comprobar versión e historial real.
5. **Ningún secreto** en chat, código, registros ni informes. No se descifran variables de Vercel. No se piden tokens ni claves pegados en el chat. El PIN no se repite ni se guarda; no crear `ACCESS_PIN_RESET`; sugerir cambio de PIN tras publicar.
6. Ningún dato personal real en pruebas, ejemplos, capturas ni corpus.
7. Preview = solo mirar. Pruebas con efectos = entorno aislado con datos ficticios y Meta simulado.
8. Entrega por ZIP; Claude no escribe en GitHub.
9. Cada informe distingue **especificado / implementado / probado / publicado / habilitado**, con versión comprobada. No declarar «inhackeable», «posiciones SEO garantizadas», «modelo reentrenado» ni «producción actualizada» sin evidencia. No declarar instalado un complemento por haber escrito instrucciones.

Otras reglas vigentes: no incorporar el complemento de Vercel; no rodear la política de red (npm está bloqueado en el espacio de Claude: lo que necesita dependencias reales se corre en el sandbox de Vercel); no preguntar de nuevo qué entorno usar (se reutiliza el método del sandbox).

## 5. Reglas de negocio (dónde están y las claves)

Fuente: `.claude/referencias/reglas-comunes.md`. Las que más afectan al trabajo pendiente:

- **Captación (sección 3):** Captado = interés + aceptación del siguiente paso con evidencia guardada; evento único con identificador. Agendar no capta; compartir no deriva; derivar es manual. Datos parciales o fuera de AMBA no impiden captar (advertencias y grupo identificable; sin ubicación = «sin confirmar», nunca AMBA). Solo preguntar precio (Marketing) va a una persona y no capta. Después de captar se detiene la gestión comercial; si vuelve a escribir, atención humana prioritaria.
- **Horarios (sección 4), dos políticas:** salidas iniciadas por la empresa (campañas, seguimientos, reagendamientos, recuperaciones) lunes a sábado 8–21 hora Argentina, feriados incluidos, domingos no, revalidadas justo antes de llamar a Meta; **respuestas a entrantes las 24 h** cuando perfil y agente estén habilitados, sin pausa y sin chat tomado. Cada tarea lleva su **origen** y el servidor aplica la política según ese origen. Los mensajes de la empresa no reinician la ventana de 24 h de WhatsApp.
- **Circuito (sección 5):** máximo tres ciclos; frío sin respuesta no recibe segundo contacto; segundo entre 48–72 h (60 por defecto) en franja válida; sin respuesta al 2 se detiene; tercero solo tras respuesta y nuevo estancamiento; luego base de repesca manual. Cita incumplida: un solo reagendamiento una hora después del mensaje de inicio realmente enviado.
- **Detención y atención humana (sección 6):** rechazo, enojo, número equivocado, caso resuelto, abogado existente → disculpa breve, detención con motivo, archivo secundario (no es trabajo pendiente). Atención humana principal: pide persona, decisión del profesional, precio fuera de alcance, consulta fuera de alcance, datos sensibles, mensaje posterior de un captado. Pedir ayuda pausa ese chat de forma atómica; tomar/devolver conserva historial.
- **Después de derivar (sección 7):** resultado posterior es otra dimensión (contacto previsto, pendiente, contactado por el profesional, avanzó, operación concretada, no avanzó, necesita nueva gestión) con fecha, fuente y nota; nada se infiere del silencio; no inicia secuencias automáticas.
- **Captación por rubro:** Jurídico frío (Fase 1 agenda, Fase 2 obtiene relato y capta al aceptar análisis y contacto profesional; excepción si acepta solo al profesional), Jurídico actual (ruta rápida), Coberturas (interés + aceptación del asesor; sin planes/precios), Autos (interés + aceptación del vendedor; sin stock/cuotas), Marketing (necesidad + siguiente paso aceptado; sin precios/plazos).

## 6. Historia de etapas y entregas

| Etapa / bloque | Estado real al 13/10 |
| --- | --- |
| **Etapa 1 · Plataforma** (acceso con PIN, modelo de oportunidades, perfiles y líneas, importación, ficha, vistas, teléfono, envíos seguros, adjuntos, avisos web) | **Publicada** en `fb5cdc3`. La migración `0199_etapa1_cierre_rls.sql` **no está aplicada** en la base real (23 políticas públicas y 308 permisos a la clave pública siguen ahí). |
| **1.11 Dependencias** | Abierto. `next 14.2.35` con aviso crítico; `xlsx 0.18.5` sin arreglo en npm (SheetJS 0.20.3 por su CDN). Pendiente de probar Next 15.5.x / SheetJS en sandbox. No cerrado. |
| **1.12 Seguridad por operación** (autorizado el 13/10) | **Implementado y probado localmente**: `validateSession` con estados `valida/ausente/invalida/revocada/no_comprobable`; `requireSession` en 62 rutas (68 handlers) con 401 o 503 recuperable (`Retry-After: 5`, cookie intacta); `requirePageSession` en layouts y páginas privadas; middleware fail-closed; `textoBusquedaSeguro` para filtros PostgREST; cabeceras de seguridad en `next.config.mjs`; migración `0202` (revoca EXECUTE público a 45 funciones, `search_path` fijo) probada sobre copia de la base real. |
| **Etapa 2 · 2.0 y 2.3** | Implementados, probados (73 unitarias, 61 integración) y **verificados con dependencias reales** en sandbox el 12/10 (typecheck, lint, build, pruebas). Entregados como `etapa2-verificada` (ZIP `efc85f95…`). Migraciones `0200` y `0201` **no aplicadas**. Seguimiento apagado en los 4 perfiles. |
| **Etapa 2 · 2.1, 2.2, 2.4–2.9** | **Especificados, no implementados** (ver sección 8). |
| **Herramientas** (`herramientas-1`, ZIP `34db36e8…`) | Skills `kocos-*` reescritas, `CLAUDE.md`, referencias, `PROCEDENCIA.md`, pruebas de skills. Entregado el 13/10; queda reemplazado por el ZIP único. |
| **Parche 2.0 (Word del 13/10, v2.0)** | Leído por bloques y registrado. Lo que no es entrenamiento **se integra en esta etapa** (decisión del 13/10). |
| **Etapa 3 · Agentes / entrenamiento** | **Pausada.** Fine tuning (Google Cloud supervised tuning, candidato gemini-3.5-flash, corpus 600/100/160, compuerta 60 % preferencia ciega, un solo modelo principal ajustado) no empieza. |

**Entregas anteriores reemplazadas** por el ZIP único futuro: entrega original del 12/10, «corregida» (`a4b44b1c…`), `etapa2-verificada`, `herramientas-1`.

## 7. Estado operativo comprobado en la base real (13/10)

- Pausa general activa desde el 9/10. Una campaña en estado `pausada`. Último mensaje real el 5/10. `system_settings` con clave/valor. Enum de campañas usa `pausada`.
- Sin tablas de 0200/0201; 0199 y 0202 sin aplicar.
- Orden previsto de SQL: `0199` → `select etapa1_reconciliar_posteriores();` → `0200` → `0201` → `0202` (+ `0203` y siguientes de esta etapa). Vita decidió que la seguridad (0202, verificación final) va **al final**, no como punto de control previo.

## 8. Qué falta de la Etapa 2 (bloques del documento único)

| Bloque | Qué se construye | Cómo se verifica |
| --- | --- | --- |
| 2.1 Captación, atención humana y avisos | Criterio de captación por rubro como configuración; evento único con evidencia; ficha y aviso; cancelación de contactos pendientes del mismo cierre; atención humana distinta de captación; compartir no marca Derivado | Sin destinatario: Captado y aviso pendiente (C10); cierre repetido = un evento y un aviso; solo precio = atención humana sin Captado; mensaje posterior se guarda sin respuesta comercial (C12) |
| 2.2 Jurídico | Fase 1 y Fase 2 por IA en un tipo de cita que no consume turnos humanos; empieza ~2 min después si la persona puede; un solo reagendamiento una hora después del envío efectivo; ruta rápida para consultas actuales | Agendar no capta (C03); aceptar la revisión capta; sin Fase 2 pero con aceptación del profesional capta (C04); exactamente un reagendamiento; abogado existente detiene (C05) |
| 2.4 Coberturas y Autos | Datos deseables no bloquean; ubicación en tres valores (AMBA / fuera / sin confirmar); fuera de zona sigue captado en grupo aparte | Escenarios con y sin aceptación (C06) |
| 2.5 Ficha | Columnas históricas conservadas sin ser requisito; lo médico no decide elegibilidad | El texto por defecto no incluye origen, notas, adjuntos ni conversación |
| 2.6 Adjuntos | Ya se registran y guardan (Etapa 1); falta transcripción y pedido de texto si no se entiende | Audio, foto y documento registrados y ligados a la oportunidad |
| 2.7 Marketing | Investigación previa y propuesta con evidencia (parte existe: `analyzeLead`); consulta de precio a atención humana | Preguntar solo precio no capta (C07) |
| 2.8 Fuente | Mapa mensaje → fuente (landing, Facebook, Instagram, anuncio); sin referencia = no informada | Mensaje sin referencia queda «no informada» |
| 2.9 Avisos internos | Evento único con identificador, plantilla de aviso interno, avisos web, pendiente visible sin destinatario | Un reintento no duplica; registro por destinatario |

Parche 2.0 (además): origen de cada tarea y entrantes 24 h; resultado posterior a la derivación; clasificación de atención humana (sección 12.2) y archivo secundario; rediseño del panel (sección 7: listas que ayudan a decidir, ficha centrada en el siguiente paso, compartir y derivar; estadísticas clickeables); bases y campañas (sección 8: panorama, búsqueda, importación simple, creación guiada); agenda sin cupos de IA (sección 10); biblioteca de agentes (sección 13, solo configuración); SEO y contenido (política de autopublicación con retención de afirmaciones sensibles, cola duradera, Search Console por API con OAuth, no por exportaciones manuales); casos A01–A35.

## 9. Lo que ya existe en el código y conviene reutilizar

- **Oportunidades** (`src/lib/opportunities.ts`, tabla `opportunities`): dimensiones `contact_state`, `capture_state` (nuevo/en_conversacion/en_seguimiento/captado/perdido), `followup_state`, `attention_state` (ia/requiere_humano/humano_en_curso), `derivation_state`; eventos en `opportunity_events`; `setOpportunityState` deja evento solo si cambió. API manual: `src/app/api/oportunidades/[id]/route.ts` (derivar, no_derivar, captar, perder, atencion, seguimiento, revisado).
- **Entrantes** (`src/lib/inbound.ts`): deduplica por id de Meta, guarda siempre el mensaje, registra adjuntos, marca `respondio` en campañas, contacto detenido → `requiere_humano` sin respuesta; responde con IA solo si `conversation.ai_enabled`, mensaje legible y sin pausa (`getAutomationPause().aiRepliesPaused`). **No tiene todavía** la política de origen ni la de 24 h.
- **Agente** (`src/lib/ai-agent/agent.ts`): `runAgentTurn` (Gemini, hasta 6 iteraciones de herramientas), herramientas `guardar_datos_calificacion`, `evaluar_calificacion`, `consultar_disponibilidad`, `agendar_cita`, `escalar_a_humano`, `finalizar_consulta` (Civil), y de Marketing `registrar_resultado_marketing`, `analizar_negocio`. `pauseWithFinalAck` + `grant_ai_final_ack` para el acuse final tras derivar. El modelo **no es inyectable** en pruebas (el shim `tests/sin-npm/google-genai.ts` lanza error): para probar el flujo hay que separar la decisión del llamado al modelo.
- **Salidas** (`src/lib/messaging.ts`): `sendOutboundMessage` revalida en la base con `claim_ai_send` (pausa y chat tomado) y `claim_manual_send`; detención con `assertAutomaticContactAllowed`.
- **Seguimiento** (`src/lib/seguimiento/`): `circuito.ts` puro (`decideCircuit`), `motor.ts` (`planFollowups`, `runDueFollowups`, reserva `followup_claim`, compuerta `followup_gate`, `followup_finish/release/recover_stale/candidates`), tabla `followup_tasks` (kind conversacion/formulario, step 2|3, estados programada/enviando/enviada/cancelada/conflicto/pendiente/a_revisar/fallida). Mensajes salientes llevan `metadata.automatico`.
- **Horario** (`src/lib/contacto/reglas.ts`): `isContactAllowed`, `nextAllowedInstant`, `chooseFollowupSlot`, `decideAtExecution`, `channelWindow`; calendario con excepciones (`0200`).
- **Detención** (`src/lib/detention.ts`, tabla `contact_detentions`): motivos `necesidad_resuelta, compra_otro_canal, desinteres, no_contacto, enojo, numero_equivocado, abogado_existente, motivo_no_confirmado`; bloqueo duro para no_contacto y menor; `createDetention` admite `source: 'agente'`.
- **Avisos web** (`push_subscriptions`, `push_deliveries` con `event_key` único por dispositivo: deja lista la deduplicación de 2.9). Avisos por WhatsApp al equipo en `src/lib/notify.ts`.
- **Agenda** (`src/lib/agenda.ts`): `availability_rules`, `availability_blocks`, `appointments` (sin tipo IA/profesional todavía).
- **Pausa general** (`system_settings.automation_pause`, `src/lib/automation-pause.ts`): ante duda, pausado.

## 10. Bloque 1 — lo que quedó hecho (13/10, antes de frenar)

Dos archivos de **reglas puras, sin pruebas y sin uso todavía**:

- `src/lib/contacto/origen.ts`: tipos `OrigenTarea` (`respuesta_entrante, inicio_campana, seguimiento, reagendamiento, inicio_cita, recuperacion, atencion_humana`), `politicaPorOrigen`, `decidirRespuestaEntrante(condiciones, now, calendar)` (orden: pausa → chat tomado → detenido → captado → legible → agente activo → ventana → horario si no hay 24 h), `decidirSalidaEmpresa`, textos de motivo.
- `src/lib/captacion/reglas.ts`: `CRITERIO_POR_RUBRO` (aceptación, deseables, zona, límites), `evaluarCaptacion` (advertencias por dato faltante, zona en tres valores, solo precio no capta), resultado posterior (`RESULTADOS_POSTERIORES`, `MOTIVOS_NO_AVANCE`, `validarResultadoPosterior`), clasificación 12.2 (`MOTIVOS_ATENCION`, `TRATAMIENTO_ATENCION` con categoría, principal, pausar chat, detención, menor, respuesta esperada; `clasificarAtencion`; `MOTIVOS_AGENTE`).

**Diseño previsto del resto del bloque 1 (no implementado):**
- Migración `0203_etapa2_reglas_base.sql`: `messages.origin`; `followup_tasks.origin` y `kind` ampliado (`cita_inicio`, `cita_reagendamiento`, paso 1); `rubros.inbound_24h_enabled boolean default false`; en `opportunities`: `post_derivation_state/at/source/reason/note/contact_expected_at`, `capture_warnings jsonb`, `location_zone` (amba/fuera/sin_confirmar), `attention_category`, `attention_reason`, `legal_route` (fases/directa); tablas `capture_events` (evento único) y `capture_notices` (pendiente/enviado/error por destinatario, único por evento y destinatario); `appointments.kind` (ia/profesional) y `start_message_id`.
- `src/lib/captacion/index.ts`: `registrarCaptacion`, `registrarResultadoPosterior`, `solicitarAtencion`, `detenerConDisculpa`.
- Agente: herramientas `captar`, `detener_contacto` (motivo), `escalar_a_humano` con categoría 12.2, `registrar_ubicacion`, `programar_fase2`; modelo inyectable (`modelo.generar`) para pruebas; entrada con `decidirRespuestaEntrante`; captado que vuelve a escribir → `requiere_humano` con motivo `mensaje_posterior_captado`.
- Motor: `origin` en tareas y mensajes; tareas de inicio de cita y reagendamiento (una sola, una hora después del envío efectivo, con horario y ventana).
- API: acciones `resultado_posterior` y `atencion` con motivo; alternar `inbound_24h_enabled` por perfil con PIN.
- Pruebas: A08 (noche/domingo responde solo con 24 h habilitado y nunca con pausa o chat tomado), A09 (ya probada), A13, A14, A15, A17, A20, C10, C12.

## 11. Plan completo pendiente (en orden)

1. **Bloque 1 · Reglas de base + captación** (sección 10).
2. **Bloque 2 · Panel:** navegación más simple y sistema visual unificado; estadísticas clickeables que abren la lista con la **misma consulta** que el contador; ficha común (2.5) con resultado posterior y atención humana; flujos más simples; accesibilidad (teclado, foco, contraste); vista de teléfono. Sin capturas (Vita no las necesita).
3. **Bloque 3 · Operación diaria:** búsqueda en bandeja y prospectos; panorama de bases y campañas; creación guiada de campañas (valida perfil, línea, base y horario; queda pausada); agenda sin cupos de IA; fuente (2.8), adjuntos (2.6), marketing (2.7).
4. **Bloque 4 · Biblioteca de agentes:** principal y cuatro derivados, solo configuración y vista, apagados. Sin simulador, evaluación ni fine tuning.
5. **Bloque 5 · SEO y contenido:** política de autopublicación por perfil y canal con retención con motivo; cola de publicación con estados, deduplicación y reintento seguro probada con destinos simulados; Search Console por API con OAuth preparado, **sin conectar**.
6. **Cierre:** verificación con dependencias reales en sandbox; seguridad (0202 y 0199 en orden); ZIP único + parche + huellas; carpeta SQL en orden con reversión; guía de 5 pasos; informe; `CONTEXTO_ACTUAL_CRM.md` final. Vita quiere que Claude **pare y avise antes del cierre** para bajar el modelo.

Modelos acordados por Vita: Fable 5 esfuerzo alto para bloques 1 y 2; Opus 5.5 (extra o medio según consumo) para 3–5 y cierre. Cada bloque: dos líneas de avance al terminar, sin esperar respuesta.

## 12. Cómo se prueba (sin tocar producción)

- **Local sin npm** (espacio de Claude): `npx --yes tsx@4.23.12 --tsconfig tests/tsconfig.json --test tests/unitarias/*.test.ts`; integración con PostgreSQL local (puerto 55432) + PostgREST 12.2.3 (54331) sobre `crm_pruebas` (`tests/integracion/preparar_base.sh` aplica todas las migraciones), shims en `tests/sin-npm/` (`next/server`, `@supabase/supabase-js`, `@google/genai`), `tests/integracion/soporte/entorno.ts` (`RedSimulada` para Meta y Storage, `crearContacto`, `crearConversacion`, `fijarPausa`, `prepararSesionDePrueba`, `pedido`, `COOKIE_SESION`, `fallasSesion`). Variables: `PRUEBAS_REST_URL`, `PRUEBAS_JWT_SECRET`, `PRUEBAS_PSQL`.
- **Con dependencias reales:** sandbox de Vercel (`create_sandboxes_v3`, origen git público `main`, 2 vCPU/4 GB, 45 min máximo por sesión; con `persistent: true` guarda instantánea al parar y se reanuda con `get_named_sandbox resume`). Setup: `npm ci`, `apt postgresql`, PostgREST `postgrest-v12.2.3-linux-static-x64.tar.xz`. Subida del código: tar.xz partido en trozos de 15 KB codificados en base64 (`write_session_files`), hash por parte; es lento (~9 min por parte). Último sandbox: `verificacion-consolidada-1310c` (snapshot con partes 00–02 y dependencias instaladas; faltaban 03–07 del `build2.tar.xz`, hash `6428a859…`).
- Resultados locales vigentes: unitarias 73/73, integración 61/61, typecheck de `src` y `tests` OK.

## 13. Documentos y herramientas de la sesión anterior

- Claude Docs: plan (`b5fb8ad6-926b-4bd2-8675-298c2730d216`) y análisis general (`ab17bffa-8e18-4342-b6af-b5d5f8ff804b`, con la auditoría de 14 hallazgos y el bloque 1.12). Están desactualizados respecto al parche 2.0.
- Documentos fuente de Vita: documento único (análisis general rev. 69), ESTRUCTURA GENERAL CRM 1.2, RUBROS Y FASES 1.1, ENTRENAMIENTO GENERAL DE AGENTES IA 0.6, PARCHE_ACTUALIZACION_CRM_20261012 v2.0 (13/10). Ante contradicción, el parche 2.0 prevalece en: atención entrante 24/7, SEO y contenido automáticos, interfaz y entrenamiento; el resto conserva las reglas anteriores. Si hay contradicción no resuelta, señalar las dos cláusulas antes de cambiar conducta.
- Complementos en la cuenta de Cowork (habilitados el 13/10, cargan en sesiones nuevas): `kocos-cowork` (7 skills: contexto, reglas de captación, diseño y accesibilidad, pruebas de aceptación, landings SEO, contenido premium, agentes), `kocos-especialistas` (11: frontend-design, interface-design, ui-ux-pro-max, web-design-guidelines, vercel-react-best-practices, supabase-postgres-best-practices, seo-audit, ai-seo, schema, site-architecture, cro), Design, `searchfit-seo`, `engineering`. Usar solo la pertinente a cada tarea. Si contradicen el proyecto, prevalece el proyecto.

## 14. Preguntas que siguen abiertas para Vita (no bloquean el código)

- Inventario de landings existentes (para SEO) y acceso a Search Console cuando se habilite.
- Lista de localidades que cuentan como AMBA (bloque 2.4): mientras tanto la zona es un valor explícito en tres estados, sin inferencia.
- Destinatarios de avisos por perfil (2.9): sin destinatario, el aviso queda pendiente y visible.
- Textos identificadores de mensajes prearmados para la fuente (2.8).
