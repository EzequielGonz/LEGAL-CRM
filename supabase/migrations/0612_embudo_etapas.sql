-- 0612 · Etapas que faltaban en el embudo de Resultados (13/11).
-- «Conversaron», «Oportunidad real» y «Ventas», por período, con las personas
-- de cada una. Una sola función para la cifra y para la lista: así no pueden
-- diferir. Solo lectura. Repetible. No borra nada.
--
--   conversaron  : personas que escribieron dos o más mensajes en el período.
--   oportunidad  : oportunidades que en el período quedaron esperando a una
--                  persona por un motivo con interés (la lista de motivos la
--                  pasa el panel: una sola definición, en el código) o que
--                  fueron captadas en el período.
--   ventas       : derivados con el resultado «Operación concretada» en el período.
create or replace function public.embudo_etapa(
  p_etapa text,
  p_rubro uuid,
  p_areas text[],
  p_desde timestamptz,
  p_hasta timestamptz,
  p_motivos text[] default '{}'
)
returns table (conversation_id uuid, opportunity_id uuid, at timestamptz)
language sql
stable
set search_path = public
as $$
  select m.conversation_id, null::uuid as opportunity_id, max(m.created_at) as at
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
   where p_etapa = 'conversaron'
     and c.area::text = any (p_areas)
     and m.direction = 'entrante'
     and m.duplicate_of is null
     and m.created_at >= p_desde and m.created_at < p_hasta
   group by m.conversation_id
  having count(*) >= 2
  union all
  select o.conversation_id, o.id, max(x.at)
    from (
      select e.opportunity_id, e.at
        from public.opportunity_events e
       where e.dimension = 'atencion' and e.to_value = 'requiere_humano'
         and e.at >= p_desde and e.at < p_hasta
         and exists (select 1 from unnest(p_motivos) mo where e.reason like mo || '%')
      union all
      select o2.id, o2.captured_at
        from public.opportunities o2
       where o2.capture_state = 'captado'
         and o2.captured_at >= p_desde and o2.captured_at < p_hasta
    ) x
    join public.opportunities o on o.id = x.opportunity_id
   where p_etapa = 'oportunidad' and o.rubro_id = p_rubro
   group by o.conversation_id, o.id
  union all
  select o.conversation_id, o.id, o.post_derivation_at
    from public.opportunities o
   where p_etapa = 'ventas' and o.rubro_id = p_rubro
     and o.derivation_state = 'derivado'
     and o.post_derivation_state = 'operacion_concretada'
     and o.post_derivation_at >= p_desde and o.post_derivation_at < p_hasta;
$$;

revoke all on function public.embudo_etapa(text, uuid, text[], timestamptz, timestamptz, text[]) from public, anon, authenticated;
grant execute on function public.embudo_etapa(text, uuid, text[], timestamptz, timestamptz, text[]) to service_role;

comment on function public.embudo_etapa(text, uuid, text[], timestamptz, timestamptz, text[]) is
  'Personas de una etapa del embudo de Resultados en un período: conversaron | oportunidad | ventas. Solo lectura.';
