# Reels del 20/11 a las 10:30 (cronograma x2): Autos B, Coberturas B, Kocos B y la remake R de VITA.
# Orden de escenas en los cuatro: pregunta → caso → pasos. Situaciones ilustrativas; sin números en Autos ni Coberturas.
VOCES = {
 'mati': ('edge', 'es-UY-MateoNeural', 6, 0),          # pareja de Juli (Autos)
 'vero': ('piper', 'es_AR-daniela-high', .98, 0),      # familia Ferreyra (Coberturas)
 'romina': ('piper', 'es_AR-daniela-high', .95, 0),    # pastelera de Almagro (Kocos)
 'gestor': ('edge', 'es-UY-MateoNeural', 4, -6),       # el que le acerca el papel a Nico (VITA)
}
R = {
 # Autos · «El ticket del 0 km» · variante B: la cocina de Villa Crespo, el aguinaldo y la cuota.
 'autos-aguinaldo-anticipo-b': dict(palabra='CUOTA', serie='El ticket del 0 km', nar='nar_m',
   cfg=dict(hook='El aguinaldo entero<br>al anticipo: <em>pensalo con la cuota</em>'), frases=[
   dict(q='mati', say='¿Y si ponemos todo el aguinaldo de anticipo?', show='¿Y si ponemos todo el aguinaldo de anticipo?', p=.3, marca='notif'),
   dict(q='nar', say='Suena bien. Pero el anticipo se paga una vez,', show='Suena bien. Pero el anticipo *se paga una vez,*', p=.12),
   dict(q='nar', say='y la cuota, todos los meses.', show='y la cuota, *todos los meses.*', p=.5, marca='auto'),
   dict(q='nar', say='Antes de decidir, tres pasos.', show='Antes de decidir, *tres pasos:*', p=.25, marca='impresora'),
   dict(q='nar', say='Uno: calculá la cuota que podés pagar sin ahogarte.', show='Calculá la cuota que *podés pagar sin ahogarte.*', p=.3, item=1),
   dict(q='nar', say='Dos: guardá una parte para gastos e imprevistos.', show='Guardá una parte para *gastos e imprevistos.*', p=.3, item=2),
   dict(q='nar', say='Tres: armá el anticipo alrededor de esa cuota.', show='Armá el anticipo *alrededor de esa cuota.*', p=.4, item=3),
   dict(q='juli', say='¡Entonces, primero la cuota!', show='¡Entonces, primero la cuota!', p=.3, marca='alivio'),
   dict(q='nar', say='Comentá «cuota», y te respondemos.', show='Comentá *CUOTA*', p=.2, cta=1, r=-3)]),
 # Coberturas · «La carta» · variante B: los Ferreyra cargan el auto en Villa Urquiza.
 'cob-cartilla-zona-b': dict(palabra='CARTILLA', serie='La carta', nar='nar_f',
   cfg=dict(hook='Te mudás o te vas de viaje:<br><em>¿qué te cubre allá?</em>'), frases=[
   dict(q='vero', say='¿Y si allá nos enfermamos?', show='¿Y si allá nos enfermamos?', p=.3, marca='notif'),
   dict(q='nar', say='Te vas de viaje o te mudás, y tu plan puede cubrir distinto en otra zona.', show='Te vas o te mudás: tu plan puede *cubrir distinto en otra zona.*', p=.3),
   dict(q='nar', say='Antes de salir,', show='Antes de salir,', p=.08),
   dict(q='nar', say='fijate.', show='*fijate.*', p=.5, r=-6, marca='lupa'),
   dict(q='nar', say='Revisá tres cosas.', show='Revisá *tres cosas:*', p=.3, marca='escalera'),
   dict(q='nar', say='Uno: qué prestadores tenés en la zona a la que vas.', show='Qué prestadores tenés *en la zona a la que vas.*', p=.3, item=1),
   dict(q='nar', say='Dos: cómo se pide una urgencia lejos de casa.', show='Cómo se pide una urgencia *lejos de casa.*', p=.3, item=2),
   dict(q='nar', say='Tres: si te mudás, qué cartilla te corresponde allá.', show='Si te mudás, qué cartilla *te corresponde allá.*', p=.4, item=3),
   dict(q='vero', say='Listo. ¡Ahora sí, vámonos!', show='Listo. ¡Ahora sí, vámonos!', p=.3, marca='alivio'),
   dict(q='nar', say='Comentá «cartilla», y te respondemos.', show='Comentá *CARTILLA*', p=.2, cta=1, r=-3)]),
 # Kocos Marketing · «El celular que no para» · variante B: la pastelería de Almagro un viernes de aguinaldo.
 'mkt-aguinaldo-ventas-b': dict(palabra='CRM', serie='El celular que no para', nar='nar_f',
   cfg=dict(hook='Viernes de aguinaldo:<br>llueven consultas.<br><em>¿Quién contesta?</em>'), frases=[
   dict(q='romina', say='¿Y ahora quién contesta todo esto?', show='¿Y ahora quién contesta todo esto?', p=.25, marca='pings'),
   dict(q='nar', say='Viernes de aguinaldo: llueven pedidos de tortas para las fiestas.', show='Viernes de aguinaldo: *llueven pedidos.*', p=.3),
   dict(q='nar', say='Y el que no recibe respuesta, compra en otro lado.', show='Y el que no recibe respuesta *compra en otro lado.*', p=.45, marca='derrite'),
   dict(q='nar', say='Un ce erre eme simple te ayuda a contestar a tiempo.', show='Un *CRM simple* te ayuda a contestar a tiempo.', p=.4, marca='giro'),
   dict(q='nar', say='Tres cosas.', show='*Tres cosas:*', p=.25),
   dict(q='nar', say='Uno: cada consulta entra a una lista.', show='Cada consulta entra *a una lista.*', p=.3, item=1),
   dict(q='nar', say='Dos: respuestas listas para precios y plazos.', show='Respuestas listas para *precios y plazos.*', p=.3, item=2),
   dict(q='nar', say='Tres: un aviso para seguir a quien no confirmó.', show='Un aviso para seguir *a quien no confirmó.*', p=.4, item=3),
   dict(q='romina', say='¡Ahora sí, a hornear!', show='¡Ahora sí, a hornear!', p=.3, marca='alivio'),
   dict(q='nar', say='Comentá «ce erre eme», y te mostramos cómo.', show='Comentá *CRM*', p=.2, cta=1, r=-3)]),
 # VITA · «Antes de firmar» · remake R de «vita-firmas»: el bar de Nueva Pompeya, la cerradura y el escritorio de la narradora.
 'vita-firmas-r1': dict(palabra='FIRMA', serie='Antes de firmar', nar='nar_f',
   cfg=dict(hook='Te ofrecen plata hoy<br>si firmás hoy: <em>frená</em>'), frases=[
   dict(q='gestor', say='Firmá hoy y cobrás hoy.', show='Firmá hoy y cobrás hoy.', p=.25, marca='desliza'),
   dict(q='nico', say='¿Y si lo pienso?', show='¿Y si lo pienso?', p=.3),
   dict(q='nar', say='Te ofrecen plata hoy, si firmás hoy.', show='Te ofrecen plata hoy, *si firmás hoy.*', p=.15),
   dict(q='nar', say='Frená.', show='*Frená.*', p=.55, r=-8, marca='cerradura'),
   dict(q='nar', say='Lo que firmás puede cerrar tu reclamo.', show='Lo que firmás puede *cerrar tu reclamo.*', p=.3, marca='sello'),
   dict(q='nar', say='Y si después aparece una lesión, puede que ya no puedas reclamar.', show='Si después aparece una lesión, *puede que ya no puedas reclamar.*', p=.45, marca='dolor'),
   dict(q='nar', say='Hacé esto.', show='*Hacé esto:*', p=.25),
   dict(q='nar', say='Uno: llevate la propuesta por escrito.', show='Llevate la propuesta *por escrito.*', p=.3, item=1),
   dict(q='nar', say='Dos: no firmes en el momento.', show='No firmes *en el momento.*', p=.3, item=2),
   dict(q='nar', say='Tres: mostrásela a un abogado antes de firmar.', show='Mostrásela a un abogado *antes de firmar.*', p=.4, item=3),
   dict(q='nico', say='Me la llevo y la consulto.', show='Me la llevo y la consulto.', p=.3, marca='alivio'),
   dict(q='nar', say='Comentá «firma», y te respondemos.', show='Comentá *FIRMA*', p=.2, cta=1, r=-3)]),
}
