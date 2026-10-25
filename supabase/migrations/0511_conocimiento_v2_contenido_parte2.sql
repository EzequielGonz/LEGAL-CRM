-- 25/10 · Contenido de la versión 2 del conocimiento del bot (Biblioteca Maestra de Ventas), parte 2 de 4.
-- Generado por docs/conocimiento/v2/generar.py. Repetible sin error: inserta lo que falta y
-- no pisa ítems que el equipo ya editó (on conflict do nothing).
-- En total 166 ítems: 2 generales, 4 de base por rubro, 12 temas, 148 fichas de objeción (4 inactivas porque las resuelve una regla del sistema). Esta parte: 42.
insert into public.bot_knowledge_items (version, clave, capa, rubro, titulo, disparadores, contenido, fuente, verificado_el, activo, orden) values
  (2, $k$O025$k$, $k$objecion$k$, $k$comun$k$, $k$No quiero comprometerme$k$, array[$k$no quiero comprometerme$k$,$k$sin compromiso$k$,$k$no quiero atarme$k$,$k$quedar atado$k$,$k$permanencia$k$]::text[], $k$«No quiero comprometerme». Puede ser: Temor a contratos, permanencia o cargos ocultos.
Para entender (si hace falta): «¿Qué parte te preocupa: plazo, pago, baja o cesión de datos?»
Enfoque, con tus palabras: Tiene sentido entender obligaciones antes de aceptar. Te aclaramos por escrito condiciones, vigencia y posibles costos; una consulta no implica contratación por sí sola.
Evitá: Ocultar términos hasta el último momento.$k$, $k$Biblioteca Maestra, ficha O025$k$, null, true, 24),
  (2, $k$O026$k$, $k$objecion$k$, $k$comun$k$, $k$Me están apurando$k$, array[$k$me estan apurando$k$,$k$no me apuren$k$,$k$no me presiones$k$,$k$me presionan$k$,$k$cuanta insistencia$k$,$k$dejen de insistir$k$]::text[], $k$«Me están apurando». Puede ser: Reactancia ante presión percibida.
Para entender (si hace falta): «¿Preferís que corte el seguimiento y te deje la información?»
Enfoque, con tus palabras: Gracias por decirlo. Bajo el ritmo y te dejo decidir. Sólo mencionaré fechas si están respaldadas y realmente afectan tu elección.
Evitá: Aplicar presión emocional o culpa.$k$, $k$Biblioteca Maestra, ficha O026$k$, null, true, 25),
  (2, $k$O027$k$, $k$objecion$k$, $k$comun$k$, $k$Estoy comparando varias opciones$k$, array[$k$estoy comparando$k$,$k$estoy viendo opciones$k$,$k$comparando$k$,$k$averiguando$k$,$k$viendo otras$k$,$k$consultando en otros$k$]::text[], $k$«Estoy comparando varias opciones». Puede ser: Búsqueda racional de referencia y reducción de incertidumbre.
Para entender (si hace falta): «¿Qué criterios estás usando: costo total, calidad, tiempo o soporte?»
Enfoque, con tus palabras: Bien hecho. Una tabla comparable suele ayudar más que un argumento comercial. Podés evaluar cada opción con las mismas variables.
Evitá: Inventar diferencias competitivas.$k$, $k$Biblioteca Maestra, ficha O027$k$, null, true, 26),
  (2, $k$O028$k$, $k$objecion$k$, $k$comun$k$, $k$¿Y si después me arrepiento?$k$, array[$k$me arrepiento$k$,$k$arrepentirme$k$,$k$si no me gusta$k$,$k$puedo cancelar$k$,$k$devolucion$k$]::text[], $k$«¿Y si después me arrepiento?». Puede ser: Temor a irreversibilidad, costos hundidos y pérdida de control.
Para entender (si hace falta): «¿Te preocupa la cancelación, el reintegro o el inicio del servicio?»
Enfoque, con tus palabras: Antes de asumir nada conviene conocer por escrito las condiciones de baja, eventuales derechos de revocación aplicables y gastos ya incurridos.
Evitá: Prometer devolución universal donde no corresponde.$k$, $k$Biblioteca Maestra, ficha O028$k$, null, true, 27),
  (2, $k$O029$k$, $k$objecion$k$, $k$juridico$k$, $k$La ART me dio el alta y sigo con dolor$k$, array[$k$me dio el alta$k$,$k$me dieron el alta$k$,$k$el alta$k$,$k$sigo con dolor$k$,$k$todavia me duele$k$,$k$me sigue doliendo$k$]::text[], $k$«La ART me dio el alta y sigo con dolor». Puede ser: Duda médica y jurídica sobre alta, secuelas y trámite aplicable.
Para entender (si hace falta): «¿Cuándo te notificaron el alta y qué prestaciones continúan pendientes?»
Enfoque, con tus palabras: El alta no impide revisar una disconformidad. La SRT contempla trámites específicos, pero los requisitos y plazos dependen de la situación; un profesional puede revisar las constancias.
Evitá: Diagnosticar incapacidad por chat.$k$, $k$Biblioteca Maestra, ficha O029$k$, null, true, 28),
  (2, $k$O030$k$, $k$objecion$k$, $k$juridico$k$, $k$La ART rechazó mi accidente$k$, array[$k$rechazo mi accidente$k$,$k$rechazaron$k$,$k$rechazo el siniestro$k$,$k$no me reconocen$k$,$k$la art rechazo$k$,$k$rechazo$k$]::text[], $k$«La ART rechazó mi accidente». Puede ser: Necesita distinguir denuncia, rechazo formal y motivo.
Para entender (si hace falta): «¿Tenés la notificación del rechazo y sabés qué fundamento menciona?»
Enfoque, con tus palabras: Hay mecanismos de revisión ante la SRT y análisis jurídico del caso. Conviene identificar si se discute la contingencia o las prestaciones antes de evaluar opciones.
Evitá: Prometer que el rechazo se revierte.$k$, $k$Biblioteca Maestra, ficha O030$k$, null, true, 29),
  (2, $k$O031$k$, $k$objecion$k$, $k$juridico$k$, $k$Me accidenté y mi empleador no hizo la denuncia$k$, array[$k$no hizo la denuncia$k$,$k$no me denunciaron$k$,$k$no me dio de alta en la art$k$,$k$no denuncio$k$,$k$mi jefe no$k$]::text[], $k$«Me accidenté y mi empleador no hizo la denuncia». Puede ser: Miedo a represalias y desconocimiento de vías de denuncia.
Para entender (si hace falta): «¿Ocurrió trabajando o yendo o volviendo por el trayecto habitual?»
Enfoque, con tus palabras: Es importante documentar fecha, lugar y lo sucedido. La existencia de una denuncia y la cobertura se evalúan según el caso; un abogado puede orientar sobre pasos pertinentes.
Evitá: Asegurar cobertura sin examinar hechos.$k$, $k$Biblioteca Maestra, ficha O031$k$, null, true, 30),
  (2, $k$O032$k$, $k$objecion$k$, $k$juridico$k$, $k$Fue yendo al trabajo, ¿cuenta?$k$, array[$k$yendo al trabajo$k$,$k$volviendo del trabajo$k$,$k$in itinere$k$,$k$en el trayecto$k$,$k$camino al trabajo$k$,$k$yendo a trabajar$k$]::text[], $k$«Fue yendo al trabajo, ¿cuenta?». Puede ser: Confusión entre accidente in itinere y traslado personal.
Para entender (si hace falta): «¿Era tu recorrido habitual y hubo desvíos o interrupciones?»
Enfoque, con tus palabras: Los accidentes en el trayecto pueden tener tratamiento particular en riesgos del trabajo. Los detalles del recorrido importan y no conviene concluir sin revisarlos.
Evitá: Responder que todos los trayectos quedan cubiertos.$k$, $k$Biblioteca Maestra, ficha O032$k$, null, true, 31),
  (2, $k$O033$k$, $k$objecion$k$, $k$juridico$k$, $k$No tengo testigos$k$, array[$k$no tengo testigos$k$,$k$sin testigos$k$,$k$nadie vio$k$,$k$no hay testigos$k$]::text[], $k$«No tengo testigos». Puede ser: Temor a imposibilidad probatoria.
Para entender (si hace falta): «¿Tenés constancias médicas, comunicaciones o registros de fecha y lugar?»
Enfoque, con tus palabras: La prueba no se limita a testigos presenciales. Un profesional puede analizar mensajes, atención médica, denuncias y otros indicios sin anticipar el resultado.
Evitá: Asegurar éxito con cualquier captura.$k$, $k$Biblioteca Maestra, ficha O033$k$, null, true, 32),
  (2, $k$O034$k$, $k$objecion$k$, $k$juridico$k$, $k$Ya pasaron muchos meses$k$, array[$k$muchos meses$k$,$k$hace mucho$k$,$k$hace años$k$,$k$hace anos$k$,$k$ya paso mucho tiempo$k$,$k$prescri*$k$,$k$se vencio$k$]::text[], $k$«Ya pasaron muchos meses». Puede ser: Miedo a plazos y pérdida de derechos.
Para entender (si hace falta): «¿De qué hecho se trata y cuál fue la última notificación formal?»
Enfoque, con tus palabras: Los plazos cambian según trámite, jurisdicción y actuaciones realizadas. Es importante que un profesional examine fechas exactas, sin asumir prescripción ni vigencia.
Evitá: Dar un plazo único para todos los reclamos.$k$, $k$Biblioteca Maestra, ficha O034$k$, null, true, 33),
  (2, $k$O035$k$, $k$objecion$k$, $k$juridico$k$, $k$No sé si tengo incapacidad$k$, array[$k$incapacidad$k$,$k$porcentaje$k$,$k$secuela$k$,$k$me quedo una secuela$k$]::text[], $k$«No sé si tengo incapacidad». Puede ser: Confunde dolor, lesión y porcentaje jurídico-laboral.
Para entender (si hace falta): «¿Recibiste alta y existe evaluación médica documentada?»
Enfoque, con tus palabras: El porcentaje de incapacidad no se deduce de una descripción por WhatsApp. Depende de evaluación médica y procedimiento correspondiente; se puede revisar qué documentación existe.
Evitá: Inventar porcentajes de incapacidad.$k$, $k$Biblioteca Maestra, ficha O035$k$, null, true, 34),
  (2, $k$O036$k$, $k$objecion$k$, $k$juridico$k$, $k$Mi abogado no me responde$k$, array[$k$mi abogado no$k$,$k$ya tengo abogado$k$,$k$tengo abogado$k$,$k$tengo un abogado$k$,$k$con un abogado$k$,$k$otro estudio$k$]::text[], $k$«Mi abogado no me responde». Puede ser: Posible conflicto de representación, ética y expectativas.
Para entender (si hace falta): «¿Querés resolver una duda general o evaluar una segunda opinión formal?»
Enfoque, con tus palabras: Es válido querer claridad. Para evitar interferir en un asunto con patrocinio vigente, un profesional puede explicar cómo solicitar información y qué alternativas éticas existen.
Evitá: Captar indebidamente clientes patrocinados.
Decisión 25/10: una sola pregunta por si busca una segunda opinión, sin cuestionar a su abogado; si dice que no, detener_contacto.$k$, $k$Biblioteca Maestra, ficha O036$k$, null, true, 35),
  (2, $k$O037$k$, $k$objecion$k$, $k$juridico$k$, $k$Otro abogado me prometió más dinero$k$, array[$k$otro abogado me prometio$k$,$k$me prometio mas$k$,$k$otro estudio me ofrecio$k$,$k$me ofrecieron mas$k$]::text[], $k$«Otro abogado me prometió más dinero». Puede ser: Anclaje monetario sin sustento y posible engaño.
Para entender (si hace falta): «¿Ese cálculo está documentado y qué supuestos utilizaron?»
Enfoque, con tus palabras: El monto eventual depende de prueba, encuadre y valoración profesional. Comparar cifras sin fundamento puede generar falsas expectativas; mejor pedir explicación técnica.
Evitá: Superar promesas inventando montos.
Decisión 25/10: si ya tiene abogado, una sola pregunta por segunda opinión, sin cuestionarlo; nunca montos.$k$, $k$Biblioteca Maestra, ficha O037$k$, null, true, 36),
  (2, $k$O038$k$, $k$objecion$k$, $k$juridico$k$, $k$¿Cuánto voy a cobrar por mi lesión?$k$, array[$k$cuanto voy a cobrar$k$,$k$cuanto cobro$k$,$k$cuanto me pagan$k$,$k$cuanto me corresponde$k$,$k$cuanta plata$k$,$k$indemnizacion$k$,$k$cuanto me toca$k$]::text[], $k$«¿Cuánto voy a cobrar por mi lesión?». Puede ser: Busca previsibilidad económica de un reclamo.
Para entender (si hace falta): «¿Qué tipo de caso y documentación médica hay disponible?»
Enfoque, con tus palabras: Sin datos clínicos, fechas y encuadre jurídico no se puede estimar responsablemente una indemnización. El abogado puede valorar escenarios y explicar incertidumbres.
Evitá: Dar cotización jurídica instantánea.$k$, $k$Biblioteca Maestra, ficha O038$k$, null, true, 37),
  (2, $k$O039$k$, $k$objecion$k$, $k$juridico$k$, $k$¿Me cobran por consultar?$k$, array[$k$me cobran por consultar$k$,$k$la consulta es gratis$k$,$k$cuanto cobran$k$,$k$honorarios$k$,$k$tiene costo$k$,$k$es gratis$k$,$k$cobran algo$k$]::text[], $k$«¿Me cobran por consultar?». Puede ser: Temor a honorarios y gastos ocultos.
Para entender (si hace falta): «¿Buscás una orientación inicial o representación en un expediente?»
Enfoque, con tus palabras: Podemos aclarar las condiciones de la consulta inicial ofrecida por el estudio; honorarios, gastos y alcance posterior deben confirmarse por escrito con el profesional.
Evitá: Confundir consulta gratuita con litigio gratis.
Si la ficha del negocio dice cómo es la consulta, usalo; si no, el profesional lo explica.$k$, $k$Biblioteca Maestra, ficha O039$k$, null, true, 38),
  (2, $k$O040$k$, $k$objecion$k$, $k$juridico$k$, $k$Choqué y el seguro no responde$k$, array[$k$el seguro no responde$k$,$k$la aseguradora no$k$,$k$el seguro no me$k$,$k$no me pagan el seguro$k$,$k$choque y el seguro$k$]::text[], $k$«Choqué y el seguro no responde». Puede ser: Necesidad de diferenciar reclamo a aseguradora y proceso judicial.
Para entender (si hace falta): «¿Cuándo fue el siniestro y ante qué aseguradora se denunció?»
Enfoque, con tus palabras: Hay que distinguir si existe denuncia, reclamo y respuesta formal. Las pólizas y la normativa importan; el equipo jurídico puede revisar documentos y posibilidades.
Evitá: Prometer pago del seguro.$k$, $k$Biblioteca Maestra, ficha O040$k$, null, true, 39),
  (2, $k$O041$k$, $k$objecion$k$, $k$juridico$k$, $k$Tuve un choque sin lesiones$k$, array[$k$sin lesiones$k$,$k$solo daños$k$,$k$solo danos$k$,$k$solo el auto$k$,$k$choque sin$k$,$k$daño material$k$,$k$dano material$k$]::text[], $k$«Tuve un choque sin lesiones». Puede ser: Piensa que la ausencia de lesiones elimina toda opción de reclamo.
Para entender (si hace falta): «¿El reclamo es por daños materiales, franquicia u otro concepto?»
Enfoque, con tus palabras: Puede existir un conflicto patrimonial aun sin lesiones. Importa documentar daños, responsabilidades y cobertura; el resultado requiere revisión individual.
Evitá: Presentarlo como indemnización automática.$k$, $k$Biblioteca Maestra, ficha O041$k$, null, true, 40),
  (2, $k$O042$k$, $k$objecion$k$, $k$juridico$k$, $k$No tenía seguro al chocar$k$, array[$k$no tenia seguro$k$,$k$sin seguro$k$,$k$no estaba asegurado$k$,$k$no tengo seguro$k$]::text[], $k$«No tenía seguro al chocar». Puede ser: Temor a rechazo inmediato o sanciones.
Para entender (si hace falta): «¿Buscás reclamar a un tercero o te llegó un reclamo en contra?»
Enfoque, con tus palabras: No tener seguro cambia riesgos y defensas, pero no permite decidir en abstracto qué corresponde. El profesional necesita conocer hechos y documentación.
Evitá: Garantizar que igual cobra todo.$k$, $k$Biblioteca Maestra, ficha O042$k$, null, true, 41),
  (2, $k$O043$k$, $k$objecion$k$, $k$juridico$k$, $k$El otro conductor huyó$k$, array[$k$se dio a la fuga$k$,$k$huyo$k$,$k$se escapo$k$,$k$se fue sin$k$,$k$no se quien fue$k$]::text[], $k$«El otro conductor huyó». Puede ser: Problemas probatorios e identificación.
Para entender (si hace falta): «¿Existe denuncia, cámara, patente parcial o testigo?»
Enfoque, con tus palabras: La identificación y la cobertura pueden complicarse. Con documentación disponible se pueden evaluar caminos legales, sin crear expectativas de recupero seguro.
Evitá: Afirmar que una cámara basta para cobrar.$k$, $k$Biblioteca Maestra, ficha O043$k$, null, true, 42),
  (2, $k$O044$k$, $k$objecion$k$, $k$juridico$k$, $k$Me llegó una carta documento$k$, array[$k$carta documento$k$,$k$telegrama$k$,$k$me intimaron$k$,$k$intimacion$k$]::text[], $k$«Me llegó una carta documento». Puede ser: Ansiedad por lenguaje formal y posibles plazos.
Para entender (si hace falta): «¿Podés indicar fecha de recepción y asunto general sin exponer datos sensibles?»
Enfoque, con tus palabras: Una notificación formal puede requerir respuesta oportuna. No conviene ignorarla ni contestar impulsivamente; un abogado debe verla con prioridad según su contenido.
Evitá: Redactar defensa definitiva sin revisión.$k$, $k$Biblioteca Maestra, ficha O044$k$, null, true, 43),
  (2, $k$O045$k$, $k$objecion$k$, $k$juridico$k$, $k$Estoy citado a declarar$k$, array[$k$citado a declarar$k$,$k$me citaron$k$,$k$citacion$k$,$k$tengo que declarar$k$,$k$indagatoria$k$,$k$me llego una cedula$k$]::text[], $k$«Estoy citado a declarar». Puede ser: Riesgo procesal y necesidad de asesoramiento penal.
Para entender (si hace falta): «¿La citación indica fecha, autoridad y carácter en el que te convocan?»
Enfoque, con tus palabras: Conviene revisar la citación con un profesional penal antes de actuar. No corresponde darte una estrategia de declaración por chat, especialmente si hay urgencia.
Evitá: Sugerir mentir o evitar autoridades.
Urgencia penal: escalar_a_humano enseguida; no cuestionario ni qué declarar.$k$, $k$Biblioteca Maestra, ficha O045$k$, null, true, 44),
  (2, $k$O046$k$, $k$objecion$k$, $k$juridico$k$, $k$Me detuvieron a un familiar$k$, array[$k$detuvieron$k$,$k$detenido$k$,$k$detenida$k$,$k$preso$k$,$k$presa$k$,$k$esta en la comisaria$k$,$k$lo llevaron$k$,$k$la llevaron$k$,$k$lo arrestaron$k$,$k$arresto$k$]::text[], $k$«Me detuvieron a un familiar». Puede ser: Urgencia penal, estrés y necesidad de actuación humana.
Para entender (si hace falta): «¿En qué dependencia está y hay un profesional interviniendo?»
Enfoque, con tus palabras: Es una situación para asistencia letrada inmediata. El estudio puede orientar el contacto con un abogado penal; no prometemos liberación ni damos indicaciones para evadir procedimientos.
Evitá: Demorar con preguntas comerciales.
Urgencia penal: escalar_a_humano enseguida; preguntá a lo sumo dónde está; sin promesas.$k$, $k$Biblioteca Maestra, ficha O046$k$, null, true, 45),
  (2, $k$O047$k$, $k$objecion$k$, $k$juridico$k$, $k$Tengo una denuncia penal en mi contra$k$, array[$k$denuncia penal$k$,$k$me denunciaron$k$,$k$tengo una denuncia$k$,$k$causa penal$k$,$k$me imputaron$k$,$k$imputado$k$]::text[], $k$«Tengo una denuncia penal en mi contra». Puede ser: Temor reputacional y procesal.
Para entender (si hace falta): «¿Recibiste una notificación formal o es una información informal?»
Enfoque, con tus palabras: La diferencia entre rumor, denuncia y citación importa. Lo prudente es revisión confidencial con abogado penal para comprender etapa y derechos.
Evitá: Calificar culpabilidad o inocencia por chat.
Prioridad profesional penal: escalar_a_humano; confidencialidad, sin pedir detalles por chat.$k$, $k$Biblioteca Maestra, ficha O047$k$, null, true, 46),
  (2, $k$O048$k$, $k$objecion$k$, $k$juridico$k$, $k$Quiero hacer una sucesión$k$, array[$k$sucesion$k$,$k$sucesorio$k$,$k$herencia$k$,$k$heredar$k$,$k$fallecio$k$,$k$murio mi*$k$]::text[], $k$«Quiero hacer una sucesión». Puede ser: Confusión entre herencia, inmuebles y formalización.
Para entender (si hace falta): «¿En qué jurisdicción estaba el último domicilio del causante y qué bienes conocen?»
Enfoque, con tus palabras: La sucesión requiere determinar herederos, documentación y competencia. El profesional puede revisar alcance, costos y pasos según la jurisdicción.
Evitá: Prometer fechas o costos fijos sin documentación.$k$, $k$Biblioteca Maestra, ficha O048$k$, null, true, 47),
  (2, $k$O049$k$, $k$objecion$k$, $k$juridico$k$, $k$La casa está a nombre de mi abuelo fallecido$k$, array[$k$a nombre de mi abuelo$k$,$k$a nombre de mi papa$k$,$k$a nombre de mi padre$k$,$k$a nombre de mi madre$k$,$k$a nombre de mi mama$k$,$k$a nombre del fallecido$k$,$k$la casa esta a nombre$k$]::text[], $k$«La casa está a nombre de mi abuelo fallecido». Puede ser: Posibles sucesiones encadenadas y transmisiones pendientes.
Para entender (si hace falta): «¿La titularidad registral sigue a nombre del causante y hubo sucesiones previas?»
Enfoque, con tus palabras: Puede haber más de una transmisión hereditaria para analizar. Conviene reunir títulos y partidas y verificar herederos antes de suponer titularidades actuales.
Evitá: Afirmar propiedad exclusiva de quien habita.$k$, $k$Biblioteca Maestra, ficha O049$k$, null, true, 48),
  (2, $k$O050$k$, $k$objecion$k$, $k$juridico$k$, $k$Mi hermano quiere reclamar la herencia$k$, array[$k$mi hermano quiere$k$,$k$mi hermana quiere$k$,$k$reclamar la herencia$k$,$k$quiere su parte$k$,$k$quiere la mitad$k$]::text[], $k$«Mi hermano quiere reclamar la herencia». Puede ser: Conflicto familiar y temor a pérdida patrimonial.
Para entender (si hace falta): «¿Hay testamento, donaciones, escrituras o acuerdos que sea necesario revisar?»
Enfoque, con tus palabras: La vocación hereditaria depende del parentesco, actos previos y ley aplicable. No conviene prometer que un heredero no puede reclamar sin estudio documental.
Evitá: Favorecer a un heredero con conclusiones infundadas.$k$, $k$Biblioteca Maestra, ficha O050$k$, null, true, 49),
  (2, $k$O051$k$, $k$objecion$k$, $k$juridico$k$, $k$No sé quién tiene derecho a heredar$k$, array[$k$quien hereda$k$,$k$quien tiene derecho$k$,$k$derecho a heredar$k$,$k$herederos$k$]::text[], $k$«No sé quién tiene derecho a heredar». Puede ser: Necesita distinguir cónyuge, descendientes y otros parientes.
Para entender (si hace falta): «¿El causante dejó descendientes, cónyuge y testamento?»
Enfoque, con tus palabras: La composición familiar y los bienes determinan la evaluación. Un abogado de sucesiones puede ordenar hechos y documentación sin generar expectativas anticipadas.
Evitá: Aplicar reglas simplificadas a todos los casos.$k$, $k$Biblioteca Maestra, ficha O051$k$, null, true, 50),
  (2, $k$O052$k$, $k$objecion$k$, $k$juridico$k$, $k$Quiero divorciarme y no sé por dónde empezar$k$, array[$k$divorci*$k$,$k$separarme$k$,$k$me quiero separar$k$,$k$separacion$k$]::text[], $k$«Quiero divorciarme y no sé por dónde empezar». Puede ser: Incertidumbre patrimonial y familiar.
Para entender (si hace falta): «¿La consulta principal es por el vínculo, bienes o cuidado de hijos?»
Enfoque, con tus palabras: Hay cuestiones distintas que pueden requerir enfoques específicos. Se puede brindar orientación inicial y derivar a familia para revisar documentación y jurisdicción.
Evitá: Emitir dictamen sobre alimentos o custodia.$k$, $k$Biblioteca Maestra, ficha O052$k$, null, true, 51),
  (2, $k$O053$k$, $k$objecion$k$, $k$juridico$k$, $k$No me dejan ver a mis hijos$k$, array[$k$ver a mis hijos$k$,$k$no me deja ver$k$,$k$no me dejan ver$k$,$k$tenencia$k$,$k$regimen de visitas$k$,$k$cuidado personal$k$]::text[], $k$«No me dejan ver a mis hijos». Puede ser: Carga emocional y riesgo de conflicto de familia.
Para entender (si hace falta): «¿Hay convenio o resolución judicial vigente sobre comunicación?»
Enfoque, con tus palabras: Es una cuestión sensible que merece escucha y asesoramiento familiar. El análisis debe considerar resoluciones existentes y bienestar de niños, niñas y adolescentes.
Evitá: Prometer medidas judiciales inmediatas sin evaluar.$k$, $k$Biblioteca Maestra, ficha O053$k$, null, true, 52),
  (2, $k$O054$k$, $k$objecion$k$, $k$juridico$k$, $k$No me pagan alimentos$k$, array[$k$alimentos$k$,$k$cuota alimentaria$k$,$k$no me pasa plata$k$,$k$no pasa la cuota$k$,$k$manutencion$k$]::text[], $k$«No me pagan alimentos». Puede ser: Urgencia económica y dudas sobre vías de reclamo.
Para entender (si hace falta): «¿Existe acuerdo homologado o resolución y qué incumplimientos están documentados?»
Enfoque, con tus palabras: Existen herramientas jurídicas según el estado del caso. Un profesional de familia puede revisar instrumentos y definir qué es procedente.
Evitá: Asegurar embargos automáticos.$k$, $k$Biblioteca Maestra, ficha O054$k$, null, true, 53),
  (2, $k$O055$k$, $k$objecion$k$, $k$juridico$k$, $k$Firmé un contrato que no entiendo$k$, array[$k$firme un contrato$k$,$k$un contrato$k$,$k$clausula$k$,$k$contrato de alquiler$k$,$k$alquiler$k$]::text[], $k$«Firmé un contrato que no entiendo». Puede ser: Necesidad de interpretar cláusulas y riesgos.
Para entender (si hace falta): «¿Qué obligación o cláusula te genera la duda?»
Enfoque, con tus palabras: Conviene analizar el documento completo, anexos y contexto. Puedo explicar conceptos generales; la interpretación aplicable corresponde a un abogado.
Evitá: Declarar nulidades a partir de una sola frase.$k$, $k$Biblioteca Maestra, ficha O055$k$, null, true, 54),
  (2, $k$O056$k$, $k$objecion$k$, $k$juridico$k$, $k$Me despidieron y no sé cuánto corresponde$k$, array[$k$me despidieron$k$,$k$me echaron$k$,$k$despido$k$,$k$liquidacion final$k$,$k$me dejaron sin trabajo$k$]::text[], $k$«Me despidieron y no sé cuánto corresponde». Puede ser: Busca calcular liquidación e indemnización.
Para entender (si hace falta): «¿Tenés fecha de ingreso, modalidad y comunicación de desvinculación?»
Enfoque, con tus palabras: Las sumas dependen del régimen aplicable, antecedentes y documentación. El profesional laboral puede revisar liquidación y eventuales diferencias.
Evitá: Prometer un monto sin convenio ni documentación.$k$, $k$Biblioteca Maestra, ficha O056$k$, null, true, 55),
  (2, $k$O057$k$, $k$objecion$k$, $k$juridico$k$, $k$Mi trabajo era en negro$k$, array[$k$en negro$k$,$k$sin registrar$k$,$k$no estaba registrado$k$,$k$no me tenian en blanco$k$,$k$trabajo no registrado$k$]::text[], $k$«Mi trabajo era en negro». Puede ser: Temor a falta de prueba o derechos.
Para entender (si hace falta): «¿Qué constancias tenés de horarios, tareas o pagos?»
Enfoque, con tus palabras: La ausencia de registración exige revisar evidencia y encuadre normativo actualizado. Es una consulta para asesoramiento laboral, sin concluir por un mensaje.
Evitá: Sugerir fabricar pruebas.$k$, $k$Biblioteca Maestra, ficha O057$k$, null, true, 56),
  (2, $k$O058$k$, $k$objecion$k$, $k$juridico$k$, $k$¿Por qué debería elegir este estudio?$k$, array[$k$por que ustedes$k$,$k$por que elegirlos$k$,$k$que los diferencia$k$,$k$son buenos$k$,$k$que experiencia tienen$k$,$k$por que deberia$k$]::text[], $k$«¿Por qué debería elegir este estudio?». Puede ser: Necesidad de evidencia profesional y confianza.
Para entender (si hace falta): «¿Qué te importa más: experiencia relevante, claridad de honorarios o disponibilidad del profesional?»
Enfoque, con tus palabras: Podemos mostrar información verificable del estudio, experiencia y forma de atención donde esté documentada. La elección debe basarse en confianza informada, no en garantías de éxito.
Evitá: Inventar causas ganadas o tasas de éxito.
Solo lo que figure en la ficha del negocio; nunca causas ganadas ni porcentajes.$k$, $k$Biblioteca Maestra, ficha O058$k$, null, true, 57),
  (2, $k$O059$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$No quiero un plan de ahorro$k$, array[$k$plan de ahorro no$k$,$k$no quiero plan$k$,$k$no quiero un plan$k$,$k$planes de ahorro no$k$,$k$odio los planes$k$]::text[], $k$«No quiero un plan de ahorro». Puede ser: Experiencias negativas y confusión entre instrumentos.
Para entender (si hace falta): «¿Preferís evaluar contado o crédito tradicional?»
Enfoque, con tus palabras: Es una preferencia válida. Un plan de ahorro y un préstamo prendario no funcionan igual; podemos comparar sólo alternativas efectivamente disponibles.
Evitá: Disfrazar un plan como financiación de cuota fija.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O059$k$, null, true, 58),
  (2, $k$O060$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$¿La cuota queda fija?$k$, array[$k$cuota fija$k$,$k$la cuota sube$k$,$k$cuota en pesos$k$,$k$se actualiza la cuota$k$,$k$cuota queda fija$k$]::text[], $k$«¿La cuota queda fija?». Puede ser: Temor a inflación y cambio de compromiso.
Para entender (si hace falta): «¿Estás consultando por crédito o plan de ahorro?»
Enfoque, con tus palabras: Depende del instrumento, tasa y contrato. En un plan de ahorro pueden existir componentes vinculados al valor móvil; no se puede asegurar cuota fija sin documentación.
Evitá: Afirmar cuotas inmóviles sin contrato.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O060$k$, null, true, 59),
  (2, $k$O061$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$¿Cuándo entregan el auto?$k$, array[$k$cuando entregan$k$,$k$cuando me lo entregan$k$,$k$entrega inmediata$k$,$k$cuanto tarda la entrega$k$,$k$cuando lo tengo$k$,$k$fecha de entrega$k$]::text[], $k$«¿Cuándo entregan el auto?». Puede ser: Necesidad de disponibilidad, logística y plazos.
Para entender (si hace falta): «¿Buscás una unidad en stock o una operación sujeta a adjudicación?»
Enfoque, con tus palabras: La entrega debe confirmarse según stock, pago, registro y condiciones escritas. Prefiero darte el plazo verificable de una oferta puntual.
Evitá: Garantizar entrega inmediata sin respaldo.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O061$k$, null, true, 60),
  (2, $k$O062$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$¿Con qué anticipo me alcanza?$k$, array[$k$anticipo$k$,$k$entrega inicial$k$,$k$cuanto tengo que poner$k$,$k$con cuanto$k$,$k$me alcanza con$k$]::text[], $k$«¿Con qué anticipo me alcanza?». Puede ser: Restricción presupuestaria y necesidad de filtro.
Para entender (si hace falta): «¿Qué modelo te interesa y qué margen inicial querés destinar?»
Enfoque, con tus palabras: El anticipo posible depende de la modalidad, evaluación crediticia y oferta vigente. Podemos orientar rangos confirmados sin comprometer una aprobación.
Evitá: Publicar anticipos mínimos irreales.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O062$k$, null, true, 61),
  (2, $k$O063$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$No sé si me van a aprobar el crédito$k$, array[$k$me aprueban$k$,$k$aprobar el credito$k$,$k$aprobacion$k$,$k$me dan el credito$k$,$k$calificar para el credito$k$]::text[], $k$«No sé si me van a aprobar el crédito». Puede ser: Ansiedad por historial y privacidad financiera.
Para entender (si hace falta): «¿Querés entender qué factores suelen evaluar sin compartir datos sensibles por acá?»
Enfoque, con tus palabras: La decisión es de la entidad financiadora. Te explicamos requisitos generales y luego un asesor indica el canal seguro para evaluar, sin prometer aprobación.
Evitá: Pedir claves bancarias o garantías de aprobación.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O063$k$, null, true, 62),
  (2, $k$O064$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$Tengo Veraz$k$, array[$k$veraz$k$,$k$estoy en el clearing$k$,$k$deudas$k$,$k$mal historial$k$,$k$situacion 5$k$]::text[], $k$«Tengo Veraz». Puede ser: Temor a rechazo automático y estigma.
Para entender (si hace falta): «¿Buscás información sobre alternativas que evalúen cada perfil?»
Enfoque, con tus palabras: Los antecedentes crediticios influyen, pero cada entidad aplica criterios propios. No corresponde afirmar aceptación o rechazo sin evaluación formal.
Evitá: Prometer aprobación con antecedentes negativos.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O064$k$, null, true, 63),
  (2, $k$O065$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$La tasa que me ofrecieron es altísima$k$, array[$k$tasa$k$,$k$interes alto$k$,$k$intereses$k$,$k$tna$k$,$k$tea$k$,$k$cft$k$]::text[], $k$«La tasa que me ofrecieron es altísima». Puede ser: Dificultad para comparar tasa nominal y costo total.
Para entender (si hace falta): «¿Tenés TNA, TEA, CFT y plazo de ambas opciones?»
Enfoque, con tus palabras: La comparación debe considerar CFT, impuestos, seguros, comisiones y total a pagar, no sólo la cuota inicial. Revisemos información documentada.
Evitá: Comparar cuotas con plazos distintos como si fueran iguales.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O065$k$, null, true, 64),
  (2, $k$O066$k$, $k$objecion$k$, $k$agencia_0km$k$, $k$¿Cuánto me toman el usado?$k$, array[$k$cuanto me toman$k$,$k$me toman$k$,$k$toman el usado$k$,$k$tomar mi auto$k$,$k$toman usados$k$,$k$mi usado$k$,$k$entregar mi auto$k$,$k$parte de pago$k$,$k$tasacion$k$,$k$tasan$k$]::text[], $k$«¿Cuánto me toman el usado?». Puede ser: Necesidad de estimar patrimonio y diferencia a pagar.
Para entender (si hace falta): «¿Qué marca, modelo, año, kilometraje y estado general tiene?»
Enfoque, con tus palabras: Una tasación orientativa es distinta de una oferta firme; depende de inspección, papeles y mercado. Podemos explicar criterios y coordinar evaluación.
Evitá: Prometer valor de compra sin ver el vehículo.
Vos no das precios, cuotas, tasas, anticipos, tasaciones, stock ni plazos: los confirma el vendedor.$k$, $k$Biblioteca Maestra, ficha O066$k$, null, true, 65)
on conflict (version, clave) do nothing;
