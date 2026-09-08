-- =====================================================================
-- Sistema de captación legal — esquema inicial
-- Áreas: Civil y Penal. Diseñado para soportar más áreas/canales a futuro.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------

create type area_type as enum ('civil', 'penal');

create type channel_type as enum (
  'whatsapp',
  'instagram',
  'facebook',
  'landing',
  'database_import'
);

-- Fuente detallada del primer contacto (lo que se muestra en el panel)
create type source_type as enum (
  'organico_instagram',
  'organico_facebook',
  'organico_whatsapp',
  'anuncio_instagram',
  'anuncio_facebook',
  'landing',
  'base_de_datos'
);

create type conversation_status as enum (
  'nuevo',
  'en_conversacion',
  'esperando_respuesta_prospecto',
  'calificando',
  'calificado',
  'no_califica',
  'agendado',
  'cerrado_ganado',
  'cerrado_perdido',
  'requiere_atencion_humana'
);

create type message_sender_type as enum ('prospecto', 'agente_ia', 'admin');
create type message_direction as enum ('entrante', 'saliente');

create type appointment_status as enum ('pendiente', 'confirmada', 'cancelada', 'realizada', 'ausente');

create type campaign_status as enum ('borrador', 'en_curso', 'pausada', 'finalizada');
create type campaign_contact_status as enum (
  'pendiente', 'enviado', 'entregado', 'leido', 'respondio', 'fallo', 'opt_out'
);

-- ---------------------------------------------------------------------
-- Estudios jurídicos a los que se derivan los casos cerrados
-- ---------------------------------------------------------------------

create table studios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area area_type not null,
  contact_name text,
  contact_phone text,
  contact_email text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Canales conectados (2 WhatsApp, 2 IG, 2 FB) — credenciales van en env,
-- acá solo se guarda la identificación/estado de cada canal por área.
-- ---------------------------------------------------------------------

create table channels (
  id uuid primary key default gen_random_uuid(),
  area area_type not null,
  type channel_type not null,
  label text not null,                 -- ej: "WhatsApp Civil"
  external_id text,                    -- phone_number_id / ig_business_id / page_id
  phone_number text,                   -- para whatsapp
  is_connected boolean not null default false,
  config jsonb not null default '{}',  -- metadata liviana, no secretos
  created_at timestamptz not null default now(),
  unique (area, type)
);

-- ---------------------------------------------------------------------
-- Contactos unificados (prospectos). Un mismo humano puede escribir por
-- varios canales -> se deduplica vía contact_identities.
-- ---------------------------------------------------------------------

