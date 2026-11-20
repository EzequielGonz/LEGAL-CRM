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
}
