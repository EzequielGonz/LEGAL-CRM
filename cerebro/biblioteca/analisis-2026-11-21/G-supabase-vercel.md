# G · Configuración de Supabase y Vercel (solo lectura)

Fecha de la lectura: 21/11/2026. Solo se consultó: no se cambió nada (sin INSERT/UPDATE/DELETE, migraciones, variables, despliegues ni dominios). De las variables de entorno se listan únicamente los nombres. Volúmenes y estado operativo del día quedan fuera (los cubre otro informe).

## 1. Supabase

### 1.1 Proyecto
| Dato | Valor |
|---|---|
| Nombre / ref | legal-crm / `enhgkeqiqcuwafsedaza` |
| Región | sa-east-1 (São Paulo) |
| Estado | ACTIVE_HEALTHY |
| Postgres | 17.6 (canal ga) |
| Creado | 07/09/2026 |
| Organización | `vercel_icfg_...` (creada desde la integración de Vercel, no es una organización propia de Supabase) |
| Tamaño de la base | 136 MB (public 68 MB, cron 40 MB, respaldos 10 MB, auth 1,5 MB) |
| `max_connections` | 60 |
| Edge Functions | ninguna (toda la lógica corre en Vercel) |
| Realtime | la publicación `supabase_realtime` tiene 0 tablas |

### 1.2 Esquemas
- `public`: 101 tablas, 0 vistas, 0 vistas materializadas. Todas con RLS activada, ninguna con RLS forzada.
- `respaldo_20261015` (44 tablas) y `respaldo_etapa1` (25 tablas): copias de respaldo tomadas en las operaciones del 15/10 y de la etapa 1. Sin clave primaria, con RLS sin políticas.
- `cron`, `net`, `vault`, `storage`, `auth`, `realtime`, `supabase_migrations`: del sistema.

### 1.3 Tablas de `public` por familia (todas con RLS)
Cantidad de filas según el listado del MCP (es estructura; las cifras de hoy no se repiten acá).
- **Núcleo CRM**: `contacts` (21 columnas), `contact_identities`, `conversations`, `messages` (22 col., 11 índices), `message_status_events`, `message_attachments`, `opportunities` (59 columnas, 18 índices, la más ancha y la más grande), `opportunity_events` (solo agregar), `contact_detentions`, `incidences`, `followup_tasks`, `cita_tareas`, `appointments`, `availability_rules`, `availability_blocks`, `contact_calendar_exceptions`, `studios`.
- **Campañas y bases**: `campaigns`, `campaign_contacts`, `imported_bases`, `imported_base_rows`, `scraped_places`, `etapa1_reconciliacion`, `limpieza_movimientos`.
- **Canales y líneas**: `channels`, `profile_lines`, `rubros` (4), `whatsapp_templates`, `whatsapp_template_syncs`, `template_assignments`, `template_evaluations`, `wasender_lineas`, `wasender_plantillas`, `wasender_eventos`, `wasender_segundos_intentos`, `webhook_quarantine`.
- **Agentes e IA**: `ai_agents`, `ai_agent_prompt_history` (solo lectura), `agent_library`, `agent_library_versions` (solo agregar), `agent_roles`, `agent_modules`, `agent_assignments`, `agent_requests`, `agent_turn_logs`, `agent_incidents`, `agent_experiments` y sus candidatos/asignaciones/votos/informes, `bot_knowledge_versions`, `bot_knowledge_items`, `bot_knowledge_assignment`, `bot_informes_mejora`, familia `bot_lab_*` (versiones, proveedores, roles generales, aplicaciones, pruebas A/B, asignaciones, simulaciones), `simulation_runs`, `simulation_turns`, `eval_cases`, `eval_results`, `training_sets`, `training_cases`, `tuning_jobs`, `model_comparisons`.
- **Asistente y bandeja**: `asistente_acciones`, `asistente_charlas`, `asistente_charla_mensajes`, `bandeja_claude`, `personalizacion_perfil`.
- **Marketing y contenido**: `marketing_leads`, `marketing_events`, `marketing_scrape_jobs`, `marketing_extracciones`, `marketing_budgets`, `brand_briefs`, `content_policies`, `content_pieces`, `content_requests`, `content_results`, `content_publish_attempts`, `landing_submissions`, `landing_audits`, `search_console_connections`, `capture_events`, `capture_notices`.
- **Administración y seguridad**: `admin_profiles`, `admin_notifications`, `notification_phones`, `push_subscriptions`, `push_deliveries`, `access_pin`, `access_origin_limits`, `access_events` (solo agregar), `system_settings`, `ops_change_log` (solo agregar).

