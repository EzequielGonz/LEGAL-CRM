# Textos del calendario x2 (20/11 al 29/11/2026): ganchos nuevos, remakes, personajes, lugares y giros.
# Lo usa generar_x2.py. Todo es ilustrativo: personajes inventados (ver ../calendario-2511-0412/personajes.md).

# ---------------------------------------------------------------------------
# Variantes B nuevas de ideas que en el calendario base salen una sola vez.
# idea_id: (gancho nuevo, pregunta nueva para la encuesta)
# ---------------------------------------------------------------------------
VAR = {
 'vita': {
  'choque-fiestas': ('Fiestas: el roce en la avenida y la discusión que no suma', '¿Discutiste alguna vez después de un choque? Sí / No'),
  'art-trayecto': ('Choque yendo al trabajo: ¿a quién le avisás primero?', '¿A quién le avisarías primero? Empleador / ART'),
  'culpa-error': ('Te lastimaste por apurarte: ¿y la ART?', '¿Te lastimaste alguna vez por apurarte? Sí / No'),
  'nunca-arreglo': ('«Te doy algo y listo»: pensalo dos veces', '¿Te ofrecieron arreglar en el momento? Sí / No'),
  'danos': ('Choque: no es solo el auto. Mirá qué más se reclama', '¿Sabías que se reclaman los gastos de traslado? Sí / No'),
  'aguinaldo-fecha': ('Aguinaldo de diciembre: marcá esta fecha', '¿Ya agendaste la fecha del aguinaldo? Sí / No'),
  'liquidacion': ('Liquidación final: revisala renglón por renglón', '¿Entendiste cada renglón de tu liquidación? Sí / No'),
  'aguinaldo-proporcional': ('Cambiaste de trabajo este año: ¿y el aguinaldo?', '¿Te fuiste de un trabajo este año? Sí / No'),
  'no-registrado': ('Nunca te dieron un recibo: esto te importa', '¿Tenés recibo de sueldo? Sí / No'),
  'alta-comision': ('Comisión Médica: qué es, en 20 segundos', '¿Te citaron alguna vez a la Comisión Médica? Sí / No'),
  'reforma': ('Reforma laboral: lo que cambió y lo que se discute', '¿Escuchaste «con la reforma cambió todo»? Sí / No'),
  'penal-lesiones': ('Choque con un herido: no es solo tema del seguro', '¿Pensás que un choque es solo tema del seguro? Sí / No'),
  'telegrama': ('Te llegó una carta documento del trabajo: abrila hoy', '¿Dejarías una carta documento sin abrir? Sí / No'),
  'certificado': ('Tu última semana en el trabajo: no te vayas sin este papel', '¿Pediste el certificado de trabajo al irte? Sí / No'),
 },
 'cob': {
  'mono-revisa': ('Monotributo: revisá estas 3 cosas antes de fin de año', '¿Revisaste tu obra social del monotributo este año? Sí / No'),
  'cambio-tratamientos': ('Estás en tratamiento y te querés cambiar: preguntá esto', '¿Te cambiarías en medio de un tratamiento? Sí / No'),
  'aguinaldo-aportes': ('Recibo del aguinaldo: ¿qué es ese descuento?', '¿Te sorprendió algún descuento del aguinaldo? Sí / No'),
  'vacaciones': ('Antes de armar la valija, llamá a tu cobertura', '¿Viajás estas vacaciones? Sí / No'),
  'opcion-tarda': ('Cambio de obra social: contá unos 3 meses', '¿Pediste alguna vez la opción de cambio? Sí / No'),
  'derivar': ('«Derivar aportes»: qué quiere decir', '¿Escuchaste «derivar aportes» alguna vez? Sí / No'),
  'reintegros': ('Ese ticket de la consulta: ¿pediste el reintegro?', '¿Tenés tickets de consultas sin reintegro? Sí / No'),
  'cartilla-zona': ('Te mudás o te vas de viaje: ¿qué te cubre allá?', '¿Te vas de la ciudad en el verano? Sí / No'),
 },
 'autos': {
  'usado-papeles': ('Entregás el usado: que no te frene una multa vieja', '¿Tenés los papeles del auto a mano? Sí / No'),
  'plan-preguntas': ('Antes de firmar el plan: 3 preguntas a la agencia', '¿Preguntaste cómo se adjudica antes de firmar? Sí / No'),
  'lista-costos': ('Flete, formularios, sellos: el ticket del 0 km explicado', '¿Sabías que el flete se suma aparte? Sí / No'),
  'retiro-kit': ('Ya en la avenida y sin llave de repuesto: que no te pase', '¿Revisaste el kit antes de irte? Sí / No'),
  'aguinaldo-anticipo': ('El aguinaldo entero al anticipo: pensalo con la cuota', '¿Tu aguinaldo ya tiene destino? Sí / No'),
  'prendario': ('Crédito prendario en 20 segundos', '¿Escuchaste «prendario» y no entendiste? Sí / No'),
  'garantia': ('«Anda bien»: igual no saltees el primer service', '¿Sabés cuándo es tu primer service? Sí / No'),
  'hibrido': ('Te enamoraste de un híbrido: preguntá esto antes', '¿Manejaste alguna vez un híbrido? Sí / No'),
  'documentacion': ('La carpeta del 0 km: lo que no puede faltar', '¿Guardás los papeles del auto en un solo lugar? Sí / No'),
  'gastos-fijos': ('Cuota más seguro, patente y cochera: hacé la cuenta completa', '¿Sumaste la patente a tu presupuesto? Sí / No'),
  'ruta': ('Primera ruta con el 0 km: revisá antes de cargar el baúl', '¿Vas a la costa en auto este verano? Sí / No'),
 },
 'mkt': {
  'consulta-domingo': ('Te escriben el domingo: ¿el lunes es tarde?', '¿Mirás los mensajes del negocio el finde? Sí / No'),
  'precio-antes': ('Dos respuestas al «¿precio?»: ¿cuál elegís?', '¿Cuál mandarías? A / B'),
  'etiquetas': ('Etiquetas de colores: tu WhatsApp por etapa', '¿Tus chats tienen etiquetas? Sí / No'),
  'google-fotos': ('Sacá 3 fotos de tu local hoy y subilas a tu perfil', '¿Las fotos de tu perfil son tuyas? Sí / No'),
  'seguir-calendario': ('Tres fechas en la libreta: así se sigue un «lo pienso»', '¿Anotás tus seguimientos? Sí / No'),
  'checklist': ('Antes de diciembre: 5 cosas para revisar en tu WhatsApp', '¿Ya revisaste tu WhatsApp para fin de año? Sí / No'),
  'aguinaldo-ventas': ('Viernes de aguinaldo: llueven consultas. ¿Quién contesta?', '¿Quién responde los mensajes en tu negocio? Yo / Otra persona'),
  'catalogo': ('Basta de fotos sueltas: tu catálogo en WhatsApp', '¿Mandás fotos sueltas cuando te piden opciones? Sí / No'),
  'resenas': ('Reseñas reales: pedíselas a tus clientes de siempre', '¿Le pediste una reseña a un cliente este mes? Sí / No'),
  'web-movil': ('Abrí tu web en el celular: ¿encontrás cómo pedir?', '¿Se ve bien tu web en el celular? Sí / No'),
  'pedidos-fiestas': ('El pedido anotado en un papelito: que no se pierda', '¿Dónde anotás los pedidos? Papel / Planilla'),
  'mensajes-ig': ('Revisá «solicitudes» en Instagram: hay mensajes esperando', '¿Sabías que hay una bandeja de «solicitudes»? Sí / No'),
  'estados': ('Tus estados de WhatsApp: la vidriera de fin de año', '¿Subís estados del negocio? Sí / No'),
 },
}

