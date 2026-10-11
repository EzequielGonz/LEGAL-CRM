-- =====================================================================
-- Etapa 1 · Pregunta 24, alcance acotado — Originales de audios, fotos,
-- videos y documentos en almacenamiento privado
--  * Cada archivo que manda una persona queda registrado en
--    message_attachments, vinculado al mensaje, la conversación, la ficha
--    (contacto) y el perfil por el que llegó.
--  * El archivo se guarda en el bucket privado "adjuntos-originales". Sin
--    sesión en el panel no se ve; el panel lo abre con un enlace firmado
--    que vence a los pocos minutos.
--  * Sin transcripción, sin respuestas y sin envíos: solo guardar y
--    consultar. Fotos y documentos no se comparten solos con nadie.
--  * WhatsApp deja descargar lo recibido durante 7 días: lo que no se pudo
--    guardar en ese plazo queda "vencido" (se conserva el registro).
--  * Nada se borra.
-- Solo agrega. No envía nada ni consulta a Meta.
-- =====================================================================

set lock_timeout = '5s';

create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete restrict,
  -- Orden dentro del mensaje (Instagram y Facebook pueden traer varios).
  position int not null default 0 check (position >= 0),
  conversation_id uuid not null references public.conversations(id) on delete restrict,
  contact_id uuid not null references public.contacts(id) on delete restrict,
  rubro_id uuid references public.rubros(id) on delete restrict,
  line_id uuid references public.profile_lines(id) on delete set null,
  area public.area_type not null,
  channel_type text not null check (channel_type in ('whatsapp', 'instagram', 'facebook')),
  kind text not null check (kind in ('audio', 'imagen', 'video', 'documento', 'sticker')),
  -- WhatsApp: identificador del archivo en Meta. Instagram/Facebook: enlace temporal.
  provider_media_id text,
  source_url text,
  mime_type text,
  file_name text,
  provider_sha256 text,
  size_bytes bigint,
  -- Huella SHA-256 (hex) de lo que se guardó, y si coincide con la que informó Meta.
  sha256 text,
  sha256_matches boolean,
  storage_bucket text,
  storage_path text,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'guardado', 'error', 'vencido', 'demasiado_grande')),
  attempts int not null default 0,
  last_error text,
  last_attempt_at timestamptz,
  -- Reserva de un solo proceso a la vez (descarga y guardado).
  claim_token uuid,
  claimed_until timestamptz,
  received_at timestamptz not null default now(),
  -- Hasta cuándo Meta deja descargarlo (WhatsApp: 7 días). Null si no se sabe.
  expires_at timestamptz,
  saved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (message_id, position)
);

create index if not exists message_attachments_contact_idx on public.message_attachments (contact_id, received_at desc);
create index if not exists message_attachments_conversation_idx on public.message_attachments (conversation_id, received_at desc);
create index if not exists message_attachments_unsaved_idx
  on public.message_attachments (received_at) where status in ('pendiente', 'error');

-- Solo el servidor (clave de servicio) lee y escribe esta tabla.
alter table public.message_attachments enable row level security;
revoke all on public.message_attachments from anon, authenticated;
grant select, insert, update on public.message_attachments to service_role;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'message_attachments_no_delete') then
    create trigger message_attachments_no_delete before delete on public.message_attachments
      for each row execute function public.prevent_row_changes('Los adjuntos no se borran: el registro y el original se conservan');
  end if;
end $$;

-- Reserva para descargar y guardar un adjunto. Devuelve un permiso de un
-- solo proceso, o null si ya está guardado, vencido, demasiado grande o
-- reservado por otro proceso. Lo que pasó su plazo de descarga queda
-- "vencido" en el mismo paso.
create or replace function public.attachment_claim(p_attachment uuid, p_seconds int default 120)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token uuid := gen_random_uuid();
begin
  update public.message_attachments
     set status = 'vencido',
         last_error = coalesce(last_error, 'Meta ya no permite descargarlo: pasó el plazo de descarga.'),
         claim_token = null,
         claimed_until = null,
         updated_at = now()
   where id = p_attachment
     and status in ('pendiente', 'error')
     and expires_at is not null
     and expires_at < now();

  update public.message_attachments
     set claim_token = v_token,
         claimed_until = now() + make_interval(secs => greatest(coalesce(p_seconds, 120), 10)),
         attempts = attempts + 1,
         last_attempt_at = now(),
         updated_at = now()
   where id = p_attachment
     and status in ('pendiente', 'error')
     and (claimed_until is null or claimed_until < now());
  if not found then
    return null;
  end if;
  return v_token;
end $$;

-- Cierre de un intento: solo con el permiso vigente de la reserva.
create or replace function public.attachment_finish(
  p_attachment uuid,
  p_token uuid,
  p_status text,
  p_fields jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('pendiente', 'guardado', 'error', 'vencido', 'demasiado_grande') then
    raise exception 'Estado de adjunto inválido: %', p_status;
  end if;
  update public.message_attachments
     set status = p_status,
         claim_token = null,
         claimed_until = null,
         mime_type = coalesce(p_fields->>'mime_type', mime_type),
         size_bytes = coalesce((p_fields->>'size_bytes')::bigint, size_bytes),
         sha256 = coalesce(p_fields->>'sha256', sha256),
         sha256_matches = coalesce((p_fields->>'sha256_matches')::boolean, sha256_matches),
         storage_bucket = coalesce(p_fields->>'storage_bucket', storage_bucket),
         storage_path = coalesce(p_fields->>'storage_path', storage_path),
         provider_sha256 = coalesce(provider_sha256, p_fields->>'provider_sha256'),
         last_error = case when p_status = 'guardado' then null else coalesce(p_fields->>'last_error', last_error) end,
         saved_at = case when p_status = 'guardado' then now() else saved_at end,
         updated_at = now()
   where id = p_attachment
     and claim_token = p_token;
  return found;
end $$;

revoke all on function public.attachment_claim(uuid, int) from public, anon, authenticated;
revoke all on function public.attachment_finish(uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.attachment_claim(uuid, int) to service_role;
grant execute on function public.attachment_finish(uuid, uuid, text, jsonb) to service_role;

-- Bucket privado para los originales (solo si existe el esquema de
-- Storage: en una copia local sin Storage se omite). Sin políticas sobre
-- storage.objects: solo la clave de servicio y los enlaces firmados lo leen.
do $$ begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit)
    values ('adjuntos-originales', 'adjuntos-originales', false, 52428800)
    on conflict (id) do nothing;
  end if;
end $$;
