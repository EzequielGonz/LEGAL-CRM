# Setup del proyecto

## 1. Requisitos

- Node.js 20+
- Una cuenta de Supabase (ya existente según lo indicado)
- Una cuenta de Google con API key de Gemini (para el agente IA) — se
  consigue gratis en https://aistudio.google.com/app/apikey, sin tarjeta
- Acceso a Meta for Developers para configurar WhatsApp Cloud API,
  Instagram Messaging y Facebook Messenger (ver `docs/META_API.md`)

> Nota: este proyecto se generó en un entorno sin acceso al registro de npm,
> así que las dependencias nunca se instalaron ni se corrió `next build` acá.
> El código está escrito a mano siguiendo las convenciones estándar de
> Next.js 14 (App Router) + Supabase, pero el primer paso en tu entorno real
> tiene que ser instalar dependencias y correr el build para confirmar que
> compila antes de tocar nada más.

## 2. Instalación

```bash
npm install
cp .env.example .env.local
# completar .env.local con las credenciales reales
npm run dev
```

## 3. Base de datos (Supabase)

Correr las migraciones en orden contra tu proyecto de Supabase (SQL Editor o
`supabase db push` si usás la CLI):

1. `supabase/migrations/0001_init.sql` — esquema completo (tablas, enums,
   seed de canales/agentes IA/disponibilidad por defecto).
2. `supabase/migrations/0002_rls.sql` — políticas de Row Level Security.

Después creá al menos un usuario admin desde Supabase Auth (Authentication →
Users → Add user) y agregale su fila en `admin_profiles`:

```sql
insert into admin_profiles (id, full_name, role)
values ('<uuid-del-usuario>', 'Nombre del admin', 'admin');
```

Ese admin ya puede loguearse en `/login` con ese email/contraseña.

## 4. Variables de entorno

Ver `.env.example` para la lista completa. Resumen de qué es cada grupo:

- **Supabase**: URL, anon key y service role key del proyecto ya existente.
- **Google Gemini**: API key y modelo a usar para el agente IA (nivel
  gratuito disponible, no requiere tarjeta para empezar).
- **WhatsApp Cloud API** (Civil y Penal): credenciales de cada línea, más un
  `WHATSAPP_VERIFY_TOKEN` propio que vos elegís (ver `docs/META_API.md`).
- **Meta (Instagram/Facebook)**: credenciales de la app de Meta y de cada
  página/cuenta de Instagram.
- **ADMIN_WHATSAPP_PHONE**: el teléfono que recibe la notificación de "nuevo
  cliente agendado".
- **CRON_SECRET**: secreto propio que protege `/api/campaigns/tick`, el
  endpoint que hace avanzar el envío de campañas (ver sección 6.1).

## 5. Cómo probar el flujo completo sin esperar tráfico real

1. Cargá algún prospecto de prueba desde el SQL editor o insertando
   directamente en `contacts`/`conversations`/`messages`.
2. Llamá a `POST /api/agent/process` con `{ "conversation_id": "..." }` para
   que el agente IA responda como si acabara de recibir un mensaje.
3. Revisá en el panel (`/inbox`) que la respuesta y los datos recopilados
   aparezcan correctamente.
4. Probá `/landing` para confirmar que el formulario crea el prospecto.
5. Entrá a la ficha de un prospecto (`/prospectos/<id>`) para probar el CRM:
   corregir sus datos, cambiar el estado a mano, derivarlo a un estudio
   jurídico, agregar una nota interna, o agendarle/cancelarle una cita
   manualmente sin pasar por el agente IA.
6. Para probar campañas: creá una campaña de prueba, subí un CSV con tu
   propio número de WhatsApp, y lanzala — vas a recibir la plantilla en tu
   teléfono. Cuando respondas ese WhatsApp, el agente IA ya sabe que venís de
   esa campaña (te va a preguntar primero si tu situación sigue vigente o ya
   la resolviste) y no te vuelve a pedir datos que ya tengas cargados
   (nombre, DNI/CUIL, lo que hayas contestado antes).

## 6. Despliegue

El servidor ya existente puede alojar esta app Next.js (por ejemplo con
`npm run build && npm run start` detrás de un proceso administrado con pm2,
o como contenedor Docker). Los webhooks de Meta necesitan una URL pública
HTTPS, así que el dominio del servidor tiene que estar accesible desde
internet en las rutas:

