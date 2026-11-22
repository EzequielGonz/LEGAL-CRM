-- ---------------------------------------------------------------------
-- 0638 · Tope de gasto de Gemini por perfil (22/11)
--
-- Qué hace:
--  1. Acepta el uso «recontacto» en agent_turn_logs.uso (el recontacto del
--     bot también llama a la IA y hasta hoy no dejaba registro de tokens).
--  2. Agrega un índice (rubro_id, created_at) para sumar el gasto por perfil.
--  3. Crea la función gasto_gemini_resumen(desde_dia, desde_mes): suma los
--     tokens del día y del mes por rubro y cuenta los turnos que frenó el
--     tope. La usa el panel (servidor) con la clave de servicio.
--
-- No borra ni cambia datos. Repetible. La función es de solo lectura, sin
-- permisos para la clave pública (anon ni authenticated).
-- Reversión: docs/operacion-2211/MIGRACIONES.md (sin tocar datos).
-- ---------------------------------------------------------------------
set lock_timeout = '5s';

-- 1) uso «recontacto»: se reemplaza la restricción por otra que incluye el valor nuevo.
do $$
declare
  v_nombre text;
begin
  select c.conname into v_nombre
    from pg_constraint c
   where c.conrelid = 'public.agent_turn_logs'::regclass
     and c.contype = 'c'
     -- Solo la restricción de la columna «uso» (palabra completa; no otra que contenga «uso» por casualidad).
     and pg_get_constraintdef(c.oid) ~* '\muso\M'
     and pg_get_constraintdef(c.oid) not ilike '%recontacto%'
   limit 1;
  if v_nombre is not null then
    execute format('alter table public.agent_turn_logs drop constraint %I', v_nombre);
  end if;
  if not exists (
    select 1 from pg_constraint c
     where c.conrelid = 'public.agent_turn_logs'::regclass
       and c.conname = 'agent_turn_logs_uso_check'
  ) then
    alter table public.agent_turn_logs
      add constraint agent_turn_logs_uso_check
      check (uso in ('conversacion', 'analisis', 'evaluacion_plantillas', 'recontacto'));
  end if;
end $$;

-- 2) índice para el gasto por perfil
create index if not exists agent_turn_logs_rubro_fecha_idx
  on public.agent_turn_logs (rubro_id, created_at);

-- 3) gasto del día y del mes por rubro (en tokens; el precio se aplica en el servidor)
create or replace function public.gasto_gemini_resumen(p_desde_dia timestamptz, p_desde_mes timestamptz)
returns table (
  rubro_id uuid,
  tokens_entrada_dia bigint,
  tokens_salida_dia bigint,
  tokens_entrada_mes bigint,
  tokens_salida_mes bigint,
  turnos_topeados_dia bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    l.rubro_id,
    coalesce(sum(l.tokens_entrada) filter (where l.created_at >= p_desde_dia), 0)::bigint,
    coalesce(sum(l.tokens_salida + l.tokens_razonamiento) filter (where l.created_at >= p_desde_dia), 0)::bigint,
    coalesce(sum(l.tokens_entrada), 0)::bigint,
    coalesce(sum(l.tokens_salida + l.tokens_razonamiento), 0)::bigint,
    count(*) filter (where l.created_at >= p_desde_dia and l.error like 'tope_gasto%')::bigint
  from public.agent_turn_logs l
  where l.created_at >= least(p_desde_dia, p_desde_mes)
  group by l.rubro_id;
$$;

revoke all on function public.gasto_gemini_resumen(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.gasto_gemini_resumen(timestamptz, timestamptz) to service_role;
