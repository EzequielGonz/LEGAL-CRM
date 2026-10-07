-- =====================================================================
-- Pipeline de prospección de Kocos Marketing.
--
-- marketing_leads: UNA fila por contacto de Marketing. Guarda el análisis
-- del negocio (web + Google Maps), la calificación (score/prioridad), el
-- gancho del primer mensaje y el estado del seguimiento (repesca).
--
-- marketing_events: una fila por cada hecho relevante de un prospecto
-- (mensaje inicial, respondió, repesca enviada, cerrado, baja...). De acá
-- salen las ESTADÍSTICAS de cada prospecto que inició conversación.
-- =====================================================================

create table if not exists marketing_leads (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null unique references contacts(id) on delete cascade,

  -- De dónde viene: 'scraper' (dato frío de Google Maps) o 'directa'
  -- (nos escribió él: Instagram, WhatsApp, landing...).
  source_kind text not null default 'scraper' check (source_kind in ('scraper', 'directa')),
  source_detail text,

  place_id text,
  website text,
  maps_data jsonb not null default '{}'::jsonb,

  -- Análisis
  analysis_status text not null default 'pendiente'
    check (analysis_status in ('pendiente', 'analizando', 'listo', 'error', 'omitido')),
  analysis_error text,
  analysis jsonb not null default '{}'::jsonb,
  analyzed_at timestamptz,
  lead_score integer,
  priority text check (priority in ('alta', 'media', 'baja')),
  hook text,
  summary text,

  -- Seguimiento
  outreach_status text not null default 'sin_contactar'
    check (outreach_status in (
      'sin_contactar', 'contactado', 'respondio', 'repesca',
      'cerrado', 'no_interesado', 'baja'
    )),
  first_contacted_at timestamptz,
  last_outbound_at timestamptz,
  last_inbound_at timestamptz,
  followup_count integer not null default 0,
  next_followup_at timestamptz,
  closed_at timestamptz,
  closed_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_marketing_leads_analysis
  on marketing_leads (analysis_status, created_at);
create index if not exists idx_marketing_leads_followup
  on marketing_leads (outreach_status, next_followup_at);
create index if not exists idx_marketing_leads_priority
  on marketing_leads (priority, lead_score desc);

create table if not exists marketing_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references marketing_leads(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  event_type text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_marketing_events_contact
  on marketing_events (contact_id, created_at);
create index if not exists idx_marketing_events_type
  on marketing_events (event_type, created_at);

alter table marketing_leads enable row level security;
alter table marketing_events enable row level security;

drop policy if exists "admins_full_access" on marketing_leads;
create policy "admins_full_access" on marketing_leads
  for all using (is_admin()) with check (is_admin());

drop policy if exists "admins_full_access" on marketing_events;
create policy "admins_full_access" on marketing_events
  for all using (is_admin()) with check (is_admin());

-- =====================================================================
-- Cola de búsquedas de Google Maps (barrido a nivel nacional): se cargan
-- muchas ciudades de una vez y el cron las va corriendo de a una.
-- =====================================================================

create table if not exists marketing_scrape_jobs (
  id uuid primary key default gen_random_uuid(),
  rubro text not null,
  zona text not null,
  cantidad integer not null default 40,
  status text not null default 'pendiente' check (status in ('pendiente', 'ejecutando', 'listo', 'error')),
  attempts integer not null default 0,
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create index if not exists idx_marketing_scrape_jobs_status on marketing_scrape_jobs (status, created_at);

alter table marketing_scrape_jobs enable row level security;

drop policy if exists "admins_full_access" on marketing_scrape_jobs;
create policy "admins_full_access" on marketing_scrape_jobs
  for all using (is_admin()) with check (is_admin());
