-- =====================================================================
-- Etapa 1 · Envíos seguros (2/2)
--
-- A) Campañas: una sola ejecución por campaña y una sola por destinatario.
--    * Bloqueo por campaña con vencimiento (campaign_tick_lock): dos ticks
--      simultáneos no procesan la misma campaña a la vez (respeta el ritmo).
--    * Reserva atómica del destinatario (campaign_claim_next /
--      campaign_claim_recipient): pendiente → enviando en una sola
--      sentencia con FOR UPDATE SKIP LOCKED. Dos ejecuciones nunca toman el
--      mismo destinatario.
--    * Marca de inicio (campaign_mark_sending) justo antes de llamar a
--      Meta, y cierre con el resultado (campaign_finish_send) solo por quien
--      tiene la reserva.
--    * Recuperación (campaign_recover_stale): una reserva vencida SIN marca
--      de inicio vuelve a la cola (Meta nunca se llamó); CON marca de inicio
--      pasa a 'revisar' (no se sabe si Meta lo aceptó): no se reenvía sola.
--    * Acciones de revisión (campaign_review_action): reintentar o descartar;
--      reintentar un caso incierto exige confirmación expresa.
-- B) Conversaciones: compuerta atómica antes de cualquier salida automática.
--    * claim_ai_send: con la fila de la conversación bloqueada, verifica la
--      pausa general (solo un false explícito la levanta) y que el chat no
--      esté tomado por una persona. Un acuse final solo sale con el
--      permiso de un solo uso que otorga grant_ai_final_ack.
--    * claim_manual_send: el envío manual pausa el chat ANTES de enviar y
--      anula cualquier acuse pendiente de la IA.
-- C) campaign_metrics: "enviados" cuenta solo lo que salió; se informan
--    aparte los destinatarios en envío y a revisar.
-- Solo agrega columnas y funciones; reemplaza campaign_metrics. No envía nada.
-- =====================================================================

set lock_timeout = '5s';

-- ---------------------------------------------------------------------
-- A) Campañas
-- ---------------------------------------------------------------------
alter table public.campaign_contacts add column if not exists claim_token uuid;
alter table public.campaign_contacts add column if not exists claimed_at timestamptz;
alter table public.campaign_contacts add column if not exists send_started_at timestamptz;
-- Cantidad de llamadas reales a Meta para este destinatario.
alter table public.campaign_contacts add column if not exists attempts integer not null default 0;
alter table public.campaign_contacts add column if not exists send_uncertain boolean not null default false;
alter table public.campaign_contacts add column if not exists review_reason text;

create index if not exists campaign_contacts_queue_idx
  on public.campaign_contacts (campaign_id, priority, queued_at) where status = 'pendiente';
create index if not exists campaign_contacts_claimed_idx
  on public.campaign_contacts (campaign_id, claimed_at) where status = 'enviando';

alter table public.campaigns add column if not exists tick_lock_token uuid;
alter table public.campaigns add column if not exists tick_lock_until timestamptz;

-- Bloqueo por campaña: lo obtiene una sola ejecución; vence solo si la
-- ejecución se corta.
create or replace function public.campaign_tick_lock(p_campaign uuid, p_token uuid, p_seconds integer default 120)
returns boolean
language plpgsql
set search_path = public
as $$
begin
  update public.campaigns
     set tick_lock_token = p_token,
         tick_lock_until = now() + make_interval(secs => greatest(p_seconds, 10))
   where id = p_campaign
     and (tick_lock_until is null or tick_lock_until < now() or tick_lock_token = p_token);
  return found;
end $$;

create or replace function public.campaign_tick_unlock(p_campaign uuid, p_token uuid)
returns void
language sql
set search_path = public
as $$
  update public.campaigns set tick_lock_token = null, tick_lock_until = null
   where id = p_campaign and tick_lock_token = p_token;
$$;

-- Reservas vencidas: sin marca de inicio vuelven a la cola; con marca, a revisión.
create or replace function public.campaign_recover_stale(p_campaign uuid, p_lease_seconds integer default 600)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_released integer;
  v_review integer;
begin
  -- Meta nunca se llamó: no cuenta como intento.
  update public.campaign_contacts
     set status = 'pendiente', claim_token = null, claimed_at = null, attempts = greatest(attempts - 1, 0)
   where campaign_id = p_campaign and status = 'enviando' and send_started_at is null
     and claimed_at < now() - make_interval(secs => p_lease_seconds);
  get diagnostics v_released = row_count;

  update public.campaign_contacts
     set status = 'revisar', claim_token = null, send_uncertain = true,
         review_reason = 'La ejecución se cortó después de empezar el envío: no se sabe si Meta aceptó el mensaje. No se reenvía solo.'
   where campaign_id = p_campaign and status = 'enviando' and send_started_at is not null
     and claimed_at < now() - make_interval(secs => p_lease_seconds);
  get diagnostics v_review = row_count;

  return jsonb_build_object('liberados', v_released, 'a_revisar', v_review);
