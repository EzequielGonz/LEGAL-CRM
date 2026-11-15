-- 0626 · Asistente general (15/11): el asistente del panel para los cuatro perfiles,
-- desde la pantalla de Perfiles.
-- 1) Nuevo tipo de propuesta «plan_campanas»: importar una planilla como base
--    nueva, crear la campaña de Wasender en borrador y, si se pidió, lanzarla.
--    Los tipos anteriores siguen igual.
-- 2) campaigns.creada_desde: rótulo informativo («asistente_general») de las
--    campañas creadas así. No cambia cómo envía una campaña; vacío para todas
--    las demás.
-- Repetible sin error. No borra ni cambia datos. RLS sin cambios (asistente_acciones
-- y campaigns ya tienen RLS y no se dan permisos a la clave pública).
--
-- Para volver atrás (sin borrar datos): no hace falta quitar la columna (queda vacía);
-- si se quiere, restablecer la lista de tipos de 0611 cuando no queden propuestas
-- «plan_campanas» sin archivar.
set lock_timeout = '5s';

alter table public.asistente_acciones drop constraint if exists asistente_acciones_tipo_check;
alter table public.asistente_acciones
  add constraint asistente_acciones_tipo_check check (
    tipo in (
      'publicaciones', 'cambio_agente', 'pausar_campana', 'crear_campana', 'lanzar_campana',
      'asignar_linea_campana', 'asignar_agente', 'limite_campana', 'guardar_rol', 'asignar_rol_base',
      'responder_chat', 'tomar_chat', 'soltar_chat', 'marcar_captado', 'marcar_derivado',
      'operacion_panel', 'personalizar_menu',
      'plan_campanas'
    )
  );

alter table public.campaigns add column if not exists creada_desde text;
comment on column public.campaigns.creada_desde is 'Origen informativo de la campaña cuando no es la pantalla de Campañas (por ejemplo «asistente_general»). No cambia el envío.';

revoke all on public.asistente_acciones from anon, authenticated;
