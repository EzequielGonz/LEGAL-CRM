# Oficina de agentes (22/11)

## Qué incluye
- Sección «00 · La oficina» en `/cerebro`: 8 escritorios con estado animado (libre, en cola, trabajando), mesa de entrada, tareas en marcha con su recorrido por sectores y «Esperando tu OK» con Aprobar, Pedir cambios y Descartar.
- `POST /api/oficina`: deja una tarea; Gemini la ordena (título, ruta de áreas, plan). Si Gemini no responde, ordena por palabras.
- `POST /api/oficina/arrancar`: «Arrancar ahora». No arranca si no hay tareas ni dos veces en 15 minutos. Dispara la tarea programada de Claude si están `OFICINA_DISPARO_URL` y `OFICINA_DISPARO_TOKEN`. Si no están, queda «sin disparador» y el dueño escribe «oficina» en un chat.
- `PATCH /api/oficina/[id]`: decisión del dueño. Aprobada; cambios, que vuelve a la mesa de entrada con la nota; o rechazada, que se descarta con motivo.
- Skills `oficina` (cómo trabaja cada vuelta, hasta borrador) y `accesos`.

## Base
`0636_oficina_agentes.sql`: suma columnas a `bandeja_claude` (área, ruta, recorrido, título, triaje, origen, decisión) y la tabla `oficina_arranques`. No cambia ni borra datos y se puede repetir. Revertir: no hace falta; las columnas nuevas no las usa nada más.

## Pruebas
- `tests/unitarias/oficina-reglas.test.ts`: 11 pruebas.
- La suite completa: 603 pasan.
- Typecheck, lint y build sin errores.

## Qué no hace
- No publica, no programa ni manda mensajes. Gemini solo ordena.
- No corre agentes por sí sola: los agentes los corre la tarea programada de Claude.
