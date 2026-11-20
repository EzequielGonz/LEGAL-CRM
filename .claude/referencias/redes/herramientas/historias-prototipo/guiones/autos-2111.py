# Autos · reels del cronograma x2 (21/11 en adelante). Historias en historias/autos-<id>.js sobre historias/autos-kit.js.
# Convención: frases[0] = conflicto del segundo 1; frases[2] lleva marca='giro' (golpe del plano irreal); marca='obj' abre el objeto;
# item=1..3 los puntos; marca='alivio'; cta=1 el cierre. Sin precios ni números reales. Situaciones ilustrativas.
VOCES = {
 'mati': ('edge', 'es-UY-MateoNeural', 6, 0),        # pareja de Juli
 'leo': ('edge', 'es-AR-TomasNeural', 4, -7),        # Leo, vendedor de Automotores Kocos
 'tano': ('edge', 'es-UY-MateoNeural', 14, -5),      # el Tano, conocido de Mati en el taller
}
def n(say, show, p=.3, **k): return dict(q='nar', say=say, show=show, p=p, **k)
def q(quien, say, p=.3, **k): return dict(q=quien, say=say, show=say, p=p, **k)
def cta(pal, say=None): return dict(q='nar', say=f'Comentá «{say or pal.lower()}», y te respondemos.', show=f'Comentá *{pal}*', p=.2, cta=1, r=-3)

