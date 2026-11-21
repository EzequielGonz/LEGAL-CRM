# Punto de control · 17/10/2026 (plantillas enviadas a revisión)

- Rediseño cerrado: `main` incluye bloques 1–4 (PR #17, `991c871`). Bloque 5 y pruebas de navegador omitidos por decisión de la responsable.
- Credenciales de WhatsApp de los 4 rubros cargadas en Vercel; webhooks aplicados en Meta (confirmado por la responsable).
- Plantillas: las 33 del Excel coinciden con `docs/plantillas/` y `src/lib/plantillas/propuestas.ts` (Jurídico 9, Coberturas 8, Autos 0 km 8, Marketing 8).
- PR #18 FUSIONADO (`fb6688f`): botón «Enviar desde <línea>» + `POST /api/plantillas/enviar-a-meta` (vista previa, confirmación, omite existentes, no envía mensajes a personas).
- **Envío a revisión de Meta: hecho por la responsable en los 4 perfiles (17/10).** Civil 9 y 0 km 8 confirmados por el panel; Marketing confirmado con 9 plantillas en la cuenta (8 propuestas + `hello_world`, a verificar); Coberturas informado por la responsable, sin captura de verificación.
- Líneas registradas en el panel: Civil, Agencia 0 km (prefijo `WHATSAPP_AGENCIA_0KM`), y las de Coberturas y Marketing asignadas por la responsable. Penal diferido.
- Marketing: el primer envío real devolvió «No se pudo enviar.» sin detalle (probable corte por tiempo); tras releer, la cuenta quedó con las plantillas. Causa no confirmada.
- Pendiente: lectura final de estados (aprobadas/rechazadas) en los 4 perfiles tras la revisión de Meta (minutos a 24 h); corregir las rechazadas. Despliegue de producción de `fb6688f` no verificado desde la sesión. Rotar secretos pegados en el chat.
- Campañas pausadas, sin envíos ni cambios operativos. Revisar que «Campañas» no quede tildado en líneas nuevas si se quiere conservador.
