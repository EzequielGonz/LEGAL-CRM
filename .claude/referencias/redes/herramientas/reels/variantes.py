# Variantes para reciclar sin producir de cero:
#   <id>-b : mismo episodio con otro gancho (cambia solo la primera escena)
#   <id>-c : versión corta (gancho + escena clave + cierre), solo si el original tiene 4 escenas o más
# y el texto de publicación de cada guion.
import json, glob, os, copy
GB = {  # id: (título con *acento*, voz, fondo)
 'vita-firmas': ('El seguro te apura *para firmar.*', 'El seguro te apura para firmar.', 'oscuro'),
 'vita-art': ('La ART te dijo que no. *Todavía podés hacer algo.*', 'La ART te dijo que no. Todavía podés hacer algo.', 'oscuro'),
 'vita-trayecto': ('Un choque yendo al trabajo *no es solo un choque.*', 'Un choque yendo al trabajo no es solo un choque.', 'claro'),
 'vita-sin-seguro': ('El otro conductor *no tenía seguro.*', 'El otro conductor no tenía seguro.', 'oscuro'),
 'vita-24h': ('Lo que hacés después del choque *cuenta.*', 'Lo que hacés después del choque, cuenta.', 'oscuro'),
 'vita-culpa': ('¿Fue un error tuyo? *La ART igual responde.*', '¿Fue un error tuyo? La ART igual responde.', 'claro'),
 'vita-danos': ('El choque te dejó *sin trabajar.*', 'El choque te dejó sin trabajar.', 'oscuro'),
 'vita-alta': ('Te dieron el alta *y seguís con dolor.*', 'Te dieron el alta, y seguís con dolor.', 'oscuro'),
 'cob-recibo': ('Mirá tu recibo de sueldo. *Esta línea es tuya.*', 'Mirá tu recibo de sueldo. Esta línea es tuya.', 'claro'),
 'cob-preexistencia': ('¿Te dijeron que *no te aceptan* por una enfermedad?', '¿Te dijeron que no te aceptan por una enfermedad?', 'oscuro'),
 'cob-aumento': ('Llegó otro aumento *de la prepaga.*', 'Llegó otro aumento de la prepaga.', 'claro'),
 'cob-mono': ('Monotributo: *tu cuota incluye obra social.*', 'Monotributo: tu cuota incluye obra social.', 'oscuro'),
 'cob-65': ('65 años *y aumento por edad.* ¿Corresponde?', 'Sesenta y cinco años, y aumento por edad. ¿Corresponde?', 'claro'),
 'cob-cambio': ('Cambiarte de prepaga *sin sorpresas.*', 'Cambiarte de prepaga, sin sorpresas.', 'claro'),
 'cob-familia': ('Tu familia en *un mismo plan.* ¿Conviene?', 'Tu familia en un mismo plan. ¿Conviene?', 'oscuro'),
 'cob-cartilla': ('La prepaga más barata *no siempre te sirve.*', 'La prepaga más barata no siempre te sirve.', 'claro'),
 'autos-lista': ('El precio que ves *no es el que pagás.*', 'El precio que ves, no es el que pagás.', 'oscuro'),
 'autos-plan': ('La cuota del plan *cambió otra vez.*', 'La cuota del plan cambió otra vez.', 'claro'),
 'autos-voto': ('La pregunta de siempre: *¿0 km o usado?*', 'La pregunta de siempre: ¿cero kilómetro, o usado?', 'claro'),
 'autos-retiro': ('El día que retirás el 0 km, *mirá esto.*', 'El día que retirás el cero kilómetro, mirá esto.', 'claro'),
 'autos-usado': ('Cuánto vale tu usado *depende de esto.*', 'Cuánto vale tu usado, depende de esto.', 'claro'),
 'autos-anticipo': ('Anticipo o cuota: *por dónde empezar.*', 'Anticipo o cuota: por dónde empezar.', 'claro'),
 'autos-sorteo': ('«Te lo entregan en la cuota 2.» *Ojo.*', 'Te lo entregan en la cuota dos. Ojo.', 'oscuro'),
 'autos-seguro': ('Te entregan el 0 km *mañana.*', 'Te entregan el cero kilómetro mañana.', 'claro'),
 'mkt-consulta': ('Respondiste al otro día. *Ya había comprado.*', 'Respondiste al otro día. Ya había comprado.', 'claro'),
 'mkt-bio': ('Tu bio no dice *qué hacés.*', 'Tu bio no dice qué hacés.', 'oscuro'),
 'mkt-chats': ('Tu WhatsApp *está explotado.*', 'Tu WhatsApp está explotado.', 'claro'),
 'mkt-precio': ('«Te paso por privado» *enfría la consulta.*', 'Te paso por privado, enfría la consulta.', 'oscuro'),
 'mkt-web': ('Cada segundo de carga *te cuesta visitas.*', 'Cada segundo de carga te cuesta visitas.', 'claro'),
 'mkt-ausencia': ('Son las 23:41 *y te escribieron.*', 'Son las once y cuarenta y uno de la noche, y te escribieron.', 'claro'),
 'mkt-seguir': ('Dijo «lo pienso». *¿Y vos qué hiciste?*', 'Dijo lo pienso. ¿Y vos qué hiciste?', 'claro'),
 'mkt-google': ('Tu local no aparece *en Google Maps.*', 'Tu local no aparece en Google Maps.', 'oscuro'),
 'vita-nunca': ('Lo que decís en la calle *puede jugarte en contra.*', 'Lo que decís en la calle puede jugarte en contra.', 'oscuro'),
 'mkt-api': ('¿Tu negocio necesita *la API de WhatsApp?*', '¿Tu negocio necesita la API de WhatsApp?', 'claro'),
}
# Ganchos D (09/11, del análisis de competencia): otra entrada para temas que ya funcionan.
GD = {
 'vita-firmas': ('¿Qué pasa si firmás *el acuerdo del seguro?*', '¿Qué pasa si firmás el acuerdo del seguro?', 'oscuro'),
 'cob-familia': ('¿Cuánto cuesta sumar *a tu pareja?*', '¿Cuánto cuesta sumar a tu pareja?', 'claro'),
 'autos-lista': ('El error más caro *al comprar un 0 km.*', 'El error más caro al comprar un cero kilómetro.', 'oscuro'),
}
CUERPO = {
 'vita-firmas': 'Después de un choque, el seguro del otro puede ofrecerte un acuerdo rápido. Lo que firmás puede cerrar tu reclamo: pedilo por escrito, no firmes el mismo día y consultá antes.',
 'vita-art': 'Si la ART rechazó tu accidente o enfermedad laboral, todavía hay pasos: pedí el rechazo por escrito, seguí atendiéndote y presentate en la Comisión Médica con abogado.',
 'vita-trayecto': 'Si el choque fue en el trayecto habitual entre tu casa y el trabajo, también puede ser un accidente laboral. Avisá a tu empleador y a la ART, y guardá todo.',
 'vita-sin-seguro': 'Que el otro auto no tenga seguro no te deja sin reclamo: responden el conductor y el dueño del vehículo.',
 'vita-24h': 'Fotos, datos del otro conductor, aviso a tu seguro dentro de los 3 días y, si te lastimaste, guardia y certificado. Guardalo para cuando lo necesites.',
 'vita-culpa': 'El sistema de riesgos del trabajo cubre aunque hayas cometido un error. Quedan afuera el daño hecho a propósito y la fuerza mayor ajena al trabajo.',
 'vita-danos': 'Además del arreglo del auto, se reclaman los gastos médicos y de traslado, y los días que no pudiste trabajar.',
 'vita-alta': 'Si te dieron el alta y seguís con dolor, podés no estar de acuerdo: pedila por escrito, seguí con tus estudios y presentate en la Comisión Médica con abogado.',
 'cob-recibo': 'Si trabajás en relación de dependencia, el 3 % de tu sueldo va a tu obra social. Y la podés elegir: mirá la cartilla, qué cubre y si podés sumar a tu familia.',
 'cob-preexistencia': 'Por la ley de prepagas, una enfermedad preexistente no puede ser motivo de rechazo. Lo que sí puede cambiar es el valor de la cuota.',
 'cob-aumento': 'Antes de pagar el aumento, compará: qué plan tenés, qué usás de verdad y qué opciones hay para tu edad y tu zona.',
 'cob-mono': 'Una parte de la cuota del monotributo va a una obra social. Revisá a cuál, si sumaste a tu familia y qué cartilla tenés cerca.',
 'cob-65': 'Si tenés más de 10 años en la misma prepaga, al cumplir 65 no te pueden aumentar por edad.',
 'cob-cambio': 'Antes de cambiarte, pedí la cartilla de tu zona, preguntá por las carencias y confirmá qué pasa con tus tratamientos en curso.',
 'cob-familia': 'Sumar a tu familia puede convenir o no: depende de la edad, los aportes y lo que usa cada uno.',
 'cob-cartilla': 'Antes de elegir por precio, mirá la guardia más cercana, los especialistas que usás y las farmacias adheridas.',
 'autos-lista': 'Al precio de lista, en general, se suman flete, formularios y patentamiento, sellos y seguro. Pedí siempre el precio llave en mano.',
 'autos-plan': 'En un plan de ahorro, la cuota se calcula sobre el precio actual del auto: si sube el modelo, sube la cuota.',
 'autos-voto': '¿0 km o usado de 2 años? Depende de cuánto tenés hoy, cuánto podés pagar por mes y si tenés un usado para entregar.',
 'autos-retiro': 'El día del retiro, revisá que el chasis coincida con los papeles, buscá rayones o golpes y pedí manual, llave de repuesto y kit.',
 'autos-usado': 'Tu usado vale más con el service al día y sus comprobantes, los papeles en regla y sin deudas de patentes ni multas.',
 'autos-anticipo': 'Antes de elegir entre anticipo y cuota, definí la cuota que podés pagar sin ahogarte y armá el resto alrededor.',
 'autos-sorteo': 'En un plan de ahorro, el auto se adjudica por sorteo o licitación: nadie te puede garantizar en qué cuota te toca.',
 'autos-seguro': 'Sin seguro no podés circular. Cotizá con tiempo, mirá qué cubre de verdad y llevá la póliza el día del retiro.',
 'mkt-consulta': 'Una consulta que llega a la noche y se responde al otro día muchas veces ya compró en otro lado. Responder rápido cambia el resultado.',
 'mkt-bio': 'Una bio que vende dice qué hacés, para quién y dónde, y cómo te contactan. Todo en 3 segundos.',
 'mkt-chats': 'Etiquetá cada chat por etapa, armá respuestas rápidas y agendá cada seguimiento. Tu WhatsApp, ordenado desde hoy.',
 'mkt-precio': 'Cuando te preguntan el precio, respondé con información y un siguiente paso concreto, no con un «por privado».',
 'mkt-web': 'Si tu web tarda 3 segundos en vez de 1, aumenta un 32 % la probabilidad de que la gente se vaya (Think with Google, 2017).',
 'mkt-ausencia': 'Mensaje de ausencia con horarios, respuestas a las preguntas de siempre y turnos o pedidos que no esperan a mañana.',
 'mkt-seguir': '«Lo pienso» no es un no: hacé seguimiento a las 24 horas, a los 3 días y a la semana, con algo nuevo.',
 'mkt-google': 'Perfil de empresa con horarios, fotos reales del local y WhatsApp y web enlazados: así te encuentran cuando te buscan.',
 'vita-nunca': 'Después de un choque, evitá decir que fue tu culpa, que estás bien o aceptar un arreglo de palabra. Pedí los datos del otro conductor y andá al médico aunque te sientas bien.',
 'mkt-api': 'WhatsApp Business alcanza si atendés vos: perfil de empresa, catálogo, respuestas rápidas y mensaje de ausencia. La API sirve cuando atienden varias personas, con CRM y automatizaciones, y tiene costo según los mensajes.',
}
TAGS = {'vita': '#accidentedetransito #ART #abogados #CABA #GBA', 'cob': '#prepagas #obrasocial #saludargentina #AMBA',
        'autos': '#0km #autos #plandeahorro #CABA', 'mkt': '#marketingdigital #whatsappbusiness #pymes #emprendedores'}
