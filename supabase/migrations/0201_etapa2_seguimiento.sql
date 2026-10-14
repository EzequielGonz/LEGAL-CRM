-- =====================================================================
-- Etapa 2 · Bloque 2.3 — Seguimiento general (un solo circuito para los
-- cuatro perfiles; Marketing pasa a este motor)
--
-- Reglas aprobadas (sección 5.2 y bloque 2.3 del documento único):
--  * Solo para quien respondió. Quien nunca respondió no recibe nada más.
--  * El contacto inicial es el contacto 1. Si respondió y se interrumpió,
--    contacto 2 a las 48–72 h (60 por defecto, editable por perfil), en la
--    franja válida del calendario (bloque 2.0). Sin respuesta al 2, se
--    detiene (no entra a la repesca). Si responde al 2 y se interrumpe,
--    contacto 3 con el mismo criterio; si no responde o no avanza, pasa a
--    una base para campaña manual (generar la base no envía).
--  * Los mensajes de una conversación activa no cuentan como intentos.
--  * Agotar el circuito no es una baja ni una detención.
--  * Las conversaciones anteriores a la activación del seguimiento de cada
--    perfil no entran solas al circuito.
--  * El seguimiento de formularios verificados queda preparado y
--    desactivado (pregunta 34): no hay forma de activarlo todavía.
--
-- Aditiva: la versión publicada no la usa. Todo arranca apagado.
--
-- Revisión del 13/10 (devolución sobre la entrega 1):
--  * La compuerta exige que la línea de la tarea sea del perfil, del área de
--    la conversación y la misma de la conversación, y que conversación,
--    contacto y oportunidad correspondan entre sí.
--  * followup_release devuelve una tarea reservada sin contar el intento.
--  * followup_candidates ya no devuelve interrupciones anteriores a la
--    activación, con más de 72 horas o ya descartadas, y se recorre por
--    páginas. Se puede volver a correr sobre la versión anterior de este
--    archivo: reemplaza funciones y no toca datos.
-- =====================================================================

set lock_timeout = '5s';

-- Configuración por perfil: valor objetivo (48 a 72 h) y activación.
alter table public.rubros
  add column if not exists followup_target_hours smallint not null default 60,
  add column if not exists followup_enabled_since timestamptz;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'rubros_followup_target_hours_range') then
    alter table public.rubros add constraint rubros_followup_target_hours_range
      check (followup_target_hours between 48 and 72);
  end if;
end $$;

-- Plantillas: el contacto 3 puede tener su propia plantilla (si no hay, se
-- usa la del contacto 2).
alter table public.template_assignments drop constraint if exists template_assignments_purpose_check;
alter table public.template_assignments add constraint template_assignments_purpose_check
  check (purpose in ('campana', 'seguimiento', 'seguimiento_3', 'reagendamiento', 'inicio_cita', 'aviso_interno', 'formulario'));

-- Registro de accesos: activar o apagar el seguimiento automático pide el PIN.
alter table public.access_events drop constraint if exists access_events_kind_check;
alter table public.access_events add constraint access_events_kind_check check (kind in (
  'ingreso', 'ingreso_fallido', 'bloqueo_origen', 'intento_bloqueado', 'salida',
  'cambio_pin', 'cambio_pin_fallido', 'recuperacion_pin', 'pin_inicial',
  'cierre_todas_sesiones', 'pausa_general', 'seguimiento_automatico'));

-- Oportunidad: base de repesca manual a la que se sumó (si se generó).
alter table public.opportunities
  add column if not exists followup_exhausted_at timestamptz,
  add column if not exists repesca_base_id uuid references public.imported_bases(id) on delete set null;

