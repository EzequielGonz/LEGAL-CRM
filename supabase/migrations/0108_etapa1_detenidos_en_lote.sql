-- =====================================================================
-- Etapa 1 · Bloque 1.2 — Consulta en lote de contactos detenidos (para
-- excluirlos al armar campañas o al reimportar, sin una consulta por contacto).
-- =====================================================================
create or replace function public.detained_contact_ids(p_ids uuid[])
returns table (contact_id uuid, motive text, hard_block boolean)
language sql
stable
set search_path to ''
as $function$
  select distinct on (c.id) c.id, d.motive, (d.motive = 'no_contacto' or d.minor_reported)
    from public.contacts c
    join public.contact_detentions d
      on d.status = 'vigente'
     and d.rubro_id = c.rubro_id
     and (d.contact_id = c.id
          or (d.phone_normalized is not null and d.phone_normalized = public.normalize_phone_ar(c.phone)))
   where c.id = any(p_ids)
   order by c.id, (d.motive = 'no_contacto' or d.minor_reported) desc, d.created_at
$function$;

revoke all on function public.detained_contact_ids(uuid[]) from public, anon, authenticated;
grant execute on function public.detained_contact_ids(uuid[]) to service_role;

-- Detención vigente por teléfono dentro de un perfil (para importaciones).
create or replace function public.detained_phones(p_rubro uuid, p_phones text[])
returns table (phone_normalized text, motive text)
language sql
stable
set search_path to ''
as $function$
  select distinct on (d.phone_normalized) d.phone_normalized, d.motive
    from public.contact_detentions d
   where d.status = 'vigente' and d.rubro_id = p_rubro and d.phone_normalized = any(p_phones)
   order by d.phone_normalized, (d.motive = 'no_contacto' or d.minor_reported) desc, d.created_at
$function$;

revoke all on function public.detained_phones(uuid, text[]) from public, anon, authenticated;
grant execute on function public.detained_phones(uuid, text[]) to service_role;
