-- 24/10 · Asistente: acciones sobre chats (con confirmación en el panel).
-- Solo amplía los tipos permitidos de asistente_acciones. No borra ni cambia datos.
-- Repetible sin error. Aplicada en producción el 24/10.
set lock_timeout = '5s';

alter table public.asistente_acciones drop constraint if exists asistente_acciones_tipo_check;
alter table public.asistente_acciones
  add constraint asistente_acciones_tipo_check
  check (tipo in ('publicaciones', 'cambio_agente', 'pausar_campana', 'crear_campana', 'lanzar_campana', 'asignar_linea_campana', 'asignar_agente', 'limite_campana', 'guardar_rol', 'asignar_rol_base',
                  'responder_chat', 'tomar_chat', 'soltar_chat', 'marcar_captado', 'marcar_derivado'));
