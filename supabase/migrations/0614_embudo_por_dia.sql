-- 0614 · Serie por día para el gráfico del período en Resultados (13/11).
-- Contactados, personas que respondieron y captados por día, en hora de
-- Argentina, con las mismas condiciones que el embudo. Solo lectura.
-- Repetible. No borra nada.
create or replace function public.embudo_por_dia(
  p_rubro uuid,
  p_areas text[],
  p_desde timestamptz,
  p_hasta timestamptz
)
returns table (dia date, contactados integer, respondieron integer, captados integer)
language sql
stable
set search_path = public
as $$
  with dias as (
    select generate_series((p_desde at time zone 'America/Argentina/Buenos_Aires')::date,
                           ((p_hasta - interval '1 second') at time zone 'America/Argentina/Buenos_Aires')::date,
                           interval '1 day')::date as dia
  ),
  c as (
    select (cc.sent_at at time zone 'America/Argentina/Buenos_Aires')::date as dia, count(*)::int as n
      from public.campaign_contacts cc
      join public.campaigns ca on ca.id = cc.campaign_id
     where ca.area::text = any (p_areas)
       and cc.status::text in ('enviado', 'entregado', 'leido', 'respondio')
       and cc.sent_at >= p_desde and cc.sent_at < p_hasta
     group by 1
  ),
  r as (
    select (m.created_at at time zone 'America/Argentina/Buenos_Aires')::date as dia, count(distinct m.conversation_id)::int as n
      from public.messages m
      join public.conversations co on co.id = m.conversation_id
     where co.area::text = any (p_areas)
       and m.direction = 'entrante'
       and m.created_at >= p_desde and m.created_at < p_hasta
     group by 1
  ),
  k as (
    select (o.captured_at at time zone 'America/Argentina/Buenos_Aires')::date as dia, count(*)::int as n
      from public.opportunities o
     where o.rubro_id = p_rubro and o.capture_state = 'captado'
       and o.captured_at >= p_desde and o.captured_at < p_hasta
     group by 1
  )
  select d.dia, coalesce(c.n, 0), coalesce(r.n, 0), coalesce(k.n, 0)
    from dias d
    left join c on c.dia = d.dia
    left join r on r.dia = d.dia
    left join k on k.dia = d.dia
   order by d.dia;
$$;

revoke all on function public.embudo_por_dia(uuid, text[], timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.embudo_por_dia(uuid, text[], timestamptz, timestamptz) to service_role;

comment on function public.embudo_por_dia(uuid, text[], timestamptz, timestamptz) is
  'Contactados, personas que respondieron y captados por día (hora de Argentina) en un período. Solo lectura.';
