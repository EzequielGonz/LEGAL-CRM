# Bot v2 · qué se sumó el 13/11 y por qué

Pedido: «no hagas una versión nueva, mejorá la v2 […] sin editar ni borrar lo actual, sumándole más información y herramientas».

## Qué se miró

Todas las conversaciones atendidas con la v2 desde el 25/10 (unas 90 entre los cuatro perfiles, 230 turnos del bot), con foco en las que terminaron perdidas o detenidas y en las que quedaron cortadas después de una pregunta del bot. Sin datos personales en este documento.

## Qué se encontró

1. **Las fichas no aparecen cuando más hacen falta.** En las conversaciones que terminaron detenidas, Marketing usó una ficha en 0 de 10 turnos y Autos en 0 de 8; Jurídico en 5 de 15. Los disparadores no coincidían con cómo escribe la gente: «por ahora gracias», «no necesito», «ya compré», «pasame info y lo veo», «no soy esa persona».
2. **Un pedido de información se contestaba con otra pregunta.** «Pasame información y lo veo» o «¿cuál es la propuesta?» recibían una frase genérica y una pregunta; la persona no volvía a escribir. Es el corte más repetido en Autos y Marketing.
3. **La única insistencia se gastaba donde no tenía sentido.** A «ya compré, gracias», «no tengo más auto y tampoco quiero» o «no soy Carlos» el bot respondía ofreciendo «sin compromiso» lo mismo de antes. En dos casos eso terminó en un pedido de que lo borren.
4. **«Ya lo resolví» en Jurídico**: la segunda opinión se ofrecía con una afirmación general («muchas veces la ART liquida de menos») y una pregunta abierta. De cuatro casos, dos cerraron con un «no, gracias» seco y dos no contestaron.
5. **Saludos repetidos en Coberturas**: a tres «hola» seguidos el bot respondió con tres preguntas distintas.
6. **Una reacción (👍, ❤️) se trataba como un audio**: el bot contestaba «no puedo escuchar audios ni abrir archivos».

Lo que funcionó y no se toca: «ahora no» se contesta en una línea sin insistir; los pedidos de baja se respetan en el momento; las conversaciones captadas llegaron al paso en pocos turnos cuando el bot propuso el contacto apenas hubo interés.

## Qué se sumó (solo altas, 14 fichas, versión 2)

Texto completo en `conocimiento-v2-agregados.sql` (aplicado el 13/11; registrado en `ops_change_log`).

| Clave | Capa | Para qué |
|-------|------|----------|
| `general_una_insistencia` | general (va siempre) | Cómo hacer la única insistencia y cuándo no gastarla; después de insistir, cualquier negativa cierra |
| `general_dar_antes_de_preguntar` | general (va siempre) | Primero dar información concreta, después una pregunta con opciones; máximo dos preguntas seguidas; señales para proponer el paso |
| `juridico_ya_resuelto` | tema Jurídico | Una sola pregunta de sí o no, sin alarmar |
| `juridico_ya_tiene_abogado` | tema Jurídico | Una sola pregunta por segunda opinión; si dice que no, cerrar |
| `autos_piden_info` | tema Autos | Qué contestar a «pasame info», requisitos y DNI |
| `cob_primer_respuesta` | tema Coberturas | Saludos sueltos y pedidos de planes o precios |
| `mkt_piden_propuesta` | tema Marketing | Qué decir cuando aceptan escuchar |
| `O201` a `O207` | objeciones comunes | Ya compré · Por ahora no · No soy esa persona · Pasame info y lo veo · No necesito · Estoy trabajando · Es mentira |

Ninguna ficha existente se editó ni se borró. Las reglas del sistema, la ficha del negocio y el rol siguen mandando sobre este conocimiento.

## Qué cambió en el código

- `src/lib/inbound.ts`: una reacción ya no recibe el pedido de «escribilo en texto».
- La selección de fichas no se tocó: las nuevas entran por sus disparadores con el mecanismo de siempre.

## Cómo saber si sirvió

En Bot IA → Conocimiento, comparar dentro de dos semanas: turnos con ficha en conversaciones detenidas (hoy 5 de 33), detenciones por perfil y captados por perfil. El informe programado del 20/11 lo incluye.

## Datos del negocio que faltan (los tiene que cargar la responsable en la ficha de cada perfil)

- Autos: marcas o tipos de vehículo con los que se trabaja y formas de pago, en una frase que el bot pueda decir.
- Coberturas: zonas donde se trabaja.
- Marketing: una frase concreta de qué incluye la propuesta inicial.
