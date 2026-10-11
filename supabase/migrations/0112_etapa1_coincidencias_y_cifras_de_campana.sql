-- =====================================================================
-- Etapa 1 · Bloques 1.6 y 1.8
--  * Importación: por fila, qué tipo de coincidencia tuvo (nuevo, repetido
--    dentro del mismo archivo, ya estaba en una base anterior o era un
--    contacto existente por otra vía) y, si ya había sido contactado, la
--    fecha, campaña y línea del último contacto ANTERIOR a la carga. Se
--    guarda al importar y no se recalcula después (los contactos
--    posteriores se ven en resultados, sin cambiar el diagnóstico inicial).
--  * Campañas: un solo cálculo de cifras por campaña para PC y teléfono,
--    sin el tope de 1.000 filas de las lecturas de la API.
-- Solo agrega columnas, un índice y funciones de lectura. No envía nada.
-- =====================================================================

set lock_timeout = '5s';

alter table public.imported_base_rows add column if not exists match_kind text
  check (match_kind in ('nuevo', 'repetido_en_archivo', 'base_anterior', 'contacto_existente'));
alter table public.imported_base_rows add column if not exists previous_contact jsonb;
create index if not exists imported_base_rows_contact_idx on public.imported_base_rows (contact_id);

-- Último mensaje saliente de cada contacto: fecha, campaña y línea (la línea
-- asignada a la campaña o a la conversación; si no hay, la etiqueta del canal).
create or replace function public.contacts_last_outbound(p_ids uuid[])
returns table (contact_id uuid, last_at timestamptz, campaign_id uuid, campaign_name text, line_label text)
language sql
stable
set search_path to ''
as $function$
  select distinct on (cv.contact_id)
         cv.contact_id,
         m.created_at,
         camp.id,
         camp.name,
         coalesce(pl.label, ch.label)
    from public.conversations cv
    join public.messages m
      on m.conversation_id = cv.id
     and m.direction = 'saliente'
     and m.duplicate_of is null
    left join public.campaigns camp on camp.id::text = m.metadata->>'campaign_id'
    left join public.profile_lines pl on pl.id = coalesce(camp.line_id, cv.line_id)
    left join public.channels ch on ch.id = coalesce(camp.channel_id, cv.channel_id)
   where cv.contact_id = any(p_ids)
   order by cv.contact_id, m.created_at desc
$function$;

revoke all on function public.contacts_last_outbound(uuid[]) from public, anon, authenticated;
grant execute on function public.contacts_last_outbound(uuid[]) to service_role;

-- Cifras de una campaña (doc. 1, 3.3): prospectos, mensajes enviados,
-- respuestas, personas que responden, sin respuesta, caídos, en
-- seguimiento y cierres. Unidad: destinatarios de la campaña (una fila por
-- contacto), salvo "mensajes_enviados" y "respuestas", que cuentan mensajes.
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
  -- Una oportunidad por destinatario: la vinculada a esta campaña si existe;
  -- si no, la más reciente del contacto.
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
  -- Persona que responde: el destinatario figura con respuesta o tiene un
  -- mensaje entrante posterior a su envío (lo que ocurra primero).
  resp as (
    select count(*) n from cc
     where cc.status in ('respondio', 'opt_out')
        or cc.responded_at is not null
        or (cc.sent_at is not null and exists (
              select 1 from public.conversations cv
                join public.messages m on m.conversation_id = cv.id
               where cv.contact_id = cc.contact_id and m.direction = 'entrante'
                 and m.duplicate_of is null and m.created_at >= cc.sent_at))
  ),
  env as (
    select count(*) n from cc where cc.status not in ('pendiente', 'fallo')
  )
  select case when not exists (select 1 from camp) then null else jsonb_build_object(
    'prospectos', (select count(*) from cc),
    'pendientes', (select count(*) from cc where status = 'pendiente'),
    'enviados', (select n from env),
    'entregados', (select count(*) from cc where status in ('entregado', 'leido', 'respondio')),
    'leidos', (select count(*) from cc where status in ('leido', 'respondio')),
    'fallidos', (select count(*) from cc where status = 'fallo'),
    'mensajes_enviados', (select n from salientes),
    'respuestas', (select n from entrantes),
    'personas_responden', (select n from resp),
    'sin_respuesta', greatest((select n from env) - (select n from resp), 0),
    'en_seguimiento', (select count(*) from o where followup_state = 'activo'),
    'caidos', (select count(*) from o where followup_state = 'caido'),
    'cierres', (select count(*) from o where capture_state = 'captado'),
    -- detenidos por contacto o por teléfono dentro del perfil (misma regla que los envíos)
    'detenidos', (select count(*) from public.detained_contact_ids(array(select contact_id from cc)) dd
                  where dd.motive <> 'motivo_no_confirmado'),
    'actualizado', greatest((select last_sent_at from camp), (select max(sent_at) from cc), (select max(responded_at) from cc)),
    'calculado_en', now()
  ) end
$function$;

revoke all on function public.campaign_metrics(uuid) from public, anon, authenticated;
grant execute on function public.campaign_metrics(uuid) to service_role;
