-- =====================================================================
-- Etapa 1 · Bloque 1.3 — Reconciliación de la sección 5.1 (una sola vez)
--
-- Requisitos verificados antes de aplicarla: respaldo y restauración
-- probados (bloque 1.0), campaña pausada, IA y envíos automáticos en pausa.
--
-- Qué hace: crea una oportunidad por contacto con los estados nuevos,
-- registra la evidencia, las detenciones con su motivo y las incidencias.
-- Qué NO hace: no cambia contacts.status ni conversations.status (quedan
-- como valor histórico), no borra nada, no crea mensajes, tareas, citas ni
-- avisos, no toca la cola de la campaña y no mete conversaciones
-- históricas en el seguimiento nuevo (automation_hold).
--
-- Regla aplicada de la sección 5.1: "un pedido de no contacto prevalece
-- siempre". Por eso 3 contactos quedan en B5 aunque la tabla los ubicaba en
-- B4, B6 y B8; se guardan ambos motivos y el grupo de la tabla aprobada.
-- =====================================================================

set lock_timeout = '5s';
set statement_timeout = '120s';

-- ---------------------------------------------------------------------
-- 1) Evidencia de la reconciliación (permanente, de solo lectura)
-- ---------------------------------------------------------------------
create table if not exists public.etapa1_reconciliacion (
  contact_id uuid primary key references public.contacts(id) on delete restrict,
  grupo text not null,
  grupo_tabla_aprobada text not null,
  motivo text,
  motivos text[] not null default '{}',
  menor boolean not null default false,
  numero_tercero boolean not null default false,
  pregunta_origen_datos boolean not null default false,
  solicitud_supresion boolean not null default false,
  ultimo_mensaje_sin_respuesta boolean not null default false,
  mensajes_entrantes uuid[] not null default '{}',
  legacy_contact_status conversation_status,
  legacy_conversation_status conversation_status,
  registrado_en timestamptz not null default now()
);
alter table public.etapa1_reconciliacion enable row level security;
revoke all on public.etapa1_reconciliacion from anon, authenticated;
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'etapa1_reconciliacion_read_only') then
    create trigger etapa1_reconciliacion_read_only
      before update or delete on public.etapa1_reconciliacion
      for each row execute function public.prevent_row_changes('La evidencia de la reconciliación es de solo lectura');
  end if;
end $$;

-- B1 a B14: clasificación de los 70 que respondieron (revisión del hilo completo).
insert into public.etapa1_reconciliacion
  (contact_id, grupo, grupo_tabla_aprobada, motivo, motivos, menor, numero_tercero,
   pregunta_origen_datos, solicitud_supresion, ultimo_mensaje_sin_respuesta, mensajes_entrantes,
   legacy_contact_status, legacy_conversation_status)
select v.contact_id::uuid, v.grupo, v.grupo_tabla, v.motivo, v.motivos::text[], v.menor, v.tercero,
       v.origen, v.supresion,
       coalesce((select m.direction = 'entrante' from public.messages m
                   join public.conversations cv on cv.id = m.conversation_id
                  where cv.contact_id = c.id order by m.created_at desc limit 1), false),
       coalesce((select array_agg(m.id order by m.created_at) from public.messages m
                   join public.conversations cv on cv.id = m.conversation_id
                  where cv.contact_id = c.id and m.direction = 'entrante'), '{}'),
       c.status,
       (select cv.status from public.conversations cv where cv.contact_id = c.id order by cv.created_at limit 1)
