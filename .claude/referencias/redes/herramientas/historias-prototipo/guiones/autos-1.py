# Guiones de Autos (Automotores Kocos) · tramo autos-1 · reels del 20/11 16:30 al 24/11 20:50 (cronograma x2).
# Afirmaciones generales y prudentes, sin precios ni números. Historias en historias/<id>.js (usan historias/autos-kit.js).
VOCES = {
 'mati': ('edge', 'es-AR-TomasNeural', 6, 7),
 'leo': ('edge', 'es-AR-TomasNeural', -4, -5),
}
def g(palabra, serie, frases): return dict(palabra=palabra, serie=serie, nar='nar_m', frases=frases)
def cta(p): return dict(q='nar', say=f'Comentá «{p.lower()}», y te respondemos.', show=f'Comentá *{p}*', p=.2, cta=1, r=-3)
R = {
 'autos-documentacion-b': g('RETIRO', 'La carpeta del 0 km', [
   dict(q='juli', say='¿Y qué papeles me llevo?', show='¿Y qué papeles me llevo?', p=.3, marca='notif'),
   dict(q='nar', say='El día que retirás tu cero kilómetro, la carpeta importa tanto como la llave.', show='Retirás tu 0 km: la carpeta importa *tanto como la llave.*', p=.3),
   dict(q='nar', say='Revisala antes de irte.', show='*Revisala* antes de irte.', p=.45, r=-6),
   dict(q='nar', say='Que no falte ninguno de estos tres.', show='Que no falte *ninguno de estos tres:*', p=.25, marca='giro'),
   dict(q='nar', say='Uno: la factura y el título, a tu nombre.', show='Factura y título *a tu nombre.*', p=.3, item=1),
   dict(q='nar', say='Dos: la cédula y la póliza del seguro.', show='Cédula y *póliza del seguro.*', p=.3, item=2),
   dict(q='nar', say='Tres: el manual y la garantía.', show='Manual y *garantía.*', p=.4, item=3),
   dict(q='juli', say='¡Carpeta completa!', show='¡Carpeta completa!', p=.3, marca='alivio'),
   cta('RETIRO')]),
 'autos-ruta-b': g('RETIRO', 'Primera ruta con el 0 km', [
   dict(q='mati', say='¿Cargamos todo y salimos?', show='¿Cargamos todo y salimos?', p=.3, marca='notif'),
   dict(q='nar', say='Primer viaje largo con el cero kilómetro, y el baúl ya está lleno.', show='Primer viaje largo con el 0 km y el baúl *ya está lleno.*', p=.3),
   dict(q='nar', say='Pará un minuto.', show='*Pará un minuto.*', p=.45, r=-6),
   dict(q='nar', say='Cuenta regresiva, antes de salir.', show='Cuenta regresiva *antes de salir:*', p=.25, marca='giro'),
   dict(q='nar', say='Tres: la presión de las cubiertas, con el auxilio.', show='Presión de cubiertas, *con el auxilio.*', p=.3, item=3),
   dict(q='nar', say='Dos: las luces y los niveles.', show='Luces y *niveles.*', p=.3, item=2),
   dict(q='nar', say='Uno: los papeles y la póliza, en la guantera.', show='Papeles y póliza, *en la guantera.*', p=.4, item=1),
   dict(q='juli', say='¡Ahora sí, a la costa!', show='¡Ahora sí, a la costa!', p=.3, marca='alivio'),
   cta('RETIRO')]),
 'autos-plan-cuota-a': g('PLAN', 'Plan de ahorro: la cuota', [
   dict(q='mati', say='¿Otra vez subió la cuota?', show='¿Otra vez subió la cuota?', p=.3, marca='notif'),
   dict(q='nar', say='A tu hermano le llegó la cuota del plan, y es más alta que la anterior.', show='La cuota del plan de tu hermano *subió otra vez.*', p=.3),
   dict(q='nar', say='No es magia.', show='*No es magia.*', p=.45, r=-6),
   dict(q='nar', say='En general, pasa por tres cosas.', show='En general, pasa por *tres cosas:*', p=.25, marca='giro'),
   dict(q='nar', say='Uno: la cuota sigue el valor del modelo. Si sube el auto, sube la cuota.', show='Sigue el valor del modelo: *si sube el auto, sube la cuota.*', p=.3, item=1),
   dict(q='nar', say='Dos: se suman gastos de administración y seguros.', show='Se suman *administración y seguros.*', p=.3, item=2),
   dict(q='nar', say='Tres: leé el resumen. Cada renglón explica una parte.', show='Leé el resumen: *cada renglón explica una parte.*', p=.4, item=3),
   dict(q='mati', say='Ahora sí lo entiendo.', show='Ahora sí lo entiendo.', p=.3, marca='alivio'),
   cta('PLAN')]),
}

