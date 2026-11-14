-- 0617 · Informes de mejora del bot (14/11).
-- La IA (Gemini) relee conversaciones reales del perfil, sin teléfonos,
-- documentos, correos ni nombres, y deja hallazgos y propuestas. Aplicar una
-- propuesta suma una ficha de conocimiento al bot del perfil o crea un rol
-- nuevo: nunca edita ni borra lo que hay. Repetible. No borra nada.
-- RLS activado y sin permisos para la clave pública.

create table if not exists public.bot_informes_mejora (
  id uuid primary key default gen_random_uuid(),
  rubro_id uuid not null references public.rubros(id) on delete restrict,
  creado_at timestamptz not null default now(),
  creado_por text not null default 'panel',
  dias smallint not null check (dias between 1 and 90),
  conversaciones integer not null default 0 check (conversaciones >= 0),
  modelo text,
  estado text not null default 'listo' check (estado in ('listo', 'error')),
  resultado jsonb not null default '{}'::jsonb,
  metricas jsonb not null default '{}'::jsonb,
  aplicadas jsonb not null default '[]'::jsonb,
  error text,
  tokens_entrada integer,
  tokens_salida integer
);

create index if not exists bot_informes_mejora_rubro_idx on public.bot_informes_mejora (rubro_id, creado_at desc);

alter table public.bot_informes_mejora enable row level security;
revoke all on public.bot_informes_mejora from anon, authenticated;

comment on table public.bot_informes_mejora is 'Informes de la IA sobre las conversaciones reales de cada perfil, con propuestas de mejora del bot. Aplicar una propuesta solo suma (ficha de conocimiento o rol) y queda en ops_change_log.';
