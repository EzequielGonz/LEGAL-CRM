# VITA · tramo de la sesión de reels de VITA (cronograma x2, desde el 20/11 19:20). Ids: vita-<idea>-<versión>.
# Misma estructura de 12 frases que el reel base de VITA (notif, lapicera, sello, dolor, 3 puntos, alivio, cta): así sonido.py vita() y las tomas caen en su lugar.
R = {
 # 20/11 19:20 · remake R de «vita-trayecto»: a tres cuadras del depósito; pasos en cuenta regresiva, cámara en mano y apertura con el sello.
 'vita-trayecto-r1': dict(palabra='TRAYECTO', serie='El minuto después', nar='nar_f',
   cfg=dict(hook='Trayecto:<br>a <em>3 cuadras</em><br>del trabajo', doc='Aviso de accidente', remite='Para: tu trabajo', firma='Firma del trabajador', sello='HOY', cal=['YA', 'HOY'],
            notif=dict(hora='7:52', app='Trabajo · Encargado', titulo='¿Dónde estás?', texto='Ya son casi las 8. ¿Llegás?', color='#5b6b8c'), ap='sello', cam='mano', grade='calido'), frases=[
   dict(q='nico', say='¡Pará, pará! Ya estaba llegando…', show='¡Pará, pará! Ya estaba llegando…', p=.35, marca='notif'),
   dict(q='nar', say='A tres cuadras del trabajo, un auto te toca la rueda de atrás.', show='A tres cuadras del trabajo, un auto *te toca la moto.*', p=.35),
   dict(q='nar', say='Ojo: si ibas al trabajo…', show='Ojo: si ibas *al trabajo…*', p=.15, marca='lapicera'),
   dict(q='nar', say='también es laboral.', show='también *es laboral.*', p=.55, r=-6, marca='sello'),
   dict(q='nar', say='Puede ser un accidente in itínere, y lo puede cubrir la ART.', show='Puede ser un *accidente in itinere,* y lo puede cubrir la ART.', p=.25),
   dict(q='nar', say='Aunque hoy no te duela nada, después puede aparecer.', show='Aunque hoy no te duela, *después puede aparecer.*', p=.45, marca='dolor'),
   dict(q='nar', say='Cuenta regresiva.', show='*Cuenta regresiva:*', p=.25),
   dict(q='nar', say='Tres: avisá a tu trabajo, por escrito.', show='Avisá a tu trabajo, *por escrito.*', p=.3, item=1),
   dict(q='nar', say='Dos: pedí que hagan la denuncia a la ART.', show='Pedí la denuncia *a la ART.*', p=.3, item=2),
   dict(q='nar', say='Uno: consultá con un abogado.', show='Consultá *con un abogado.*', p=.4, item=3),
   dict(q='nico', say='Ah, ¿entonces lo tengo que avisar?', show='Ah, ¿entonces lo tengo que avisar?', p=.3, marca='alivio'),
   dict(q='nar', say='Comentá «trayecto», y te respondemos.', show='Comentá *TRAYECTO*', p=.2, cta=1, r=-3)]),
 # 20/11 20:50 · «Las primeras 24 horas después de un choque» (A): Nico, de noche, recién chocado; el reloj corre y tiene que hacer bien tres cosas.
 'vita-choque-24h-a': dict(palabra='CHOQUE', serie='El minuto después', nar='nar_f',
   cfg=dict(hook='Choque:<br>lo que hacés<br><em>en 24 h</em> importa', doc='Denuncia del siniestro', remite='Para: tu aseguradora', firma='Firma del asegurado', sello='HOY', cal=['HOY', 'MAÑANA'],
            notif=dict(hora='22:47', app='Mensajes · Casa', titulo='¿Dónde estás?', texto='¿Estás bien? Avisame cuando llegues.', color='#5b6b8c'), grade='noche'), frases=[
   dict(q='nico', say='Uh… ¿y ahora qué hago?', show='Uh… ¿y ahora qué hago?', p=.35, marca='notif'),
   dict(q='nar', say='Acabás de chocar, de noche, y no sabés por dónde empezar.', show='Acabás de chocar, de noche, y *no sabés por dónde empezar.*', p=.35),
   dict(q='nar', say='Lo que hacés en las primeras horas…', show='Lo que hacés en las *primeras horas…*', p=.15, marca='lapicera'),
   dict(q='nar', say='importa.', show='*importa.*', p=.55, r=-8, marca='sello'),
   dict(q='nar', say='Con los nervios, es fácil olvidarse de algo clave.', show='Con los nervios, es fácil *olvidarse de algo clave.*', p=.25),
   dict(q='nar', say='Y si mañana te duele el cuello, eso también cuenta.', show='Y si mañana te duele el cuello, *eso también cuenta.*', p=.45, marca='dolor'),
   dict(q='nar', say='En las primeras veinticuatro horas, tres cosas.', show='En las primeras 24 horas, *tres cosas:*', p=.25),
   dict(q='nar', say='Uno: sacá fotos y anotá los datos del otro y de su seguro.', show='Fotos y *los datos del otro y de su seguro.*', p=.3, item=1),
   dict(q='nar', say='Dos: avisá a tu seguro cuanto antes.', show='Avisá a tu seguro *cuanto antes.*', p=.3, item=2),
   dict(q='nar', say='Tres: si algo te duele, andá a la guardia, y consultá con un abogado.', show='Si te duele, *guardia y abogado.*', p=.4, item=3),
   dict(q='nico', say='Bueno. Primero, las fotos.', show='Bueno. Primero, las fotos.', p=.3, marca='alivio'),
   dict(q='nar', say='Comentá «choque», y te respondemos.', show='Comentá *CHOQUE*', p=.2, cta=1, r=-3)]),
}
