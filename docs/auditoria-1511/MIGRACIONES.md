# Migraciones de la auditoría del 15/11

Todas se aplicaron el 15/11 después de comprobar el historial real de la base (la última aplicada era la 0618). Ninguna borra ni cambia datos; todas se pueden repetir sin error.

| Migración | Qué hace | Cómo volver atrás |
|---|---|---|
| 0619_rendimiento_panel_1511 | Dos funciones de conteo (`personas_que_escribieron`, `cifras_prospectos_por_base`) y nueve índices. Comprobado: la función da lo mismo que la lectura directa (540 = 540 personas; 7670 = 7670 oportunidades). | `drop function` de las dos y `drop index if exists` de cada índice; la app vuelve sola a la lectura anterior. |
| 0620_incidencia_crisis | Suma el tipo de incidencia «crisis» a la lista permitida. | Recrear el check sin «crisis», si no quedó ninguna. |
| 0621_intentos_pin_atomicos | `access_try_attempt` y `access_attempt_ok`: el intento de ingreso se reserva antes de comprobar el código (5 por origen, 30 fallidos en total, 15 minutos). Probado en una transacción que se deshizo: 5 intentos pasan y el 6.º espera. Solo las llama el servidor. | `drop function` de las dos; la app vuelve sola al conteo anterior. |
| 0622_campanas_entrenamiento | Columnas `entrenamiento_desde`, `resultado_semana`, `resultado_semana_at` y `resultado_semana_nota` en campañas. | `drop column` de las cuatro. |
| 0623_freno_respuesta_a_mano | Columna `freno_respuesta_ignorado_at` en campañas. | `drop column`. |

Cambio de datos (no es migración): tres plantillas de inicio de Marketing (anuncios, turnos y reseñas) cambiaron una pregunta sin referente por una con contexto en 56 variantes. Antes y después en `ops_change_log` 297 a 302.
