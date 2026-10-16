-- =====================================================================
-- Etapa 2 · Bloque 5 — Contenido automático y SEO (parche 2.0, sección 17)
-- PREPARADO, SIN CONECTAR NI HABILITAR.
--
--  * content_policies: política de autopublicación por perfil y canal
--    (hechos autorizados, CTA permitidos, temas, frecuencia, objetivos,
--    zona horaria). Nace APAGADA y con el calendario EN PAUSA.
--  * content_pieces: cola duradera de piezas con estado, fecha, zona,
--    destino, clave de deduplicación única e identificador/enlace devuelto
--    por la plataforma. Una pieza que necesita evidencia o una decisión
--    sensible queda «retenida» con su motivo; las demás siguen.
--  * content_publish_attempts: registro de cada intento (solo agrega).
--  * content_results: alcance, interacciones, clics y consultas SOLO cuando
--    hay datos reales (nulo = sin datos; nunca se inventan conversiones).
--  * content_requests: pedidos en lenguaje natural («mejorá el contenido»,
--    cambiar objetivos) para resolver en un bloque de trabajo.
--  * search_console_connections: estado de la conexión por OAuth (sin
--    tokens en texto plano: el token de renovación se guarda cifrado con
--    una clave que vive solo en el servidor).
--
-- Repetible. Reversión: docs/etapa2/sql/revertir_0203_0207.sql.
-- =====================================================================

set lock_timeout = '5s';

create table if not exists public.content_policies (
  id uuid primary key default gen_random_uuid(),
  rubro_id uuid not null references public.rubros(id),
  canal text not null check (canal in ('instagram', 'facebook', 'landing')),
  habilitada boolean not null default false,
  calendario_pausado boolean not null default true,
  zona_horaria text not null default 'America/Argentina/Buenos_Aires',
  objetivos text not null default '',
  temas text[] not null default '{}',
  frecuencia_semanal smallint not null default 3 check (frecuencia_semanal between 0 and 14),
  -- [{ "hecho": "...", "fuente": "...", "revisado": "AAAA-MM-DD" }]
  hechos_autorizados jsonb not null default '[]'::jsonb,
  -- [{ "tipo": "whatsapp" | "landing" | "formulario", "url": "https://..." }]
  ctas jsonb not null default '[]'::jsonb,
  -- Destino conectado (cuenta o página). Sin destino no se programa.
  destino_ref text,
  proveedor text check (proveedor is null or proveedor in ('metricool', 'meta', 'manual')),
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  updated_by text not null default 'sistema',
  unique (rubro_id, canal)
);