# ---------------------------------------------------------------------------
# Remakes («R»): temas que mejor retuvieron del 10 al 19/11 (primero los de la lista
# de la responsable; el tope de 6 por tema obliga a seguir con los siguientes del ranking).
# (tema, prefijo de la pieza vieja, idea representativa aprobada, [(gancho, pregunta, personaje, lugar, conflicto, día fijo o None)])
# ---------------------------------------------------------------------------
REM = {
 'vita': [
  ('trayecto', 'vita-trayecto', 'trayecto-casa', True, [
   ('Trayecto: el choque fue a 3 cuadras del trabajo', '¿Ibas o volvías del trabajo cuando te pasó? Ida / Vuelta', 'Nico', 'Av. Sáenz y Av. Perito Moreno, Nueva Pompeya, 7:40', 'Nico frena la moto a tres cuadras del depósito y un auto le toca la rueda de atrás', None),
   ('Volvías del trabajo y te chocaron: ojo con esto', '¿Sabías que la vuelta del trabajo también cuenta? Sí / No', 'Nico', 'Av. Montes de Oca, Barracas, de noche', 'Nico sale del depósito con la mochila de reparto y un auto lo encierra camino a casa', None)]),
  ('culpa', 'vita-culpa', 'culpa-mito', True, [
   ('«Me distraje yo»: ¿igual te cubre la ART?', '¿Creés que la ART te cubre si te distrajiste? Sí / No', 'Sole', 'Depósito del supermercado de Flores', 'Sole mira el celular un segundo y el cúter se le resbala sobre la caja', None),
   ('ART: tu error no borra tu cobertura', '¿Alguien te dijo que por tu culpa no te cubren? Sí / No', 'Nico', 'Depósito de bebidas de Barracas', 'Nico apila un pallet torcido por apurarse y las cajas se le vienen encima', None)]),
  ('choque-pasos', 'vita-24h', 'choque-24h', True, [
   ('Choque: el reloj ya corre. Mirá las 3 primeras cosas', '¿Sacaste fotos la última vez que chocaste? Sí / No', 'Nico', 'Av. Montes de Oca y Av. Martín García, Barracas, de noche', 'Golpe de chapa y el cronómetro dorado arranca en 24:00:00 sobre la cabeza de Nico', None),
   ('Choque: ¿avisaste a tu seguro? Tenés 3 días', '¿Sabías que tenés 3 días para avisarle a tu seguro? Sí / No', 'Nico', 'Casa de Nico en Nueva Pompeya, a la mañana siguiente', 'Nico se despierta con el casco al lado de la cama y el celular marca «día 1 de 3»', None)]),
  ('art-rechazo', 'vita-art', 'art-rechazo', True, [
   ('ART: llegó la carta con «rechazado». No la guardes en un cajón', '¿Te llegó alguna vez una carta de la ART? Sí / No', 'Sole', 'Cocina de Sole en Floresta, de noche', 'Sole abre el sobre, lee «rechazado» y ya tiene el cajón abierto', None),
   ('Rechazo de la ART: pedilo por escrito', '¿Guardaste el rechazo por escrito? Sí / No', 'Nico', 'Mostrador de una oficina genérica en Barracas', 'A Nico le dicen «está rechazado» de palabra y no le dan ningún papel', None),
   ('ART dijo que no: tu próximo paso', '¿Sabías que podés ir a la Comisión Médica? Sí / No', 'Sole', 'Pasillo de góndolas del supermercado de Flores', 'Sole le cuenta a una compañera que la ART le dijo que no y se agarra el hombro', None),
   ('Te rechazaron el accidente y te sigue doliendo: seguí atendiéndote', '¿Seguiste con el tratamiento después del rechazo? Sí / No', 'Nico', 'Guardia de un hospital genérico de Barracas', 'Nico rompe el turno del kinesiólogo porque «total, ya me rechazaron»', None)]),
  ('alta', 'vita-alta', 'alta-dolor', False, [
   ('Alta médica: ¿te la dieron y no estás bien?', '¿Volviste a trabajar con dolor? Sí / No', 'Sole', 'Depósito del supermercado de Flores', 'Sole levanta una caja con el brazo «de alta» y el dolor la frena en seco', None),
   ('ART: alta en el papel, dolor en el cuerpo', '¿Pediste el alta por escrito? Sí / No', 'Nico', 'Depósito de bebidas de Barracas', 'Nico sube a la autoelevadora con el papel del alta en el bolsillo y la rodilla le tiembla', None)]),
  ('nunca', 'vita-nunca', 'nunca-frases', False, [
   ('«Estoy bien, no fue nada»: la frase que más se dice después de un choque', '¿Cuál dirías primero? «Estoy bien» / «Pasame tus datos»', 'Nico', 'Esquina de Av. Sáenz y Av. Perito Moreno, Nueva Pompeya', 'Nico se saca el casco y está por decir «no fue nada» cuando el tiempo se congela', None),
   ('Choque: lo que digas en el primer minuto cuenta', '¿Pediste los datos del otro conductor? Sí / No', 'Nico', 'Av. Montes de Oca, Barracas', 'El otro conductor baja gritando y Nico abre la boca para disculparse', None)]),
  ('danos', 'vita-danos', 'danos', False, [
   ('Choque: la moto en el taller y vos sin trabajar. Eso también cuenta', '¿Perdiste días de trabajo por un choque? Sí / No', 'Nico', 'Taller mecánico genérico de Nueva Pompeya', 'Nico mira la moto desarmada y el calendario de repartos tachado', None),
   ('Choque: guardá cada ticket del remís y de la farmacia', '¿Guardaste los tickets de los gastos? Sí / No', 'Nico', 'Farmacia genérica sobre Av. Sáenz, Nueva Pompeya', 'Nico tira el ticket de la farmacia al tacho de la vereda', None)]),
  ('sin-seguro', 'vita-sin-seguro', 'sin-seguro', False, [
   ('El que te chocó no tenía seguro: no te quedes quieto', '¿Le pediste el seguro al otro conductor? Sí / No', 'Nico', 'Av. Montes de Oca, Barracas', 'El otro conductor dice «no tengo seguro» y Nico se queda con la mano estirada', None),
   ('Sin seguro el otro: ¿y el dueño del auto?', '¿Sabías que también responde el dueño del auto? Sí / No', 'Nico', 'Cocina de Nico en Nueva Pompeya', 'Nico da vuelta el papel con los datos del otro y lee otro nombre como titular', None)]),
  ('firma', 'vita-firmas', 'firma', False, [
   ('Te ofrecen plata hoy si firmás hoy: frená', '¿Firmarías el mismo día? Sí / No', 'Nico', 'Bar de la esquina de Av. Sáenz, Nueva Pompeya', 'Le deslizan a Nico un papel por la mesa del bar con una lapicera ya destapada', None),
   ('Acuerdo del seguro: leé esto antes de la lapicera', '¿Pediste la oferta por escrito? Sí / No', 'Sole', 'Cocina de Sole en Floresta', 'Sole tiene la lapicera sobre la línea de la firma y su hijo le pregunta qué es', None)]),
 ],
 'cob': [
  ('monotributo', 'cob-mono', 'mono-aporte', True, [
   ('Monotributo: pagás obra social aunque no lo sepas', '¿Usaste alguna vez la obra social del monotributo? Sí / No', 'Lucía', 'Departamento de Lucía en Caballito, frente a Parque Rivadavia', 'Lucía paga la cuota en la notebook y la pantalla se parte en dos porciones', None),
   ('Monotributo: abrí tu cuota y buscá esta parte', '¿Revisaste tu cuota del monotributo este mes? Sí / No', 'Lucía', 'Bar de Av. Rivadavia y Acoyte, Caballito', 'Lucía revisa la cuota con la taza en la mano y una línea se ilumina', None)]),
  ('cambio-prepaga', 'cob-cambio', 'cambio-antes', True, [
   ('Cambiarte de prepaga: la cartilla primero, el precio después', '¿Te cambiarías solo por precio? Sí / No', 'Lucía', 'Departamento de Lucía en Caballito', 'Lucía tiene dos folletos en la mano y ya eligió el más barato', None),
   ('Prepaga: antes de firmar el alta en otra, mirá esto', '¿Pediste la cartilla de tu zona antes de cambiarte? Sí / No', 'Gabriel', 'Cocina de los Ferreyra en Villa Urquiza', 'Gabriel tiene el formulario de alta y la lapicera, y Vero le frena la mano', None)]),
  ('aportes', 'cob-recibo', 'recibo-3', True, [
   ('Recibo de sueldo: la línea que nadie mira', '¿Leíste tu recibo completo este mes? Sí / No', 'Gabriel', 'Cocina de los Ferreyra en Villa Urquiza', 'Gabriel dobla el recibo sin leerlo y la lupa menta se lo despliega', None),
   ('Tu sueldo, tu 3 %: ¿adónde va?', '¿Sabés a qué obra social van tus aportes? Sí / No', 'Gabriel', 'Colectivo por Av. Triunvirato, Villa Urquiza', 'Gabriel mira el recibo en el celular y un «3 %» se despega de la pantalla', None),
   ('Trabajo nuevo: la obra social que te tocó la podés elegir', '¿Elegiste vos tu obra social al entrar? Sí / No', 'Vero', 'Sala de maestras de una escuela genérica de Villa Urquiza', 'A Vero le dan el formulario con la obra social ya completada', None)]),
  ('aumento', 'cob-aumento', 'aumento-comparar', False, [
   ('Llegó el aviso de aumento: no pagues sin mirar el plan', '¿Leíste el último aviso de tu prepaga? Sí / No', 'Vero', 'Cocina de los Ferreyra en Villa Urquiza', 'El celular de Vero vibra con el aviso del aumento mientras corta el pan', None),
   ('Aumento de la prepaga: 3 cosas para comparar hoy', '¿Comparaste tu plan este año? Sí / No', 'Gabriel', 'Cocina de los Ferreyra en Villa Urquiza', 'Gabriel abre el home banking para pagar y Vero apoya la carta encima', None),
   ('El aumento llegó por mail: abrilo con lupa', '¿Te llegan los avisos de aumento por mail? Sí / No', 'Lucía', 'Departamento de Lucía en Caballito', 'Lucía archiva un mail sin leer y la lupa menta lo saca de la papelera', None)]),
  ('preexistencia', 'cob-preexistencia', 'preex', False, [
   ('«Con mi presión no me aceptan»: mito', '¿Pensaste que una enfermedad previa te deja afuera? Sí / No', 'Elsa', 'Living de Elsa en Villa Urquiza', 'Elsa se toma la presión y tira el folleto de la prepaga a la basura', None),
   ('Preexistencia: no es motivo de rechazo', '¿Te preguntaron por enfermedades previas al afiliarte? Sí / No', 'Elsa', 'Living de Elsa en Villa Urquiza', 'Elsa completa la declaración de salud y la lapicera se traba en «enfermedades previas»', None),
   ('Enfermedad previa: lo que sí puede cambiar es la cuota', '¿Sabías que puede cambiar la cuota, no la aceptación? Sí / No', 'Gabriel', 'Cocina de los Ferreyra en Villa Urquiza', 'Gabriel le lee a Elsa por teléfono la respuesta de la prepaga y frunce la frente', None)]),
  ('familia', 'cob-familia', 'familia', False, [
   ('Familia: ¿cada uno en su plan o todos juntos?', '¿Están todos en el mismo plan? Sí / No', 'Los Ferreyra', 'Mesa de los Ferreyra en Villa Urquiza', 'Cuatro carnets de coberturas distintas caen sobre la mesa del desayuno', None),
   ('Sumar a los chicos a tu plan: de qué depende', '¿Sumaste a tus hijos a tu plan? Sí / No', 'Vero', 'Puerta de la escuela de Benja, Villa Urquiza', 'Benja se raspa la rodilla y Vero no sabe qué carnet sacar', None),
   ('Plan familiar: la edad de cada uno cuenta', '¿Compararon el plan de cada uno en casa? Sí / No', 'Gabriel', 'Cocina de los Ferreyra en Villa Urquiza', 'Gabriel ordena los carnets por edad y Martina le pregunta por qué', None),
   ('Dos sueldos, dos aportes: ¿los están usando bien?', '¿En tu casa hay dos aportes? Sí / No', 'Vero', 'Cocina de los Ferreyra en Villa Urquiza', 'Vero y Gabriel ponen sus recibos lado a lado y las líneas no coinciden', None)]),
  ('65', 'cob-65', '65', False, [
   ('65 años: mirá cuántos años llevás en tu prepaga', '¿Cuántos años llevás en tu prepaga? Menos de 10 / Más de 10', 'Elsa', 'Living de Elsa en Villa Urquiza', 'Elsa sopla la vela del 65 y el humo dibuja un signo de pregunta', None),
   ('Cumplís 65: el número que importa es otro', '¿Sabías que importa la antigüedad? Sí / No', 'Elsa', 'Living de Elsa en Villa Urquiza', 'Elsa busca su primer carnet de la prepaga en una caja de fotos', None),
   ('65 y más de 10 años en la misma prepaga: leé esto', '¿Tus papás tienen más de 65? Sí / No', 'Gabriel', 'Vereda entre la casa de Elsa y la de los Ferreyra, Villa Urquiza', 'Gabriel camina las dos cuadras con la carta de la prepaga de su mamá', None),
   ('Tu mamá cumple 65: revisá su antigüedad', '¿Revisaste la antigüedad de tu mamá o tu papá? Sí / No', 'Vero', 'Living de Elsa en Villa Urquiza', 'Vero arma la torta de Elsa y encuentra el aviso de la prepaga en la heladera', None)]),
  ('cartilla', 'cob-cartilla', 'cartilla-guardia', False, [
   ('Guardia a las 2 de la mañana: ¿está en tu cartilla?', '¿Sabés la dirección de tu guardia más cercana? Sí / No', 'Vero', 'Guardia de una clínica genérica de Villa Urquiza, de noche', 'Vero entra con Benja en brazos y la recepcionista niega con la cabeza', None),
   ('Cartilla: buscá hoy tu guardia, no el día que la necesitás', '¿Miraste tu cartilla este año? Sí / No', 'Lucía', 'Departamento de Lucía en Caballito', 'Lucía se quema con la taza y no sabe adónde ir', None)]),
  ('carencias', 'cob-cambio', 'carencias', False, [
   ('Carencias: lo que nadie te explica al cambiarte', '¿Te hablaron de carencias al cambiarte? Sí / No', 'Gabriel', 'Cocina de los Ferreyra en Villa Urquiza', 'Gabriel firma el alta en otra prepaga y una letra chica se desprende del papel', None)]),
  ('plan-a-medida', 'cob-aumento', 'plan-uso', False, [
   ('Tu plan tiene cosas que nunca usaste: hacé la lista', '¿Sabés qué cubre tu plan que nunca usaste? Sí / No', 'Gabriel', 'Cocina de los Ferreyra en Villa Urquiza', 'Gabriel da vuelta la cartilla y caen prestaciones que la familia nunca usó', None)]),
  ('opcion-obra-social', 'cob-recibo', 'opcion-anual', False, [
   ('Tu obra social no es para siempre: se puede cambiar', '¿Sabías que podés cambiar de obra social? Sí / No', 'Lucía', 'Departamento de Lucía en Caballito', 'Lucía guarda la credencial de la obra social en un cajón con candado', None)]),
 ],
 'autos': [
  ('usado', 'autos-usado', 'usado-valor', True, [
   ('Tu usado: la carpeta del service suma', '¿Guardás los comprobantes del service? Sí / No', 'Mati', 'Vereda de Villa Crespo con «el gris» estacionado', 'Mati le saca brillo al gris y Juli le muestra la carpeta del service vacía', None),
   ('Usado en regla: papeles al día antes de entregarlo', '¿Revisaste multas antes de entregar tu auto? Sí / No', 'Juli', 'Cocina del departamento de Villa Crespo', 'Juli abre la guantera del gris y cae un papel de multa vieja', None)]),
  ('plan-ahorro', 'autos-plan', 'plan-cuota', True, [
   ('Plan de ahorro: si sube el modelo, sube la cuota', '¿Sabías que la cuota sigue el precio del modelo? Sí / No', 'Mati', 'Taller de aire acondicionado de Mati, Villa Crespo', 'A Mati le llega la cuota del plan de su hermano y el número sube solo', None),
   ('Plan de ahorro: la lapicera, después de estas 3 preguntas', '¿Leíste todo el contrato del plan? Sí / No', 'Juli', 'Showroom de Automotores Kocos', 'Juli apoya la lapicera en el contrato y Leo le acerca tres tarjetas', None)]),
  ('voto-0km-usado', 'autos-voto', 'voto-0km', True, [
   ('0 km o usado de 2 años: votá y mirá de qué depende', '¿0 km o usado? 0 km / Usado', 'Juli y Mati', 'Cocina del departamento de Villa Crespo', 'La pantalla se parte: Juli con el folleto del 0 km y Mati con la foto de un usado', None),
   ('Juli quiere 0 km, Mati quiere usado: ¿quién gana?', '¿Con quién estás? Juli / Mati', 'Juli y Mati', 'Av. Corrientes y Scalabrini Ortiz, Villa Crespo', 'Juli y Mati discuten en la vereda y un colectivo pasa entre los dos', None),
   ('0 km o usado: depende de 3 números', '¿Qué pesa más? Cuota / Anticipo', 'Juli', 'Cocina del departamento de Villa Crespo', 'Juli escribe tres números en la libreta y Mati tacha uno', None),
   ('¿Primer auto 0 km o usado? Elegí en 3 segundos', '¿Elegís 0 km o usado? 0 km / Usado', 'Mati', 'Showroom de Automotores Kocos', 'Mati apoya una mano en el 0 km y en la otra tiene las llaves del gris', None)]),
  ('anticipo-cuota', 'autos-anticipo', 'voto-anticipo', True, [
   ('Anticipo grande o cuota baja: la calculadora decide', '¿Qué te importa más? Anticipo / Cuota', 'Juli', 'Cocina del departamento de Villa Crespo', 'Juli aprieta «=» en la calculadora y la pantalla queda en blanco', None),
   ('Cuota que podés pagar: arrancá por ahí', '¿Sabés qué cuota podés pagar sin ahogarte? Sí / No', 'Mati', 'Cocina del departamento de Villa Crespo', 'Mati mete todos los ahorros en un sobre que dice «anticipo» y Juli saca la mitad', None)]),
  ('retiro', 'autos-retiro', 'retiro-chasis', False, [
   ('Día del retiro: la linterna del celular, al chasis', '¿Llevarías una lista el día del retiro? Sí / No', 'Juli', 'Showroom de Automotores Kocos, de noche', 'Juli tiene la lapicera en la mano y prende la linterna del celular', None),
   ('Retirás el 0 km: manual, llave de repuesto y kit', '¿Te dieron todo el día del retiro? Sí / No', 'Mati', 'Salida del showroom hacia Av. Juan B. Justo', 'Mati ya está arrancando y Leo corre detrás con una bolsa en la mano', None)]),
  ('llave-en-mano', 'autos-lista', 'lista', False, [
   ('Precio de lista: le faltan renglones', '¿Pediste el precio final por escrito? Sí / No', 'Juli y Mati', 'Showroom de Automotores Kocos', 'Mati señala el precio del cartel y la impresora de Leo empieza a sonar', None),
   ('0 km: pedí el precio llave en mano, siempre', '¿Sabés qué es el precio llave en mano? Sí / No', 'Juli', 'Cocina del departamento de Villa Crespo', 'Juli compara una publicidad con el ticket de Leo y los números no coinciden', None)]),
  ('seguro', 'autos-seguro', 'seguro', False, [
   ('Retirás el 0 km sin póliza: no salís de la agencia', '¿Cotizaste el seguro antes del retiro? Sí / No', 'Mati', 'Showroom de Automotores Kocos', 'Mati tiene la llave en la mano y Leo le pregunta por la póliza', None),
   ('Seguro del 0 km: cotizalo antes de la fecha de retiro', '¿Con cuánto tiempo cotizás el seguro? 1 semana / El mismo día', 'Juli', 'Cocina del departamento de Villa Crespo', 'Juli ve en el almanaque «retiro: mañana» y el casillero «seguro» vacío', None),
   ('Seguro: mirá qué cubre, no solo cuánto cuesta', '¿Leíste qué cubre tu seguro? Sí / No', 'Juli y Mati', 'Cocina del departamento de Villa Crespo', 'Mati elige la póliza más barata y Juli da vuelta la hoja', None),
   ('El día del retiro: la póliza en la mano', '¿Llevaste la póliza el día del retiro? Sí / No', 'Juli', 'Showroom de Automotores Kocos', 'Juli busca la póliza en la mochila mientras Leo sostiene la llave', None)]),
  ('adjudicacion', 'autos-sorteo', 'sorteo', False, [
   ('«Te lo damos en la cuota 2»: desconfiá', '¿Te dijeron en qué cuota te toca? Sí / No', 'Mati', 'Taller de aire acondicionado de Mati, Villa Crespo', 'Un conocido le grita a Mati «¡en la cuota 2 lo tenés!» y le choca los cinco', None),
   ('Sorteo o licitación: así se adjudica un plan', '¿Sabés cómo se adjudica un plan? Sí / No', 'Juli', 'Cocina del departamento de Villa Crespo', 'Juli pone dos fichas sobre la mesa: «sorteo» y «licitación»', None),
   ('Plan de ahorro: nadie sabe tu cuota de adjudicación', '¿Participaste alguna vez de una licitación? Sí / No', 'Mati', 'Cocina del departamento de Villa Crespo', 'Mati marca «cuota 3» en el almanaque y Juli lo borra', None)]),
  ('primer-0km', 'autos-anticipo', 'primer-0km', False, [
   ('Tu primer 0 km: la cuota, el precio final y el usado', '¿Vas a comprar tu primer 0 km? Sí / No', 'Juli y Mati', 'Cocina del departamento de Villa Crespo', 'Juli y Mati brindan con mate por «el primer 0 km» y se miran sin saber por dónde empezar', None),
   ('Primera vez en la agencia: llevá esta lista', '¿Fuiste alguna vez a una agencia de 0 km? Sí / No', 'Juli', 'Puerta del showroom de Automotores Kocos', 'Juli frena en la puerta del showroom y saca la libreta', None)]),
 ],
 'mkt': [
  ('consulta', 'mkt-consulta', 'consulta-2103', True, [
   ('21:03: entra una consulta. ¿La contestás mañana?', '¿Qué hacés con una consulta a la noche? La contesto / Mañana', 'Romina', 'Sillón de su casa en Almagro, de noche', 'El celular naranja vibra a las 21:03 y Romina lo da vuelta sobre el sillón', None),
   ('Consulta a la noche: la clienta sigue buscando', '¿Cuánto tardás en responder? Minutos / Horas', 'Romina', 'Mostrador de Dulce Almagro, Av. Corrientes y Medrano', 'Romina abre el chat a la mañana y la clienta ya escribió «gracias, ya encargué»', None)]),
  ('link-bio', 'mkt-bio', 'link-bio', False, [
   ('El link de tu bio: ¿lo tocaste hoy?', '¿Tocaste el link de tu bio esta semana? Sí / No', 'Romina', 'Mostrador de Dulce Almagro', 'Romina toca su propio link y aparece una página de «próximamente»', None),
   ('Bio: qué hacés, para quién, dónde y cómo te escriben', '¿Tu bio dice cómo contactarte? Sí / No', 'Tomi', 'Mesa del local con la notebook de Tomi', 'Tomi lee la bio en voz alta y Romina no reconoce su negocio', None),
   ('Tu bio en 3 segundos: ¿se entiende qué vendés?', '¿Se entiende tu negocio en tu bio? Sí / No', 'Romina', 'Vereda de Medrano, Almagro', 'Una clienta en silueta mira el perfil y se encoge de hombros', None),
   ('Link de la bio a una página vieja: arreglalo hoy', '¿Tu link lleva a la página correcta? Sí / No', 'Tomi', 'Cocina del local, de noche', 'Tomi toca el link y aparece la torta de Pascuas del año pasado', None)]),
  ('precio', 'mkt-precio', 'precio', False, [
   ('«¿Precio?»: la respuesta que avanza', '¿Qué respondés al «¿precio?»? Lo digo / Por privado', 'Romina', 'Mostrador de Dulce Almagro', 'Entra un «¿precio?» seco y Romina ya escribió «por priv…»', None),
   ('«Por privado»: la respuesta que enfría', '¿Te molesta que te digan «por privado»? Sí / No', 'Tomi', 'Mesa del local con la notebook de Tomi', 'Tomi lee «por privado» en un comentario y el chat se cubre de escarcha', None)]),
  ('web', 'mkt-web', 'web-lenta', False, [
   ('Tu web en el colectivo: ¿carga o se van?', '¿Probaste tu web con datos móviles? Sí / No', 'Romina', 'Colectivo por Av. Corrientes, Almagro', 'Romina abre su web en el colectivo y la ruedita gira y gira', None),
   ('Web: 3 segundos de espera ya es mucho', '¿Cuánto tarda tu web? Menos de 3 s / Más', 'Tomi', 'Mesa del local con la notebook de Tomi', 'Tomi cuenta «uno, dos, tres» con los dedos frente a la pantalla en blanco', None)]),
  ('seguimiento', 'mkt-seguir', 'seguir-lopienso', False, [
   ('«Lo pienso»: agendá cuándo volver a escribir', '¿Agendás los «lo pienso»? Sí / No', 'Romina', 'Cocina del local, de noche', 'Llega un «lo pienso» y Romina arrastra el chat a la papelera', None),
   ('Seguimiento: 24 h, 3 días, una semana. Con algo nuevo', '¿Le volviste a escribir a alguien esta semana? Sí / No', 'Romina', 'Mostrador de Dulce Almagro', 'Romina mira la libreta y tres chats viejos laten en el celular naranja', None)]),
  ('google', 'mkt-google', 'google-perfil', False, [
   ('Te buscan en el mapa y no aparecés', '¿Te buscaste en el mapa del celular? Sí / No', 'Romina', 'Esquina de Av. Corrientes y Medrano', 'Una clienta en silueta busca «tortas en Almagro» frente al local y el mapa la manda a otra cuadra', None),
   ('Perfil del negocio: horarios, fotos reales y contacto', '¿Tu perfil tiene los horarios de fiestas? Sí / No', 'Tomi', 'Vidriera de Dulce Almagro', 'Tomi saca una foto de la vidriera y la foto de banco del perfil se despega', None)]),
  ('ausencia', 'mkt-ausencia', 'horarios-ausencia', False, [
   ('Cerrás el 24: ¿tus mensajes lo saben?', '¿Vas a cerrar en las fiestas? Sí / No', 'Romina', 'Puerta de Dulce Almagro con la persiana a medio bajar', 'Romina baja la persiana y el celular naranja empieza a vibrar en el bolsillo', None),
   ('Mensaje de ausencia: lo que tiene que decir', '¿Tu mensaje de ausencia tiene horarios? Sí / No', 'Tomi', 'Mesa del local con la notebook de Tomi', 'Tomi lee el mensaje de ausencia: «no estamos» y nada más', None),
   ('Antes del Cyber Monday: dejá lista la respuesta de madrugada', '¿Te escriben de madrugada? Sí / No', 'Romina', 'Dormitorio de Romina en Almagro, 3 a. m.', 'El celular naranja se ilumina en la mesa de luz a las 3:00 y Romina duerme', None)]),
  ('orden-chats', 'mkt-chats', 'bf-200', False, [
   ('Hoy es Black Friday: 200 chats y una sola persona. Por dónde empezar', '¿Cuántos chats sin responder tenés hoy? Menos de 20 / Más de 20', 'Romina', 'Mostrador de Dulce Almagro, viernes de Black Friday', 'Romina saca una torta del horno y el contador de chats salta de 20 a 200', 7),
   ('Chats por etapa: consulta, presupuesto, pedido', '¿Sabés en qué etapa está cada chat? Sí / No', 'Tomi', 'Cocina del local, de noche', 'Tomi abre el celular de Romina y los chats están todos mezclados', None)]),
  ('whatsapp-business', 'mkt-api', 'api', False, [
   ('WhatsApp Business: ¿lo estás usando entero?', '¿Usás el catálogo de Business? Sí / No', 'Romina', 'Mostrador de Dulce Almagro', 'Romina manda la foto número 15 de tortas sueltas a la misma clienta', None),
   ('Un número, varias personas: ¿te quedó chico tu WhatsApp?', '¿Responden varias personas tus mensajes? Sí / No', 'Romina y Tomi', 'Mostrador de Dulce Almagro', 'Romina y Tomi se pelean por el mismo celular naranja', None)]),
 ],
}

