# 14/11 · Segunda vuelta

Pedido de la responsable (14/11, después de la primera entrega):

1. Los datos del negocio ya están en las indicaciones de los agentes: no pedirlos de nuevo.
2. Archivar las plantillas de inicio viejas; que se ejecute solo el algoritmo nuevo; dejar el límite diario por campaña para forzar más envíos; que el asistente pueda generar plantillas nuevas.
3. En Bot IA, un informe en el que la IA (Gemini) relea las conversaciones reales, analice y proponga mejoras, para aplicar a mano o con el asistente, en un agente nuevo o sumado al agente base del rubro.
4. Probar el algoritmo sin gente real, usar el panel como dueño, revisar todo y plantear lo que haya para mejorar o corregir.

## Estado por punto

| Punto | Implementado | Probado | Publicado | Habilitado |
|---|---|---|---|---|
| 1. Fichas del 14/11 alineadas con la ficha del negocio y las instrucciones (registro 291) | Sí | Revisión de los textos | Sí (datos) | Sí |
| 2a. 40 plantillas viejas archivadas con motivo (293); la campaña pausada con plantilla fija pasa a rotación (292) | Sí | Pantalla de plantillas y de campañas recorridas | Sí (datos) | Sí. No se lanzó ni reanudó nada |
| 2b. Sin plantilla fija, la campaña de Wasender rota sola («Al azar», seleccionado por defecto) | Sí | Prueba unitaria; pantalla de campaña en producción | Sí | Sí |
| 2c. El límite diario de una campaña de Wasender frena el día, no la campaña (antes la dejaba pausada hasta reanudarla a mano) | Sí | Revisión del motor | Sí | Rige con la primera campaña en curso |
| 2d. Asistente: reglas para escribir plantillas de inicio para bases frías; crear una plantilla avisa si las variantes son casi iguales | Sí | Tipos y catálogo | Sí | Sí |
| 3. Informe de mejoras del bot (Bot IA, los cuatro perfiles) | Sí | 11 pruebas unitarias; generado en producción en los cuatro perfiles | Sí | Sí |
| 4a. Envíos repartidos en todo el día (hallazgo de la simulación) | Sí | Simulación de 12 días × 4 líneas; 2 pruebas unitarias | Sí | Rige con la primera campaña en curso |
| 4b. Confirmación después de captar que se perdía (hallazgo del informe) | Sí | Tipos y pruebas existentes; sin prueba de integración (necesita Docker) | Sí (autorizado el 14/11) | Sí |

## Informe de mejoras del bot

- Bot IA → «Informe de mejoras del bot»: período (7, 14, 30 o 60 días) y «Generar informe».
- Se arma en segundo plano (la IA tarda de 1 a 3 minutos); la pantalla avisa cuando queda listo. Se puede seguir usando el panel.
- Lee hasta 60 conversaciones del período con respuesta de la persona, sin teléfonos, documentos, correos ni nombres. Cada conversación lleva su fecha; cada ficha existente, desde cuándo rige; y el pedido incluye lo que ya se corrigió en el sistema, para que no aparezca como problema actual.
- Devuelve: resumen, lo que funciona, hallazgos (con gravedad y en cuántas conversaciones) y hasta 6 propuestas.
- Cada propuesta se puede corregir y después:
  - **Sumar al bot del perfil** (agente base): ficha nueva de conocimiento, versión 2, `fuente = 'informe IA dd/mm'`. Se apaga desde Conocimiento.
  - **Crear como rol nuevo**: queda sin asignar; se carga a una base o campaña en «Roles por base».
  - **Pedírselo al asistente**: abre el asistente con el pedido escrito. El asistente tiene dos operaciones nuevas: generar el informe y sumar una ficha al bot del perfil.
- Nunca edita ni borra lo que hay. Todo queda en `ops_change_log`.

## Simulación del algoritmo (sin envíos)

12 días hábiles × 4 líneas (una por perfil), con el calentamiento real (20, 40 y después 60 por día), las 48 plantillas nuevas, el horario de las campañas (8 a 21) y el ritmo de la campaña de Jurídico (tandas de 10, pausas de 5 minutos, esperas de 50 a 200 segundos).

- **Antes del arreglo**: cada línea mandaba todo el cupo del día entre la hora de arranque y el mediodía (por ejemplo, 15 mensajes de 9:14 a 9:57) y a la tarde quedaba muda. Las pausas de la tarde no servían. Patrón diario.
- **Después**: los envíos se reparten hasta el cierre del plan (primer envío entre 8:07 y 9:40 según el día; último entre 18:34 y 20:49), en la mañana, la tarde y la noche; la espera entre mensajes va de 4 a 111 minutos según el cupo.
- Textos: ningún envío con la misma plantilla que el anterior; parecido máximo entre dos envíos seguidos 0,61 (el umbral es 0,8); entre 74 % y 79 % de textos distintos en 12 días (430 a 460 envíos por línea).

## Hallazgos verificados con datos reales

- **Confirmación perdida al captar (Jurídico, 4 casos en 14 días)**: si el bot usaba «captar» y después «finalizar_consulta» en la misma respuesta, el segundo pedido de permiso del acuse borraba el primero y la persona que aceptaba la llamada no recibía la confirmación. Arreglado y publicado con autorización de la responsable.
- **Insistencia después de «ya compré» en Autos**: todos los casos son del 24 al 26/10. Desde el 13/11 Autos usa la versión 2 del conocimiento con la ficha «Ya compré» (O201). Ya resuelto.
- **Respuestas dobles en Marketing**: la última fue el 31/10. Ya resuelto.
- **Campaña «ART - TEST WASENDER»**: 1.147 contactos pendientes y la línea asignada está archivada. Hay que asignarle una línea conectada antes de reanudarla.

## Recorrido de producción como dueño (solo mirando)

- Pantallas cambiadas: plantillas de Wasender de los cuatro perfiles (12 nuevas cada uno, sin avisos de variantes parecidas), las dos campañas de Wasender de Jurídico («Al azar entre las 12 plantillas de inicio (677 textos)») y Bot IA de los cuatro perfiles con su informe. Sin errores.
- Panel completo: 166 pantallas en computadora y 55 en celular. Una sola con un aviso: un error de hidratación de React en «Prospectos por base» de Marketing, que no se repitió en 8 cargas más (aislado, sin cambios hoy en esa pantalla).
- Errores del servidor en las últimas dos horas: solo el corte por tiempo del primer informe (ya resuelto con el segundo plano).

## Qué no se probó

- Un envío real (sin líneas conectadas y sin envíos de prueba a personas).
- Aplicar propuestas del informe: queda a decisión de la responsable.
- La corrección de la confirmación después de captar, en una conversación real (se va a ver con la próxima captación).
- Pruebas de integración (necesitan Docker, que no está en este entorno).
