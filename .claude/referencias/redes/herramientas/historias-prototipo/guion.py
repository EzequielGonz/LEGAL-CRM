# Guiones del prototipo v2: formato propio de cada marca (docs/redes/analisis-2026-11-20/videos-que-rinden-2026-11-20.md §4).
# Afirmaciones tomadas de guiones.py y palabras-clave-bot.md (ya escritas para revisión); el cierre pasa a «Comentá PALABRA».
# say = lo que se lee; show = subtítulo (*acento*); p = pausa después; r/ph = ajuste de ritmo/tono; item = número de la lista.
R = {
 'vita': dict(voz='es-AR-TomasNeural', rate=2, pitch=-2, palabra='FIRMA', serie='Antes de firmar', frases=[
   dict(say='¿Firmás, o no?', show='¿Firmás o no?', p=0.35, ph=2, r=-4, hook=1),
   dict(say='Te chocaron, y el seguro del otro te ofrece un acuerdo rápido.', show='Te chocaron y el seguro del otro te ofrece un *acuerdo rápido.*', p=0.4),
   dict(say='Esperá.', show='*Esperá.*', p=0.55, r=-10, ph=-3, sello=1),
   dict(say='Lo que firmás puede cerrar tu reclamo.', show='Lo que firmás puede *cerrar tu reclamo.*', p=0.3),
   dict(say='Si después aparece una lesión, quizás ya no puedas pedir más.', show='Si después aparece una lesión, quizás *ya no puedas pedir más.*', p=0.5, r=-2),
   dict(say='Antes de firmar, tres cosas.', show='Antes de firmar, *tres cosas:*', p=0.3),
   dict(say='Uno: pedí la propuesta por escrito.', show='Pedí la propuesta *por escrito.*', p=0.35, item=1),
   dict(say='Dos: no firmes el mismo día.', show='No firmes *el mismo día.*', p=0.35, item=2),
   dict(say='Tres: consultá antes con un abogado.', show='Consultá antes *con un abogado.*', p=0.55, item=3),
   dict(say='Comentá «firma», y te respondemos.', show='Comentá *FIRMA*', p=0.2, cta=1, r=-3)]),
 'cob': dict(voz='es-AR-ElenaNeural', rate=2, pitch=0, palabra='COMPARAR', serie='La carta', frases=[
   dict(say='¿Otra vez aumentó?', show='¿Otra vez *aumentó?*', p=0.35, ph=2, hook=1),
   dict(say='Llegó el aviso de tu prepaga:', show='Llegó el aviso de *tu prepaga:*', p=0.12),
   dict(say='tu cuota se actualiza este mes.', show='«Tu cuota se *actualiza* este mes.»', p=0.45, r=-3),
   dict(say='Antes de pagar,', show='Antes de pagar,', p=0.08),
   dict(say='compará.', show='*compará.*', p=0.5, ph=2, r=-6),
   dict(say='Mirá tres cosas.', show='Mirá *tres cosas:*', p=0.3),
   dict(say='Uno: qué plan tenés hoy.', show='Qué plan *tenés hoy.*', p=0.35, item=1),
   dict(say='Dos: qué usás de verdad.', show='Qué usás *de verdad.*', p=0.35, item=2),
   dict(say='Tres: qué opciones hay para tu edad y tu zona.', show='Qué opciones hay para *tu edad y tu zona.*', p=0.55, item=3),
   dict(say='Comentá «comparar», y te respondemos.', show='Comentá *COMPARAR*', p=0.2, cta=1, r=-3)]),
 'autos': dict(tail=2.4, voz='es-AR-TomasNeural', rate=4, pitch=0, palabra='LLAVE', serie='El ticket del 0 km', frases=[
   dict(say='¿Viste el precio de lista?', show='¿Viste el *precio de lista?*', p=0.2, ph=2, hook=1),
   dict(say='No es el precio final.', show='*No es* el precio final.', p=0.45, r=-4),
   dict(say='En general, se suman:', show='En general, *se suman:*', p=0.25),
   dict(say='flete,', show='Flete', p=0.42, item=1),
   dict(say='formularios y patentamiento,', show='Formularios y *patentamiento*', p=0.42, item=2),
   dict(say='sellos,', show='Sellos', p=0.42, item=3),
   dict(say='y seguro.', show='y *seguro.*', p=0.55, item=4),
   dict(say='Pedí siempre el precio llave en mano:', show='Pedí siempre el precio *llave en mano:*', p=0.2),
   dict(say='todo lo que pagás hasta que te llevás el auto.', show='todo lo que pagás *hasta que te llevás el auto.*', p=0.55, r=-2),
   dict(say='Comentá «llave», y te respondemos.', show='Comentá *LLAVE*', p=0.2, cta=1, r=-3)]),
 'mkt': dict(voz='es-AR-ElenaNeural', rate=4, pitch=0, palabra='ORDEN', serie='El celular que no para', frases=[
   dict(say='Cuarenta y siete chats sin responder.', show='*47* chats sin responder.', p=0.35, hook=1),
   dict(say='Y cada uno que espera, se enfría.', show='Y cada uno que espera, *se enfría.*', p=0.45, r=-3),
   dict(say='Tu WhatsApp no es un CRM.', show='Tu WhatsApp *no es un CRM.*', p=0.2),
   dict(say='Pero lo podés ordenar hoy.', show='Pero lo podés *ordenar hoy.*', p=0.45, ph=1),
   dict(say='Tres arreglos.', show='*Tres arreglos:*', p=0.3),
   dict(say='Uno: etiquetá cada chat por etapa.', show='Etiquetá cada chat *por etapa.*', p=0.35, item=1),
   dict(say='Dos: armá respuestas rápidas.', show='Armá *respuestas rápidas.*', p=0.35, item=2),
   dict(say='Tres: agendá cada seguimiento.', show='Agendá cada *seguimiento.*', p=0.55, item=3),
   dict(say='Comentá «orden», y te mostramos cómo.', show='Comentá *ORDEN*', p=0.2, cta=1, r=-3)]),
}
