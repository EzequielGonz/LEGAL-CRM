-- ---------------------------------------------------------------------
-- 0630 · Laboratorio del bot (15/11).
--
-- Tablas NUEVAS para crear y probar versiones del bot sin tocar lo que rige:
--   1) bot_lab_versiones: datos propios de cada versión del laboratorio
--      (v3 en adelante): de qué versión es copia, perfiles, modelo de Gemini,
--      tono, reglas y roles copiados. Su conocimiento son filas NUEVAS de
--      bot_knowledge_items con su número de versión (la 0631 hace la copia).
--   2) bot_lab_proveedores: estructura para conectar otro proveedor más
--      adelante (nombre, dirección y NOMBRE de la variable de entorno). Nunca
--      guarda claves. Figura «preparado, sin conectar».
--   3) bot_lab_roles_generales: roles que no son de un perfil. Para usarlos en
--      un perfil se copian a agent_roles (fila nueva).
--   4) bot_lab_aplicaciones: cada aplicación manual (versión a todo el perfil,
--      rol a perfil, tipo de consulta, base o campaña), con lo que había antes
--      para poder volver atrás. Volver atrás marca revertida_at (no se borra).
--   5) bot_lab_pruebas_ab y bot_lab_ab_asignaciones: pruebas A/B por campaña
--      (porcentaje y días) y qué variante atendió cada charla.
--   6) bot_lab_simulaciones: corridas de casos sintéticos (no escriben en
--      conversaciones, contactos ni campañas).
--
-- Repetible (if not exists), RLS activado, sin permisos para anon ni
-- authenticated (solo la clave de servicio del servidor). No modifica ni
-- borra datos existentes.
-- ---------------------------------------------------------------------

create table if not exists public.bot_lab_versiones (
  version smallint primary key references public.bot_knowledge_versions(version) check (version between 3 and 99),
  base_version smallint not null references public.bot_knowledge_versions(version),
  rubros text[] not null check (cardinality(rubros) between 1 and 4 and rubros <@ array['juridico', 'agencia_0km', 'coberturas_medicas', 'marketing']::text[]),
  modelo text check (modelo is null or modelo ~ '^gemini-[a-z0-9][a-z0-9.\-]{0,60}$'),
  tono text not null default '' check (char_length(tono) <= 1500),
  reglas text not null default '' check (char_length(reglas) <= 4000),
  roles jsonb not null default '[]'::jsonb check (jsonb_typeof(roles) = 'array'),
  creado_at timestamptz not null default now(),
  creado_por text not null default 'panel',
  archived_at timestamptz,
  archived_note text check (archived_note is null or char_length(archived_note) <= 300)
);
create index if not exists bot_lab_versiones_base_idx on public.bot_lab_versiones (base_version);
alter table public.bot_lab_versiones enable row level security;
revoke all on public.bot_lab_versiones from anon, authenticated;
comment on table public.bot_lab_versiones is 'Laboratorio del bot: versiones nuevas (copias). Solo rigen si alguien las aplica a mano o en una prueba A/B.';

create table if not exists public.bot_lab_proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 2 and 60),
  endpoint text not null check (endpoint ~ '^https://' and char_length(endpoint) <= 300),
  variable_clave text not null check (variable_clave ~ '^[A-Z][A-Z0-9_]{2,63}$'),
  notas text not null default '' check (char_length(notas) <= 500),
  creado_at timestamptz not null default now(),
  creado_por text not null default 'panel',
  archived_at timestamptz,
  archived_note text
);
alter table public.bot_lab_proveedores enable row level security;
revoke all on public.bot_lab_proveedores from anon, authenticated;
comment on table public.bot_lab_proveedores is 'Proveedores de IA preparados para más adelante. Solo el NOMBRE de la variable de entorno de la clave, nunca la clave. Sin llamadas implementadas.';

create table if not exists public.bot_lab_roles_generales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(nombre) between 2 and 80),
  objetivo text not null default '' check (char_length(objetivo) <= 500),
  tono text not null default '' check (char_length(tono) <= 300),
  instrucciones text not null check (char_length(instrucciones) between 10 and 6000),
  creado_at timestamptz not null default now(),
  creado_por text not null default 'panel',
  archived_at timestamptz,
  archived_note text
);
alter table public.bot_lab_roles_generales enable row level security;
revoke all on public.bot_lab_roles_generales from anon, authenticated;

