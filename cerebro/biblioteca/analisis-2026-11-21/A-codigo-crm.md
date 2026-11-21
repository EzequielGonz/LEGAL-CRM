# A · Análisis del código del CRM multirubro

Solo lectura. Código leído: `origin/main` = commit `66c457b` (20/11/2026, "Merge … admiring-euler-ctf4sg"), en el worktree `/home/user/crm-main`. Nota: el cerebro (`06-tecnica`) habla de main `36f742b`; main ya avanzó (trae cerebro, redes y landings).
No se corrió nada (no hay `node_modules`, ni red). No se tocó la base ni Vercel: lo que dice la base se toma del cerebro y se marca como "sin verificar".

---

## 1. Arquitectura

**Stack real (`package.json`)**: Next `^15.5.29` (App Router), React `^19.3.1`, TypeScript `^5.7`, Tailwind `^3.4`, `@google/genai ^1.15` (Gemini), `@supabase/supabase-js ^2.47` y `@supabase/ssr ^0.5` (solo para el cliente del navegador), `papaparse`, `read-excel-file`, `write-excel-file`, `qrcode-generator`, `clsx`. Todas se usan, salvo `date-fns` (no se importa en `src`: dependencia muerta). No hay Vercel Blob, ni Resend, ni SDK de Meta: todo se llama con `fetch`. Web Push (VAPID) está hecho a mano con `node:crypto` (`src/lib/webpush.ts`).
**Despliegue**: `vercel.json` solo fija `regions: ["gru1"]`. **No hay `crons` en Vercel**: el latido lo hace `pg_cron` + `pg_net` de Supabase (job `campaigns-tick`, cada minuto, ver `docs/SETUP.md` §6.1 y `supabase/migrations/0100`/`0101`). Ese job vive solo en la base, no está versionado en el repo y su comando lleva el secreto.
**Tamaño**: 711 archivos en `src`, ~87.000 líneas. 99 páginas (`page.tsx`), 137 rutas `route.ts` + 3 `route.tsx` (imágenes: `marca/[archivo]`, `piezas/[id]/[archivo]`, `redes-pieza/[archivo]`).

**Carpetas**
- `src/app`: páginas y API. `(dashboard)` = panel de Jurídico en la raíz (`/inbox`, `/campanas`…). `panel/{agencia_0km,coberturas_medicas,marketing}` = lo mismo bajo prefijo. Pantallas comunes con `?perfil=` (`hoy`, `contactos`, `conversaciones`, `resultados`, `salud`, `redes`, `wasender`, `meta`, `asistente`, `bandeja`, `incidencias`). CSS global en varios archivos (`globals`, `panel`, `marca`, `vidrio`, `tema-premium`…).
- `src/components`: UI por dominio (`campanas`, `inbox`, `asistente`, `perfiles`, `wasender`, `plantillas`, `marketing`…).
- `src/lib`: ~264 archivos; reglas puras + servicios con acceso a datos. Módulos grandes: `agentes` (28), `wasender` (21), `asistente` (20), `marketing` (14), `redes` (14), `seguimiento` (10), `plantillas` (9), `laboratorio` (8).
- `supabase/migrations` (84 archivos), `tests/` (unitarias, integración, reproducción), `docs/` (por etapa), `cerebro/`, `.claude/`, `.ai-context/` (handoffs y un `.patch` de medición).

**Acceso y sesión**
- **PIN general compartido**, sin cuentas ni permisos por perfil. `src/lib/acceso/pin.ts`: scrypt (N=16384) con sal; códigos nuevos de 8 dígitos (`PIN_LENGTH=8`), el de 6 sigue valiendo hasta cambiarlo. Rechaza PIN débiles (repetidos, secuencias, fechas). Variables `ACCESS_PIN` (se usa una sola vez si no hay PIN guardado) y `ACCESS_PIN_RESET` (recuperación). Hash y `session_version` en la tabla `access_pin`.
- Límites: 5 intentos por origen = pausa de 15 min; 30 fallos totales = pausa general de ingreso de 15 min; reserva atómica del intento antes de comprobar (`tryAttempt`, migración 0621); cookie de "dispositivo conocido" 90 días (`crm_dispositivo`) que evita que la pausa general deje afuera a quien ya entró (0624). Eventos en `access_events`, `access_origin_limits`.
- **Cookie `crm_sesion`** (`src/lib/acceso/session.ts`): payload `{v, iat, sid, ini, c6}` firmado HMAC-SHA256 con Web Crypto (corre en Edge). Clave: `SESSION_SECRET` o, si falta, la clave de servicio de Supabase. Vence a 7 días sin uso y 30 desde el ingreso; el middleware la renueva si tiene más de 1 día. "Cerrar en todos los dispositivos" sube `access_pin.session_version`; la versión se cachea 30 s en memoria. Si la base no responde: estado `no_comprobable` (503 recuperable, no borra la cookie).
- **`requireSession(request)`** (`lib/acceso/autorizacion.ts`) en cada ruta API (se verificó: todas las `route.ts` lo llaman, salvo las públicas de abajo). **`requirePageSession()`** (`lib/acceso/pagina.tsx`) en páginas y layouts.
- **Middleware** (`src/middleware.ts`): exige sesión en todo salvo `PUBLIC_PATHS`: `/login`, `/api/acceso/ingresar`, `/api/webhooks/*`, `/api/campaigns/tick`, `/landing`, `/api/landing`, `manifest`, `sw.js`, `offline.html`, `/iconos/`. Además: (a) separación de perfiles por URL: una pantalla de la raíz de Jurídico pedida desde otro perfil se redirige a su equivalente (`perfil-ruta.ts`), usando `Referer`; (b) escribe la cookie `perfil_activo`. `next.config.mjs`: CSP, X-Frame-Options DENY, nosniff, Permissions-Policy, `images.unoptimized`; redirige `/telefono*` a `/perfiles`.
- Acceso a datos: **todo con la clave de servicio** (`createAdminClient`; `lib/supabase/server.ts` es un alias). RLS está cerrado al público, así que la autorización es solo "tener sesión".

