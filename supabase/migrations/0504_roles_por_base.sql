-- ---------------------------------------------------------------------
-- 21/10 · Roles del agente por base y fin de la comparación de agentes.
--
-- 1) agent_roles: roles o comportamientos guardados por perfil (nombre,
--    objetivo, tono e instrucciones). Se crean y editan desde Agentes o
--    desde «Pedile algo» (como propuesta), y se reutilizan en otras bases.
-- 2) imported_bases.agent_role_id: el rol con el que el agente aborda a los
--    contactos de esa base. Sin rol, responde con el agente del perfil.
-- 3) asistente_acciones: dos tipos nuevos (guardar_rol, asignar_rol_base).
-- 4) La comparación A/B/C, que nunca empezó, queda cancelada con motivo
--    (no se borra nada). Responde siempre Gemini 3.8 Flash.
--
-- Repetible, con RLS y sin permisos para la clave pública. Sin borrados.
-- ---------------------------------------------------------------------
create table if not exists public.agent_roles (
  id uuid primary key default gen_random_uuid(),
  rubro_id uuid not null,
  area text not null,
  nombre text not null check (char_length(nombre) between 2 and 80),
  objetivo text not null default '' check (char_length(objetivo) <= 500),
  tono text not null default '' check (char_length(tono) <= 300),
  instrucciones text not null check (char_length(instrucciones) between 10 and 6000),
  creado_por text not null default 'operador',
  archived_at timestamptz,
  archived_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists agent_roles_rubro_idx on public.agent_roles (rubro_id) where archived_at is null;

alter table public.agent_roles enable row level security;
revoke all on public.agent_roles from anon, authenticated;

alter table public.imported_bases add column if not exists agent_role_id uuid references public.agent_roles(id) on delete set null;
create index if not exists imported_bases_agent_role_idx on public.imported_bases (agent_role_id) where agent_role_id is not null;

alter table public.asistente_acciones drop constraint if exists asistente_acciones_tipo_check;
alter table public.asistente_acciones
  add constraint asistente_acciones_tipo_check
  check (tipo in ('publicaciones', 'cambio_agente', 'pausar_campana', 'crear_campana', 'lanzar_campana', 'asignar_linea_campana', 'asignar_agente', 'limite_campana', 'guardar_rol', 'asignar_rol_base'));

update public.agent_experiments
   set estado = 'cancelado',
       motivo_cierre = 'Cancelada el 21/10 por la responsable: queda solo el modelo vigente (Gemini 3.8 Flash).',
       updated_at = now()
 where estado in ('preparado', 'en_curso');

-- 5) Canales de Instagram y Facebook para los perfiles que no los tenían:
--    los mensajes directos de redes también los responde el agente.
insert into public.channels (area, type, label)
select a.area::public.area_type, t.type::public.channel_type, initcap(replace(a.area, '_', ' ')) || ' · ' || initcap(t.type)
  from (values ('agencia_0km'), ('coberturas_medicas'), ('marketing')) as a(area)
 cross join (values ('instagram'), ('facebook')) as t(type)
 where not exists (select 1 from public.channels c where c.area::text = a.area and c.type::text = t.type);