R = {
 # 21/11 08:50 · «El ticket del 0 km» · lista A · showroom, Leo imprime lo que se suma; giro: la pantalla partida se rompe como un vidrio.
 'autos-lista-a': dict(palabra='LLAVE', serie='El ticket del 0 km', nar='nar_m',
   cfg=dict(hook='0 km: el precio de lista<br><em>no es el final</em>'), frases=[
   q('juli', '¿Este es el precio que pago?', .3),
   n('Lo que ves en el cartel es el precio de lista.', 'Lo que ves en el cartel es *el precio de lista.*', .25),
   n('Y no es el precio final.', 'Y *no es el precio final.*', .5, marca='giro', r=-4),
   q('leo', 'Te imprimo lo que se suma.', .25, marca='obj'),
   n('Uno: el flete.', 'El *flete.*', .3, item=1),
   n('Dos: formularios y patentamiento.', 'Formularios y *patentamiento.*', .3, item=2),
   n('Tres: sellos y seguro.', 'Sellos y *seguro.*', .3, item=3),
   n('Todo junto: el precio llave en mano.', 'Todo junto: el precio *llave en mano.*', .4),
   q('juli', '¡Ahora sí sé lo que pago!', .3, marca='alivio'),
   cta('LLAVE')]),
 # 21/11 10:30 · gastos-fijos B · cocina de Villa Crespo, abre en el final; giro: la llave gigante y el túnel del llavero; primer plano: la libreta de Juli.
 'autos-gastos-fijos-b': dict(palabra='CUOTA', serie='El ticket del 0 km', nar='nar_m',
   cfg=dict(hook='Cuota más seguro, patente y cochera:<br><em>hacé la cuenta completa</em>'), frases=[
   q('juli', 'La cuota la pago. ¿Y lo demás?', .3),
   n('El 0 km no termina en la cuota.', 'El 0 km *no termina en la cuota.*', .25),
   n('Atrás de la llave vienen los gastos fijos.', 'Atrás de la llave vienen *los gastos fijos.*', .45, marca='giro'),
   n('Anotá tres, antes de decidir.', 'Anotá *tres*, antes de decidir:', .25, marca='obj'),
   n('Uno: el seguro, todos los meses.', 'El seguro, *todos los meses.*', .3, item=1),
   n('Dos: la patente.', 'La *patente.*', .3, item=2),
   n('Tres: la cochera, si no tenés lugar.', 'La cochera, *si no tenés lugar.*', .4, item=3),
   n('¿La cuota, más todo eso, te entra en el mes?', '¿La cuota más todo eso *te entra en el mes?*', .4),
   q('juli', 'Ahora sí: la cuenta completa.', .3, marca='alivio'),
   cta('CUOTA')]),
 # 21/11 13:50 · «Revisá esto al retirar» · retiro-chasis A · día del retiro; giro: el showroom se da vuelta; primer plano: el chasis con la linterna.
 'autos-retiro-chasis-a': dict(palabra='RETIRO', serie='Revisá esto al retirar', nar='nar_m',
   cfg=dict(hook='Retiro del 0 km:<br><em>revisá antes de firmar</em>'), frases=[
   q('juli', '¿Firmo acá y me lo llevo?', .3),
   n('Día del retiro: antes de firmar, revisá.', 'Día del retiro: *antes de firmar, revisá.*', .25),
   n('Una vez que firmaste, cualquier detalle cuesta más.', 'Una vez que firmaste, *cualquier detalle cuesta más.*', .45, marca='giro'),
   n('Prendé la linterna del celular. Tres controles.', 'Prendé la linterna. *Tres controles:*', .25, marca='obj'),
   n('Uno: que el número de chasis coincida con los papeles.', 'Que el chasis *coincida con los papeles.*', .3, item=1),
   n('Dos: que no tenga rayones ni golpes.', 'Que no tenga *rayones ni golpes.*', .3, item=2),
   n('Tres: manual, llave de repuesto y kit.', 'Manual, *llave de repuesto y kit.*', .4, item=3),
   q('juli', 'Todo en orden. ¡Ahora sí, firmo!', .3, marca='alivio'),
   cta('RETIRO')]),
 # 21/11 16:30 · hibrido B · primera persona en el showroom; giro: el auto sube en el elevador del taller y se ve por debajo; primer plano: la carpeta de papeles.
 'autos-hibrido-b': dict(palabra='0KM', serie='El ticket del 0 km', nar='nar_m',
   cfg=dict(hook='Te enamoraste de un híbrido:<br><em>preguntá esto antes</em>'), frases=[
   q('mati', '¡Mirá ese híbrido! Me enamoré.', .25),
   q('juli', 'Pará. ¿Qué le preguntamos antes?', .3),
   n('Un híbrido puede ser una gran opción, si sabés qué preguntar.', 'Un híbrido puede ser una gran opción, *si sabés qué preguntar.*', .4, marca='giro'),
   n('Antes de firmar, tres preguntas.', 'Antes de firmar, *tres preguntas:*', .25, marca='obj'),
   n('Uno: dónde y cómo se hace el service.', 'Dónde y cómo *se hace el service.*', .3, item=1),
   n('Dos: qué cubre la garantía de la batería.', 'Qué cubre la garantía *de la batería.*', .3, item=2),
   n('Tres: cuánto lo vas a usar en ciudad y en ruta.', 'Cuánto lo vas a usar *en ciudad y en ruta.*', .4, item=3),
   q('mati', 'Bueno: primero pregunto, después me enamoro.', .3, marca='alivio'),
   cta('0KM', 'cero kilómetro')]),
 # 21/11 19:20 · remake R de «autos-sorteo-b» · taller de Mati en Villa Crespo; giro: la pantalla partida se rompe; cámara cenital que baja.
 'autos-sorteo-b-r1': dict(palabra='SORTEO', serie='El ticket del 0 km', nar='nar_m',
   cfg=dict(hook='«Te lo damos en la cuota 2»:<br><em>desconfiá</em>'), frases=[
   q('tano', '¡En la cuota dos lo tenés, seguro!', .25),
   q('mati', '¿Seguro, seguro?', .3),
   n('Desconfiá de ese «seguro».', 'Desconfiá de *ese «seguro».*', .45, marca='giro', r=-4),
   n('En un plan de ahorro, el auto se adjudica por sorteo o por licitación.', 'En un plan, el auto se adjudica *por sorteo o por licitación.*', .3, marca='obj'),
   n('Uno: nadie te puede garantizar en qué cuota te toca.', 'Nadie te puede garantizar *en qué cuota te toca.*', .3, item=1),
   n('Dos: preguntá cómo funcionan el sorteo y la licitación.', 'Preguntá cómo funcionan *el sorteo y la licitación.*', .3, item=2),
   n('Tres: pedí todo por escrito antes de firmar.', 'Pedí todo *por escrito* antes de firmar.', .4, item=3),
   q('mati', 'Entonces, primero pregunto y después festejo.', .3, marca='alivio'),
   cta('SORTEO')]),
 # 21/11 20:50 · voto-anticipo A · cocina, la calculadora en la mesa; giro: la linterna proyecta un cartel de autopista; primer plano: la calculadora.
 'autos-voto-anticipo-a': dict(palabra='CUOTA', serie='El ticket del 0 km', nar='nar_m',
   cfg=dict(hook='Anticipo o cuota:<br><em>¿cuál elegís?</em>'), frases=[
   q('mati', '¡Pongamos un anticipo grande!', .25),
   q('juli', '¿Y si mejor buscamos una cuota baja?', .3),
   n('Antes de votar, mirá tu mes.', 'Antes de votar, *mirá tu mes.*', .45, marca='giro'),
   n('Hacé tres cuentas.', 'Hacé *tres cuentas:*', .25, marca='obj'),
   n('Uno: la cuota que podés pagar sin ahogarte.', 'La cuota que podés pagar *sin ahogarte.*', .3, item=1),
   n('Dos: lo que te queda para gastos e imprevistos.', 'Lo que te queda para *gastos e imprevistos.*', .3, item=2),
   n('Tres: con eso, armá el anticipo.', 'Con eso, *armá el anticipo.*', .4, item=3),
   n('¿Y vos? ¿Anticipo grande o cuota baja?', '¿Y vos? ¿Anticipo grande *o cuota baja?*', .35),
   q('juli', '¡Primero la cuota! Gané.', .3, marca='alivio'),
   cta('CUOTA')]),
}