# ---------------------------------------------------------------------------
# Personaje y lugar de Buenos Aires de cada idea del calendario base.
# El conflicto del segundo 1 sale de historias.py (una línea por idea).
# ---------------------------------------------------------------------------
_P = 'Av. Sáenz y Av. Perito Moreno, Nueva Pompeya'
_DEP = 'Depósito de bebidas de Barracas'
_SUP = 'Supermercado de Flores'
_COS = 'Cocina de Sole en Floresta'
_CAB = 'Departamento de Lucía en Caballito, frente a Parque Rivadavia'
_VU = 'Cocina de los Ferreyra en Villa Urquiza'
_ELSA = 'Living de Elsa en Villa Urquiza'
_VC = 'Cocina del departamento de Villa Crespo'
_SHOW = 'Showroom de Automotores Kocos'
_MOS = 'Mostrador de Dulce Almagro, Av. Corrientes y Medrano'
_COC = 'Cocina de Dulce Almagro, de noche'
PL = {
 'vita': {
  'trayecto-casa': ('Nico', _P + ', 7:40'), 'art-trayecto': ('Nico', _DEP), 'culpa-mito': ('Sole', 'Depósito del supermercado de Flores'),
  'culpa-error': ('Nico', _DEP), 'choque-24h': ('Nico', 'Av. Montes de Oca, Barracas, de noche'),
  'choque-fiestas': ('Nico', 'Avenida de Nueva Pompeya con guirnaldas'), 'nunca-frases': ('Nico', _P),
  'nunca-arreglo': ('Nico', 'Calle de Barracas junto a Av. Montes de Oca'), 'art-rechazo': ('Sole', _COS),
  'alta-dolor': ('Sole', _SUP), 'alta-comision': ('Sole', _COS), 'sin-seguro': ('Nico', 'Av. Montes de Oca, Barracas'),
  'firma': ('Nico', 'Bar de Nueva Pompeya'), 'danos': ('Nico', 'Taller mecánico genérico de Nueva Pompeya'),
  'despido': ('Sole', 'Oficina del supermercado de Flores'), 'liquidacion': ('Sole', 'Mesa de Sole en Floresta'),
  'aguinaldo-fecha': ('Sole', 'Caja del supermercado de Flores'), 'aguinaldo-proporcional': ('Sole', _COS),
  'no-registrado': ('Nico', _DEP), 'reforma': ('Sole', 'Sobremesa en la casa de Sole, Floresta'),
  'telegrama': ('Sole', 'Puerta de la casa de Sole en Floresta'), 'certificado': ('Sole', _SUP),
  'penal-citacion': ('Nico', 'Casa de Nico en Nueva Pompeya'), 'penal-lesiones': ('Nico', 'Barracas y la guardia de un hospital genérico'),
 },
 'cob': {
  'mono-aporte': ('Lucía', _CAB), 'mono-revisa': ('Lucía', _CAB), 'recibo-3': ('Gabriel', _VU), 'recibo-elegir': ('Gabriel', _VU),
  'aumento-comparar': ('Vero', _VU), 'aumento-dic': ('Vero y Gabriel', _VU), 'plan-uso': ('Gabriel', _VU),
  'cambio-antes': ('Lucía', _CAB), 'cambio-tratamientos': ('Lucía', _CAB), 'carencias': ('Gabriel', _VU),
  'opcion-anual': ('Lucía', _CAB), 'opcion-tarda': ('Lucía', _CAB), 'familia': ('Los Ferreyra', 'Mesa de los Ferreyra en Villa Urquiza'),
  'cartilla-guardia': ('Vero', 'Guardia de una clínica genérica de Villa Urquiza, de noche'),
  'cartilla-zona': ('Los Ferreyra', 'Vereda de Villa Urquiza, cerca de Av. Triunvirato, cargando el auto'),
  'preex': ('Elsa', _ELSA), '65': ('Elsa', _ELSA), 'baja-27': ('Gabriel', _VU), 'aguinaldo-aportes': ('Gabriel', _VU),
  'vacaciones': ('Lucía', _CAB), 'derivar': ('Gabriel', _VU), 'fallo-corte': ('Gabriel', _VU), 'reintegros': ('Vero', _VU),
 },
 'autos': {
  'usado-valor': ('Mati y Juli', 'Vereda de Villa Crespo con «el gris» estacionado'), 'usado-papeles': ('Juli', _VC),
  'voto-0km': ('Juli y Mati', _VC), 'voto-anticipo': ('Juli y Mati', _VC), 'aguinaldo-anticipo': ('Juli y Mati', _VC),
  'plan-cuota': ('Mati', 'Vereda de Villa Crespo'), 'plan-preguntas': ('Juli y Leo', _SHOW), 'sorteo': ('Mati', 'Taller de aire acondicionado de Mati, Villa Crespo'),
  'adjudicacion': ('Juli y Mati', _VC), 'lista': ('Juli, Mati y Leo', _SHOW), 'lista-costos': ('Mati y Leo', _SHOW),
  'blackfriday': ('Mati y Juli', 'Sillón del departamento de Villa Crespo'), 'retiro-chasis': ('Juli', _SHOW + ', día del retiro'),
  'retiro-kit': ('Mati', 'Av. Juan B. Justo, de noche'), 'dic-ene': ('Juli y Mati', _VC), 'primer-0km': ('Juli', _VC),
  'seguro': ('Mati y Leo', _SHOW), 'prendario': ('Juli y Leo', _SHOW), 'contado-plan': ('Juli y Mati', _VC),
  'garantia': ('Mati', 'Av. Corrientes, Villa Crespo'), 'hibrido': ('Mati y Juli', _SHOW), 'documentacion': ('Juli y Leo', _SHOW),
  'gastos-fijos': ('Juli', _VC), 'ruta': ('Juli y Mati', 'Vereda de Villa Crespo, cargando el 0 km'),
  'patentamientos': ('Mati', 'Taller de aire acondicionado de Mati, Villa Crespo'),
 },
 'mkt': {
  'bf-200': ('Romina', _MOS), 'etiquetas': ('Romina', _COC), 'consulta-2103': ('Romina', 'Sillón de su casa en Almagro, de noche'),
  'consulta-domingo': ('Romina', 'Plaza Almagro, domingo 11:40'), 'precio': ('Romina', _MOS), 'precio-antes': ('Tomi y Romina', 'Mesa del local con la notebook de Tomi'),
  'seguir-lopienso': ('Romina', _COC), 'seguir-calendario': ('Romina', _MOS), 'web-lenta': ('Romina; clienta en silueta de espaldas', 'Colectivo por Av. Corrientes, Almagro'),
  'web-movil': ('Romina', 'Vereda de Medrano, Almagro'), 'google-perfil': ('Romina; clienta en silueta de espaldas', 'Esquina de Av. Corrientes y Medrano'),
  'google-fotos': ('Tomi', 'Vidriera de Dulce Almagro'), 'resp-rapidas': ('Romina y Tomi', _MOS),
  'link-bio': ('Romina; clienta en silueta de espaldas', _MOS), 'horarios-ausencia': ('Romina', 'Puerta de Dulce Almagro'),
  'cyber-ausencia': ('Romina', 'Dormitorio de Romina en Almagro, 3 a. m.'), 'api': ('Romina y Tomi', _MOS), 'catalogo': ('Romina', _COC),
  'checklist': ('Romina y Tomi', _MOS), 'aguinaldo-ventas': ('Romina', _MOS), 'resenas': ('Romina', _MOS),
  'pedidos-fiestas': ('Romina', _COC), 'mensajes-ig': ('Tomi', 'Mesa del local con la notebook de Tomi'), 'estados': ('Romina', 'Vidriera navideña de Dulce Almagro'),
 },
}

