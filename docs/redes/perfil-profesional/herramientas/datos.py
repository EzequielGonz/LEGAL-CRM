# Contenido del kit de perfil profesional de las 4 marcas (20/11/2026).
# Las afirmaciones jurídicas y de coberturas reutilizan textos aprobados por la responsable el 10/11
# (sin revisión profesional). Las nuevas se mantienen en términos generales.

CONTACTO_PASOS = lambda linea2: {'tipo': 'lista', 'titulo': 'Para escribirnos', 'num': True,
    'items': ['Tocá el enlace de esta historia.', linea2, 'Te respondemos por WhatsApp.'], 'slot': True}

MARCAS = {
 'vita': {
  'nombre': 'VITA Abogados', 'usuario': 'estudiojuridicovita', 'dominio': 'www.estudiojuridicovita.com',
  'campana': 'vita', 'logo': 'vita.png',
  'nombre_ig': 'VITA Abogados | Accidentes, ART y laboral',
  'categoria': 'Estudio jurídico',
  'bios': [
   "Estudio jurídico: accidentes de tránsito y ART, despidos e indemnizaciones, y penal.\nCABA, GBA y todo el país según el caso.\n↓ Escribinos por WhatsApp",
   "¿Te chocaron, te despidieron o tuviste un accidente de trabajo?\nAbogados en tránsito, ART, laboral y penal.\n↓ Contanos tu caso por WhatsApp"],
  'fb_intro': ["Estudio jurídico: accidentes de tránsito, reclamos a la ART, despidos e indemnizaciones, y penal.",
               "Estudio jurídico: tránsito, ART, despidos y penal. Te explicamos tus opciones con claridad."],
  'fb_desc': ["VITA Abogados acompaña a personas que tuvieron un choque o un accidente de trabajo, que discuten con la ART o con un seguro, que fueron despedidas o que necesitan un abogado penal. Te explicamos tus opciones con claridad y podés pedir que una abogada o un abogado del estudio revise tu caso. Accidentes de tránsito en CABA y GBA; accidentes laborales y ART en todo el país. Escribinos por WhatsApp desde el botón de la página.",
              "¿Te chocaron, tuviste un accidente de trabajo, te despidieron o tenés una causa penal? En VITA Abogados te escuchamos, te explicamos qué opciones hay y cómo seguir, sin vueltas ni promesas. Escribinos por WhatsApp: contanos qué pasó y cuándo."],
  'destacadas': [
   {'slug': 'empeza-aca', 'nombre': 'Empezá acá', 'icono': 'arrow', 'historias': [
     {'tipo': 'texto', 'titulo': 'Somos *VITA Abogados*', 'texto': 'Estudio jurídico que acompaña casos de accidentes, trabajo y penal. Te explicamos tus opciones con claridad.'},
     {'tipo': 'lista', 'titulo': 'Qué hacemos', 'items': ['Accidentes de tránsito en CABA y GBA', 'Accidentes de trabajo y reclamos a la ART, en todo el país', 'Despidos e indemnizaciones', 'Derecho penal']},
     {'tipo': 'texto', 'titulo': 'Cómo *seguir*', 'texto': 'Mirá las destacadas para entender tu situación. Cuando quieras, escribinos por WhatsApp.', 'slot': True}]},
   {'slug': 'choques', 'nombre': 'Choques', 'icono': 'car', 'historias': [
     {'tipo': 'texto', 'titulo': 'Te chocaron. Las primeras *24 horas* importan.', 'texto': 'Fotos, datos del otro conductor, aviso a tu seguro dentro de los 3 días y, si te lastimaste, guardia y certificado.'},
     {'tipo': 'texto', 'titulo': 'No pudiste trabajar por el choque. *Eso también se reclama.*', 'texto': 'Además del arreglo del auto, se reclaman los gastos médicos y de traslado, y los días que no pudiste trabajar.'},
     {'tipo': 'texto', 'titulo': '¿Firmás *o no?*', 'texto': 'El seguro del otro puede ofrecerte un acuerdo rápido. Lo que firmás puede cerrar tu reclamo: pedilo por escrito, no firmes el mismo día y consultá antes.'}]},
   {'slug': 'art', 'nombre': 'ART', 'icono': 'helmet', 'historias': [
     {'tipo': 'texto', 'titulo': 'La ART *rechazó* tu accidente.', 'texto': 'Todavía hay pasos: pedí el rechazo por escrito, seguí atendiéndote y presentate en la Comisión Médica con abogado.'},
     {'tipo': 'texto', 'titulo': '¿Te dieron el alta y *todavía te duele?*', 'texto': 'Podés no estar de acuerdo: pedila por escrito, seguí con tus estudios y presentate en la Comisión Médica con abogado.'},
     {'tipo': 'texto', 'titulo': 'Ibas a trabajar y *te chocaron.*', 'texto': 'Si fue en el trayecto habitual entre tu casa y el trabajo, también puede ser un accidente laboral. Avisá a tu empleador y a la ART, y guardá todo.'}]},
   {'slug': 'el-proceso', 'nombre': 'El proceso', 'icono': 'steps', 'historias': [
     {'tipo': 'lista', 'titulo': 'Cómo *trabajamos*', 'num': True, 'items': ['Nos escribís y nos contás qué pasó.', 'Una abogada o un abogado del estudio revisa tu caso.', 'Te explicamos tus opciones y cómo seguir.']},
     {'tipo': 'lista', 'titulo': 'Qué tener *a mano*', 'items': ['Fotos y datos de lo que pasó', 'Avisos, denuncias o telegramas', 'Certificados y estudios médicos, si los hay']}]},
   {'slug': 'mitos', 'nombre': 'Mitos', 'icono': 'mitos', 'historias': [
     {'tipo': 'mito', 'cita': 'Si el accidente fue culpa mía, la ART no me cubre.', 'veredicto': 'Falso.', 'texto': 'El sistema de riesgos del trabajo cubre aunque hayas cometido un error. Quedan afuera el daño hecho a propósito y la fuerza mayor ajena al trabajo.'},
     {'tipo': 'mito', 'cita': 'Si el otro no tiene seguro, no puedo reclamar.', 'veredicto': 'Falso.', 'texto': 'Que el otro auto no tenga seguro no te deja sin reclamo: responden el conductor y el dueño del vehículo.'}]},
   {'slug': 'contacto', 'nombre': 'Contacto', 'icono': 'chat', 'historias': [
     {'tipo': 'texto', 'titulo': 'Escribinos por *WhatsApp*', 'texto': 'Contanos en un mensaje qué pasó y cuándo. Te decimos cómo seguir.', 'slot': True},
     CONTACTO_PASOS('Contanos qué pasó y cuándo.')]},
  ],
  'reels': ['Ibas a trabajar y *te chocaron*', '¿Firmás *o no?*', 'Las primeras *24 horas* después de un choque',
            'La ART *rechazó* tu accidente', '«Fue mi culpa, la ART *no me cubre*»', '¿Te dieron el alta y *te sigue doliendo?*',
            'Te despidieron: *qué revisar*', 'El otro auto *no tenía seguro*', 'No pudiste trabajar: *eso se reclama*'],
 },
 'coberturas': {
  'nombre': 'Compara tu Obra Social', 'usuario': 'comparatuobrasocial', 'dominio': 'www.comparatuobrasocial.com',
  'campana': 'coberturas', 'logo': 'coberturas.png',
  'nombre_ig': 'Compara tu Obra Social | Prepagas',
  'categoria': 'Servicio de asesoramiento',
  'bios': [
   "Comparamos prepagas y obras sociales en CABA y AMBA.\nAportes, monotributo y grupo familiar, con asesoramiento.\n↓ Escribinos por WhatsApp",
   "¿Pagás mucho o no entendés tu cobertura?\nTe ayudamos a comparar prepagas y obras sociales en CABA y AMBA.\n↓ Consultanos por WhatsApp"],
  'fb_intro': ["Comparamos prepagas y obras sociales en CABA y AMBA, con asesoramiento personalizado.",
               "Te ayudamos a elegir prepaga u obra social: aportes, monotributo y grupo familiar."],
  'fb_desc': ["Compara tu Obra Social ayuda a asalariados, monotributistas y familias a comparar prepagas y obras sociales en CABA y AMBA: derivar aportes, sumar al grupo familiar y elegir un plan para tu edad y tu zona, con asesoramiento personalizado. Escribinos por WhatsApp desde el botón de la página.",
              "¿Te aumentó la cuota o no entendés qué cubre tu plan? Contanos tu situación por WhatsApp y un asesor te muestra las opciones para tu edad, tu trabajo y tu zona (CABA y AMBA)."],
  'destacadas': [
   {'slug': 'empeza-aca', 'nombre': 'Empezá acá', 'icono': 'arrow', 'historias': [
     {'tipo': 'texto', 'titulo': 'Somos *Compara tu Obra Social*', 'texto': 'Te ayudamos a comparar prepagas y obras sociales en CABA y AMBA, con asesoramiento personalizado.'},
     {'tipo': 'lista', 'titulo': 'Con qué *te ayudamos*', 'items': ['Comparar prepagas y obras sociales', 'Derivar tus aportes', 'Sumar a tu grupo familiar', 'Elegir un plan para tu edad y tu zona']},
     {'tipo': 'texto', 'titulo': 'Cómo *seguir*', 'texto': 'Mirá las destacadas y, cuando quieras, contanos tu situación por WhatsApp.', 'slot': True}]},
   {'slug': 'comparar', 'nombre': 'Comparar', 'icono': 'compare', 'historias': [
     {'tipo': 'texto', 'titulo': '¿Otra vez *aumentó?*', 'texto': 'Antes de pagar el aumento, compará: qué plan tenés, qué usás de verdad y qué opciones hay para tu edad y tu zona.'},
     {'tipo': 'texto', 'titulo': 'Lo descubriste *en la guardia.*', 'texto': 'Antes de elegir por precio, mirá la guardia más cercana, los especialistas que usás y las farmacias adheridas.'},
     {'tipo': 'texto', 'titulo': '¿Te querés cambiar? *Antes, esto.*', 'texto': 'Pedí la cartilla de tu zona, preguntá por las carencias y confirmá qué pasa con tus tratamientos en curso.'}]},
   {'slug': 'aportes', 'nombre': 'Aportes', 'icono': 'receipt', 'historias': [
     {'tipo': 'texto', 'titulo': 'Este *3 %* sale de tu sueldo.', 'texto': 'Si trabajás en relación de dependencia, el 3 % de tu sueldo va a tu obra social. Y la podés elegir.'},
     {'tipo': 'texto', 'titulo': 'Si sos monotributista, *ya pagás* obra social.', 'texto': 'Una parte de la cuota del monotributo va a una obra social. Revisá a cuál, si sumaste a tu familia y qué cartilla tenés cerca.'},
     {'tipo': 'texto', 'titulo': '¿Conviene sumar a *tu familia?*', 'texto': 'Puede convenir o no: depende de la edad, los aportes y lo que usa cada uno.'}]},
   {'slug': 'el-proceso', 'nombre': 'El proceso', 'icono': 'steps', 'historias': [
     {'tipo': 'lista', 'titulo': 'Cómo *trabajamos*', 'num': True, 'items': ['Nos contás tu edad, tu trabajo, tu zona y tu grupo familiar.', 'Comparamos opciones que se ajusten a lo que usás.', 'Un asesor te muestra las opciones y vos decidís.']},
     {'tipo': 'lista', 'titulo': 'Qué tener *a mano*', 'items': ['Tu último recibo de sueldo o tu constancia de monotributo', 'Tu cobertura actual', 'Las edades de quienes querés sumar']}]},
   {'slug': 'mitos', 'nombre': 'Mitos', 'icono': 'mitos', 'historias': [
     {'tipo': 'mito', 'cita': 'Tengo una enfermedad previa. No me van a aceptar.', 'veredicto': 'Falso.', 'texto': 'Por la ley de prepagas, una enfermedad preexistente no puede ser motivo de rechazo. Lo que sí puede cambiar es el valor de la cuota.'},
     {'tipo': 'mito', 'cita': 'Al cumplir 65 me van a aumentar por edad.', 'veredicto': 'No siempre.', 'texto': 'Si tenés más de 10 años en la misma prepaga, al cumplir 65 no te pueden aumentar por edad.'}]},
   {'slug': 'contacto', 'nombre': 'Contacto', 'icono': 'chat', 'historias': [
     {'tipo': 'texto', 'titulo': 'Escribinos por *WhatsApp*', 'texto': 'Contanos tu edad, si trabajás en relación de dependencia o sos monotributista, y tu zona.', 'slot': True},
     CONTACTO_PASOS('Contanos tu edad, tu trabajo y tu zona.')]},
  ],
  'reels': ['¿Otra vez *aumentó* tu prepaga?', 'Este *3 %* sale de tu sueldo', 'Monotributo: *ya pagás* obra social',
            'Mirá la cartilla *antes que el precio*', '¿Cumplís 65? *Mirá tu antigüedad*', 'Enfermedad previa: *¿te pueden rechazar?*',
            '¿Te querés cambiar? *Antes, esto*', '¿Conviene sumar a *tu familia?*', 'Tu recibo de sueldo, *explicado*'],
 },
 'autos': {
  'nombre': 'Automotores Kocos', 'usuario': 'autoskocos', 'dominio': 'www.autoskocos.com',
  'campana': 'autos', 'logo': 'autos.png',
  'nombre_ig': 'Automotores Kocos | 0 km',
  'categoria': 'Concesionaria de autos',
  'bios': [
   "Agencia multimarca de 0 km en CABA y AMBA.\nContado, prendario, plan de ahorro y tu usado como parte de pago.\n↓ Consultá por WhatsApp",
   "Tu próximo 0 km, con todo claro.\nMultimarca en CABA y AMBA: costos, trámites y formas de pago explicados.\n↓ Escribinos por WhatsApp"],
  'fb_intro': ["Agencia multimarca de 0 km en CABA y AMBA: contado, prendario, plan de ahorro y tu usado.",
               "Tu 0 km con todo claro: costos, trámites y formas de pago. CABA y AMBA."],
  'fb_desc': ["Automotores Kocos es una agencia multimarca de 0 km en CABA y AMBA. Podés comprar de contado, con crédito prendario, con plan de ahorro o entregando tu usado como parte de pago, con asesoramiento en cada paso. Pedí siempre el precio llave en mano. Escribinos por WhatsApp desde el botón de la página.",
              "¿Buscás tu primer 0 km o querés cambiar el auto? Te explicamos costos, trámites y formas de pago sin apurarte. Contanos qué auto buscás por WhatsApp."],
  'destacadas': [
   {'slug': 'empeza-aca', 'nombre': 'Empezá acá', 'icono': 'arrow', 'historias': [
     {'tipo': 'texto', 'titulo': 'Somos *Automotores Kocos*', 'texto': 'Agencia multimarca de 0 km en CABA y AMBA, con asesoramiento en cada paso.'},
     {'tipo': 'lista', 'titulo': 'Cómo podés *comprar*', 'items': ['Contado', 'Crédito prendario', 'Plan de ahorro', 'Tu usado como parte de pago']},
     {'tipo': 'texto', 'titulo': 'Cómo *seguir*', 'texto': 'Mirá las destacadas y, cuando quieras, contanos qué auto buscás por WhatsApp.', 'slot': True}]},
   {'slug': 'como-pagar', 'nombre': 'Cómo pagar', 'icono': 'wallet', 'historias': [
     {'tipo': 'texto', 'titulo': '¿Anticipo grande o *cuota baja?*', 'texto': 'Antes de elegir, definí la cuota que podés pagar sin ahogarte y armá el resto alrededor.'},
     {'tipo': 'texto', 'titulo': '¿Por qué subió *la cuota?*', 'texto': 'En un plan de ahorro, la cuota se calcula sobre el precio actual del auto: si sube el modelo, sube la cuota.'},
     {'tipo': 'mito', 'cita': 'Con el plan te dan el auto en la cuota 2, seguro.', 'veredicto': 'Falso.', 'texto': 'El auto se adjudica por sorteo o licitación: nadie te puede garantizar en qué cuota te toca.'}]},
   {'slug': 'tu-usado', 'nombre': 'Tu usado', 'icono': 'cycle', 'historias': [
     {'tipo': 'texto', 'titulo': 'Tu usado como *parte de pago.*', 'texto': 'Vale más con el service al día y sus comprobantes, los papeles en regla y sin deudas de patentes ni multas.'},
     {'tipo': 'texto', 'titulo': '¿0 km o *usado de 2 años?*', 'texto': 'Depende de cuánto tenés hoy, cuánto podés pagar por mes y si tenés un usado para entregar.'}]},
   {'slug': 'precio-final', 'nombre': 'Precio final', 'icono': 'tag', 'historias': [
     {'tipo': 'texto', 'titulo': 'Precio de lista *no es precio final.*', 'texto': 'En general se suman flete, formularios y patentamiento, sellos y seguro. Pedí siempre el precio llave en mano.'},
     {'tipo': 'texto', 'titulo': '¿Ya tenés *el seguro?*', 'texto': 'Sin seguro no podés circular. Cotizá con tiempo, mirá qué cubre de verdad y llevá la póliza el día del retiro.'}]},
   {'slug': 'el-retiro', 'nombre': 'El retiro', 'icono': 'key', 'historias': [
     {'tipo': 'lista', 'titulo': 'Antes de retirar, *revisá*', 'items': ['Que el chasis coincida con los papeles', 'Que no tenga rayones ni golpes', 'Manual, llave de repuesto y kit']},
     {'tipo': 'lista', 'titulo': 'Cómo *trabajamos*', 'num': True, 'items': ['Nos contás qué auto buscás y cómo querés pagar.', 'Te pasamos la información y el precio llave en mano.', 'Te asesoramos en los trámites hasta el retiro.']}]},
   {'slug': 'contacto', 'nombre': 'Contacto', 'icono': 'chat', 'historias': [
     {'tipo': 'texto', 'titulo': 'Escribinos por *WhatsApp*', 'texto': 'Contanos qué auto buscás, si tenés un usado para entregar y cómo querés pagar.', 'slot': True},
     CONTACTO_PASOS('Contanos qué auto buscás.')]},
  ],
  'reels': ['Tu usado como *parte de pago*', 'Precio de lista *no es precio final*', '¿Por qué subió *la cuota del plan?*',
            '¿Anticipo grande o *cuota baja?*', '¿0 km o *usado de 2 años?*', 'Retirás tu 0 km: *revisá esto*',
            'En el plan, el auto sale *por sorteo o licitación*', '¿Ya tenés *el seguro?*', '¿Cuál *elegís?*'],
 },
 'kocos': {
  'nombre': 'Kocos Marketing', 'usuario': 'kocosmkt', 'dominio': 'www.kocosmkt.com',
  'campana': 'kocos-marketing', 'logo': 'marketing.png',
  'nombre_ig': 'Kocos Marketing | Webs, CRM y WhatsApp',
  'categoria': 'Agencia de marketing',
  'bios': [
   "Webs, tiendas online, CRM y automatizaciones con WhatsApp para pymes y comercios.\nOrdenamos tus consultas y tus ventas.\n↓ Escribinos",
   "¿Vendés por WhatsApp y redes?\nArmamos tu web, tu CRM y respuestas automáticas para que no se te pierdan consultas.\n↓ Escribinos"],
  'fb_intro': ["Webs, tiendas online, CRM y automatizaciones con WhatsApp para pymes y comercios.",
               "Ordenamos las consultas y las ventas de tu negocio: web, CRM y WhatsApp."],
  'fb_desc': ["Kocos Marketing arma páginas web, tiendas online, CRM y automatizaciones con WhatsApp e IA para pymes y comercios que venden por WhatsApp y redes. También hacemos sistemas a medida y gestión de redes. Escribinos por WhatsApp desde el botón de la página y contanos cómo vendés hoy.",
              "¿Te llegan consultas que se pierden o se responden tarde? Ordenamos tu WhatsApp, tu web y tus seguimientos para que vendas con orden. Escribinos y contanos tu negocio."],
  'destacadas': [
   {'slug': 'empeza-aca', 'nombre': 'Empezá acá', 'icono': 'arrow', 'historias': [
     {'tipo': 'texto', 'titulo': 'Somos *Kocos Marketing*', 'texto': 'Webs, tiendas online, CRM y automatizaciones con WhatsApp para pymes y comercios.'},
     {'tipo': 'texto', 'titulo': 'Cómo *seguir*', 'texto': 'Mirá las destacadas y escribinos por WhatsApp para contarnos tu negocio.', 'slot': True}]},
   {'slug': 'servicios', 'nombre': 'Servicios', 'icono': 'grid', 'historias': [
     {'tipo': 'lista', 'titulo': 'Qué *hacemos*', 'items': ['Páginas web y tiendas online', 'CRM y WhatsApp ordenados', 'Automatizaciones con IA', 'Sistemas a medida y gestión de redes']},
     {'tipo': 'texto', 'titulo': 'Tu web tarda en cargar. *Y se van.*', 'texto': 'Si tu web tarda 3 segundos en vez de 1, aumenta un 32 % la probabilidad de que la gente se vaya.', 'fuente': 'Fuente: Think with Google, 2017.'}]},
   {'slug': 'el-proceso', 'nombre': 'El proceso', 'icono': 'steps', 'historias': [
     {'tipo': 'lista', 'titulo': 'Cómo *trabajamos*', 'num': True, 'items': ['Nos contás cómo vendés hoy.', 'Te proponemos qué ordenar primero.', 'Lo armamos y te mostramos cómo usarlo.']},
     {'tipo': 'lista', 'titulo': 'Qué nos *contás*', 'items': ['Cómo te llegan hoy las consultas', 'Qué vendés y a quién', 'Qué te gustaría que pase solo']}]},
   {'slug': 'antes-despues', 'nombre': 'Antes/después', 'icono': 'beforeafter', 'historias': [
     {'tipo': 'ad', 'titulo': 'Una bio, *antes y después*', 'antes': 'Panadería artesanal. Consultas por privado.', 'despues': 'Panadería artesanal en Palermo. Pedidos del día por WhatsApp, de lunes a sábado.'},
     {'tipo': 'ad', 'titulo': 'Una respuesta, *antes y después*', 'antes': 'Hola, sí, tenemos. Pasá.', 'despues': '¡Hola! Sí, tenemos. Abrimos de 8 a 20. ¿Querés que te lo reservemos para hoy?'}]},
   {'slug': 'arreglos', 'nombre': 'Arreglos', 'icono': 'wrench', 'historias': [
     {'tipo': 'texto', 'titulo': '47 chats *sin responder.*', 'texto': 'Etiquetá cada chat por etapa, armá respuestas rápidas y agendá cada seguimiento.'},
     {'tipo': 'texto', 'titulo': 'Tu negocio duerme. *Tus clientes, no.*', 'texto': 'Mensaje de ausencia con horarios, respuestas a las preguntas de siempre y turnos o pedidos que no esperan a mañana.'},
     {'tipo': 'texto', 'titulo': 'Llegó una consulta *a las 21:03.*', 'texto': 'Una consulta que llega a la noche y se responde al otro día muchas veces ya compró en otro lado.'}]},
   {'slug': 'contacto', 'nombre': 'Contacto', 'icono': 'chat', 'historias': [
     {'tipo': 'texto', 'titulo': 'Escribinos por *WhatsApp*', 'texto': 'Contanos qué vendés y cómo te llegan hoy las consultas.', 'slot': True},
     CONTACTO_PASOS('Contanos qué vendés.')]},
  ],
  'reels': ['Llegó una consulta *a las 21:03*', 'Tu bio tiene *3 segundos*', '47 chats *sin responder*',
            'Tu web tarda en cargar. *Y se van.*', 'Tu negocio duerme. *Tus clientes, no.*', 'Una bio, *antes y después*',
            'Etiquetá cada chat *por etapa*', 'Un mensaje de ausencia *que trabaja*', 'El seguimiento *que no hiciste*'],
 },
}