---

## 2. Mapa de páginas

Prefijos: **J** = raíz de Jurídico; **P** = `/panel/{agencia_0km|coberturas_medicas|marketing}`. Para cada rubro no-Marketing (`agencia_0km`, `coberturas_medicas`) hay 13 páginas en `P` que son envoltorios finos del mismo componente (ej. `CampanasListView`) con otras props.

**Entrada y comunes**
- `/login`: ingreso con PIN. `/recuperar` redirige a `/descartados`. `/` y `/inicio`: redirigen a `/perfiles`. `/derivar`: redirige a `/perfiles`.
- `/perfiles`: tarjetas por perfil (estado, en vivo), acceso a Asistente general y Conocimiento/Laboratorio del bot.
- `/hoy`: tablero de acción del perfil (a quién responder/derivar, captados esperando, descartes, línea/campaña/bot) con pestañas Resumen/Resultados/Historial/Salud.
- `/resultados`: embudo y "día por día". `/salud`: Salud del sistema (latido, tiempos por etapa, fallas, calidad de líneas Meta/Wasender).
- `/contactos`, `/conversaciones`, `/descartados` (cartera: `PaginaCartera`), `/prospectos-por-base`, `/oportunidades` (indicadores filtrados), `/incidencias` (amenazas/quejas, retenidos, detenciones; `/revision` redirige acá), `/limpieza` (movimientos de la limpieza con deshacer).
- `/ficha/[id]` (ficha de contacto), `/conversacion/[id]` (resuelve perfil y redirige a `/inbox/[id]` o `/panel/<area>/chats/[id]`), `(dashboard)/prospectos/[id]` redirige a `/ficha/[id]`.
- `/asistente`: Asistente general (resumen semanal, accesos, chat, charlas guardadas). `/bandeja`: Bandeja para Claude.
- `/biblioteca-agentes`: biblioteca de agentes (Etapa 2, solo vista). `/comparacion-agentes`: redirige a `/agentes`.
- `/meta/lineas`: líneas de WhatsApp oficial. `/wasender` y `/wasender/plantillas`: líneas QR y plantillas.
- `/redes` (publicaciones/calendario), `/redes/accesos`, `/redes/perfiles`, `/redes/plantillas`, `/redes/publicidad`, `/redes/whatsapp`. `/contenido`: brief, piezas, auditoría de landings, Search Console.
- `/landing`: página pública de agradecimiento/prueba del formulario (sin sesión).
- `/telefono`, `/telefono/[slug]/{campana,clientes,estadisticas}`: **inalcanzables** (redirigidas por `next.config.mjs`); código viejo.

**Jurídico en la raíz (J)**: `/inbox` y `/inbox/[id]` (chats), `/campanas` y `/campanas/[id]` (Civil y Penal juntos: `areas=["civil","penal"]`), `/bases` y `/bases/[id]`, `/agenda` (citas), `/seguimiento`, `/agentes` (Bot IA), `/configuracion` (perfil, marca, líneas, avisos…), `/estadisticas`, `/casos-cerrados`, `/prospectos`.
**Por perfil (P)**: `page` (redirige a `/hoy?perfil=…`; `panel/[slug]` cubre slugs genéricos y redirige `juridico`), `chats` y `chats/[id]`, `campanas` y `[id]`, `bases` y `[id]`, `agenda`, `seguimiento`, `agentes`, `configuracion`, `estadisticas`, `casos-cerrados`.
**Solo Marketing** (`/panel/marketing/…`): `captacion` y `captacion/[id]` (Google Maps), `extraer` (Outscraper), `presupuestos` ("Pide presupuesto"), `prospectos` (prioritarios), `consultas-directas`, `lead/[id]`.

## 2b. Mapa de rutas API (`src/app/api/**`)

Quién llama: **panel** = navegador con sesión; **webhook** = Meta/Wasender; **cron** = pg_cron.

