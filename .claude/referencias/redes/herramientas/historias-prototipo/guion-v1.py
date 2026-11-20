# Guiones del prototipo (textos ya aprobados en guiones.py / palabras-clave-bot.md; solo cambia el cierre a «Comentá PALABRA»).
# Cada frase: say (lo que se lee), show (lo que se ve en subtítulos), pausa después (s), y ajuste fino de ritmo/tono.
R = {
 'vita': dict(voz='es-AR-TomasNeural', rate=4, pitch=-2, palabra='TRAYECTO', frases=[
   dict(say='Ibas a trabajar,', show='Ibas a trabajar,', p=0.12),
   dict(say='y te chocaron.', show='y te chocaron.', p=0.45, r=-4),
   dict(say='Ojo.', show='Ojo:', p=0.16, ph=3, r=-6),
   dict(say='También puede ser un accidente laboral.', show='también puede ser un *accidente laboral.*', p=0.3, ph=1),
   dict(say='Si pasó en el trayecto habitual entre tu casa y el trabajo.', show='Si pasó en el *trayecto habitual* entre tu casa y el trabajo.', p=0.45),
   dict(say='Lo que conviene hacer:', show='Lo que conviene hacer:', p=0.14, r=-2),
   dict(say='avisá a tu empleador y a la a erre te,', show='Avisá a tu empleador y a la *ART*,', p=0.1, item=1),
   dict(say='hacé la denuncia del choque,', show='hacé la *denuncia* del choque,', p=0.1, item=2),
   dict(say='y guardá certificados y estudios.', show='y guardá *certificados* y estudios.', p=0.5, item=3),
   dict(say='Comentá «trayecto», y te respondemos.', show='Comentá *TRAYECTO* y te respondemos.', p=0.2, cta=1, r=-2)]),
 'cob': dict(voz='es-AR-ElenaNeural', rate=3, pitch=0, palabra='MONO', frases=[
   dict(say='Si sos monotributista,', show='Si sos monotributista,', p=0.06),
   dict(say='ya pagás obra social.', show='ya pagás *obra social.*', p=0.4, ph=1),
   dict(say='Una parte de tu cuota mensual va ahí.', show='Una parte de tu *cuota mensual* va ahí.', p=0.45),
   dict(say='Revisá tres cosas:', show='Revisá tres cosas:', p=0.14, r=-2),
   dict(say='a qué obra social va tu aporte,', show='A qué obra social va *tu aporte*,', p=0.1, item=1),
   dict(say='si sumaste a tu familia,', show='si sumaste a *tu familia*,', p=0.1, item=2),
   dict(say='y qué cartilla tenés cerca.', show='y qué *cartilla* tenés cerca.', p=0.5, item=3),
   dict(say='Comentá «mono», y te respondemos.', show='Comentá *MONO* y te respondemos.', p=0.2, cta=1, r=-2)]),
 'autos': dict(voz='es-AR-TomasNeural', rate=8, pitch=0, palabra='USADO', frases=[
   dict(say='Tu usado, como parte de pago.', show='Tu usado, como *parte de pago.*', p=0.2),
   dict(say='¿Cuánto vale?', show='¿Cuánto vale?', p=0.08, ph=2),
   dict(say='Depende de esto.', show='Depende de *esto.*', p=0.4, r=-3),
   dict(say='Service al día, con comprobantes.', show='*Service al día*, con comprobantes.', p=0.14, item=1),
   dict(say='Papeles en regla.', show='*Papeles* en regla.', p=0.14, item=2),
   dict(say='Sin deudas de patentes ni multas.', show='Sin deudas de *patentes* ni multas.', p=0.35, item=3),
   dict(say='Con todo eso, tu usado vale más.', show='Con todo eso, tu usado *vale más.*', p=0.45, ph=1),
   dict(say='Comentá «usado», y te respondemos.', show='Comentá *USADO* y te respondemos.', p=0.2, cta=1, r=-2)]),
 'mkt': dict(voz='es-AR-ElenaNeural', rate=6, pitch=0, palabra='CRM', frases=[
   dict(say='Llegó una consulta,', show='Llegó una consulta', p=0.08),
   dict(say='a las nueve y tres de la noche.', show='a las *21:03.*', p=0.4, ph=1),
   dict(say='La respondiste al otro día...', show='La respondiste *al otro día…*', p=0.3, r=-4),
   dict(say='Ya había comprado en otro lado.', show='Ya había comprado *en otro lado.*', p=0.5, ph=-1),
   dict(say='Responder en la primera hora multiplica por siete las chances de avanzar con un cliente.', show='Responder en la *primera hora* multiplica por *7* las chances de avanzar con un cliente.', p=0.5),
   dict(say='Comentá «CRM», y te mostramos cómo.', show='Comentá *CRM* y te mostramos cómo.', p=0.2, cta=1, r=-2)]),
}
