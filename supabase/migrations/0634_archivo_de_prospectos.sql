-- 0634 · Archivo de prospectos (19/11, pedido de la responsable).
-- Quien se archiva sale de Hoy, Activos y Descartados y vive en
-- Descartados → Archivados. No se borra nada: se guarda cuándo, quién y por qué,
-- y se puede desarchivar. Si la persona vuelve a escribir, se desarchiva sola.
-- Repetible sin error. Solo agrega columnas y un disparador; no cambia datos.
-- RLS sin cambios (la tabla ya la tiene; sin permisos para la clave pública).
--
-- Para volver atrás (sin borrar datos): drop trigger messages_zz_desarchivar on
-- public.messages; las columnas pueden quedar.
set lock_timeout = '5s';

alter table public.opportunities add column if not exists archived_at timestamptz;
alter table public.opportunities add column if not exists archived_by text;
alter table public.opportunities add column if not exists archive_reason text;

create index if not exists opportunities_archivadas_idx
  on public.opportunities (rubro_id, archived_at desc) where archived_at is not null;

create or replace function public.opportunity_desarchivar_al_escribir()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  if new.direction = 'entrante' and new.duplicate_of is null then
    begin
      update public.opportunities o
         set archived_at = null, archived_by = null, archive_reason = null
       where o.conversation_id = new.conversation_id and o.archived_at is not null;
    exception when others then
      raise warning 'opportunity_desarchivar_al_escribir: % (mensaje %)', sqlerrm, new.id;
    end;
  end if;
  return new;
end $function$;

revoke all on function public.opportunity_desarchivar_al_escribir() from public, anon, authenticated;

drop trigger if exists messages_zz_desarchivar on public.messages;
create trigger messages_zz_desarchivar
  after insert on public.messages
  for each row execute function public.opportunity_desarchivar_al_escribir();