| Grupo | Rutas y qué hacen | Llama |
|---|---|---|
| Webhooks (sin sesión, con firma) | `webhooks/whatsapp` (GET verifica con `WHATSAPP_VERIFY_TOKEN`; POST valida `X-Hub-Signature-256`, procesa entrantes y estados, corre el turno del bot), `webhooks/meta` (Facebook/Instagram Messaging, `META_VERIFY_TOKEN`), `webhooks/wasender` (`?linea=<id>`, firma `x-webhook-signature` por línea). Firma inválida = `webhook_quarantine` + 200 | Meta / Wasender |
| Latido | `campaigns/tick` (GET y POST, `Authorization: Bearer CRON_SECRET`, `maxDuration=60`) | cron |
| Formulario | `landing` (público, CORS por dominio, 5 envíos/hora por origen, crea contacto + conversación + oportunidad) | landings externas |
| Acceso | `acceso/ingresar` (público), `salir`, `pin`, `cerrar-otras`, `pausa` (pausa general), `tareas-servidor` (ejecutor de citas y contenido) | panel |
| Campañas | `campaigns` (crea borrador), `campaigns/[id]` (PATCH/DELETE=archivar), `/launch`, `/pause`, `/status`, `/preparacion`, `/agregar-base`, `/archivo`, `/destinatarios/[ccId]`, `/import` (camino viejo), `/plan` (vista previa) | panel |
| Bases | `bases`, `bases/[id]` (DELETE=archivar), `/archivo`, `bases/upload-url` (URL firmada de Storage) | panel |
| Chats | `inbox` (lista), `conversations/[id]/messages` (GET/POST), `/toggle-ai` (tomar/devolver), `/subida`, `oportunidades/[id]`, `contacts/[id]`, `contacts/[id]/appointments`, `appointments/[id]` y `/cancel`, `agent/process` (turno manual), `agents/[area]`, `audios/[messageId]/texto`, `audios/ajuste`, `adjuntos/*`, `hoy/descartar`, `limpieza` | panel |
| Seguimiento | `seguimiento/config`, `/tareas/[id]`, `/repesca`, `recontacto` | panel |
| Revisión | `revision/incidencias/[id]`, `/detenciones` y `/detenciones/[id]/levantar`, `/retenidos/[id]`, `/ahora-no` | panel |
| Agentes/bots | `agentes/{ajuste,asignaciones,biblioteca,conocimiento,corpus,crear,evaluacion,ficha,informes,informes/[id]/aplicar,modelo,pedidos,probar-real,publicar,roles,simulador}`, `perfiles/{conocimiento,laboratorio,atencion-24h}` | panel |
| Asistente | `asistente` (chat de perfil), `asistente/general`, `/general/archivos`, `/general/planes`, `asistente/acciones/[id]` (confirmar/descartar), `/plan`, `/deshacer`, `asistente/charlas` y `/[id]` | panel |
| Perfiles/líneas | `perfiles/estado`, `/en-vivo`, `/marca`, `perfiles/[id]`, `/lineas`, `/lineas/[lineId]`, `lineas/numero`, `profile/phone`, `notification-phones`, `push/*` (avisos web), `studios` (legado) | panel |
| Plantillas Meta | `plantillas/{archivo,asignaciones,asignaciones/[id],enviar-a-meta,opciones,propuestas,sincronizar}` | panel |
| Wasender | `wasender/lineas`, `/[id]`, `/[id]/conectar`, `/[id]/estado`, `wasender/plantillas`, `/[id]` | panel |
| Redes y contenido | `redes/{accesos,conexion,facebook,instagram-enlace,piezas/[id],publicidad,whatsapp}`, `contenido`, `contenido/{auditoria,brief,pieza,piezas,politica}`, `calendario`, `calendario/[id]`, `seo/search-console/{conectar,vuelta}` | panel (Google redirige en `vuelta`) |
| Marketing | `marketing/{auto-outreach,ejecutar-base,extraer,presupuestos,scraping,scraping/queue,scraping/[id]/export}` | panel |
| Otros | `agenda/availability`, `agenda/slots`, `bandeja-claude`, `bandeja-claude/[id]` | panel |

---

## 3. Reglas de negocio en `src/lib`

**Perfiles y rubros.** `rubros.ts`: 4 rubros con IDs fijos (`juridico`, `agencia_0km`, `coberturas_medicas`, `marketing`) y 5 "áreas" (`civil`, `penal` → Jurídico). `marca.ts`: `SLUGS_PERFIL`, marca por defecto (nombre, logo, paleta). `perfil-ruta.ts`/`perfil-activo.ts`: cookie `perfil_activo`. **Separación**: es de navegación y presentación (URL, cookie, filtros por `rubro_id`/`area`); con un solo PIN y la clave de servicio, cualquier sesión puede leer/modificar cualquier perfil por API (ej. `campaigns/[id]/launch` no comprueba perfil). El credencial de cada línea Meta se busca por `credential_key` en `profile_lines` → variables `<CLAVE>_PHONE_NUMBER_ID/_ACCESS_TOKEN/_WABA_ID`.

**Captación** (`captacion/reglas.ts`, `captacion/index.ts`). `CRITERIO_POR_RUBRO`: aceptación requerida, datos deseables, si aplica zona (AMBA/fuera/sin confirmar) y qué no se promete. `evaluarCaptacion`: capta solo con aceptación + evidencia; Marketing "solo precio" no capta. Evento único con evidencia; agendar no capta; derivar es manual. Resultados posteriores (contacto previsto → operación concretada…). Clasificación de atención humana (`MOTIVOS_AGENTE`, `TRATAMIENTO_ATENCION`). Jurídico frío tiene ruta fase 1/2 (`elegir_ruta_juridica`, `programar_fase2`).

**Horarios** (`contacto/reglas.ts`, `horario.ts`, `horario-atencion.ts`, `hora-ar.ts`). Argentina UTC-3 fijo. Lo que inicia la empresa: lunes a sábado 8–21 (`GENERAL_HOURS`), feriados incluidos, con excepciones de calendario (`contact_calendar_exceptions`). `sendOutboundMessage` revalida pausa y horario justo antes de enviar (origen "salida_empresa"). Respuestas a quien escribe: 24 h; asesores humanos lun–sáb 8–21 (el bot lo sabe por `bloqueHorarioAtencion`). Ventana de canal de 24 h (`CHANNEL_WINDOW_HOURS`).

**Seguimiento** (`seguimiento/*`). `decideCircuit`: contacto 2 programado en franja de 48–72 h (default 72 h, `FOLLOWUP_RANGE`); sin respuesta tras el seguimiento, 24 h (`ESPERA_RESPUESTA_HORAS`) y pasa a Caídos; contacto 3 si respondió al 2 y se volvió a estancar. `caidos.ts`: cae por no responder el seguimiento (24 h), por silencio de 96 h sin seguimiento o por 7 días sin poder enviarse; nunca cae un captado, perdido, detenido o quien espera a una persona. `segundo-intento.ts`: solo Wasender, uno solo, 5–7 días después (por persona, determinístico), no sale pasados 10 días, solo si el primero se entregó. `hoy/descartes*`: último mensaje negativo + 6 h = perdido con motivo. Motores: `motor.ts` (793 líneas), `caidos-motor.ts`, `segundo-intento-motor.ts`.