create table if not exists public.followup_tasks (
  id uuid primary key default gen_random_uuid(),
  rubro_id uuid not null references public.rubros(id),
  opportunity_id uuid not null references public.opportunities(id) on delete restrict,
  contact_id uuid not null references public.contacts(id) on delete restrict,
  conversation_id uuid not null references public.conversations(id) on delete restrict,
  kind text not null default 'conversacion' check (kind in ('conversacion', 'formulario')),
  step smallint not null check (step in (2, 3)),
  -- Inicio de la interrupción: nuestro último mensaje sin respuesta.
  base_at timestamptz not null,
  base_message_id uuid references public.messages(id) on delete set null,
  target_hours smallint not null check (target_hours between 48 and 72),
  scheduled_at timestamptz,
  offset_hours smallint,
  status text not null default 'programada' check (status in (
    'programada', 'enviando', 'enviada', 'cancelada', 'conflicto', 'pendiente', 'a_revisar', 'fallida')),
  status_reason text,
  attempts smallint not null default 0,
  claim_token uuid,
  claimed_at timestamptz,
  send_started_at timestamptz,
  line_id uuid references public.profile_lines(id) on delete set null,
  template_id uuid references public.whatsapp_templates(id) on delete set null,
  message_id uuid references public.messages(id) on delete set null,
  external_message_id text,
  sent_at timestamptz,
  resolved_at timestamptz,
  resolved_by text,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Una sola tarea abierta por oportunidad.
create unique index if not exists followup_tasks_open_once
  on public.followup_tasks (opportunity_id)
  where status in ('programada', 'enviando', 'conflicto', 'pendiente', 'a_revisar');
-- Cada contacto (2 o 3) sale como mucho una vez por oportunidad
-- (un envío incierto cuenta como posible envío).
create unique index if not exists followup_tasks_step_once
  on public.followup_tasks (opportunity_id, step)
  where status in ('enviando', 'enviada', 'a_revisar');
-- Una misma interrupción no genera dos tareas (tampoco después de descartar una).
create unique index if not exists followup_tasks_base_once
  on public.followup_tasks (opportunity_id, step, base_at);
create index if not exists followup_tasks_due_idx
  on public.followup_tasks (status, scheduled_at) where status in ('programada', 'pendiente');
create index if not exists followup_tasks_review_idx
  on public.followup_tasks (rubro_id, status) where status in ('conflicto', 'pendiente', 'a_revisar', 'fallida');

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'followup_tasks_no_delete') then
    create trigger followup_tasks_no_delete before delete on public.followup_tasks
      for each row execute function public.prevent_hard_delete();
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Reserva atómica de una tarea (como los destinatarios de campaña).
-- ---------------------------------------------------------------------
create or replace function public.followup_claim(p_task uuid, p_token uuid)
returns boolean
language sql
set search_path = public
as $$
  with upd as (
    update public.followup_tasks t
       set status = 'enviando', claim_token = p_token, claimed_at = now(),
           send_started_at = null, attempts = t.attempts + 1, updated_at = now()
     where t.id = p_task and t.status in ('programada', 'pendiente')
    returning t.id
  )
  select exists (select 1 from upd);
$$;

-- Compuerta inmediatamente antes de enviar, con la conversación bloqueada:
-- pausa general de envíos, chat tomado por una persona, perfil con el
-- seguimiento apagado, oportunidad cerrada o con atención humana, contacto
-- detenido o que respondió después del inicio de la interrupción. Si todo
-- está bien deja la marca de inicio del envío (desde ese momento, un corte
-- deja el envío como incierto y nunca se reenvía solo).
create or replace function public.followup_gate(p_task uuid, p_token uuid)
returns text
language plpgsql
set search_path = public
as $$
declare
  v_task public.followup_tasks%rowtype;
  v_conv record;
  v_opp record;
begin
  select * into v_task from public.followup_tasks where id = p_task;
  if not found or v_task.status <> 'enviando' or v_task.claim_token is distinct from p_token then
    return 'reserva_perdida';
  end if;
  select id, ai_enabled, area, contact_id, line_id into v_conv
    from public.conversations where id = v_task.conversation_id for update;
  if not found then return 'sin_conversacion'; end if;
  if public.automation_pause_active('outbound_automations_paused') then return 'pausa_general'; end if;
  if not exists (select 1 from public.rubros r where r.id = v_task.rubro_id and r.followup_enabled_since is not null) then
    return 'seguimiento_inactivo';
  end if;
  select rubro_id, contact_id, conversation_id, capture_state, attention_state, derivation_state, automation_hold
    into v_opp from public.opportunities where id = v_task.opportunity_id;
  -- Conversación, contacto y oportunidad tienen que ser los de la tarea.
  if not found
     or v_opp.rubro_id is distinct from v_task.rubro_id
     or v_opp.contact_id is distinct from v_task.contact_id
     or v_opp.conversation_id is distinct from v_task.conversation_id
     or v_conv.contact_id is distinct from v_task.contact_id then
    return 'datos_incompatibles';
  end if;
  -- La línea: del perfil de la tarea, del área de la conversación, activa y la
  -- misma de la conversación cuando esta ya tiene una (nunca otro número).
  if v_task.line_id is null
     or (v_conv.line_id is not null and v_conv.line_id is distinct from v_task.line_id)
     or not exists (
       select 1 from public.profile_lines l
        where l.id = v_task.line_id and l.rubro_id = v_task.rubro_id and l.area = v_conv.area and l.active) then
    return 'linea_incompatible';
  end if;
  if not v_conv.ai_enabled then return 'chat_tomado'; end if;
  if v_opp.capture_state in ('captado', 'perdido') then return 'oportunidad_cerrada'; end if;
  if v_opp.attention_state <> 'ia' then return 'atencion_humana'; end if;
  if v_opp.derivation_state = 'derivado' then return 'derivada'; end if;
  if v_opp.automation_hold then return 'retenida'; end if;
  if exists (select 1 from public.contact_detention(v_task.contact_id)) then return 'detenido'; end if;
  if exists (
    select 1 from public.messages m
     where m.conversation_id = v_task.conversation_id
       and m.direction = 'entrante'
       and m.duplicate_of is null
       and m.created_at > v_task.base_at
  ) then
    return 'respondio';
  end if;
  update public.followup_tasks set send_started_at = now(), updated_at = now() where id = p_task;
  return 'ok';
