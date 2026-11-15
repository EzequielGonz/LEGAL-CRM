# Asistente general · migraciones

## 0626_asistente_general.sql (no aplicada)

1. Amplía `asistente_acciones_tipo_check` con `plan_campanas` (los 17 tipos anteriores siguen).
2. Suma `campaigns.creada_desde text` (nula; informativa: «asistente_general» en las campañas creadas desde el asistente general). No cambia cómo envía una campaña.

Repetible (`drop constraint if exists`, `add column if not exists`), sin borrados, sin permisos nuevos (vuelve a quitar los de `anon` y `authenticated` sobre `asistente_acciones`, que hoy ya no tiene). Esquema leído el 15/11 con consultas de solo lectura.

**Antes de aplicar**: comprobar que la última aplicada sea la 0625 y que la restricción actual tenga exactamente los 17 tipos de la 0611.

**Sin la migración**: el asistente general conversa y consulta, pero guardar una propuesta `plan_campanas` falla (la restricción la rechaza). El rótulo `creada_desde` se ignora sin error.

**Volver atrás** (sin borrar datos): la columna puede quedar (vacía para todo lo demás). Para la restricción, volver a la lista de la 0611 solo si no quedan propuestas `plan_campanas` (archivarlas antes no aplica: son propuestas; mientras existan, dejar la restricción como está).
