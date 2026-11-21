# Kocos Marketing · reels del cronograma x2 desde el 21/11 (tramo «kocos»). Situaciones ilustrativas en Dulce Almagro
# (pastelería ficticia de Romina en Av. Corrientes y Medrano). Sin promesas de resultados ni cifras.
# Estructura fija para el motor de Kocos (historias/mkt-kit.js y sonido.py): 0 personaje (pings) · 1 caso · 2 consecuencia (frio)
# · 3 frase corta (plano gigante) · 4 giro · 5 «tres cosas» (caída) · 6-8 puntos · 9 alivio · 10 cierre.
VOCES = {
 'romina': ('piper', 'es_AR-daniela-high', .95, 0),   # pastelera de Almagro (Kocos)
 'tomi': ('edge', 'es-UY-MateoNeural', 10, 4),        # Tomi, el que ayuda en el local (Kocos)
}

def g(palabra, serie, hook, frases, **cfg):
    cfg['hook'] = hook
    return dict(palabra=palabra, serie=serie, nar='nar_f', cfg=cfg, frases=frases)

def F(q, say, show, p=.3, **k):
    return dict(q=q, say=say, show=show, p=p, **k)

def cta(pal, say):
    return F('nar', f'Comentá «{say}», y te respondemos.', f'Comentá *{pal}*', .2, cta=1, r=-3)