end $$;

-- Reserva atómica del próximo destinatario en el orden de la cola.
create or replace function public.campaign_claim_next(p_campaign uuid, p_token uuid)
returns table (id uuid, contact_id uuid, full_name text, phone text, attempts integer)
language sql
set search_path = public
as $$
  with next as (
    select cc.id
      from public.campaign_contacts cc
     where cc.campaign_id = p_campaign and cc.status = 'pendiente'
     order by cc.priority asc, cc.queued_at asc, cc.id
     limit 1
     for update skip locked
  ), upd as (
    update public.campaign_contacts cc
       set status = 'enviando', claim_token = p_token, claimed_at = now(),
           send_started_at = null, attempts = cc.attempts + 1
      from next
     where cc.id = next.id
    returning cc.id, cc.contact_id, cc.attempts
  )
  select upd.id, upd.contact_id, c.full_name, c.phone, upd.attempts
    from upd join public.contacts c on c.id = upd.contact_id;
$$;

-- Reserva atómica de un destinatario puntual (Marketing elige al mejor lead).
create or replace function public.campaign_claim_recipient(p_campaign_contact uuid, p_token uuid)
returns table (id uuid, contact_id uuid, full_name text, phone text, attempts integer)
language sql
set search_path = public
as $$
  with upd as (
    update public.campaign_contacts cc
       set status = 'enviando', claim_token = p_token, claimed_at = now(),
           send_started_at = null, attempts = cc.attempts + 1
     where cc.id = p_campaign_contact and cc.status = 'pendiente'
    returning cc.id, cc.contact_id, cc.attempts
  )
  select upd.id, upd.contact_id, c.full_name, c.phone, upd.attempts
    from upd join public.contacts c on c.id = upd.contact_id;
$$;

-- Marca de inicio: justo antes de llamar a Meta, y solo con la reserva vigente.
create or replace function public.campaign_mark_sending(p_campaign_contact uuid, p_token uuid)
returns boolean
language plpgsql
set search_path = public
as $$
begin
  update public.campaign_contacts
     set send_started_at = now()
   where id = p_campaign_contact and claim_token = p_token and status = 'enviando' and send_started_at is null;
  return found;
end $$;

-- Cierre con el resultado: solo quien tiene la reserva puede cerrarla.
create or replace function public.campaign_finish_send(
  p_campaign_contact uuid,
  p_token uuid,
  p_status text,
  p_message_id text default null,
  p_error text default null,
  p_uncertain boolean default false
)
returns boolean
language plpgsql
set search_path = public
as $$
begin
  if p_status not in ('enviado', 'fallo', 'opt_out', 'pendiente', 'revisar') then
    raise exception 'Resultado de envío no válido: %', p_status;
  end if;
  update public.campaign_contacts
     set status = p_status::public.campaign_contact_status,
         claim_token = null,
         claimed_at = case when p_status = 'pendiente' then null else claimed_at end,
         send_started_at = case when p_status = 'pendiente' then null else send_started_at end,
         -- "attempts" cuenta las llamadas reales a Meta: si vuelve a la cola sin
         -- haber empezado el envío (pausa, campaña detenida), no cuenta.
         attempts = case when p_status = 'pendiente' and send_started_at is null then greatest(attempts - 1, 0) else attempts end,
         sent_at = case when p_status = 'enviado' then now() else sent_at end,
         message_id = case when p_status = 'enviado' then p_message_id else message_id end,
         error = case when p_status = 'enviado' then null else coalesce(p_error, error) end,
         review_reason = case when p_status = 'revisar' then p_error else null end,
         send_uncertain = case when p_status = 'revisar' then p_uncertain else false end
   where id = p_campaign_contact and claim_token = p_token and status = 'enviando';
  return found;
end $$;

-- Decisión de una persona sobre un destinatario a revisar.
create or replace function public.campaign_review_action(
  p_campaign_contact uuid,
  p_action text,
  p_confirm_uncertain boolean default false,
  p_note text default null
)
returns text
language plpgsql
set search_path = public
as $$
declare
  v_row public.campaign_contacts%rowtype;
