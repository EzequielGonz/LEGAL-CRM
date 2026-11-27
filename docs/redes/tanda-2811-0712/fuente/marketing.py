# Kocos Marketing. Orden: 4 por día del 27/11 al 06/12. Ver vita.py para el formato.
# Sin promesas ni cifras de resultados; las cifras de escena son ilustrativas.
def R(f, tema, base, gancho, voz, puntos, pj, lugar, escena, palabra, cierre, fuente=''):
    return dict(f=f, tema=tema, base=base, gancho=gancho, voz=voz, puntos=puntos, pj=pj, lugar=lugar,
                escena=escena, palabra=palabra, cierre=cierre, fuente=fuente)

REELS = [
# 27/11 ----------------------------------------------------------------
R('VOS', 'Black Friday: chats acumulados', 'Black Friday: 200 mensajes y nadie para contestar. Así se ordena',
  'Hoy te escriben todos. ¿Quién les contesta?',
  'Hoy es Black Friday y te escribe todo el mundo. Vos atendés el local y el celular no para. '
  'Uno: una respuesta rápida con precio y forma de pago. Dos: etiquetá cada chat. Tres: los que quedan, contestalos por orden de llegada.',
  ['Respuesta rápida: precio y pago', 'Una etiqueta por chat', 'El resto, por orden de llegada'],
  'Romina', 'Mostrador de Dulce Almagro, Av. Corrientes y Medrano',
  'El celular de Romina vibra y de la pantalla salen burbujas de chat que llenan el local; ella las acomoda en tres columnas de colores.',
  'ORDEN', 'Mandáselo a quien hoy no da abasto.'),
R('ESC', 'consulta de noche', 'Llegó una consulta a las 21:03',
  '21:03: te piden precio. Contestás mañana.',
  'Veintiuna y tres. Alguien te pregunta el precio. Vos lo ves y pensás: mañana contesto. '
  'Mañana a las diez, esa persona ya le compró a otro. Uno: dejá un mensaje automático con horario. Dos: respondé lo básico. Tres: retomá a primera hora.',
  ['21:03 llega la consulta', 'Mensaje automático con horario', 'A primera hora, retomá'],
  'Romina', 'Sillón de su casa en Almagro, de noche',
  'Reloj del celular en 21:03; la burbuja de chat se aleja por la ventana hacia otro local que se enciende. Corte a 10:00: silla vacía.',
  'CRM', 'Mandáselo a quien deja todo para mañana.'),
R('MITO', 'precio por privado', 'Te preguntan el precio: ¿qué respondés?',
  '«El precio se pasa por privado.» Error.',
  '«El precio se pasa por privado.» Error. Quien pregunta el precio quiere avanzar. '
  'Respondé con el precio o un rango, qué incluye y un paso siguiente concreto: «¿te lo reservo para el sábado?».',
  ['Precio o rango', 'Qué incluye', 'Un paso siguiente concreto'],
  'Romina', 'Comentarios de Instagram en la vidriera de Dulce Almagro',
  'Un comentario «¿precio?» rebota contra un cartel de «por privado» que se rompe; aparece una respuesta clara en globo naranja.',
  'RESPUESTAS', 'Guardalo para la próxima vez que te pregunten.'),
R('CONT', 'web lenta', 'Tu web tarda en cargar. Y se van',
  'Un segundo, dos, tres: tu cliente se fue.',
  'Un segundo. Dos. Tres. Tu web sigue cargando y la persona se fue. '
  'Según Think with Google, si una página tarda tres segundos en vez de uno, sube un 32 % la probabilidad de que se vayan. Probala hoy desde el celular.',
  ['1 s · 2 s · 3 s', '+32 % de probabilidad de irse', 'Probala hoy desde el celular'],
  'Romina; clienta en silueta de espaldas', 'Colectivo por Av. Corrientes, Almagro',
  'Contador gigante de segundos arriba; la barra de carga avanza lenta mientras la clienta en silueta baja del colectivo y desaparece.',
  'WEB', 'Mandáselo a quien tenga web.', 'Think with Google, 2017'),
# 28/11 ----------------------------------------------------------------
R('CARTAS', 'respuestas rápidas', 'Respuestas rápidas: 3 que necesitás hoy',
  'Tres respuestas rápidas que te faltan.',
  'Tres cartas, tres respuestas rápidas que te ahorran el día. Carta uno: precio y formas de pago. '
  'Carta dos: horario y dirección. Carta tres: cómo se hace un pedido, paso a paso.',
  ['Carta 1: precio y pagos', 'Carta 2: horario y dirección', 'Carta 3: cómo pedir'],
  'Romina y Tomi', 'Mesa del local con la notebook de Tomi',
  'Tres cartas naranjas boca abajo sobre la notebook; Tomi las da vuelta y cada una se guarda sola en el celular de Romina.',
  'RAPIDAS', 'Guardalo y armalas hoy.'),
R('NUM', 'seguimiento después de «lo pienso»', '«Lo pienso» no es un no',
  '«Lo pienso»: ¿cuántas veces volvés?',
  'Te dijeron «lo pienso». ¿Cuántas veces volvés a escribir? ¿Ninguna? ¿Una? Tres. '
  'A las 24 horas, a los tres días y a la semana. Cada vez con algo nuevo: una foto, una duda resuelta, una fecha.',
  ['¿Ninguna? ¿Una?', 'Tres: 24 h, 3 días, 1 semana', 'Cada vez, algo nuevo'],
  'Romina', 'Cocina de Dulce Almagro, de noche',
  'Tres relojes de cocina se encienden en fila; cuando suena el tercero, el chat de la clienta cambia de gris a verde.',
  'SEGUIR', 'Guardalo para tu próximo «lo pienso».'),
R('ADV', 'fotos de stock en Google', 'Fotos reales del local en Google',
  'Desconfiá de tus fotos de stock.',
  'Desconfiá de las fotos de stock en tu perfil de Google. Quien te busca quiere ver tu local de verdad. '
  'Uno: la fachada, para que te encuentren. Dos: el mostrador y los productos. Tres: fotos nuevas cada temporada.',
  ['La fachada', 'El mostrador y los productos', 'Fotos nuevas cada temporada'],
  'Tomi', 'Vidriera de Dulce Almagro',
  'Una foto genérica de una torta perfecta se despega del celular como sticker y cae; detrás aparece la vidriera real con luz cálida.',
  'FOTOS', 'Mandáselo a quien tenga local.'),
R('CUAL', 'cómo respondés en WhatsApp', 'nuevo',
  '¿Qué vendedor de WhatsApp sos?',
  'Hay tres vendedores de WhatsApp. El que responde con un audio de tres minutos. El que dice «te paso por privado». '
  'Y el que contesta en dos líneas con precio y un paso siguiente. ¿Cuál sos?',
  ['El del audio de 3 minutos', 'El de «por privado»', 'El de dos líneas y un paso'],
  'Tres siluetas (Romina es la tercera)', 'Feria de emprendedores en Plaza Almagro',
  'Pantalla partida en tres puestos de feria; de los dos primeros sale una onda de audio interminable y un candado. El tercero se ilumina naranja.',
  'VENDEDOR', 'Mandáselo a quien manda audios largos.'),
]
RESERVA = []
