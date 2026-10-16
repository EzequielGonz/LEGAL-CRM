-- =====================================================================
-- Reversión de 0311 (Marketing: Extraer negocios y Pide presupuesto).
-- PRIMERO volver el código a la versión anterior (Instant Rollback en Vercel).
-- Se DETIENE si ya hay extracciones o presupuestos: nada se borra. Las
-- columnas nuevas de marketing_leads y campaigns se dejan (no molestan).
-- =====================================================================
set lock_timeout = '5s';
do $$
declare v text;
begin
  select string_agg(m, '; ') into v from (
    select 'extracciones: ' || count(*) m from public.marketing_extracciones having count(*) > 0
    union all select 'presupuestos: ' || count(*) from public.marketing_budgets having count(*) > 0
  ) x;
  if v is not null then
    raise exception 'No se revierte 0311: ya hay datos (%).', v;
  end if;
end $$;
alter table public.marketing_leads drop constraint if exists marketing_leads_analysis_status_check;
update public.marketing_leads set analysis_status = 'pendiente' where analysis_status = 'no_iniciado';
alter table public.marketing_leads add constraint marketing_leads_analysis_status_check
  check (analysis_status in ('pendiente', 'analizando', 'listo', 'error', 'omitido'));
drop trigger if exists marketing_budgets_no_delete on public.marketing_budgets;
drop table if exists public.marketing_budgets;
alter table public.campaigns drop column if exists marketing_extraccion_id;
alter table public.marketing_leads drop column if exists extraction_id;
drop trigger if exists marketing_extracciones_no_delete on public.marketing_extracciones;
drop table if exists public.marketing_extracciones;