Tablas más grandes (disco, total con índices): `opportunities` 8,7 MB, `contacts` 8,0 MB, `message_status_events` 7,9 MB, `imported_base_rows` 7,2 MB, `messages` 7,2 MB, `opportunity_events` 5,4 MB, `campaign_contacts` 4,1 MB, `marketing_leads` 3,6 MB.

### 1.4 Migraciones (77 aplicadas)
Orden por versión (fecha). Rangos:
- 08/09 al 11/10 (19 migraciones, **sin numerar**): pacing de campañas, pg_cron y pg_net, rubros multirubro, agentes y canales de Agencia 0 km y Marketing, scraping de Google Maps, prioridad de contactos, `etapa1_*` (estados de envío, envíos seguros, adjuntos originales).
- 16/10 (9): `0310` comparación de agentes, `0311` extracción y presupuestos de marketing, `0312` índices de claves foráneas, `14_datos_de_marca_y_fuentes`, operación 1610 (levantar pausas), tres ajustes de prompt/latido.
- 17/10 al 25/10: `0400` logo del panel, `0500` a `0511` (asistente y redes, bandeja Claude, roles por base, presupuestos programados, adjuntos salientes, chats del asistente, rol por campaña, ficha de negocio, conocimiento por versiones, conocimiento v2).
- 10/11 al 15/11: `0600` a `0633` (Wasender, ritmo humano, seguimiento, embudo, informes de mejora del bot, accesos/PIN, laboratorio del bot, asistente general).
- 20/11: `0634` asistente_charlas (la última).

Hallazgos del orden:
- **No hay migraciones numeradas `01xx` ni `02xx`** en la base, aunque CLAUDE.md pide esa numeración. Las primeras 19 no tienen número y la primera numerada es `0310`.
- **Saltos de numeración**: no existen `0313 a 0399`, `0401 a 0499`, `0512 a 0599`, `0627`, `0628` ni `0629`. Puede ser planificado (números reservados) o migraciones que nunca se aplicaron; conviene cruzar con `supabase/migrations/` del repo.
- **Fuera de orden**: `0619_rendimiento_panel_1511` (versión 20261115060252) quedó aplicada **después** de `0620` y `0621`.
- **Nombres repetidos con partes**: `0502` (3 partes: bandeja_claude, _tocar, _disparadores) y `0511` (4 partes). No son duplicados reales, son tramos de la misma etapa.
- `14_datos_de_marca_y_fuentes` rompe el patrón de 4 dígitos.

### 1.5 Extensiones instaladas
`pg_cron` 1.6.4 (esquema pg_catalog), `pg_net` 0.20.4 (esquema **public**), `pgcrypto` 1.3, `uuid-ossp` 1.1, `pg_stat_statements` 1.11, `supabase_vault` 0.3.1, `plpgsql`. El resto del catálogo (postgis, vector, pg_trgm, pgmq, etc.) está disponible pero **no instalado**. Nota: `pg_trgm` no está instalado, así que cualquier búsqueda por similitud va por otros caminos.

