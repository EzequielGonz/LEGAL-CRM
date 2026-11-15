-- 0621 · Intentos del código de ingreso, atómicos y con tope general (15/11, auditoría).
--
-- Antes: el servidor miraba si el origen estaba en pausa, comprobaba el código
-- (tarda) y recién después sumaba el fallo. Varios intentos al mismo tiempo
-- pasaban todos antes de que la pausa se activara. Ahora cada intento se
-- reserva ANTES de comprobar el código, con la fila bloqueada (for update):
--   · por origen: 5 intentos en 15 minutos; el 6.º espera 15 minutos;
--   · en general (todos los orígenes juntos): 30 intentos fallidos en 15
--     minutos pausan el ingreso 15 minutos para todos (ataque desde muchas redes).
-- Un ingreso correcto devuelve su intento (access_attempt_ok): el origen
-- vuelve a cero y el contador general baja uno.
--
-- Usa la misma tabla access_origin_limits (fila especial '__general__').
-- No cambia ni borra datos. Repetible sin error. Para volver atrás: drop de
-- las dos funciones (la app vuelve sola a la lectura anterior).

create or replace function public.access_try_attempt(p_origin text)
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

  -- Siempre en el mismo orden para no trabarse entre dos intentos.
  select * into v_g from public.access_origin_limits where origin_hash = '__general__' for update;
  select * into v_o from public.access_origin_limits where origin_hash = p_origin for update;

  if v_g.locked_until is not null and v_g.locked_until > now() then
    return jsonb_build_object('permitido', false, 'hasta', v_g.locked_until, 'general', true);
  end if;
  if v_o.locked_until is not null and v_o.locked_until > now() then
    return jsonb_build_object('permitido', false, 'hasta', v_o.locked_until, 'general', false);
  end if;

  v_of := case when v_o.updated_at < now() - interval '15 minutes' then 0 else v_o.failures end + 1;
  v_gf := case when v_g.updated_at < now() - interval '15 minutes' then 0 else v_g.failures end + 1;

  update public.access_origin_limits
     set failures = v_of,
         locked_until = case when v_of >= 5 then now() + interval '15 minutes' else null end,
         updated_at = now()
   where origin_hash = p_origin;
  update public.access_origin_limits
     set failures = v_gf,
         locked_until = case when v_gf >= 30 then now() + interval '15 minutes' else null end,
         updated_at = now()
   where origin_hash = '__general__';

  -- Este intento se comprueba igual; si falla y era el último, queda la pausa.
  return jsonb_build_object(
    'permitido', true,
    'hasta', case when v_of >= 5 or v_gf >= 30 then now() + interval '15 minutes' else null end,
    'general', v_gf >= 30 and v_of < 5
  );
end $$;

create or replace function public.access_attempt_ok(p_origin text)
returns void
language plpgsql
set search_path to ''
as $$
begin
  update public.access_origin_limits
     set failures = 0, locked_until = null, updated_at = now()
   where origin_hash = p_origin;
  update public.access_origin_limits
     set failures = greatest(failures - 1, 0), updated_at = now()
   where origin_hash = '__general__' and (locked_until is null or locked_until <= now());
end $$;

-- Solo el servidor (clave de servicio) las llama.
revoke all on function public.access_try_attempt(text) from public, anon, authenticated;
revoke all on function public.access_attempt_ok(text) from public, anon, authenticated;
grant execute on function public.access_try_attempt(text) to service_role;
grant execute on function public.access_attempt_ok(text) to service_role;
