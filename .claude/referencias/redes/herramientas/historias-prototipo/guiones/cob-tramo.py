# Coberturas · reels del cronograma x2 (sesión de Coberturas, desde el 21/11). Historias en historias/cob-<idea>-<v>.js sobre historias/cob-base.js.
# Estructura fija de 10 frases (como «La carta»): 0 personaje (notif) · 1 caso (carta) · 2 previa · 3 golpe (lupa) · 4 «tres cosas» · 5-7 puntos · 8 alivio · 9 cierre.
# Reglas: sin números ni porcentajes, nada sobre el aumento de prepagas, «Lo que dijo la Corte» solo con lo publicado, nunca «el botón está en el perfil».
VOCES = {
 'lucia_c': ('piper', 'es_AR-daniela-high', .98, 0),   # Lucía, monotributista de Caballito
 'gabi_c': ('edge', 'es-AR-TomasNeural', 4, -5),        # Gabriel Ferreyra, Villa Urquiza
 'vero_c': ('piper', 'es_AR-daniela-high', .94, 0),    # Vero Ferreyra, Villa Urquiza
}
def _r(pal, serie, hook, pj, q, frases, **cfg):
    return dict(palabra=pal, serie=serie, nar='nar_f', cfg=dict(hook=hook, pj=pj, q=q, **cfg), frases=frases)
def F(q, say, show, p=.3, **k): return dict(q=q, say=say, show=show, p=p, **k)
N = 'nar'

