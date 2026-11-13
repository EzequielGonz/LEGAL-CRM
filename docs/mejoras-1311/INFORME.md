# Informe del 13/11 · qué se probó y qué no

## Estado por pieza

| Pieza | Implementado | Probado | Publicado | Habilitado |
|-------|--------------|---------|-----------|------------|
| Criterio del bot antes del seguimiento | Sí | Reglas con pruebas unitarias; el circuito programó 2 contactos reales para el 14/11. **No se vio todavía un envío real ni una decisión real del bot** (el primero es el sábado 14/11) | Sí | Sí |
| Mensaje del seguimiento redactado por el bot (Wasender) | Sí | Solo por lectura de código y tipos: la línea de Wasender está desconectada | Sí | Sí, sale cuando haya línea |
| Descartes automáticos | Sí | Pruebas unitarias y una corrida real en producción (cerró 3 con motivo) | Sí | Sí |
| Resultados | Sí | Recorrido en producción en las cinco vistas y dos perfiles | Sí | — |
| Plantillas de inicio y rotación | Sí | Generador con comprobaciones (variables, repetidos, largos); las 27 existentes conservaron su texto; pruebas de reparto. **No se envió ninguna** | Sí | Plantillas activas; ninguna campaña las usa todavía |
| Fichas nuevas del bot | Sí | Cargadas y contadas en la base. **No se midió todavía su efecto** | Sí | Sí |
| Reacciones sin pedido de texto | Sí | Lectura de código y tipos | Sí | Sí |
| Ficha: devolver al bot | Sí | Probado en producción con un caso viejo: el chat volvió al bot, no salió ningún mensaje, y se dejó como estaba (registro en `ops_change_log`) | Sí | — |
| Ficha: que el bot conteste el mensaje pendiente al devolver | Sí | **No probado con un caso real** (habría enviado un mensaje a una persona) | Sí | Sí |
| Velocidad | Sí | Medido en producción: título visible en 0,4 s (antes, pantalla en blanco de 3 a 6,7 s); Hoy completo en 2,5 a 3 s (antes 4,5 a 6,7 s) | Sí | — |
| Lista de chats, Incidencias, menú | Sí | Pruebas unitarias y captura en producción | Sí | — |
| «Esperan tu respuesta» con la misma definición en Hoy, la ficha y los filtros de chats | Sí | Comparado en producción (ver abajo) | Sí | — |

Suite: 386 pruebas pasan; falla 1 que ya fallaba antes y no tiene relación («asistente: cada tipo permitido…»).

## Lo que falta

- Ver el primer seguimiento real (sábado 14/11) y revisar qué decidió el bot.
- Probar con la línea de Wasender conectada: campaña con rotación, seguimiento redactado por el bot y segundo intento.
- La tabla vieja «Captados y casos» sigue existiendo por su dirección (sin pestaña).
- Cargar en la ficha de cada negocio los datos que el bot necesita para dar información concreta (ver `BOT-V2.md`).
- Cambiar el código de acceso del panel: se usó durante todo el trabajo.