### 1.6 Cron (pg_cron)
Un solo trabajo:
| id | nombre | frecuencia | activo | qué hace |
|---|---|---|---|---|
| 1 | `campaigns-tick` | cada minuto | sí | `net.http_post` a `https://legal-crm-nine.vercel.app/api/campaigns/tick` con cabecera `Authorization: Bearer <secreto>` y timeout de 55 s |

Historial en `cron.job_run_details`: 95.754 ejecuciones desde el 08/09/2026, 0 fallidas. Ese historial ocupa la mayor parte de los 40 MB del esquema `cron` y no tiene limpieza programada. La función `set_campaign_tick_active(boolean)` (security definer) enciende y apaga el trabajo.

### 1.7 Storage (buckets)
| Bucket | Público | Límite por archivo | Tipos | Objetos |
|---|---|---|---|---|
| `bases-originales` | no | sin límite | cualquiera | 28 |
| `adjuntos-originales` | no | 50 MB | cualquiera | 23 |
| `presupuestos` | no | sin límite | cualquiera | 8 |
| `chat-salientes` | no | 16 MB | cualquiera | 6 |
| `marca` | **sí** | 2 MB | png, jpeg, webp, svg | 4 |

### 1.8 Funciones RPC y disparadores
- 66 funciones en `public`. Todas con `EXECUTE` **solo para `service_role`**; `anon` y `authenticated` no pueden ejecutar ninguna. Ninguna es invocable desde la clave pública.
- Security definer (5): `attachment_claim`, `attachment_finish`, `is_admin`, `set_campaign_tick_active`, `template_name_usage`.
- Todas fijan `search_path` (vacío `""`, `public` o `public, pg_temp`).
- Familias: acceso/PIN (`access_try_attempt`, `access_attempt_ok`, `access_register_failure`), campañas (`campaign_claim_next`, `campaign_claim_recipient`, `campaign_mark_sending`, `campaign_finish_send`, `campaign_recover_stale`, `campaign_tick_lock/unlock`, `campaign_review_action`, `campaign_metrics`), seguimiento (`followup_candidates/claim/gate/finish/release/recover_stale`), envíos (`claim_ai_send`, `claim_manual_send`, `grant_ai_final_ack`, `grant_crisis_ack`), métricas (`profile_metrics`, `embudo_etapa`, `embudo_por_dia`, `base_quality`, `cifras_prospectos_por_base`, `conocimiento_estadisticas/fichas`), laboratorio del bot (`laboratorio_*`, 7 funciones atómicas) y utilidades (`normalize_phone_ar`, `contacts_last_outbound`, `detained_phones`, etc.).
- Disparadores (no internos, en `public`): ~55. Dos grupos:
  - **Protección de "nada se borra"**: `prevent_hard_delete` (BEFORE DELETE) en unas 40 tablas y `prevent_row_changes` (solo agregar / solo lectura) en `access_events`, `opportunity_events`, `ops_change_log`, `agent_library_versions`, `ai_agent_prompt_history`, `etapa1_reconciliacion`, `content_publish_attempts`, `message_attachments`, `push_*`, `template_assignments`, `whatsapp_templates`, `whatsapp_template_syncs`. Esto implementa por base la regla de archivar en vez de borrar.
  - **Lógica**: `contacts_opportunity_on_insert`, `messages_opportunity_on_insert`, `messages_ultima_actividad`, `imported_base_rows_base_text`, `template_assignments_check`, `contact_detentions_guard`, `set_updated_at` en contactos, `*_tocar` en bandeja y Wasender.

