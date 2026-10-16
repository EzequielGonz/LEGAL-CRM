-- =====================================================================
-- Etapa 2 · Bloque 2.0 — Calendario de contacto: excepciones cargadas a mano
--
-- El horario general (lunes a sábado de 8 a 21, hora de Argentina, aunque
-- sea feriado; domingos no) está en el código (src/lib/contacto/reglas.ts).
-- Acá se guardan las excepciones que se cargan desde el panel: un día
-- cerrado o un horario más corto ese día. Una excepción solo restringe: no
-- abre domingos ni amplía el horario general.
--
-- No se borra: una excepción que ya no corresponde se archiva (queda el
-- registro de quién la cargó y cuándo dejó de regir).
-- Aditiva: la versión publicada no la usa.
-- =====================================================================

create table if not exists public.contact_calendar_exceptions (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  closed boolean not null,
  start_hour smallint,
  end_hour smallint,
  note text,
  created_at timestamptz not null default now(),
  created_by text not null default 'operador',
  archived_at timestamptz,
  archived_by text,
  archive_reason text,
  constraint contact_calendar_exceptions_hours check (
    closed
    or (start_hour is not null and end_hour is not null
        and start_hour >= 8 and end_hour <= 21 and start_hour < end_hour)
  )
);

-- Una sola excepción vigente por día.
create unique index if not exists contact_calendar_exceptions_day_once
  on public.contact_calendar_exceptions (day) where archived_at is null;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'contact_calendar_exceptions_no_delete') then
    create trigger contact_calendar_exceptions_no_delete before delete on public.contact_calendar_exceptions
      for each row execute function public.prevent_hard_delete();
  end if;
end $$;

-- Solo la clave de servicio (servidor, después del PIN).
alter table public.contact_calendar_exceptions enable row level security;
revoke all on public.contact_calendar_exceptions from anon, authenticated;
grant select, insert, update on public.contact_calendar_exceptions to service_role;
