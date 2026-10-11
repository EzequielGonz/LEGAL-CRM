-- =====================================================================
-- Etapa 1 · Bloque 1.6 — Importación y calidad de bases
--  * Huella del archivo: evita importar dos veces lo mismo por error.
--  * Por fila: si ya había sido contactado (criterio de la sección 5.1),
--    si está detenido y si hay un conflicto con datos existentes.
--  * Calidad por base con su denominador (los que respondieron): números
--    equivocados, consultas negadas y contestadores automáticos; lo que
--    no está clasificado queda como "sin clasificar".
-- Cargar un archivo nunca envía mensajes.
-- =====================================================================

set lock_timeout = '5s';

alter table public.imported_bases add column if not exists file_fingerprint text;
alter table public.imported_bases add column if not exists import_summary jsonb;
create unique index if not exists imported_bases_fingerprint_once
  on public.imported_bases (area, file_fingerprint)
  where file_fingerprint is not null and archived_at is null;

alter table public.imported_base_rows add column if not exists previously_contacted boolean;
alter table public.imported_base_rows add column if not exists previous_contact_state text;
alter table public.imported_base_rows add column if not exists detained_motive text;
alter table public.imported_base_rows add column if not exists conflict text;

-- Calidad de la respuesta (se marca desde la ficha; la migración la deduce
-- de la reconciliación sin cambiar filas).
alter table public.opportunities add column if not exists response_quality text
  check (response_quality in ('numero_equivocado', 'consulta_negada', 'contestador_automatico'));

create or replace function public.base_quality(p_base uuid)
returns jsonb
language sql
stable
set search_path to ''
as $function$
  with cts as (
    select distinct r.contact_id from public.imported_base_rows r
     where r.base_id = p_base and r.contact_id is not null
  ),
  resp as (
    select o.contact_id, o.response_quality, rec.grupo, rec.grupo_tabla_aprobada,
           exists (select 1 from public.contact_detentions d
                    where d.contact_id = o.contact_id and d.status = 'vigente'
                      and (d.motive = 'numero_equivocado' or 'numero_equivocado' = any(d.motives))) as det_equivocado
      from public.opportunities o
      join cts on cts.contact_id = o.contact_id
      left join public.etapa1_reconciliacion rec on rec.contact_id = o.contact_id
     where o.contact_state = 'respondio'
  ),
  cls as (
    select contact_id,
           (response_quality = 'numero_equivocado' or det_equivocado) as equivocado,
           (response_quality = 'consulta_negada' or grupo_tabla_aprobada = 'B8' or grupo = 'B8') as negada,
           (response_quality = 'contestador_automatico' or grupo = 'B10') as contestador
      from resp
  )
  select jsonb_build_object(
    'filas', (select count(*) from public.imported_base_rows where base_id = p_base),
    'contactos', (select count(*) from cts),
    'contactados', (select count(*) from public.opportunities o join cts on cts.contact_id = o.contact_id
                     where o.contact_state in ('contactado_sin_respuesta', 'respondio')),
    'respondieron', (select count(*) from cls),
    'numeros_equivocados', (select count(*) from cls where equivocado),
    'consultas_negadas', (select count(*) from cls where negada),
    'contestadores_automaticos', (select count(*) from cls where contestador),
    'sin_clasificar', (select count(*) from cls where not (coalesce(equivocado, false) or coalesce(negada, false) or coalesce(contestador, false))),
    'detenidos', (select count(distinct d.contact_id) from public.contact_detentions d
                   join cts on cts.contact_id = d.contact_id where d.status = 'vigente')
  )
$function$;

revoke all on function public.base_quality(uuid) from public, anon, authenticated;
grant execute on function public.base_quality(uuid) to service_role;
