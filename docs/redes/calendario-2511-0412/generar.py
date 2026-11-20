# Genera calendario.csv (25/11 al 04/12/2026) a partir de las ideas y del orden por día.
# Uso: python3 generar.py && python3 validar.py
import csv, os

AQUI = os.path.dirname(os.path.abspath(__file__))
DIAS = ['2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29', '2026-11-30',
        '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04']
HORAS_3 = ['08:30', '13:30', '20:30']
HORAS_4 = ['08:30', '13:30', '17:00', '20:30']
HORAS_HIST = ['09:30', '12:00', '18:30', '21:30']
DIAS_CARRUSEL = ['2026-11-25', '2026-11-27', '2026-11-29', '2026-12-01', '2026-12-03']

AP = 'aprobado (texto del 10/11)'
PJ = 'pendiente: revisión profesional'
PE = 'pendiente: revisión del equipo'
PD = 'condicionado: dato oficial publicado'

MARCAS = {'vita': 'VITA', 'cob': 'Coberturas', 'autos': 'Autos', 'mkt': 'Kocos Marketing'}

SERIES = {
    'V1': 'El minuto después', 'V2': 'Antes de firmar',
    'C1': 'Tu recibo explicado', 'C2': 'La carta', 'C3': 'Lo que dijo la Corte',
    'A1': 'El ticket del 0 km', 'A2': 'Revisá esto al retirar',
    'K1': 'El celular que no para', 'K2': 'Antes / después',
}
# Reasignación de series según el análisis de videos (20/11)
SERIE_DE = {
    ('vita', 'culpa-mito'): 'V1', ('vita', 'culpa-error'): 'V1', ('vita', 'nunca-frases'): 'V1',
    ('vita', 'nunca-arreglo'): 'V1', ('vita', 'sin-seguro'): 'V1',
    ('vita', 'art-rechazo'): 'V2', ('vita', 'alta-dolor'): 'V2', ('vita', 'alta-comision'): 'V2', ('vita', 'firma'): 'V2',
    ('autos', 'retiro-chasis'): 'A2', ('autos', 'retiro-kit'): 'A2', ('autos', 'seguro'): 'A2',
    ('autos', 'documentacion'): 'A2', ('autos', 'garantia'): 'A2', ('autos', 'ruta'): 'A2',
}

# id: (serie, tema, idea, gancho A, gancho B, palabra, revisión, pregunta de encuesta, dato o paso)
I = {}
def idea(marca, iid, serie, tema, texto, ga, gb, kw, rev, preg, dato):
    serie = {'V3': 'V2', 'A2': 'A1'}.get(serie, serie)
    serie = SERIE_DE.get((marca, iid), serie)
    I[(marca, iid)] = dict(serie=serie, tema=tema, idea=texto, ga=ga, gb=gb, kw=kw, rev=rev, preg=preg, dato=dato)

# ---------- VITA ----------
v = 'vita'
idea(v, 'trayecto-casa', 'V1', 'trayecto', 'Choque yendo al trabajo: también puede ser accidente laboral',
     'Trayecto: ibas a trabajar y te chocaron', 'ART: el choque fue camino al trabajo', 'TRAYECTO', AP,
     '¿Sabías que un choque yendo al trabajo puede ser accidente laboral? Sí / No',
     'Si pasó en el trayecto habitual entre tu casa y el trabajo, también puede ser un accidente laboral.')
idea(v, 'art-trayecto', 'V1', 'trayecto', 'Qué hacer si el choque fue en el trayecto: empleador, ART y denuncia',
     'ART: ¿cubre el choque camino al trabajo?', '', 'TRAYECTO', AP,
     '¿Le avisarías a tu empleador si chocás yendo al trabajo? Sí / No',
     'Avisá a tu empleador y a la ART, hacé la denuncia del choque y guardá certificados y estudios.')
idea(v, 'culpa-mito', 'V2', 'culpa', 'Mito: «si fue culpa mía, la ART no me cubre»',
     'ART: «Fue culpa mía, no me cubre»', 'Accidente laboral: ¿y si te equivocaste vos?', 'CULPA', AP,
     '¿Si el accidente fue culpa tuya, la ART te cubre? Sí / No',
     'La ART cubre aunque te hayas equivocado. Quedan afuera el daño hecho a propósito y la fuerza mayor ajena al trabajo.')
idea(v, 'culpa-error', 'V2', 'culpa', 'Te equivocaste en el trabajo y te lastimaste: igual tenés cobertura',
     'Trabajo: un error tuyo no te deja sin ART', '', 'CULPA', AP,
     '¿Te lastimaste alguna vez trabajando? Sí / No',
     'El sistema de riesgos del trabajo cubre aunque hayas cometido un error.')
idea(v, 'choque-24h', 'V1', 'choque-pasos', 'Las primeras 24 horas después de un choque',
     'Choque: lo que hacés en 24 h importa', 'Choque: 3 cosas antes de irte del lugar', 'CHOQUE', AP,
     '¿Sabés qué hacer en las primeras 24 h después de un choque? Sí / Más o menos',
     'Fotos del lugar y de los autos, datos y seguro del otro conductor, y aviso a tu seguro dentro de los 3 días.')
idea(v, 'choque-fiestas', 'V1', 'choque-pasos', 'Fiestas: si chocás, lo primero no es discutir',
     'Fiestas: chocaste, no discutas. Hacé esto', '', 'CHOQUE', AP,
     '¿En las fiestas manejás más que el resto del año? Sí / No',
     'Si te lastimaste, andá a la guardia y guardá el certificado: después lo vas a necesitar.')
idea(v, 'nunca-frases', 'V2', 'nunca', 'Después de un choque, nunca digas esto',
     'Choque: nunca digas esto', 'Choque: 3 frases que te pueden jugar en contra', 'NUNCA', AP,
     '¿Alguna vez dijiste «estoy bien, no fue nada» después de un choque? Sí / No',
     'Nunca digas «fue mi culpa», «estoy bien, no fue nada» ni «arreglemos acá».')
idea(v, 'nunca-arreglo', 'V2', 'nunca', '«Arreglemos acá»: por qué no aceptar arreglos de palabra',
     'Choque: «arreglemos acá» no es un arreglo', '', 'NUNCA', AP,
     '¿Arreglarías de palabra con el otro conductor? Sí / No',
     'Pedí los datos del otro conductor, andá al médico aunque te sientas bien y no aceptes arreglos de palabra.')
idea(v, 'art-rechazo', 'V2', 'art-rechazo', 'La ART rechazó tu accidente: no es la última palabra',
     'ART: te rechazaron el accidente', 'ART: el rechazo no cierra todo', 'ART', AP,
     '¿Te rechazó la ART un accidente o enfermedad? Sí / No',
     'Pedí el rechazo por escrito, seguí atendiéndote, guardá todo y presentate en la Comisión Médica con abogado.')
idea(v, 'alta-dolor', 'V2', 'alta', 'Te dieron el alta y todavía te duele',
     'ART: te dieron el alta y te sigue doliendo', 'Alta médica: podés no estar de acuerdo', 'ALTA', AP,
     '¿Te dieron el alta antes de sentirte bien? Sí / No',
     'Podés no estar de acuerdo con el alta: pedila por escrito, seguí con tus estudios y presentate en la Comisión Médica con abogado.')
