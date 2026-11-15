# 15/11 · Cierre al captar y propuestas aplicadas

Pedido de la responsable (15/11): aplicar las tres propuestas recomendadas del informe y que, en todos los rubros, al captar o agendar el bot responda, agradezca y confirme que un profesional se va a comunicar, en vez de cortar y dejar a la persona en visto. El cierre se adapta a cada rubro. Con Wasender ya no hay botones en el primer mensaje (eran una limitación de Meta).

## Qué pasaba (datos reales, últimos 45 días)

- 26 captaciones con chat. En 20 no salió un cierre del bot (Jurídico 13 de 13, Coberturas 2 de 2, Autos 2 de 4, Marketing 3 de 7): a veces no salió nada y a veces salió otra pregunta («¿la cobertura sería solo para vos?», «¿mañana o tarde?»). Como al captar el chat pasa a una persona y el bot queda en pausa, la respuesta de la persona quedaba sin contestar.
- Causas: 1) en Jurídico, «captar» y «finalizar_consulta» en la misma respuesta borraban el permiso del acuse (6 casos, corregido el 14/11); 2) la guía común pedía que «cada respuesta termine con una pregunta», también la última; 3) «finalizar_consulta» no le daba ninguna instrucción al modelo; 4) si el modelo no escribía nada o el validador retenía el texto, no salía nada.

## Qué cambió

| | Implementado | Probado | Publicado | Habilitado |
|---|---|---|---|---|
| Cierre por rubro al captar (`src/lib/agentes/cierre-captacion.ts`): instrucción para el modelo; si responde con una pregunta o vacío se le pide un cierre una vez y, si tampoco sirve, sale el cierre fijo del rubro. El cierre no se retiene | Sí | 5 pruebas unitarias (los cinco cierres de reserva pasan el validador); sin prueba de integración (necesita Docker) | Ver ESTADO | Con el bot encendido, en la próxima captación |
| Guía común: la última respuesta después de captar agradece, confirma y se despide, sin preguntas | Sí | Prueba unitaria | Ver ESTADO | Ídem |
| «finalizar_consulta», aprobados de Marketing y «agendar_cita» con instrucción de cierre o confirmación | Sí | Tipos | Ver ESTADO | Ídem |
| 3 fichas de los informes (registros 294 a 296) | Sí | Disparadores probados con frases de ejemplo | Sí (datos) | Sí |

Cierres de reserva:

- Jurídico: «¡Muchas gracias, Nombre! Ya quedó registrada tu consulta. Un abogado del estudio se va a comunicar con vos para ver tu caso. Si querés sumar algo mientras tanto, dejalo por acá y lo ve el profesional.»
- Coberturas: un asesor, para mostrar las opciones de cobertura.
- Autos: un asesor comercial, para pasar la propuesta por escrito.
- Marketing: el equipo, para avanzar con la propuesta (sin nombre: suele ser el de un negocio).

## Qué no se probó

- Una captación real con el cambio (se va a ver con la próxima).
- Pruebas de integración (necesitan Docker).