# Giros irreales por marca (estilo del boceto de VITA). Se rotan; dos piezas de la misma idea nunca repiten giro.
GIROS = {
 'vita': [
  'Nico queda diminuto sobre un contrato gigante; cae una lapicera enorme y él cae entre las hojas hasta su sillón',
  'El cronómetro dorado crece hasta tapar la avenida y el personaje queda parado sobre la aguja',
  'La esquina se pliega como una maqueta de papel y la cámara entra por una alcantarilla de juguete',
  'El sello dorado cae del cielo como un meteorito y se clava en la vereda con «ESPERÁ»',
  'La moto de Nico queda congelada en el aire y la cámara da una vuelta de 360° alrededor del instante',
  'La carta se despliega como una alfombra kilométrica por la vereda',
  'Sole se achica hasta caber en la credencial y camina sobre la letra chica como sobre una vereda',
  'La guardia gira 90° y el personaje camina por la pared hasta la puerta del consultorio',
  'Los papeles de la mesa caen como fichas de dominó y frenan justo en el que hay que firmar',
  'Un reloj de arena gigante vacía arena sobre la escena hasta marcar la fecha',
  'La cámara atraviesa el ojo de una cerradura gigante y sale en el escritorio de la narradora',
  'Un papel cae en cámara lenta desde un edificio de Barracas y aterriza convertido en el telegrama',
  'La avenida se enrolla como un recibo y deja al personaje frente a la puerta del estudio',
  'La lapicera dorada gira como una hélice, levanta las hojas y las acomoda en orden',
 ],
 'cob': [
  'La carta de la prepaga crece al tamaño del edificio y el personaje la recorre con la lupa como un mapa',
  'El recibo se despliega en acordeón hasta el techo y el «3 %» cae como una moneda gigante',
  'La lupa menta se agranda como una ventana y la cocina entera se ve aumentada a través de ella',
  'La familia queda en miniatura sobre la cartilla abierta, que se dobla como un mapa de rutas',
  'El celular vibra tan fuerte que la heladera suelta todos los imanes en cámara lenta',
  'Una barra de aumento sale del celular, crece como un rascacielos y la cámara sube por ella',
  'La torta de 65 de Elsa se convierte en un calendario que gira hacia atrás los años de antigüedad',
  'La cuota se parte como una pizza y una porción vuela hasta una tarjeta genérica de obra social',
  'La sala de espera se estira como un túnel infinito mientras el reloj marca las 2:00',
  'Lucía cae dentro de la taza verde y aparece caminando por Parque Rivadavia',
  'La letra chica se levanta del papel y forma una escalera que el personaje sube',
  'La valija se abre y adentro hay una cartilla del tamaño de un estadio',
  'La cámara entra por debajo de la puerta junto con la carta',
  'Dos folletos de prepagas chocan en el aire como naipes gigantes y se reordenan',
 ],
 'autos': [
  'El ticket de la impresora de Leo sale sin parar, cruza el showroom y llega hasta Av. Juan B. Justo',
  'La llave del 0 km gira gigante en el aire y la cámara pasa por el agujero del llavero',
  'Juli y Mati quedan diminutos sobre la calculadora y saltan de tecla en tecla',
  '«El gris» sube como en un elevador de taller y la cámara lo recorre por debajo en 360°',
  'La pantalla partida de la votación se rompe como un vidrio y los pedazos arman la respuesta',
  'El showroom se da vuelta: los autos en silueta cuelgan del techo y Juli camina sobre las luces',
  'La linterna del celular proyecta un haz gigante que lee el número de chasis como un cartel de autopista',
  'Una ficha del plan cae como una moneda gigante y rueda por Av. Corrientes',
  'La carpeta de papeles se abre y las hojas vuelan hasta formar la silueta del 0 km',
  'Mati se achica y entra al tablero del 0 km como si fuera una ciudad iluminada',
  'La cuota sube en un ascensor de vidrio por la fachada del edificio de Villa Crespo',
  'El 0 km sale del showroom en cámara lenta y frena a un centímetro de la cámara',
  'Un bombo de sorteo gigante gira en la vereda y las bolillas ruedan por toda la cuadra',
  'La póliza se pliega como un avión de papel y aterriza en la mano del personaje',
 ],
 'mkt': [
  'El celular naranja vibra tan fuerte que la torta salta de la mesada y queda suspendida en el aire',
  'Las burbujas de chat se apilan hasta el techo y Romina las ordena como ladrillos de colores',
  'Romina queda diminuta frente a un celular del tamaño de la vidriera y trepa por el contador «sin responder»',
  'Las agujas del reloj de la pared se vuelven una flecha que vuela hasta el sillón',
  'La vereda de Medrano se dobla hacia arriba y Romina camina sobre la pantalla del celular',
  'La libreta de pedidos se abre como un libro desplegable y aparece la pastelería en miniatura',
  'Etiquetas de colores caen del cielo como confeti gigante y se pegan sobre cada chat',
  'El barrido naranja parte el local en dos: a la izquierda gris y tachado, a la derecha ordenado',
  'La página se carga como una barra que se derrite sobre el asiento del colectivo',
  'Un pin de mapa gigante cae sobre Almagro y la cámara baja en picada hasta la vidriera',
  'Los mensajes de madrugada entran por la ventana como luciérnagas y se posan en el celular',
  'Tomi saca una foto y la vidriera entera queda congelada dentro del cuadro',
  'Silencio de golpe: las burbujas explotan en cámara lenta y queda un solo chat respondido',
  'La cámara atraviesa la vitrina de tortas y sale por la pantalla de la notebook de Tomi',
 ],
}

