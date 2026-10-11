-- =====================================================================
-- Etapa 1 · Bloques 1.5 y 1.8 — Inbox paginado: último mensaje de cada
-- conversación en una sola consulta.
-- =====================================================================
create or replace function public.conversation_last_messages(p_ids uuid[])
returns table (conversation_id uuid, body text, direction message_direction, message_type text, created_at timestamptz)
language sql
stable
set search_path to ''
as $function$
  select distinct on (m.conversation_id) m.conversation_id, m.body, m.direction, m.message_type, m.created_at
    from public.messages m
   where m.conversation_id = any(p_ids) and m.duplicate_of is null
   order by m.conversation_id, m.created_at desc
$function$;
revoke all on function public.conversation_last_messages(uuid[]) from public, anon, authenticated;
grant execute on function public.conversation_last_messages(uuid[]) to service_role;

create index if not exists messages_conversation_created_idx on public.messages (conversation_id, created_at desc);
