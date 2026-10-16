# Auditoría general del CRM · 16/10/2026

Alcance: código del repositorio (rama `main` + bloque 16/10), base de Supabase (solo lectura), Vercel (despliegues, variables por nombre, errores) y funcionamiento de punta a punta. No se descifró ninguna variable, no se escribió en la base de producción y no se envió ningún mensaje.

Evidencia: 144/144 pruebas unitarias; migraciones 0310 y 0311 aplicadas, repetidas y revertidas en Postgres 16 local; Preview de `bloque-1610` en estado READY (compila con el chequeo de tipos de Next); capturas de los cuatro temas; consultas de solo lectura del 16/10.

## 1. Estado operativo comprobado (16/10)

| Punto | Estado | Efecto |
|---|---|---|
| Pausa general (IA y envíos) | Activa desde el 9/10 | Correcto: es la decisión vigente |
| Agentes IA activos | 0 | Correcto con la pausa |
| Campañas en curso | 0 | Correcto con la pausa |
| Latido `campaigns-tick` (pg_cron) | **Inactivo** | No corre nada del servidor: informes, extracciones, análisis, seguimientos, campañas |
| Canales conectados | **0** | Ningún canal figura conectado |
| Último mensaje entrante | **1/10** | Desde entonces no entró nada procesado |
| Webhooks en cuarentena | 2, motivo «No hay secreto de la app configurado (META_APP_SECRET)» | La variable existe en Vercel pero el valor no llega (vacío o en otro entorno) |
| Migraciones 0310 y 0311 | No aplicadas | El código nuevo funciona igual: muestra «falta aplicar la migración» y no rompe |
| Errores de ejecución en Vercel (7 días) | Ninguno | — |

## 2. Hallazgos críticos (bloquean la operación)

1. **Webhooks sin secreto** (`META_APP_SECRET`). Todo mensaje entrante queda en cuarentena: aunque se levante la pausa, nadie recibe respuestas. Revisar que la variable tenga valor en Production y redeplegar.
2. **Latido apagado**. Sin `campaigns-tick` no hay informes del día 7/14/21/28, extracciones, seguimientos ni campañas. Activarlo no envía nada mientras la pausa siga puesta.
3. **Canales, plantillas y asignaciones vacías**. No hay `profile_lines`, `whatsapp_templates` ni `template_assignments`. Ninguna campaña puede salir aunque se habilite.
4. **Perfil de Marketing incompleto**. Nombre de presentación y marca vacíos y `brand_briefs` en 0 (falta el SQL 14). Con esto el agente de Marketing no responde (la comprobación de preparación lo frena).

## 3. Infraestructura

- **Vercel Hobby**: logs de 1 hora, términos de uso no comerciales y límites de funciones. Recomiendo **Pro** antes de operar (decisión de ustedes; tiene costo).
- **Variables faltantes**:
  - `GCP_*` y `GCP_BUCKET`, para el ajuste de C.
  - `VAPID_*`, sin las cuales no funcionan los avisos push.
  - `SESSION_SECRET`, que hoy cae en la clave de servicio: conviene separarla.
  - WhatsApp de Autos y Coberturas.
- `WHATSAPP_MARKETING_*` está solo en Production: en la Preview no hay línea, lo cual está bien para mirar sin efectos.
- El latido acepta `?secret=` en la URL. Recomiendo aceptar solo el encabezado, porque la URL queda en los registros.

## 4. Base de datos (asesores de Supabase y datos)

- **64 claves foráneas sin índice**. Prioridad: `campaign_contacts.contact_id`, `followup_tasks`, `appointments` y `contacts`. Propuesta abajo.
- `pg_net` está en el esquema `public`.
- La protección contra contraseñas filtradas está apagada.
- Hay esquemas de respaldo con tablas sin clave primaria.
- **Datos**:
  - 4266 oportunidades, todas de Jurídico; 2656 sin conversación.
  - La campaña pausada tiene 725 pendientes y 190 enviados.
  - Hay 38 conversaciones con la IA apagada y detenciones vigentes.
  - Esto es coherente con la pausa, pero conviene revisarlo antes de reanudar.

## 5. Código: corregido en este bloque

