# Sistema de Captación Legal — Civil / Penal

Panel central que automatiza CAPTAR → RESPONDER → CALIFICAR → AGENDAR →
CERRAR → INFORMAR para un negocio de captación de clientes de estudios
jurídicos, con dos líneas de negocio (Civil y Penal).

## Qué incluye este scaffold

- **Base de datos** (Supabase/Postgres): `supabase/migrations/` — contactos
  unificados con deduplicación entre canales, conversaciones y mensajes,
  agenda con disponibilidad configurable, campañas de WhatsApp, config. de
  agentes IA por área, notificaciones al admin, estudios jurídicos.
- **Panel** (Next.js App Router, `src/app/(dashboard)`): estadísticas,
  Inbox unificado con realtime, **CRM de prospectos** (ficha editable: datos
  de contacto, cambio manual de estado, derivación a un estudio jurídico,
  notas internas, agenda/cancelación manual de citas, y filtros de
  área/estado/búsqueda por nombre o teléfono), **bases** (importación de
  CSV/Excel con deduplicación y reporte, sin modificar el archivo original),
  agenda, campañas (creables directo desde una base o con carga de CSV
  suelta), configuración de agentes IA, canales y estudios.
- **Webhooks oficiales** (`src/app/api/webhooks`): WhatsApp Cloud API,
  Instagram/Facebook Messaging.
- **Landing page** (`/landing`): formulario Civil/Penal que crea el
  prospecto automáticamente.
- **Agente IA** (`src/lib/ai-agent`): un agente por área (Civil/Penal) que
  usa Google Gemini con function calling para responder, calificar, consultar disponibilidad
  y agendar, sin inventar información ni presentarse como abogado. Reconoce
  si el prospecto viene de una campaña (y arranca preguntando si su
  situación sigue vigente) y no vuelve a pedir datos que ya tiene cargados
  del contacto.
- **Motor de campañas** (`src/lib/campaigns.ts`): inicio de conversación con
  bases cargadas vía plantillas oficiales de WhatsApp, con velocidad de
  envío y límite diario configurables por campaña, y un embudo completo de
  estados (enviados/entregados/leídos/respondieron/calificados/agendados) en
  el detalle de cada una.
- **Notificación automática al admin** (`src/lib/notify.ts`): mensaje de
  WhatsApp con todos los datos cuando se agenda un cliente.

## Documentación

- [`docs/SETUP.md`](docs/SETUP.md) — instalación, variables de entorno, cómo
  probar el flujo completo, despliegue, limitaciones conocidas.
- [`docs/META_API.md`](docs/META_API.md) — paso a paso para configurar
  WhatsApp Cloud API, Instagram y Facebook Messaging con las 2 líneas.
- [`docs/CONTENIDO_REDES.md`](docs/CONTENIDO_REDES.md) — comparativa de
  herramientas externas para gestionar el contenido de las 4 cuentas.

## Importante antes de usar esto en producción

Este proyecto se escribió en un entorno sin acceso al registro de npm, así
que **nunca se corrió `npm install` ni `npm run build` acá**. Es código
completo y (a mi mejor entender) correcto, pero el primer paso real es
instalarlo y compilarlo en un entorno con acceso a internet — ver el punto 2
de `docs/SETUP.md` — y revisar los `TODO`/limitaciones listadas al final de
ese mismo documento antes de conectarlo a clientes reales.
