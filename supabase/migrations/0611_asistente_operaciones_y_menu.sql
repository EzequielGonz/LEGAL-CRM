-- 0611 · Asistente con permiso para todo y menú a medida por perfil (13/11).
-- 1) El asistente puede proponer cualquier operación del panel y cambios al
--    menú: se amplía la lista de tipos de propuesta (los anteriores siguen).
-- 2) Menú (y, más adelante, otras secciones) a medida de cada perfil.
-- Repetible. No borra nada. RLS activado y sin permisos para la clave pública.

alter table public.asistente_acciones drop constraint if exists asistente_acciones_tipo_check;
alter table public.asistente_acciones
  add constraint asistente_acciones_tipo_check check (
    tipo in (
      'publicaciones', 'cambio_agente', 'pausar_campana', 'crear_campana', 'lanzar_campana',
      'asignar_linea_campana', 'asignar_agente', 'limite_campana', 'guardar_rol', 'asignar_rol_base',
      'responder_chat', 'tomar_chat', 'soltar_chat', 'marcar_captado', 'marcar_derivado',
      'operacion_panel', 'personalizar_menu'
    )
  );

create table if not exists public.personalizacion_perfil (
  rubro_id uuid not null references public.rubros(id) on delete restrict,
  clave text not null check (clave in ('menu')),
  valor jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text,
  primary key (rubro_id, clave)
);

alter table public.personalizacion_perfil enable row level security;
revoke all on public.personalizacion_perfil from anon, authenticated;

comment on table public.personalizacion_perfil is 'Ajustes de presentación de cada perfil (por ahora, el menú). Los edita el asistente con confirmación; el historial queda en ops_change_log.';
