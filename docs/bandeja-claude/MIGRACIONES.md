# Bandeja para Claude · base de datos

## 0502_bandeja_claude

Solo agrega la tabla `public.bandeja_claude`, dos índices y dos disparadores (sin borrados; `updated_at` al día). Repetible: `create … if not exists` y `create or replace`, sin `drop`.

**Aplicada el 19/10/2026** en `legal-crm`. En el historial de la base figura en tres entradas por cómo la aplicó la herramienta: `0502_bandeja_claude` (tabla, índices, RLS y permisos), `0502_bandeja_claude_tocar` (función de `updated_at`) y `0502_bandeja_claude_disparadores` (función sin borrados, los dos disparadores y permisos de las funciones). El resultado es el mismo que el archivo.

## Revertir

No se borra la tabla (regla: nada se borra). Para dejar de usarla alcanza con revertir el código; la tabla queda sin uso. Si alguna vez hiciera falta quitarla, primero se respalda y se registra en `ops_change_log`.