create table contacts (
  id uuid primary key default gen_random_uuid(),
  area area_type not null,
  full_name text,
  phone text,
  email text,
  source source_type not null,
  first_channel_id uuid references channels(id),
  campaign_id uuid,                    -- fk agregada luego de crear campaigns
  status conversation_status not null default 'nuevo',
  qualification_data jsonb not null default '{}',   -- datos recopilados por la IA
  meets_criteria boolean,
  assigned_studio_id uuid references studios(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_contacts_area_status on contacts(area, status);

-- Único parcial (no un unique constraint común porque `phone` puede ser
-- null para contactos que todavía no lo dieron) — junto con el manejo de
-- conflicto en el código, evita duplicados si dos mensajes casi
-- simultáneos del mismo teléfono nuevo llegan por canales distintos.
create unique index idx_contacts_area_phone on contacts(area, phone) where phone is not null;

-- Identidades por canal de un contacto (para dedup): un WhatsApp, un PSID de
-- Instagram, un PSID de Facebook, etc. pueden apuntar al mismo contacto.
-- Se incluye `area` porque una misma persona (mismo teléfono/PSID) puede
-- escribirle tanto a la línea Civil como a la Penal por motivos distintos:
-- son dos prospectos/casos separados, no se deben fusionar entre áreas.
create table contact_identities (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  area area_type not null,
  channel_type channel_type not null,
  external_user_id text not null,   -- número de whatsapp (wa_id) / IGSID / PSID / email de landing
  created_at timestamptz not null default now(),
  unique (area, channel_type, external_user_id)
);

create index idx_contact_identities_contact on contact_identities(contact_id);

-- ---------------------------------------------------------------------
-- Conversaciones y mensajes (Inbox unificado)
-- ---------------------------------------------------------------------

create table conversations (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  channel_id uuid not null references channels(id),
  area area_type not null,
  status conversation_status not null default 'nuevo',
  ai_enabled boolean not null default true,   -- false = tomada por un humano
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  unique (contact_id, channel_id)
);

create index idx_conversations_area_status on conversations(area, status);
create index idx_conversations_last_message on conversations(last_message_at desc);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_type message_sender_type not null,
  direction message_direction not null,
  body text,
  external_message_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_messages_conversation on messages(conversation_id, created_at);

-- ---------------------------------------------------------------------
-- Agenda: disponibilidad + citas
-- ---------------------------------------------------------------------

create table availability_rules (
  id uuid primary key default gen_random_uuid(),
  area area_type not null,
  weekday int not null check (weekday between 0 and 6), -- 0=domingo
  start_time time not null,
  end_time time not null,
  slot_duration_minutes int not null default 30,
  active boolean not null default true
);

create table availability_blocks (
  -- bloqueos puntuales (feriados, horarios ocupados manualmente)
  id uuid primary key default gen_random_uuid(),
  area area_type not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  conversation_id uuid references conversations(id),
  area area_type not null,
  studio_id uuid references studios(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status appointment_status not null default 'pendiente',
  consultation_type text,
  admin_notified_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_appointments_area_starts on appointments(area, starts_at);

-- ---------------------------------------------------------------------
-- Campañas de inicio de conversación (línea Civil, bases cargadas)
-- ---------------------------------------------------------------------

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  area area_type not null default 'civil',
  name text not null,
  channel_id uuid not null references channels(id),
  message_template_name text not null,   -- nombre de la plantilla aprobada en WhatsApp
  status campaign_status not null default 'borrador',
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

alter table contacts
  add constraint fk_contacts_campaign foreign key (campaign_id) references campaigns(id);

create table campaign_contacts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  status campaign_contact_status not null default 'pendiente',
  sent_at timestamptz,
  responded_at timestamptz,
  error text,
  unique (campaign_id, contact_id)
);

-- ---------------------------------------------------------------------
-- Configuración de agentes IA (uno por área)
-- ---------------------------------------------------------------------

create table ai_agents (
  id uuid primary key default gen_random_uuid(),
  area area_type not null unique,
  display_name text not null,
  system_prompt text not null,
  qualification_criteria jsonb not null default '[]',  -- lista de criterios/reglas
  required_fields jsonb not null default '[]',          -- datos que debe recolectar
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Notificaciones al administrador
-- ---------------------------------------------------------------------

create table admin_notifications (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id),
  contact_id uuid references contacts(id),
  area area_type not null,
  channel text not null default 'whatsapp',
  message_body text not null,
  sent boolean not null default false,
  error text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Usuarios del panel (referencia a auth.users de Supabase)
-- ---------------------------------------------------------------------

create table admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,       -- teléfono del admin para notificaciones de WhatsApp
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Trigger genérico updated_at
-- ---------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_contacts_updated_at
  before update on contacts
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Seed mínimo: canales y agentes IA por área (sin credenciales)
-- ---------------------------------------------------------------------

insert into channels (area, type, label) values
  ('civil', 'whatsapp', 'WhatsApp Civil'),
  ('civil', 'instagram', 'Instagram Civil'),
  ('civil', 'facebook', 'Facebook Civil'),
  ('penal', 'whatsapp', 'WhatsApp Penal'),
  ('penal', 'instagram', 'Instagram Penal'),
  ('penal', 'facebook', 'Facebook Penal'),
  ('civil', 'landing', 'Landing (Civil)'),
  ('penal', 'landing', 'Landing (Penal)');

insert into ai_agents (area, display_name, system_prompt, qualification_criteria, required_fields) values
(
  'civil',
  'Agente Civil',
  'Sos el primer contacto del área Civil de un estudio jurídico. Tu trabajo es entender qué necesita la persona, hacer las preguntas necesarias para calificarla, recolectar los datos requeridos y ofrecer un turno de consulta si corresponde. Nunca inventes información ni te presentes como abogado/a: sos un asistente que organiza la consulta. Sé claro, empático y breve.',
  '["El reclamo tiene menos de 2 años de antigüedad (prescripción)", "Existe un daño o perjuicio concreto y cuantificable", "La persona tiene la documentación básica o puede conseguirla"]',
  '["nombre_completo", "telefono", "tipo_de_consulta", "descripcion_del_caso", "tiempo_transcurrido"]'
),
(
  'penal',
  'Agente Penal',
  'Sos el primer contacto del área Penal de un estudio jurídico. Tu trabajo es entender qué necesita la persona, hacer las preguntas necesarias para calificarla, recolectar los datos requeridos y ofrecer un turno de consulta si corresponde. Nunca inventes información ni te presentes como abogado/a: sos un asistente que organiza la consulta. Manejá el tema con seriedad y discreción.',
  '["Existe una causa penal iniciada o riesgo real de que se inicie", "La persona puede identificar el fuero/jurisdicción aproximada"]',
  '["nombre_completo", "telefono", "tipo_de_consulta", "descripcion_del_caso", "estado_de_la_causa"]'
);

-- Disponibilidad por defecto: lunes a viernes 9-13 y 14-18, turnos de 30'
-- (los literales de hora se castean explícitamente: dentro de un VALUES
-- usado como tabla derivada, Postgres los resuelve como texto y no los
-- convierte solo a `time` al insertar).
insert into availability_rules (area, weekday, start_time, end_time, slot_duration_minutes)
select area, weekday, start_time, end_time, 30
from (values ('civil'::area_type), ('penal'::area_type)) as a(area)
cross join (values (1, '09:00'::time, '13:00'::time), (1, '14:00'::time, '18:00'::time),
                    (2, '09:00'::time, '13:00'::time), (2, '14:00'::time, '18:00'::time),
                    (3, '09:00'::time, '13:00'::time), (3, '14:00'::time, '18:00'::time),
                    (4, '09:00'::time, '13:00'::time), (4, '14:00'::time, '18:00'::time),
                    (5, '09:00'::time, '13:00'::time), (5, '14:00'::time, '18:00'::time)
           ) as r(weekday, start_time, end_time);
