-- 0625 · Permiso del mensaje de crisis (15/11, decisión de la responsable).
--
-- Las líneas de ayuda le llegan siempre a la persona que habla de quitarse la
-- vida o de hacerse daño, también si una persona del equipo ya había tomado el
-- chat. grant_ai_final_ack no otorga permiso en un chat ya tomado (para no
-- pisar a la persona); esta función sí, solo para ese único mensaje fijo:
-- deja el chat en atención humana y devuelve un permiso de un solo uso que
-- vence a los 5 minutos. No cambia ni borra datos. Repetible sin error.
-- Para volver atrás: drop de la función (el mensaje vuelve a salir solo si el
-- bot tenía el chat).

create or replace function public.grant_crisis_ack(p_conversation uuid)
returns uuid
language sql
set search_path = public
as $$
  update public.conversations
     set ai_enabled = false,
         status = 'requiere_atencion_humana',
         ai_ack_token = gen_random_uuid(),
         ai_ack_expires_at = now() + interval '5 minutes'
   where id = p_conversation
  returning ai_ack_token;
$$;

revoke all on function public.grant_crisis_ack(uuid) from public, anon, authenticated;
grant execute on function public.grant_crisis_ack(uuid) to service_role;