idea(v, 'alta-comision', 'V3', 'alta', 'Qué es la Comisión Médica y cuándo te toca ir',
     'ART: ¿qué es la Comisión Médica?', '', 'ALTA', PJ,
     '¿Sabés qué es la Comisión Médica? Sí / No', 'Explicación de la Comisión Médica (texto a revisar).')
idea(v, 'sin-seguro', 'V2', 'sin-seguro', 'Mito: «si el otro no tiene seguro, no puedo reclamar»',
     'Choque: el otro no tenía seguro', 'Sin seguro: igual hay a quién reclamar', 'SEGURO', AP,
     '¿Si el otro auto no tiene seguro, podés reclamar? Sí / No',
     'Que el otro no tenga seguro no te deja sin reclamo: responden el conductor y el dueño del vehículo.')
idea(v, 'firma', 'V2', 'firma', 'Te ofrecen plata rápido después del choque: ¿firmás o no?',
     'Choque: te ofrecen plata rápido', '¿Firmás o no? El acuerdo del seguro', 'FIRMA', AP,
     'Te ofrecen un acuerdo rápido después del choque. ¿Firmás? Sí / No',
     'Lo que firmás puede cerrar tu reclamo: pedilo por escrito, no firmes el mismo día y consultá antes.')
idea(v, 'danos', 'V1', 'danos', 'No pudiste trabajar por el choque: eso también se reclama',
     'Choque: los días sin trabajar también cuentan', '', 'DAÑOS', AP,
     '¿Sabías que los días sin trabajar también se reclaman? Sí / No',
     'Se reclaman el arreglo del auto, los gastos médicos y de traslado, y los días que no pudiste trabajar.')
idea(v, 'despido', 'V3', 'despido', 'Te despidieron: qué pedir y qué no firmar ese día',
     'Despido: no firmes nada hoy', 'Despido: antes de firmar, esto', 'DESPIDO', PJ,
     '¿Te hicieron firmar algo el día del despido? Sí / No', 'Qué pedir por escrito el día del despido (texto a revisar).')
idea(v, 'liquidacion', 'V3', 'liquidacion', 'Liquidación final: qué tiene que incluir',
     'Liquidación final: ¿te pagaron todo?', '', 'LIQUIDACION', PJ,
     '¿Revisaste tu liquidación final renglón por renglón? Sí / No', 'Conceptos de la liquidación final (texto a revisar).')
idea(v, 'aguinaldo-fecha', 'V3', 'aguinaldo', 'Aguinaldo de diciembre: hasta cuándo te lo tienen que pagar',
     'Aguinaldo: ¿cuándo vence el pago?', '', 'AGUINALDO', PJ,
     '¿Ya sabés cuándo cobrás el aguinaldo? Sí / No',
     'Vence el 18/12, con tolerancia de 4 días hábiles (fuente: Hacecuentas y Canal 26, 08/11/2026; a revisar).')
idea(v, 'aguinaldo-proporcional', 'V3', 'aguinaldo', 'Te fuiste en el año: el aguinaldo proporcional',
     'Aguinaldo: te fuiste antes de diciembre', '', 'AGUINALDO', PJ,
     '¿Cambiaste de trabajo este año? Sí / No', 'Aguinaldo proporcional al irte (texto a revisar).')
idea(v, 'no-registrado', 'V3', 'no-registrado', 'Trabajás sin registrar: qué podés hacer',
     'Trabajo en negro: no estás sin opciones', '', 'REGISTRO', PJ,
     '¿Trabajaste alguna vez sin recibo? Sí / No', 'Opciones si trabajás sin registrar (texto a revisar).')
idea(v, 'reforma', 'V3', 'reforma', 'Reforma laboral (Ley 27.802): qué cambió y qué se discute en la justicia',
     'Reforma laboral: qué cambió de verdad', '', 'REFORMA', PJ,
     '¿Entendés qué cambió con la reforma laboral? Sí / No',
     'Ley 27.802: cambia la base del art. 245 y crea fondos de cese; su constitucionalidad se discute (texto a revisar).')
idea(v, 'telegrama', 'V3', 'telegrama', 'Te llegó una carta documento del trabajo: qué no hacer',
     'Carta documento: no la ignores', '', 'TELEGRAMA', PJ,
     '¿Recibiste alguna vez una carta documento? Sí / No', 'Qué hacer con una carta documento laboral (texto a revisar).')
idea(v, 'certificado', 'V3', 'certificado', 'Te fuiste del trabajo: pedí tu certificado de trabajo',
     'Renuncia o despido: pedí este papel', '', 'CERTIFICADO', PJ,
     '¿Te dieron el certificado de trabajo cuando te fuiste? Sí / No', 'Certificado de trabajo (texto a revisar).')
idea(v, 'penal-citacion', 'V2', 'penal', 'Te llegó una citación penal: qué no hacer antes de hablar con un abogado',
     'Penal: te llegó una citación', 'Citación penal: no vayas solo', 'PENAL', PJ,
     '¿Sabés qué hacer si te llega una citación penal? Sí / No', 'Pasos ante una citación penal (texto a revisar).')
idea(v, 'penal-lesiones', 'V1', 'penal-transito', 'Choque con heridos: además del reclamo, puede haber causa penal',
     'Choque con heridos: puede haber causa penal', '', 'PENAL', PJ,
     '¿Sabías que un choque con heridos puede abrir una causa penal? Sí / No', 'Choque con lesiones y causa penal (texto a revisar).')

# ---------- Coberturas ----------
c = 'cob'
idea(c, 'mono-aporte', 'C1', 'monotributo', 'Monotributo: una parte de tu cuota ya es obra social',
     'Monotributo: ya pagás obra social', 'Monotributo: mirá adónde va tu aporte', 'MONO', AP,
     '¿Sabés a qué obra social va tu aporte del monotributo? Sí / No',
     'Una parte de la cuota del monotributo va a una obra social.')
idea(c, 'mono-revisa', 'C1', 'monotributo', 'Monotributo: 3 cosas para revisar hoy',
     'Monotributo: 3 cosas que nadie te dijo', '', 'MONO', AP,
     '¿Sumaste a tu familia a tu obra social del monotributo? Sí / No',
     'Revisá a qué obra social va tu aporte, si sumaste a tu familia y qué cartilla tenés cerca.')
idea(c, 'recibo-3', 'C1', 'aportes', 'Este 3 % sale de tu sueldo todos los meses',
     'Recibo de sueldo: este 3 % es tuyo', 'Recibo: buscá esta línea', 'APORTES', AP,
     '¿Sabías que el 3 % de tu sueldo va a tu obra social? Sí / No',
     'Si trabajás en relación de dependencia, el 3 % de tu sueldo va a tu obra social. Y la podés elegir.')
idea(c, 'recibo-elegir', 'C1', 'aportes', 'Tu obra social la podés elegir: qué mirar antes',
     'Obra social: la podés elegir', '', 'APORTES', AP,
     '¿Elegiste vos tu obra social? Sí / No',
     'Antes de elegir, mirá la cartilla cerca de tu casa, qué cubre y si podés sumar a tu familia.')
