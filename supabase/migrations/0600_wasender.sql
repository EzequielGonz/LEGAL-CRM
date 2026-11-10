-- ---------------------------------------------------------------------
-- Wasender (10/11, pedido de la responsable): líneas de WhatsApp
-- conectadas por QR, «plantillas» propias y registro de eventos del
-- webhook. Es un proveedor aparte de Meta: no cambia, no reemplaza y no
-- borra nada de Meta (profile_lines, plantillas, campañas y estados quedan
-- como están).
--
-- Solo agrega tres tablas nuevas y dos columnas opcionales en
-- conversations. Repetible (if not exists / or replace, sin drop). RLS
-- activa y sin permisos para la clave pública. Nada se borra: las líneas y
-- las plantillas se archivan con motivo.
--
-- Las claves de cada línea se guardan cifradas (AES-256-GCM) con la clave
-- de la configuración privada del servidor (WASENDER_CLAVE_CIFRADO): en la
-- base nunca queda una clave legible.
-- ---------------------------------------------------------------------

set lock_timeout = '5s';

-- Líneas de Wasender por perfil. Nacen apagadas (habilitada = false) y en
-- modo prueba (el chat queda en atención humana entre mensajes).
create table if not exists public.wasender_lineas (
  id uuid primary key default gen_random_uuid(),
  rubro_id uuid not null references public.rubros(id),
  area public.area_type not null,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 80),
  telefono text not null check (telefono ~ '^\+[0-9]{8,15}$'),
  -- Identificador de la sesión en Wasender.
  sesion_id text,
  estado text not null default 'creando',
  estado_at timestamptz,
  api_key_cifrada text,
  webhook_secret_cifrado text,
  habilitada boolean not null default false,
  responde_con_bot boolean not null default true,
  modo_prueba boolean not null default true,
  ultimo_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archivada_at timestamptz,
  motivo_archivo text,
  -- Una línea archivada siempre dice por qué.
  constraint wasender_lineas_archivo_con_motivo
    check (archivada_at is null or coalesce(btrim(motivo_archivo), '') <> '')
);

create unique index if not exists wasender_lineas_sesion_unica
  on public.wasender_lineas (sesion_id) where sesion_id is not null;
-- Un mismo número no puede estar en dos líneas activas.
create unique index if not exists wasender_lineas_telefono_activo
  on public.wasender_lineas (telefono) where archivada_at is null;
create index if not exists wasender_lineas_rubro_idx on public.wasender_lineas (rubro_id, created_at);

-- «Plantillas» propias de Wasender (sin aprobación de Meta), por perfil.
create table if not exists public.wasender_plantillas (
  id uuid primary key default gen_random_uuid(),
  rubro_id uuid not null references public.rubros(id),
  nombre text not null check (char_length(btrim(nombre)) between 1 and 80),
  uso text not null default 'manual' check (uso in ('campana', 'seguimiento', 'manual')),
  cuerpo text not null check (char_length(cuerpo) between 1 and 4000),
  -- Variantes del mismo mensaje, para que no salgan todos idénticos.
  variantes jsonb not null default '[]'::jsonb check (jsonb_typeof(variantes) = 'array'),
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archivada_at timestamptz,
  motivo_archivo text,
  constraint wasender_plantillas_archivo_con_motivo
    check (archivada_at is null or coalesce(btrim(motivo_archivo), '') <> '')
);

create index if not exists wasender_plantillas_rubro_idx on public.wasender_plantillas (rubro_id, created_at);

-- Registro de lo que llega por el webhook: para seguimiento y para retener
-- lo que no se pudo procesar (firma inválida, número desconocido, error).
-- El contenido completo solo se guarda en lo retenido o con error.
create table if not exists public.wasender_eventos (
  id uuid primary key default gen_random_uuid(),
  linea_id uuid references public.wasender_lineas(id),
  evento text,
  resultado text not null default 'recibido'
    check (resultado in ('recibido', 'procesado', 'ignorado', 'retenido', 'error')),
  detalle text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists wasender_eventos_linea_idx on public.wasender_eventos (linea_id, created_at desc);
create index if not exists wasender_eventos_resultado_idx on public.wasender_eventos (resultado, created_at desc);

-- Conversaciones: línea de Wasender por la que se habló y marca del modo
-- prueba. Opcionales: Meta no las usa y siguen vacías en sus chats.
alter table public.conversations
  add column if not exists wasender_line_id uuid references public.wasender_lineas(id) on delete set null;
alter table public.conversations
  add column if not exists wasender_toma_automatica_at timestamptz;
create index if not exists conversations_wasender_line_idx
  on public.conversations (wasender_line_id) where wasender_line_id is not null;

-- Seguridad: solo la clave de servicio del servidor.
alter table public.wasender_lineas enable row level security;
alter table public.wasender_plantillas enable row level security;
alter table public.wasender_eventos enable row level security;
revoke all on public.wasender_lineas from anon, authenticated;
revoke all on public.wasender_plantillas from anon, authenticated;
revoke all on public.wasender_eventos from anon, authenticated;

-- Nada se borra (misma función que el resto del panel).
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'wasender_lineas_no_delete') then
    create trigger wasender_lineas_no_delete before delete on public.wasender_lineas
      for each row execute function public.prevent_hard_delete();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'wasender_plantillas_no_delete') then
    create trigger wasender_plantillas_no_delete before delete on public.wasender_plantillas
      for each row execute function public.prevent_hard_delete();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'wasender_eventos_no_delete') then
    create trigger wasender_eventos_no_delete before delete on public.wasender_eventos
      for each row execute function public.prevent_hard_delete();
  end if;
end $$;

-- updated_at al día en cada cambio.
create or replace function public.wasender_tocar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger wasender_lineas_tocar
  before update on public.wasender_lineas
  for each row execute function public.wasender_tocar();
create or replace trigger wasender_plantillas_tocar
  before update on public.wasender_plantillas
  for each row execute function public.wasender_tocar();

revoke all on function public.wasender_tocar() from public, anon, authenticated;