- `https://tu-dominio.com/api/webhooks/whatsapp`
- `https://tu-dominio.com/api/webhooks/meta`
- `https://tu-dominio.com/api/landing` (usado por el formulario de `/landing`)

### 6.1 Cron para el envío de campañas

Las campañas mandan sus mensajes en segundo plano, "a pasos": el endpoint
`POST /api/campaigns/tick` manda como máximo 1 mensaje por campaña activa
cada vez que se lo llama, respetando el ritmo configurado (por defecto: 1
mensaje nuevo cada 90s, en lotes de 10, con 5 minutos de pausa entre lote y
lote). Alguien tiene que llamar a ese endpoint repetidamente.

**Usamos `pg_cron` + `pg_net` de Supabase** (ya habilitados en el proyecto)
en vez de Vercel Cron (que en el plan gratuito solo permite 1 ejecución por
día, no por minuto — habilitar cron por minuto requiere Vercel Pro, de
pago) o de un servicio externo de terceros. Con esto, el propio Supabase
—que ya estás pagando/usando igual— llama al endpoint cada 1 minuto, sin
depender de ningún servicio ni tarjeta adicional. Ya está configurado; el
job se llama `campaigns-tick` y corre cada minuto. Para revisarlo o
cambiarlo:

```sql
-- Ver el job y su estado
select * from cron.job where jobname = 'campaigns-tick';

-- Ver el historial de ejecuciones (éxito/error de cada llamada)
select * from cron.job_run_details
  where jobid = (select jobid from cron.job where jobname = 'campaigns-tick')
  order by start_time desc limit 20;

-- Pausar el job
select cron.unschedule('campaigns-tick');

-- Volver a crearlo (por ejemplo si cambia el dominio o el CRON_SECRET)
select cron.schedule(
  'campaigns-tick',
  '* * * * *',
  $$select net.http_post(
      url := 'https://TU-DOMINIO.vercel.app/api/campaigns/tick',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer TU_CRON_SECRET"}'::jsonb,
      body := '{}'::jsonb
    );$$
);
```

Con esto anda solo: mientras una campaña esté "en_curso", cada minuto el
cron pasa a golpear el endpoint, y el endpoint manda el próximo mensaje
solo cuando ya pasó el tiempo de espera configurado. No hace falta dejar el
panel abierto ni el navegador prendido, ni pagar Vercel Pro ni un cron
externo.

*(Alternativa si en algún momento se quiere sacar la dependencia de
Supabase para esto: cualquier servicio de cron externo gratuito, como
cron-job.org, apuntando por GET o POST a
`https://tu-dominio.com/api/campaigns/tick?secret=TU_CRON_SECRET` cada 1
minuto, funciona exactamente igual — el endpoint no le importa quién lo
llama, solo que traiga el secreto correcto.)*

## 7. Limitaciones conocidas de este MVP (próximos pasos sugeridos)

- **Importación de bases**: procesa las filas una por una dentro de la misma
  request HTTP, por eso hay un tope de 5000 filas por archivo (`/api/bases`).
  Para bases más grandes conviene dividir el archivo o mover el
  procesamiento a un job en background.
- **Normalización de teléfonos argentinos** (`src/lib/phone.ts`): cubre con
  confianza los casos más comunes (formato internacional, local con/sin 0, y
  el "15" de CABA/GBA). Para otros códigos de área que también insertan "15"
  en el discado local no hay una regla genérica segura, así que esas filas
  quedan marcadas como "revisar" en el reporte de importación en vez de
  arriesgar un número mal armado — conviene revisarlas a mano antes de
  lanzar una campaña con esos contactos.
- El agente IA solo procesa mensajes de texto (no audio, imágenes ni
  documentos todavía).
- El estado "entregado/leído" de WhatsApp (`statuses` en el webhook) se
  recibe pero no se está pisando todavía sobre `campaign_contacts` — está
  dejado como comentario en el webhook para resolverlo guardando el
  `external_message_id` al enviar cada plantilla de campaña.
- El calendario de contenido de redes queda fuera de este sistema a
  propósito (ver `docs/CONTENIDO_REDES.md`) — se resuelve con una
  herramienta externa.
- No hay todavía manejo de roles/permisos entre distintos administradores
  (todo admin ve todo). Si más adelante hay varios estudios con acceso
  parcial, hay que sumar una capa de permisos por estudio/área.
