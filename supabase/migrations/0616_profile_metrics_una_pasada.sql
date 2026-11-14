-- 0616 · profile_metrics en una sola pasada (14/11). Solo velocidad.
-- Antes copiaba todas las oportunidades del perfil (con todas sus columnas)
-- a una tabla temporal que iba a disco y la recorría unas 25 veces. Ahora
-- cuenta todo en una pasada con FILTER. El resultado es idéntico: se comparó
-- en los cuatro perfiles antes de aplicar (mismo JSON salvo `calculado_en`).
-- Medido en producción: 96–131 ms → 35 ms para los cuatro perfiles juntos.
-- Repetible sin error. No borra ni cambia datos. Para volver atrás, la versión
-- anterior está en la migración que creó la función.
create or replace function public.profile_metrics(p_rubro uuid)
returns jsonb
language sql
stable
set search_path to ''
as $function$
  with o as (
    select
      count(*) as total,
      count(*) filter (where contact_state = 'sin_contactar') as sin_contactar,
      count(*) filter (where contact_state = 'contactado_sin_respuesta') as contactado_sin_respuesta,
      count(*) filter (where contact_state = 'respondio') as respondio,
      count(*) filter (where contact_state = 'error_contacto') as error_contacto,
      count(*) filter (where capture_state = 'nuevo') as nuevo,
      count(*) filter (where capture_state = 'en_conversacion') as en_conversacion,
      count(*) filter (where capture_state = 'en_seguimiento') as en_seguimiento,
      count(*) filter (where capture_state = 'captado') as captado,
      count(*) filter (where capture_state = 'perdido') as perdido,
      count(*) filter (where followup_state = 'activo') as f_activo,
      count(*) filter (where followup_state = 'completado') as f_completado,
      count(*) filter (where followup_state = 'caido') as f_caido,
      count(*) filter (where attention_state = 'ia') as a_ia,
      count(*) filter (where attention_state = 'requiere_humano') as a_requiere,
      count(*) filter (where attention_state = 'humano_en_curso') as a_humano,
      count(*) filter (where capture_state = 'captado' and derivation_state = 'derivado') as derivado,
      count(*) filter (where capture_state = 'captado' and derivation_state = 'no_derivado') as no_derivado,
      count(*) filter (where review_required) as revision
    from public.opportunities where rubro_id = p_rubro
  ),
  d as (
    select motive, count(*) n from public.contact_detentions
     where rubro_id = p_rubro and status = 'vigente' group by motive
  ),
  m as (
    select
      count(*) filter (where msg.direction = 'saliente') as enviados,
      count(*) filter (where msg.direction = 'entrante') as recibidos
    from public.messages msg
    where msg.duplicate_of is null
      and msg.conversation_id in (
        select cv.id from public.conversations cv
          join public.contacts c on c.id = cv.contact_id
         where c.rubro_id = p_rubro
      )
  )
  select jsonb_build_object(
    'oportunidades', o.total,
    'contactos', (select count(*) from public.contacts where rubro_id = p_rubro),
    'contacto', jsonb_build_object('sin_contactar', o.sin_contactar, 'contactado_sin_respuesta', o.contactado_sin_respuesta, 'respondio', o.respondio, 'error_contacto', o.error_contacto),
    'captacion', jsonb_build_object('nuevo', o.nuevo, 'en_conversacion', o.en_conversacion, 'en_seguimiento', o.en_seguimiento, 'captado', o.captado, 'perdido', o.perdido),
    'seguimiento', jsonb_build_object('activo', o.f_activo, 'completado', o.f_completado, 'caido', o.f_caido),
    'atencion', jsonb_build_object('ia', o.a_ia, 'requiere_humano', o.a_requiere, 'humano_en_curso', o.a_humano),
    'derivacion', jsonb_build_object('derivado', o.derivado, 'no_derivado', o.no_derivado),
    'detenidos', coalesce((select sum(n) from d where motive <> 'motivo_no_confirmado'), 0)::bigint,
    'retenidos_revision', coalesce((select sum(n) from d where motive = 'motivo_no_confirmado'), 0)::bigint,
    'detenidos_por_motivo', coalesce((select jsonb_object_agg(motive, n) from d), '{}'::jsonb),
    'revision_pendiente', o.revision,
    'mensajes', jsonb_build_object('enviados', m.enviados, 'recibidos', m.recibidos),
    'citas', coalesce((select jsonb_object_agg(status, n) from (
      select a.status, count(*) n from public.appointments a
        join public.contacts c on c.id = a.contact_id
       where c.rubro_id = p_rubro group by a.status) y), '{}'::jsonb),
    'incidencias_abiertas', (select count(*) from public.incidences where rubro_id = p_rubro and status = 'abierta'),
    'calculado_en', now()
  )
  from o, m
$function$;