from (values
  ('1967c8d5-4ed6-4879-99ee-42cbfae6733f', 'B4', 'B4', 'numero_equivocado', '{numero_equivocado}', false, false, false, false),
  ('30c49ce6-c7f5-4507-9d4d-c5ea76c52411', 'B2', 'B2', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('357bba2c-29bc-4295-9174-b4a9cac3cb89', 'B3', 'B3', 'abogado_existente', '{abogado_existente}', false, false, false, false),
  ('6571a87e-91d3-475a-af71-cda058e4ab76', 'B12', 'B12', null, '{}', false, false, false, false),
  ('9be71504-acb0-417b-9f76-1213d884c91d', 'B4', 'B4', 'numero_equivocado', '{numero_equivocado}', false, false, false, false),
  ('b3191970-7cca-48d5-8c1a-8956df6dd4aa', 'B2', 'B2', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('c7813980-3822-4616-b4d1-9fdf171b40f7', 'B10', 'B10', 'motivo_no_confirmado', '{motivo_no_confirmado}', false, false, false, false),
  ('c8f4af53-d57a-497b-b90c-2cb81fbb7840', 'B4', 'B4', 'numero_equivocado', '{numero_equivocado}', false, false, false, false),
  ('d3904046-d324-4f8f-9c43-ad2c16505fbd', 'B8', 'B8', 'motivo_no_confirmado', '{motivo_no_confirmado}', false, false, false, false),
  ('d501747d-36da-4f8d-bd64-b0f16b991e44', 'B12', 'B12', null, '{}', false, false, false, false),
  ('e3115ee5-079f-4625-9918-2a68707107a0', 'B8', 'B8', 'motivo_no_confirmado', '{motivo_no_confirmado}', false, false, true, false),
  ('e53e544c-433f-4bf5-8b30-9f81a082f74e', 'B11', 'B11', 'motivo_no_confirmado', '{motivo_no_confirmado}', false, false, false, false),
  ('eccb9505-e5b4-4ede-81a3-e75c7502cc7e', 'B8', 'B8', 'motivo_no_confirmado', '{motivo_no_confirmado}', false, false, false, false),
  ('049fc039-b82d-4c51-8a09-19ba4cee6b33', 'B5', 'B8', 'no_contacto', '{no_contacto,motivo_no_confirmado}', false, false, true, true),
  ('54f8efca-35d3-4d29-91e1-5c8cd37a61d5', 'B7', 'B7', 'desinteres', '{desinteres}', false, false, false, false),
  ('9d1e4a50-0fe8-4584-a259-7d95bafd7e4f', 'B4', 'B4', 'numero_equivocado', '{numero_equivocado}', false, false, false, false),
  ('fc72e2ac-a056-473d-bdb2-ac4dd0d2214c', 'B5', 'B5', 'no_contacto', '{no_contacto}', true, false, false, false),
  ('27306af9-fb85-4a6c-af15-182735927bb6', 'B13', 'B13', null, '{}', false, false, false, false),
  ('6113164c-ec98-47dc-9803-b88e2d6e456d', 'B13', 'B13', null, '{}', false, false, false, false),
  ('03b7036c-36e6-4a54-aafa-79e957dad55d', 'B4', 'B4', 'numero_equivocado', '{numero_equivocado}', false, false, false, false),
  ('03de5d0e-552a-4a4f-8a98-9b7ad67e5e7f', 'B3', 'B3', 'abogado_existente', '{abogado_existente}', false, false, false, false),
  ('0d1af5a2-1b3b-4b6f-8b32-559575e0cc9a', 'B5', 'B4', 'no_contacto', '{no_contacto,numero_equivocado}', false, true, false, false),
  ('1227368d-ab06-4cd6-a4ba-7928ecb10883', 'B3', 'B3', 'abogado_existente', '{abogado_existente}', false, false, false, false),
  ('1422255b-affb-4bc4-994f-d5b17d437c99', 'B5', 'B5', 'no_contacto', '{no_contacto}', false, false, false, false),
  ('247b98fe-8c98-405e-a922-f736f716c08c', 'B3', 'B3', 'abogado_existente', '{abogado_existente}', false, false, false, false),
  ('2642e90a-be77-408e-91d8-21d6774b1a36', 'B4', 'B4', 'numero_equivocado', '{numero_equivocado}', false, false, false, false),
  ('40046bea-a870-46e9-bcb2-14e8062572fd', 'B3', 'B3', 'abogado_existente', '{abogado_existente}', false, false, false, false),
  ('79859b1d-afc3-4416-8f00-65612bf23af2', 'B7', 'B7', 'desinteres', '{desinteres}', false, false, false, false),
  ('8341a2d3-3436-4da8-acf4-01324a9cec3b', 'B5', 'B6', 'no_contacto', '{no_contacto,enojo}', false, false, false, false),
  ('9b95cada-9f6f-47a1-aaed-74a524ce0a27', 'B4', 'B4', 'numero_equivocado', '{numero_equivocado}', false, false, true, false),
  ('ac99cfb6-b984-44a5-abab-5d9e5c6bb5fe', 'B8', 'B8', 'motivo_no_confirmado', '{motivo_no_confirmado}', false, false, false, false),
  ('cb47a4bf-e43f-4a19-bcbe-83f3a272a141', 'B4', 'B4', 'numero_equivocado', '{numero_equivocado}', false, false, false, false),
  ('cce1593d-cab4-45a0-a16f-a5cabd9a1cac', 'B4', 'B4', 'numero_equivocado', '{numero_equivocado}', false, false, false, false),
  ('d0a4e6d4-f384-47b2-806a-0ff48d0b1cec', 'B3', 'B3', 'abogado_existente', '{abogado_existente}', false, false, false, false),
  ('d6bab107-f8a6-4106-8323-a20d1b02abbb', 'B9', 'B9', 'motivo_no_confirmado', '{motivo_no_confirmado}', false, false, false, false),
  ('ed377351-c100-49b7-a2d7-683d267d3ce6', 'B4', 'B4', 'numero_equivocado', '{numero_equivocado}', false, false, false, false),
  ('fa156682-4b79-4d13-abaf-1052658ecf50', 'B5', 'B5', 'no_contacto', '{no_contacto}', false, false, false, false),
  ('09f10ce8-1fca-4b8d-8a9f-fb2d39fba752', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('0af325d4-842b-4ce3-b952-3274b383e928', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('0c61bbc2-034e-479f-9e78-020e934e83ca', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('1a12d0c2-9da0-4f86-8145-def0db780fdd', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('253ebb60-eb24-412f-b626-67cd2c235707', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('2b9aebe3-138b-4d0d-a6ad-7f56f6f7c51c', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('38b5764f-1eaf-4d05-b9fa-b4b55ca2a2d6', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('484fd153-7f87-4c0a-a768-c6cbd71a455f', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('6378a247-38b9-4890-b2b8-f87e1dabe2a7', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('6babbe48-f281-4dd8-94b8-e86a2bf6a30e', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('6f92e2df-2d9e-4b9e-b50f-18bbdd82fa59', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('7ef09b47-145f-487d-bb2b-d6cd60bcf950', 'B9', 'B9', 'motivo_no_confirmado', '{motivo_no_confirmado}', false, false, false, false),
  ('82626768-ca7a-4efd-bba4-ffb82cee67ff', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('8916b3f3-5142-4005-b658-95c909bc1af1', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('8c110d38-3ff3-4b30-b39a-de003623bd76', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('8c15cb38-4a7f-4019-bcb1-603a5e0d55d7', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('a315bebf-24f4-4ae7-9b80-b9eb4ba75718', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('a3c8901b-fcc7-4de9-8d65-925a3de73859', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('aa9c895e-4361-4cf3-a7db-9c2fae3fb5ea', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('b16c6fcd-2743-44dd-8707-1ccef16639b1', 'B9', 'B9', 'motivo_no_confirmado', '{motivo_no_confirmado}', false, false, false, false),
  ('c69f6f5f-4cdb-42f1-884c-52e881170520', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('ccb1109c-cd1f-486d-8d25-cabc6480f10d', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('d10e56b6-8c18-46f8-92fd-8dd238a02246', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('d25de501-682d-4ba7-ab12-46ea8fa5b334', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('d33b4f80-86a4-4282-a10a-ab1aaf706f37', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('ddf7ebc6-a467-4ff2-9ad1-5170ed8da42e', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('f08fa9cd-29a3-410e-bd04-3ccf8c5c9695', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('f567a784-f197-431b-809c-2eb2868ddd7f', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('fbd570c0-d78e-4081-9bbf-3be8c78ebf6e', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('fde40b86-26d9-4330-acb3-5f5ec9cc08c6', 'B3', 'B3', 'abogado_existente', '{abogado_existente,necesidad_resuelta}', false, false, false, false),
  ('ffb70383-4262-486d-be29-2a61c5507eed', 'B1', 'B1', 'necesidad_resuelta', '{necesidad_resuelta}', false, false, false, false),
  ('5f28bf2d-618e-46d2-ba27-2e2288549672', 'B14', 'B14', null, '{}', false, false, false, false),
  ('7dd0c613-4b49-47dc-a71e-7ccbae37e263', 'B14', 'B14', null, '{}', false, false, false, false)
) as v(contact_id, grupo, grupo_tabla, motivo, motivos, menor, tercero, origen, supresion)
join public.contacts c on c.id = v.contact_id::uuid
where not exists (select 1 from public.system_settings where key = 'migracion_5_1')
on conflict (contact_id) do nothing;

-- A1 a A4: el resto de los contactos, según la evidencia de contacto.
insert into public.etapa1_reconciliacion
  (contact_id, grupo, grupo_tabla_aprobada, legacy_contact_status, legacy_conversation_status)
select b.id, b.grupo, b.grupo, b.cs, b.vs
from (
  select c.id, c.status as cs, v.status as vs,
    case
      when v.id is null and c.status = 'nuevo'
           and not exists (select 1 from public.campaign_contacts cc where cc.contact_id = c.id) then 'A1'
      when v.id is null and c.status = 'nuevo'
           and exists (select 1 from public.campaign_contacts cc where cc.contact_id = c.id) then 'A2'
      when exists (select 1 from public.campaign_contacts cc where cc.contact_id = c.id and cc.message_id is not null) then 'A3'
      when exists (select 1 from public.messages m where m.conversation_id = v.id and m.direction = 'saliente'
                   and (m.metadata ? 'template' or m.body like '[Plantilla%')) then 'A4'
      else 'X'
    end as grupo
  from public.contacts c
  left join lateral (
    select cv.id, cv.status from public.conversations cv
     where cv.contact_id = c.id order by cv.created_at limit 1
  ) v on true
  where not exists (select 1 from public.etapa1_reconciliacion r where r.contact_id = c.id)
    and not exists (select 1 from public.messages m
                     join public.conversations cv2 on cv2.id = m.conversation_id
                    where cv2.contact_id = c.id and m.direction = 'entrante')
) b
where not exists (select 1 from public.system_settings where key = 'migracion_5_1');

-- Control: ningún contacto sin grupo y los 70 que respondieron, todos clasificados.
do $$
declare
  v_sin_grupo integer;
  v_resp_sin_clasificar integer;
begin
  select count(*) into v_sin_grupo from public.etapa1_reconciliacion where grupo = 'X';
  select count(*) into v_resp_sin_clasificar
    from public.contacts c
   where exists (select 1 from public.messages m join public.conversations cv on cv.id = m.conversation_id
                  where cv.contact_id = c.id and m.direction = 'entrante')
     and not exists (select 1 from public.etapa1_reconciliacion r where r.contact_id = c.id);
  if v_sin_grupo > 0 or v_resp_sin_clasificar > 0 then
    raise exception 'Reconciliación incompleta: % sin grupo, % que respondieron sin clasificar',
      v_sin_grupo, v_resp_sin_clasificar;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2) Oportunidades con estados que coexisten
-- ---------------------------------------------------------------------
insert into public.opportunities
  (rubro_id, area, contact_id, conversation_id, origin_source, campaign_id, imported_base_id,
   contact_state, contact_evidence, capture_state, capture_reason, attention_state,
   historical_result, motive_unconfirmed, review_required, automation_hold, automation_hold_reason,
   legacy_contact_status, legacy_conversation_status, migration_group, migration_group_table,
   migrated_at, created_at)
select c.rubro_id, c.area, c.id, v.id, c.source::text, cc.campaign_id, c.imported_base_id,
  case when r.grupo in ('A1', 'A2') then 'sin_contactar'
       when r.grupo in ('A3', 'A4') then 'contactado_sin_respuesta'
       else 'respondio' end,
  case r.grupo when 'A3' then 'envio_con_id' when 'A4' then 'envio_sin_id'
       when 'A1' then null when 'A2' then null else 'respuesta' end,
  case when r.grupo in ('B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7') then 'perdido'
       when r.grupo like 'B%' then 'en_conversacion'
       else 'nuevo' end,
  case when r.grupo in ('B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7') then r.motivo end,
  case when v.status = 'requiere_atencion_humana' then 'requiere_humano'
       when v.id is not null and not v.ai_enabled then 'humano_en_curso'
       else 'ia' end,
  case when r.grupo = 'B14' then 'cerrado_ganado_criterio_anterior'
       when r.grupo in ('B8', 'B9', 'B10', 'B11') then 'resultado_historico'
       else null end,
  r.grupo in ('B8', 'B9', 'B10', 'B11'),
  r.grupo in ('B8', 'B9', 'B10', 'B11', 'B12', 'B13', 'B14'),
  v.id is not null,
  case when v.id is not null then 'migracion_historica' end,
  c.status, v.status, r.grupo, r.grupo_tabla_aprobada, now(), c.created_at
from public.etapa1_reconciliacion r
join public.contacts c on c.id = r.contact_id
left join lateral (
  select cv.id, cv.status, cv.ai_enabled from public.conversations cv
   where cv.contact_id = c.id order by cv.created_at limit 1
) v on true
left join lateral (
  select x.campaign_id from public.campaign_contacts x
   where x.contact_id = c.id order by x.queued_at desc limit 1
) cc on true
where not exists (select 1 from public.system_settings where key = 'migracion_5_1')
on conflict (contact_id) where migration_group is not null do nothing;

-- Historial: un evento por oportunidad, con autor "migración".
insert into public.opportunity_events (opportunity_id, actor, dimension, from_value, to_value, reason, detail)
select o.id, 'migracion', 'captacion', o.legacy_contact_status::text, o.capture_state,
       'Reconciliación 5.1, grupo ' || o.migration_group,
       jsonb_build_object(
         'grupo', o.migration_group,
         'grupo_tabla_aprobada', o.migration_group_table,
         'contacto', o.contact_state,
         'evidencia_contacto', o.contact_evidence,
         'conversacion_anterior', o.legacy_conversation_status,
         'atencion', o.attention_state)
from public.opportunities o
where o.migration_group is not null
  and not exists (select 1 from public.opportunity_events e where e.opportunity_id = o.id and e.actor = 'migracion');

-- ---------------------------------------------------------------------
-- 3) Detenciones (B1 a B7 con motivo; B8 a B11 retenidos por motivo no confirmado)
-- ---------------------------------------------------------------------
insert into public.contact_detentions
  (rubro_id, contact_id, phone_normalized, motive, motives, minor_reported, source, evidence, created_by)
select c.rubro_id, c.id, public.normalize_phone_ar(c.phone), r.motivo, r.motivos, r.menor, 'migracion',
  jsonb_build_object(
    'grupo', r.grupo,
    'grupo_tabla_aprobada', r.grupo_tabla_aprobada,
    'mensajes', to_jsonb(r.mensajes_entrantes),
    'criterio', case r.grupo
      when 'B1' then 'Eligió el botón "Mi caso ya está resuelto".'
      when 'B2' then 'Escribió con sus palabras que lo resolvió.'
      when 'B3' then 'Escribió que ya tiene abogado o estudio.'
      when 'B4' then 'Dijo de forma explícita que es un número equivocado.'
      when 'B5' then 'Pidió expresamente que no le escriban (prevalece sobre otros motivos).'
      when 'B6' then 'Respondió con un insulto para que dejen de escribirle.'
      when 'B7' then 'Expresó desinterés.'
      when 'B8' then 'Dice que nunca hizo una consulta; no coincide con un motivo aprobado.'
      when 'B9' then 'Respuestas ambiguas o contradictorias.'
      when 'B10' then 'Respondió un contestador automático, no la persona.'
      when 'B11' then 'Hizo una pregunta que quedó sin respuesta.'
    end),
  'migracion'
from public.etapa1_reconciliacion r
join public.contacts c on c.id = r.contact_id
where r.grupo in ('B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11')
  and not exists (select 1 from public.contact_detentions d where d.contact_id = c.id and d.source = 'migracion');

insert into public.opportunity_events (opportunity_id, actor, dimension, to_value, reason, detail)
select o.id, 'migracion', 'detencion', d.motive,
       case when d.motive = 'motivo_no_confirmado' then 'Retenido para revisión (motivo no confirmado)'
            else 'Detenido por motivo sostenido' end,
       jsonb_build_object('detencion', d.id, 'motivos', to_jsonb(d.motives), 'menor', d.minor_reported)
from public.contact_detentions d
join public.opportunities o on o.contact_id = d.contact_id and o.migration_group is not null
where d.source = 'migracion'
  and not exists (select 1 from public.opportunity_events e
                   where e.opportunity_id = o.id and e.dimension = 'detencion' and e.actor = 'migracion');

-- ---------------------------------------------------------------------
-- 4) Incidencias para revisión desde el panel
-- ---------------------------------------------------------------------
insert into public.incidences (rubro_id, kind, contact_id, opportunity_id, conversation_id, detail, created_by)
select o.rubro_id, k.kind, o.contact_id, o.id, o.conversation_id, k.detail, 'migracion'
from public.etapa1_reconciliacion r
join public.opportunities o on o.contact_id = r.contact_id and o.migration_group is not null
cross join lateral (
  values
    ('ultimo_mensaje_sin_respuesta', r.ultimo_mensaje_sin_respuesta,
       jsonb_build_object('texto', 'El último mensaje de la persona no tiene respuesta registrada.')),
    ('pregunta_origen_datos', r.pregunta_origen_datos,
       jsonb_build_object('texto', 'Preguntó de dónde se obtuvieron sus datos. Que lo responda una persona del estudio.')),
    ('numero_menor', r.menor,
       jsonb_build_object('texto', 'Informaron que el número es de una menor. Queda bloqueado; se verificó que no figura en otros contactos ni filas de bases del perfil.')),
    ('numero_tercero', r.numero_tercero,
       jsonb_build_object('texto', 'Aportó el número de otra persona. No se usa sin revisión (no se cargó en ningún lado).')),
    ('estado_contacto_conversacion',
       (r.legacy_contact_status = 'no_califica' and r.legacy_conversation_status = 'en_conversacion')
       or (r.legacy_contact_status = 'esperando_respuesta_prospecto' and r.legacy_conversation_status = 'en_conversacion'),
       jsonb_build_object('texto', 'El estado anterior del contacto no coincidía con el de su conversación; ambos se conservan.',
                          'contacto', r.legacy_contact_status, 'conversacion', r.legacy_conversation_status)),
    ('cierre_ganado_sin_aceptacion', r.grupo = 'B14',
       jsonb_build_object('texto', 'Cierre ganado con el criterio anterior (informó disponibilidad); no consta aceptación de revisión y contacto profesional. No es Captado.')),
    ('conversacion_abierta', r.grupo = 'B12',
       jsonb_build_object('texto', 'Saludó y la conversación quedó abierta sin motivo de cierre.')),
    ('solicitud_supresion_datos', r.solicitud_supresion,
       jsonb_build_object('texto', 'Pidió que se eliminen sus datos. No se borró nada: decide el estudio.')),
    ('motivo_no_confirmado', r.grupo in ('B8', 'B9', 'B10', 'B11'),
       jsonb_build_object('texto', 'Resultado histórico con motivo no confirmado. Queda retenido (sin recontacto) hasta revisarlo.', 'grupo', r.grupo))
) as k(kind, aplica, detail)
where k.aplica
on conflict (kind, contact_id) where contact_id is not null do nothing;

-- Incidencias agregadas (informativas, se conservan tal cual).
insert into public.incidences (rubro_id, kind, affected_count, detail, created_by)
select '11111111-1111-1111-1111-111111111111', 'plantillas_sin_id',
  (select count(*) from public.contacts c
    where not exists (select 1 from public.campaign_contacts cc where cc.contact_id = c.id and cc.message_id is not null)
      and exists (select 1 from public.messages m join public.conversations cv on cv.id = m.conversation_id
                   where cv.contact_id = c.id and m.direction = 'saliente'
                     and (m.metadata ? 'template' or m.body like '[Plantilla%'))),
  jsonb_build_object('texto', 'Plantilla registrada sin identificador del proveedor y campaña que no figura en la tabla actual. Referencia desconocida: se conserva tal cual.'),
  'migracion'
where not exists (select 1 from public.system_settings where key = 'migracion_5_1')
on conflict (kind) where contact_id is null and created_by = 'migracion' do nothing;

insert into public.incidences (rubro_id, kind, affected_count, detail, created_by)
select '11111111-1111-1111-1111-111111111111', 'contactos_sin_base',
  (select count(*) from public.contacts where imported_base_id is null),
  jsonb_build_object('texto', 'Contactos sin base de origen vinculada: el archivo de origen es desconocido y no se reconstruye.'),
  'migracion'
where not exists (select 1 from public.system_settings where key = 'migracion_5_1')
on conflict (kind) where contact_id is null and created_by = 'migracion' do nothing;

-- ---------------------------------------------------------------------
-- 5) Marca de aplicada, con los conteos por grupo
-- ---------------------------------------------------------------------
insert into public.system_settings (key, value, updated_by)
select 'migracion_5_1',
  jsonb_build_object(
    'aplicada_en', now(),
    'total', (select count(*) from public.etapa1_reconciliacion),
    'grupos', (select jsonb_object_agg(grupo, n) from (select grupo, count(*) n from public.etapa1_reconciliacion group by grupo) g),
    'oportunidades', (select count(*) from public.opportunities where migration_group is not null),
    'detenciones', (select count(*) from public.contact_detentions where source = 'migracion'),
    'incidencias', (select count(*) from public.incidences where created_by = 'migracion')),
  'migracion'
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- 6) Reconciliación posterior (se puede correr las veces que haga falta):
--    contactos nuevos sin oportunidad y mensajes que entraron después de
--    la migración (con el código anterior todavía publicado). No cambia
--    estados de captación ni detenciones: deja una incidencia para revisar.
-- ---------------------------------------------------------------------
create or replace function public.etapa1_reconciliar_posteriores()
returns jsonb
language plpgsql
set search_path to ''
as $function$
declare
  v_desde timestamptz;
  v_nuevas integer := 0;
  v_respondieron integer := 0;
  v_incidencias integer := 0;
begin
  select (value->>'aplicada_en')::timestamptz into v_desde
    from public.system_settings where key = 'migracion_5_1';
  if v_desde is null then
    raise exception 'La migración 5.1 todavía no se aplicó.';
  end if;

  -- Contactos creados después (o sin oportunidad): oportunidad nueva con su evidencia.
  with ins as (
    insert into public.opportunities
      (rubro_id, area, contact_id, conversation_id, origin_source, imported_base_id,
       contact_state, contact_evidence, capture_state, attention_state)
    select c.rubro_id, c.area, c.id, v.id, c.source::text, c.imported_base_id,
      case when exists (select 1 from public.messages m where m.conversation_id = v.id and m.direction = 'entrante') then 'respondio'
           when exists (select 1 from public.messages m where m.conversation_id = v.id and m.direction = 'saliente') then 'contactado_sin_respuesta'
           else 'sin_contactar' end,
      case when exists (select 1 from public.messages m where m.conversation_id = v.id and m.direction = 'entrante') then 'respuesta' end,
      case when exists (select 1 from public.messages m where m.conversation_id = v.id and m.direction = 'entrante') then 'en_conversacion' else 'nuevo' end,
      case when v.ai_enabled is false then 'humano_en_curso' else 'ia' end
    from public.contacts c
    left join lateral (
      select cv.id, cv.ai_enabled from public.conversations cv where cv.contact_id = c.id order by cv.created_at desc limit 1
    ) v on true
    where not exists (select 1 from public.opportunities o where o.contact_id = c.id)
    returning id
  )
  select count(*) into v_nuevas from ins;

  insert into public.opportunity_events (opportunity_id, actor, dimension, to_value, reason)
  select o.id, 'sistema', 'captacion', o.capture_state, 'Oportunidad creada por la reconciliación posterior'
    from public.opportunities o
   where o.migration_group is null
     and not exists (select 1 from public.opportunity_events e where e.opportunity_id = o.id);

  -- Mensajes entrantes posteriores a la migración en oportunidades migradas.
  with resp as (
    update public.opportunities o
       set contact_state = 'respondio', contact_evidence = 'respuesta', updated_at = now()
     where o.migration_group is not null
       and o.contact_state <> 'respondio'
       and exists (select 1 from public.messages m
                    where m.conversation_id = o.conversation_id
                      and m.direction = 'entrante' and m.created_at > v_desde)
    returning o.id
  )
  select count(*) into v_respondieron from resp;

  with inc as (
    insert into public.incidences (rubro_id, kind, contact_id, opportunity_id, conversation_id, detail, created_by)
    select o.rubro_id, 'mensaje_posterior_migracion', o.contact_id, o.id, o.conversation_id,
           jsonb_build_object('texto', 'Mensaje recibido después de la migración, antes de publicar la versión nueva. Revisar y atender.'),
           'reconciliacion_posterior'
      from public.opportunities o
     where o.migration_group is not null
       and exists (select 1 from public.messages m
                    where m.conversation_id = o.conversation_id
                      and m.direction = 'entrante' and m.created_at > v_desde)
    on conflict (kind, contact_id) where contact_id is not null do nothing
    returning id
  )
  select count(*) into v_incidencias from inc;

  return jsonb_build_object('oportunidades_nuevas', v_nuevas,
                            'respondieron_despues', v_respondieron,
                            'incidencias_nuevas', v_incidencias);
end $function$;

revoke all on function public.etapa1_reconciliar_posteriores() from public, anon, authenticated;
grant execute on function public.etapa1_reconciliar_posteriores() to service_role;
