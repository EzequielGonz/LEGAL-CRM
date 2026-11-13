# Mejoras del 12/11 · base de datos

Historial real comprobado el 12/11 antes de tocar nada: la última migración aplicada era `0603_wasender_equivalencias` (versión 20261110235642).

## 0604_wasender_ritmo — APLICADA el 12/11
Agrega `wasender_lineas.calentamiento_desde` (con valor por defecto). Solo agrega; el panel publicado no la lee. Hizo falta aplicarla para que la Preview pudiera mostrar la pantalla de líneas.
Revertir: no hace falta; la columna puede quedar sin uso.

## 0605_wasender_seguimiento — APLICADA el 12/11 (17:50)
- `followup_tasks.wasender_line_id` (vacía = Meta).
- `followup_gate`: si la tarea tiene línea de Wasender comprueba esa línea; si no, las comprobaciones de Meta quedan exactamente como estaban. Antes de aplicar, confirmar que la función de la base sigue siendo la de 0201 (el 12/11 coincidía línea por línea).
- `rubros.segundo_intento_desde` (apagado) y la tabla `wasender_segundos_intentos` (un registro por contacto, con RLS y sin borrado).
Sin esta migración: el seguimiento por Wasender queda «pendiente» sin enviar y el segundo intento no hace nada. No rompe nada.
Revertir: volver a crear `followup_gate` con el texto de 0201; las columnas y la tabla pueden quedar sin uso.

## Datos cargados el 12/11
- Campaña «ART - TEST WASENDER» pausada con motivo (pedido de la responsable).
- Ocho plantillas nuevas de Wasender, inactivas (`plantillas-nuevas.sql`). No se modificó ninguna existente.
