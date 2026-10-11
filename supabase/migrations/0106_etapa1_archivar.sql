-- =====================================================================
-- Etapa 1 · Pregunta 20 — Archivar en lugar de eliminar
-- Bases y campañas se archivan (se pueden consultar y recuperar); los
-- perfiles no se eliminan. La base de datos impide el borrado físico, así
-- no se pierden archivos, filas, destinatarios, conversaciones ni vínculos
-- aunque alguien lo intente por fuera del panel.
-- Archivar una campaña la deja pausada; recuperarla no la reanuda.
-- =====================================================================

set lock_timeout = '5s';

alter table public.imported_bases add column if not exists archived_at timestamptz;
alter table public.imported_bases add column if not exists archived_note text;

alter table public.campaigns add column if not exists archived_at timestamptz;
alter table public.campaigns add column if not exists archived_note text;
alter table public.campaigns add column if not exists pause_reason text;
alter table public.campaigns add column if not exists paused_at timestamptz;

create or replace function public.prevent_hard_delete()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  raise exception 'No se elimina (%): se archiva desde el panel para conservar sus datos y vínculos.', tg_table_name;
end $function$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'imported_bases_no_delete') then
    create trigger imported_bases_no_delete before delete on public.imported_bases
      for each row execute function public.prevent_hard_delete();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'campaigns_no_delete') then
    create trigger campaigns_no_delete before delete on public.campaigns
      for each row execute function public.prevent_hard_delete();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'rubros_no_delete') then
    create trigger rubros_no_delete before delete on public.rubros
      for each row execute function public.prevent_hard_delete();
  end if;
end $$;

-- La campaña pausada antes de la Etapa 1 no tiene motivo guardado: el panel
-- lo muestra como "pausada antes de la Etapa 1" (no se modificó su fila).
