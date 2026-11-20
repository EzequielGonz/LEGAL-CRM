# Reels del 20/11/2026 a las 08:50 (las 4 marcas). Ids: autos-usado-valor-a, cob-mono-aporte-a, mkt-bf-200-a, vita-trayecto-casa-a.
# Misma estructura de frases que el reel base de cada marca (así las tomas, los planos irreales y el sonido caen en su lugar).
VOCES = {
 'lucia': ('piper', 'es_AR-daniela-high', .98, 0),   # monotributista de Caballito (Coberturas)
 'romina': ('piper', 'es_AR-daniela-high', .95, 0),  # dueña de Dulce Almagro (Kocos)
}
R = {
 'autos-usado-valor-a': dict(palabra='USADO', serie='El ticket del 0 km', nar='nar_m', cfg=dict(hook='Usado:<br><em>así vale más</em>'), frases=[
   dict(q='juli', say='¿Y los papeles del service, Mati?', show='¿Y los papeles del service, Mati?', p=.3, marca='etiqueta'),
   dict(q='nar', say='Vas a entregar tu usado para el cero kilómetro.', show='Vas a entregar *tu usado* para el 0 km.', p=.35),
   dict(q='nar', say='Antes de tasarlo, ordená tres cosas:', show='Antes de tasarlo, *ordená tres cosas:*', p=.25, marca='impresora'),
   dict(q='nar', say='el service al día, con comprobantes,', show='El *service al día,* con comprobantes', p=.38, item=1),
   dict(q='nar', say='los papeles en orden,', show='Los papeles *en orden*', p=.38, item=2),
   dict(q='nar', say='y los detalles chicos, arreglados.', show='Los detalles chicos, *arreglados.*', p=.45, item=3),
   dict(q='nar', say='Así, tu usado puede valer más,', show='Así, tu usado *puede valer más,*', p=.15, marca='total'),
   dict(q='nar', say='y llegás mejor parado al cero kilómetro.', show='y llegás *mejor parado al 0 km.*', p=.4, marca='llave'),
   dict(q='juli', say='¡Mati, buscá la carpeta!', show='¡Mati, buscá la carpeta!', p=.3, marca='alivio'),
   dict(q='nar', say='Comentá «usado», y te respondemos.', show='Comentá *USADO*', p=.2, cta=1, r=-3)]),
 'cob-mono-aporte-a': dict(palabra='MONO', serie='Tu recibo explicado', nar='nar_f', cfg=dict(hook='Monotributo:<br><em>ya pagás obra social</em>', pj='lucia', q='lucia'), frases=[
   dict(q='lucia', say='¿Obra social? ¿Ya la estoy pagando?', show='¿Obra social? ¿Ya la estoy pagando?', p=.35, marca='notif'),
   dict(q='nar', say='Pagás el monotributo, y una parte de la cuota ya va a una obra social.', show='Pagás el monotributo y una parte *ya va a una obra social.*', p=.35, marca='carta'),
   dict(q='nar', say='Antes de pagar otra cobertura,', show='Antes de pagar otra cobertura,', p=.08),
   dict(q='nar', say='fijate.', show='*fijate.*', p=.5, r=-6, marca='lupa'),
   dict(q='nar', say='Mirá tres cosas.', show='Mirá *tres cosas:*', p=.25),
   dict(q='nar', say='Uno: qué obra social tenés elegida.', show='Qué obra social *tenés elegida.*', p=.3, item=1),
   dict(q='nar', say='Dos: qué cartilla te da en tu zona.', show='Qué cartilla te da *en tu zona.*', p=.3, item=2),
   dict(q='nar', say='Tres: si te conviene cambiarla por otra.', show='Si te conviene *cambiarla por otra.*', p=.4, item=3),
   dict(q='lucia', say='Mirá vos, ya tenía obra social.', show='Mirá vos, ya tenía obra social.', p=.3, marca='alivio'),
   dict(q='nar', say='Comentá «mono», y te respondemos.', show='Comentá *MONO*', p=.2, cta=1, r=-3)]),
 'mkt-bf-200-a': dict(palabra='ORDEN', serie='El celular que no para', nar='nar_f', cfg=dict(hook='Black Friday:<br><em>200</em> mensajes sin responder', pj='romina', q='romina'), frases=[
   dict(q='romina', say='¡Doscientos mensajes, y yo con la torta!', show='¡Doscientos mensajes, y yo con la torta!', p=.25, marca='pings'),
   dict(q='nar', say='Black Friday: doscientos mensajes sin responder.', show='Black Friday: *200* mensajes sin responder.', p=.25),
   dict(q='nar', say='Y cada cliente que espera, le compra a otro.', show='Y cada cliente que espera *le compra a otro.*', p=.4, marca='frio'),
   dict(q='nar', say='No te faltan horas.', show='No te faltan *horas.*', p=.2),
   dict(q='nar', say='Te falta orden.', show='Te falta *orden.*', p=.4, marca='giro'),
   dict(q='nar', say='Antes del Black Friday, tres arreglos.', show='Antes del Black Friday, *tres arreglos:*', p=.25),
   dict(q='nar', say='Uno: etiquetá cada chat: consulta, pedido o pagado.', show='Etiquetá cada chat: *consulta, pedido o pagado.*', p=.3, item=1),
   dict(q='nar', say='Dos: armá respuestas rápidas con precios y horarios.', show='Respuestas rápidas con *precios y horarios.*', p=.3, item=2),
   dict(q='nar', say='Tres: agendá el seguimiento de cada pedido.', show='Agendá el seguimiento *de cada pedido.*', p=.4, item=3),
   dict(q='romina', say='Ahora sí: torta y ventas.', show='Ahora sí: torta y ventas.', p=.3, marca='alivio'),
   dict(q='nar', say='Comentá «orden», y te mostramos cómo.', show='Comentá *ORDEN*', p=.2, cta=1, r=-3)]),
 'vita-trayecto-casa-a': dict(palabra='TRAYECTO', serie='El minuto después', nar='nar_f', cfg=dict(hook='Trayecto:<br>ibas a trabajar<br><em>y te chocaron</em>', doc='Aviso de accidente', sello='AVISÁ', cal=['MAÑANA', 'HOY'],
     notif=dict(hora='7:40', app='Trabajo · Encargado', titulo='¿Llegás?', texto='Entrás a las 8. Avisame cualquier cosa.', color='#5b6b8c')), frases=[
   dict(q='nico', say='Bueno… fue solo un choque.', show='Bueno… fue solo un choque.', p=.35, marca='notif'),
   dict(q='nar', say='Ibas a trabajar, y un auto te chocó la moto.', show='Ibas a trabajar y un auto *te chocó la moto.*', p=.35),
   dict(q='nar', say='Si ibas de tu casa al trabajo…', show='Si ibas de tu casa *al trabajo…*', p=.15, marca='lapicera'),
   dict(q='nar', say='puede ser accidente laboral.', show='puede ser *accidente laboral.*', p=.55, r=-6, marca='sello'),
   dict(q='nar', say='Se llama accidente in itínere, y lo puede cubrir la ART.', show='Se llama *accidente in itinere,* y lo puede cubrir la ART.', p=.25),
   dict(q='nar', say='Y si el dolor aparece días después, no lo dejes pasar.', show='Y si el dolor aparece días después, *no lo dejes pasar.*', p=.45, marca='dolor'),
   dict(q='nar', say='Hacé tres cosas.', show='Hacé *tres cosas:*', p=.25),
   dict(q='nar', say='Uno: avisá a tu trabajo, por escrito.', show='Avisá a tu trabajo, *por escrito.*', p=.3, item=1),
   dict(q='nar', say='Dos: pedí la denuncia a la ART, hoy, no mañana.', show='Pedí la denuncia a la ART, *hoy, no mañana.*', p=.3, item=2),
   dict(q='nar', say='Tres: consultá con un abogado.', show='Consultá *con un abogado.*', p=.4, item=3),
   dict(q='nico', say='Entonces no era solo un choque.', show='Entonces no era solo un choque.', p=.3, marca='alivio'),
   dict(q='nar', say='Comentá «trayecto», y te respondemos.', show='Comentá *TRAYECTO*', p=.2, cta=1, r=-3)]),
}
