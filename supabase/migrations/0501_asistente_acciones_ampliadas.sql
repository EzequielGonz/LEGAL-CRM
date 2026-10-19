-- ---------------------------------------------------------------------
-- 19/10: el asistente puede proponer más tipos de acciones (campañas,
-- líneas y agentes). Solo amplía la lista de tipos permitidos de una tabla
-- que ya existe: no cambia ni borra datos. Repetible.
-- Todo sigue siendo propuesta hasta que la responsable confirma.
-- ---------------------------------------------------------------------
alter table public.asistente_acciones drop constraint if exists asistente_acciones_tipo_check;
alter table public.asistente_acciones
  add constraint asistente_acciones_tipo_check
  check (tipo in ('publicaciones', 'cambio_agente', 'pausar_campana', 'crear_campana', 'lanzar_campana', 'asignar_linea_campana', 'asignar_agente'));