R = {
 # 21/11 10:30 · «Checklist de diciembre» · B: abre en el final y rebobina; Romina y Tomi; primer plano la vitrina de tortas.
 'mkt-checklist-b': g('CHECKLIST', 'Antes / después', 'Uno de diciembre:<br><em>¿tu WhatsApp está listo?</em>', [
   F('romina', '¡Uno de diciembre, y el celular ya explota!', '¡Uno de diciembre, y el celular ya explota!', .25, marca='pings'),
   F('nar', 'Diciembre es temporada alta: más consultas, más pedidos y menos tiempo.', 'Diciembre: más consultas *y menos tiempo.*'),
   F('nar', 'Si llegás sin preparar, las respuestas se atrasan y los pedidos se cruzan.', 'Si llegás sin preparar, *los pedidos se cruzan.*', .4, marca='frio'),
   F('nar', 'Rebobinemos.', '*Rebobinemos.*', .2),
   F('nar', 'Esto se prepara antes, en una tarde.', 'Esto se prepara antes, *en una tarde.*', .4, marca='giro'),
   F('nar', 'Revisá tres cosas.', 'Revisá *tres cosas:*', .25),
   F('nar', 'Uno: un mensaje de ausencia con los horarios de las fiestas.', 'Mensaje de ausencia con *los horarios de las fiestas.*', item=1),
   F('nar', 'Dos: respuestas rápidas para precios, envíos y plazos.', 'Respuestas rápidas: *precios, envíos y plazos.*', item=2),
   F('nar', 'Tres: etiquetas por etapa: consulta, pedido y entregado.', 'Etiquetas por etapa: *consulta, pedido, entregado.*', .4, item=3),
   F('romina', 'Ahora sí, que venga diciembre.', 'Ahora sí, que venga diciembre.', marca='alivio'),
   cta('CHECKLIST', 'checklist')],
   lugar='mostrador', pant='check', pp='vitrina', objeto='camara', doc='Diciembre', tomi=1, grade='calido', ap='gigante', cartel='DULCE ALMAGRO'),
 # 21/11 13:50 · «Lo pienso» no es un no · A: la cocina de Dulce Almagro de noche.
 'mkt-seguir-lopienso-a': g('SEGUIR', 'El celular que no para', '<em>«Lo pienso»</em><br>no es un no', [
   F('romina', '«Lo pienso»… otra venta perdida.', '«Lo pienso»… otra venta perdida.', .3, marca='pings'),
   F('nar', 'Una clienta te pide precio, le contestás, y te dice: lo pienso.', 'Te piden precio y te dicen: *«lo pienso».*'),
   F('nar', 'Si no volvés a escribir, la venta se enfría sola.', 'Si no volvés a escribir, *la venta se enfría sola.*', .4, marca='frio'),
   F('nar', '«Lo pienso» no es un no.', '*«Lo pienso»* no es un no.', .2),
   F('nar', 'Es un todavía.', 'Es un *todavía.*', .45, marca='giro'),
   F('nar', 'Hacé esto.', '*Hacé esto:*', .25),
   F('nar', 'Uno: anotá quién te dijo «lo pienso», y cuándo.', 'Anotá quién dijo «lo pienso» *y cuándo.*', item=1),
   F('nar', 'Dos: volvé a escribirle a los pocos días, sin presionar.', 'Volvé a escribir *a los pocos días, sin presionar.*', item=2),
   F('nar', 'Tres: sumá algo nuevo: una foto, un dato o una opción.', 'Sumá algo nuevo: *una foto, un dato, una opción.*', .4, item=3),
   F('romina', 'Mañana le escribo, con la foto de la torta.', 'Mañana le escribo, con la foto de la torta.', marca='alivio'),
   cta('SEGUIR', 'seguir')],
   lugar='cocina', pant='seguir', pp='libreta', objeto='burbuja', doc='Lo pienso', grade='noche'),
 # 21/11 16:30 · Estados: tu vidriera de fin de año · B: arranca por el final (la clienta ya pidió); primer plano la notebook con stickers.
 'mkt-estados-b': g('ORDEN', 'Antes / después', '¡Me pidieron<br>la torta <em>del estado!</em>', [
   F('romina', '¡Me pidieron la torta del estado!', '¡Me pidieron la torta del estado!', .3, marca='pings'),
   F('nar', 'Romina subió la vidriera navideña a sus estados, y una clienta respondió con un pedido.', 'Subió la vidriera a sus estados *y llegó un pedido.*'),
   F('nar', 'Pero si tus estados están vacíos, nadie ve lo nuevo.', 'Si tus estados están vacíos, *nadie ve lo nuevo.*', .4, marca='frio'),
   F('nar', 'Tus estados son una vidriera.', 'Tus estados son *una vidriera.*', .2),
   F('nar', 'Y fin de año es la mejor época para llenarla.', 'Y fin de año es *la época para llenarla.*', .4, marca='giro'),
   F('nar', 'Tres ideas.', '*Tres ideas:*', .25),
   F('nar', 'Uno: mostrá lo nuevo, con fotos reales.', 'Mostrá lo nuevo, *con fotos reales.*', item=1),
   F('nar', 'Dos: poné horarios y fechas de entrega de las fiestas.', 'Horarios y fechas *de entrega de las fiestas.*', item=2),
   F('nar', 'Tres: cerrá con una pregunta: ¿te la reservo?', 'Cerrá con una pregunta: *«¿te la reservo?»*', .4, item=3),
   F('romina', 'Hoy subo la del pan dulce.', 'Hoy subo la del pan dulce.', marca='alivio'),
   cta('ORDEN', 'orden')],
   lugar='vidriera', pant='estados', pp='notebook', objeto='estrella', doc='Fin de año', grade='oro', cam='empuje', cartel='FELICES FIESTAS'),
 # 21/11 19:20 · Fiestas: un formulario simple para tomar pedidos · B: pregunta → caso → pasos; primer plano el celular naranja.
 'mkt-pedidos-fiestas-b': g('ORDEN', 'Antes / después', 'El pedido en un papelito:<br><em>que no se pierda</em>', [
   F('romina', '¿Dónde anoté el pedido de la señora?', '¿Dónde anoté el pedido de la señora?', .3, marca='pings'),
   F('nar', 'Mitad de diciembre: el pedido estaba en un papelito, y el papelito no aparece.', 'El pedido estaba en un papelito *y no aparece.*'),
   F('nar', 'Y un pedido perdido puede ser una clienta que no vuelve.', 'Un pedido perdido puede ser *una clienta que no vuelve.*', .4, marca='frio'),
   F('nar', 'Papelitos, no.', '*Papelitos,* no.', .2),
   F('nar', 'Un formulario simple, sí.', 'Un formulario simple, *sí.*', .45, marca='giro'),
   F('nar', 'Que pida tres datos.', 'Que pida *tres datos:*', .25),
   F('nar', 'Uno: nombre y contacto.', 'Nombre *y contacto.*', item=1),
   F('nar', 'Dos: qué quiere, y para cuántas personas.', 'Qué quiere *y para cuántas personas.*', item=2),
   F('nar', 'Tres: día y hora de retiro o de envío.', 'Día y hora *de retiro o de envío.*', .4, item=3),
   F('romina', 'Ahora cada pedido queda anotado.', 'Ahora cada pedido queda anotado.', marca='alivio'),
   cta('ORDEN', 'orden')],
   lugar='cocina', pant='form', pp='celu', objeto='torta', doc='Pedidos de fiestas', grade='calido', ap='celu', cam='mano'),
 # 21/11 20:50 · Te buscan en Google y no aparecés · A: esquina de Av. Corrientes y Medrano.
 'mkt-google-perfil-a': g('GOOGLE', 'Antes / después', 'Te buscan<br>y <em>no aparecés</em>', [
   F('romina', '¿Cómo puede ser que no aparezcamos?', '¿Cómo puede ser que no aparezcamos?', .3, marca='pings'),
   F('nar', 'Alguien busca tortas en Almagro, a una cuadra, y tu pastelería no aparece en el mapa.', 'Buscan tortas en Almagro *y no aparecés en el mapa.*'),
   F('nar', 'Y si no te encuentran, le compran al que sí aparece.', 'Si no te encuentran, *le compran al que aparece.*', .4, marca='frio'),
   F('nar', 'Tu perfil de empresa en Google…', 'Tu perfil de empresa *en Google…*', .15),
   F('nar', 'se completa en una tarde.', '*se completa en una tarde.*', .45, marca='giro'),
   F('nar', 'Completá tres cosas.', 'Completá *tres cosas:*', .25),
   F('nar', 'Uno: dirección y horarios, también los de las fiestas.', 'Dirección y horarios, *también los de las fiestas.*', item=1),
   F('nar', 'Dos: fotos reales del local y de lo que vendés.', 'Fotos reales *del local y de lo que vendés.*', item=2),
   F('nar', 'Tres: tu teléfono y tu web, bien enlazados.', 'Teléfono y web, *bien enlazados.*', .4, item=3),
   F('romina', '¡Ahí estamos, en la esquina!', '¡Ahí estamos, en la esquina!', marca='alivio'),
   cta('GOOGLE', 'google')],
   lugar='esquina', pant='mapa', pp='libreta', objeto='pin', doc='Tortas en Almagro', grade='frio'),
 # 22/11 08:50 · Black Friday: ¿adónde lleva el link de tu bio? · A: el mostrador; la clienta cae en una página vieja.
 'mkt-link-bio-a': g('BIO', 'Antes / después', 'Black Friday:<br>tu link de bio,<br><em>¿adónde lleva?</em>', [
   F('romina', '¿Cómo que la promo no aparece?', '¿Cómo que la promo no aparece?', .3, marca='pings'),
   F('nar', 'Black Friday: una clienta toca el link de tu bio, y cae en una página vieja.', 'Tocan el link de tu bio *y cae en una página vieja.*'),
   F('nar', 'No encuentra la promo, no encuentra cómo pedir, y se va.', 'No encuentra cómo pedir, *y se va.*', .4, marca='frio'),
   F('nar', 'El link de tu bio es una puerta.', 'El link de tu bio *es una puerta.*', .2),
   F('nar', 'Revisá adónde lleva, antes del viernes.', 'Revisá adónde lleva, *antes del viernes.*', .4, marca='giro'),
   F('nar', 'Que muestre tres cosas.', 'Que muestre *tres cosas:*', .25),
   F('nar', 'Uno: la promo vigente, arriba de todo.', 'La promo vigente, *arriba de todo.*', item=1),
   F('nar', 'Dos: lo que vendés, con fotos al día.', 'Lo que vendés, *con fotos al día.*', item=2),
   F('nar', 'Tres: un botón claro para pedir o consultar.', 'Un botón claro *para pedir o consultar.*', .4, item=3),
   F('romina', 'Listo: link nuevo, y la promo arriba.', 'Listo: link nuevo, y la promo arriba.', marca='alivio'),
   cta('BIO', 'bio')],
   lugar='mostrador', pant='bio', pp='celu', objeto='etiqueta', doc='Black Friday', grade='calido', cartel='BLACK FRIDAY', items=['', 'Lo que vendés, con fotos al día']),
 # 22/11 10:30 · Mensajes de Instagram sin responder · B: abre en el contador «sin responder»; Tomi en la notebook; paleta clara.
 'mkt-mensajes-ig-b': g('CRM', 'El celular que no para', 'Revisá «solicitudes»:<br><em>hay mensajes esperando</em>', [
   F('tomi', '¿Y estos mensajes de hace semanas?', '¿Y estos mensajes de hace semanas?', .3, marca='pings'),
   F('nar', 'Tomi abre la carpeta de solicitudes, y encuentra consultas que nadie vio.', 'Abre «solicitudes» *y hay consultas que nadie vio.*'),
   F('nar', 'Los mensajes de gente que no te sigue suelen quedar ahí, esperando.', 'Los de gente que no te sigue *quedan ahí, esperando.*', .4, marca='frio'),
   F('nar', 'No es mala suerte.', 'No es *mala suerte.*', .2),
   F('nar', 'Es una carpeta que nadie revisa.', 'Es una carpeta *que nadie revisa.*', .4, marca='giro'),
   F('nar', 'Desde hoy, tres hábitos.', 'Desde hoy, *tres hábitos:*', .25),
   F('nar', 'Uno: revisá solicitudes todos los días.', 'Revisá solicitudes *todos los días.*', item=1),
   F('nar', 'Dos: respondé primero las más viejas.', 'Respondé primero *las más viejas.*', item=2),
   F('nar', 'Tres: pasá cada consulta a una lista, para seguirla.', 'Pasá cada consulta *a una lista, para seguirla.*', .4, item=3),
   F('tomi', 'Listo, ya les escribí a todas.', 'Listo, ya les escribí a todas.', marca='alivio'),
   cta('CRM', 'ce erre eme')],
   lugar='mesa', pant='solicitudes', pp='contador', objeto='reloj', doc='Solicitudes', pj='tomi', q='tomi', ap='pp', claro=1, grade='menta', contador='Esperando', items=['', 'Respondé primero las más viejas']),
 # 22/11 13:50 · Domingo 11:40: te escriben. ¿Contestás el lunes? · A: Plaza Almagro, domingo.
 'mkt-consulta-domingo-a': g('CRM', 'El celular que no para', 'Domingo, <em>11:40</em>:<br>te escriben', [
   F('romina', 'Es domingo… lo contesto el lunes.', 'Es domingo… lo contesto el lunes.', .3, marca='pings'),
   F('nar', 'Domingo, once y cuarenta: alguien quiere encargar una torta para el martes.', 'Domingo, 11:40: *quieren encargar una torta.*'),
   F('nar', 'Si la respuesta llega el lunes, quizás ya encargó en otro lado.', 'Si respondés el lunes, *quizás ya encargó en otro lado.*', .4, marca='frio'),
   F('nar', 'No hace falta trabajar el domingo.', 'No hace falta *trabajar el domingo.*', .2),
   F('nar', 'Hace falta dejarlo preparado.', 'Hace falta *dejarlo preparado.*', .4, marca='giro'),
   F('nar', 'Tres cosas.', '*Tres cosas:*', .25),
   F('nar', 'Uno: un mensaje automático que diga cuándo respondés.', 'Un mensaje automático *que diga cuándo respondés.*', item=1),
   F('nar', 'Dos: un formulario para dejar el pedido.', 'Un formulario *para dejar el pedido.*', item=2),
   F('nar', 'Tres: el lunes, primero los pedidos del fin de semana.', 'El lunes, primero *los pedidos del fin de semana.*', .4, item=3),
   F('romina', 'Ahora sí, domingo de plaza.', 'Ahora sí, domingo de plaza.', marca='alivio'),
   cta('CRM', 'ce erre eme')],
   lugar='plaza', pant='chats', pp='reloj', objeto='rayo', doc='Domingo 11:40', grade='menta', msgs=['¿Torta para el martes?', '¿Abren hoy?', '¿Hacen envíos?', '¿Precio?', 'Quiero encargar'], items=['', 'Un formulario para dejar el pedido']),
 # 22/11 16:30 · Reseñas reales: pedíselas a tus clientes de siempre · B: abre en el final y rebobina; primer plano la libreta; paleta nocturna.
 'mkt-resenas-b': g('GOOGLE', 'Antes / después', 'Reseñas reales:<br><em>pedíselas a tus clientes</em>', [
   F('romina', 'Marta, ¿me dejarías una reseña?', 'Marta, ¿me dejarías una reseña?', .3, marca='pings'),
   F('nar', 'Romina le pide a una clienta de siempre que cuente cómo le fue, sin nada a cambio.', 'Le pide una reseña a una clienta de siempre, *sin nada a cambio.*'),
   F('nar', 'Porque un perfil sin reseñas genera dudas, aunque vendas bien.', 'Un perfil sin reseñas *genera dudas.*', .4, marca='frio'),
   F('nar', 'Las reseñas no se compran.', 'Las reseñas *no se compran.*', .2),
   F('nar', 'Se piden, a la gente real.', 'Se piden, *a la gente real.*', .4, marca='giro'),
   F('nar', 'En tres pasos.', 'En *tres pasos:*', .25),
   F('nar', 'Uno: pedila justo después de una buena entrega.', 'Pedila justo después *de una buena entrega.*', item=1),
   F('nar', 'Dos: mandá el enlace directo, para que no lo busque.', 'Mandá el enlace directo, *para que no lo busque.*', item=2),
   F('nar', 'Tres: respondé cada reseña, también las malas.', 'Respondé cada reseña, *también las malas.*', .4, item=3),
   F('romina', '¡Gracias, Marta!', '¡Gracias, Marta!', marca='alivio'),
   cta('GOOGLE', 'google')],
   lugar='mostrador', pant='resenas', pp='libreta', objeto='lupa', doc='Reseñas', grade='noche', ap='caida', cartel='DULCE ALMAGRO', items=['', 'Mandá el enlace directo']),
 # 22/11 19:20 · Remake R de «mkt-ausencia-b»: el dormitorio de Romina a las 3 a. m.; cámara en mano.
 'mkt-ausencia-b-r1': g('AUTO', 'El celular que no para', 'Antes del Cyber Monday:<br><em>dejá lista la respuesta de madrugada</em>', [
   F('romina', 'Mmm… ¿quién escribe a esta hora?', 'Mmm… ¿quién escribe a esta hora?', .3, marca='pings'),
   F('nar', 'Tres de la mañana: el celular se ilumina en la mesa de luz, y Romina duerme.', '3 de la mañana: *el celular se ilumina.*'),
   F('nar', 'Del otro lado, alguien quiere comprar ahora, y espera una respuesta.', 'Del otro lado, alguien *quiere comprar ahora.*', .4, marca='frio'),
   F('nar', 'Vos no tenés que estar despierta.', 'Vos no tenés que *estar despierta.*', .2),
   F('nar', 'Tu respuesta automática, sí.', 'Tu respuesta automática, *sí.*', .4, marca='giro'),
   F('nar', 'Que diga tres cosas.', 'Que diga *tres cosas:*', .25),
   F('nar', 'Uno: gracias por escribir, y cuándo respondés.', 'Gracias por escribir *y cuándo respondés.*', item=1),
   F('nar', 'Dos: los horarios de las fiestas.', 'Los horarios *de las fiestas.*', item=2),
   F('nar', 'Tres: dónde dejar el pedido, para no perderlo.', 'Dónde dejar el pedido, *para no perderlo.*', .4, item=3),
   F('romina', 'Ahora sí, a dormir tranquila.', 'Ahora sí, a dormir tranquila.', marca='alivio'),
   cta('AUTO', 'auto')],
   lugar='dormitorio', pant='ausencia', pp='reloj', objeto='luna', doc='03:00', grade='noche', cam='mano', cielo=['#2a2a6a', '#121338', '#070818'], fondoCaida=['#22205a', '#07081a'], items=['', 'Los horarios de las fiestas']),
 # 22/11 20:50 · Respuestas rápidas: 3 que necesitás hoy · A: el mostrador entre torta y torta, con Tomi.
 'mkt-resp-rapidas-a': g('ORDEN', 'Antes / después', '<em>3</em> respuestas rápidas<br>que necesitás hoy', [
   F('romina', '¿Otra vez los horarios? ¡Ya los escribí veinte veces!', '¿Otra vez los horarios? ¡Ya los escribí veinte veces!', .3, marca='pings'),
   F('nar', 'Entre torta y torta, Romina escribe lo mismo una y otra vez.', 'Entre torta y torta, *escribe lo mismo una y otra vez.*'),
   F('nar', 'Y mientras tipea, otra consulta queda esperando.', 'Y mientras tipea, *otra consulta espera.*', .4, marca='frio'),
   F('nar', 'Lo que se repite…', 'Lo que *se repite…*', .15),
   F('nar', 'se guarda una sola vez.', '*se guarda una sola vez.*', .4, marca='giro'),
   F('nar', 'Armá estas tres.', 'Armá *estas tres:*', .25),
   F('nar', 'Uno: horarios y dirección.', 'Horarios *y dirección.*', item=1),
   F('nar', 'Dos: precios, o cómo se arma un presupuesto.', 'Precios, *o cómo se arma un presupuesto.*', item=2),
   F('nar', 'Tres: envíos y formas de pago.', 'Envíos *y formas de pago.*', .4, item=3),
   F('romina', '¡Gracias, Tomi! Una tecla, y listo.', '¡Gracias, Tomi! Una tecla, y listo.', marca='alivio'),
   cta('ORDEN', 'orden')],
   lugar='mostrador', pant='respuestas', pp='celu', objeto='rayo', doc='Respuestas rápidas', tomi=1, grade='calido', cartel='DULCE ALMAGRO', items=['', 'Precios o presupuesto']),
}

