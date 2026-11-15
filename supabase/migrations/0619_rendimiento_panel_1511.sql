-- 0619 · Rendimiento del panel (15/11). Solo velocidad: no cambia datos ni cifras.
--
-- 1) personas_que_escribieron(areas, desde): cuenta en la base las personas
--    distintas que escribieron (antes la app traía los mensajes entrantes de a
--    1000 filas, en serie, y los contaba en memoria). Misma definición que la
--    lectura anterior: mensajes con direction = 'entrante', created_at >= desde,
--    de conversaciones de esas áreas; cuenta contactos distintos (si una
--    conversación no tuviera contacto, cuenta la conversación). Única
--    diferencia: la lectura anterior se cortaba a los 50.000 mensajes; esta no.
--    La app usa la lectura anterior si la función todavía no existe.
-- 2) cifras_prospectos_por_base(rubro, bases): las cinco cifras de cada base
--    de /prospectos-por-base (y de «sin base», fila con base_id nulo) en una
--    sola pasada. Antes eran cinco conteos por base (65 consultas con 12
--    bases). Mismas condiciones que los conteos de la página. Una base sin
--    oportunidades no devuelve fila (la página la muestra en cero, como antes).
-- 3) Índices para las cifras de /perfiles, «En vivo», salud, prospectos, el chat y el inbox.
--    Van sin CONCURRENTLY porque la migración corre en una transacción; en
--    tablas grandes conviene aplicarla en un momento tranquilo (cada índice
--    bloquea escrituras en su tabla mientras se construye).
--
-- Repetible sin error (create or replace / if not exists). No borra nada.
-- Para volver atrás: drop function public.personas_que_escribieron(text[], timestamptz),
-- drop function public.cifras_prospectos_por_base(uuid, uuid[]) y drop index if exists
-- de cada índice de abajo (la app vuelve sola a la lectura anterior).

create or replace function public.personas_que_escribieron(p_areas text[], p_desde timestamptz)
returns bigint
language sql
stable
-- La llama solo el servidor con la clave de servicio (que ya lee todo): no hace falta security definer.
security invoker
set search_path to ''
as $function$
  select count(distinct coalesce(c.contact_id, c.id))
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
   where m.direction = 'entrante'
     and m.created_at >= p_desde
     and c.area::text = any (p_areas)
$function$;

revoke all on function public.personas_que_escribieron(text[], timestamptz) from public, anon, authenticated;
grant execute on function public.personas_que_escribieron(text[], timestamptz) to service_role;

create or replace function public.cifras_prospectos_por_base(p_rubro uuid, p_bases uuid[])
returns table (base_id uuid, total bigint, sin_contactar bigint, sin_respuesta bigint, respondieron bigint, captados bigint)
language sql
stable
security invoker
set search_path to ''
as $function$
  select o.imported_base_id,
         count(*),
         count(*) filter (where o.contact_state = 'sin_contactar'),
         count(*) filter (where o.contact_state = 'contactado_sin_respuesta'),
         count(*) filter (where o.contact_state = 'respondio'),
         count(*) filter (where o.capture_state = 'captado')
    from public.opportunities o
   where o.rubro_id = p_rubro
     and (o.imported_base_id = any (p_bases) or o.imported_base_id is null)
   group by o.imported_base_id
$function$;

revoke all on function public.cifras_prospectos_por_base(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.cifras_prospectos_por_base(uuid, uuid[]) to service_role;

-- Mensajes entrantes por fecha (personas que escribieron, «En vivo», 24 h).
create index if not exists messages_entrantes_created_idx
  on public.messages (created_at) include (conversation_id)
  where direction = 'entrante';

-- Respuestas del bot por fecha («En vivo»).
create index if not exists messages_bot_salientes_created_idx
  on public.messages (created_at) include (conversation_id)
  where direction = 'saliente' and sender_type = 'agente_ia';

-- Mensajes que no salieron en las últimas 24 h (Fallas del sistema en /salud).
create index if not exists messages_salientes_fallidos_created_idx
  on public.messages (created_at) include (conversation_id)
  where direction = 'saliente' and delivery_status = 'fallido';

-- Envíos por campaña, estado y fecha («En vivo»: enviados, entregados, leídos, fallidos).
create index if not exists campaign_contacts_campaign_status_sent_idx
  on public.campaign_contacts (campaign_id, status, sent_at);

-- Captados de la semana / de hoy y últimos captados de cada perfil.
create index if not exists opportunities_rubro_captados_idx
  on public.opportunities (rubro_id, captured_at desc)
  where capture_state = 'captado';

-- Derivados por fecha.
create index if not exists opportunities_rubro_derivados_idx
  on public.opportunities (rubro_id, derived_at)
  where derivation_state = 'derivado';

-- Listas por actividad reciente (atención, piden una persona, salud).
create index if not exists opportunities_rubro_updated_idx
  on public.opportunities (rubro_id, updated_at desc);

-- Oportunidades por base cargada (/prospectos-por-base y la última base de /perfiles).
create index if not exists opportunities_rubro_base_idx
  on public.opportunities (rubro_id, imported_base_id);

-- Inbox por área ordenado por último mensaje.
create index if not exists conversations_area_last_message_idx
  on public.conversations (area, last_message_at desc);