R = {
 # 21/11 08:50 · cambio-antes A · Lucía con dos folletos, por cambiarse solo por precio
 'cob-cambio-antes-a': _r('CAMBIO', 'Antes de cambiarte', 'Cambio de prepaga:<br><em>antes, esto</em>', 'lucia', 'lucia_c', [
   F('lucia_c', '¿Me paso a la más barata, y listo?', '¿Me paso a la más barata y listo?', .35, marca='notif'),
   F(N, 'Tenés dos folletos en la mano, y elegís solo por el precio.', 'Dos folletos en la mano, y elegís *solo por el precio.*', .35, marca='carta'),
   F(N, 'Antes de cambiarte,', 'Antes de cambiarte,', .08),
   F(N, 'pará.', '*pará.*', .5, r=-6, marca='lupa'),
   F(N, 'Revisá tres cosas.', 'Revisá *tres cosas:*', .25),
   F(N, 'Uno: que tus médicos estén en la cartilla nueva.', 'Que tus médicos estén *en la cartilla nueva.*', .3, item=1),
   F(N, 'Dos: qué pasa con tus tratamientos en curso.', 'Qué pasa con tus *tratamientos en curso.*', .3, item=2),
   F(N, 'Tres: si hay carencias, o esperas para usar el plan.', 'Si hay *carencias o esperas.*', .4, item=3),
   F('lucia_c', 'Ah, no era solo el precio.', 'Ah, no era solo el precio.', .3, marca='alivio'),
   F(N, 'Comentá «cambio», y te respondemos.', 'Comentá *CAMBIO*', .2, cta=1, r=-3)]),
 # 21/11 10:30 · aguinaldo-aportes B · Gabriel y el recibo del aguinaldo (abre en el final: plano irreal primero, grado oro)
 'cob-aguinaldo-aportes-b': _r('APORTES', 'Tu recibo explicado', 'Recibo del aguinaldo:<br><em>¿qué es ese descuento?</em>', 'gabriel', 'gabi_c', [
   F('gabi_c', '¿Y este descuento del aguinaldo?', '¿Y este descuento del aguinaldo?', .35, marca='notif'),
   F(N, 'Cobraste el aguinaldo, y el recibo trae descuentos.', 'Cobraste el aguinaldo y el recibo *trae descuentos.*', .35, marca='carta'),
   F(N, 'Uno de esos descuentos,', 'Uno de esos descuentos,', .08),
   F(N, 'no se pierde.', '*no se pierde.*', .5, r=-6, marca='lupa'),
   F(N, 'Mirá tres cosas.', 'Mirá *tres cosas:*', .25),
   F(N, 'Uno: el aguinaldo también lleva aporte a la obra social.', 'El aguinaldo también *lleva aporte.*', .3, item=1),
   F(N, 'Dos: ese aporte va a tu cobertura, como cada mes.', 'Ese aporte va *a tu cobertura.*', .3, item=2),
   F(N, 'Tres: en general, podés elegir a qué obra social va.', 'Podés elegir *a qué obra social va.*', .4, item=3),
   F('gabi_c', 'O sea que esa plata trabaja para mí.', 'O sea que esa plata trabaja para mí.', .3, marca='alivio'),
   F(N, 'Comentá «aportes», y te respondemos.', 'Comentá *APORTES*', .2, cta=1, r=-3)], ap='gigante', grade='oro'),
 # 21/11 13:50 · fallo-corte A · solo lo publicado (fuente en el texto de la publicación), sin interpretar el alcance
 'cob-fallo-corte-a': _r('CORTE', 'Lo que dijo la Corte', 'Prepagas:<br><em>lo que dijo la Corte</em>', 'gabriel', 'gabi_c', [
   F('gabi_c', '¿Y esto qué nos cambia a nosotros?', '¿Y esto qué nos cambia a nosotros?', .35, marca='notif'),
   F(N, 'Se publicó que la Corte declaró inconstitucional la liberación de precios de las prepagas.', 'La Corte declaró inconstitucional *la liberación de precios* de las prepagas.', .35, marca='carta'),
   F(N, 'Antes de decidir nada,', 'Antes de decidir nada,', .08),
   F(N, 'calma.', '*calma.*', .5, r=-6, marca='lupa'),
   F(N, 'Hacé tres cosas.', 'Hacé *tres cosas:*', .25),
   F(N, 'Uno: leé la noticia completa, en un medio confiable.', 'Leé la noticia completa, *en un medio confiable.*', .3, item=1),
   F(N, 'Dos: no decidas por un titular: depende de tu plan.', 'No decidas por un titular: *depende de tu plan.*', .3, item=2),
   F(N, 'Tres: guardá tus papeles: credencial, facturas y avisos.', 'Guardá tus papeles: *credencial, facturas y avisos.*', .4, item=3),
   F('gabi_c', 'Bueno, primero leo bien, y después vemos.', 'Bueno, primero leo bien, y después vemos.', .3, marca='alivio'),
   F(N, 'Comentá «corte», y te respondemos.', 'Comentá *CORTE*', .2, cta=1, r=-3)], cam='mano'),
 # 21/11 16:30 · R-cob-recibo-b-1 · remake: arranca por el final (caída), órbita inversa, grado cálido
 'cob-recibo-b-r1': _r('APORTES', 'Tu recibo explicado', 'Recibo de sueldo:<br><em>la línea que nadie mira</em>', 'gabriel', 'gabi_c', [
   F('gabi_c', '¿Para qué voy a leer el recibo?', '¿Para qué voy a leer el recibo?', .35, marca='notif'),
   F(N, 'Doblás el recibo sin leerlo, y te perdés una línea.', 'Doblás el recibo sin leerlo y *te perdés una línea.*', .35, marca='carta'),
   F(N, 'Esa línea del aporte,', 'Esa línea del aporte,', .08),
   F(N, 'es tuya.', '*es tuya.*', .5, r=-6, marca='lupa'),
   F(N, 'Mirá tres cosas.', 'Mirá *tres cosas:*', .25),
   F(N, 'Uno: buscá el aporte a la obra social.', 'Buscá el aporte *a la obra social.*', .3, item=1),
   F(N, 'Dos: fijate a qué obra social va.', 'Fijate *a qué obra social va.*', .3, item=2),
   F(N, 'Tres: preguntá si te conviene derivarlo.', 'Preguntá si te conviene *derivarlo.*', .4, item=3),
   F('gabi_c', 'Mirá vos: esta línea es mía.', 'Mirá vos: esta línea es mía.', .3, marca='alivio'),
   F(N, 'Comentá «aportes», y te respondemos.', 'Comentá *APORTES*', .2, cta=1, r=-3)], ap='caida', cam='lateral', grade='calido'),
 # 21/11 19:20 · R-cob-preexistencia-b-1 · remake: Gabriel le lee a su mamá la respuesta; cámara que empuja, de noche
 'cob-preexistencia-b-r1': _r('PLAN', 'Mitos de la prepaga', 'Enfermedad previa:<br><em>lo que sí puede cambiar es la cuota</em>', 'gabriel', 'gabi_c', [
   F('gabi_c', 'Ma, ¿y si no te aceptan por lo de antes?', 'Ma, ¿y si no te aceptan por lo de antes?', .35, marca='notif'),
   F(N, 'Mito: con una enfermedad previa, la prepaga no te acepta.', 'Mito: con una enfermedad previa *no te aceptan.*', .35, marca='carta'),
   F(N, 'En general, no te pueden rechazar por eso.', 'En general, *no te pueden rechazar* por eso.', .1),
   F(N, 'Lo que puede cambiar, es la cuota.', 'Lo que puede cambiar *es la cuota.*', .5, r=-6, marca='lupa'),
   F(N, 'Antes de elegir, tres cosas.', 'Antes de elegir, *tres cosas:*', .25),
   F(N, 'Uno: declará todo, con la verdad.', 'Declará todo, *con la verdad.*', .3, item=1),
   F(N, 'Dos: pedí por escrito el valor final.', 'Pedí *por escrito* el valor final.', .3, item=2),
   F(N, 'Tres: compará planes antes de decidir.', 'Compará planes *antes de decidir.*', .4, item=3),
   F('gabi_c', 'Ma, quedate tranquila: lo vemos juntos.', 'Ma, quedate tranquila: lo vemos juntos.', .3, marca='alivio'),
   F(N, 'Comentá «plan», y te respondemos.', 'Comentá *PLAN*', .2, cta=1, r=-3)], ap='celu', cam='empuje', grade='noche'),
 # 21/11 20:50 · plan-uso A (reemplazo aprobado del tema del aumento) · Gabriel cuenta lo que la familia nunca usó
 'cob-plan-uso-a': _r('COMPARAR', 'La carta', 'Prepaga:<br><em>¿pagás por lo que no usás?</em>', 'gabriel', 'gabi_c', [
   F('gabi_c', '¿Y esto, cuándo lo usamos?', '¿Y esto, cuándo lo usamos?', .35, marca='notif'),
   F(N, 'Tu plan trae de todo, y muchas cosas nunca las usaste.', 'Tu plan trae de todo, y *muchas cosas nunca las usaste.*', .35, marca='carta'),
   F(N, 'Antes de seguir pagando,', 'Antes de seguir pagando,', .08),
   F(N, 'contá.', '*contá.*', .5, r=-6, marca='lupa'),
   F(N, 'Hacé tres listas.', 'Hacé *tres listas:*', .25),
   F(N, 'Uno: lo que usás de verdad.', 'Lo que usás *de verdad.*', .3, item=1),
   F(N, 'Dos: lo que no usaste nunca.', 'Lo que *no usaste nunca.*', .3, item=2),
   F(N, 'Tres: lo que no podés perder, como tus médicos.', 'Lo que no podés perder: *tus médicos.*', .4, item=3),
   F('gabi_c', 'Con la lista en la mano, comparo.', 'Con la lista en la mano, comparo.', .3, marca='alivio'),
   F(N, 'Comentá «comparar», y te respondemos.', 'Comentá *COMPARAR*', .2, cta=1, r=-3)], grade='menta'),
}