begin
  select * into v_row from public.campaign_contacts where id = p_campaign_contact for update;
  if not found then return 'no_encontrado'; end if;
  if v_row.status <> 'revisar' then return 'no_esta_a_revisar'; end if;
  if p_action = 'reintentar' then
    if v_row.send_uncertain and not coalesce(p_confirm_uncertain, false) then
      return 'requiere_confirmacion';
    end if;
    update public.campaign_contacts
       set status = 'pendiente', claim_token = null, claimed_at = null, send_started_at = null,
           send_uncertain = false,
           review_reason = null,
           error = 'Vuelto a la cola por una persona' || coalesce(': ' || nullif(p_note, ''), '') || '. Antes: ' || coalesce(v_row.review_reason, v_row.error, '')
     where id = p_campaign_contact;
  elsif p_action = 'descartar' then
    update public.campaign_contacts
       set status = 'fallo', claim_token = null,
           error = 'Descartado por una persona' || coalesce(': ' || nullif(p_note, ''), '') || '. Antes: ' || coalesce(v_row.review_reason, v_row.error, '')
     where id = p_campaign_contact;
  else
    return 'accion_desconocida';
  end if;
  insert into public.ops_change_log (actor, action, target, before, after, note)
  values ('panel', 'revisar_destinatario', 'campaign_contacts:' || p_campaign_contact,
          jsonb_build_object('status', v_row.status, 'review_reason', v_row.review_reason, 'send_uncertain', v_row.send_uncertain),
          jsonb_build_object('accion', p_action), nullif(p_note, ''));
  return 'ok';
end $$;

-- ---------------------------------------------------------------------
-- B) Compuerta de salidas automáticas en las conversaciones
-- ---------------------------------------------------------------------
alter table public.conversations add column if not exists ai_ack_token uuid;
alter table public.conversations add column if not exists ai_ack_expires_at timestamptz;
alter table public.conversations add column if not exists human_takeover_at timestamptz;

-- Pausa general leída en la base con la misma regla que el código: solo un
-- false explícito la levanta (registro ausente o incompleto = en pausa).
create or replace function public.automation_pause_active(p_field text)
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(
    (select not (jsonb_typeof(s.value) = 'object' and s.value -> p_field = 'false'::jsonb)
       from public.system_settings s where s.key = 'automation_pause'),
    true);
$$;

-- Compuerta de la IA: se llama inmediatamente antes de enviar.
create or replace function public.claim_ai_send(p_conversation uuid, p_ack_token uuid default null)
returns text
language plpgsql
set search_path = public
as $$
declare
  v_conv record;
begin
  -- La fila de la conversación queda bloqueada: un envío manual simultáneo
  -- (claim_manual_send) espera a que esta verificación termine, o viceversa.
  select id, ai_enabled, ai_ack_token, ai_ack_expires_at
    into v_conv
    from public.conversations
   where id = p_conversation
   for update;
  if not found then return 'sin_conversacion'; end if;
  if public.automation_pause_active('ai_replies_paused') then return 'pausa_general'; end if;
  if p_ack_token is null then
    if not v_conv.ai_enabled then return 'chat_pausado'; end if;
    return 'ok';
  end if;
  -- Acuse final: solo con el permiso vigente de un solo uso.
  if v_conv.ai_ack_token is distinct from p_ack_token
     or v_conv.ai_ack_expires_at is null or v_conv.ai_ack_expires_at < now() then
    return 'acuse_no_autorizado';
  end if;
  update public.conversations set ai_ack_token = null, ai_ack_expires_at = null where id = p_conversation;
  return 'ok';
end $$;

-- Envío manual: el chat queda tomado por una persona ANTES de enviar y se
-- anula cualquier acuse pendiente de la IA.
create or replace function public.claim_manual_send(p_conversation uuid)
returns void
language sql
set search_path = public
as $$
  update public.conversations
     set ai_enabled = false,
         status = 'requiere_atencion_humana',
         ai_ack_token = null,
         ai_ack_expires_at = null,
         human_takeover_at = now()
   where id = p_conversation;
$$;

-- La IA deriva a una persona: pausa el chat y otorga UN permiso para el
-- acuse final de esa misma respuesta (vence a los p_minutes).
-- Si mientras la IA preparaba la respuesta una persona ya tomó el chat (la
-- IA quedó apagada), no se otorga permiso ni se cambia el estado: el
-- acuse no sale y no se pisa lo que decidió la persona.
create or replace function public.grant_ai_final_ack(
  p_conversation uuid,
  p_status public.conversation_status,
  p_intake_step text default null,
  p_minutes integer default 5
)
returns uuid
language sql
set search_path = public
as $$
  update public.conversations
     set ai_enabled = false,
         status = case when ai_enabled then p_status else status end,
         intake_step = case when ai_enabled then coalesce(p_intake_step, intake_step) else intake_step end,
         ai_ack_token = case when ai_enabled then gen_random_uuid() else null end,
         ai_ack_expires_at = case when ai_enabled then now() + make_interval(mins => greatest(p_minutes, 1)) else null end
   where id = p_conversation
  returning ai_ack_token;
