-- 0624 · Revisión de seguridad del 15/11 sobre la 0621.
-- La pausa general (30 intentos fallidos en total) podía usarse para dejar a la
-- responsable afuera: alguien desde varias redes la volvía a disparar apenas
-- vencía. Ahora un intento «confiable» (desde un dispositivo que ya ingresó
-- bien, o con una sesión abierta) no queda frenado por la pausa general ni
-- suma a ese contador; sigue teniendo el tope de 5 por origen.
-- Reemplaza la función de la 0621 (misma tabla, sin cambios de datos).
-- Repetible sin error. Para volver atrás: aplicar de nuevo la 0621.

drop function if exists public.access_try_attempt(text);

create or replace function public.access_try_attempt(p_origin text, p_confiable boolean default false)
returns jsonb
language plpgsql
set search_path to ''
as $$
declare
  v_o public.access_origin_limits%rowtype;
  v_g public.access_origin_limits%rowtype;
  v_of integer;
  v_gf integer;
begin
  insert into public.access_origin_limits (origin_hash, failures, updated_at)
  values (p_origin, 0, now()), ('__general__', 0, now())
  on conflict (origin_hash) do nothing;

  select * into v_g from public.access_origin_limits where origin_hash = '__general__' for update;
  select * into v_o from public.access_origin_limits where origin_hash = p_origin for update;

  if not p_confiable and v_g.locked_until is not null and v_g.locked_until > now() then
    return jsonb_build_object('permitido', false, 'hasta', v_g.locked_until, 'general', true);
  end if;
  if v_o.locked_until is not null and v_o.locked_until > now() then
    return jsonb_build_object('permitido', false, 'hasta', v_o.locked_until, 'general', false);
  end if;

  v_of := case when v_o.updated_at < now() - interval '15 minutes' then 0 else v_o.failures end + 1;
  update public.access_origin_limits
     set failures = v_of,
         locked_until = case when v_of >= 5 then now() + interval '15 minutes' else null end,
         updated_at = now()
   where origin_hash = p_origin;

  if not p_confiable then
    v_gf := case when v_g.updated_at < now() - interval '15 minutes' then 0 else v_g.failures end + 1;
    update public.access_origin_limits
       set failures = v_gf,
           locked_until = case when v_gf >= 30 then now() + interval '15 minutes' else null end,
           updated_at = now()
     where origin_hash = '__general__';
  else
    v_gf := 0;
  end if;

  return jsonb_build_object(
    'permitido', true,
    'hasta', case when v_of >= 5 or v_gf >= 30 then now() + interval '15 minutes' else null end,
    'general', v_gf >= 30 and v_of < 5
  );
end $$;

-- access_attempt_ok: un intento confiable no sumó al general, así que no lo descuenta.
create or replace function public.access_attempt_ok(p_origin text, p_confiable boolean default false)
returns void
language plpgsql
set search_path to ''
as $$
begin
  update public.access_origin_limits
     set failures = 0, locked_until = null, updated_at = now()
   where origin_hash = p_origin;
  if not p_confiable then
    update public.access_origin_limits
       set failures = greatest(failures - 1, 0), updated_at = now()
     where origin_hash = '__general__' and (locked_until is null or locked_until <= now());
  end if;
end $$;
drop function if exists public.access_attempt_ok(text);

revoke all on function public.access_try_attempt(text, boolean) from public, anon, authenticated;
revoke all on function public.access_attempt_ok(text, boolean) from public, anon, authenticated;
grant execute on function public.access_try_attempt(text, boolean) to service_role;
grant execute on function public.access_attempt_ok(text, boolean) to service_role;