| Bug | Impacto | Corrección |
|---|---|---|
| El agente leía los **primeros** 30 mensajes de la conversación | En charlas largas respondía sin ver lo último | Toma los últimos 30 y los ordena |
| Webhooks con la duración por defecto | El turno del agente (herramientas + IA) podía cortarse | `maxDuration = 60` en WhatsApp y Meta |
| Marketing: un «captado» que vuelve a escribir pasaba a humano | El flujo de presupuesto (captado → enviar → cerrar) quedaba trabado | Si está en presupuesto pedido o enviado, la IA sigue |
| La apertura vieja afirmaba «Analizamos tu negocio» | Contradice la apertura genérica nueva | Se omite para las bases de «Extraer negocios» |

## 6. Código: pendientes encontrados (no corregidos, propuestos)

1. **Ficha e Inbox de perfiles no jurídicos**. La ficha ya toma el tema del perfil, pero la conversación abierta desde el Inbox general sigue en el marco de Jurídico. Propuesta: resolver el perfil desde `rubro_id` en `ficha/[id]` e `inbox/[id]` y usar `MarcoPerfil`.
2. **Textos que afirman investigación previa**. Hay que revisar las plantillas viejas `mkt_prospeccion*` y el prompt de `ai_agents` de Marketing. El prompt no contiene «analiz»: hay que leerlo entero antes de reactivar.
3. **Corpus de C**. Son 70 conversaciones reales y son respuestas del bot actual: entrenar C solo con eso lo hace parecido a A. Hay que sumar los casos semilla revisados, que hoy no se exportan porque están en «revisión pendiente» y tienen claves repetidas. Sin eso, el ajuste pago aporta poco.
4. **Seguimientos después de captar**. Pueden quedar tareas de seguimiento vivas: cancelarlas al registrar la captación.
5. **Análisis interrumpido de una base extraída**. Si el análisis profundo se corta, el lead vuelve a «pendiente» y el latido lo analiza sin investigación web. No contacta a nadie, pero gasta IA: conviene devolverlo a «no iniciado».
6. **Tipos del PIN**. Los tipos nuevos de evento se pasan con `as any`: sumarlos al tipo de `access_events`.
7. **Tipos de la base desactualizados**. `database.types.ts` no incluye las tablas de las etapas 2 y 3, y se usa el cliente sin tipos. Propuesta: regenerar los tipos después de aplicar 0310 y 0311.

## 7. Mejoras propuestas, en orden

| # | Mejora | Esfuerzo | Por qué |
|---|---|---|---|
| 1 | Corregir `META_APP_SECRET`, activar el latido y cargar líneas, plantillas y asignaciones | Bajo (configuración) | Sin esto no hay operación |
| 2 | Aplicar 0310, 0311 y SQL 14; completar el perfil de Marketing | Bajo | Habilita Comparación de agentes, Extraer negocios y Pide presupuesto |
| 3 | Pasar Vercel a Pro | Costo mensual | Logs, límites y uso comercial |
| 4 | Índices para las FK más usadas (abajo) | Bajo | Consultas del Inbox y de campañas más rápidas |
| 5 | Ficha e Inbox con el marco del perfil (6.1) | Medio | Coherencia visual pedida |
| 6 | Revisar el prompt y las plantillas viejas de Marketing (6.2) | Bajo | Que no se afirme investigación |
| 7 | Exportar los casos semilla al corpus antes del ajuste de C (6.3) | Medio | Que el gasto de USD 30 tenga sentido |
| 8 | Latido solo con encabezado; `SESSION_SECRET` propio; protección de contraseñas | Bajo | Seguridad |
| 9 | Regenerar los tipos de la base y quitar los `as any` | Medio | Menos errores silenciosos |
| 10 | Tablero de salud (latido, cuarentena, canales, último entrante) en Configuración | Medio | Que un problema como el del secreto se vea el mismo día |

Índices propuestos (SQL para el programador; repetible):

```sql
create index if not exists campaign_contacts_contact_idx on public.campaign_contacts (contact_id);
create index if not exists followup_tasks_contact_idx on public.followup_tasks (contact_id);
create index if not exists appointments_contact_idx on public.appointments (contact_id);
create index if not exists contacts_imported_base_idx on public.contacts (imported_base_id);
```
