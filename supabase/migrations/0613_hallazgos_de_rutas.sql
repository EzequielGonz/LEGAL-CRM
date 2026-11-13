-- 0613 · Hallazgos del inventario de rutas (13/11).
-- 1) Horarios de la agenda: se reemplazan en una sola operación. Antes se
--    borraban y después se insertaban; si fallaba en el medio, el área
--    quedaba sin horarios. Los anteriores no se borran: quedan inactivos.
-- 2) «Vaciar la cola» de búsquedas: las pendientes pasan a «cancelada».
-- 3) Teléfonos de avisos: se archivan con fecha en lugar de borrarse.
-- Repetible. No borra nada.

create or replace function public.reemplazar_disponibilidad(p_area text, p_reglas jsonb)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_nuevas integer;
begin
  if p_area not in ('civil', 'penal') then
    raise exception 'Área inválida';
  end if;
  if jsonb_typeof(p_reglas) <> 'array' then
    raise exception 'Reglas inválidas';
  end if;
  update public.availability_rules set active = false where area::text = p_area and active;
  insert into public.availability_rules (area, weekday, start_time, end_time, slot_duration_minutes, active)
  select p_area::area_type, (r->>'weekday')::int, (r->>'start_time')::time, (r->>'end_time')::time, coalesce((r->>'slot_duration_minutes')::int, 30), true
    from jsonb_array_elements(p_reglas) r;
  get diagnostics v_nuevas = row_count;
  return v_nuevas;
end;
$$;

revoke all on function public.reemplazar_disponibilidad(text, jsonb) from public, anon, authenticated;
grant execute on function public.reemplazar_disponibilidad(text, jsonb) to service_role;

alter table public.marketing_scrape_jobs drop constraint if exists marketing_scrape_jobs_status_check;
alter table public.marketing_scrape_jobs
  add constraint marketing_scrape_jobs_status_check
  check (status = any (array['pendiente'::text, 'ejecutando'::text, 'listo'::text, 'error'::text, 'cancelada'::text]));

alter table public.notification_phones
  add column if not exists archived_at timestamptz,
  add column if not exists archived_reason text;

comment on column public.notification_phones.archived_at is 'Cuándo se quitó de los avisos. Null: recibe avisos. No se borra la fila.';