### 1.9 Políticas RLS y roles
- Políticas en `public`: **ninguna** (0). El asesor de seguridad lo marca como informativo en 126 tablas (101 de `public` y 25 de `respaldo_etapa1`). Con RLS activada y sin políticas, `anon` y `authenticated` no ven nada; el acceso real es solo por `service_role` desde el servidor de Vercel. Es coherente con el diseño ("acceso a datos en el servidor con la clave de servicio").
- Permisos de tabla: `anon` y `authenticated` **no tienen ningún GRANT** sobre `public`, `respaldo_etapa1` ni `respaldo_20261015`. Segunda barrera además de RLS.
- Únicas políticas en la base: las propias de `cron` (job y job_run_details, filtran por usuario actual).
- Roles personalizados: no hay. Roles de plataforma estándar: `anon`, `authenticated`, `service_role` (bypassrls), `authenticator`, `postgres` (bypassrls), `supabase_admin` (superusuario), `supabase_read_only_user` (bypassrls, con login), `supabase_etl_admin` (bypassrls, con login), etc.

### 1.10 Asesores de Supabase
Seguridad: 126 avisos informativos de "RLS sin políticas" (esperado, ver 1.9); 1 aviso WARN de extensión `pg_net` en el esquema `public`; 1 WARN de **protección contra contraseñas filtradas desactivada** en Auth. Sin errores.
Rendimiento (todos INFO): 10 claves foráneas sin índice (`bot_knowledge_assignment` x2, `campaigns.wasender_plantilla_id`, `limpieza_movimientos` x3, `wasender_segundos_intentos` x4); 88 índices nunca usados (casi todos de claves foráneas de tablas vacías o nuevas, no son un problema a esta escala); 69 tablas sin clave primaria (todas en los esquemas de respaldo).

## 2. Vercel

### 2.1 Equipo y proyectos
- Equipo: `ezequielgonz's projects` (slug `ezequielgonzs-projects`, `team_DGPKq7VRI79P0koUBcsxu1IH`).
- Proyectos del equipo: **uno solo**, `legal-crm` (`prj_liUp46HbkMc0lPlhX1hX5CVLwsYt`).
- **Las landings no están en otra cuenta ni en otro proyecto de este equipo**: no hay un segundo proyecto. Las landings salen del mismo proyecto Next.js (rutas dentro del CRM). Si existieran en otra cuenta o plataforma, no se ven desde este equipo; en esta lectura no hay evidencia de ello.

### 2.2 Proyecto `legal-crm`
| Dato | Valor |
|---|---|
| Framework | Next.js |
| Node | 24.x |
| Repositorio | GitHub `EzequielGonz/LEGAL-CRM` (rama de producción `main`) |
| Creado | 04/09/2026 |
| Protección SSO | activa, `all_except_custom_domains` |
| Protección con contraseña | no |
| IPs de confianza | no |
| Plan del equipo | **no lo expone el MCP**. Indicios de plan Hobby: un solo proyecto, un solo dominio `*.vercel.app`, equipo personal, tienda Blob en el mínimo. Confirmar en Billing. |

### 2.3 Dominios
Solo uno vinculado al proyecto: `legal-crm-nine.vercel.app` (verificado). Además figuran como alias automáticos `legal-crm-ezequielgonzs-projects.vercel.app` y `legal-crm-git-main-ezequielgonzs-projects.vercel.app`. **No hay dominio propio.** Ese dominio es el que usan el `pg_cron` de Supabase y, presumiblemente, los webhooks de Meta.

### 2.4 Variables de entorno (SOLO nombres; 40 filas)
Tipos: *sensitive* = valor oculto, *plain* = visible, *encrypted* (config) = públicas de Next.

