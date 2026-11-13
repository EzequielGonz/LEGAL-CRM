-- 0607 · Reglas del 13/11: quién habló último, caídos automáticos,
-- oportunidades reales, incidencias de verdad y limpieza con deshacer.
--
-- Decisiones de la responsable (docs/mejoras-1311/PLAN-4.md):
--   · «que pasen 3 días y otro mensaje, si no responde en 24 hs, a caídos»;
--   · incidencia de una persona = amenaza legal o denuncia, o queja de un
--     cliente captado; el resto pasa solo a Perdidos o No contactar;
--   · reclasificar lo ya cargado, con motivo y con lista para deshacer.
--
-- Repetible: se puede correr más de una vez sin error. No borra nada.

-- 1) Quién habló último, en la propia oportunidad. Hasta ahora cada pantalla
--    lo calculaba a su manera (por eso Hoy y el filtro de chats no coincidían).
alter table public.opportunities
  add column if not exists last_inbound_at timestamptz,
  add column if not exists last_outbound_at timestamptz,
  add column if not exists ultima_palabra text,
  add column if not exists interest_score smallint,
  add column if not exists interest_reason text,
  add column if not exists interest_scored_at timestamptz,
  add column if not exists posible_captacion boolean not null default false,
  add column if not exists posible_captacion_reason text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'opportunities_ultima_palabra_check') then
    alter table public.opportunities
      add constraint opportunities_ultima_palabra_check check (ultima_palabra is null or ultima_palabra in ('persona', 'nosotros'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'opportunities_interest_score_check') then
    alter table public.opportunities
      add constraint opportunities_interest_score_check check (interest_score is null or (interest_score >= 0 and interest_score <= 100));
  end if;
end $$;

comment on column public.opportunities.last_inbound_at is 'Último mensaje de la persona (sin duplicados). Lo mantiene el disparador de mensajes.';
comment on column public.opportunities.last_outbound_at is 'Último mensaje nuestro (bot o equipo). Lo mantiene el disparador de mensajes.';
comment on column public.opportunities.ultima_palabra is 'persona | nosotros: de quién es el último mensaje del chat.';
comment on column public.opportunities.interest_score is 'Puntaje de interés 0-100 (src/lib/atencion/interes.ts).';
comment on column public.opportunities.posible_captacion is 'El bot dudó si la persona concretó una llamada: lo confirma una persona.';

-- Carga inicial desde los mensajes (no toca updated_at: no es actividad).
with ult as (
  select m.conversation_id,
         max(m.created_at) filter (where m.direction = 'entrante') as li,
         max(m.created_at) filter (where m.direction = 'saliente') as lo
    from public.messages m
   where m.duplicate_of is null
   group by m.conversation_id
)
update public.opportunities o
   set last_inbound_at = ult.li,
       last_outbound_at = ult.lo,
       ultima_palabra = case
         when ult.li is not null and (ult.lo is null or ult.li > ult.lo) then 'persona'
         when ult.lo is not null then 'nosotros'
         else null end
  from ult
 where ult.conversation_id = o.conversation_id
   and (o.last_inbound_at is distinct from ult.li or o.last_outbound_at is distinct from ult.lo);

create index if not exists opportunities_ultima_palabra_idx
  on public.opportunities (rubro_id, ultima_palabra, last_inbound_at desc)
  where ultima_palabra is not null;

-- Disparador propio y aparte del que crea la oportunidad: si falla, el
-- mensaje se guarda igual. Corre después de «messages_opportunity_on_insert»
-- (los disparadores se ejecutan por orden alfabético), así la oportunidad ya
-- existe y está unida a la conversación.
create or replace function public.opportunity_ultima_actividad()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  if new.duplicate_of is not null then
    return new;
  end if;
  begin
    if new.direction = 'entrante' then
      update public.opportunities o
         set last_inbound_at = greatest(coalesce(o.last_inbound_at, new.created_at), new.created_at),
             ultima_palabra = case when o.last_outbound_at is not null and o.last_outbound_at > new.created_at then 'nosotros' else 'persona' end,
             -- Quien había caído y vuelve a escribir, vuelve a la conversación.
             followup_state = case when o.followup_state in ('caido', 'completado') then 'ninguno' else o.followup_state end,
             followup_reason = case when o.followup_state in ('caido', 'completado') then null else o.followup_reason end
       where o.conversation_id = new.conversation_id;
    elsif new.direction = 'saliente' then
      update public.opportunities o
         set last_outbound_at = greatest(coalesce(o.last_outbound_at, new.created_at), new.created_at),
             ultima_palabra = case when o.last_inbound_at is not null and o.last_inbound_at > new.created_at then 'persona' else 'nosotros' end
       where o.conversation_id = new.conversation_id;
    end if;
  exception when others then
    raise warning 'opportunity_ultima_actividad: % (mensaje %)', sqlerrm, new.id;
  end;
  return new;
end $function$;

revoke all on function public.opportunity_ultima_actividad() from public, anon, authenticated;

drop trigger if exists messages_ultima_actividad on public.messages;
create trigger messages_ultima_actividad
  after insert on public.messages
  for each row execute function public.opportunity_ultima_actividad();

-- 2) Candidatas a caer. La decisión la toma una función pura del servidor
--    (src/lib/seguimiento/caidos.ts); acá solo se juntan los datos.
--    Nunca entran: quien no respondió nunca, captados, perdidos, quienes
--    esperan a una persona del equipo, y los chats donde la última palabra
--    es de la persona.
create or replace function public.caidos_candidatos(p_now timestamptz default now(), p_limit integer default 300)
returns table (
  opportunity_id uuid,
  rubro_id uuid,
  conversation_id uuid,
  contact_id uuid,
  capture_state text,
  attention_state text,
  followup_state text,
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  ultima_palabra text,
  detenido boolean,
  tarea_id uuid,
  tarea_estado text,
  tarea_base_at timestamptz,
  seguimiento_enviado_at timestamptz
)
language sql
stable
set search_path to 'public'
as $function$
  select o.id, o.rubro_id, o.conversation_id, o.contact_id,
         o.capture_state, o.attention_state, o.followup_state,
         o.last_inbound_at, o.last_outbound_at, o.ultima_palabra,
         (coalesce(o.attention_category = 'detencion', false)
          or exists (select 1 from public.contact_detentions d where d.contact_id = o.contact_id and d.status = 'vigente')),
         ta.id, ta.status, ta.base_at,
         (select max(coalesce(t.sent_at, t.send_started_at))
            from public.followup_tasks t
           where t.opportunity_id = o.id and t.status in ('enviada', 'a_revisar'))
    from public.opportunities o
    left join lateral (
      select t.id, t.status, t.base_at
        from public.followup_tasks t
       where t.opportunity_id = o.id
         and t.status in ('programada', 'enviando', 'conflicto', 'pendiente')
       order by t.created_at desc
       limit 1
    ) ta on true
   where o.contact_state = 'respondio'
     and o.capture_state in ('en_conversacion', 'en_seguimiento')
     and o.followup_state in ('ninguno', 'activo')
     and o.attention_state <> 'requiere_humano'
     and o.ultima_palabra = 'nosotros'
     and o.last_outbound_at < p_now - interval '24 hours'
   order by o.last_outbound_at
   limit greatest(1, least(coalesce(p_limit, 300), 1000));