create table if not exists public.content_pieces (
  id uuid primary key default gen_random_uuid(),
  rubro_id uuid not null references public.rubros(id),
  canal text not null check (canal in ('instagram', 'facebook', 'landing')),
  formato text not null check (formato in ('post', 'carrusel', 'historia', 'video', 'articulo')),
  titulo text,
  texto text not null,
  cta_tipo text,
  cta_url text,
  -- [{ "tipo": "imagen" | "video", "ref": "...", "alt": "..." }]
  media jsonb not null default '[]'::jsonb,
  -- Afirmaciones sensibles y su evidencia: [{ "texto": "...", "evidencia": "..." }]
  afirmaciones jsonb not null default '[]'::jsonb,
  estado text not null default 'borrador' check (estado in (
    'borrador', 'retenida', 'lista', 'programada', 'publicando', 'publicada', 'error', 'incierta', 'cancelada')),
  motivo text,
  programada_para timestamptz,
  zona_horaria text not null default 'America/Argentina/Buenos_Aires',
  dedupe_key text not null unique,
  proveedor text check (proveedor is null or proveedor in ('metricool', 'meta', 'manual')),
  proveedor_id text,
  url_publicada text,
  publicada_at timestamptz,
  intentos smallint not null default 0,
  claim_token uuid,
  claimed_at timestamptz,
  version integer not null default 1,
  created_by text not null default 'sistema',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists content_pieces_due_idx on public.content_pieces (estado, programada_para) where estado = 'programada';
create index if not exists content_pieces_rubro_idx on public.content_pieces (rubro_id, canal, estado);

create table if not exists public.content_publish_attempts (
  id bigint generated always as identity primary key,
  pieza_id uuid not null references public.content_pieces(id) on delete restrict,
  at timestamptz not null default now(),
  resultado text not null check (resultado in ('publicada', 'error', 'incierta', 'reconciliada', 'retenida', 'omitida')),
  detalle text,
  proveedor_id text,
  url text
);

create table if not exists public.content_results (
  id bigint generated always as identity primary key,
  pieza_id uuid not null references public.content_pieces(id) on delete restrict,
  medido_at timestamptz not null default now(),
  fuente text not null,
  alcance integer,
  interacciones integer,
  clics integer,
  consultas integer
);

create table if not exists public.content_requests (
  id uuid primary key default gen_random_uuid(),
  rubro_id uuid not null references public.rubros(id),
  tipo text not null check (tipo in ('mejorar_contenido', 'cambiar_objetivos', 'mejora_seo', 'otro')),
  pedido text not null check (length(btrim(pedido)) between 3 and 2000),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_curso', 'resuelto', 'descartado')),
  resolucion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.search_console_connections (
  id uuid primary key default gen_random_uuid(),
  rubro_id uuid not null unique references public.rubros(id),
  propiedad text,
  estado text not null default 'sin_conectar' check (estado in ('sin_conectar', 'conectado', 'vencido', 'revocado')),
  -- Token de renovación CIFRADO (AES-GCM con una clave solo del servidor).
  refresh_token_cifrado text,
  conectado_at timestamptz,
  ultimo_error text,
  updated_at timestamptz not null default now()
);

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'content_pieces_no_delete') then
    create trigger content_pieces_no_delete before delete on public.content_pieces
      for each row execute function public.prevent_hard_delete();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'content_publish_attempts_append_only') then
    create trigger content_publish_attempts_append_only before update or delete on public.content_publish_attempts
      for each row execute function public.prevent_row_changes('El registro de publicaciones solo admite agregar filas');
  end if;
end $$;

-- Políticas iniciales: apagadas y con el calendario en pausa, para los 4 perfiles.
insert into public.content_policies (rubro_id, canal)
select r.id, c.canal
  from public.rubros r
  cross join (values ('instagram'), ('facebook'), ('landing')) as c(canal)
 where r.id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
                '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444')
on conflict (rubro_id, canal) do nothing;

-- Reserva atómica de una pieza vencida.
create or replace function public.content_claim(p_pieza uuid, p_token uuid)
returns boolean
language plpgsql
set search_path = public
as $$
declare v_ok boolean;
begin
  update public.content_pieces
     set estado = 'publicando', claim_token = p_token, claimed_at = now(), intentos = intentos + 1, updated_at = now()
   where id = p_pieza and estado = 'programada'
  returning true into v_ok;
  return coalesce(v_ok, false);
end;
$$;

alter table public.content_policies enable row level security;
alter table public.content_pieces enable row level security;
alter table public.content_publish_attempts enable row level security;
alter table public.content_results enable row level security;
alter table public.content_requests enable row level security;
alter table public.search_console_connections enable row level security;
revoke all on public.content_policies, public.content_pieces, public.content_publish_attempts,
  public.content_results, public.content_requests, public.search_console_connections from anon, authenticated;
grant select, insert, update on public.content_policies, public.content_pieces, public.content_results,
  public.content_requests, public.search_console_connections to service_role;
grant select, insert on public.content_publish_attempts to service_role;
revoke all on function public.content_claim(uuid, uuid) from public, anon, authenticated;
grant execute on function public.content_claim(uuid, uuid) to service_role;
