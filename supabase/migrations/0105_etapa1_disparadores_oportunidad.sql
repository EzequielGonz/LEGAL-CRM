-- =====================================================================
-- Etapa 1 · Bloque 1.3 (parte 2) — La oportunidad se mantiene al día
-- desde la base, sin depender de qué versión del código esté publicada:
--   * contacto nuevo  -> oportunidad nueva ("Sin contactar" / "Nuevo");
--   * mensaje entrante -> "Respondió" y, si estaba "Nuevo", "En conversación";
--   * envío registrado -> "Contactado sin respuesta" si estaba sin contactar.
-- Cada cambio deja su evento con autor "sistema".
-- Si algo falla acá, el mensaje o el contacto se guardan igual (el error
-- queda como aviso en el registro de la base): nunca se pierde un mensaje.
-- =====================================================================

set lock_timeout = '5s';

create or replace function public.opportunity_on_contact_insert()
returns trigger
language plpgsql
set search_path to ''
as $function$
declare
  v_id uuid;
begin
  begin
    insert into public.opportunities (rubro_id, area, contact_id, origin_source, imported_base_id, campaign_id)
    values (new.rubro_id, new.area, new.id, new.source::text, new.imported_base_id, new.campaign_id)
    returning id into v_id;
    insert into public.opportunity_events (opportunity_id, actor, dimension, to_value, reason)
    values (v_id, 'sistema', 'captacion', 'nuevo', 'Oportunidad creada con el contacto');
  exception when others then
    raise warning 'opportunity_on_contact_insert: % (contacto %)', sqlerrm, new.id;
  end;
  return new;
end $function$;

create or replace function public.opportunity_on_message_insert()
returns trigger
language plpgsql
set search_path to ''
as $function$
declare
  v_contact uuid;
  v_opp public.opportunities%rowtype;
  v_evidence text;
begin
  if new.duplicate_of is not null then
    return new;
  end if;
  begin
    select cv.contact_id into v_contact from public.conversations cv where cv.id = new.conversation_id;
    if v_contact is null then
      return new;
    end if;

    select * into v_opp from public.opportunities o
     where o.contact_id = v_contact
     order by (o.conversation_id = new.conversation_id) desc nulls last, o.created_at desc
     limit 1;

    if v_opp.id is null then
      insert into public.opportunities (rubro_id, area, contact_id, conversation_id, origin_source, imported_base_id)
      select c.rubro_id, c.area, c.id, new.conversation_id, c.source::text, c.imported_base_id
        from public.contacts c where c.id = v_contact
      returning * into v_opp;
      insert into public.opportunity_events (opportunity_id, actor, dimension, to_value, reason)
      values (v_opp.id, 'sistema', 'captacion', 'nuevo', 'Oportunidad creada con el primer mensaje');
    elsif v_opp.conversation_id is null then
      update public.opportunities set conversation_id = new.conversation_id, updated_at = now()
       where id = v_opp.id;
    end if;

    if new.direction = 'entrante' then
      if v_opp.contact_state is distinct from 'respondio' then
        update public.opportunities
           set contact_state = 'respondio', contact_evidence = 'respuesta', updated_at = now()
         where id = v_opp.id;
        insert into public.opportunity_events (opportunity_id, actor, dimension, from_value, to_value, reason, detail)
        values (v_opp.id, 'sistema', 'contacto', v_opp.contact_state, 'respondio', 'Mensaje entrante',
                jsonb_build_object('mensaje', new.id));
      end if;
      if v_opp.capture_state = 'nuevo' then
        update public.opportunities set capture_state = 'en_conversacion', updated_at = now()
         where id = v_opp.id;
        insert into public.opportunity_events (opportunity_id, actor, dimension, from_value, to_value, reason, detail)
        values (v_opp.id, 'sistema', 'captacion', 'nuevo', 'en_conversacion', 'Mensaje entrante',
                jsonb_build_object('mensaje', new.id));
      end if;
    elsif new.direction = 'saliente'
          and coalesce(v_opp.contact_state, 'sin_contactar') in ('sin_contactar', 'error_contacto') then
      v_evidence := case
        when new.external_message_id is not null then 'envio_con_id'
        when new.metadata ? 'campaign_id' and exists (
               select 1 from public.campaign_contacts cc
                where cc.contact_id = v_contact
                  and cc.campaign_id::text = new.metadata->>'campaign_id'
                  and cc.message_id is not null) then 'envio_con_id'
        when new.sender_type = 'admin' then 'manual'
        else 'envio_sin_id' end;
      update public.opportunities
         set contact_state = 'contactado_sin_respuesta', contact_evidence = v_evidence,
             campaign_id = coalesce(campaign_id,
               (select cp.id from public.campaigns cp where cp.id::text = new.metadata->>'campaign_id')),
             updated_at = now()
       where id = v_opp.id;
      insert into public.opportunity_events (opportunity_id, actor, dimension, from_value, to_value, reason, detail)
      values (v_opp.id,
              case new.sender_type when 'admin' then 'operador' when 'agente_ia' then 'ia' else 'sistema' end,
              'contacto', v_opp.contact_state, 'contactado_sin_respuesta', 'Envío registrado',
              jsonb_build_object('mensaje', new.id, 'evidencia', v_evidence));
    end if;
  exception when others then
    raise warning 'opportunity_on_message_insert: % (mensaje %)', sqlerrm, new.id;
  end;
  return new;
end $function$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'contacts_opportunity_on_insert') then
    create trigger contacts_opportunity_on_insert
      after insert on public.contacts
      for each row execute function public.opportunity_on_contact_insert();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'messages_opportunity_on_insert') then
    create trigger messages_opportunity_on_insert
      after insert on public.messages
      for each row execute function public.opportunity_on_message_insert();
  end if;
end $$;