**Recontacto** (`recontacto/reglas.ts`): texto libre dentro de las 24 h, a las 2 h y 2 h más (máx. 2), mínimo 20 min entre mensajes, si el plazo cae después del cierre sale 10 min antes del cierre, margen de 15 min antes de que cierre la ventana de Meta. Lo ejecuta el bot con el mismo prompt (`recontacto/motor.ts`).

**Detención** (`detention.ts`): por perfil y teléfono normalizado; motivos (necesidad resuelta, compró por otro canal, desinterés, no contacto, enojo, equivocado, abogado existente, no confirmado); bloqueo duro (no contacto, menor). Una persona detenida igual recibe respuesta si escribe (salvo menor o detención no verificable). Si no se puede leer, se asume bloqueo. Crisis/reclamos/interés en `atencion/*`.

**Límites por persona** (`contacto/tope.ts`): máximo 3 automáticos sin respuesta (orígenes `inicio_campana`, `seguimiento`, `recuperacion`), contados por teléfono entre todos los perfiles; si no se puede leer, se frena.

**Campañas** (`campaigns.ts`, 1100 líneas; `tickCampaign` ocupa ~540). Una por perfil/línea; ritmo con intervalo al azar (min/max), tandas y pausas; límite diario por campaña y por línea; lock del latido (`TICK_LOCK_SECONDS=120`) y claim (`CLAIM_LEASE_SECONDS=600`); pausa automática por calidad baja de la línea Meta; modo entrenamiento (`campanas/entrenamiento.ts`: 20/día, 7 días, esperas 90–300 s, lotes de 5, pausa 900 s). Wasender (`wasender/ritmo.ts`, `ritmo-humano.ts`, `campanas.ts`): calentamiento por escalones 20→40→80→150→250 por día; freno si falla ≥30 % o ≥50 % no se entrega (muestra ≥10); freno por respuesta <1 % con ≥100 envíos en 7 días (reanudar a mano da 7 días de gracia); plan del día por línea con arranque/cierre/pausas variables.

**Compuerta de envío** (`messaging.ts`, `sendOutboundMessage`): separa humano vs IA; origen obligatorio; pausa general, horario, detención, tope, y RPC atómica `claim_ai_send`. Decide el canal de salida: responde por donde escribió la persona (Wasender o Meta).

**Pausa general** (`automation-pause.ts`): sigue en el código (`system_settings.automation_pause`: `ai_replies_paused`, `outbound_automations_paused`). **Falla cerrada**: si falta el registro, no es booleano o no se puede leer, asume todo pausado (el bot no contesta y no sale nada, con solo un `console.error`). El cerebro dice que "no hay pausa general": depende de que esa fila exista con ambos `false` (sin verificar).

**Marketing** (`marketing/*`): extraer negocios con Outscraper (topes `system_settings.limites_outscraper`, defecto 500 por extracción y 1000 por día), análisis del negocio (web + IA), prospección automática, presupuestos programados, venta (`venta.ts`: aceptación, solo precio).

---

## 4. Bots y agentes IA

