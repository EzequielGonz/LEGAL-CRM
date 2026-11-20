# Prototipo v3: mini historias con personajes en Buenos Aires (situaciones ilustrativas).
# Las afirmaciones son las ya escritas para revisión (guiones.py / palabras-clave-bot.md); los personajes dicen frases cotidianas.
# quien: 'nar' (narración, edge-tts es-AR) o el id del personaje; voz por personaje en VOCES.
# say = lo que se lee; show = subtítulo (*acento*); p = pausa después; item = punto de la lista; marca = evento visual con nombre.
VOCES = {
 'nar_f': ('edge', 'es-AR-ElenaNeural', 0, 0), 'nar_m': ('edge', 'es-AR-TomasNeural', 0, -2),
 'nico': ('edge', 'es-AR-TomasNeural', 8, 3),        # trabajador de barrio (VITA)
 'caro': ('piper', 'es_AR-daniela-high', 1.0, 0),     # monotributista (Coberturas)
 'juli': ('piper', 'es_AR-daniela-high', .97, 0),    # pareja que compra su primer 0 km (Autos)
 'laura': ('piper', 'es_AR-daniela-high', .95, 0),   # dueña de un local (Kocos)
}
R = {
 'vita': dict(palabra='FIRMA', serie='Antes de firmar', nar='nar_f', frases=[
   dict(q='nico', say='¿Y ahora qué firmo?', show='¿Y ahora qué firmo?', p=.35, marca='notif'),
   dict(q='nar', say='Te chocaron, y el seguro del otro te ofrece un acuerdo rápido.', show='Te chocaron y el seguro del otro te ofrece un *acuerdo rápido.*', p=.35),
   dict(q='nar', say='Antes de firmar…', show='Antes de firmar…', p=.15, marca='lapicera'),
   dict(q='nar', say='esperá.', show='*esperá.*', p=.55, r=-8, marca='sello'),
   dict(q='nar', say='Lo que firmás puede cerrar tu reclamo.', show='Lo que firmás puede *cerrar tu reclamo.*', p=.25),
   dict(q='nar', say='Si después aparece una lesión, quizás ya no puedas pedir más.', show='Si después aparece una lesión, quizás *ya no puedas pedir más.*', p=.45, marca='dolor'),
   dict(q='nar', say='Antes de firmar, tres cosas.', show='Antes de firmar, *tres cosas:*', p=.25),
   dict(q='nar', say='Uno: pedí la propuesta por escrito.', show='Pedí la propuesta *por escrito.*', p=.3, item=1),
   dict(q='nar', say='Dos: no firmes el mismo día.', show='No firmes *el mismo día.*', p=.3, item=2),
   dict(q='nar', say='Tres: consultá antes con un abogado.', show='Consultá antes *con un abogado.*', p=.4, item=3),
   dict(q='nico', say='Menos mal que no firmé.', show='Menos mal que no firmé.', p=.3, marca='alivio'),
   dict(q='nar', say='Comentá «firma», y te respondemos.', show='Comentá *FIRMA*', p=.2, cta=1, r=-3)]),
 'cob': dict(palabra='COMPARAR', serie='La carta', nar='nar_f', frases=[
   dict(q='caro', say='¿Otra vez aumentó?', show='¿Otra vez aumentó?', p=.35, marca='notif'),
   dict(q='nar', say='Llegó el aviso de la prepaga: la cuota se actualiza este mes.', show='Llegó el aviso: la cuota *se actualiza este mes.*', p=.35, marca='carta'),
   dict(q='nar', say='Antes de pagar,', show='Antes de pagar,', p=.08),
   dict(q='nar', say='compará.', show='*compará.*', p=.5, r=-6, marca='lupa'),
   dict(q='nar', say='Mirá tres cosas.', show='Mirá *tres cosas:*', p=.25),
   dict(q='nar', say='Uno: qué plan tenés hoy.', show='Qué plan *tenés hoy.*', p=.3, item=1),
   dict(q='nar', say='Dos: qué usás de verdad.', show='Qué usás *de verdad.*', p=.3, item=2),
   dict(q='nar', say='Tres: qué opciones hay para tu edad y tu zona.', show='Qué opciones hay para *tu edad y tu zona.*', p=.4, item=3),
   dict(q='caro', say='Bueno, ahora sí comparo.', show='Bueno, ahora sí comparo.', p=.3, marca='alivio'),
   dict(q='nar', say='Comentá «comparar», y te respondemos.', show='Comentá *COMPARAR*', p=.2, cta=1, r=-3)]),
 'autos': dict(palabra='LLAVE', serie='El ticket del 0 km', nar='nar_m', frases=[
   dict(q='juli', say='¿Y ese es el precio final?', show='¿Y ese es el precio final?', p=.3, marca='etiqueta'),
   dict(q='nar', say='El precio de lista no es el precio final.', show='El precio de lista *no es el precio final.*', p=.35),
   dict(q='nar', say='En general, se suman:', show='En general, *se suman:*', p=.2, marca='impresora'),
   dict(q='nar', say='flete,', show='Flete', p=.38, item=1),
   dict(q='nar', say='formularios y patentamiento,', show='Formularios y *patentamiento*', p=.38, item=2),
   dict(q='nar', say='sellos,', show='Sellos', p=.38, item=3),
   dict(q='nar', say='y seguro.', show='y *seguro.*', p=.45, item=4),
   dict(q='nar', say='Pedí siempre el precio llave en mano:', show='Pedí siempre el precio *llave en mano:*', p=.15, marca='total'),
   dict(q='nar', say='todo lo que pagás hasta que te llevás el auto.', show='todo lo que pagás *hasta que te llevás el auto.*', p=.4, marca='llave'),
   dict(q='juli', say='¡Ahora sí!', show='¡Ahora sí!', p=.3, marca='alivio'),
   dict(q='nar', say='Comentá «llave», y te respondemos.', show='Comentá *LLAVE*', p=.2, cta=1, r=-3)]),
 'mkt': dict(palabra='ORDEN', serie='El celular que no para', nar='nar_f', frases=[
   dict(q='laura', say='¡No doy más con el celular!', show='¡No doy más con el celular!', p=.25, marca='pings'),
   dict(q='nar', say='Cuarenta y siete chats sin responder.', show='*47* chats sin responder.', p=.25),
   dict(q='nar', say='Y cada uno que espera, se enfría.', show='Y cada uno que espera, *se enfría.*', p=.4, marca='frio'),
   dict(q='nar', say='Tu WhatsApp no es un CRM.', show='Tu WhatsApp *no es un CRM.*', p=.2),
   dict(q='nar', say='Pero lo podés ordenar hoy.', show='Pero lo podés *ordenar hoy.*', p=.4, marca='giro'),
   dict(q='nar', say='Tres arreglos.', show='*Tres arreglos:*', p=.25),
   dict(q='nar', say='Uno: etiquetá cada chat por etapa.', show='Etiquetá cada chat *por etapa.*', p=.3, item=1),
   dict(q='nar', say='Dos: armá respuestas rápidas.', show='Armá *respuestas rápidas.*', p=.3, item=2),
   dict(q='nar', say='Tres: agendá cada seguimiento.', show='Agendá cada *seguimiento.*', p=.4, item=3),
   dict(q='laura', say='Ahora sí, a vender.', show='Ahora sí, a vender.', p=.3, marca='alivio'),
   dict(q='nar', say='Comentá «orden», y te mostramos cómo.', show='Comentá *ORDEN*', p=.2, cta=1, r=-3)]),
}

# Variante B de VITA: mismo guion y palabra; cambia el gancho, la primera frase y la apertura (adelanto de la caída).
import copy as _copy
R['vita-b'] = _copy.deepcopy(R['vita'])
R['vita-b']['frases'][0] = dict(q='nico', say='¿Firmo ya, o espero?', show='¿Firmo ya, o espero?', p=.35, marca='notif')
R['vita-b']['frases'][1] = dict(q='nar', say='El seguro del otro te llama y te ofrece plata rápido, hoy.', show='El seguro del otro te ofrece *plata rápido, hoy.*', p=.35)
