-- 12/11 · Seguimiento y segundo intento por Wasender (bloque 4).
-- Solo agrega; repetible sin error. NO APLICADA al 12/11: se aplica al aprobar
-- la rama mejoras-1211, después de comprobar que la función followup_gate de la
-- base sigue siendo la de 0201 (huella en docs/mejoras-1211/MIGRACIONES.md).
--
-- 1) Tareas de seguimiento: línea de Wasender por la que sale (vacía = Meta).
-- 2) Compuerta: si la tarea tiene línea de Wasender, se comprueba esa línea;
--    si no, las comprobaciones de Meta quedan EXACTAMENTE como estaban.
-- 3) Segundo intento a quien nunca respondió: interruptor por perfil (apagado)
--    y registro de cada intento (uno por contacto, para siempre).

alter table public.followup_tasks
  add column if not exists wasender_line_id uuid references public.wasender_lineas(id);
create index if not exists followup_tasks_wasender_line_idx
  on public.followup_tasks (wasender_line_id) where wasender_line_id is not null;

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
  if v_task.wasender_line_id is not null then
    -- 12/11: sale por Wasender. La línea tiene que ser del perfil de la tarea,
    -- del área de la conversación, estar conectada, prendida y sin archivar.
    if not exists (
      select 1 from public.wasender_lineas w
       where w.id = v_task.wasender_line_id and w.rubro_id = v_task.rubro_id and w.area = v_conv.area
         and w.habilitada and w.estado = 'connected' and w.archivada_at is null) then
      return 'linea_incompatible';
    end if;
  -- La línea de Meta: del perfil de la tarea, del área de la conversación, activa y la
  -- misma de la conversación cuando esta ya tiene una (nunca otro número).
  elsif v_task.line_id is null
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

-- Segundo intento: apagado en todos los perfiles hasta que la responsable lo prenda.
alter table public.rubros add column if not exists segundo_intento_desde timestamptz;

create table if not exists public.wasender_segundos_intentos (
  id uuid primary key default gen_random_uuid(),
  rubro_id uuid not null references public.rubros(id),
  contact_id uuid not null references public.contacts(id),
  conversation_id uuid references public.conversations(id),
  campaign_id uuid references public.campaigns(id),
  campaign_contact_id uuid references public.campaign_contacts(id),
  linea_id uuid not null references public.wasender_lineas(id),
  plantilla text,
  status text not null default 'enviando'
    check (status in ('enviando', 'enviado', 'pendiente', 'fallido', 'a_revisar')),
  error text,
  message_id uuid,
  external_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Un solo segundo intento por contacto, para siempre.
create unique index if not exists wasender_segundos_intentos_contacto_uidx on public.wasender_segundos_intentos (contact_id);
create index if not exists wasender_segundos_intentos_linea_idx on public.wasender_segundos_intentos (linea_id, sent_at desc);

alter table public.wasender_segundos_intentos enable row level security;
revoke all on public.wasender_segundos_intentos from anon, authenticated;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'wasender_segundos_intentos_no_delete') then
    create trigger wasender_segundos_intentos_no_delete before delete on public.wasender_segundos_intentos
      for each row execute function public.prevent_hard_delete();
  end if;
end $$;