- **Modelo**: Gemini vía `@google/genai`. Por defecto `gemini-3.8-flash` (`agentes/modelo.ts`, `MODELO_POR_DEFECTO`); se puede cambiar con `GEMINI_MODEL`. Proveedores: `gemini_api` (en vivo), `vertex` (modelo ajustado; requiere `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_SERVICE_ACCOUNT_JSON`, `GCP_BUCKET`, `GCP_TUNING_BASE_MODEL`; `agentes/vertex.ts`), `simulado` (pruebas). Tiempo máximo 20 s + un reintento (`ai-agent/reintento.ts`); sin los 3 de temperatura (familia 3.x).
- **Agente en vivo** (`ai-agent/agent.ts`, 1217 líneas): `runAgentTurn(conversationId)`, llamado por `inbound.ts` dentro del manejador del webhook (esperado, no en segundo plano), por `rescate.ts` (reintenta turnos perdidos desde el latido) y por `api/agent/process`. Bucle de hasta 6 iteraciones de function calling (`MAX_TOOL_ITERATIONS`), historial de los últimos 30 mensajes.
- **Compuertas antes de responder**: pausa IA, `ai_enabled` del chat, agente activo y con identidad cargada (nombre de presentación y marca del perfil; si faltan no responde), `rubros.inbound_24h_enabled`, contestadores automáticos (`agentes/automaticos.ts`), menores, detención, audio ilegible.
- **Prompt (capas, de mayor a menor)**: reglas del sistema (`REGLAS_ESTRICTAS`, `criterioDelRubro`) → horario de atención → ficha del negocio (`ficha-negocio.ts`, tabla por rubro, el bot usa solo lo que figura) → rol del perfil/base/campaña (`agent_roles`, `agentes/roles.ts`; precedencia campaña > base > perfil) → guion y criterios del agente (`ai_agents.system_prompt`, `qualification_criteria`, `required_fields`; `guionSegunModo`: "campaña" vs "entrante") → conocimiento por versiones (`conocimiento/seleccion.ts`: v1 no suma; v2+ base general + base del rubro + hasta 2 temas + hasta 3 fichas por disparadores sobre el último mensaje, tope 12.000 caracteres, nunca cruza rubros) → guía de captación y cierre (`guia-cierre.ts`). Además la biblioteca activa (`agent_library` + `agent_assignments`) si hay asignación.
- **Herramientas** (`ai-agent/tools.ts`, `toolsForArea`): `guardar_datos_calificacion`, `evaluar_calificacion`, `consultar_disponibilidad`, `agendar_cita`, `escalar_a_humano`, `detener_contacto`, `captar`, `registrar_ubicacion`, `finalizar_consulta`; Marketing: `registrar_resultado_marketing`, `pedir_presupuesto`, `presupuesto_aprobado`, `registrar_venta`, `analizar_negocio`; Jurídico: `elegir_ruta_juridica`, `programar_fase2`. El modelo nunca cambia estados por su cuenta: el servidor valida (p. ej. captación exige aceptación y evidencia).
- **Salida validada** (`agentes/contrato.ts`): retiene textos con precios, cuotas, plazos, promesas, urgencias inventadas o identidad humana falsa; hay reparación con segundo pedido y mensaje de cierre de reserva (`cierre-captacion.ts`). Cada turno se registra en `agent_turn_logs` (versión, fichas, tokens, latencia).
- **Fichas/conocimiento**: tablas `bot_knowledge_*`; informe de mejoras con Gemini (`agentes/informe-mejoras.ts`, en segundo plano con `after`) que propone fichas o roles; no edita lo existente.
- **Laboratorio** (`lib/laboratorio`, `api/perfiles/laboratorio`, `components/perfiles/laboratorio/laboratorio-bot.tsx` cargado dinámico desde `conocimiento-bot.tsx`; no tiene página propia): versiones (v3+ como copia; nunca edita v1/v2), modelos Gemini disponibles (`modelos.ts`), roles por perfil/base/campaña, pruebas A/B por campaña (`bot_lab_pruebas_ab`, decide versión y modelo), "Probar el bot real" (`probar-real.ts`, mismo prompt que en vivo, sin enviar), simulaciones con casos sintéticos (`casos.ts`, tope diario `LABORATORIO_SIMULACIONES_POR_DIA`), editar el bot base con historial (`ai_agent_prompt_history`) y "volver a la anterior". Todo aplicado queda en `ops_change_log`.
- **Comparación de agentes A/B/C** (`experimento/*`, `agent_experiments`): quedó de la etapa 3; el comentario del agente dice que "ya no hay comparación". `experimento/servicio.ts` sigue usándose para `registrarTurno`.
- **Asistente del panel** (`lib/asistente`, `api/asistente*`): Gemini con function calling. Chat por perfil ("Pedile algo") y Asistente general (`/asistente`, multi-perfil: Excel/CSV, planes de campañas Wasender, charlas guardadas hasta 30). **No ejecuta solo**: cada cambio queda como propuesta (`asistente_acciones`) que se confirma por `api/asistente/acciones/[id]`, con 3 niveles (`cambio` un clic, `contacto` confirmación reforzada, `pin`). Catálogo de **79 operaciones** (`asistente/catalogo.ts`, 1278 líneas; el cerebro dice 77) más herramientas propias (campañas, roles, chats, menú, laboratorio) y `FUERA_DEL_CATALOGO` con el motivo de cada ruta excluida. Los mensajes de prospectos nunca son órdenes.
- **Flujo fijo viejo** `ai-agent/intake-flow.ts` (cuestionario de botón "Mi caso está pendiente"): **no lo llama nadie** (código muerto).

---

## 5. Integraciones