AVISO = {'vita': 'Información general: cada caso se analiza en particular.', 'cob': 'Información general: cada caso se analiza en particular.', 'autos': '', 'mkt': ''}
def plano(s): return s.replace('*', '')

textos = {}
for f in sorted(glob.glob('reels/*.json')):
    if f.endswith('.tl.json') or f[:-5].endswith(('-b', '-c', '-d')): continue
    g = json.load(open(f)); i = g['id']
    if i not in GB: continue
    t, v, fondo = GB[i]
    b = copy.deepcopy(g); b['id'] = i + '-b'
    b['escenas'][0] = dict(tipo='titulo', fondo=fondo, titulo=t, segs=[v])
    json.dump(b, open(f'reels/{i}-b.json', 'w'), ensure_ascii=False, indent=1)
    if len(g['escenas']) >= 4:
        c = copy.deepcopy(g); c['id'] = i + '-c'
        clave = next((e for e in g['escenas'][1:-1] if e['tipo'] == 'lista'), g['escenas'][-2])
        c['escenas'] = [g['escenas'][0], clave, g['escenas'][-1]]
        json.dump(c, open(f'reels/{i}-c.json', 'w'), ensure_ascii=False, indent=1)
    if i in GD:
        td, vd, fd = GD[i]
        dd = copy.deepcopy(g); dd['id'] = i + '-d'
        dd['escenas'][0] = dict(tipo='titulo', fondo=fd, titulo=td, segs=[vd])
        json.dump(dd, open(f'reels/{i}-d.json', 'w'), ensure_ascii=False, indent=1)
    gancho = plano(g['escenas'][0].get('titulo') or g['escenas'][0].get('cita') or t)
    partes = [gancho, CUERPO[i], f"Escribinos «{g['palabra']}» por WhatsApp: el botón está en el perfil."]
    if AVISO[g['marca']]: partes.append(AVISO[g['marca']])
    if any(e['tipo'] in ('notif', 'chat', 'compara') for e in g['escenas']): partes.append('Situación ilustrativa.')
    partes.append(TAGS[g['marca']])
    textos[i] = {'marca': g['marca'], 'palabra': g['palabra'], 'gancho': gancho, 'ganchoB': plano(t), 'texto': '\n\n'.join(partes)}
    if i in GD: textos[i]['ganchoD'] = plano(GD[i][0])
json.dump(textos, open('textos.json', 'w'), ensure_ascii=False, indent=1)
print(len(textos), 'textos;', len(glob.glob('reels/*-b.json')), 'variantes B;', len(glob.glob('reels/*-c.json')), 'versiones cortas')