idea(c, 'aumento-comparar', 'C2', 'aumento', 'Te llegó el aviso de aumento: antes de pagar, compará',
     'Prepaga: te llegó el aumento', 'Prepaga: antes de pagar el aumento', 'COMPARAR', AP,
     '¿Te aumentó la prepaga este mes? Sí / No',
     'Antes de pagar, compará: qué plan tenés, qué usás de verdad y qué opciones hay para tu edad y tu zona.')
idea(c, 'aumento-dic', 'C2', 'aumento', 'Prepaga: el aumento de diciembre, con la fuente oficial',
     'Prepaga: el aumento de diciembre', '', 'COMPARAR', PD,
     '¿Ya te llegó el aviso del aumento de diciembre? Sí / No', 'Porcentaje oficial de diciembre (solo cuando esté publicado).')
idea(c, 'plan-uso', 'C2', 'plan-a-medida', '¿Pagás por cosas que no usás?',
     'Prepaga: ¿pagás por lo que no usás?', 'Plan: lo que usás de verdad', 'COMPARAR', AP,
     '¿Usás todo lo que cubre tu plan? Sí / No', 'Mirá qué usás de verdad antes de elegir un plan.')
idea(c, 'cambio-antes', 'C2', 'cambio-prepaga', '¿Te querés cambiar de prepaga? Antes, esto',
     'Cambio de prepaga: antes, esto', 'Prepaga nueva: 3 preguntas antes', 'CAMBIO', AP,
     '¿Pensaste en cambiarte de prepaga este año? Sí / No',
     'Antes de cambiarte, pedí la cartilla de tu zona, preguntá por las carencias y confirmá qué pasa con tus tratamientos.')
idea(c, 'cambio-tratamientos', 'C2', 'cambio-prepaga', 'Si te cambiás, ¿qué pasa con tus tratamientos?',
     'Cambio de prepaga: ¿y tu tratamiento?', '', 'CAMBIO', AP,
     '¿Estás en un tratamiento ahora? Sí / No', 'Confirmá qué pasa con tus tratamientos antes de cambiarte.')
idea(c, 'carencias', 'C2', 'carencias', 'Carencias: la pregunta que nadie hace antes de cambiarse',
     'Prepaga: ¿qué son las carencias?', 'Carencias: preguntalas antes de firmar', 'CAMBIO', AP,
     '¿Sabés qué son las carencias? Sí / No', 'Preguntá por las carencias antes de cambiarte.')
idea(c, 'opcion-anual', 'C2', 'opcion-obra-social', 'Podés cambiar de obra social una vez al año (monotributistas, de inmediato)',
     'Obra social: podés cambiarte una vez al año', 'Cambio de obra social: cuándo se puede', 'CAMBIO', PJ,
     '¿Sabías que podés cambiar de obra social una vez al año? Sí / No',
     'La opción de cambio se pide en Mi SSSalud una vez al año; monotributistas, de inmediato (iProfesional; a revisar).')
idea(c, 'opcion-tarda', 'C2', 'opcion-obra-social', 'Cambiarte de obra social tarda unos 3 meses: planificalo',
     'Obra social: el cambio no es inmediato', '', 'CAMBIO', PJ,
     '¿Cuánto creés que tarda el cambio de obra social? 1 mes / 3 meses',
     'Tarda unos 3 meses en hacerse efectivo y no se puede volver atrás (iProfesional; a revisar).')
idea(c, 'familia', 'C1', 'familia', '¿Te conviene sumar a tu familia a tu plan?',
     'Familia: ¿la sumás a tu plan?', 'Plan familiar: depende de 3 cosas', 'FAMILIA', AP,
     '¿Tu familia está en tu mismo plan? Sí / No',
     'Depende de la edad de cada uno, los aportes de cada uno y qué usa cada uno de verdad.')
idea(c, 'cartilla-guardia', 'C2', 'cartilla', 'Lo descubriste en la guardia: mirá la cartilla antes',
     'Cartilla: lo descubriste en la guardia', 'Guardia: ¿está en tu cartilla?', 'CARTILLA', AP,
     '¿Sabés cuál es la guardia de tu cartilla más cerca? Sí / No',
     'Antes de elegir por precio, mirá la guardia más cercana, los especialistas que usás y las farmacias adheridas.')
idea(c, 'cartilla-zona', 'C2', 'cartilla', 'Vacaciones o mudanza: tu cartilla en otra zona',
     'Cartilla: te vas de tu zona', '', 'CARTILLA', PJ,
     '¿Sabés qué te cubre fuera de tu zona? Sí / No', 'Cobertura fuera de la zona (texto a revisar).')
idea(c, 'preex', 'C2', 'preexistencia', 'Mito: «tengo una enfermedad previa, no me van a aceptar»',
     'Prepaga: «con preexistencia no me aceptan»', 'Preexistencia: lo que dice la ley', 'PLAN', AP,
     '¿Una enfermedad previa es motivo de rechazo? Sí / No',
     'Una preexistencia no puede ser motivo de rechazo. Lo que sí puede cambiar es el valor de la cuota.')
idea(c, '65', 'C2', '65', '¿Cumplís 65? Mirá tu antigüedad',
     '65 años: mirá tu antigüedad', 'Prepaga a los 65: lo que dice la ley', '65', AP,
     '¿Tenés más de 10 años en la misma prepaga? Sí / No',
     'Con más de 10 años en la misma prepaga, al cumplir 65 no te pueden aumentar por edad.')
idea(c, 'baja-27', 'C2', 'prepagas-baja', 'Tu prepaga se dio de baja: qué hacer para no quedarte sin cobertura',
     'Prepaga dada de baja: qué hacer', 'Baja de prepagas: revisá la tuya', 'BAJA', PJ,
     '¿Sabías que se dieron de baja 27 entidades este año? Sí / No',
     'La Superintendencia dio de baja 27 entidades en 2026; sus afiliados pueden pedir la opción de cambio (Cronista; a revisar).')
idea(c, 'aguinaldo-aportes', 'C1', 'aguinaldo', 'Aguinaldo: también lleva aportes a tu obra social',
     'Aguinaldo: mirá este descuento', '', 'APORTES', PJ,
     '¿Sabés qué descuentos tiene tu aguinaldo? Sí / No', 'Aportes sobre el aguinaldo (texto a revisar).')
idea(c, 'vacaciones', 'C2', 'vacaciones', 'Te vas de vacaciones: qué preguntarle a tu cobertura antes',
     'Vacaciones: ¿tu cobertura viaja con vos?', '', 'CARTILLA', PJ,
     '¿Le preguntaste a tu cobertura antes de viajar? Sí / No', 'Cobertura en viajes (texto a revisar).')
idea(c, 'derivar', 'C1', 'derivar', 'Derivar aportes: qué significa y cuándo conviene',
     'Aportes: ¿qué es derivarlos?', '', 'APORTES', PJ,
     '¿Sabés qué es derivar aportes? Sí / No', 'Derivación de aportes (texto a revisar).')
