# Compara Tu Obra Social. Orden: 4 por día del 27/11 al 06/12. Ver vita.py para el formato.
def R(f, tema, base, gancho, voz, puntos, pj, lugar, escena, palabra, cierre, fuente=''):
    return dict(f=f, tema=tema, base=base, gancho=gancho, voz=voz, puntos=puntos, pj=pj, lugar=lugar,
                escena=escena, palabra=palabra, cierre=cierre, fuente=fuente)

REELS = [
# 27/11 ----------------------------------------------------------------
R('MITO', 'preexistencia', 'Mito: «tengo una enfermedad previa, no me van a aceptar»',
  '«Con una enfermedad previa no me aceptan.»',
  '«Tengo una enfermedad previa, ninguna prepaga me va a aceptar.» Falso. Por ley, una preexistencia no puede ser motivo de rechazo. '
  'Lo que sí puede cambiar es el valor de la cuota. Preguntá antes de firmar.',
  ['No pueden rechazarte por eso', 'Puede cambiar el valor de la cuota', 'Preguntá antes de firmar'],
  'Lucía', 'Departamento de Lucía en Caballito, frente a Parque Rivadavia',
  'La palabra «RECHAZADA» cae como un sello gigante sobre la solicitud de Lucía y rebota sin marcarla; la lupa menta muestra la letra chica.',
  'PLAN', 'Mandáselo a quien crea que no lo aceptan.', 'Ley 26.682, art. 10'),
R('VOS', 'aporte del 3 %', 'Este 3 % sale de tu sueldo todos los meses',
  'Mirá tu recibo: hay un 3 % que es tuyo.',
  'Agarrá tu recibo de sueldo. Hay una línea que casi nadie mira: el 3 % que va a tu obra social. '
  'Es tu plata. Uno: fijate a qué obra social va. Dos: mirá qué cartilla tenés cerca. Tres: preguntá si te conviene otra.',
  ['3 % de tu sueldo, todos los meses', '¿A qué obra social va?', '¿Qué cartilla tenés cerca?'],
  'Gabriel', 'Cocina de los Ferreyra en Villa Urquiza, fin de mes',
  'El recibo de Gabriel se agranda hasta ocupar la cocina; la línea del 3 % se ilumina en verde y la lupa menta la sigue como un tren.',
  'APORTES', 'Guardalo para tu próximo recibo.', 'Ley 23.660, art. 16, inc. b'),
R('NUM', 'sumar a un familiar a cargo', 'nuevo',
  'Sumás a tu mamá: ¿cuánto más aportás?',
  'Querés sumar a tu mamá, que está a tu cargo, a tu obra social. ¿Cuánto más aportás? ¿Cinco por ciento? ¿Diez? '
  'Uno coma cinco por ciento de tu sueldo por persona, si la Superintendencia lo autoriza. Preguntá los requisitos antes.',
  ['¿5 %? ¿10 %?', '1,5 % por persona a cargo', 'Con autorización: preguntá requisitos'],
  'Gabriel y Elsa', 'Living de Elsa en Villa Urquiza',
  'Tres fichas con «5 %», «10 %» y «1,5 %» giran en el aire; cae la de 1,5 % sobre la mesa de Elsa con un golpe suave.',
  'FAMILIA', 'Mandáselo a quien cuida a sus padres.', 'Ley 23.660, arts. 9 y 16'),
R('CARTAS', 'carencias al cambiarte', 'Carencias: la pregunta que nadie hace antes de cambiarse',
  'Antes de cambiarte de prepaga: tres cartas.',
  'Te querés cambiar de prepaga. Tres cartas. Carta uno: preguntá qué carencias tiene el plan nuevo. '
  'Carta dos: para lo que está en el Programa Médico Obligatorio no puede haber carencias. Carta tres: pedí todo por escrito.',
  ['Carta 1: ¿qué carencias tiene?', 'Carta 2: el PMO no tiene carencias', 'Carta 3: todo por escrito'],
  'Lucía', 'Café frente a Parque Rivadavia, Caballito',
  'Tres cartas verdes boca abajo sobre la mesa del café; Lucía las da vuelta con la lupa. La segunda brilla con «PMO».',
  'CAMBIO', 'Guardalo para cuando te cambies.', 'Ley 26.682, art. 10'),
# 28/11 ----------------------------------------------------------------
R('ESC', 'te quedás sin trabajo: cobertura', 'nuevo',
  'Lunes 9:00: te despiden. ¿Y la obra social?',
  'Lunes, nueve de la mañana. Te despiden. Lo primero que pensás: ¿me quedo sin obra social hoy? '
  'No. Si trabajaste más de tres meses seguidos, seguís cubierto tres meses más, sin aportar. Usá ese tiempo para elegir.',
  ['¿Me quedo sin cobertura hoy?', 'No: 3 meses más, sin aportar', 'Usá ese tiempo para elegir'],
  'Gabriel', 'Vereda de Av. Triunvirato, Villa Urquiza, lunes 9:00',
  'Gabriel sale con una caja; su credencial se apaga y enseguida se vuelve a encender con un contador «3 meses».',
  'TRABAJO', 'Mandáselo a quien se quedó sin trabajo.', 'Ley 23.660, art. 10, inc. a'),
R('CUAL', 'llega el aumento: cómo reaccionás', 'Te llegó el aviso de aumento: antes de pagar, compará',
  'Te llega el aumento de la prepaga. ¿Cuál sos?',
  'Te llega el aviso de aumento. Hay tres. El que paga sin mirar. El que se da de baja enojado, sin plan nuevo. '
  'Y el que compara: qué usa de verdad, qué cartilla tiene cerca y qué opciones hay. ¿Cuál sos?',
  ['El que paga sin mirar', 'El que se da de baja sin plan', 'El que compara'],
  'Tres siluetas (Vero es la tercera)', 'Mesa de los Ferreyra en Villa Urquiza',
  'Tres sobres llegan a la vez a tres casas en pantalla partida; en la tercera, Vero abre una planilla y las otras dos se apagan.',
  'COMPARAR', 'Mandáselo a quien siempre paga sin mirar.'),
R('ADV', 'declaración jurada de salud', 'nuevo',
  'Declaración jurada: no la llenes apurado.',
  'Te piden la declaración jurada de salud para entrar a la prepaga. No la llenes apurado. '
  'Uno: las preexistencias se establecen con lo que declarás ahí. Dos: contestá todo con la verdad. Tres: guardate una copia firmada.',
  ['Las preexistencias salen de ahí', 'Contestá todo con la verdad', 'Guardate una copia firmada'],
  'Elsa', 'Mesa del living de Elsa en Villa Urquiza',
  'El formulario se despliega como un acordeón infinito; Elsa frena el papel con la lupa y aparecen tres tildes verdes.',
  'DECLARACION', 'Guardalo para cuando te afilies.', 'Ley 26.682, art. 10'),
R('CONT', '65 años y antigüedad', '¿Cumplís 65? Mirá tu antigüedad',
  'Diez años en la misma prepaga: contá conmigo.',
  'Año uno, año cinco, año diez en la misma prepaga. Ahora cumplís sesenta y cinco. '
  'Con más de diez años de antigüedad, no te pueden aumentar la cuota por la edad. Buscá el comprobante de cuándo entraste.',
  ['Año 1 · año 5 · año 10', '65 + 10 años: sin aumento por edad', 'Buscá cuándo entraste'],
  'Elsa', 'Plaza de Villa Urquiza, cumpleaños de Elsa',
  'Velitas de una torta que se van encendiendo como contador de años; al llegar a 10 se ilumina el carnet de Elsa.',
  '65', 'Mandáselo a quien esté por cumplir 65.', 'Ley 26.682, art. 12'),
]
RESERVA = []
