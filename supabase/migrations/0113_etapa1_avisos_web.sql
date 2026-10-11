-- =====================================================================
-- Etapa 1 · Bloque 1.9 — Avisos web (Web Push) por dispositivo
--  * Un registro por dispositivo (navegador) que activó los avisos. Con PIN
--    general no hay cuentas personales: el dispositivo lleva un nombre que
--    se le pone al activarlo. Se puede desactivar o retirar desde el panel
--    (nada se borra).
--  * Historial de cada aviso por dispositivo: pendiente, enviado o error.
--    "Enviado" significa que el servicio de avisos lo aceptó, no que se leyó.
--  * La clave única por evento y dispositivo deja lista la deduplicación
--    de los avisos de cierre (bloque 2.9): un reintento no duplica.
-- Solo agrega tablas. No envía nada.
-- =====================================================================

set lock_timeout = '5s';

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  label text,
  user_agent text,
  status text not null default 'activo' check (status in ('activo', 'desactivado', 'retirado', 'vencido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_success_at timestamptz,
  last_error text,
  last_error_at timestamptz
);

create table if not exists public.push_deliveries (
  id bigint generated always as identity primary key,
  subscription_id uuid references public.push_subscriptions(id) on delete restrict,
  kind text not null check (kind in ('prueba', 'aviso')),
  event_key text,
  title text not null,
  url text,
  status text not null check (status in ('pendiente', 'enviado', 'error')),
  http_status int,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists push_deliveries_subscription_idx on public.push_deliveries (subscription_id, created_at desc);
create unique index if not exists push_deliveries_event_once
  on public.push_deliveries (subscription_id, event_key) where event_key is not null;

-- Solo el servidor (clave de servicio) lee y escribe estas tablas.
alter table public.push_subscriptions enable row level security;
alter table public.push_deliveries enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;
revoke all on public.push_deliveries from anon, authenticated;
grant select, insert, update on public.push_subscriptions to service_role;
grant select, insert, update on public.push_deliveries to service_role;
grant usage, select on sequence public.push_deliveries_id_seq to service_role;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'push_subscriptions_no_delete') then
    create trigger push_subscriptions_no_delete before delete on public.push_subscriptions
      for each row execute function public.prevent_row_changes('Los dispositivos no se borran: se desactivan o se retiran');
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'push_deliveries_no_delete') then
    create trigger push_deliveries_no_delete before delete on public.push_deliveries
      for each row execute function public.prevent_row_changes('El historial de avisos no se borra');
  end if;
end $$;