idea(c, 'fallo-corte', 'C3', 'fallo-corte', 'Lo que dijo la Corte el 20/11 sobre los aumentos de las prepagas',
     'Prepagas: lo que dijo la Corte', '', 'CORTE', PJ,
     '¿Te enteraste del fallo de la Corte sobre prepagas? Sí / No',
     'El 20/11 la Corte declaró inconstitucional la liberación de precios de las prepagas (La Nación; alcance a revisar).')
idea(c, 'reintegros', 'C2', 'reintegros', 'Pagaste una consulta: preguntá por el reintegro',
     'Reintegro: ¿lo pediste?', '', 'COMPARAR', PJ,
     '¿Pediste alguna vez un reintegro? Sí / No', 'Reintegros (texto a revisar).')

# ---------- Autos ----------
a = 'autos'
idea(a, 'usado-valor', 'A1', 'usado', 'Tu usado vale más si tenés esto',
     'Usado: así vale más', 'Tu usado como parte de pago', 'USADO', AP,
     '¿Vas a entregar tu usado para el 0 km? Sí / No',
     'Vale más con el service al día y sus comprobantes, los papeles en regla y sin deudas de patentes ni multas.')
idea(a, 'usado-papeles', 'A1', 'usado', 'Antes de entregar tu usado: papeles, patentes y multas',
     'Usado: revisá esto antes de entregarlo', '', 'USADO', AP,
     '¿Tenés al día patentes y multas? Sí / No', 'Papeles en regla y sin deudas de patentes ni multas.')
idea(a, 'voto-0km', 'A2', 'voto-0km-usado', '¿0 km o usado de 2 años?',
     '0 km o usado: ¿cuál elegís?', '¿0 km o usado de 2 años? Votá', '0KM', AP,
     '¿0 km o usado de 2 años? 0 km / Usado',
     'Depende de cuánto tenés hoy, cuánto podés pagar por mes y si tenés un usado para entregar.')
idea(a, 'voto-anticipo', 'A2', 'anticipo-cuota', '¿Anticipo grande o cuota baja?',
     'Anticipo o cuota: ¿cuál elegís?', 'Cuota baja o anticipo grande: votá', 'CUOTA', AP,
     '¿Anticipo grande o cuota baja? Anticipo / Cuota',
     'Definí la cuota que podés pagar sin ahogarte y armá el resto alrededor.')
idea(a, 'aguinaldo-anticipo', 'A1', 'anticipo-cuota', 'Cobraste el aguinaldo: ¿te alcanza para el anticipo?',
     'Aguinaldo: ¿anticipo para el 0 km?', '', 'CUOTA', AP,
     '¿Usarías el aguinaldo para el anticipo? Sí / No', 'Arrancá por la cuota que podés pagar y armá el resto alrededor.')
idea(a, 'plan-cuota', 'A1', 'plan-ahorro', '¿Por qué subió la cuota del plan de ahorro?',
     'Plan de ahorro: ¿por qué subió la cuota?', 'Plan: la cuota sigue al precio', 'PLAN', AP,
     '¿Te subió la cuota del plan este año? Sí / No',
     'La cuota se calcula sobre el precio actual del auto: si sube el modelo, sube la cuota.')
idea(a, 'plan-preguntas', 'A1', 'plan-ahorro', '3 preguntas antes de suscribir un plan de ahorro',
     'Plan de ahorro: preguntá esto antes', '', 'PLAN', AP,
     '¿Hiciste estas preguntas antes de tu plan? Sí / No',
     'Qué pasa si sube el precio, cómo y cuándo se adjudica y qué gastos se suman al retirar.')
idea(a, 'sorteo', 'A2', 'adjudicacion', 'Mito: «con el plan te dan el auto en la cuota 2, seguro»',
     'Plan: «te lo dan en la cuota 2»', 'Adjudicación: nadie te la garantiza', 'SORTEO', AP,
     '¿Te prometieron el auto en una cuota fija? Sí / No',
     'Se adjudica por sorteo o licitación: nadie te puede garantizar en qué cuota te toca.')
idea(a, 'adjudicacion', 'A1', 'adjudicacion', 'Cómo se adjudica un plan: sorteo y licitación, sin vueltas',
     'Plan de ahorro: sorteo o licitación', '', 'SORTEO', AP,
     '¿Sabés la diferencia entre sorteo y licitación? Sí / No', 'Se adjudica por sorteo o licitación.')
idea(a, 'lista', 'A1', 'llave-en-mano', 'Precio de lista no es precio final',
     '0 km: el precio de lista no es el final', 'Llave en mano: lo que se suma', 'LLAVE', AP,
     '¿Pediste alguna vez el precio llave en mano? Sí / No',
     'Al precio de lista se suman flete, formularios, patentamiento, sellos y seguro. Pedí el precio llave en mano.')
idea(a, 'lista-costos', 'A1', 'llave-en-mano', 'Flete, formularios, patentamiento y sellos: qué es cada uno',
     '0 km: 4 costos que no ves en la lista', '', 'LLAVE', AP,
     '¿Sabías que el flete se suma al precio? Sí / No', 'Flete, formularios y patentamiento, sellos y seguro.')
idea(a, 'blackfriday', 'A2', 'black-friday', 'Black Friday de autos: qué preguntar antes de entusiasmarte',
     'Black Friday 0 km: preguntá esto', '', 'LLAVE', PE,
     '¿Comprarías un 0 km en Black Friday? Sí / No', 'Pedí el precio llave en mano y la oferta por escrito (a revisar por el equipo).')
idea(a, 'retiro-chasis', 'A1', 'retiro', 'Retirás tu 0 km: antes de firmar, revisá',
     'Retiro del 0 km: revisá antes de firmar', 'Día del retiro: 3 controles', 'RETIRO', AP,
     '¿Revisarías el número de chasis el día del retiro? Sí / No',
     'Que el chasis coincida con los papeles, rayones o golpes, y manual, llave de repuesto y kit.')
idea(a, 'retiro-kit', 'A1', 'retiro', 'Lo que te tienen que dar con el 0 km',
     '0 km: no te vayas sin esto', '', 'RETIRO', AP,
     '¿Te dieron la llave de repuesto? Sí / No', 'Manual, llave de repuesto y kit.')
idea(a, 'dic-ene', 'A2', 'diciembre-enero', '¿Lo patentás en diciembre o esperás a enero?',
     '0 km: ¿diciembre o enero?', 'Patentar en enero: ¿conviene?', 'ENERO', PE,
     '¿Patentarías en diciembre o en enero? Diciembre / Enero',
     'Mucha gente espera a enero para que el auto figure con el año nuevo (iProfesional; a revisar por el equipo).')
idea(a, 'primer-0km', 'A1', 'primer-0km', 'Tu primer 0 km: 3 cosas antes de ir a la agencia',
     'Primer 0 km: antes de ir, esto', 'Primer 0 km: tu lista', '0KM', AP,
     '¿Es tu primer 0 km? Sí / No',
     'La cuota que podés pagar, el precio llave en mano y tu usado en regla.')
