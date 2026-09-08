# Configurar las APIs oficiales de Meta (WhatsApp, Instagram, Facebook)

Esta guía asume que ya existen las 2 líneas de WhatsApp, las 2 páginas de
Facebook y las 2 cuentas de Instagram (deben ser cuentas Business/Creator
vinculadas a su página de Facebook correspondiente para poder usar la API).

## 1. Crear la app de Meta

1. Entrar a [developers.facebook.com](https://developers.facebook.com/) →
   **My Apps → Create App**.
2. Elegir el caso de uso **"Connect with customers through WhatsApp"** (esto
   habilita WhatsApp; Instagram/Messenger se agregan como productos aparte
   en el mismo panel de la app).
3. Alcanza con **una sola app de Meta** para las dos áreas: dentro de la
   misma app se pueden conectar los 2 números de WhatsApp (si ambos están en
   la misma Business Manager) y las 2 páginas de Facebook/Instagram. Si las
   líneas Civil y Penal viven en Business Managers distintas, hay que crear
   una app por Business Manager — el código de este proyecto ya soporta
   ambos casos porque las credenciales de cada línea son variables de
   entorno separadas.

## 2. WhatsApp Cloud API (líneas Civil y Penal)

Por cada número:

1. En el panel de la app → **WhatsApp → API Setup**, seleccioná (o agregá)
   el número de teléfono correspondiente.
2. Copiá el **Phone number ID** → va en `WHATSAPP_CIVIL_PHONE_NUMBER_ID` o
   `WHATSAPP_PENAL_PHONE_NUMBER_ID`.
3. Generá un **token permanente**: Business Settings → Users → System Users
   → crear un system user con rol Admin, asignarle la app y el WhatsApp
   Business Account, y generar un token sin vencimiento con los permisos
   `whatsapp_business_messaging` y `whatsapp_business_management`. Ese token
   va en `WHATSAPP_CIVIL_ACCESS_TOKEN` / `WHATSAPP_PENAL_ACCESS_TOKEN`.
4. En **WhatsApp → Configuration → Webhook**:
   - Callback URL: `https://tu-dominio.com/api/webhooks/whatsapp`
   - Verify token: cualquier string que vos elijas — el mismo valor va en
     `WHATSAPP_VERIFY_TOKEN` en el `.env`.
   - Suscribirse al campo `messages` (y opcionalmente `message_template_status_update`
     para enterarte si rechazan una plantilla).
5. **Plantillas de mensaje** (necesarias para las campañas y para reabrir
   conversación fuera de la ventana de 24hs): Business Manager → WhatsApp
   Manager → Message Templates → crear la plantilla, mandarla a aprobar, y
   una vez aprobada usar ese mismo nombre en `message_template_name` al
   crear la campaña en el panel.

## 3. Instagram Messaging + Facebook Messenger (líneas Civil y Penal)

1. En el panel de la app → agregar el producto **Messenger** (cubre tanto
   Facebook Messenger como Instagram Direct, que comparten webhook).
2. Vincular cada página de Facebook y su cuenta de Instagram profesional
   asociada.
3. Generar el **Page Access Token** de cada página (Messenger → API Setup →
   Generate token, con permisos `pages_messaging`, `instagram_basic`,
   `instagram_manage_messages`, `pages_show_list`). Van en
   `FACEBOOK_CIVIL_PAGE_ACCESS_TOKEN` / `FACEBOOK_PENAL_PAGE_ACCESS_TOKEN`.
4. Anotar el **Page ID** de cada página (`FACEBOOK_CIVIL_PAGE_ID` /
   `FACEBOOK_PENAL_PAGE_ID`) y el **Instagram Business Account ID** de cada
   cuenta (`INSTAGRAM_CIVIL_BUSINESS_ID` / `INSTAGRAM_PENAL_BUSINESS_ID`) —
   ambos se ven en Meta Business Suite → Configuración, o vía Graph API
   Explorer (`GET /me/accounts` para páginas, y `GET /{page-id}?fields=instagram_business_account`).
5. En **Messenger → Configuration → Webhooks**:
   - Callback URL: `https://tu-dominio.com/api/webhooks/meta`
   - Verify token: el valor que pongas en `META_VERIFY_TOKEN`.
   - Suscribirse a `messages` para cada página conectada.

## 4. Revisión de la app (App Review)

Mientras la app esté en modo desarrollo, solo va a poder recibir mensajes de
usuarios con un rol asignado en la app (admin/developer/tester). Para operar
con clientes reales hay que pasar **App Review** de Meta solicitando los
permisos mencionados arriba (`whatsapp_business_messaging`,
`pages_messaging`, `instagram_manage_messages`, etc.), lo cual implica
describir el caso de uso y a veces grabar un video de demostración del flujo.
Conviene arrancar este trámite en paralelo mientras se prueba todo en modo
desarrollo con números de prueba propios.

## 5. Buenas prácticas para evitar bloqueos (WhatsApp)

- Nunca enviar mensajes masivos a números que no dieron ningún tipo de
  consentimiento previo — la campaña de la línea Civil está pensada para
  bases de prospectos/clientes ya conocidos por el estudio.
- Empezar el envío de campañas de a poco (calentamiento de número) y subir
  volumen gradualmente; el motor de campañas ya incluye una pausa entre
  envíos, pero el volumen diario también hay que subirlo de a poco.
- Vigilar la "calidad" del número en WhatsApp Manager (Quality Rating) y
  pausar la campaña si baja.
- Usar siempre plantillas aprobadas para iniciar conversación (nunca texto
  libre) y texto libre solo dentro de la ventana de 24hs post-respuesta del
  usuario — el código ya respeta esta distinción (`sendWhatsAppTemplate` vs
  `sendWhatsAppText`).
