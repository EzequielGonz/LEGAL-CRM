# VITA · tramo de la sesión de reels de VITA (cronograma x2, desde el 20/11 19:20). Ids: vita-<idea>-<versión>.
# Misma estructura de 12 frases que el reel base de VITA (notif, lapicera, sello, dolor, 3 puntos, alivio, cta): así sonido.py vita() y las tomas caen en su lugar.
R = {
 # 20/11 19:20 · remake R de «vita-trayecto»: a tres cuadras del depósito; pasos en cuenta regresiva, cámara en mano y apertura con el sello.
 'vita-trayecto-r1': dict(palabra='TRAYECTO', serie='El minuto después', nar='nar_f',
   cfg=dict(hook='Trayecto:<br>a <em>3 cuadras</em><br>del trabajo', doc='Aviso de accidente', remite='Para: tu trabajo', firma='Firma del trabajador', sello='HOY', cal=['YA', 'HOY'],
            notif=dict(hora='7:52', app='Trabajo · Encargado', titulo='¿Dónde estás?', texto='Ya son casi las 8. ¿Llegás?', color='#5b6b8c'), ap='sello', cam='mano', grade='calido', cuenta=1), frases=[
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

# ---------- 21/11 ----------
VOCES = {'sole': ('piper', 'es_AR-daniela-high', .97, 0)}   # Sole, repositora del súper de Flores (VITA)
D = dict
def _v(palabra, serie, cfg, fr):  # 12 frases: [pj notif, nar, nar lapicera, nar sello, nar, nar dolor, nar intro, item1, item2, item3, pj alivio, cta]
    q = fr[0][0]; m = ['notif', None, 'lapicera', 'sello', None, 'dolor', None, None, None, None, 'alivio', None]
    out = []
    for i, (who, say, show) in enumerate(fr):
        d = D(q=who, say=say, show=show, p=[.35, .35, .15, .55, .25, .45, .25, .3, .3, .4, .3, .2][i])
        if m[i]: d['marca'] = m[i]
        if i == 3: d['r'] = -7
        if 7 <= i <= 9: d['item'] = i - 6
        if i == 11: d.update(cta=1, r=-3)
        out.append(d)
    return D(palabra=palabra, serie=serie, nar='nar_f', cfg=cfg, frases=out)
N = 'nar'
R.update({
 'vita-nunca-frases-a': _v('NUNCA', 'El minuto después', D(hook='Choque:<br><em>nunca</em> digas esto', doc='Lo que dijiste en el choque', remite='Esquina de Sáenz y Perito Moreno', firma='Tu palabra', sello='ESPERÁ', cal=['HOY', 'MAÑANA'],
     notif=D(hora='19:42', app='Mensajes · Casa', titulo='¿Todo bien?', texto='¿Por qué no contestás? Avisame.', color='#5b6b8c'), grade='frio', cam='empuje'), [
   ('nico', 'Estoy bien, no fue nada…', 'Estoy bien, no fue nada…'),
   (N, 'Te chocaron, y el otro conductor te pregunta si estás bien.', 'Te chocaron y el otro te pregunta *si estás bien.*'),
   (N, 'Antes de contestar…', 'Antes de contestar…'),
   (N, 'esperá.', '*esperá.*'),
   (N, 'Lo que decís en caliente, después te lo pueden recordar.', 'Lo que decís en caliente *te lo pueden recordar.*'),
   (N, 'Y el dolor muchas veces aparece al día siguiente.', 'Y el dolor muchas veces *aparece al día siguiente.*'),
   (N, 'Nunca digas estas tres cosas.', 'Nunca digas *estas tres cosas:*'),
   (N, 'Uno: «fue mi culpa».', '*«Fue mi culpa».*'),
   (N, 'Dos: «estoy bien, no fue nada».', '*«Estoy bien, no fue nada».*'),
   (N, 'Tres: «arreglemos de palabra».', '*«Arreglemos de palabra».*'),
   ('nico', 'Mejor pido los datos, y voy al médico.', 'Mejor pido los datos y voy al médico.'),
   (N, 'Comentá «nunca», y te respondemos.', 'Comentá *NUNCA*')]),
 'vita-aguinaldo-fecha-b': _v('AGUINALDO', 'Antes de firmar', D(hook='Aguinaldo de diciembre:<br><em>marcá esta fecha</em>', doc='Recibo de sueldo', remite='Empleador · Recursos Humanos', firma='Firma del empleado', sello='18/12', cal=['18 DIC', 'HOY'],
     notif=D(hora='9:15', app='Radio · En vivo', titulo='Aguinaldo', texto='La segunda cuota se paga hasta el 18 de diciembre.', color='#8a6d2b'), pj='sole', esc0='oficina', ap='celu', grade='oro'), [
   ('sole', '¿Y a mí me toca el aguinaldo?', '¿Y a mí me toca el aguinaldo?'),
   (N, 'Escuchaste en la radio que el aguinaldo de diciembre tiene fecha.', 'El aguinaldo de diciembre *tiene fecha.*'),
   (N, 'La segunda cuota se paga…', 'La segunda cuota se paga…'),
   (N, 'hasta el dieciocho.', '*hasta el 18/12.*'),
   (N, 'Si trabajás en relación de dependencia, te corresponde.', 'Si trabajás en relación de dependencia, *te corresponde.*'),
   (N, 'Y si no llega a tiempo, no lo dejes pasar.', 'Y si no llega a tiempo, *no lo dejes pasar.*'),
   (N, 'Hacé tres cosas.', 'Hacé *tres cosas:*'),
   (N, 'Uno: agendá el dieciocho de diciembre.', 'Agendá el *18 de diciembre.*'),
   (N, 'Dos: revisá que figure en tu recibo.', 'Revisá que figure *en tu recibo.*'),
   (N, 'Tres: si te fuiste este año, te toca la parte proporcional.', 'Si te fuiste este año, *te toca la parte proporcional.*'),
   ('sole', 'Listo, ya lo agendé.', 'Listo, ya lo agendé.'),
   (N, 'Comentá «aguinaldo», y te respondemos.', 'Comentá *AGUINALDO*')]),
 'vita-art-rechazo-a': _v('ART', 'Antes de firmar', D(hook='ART:<br>te rechazaron<br><em>el accidente</em>', doc='Rechazo del siniestro', remite='ART · Siniestros', firma='Notificada', sello='ESPERÁ', cal=['HOY', 'MAÑANA'],
     notif=D(hora='12:30', app='ART · Siniestros', titulo='Resolución de tu caso', texto='Tu siniestro fue rechazado. Mirá la carta adjunta.', color='#5b6b8c'), pj='sole', esc0='oficina', grade='frio'), [
   ('sole', '¿Rechazado? ¿Y ahora?', '¿Rechazado? ¿Y ahora?'),
   (N, 'Te lastimaste trabajando, y la ART te manda una carta: rechazado.', 'Te lastimaste trabajando y la ART dice: *rechazado.*'),
   (N, 'Antes de guardarla en un cajón…', 'Antes de guardarla en un cajón…'),
   (N, 'esperá.', '*esperá.*'),
   (N, 'El rechazo de la ART no es la última palabra.', 'El rechazo *no es la última palabra.*'),
   (N, 'Y si te sigue doliendo, eso también cuenta.', 'Si te sigue doliendo, *eso también cuenta.*'),
   (N, 'Hacé tres cosas.', 'Hacé *tres cosas:*'),
   (N, 'Uno: guardá la carta, con el sobre.', 'Guardá la carta, *con el sobre.*'),
   (N, 'Dos: seguí atendiéndote, y guardá cada estudio.', 'Seguí atendiéndote y *guardá cada estudio.*'),
   (N, 'Tres: consultá con un abogado, porque hay plazos.', 'Consultá con un abogado: *hay plazos.*'),
   ('sole', 'Entonces la guardo, y consulto.', 'Entonces la guardo y consulto.'),
   (N, 'Comentá «ART», y te respondemos.', 'Comentá *ART*')]),
 'vita-liquidacion-b': _v('LIQUIDACION', 'Antes de firmar', D(hook='Liquidación final:<br><em>renglón por renglón</em>', doc='Liquidación final', remite='Empleador · Recursos Humanos', firma='Firma del empleado', sello='REVISÁ', cal=['HOY', 'MAÑANA'],
     notif=D(hora='16:05', app='Empleador · RR. HH.', titulo='Tu liquidación final', texto='Pasá a firmar el recibo cuando puedas.', color='#5b6b8c'), pj='sole', esc0='oficina', ap='sello', grade='calido'), [
   ('sole', 'Esto no me cierra…', 'Esto no me cierra…'),
   (N, 'Terminó tu trabajo, y te dan la liquidación final para firmar.', 'Terminó tu trabajo y te dan *la liquidación final.*'),
   (N, 'Antes de firmar…', 'Antes de firmar…'),
   (N, 'revisala.', '*revisala.*'),
   (N, 'Leela renglón por renglón, con tus recibos al lado.', 'Leela *renglón por renglón,* con tus recibos al lado.'),
   (N, 'Y si algo falta, no lo dejes pasar.', 'Y si algo falta, *no lo dejes pasar.*'),
   (N, 'Fijate que estén estas tres cosas.', 'Fijate que estén *estas tres cosas:*'),
   (N, 'Uno: los días trabajados del mes.', 'Los días *trabajados del mes.*'),
   (N, 'Dos: las vacaciones que no tomaste.', 'Las vacaciones *que no tomaste.*'),
   (N, 'Tres: el aguinaldo proporcional.', 'El aguinaldo *proporcional.*'),
   ('sole', 'Faltan las vacaciones. Lo consulto.', 'Faltan las vacaciones. Lo consulto.'),
   (N, 'Comentá «liquidación», y te respondemos.', 'Comentá *LIQUIDACIÓN*')]),
 'vita-firmas-b-r1': _v('FIRMA', 'Antes de firmar', D(hook='Acuerdo del seguro:<br>leé esto <em>antes<br>de la lapicera</em>', doc='Propuesta de acuerdo', remite='Aseguradora · Siniestros', firma='Firma del reclamante', sello='LEÉ', cal=['HOY', 'MAÑANA'],
     notif=D(hora='19:05', app='Aseguradora · Siniestros', titulo='Firmá hoy y cobrás', texto='La propuesta vence hoy. Necesitamos tu firma.', color='#5b6b8c'), pj='sole', ap='gigante', cam='lateral', grade='noche'), [
   ('sole', '¿Qué firmo, me preguntás? Un acuerdo.', '¿Qué firmo, me preguntás? Un acuerdo.'),
   (N, 'El seguro del otro te ofrece plata, si firmás hoy.', 'El seguro del otro te ofrece plata *si firmás hoy.*'),
   (N, 'Antes de apoyar la lapicera…', 'Antes de apoyar la lapicera…'),
   (N, 'leé.', '*leé.*'),
   (N, 'Lo que firmás puede cerrar tu reclamo para siempre.', 'Lo que firmás puede *cerrar tu reclamo.*'),
   (N, 'Si después aparece una lesión, quizás ya no puedas pedir más.', 'Si después aparece una lesión, *quizás no puedas pedir más.*'),
   (N, 'Antes de firmar, tres cosas.', 'Antes de firmar, *tres cosas:*'),
   (N, 'Uno: pedí la propuesta por escrito.', 'Pedí la propuesta *por escrito.*'),
   (N, 'Dos: no firmes el mismo día.', 'No firmes *el mismo día.*'),
   (N, 'Tres: mostrásela a un abogado.', 'Mostrásela *a un abogado.*'),
   ('sole', 'Hoy no firmo. Mañana consulto.', 'Hoy no firmo. Mañana consulto.'),
   (N, 'Comentá «firma», y te respondemos.', 'Comentá *FIRMA*')]),
 'vita-alta-dolor-a': _v('ALTA', 'Antes de firmar', D(hook='ART:<br>te dieron el alta<br><em>y te sigue doliendo</em>', doc='Alta médica', remite='ART · Prestador médico', firma='Firma del trabajador', sello='ESPERÁ', cal=['HOY', 'MAÑANA'],
     notif=D(hora='20:10', app='ART · Prestador', titulo='Alta médica', texto='Ya podés volver a tu puesto. Firmá el alta.', color='#5b6b8c'), pj='sole', esc0='oficina', ap='caida', grade='menta'), [
   ('sole', '¡Ay! Pero si ya estaba de alta…', '¡Ay! Pero si ya estaba de alta…'),
   (N, 'Volviste al trabajo con el alta de la ART, y el brazo te sigue doliendo.', 'Volviste con el alta y *te sigue doliendo.*'),
   (N, 'Antes de firmar el alta…', 'Antes de firmar el alta…'),
   (N, 'esperá.', '*esperá.*'),
   (N, 'Si no estás de acuerdo con el alta, lo podés discutir.', 'Si no estás de acuerdo, *lo podés discutir.*'),
   (N, 'Y el dolor que sigue, también cuenta.', 'Y el dolor que sigue *también cuenta.*'),
   (N, 'Hacé tres cosas.', 'Hacé *tres cosas:*'),
   (N, 'Uno: pedí el alta por escrito.', 'Pedí el alta *por escrito.*'),
   (N, 'Dos: seguí con tus estudios.', 'Seguí con *tus estudios.*'),
   (N, 'Tres: consultá con un abogado.', 'Consultá *con un abogado.*'),
   ('sole', 'Entonces no lo dejo pasar.', 'Entonces no lo dejo pasar.'),
   (N, 'Comentá «alta», y te respondemos.', 'Comentá *ALTA*')]),
})