idea(a, 'seguro', 'A1', 'seguro', 'Sin seguro no salís de la agencia',
     '0 km: sin seguro no salís', 'Seguro: cotizalo antes del retiro', 'SEGURO', AP,
     '¿Cotizaste el seguro antes del retiro? Sí / No',
     'Sin seguro no podés circular. Cotizá con tiempo, mirá qué cubre y llevá la póliza el día del retiro.')
idea(a, 'prendario', 'A1', 'formas-de-pago', '¿Qué es un crédito prendario?',
     'Prendario: qué es, sin vueltas', '', 'PLAN', PE,
     '¿Sabés qué es un crédito prendario? Sí / No', 'Crédito prendario (texto a revisar por el equipo).')
idea(a, 'contado-plan', 'A2', 'formas-de-pago', '¿Contado, prendario o plan? De qué depende',
     'Contado, prendario o plan: ¿cuál?', '', 'PLAN', PE,
     '¿Cómo pagarías tu 0 km? Contado / Financiado', 'De qué depende cada forma de pago (a revisar por el equipo).')
idea(a, 'garantia', 'A1', 'garantia', 'Primer service del 0 km: no lo saltees',
     '0 km: el primer service importa', '', 'RETIRO', PE,
     '¿Hiciste el primer service a tiempo? Sí / No', 'Service y garantía (texto a revisar por el equipo).')
idea(a, 'hibrido', 'A2', 'hibrido', '¿0 km híbrido? Qué preguntar antes',
     'Híbrido: ¿te conviene?', '', '0KM', PE,
     '¿Comprarías un híbrido? Sí / No', 'Preguntas sobre híbridos (texto a revisar por el equipo).')
idea(a, 'documentacion', 'A1', 'documentacion', 'Los papeles que te llevás con el 0 km',
     '0 km: los papeles que te tienen que dar', '', 'RETIRO', PE,
     '¿Sabés qué papeles te dan con el 0 km? Sí / No', 'Documentación del retiro (texto a revisar por el equipo).')
idea(a, 'gastos-fijos', 'A1', 'gastos-fijos', 'El 0 km también tiene gastos fijos: seguro, patente, cochera',
     '0 km: los gastos que vienen después', '', 'CUOTA', PE,
     '¿Sumaste los gastos fijos a la cuota? Sí / No', 'Gastos fijos del auto (texto a revisar por el equipo).')
idea(a, 'ruta', 'A2', 'ruta', 'Primer viaje largo con tu 0 km: qué revisar antes de salir',
     '0 km: tu primer viaje a la ruta', '', 'RETIRO', PE,
     '¿Te vas de vacaciones en auto? Sí / No', 'Controles antes de un viaje largo (texto a revisar por el equipo).')
idea(a, 'patentamientos', 'A2', 'patentamientos', '0 km: así se vendió noviembre (ACARA)',
     '0 km: los más patentados de noviembre', '', '0KM', PD,
     '¿Adivinás cuál fue el más patentado? Sí / No', 'Ranking de ACARA de noviembre (solo cuando esté publicado).')

# ---------- Kocos Marketing ----------
k = 'mkt'
idea(k, 'bf-200', 'K1', 'orden-chats', 'Black Friday: 200 mensajes y nadie para contestar. Así se ordena',
     'Black Friday: 200 mensajes sin responder', 'Cyber Monday: tu WhatsApp, ordenado', 'ORDEN', AP,
     '¿Cuántos chats tenés sin responder hoy? Menos de 10 / Más de 10',
     'Etiquetá cada chat por etapa, armá respuestas rápidas y agendá cada seguimiento.')
idea(k, 'etiquetas', 'K2', 'orden-chats', 'Etiquetá cada chat por etapa',
     'WhatsApp: etiquetas que ordenan', '', 'ORDEN', AP,
     '¿Usás etiquetas en WhatsApp Business? Sí / No', 'Etiquetá cada chat por etapa.')
idea(k, 'consulta-2103', 'K1', 'consulta', 'Llegó una consulta a las 21:03',
     'WhatsApp: llegó una consulta a las 21:03', 'Consulta a la noche: ¿la respondés mañana?', 'CRM', AP,
     '¿Respondés consultas después de hora? Sí / No',
     'Una consulta que llega a la noche y se responde al otro día muchas veces ya compró en otro lado.')
idea(k, 'consulta-domingo', 'K1', 'consulta', 'Domingo 11:40: te escriben. ¿Contestás el lunes?',
     'WhatsApp: domingo, 11:40', '', 'CRM', AP,
     '¿Contestás los domingos? Sí / No', 'Responder rápido cambia el resultado.')
idea(k, 'precio', 'K1', 'precio', 'Te preguntan el precio: ¿qué respondés?',
     'Ventas: «¿precio?» ¿Qué respondés?', '«¿Precio?»: no contestes «por privado»', 'RESPUESTAS', AP,
     '¿Respondés el precio por privado? Sí / No',
     'Respondé con información y un siguiente paso concreto, no con un «por privado».')
idea(k, 'precio-antes', 'K2', 'precio', '«Por privado» contra una respuesta que avanza',
     'Antes y después: «¿precio?»', '', 'RESPUESTAS', AP,
     '¿Cuál responde mejor? A / B', 'Lista, turnos y un siguiente paso.')
idea(k, 'seguir-lopienso', 'K1', 'seguimiento', '«Lo pienso» no es un no',
     'Ventas: «lo pienso» no es un no', '«Lo pienso»: cuándo volver a escribir', 'SEGUIR', AP,
     '¿Volvés a escribir después de un «lo pienso»? Sí / No',
     'Hacé seguimiento a las 24 horas, a los 3 días y a la semana, con algo nuevo.')
idea(k, 'seguir-calendario', 'K2', 'seguimiento', 'Seguimiento: 24 h, 3 días y una semana',
     'Seguimiento: el calendario simple', '', 'SEGUIR', AP,
     '¿Tenés agendados tus seguimientos? Sí / No', 'A las 24 h, a los 3 días y a la semana.')
idea(k, 'web-lenta', 'K2', 'web', 'Tu web tarda en cargar. Y se van',
     'Web: tarda en cargar y se van', 'Web lenta: el costo invisible', 'WEB', AP,
     '¿Tu web carga en menos de 3 segundos? Sí / No',
     'Si tarda 3 segundos en vez de 1, sube un 32 % la probabilidad de que se vayan (Think with Google, 2017).')
idea(k, 'web-movil', 'K2', 'web', '¿Tu web se ve bien en el celular?',
     'Web: abrila en tu celu ahora', '', 'WEB', PE,
     '¿Revisaste tu web desde el celular? Sí / No', 'Web en el celular (texto a revisar por el equipo).')
idea(k, 'google-perfil', 'K2', 'google', 'Te buscan en Google y no aparecés',
     'Google: te buscan y no aparecés', 'Google: tu negocio, en 1 minuto', 'GOOGLE', AP,
     '¿Tu negocio aparece en Google Maps? Sí / No',
     'Perfil de empresa con horarios, fotos reales del local y WhatsApp y web enlazados.')
idea(k, 'google-fotos', 'K2', 'google', 'Fotos reales del local en Google',
     'Google: fotos reales, no de stock', '', 'GOOGLE', AP,
     '¿Tu perfil de Google tiene fotos reales? Sí / No', 'Fotos reales del local.')