**Producción y Preview**
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (públicas), `SUPABASE_SERVICE_ROLE_KEY` (sensitive).
- App y acceso: `NEXT_PUBLIC_APP_URL`, `ACCESS_PIN`, `ADMIN_WHATSAPP_PHONE`.
- Meta (app): `META_APP_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN`, `WHATSAPP_VERIFY_TOKEN`.
- WhatsApp por rubro (Jurídico): `WHATSAPP_CIVIL_PHONE_NUMBER_ID`, `WHATSAPP_CIVIL_ACCESS_TOKEN`, `WHATSAPP_CIVIL_WABA_ID`, `WHATSAPP_PENAL_PHONE_NUMBER_ID`, `WHATSAPP_PENAL_ACCESS_TOKEN`, `WHATSAPP_PENAL_WABA_ID`.
- Redes Jurídico: `FACEBOOK_CIVIL_PAGE_ID`, `FACEBOOK_CIVIL_PAGE_ACCESS_TOKEN`, `INSTAGRAM_CIVIL_BUSINESS_ID`, `FACEBOOK_PENAL_PAGE_ID`, `FACEBOOK_PENAL_PAGE_ACCESS_TOKEN`, `INSTAGRAM_PENAL_BUSINESS_ID`.
- Landings: `LANDING_WHATSAPP_TEMPLATE`.
- Wasender: `WASENDER_CLAVE_CIFRADO`.

**Solo Producción**
- WhatsApp Coberturas médicas: `WHATSAPP_COBERTURAS_MEDICAS_PHONE_NUMBER_ID`, `_WABA_ID`, `_ACCESS_TOKEN`.
- WhatsApp Agencia 0 km: `WHATSAPP_AGENCIA_0KM_PHONE_NUMBER_ID`, `_WABA_ID`, `_ACCESS_TOKEN`.
- WhatsApp Marketing: `WHATSAPP_MARKETING_PHONE_NUMBER_ID`, `_WABA_ID`, `_ACCESS_TOKEN`.
- `META_APP_SECRETS` (plural; convive con `META_APP_SECRET`).
- IA: `GEMINI_API_KEY`, `GEMINI_MODEL`.
- Scraping: `OUTSCRAPER_API_KEY`.
- Avisos: `ADMIN_WHATSAPP_PHONES`.
- Cron: `CRON_SECRET`.
- Wasender: `WASENDER_PAT`, `WASENDER_HABILITADO` (plain; es el interruptor general de envíos por Wasender, por comentario "cada línea sigue apagada hasta prender «Envía mensajes»").

**Solo Preview de la rama `wasender-integracion`**: `WASENDER_PAT`, `WASENDER_HABILITADO` (plain).

**Los tres entornos (development, preview, production)**: `BLOB_STORE_ID`, `BLOB_WEBHOOK_PUBLIC_KEY` (clave pública, no secreta).

Observaciones: no hay `ANTHROPIC_*` ni `OPENAI_*`; la IA es Gemini. No existe en el proyecto `BLOB_READ_WRITE_TOKEN`: la tienda Blob está conectada pero el token de escritura no está como variable (las subidas se hacen desde otro lado). Ninguna variable tiene `securityIssues` marcados por Vercel.

### 2.5 Crons de Vercel
No se pudo leer `vercel.json` por el MCP. Evidencia de que el cron real es **pg_cron de Supabase** (cada minuto, llama a `/api/campaigns/tick`), no un cron de Vercel: en el plan Hobby Vercel solo permite crons diarios, así que esto es lo que habilita el ritmo de un minuto. Si hubiera crons en `vercel.json` del repo, hay que revisarlos allí.

### 2.6 Despliegues
Últimos 30 (todos del 20 y 21/11, salvo el que está en construcción):
- **Todos son Preview** (`target` nulo) salvo los de producción listados abajo. Ramas: `cerebro-chats` (13), `claude/happy-wozniak-ajfi1z` (12, publicaciones de redes), `claude/admiring-euler-ctf4sg` (4 contando uno del cerebro), todas con commits de documentación del "Cerebro" o de programación de redes.
- Estado: 25 READY, 4 CANCELED (reels, por pushes sucesivos), 1 BUILDING (`dpl_AD7V4d3S...`, rama `cerebro-chats`, commit "Cerebro: documentos del Project «crm» de Cowork e historiales completos").
- **Cada commit a cualquier rama genera un despliegue Preview**, aunque solo cambie documentación. Preview comparte base y líneas con producción.

