# Guiones de los reels de prueba. Cada escena trae `segs`: frases de voz en orden.
# Los elementos de la escena aparecen cuando empieza su frase (seg).
# *texto* = palabra de acento. Las afirmaciones llevan `fuente` y quedan para revisión profesional.
import json, os
R = {}

# ---------------- VITA ----------------
R['vita-firmas'] = dict(marca='vita', estilo='C', palabra='FIRMA', escenas=[
  dict(tipo='notif', fondo='oscuro', app='Aseguradora · Siniestros', icono='banco', msg='Necesitamos tu firma hoy para cerrar el reclamo.',
       titulo='¿Firmás *o no?*', segs=['Te chocaron, y el seguro te escribe esto.', '¿Firmás, o no?']),
  dict(tipo='voto', fondo='oscuro', pregunta='¿Firmás?', opciones=['Sí', 'No'], nota='Comentá tu respuesta antes de ver la mía',
       segs=['Comentá sí o no, antes de ver la respuesta.']),
  dict(tipo='titulo', fondo='oscuro', titulo='*Todavía* no.', sub='Lo que firmás puede cerrar tu reclamo. Si después aparece una lesión, quizás ya no puedas pedir más.',
       segs=['Todavía no.', 'Lo que firmás puede cerrar tu reclamo. Si después aparece una lesión, quizás ya no puedas pedir más.']),
  dict(tipo='lista', fondo='claro', titulo='Antes de firmar', items=['Pedí la propuesta por escrito', 'No firmes el mismo día', 'Consultá con un abogado'],
       segs=['Antes de firmar:', 'pedí la propuesta por escrito,', 'no firmes el mismo día,', 'y consultá con un abogado.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien maneja todos los días', segs=['Escribinos «firma» por WhatsApp. El botón está en el perfil.']),
], revision='Abogada o abogado de VITA')

R['vita-art'] = dict(marca='vita', estilo='B', palabra='ART', escenas=[
  dict(tipo='objeto', objeto='carta', fondo='oscuro', titulo='La ART *rechazó* tu accidente.', sello='RECHAZADO', remite='ART · Gerencia de Siniestros',
       segs=['La ART rechazó tu accidente.', 'Y te llega esta carta.']),
  dict(tipo='titulo', fondo='oscuro', titulo='No es la *última palabra.*', segs=['No es la última palabra.']),
  dict(tipo='lista', fondo='claro', titulo='Qué podés hacer', items=['Pedí el rechazo por escrito', 'Seguí atendiéndote y guardá todo', 'Presentate en la Comisión Médica, con abogado'],
       segs=['Qué podés hacer:', 'pedí el rechazo por escrito,', 'seguí atendiéndote y guardá todo,', 'y presentate en la Comisión Médica, con abogado.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien trabaja en relación de dependencia', segs=['Escribinos «ART» por WhatsApp. El botón está en el perfil.']),
], fuente='Ley 27.348 (Comisiones Médicas, patrocinio letrado obligatorio)', revision='Abogada o abogado de VITA')

R['vita-trayecto'] = dict(marca='vita', estilo='A', palabra='TRAYECTO', escenas=[
  dict(tipo='titulo', fondo='claro', titulo='Ibas a trabajar y *te chocaron.*', segs=['Ibas a trabajar, y te chocaron.']),
  dict(tipo='titulo', fondo='claro', titulo='También puede ser un *accidente laboral.*', sub='Si pasó en el trayecto habitual entre tu casa y el trabajo.',
       segs=['También puede ser un accidente laboral.', 'Si pasó en el trayecto habitual entre tu casa y el trabajo.']),
  dict(tipo='lista', fondo='claro', titulo='Lo que conviene hacer', items=['Avisá a tu empleador y a la ART', 'Hacé la denuncia del choque', 'Guardá certificados y estudios'],
       segs=['Lo que conviene hacer:', 'avisá a tu empleador y a la ART,', 'hacé la denuncia del choque,', 'y guardá certificados y estudios.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien viaja todos los días al trabajo', segs=['Escribinos «trayecto» por WhatsApp. El botón está en el perfil.']),
], fuente='Ley 24.557, art. 6 (accidente in itinere)', revision='Abogada o abogado de VITA')

R['vita-sin-seguro'] = dict(marca='vita', estilo='B', palabra='SEGURO', escenas=[
  dict(tipo='sello', fondo='claro', cita='«Si el otro no tiene seguro, no puedo reclamar.»', sello='FALSO',
       segs=['Si el otro no tiene seguro, no puedo reclamar.', 'Falso.']),
  dict(tipo='titulo', fondo='oscuro', titulo='Podés reclamarle al *conductor* y al *dueño* del auto.', sub='Responden por los daños aunque no tengan seguro.',
       segs=['Podés reclamarle al conductor, y al dueño del auto.', 'Responden por los daños, aunque no tengan seguro.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien le chocaron el auto', segs=['Escribinos «seguro» por WhatsApp. El botón está en el perfil.']),
], fuente='Código Civil y Comercial, arts. 1757, 1758 y 1769', revision='Abogada o abogado de VITA')

# ---------------- COBERTURAS ----------------
R['cob-recibo'] = dict(marca='cob', estilo='B', palabra='APORTES', escenas=[
  dict(tipo='objeto', objeto='recibo', fondo='claro', titulo='Este *3 %* sale de tu sueldo todos los meses.',
       lineas=[['Sueldo bruto', ''], ['Jubilación', '11 %'], ['Ley 19.032 (PAMI)', '3 %'], ['Obra social', '3 %']],
       segs=['Este tres por ciento sale de tu sueldo todos los meses.']),
  dict(tipo='titulo', fondo='oscuro', titulo='Va a tu obra social. *Y la podés elegir.*', segs=['Va a tu obra social.', 'Y la podés elegir.']),
  dict(tipo='lista', fondo='claro', titulo='Antes de elegir, mirá', items=['Cartilla cerca de tu casa', 'Qué cubre y qué no', 'Si podés sumar a tu familia'],
       segs=['Antes de elegir, mirá:', 'la cartilla cerca de tu casa,', 'qué cubre y qué no,', 'y si podés sumar a tu familia.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien cobra en blanco', segs=['Escribinos «aportes» por WhatsApp. El botón está en el perfil.']),
], fuente='Ley 23.660 (aporte 3 %); Ley 24.241 (11 %); Ley 19.032 (3 %); Decreto 504/98 (libre elección)', revision='Asesor de Compara tu Obra Social')

R['cob-preexistencia'] = dict(marca='cob', estilo='B', palabra='PLAN', escenas=[
  dict(tipo='sello', fondo='claro', cita='«Tengo una enfermedad previa. No me van a aceptar.»', sello='FALSO', segs=['Tengo una enfermedad previa. No me van a aceptar.', 'Falso.']),
  dict(tipo='titulo', fondo='oscuro', titulo='Una preexistencia *no puede* ser motivo de rechazo.', sub='Lo dice la ley de prepagas. Lo que sí puede cambiar es el valor de la cuota.',
       segs=['Una preexistencia no puede ser motivo de rechazo.', 'Lo dice la ley de prepagas. Lo que sí puede cambiar es el valor de la cuota.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien se quedó sin cobertura', segs=['Escribinos «plan» por WhatsApp. El botón está en el perfil.']),
], fuente='Ley 26.682, art. 10', revision='Asesor de Compara tu Obra Social')

R['cob-aumento'] = dict(marca='cob', estilo='C', palabra='COMPARAR', escenas=[
  dict(tipo='notif', fondo='oscuro', app='Tu prepaga', icono='salud', msg='Tu cuota se actualiza este mes.', titulo='¿Otra vez *aumentó?*',
       segs=['Otra vez llegó el aviso.', '¿Aumentó de nuevo?']),
  dict(tipo='titulo', fondo='claro', titulo='Antes de pagar, *compará.*', segs=['Antes de pagar, compará.']),
  dict(tipo='lista', fondo='claro', titulo='Tres cosas para mirar', items=['Qué plan tenés hoy', 'Qué usás de verdad', 'Qué opciones hay para tu edad y tu zona'],
       segs=['Tres cosas para mirar:', 'qué plan tenés hoy,', 'qué usás de verdad,', 'y qué opciones hay para tu edad y tu zona.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien paga la prepaga en casa', segs=['Escribinos «comparar» por WhatsApp. El botón está en el perfil.']),
], revision='Asesor de Compara tu Obra Social')

# ---------------- AUTOS ----------------
R['autos-lista'] = dict(marca='autos', estilo='B', palabra='LLAVE', escenas=[
  dict(tipo='objeto', objeto='etiqueta', fondo='oscuro', titulo='Precio de lista *no es* precio final.', etiqueta='PRECIO DE LISTA',
       items=['Flete', 'Formularios y patentamiento', 'Sellos', 'Seguro'],
       segs=['El precio de lista no es el precio final.', 'En general se suman: flete, formularios y patentamiento, sellos y seguro.']),
  dict(tipo='titulo', fondo='oscuro', titulo='Pedí el precio *llave en mano.*', sub='Todo lo que pagás hasta que te llevás el auto.',
       segs=['Pedí el precio llave en mano.', 'Todo lo que pagás hasta que te llevás el auto.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien está por comprar un 0 km', segs=['Escribinos «llave» por WhatsApp. El botón está en el perfil.']),
], revision='Automotores Kocos')

R['autos-plan'] = dict(marca='autos', estilo='C', palabra='PLAN', escenas=[
  dict(tipo='notif', fondo='oscuro', app='Plan de ahorro', icono='auto', msg='Tu cuota de este mes cambió.', titulo='¿Por qué *subió* la cuota?',
       segs=['Te llega esto del plan de ahorro.', '¿Por qué subió la cuota?']),
  dict(tipo='titulo', fondo='oscuro', titulo='Se calcula sobre el *precio actual* del auto.', sub='Si sube el precio del modelo, sube la cuota.',
       segs=['Porque se calcula sobre el precio actual del auto.', 'Si sube el precio del modelo, sube la cuota.']),
  dict(tipo='lista', fondo='claro', titulo='Antes de suscribir, preguntá', items=['Qué pasa si sube el precio', 'Cómo y cuándo se adjudica', 'Qué gastos se suman al retirar'],
       segs=['Antes de suscribir, preguntá:', 'qué pasa si sube el precio,', 'cómo y cuándo se adjudica,', 'y qué gastos se suman al retirar.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien está pagando un plan', segs=['Escribinos «plan» por WhatsApp. El botón está en el perfil.']),
], revision='Automotores Kocos')

R['autos-voto'] = dict(marca='autos', estilo='A', palabra='0KM', escenas=[
  dict(tipo='titulo', fondo='oscuro', titulo='¿0 km o usado *de 2 años?*', segs=['¿Cero kilómetro, o usado de dos años?']),
  dict(tipo='voto', fondo='oscuro', pregunta='¿Cuál elegís?', opciones=['0 km', 'Usado'], nota='Comentá antes de ver la respuesta', segs=['Comentá cuál elegís, antes de ver la respuesta.']),
  dict(tipo='lista', fondo='claro', titulo='Depende de tres cosas', items=['Cuánto tenés hoy', 'Cuánto podés pagar por mes', 'Si tenés un usado para entregar'],
       segs=['Depende de tres cosas:', 'cuánto tenés hoy,', 'cuánto podés pagar por mes,', 'y si tenés un usado para entregar.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien está por cambiar el auto', segs=['Escribinos «cero ka eme» por WhatsApp. El botón está en el perfil.']),
], revision='Automotores Kocos')

# ---------------- MARKETING ----------------
R['mkt-consulta'] = dict(marca='mkt', estilo='C', palabra='CRM', escenas=[
  dict(tipo='notif', fondo='oscuro', app='Consulta nueva · 21:03', icono='chat', msg='Hola, ¿tienen disponible? Lo necesito hoy.', titulo='Llegó una consulta *a las 21:03.*',
       segs=['Llegó una consulta a las veintiuno y tres.']),
  dict(tipo='chat', fondo='oscuro', contacto='Cliente nuevo', burbujas=[
       dict(lado='in', txt='Hola, ¿tienen disponible? Lo necesito hoy.', hora='21:03'),
       dict(lado='dia', txt='Al otro día'),
       dict(lado='out', txt='¡Hola! Sí, ¿seguís interesado?', hora='10:47'),
       dict(lado='in', txt='Ya compré en otro lado, gracias 👍', hora='10:52')],
       segs=['La respondiste al otro día.', 'Ya había comprado en otro lado.']),
  dict(tipo='dato', fondo='claro', numero=7, sufijo='×', titulo='más chances de avanzar con un cliente si respondés en la primera hora.', fuente='Harvard Business Review, 2011',
       segs=['Responder en la primera hora multiplica por siete las chances de avanzar con un cliente.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien atiende el WhatsApp del negocio', segs=['Escribinos «CRM» por WhatsApp. El botón está en el perfil.']),
], fuente='Oldroyd, McElheran y Elkington, «The Short Life of Online Sales Leads», Harvard Business Review, marzo 2011', revision='Kocos Marketing')

R['mkt-bio'] = dict(marca='mkt', estilo='A', palabra='BIO', escenas=[
  dict(tipo='titulo', fondo='claro', titulo='Tu bio tiene *3 segundos.*', segs=['Tu bio tiene tres segundos.']),
  dict(tipo='compara', fondo='claro', antes='Bienvenidos a nuestra cuenta ✨ Calidad y compromiso', despues='Uñas esculpidas en Palermo. Turnos por WhatsApp 👇',
       nota='Ejemplo ilustrativo', segs=['Esta no dice nada.', 'Esta dice qué hacés, dónde, y cómo pedir turno.']),
  dict(tipo='lista', fondo='oscuro', titulo='Una bio que vende dice', items=['Qué hacés', 'Para quién y dónde', 'Cómo te contactan'],
       segs=['Una bio que vende dice:', 'qué hacés,', 'para quién y dónde,', 'y cómo te contactan.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien maneja la cuenta del negocio', segs=['Escribinos «bio» por WhatsApp. El botón está en el perfil.']),
], revision='Kocos Marketing')

R['mkt-chats'] = dict(marca='mkt', estilo='B', palabra='ORDEN', escenas=[
  dict(tipo='objeto', objeto='celular', fondo='oscuro', titulo='*47* chats sin responder.', segs=['Cuarenta y siete chats sin responder.']),
  dict(tipo='titulo', fondo='claro', titulo='Tu WhatsApp no es *un CRM.*', sub='Pero lo podés ordenar hoy.', segs=['Tu WhatsApp no es un CRM.', 'Pero lo podés ordenar hoy.']),
  dict(tipo='lista', fondo='oscuro', titulo='Tres arreglos de hoy', items=['Etiquetá cada chat por etapa', 'Armá respuestas rápidas', 'Agendá cada seguimiento'],
       segs=['Tres arreglos de hoy:', 'etiquetá cada chat por etapa,', 'armá respuestas rápidas,', 'y agendá cada seguimiento.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien tiene el WhatsApp explotado', segs=['Escribinos «orden» por WhatsApp. El botón está en el perfil.']),
], revision='Kocos Marketing')


# ================= Guiones nuevos (calendario de 15 días) =================
R['vita-24h'] = dict(marca='vita', estilo='A', palabra='CHOQUE', escenas=[
  dict(tipo='titulo', fondo='claro', titulo='Te chocaron. *Las primeras 24 horas* importan.', segs=['Te chocaron.', 'Las primeras veinticuatro horas importan.']),
  dict(tipo='lista', fondo='claro', titulo='Qué hacer', items=['Sacá fotos del lugar y de los autos', 'Pedí datos y seguro del otro conductor', 'Avisá a tu seguro dentro de los 3 días'],
       segs=['Qué hacer:', 'sacá fotos del lugar y de los autos,', 'pedí datos y seguro del otro conductor,', 'y avisá a tu seguro dentro de los tres días.']),
  dict(tipo='titulo', fondo='oscuro', titulo='Si te lastimaste, *andá a la guardia.*', sub='Y guardá el certificado: después lo vas a necesitar.', segs=['Si te lastimaste, andá a la guardia.', 'Y guardá el certificado: después lo vas a necesitar.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Guardalo para cuando lo necesites', segs=['Escribinos «choque» por WhatsApp. El botón está en el perfil.']),
], fuente='Ley 17.418, art. 46 (aviso del siniestro en 3 días)', revision='Abogada o abogado de VITA')

R['vita-culpa'] = dict(marca='vita', estilo='B', palabra='CULPA', escenas=[
  dict(tipo='sello', fondo='claro', cita='«Si el accidente fue culpa mía, la ART no me cubre.»', sello='FALSO', segs=['Si el accidente fue culpa mía, la ART no me cubre.', 'Falso.']),
  dict(tipo='titulo', fondo='oscuro', titulo='La ART cubre *aunque te hayas equivocado.*', sub='Solo quedan afuera el daño hecho a propósito y la fuerza mayor ajena al trabajo.',
       segs=['La ART cubre, aunque te hayas equivocado.', 'Solo quedan afuera el daño hecho a propósito y la fuerza mayor ajena al trabajo.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien trabaja con máquinas o en la calle', segs=['Escribinos «culpa» por WhatsApp. El botón está en el perfil.']),
], fuente='Ley 24.557, art. 6, inc. 3', revision='Abogada o abogado de VITA')

R['vita-danos'] = dict(marca='vita', estilo='A', palabra='DAÑOS', escenas=[
  dict(tipo='titulo', fondo='oscuro', titulo='No pudiste trabajar por el choque. *Eso también se reclama.*', segs=['No pudiste trabajar por el choque.', 'Eso también se reclama.']),
  dict(tipo='lista', fondo='claro', titulo='Qué se puede reclamar', items=['El arreglo del auto', 'Gastos médicos y de traslado', 'Los días que no pudiste trabajar'],
       segs=['Qué se puede reclamar:', 'el arreglo del auto,', 'los gastos médicos y de traslado,', 'y los días que no pudiste trabajar.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien está sin trabajar por un choque', segs=['Escribinos «daños» por WhatsApp. El botón está en el perfil.']),
], fuente='Código Civil y Comercial, art. 1738', revision='Abogada o abogado de VITA')

R['vita-alta'] = dict(marca='vita', estilo='C', palabra='ALTA', escenas=[
  dict(tipo='notif', fondo='oscuro', app='ART · Prestaciones', icono='salud', msg='Le informamos que recibió el alta médica.', titulo='¿Y si *todavía te duele?*',
       segs=['Te llega el alta de la ART.', '¿Y si todavía te duele?']),
  dict(tipo='titulo', fondo='oscuro', titulo='Podés *no estar de acuerdo* con el alta.', segs=['Podés no estar de acuerdo con el alta.']),
  dict(tipo='lista', fondo='claro', titulo='Qué hacer', items=['Pedí el alta por escrito', 'Seguí con tus estudios y certificados', 'Presentate en la Comisión Médica, con abogado'],
       segs=['Qué hacer:', 'pedí el alta por escrito,', 'seguí con tus estudios y certificados,', 'y presentate en la Comisión Médica, con abogado.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien está con la ART', segs=['Escribinos «alta» por WhatsApp. El botón está en el perfil.']),
], fuente='Ley 27.348 (divergencias ante Comisión Médica)', revision='Abogada o abogado de VITA')

R['cob-mono'] = dict(marca='cob', estilo='A', palabra='MONO', escenas=[
  dict(tipo='titulo', fondo='claro', titulo='Si sos monotributista, *ya pagás obra social.*', sub='Una parte de tu cuota mensual va ahí.', segs=['Si sos monotributista, ya pagás obra social.', 'Una parte de tu cuota mensual va ahí.']),
  dict(tipo='lista', fondo='claro', titulo='Revisá tres cosas', items=['A qué obra social va tu aporte', 'Si sumaste a tu familia', 'Qué cartilla tenés cerca'],
       segs=['Revisá tres cosas:', 'a qué obra social va tu aporte,', 'si sumaste a tu familia,', 'y qué cartilla tenés cerca.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien es monotributista', segs=['Escribinos «mono» por WhatsApp. El botón está en el perfil.']),
], fuente='Ley 24.977 (Régimen Simplificado, aporte a obra social)', revision='Asesor de Compara tu Obra Social')

R['cob-65'] = dict(marca='cob', estilo='C', palabra='65', escenas=[
  dict(tipo='notif', fondo='oscuro', app='Tu prepaga', icono='salud', msg='Feliz cumpleaños. Tu cuota se actualiza por edad.', titulo='¿Cumplís 65? *Mirá tu antigüedad.*',
       segs=['Cumplís sesenta y cinco, y te llega esto.', 'Mirá tu antigüedad.']),
  dict(tipo='titulo', fondo='oscuro', titulo='Con más de 10 años en la misma prepaga, *no te pueden aumentar por edad.*', sub='Lo dice la ley de prepagas.',
       segs=['Con más de diez años en la misma prepaga, no te pueden aumentar por edad.', 'Lo dice la ley de prepagas.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a tus viejos', segs=['Escribinos «sesenta y cinco» por WhatsApp. El botón está en el perfil.']),
], fuente='Ley 26.682, art. 12', revision='Asesor de Compara tu Obra Social')

R['cob-cambio'] = dict(marca='cob', estilo='A', palabra='CAMBIO', escenas=[
  dict(tipo='titulo', fondo='oscuro', titulo='¿Te querés cambiar de prepaga? *Antes, esto.*', segs=['¿Te querés cambiar de prepaga?', 'Antes, mirá esto.']),
  dict(tipo='lista', fondo='claro', titulo='Antes de cambiarte', items=['Pedí la cartilla de tu zona', 'Preguntá por las carencias', 'Confirmá qué pasa con tus tratamientos'],
       segs=['Antes de cambiarte:', 'pedí la cartilla de tu zona,', 'preguntá por las carencias,', 'y confirmá qué pasa con tus tratamientos.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien está por cambiarse', segs=['Escribinos «cambio» por WhatsApp. El botón está en el perfil.']),
], revision='Asesor de Compara tu Obra Social')

R['cob-familia'] = dict(marca='cob', estilo='A', palabra='FAMILIA', escenas=[
  dict(tipo='titulo', fondo='claro', titulo='¿Te conviene sumar a tu familia *a tu plan?*', segs=['¿Te conviene sumar a tu familia a tu plan?']),
  dict(tipo='voto', fondo='oscuro', pregunta='¿Qué decís?', opciones=['Sí', 'Depende'], nota='Comentá antes de ver la respuesta', segs=['Comentá qué pensás, antes de ver la respuesta.']),
  dict(tipo='lista', fondo='claro', titulo='Depende de', items=['La edad de cada uno', 'Los aportes de cada uno', 'Qué usa cada uno de verdad'],
       segs=['Depende de:', 'la edad de cada uno,', 'los aportes de cada uno,', 'y qué usa cada uno de verdad.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a tu pareja', segs=['Escribinos «familia» por WhatsApp. El botón está en el perfil.']),
], revision='Asesor de Compara tu Obra Social')

R['cob-cartilla'] = dict(marca='cob', estilo='C', palabra='CARTILLA', escenas=[
  dict(tipo='notif', fondo='oscuro', app='Guardia', icono='salud', msg='Este plan no tiene prestador en tu zona.', titulo='Lo descubriste *en la guardia.*',
       segs=['Lo descubriste en la guardia.']),
  dict(tipo='lista', fondo='claro', titulo='Antes de elegir, mirá', items=['La guardia más cercana', 'Los especialistas que usás', 'Las farmacias adheridas'],
       segs=['Antes de elegir, mirá:', 'la guardia más cercana,', 'los especialistas que usás,', 'y las farmacias adheridas.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien eligió por precio', segs=['Escribinos «cartilla» por WhatsApp. El botón está en el perfil.']),
], revision='Asesor de Compara tu Obra Social')

R['autos-retiro'] = dict(marca='autos', estilo='A', palabra='RETIRO', escenas=[
  dict(tipo='titulo', fondo='oscuro', titulo='Retirás tu 0 km. *Antes de firmar, revisá.*', segs=['Retirás tu cero kilómetro.', 'Antes de firmar, revisá.']),
  dict(tipo='lista', fondo='claro', titulo='Qué revisar', items=['Que el chasis coincida con los papeles', 'Rayones o golpes', 'Manual, llave de repuesto y kit'],
       segs=['Qué revisar:', 'que el chasis coincida con los papeles,', 'rayones o golpes,', 'y el manual, la llave de repuesto y el kit.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien retira el auto esta semana', segs=['Escribinos «retiro» por WhatsApp. El botón está en el perfil.']),
], revision='Automotores Kocos')

R['autos-usado'] = dict(marca='autos', estilo='B', palabra='USADO', escenas=[
  dict(tipo='titulo', fondo='oscuro', titulo='Tu usado *como parte de pago.*', segs=['Tu usado, como parte de pago.']),
  dict(tipo='lista', fondo='claro', titulo='Lo que suma valor', items=['Service al día, con comprobantes', 'Papeles en regla', 'Sin deudas de patentes ni multas'],
       segs=['Lo que suma valor:', 'el service al día, con comprobantes,', 'los papeles en regla,', 'y no tener deudas de patentes ni multas.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien quiere cambiar el auto', segs=['Escribinos «usado» por WhatsApp. El botón está en el perfil.']),
], revision='Automotores Kocos')

R['autos-anticipo'] = dict(marca='autos', estilo='A', palabra='CUOTA', escenas=[
  dict(tipo='titulo', fondo='oscuro', titulo='¿Anticipo grande *o cuota baja?*', segs=['¿Anticipo grande, o cuota baja?']),
  dict(tipo='voto', fondo='oscuro', pregunta='¿Cuál elegís?', opciones=['Anticipo', 'Cuota'], nota='Comentá antes de ver la respuesta', segs=['Comentá cuál elegís, antes de ver la respuesta.']),
  dict(tipo='titulo', fondo='claro', titulo='La cuota que *podés pagar sin ahogarte.*', sub='Arrancá por ese número y armá el resto alrededor.', segs=['La cuota que podés pagar sin ahogarte.', 'Arrancá por ese número, y armá el resto alrededor.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien está sacando cuentas', segs=['Escribinos «cuota» por WhatsApp. El botón está en el perfil.']),
], revision='Automotores Kocos')

R['autos-sorteo'] = dict(marca='autos', estilo='B', palabra='SORTEO', escenas=[
  dict(tipo='sello', fondo='claro', cita='«Con el plan de ahorro te dan el auto en la cuota 2, seguro.»', sello='FALSO', segs=['Con el plan de ahorro te dan el auto en la cuota dos, seguro.', 'Falso.']),
  dict(tipo='titulo', fondo='oscuro', titulo='Se adjudica por *sorteo o licitación.*', sub='Nadie te puede garantizar en qué cuota te toca.', segs=['Se adjudica por sorteo o licitación.', 'Nadie te puede garantizar en qué cuota te toca.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien le prometieron el auto rápido', segs=['Escribinos «sorteo» por WhatsApp. El botón está en el perfil.']),
], revision='Automotores Kocos')

R['autos-seguro'] = dict(marca='autos', estilo='C', palabra='SEGURO', escenas=[
  dict(tipo='notif', fondo='oscuro', app='Entrega de unidades', icono='auto', msg='Mañana te entregamos tu 0 km.', titulo='¿Ya tenés *el seguro?*', segs=['Mañana te entregan el cero kilómetro.', '¿Ya tenés el seguro?']),
  dict(tipo='titulo', fondo='oscuro', titulo='Sin seguro *no podés circular.*', sub='Es obligatorio para salir con el auto.', segs=['Sin seguro, no podés circular.', 'Es obligatorio para salir con el auto.']),
  dict(tipo='lista', fondo='claro', titulo='Antes del retiro', items=['Cotizá con tiempo', 'Mirá qué cubre de verdad', 'Llevá la póliza ese día'],
       segs=['Antes del retiro:', 'cotizá con tiempo,', 'mirá qué cubre de verdad,', 'y llevá la póliza ese día.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien retira su 0 km', segs=['Escribinos «seguro» por WhatsApp. El botón está en el perfil.']),
], fuente='Ley 24.449, art. 68 (seguro obligatorio)', revision='Automotores Kocos')

R['mkt-precio'] = dict(marca='mkt', estilo='A', palabra='RESPUESTAS', escenas=[
  dict(tipo='titulo', fondo='claro', titulo='Te preguntan el precio. *¿Qué respondés?*', segs=['Te preguntan el precio.', '¿Qué respondés?']),
  dict(tipo='compara', fondo='claro', antes='Te paso por privado 😉', despues='¡Hola! Te mando la lista y los turnos libres de esta semana 👇', nota='Ejemplo ilustrativo',
       segs=['Esto enfría la consulta.', 'Esto la avanza: lista, turnos y un siguiente paso.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien responde los mensajes', segs=['Escribinos «respuestas» por WhatsApp. El botón está en el perfil.']),
], revision='Kocos Marketing')

R['mkt-web'] = dict(marca='mkt', estilo='B', palabra='WEB', escenas=[
  dict(tipo='titulo', fondo='oscuro', titulo='Tu web tarda en cargar. *Y se van.*', segs=['Tu web tarda en cargar.', 'Y se van.']),
  dict(tipo='dato', fondo='claro', numero=32, sufijo='%', titulo='más probabilidad de que se vayan si tarda 3 segundos en vez de 1.', fuente='Think with Google, 2017',
       segs=['Si tarda tres segundos en vez de uno, la probabilidad de que se vayan sube un treinta y dos por ciento.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien tiene la web del negocio', segs=['Escribinos «web» por WhatsApp. El botón está en el perfil.']),
], fuente='Think with Google, «Find out how you stack up to new industry benchmarks for mobile page speed», 2017', revision='Kocos Marketing')

R['mkt-ausencia'] = dict(marca='mkt', estilo='C', palabra='AUTO', escenas=[
  dict(tipo='notif', fondo='oscuro', app='Consulta nueva · 23:41', icono='chat', msg='¿Atienden mañana? Quiero reservar.', titulo='Tu negocio duerme. *Tus clientes, no.*',
       segs=['Tu negocio duerme.', 'Tus clientes, no.']),
  dict(tipo='lista', fondo='claro', titulo='Que conteste solo', items=['Mensaje de ausencia con horarios', 'Respuestas a las preguntas de siempre', 'Turnos o pedidos sin esperar'],
       segs=['Que conteste solo:', 'un mensaje de ausencia con horarios,', 'respuestas a las preguntas de siempre,', 'y turnos o pedidos sin esperar.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien contesta a la noche', segs=['Escribinos «auto» por WhatsApp. El botón está en el perfil.']),
], revision='Kocos Marketing')

R['mkt-seguir'] = dict(marca='mkt', estilo='A', palabra='SEGUIR', escenas=[
  dict(tipo='titulo', fondo='oscuro', titulo='«Lo pienso» *no es un no.*', segs=['Lo pienso, no es un no.']),
  dict(tipo='lista', fondo='claro', titulo='Hacé seguimiento', items=['A las 24 horas', 'A los 3 días', 'A la semana, con algo nuevo'],
       segs=['Hacé seguimiento:', 'a las veinticuatro horas,', 'a los tres días,', 'y a la semana, con algo nuevo.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien vende por WhatsApp', segs=['Escribinos «seguir» por WhatsApp. El botón está en el perfil.']),
], revision='Kocos Marketing')

R['mkt-google'] = dict(marca='mkt', estilo='A', palabra='GOOGLE', escenas=[
  dict(tipo='titulo', fondo='claro', titulo='Te buscan en Google *y no aparecés.*', segs=['Te buscan en Google, y no aparecés.']),
  dict(tipo='lista', fondo='oscuro', titulo='Arreglalo hoy', items=['Perfil de empresa con horarios', 'Fotos reales del local', 'WhatsApp y web enlazados'],
       segs=['Arreglalo hoy:', 'un perfil de empresa con horarios,', 'fotos reales del local,', 'y WhatsApp y web enlazados.']),
  dict(tipo='cierre', fondo='oscuro', enviar='Mandáselo a quien tiene un local', segs=['Escribinos «Google» por WhatsApp. El botón está en el perfil.']),
], revision='Kocos Marketing')

os.makedirs('reels', exist_ok=True)
for k, v in R.items():
    v['id'] = k
    json.dump(v, open(f'reels/{k}.json', 'w'), ensure_ascii=False, indent=1)
print(len(R), 'guiones')