idea(k, 'resp-rapidas', 'K2', 'respuestas-rapidas', 'Respuestas rápidas: 3 que necesitás hoy',
     'WhatsApp: 3 respuestas rápidas', 'Respuestas rápidas para fin de año', 'ORDEN', AP,
     '¿Usás respuestas rápidas? Sí / No', 'Armá respuestas rápidas para las preguntas de siempre.')
idea(k, 'link-bio', 'K2', 'link-bio', 'Black Friday: ¿adónde lleva el link de tu bio?',
     'Black Friday: tu link de bio, ¿adónde lleva?', 'Fiestas: revisá el link de tu bio', 'BIO', AP,
     '¿Revisaste el link de tu bio esta semana? Sí / No',
     'Una bio que vende dice qué hacés, para quién y dónde, y cómo te contactan.')
idea(k, 'horarios-ausencia', 'K1', 'ausencia', 'Mensaje de ausencia con los horarios de las fiestas',
     'Fiestas: tu mensaje de ausencia', 'Fiestas: avisá tus horarios', 'AUTO', AP,
     '¿Tenés mensaje de ausencia activado? Sí / No',
     'Mensaje de ausencia con horarios y respuestas a las preguntas de siempre.')
idea(k, 'cyber-ausencia', 'K1', 'ausencia', 'Cyber Monday a las 3 de la mañana: ¿quién responde?',
     'Cyber Monday, 3 a. m.: ¿quién responde?', '', 'AUTO', AP,
     '¿Te escriben de madrugada? Sí / No', 'Turnos o pedidos que no esperan a mañana.')
idea(k, 'api', 'K2', 'whatsapp-business', 'WhatsApp, Business o API: ¿cuál te conviene?',
     'WhatsApp, Business o API', 'WhatsApp: ¿te quedó chico?', 'API', AP,
     '¿Qué usás hoy? WhatsApp / Business', 'Business: perfil, catálogo, respuestas rápidas; la API: varias personas en el mismo número.')
idea(k, 'catalogo', 'K2', 'whatsapp-business', 'El catálogo de WhatsApp Business',
     'WhatsApp Business: armá tu catálogo', '', 'API', AP,
     '¿Tenés catálogo en WhatsApp? Sí / No', 'Perfil de empresa y catálogo.')
idea(k, 'checklist', 'K2', 'temporada', 'Checklist de diciembre: 5 cosas para que tu WhatsApp esté listo',
     'Diciembre: tu WhatsApp, listo en 5 pasos', '', 'CHECKLIST', PE,
     '¿Ya preparaste tu negocio para diciembre? Sí / No', 'Checklist de diciembre (texto a revisar por el equipo).')
idea(k, 'aguinaldo-ventas', 'K1', 'temporada', 'Aguinaldo: más consultas. ¿Quién las responde?',
     'Aguinaldo: más consultas, ¿estás listo?', '', 'CRM', PE,
     '¿Te escriben más en diciembre? Sí / No', 'Más consultas en diciembre (texto a revisar por el equipo).')
idea(k, 'resenas', 'K2', 'resenas', 'Reseñas en Google: pedíselas a tus clientes reales',
     'Google: ¿pedís reseñas?', '', 'GOOGLE', PE,
     '¿Le pedís reseñas a tus clientes? Sí / No', 'Reseñas de clientes reales, sin incentivos (texto a revisar por el equipo).')
idea(k, 'pedidos-fiestas', 'K2', 'pedidos', 'Fiestas: un formulario simple para tomar pedidos',
     'Fiestas: los pedidos, en un solo lugar', '', 'ORDEN', PE,
     '¿Tomás pedidos por WhatsApp? Sí / No', 'Formulario de pedidos (texto a revisar por el equipo).')
idea(k, 'mensajes-ig', 'K1', 'mensajes-ig', 'Mensajes de Instagram sin responder',
     'Instagram: mensajes que nadie vio', '', 'CRM', PE,
     '¿Revisás las solicitudes de mensajes? Sí / No', 'Solicitudes de mensajes en Instagram (texto a revisar por el equipo).')
idea(k, 'estados', 'K2', 'estados', 'Estados de WhatsApp: tu vidriera de fin de año',
     'WhatsApp: tus estados también venden', '', 'ORDEN', PE,
     '¿Publicás estados de WhatsApp? Sí / No', 'Estados de WhatsApp (texto a revisar por el equipo).')

# Orden por día. 'ACT:<respaldo>' = lugar de actualidad con la idea de respaldo.
ORDEN = {
 'vita': [
  ['trayecto-casa/A', 'culpa-mito/A', 'choque-24h/A'],
  ['nunca-frases/A', 'art-rechazo/A', 'alta-dolor/A'],
  ['choque-fiestas/A', 'art-trayecto/A', 'culpa-error/A'],
  ['despido/A', 'sin-seguro/A', 'firma/A'],
  ['penal-citacion/A', 'nunca-arreglo/A', 'danos/A'],
  ['trayecto-casa/B', 'culpa-mito/B', 'choque-24h/B'],
  ['aguinaldo-fecha/A', 'liquidacion/A', 'nunca-frases/B', 'art-rechazo/B'],
  ['aguinaldo-proporcional/A', 'no-registrado/A', 'alta-dolor/B', 'alta-comision/A'],
  ['despido/B', 'reforma/A', 'ACT:firma/B', 'penal-lesiones/A'],
  ['telegrama/A', 'penal-citacion/B', 'sin-seguro/B', 'certificado/A'],
 ],
 'cob': [
  ['mono-aporte/A', 'aumento-comparar/A', 'recibo-3/A'],
  ['cambio-antes/A', 'fallo-corte/A', 'plan-uso/A'],
  ['familia/A', 'cartilla-guardia/A', 'mono-revisa/A'],
  ['baja-27/A', 'carencias/A', 'opcion-anual/A'],
  ['preex/A', '65/A', 'cambio-tratamientos/A'],
  ['mono-aporte/B', 'aumento-comparar/B', 'recibo-3/B'],
  ['COND:aumento-dic/A>plan-uso/B', 'aguinaldo-aportes/A', 'cambio-antes/B', 'recibo-elegir/A'],
  ['familia/B', 'cartilla-guardia/B', 'vacaciones/A', 'opcion-tarda/A'],
  ['baja-27/B', 'carencias/B', 'derivar/A', 'opcion-anual/B'],
  ['preex/B', '65/B', 'ACT:reintegros/A', 'cartilla-zona/A'],
 ],
 'autos': [
  ['usado-valor/A', 'voto-0km/A', 'plan-cuota/A'],
  ['lista/A', 'retiro-chasis/A', 'voto-anticipo/A'],
  ['blackfriday/A', 'usado-papeles/A', 'plan-preguntas/A'],
  ['dic-ene/A', 'lista-costos/A', 'retiro-kit/A'],
  ['primer-0km/A', 'sorteo/A', 'seguro/A'],
  ['usado-valor/B', 'voto-0km/B', 'plan-cuota/B'],
  ['lista/B', 'retiro-chasis/B', 'voto-anticipo/B', 'aguinaldo-anticipo/A'],
  ['adjudicacion/A', 'prendario/A', 'garantia/A', 'hibrido/A'],
  ['COND:patentamientos/A>contado-plan/A', 'dic-ene/B', 'documentacion/A', 'gastos-fijos/A'],
  ['primer-0km/B', 'sorteo/B', 'seguro/B', 'ACT:ruta/A'],
 ],
 'mkt': [
  ['bf-200/A', 'consulta-2103/A', 'precio/A'],
  ['web-lenta/A', 'seguir-lopienso/A', 'google-perfil/A'],
  ['link-bio/A', 'consulta-domingo/A', 'resp-rapidas/A'],
  ['precio-antes/A', 'etiquetas/A', 'google-fotos/A'],
  ['seguir-calendario/A', 'api/A', 'horarios-ausencia/A'],
  ['bf-200/B', 'cyber-ausencia/A', 'consulta-2103/B'],
  ['precio/B', 'web-lenta/B', 'checklist/A', 'aguinaldo-ventas/A'],
  ['seguir-lopienso/B', 'google-perfil/B', 'catalogo/A', 'resenas/A'],
  ['resp-rapidas/B', 'link-bio/B', 'ACT:web-movil/A', 'pedidos-fiestas/A'],
  ['horarios-ausencia/B', 'mensajes-ig/A', 'api/B', 'estados/A'],
 ],
}

