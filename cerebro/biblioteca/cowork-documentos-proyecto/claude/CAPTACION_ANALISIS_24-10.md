# Captación · análisis de chats reales (24/10/2026)

Muestra: primeras respuestas de los últimos 14 días, clasificadas por palabras clave, más 30 conversaciones leídas completas. Sin datos personales.

## Lo que pasa por perfil
- Jurídico (44 primeras respuestas):
  - 13 «ya tengo abogado / ya lo resolví».
  - 9 «no hice ninguna consulta / ¿de dónde sacaron mi número?».
  - 5 con interés posible.
  - 16 sin clasificar.
- Coberturas (36): 32 tocaron «Ahora no» o «No me escriban más». Son botones de la propia plantilla `cob_recupero_a`.
- Marketing (65): 33 con interés posible. Es el que mejor funciona (51/100, 3 captados).

## Causas
1. Las plantillas dicen algo falso para una base fría:
   - `contacto_frio_vita`: «por tu consulta sobre el accidente».
   - `estudio_juridico_vita_asesor`: «una consulta que realizaste».
   - `cob_recupero_a`: «hace un tiempo consultaste».
   - La persona no consultó, desconfía y pregunta de dónde salió el número.
2. `cob_recupero_a` ofrece «No me escriban más» y «Ahora no» como botones: es invitar a la baja con un toque.
3. El bot se rinde enseguida:
   - «ya tengo abogado» → despedida, sin ofrecer una segunda opinión gratis.
   - «Ahora no» → despedida, sin proponer otro momento.
   - «¿de dónde sacaron mi número?» → respuestas repetidas y vagas.
4. Hay respuestas que no conducen: un mensaje que pregunta «hola» cuatro veces, una respuesta automática de un negocio, una reacción con emoji tomada como archivo.
5. Por las bases: ART GRAVES tiene 304 de 320 sin respuesta; ART - NUEVOS PRIORIDAD 1 tiene 35 respuestas de 434.

## Propuesta (a aprobar)
- Plantillas nuevas honestas para base fría:
  - Jurídico: presentarse, dar el motivo real («revisamos casos de accidentes laborales con ART que pueden tener una diferencia a cobrar») y hacer una pregunta fácil de contestar.
  - Coberturas: botones «Sí, quiero comparar» y «Más adelante». La baja sigue respetándose si la piden por escrito.
- El bot no se rinde a la primera:
  - Ante «ya tengo abogado» ofrece una vez una revisión gratis de segunda opinión.
  - Ante «ahora no» pregunta cuándo le queda mejor y lo agenda.
  - Ante «¿de dónde salió mi número?» da una respuesta clara y única.
  - Si insisten, se disculpa y no vuelve a escribir.
- Estadísticas separadas, simples (pedido del dueño):
  - (1) Por cerrar: tiene interés y una duda que el bot no sabe responder → intervención humana.
  - (2) Pidió hablar con una persona (solo interesados).
  - (3) Bot trabado.
  - (4) Interesado que se enfrió.
  - (5) No interesados, bajas y quejas: el bot se disculpa; es solo estadística, no trabajo.