end $$;

-- Cierre de la tarea, solo con la reserva vigente.
create or replace function public.followup_finish(
  p_task uuid,
  p_token uuid,
  p_status text,
  p_reason text default null,
  p_message_id uuid default null,
  p_external_id text default null,
  p_sent_at timestamptz default null
)
returns boolean
language sql
set search_path = public
as $$
  with upd as (
    update public.followup_tasks t
       set status = p_status,
           status_reason = p_reason,
           message_id = coalesce(p_message_id, t.message_id),
           external_message_id = coalesce(p_external_id, t.external_message_id),
           sent_at = case when p_status = 'enviada' then coalesce(t.sent_at, p_sent_at, now()) else t.sent_at end,
           claim_token = null,
           send_started_at = case when p_status in ('programada', 'pendiente') then null else t.send_started_at end,
           updated_at = now()
     where t.id = p_task and t.status = 'enviando' and t.claim_token = p_token
    returning t.id
  )
  select exists (select 1 from upd);
$$;

-- Devolución de una tarea reservada sin haber intentado el envío (pausa
-- general, error de la compuerta, línea o datos que no corresponden, hora que
-- dejó de valer): no cuenta como intento y borra la marca de inicio.
create or replace function public.followup_release(
  p_task uuid,
  p_token uuid,
  p_status text,
  p_reason text default null,
  p_scheduled_at timestamptz default null,
  p_offset_hours integer default null
)
returns boolean
language sql
set search_path = public
as $$
  with upd as (
    update public.followup_tasks t
       set status = p_status,
           status_reason = p_reason,
           scheduled_at = coalesce(p_scheduled_at, t.scheduled_at),
           offset_hours = coalesce(p_offset_hours, t.offset_hours),
           attempts = greatest(t.attempts - 1, 0),
           claim_token = null,
           claimed_at = null,
           send_started_at = null,
           updated_at = now()
     where t.id = p_task and t.status = 'enviando' and t.claim_token = p_token
       and p_status in ('programada', 'pendiente', 'conflicto')
    returning t.id
  )
  select exists (select 1 from upd);
$$;

-- Ejecuciones cortadas: sin marca de inicio vuelven a programada (sin
-- contar el intento); con marca quedan a revisar como inciertas.
create or replace function public.followup_recover_stale(p_lease_seconds integer default 600)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_back integer;
  v_review integer;
begin
  with upd as (
    update public.followup_tasks
       set status = 'programada', claim_token = null, claimed_at = null,
           attempts = greatest(attempts - 1, 0), updated_at = now()
     where status = 'enviando' and send_started_at is null
       and claimed_at < now() - make_interval(secs => p_lease_seconds)
    returning id
  ) select count(*) into v_back from upd;
  with upd as (
    update public.followup_tasks
       set status = 'a_revisar', claim_token = null,
           status_reason = 'Incierto: la ejecución se cortó después de empezar el envío. No se reenvía sola.',
           updated_at = now()
     where status = 'enviando' and send_started_at is not null
       and claimed_at < now() - make_interval(secs => p_lease_seconds)
    returning id
  ) select count(*) into v_review from upd;
  return jsonb_build_object('a_programada', v_back, 'a_revisar', v_review);
end $$;

