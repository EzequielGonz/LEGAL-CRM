-- =====================================================================
-- Etapa 1 · Bloque 1.5 — Un solo cálculo de cifras por perfil
-- Todas las pantallas (PC y teléfono) leen estas cifras. Cada tasa se
-- devuelve con su numerador y su denominador; con denominador cero el
-- panel muestra "Sin datos".
-- Unidades: oportunidades (una por consulta), contactos, mensajes, citas.
-- =====================================================================

create or replace function public.profile_metrics(p_rubro uuid)
returns jsonb
language sql
stable
set search_path to ''
as $function$
  with o as (
    select * from public.opportunities where rubro_id = p_rubro
  ),
  d as (
    select * from public.contact_detentions where rubro_id = p_rubro and status = 'vigente'
  ),
  conv as (
    select cv.id from public.conversations cv
      join public.contacts c on c.id = cv.contact_id
     where c.rubro_id = p_rubro
  ),
  m as (
    select msg.direction, msg.sender_type from public.messages msg
     where msg.conversation_id in (select id from conv) and msg.duplicate_of is null
  )
  select jsonb_build_object(
    'oportunidades', (select count(*) from o),
    'contactos', (select count(*) from public.contacts where rubro_id = p_rubro),
    'contacto', jsonb_build_object(
      'sin_contactar', (select count(*) from o where contact_state = 'sin_contactar'),
      'contactado_sin_respuesta', (select count(*) from o where contact_state = 'contactado_sin_respuesta'),
      'respondio', (select count(*) from o where contact_state = 'respondio'),
      'error_contacto', (select count(*) from o where contact_state = 'error_contacto')),
    'captacion', jsonb_build_object(
      'nuevo', (select count(*) from o where capture_state = 'nuevo'),
      'en_conversacion', (select count(*) from o where capture_state = 'en_conversacion'),
      'en_seguimiento', (select count(*) from o where capture_state = 'en_seguimiento'),
      'captado', (select count(*) from o where capture_state = 'captado'),
      'perdido', (select count(*) from o where capture_state = 'perdido')),
    'seguimiento', jsonb_build_object(
      'activo', (select count(*) from o where followup_state = 'activo'),
      'completado', (select count(*) from o where followup_state = 'completado'),
      'caido', (select count(*) from o where followup_state = 'caido')),
    'atencion', jsonb_build_object(
      'ia', (select count(*) from o where attention_state = 'ia'),
      'requiere_humano', (select count(*) from o where attention_state = 'requiere_humano'),
      'humano_en_curso', (select count(*) from o where attention_state = 'humano_en_curso')),
    'derivacion', jsonb_build_object(
      'derivado', (select count(*) from o where capture_state = 'captado' and derivation_state = 'derivado'),
      'no_derivado', (select count(*) from o where capture_state = 'captado' and derivation_state = 'no_derivado')),
    'detenidos', (select count(*) from d where motive <> 'motivo_no_confirmado'),
    'retenidos_revision', (select count(*) from d where motive = 'motivo_no_confirmado'),
    'detenidos_por_motivo', coalesce((select jsonb_object_agg(motive, n) from (select motive, count(*) n from d group by motive) x), '{}'::jsonb),
    'revision_pendiente', (select count(*) from o where review_required),
    'mensajes', jsonb_build_object(
      'enviados', (select count(*) from m where direction = 'saliente'),
      'recibidos', (select count(*) from m where direction = 'entrante')),
    'citas', coalesce((select jsonb_object_agg(status, n) from (
      select a.status, count(*) n from public.appointments a
        join public.contacts c on c.id = a.contact_id
       where c.rubro_id = p_rubro group by a.status) y), '{}'::jsonb),
    'incidencias_abiertas', (select count(*) from public.incidences where rubro_id = p_rubro and status = 'abierta'),
    'calculado_en', now()
  )
$function$;

revoke all on function public.profile_metrics(uuid) from public, anon, authenticated;
grant execute on function public.profile_metrics(uuid) to service_role;
