-- =====================================================================
-- Pruebas de integración · 1/3 — Estructura de la base ANTES de la Etapa 1
-- Copia de la estructura de producción tomada el 9/10/2026 (22 tablas, 10
-- tipos, políticas, índices y relaciones), SIN DATOS. Sobre esta base se
-- aplican después todas las migraciones del repositorio (0100 en
-- adelante), en orden, como se hizo en producción.
-- =====================================================================
create type public.appointment_status as enum ('pendiente', 'confirmada', 'cancelada', 'realizada', 'ausente');
create type public.area_type as enum ('civil', 'penal', 'agencia_0km', 'coberturas_medicas', 'marketing');
create type public.campaign_contact_status as enum ('pendiente', 'enviado', 'entregado', 'leido', 'respondio', 'fallo', 'opt_out');
create type public.campaign_status as enum ('borrador', 'en_curso', 'pausada', 'finalizada');
create type public.channel_type as enum ('whatsapp', 'instagram', 'facebook', 'landing', 'database_import');
create type public.conversation_status as enum ('nuevo', 'en_conversacion', 'esperando_respuesta_prospecto', 'calificando', 'calificado', 'no_califica', 'agendado', 'cerrado_ganado', 'cerrado_perdido', 'requiere_atencion_humana');
create type public.import_row_status as enum ('creado', 'duplicado', 'invalido');
create type public.message_direction as enum ('entrante', 'saliente');
create type public.message_sender_type as enum ('prospecto', 'agente_ia', 'admin');
create type public.source_type as enum ('organico_instagram', 'organico_facebook', 'organico_whatsapp', 'anuncio_instagram', 'anuncio_facebook', 'landing', 'base_de_datos', 'google_maps');
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select true;
$function$
;
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;
create table public.admin_notifications (id uuid default gen_random_uuid() not null, appointment_id uuid, contact_id uuid, area area_type not null, channel text default 'whatsapp'::text not null, message_body text not null, sent boolean default false not null, error text, created_at timestamp with time zone default now() not null);
create table public.admin_profiles (id uuid not null, full_name text, phone text, role text default 'admin'::text not null, created_at timestamp with time zone default now() not null);
create table public.ai_agents (id uuid default gen_random_uuid() not null, area area_type not null, display_name text not null, system_prompt text not null, qualification_criteria jsonb default '[]'::jsonb not null, required_fields jsonb default '[]'::jsonb not null, active boolean default true not null, updated_at timestamp with time zone default now() not null);
create table public.appointments (id uuid default gen_random_uuid() not null, contact_id uuid not null, conversation_id uuid, area area_type not null, studio_id uuid, starts_at timestamp with time zone not null, ends_at timestamp with time zone not null, status appointment_status default 'pendiente'::appointment_status not null, consultation_type text, admin_notified_at timestamp with time zone, created_at timestamp with time zone default now() not null);
create table public.availability_blocks (id uuid default gen_random_uuid() not null, area area_type not null, starts_at timestamp with time zone not null, ends_at timestamp with time zone not null, reason text);
create table public.availability_rules (id uuid default gen_random_uuid() not null, area area_type not null, weekday integer not null, start_time time without time zone not null, end_time time without time zone not null, slot_duration_minutes integer default 30 not null, active boolean default true not null);
create table public.campaign_contacts (id uuid default gen_random_uuid() not null, campaign_id uuid not null, contact_id uuid not null, status campaign_contact_status default 'pendiente'::campaign_contact_status not null, sent_at timestamp with time zone, responded_at timestamp with time zone, error text, message_id text, priority smallint default 1 not null, queued_at timestamp with time zone default now() not null);
create table public.campaigns (id uuid default gen_random_uuid() not null, area area_type default 'civil'::area_type not null, name text not null, channel_id uuid not null, message_template_name text not null, status campaign_status default 'borrador'::campaign_status not null, scheduled_at timestamp with time zone, created_at timestamp with time zone default now() not null, started_at timestamp with time zone, finished_at timestamp with time zone, send_delay_seconds integer default 90 not null, daily_send_limit integer, batch_size integer default 10 not null, batch_pause_seconds integer default 300 not null, last_sent_at timestamp with time zone, sent_in_batch integer default 0 not null, batch_paused_until timestamp with time zone, min_send_delay_seconds integer default 50 not null, max_send_delay_seconds integer default 200 not null, next_delay_seconds integer, send_window_start_hour smallint default 7 not null, send_window_end_hour smallint default 21 not null);
create table public.channels (id uuid default gen_random_uuid() not null, area area_type not null, type channel_type not null, label text not null, external_id text, phone_number text, is_connected boolean default false not null, config jsonb default '{}'::jsonb not null, created_at timestamp with time zone default now() not null);
create table public.contact_identities (id uuid default gen_random_uuid() not null, contact_id uuid not null, area area_type not null, channel_type channel_type not null, external_user_id text not null, created_at timestamp with time zone default now() not null);
create table public.contacts (id uuid default gen_random_uuid() not null, area area_type not null, full_name text, phone text, email text, source source_type not null, first_channel_id uuid, campaign_id uuid, status conversation_status default 'nuevo'::conversation_status not null, qualification_data jsonb default '{}'::jsonb not null, meets_criteria boolean, assigned_studio_id uuid, notes text, created_at timestamp with time zone default now() not null, updated_at timestamp with time zone default now() not null, dni_cuil text, imported_base_id uuid, derived_at timestamp with time zone, rubro_id uuid default '11111111-1111-1111-1111-111111111111'::uuid not null);
create table public.conversations (id uuid default gen_random_uuid() not null, contact_id uuid not null, channel_id uuid not null, area area_type not null, status conversation_status default 'nuevo'::conversation_status not null, ai_enabled boolean default true not null, last_message_at timestamp with time zone, created_at timestamp with time zone default now() not null, intake_step text);
create table public.imported_base_rows (id uuid default gen_random_uuid() not null, base_id uuid not null, row_number integer not null, raw_data jsonb not null, status import_row_status not null, error text, contact_id uuid, created_at timestamp with time zone default now() not null);
create table public.imported_bases (id uuid default gen_random_uuid() not null, area area_type not null, name text not null, source_label text not null, file_name text, total_rows integer default 0 not null, created_rows integer default 0 not null, duplicate_rows integer default 0 not null, invalid_rows integer default 0 not null, imported_by uuid, created_at timestamp with time zone default now() not null, storage_path text);
create table public.marketing_events (id uuid default gen_random_uuid() not null, lead_id uuid, contact_id uuid not null, event_type text not null, detail jsonb default '{}'::jsonb not null, created_at timestamp with time zone default now() not null);
create table public.marketing_leads (id uuid default gen_random_uuid() not null, contact_id uuid not null, source_kind text default 'scraper'::text not null, source_detail text, place_id text, website text, maps_data jsonb default '{}'::jsonb not null, analysis_status text default 'pendiente'::text not null, analysis_error text, analysis jsonb default '{}'::jsonb not null, analyzed_at timestamp with time zone, lead_score integer, priority text, hook text, summary text, outreach_status text default 'sin_contactar'::text not null, first_contacted_at timestamp with time zone, last_outbound_at timestamp with time zone, last_inbound_at timestamp with time zone, followup_count integer default 0 not null, next_followup_at timestamp with time zone, closed_at timestamp with time zone, closed_reason text, created_at timestamp with time zone default now() not null, updated_at timestamp with time zone default now() not null);
create table public.marketing_scrape_jobs (id uuid default gen_random_uuid() not null, rubro text not null, zona text not null, cantidad integer default 40 not null, status text default 'pendiente'::text not null, attempts integer default 0 not null, result jsonb, error text, created_at timestamp with time zone default now() not null, started_at timestamp with time zone, finished_at timestamp with time zone);
create table public.messages (id uuid default gen_random_uuid() not null, conversation_id uuid not null, sender_type message_sender_type not null, direction message_direction not null, body text, external_message_id text, metadata jsonb default '{}'::jsonb not null, created_at timestamp with time zone default now() not null);
create table public.notification_phones (id uuid default gen_random_uuid() not null, phone text not null, label text, created_at timestamp with time zone default now() not null);
create table public.rubros (id uuid default gen_random_uuid() not null, slug text not null, name text not null, emoji text, photo_url text, description text, whatsapp_phone text, sort_order integer default 0 not null, config jsonb default '{}'::jsonb not null, active boolean default true not null, created_at timestamp with time zone default now() not null);
create table public.scraped_places (id uuid default gen_random_uuid() not null, area area_type not null, place_id text not null, contact_id uuid, base_id uuid, created_at timestamp with time zone default now() not null);
create table public.studios (id uuid default gen_random_uuid() not null, name text not null, area area_type not null, contact_name text, contact_phone text, contact_email text, notes text, active boolean default true not null, created_at timestamp with time zone default now() not null);
alter table public.admin_notifications add constraint admin_notifications_pkey PRIMARY KEY (id);
alter table public.admin_profiles add constraint admin_profiles_pkey PRIMARY KEY (id);
alter table public.ai_agents add constraint ai_agents_area_key UNIQUE (area);
alter table public.ai_agents add constraint ai_agents_pkey PRIMARY KEY (id);
alter table public.appointments add constraint appointments_pkey PRIMARY KEY (id);
alter table public.availability_blocks add constraint availability_blocks_pkey PRIMARY KEY (id);
alter table public.availability_rules add constraint availability_rules_pkey PRIMARY KEY (id);
alter table public.availability_rules add constraint availability_rules_weekday_check CHECK (((weekday >= 0) AND (weekday <= 6)));
alter table public.campaign_contacts add constraint campaign_contacts_campaign_id_contact_id_key UNIQUE (campaign_id, contact_id);
alter table public.campaign_contacts add constraint campaign_contacts_pkey PRIMARY KEY (id);
alter table public.campaigns add constraint campaigns_pkey PRIMARY KEY (id);
alter table public.campaigns add constraint campaigns_send_window_valid CHECK (((send_window_start_hour >= 0) AND (send_window_start_hour <= 23) AND (send_window_end_hour >= 1) AND (send_window_end_hour <= 24) AND (send_window_start_hour < send_window_end_hour)));
alter table public.channels add constraint channels_area_type_key UNIQUE (area, type);
alter table public.channels add constraint channels_pkey PRIMARY KEY (id);
alter table public.contact_identities add constraint contact_identities_area_channel_type_external_user_id_key UNIQUE (area, channel_type, external_user_id);
alter table public.contact_identities add constraint contact_identities_pkey PRIMARY KEY (id);
alter table public.contacts add constraint contacts_pkey PRIMARY KEY (id);
alter table public.conversations add constraint conversations_contact_id_channel_id_key UNIQUE (contact_id, channel_id);
alter table public.conversations add constraint conversations_pkey PRIMARY KEY (id);
alter table public.imported_base_rows add constraint imported_base_rows_pkey PRIMARY KEY (id);
alter table public.imported_bases add constraint imported_bases_pkey PRIMARY KEY (id);
alter table public.marketing_events add constraint marketing_events_pkey PRIMARY KEY (id);
alter table public.marketing_leads add constraint marketing_leads_analysis_status_check CHECK ((analysis_status = ANY (ARRAY['pendiente'::text, 'analizando'::text, 'listo'::text, 'error'::text, 'omitido'::text])));
alter table public.marketing_leads add constraint marketing_leads_contact_id_key UNIQUE (contact_id);
alter table public.marketing_leads add constraint marketing_leads_outreach_status_check CHECK ((outreach_status = ANY (ARRAY['sin_contactar'::text, 'contactado'::text, 'respondio'::text, 'repesca'::text, 'cerrado'::text, 'no_interesado'::text, 'baja'::text])));
alter table public.marketing_leads add constraint marketing_leads_pkey PRIMARY KEY (id);
alter table public.marketing_leads add constraint marketing_leads_priority_check CHECK ((priority = ANY (ARRAY['alta'::text, 'media'::text, 'baja'::text])));
alter table public.marketing_leads add constraint marketing_leads_source_kind_check CHECK ((source_kind = ANY (ARRAY['scraper'::text, 'directa'::text])));
alter table public.marketing_scrape_jobs add constraint marketing_scrape_jobs_pkey PRIMARY KEY (id);
alter table public.marketing_scrape_jobs add constraint marketing_scrape_jobs_status_check CHECK ((status = ANY (ARRAY['pendiente'::text, 'ejecutando'::text, 'listo'::text, 'error'::text])));
alter table public.messages add constraint messages_pkey PRIMARY KEY (id);
alter table public.notification_phones add constraint notification_phones_pkey PRIMARY KEY (id);
alter table public.rubros add constraint rubros_pkey PRIMARY KEY (id);
alter table public.rubros add constraint rubros_slug_key UNIQUE (slug);
alter table public.scraped_places add constraint scraped_places_area_place_id_key UNIQUE (area, place_id);
alter table public.scraped_places add constraint scraped_places_pkey PRIMARY KEY (id);
alter table public.studios add constraint studios_pkey PRIMARY KEY (id);
alter table public.admin_notifications add constraint admin_notifications_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES appointments(id);
alter table public.admin_notifications add constraint admin_notifications_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id);
alter table public.admin_profiles add constraint admin_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.appointments add constraint appointments_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
alter table public.appointments add constraint appointments_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id);
alter table public.appointments add constraint appointments_studio_id_fkey FOREIGN KEY (studio_id) REFERENCES studios(id);
alter table public.campaign_contacts add constraint campaign_contacts_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
alter table public.campaign_contacts add constraint campaign_contacts_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
alter table public.campaigns add constraint campaigns_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES channels(id);
alter table public.contact_identities add constraint contact_identities_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
alter table public.contacts add constraint contacts_assigned_studio_id_fkey FOREIGN KEY (assigned_studio_id) REFERENCES studios(id);
alter table public.contacts add constraint contacts_first_channel_id_fkey FOREIGN KEY (first_channel_id) REFERENCES channels(id);
alter table public.contacts add constraint contacts_imported_base_id_fkey FOREIGN KEY (imported_base_id) REFERENCES imported_bases(id) ON DELETE SET NULL;
alter table public.contacts add constraint contacts_rubro_id_fkey FOREIGN KEY (rubro_id) REFERENCES rubros(id);
alter table public.contacts add constraint fk_contacts_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;
alter table public.conversations add constraint conversations_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES channels(id);
alter table public.conversations add constraint conversations_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
alter table public.imported_base_rows add constraint imported_base_rows_base_id_fkey FOREIGN KEY (base_id) REFERENCES imported_bases(id) ON DELETE CASCADE;
alter table public.imported_base_rows add constraint imported_base_rows_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id);
alter table public.imported_bases add constraint imported_bases_imported_by_fkey FOREIGN KEY (imported_by) REFERENCES admin_profiles(id);
alter table public.marketing_events add constraint marketing_events_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
alter table public.marketing_events add constraint marketing_events_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES marketing_leads(id) ON DELETE CASCADE;
alter table public.marketing_leads add constraint marketing_leads_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE;
alter table public.messages add constraint messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
alter table public.scraped_places add constraint scraped_places_base_id_fkey FOREIGN KEY (base_id) REFERENCES imported_bases(id) ON DELETE SET NULL;
alter table public.scraped_places add constraint scraped_places_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;
CREATE INDEX campaign_contacts_pending_priority_idx ON public.campaign_contacts USING btree (campaign_id, status, priority, queued_at) WHERE (status = 'pendiente'::campaign_contact_status);
CREATE INDEX idx_appointments_area_starts ON public.appointments USING btree (area, starts_at);
CREATE INDEX idx_contact_identities_contact ON public.contact_identities USING btree (contact_id);
CREATE UNIQUE INDEX idx_contacts_area_phone ON public.contacts USING btree (area, phone) WHERE (phone IS NOT NULL);
CREATE INDEX idx_contacts_area_status ON public.contacts USING btree (area, status);
CREATE INDEX idx_conversations_area_status ON public.conversations USING btree (area, status);
CREATE INDEX idx_conversations_last_message ON public.conversations USING btree (last_message_at DESC);
CREATE INDEX idx_imported_base_rows_base ON public.imported_base_rows USING btree (base_id);
CREATE INDEX idx_marketing_events_contact ON public.marketing_events USING btree (contact_id, created_at);
CREATE INDEX idx_marketing_events_type ON public.marketing_events USING btree (event_type, created_at);
CREATE INDEX idx_marketing_leads_analysis ON public.marketing_leads USING btree (analysis_status, created_at);
CREATE INDEX idx_marketing_leads_followup ON public.marketing_leads USING btree (outreach_status, next_followup_at);
CREATE INDEX idx_marketing_leads_priority ON public.marketing_leads USING btree (priority, lead_score DESC);
CREATE INDEX idx_marketing_scrape_jobs_status ON public.marketing_scrape_jobs USING btree (status, created_at);
CREATE INDEX idx_messages_conversation ON public.messages USING btree (conversation_id, created_at);
CREATE TRIGGER trg_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
alter table public.admin_notifications enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.ai_agents enable row level security;
alter table public.appointments enable row level security;
alter table public.availability_blocks enable row level security;
alter table public.availability_rules enable row level security;
alter table public.campaign_contacts enable row level security;
alter table public.campaigns enable row level security;
alter table public.channels enable row level security;
alter table public.contact_identities enable row level security;
alter table public.contacts enable row level security;
alter table public.conversations enable row level security;
alter table public.imported_base_rows enable row level security;
alter table public.imported_bases enable row level security;
alter table public.marketing_events enable row level security;
alter table public.marketing_leads enable row level security;
alter table public.marketing_scrape_jobs enable row level security;
alter table public.messages enable row level security;
alter table public.notification_phones enable row level security;
alter table public.rubros enable row level security;
alter table public.scraped_places enable row level security;
alter table public.studios enable row level security;
create policy admins_full_access on public.admin_notifications as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy self_profile on public.admin_profiles as PERMISSIVE for SELECT to public using ((id = auth.uid()));
create policy self_profile_update on public.admin_profiles as PERMISSIVE for UPDATE to public using ((id = auth.uid()));
create policy admins_full_access on public.ai_agents as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy admins_full_access on public.appointments as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy admins_full_access on public.availability_blocks as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy admins_full_access on public.availability_rules as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy admins_full_access on public.campaign_contacts as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy admins_full_access on public.campaigns as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy admins_full_access on public.channels as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy admins_full_access on public.contact_identities as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy admins_full_access on public.contacts as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy admins_full_access on public.conversations as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy admins_full_access on public.imported_base_rows as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy admins_full_access on public.imported_bases as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy admins_full_access on public.marketing_events as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy admins_full_access on public.marketing_leads as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy admins_full_access on public.marketing_scrape_jobs as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy admins_full_access on public.messages as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy admins_full_access on public.notification_phones as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy admins_full_access on public.rubros as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy admins_full_access on public.scraped_places as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy admins_full_access on public.studios as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());