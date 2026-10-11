-- =====================================================================
-- Etapa 1 · Bloque 1.3 (parte 1) — Estados de entrega y lectura
-- Aditiva. Antes el webhook recibía "entregado/leído/fallido" y no los
-- guardaba; ahora quedan en el mensaje y en un historial de eventos.
-- =====================================================================

set lock_timeout = '5s';

alter table public.messages add column if not exists delivery_status text
  check (delivery_status in ('enviado', 'entregado', 'leido', 'fallido'));
alter table public.messages add column if not exists delivery_status_at timestamptz;
alter table public.messages add column if not exists delivery_error jsonb;

create table if not exists public.message_status_events (
  id bigint generated always as identity primary key,
  received_at timestamptz not null default now(),
  external_message_id text not null,
  status text not null check (status in ('enviado', 'entregado', 'leido', 'fallido')),
  status_at timestamptz not null,
  recipient text,
  errors jsonb,
  raw jsonb not null default '{}'::jsonb
);
create index if not exists message_status_events_wamid_idx
  on public.message_status_events (external_message_id, status_at);

-- Búsquedas por id del proveedor en destinatarios de campaña.
create index if not exists campaign_contacts_message_id_idx
  on public.campaign_contacts (message_id) where message_id is not null;

alter table public.message_status_events enable row level security;
revoke all on public.message_status_events from anon, authenticated;
