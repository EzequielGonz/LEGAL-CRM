# Teléfonos y líneas de WhatsApp: gestionarlos desde la compu y reconectar sin dolor

Investigación de solo lectura, 22/11/2026. No se tocó producción ni se pagó nada. Sin números ni datos personales.
Marcas: **[OFICIAL]** = documentación del proveedor o de WhatsApp/Meta. **[FORO/BLOG]** = notas de terceros, foros o vendedores (tomarlas como orientación, no como regla). **[CÓDIGO]** = lo que hay hoy en el repo.

## 1. La respuesta corta

1. **Reconectar 100 % solo, sin una persona, no se puede en las líneas por QR (Wasender).** Cuando WhatsApp cierra la sesión, hay que volver a vincular con QR o código. Lo que sí se automatiza: detectar la caída en minutos, avisar, pausar campañas, y que la persona la resuelva **en un toque** desde el panel (QR en vivo en pantalla, o código de vinculación por número).
2. **Lo que sí se evita casi del todo** son las caídas «tontas»: teléfono principal apagado o sin internet más de 14 días, bugs de sesión que se arreglan con reiniciar. Eso se reintenta solo.
3. **Las líneas de Meta (Cloud API) no usan QR**: nunca «se desconectan» como Wasender. Sus problemas son otros (token vencido, calidad baja, sin acceso) y se vigilan consultando a Meta.
4. **Los teléfonos Android desde la compu (scrcpy/ADB)** sirven para ver y tocar los 13 celulares, pero **no** reconectan solos y no conviene escalarlos para envíos masivos.

## 2. Qué existe hoy en el código (repo `crm-main`)  [CÓDIGO]

- **Tablas** (migración `0600_wasender.sql`): `wasender_lineas` (estado, `estado_at`, `habilitada`, límite diario, calentamiento, secreto de webhook cifrado), `wasender_plantillas`, `wasender_eventos`. Más equivalencias Meta→Wasender (0603), ritmo (0604, 0615).
- **Rutas del panel**: `/wasender` (pantalla de líneas, `src/components/wasender/lineas-wasender.tsx`), `/meta/lineas`. APIs: `/api/wasender/lineas`, `/lineas/[id]/conectar`, `/lineas/[id]/estado` (consulta estado y trae el QR si pide escanear), `/lineas/[id]` (editar/archivar).
- **Cliente de Wasender** (`src/lib/wasender/cliente.ts`): crear sesión, ver estado, conectar, QR, desconectar, actualizar webhook, enviar, descifrar archivos.
- **Webhook** `POST /api/webhooks/wasender?linea=<id>` con firma por línea. Entiende eventos de mensaje, estado de entrega, envío, **sesión** y **QR** (`src/lib/wasender/eventos.ts`).
- **Regla de caída** (`lineas.ts`): si el estado es `logged_out`, `expired`, `disconnected` o `need_scan`, la línea queda **apagada** (`habilitada=false`) y hay que prenderla a mano al reconectar.
- **Salud** (`src/lib/salud/*`, `src/lib/wasender/salud.ts`, `/salud`): un control por línea de Wasender (rojo «desconectada… Hay que volver a vincular con el QR»), calidad de líneas de Meta, latido, fallas.
- **Latido**: `pg_cron` cada minuto llama a `/api/campaigns/tick` (migración `0639`, secreto en Vault). Hay `avisar-fallas.ts` que manda avisos push (`sendToDevices`) por fallas y por atraso del latido.
- **Estado verificado 20/11** (cerebro 07): las 3 líneas Wasender en `logged_out`, envíos apagados, modo prueba; Meta Marketing «Sin acceso al número» (y Salud decía «en orden»: bug); Autos 0 km calidad baja desde 26/10; ningún dispositivo con avisos activado.
- **Lo que falta**: (a) por lo visto el estado de Wasender se refresca solo al abrir la pantalla o por el webhook; no hay un chequeo programado por línea (confirmar leyendo el tick); (b) no hay cola ni reintentos de reconexión; (c) el aviso de «línea caída» existe como regla pero ningún dispositivo lo recibe; (d) no hay pantalla única «Teléfonos» con los 13 chips (físico, rubro, proveedor, estado, edad, topes); (e) no hay registro de cuándo se vinculó cada chip ni de cuándo toca «abrir el celular».