def r11(pal, serie, hook, quien, a0, a1, a2, a3, a4, a5, i1, i2, i3, alivio, say_cta, **cfg):
    q = cfg.get('q', 'romina'); fin = quien
    fr = [F(q, a0[0], a0[1], .3, marca='pings'), F('nar', a1[0], a1[1]), F('nar', a2[0], a2[1], .4, marca='frio'), F('nar', a3[0], a3[1], .2),
          F('nar', a4[0], a4[1], .4, marca='giro'), F('nar', a5[0], a5[1], .25), F('nar', i1[0], i1[1], item=1), F('nar', i2[0], i2[1], item=2),
          F('nar', i3[0], i3[1], .4, item=3), F(q, alivio[0], alivio[1], marca='alivio'), cta(pal, say_cta)]
    cfg.setdefault('items', ['', i2[1].replace('*', '')])
    return g(pal, serie, hook, fr, **cfg)
d2 = lambda x: (x, x)
R.update({
 # 23/11 08:50 · «Por privado» contra una respuesta que avanza · A: la mesa con la notebook de Tomi.
 'mkt-precio-antes-a': r11('RESPUESTAS', 'Antes / después', 'Antes y después:<br><em>«¿precio?»</em>', '',
   d2('¿Y qué le contesto? ¿«Por privado»?'),
   ('Tomi le muestra a Romina dos respuestas al mismo «¿precio?».', 'Dos respuestas *al mismo «¿precio?».*'),
   ('«Te escribo por privado» deja a la persona esperando, y la consulta se enfría.', '«Por privado» deja esperando *y la consulta se enfría.*'),
   ('La otra respuesta…', 'La otra *respuesta…*'), ('avanza.', '*avanza.*'), ('Tiene tres partes.', 'Tiene *tres partes:*'),
   ('Uno: respondé lo que te preguntaron.', 'Respondé *lo que te preguntaron.*'),
   ('Dos: sumá qué incluye, o cómo se entrega.', 'Sumá qué incluye *o cómo se entrega.*'),
   ('Tres: proponé un paso: ¿te la reservo para el sábado?', 'Proponé un paso: *«¿te la reservo?»*'),
   d2('¡Mirá, ya me contestó!'), 'respuestas',
   lugar='mesa', pant='precio', pp='notebook', objeto='pin', doc='¿Precio?', tomi=1, grade='calido', items=['', 'Qué incluye o cómo se entrega']),
 # 23/11 10:30 · Remake R de «mkt-bio-c»: Romina toca su propio link y aparece «próximamente»; arranca por el final.
 'mkt-bio-c-r1': r11('BIO', 'Antes / después', 'El link de tu bio:<br><em>¿lo tocaste hoy?</em>', '',
   d2('¿«Próximamente»? ¡Si eso ya lo vendo!'),
   ('Romina toca el link de su propia bio, y aparece una página que dice: próximamente.', 'Toca su propio link *y dice «próximamente».*'),
   ('Si a ella le pasa, a sus clientas también.', 'Si a ella le pasa, *a sus clientas también.*'),
   ('Tocá tu link…', 'Tocá *tu link…*'), ('hoy mismo.', '*hoy mismo.*'), ('Fijate tres cosas.', 'Fijate *tres cosas:*'),
   ('Uno: que abra rápido, desde el celular.', 'Que abra rápido, *desde el celular.*'),
   ('Dos: que muestre lo que vendés hoy.', 'Que muestre *lo que vendés hoy.*'),
   ('Tres: que tenga un botón claro para escribirte.', 'Un botón claro *para escribirte.*'),
   d2('Listo. Ahora el link lleva a la vitrina.'), 'bio',
   lugar='mostrador', pant='bio', pp='celu', objeto='link', doc='Próximamente', grade='oro', ap='caida', cam='lateral', cartel='DULCE ALMAGRO', url='link de la bio'),
 # 23/11 13:50 · Etiquetá cada chat por etapa · A: la cocina de noche.
 'mkt-etiquetas-a': r11('ORDEN', 'Antes / después', 'Etiquetas<br><em>que ordenan</em>', '',
   d2('¿Este ya pagó, o todavía no?'),
   ('De noche, en la cocina, Romina no sabe qué chat es consulta, cuál es pedido y cuál ya pagó.', 'No sabe qué chat es consulta, *pedido o pagado.*'),
   ('Y cuando todo está mezclado, algo se olvida.', 'Cuando todo está mezclado, *algo se olvida.*'),
   ('Un color…', 'Un *color…*'), ('para cada etapa.', '*para cada etapa.*'), ('Usá tres.', 'Usá *tres:*'),
   ('Uno: consulta, para lo que recién llega.', 'Consulta, *para lo que recién llega.*'),
   ('Dos: presupuesto, para lo que espera respuesta.', 'Presupuesto, *para lo que espera respuesta.*'),
   ('Tres: pagado, para lo que hay que preparar.', 'Pagado, *para lo que hay que preparar.*'),
   d2('Ahora, de un vistazo, sé qué sigue.'), 'orden',
   lugar='cocina', pant='etiquetas', pp='libreta', objeto='etiqueta', doc='Etiquetas', grade='noche'),
 # 23/11 16:30 · Remake R de «mkt-seguir-b»: llega un «lo pienso» y Romina casi tira el chat; pregunta → caso → pasos.
 'mkt-seguir-b-r1': r11('SEGUIR', 'El celular que no para', '«Lo pienso»:<br><em>agendá cuándo volver a escribir</em>', '',
   d2('¿«Lo pienso»? Este, a la papelera.'),
   ('Llega un «lo pienso», y Romina está por borrar el chat.', 'Llega un «lo pienso» *y está por borrar el chat.*'),
   ('Pero la persona preguntó por algo. Todavía le interesa.', 'Pero preguntó por algo: *todavía le interesa.*'),
   ('No lo borres.', 'No lo *borres.*'), ('Agendalo.', '*Agendalo.*'), ('Así.', '*Así:*'),
   ('Uno: poné una fecha para volver a escribir.', 'Poné una fecha *para volver a escribir.*'),
   ('Dos: anotá qué le interesaba.', 'Anotá *qué le interesaba.*'),
   ('Tres: ese día, escribile con algo nuevo, sin presionar.', 'Ese día, algo nuevo, *sin presionar.*'),
   d2('Jueves a las diez: le escribo. Anotado.'), 'seguir',
   lugar='cocina', pant='agenda', pp='reloj', objeto='reloj', doc='Lo pienso', grade='frio', cam='lateral'),
 # 23/11 19:20 · Remake R de «mkt-web-b»: Romina abre su web en el colectivo y la ruedita gira; dato primero, caso después.
 'mkt-web-b-r1': r11('WEB', 'Antes / después', 'Tu web en el colectivo:<br><em>¿carga o se van?</em>', '',
   d2('Dale… cargá… ¡cargá!'),
   ('Romina abre su propia web en el colectivo, por Corrientes, y la ruedita gira y gira.', 'Abre su web en el colectivo *y la ruedita gira.*'),
   ('Cuanto más tarda una página en cargar, más gente se va antes de verla.', 'Cuanto más tarda, *más gente se va.*'),
   ('Tu web se mira…', 'Tu web se mira…'), ('desde el celular.', '*desde el celular.*'), ('Revisá tres cosas.', 'Revisá *tres cosas:*'),
   ('Uno: fotos livianas, no archivos enormes.', 'Fotos livianas, *no archivos enormes.*'),
   ('Dos: lo importante arriba: qué vendés y cómo pedir.', 'Lo importante arriba: *qué vendés y cómo pedir.*'),
   ('Tres: probala vos, con datos y no con wifi.', 'Probala vos, *con datos, no con wifi.*'),
   d2('¡Ahora sí! Cargó antes de la parada.'), 'web',
   lugar='colectivo', pant='web', pp='celu', objeto='rayo', doc='Cargando…', grade='frio', cam='mano', cards=['Fotos livianas', 'Lo importante arriba', 'Probada con datos']),
 # 23/11 20:50 · Fotos reales del local en Google · A: Tomi saca fotos de la vidriera.
 'mkt-google-fotos-a': r11('GOOGLE', 'Antes / después', 'Fotos reales,<br><em>no de banco</em>', '',
   d2('Estas fotos no son de acá, Romi.'),
   ('Tomi mira el perfil de Dulce Almagro: las fotos son de banco, y no muestran el local.', 'Las fotos del perfil son de banco *y no muestran el local.*'),
   ('Y quien busca una pastelería quiere ver la de verdad.', 'Quien busca quiere ver *la de verdad.*'),
   ('Sacá el celular.', 'Sacá *el celular.*'), ('Y mostrá lo real.', 'Y mostrá *lo real.*'), ('Tres fotos.', '*Tres fotos:*'),
   ('Uno: la fachada, para que te encuentren al llegar.', 'La fachada, *para que te encuentren.*'),
   ('Dos: lo que vendés, con buena luz.', 'Lo que vendés, *con buena luz.*'),
   ('Tres: el mostrador, con la gente que atiende.', 'El mostrador, *con quien atiende.*'),
   d2('Listo, ya están subidas.'), 'google',
   lugar='vidriera', pant='mapa', pp='vitrina', objeto='camara', doc='Fotos reales', pj='tomi', q='tomi', grade='oro', cartel='DULCE ALMAGRO'),
 # 24/11 08:50 · Seguimiento: el calendario simple · A: el mostrador y la libreta de pedidos.
 'mkt-seguir-calendario-a': r11('SEGUIR', 'El celular que no para', 'Seguimiento:<br><em>el calendario simple</em>', '',
   d2('¿Cuándo le vuelvo a escribir a cada uno?'),
   ('Romina tiene cinco «lo pienso» de esta semana, y ninguno con fecha.', 'Cinco «lo pienso» *y ninguno con fecha.*'),
   ('Sin fecha, el seguimiento no pasa nunca.', 'Sin fecha, el seguimiento *no pasa nunca.*'),
   ('Tres fechas…', 'Tres *fechas…*'), ('para cada uno.', '*para cada uno.*'), ('Anotá así.', 'Anotá *así:*'),
   ('Uno: al día siguiente, una pregunta corta.', 'Al día siguiente, *una pregunta corta.*'),
   ('Dos: a los tres días, algo nuevo: una foto o una opción.', 'A los tres días, *algo nuevo.*'),
   ('Tres: a la semana, un último mensaje amable.', 'A la semana, *un último mensaje amable.*'),
   d2('Tres fechas y listo. Ya no se me pasa ninguno.'), 'seguir',
   lugar='mostrador', pant='agenda', pp='libreta', objeto='libreta', doc='Seguimiento', grade='calido', cartel='DULCE ALMAGRO', items=['', 'A los tres días, algo nuevo']),
 # 24/11 10:30 · Remake R de «mkt-google»: Tomi en la vidriera; pasos en cuenta regresiva.
 'mkt-google-r1': r11('GOOGLE', 'Antes / después', 'Perfil del negocio:<br><em>horarios, fotos y contacto</em>', '',
   d2('Romi, el perfil dice que cerramos a las seis.'),
   ('Tomi revisa el perfil del negocio: horarios viejos, fotos de banco y un teléfono que ya no usan.', 'Horarios viejos, fotos de banco *y un teléfono que no usan.*'),
   ('Y la gente confía en lo que ve ahí.', 'Y la gente confía *en lo que ve ahí.*'),
   ('Tu perfil habla por vos.', 'Tu perfil *habla por vos.*'), ('Que diga lo correcto.', 'Que diga *lo correcto.*'), ('Tres datos al día.', 'Tres datos *al día:*'),
   ('Uno: horarios reales, también los de las fiestas.', 'Horarios reales, *también los de las fiestas.*'),
   ('Dos: fotos del local y de lo que vendés.', 'Fotos del local *y de lo que vendés.*'),
   ('Tres: el contacto que de verdad atendés.', 'El contacto *que de verdad atendés.*'),
   d2('Actualizado. Ahora sí, abrimos hasta las nueve.'), 'google',
   lugar='vidriera', pant='mapa', pp='vitrina', objeto='pin', doc='Perfil del negocio', pj='tomi', q='tomi', grade='noche', cam='lateral', cartel='FELICES FIESTAS', busca='pastelería Almagro'),
 # 24/11 13:50 · WhatsApp, Business o API · A: Romina y Tomi en el mostrador.
 'mkt-api-a': r11('API', 'Antes / después', 'WhatsApp, Business<br>o API: <em>¿cuál te conviene?</em>', '',
   d2('¿Y nosotros necesitamos algo más grande?'),
   ('Romina y Tomi discuten: ¿alcanza con la aplicación para empresas, o hace falta la API?', '¿Alcanza la app para empresas *o hace falta la API?*'),
   ('Elegir mal es pagar de más, o quedarse corto.', 'Elegir mal es pagar de más *o quedarse corto.*'),
   ('Depende de algo simple:', 'Depende de *algo simple:*'), ('cuántos atienden.', '*cuántos atienden.*'), ('Pensalo así.', 'Pensalo *así:*'),
   ('Uno: si atendés vos sola, la app para empresas suele alcanzar.', 'Si atendés vos sola, *la app suele alcanzar.*'),
   ('Dos: si atienden varias personas, la API ordena todo en una bandeja.', 'Si atienden varios, *la API ordena todo.*'),
   ('Tres: la API tiene costo según los mensajes; calculalo antes.', 'La API tiene costo: *calculalo antes.*'),
   d2('Entonces, por ahora, con la app alcanza.'), 'api',
   lugar='mostrador', pant='api', pp='vitrina', objeto='candado', doc='¿Business o API?', tomi=1, grade='frio', ap='pp', cartel='DULCE ALMAGRO', items=['', 'Varios atienden: la API ordena']),
 # 24/11 16:30 · Remake R de «mkt-bio»: Tomi lee la bio en voz alta y Romina no reconoce su negocio.
 'mkt-bio-r1': r11('BIO', 'Antes / después', 'Bio: qué hacés, para quién,<br><em>dónde y cómo te escriben</em>', '',
   d2('«Pasión por lo dulce desde siempre». ¿Y eso qué vende?'),
   ('Tomi lee la bio en voz alta, y no dice qué venden, ni dónde, ni cómo pedir.', 'La bio no dice qué venden, *ni dónde, ni cómo pedir.*'),
   ('En pocos segundos, la gente decide si se queda.', 'En pocos segundos, *la gente decide si se queda.*'),
   ('Tu bio es tu cartel.', 'Tu bio es *tu cartel.*'), ('Que se entienda rápido.', 'Que se entienda *rápido.*'), ('Que diga tres cosas.', 'Que diga *tres cosas:*'),
   ('Uno: qué hacés, y para quién.', 'Qué hacés *y para quién.*'),
   ('Dos: dónde estás: barrio o zona de envío.', 'Dónde estás: *barrio o zona de envío.*'),
   ('Tres: cómo te escriben o te piden.', 'Cómo te escriben *o te piden.*'),
   d2('Así sí: tortas en Almagro, con pedidos por mensaje.'), 'bio',
   lugar='mesa', pant='bio', pp='notebook', objeto='link', doc='Tu bio', pj='tomi', q='tomi', grade='menta', cam='empuje', url='tu bio'),
 # 24/11 19:20 · Remake R de «mkt-chats»: Tomi abre el celular de Romina y los chats están mezclados; arranca por el final.
 'mkt-chats-r1': r11('ORDEN', 'El celular que no para', 'Chats por etapa:<br><em>consulta, presupuesto, pedido</em>', '',
   d2('Romi, acá está todo mezclado.'),
   ('Tomi abre el celular de Romina: consultas, presupuestos y pedidos, todo en la misma pila.', 'Consultas, presupuestos y pedidos *en la misma pila.*'),
   ('Y en la pila, lo urgente se pierde.', 'Y en la pila, *lo urgente se pierde.*'),
   ('Separá la pila…', 'Separá *la pila…*'), ('en etapas.', '*en etapas.*'), ('Tres etapas.', '*Tres etapas:*'),
   ('Uno: consulta: alguien pregunta.', 'Consulta: *alguien pregunta.*'),
   ('Dos: presupuesto: ya le pasaste precio.', 'Presupuesto: *ya le pasaste precio.*'),
   ('Tres: pedido: hay que prepararlo y entregarlo.', 'Pedido: *prepararlo y entregarlo.*'),
   d2('Listo, Romi. Cada chat, en su lugar.'), 'orden',
   lugar='cocina', pant='chats', pp='celu', objeto='camara', doc='Todo mezclado', pj='tomi', q='tomi', grade='noche', ap='caida', etapas=[['Consulta', '#4E9BE4'], ['Presupuesto', '#FC6E20'], ['Pedido', '#2ecc71']]),
 # 24/11 20:50 · Fiestas: tu mensaje de ausencia · A: la puerta de Dulce Almagro el 24 a la tarde.
 'mkt-horarios-ausencia-a': r11('AUTO', 'El celular que no para', 'Fiestas:<br><em>tu mensaje de ausencia</em>', '',
   d2('Cierro el 24 y nadie sabe hasta cuándo.'),
   ('Veinticuatro a la tarde: Romina cierra el local, y los mensajes siguen llegando.', '24 a la tarde: cierra el local *y siguen llegando mensajes.*'),
   ('Sin respuesta, la gente no sabe si abrís, ni cuándo.', 'Sin respuesta, la gente *no sabe si abrís.*'),
   ('Cerrás vos.', 'Cerrás *vos.*'), ('Tu mensaje, no.', 'Tu mensaje, *no.*'), ('Que diga tres cosas.', 'Que diga *tres cosas:*'),
   ('Uno: los días y horarios de las fiestas.', 'Días y horarios *de las fiestas.*'),
   ('Dos: cuándo vas a responder.', 'Cuándo *vas a responder.*'),
   ('Tres: cómo dejar un pedido para la vuelta.', 'Cómo dejar un pedido *para la vuelta.*'),
   d2('Listo. Ahora sí, felices fiestas.'), 'auto',
   lugar='vidriera', pant='ausencia', pp='reloj', objeto='torta', doc='24 de diciembre', grade='oro', cartel='CERRADO', titulo='24/12 · Mensajes'),
})