# ---------- 22/11 ----------
R.update({
 # 22/11 08:50 · familia A · los Ferreyra en la mesa: ¿Martina y Benja al plan de Gabriel o al de Vero?
 'cob-familia-a': _r('FAMILIA', 'En familia', 'Familia:<br><em>¿la sumás a tu plan?</em>', 'vero', 'vero_c', [
   F('vero_c', '¿Los chicos van a tu plan o al mío?', '¿Los chicos van a tu plan o al mío?', .35, marca='notif'),
   F(N, 'Sumar a la familia parece fácil, hasta que mirás los dos planes.', 'Sumar a la familia parece fácil, *hasta que mirás los dos planes.*', .35, marca='carta'),
   F(N, 'Todos juntos no siempre conviene.', 'Todos juntos *no siempre conviene.*', .08),
   F(N, 'Depende.', '*Depende.*', .5, r=-6, marca='lupa'),
   F(N, 'Mirá tres cosas.', 'Mirá *tres cosas:*', .25),
   F(N, 'Uno: la edad de cada uno.', 'La edad *de cada uno.*', .3, item=1),
   F(N, 'Dos: los aportes de cada uno, si trabajan.', 'Los aportes *de cada uno.*', .3, item=2),
   F(N, 'Tres: qué usa cada uno de verdad: pediatra, guardia, especialistas.', 'Qué usa cada uno: *pediatra, guardia, especialistas.*', .4, item=3),
   F('vero_c', 'Bueno, hagamos las cuentas con calma.', 'Bueno, hagamos las cuentas con calma.', .3, marca='alivio'),
   F(N, 'Comentá «familia», y te respondemos.', 'Comentá *FAMILIA*', .2, cta=1, r=-3)]),
 # 22/11 10:30 · opcion-tarda B · el cambio de obra social no es de un día para el otro (sin cifras); abre con el papel en cenital, paleta clara
 'cob-opcion-tarda-b': _r('CAMBIO', 'Antes de cambiarte', 'Cambio de obra social:<br><em>no es de un día para el otro</em>', 'lucia', 'lucia_c', [
   F('lucia_c', 'Lo pido el viernes, y el lunes ya está, ¿no?', 'Lo pido el viernes y el lunes ya está, ¿no?', .35, marca='notif'),
   F(N, 'Pedís la opción de cambio de obra social, y esperás la nueva enseguida.', 'Pedís el cambio de obra social y *esperás la nueva enseguida.*', .35, marca='carta'),
   F(N, 'El cambio no es inmediato:', 'El cambio *no es inmediato:*', .08),
   F(N, 'tarda meses.', '*tarda meses.*', .5, r=-6, marca='lupa'),
   F(N, 'Planificalo con tres cosas.', 'Planificalo con *tres cosas:*', .25),
   F(N, 'Uno: preguntá desde cuándo rige la nueva.', 'Preguntá *desde cuándo rige* la nueva.', .3, item=1),
   F(N, 'Dos: mientras tanto, seguí usando la que tenés.', 'Mientras tanto, *seguí usando la que tenés.*', .3, item=2),
   F(N, 'Tres: si estás en un tratamiento, avisá antes.', 'Si estás en un tratamiento, *avisá antes.*', .4, item=3),
   F('lucia_c', 'Ah, entonces lo pido con tiempo.', 'Ah, entonces lo pido con tiempo.', .3, marca='alivio'),
   F(N, 'Comentá «cambio», y te respondemos.', 'Comentá *CAMBIO*', .2, cta=1, r=-3)], ap='papel', grade='menta'),
 # 22/11 13:50 · cartilla-guardia A · Vero, de madrugada, con Benja con fiebre: la guardia más cercana no está en su cartilla
 'cob-cartilla-guardia-a': _r('CARTILLA', 'Antes del precio, la cartilla', 'Cartilla:<br><em>lo descubriste en la guardia</em>', 'vero', 'vero_c', [
   F('vero_c', '¿Cómo que no está en mi cartilla?', '¿Cómo que no está en mi cartilla?', .35, marca='notif'),
   F(N, 'De madrugada, con tu hijo con fiebre, la guardia más cercana no te atiende por tu plan.', 'De madrugada, con fiebre, *la guardia más cercana no está en tu plan.*', .35, marca='carta'),
   F(N, 'La cartilla se mira antes,', 'La cartilla se mira *antes,*', .08),
   F(N, 'no en la guardia.', '*no en la guardia.*', .5, r=-6, marca='lupa'),
   F(N, 'Hoy, buscá tres cosas.', 'Hoy, buscá *tres cosas:*', .25),
   F(N, 'Uno: tu guardia más cercana, por dirección.', 'Tu guardia más cercana, *por dirección.*', .3, item=1),
   F(N, 'Dos: los especialistas que usás, en tu zona.', 'Tus especialistas, *en tu zona.*', .3, item=2),
   F(N, 'Tres: las farmacias adheridas, cerca de tu casa.', 'Farmacias adheridas, *cerca de tu casa.*', .4, item=3),
   F('vero_c', 'Ya la tengo agendada. Nunca más a ciegas.', 'Ya la tengo agendada. Nunca más a ciegas.', .3, marca='alivio'),
   F(N, 'Comentá «cartilla», y te respondemos.', 'Comentá *CARTILLA*', .2, cta=1, r=-3)], cam='mano', grade='frio'),
 # 22/11 16:30 · vacaciones B · Lucía arma la valija para la costa: ¿su cobertura viaja con ella? Abre con el celular, paleta nocturna
 'cob-vacaciones-b': _r('CARTILLA', 'Antes de viajar', 'Antes de armar la valija,<br><em>llamá a tu cobertura</em>', 'lucia', 'lucia_c', [
   F('lucia_c', '¿Y si me pasa algo en la costa?', '¿Y si me pasa algo en la costa?', .35, marca='notif'),
   F(N, 'Armás la valija, y das por hecho que tu cobertura viaja con vos.', 'Armás la valija y das por hecho que *tu cobertura viaja con vos.*', .35, marca='carta'),
   F(N, 'Antes de salir,', 'Antes de salir,', .08),
   F(N, 'llamá.', '*llamá.*', .5, r=-6, marca='lupa'),
   F(N, 'Preguntá tres cosas.', 'Preguntá *tres cosas:*', .25),
   F(N, 'Uno: qué guardias tenés en tu destino.', 'Qué guardias tenés *en tu destino.*', .3, item=1),
   F(N, 'Dos: el teléfono de emergencias: agendalo.', 'El teléfono de emergencias: *agendalo.*', .3, item=2),
   F(N, 'Tres: la credencial a mano, digital o en papel.', 'La credencial a mano, *digital o en papel.*', .4, item=3),
   F('lucia_c', 'Listo: valija, credencial y a la costa.', 'Listo: valija, credencial y a la costa.', .3, marca='alivio'),
   F(N, 'Comentá «cartilla», y te respondemos.', 'Comentá *CARTILLA*', .2, cta=1, r=-3)], ap='celu', grade='noche'),
 # 22/11 20:50 · mono-revisa A · Lucía abre tres cajones: familia, cartilla y adónde va su aporte
 'cob-mono-revisa-a': _r('MONO', 'Tu recibo explicado', 'Monotributo:<br><em>lo que nadie te dijo</em>', 'lucia', 'lucia_c', [
   F('lucia_c', '¿Y esto también viene con el monotributo?', '¿Y esto también viene con el monotributo?', .35, marca='notif'),
   F(N, 'Pagás el monotributo todos los meses, y nunca abriste lo que incluye.', 'Pagás el monotributo y *nunca abriste lo que incluye.*', .35, marca='carta'),
   F(N, 'Una parte va a tu obra social,', 'Una parte va *a tu obra social,*', .08),
   F(N, 'revisala.', '*revisala.*', .5, r=-6, marca='lupa'),
   F(N, 'Abrí tres cajones.', 'Abrí *tres cajones:*', .25),
   F(N, 'Uno: a qué obra social va tu aporte.', 'A qué obra social *va tu aporte.*', .3, item=1),
   F(N, 'Dos: si sumaste a tu familia.', 'Si sumaste *a tu familia.*', .3, item=2),
   F(N, 'Tres: qué cartilla tenés cerca.', 'Qué cartilla *tenés cerca.*', .4, item=3),
   F('lucia_c', 'Tres cajones, y todo en orden.', 'Tres cajones, y todo en orden.', .3, marca='alivio'),
   F(N, 'Comentá «mono», y te respondemos.', 'Comentá *MONO*', .2, cta=1, r=-3)], ap='caida'),
})
R.update({
 # 22/11 19:20 · R-cob-65-b-1 · remake: Gabriel camina las dos cuadras con la carta de la prepaga de su mamá (vereda de Villa Urquiza), cámara en mano
 # (la edad y la antigüedad son el dato aprobado del tema; no hay cifras de cuotas ni de aumentos)
 'cob-65-b-r1': _r('65', 'Tus viejos y la prepaga', '65 y muchos años<br>en la misma prepaga:<br><em>leé esto</em>', 'gabriel', 'gabi_c', [
   F('gabi_c', 'Ma, ¿te aumentan por cumplir años?', 'Ma, ¿te aumentan por cumplir años?', .35, marca='notif'),
   F(N, 'Tu mamá cumple sesenta y cinco, y le llega una carta de la prepaga.', 'Tu mamá cumple 65 y *le llega una carta de la prepaga.*', .35, marca='carta'),
   F(N, 'Con más de diez años en la misma prepaga,', 'Con más de diez años en la misma prepaga,', .08),
   F(N, 'no le pueden aumentar por edad.', '*no le pueden aumentar por edad.*', .5, r=-6, marca='lupa'),
   F(N, 'Hacé tres cosas.', 'Hacé *tres cosas:*', .25),
   F(N, 'Uno: revisá desde cuándo está en la prepaga.', 'Revisá *desde cuándo está* en la prepaga.', .3, item=1),
   F(N, 'Dos: guardá credencial, facturas y alta.', 'Guardá *credencial, facturas y alta.*', .3, item=2),
   F(N, 'Tres: si le aumentan por edad, consultá.', 'Si le aumentan por edad, *consultá.*', .4, item=3),
   F('gabi_c', 'Ma, buscá la credencial vieja: la necesitamos.', 'Ma, buscá la credencial vieja: la necesitamos.', .3, marca='alivio'),
   F(N, 'Comentá «sesenta y cinco», y te respondemos.', 'Comentá *65*', .2, cta=1, r=-3)], cam='mano', grade='calido'),
})
