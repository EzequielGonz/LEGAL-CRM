-- ---------------------------------------------------------------------
-- 20/10: el asistente puede proponer cambiar el límite diario de envíos de
-- una campaña (también en curso). Solo amplía la lista de tipos permitidos;
-- no cambia ni borra datos. Repetible. Sigue siendo propuesta hasta que la
-- responsable confirma.
-- ---------------------------------------------------------------------
alter table public.asistente_acciones drop constraint if exists asistente_acciones_tipo_check;
alter table public.asistente_acciones
  add constraint asistente_acciones_tipo_check
  check (tipo in ('publicaciones', 'cambio_agente', 'pausar_campana', 'crear_campana', 'lanzar_campana', 'asignar_linea_campana', 'asignar_agente', 'limite_campana'));