CARRUSELES = {
 'vita': [('choque-24h', 'Choque: los pasos de las primeras 24 h'), ('art-rechazo', 'ART rechazó tu accidente: qué hacer'),
          ('trayecto-casa', 'Trayecto: cuándo un choque es accidente laboral'), ('aguinaldo-fecha', 'Aguinaldo: fechas y qué revisar en tu recibo'),
          ('despido', 'Despido: qué pedir por escrito')],
 'cob': [('mono-revisa', 'Monotributo: 3 cosas para revisar'), ('cambio-antes', 'Antes de cambiarte de prepaga'),
         ('recibo-3', 'Tu recibo explicado: el 3 %'), ('aumento-comparar', 'Llegó el aumento: qué mirar antes de pagar'),
         ('baja-27', 'Tu prepaga se dio de baja: los pasos')],
 'autos': [('lista', 'Precio llave en mano: todo lo que se suma'), ('blackfriday', 'Black Friday 0 km: qué preguntar'),
           ('retiro-chasis', 'Retiro del 0 km: la lista de control'), ('usado-valor', 'Tu usado como parte de pago'),
           ('plan-preguntas', 'Plan de ahorro: 3 preguntas antes de firmar')],
 'mkt': [('bf-200', 'Black Friday: tu WhatsApp en 3 arreglos'), ('precio', 'Respuestas al precio que avanzan'),
         ('seguir-lopienso', 'Seguimiento: 24 h, 3 días, 1 semana'), ('checklist', 'Checklist de diciembre'),
         ('google-perfil', 'Perfil de Google en 5 pasos')],
}

# Referencias que justifican cada tema (rendimiento propio 10-19/11 o agenda externa)
REF = {
 ('vita', 'trayecto'): 'Propio: trayecto, 171 repr. prom. en reels de FB (1.º de VITA)',
 ('vita', 'culpa'): 'Propio: culpa, 116 repr. prom. en FB (2.º de VITA)',
 ('vita', 'choque-pasos'): 'Propio: primeras 24 h, 106 repr. prom. en FB (3.º de VITA)',
 ('vita', 'art-rechazo'): 'Propio: ART, 90 repr. prom. en FB',
 ('vita', 'nunca'): 'Propio: «nunca digas», la mejor retención de VITA (3,0 s)',
 ('vita', 'alta'): 'Propio: alta, 74 repr. prom. en FB',
 ('vita', 'sin-seguro'): 'Propio: tema flojo (38); una sola prueba con gancho nuevo',
 ('vita', 'firma'): 'Propio: tema flojo (23); una sola prueba con gancho nuevo',
 ('vita', 'danos'): 'Propio: tema flojo (27); una sola prueba con gancho nuevo',
 ('cob', 'monotributo'): 'Propio: monotributo, 71 repr. prom. y la mejor retención (3,0 s)',
 ('cob', 'cambio-prepaga'): 'Propio: cambio de prepaga, 59 repr. prom. en FB',
 ('cob', 'aportes'): 'Propio: recibo, 58 repr. prom. y 2,6 s de retención',
 ('cob', 'aumento'): 'Propio: aumento, 33 repr. prom.; agenda: aviso de diciembre',
 ('cob', 'plan-a-medida'): 'Propio: aumento/comparar (33); ángulo nuevo',
 ('cob', 'carencias'): 'Propio: derivado de «cambio» (59)',
 ('cob', 'familia'): 'Propio: tema flojo (17); una prueba con gancho nuevo',
 ('cob', 'cartilla'): 'Propio: tema flojo (12); una prueba con gancho nuevo',
 ('cob', 'preexistencia'): 'Propio: tema flojo (11); una prueba con gancho nuevo',
 ('cob', '65'): 'Propio: tema flojo (28); una prueba con gancho nuevo',
 ('autos', 'usado'): 'Propio: usado, 210 repr. prom. en FB (1.º de Autos)',
 ('autos', 'plan-ahorro'): 'Propio: plan, 180 repr. prom. en FB (2.º)',
 ('autos', 'anticipo-cuota'): 'Propio: anticipo, 161 repr. prom. en FB',
 ('autos', 'voto-0km-usado'): 'Propio: votación, 161 repr. prom. en FB',
 ('autos', 'retiro'): 'Propio: retiro, 158 repr. prom. en FB',
 ('autos', 'llave-en-mano'): 'Propio: lista/llave, 134 repr. prom. en FB',
 ('autos', 'primer-0km'): 'Propio: combina usado, anticipo y llave (los 3 mejores)',
 ('autos', 'adjudicacion'): 'Propio: sorteo, 66 repr. prom.; una prueba más',
 ('autos', 'seguro'): 'Propio: tema flojo (35); una prueba con gancho nuevo',
 ('mkt', 'consulta'): 'Propio: consulta, 27 repr. prom. (1.º de Kocos)',
 ('mkt', 'precio'): 'Propio: precio, 16 repr. prom. (2.º)',
 ('mkt', 'web'): 'Propio: web, 11 repr. prom. y 2,0 s de retención (3.º)',
 ('mkt', 'google'): 'Propio: Google, 9 repr. prom.',
 ('mkt', 'seguimiento'): 'Propio: seguimiento, 8 repr. prom.',
}
REF_AGENDA = {
 'choque-fiestas': 'Agenda: fiestas y más agresividad al volante (Luchemos por la Vida, vía Notife)',
 'blackfriday': 'Agenda: Black Friday 27/11', 'bf-200': 'Agenda: Black Friday 27/11 y Cyber Monday 30/11',
 'link-bio': 'Agenda: Black Friday 27/11', 'cyber-ausencia': 'Agenda: Cyber Monday 30/11',
 'aguinaldo-fecha': 'Agenda: aguinaldo, vence el 18/12', 'aguinaldo-proporcional': 'Agenda: aguinaldo',
 'aguinaldo-aportes': 'Agenda: aguinaldo', 'aguinaldo-anticipo': 'Agenda: aguinaldo', 'aguinaldo-ventas': 'Agenda: aguinaldo',
 'reforma': 'Agenda: Ley 27.802 en discusión judicial (La Gaceta, iProfesional)',
 'baja-27': 'Agenda: 27 entidades dadas de baja (Cronista)', 'aumento-dic': 'Agenda: aumento de prepagas de diciembre',
 'dic-ene': 'Agenda: diciembre flojo y patentamiento en enero (ACARA, iProfesional)',
 'patentamientos': 'Agenda: ranking de ACARA de noviembre', 'checklist': 'Agenda: diciembre (idea 10 de competencia)',
 'horarios-ausencia': 'Agenda: horarios de fiestas', 'vacaciones': 'Agenda: vacaciones',
 'fallo-corte': 'Agenda: fallo de la Corte del 20/11 (La Nación); noticia del día con más vistas del rubro',
 'opcion-anual': 'Agenda: opción de cambio (iProfesional)', 'opcion-tarda': 'Agenda: opción de cambio (iProfesional)',
}