$function$;

revoke all on function public.caidos_candidatos(timestamptz, integer) from public, anon, authenticated;

-- 3) El mensaje de los 3 días: el plazo por defecto pasa de 60 a 72 horas.
--    (El valor de cada perfil se cambia aparte, con registro.)
alter table public.rubros alter column followup_target_hours set default 72;

-- 4) Incidencias de verdad: dos tipos nuevos.
alter table public.incidences drop constraint if exists incidences_kind_check;
alter table public.incidences
  add constraint incidences_kind_check check (kind = any (array[
    'ultimo_mensaje_sin_respuesta', 'pregunta_origen_datos', 'numero_menor', 'numero_tercero',
    'estado_contacto_conversacion', 'plantillas_sin_id', 'contactos_sin_base',
    'cierre_ganado_sin_aceptacion', 'conversacion_abierta', 'solicitud_supresion_datos',
    'motivo_no_confirmado', 'mensaje_posterior_migracion', 'otro',
    'amenaza_legal', 'queja_cliente_captado'
  ]::text[]));

-- 5) Limpieza con deshacer: cada movimiento guarda cómo estaba antes.
create table if not exists public.limpieza_movimientos (
  id uuid primary key default gen_random_uuid(),
  lote text not null,
  rubro_id uuid not null references public.rubros (id),
  opportunity_id uuid references public.opportunities (id),
  conversation_id uuid references public.conversations (id),
  incidence_id uuid references public.incidences (id),
  regla text not null,
  motivo text not null,
  -- Valores exactos de cada columna tocada, por tabla: {"opportunities": {...}, "conversations": {...}, "incidences": {...}}
  antes jsonb not null default '{}'::jsonb,
  despues jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  deshecho_at timestamptz,
  deshecho_por text
);

create index if not exists limpieza_movimientos_lote_idx on public.limpieza_movimientos (rubro_id, lote, regla, created_at desc);
create unique index if not exists limpieza_movimientos_una_vez
  on public.limpieza_movimientos (lote, regla, coalesce(opportunity_id, incidence_id))
  where deshecho_at is null;

alter table public.limpieza_movimientos enable row level security;
revoke all on public.limpieza_movimientos from anon, authenticated;