## 3. Wasender: lo que dice su documentación  [OFICIAL]

Fuentes: https://wasenderapi.com/api-docs · https://wasenderapi.com/api-docs/webhooks/webhook-session-status · https://wasenderapi.com/api-docs/sessions/create-whatsapp-session · https://wasenderapi.com/pricing

- **Endpoints**: crear sesión `POST /api/whatsapp-sessions`; estado `GET /api/status`; conectar `POST /api/whatsapp-sessions/{id}/connect` (QR por defecto, **Passkey/código** como alternativa); QR `GET /api/whatsapp-sessions/{id}/qrcode`; reiniciar `POST …/restart` (**solo** si está conectada); desconectar `POST …/disconnect`; borrar `DELETE …/{id}`.
- **Webhooks de conexión**: `session.status` (se dispara en cada cambio) y `qrcode.updated` (QR nuevo). Estados: `connected`, `connecting`, `need_scan` (hay que escanear), `need_passkey`, `disconnected` («puede reconectarse»), `logged_out` (WhatsApp cerró la sesión), `expired` («no se puede retomar con seguridad»).
- **Reconexión automática**: **no está documentada**. Lo único que figura como recuperación es `restart` y, para desconexiones frecuentes, usar proxy SOCKS5. Hay un ajuste `account_protection` que solo dice «activa funciones de protección» sin detallar.
- **Precio** (pricing, 3 días de prueba, mensajes y contactos ilimitados, sin tope diario): Básico USD 6 (1 número) · Pro USD 15 (3) · Plus USD 30 (6) · Business USD 45 (10; USD 4,50 por línea). Para 13 chips: Business + Básico/Pro, unos **USD 50–60/mes**. Listados de terceros coinciden en «desde USD 6 por sesión» (https://www.goodfirms.co/software/wasenderapi). **Todo pago necesita autorización de la responsable.**
- **Límites de tasa**: dependen del plan; las cifras no salen en la página consultada (https://wasenderapi.com/api-docs → «Understanding Rate Limits»). Revisar antes de diseñar el monitor.

**Lectura práctica:** `disconnected` y `connecting` se pueden intentar reintentar solos (restart/connect). `need_scan`, `logged_out` y `expired` exigen a una persona (QR o código).

## 4. Qué se puede reconectar solo y qué no

| Situación | ¿Solo? | Qué hacer |
|---|---|---|
| `disconnected` / `connecting` (corte de red, reinicio del servicio) | **Sí**, con reintentos suaves | Esperar 1–2 min, `connect`/`restart`, hasta 3 intentos espaciados; si no vuelve, avisar |
| `need_scan`, `logged_out`, `expired` | **No** | Aviso + pantalla «Reconectar» con QR en vivo o código por número |
| Teléfono principal sin usar 14 días | **No** | Calendario de «abrir WhatsApp en cada chip» antes del día 14 |
| Sesión vinculada se cierra por un fallo de WhatsApp | A veces | Probar `restart`; si no, QR |
| Número bloqueado/baneado | **No** | Cambiar chip; no insistir con el mismo |

Datos de WhatsApp sobre dispositivos vinculados  [OFICIAL]:
- «Tenés que iniciar sesión en WhatsApp en el teléfono principal cada 14 días» para mantener conectados los dispositivos vinculados: https://faq.whatsapp.com/1317564962315842
- WhatsApp también desconecta dispositivos vinculados tras **30 días de inactividad** (mismo centro de ayuda: https://faq.whatsapp.com/378279804439436).
- Si el teléfono está apagado, la sesión sigue funcionando hasta cerca de ese plazo; después se cierra. Cuánto dura exactamente una sesión sana no tiene una cifra oficial: depende de que el chip se use y no lo cierre WhatsApp por seguridad [FORO/BLOG] (https://techradar.com/news/whatsapp-may-kick-you-out-of-linked-devices-for-security-reasons).
- Vincular **por código de 8 caracteres** en lugar de QR (sin escanear con otra pantalla) existe en WhatsApp y Wasender lo ofrece como «Passkey/código» (docs Wasender arriba). Ventaja: la persona lo hace desde el mismo celular del chip, sin cámara.

**Reconectar en 1 toque, de verdad:** la persona recibe un aviso push; toca; se abre `/telefonos/<chip>` con el QR en vivo (se refresca con `qrcode.updated`) o el código; escanea desde el celular del chip (Dispositivos vinculados → Vincular); la pantalla detecta `connected` por webhook y se cierra sola. Nada de ir a buscar pantallas.

## 5. Opciones (pros, contras, costos)

**A. Seguir con Wasender + monitor y reconexión asistida (recomendada para ya).**
Pros: ya está integrado; USD 50–60/mes para 13 líneas; QR/código en la API. Contras: no oficial, riesgo de baneo y de términos, reconexión humana. 

**B. Más líneas por Cloud API oficial de Meta (multi-número).** [OFICIAL] Meta calcula los límites de envío **a nivel del portafolio** de negocio (desde 07/10/2025), no por número; arrancan bajos y suben con calidad media/alta; si la calidad queda baja 7 días, el tope baja un escalón (https://developers.facebook.com/docs/whatsapp/messaging-limits). Pros: sin QR, sin desconexiones, cumple términos, webhooks estables. Contras: cobra por mensaje de plantilla; hay que tener plantillas aprobadas; la calidad se arruina si la base no pidió contacto. Es lo que ya usan Civil, Coberturas, Autos, Marketing. Hoy sus problemas son operativos: Marketing «sin acceso» (token o permiso del número) y Autos con calidad baja.

**C. Coexistencia (la app WhatsApp Business y la Cloud API en el mismo número).** Pros: se sigue atendiendo desde el celular y la API a la vez; mensajes por la app siguen gratis. Contras: requiere app Business reciente (un proveedor cita v2.24.17+), sincronización inicial, tope de 20 mensajes/seg por número, se desvinculan los otros dispositivos al conectar, y no se desconecta por API: se hace desde la app. Fuentes: https://docs.360dialog.com/partner/waba-management/whatsapp-coexistence · https://www.infobip.com/docs/whatsapp/manage-integration/coexistence · https://developers.telnyx.com/docs/messaging/whatsapp/coexistence (todas de proveedores; **verificar en la documentación de Meta y la disponibilidad para Argentina** antes de prometerla).

**D. Evolution API / WAHA / Baileys autoalojado (servidor propio).** Pros: control total, sin costo por sesión, USD 5–10/mes de servidor (cerebro 03). Contras: usa el mismo protocolo no oficial que Wasender, **más** mantenimiento nuestro (actualizar cuando WhatsApp cambia), y las notas externas lo califican de riesgo de baneo alto [FORO/BLOG] (https://kraya-blog-platform.vercel.app/whatsapp-automation-ban-risk; https://redlib.ssps.io/r/SaaSAI/comments/1ko971e/at_what_point_does_using_evolutionapi_become_risky). Las notas coinciden en que el riesgo es contractual con WhatsApp, no legal (https://pasqualepillitteri.it/tr/news/12973/whatsapp-entegrasyonu-evolution-api-cloud-api). No resuelve la reconexión: sigue pidiendo QR. Conviene solo si Wasender falla o encarece.

**E. Manejar los celulares Android desde la PC (scrcpy + ADB).** [OFICIAL de la herramienta] scrcpy muestra y controla Android por USB o por red, sin root, en Linux/Windows/Mac; con varios equipos se abre una ventana por serie (`-s`); wifi sin cable desde Android 11 (https://github.com/Genymobile/scrcpy, guía de conexión: https://fr.github.com/Genymobile/scrcpy/blob/master/doc/connection.md). Pros: gratis, útil para **vincular o abrir WhatsApp en los chips desde el escritorio** sin caminar entre 13 teléfonos. Contras: es un control manual; no reconecta solo; con muchos equipos hay que mantenerlos cargados y conectados; y si se usa para operar WhatsApp de forma masiva con apps en el teléfono, cae en lo mismo que prohíben los términos. Lo recomendable es **usarlo como herramienta de mantenimiento** (tocar «vincular dispositivo», abrir WhatsApp cada 10 días), no como canal de envío.

**F. Celulares en la nube / emuladores.** Ya descartados o inciertos en el cerebro (BlueStacks bloqueado por SMS; DuoPlus/GeeLark ~USD 2/equipo; todo con costo). No se investigaron de nuevo.

## 6. Riesgos de baneo y de términos

- Los términos de WhatsApp para la app de consumo prohíben mensajería masiva o automática no autorizada y clientes no oficiales [FORO/BLOG, citan los términos] (https://www.privyr.com/blog/whatsapp-bans-automated-bulk-send/; https://dev.to/dipbhi/how-to-send-bulk-whatsapp-messages-without-getting-banned-the-compliance-first-approach-48na). **Wasender y cualquier opción QR están en esa zona gris por naturaleza**: el riesgo se reduce, no se elimina.
- Lo que más pesa según las guías: reportes y bloqueos de destinatarios, mandar a gente que no te conoce, mensajes idénticos, ráfagas, números nuevos con mucho volumen.
- Meta oficial tiene sus propias reglas: opt-in, plantillas aprobadas y calidad. La calidad baja baja el tope (link de messaging limits arriba).
- Regla de negocio ya vigente en el CRM: tope de 3 mensajes por persona, freno por respuesta < 1 %, texto al azar, ritmo humano. Sirven y se mantienen.

## 7. Buenas prácticas para no quemar números  [FORO/BLOG, sin cifras oficiales]

Meta no publica un calendario de calentamiento (https://help.superchat.com/en/articles/661504-best-practice-warming-up-your-whatsapp-number). Consenso de varias guías (Green API, Periskope, LetsBot y otras):
- **Calentar 7–14 días** antes de campañas: usarlo como una persona (chat, fotos, contactos que respondan), subir de a poco (https://green-api.com/en/docs/faq/warming-up-whatsapp-number/; https://docs.periskope.app/get-started/warmup-numbers).
- **Topes bajos por chip**, ejemplo orientativo: 20–40 conversaciones nuevas por día tras ~10 días; no pasar de unos cientos por día aun con chip maduro. Son números de proveedores, no de Meta.
- **Priorizar a quien ya interactuó** y a quien pidió el contacto; evitar listas frías.
- **Rotar** entre chips del mismo rubro, repartiendo el volumen, y **frenar el chip** ante señales (muchos fallidos, reportes). Tras un bloqueo, el calentamiento se reinicia.
- No conectar un chip nuevo en el mismo día que se compró; una IP estable por línea (proxy fijo si se usa).
- Mantener mensajes con valor y salida fácil («respondé BAJA»).
Para el CRM: tope por chip según días de vida (ya existe `limiteDiarioEfectivo` con calentamiento), rotación por rubro, y «semáforo» por chip (verde/amarillo/rojo) usando fallidos, respuestas y calidad.

## 8. Arquitectura recomendada

1. **Tabla `telefonos`** (o ampliar `wasender_lineas` y la de Meta con una vista común): chip, rubro, proveedor (Meta/Wasender), estado, `estado_at`, `vinculado_at`, `ultimo_abierto_at`, edad de calentamiento, tope, fallidos 24 h, responsable de zona. Sin números reales en documentos.
2. **Webhook de Wasender `session.status` / `qrcode.updated`** (ya recibido): al llegar `logged_out/expired/need_scan` → crear evento de caída, apagar envíos (ya hecho), pausar campañas de esa línea, avisar. Al llegar `connected` → cerrar el evento y ofrecer «prender envíos» (nunca se prende solo, regla vigente).
3. **Monitor de estado cada 5 minutos** (pg_cron + pg_net, mismo patrón del latido `0639`): recorre las líneas, pide estado a Wasender y a Meta, compara y registra cambios (por si el webhook se pierde). Para Meta: estado, calidad, token vencido, «sin acceso» (arregla el bug de Salud que decía «en orden»).
4. **Cola de reconexión** (`telefonos_reconexion`: id, línea, intentos, próximo intento, resultado): para `disconnected/connecting`, hasta 3 reintentos con espera creciente (1, 5, 15 min) usando `connect`/`restart`; al agotarse, escalar a persona. Todo idempotente y con registro.
5. **Alertas**: push a dispositivos (ya existe `sendToDevices`; falta activar uno), y WhatsApp **a la responsable** por una línea oficial de Meta que esté sana (plantilla de utilidad aprobada, sin costo salvo el de plantilla); resumen diario de chips y recordatorio «día 10: abrir WhatsApp en estos chips». Evitar avisar por una línea caída.
6. **Pantalla «Teléfonos»** en el panel (visible solo al dueño, cada rubro separado): tarjeta por chip con estado, edad, tope, último mensaje; botón **Reconectar** → modal con QR en vivo (actualizado por `qrcode.updated`) o código por número; cierre automático al conectar; botón «Prender envíos». Filtros por rubro y por estado. Una vista «hoy qué atender» con los rojos arriba.
7. **Seguridad**: claves solo en Vercel; el QR nunca se guarda; acciones registradas en auditoría; rutas con `requireSession`; Preview comparte base (probar con cuidado, ver `recibirAqui`).
8. **Kit de escritorio opcional**: scrcpy en la PC del dueño para ver los 13 celulares y tocar «vincular dispositivo» cuando haga falta (mantenimiento, no automatización).

## 9. Etapas y esfuerzo (estimado, una persona de ingeniería senior)

| Etapa | Qué incluye | Esfuerzo |
|---|---|---|
| 0 · Destrabar hoy | Arreglar «Sin acceso» de Marketing en Meta (token/permiso); escanear QR de Wasender; activar un dispositivo para avisos; corregir el bug de Salud | 0,5–1 día (+ la persona para el QR) |
| 1 · Visibilidad | Tabla/vista de chips, pantalla «Teléfonos» de solo lectura, estado de Meta y Wasender juntos | 2–3 días |
| 2 · Monitor + alertas | pg_cron cada 5 min, registro de cambios, push y resumen diario, recordatorio de 14 días | 2–3 días |
| 3 · Reconectar en 1 toque | Modal con QR en vivo y código, detección por webhook, «prender envíos» | 2–3 días |
| 4 · Reintento automático | Cola con reintentos para `disconnected/connecting`, escalado a persona | 2 días |
| 5 · Protección de chips | Semáforo por chip, topes por edad, rotación sugerida, frenos por señales | 3–4 días |
| 6 · Evaluación de alternativas | Medir Wasender un mes; decidir si sumar líneas Meta/coexistencia; probar Evolution/WAHA solo si hace falta | 1–2 días de análisis |

Las etapas 1–3 resuelven el pedido («avisar y reconectar en un toque»). Las pruebas deben distinguir especificado, implementado, probado, publicado y habilitado, como pide el CLAUDE.md. Migraciones repetibles, con RLS, sin borrados, documentadas en `docs/etapaN/`.

## 10. Lo que NO se pudo confirmar

- Valores exactos de límite de tasa de Wasender por plan y si `account_protection` agrega pausas o reconexión.
- Si Wasender reintenta reconectar por su cuenta (no está documentado).
- Disponibilidad de coexistencia para números argentinos y su detalle en la documentación de Meta.
- La duración típica de una sesión sana: no hay cifra oficial; solo los plazos de 14 y 30 días de WhatsApp.
- Cifras de calentamiento y topes: salen de proveedores, no de Meta.