def ref(marca, iid):
    t = I[(marca, iid)]['tema']
    if iid in REF_AGENDA:
        return REF_AGENDA[iid]
    if (marca, t) in REF:
        return REF[(marca, t)]
    if marca == 'vita':
        return 'Nuevo: laboral y penal sumados por la responsable (20/11)'
    return 'Nuevo: servicio de la marca, sin dato propio todavía'

def fila(fecha, hora, marca, redes, formato, iid, version, gancho, cierre, condicion='', idea_txt=None, revision=None):
    d = I[(marca, iid)]
    return dict(fecha=fecha, hora=hora, marca=MARCAS[marca], redes=redes, formato=formato,
                serie=SERIES[d['serie']], tema=d['tema'], idea_id=iid, idea=idea_txt or d['idea'],
                gancho=gancho, palabra=d['kw'], cierre=cierre, referencia=ref(marca, iid),
                revision=revision or d['rev'], version=version, condicion=condicion)

COND_EXTRA = {
 ('cob', 'fallo-corte', 'A'): 'Sale solo con revisión profesional del alcance del fallo antes del 25/11 a las 13:30; si no, va «Tu obra social la podés elegir» (recibo-elegir A) y el 01/12 a las 20:30 pasa a lugar de actualidad.',
 ('autos', 'blackfriday', 'A'): 'Sale con el visto bueno del equipo antes del 26/11; si no, se adelanta «Cómo se adjudica un plan» (adjudicacion A, aprobado) y el 02/12 a las 08:30 pasa a lugar de actualidad.',
}
REDES_REEL = 'IG + FB (TikTok y YouTube Shorts: condicional, cuando existan las cuentas)'
REDES_HIST = 'IG + FB'

def reels(marca):
    out = []
    for n, dia in enumerate(DIAS):
        horas = HORAS_3 if n < 6 else HORAS_4
        for hora, item in zip(horas, ORDEN[marca][n]):
            cond = ''
            if item.startswith('ACT:'):
                iid, ver = item[4:].split('/')
                cond = f'Lugar de actualidad: si hay una noticia del rubro con fuente en las 48 h previas, va esa pieza; si no, va esta.'
            elif item.startswith('COND:'):
                prin, resp = item[5:].split('>')
                iid, ver = prin.split('/')
                r_iid, r_ver = resp.split('/')
                cond = f'Solo con el dato oficial publicado; si no está 24 h antes, va «{I[(marca, r_iid)]["idea"]}» ({r_ver}).'
            else:
                iid, ver = item.split('/')
            if (marca, iid, ver) in COND_EXTRA:
                cond = COND_EXTRA[(marca, iid, ver)]
            d = I[(marca, iid)]
            if ver == 'X':  # respaldo: idea ya usada en A, versión B si pasaron 5 días
                ver = 'B'
            g = d['gb'] if ver == 'B' else d['ga']
            out.append(fila(dia, hora, marca, REDES_REEL, 'reel', iid, ver, g, f'Comentá «{d["kw"]}» y te respondemos', cond))
    return out

def historias(marca, reels_marca):
    out = []
    por_dia = {}
    for r in reels_marca:
        por_dia.setdefault(r['fecha'], []).append(r)
    for n, dia in enumerate(DIAS):
        rs = por_dia[dia]
        i1, i2, i3 = rs[0]['idea_id'], rs[1]['idea_id'], rs[-1]['idea_id']
        d1, d2, d3 = I[(marca, i1)], I[(marca, i2)], I[(marca, i3)]
        tipo18 = 'detrás de escena animado' if n % 2 else 'checklist'
        out.append(fila(dia, '09:30', marca, REDES_HIST, 'historia: encuesta', i1, 'única', d1['preg'],
                        'Sticker de encuesta; al día siguiente, historia con el resultado', idea_txt='Encuesta: ' + d1['preg']))
        out.append(fila(dia, '12:00', marca, REDES_HIST, 'historia: dato o mito', i2, 'única', d2['dato'],
                        f'Sticker de pregunta: «¿Te pasó?»', idea_txt='Dato: ' + d2['dato']))
        txt18 = (f'Detrás de escena: cómo se armó la escena animada de «{d3["idea"]}»' if tipo18 != 'checklist'
                 else f'Checklist: {d3["dato"]}')
        out.append(fila(dia, '18:30', marca, REDES_HIST, f'historia: {tipo18}', i3, 'única', txt18,
                        'Sticker de enlace a la landing con UTM', idea_txt=txt18))
        out.append(fila(dia, '21:30', marca, REDES_HIST, 'historia: respondé con PALABRA', i3, 'única',
                        f'{d3["idea"]}. ¿Te pasó? Respondé esta historia con «{d3["kw"]}»', f'Respondé con «{d3["kw"]}»',
                        idea_txt=f'Respondé con «{d3["kw"]}» (tema: {d3["idea"]})'))
    return out

def carruseles(marca):
    out = []
    for dia, (iid, titulo) in zip(DIAS_CARRUSEL, CARRUSELES[marca]):
        d = I[(marca, iid)]
        out.append(fila(dia, '11:00', marca, REDES_HIST, 'carrusel guía', iid, 'única', titulo,
                        f'Última lámina: «Guardalo y comentá «{d["kw"]}»»', idea_txt='Carrusel: ' + titulo))
    return out

COLS = ['fecha', 'hora', 'marca', 'redes', 'formato', 'serie', 'tema', 'idea_id', 'idea', 'gancho', 'palabra',
        'cierre', 'referencia', 'revision', 'version', 'condicion']

def main():
    filas = []
    for m in MARCAS:
        r = reels(m)
        filas += r + historias(m, r) + carruseles(m)
    filas.sort(key=lambda f: (f['fecha'], f['hora'], f['marca'], f['formato']))
    with open(os.path.join(AQUI, 'calendario.csv'), 'w', newline='', encoding='utf-8') as fh:
        w = csv.DictWriter(fh, fieldnames=COLS)
        w.writeheader()
        w.writerows(filas)
    print(f'{len(filas)} filas escritas en calendario.csv')

if __name__ == '__main__':
    main()
