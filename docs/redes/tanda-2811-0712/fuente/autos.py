# Automotores Kocos (0 km). Orden: 4 por día del 27/11 al 06/12. Ver vita.py para el formato.
# Sin precios, tasas ni plazos inventados: solo información general de cómo se compra un 0 km.
def R(f, tema, base, gancho, voz, puntos, pj, lugar, escena, palabra, cierre, fuente=''):
    return dict(f=f, tema=tema, base=base, gancho=gancho, voz=voz, puntos=puntos, pj=pj, lugar=lugar,
                escena=escena, palabra=palabra, cierre=cierre, fuente=fuente)

REELS = [
# 27/11 ----------------------------------------------------------------
R('ESC', 'precio de lista y precio final', 'Precio de lista no es precio final',
  'Sábado 11:30: la lista y la sorpresa.',
  'Sábado, once y media. Juli ve el precio de lista y ya hace la cuenta. Pero al firmar aparece otro número. '
  'Antes de ilusionarte: pedí el precio llave en mano, con flete, formularios, patentamiento y sellos.',
  ['Lista ≠ lo que pagás', 'Pedí precio llave en mano', 'Flete, formularios, patente y sellos'],
  'Juli', 'Showroom de Automotores Kocos, sábado 11:30',
  'La etiqueta de precio en el parabrisas se estira hacia arriba como un ticket de supermercado; Juli la frena con la mano.',
  'LLAVE', 'Mandáselo a quien esté por comprar un 0 km.'),
R('CARTAS', 'adjudicación del plan', 'Mito: «con el plan te dan el auto en la cuota 2, seguro»',
  '«Te lo damos en la cuota 2»: tres cartas.',
  '«Te lo damos en la cuota 2.» Tres cartas antes de creerlo. Carta uno: en un plan de ahorro, el auto se adjudica por sorteo o por licitación. '
  'Carta dos: nadie puede garantizarte la cuota. Carta tres: pedí todo por escrito.',
  ['Carta 1: sorteo o licitación', 'Carta 2: nadie garantiza la cuota', 'Carta 3: todo por escrito'],
  'Mati', 'Taller de aire acondicionado de Mati, Villa Crespo',
  'Tres cartas azules sobre el banco de trabajo; se dan vuelta de a una. La segunda tacha «cuota 2» con una línea de luz.',
  'SORTEO', 'Mandáselo a quien esté por anotarse en un plan.'),
R('ADV', 'seña sin recibo', 'nuevo',
  'No dejes una seña sin recibo.',
  'Encontraste el auto y querés asegurarlo con una seña. No la dejes sin recibo. '
  'Uno: que diga modelo, versión y color. Dos: el monto y la fecha. Tres: qué pasa con la seña si la operación no sigue.',
  ['Modelo, versión y color', 'Monto y fecha', '¿Qué pasa si no sigue?'],
  'Juli y Mati', 'Mostrador del showroom de Automotores Kocos',
  'Un billete sale volando de la mano de Mati y se convierte en un recibo que se imprime solo, línea por línea.',
  'SENA', 'Guardalo para el día que señes.'),
R('VOS', 'anticipo o cuota', '¿Anticipo grande o cuota baja?',
  'Vos elegí la cuota antes que el auto.',
  'Vos ya elegiste el color. Pero el orden es otro. Primero: definí la cuota que podés pagar sin ahogarte. '
  'Segundo: mirá cuánto podés poner de anticipo. Tercero: recién ahí, elegí el auto.',
  ['1. La cuota que podés pagar', '2. Cuánto de anticipo', '3. Recién ahí, el auto'],
  'Juli y Mati', 'Cocina del departamento de Villa Crespo, de noche',
  'Las muestras de color del auto giran como ruleta; Juli las frena y en su lugar aparece una calculadora gigante.',
  'CUOTA', 'Guardalo y hacé la cuenta esta noche.'),
# 28/11 ----------------------------------------------------------------
R('NUM', 'costos que no están en la lista', 'Flete, formularios, patentamiento y sellos: qué es cada uno',
  '¿Cuántos costos se suman al precio de lista?',
  '¿Cuántos costos se suman, en general, al precio de lista de un 0 km? ¿Uno? ¿Dos? Cuatro. '
  'Flete, formularios, patentamiento y sellos. Y aparte, el seguro. Pedí cada uno detallado.',
  ['¿Uno? ¿Dos?', 'Cuatro: flete, formularios, patente, sellos', 'Aparte: el seguro'],
  'Mati y Leo', 'Showroom de Automotores Kocos',
  'Cuatro fichas caen sobre el capot y se apilan con un contador 1, 2, 3, 4; Leo agrega la quinta con la palabra «seguro».',
  'COSTOS', 'Guardalo para pedir el presupuesto.'),
R('CUAL', 'gastos después de comprar', 'El 0 km también tiene gastos fijos: seguro, patente, cochera',
  '¿Qué comprador de 0 km sos?',
  'Hay tres compradores. El que mira solo la cuota. El que suma la cuota y el seguro. '
  'Y el que hace la cuenta completa: cuota, seguro, patente, cochera y nafta. Solo el tercero no se lleva sorpresas. ¿Cuál sos?',
  ['El que mira solo la cuota', 'El que suma el seguro', 'El que hace la cuenta completa'],
  'Tres siluetas (Juli es la tercera)', 'Estacionamiento de Av. Juan B. Justo, de noche',
  'Pantalla partida en tres cocheras; en cada una aparece un ticket más largo. La tercera, con la cuenta completa, queda iluminada en azul.',
  'GASTOS', 'Mandáselo a quien solo mira la cuota.'),
R('CONT', 'revisión el día del retiro', 'Retirás tu 0 km: antes de firmar, revisá',
  'Retiro del 0 km: 5 chequeos antes de firmar.',
  'El día del retiro, contá conmigo antes de firmar. Uno: el chasis coincide con los papeles. Dos: sin rayones ni golpes. '
  'Tres: manual. Cuatro: llave de repuesto. Cinco: rueda de auxilio y herramientas.',
  ['1 Chasis = papeles', '2 Sin rayones · 3 Manual', '4 Llave extra · 5 Auxilio'],
  'Juli', 'Playón de entrega de Automotores Kocos, día del retiro',
  'Un contador 1/5 a 5/5 avanza arriba; Juli recorre el auto con una linterna y cada chequeo hace un clic con destello azul.',
  'RETIRO', 'Guardalo para el día del retiro.'),
R('MITO', 'cuota del plan de ahorro', '¿Por qué subió la cuota del plan de ahorro?',
  '«La cuota del plan es fija.» No.',
  '«La cuota del plan de ahorro es fija.» No. En general, se calcula sobre el precio actual del auto. '
  'Si el modelo sube, la cuota sube. Antes de anotarte, preguntá cómo se actualiza y pedilo por escrito.',
  ['Se calcula sobre el precio actual', 'Si sube el auto, sube la cuota', 'Preguntá cómo se actualiza'],
  'Mati', 'Vereda de Villa Crespo, frente al edificio de Mati',
  'Un cartel de cuota pegado con cinta se despega y sube como globo; Mati lo persigue por la vereda.',
  'PLAN', 'Mandáselo a quien esté por anotarse en un plan.'),
]
RESERVA = []
