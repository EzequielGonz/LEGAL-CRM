-- 0633 · Laboratorio simple (15/11): el asistente general propone versiones del bot.
-- Nuevos tipos de propuesta, que se confirman con un clic (nivel «cambio»):
--   «version_bot_crear»  crea una versión nueva (copia de la que rige); NO rige.
--   «version_bot_usar»   usa una versión en un perfil (función atómica de 0632).
--   «version_bot_volver» vuelve a la versión anterior (función atómica de 0632).
-- Reescribe el control de tipos con TODOS los actuales (los 17 de 0611 y
-- 'plan_campanas' de 0626) más los tres nuevos.
-- Repetible sin error. No borra ni cambia datos. RLS sin cambios y sin permisos
-- para la clave pública.
--
-- Para volver atrás (sin borrar datos): restablecer la lista de 0626 cuando no
-- queden propuestas de estos tres tipos sin archivar.
set lock_timeout = '5s';

alter table public.asistente_acciones drop constraint if exists asistente_acciones_tipo_check;
alter table public.asistente_acciones
  add constraint asistente_acciones_tipo_check check (
    tipo in (
      'publicaciones', 'cambio_agente', 'pausar_campana', 'crear_campana', 'lanzar_campana',
      'asignar_linea_campana', 'asignar_agente', 'limite_campana', 'guardar_rol', 'asignar_rol_base',
      'responder_chat', 'tomar_chat', 'soltar_chat', 'marcar_captado', 'marcar_derivado',
      'operacion_panel', 'personalizar_menu',
      'plan_campanas',
      'version_bot_crear', 'version_bot_usar', 'version_bot_volver'
    )
  );

revoke all on public.asistente_acciones from anon, authenticated;