- **Meta WhatsApp Cloud API** (`whatsapp/client.ts`, `plantillas/*`, `whatsapp/*`): Graph **v21.0** fijo en 4 lugares (`whatsapp/client.ts`, `meta/client.ts`, `plantillas/meta.ts`, y más en `marketing/presupuestos.ts`, `adjuntos/guardar.ts`). Líneas = filas de `profile_lines` con `credential_key`; el credencial son variables `<CLAVE>_PHONE_NUMBER_ID`, `_ACCESS_TOKEN`, `_WABA_ID` (ej. `WHATSAPP_CIVIL`, `WHATSAPP_AGENCIA_0KM`, `WHATSAPP_COBERTURAS_MEDICAS`, `WHATSAPP_MARKETING`). Webhook `/api/webhooks/whatsapp` (+`/meta` para FB/IG, ya con firma obligatoria `META_APP_SECRET`/`META_APP_SECRETS`). Plantillas: catálogo `whatsapp_templates`, sincronización con Meta (`sincronizar`, y automática 1 vez por hora desde el latido), envío a revisión (`enviar-a-meta`, `pedido-meta.ts`), asignación a línea y propósito (`template_assignments`: campaña, seguimiento, formulario, inicio de cita…). Calidad de línea (`whatsapp/calidad-servidor.ts`): pausa campañas si baja. Suscripción automática de avisos por WABA (`avisos-meta.ts`).
- **Wasender** (WhatsApp por QR; `lib/wasender`, 21 archivos): cliente HTTP (`WASENDER_API` URL base, token `WASENDER_PAT`), clave y secreto de cada línea cifrados AES-256-GCM con `WASENDER_CLAVE_CIFRADO` (`cifrado.ts`), interruptor `WASENDER_HABILITADO`, `WASENDER_TIMEOUT_MS`. Webhook por línea con firma. Tablas `wasender_lineas`, `wasender_plantillas` (variantes), `wasender_segundos_intentos`, `wasender_eventos`. Eco de envíos del panel, QR como GIF, avisos internos al equipo. Desde una Preview no se desvían los entrantes de producción (`webhook-url.ts`, `VERCEL_AUTOMATION_BYPASS_SECRET`).
- **Metricool** (`redes/metricool.ts`): `https://app.metricool.com/api`, credenciales `METRICOOL_USER_TOKEN` + `METRICOOL_USER_ID`; el `blogId` por perfil va en `content_policies.destino_ref`. La publicación sale por el ejecutor de tareas del servidor (`contenido/cola.ts` → `publicarVencidas`, solo si `tareas_servidor.contenido` está en true).
- **Resend**: **no existe en `main`**. El aviso por correo (`landing-email.ts`) está solo en la rama `landings-conexion` (PR #40). Hoy el formulario de landing se contesta por WhatsApp con plantilla a los 5 min (`landing-seguimiento.ts`).
- **Google**: (1) Gemini API; (2) Vertex AI para ajuste (tablas `tuning_jobs`, `training_sets`, cuenta de servicio con JWT RS256 a mano); (3) Search Console por OAuth (`seo/search-console.ts`, variables `GSC_CLIENT_ID`, `GSC_CLIENT_SECRET`, `GSC_REDIRECT_URI`, `GSC_TOKEN_KEY`, `SEARCH_CONSOLE_ENABLED`; tokens cifrados en `search_console_connections`); (4) "Google Places" en realidad es **Outscraper** (`marketing/google-places.ts`, `OUTSCRAPER_API_KEY`).
- **Almacenamiento**: Supabase Storage (buckets `bases-originales`, `marca`, `presupuestos`, `adjuntos-originales`). **No se usa Vercel Blob.**
- **Web Push** propio (VAPID) para avisos a dispositivos.
- **Latido/cron** (`api/campaigns/tick`, 1 llamada por minuto desde pg_cron). Orden de etapas con presupuesto de tiempo dentro de los 60 s: campañas → pedido de plantillas → seguimiento → recontacto → segundo intento → (cada 10 min, min%10==0) descartes → (min%10==5) caídos → rescate de turnos → calidad de líneas → Marketing → tareas del servidor (citas, contenido) → extracción (hasta 3 zonas) → avisos de Meta → formularios de landing → presupuestos programados → catálogo de plantillas → (min%10==2) fallas. Al final `registrarLatido` (tiempos por etapa para Salud); si falla, `avisarLatidoFallido`.

---

## 6. Base de datos

- **84 archivos** de migración en `supabase/migrations` (el cerebro dice 77 en un lado y 84 en otro). Numeración por etapa: `0001–0005` (init, RLS, bases, campañas avanzadas, pipeline de marketing), `0100–0117` + `0199` (etapa 1), `0200–0207` (etapa 2), `0300/0310/0311/0312`, `0400`, `0500–0511` (el `0511` son 4 archivos "parte1..4"), `0600–0634`. Huecos normales (0006–0099, 0313–0399, 0627–0629). **Última en main: `0634_asistente_charlas`.** La `0634_archivo_de_prospectos` de la rama `pensive-galileo` aún no está en main (hay que renumerarla a 0635).
- ~99 `create table` distintas, ~71 funciones SQL. Las migraciones **no reconstruyen la base desde cero**: `rubros`, entre otras, nacieron fuera del repo (solo hay `alter table public.rubros`); la estructura previa vive en `tests/integracion/sql/01_estructura_previa_etapa1.sql`. El job `pg_cron` tampoco está versionado.
- **Tablas principales y para qué sirven**
  - Núcleo: `rubros`, `studios`, `channels`, `contacts` (con `rubro_id`, `qualification_data`, `imported_base_id`), `contact_identities`, `conversations` (`ai_enabled`, `line_id`, `area`), `messages` (+`origin`, `sender_type`, `audio_texto`), `message_attachments`, `message_status_events`, `opportunities` (+`opportunity_events`; estados de contacto, captación, atención, seguimiento), `contact_detentions`, `incidences`, `capture_events`, `capture_notices`, `webhook_quarantine`.
  - Campañas y bases: `campaigns`, `campaign_contacts`, `imported_bases`, `imported_base_rows`, `followup_tasks`, `contact_calendar_exceptions`, `limpieza_movimientos`, `landing_submissions`, `landing_audits`.
  - Líneas y plantillas: `profile_lines`, `whatsapp_templates`, `whatsapp_template_syncs`, `template_assignments`, `template_evaluations`, `wasender_*`.
  - Agentes/bots: `ai_agents`, `agent_roles`, `agent_library` (+`_versions`), `agent_modules`, `agent_assignments`, `agent_turn_logs`, `ai_agent_prompt_history`, `bot_knowledge_{versions,items,assignment}`, `bot_lab_*` (versiones, pruebas A/B, aplicaciones, simulaciones, roles generales, proveedores), `bot_informes_mejora`, `agent_experiments*`, `agent_incidents`, `eval_cases`, `eval_results`, `simulation_runs/turns`, `training_*`, `tuning_jobs`, `model_comparisons`.
  - Asistente: `asistente_acciones`, `asistente_charlas`, `asistente_charla_mensajes`, `bandeja_claude`.
  - Agenda: `appointments`, `availability_rules/blocks`, `cita_tareas`.
  - Marketing: `marketing_leads`, `marketing_events`, `marketing_budgets`, `marketing_extracciones`, `marketing_scrape_jobs`.
  - Contenido/redes: `brand_briefs`, `content_policies`, `content_pieces`, `content_requests`, `content_results`, `content_publish_attempts`, `search_console_connections`.
  - Acceso/operación: `access_pin`, `access_events`, `access_origin_limits`, `system_settings` (llaves usadas en código: `automation_pause`, `tareas_servidor`, `ultimo_latido`, `audios_a_texto`, `recontacto_ia`, `caidos_automaticos`, `avisos_meta`, `calidad_lineas`, `catalogo_auto_sync`, `limites_outscraper`, `evaluacion_plantillas`, `agente_ganador`, `publicidad`, `corpus_desde`), `ops_change_log` (antes/después de todo cambio), `personalizacion_perfil`, `push_subscriptions/deliveries`, `admin_notifications/profiles`, `notification phones`, `respaldo_etapa1`, `etapa1_reconciliacion`.
- Las migraciones usan RLS cerrado, funciones sin acceso público y casi no borran (`0199` solo quita tablas de la publicación realtime).

---

## 7. Pruebas

- `tests/unitarias`: **75 archivos, ~570 casos** (`node:test` con `tsx`): reglas puras (horarios, seguimiento, caídos, recontacto, captación, wasender, plantillas, asistente, laboratorio, separación de perfiles, acceso/firmas…). Comando: `npx --yes tsx@4.23.12 --tsconfig tests/tsconfig.json --test tests/unitarias/*.test.ts`.
- `tests/integracion`: 15 archivos (~86 casos) contra Postgres 16 + PostgREST en Docker (`bash tests/integracion/correr.sh`); red simulada, ninguna prueba envía nada real. `preparar_base.sh` aplica `supabase/migrations/0[1-9][0-9][0-9]_*.sql`.
- `tests/reproduccion`: reproduce la revisión del 10/10 contra una versión anterior (histórico).
- Typecheck: `npm run typecheck && npx tsc -p tests/tsconfig.json --noEmit`; lint `next lint`; el build falla ante errores de tipos y lint (`ignoreDuringBuilds:false`).
- **No hay CI de pruebas**: el único workflow (`.github/workflows/aplicar.yml`) es legado.
- Según el cerebro, línea base del 20/11: 585 de 586 unitarias; la que falla es `asistente-catalogo.test.ts` (rutas `asistente/charlas` y `asistente/charlas/[id]` no están en `CATALOGO` ni en `FUERA_DEL_CATALOGO`). Lo confirmé leyendo el código: `catalogo.ts` no menciona esas rutas. No corrí las pruebas.

---

## 8. Deudas, inconsistencias y riesgos

**Alto / verificar pronto**
1. **Graph API v21.0 fija** (`src/lib/whatsapp/client.ts:9`, `meta/client.ts:3`, `plantillas/meta.ts:12`, `marketing/presupuestos.ts:45`, `adjuntos/guardar.ts:30`). Es de octubre de 2024; Meta retira versiones tras ~2 años. Hoy (11/2026) puede estar vencida o por vencer (Meta suele redirigir a la más vieja disponible, pero cambia comportamiento). Sin verificar; conviene centralizar la constante y subir de versión probando.
2. **Seguimiento "en conflicto" (bug conocido): causa probable** en `src/lib/contacto/reglas.ts`. `FOLLOWUP_RANGE.defaultTargetHours = 72` es igual a `maxHours = 72`: la tarea se programa justo en el límite del plazo. Si el latido la toma un poco después (o la franja 8–21 la empuja), `decideAtExecution` ve `now > deadline`, `chooseFollowupSlot(..., notBefore: now)` no encuentra ninguna franja y devuelve `plazo_vencido` (conflicto). Es una hipótesis leída del código, no probada; la solución natural: objetivo menor al tope (p. ej. 66–70 h) o margen de gracia. Además el cerebro menciona que no se cierra el seguimiento al pasar a perdido/captado.
3. **Páginas sin guardia propia**: `/wasender`, `/wasender/plantillas`, `/meta/lineas`, `/salud`, `/bandeja` (y `/contactos`, `/conversaciones`, `/descartados` solo vía `PaginaCartera`) no llaman a `requirePageSession` ni heredan un layout con guardia; dependen solo del middleware. `bandeja/page.tsx` lee con la clave de servicio en el servidor. Contradice la convención de `CLAUDE.md` ("toda ruta privada comprueba la sesión"). Bajo mientras el middleware esté bien, pero es la capa de respaldo que se quiso tener.
4. **Separación de perfiles solo de interfaz**: no hay permisos por perfil; cualquier sesión puede operar sobre cualquier campaña/chat/línea por API. Es consistente con el "PIN general" pero el cerebro lo presenta como separación fuerte.
5. **Pausa general falla cerrada** (`automation-pause.ts`): cualquier error de lectura o fila ausente deja al bot mudo y sin envíos, con un `console.warn` y sin aviso al equipo (el `agent.ts` retorna en silencio). El cerebro dice que "no hay pausa general": verificar la fila `automation_pause` en la base.
6. **El latido depende de un único job `pg_cron` no versionado**, con la URL de producción y `CRON_SECRET` en su comando. Si cambia el dominio o el secreto, se rompe en silencio salvo el aviso de latido fallido. Sin réplica en el repo.
7. **Webhook sincrónico**: el turno del bot se espera dentro del manejador (`inbound.ts:487` → `runAgentTurn`) con `maxDuration=60`. El cerebro (`06`) dice que las llamadas largas a Gemini van en segundo plano con `after`; en realidad solo el laboratorio y los informes usan `after`. Si Gemini + herramientas pasan de 60 s, Meta puede reintentar y duplicar procesamiento (hay reserva atómica y rescate, pero conviene revisar).
8. **Sesión firmada con la clave de servicio** si no existe `SESSION_SECRET` (`session.ts`): rotar la clave de Supabase cierra todas las sesiones y la misma clave firma cookies; recomendable un secreto propio.

**Medio**
9. **Indicador de Metricool incorrecto**: `components/configuracion/conexiones.tsx:30` mira `METRICOOL_API_TOKEN`, pero el cliente real usa `METRICOOL_USER_TOKEN` (`redes/metricool.ts`). La pantalla mostraría "sin token" aunque esté configurado. Ese mismo panel dice que el latido "hoy está inactiva por decisión", contra el cerebro (pg_cron cada minuto).
10. **`env.example` y `.env.example` desactualizados y distintos**: `GEMINI_MODEL=gemini-2.5-flash` (el código usa `gemini-3.8-flash` por defecto), faltan Wasender, VAPID, Metricool, Outscraper, GCP, GSC, `SESSION_SECRET`, `ACCESS_PIN`; `.env.example` ni tiene `CRON_SECRET`. `LANDING_WHATSAPP_TEMPLATE` está documentada pero no la lee el código.
11. **Código muerto / sin importador** (verificado por búsqueda de importaciones): `src/lib/ai-agent/intake-flow.ts` (cuestionario viejo, 230 líneas), `src/lib/experimento/acciones.ts` (390 líneas; probable), componentes `derivar/caso-card.tsx`, `ui/ilustraciones.tsx`, `ui/refresco-automatico.tsx`, `ui/tarjeta-luz.tsx`, y todo `app/telefono/**` + `components/telefono/*` + `lib/telefono.ts` (páginas redirigidas), `date-fns` en `package.json`. Rutas legado: `studios`, `campaigns/import`, `agents/[area]`, `revision/ahora-no` ("corrección puntual de octubre"), `/comparacion-agentes`. Hay duplicación `prospectos` vs `prospectos-por-base` vs `panel/marketing/prospectos`.
12. **Comentarios obsoletos** que confunden: "antes usaba la API de Anthropic/Claude" (`ai-agent/agent.ts`, `tools.ts`); `panel/[slug]/page.tsx` dice que los otros rubros "todavía no tienen su motor"; `campaigns/tick/route.ts` habla de cron-job.org y "segundo intento apagado por defecto"; `docs/ESTADO.md` marcado como historia (14/11) pero sigue en el repo; `tests/README.md` dice que las migraciones son 0100…0117 y 0199.
13. **Archivos enormes**: `campaigns.ts` (1100 líneas, `tickCampaign` ~540), `ai-agent/agent.ts` (1217, `executeTool` ~490), `asistente/catalogo.ts` (1278), `laboratorio/servicio.ts` (731). Difíciles de probar y revisar.
14. **Workflow legado peligroso** `.github/workflows/aplicar.yml`: ante un push de `kocos-pipeline*.zip` descomprime, borra archivos de la raíz y hace push al repo. Sin uso hoy; conviene retirarlo.
15. **Preview comparte base y líneas con producción** (ya conocido); sin CI que impida desplegar con pruebas rojas (hoy 1 roja: catálogo del asistente).
16. **Catálogo del asistente**: 79 operaciones reales vs "77" en el cerebro; la prueba roja por `asistente/charlas`.
17. **Cifras del cerebro a corregir**: main ya no es `36f742b`; 84 migraciones (no 77); 99 páginas y 137 rutas `route.ts` sí coinciden; "no hay pantalla Laboratorio propia" es correcto (componente dentro de Bot IA).

**Bajo**
18. Dos tipos `RubroSlug` (`rubros.ts` y `captacion/reglas.ts`) y dos mapas de marca/slug (`SLUGS_PERFIL` y `RUBRO_IDS`) a mantener sincronizados a mano.
19. Caché de versión de sesión de 30 s en memoria por instancia: un "cerrar todas las sesiones" puede tardar hasta 30 s en una instancia ya caliente.
20. Dependencia fuerte de nombres de variable construidos dinámicamente (`<CLAVE>_ACCESS_TOKEN`): imposible listarlas solo con `grep`; el panel no avisa si una línea nueva no tiene su variable (sí hay indicador "Pendiente/Sin acceso").
21. `Referer` como base de la redirección de perfil en el middleware: navegadores que lo omiten no redirigen (comportamiento intencional, anotado en el código).

---

## 9. Variables de entorno (solo nombres)

**Núcleo**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `PANEL_PUBLIC_URL`, `NODE_ENV`, `VERCEL_ENV`, `VERCEL_URL`, `VERCEL_BRANCH_URL`, `VERCEL_PROJECT_PRODUCTION_URL`, `VERCEL_AUTOMATION_BYPASS_SECRET`.
**Acceso**: `ACCESS_PIN`, `ACCESS_PIN_RESET`, `SESSION_SECRET` (opcional), `CRON_SECRET`.
**IA**: `GEMINI_API_KEY`, `GEMINI_MODEL`, `LABORATORIO_MODELOS`, `LABORATORIO_SIMULACIONES_POR_DIA`, `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_SERVICE_ACCOUNT_JSON`, `GCP_BUCKET`, `GCP_TUNING_BASE_MODEL`.
**Meta**: `META_APP_ID`, `META_APP_SECRET`, `META_APP_SECRETS`, `META_VERIFY_TOKEN`, `WHATSAPP_VERIFY_TOKEN`; por línea (`<CLAVE>` = `credential_key`, ej. `WHATSAPP_CIVIL`, `WHATSAPP_PENAL`, `WHATSAPP_COBERTURAS_MEDICAS`, `WHATSAPP_AGENCIA_0KM`, `WHATSAPP_MARKETING`): `<CLAVE>_PHONE_NUMBER_ID`, `<CLAVE>_ACCESS_TOKEN`, `<CLAVE>_WABA_ID`; Facebook/Instagram por perfil: `FACEBOOK_<CLAVE>_PAGE_ID`, `FACEBOOK_<CLAVE>_PAGE_ACCESS_TOKEN`, `INSTAGRAM_<CLAVE>_BUSINESS_ID`. Otros: `ADMIN_WHATSAPP_PHONE`, `ADMIN_WHATSAPP_PHONES`.
**Wasender**: `WASENDER_PAT`, `WASENDER_CLAVE_CIFRADO`, `WASENDER_HABILITADO`, `WASENDER_API`, `WASENDER_TIMEOUT_MS`.
**Redes y Google**: `METRICOOL_USER_TOKEN`, `METRICOOL_USER_ID`, `METRICOOL_API_TOKEN` (solo en el indicador, probable error), `GSC_CLIENT_ID`, `GSC_CLIENT_SECRET`, `GSC_REDIRECT_URI`, `GSC_TOKEN_KEY`, `SEARCH_CONSOLE_ENABLED`.
**Marketing**: `OUTSCRAPER_API_KEY`.
**Landings**: `LANDING_ORIGINS`, `LANDING_HOSTS`, (`LANDING_WHATSAPP_TEMPLATE` solo en `env.example`).
**Avisos web**: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
No hay variables de Resend ni de Vercel Blob en `main`.
