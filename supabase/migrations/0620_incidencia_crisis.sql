-- 0620 · Incidencia «crisis» (15/11, decisión de la responsable).
-- Cuando una persona habla de quitarse la vida o de hacerse daño, el bot le
-- manda las líneas de ayuda, el chat pasa a una persona y se abre una
-- incidencia «crisis», que muestra un cartel de urgencia en el panel.
-- Solo amplía la lista de tipos permitidos: no cambia ni borra datos.
-- Repetible sin error. Para volver atrás: recrear el check sin 'crisis'
-- (solo si no quedó ninguna incidencia de ese tipo).

alter table public.incidences drop constraint if exists incidences_kind_check;
alter table public.incidences add constraint incidences_kind_check check (kind = any (array[
  'ultimo_mensaje_sin_respuesta', 'pregunta_origen_datos', 'numero_menor', 'numero_tercero',
  'estado_contacto_conversacion', 'plantillas_sin_id', 'contactos_sin_base', 'cierre_ganado_sin_aceptacion',
  'conversacion_abierta', 'solicitud_supresion_datos', 'motivo_no_confirmado', 'mensaje_posterior_migracion',
  'otro', 'amenaza_legal', 'queja_cliente_captado', 'crisis'
]::text[]));