create table if not exists public.bot_lab_aplicaciones (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('version_perfil', 'rol_perfil', 'rol_tipo_consulta', 'rol_base', 'rol_campana')),
  rubro text not null check (rubro in ('juridico', 'agencia_0km', 'coberturas_medicas', 'marketing')),
  version smallint references public.bot_knowledge_versions(version),
  rol_id uuid references public.agent_roles(id),
  tipo_consulta text check (tipo_consulta is null or tipo_consulta in ('entrante', 'campana', 'civil', 'penal')),
  base_id uuid references public.imported_bases(id),
  campaign_id uuid references public.campaigns(id),
  antes jsonb,
  despues jsonb,
  aplicada_at timestamptz not null default now(),
  aplicada_por text not null default 'panel',
  revertida_at timestamptz,
  revertida_por text,
  nota_reversion text check (nota_reversion is null or char_length(nota_reversion) <= 300),
  check (tipo <> 'version_perfil' or version is not null),
  check (tipo not in ('rol_perfil', 'rol_tipo_consulta') or rol_id is not null),
  check (tipo <> 'rol_tipo_consulta' or tipo_consulta is not null),
  check (tipo <> 'rol_base' or base_id is not null),
  check (tipo <> 'rol_campana' or campaign_id is not null)
);
create index if not exists bot_lab_aplicaciones_vigentes_idx on public.bot_lab_aplicaciones (rubro, tipo) where revertida_at is null;
create unique index if not exists bot_lab_aplicaciones_rol_perfil_uq on public.bot_lab_aplicaciones (rubro) where tipo = 'rol_perfil' and revertida_at is null;
create unique index if not exists bot_lab_aplicaciones_rol_tipo_uq on public.bot_lab_aplicaciones (rubro, tipo_consulta) where tipo = 'rol_tipo_consulta' and revertida_at is null;
-- Claves foráneas indexadas (tablas nuevas y vacías: crear el índice no bloquea nada en uso).
create index if not exists bot_lab_aplicaciones_rol_idx on public.bot_lab_aplicaciones (rol_id);
create index if not exists bot_lab_aplicaciones_base_idx on public.bot_lab_aplicaciones (base_id);
create index if not exists bot_lab_aplicaciones_campana_idx on public.bot_lab_aplicaciones (campaign_id);
create index if not exists bot_lab_aplicaciones_version_idx on public.bot_lab_aplicaciones (version);
alter table public.bot_lab_aplicaciones enable row level security;
revoke all on public.bot_lab_aplicaciones from anon, authenticated;
comment on table public.bot_lab_aplicaciones is 'Laboratorio del bot: aplicaciones manuales con lo que había antes. Volver atrás marca revertida_at; cada paso queda además en ops_change_log.';

create table if not exists public.bot_lab_pruebas_ab (
  id uuid primary key default gen_random_uuid(),
  rubro text not null check (rubro in ('juridico', 'agencia_0km', 'coberturas_medicas', 'marketing')),
  campaign_id uuid not null references public.campaigns(id),
  version smallint not null references public.bot_knowledge_versions(version),
  modelo text check (modelo is null or modelo ~ '^gemini-[a-z0-9][a-z0-9.\-]{0,60}$'),
  porcentaje smallint not null default 20 check (porcentaje between 1 and 90),
  dias smallint not null default 7 check (dias between 1 and 30),
  inicio timestamptz not null default now(),
  fin timestamptz not null,
  control_version smallint references public.bot_knowledge_versions(version),
  creada_at timestamptz not null default now(),
  creada_por text not null default 'panel',
  cortada_at timestamptz,
  cortada_por text,
  nota_corte text check (nota_corte is null or char_length(nota_corte) <= 300),
  check (fin > inicio)
);
create index if not exists bot_lab_pruebas_ab_campana_idx on public.bot_lab_pruebas_ab (campaign_id, fin) where cortada_at is null;
create index if not exists bot_lab_pruebas_ab_campana_todas_idx on public.bot_lab_pruebas_ab (campaign_id);
create index if not exists bot_lab_pruebas_ab_version_idx on public.bot_lab_pruebas_ab (version);
create index if not exists bot_lab_pruebas_ab_control_idx on public.bot_lab_pruebas_ab (control_version);
alter table public.bot_lab_pruebas_ab enable row level security;
revoke all on public.bot_lab_pruebas_ab from anon, authenticated;
comment on table public.bot_lab_pruebas_ab is 'Laboratorio del bot: A/B en una campaña. La variante en prueba atiende un porcentaje de las charlas NUEVAS de esa campaña hasta fin (se corta sola) o hasta cortada_at.';

create table if not exists public.bot_lab_ab_asignaciones (
  prueba_id uuid not null references public.bot_lab_pruebas_ab(id),
  conversation_id uuid not null references public.conversations(id),
  variante text not null check (variante in ('prueba', 'control')),
  version smallint,
  modelo text,
  asignada_at timestamptz not null default now(),
  primary key (prueba_id, conversation_id)
);
create index if not exists bot_lab_ab_asignaciones_conv_idx on public.bot_lab_ab_asignaciones (conversation_id);
alter table public.bot_lab_ab_asignaciones enable row level security;
revoke all on public.bot_lab_ab_asignaciones from anon, authenticated;

create table if not exists public.bot_lab_simulaciones (
  id uuid primary key default gen_random_uuid(),
  creada_at timestamptz not null default now(),
  creada_por text not null default 'panel',
  estado text not null default 'procesando' check (estado in ('procesando', 'listo', 'error')),
  pedido jsonb not null default '{}'::jsonb,
  resultado jsonb not null default '{}'::jsonb,
  error text,
  terminada_at timestamptz
);
create index if not exists bot_lab_simulaciones_creada_idx on public.bot_lab_simulaciones (creada_at desc);
alter table public.bot_lab_simulaciones enable row level security;
revoke all on public.bot_lab_simulaciones from anon, authenticated;
comment on table public.bot_lab_simulaciones is 'Laboratorio del bot: corridas de casos sintéticos con «Probar el bot real». No escriben en conversaciones, contactos ni campañas.';
