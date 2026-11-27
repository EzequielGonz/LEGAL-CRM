# VITA (jurídico Civil y Penal). Orden: 4 por día del 27/11 al 06/12. 'voz' sin el cierre: armar.py lo suma
# (o lo pone donde está {C}, para los loops). Personajes de calendario-2511-0412/personajes.md.
def R(f, tema, base, gancho, voz, puntos, pj, lugar, escena, palabra, cierre, fuente=''):
    return dict(f=f, tema=tema, base=base, gancho=gancho, voz=voz, puntos=puntos, pj=pj, lugar=lugar,
                escena=escena, palabra=palabra, cierre=cierre, fuente=fuente)

REELS = [
# 27/11 ---------------------------------------------------------------- BOCETO
R('BOCETO', 'choque: la frase que no se dice', 'Después de un choque, nunca digas esto (mejorado con escena, contador y loop)',
  'Recién chocaste. Esta frase, nunca.',
  'Domingo, 19:10. Recién chocaste y te sale decir: «Perdón, fue mi culpa». Nunca digas esto. Antes de hablar, tres pasos. '
  'Uno: fotos de los autos, la patente y la esquina. Dos: datos del otro conductor y de los testigos. '
  'Tres: avisá a tu seguro dentro de los tres días. {C} Porque recién chocaste… y te sale decir:',
  ['1/3 Fotos: autos, patente y esquina', '2/3 Datos del otro y de testigos', '3/3 Aviso al seguro: 3 días'],
  'Nico', 'Av. Montes de Oca y Suárez, Barracas, domingo 19:10',
  'Segundo 0: choque congelado y reloj 19:10 en la esquina; la frase «Perdón, fue mi culpa» sale de la boca de Nico y queda tachada en dorado. '
  'Contador 1/3, 2/3, 3/3 arriba con el cronómetro dorado; cada paso con golpe de zoom. Último cuadro idéntico al primero (loop).',
  'NUNCA', 'Mandáselo a quien maneje todos los días.', 'Ley 17.418, art. 46 (aviso del siniestro en 3 días)'),
R('ESC', 'despido: el papel del viernes', 'Te despidieron: qué pedir y qué no firmar ese día',
  'Viernes 18:05: te despiden y te dan un papel.',
  'Viernes, 18:05. Te llaman a la oficina, te dicen que estás despedida y te dan un papel para firmar. '
  'Uno: leelo entero, sin apuro. Dos: no firmes nada que no entiendas. Tres: pedí copia de todo lo que te den.',
  ['Leelo entero, sin apuro', 'No firmes lo que no entendés', 'Pedí copia de todo'],
  'Sole', 'Oficina del supermercado de Flores, viernes 18:05',
  'Reloj de pared en 18:05, la puerta se cierra detrás de Sole. El papel crece hasta tapar la oficina; la lapicera queda flotando sin tocar la hoja.',
  'DESPIDO', 'Guardalo para cuando lo necesites.'),
R('CARTAS', 'penal: citación', 'Te llegó una citación penal: qué no hacer antes de hablar con un abogado',
  'Te llegó una citación penal. Tres cartas.',
  'Te llegó una citación penal. Tres cartas, de a una. Carta uno: no la ignores. '
  'Carta dos: no vayas a declarar sin abogado. Carta tres, la que más pesa: nadie puede obligarte a declarar contra vos. Lo dice la Constitución.',
  ['Carta 1: no la ignores', 'Carta 2: no declares sin abogado', 'Carta 3: nadie te obliga a declarar contra vos'],
  'Nico', 'Cocina de la casa de Nico en Nueva Pompeya, de noche',
  'Tres cartas boca abajo con «?» sobre la mesa de la cocina; se dan vuelta de a una con un golpe seco. La tercera se ilumina en dorado.',
  'PENAL', 'Mandáselo a quien le llegó una.', 'Constitución Nacional, art. 18'),
R('VOS', 'sucesión: vender la casa heredada', 'nuevo',
  'Heredaste la casa. ¿La podés vender mañana?',
  'Vos y tus hermanos heredan la casa de sus padres. ¿La pueden vender mañana? En general, no. '
  'Primero: hay que iniciar la sucesión. Segundo: junten partidas, escritura e impuestos. Tercero: pónganse de acuerdo por escrito antes de avanzar.',
  ['Primero, la sucesión', 'Partidas, escritura e impuestos', 'Acuerdo entre hermanos, por escrito'],
  'Sole y su hermano Dani', 'Casa de los padres de Sole en Parque Avellaneda',
  'Una llave gigante cuelga sobre la mesa del comedor; Sole y Dani la miran desde abajo. Tres carpetas se apilan solas a medida que habla la narradora.',
  'SUCESION', 'Mandáselo a tus hermanos.'),
]
RESERVA = []