-- Candidatas a seguimiento: oportunidades que respondieron, con la IA a
-- cargo, sin tarea abierta, cuyo último mensaje es nuestro (la conversación
-- se interrumpió). Devuelve lo que el circuito necesita para decidir.
-- Solo entran:
--  * interrupciones nuevas: posteriores a la activación del perfil, de las
--    últimas 72 horas respecto de p_now y no escritas por una persona del
--    equipo (las demás el circuito nunca las programa);
--  * oportunidades que ya están en el circuito (algún contacto enviado), para
--    decidir el contacto 3 o la detención.
-- Una interrupción cuya tarea se descartó o falló no vuelve. Se recorre por
-- páginas con (p_after_at, p_after_id), en orden de la interrupción.
drop function if exists public.followup_candidates(integer);
create or replace function public.followup_candidates(
  p_limit integer default 200,
  p_now timestamptz default now(),
  p_after_at timestamptz default null,
  p_after_id uuid default null
)
returns table (
  opportunity_id uuid,
  rubro_id uuid,
  contact_id uuid,
  conversation_id uuid,
  enabled_since timestamptz,
  target_hours smallint,
  last_message_id uuid,
  last_sender text,
  last_at timestamptz,
  last_inbound_at timestamptz,
  sent jsonb,
  followup_state text
)
language sql
stable
set search_path = public
as $$
  select o.id, o.rubro_id, o.contact_id, o.conversation_id,
         r.followup_enabled_since, r.followup_target_hours,
         lm.id, lm.sender_type::text, lm.created_at,
         li.at,
         coalesce((
           select jsonb_agg(jsonb_build_object('step', t.step,
                    'sent_at', coalesce(t.sent_at, t.send_started_at, t.updated_at)) order by t.step)
             from public.followup_tasks t
            where t.opportunity_id = o.id and t.status in ('enviada', 'a_revisar')
         ), '[]'::jsonb),
         o.followup_state
    from public.opportunities o
    join public.rubros r on r.id = o.rubro_id and r.followup_enabled_since is not null
    join public.conversations c on c.id = o.conversation_id and c.ai_enabled
    cross join lateral (
      select m.id, m.direction, m.sender_type, m.created_at
        from public.messages m
       where m.conversation_id = o.conversation_id and m.duplicate_of is null
       order by m.created_at desc
       limit 1
    ) lm
    left join lateral (
      select max(m.created_at) as at
        from public.messages m
       where m.conversation_id = o.conversation_id and m.direction = 'entrante' and m.duplicate_of is null
    ) li on true
   where o.contact_state = 'respondio'
     and o.capture_state in ('en_conversacion', 'en_seguimiento')
     and o.attention_state = 'ia'
     and o.derivation_state = 'no_derivado'
     and not o.automation_hold
     and o.followup_state in ('ninguno', 'activo')
     and lm.direction = 'saliente'
     and not exists (
       select 1 from public.followup_tasks t
        where t.opportunity_id = o.id
          and t.status in ('programada', 'enviando', 'conflicto', 'pendiente', 'a_revisar'))
     and not exists (
       select 1 from public.followup_tasks t
        where t.opportunity_id = o.id
          and t.base_at = lm.created_at
          and t.status in ('cancelada', 'fallida'))
     and (
       (lm.created_at >= r.followup_enabled_since
        and lm.created_at >= p_now - interval '72 hours'
        and lm.sender_type::text <> 'admin')
       or exists (
         select 1 from public.followup_tasks t
          where t.opportunity_id = o.id and t.status = 'enviada')
     )
     and (p_after_at is null
          or (lm.created_at, o.id) > (p_after_at, coalesce(p_after_id, '00000000-0000-0000-0000-000000000000'::uuid)))
   order by lm.created_at, o.id
   limit greatest(1, least(coalesce(p_limit, 200), 1000));
$$;

-- Solo la clave de servicio (servidor, después del PIN).
alter table public.followup_tasks enable row level security;
revoke all on public.followup_tasks from anon, authenticated;
grant select, insert, update on public.followup_tasks to service_role;
do $$
declare f text;
begin
  foreach f in array array[
    'public.followup_claim(uuid, uuid)',
    'public.followup_gate(uuid, uuid)',
    'public.followup_finish(uuid, uuid, text, text, uuid, text, timestamptz)',
    'public.followup_release(uuid, uuid, text, text, timestamptz, integer)',
    'public.followup_recover_stale(integer)',
    'public.followup_candidates(integer, timestamptz, timestamptz, uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
