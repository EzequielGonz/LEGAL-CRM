-- =====================================================================
-- Etapa 1 · Bloque 1.4 — Perfiles y configuración manual
--  * Cada perfil (rubros.id, permanente) guarda a mano: nombre del perfil
--    o marca y nombre de presentación del agente. Arrancan vacíos: ningún
--    nombre viene del código ni de documentos anteriores.
--  * Líneas de WhatsApp por perfil (una o varias) con su asignación al
--    agente y a campañas. Las credenciales siguen en la configuración
--    privada del servidor: la línea guarda solo el prefijo de las variables
--    (p. ej. WHATSAPP_CIVIL -> WHATSAPP_CIVIL_PHONE_NUMBER_ID / _ACCESS_TOKEN).
--  * No se registra ninguna línea automáticamente: las conexiones actuales
--    siguen funcionando como hoy y se asignan a mano desde el perfil.
-- =====================================================================

set lock_timeout = '5s';

alter table public.rubros add column if not exists brand_name text;
alter table public.rubros add column if not exists agent_presentation_name text;
alter table public.rubros add column if not exists settings_updated_at timestamptz;

create table if not exists public.profile_lines (
  id uuid primary key default gen_random_uuid(),
  rubro_id uuid not null references public.rubros(id),
  area area_type not null,
  label text not null,
  phone_display text,
  credential_key text not null check (credential_key ~ '^[A-Z][A-Z0-9_]{2,60}$'),
  channel_id uuid references public.channels(id) on delete set null,
  answers_with_agent boolean not null default true,
  use_for_campaigns boolean not null default true,
  daily_limit integer check (daily_limit is null or daily_limit > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists profile_lines_key_active
  on public.profile_lines (credential_key) where active;
create index if not exists profile_lines_rubro_idx on public.profile_lines (rubro_id);

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'profile_lines_no_delete') then
    create trigger profile_lines_no_delete before delete on public.profile_lines
      for each row execute function public.prevent_hard_delete();
  end if;
end $$;

-- Línea por la que se habla en cada conversación (para responder por la misma)
-- y línea asignada a cada campaña.
alter table public.conversations add column if not exists line_id uuid references public.profile_lines(id) on delete set null;
alter table public.campaigns add column if not exists line_id uuid references public.profile_lines(id) on delete set null;
-- Días de ejecución de la campaña (1 = lunes ... 7 = domingo). Vacío = todos.
alter table public.campaigns add column if not exists run_days smallint[];

alter table public.profile_lines enable row level security;
revoke all on public.profile_lines from anon, authenticated;