# Aperturas distintas para las versiones B (cambian el primer segundo, no solo el gancho).
APERTURAS = {
 'vita': ['Abre en el final congelado y rebobina: ', 'Abre en un primer plano del objeto y la cámara se aleja: ',
          'Abre desde arriba, en plano cenital de maqueta: ', 'Abre con el golpe del sello y recién después se ve que '],
 'cob': ['Abre en la lupa sobre la letra chica y se aleja: ', 'Abre en el final y rebobina: ',
         'Abre en plano cenital de la mesa: ', 'Abre con el celular vibrando en primer plano: '],
 'autos': ['Abre en el ticket que sale de la impresora y se aleja: ', 'Abre en el final y rebobina: ',
           'Abre en primera persona, desde los ojos del personaje: ', 'Abre con la llave girando en primer plano: '],
 'mkt': ['Abre en el contador «sin responder» y se aleja: ', 'Abre en el final y rebobina: ',
         'Abre en plano cenital de la mesada: ', 'Abre con el celular naranja vibrando en primer plano: '],
}

PRIMER_PLANO = {
 'vita': ['el cronómetro dorado', 'el sello «ESPERÁ»', 'el papel sobre la mesa', 'el casco blanco de Nico', 'el celular con la notificación'],
 'cob': ['la lupa menta', 'la carta de la prepaga', 'el recibo en acordeón', 'el celular con funda menta', 'la heladera con imanes'],
 'autos': ['la impresora de ticket', 'la llave que gira', 'la linterna sobre la chapa', 'la libreta de Juli', 'la carpeta de papeles'],
 'mkt': ['el celular naranja', 'el contador «sin responder»', 'la libreta de pedidos', 'la vitrina de tortas', 'la notebook con stickers'],
}
ORDENES = ['arranca por el final y vuelve al conflicto', 'pregunta → caso → pasos', 'dato primero, caso después',
           'pasos en cuenta regresiva', 'caso → giro → pregunta']