# ---------- 21/11 ----------
def it(n, say, show, p=.3): return dict(q='nar', say=say, show=show, p=p, item=n)
def n(say, show, p=.3, **k): return dict(q='nar', say=say, show=show, p=p, **k)
def pj(q, say, p=.3, **k): return dict(q=q, say=say, show=say, p=p, **k)
R.update({
 'autos-lista-a': g('LLAVE', 'Precio de lista', [
   pj('juli', '¿Y ese es el precio final?', marca='notif'),
   n('El precio de lista de un cero kilómetro, en general, no es lo que terminás pagando.', 'El precio de lista *no es lo que terminás pagando.*'),
   n('¿Por qué?', '*¿Por qué?*', .45, r=-6),
   n('Porque se suman cosas. Las más comunes:', 'Se suman cosas. *Las más comunes:*', .25, marca='giro'),
   it(1, 'Uno: el flete.', 'El *flete.*'), it(2, 'Dos: formularios y patentamiento.', 'Formularios y *patentamiento.*'), it(3, 'Tres: los sellos.', 'Los *sellos.*', .35),
   n('Pedí siempre el precio llave en mano.', 'Pedí siempre el precio *llave en mano.*', .35, marca='total'),
   pj('juli', '¡Ahora sí!', marca='alivio'), cta('LLAVE')]),
 'autos-gastos-fijos-b': g('CUOTA', 'Gastos fijos del 0 km', [
   pj('juli', '¿Solo la cuota? No me cierra.', marca='notif'),
   n('Calculaste la cuota del cero kilómetro, pero el auto tiene más gastos fijos.', 'Calculaste la cuota, pero el 0 km *tiene más gastos fijos.*'),
   n('Hacé la cuenta completa.', 'Hacé la cuenta *completa.*', .45, r=-6),
   n('A la cuota, sumale:', 'A la cuota, *sumale:*', .25, marca='giro'),
   it(1, 'Uno: el seguro, todos los meses.', 'El seguro, *todos los meses.*'), it(2, 'Dos: la patente.', 'La *patente.*'), it(3, 'Tres: la cochera, si la necesitás.', 'La cochera, *si la necesitás.*', .35),
   n('Si el total te cierra, el auto te cierra.', 'Si el total te cierra, *el auto te cierra.*', .35),
   pj('juli', 'Ahora sí, cuenta hecha.', marca='alivio'), cta('CUOTA')]),
 'autos-retiro-chasis-a': g('RETIRO', 'Retiro del 0 km', [
   pj('juli', '¿Firmo ya o reviso?', marca='notif'),
   n('Día del retiro: el cero kilómetro brilla, y la lapicera ya está en la mesa.', 'Día del retiro: el 0 km brilla *y la lapicera ya está en la mesa.*'),
   n('Antes de firmar, revisá.', 'Antes de firmar, *revisá.*', .45, r=-6),
   n('Con la linterna del celular, tres cosas.', 'Con la linterna del celular, *tres cosas:*', .25, marca='giro'),
   it(1, 'Uno: que el número de chasis y el de motor coincidan con los papeles.', 'Chasis y motor: *que coincidan con los papeles.*'),
   it(2, 'Dos: la chapa y la pintura, con buena luz.', 'Chapa y pintura, *con buena luz.*'),
   it(3, 'Tres: los accesorios y el kit que te prometieron.', 'Accesorios y el kit *que te prometieron.*', .4),
   pj('juli', 'Todo en orden. Ahora firmo.', marca='alivio'), cta('RETIRO')]),
 'autos-hibrido-b': g('0KM', 'Híbrido: preguntá antes', [
   pj('mati', '¡Es este! ¡El híbrido!', marca='notif'),
   n('Te enamoraste de un híbrido en el showroom.', 'Te enamoraste *de un híbrido.*'),
   n('Antes de firmar, preguntá.', 'Antes de firmar, *preguntá.*', .45, r=-6),
   n('Tres preguntas clave.', 'Tres preguntas *clave:*', .25, marca='giro'),
   it(1, 'Uno: ¿es híbrido común o enchufable? Cambia cómo lo usás.', '¿Común o enchufable? *Cambia cómo lo usás.*'),
   it(2, 'Dos: ¿qué garantía tiene la batería?', '¿Qué garantía *tiene la batería?*'),
   it(3, 'Tres: ¿dónde le hacen el service?', '¿Dónde le hacen *el service?*', .4),
   pj('juli', 'Ahora sí, preguntemos.', marca='alivio'),
   dict(q='nar', say='Comentá «cero ka eme», y te respondemos.', show='Comentá *0KM*', p=.2, cta=1, r=-3)]),
 'autos-sorteo-b-r1': g('SORTEO', 'Cuota 2: desconfiá', [
   pj('mati', '¿En la cuota dos lo tengo? ¡Buenísimo!', marca='notif'),
   n('Te dijeron que con el plan de ahorro te dan el auto en la cuota dos, seguro.', 'Te dijeron: «con el plan, *en la cuota 2 lo tenés».*'),
   n('Desconfiá.', '*Desconfiá.*', .45, r=-6),
   n('Así funciona, en general.', 'Así funciona, *en general:*', .25, marca='giro'),
   it(1, 'Uno: se adjudica por sorteo o por licitación.', 'Se adjudica por *sorteo o licitación.*'),
   it(2, 'Dos: nadie puede asegurarte en qué cuota sale.', 'Nadie puede asegurarte *en qué cuota sale.*'),
   it(3, 'Tres: si te prometen algo, pedilo por escrito.', 'Si te prometen algo, *pedilo por escrito.*', .4),
   pj('mati', 'Mejor pregunto bien.', marca='alivio'), cta('SORTEO')]),
 'autos-voto-anticipo-a': g('CUOTA', 'Anticipo o cuota', [
   pj('juli', '¿Ponemos todo de anticipo?', marca='notif'),
   n('Anticipo grande o cuota baja: la pregunta de siempre.', 'Anticipo grande o cuota baja: *¿cuál elegís?*'),
   n('Depende de vos.', 'Depende *de vos.*', .45, r=-6),
   n('Mirá estas tres cosas.', 'Mirá *estas tres cosas:*', .25, marca='giro'),
   it(1, 'Uno: tus ahorros, sin vaciarte.', 'Tus ahorros, *sin vaciarte.*'),
   it(2, 'Dos: la cuota que podés pagar, tranquilo, todos los meses.', 'La cuota que podés pagar *tranquilo.*'),
   it(3, 'Tres: un colchón para imprevistos.', 'Un colchón *para imprevistos.*', .4),
   pj('mati', 'Entonces, ni todo ni nada.', marca='alivio'), cta('CUOTA')]),
})