Últimos despliegues de **producción** (rama `main`, todos READY):
| Fecha aprox. | Despliegue | Commit |
|---|---|---|
| 20/11 | `dpl_7bS3Q6tJ...` (vigente, rollback candidato) | Merge de `claude/admiring-euler-ctf4sg` |
| 20/11 | `dpl_GUbwQDG5...` | Contexto: charlas guardadas del asistente |
| 20/11 | `dpl_2VwV3rB6...` | Asistente: charlas guardadas y retomables (#78) |
| 18/11 | `dpl_CqfLadoe...` | Traspasos: estado del 18/11 |
| 16/11 | `dpl_ASJV8hzR...` | Botones que cambiaban de perfil y velocidad de Hoy y Campañas |
| 15/11 | `dpl_TcwX4DGS...`, `dpl_HmBnKgtj...`, `dpl_AYe5FJCr...` | Meta y Wasender separados / método de envío en campañas |

Producción lleva dos días sin cambios de código nuevo; los despliegues de las últimas horas son todos de documentación en ramas.

### 2.7 Errores de ejecución (últimos 7 días, agrupados)
9 grupos:
1. `TiempoAgotadoError: El modelo no respondió en 20 segundos` en `/api/webhooks/whatsapp`: 5 casos, 5 usuarios, del 17/11 al 20/11. Es el timeout interno de 20 s de Gemini. Mensaje de WhatsApp que no recibe respuesta automática.
2. `[métricas] No se pudieron calcular: canceling statement due to statement timeout` en `/api/perfiles/estado`: 4 casos entre el 24/10 y el 18/11. Una consulta de métricas de perfil supera el tiempo permitido por Postgres.
3. `fetch failed` al revalidar la caché de `campaign_metrics` (RPC) en `/campanas/[id]` y `/login`: 7 campañas distintas, 2 casos cada una, todos el 17/11 entre 08:23 y 11:36 UTC. Un corte puntual de red entre Vercel y Supabase.
No hay errores 5xx de las rutas de campañas ni de envío en la ventana.

### 2.8 Blob
Tienda `reels-redes` (`store_VSQc3OOWUqT7ZEBj`), región `gru1`, acceso **público**, 97 objetos, 323 MB (≈ 0,32 GB), facturación activa, sin cuota excedida, un solo proyecto conectado. Se usa para los reels de redes.

### 2.9 Uso y límites
El MCP no devolvió métricas de uso ni cuotas. Lo único medible: Blob 323 MB; build y funciones no se pueden medir desde aquí.

## 3. Alertas de seguridad y límites (al final, por prioridad)

**Alta**
1. **Secreto en texto plano dentro de la base.** El comando de `cron.job` (`campaigns-tick`) lleva el `Bearer` del cron escrito literal. Lo ve cualquiera con lectura sobre `cron.job` (postgres, service_role, o quien tenga acceso al editor SQL). Esta auditoría lo vio en el resultado de una consulta, así que el valor quedó en el registro de esta sesión (no se copió a este archivo). Recomendación: rotar `CRON_SECRET` y reemplazar el cron para que lea el secreto de Supabase Vault. La rotación requiere cambiar Vercel y el cron a la vez, por eso no se tocó.
2. **Bucket `marca` y tienda Blob `reels-redes` son públicos.** `marca` es esperable (logos, 2 MB, solo imágenes). Blob público con 97 reels: cualquiera con la URL los ve. Confirmar que no hay material sin publicar ni con datos de prospectos.
3. **Protección de Auth.** "Leaked password protection" desactivada. Si el panel entra solo por PIN (`ACCESS_PIN`) quizá no aplique, pero conviene activarla o confirmar que Supabase Auth no se usa para ingresar.
4. **Todo el acceso depende de una sola clave: `SUPABASE_SERVICE_ROLE_KEY`.** No hay políticas RLS (0), así que si esa clave se filtra se pierde todo; RLS no ayuda porque la clave la salta. Está bien guardada (sensitive), pero está en Preview además de Producción, y la Preview comparte base con producción.

**Media**
5. **Las ramas Preview usan la base de producción** (mismas variables de Supabase y de WhatsApp Civil/Penal). Cada push de documentación crea un despliegue con acceso de escritura real. Con `WASENDER_HABILITADO` en Preview solo de `wasender-integracion` se limita el riesgo de envíos, pero las líneas Meta de Civil y Penal sí están en Preview.
6. **Protección de despliegues:** SSO en modo `all_except_custom_domains` y sin dominio propio. Verificar que los webhooks de Meta y el cron llegan sin pasar por el bloqueo (hoy funcionan: 0 fallas en 95.754 ejecuciones), y que el dominio `legal-crm-nine.vercel.app` es público a propósito.
7. **Variable duplicada `META_APP_SECRET` y `META_APP_SECRETS`.** Confirmar cuál usa el código y retirar la que no, para no dejar un secreto huérfano.
8. **`pg_net` instalado en el esquema `public`** (aviso WARN). Moverlo a `extensions` requiere reinstalar la extensión y tocar el cron; no urgente.
9. **Wasender (WhatsApp por QR) convive con la API oficial.** Es un canal no oficial de Meta: riesgo de bloqueo de líneas y de incumplimiento de términos, distinto de lo que dice CLAUDE.md ("API oficial de Meta"). Contrastar con `cerebro/02-ordenes-vigentes.md`.
10. **Funciones con permisos amplios: no se encontraron.** Las 66 funciones de `public` solo ejecutan con `service_role`; las 5 security definer fijan `search_path`. `anon` y `authenticated` sin GRANT en ninguna tabla. Estado sano.

**Baja / higiene**
11. **Esquemas de respaldo** (`respaldo_20261015`, `respaldo_etapa1`, 10 MB): 69 tablas sin clave primaria, con datos de contactos y mensajes reales duplicados. Son "no se borra", pero hay que decidir un plazo y no ampliar su acceso.
12. **`cron.job_run_details` sin limpieza:** 95.754 filas, ~40 MB de 136 MB (29% de la base), crece ~1.440 filas por día. Sin tarea de purga.
13. **Realtime:** la migración "enable_realtime_contacts_and_messages" existe pero la publicación `supabase_realtime` tiene 0 tablas. O se revirtió o nunca quedó activa; si el panel espera actualizaciones en vivo, no las recibe por ese canal.
14. **Numeración de migraciones:** sin `01xx`/`02xx`, saltos (`0627-0629`, etc.) y `0619` aplicada después de `0620/0621`. Documentar en `docs/etapaN/MIGRACIONES.md` para que el orden de reaplicación sea reproducible.
15. **Rendimiento:** timeouts de `/api/perfiles/estado` (4) y de Gemini a 20 s (5 en 7 días); 10 claves foráneas sin índice.

**Límites del plan Hobby (a confirmar en Billing, porque el MCP no muestra el plan)**
- Uso **no comercial** únicamente: el CRM capta clientes de estudios y agencias, lo que según los términos de Vercel exige plan Pro.
- Funciones: duración máxima de 60 s en Hobby; el tick usa 55 s, al límite. Una demora de Supabase o de Meta corta la ejecución.
- Crons de Vercel: solo diarios; por eso el ritmo de 1 minuto va por pg_cron (correcto).
- Un solo miembro de equipo y 1 proyecto concurrente de build: la cola de builds de Preview (uno por commit, 4 cancelados) compite con producción.
- Blob: 0,32 GB usados; el cupo incluido en Hobby es 1 GB.
- Supabase: base de 136 MB y 60 conexiones máximo; si el plan es Free, hay pausa por inactividad de 7 días (hoy no aplica porque el cron la mantiene activa) y backups limitados. El plan de Supabase tampoco lo expone el MCP.
