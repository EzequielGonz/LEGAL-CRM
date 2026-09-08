// Tipos manuales que reflejan supabase/migrations/0001_init.sql.
// Cuando el proyecto esté conectado a Supabase, se pueden regenerar con:
//   npx supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts

export type Area = "civil" | "penal";

export type ChannelType =
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "landing"
  | "database_import";

export type SourceType =
  | "organico_instagram"
  | "organico_facebook"
  | "organico_whatsapp"
  | "anuncio_instagram"
  | "anuncio_facebook"
  | "landing"
  | "base_de_datos";

export type ConversationStatus =
  | "nuevo"
  | "en_conversacion"
  | "esperando_respuesta_prospecto"
  | "calificando"
  | "calificado"
  | "no_califica"
  | "agendado"
  | "cerrado_ganado"
  | "cerrado_perdido"
  | "requiere_atencion_humana";

export type MessageSenderType = "prospecto" | "agente_ia" | "admin";
export type MessageDirection = "entrante" | "saliente";
export type AppointmentStatus = "pendiente" | "confirmada" | "cancelada" | "realizada" | "ausente";
export type CampaignStatus = "borrador" | "en_curso" | "pausada" | "finalizada";
export type CampaignContactStatus =
  | "pendiente"
  | "enviado"
  | "entregado"
  | "leido"
  | "respondio"
  | "fallo"
  | "opt_out";

export interface Studio {
  id: string;
  name: string;
  area: Area;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
}

export interface Channel {
  id: string;
  area: Area;
  type: ChannelType;
  label: string;
  external_id: string | null;
  phone_number: string | null;
  is_connected: boolean;
  config: Record<string, unknown>;
  created_at: string;
}

export interface Contact {
  id: string;
  area: Area;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  dni_cuil: string | null;
  source: SourceType;
  first_channel_id: string | null;
  campaign_id: string | null;
  imported_base_id: string | null;
  status: ConversationStatus;
  qualification_data: Record<string, unknown>;
  meets_criteria: boolean | null;
  assigned_studio_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ImportRowStatus = "creado" | "duplicado" | "invalido";

export interface ImportedBase {
  id: string;
  area: Area;
  name: string;
  source_label: string;
  file_name: string | null;
  total_rows: number;
  created_rows: number;
  duplicate_rows: number;
  invalid_rows: number;
  imported_by: string | null;
  created_at: string;
}

export interface ImportedBaseRow {
  id: string;
  base_id: string;
  row_number: number;
  raw_data: Record<string, unknown>;
  status: ImportRowStatus;
  error: string | null;
  contact_id: string | null;
  created_at: string;
}

export interface ContactIdentity {
  id: string;
  contact_id: string;
  area: Area;
  channel_type: ChannelType;
  external_user_id: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  contact_id: string;
  channel_id: string;
  area: Area;
  status: ConversationStatus;
  ai_enabled: boolean;
  last_message_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: MessageSenderType;
  direction: MessageDirection;
  body: string | null;
  external_message_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AvailabilityRule {
  id: string;
  area: Area;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  active: boolean;
}

export interface AvailabilityBlock {
  id: string;
  area: Area;
  starts_at: string;
  ends_at: string;
  reason: string | null;
}

export interface Appointment {
  id: string;
  contact_id: string;
  conversation_id: string | null;
  area: Area;
  studio_id: string | null;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  consultation_type: string | null;
  admin_notified_at: string | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  area: Area;
  name: string;
  channel_id: string;
  message_template_name: string;
  status: CampaignStatus;
  send_delay_seconds: number;
  daily_send_limit: number | null;
  batch_size: number;
  batch_pause_seconds: number;
  last_sent_at: string | null;
  sent_in_batch: number;
  batch_paused_until: string | null;
  scheduled_at: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface CampaignContact {
  id: string;
  campaign_id: string;
  contact_id: string;
  status: CampaignContactStatus;
  sent_at: string | null;
  responded_at: string | null;
  error: string | null;
}

export interface AiAgent {
  id: string;
  area: Area;
  display_name: string;
  system_prompt: string;
  qualification_criteria: string[];
  required_fields: string[];
  active: boolean;
  updated_at: string;
}

export interface AdminNotification {
  id: string;
  appointment_id: string | null;
  contact_id: string | null;
  area: Area;
  channel: string;
  message_body: string;
  sent: boolean;
  error: string | null;
  created_at: string;
}

export interface AdminProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
}

// Shape mínimo compatible con el tipo `Database` que espera @supabase/supabase-js
// cuando se usa createClient<Database>(...). No es exhaustivo (faltan Insert/Update
// completos por tabla) pero alcanza para tipar selects y el resto del código de
// este proyecto usa los tipos de arriba directamente para mayor claridad.
export type Database = {
  public: {
    Tables: Record<string, { Row: Record<string, unknown> }>;
  };
};