$$;

-- ---------------------------------------------------------------------
-- C) Cifras de campaña: "enviados" cuenta solo lo que salió.
-- ---------------------------------------------------------------------
create or replace function public.campaign_metrics(p_campaign uuid)
returns jsonb
language sql
stable
set search_path to ''
as $function$
  with camp as (
    select c.id, c.area, c.last_sent_at from public.campaigns c where c.id = p_campaign
  ),
  cc as (
    select x.* from public.campaign_contacts x where x.campaign_id = p_campaign
  ),
  o as (
    select distinct on (op.contact_id) op.contact_id, op.capture_state, op.followup_state, op.contact_state
      from public.opportunities op
      join cc on cc.contact_id = op.contact_id
     order by op.contact_id, (op.campaign_id = p_campaign) desc nulls last, op.created_at desc
  ),
  conv as (
    select cv.id, cv.contact_id from public.conversations cv
      join cc on cc.contact_id = cv.contact_id
  ),
  salientes as (
    select count(*) n from public.messages m
     where m.direction = 'saliente' and m.duplicate_of is null
       and m.metadata->>'campaign_id' = p_campaign::text
  ),
  entrantes as (
    select count(*) n from public.messages m
      join conv on conv.id = m.conversation_id
      join cc on cc.contact_id = conv.contact_id
     where m.direction = 'entrante' and m.duplicate_of is null
       and cc.sent_at is not null and m.created_at >= cc.sent_at
  ),
  resp as (
    select count(*) n from cc
     where cc.status in ('respondio', 'opt_out') and (cc.sent_at is not null or cc.responded_at is not null)
        or cc.responded_at is not null
        or (cc.sent_at is not null and exists (
              select 1 from public.conversations cv
                join public.messages m on m.conversation_id = cv.id
               where cv.contact_id = cc.contact_id and m.direction = 'entrante'
                 and m.duplicate_of is null and m.created_at >= cc.sent_at))
  ),
  -- Salió: Meta lo aceptó (tiene envío registrado). Un detenido que no se
  -- envió no cuenta; tampoco lo que está en envío o a revisar.
  env as (
    select count(*) n from cc
     where cc.status::text in ('enviado', 'entregado', 'leido', 'respondio')
        or (cc.status::text = 'opt_out' and cc.sent_at is not null)
  )
  select case when not exists (select 1 from camp) then null else jsonb_build_object(
    'prospectos', (select count(*) from cc),
    'pendientes', (select count(*) from cc where status::text = 'pendiente'),
    'en_envio', (select count(*) from cc where status::text = 'enviando'),
    'a_revisar', (select count(*) from cc where status::text = 'revisar'),
    'enviados', (select n from env),
    'entregados', (select count(*) from cc where status::text in ('entregado', 'leido', 'respondio')),
    'leidos', (select count(*) from cc where status::text in ('leido', 'respondio')),
    'fallidos', (select count(*) from cc where status::text = 'fallo'),
    'mensajes_enviados', (select n from salientes),
    'respuestas', (select n from entrantes),
    'personas_responden', (select n from resp),
    'sin_respuesta', greatest((select n from env) - (select n from resp), 0),
    'en_seguimiento', (select count(*) from o where followup_state = 'activo'),
    'caidos', (select count(*) from o where followup_state = 'caido'),
    'cierres', (select count(*) from o where capture_state = 'captado'),
    'detenidos', (select count(*) from public.detained_contact_ids(array(select contact_id from cc)) dd
                  where dd.motive <> 'motivo_no_confirmado'),
    'actualizado', greatest((select last_sent_at from camp), (select max(sent_at) from cc), (select max(responded_at) from cc)),
    'calculado_en', now()
  ) end
$function$;

-- ---------------------------------------------------------------------
-- Permisos: solo la clave de servicio.
-- ---------------------------------------------------------------------
do $$
declare
  f text;
begin
  foreach f in array array[
    'public.campaign_tick_lock(uuid, uuid, integer)',
    'public.campaign_tick_unlock(uuid, uuid)',
    'public.campaign_recover_stale(uuid, integer)',
    'public.campaign_claim_next(uuid, uuid)',
    'public.campaign_claim_recipient(uuid, uuid)',
    'public.campaign_mark_sending(uuid, uuid)',
    'public.campaign_finish_send(uuid, uuid, text, text, text, boolean)',
    'public.campaign_review_action(uuid, text, boolean, text)',
    'public.automation_pause_active(text)',
    'public.claim_ai_send(uuid, uuid)',
    'public.claim_manual_send(uuid)',
    'public.grant_ai_final_ack(uuid, public.conversation_status, text, integer)',
    'public.campaign_metrics(uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