CAMARAS = ['órbita en sentido inverso', 'plano cenital que baja', 'travelling lateral', 'acercamiento rápido al objeto',
           'cámara en mano con golpe al inicio', 'escala imposible: de miniatura a gigante']
MUSICAS = ['otra pista de la biblioteca propia, +8 % de tempo', 'versión sin voz para audio en tendencia de la biblioteca de Instagram',
           'piano grave en vez de pulso', 'golpe seco al inicio y silencio en el segundo 2']
PALETAS = ['variante clara dentro de la paleta de la marca', 'variante nocturna dentro de la paleta de la marca',
           'luz cálida lateral en vez de cenital']
OBJETO = {'vita': 'el sello dorado', 'cob': 'la lupa menta', 'autos': 'el ticket de Leo', 'mkt': 'el celular naranja'}

# Carruseles: base en días 0, 2, 4, 6 y 8 (Autos: Black Friday pasa al 27/11, día 7). Variantes en los demás días.
# día: (idea_id, título, idea madre en otro formato o None)
CARR_VAR = {
 'vita': {1: ('aguinaldo-fecha', 'Aguinaldo de diciembre: calendario y recibo, lámina por lámina', None),
          3: ('despido', 'Despido: lo que pedís por escrito, paso a paso', None),
          5: ('choque-24h', 'Choque: las primeras 24 h en 6 láminas', None),
          7: ('art-rechazo', 'Rechazo de la ART: los pasos en orden', None),
          9: ('trayecto-casa', 'Trayecto: ¿accidente laboral? Las preguntas para saberlo', None)},
 'cob': {1: ('aumento-comparar', 'Aviso de aumento: la lista para comparar', None),
         3: ('baja-27', 'Prepaga dada de baja: qué hacer, en orden', None),
         5: ('mono-revisa', 'Monotributo: lo que revisás en 5 minutos', None),
         7: ('cambio-antes', 'Cambio de prepaga: la lista antes de firmar', None),
         9: ('recibo-3', 'Recibo de sueldo: el 3 % explicado lámina por lámina', None)},
 'autos': {1: ('usado-valor', 'Usado como parte de pago: la carpeta que suma', None),
           2: ('plan-cuota', 'Plan de ahorro: por qué cambia la cuota', 'reel'),
           3: ('plan-preguntas', 'Plan de ahorro: una pregunta por lámina', None),
           5: ('lista', 'El ticket del 0 km, renglón por renglón', None),
           9: ('retiro-chasis', 'Día del retiro: la lista para llevar impresa', None)},
 'mkt': {1: ('checklist', 'Antes de diciembre: el checklist de tus mensajes', None),
         3: ('google-perfil', 'Tu perfil de negocio completo en 5 láminas', None),
         5: ('bf-200', 'Antes del Cyber Monday: tus mensajes en 3 arreglos', None),
         7: ('precio', '«¿Precio?»: 3 respuestas que avanzan', None),
         9: ('seguir-lopienso', '«Lo pienso»: el calendario de seguimiento', None)},
}
