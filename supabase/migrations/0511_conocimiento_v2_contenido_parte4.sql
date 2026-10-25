-- 25/10 · Contenido de la versión 2 del conocimiento del bot (Biblioteca Maestra de Ventas), parte 4 de 4.
-- Generado por docs/conocimiento/v2/generar.py. Repetible sin error: inserta lo que falta y
-- no pisa ítems que el equipo ya editó (on conflict do nothing).
-- En total 166 ítems: 2 generales, 4 de base por rubro, 12 temas, 148 fichas de objeción (4 inactivas porque las resuelve una regla del sistema). Esta parte: 40.
insert into public.bot_knowledge_items (version, clave, capa, rubro, titulo, disparadores, contenido, fuente, verificado_el, activo, orden) values
  (2, $k$O109$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$Tengo discapacidad en la familia$k$, array[$k$discapacidad$k$,$k$cud$k$,$k$certificado de discapacidad$k$,$k$hijo con$k$,$k$autismo$k$]::text[], $k$«Tengo discapacidad en la familia». Puede ser: Necesita cobertura y continuidad de prestaciones sensibles.
Para entender (si hace falta): «¿Querés información general de cobertura y cartilla sin compartir certificados aquí?»
Enfoque, con tus palabras: La protección normativa puede involucrar regímenes específicos. Es importante revisar cada prestación y derivar consultas sensibles a un especialista.
Evitá: Usar la situación familiar para presionar.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O109$k$, null, true, 108),
  (2, $k$O110$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$Necesito cobertura en provincia e interior$k$, array[$k$interior$k$,$k$provincia$k$,$k$otra provincia$k$,$k$cobertura nacional$k$,$k$en todo el pais$k$,$k$viajo seguido$k$]::text[], $k$«Necesito cobertura en provincia e interior». Puede ser: Movilidad geográfica y red de prestadores.
Para entender (si hace falta): «¿En qué localidades necesitás usar la cobertura de manera habitual?»
Enfoque, con tus palabras: La amplitud de cartilla y convenios varía. Se debe mirar la zona y el plan con prestadores vigentes, no sólo la marca.
Evitá: Afirmar cobertura nacional homogénea.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O110$k$, null, true, 109),
  (2, $k$O111$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$Viajo al exterior$k$, array[$k$exterior$k$,$k$viajo afuera$k$,$k$viaje al exterior$k$,$k$asistencia al viajero$k$]::text[], $k$«Viajo al exterior». Puede ser: Duda entre asistencia al viajero y cobertura médica local.
Para entender (si hace falta): «¿Querés asistencia por viajes ocasionales o residencia temporal?»
Enfoque, con tus palabras: Algunos planes pueden incluir asistencia al viajero con límites. Hay que leer topes, exclusiones y regiones antes de prometer cobertura internacional.
Evitá: Confundir PMO con seguro internacional.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O111$k$, null, true, 110),
  (2, $k$O112$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$¿Qué pasa si me quedo sin trabajo?$k$, array[$k$me quedo sin trabajo$k$,$k$si me despiden$k$,$k$perder el trabajo$k$,$k$sin trabajo$k$,$k$desemple*$k$]::text[], $k$«¿Qué pasa si me quedo sin trabajo?». Puede ser: Miedo a perder continuidad y acceso familiar.
Para entender (si hace falta): «¿Tu cobertura actual depende de relación laboral?»
Enfoque, con tus palabras: Hay mecanismos y condiciones de continuidad según situación. Conviene consultar opciones normativas y comerciales concretas antes de decidir.
Evitá: Prometer permanencia gratuita indefinida.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O112$k$, null, true, 111),
  (2, $k$O113$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$¿Me puedo dar de baja cuando quiera?$k$, array[$k$darme de baja$k$,$k$dar de baja$k$,$k$baja cuando quiera$k$,$k$cancelar la prepaga$k$]::text[], $k$«¿Me puedo dar de baja cuando quiera?». Puede ser: Busca flexibilidad y evitar doble pago.
Para entender (si hace falta): «¿Se trata de obra social, contrato de prepaga o plan corporativo?»
Enfoque, con tus palabras: Los efectos y trámites dependen de la modalidad y normativa. Hay que revisar fecha de efectividad y eventuales condiciones vigentes.
Evitá: Decir que basta con dejar de pagar.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O113$k$, null, true, 112),
  (2, $k$O114$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$¿Cuánto demora el cambio?$k$, array[$k$cuanto demora$k$,$k$cuanto tarda el cambio$k$,$k$cuanto tarda$k$,$k$tiempo del cambio$k$]::text[], $k$«¿Cuánto demora el cambio?». Puede ser: Incertidumbre sobre fecha de inicio.
Para entender (si hace falta): «¿Ya realizaste opción de cambio o estás evaluando alternativas?»
Enfoque, con tus palabras: Los plazos dependen del régimen y de fechas de gestión. Podemos remitir a la información oficial y verificar estado específico.
Evitá: Inventar activación en 24 horas.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O114$k$, null, true, 113),
  (2, $k$O115$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$¿Pierdo antigüedad?$k$, array[$k$antiguedad$k$,$k$pierdo lo que tengo$k$]::text[], $k$«¿Pierdo antigüedad?». Puede ser: Preocupación por derechos y beneficios adquiridos.
Para entender (si hace falta): «¿Te referís a prestaciones, antigüedad comercial o condiciones especiales?»
Enfoque, con tus palabras: La antigüedad puede ser relevante de distintas maneras. Antes de cambiar, conviene comparar derechos y condiciones documentadas del plan actual y futuro.
Evitá: Prometer conservación general de beneficios privados.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O115$k$, null, true, 114),
  (2, $k$O116$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$¿Es realmente una obra social o una prepaga?$k$, array[$k$obra social o una prepaga$k$,$k$realmente una obra social$k$,$k$obra social o prepaga$k$,$k$es una prepaga$k$,$k$es obra social$k$,$k$que entidad$k$,$k$cual es la empresa$k$]::text[], $k$«¿Es realmente una obra social o una prepaga?». Puede ser: Desconfianza por uso confuso de términos.
Para entender (si hace falta): «¿Querés que identifiquemos la entidad legal, el agente y el plan concreto?»
Enfoque, con tus palabras: No son sinónimos. Podemos indicar razón social, tipo de entidad y modalidad de contratación, y cotejar registros oficiales.
Evitá: Usar marcas genéricas para ocultar prestador real.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O116$k$, null, true, 115),
  (2, $k$O117$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$Mi tratamiento está en curso$k$, array[$k$en curso$k$,$k$tratamiento en curso$k$,$k$estoy en tratamiento$k$,$k$estoy haciendo un tratamiento$k$,$k$en tratamiento$k$,$k$quimio$k$,$k$rehabilitacion$k$]::text[], $k$«Mi tratamiento está en curso». Puede ser: Máxima preocupación por interrupciones.
Para entender (si hace falta): «¿Querés evaluar continuidad con tu médico y la cobertura actual antes de decidir?»
Enfoque, con tus palabras: No conviene recomendar un cambio sin revisar autorizaciones, prestación y fecha de vigencia. La continuidad asistencial es más importante que una mejora comercial aparente.
Evitá: Sugerir cancelar cobertura sin alternativa confirmada.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O117$k$, null, true, 116),
  (2, $k$O118$k$, $k$objecion$k$, $k$coberturas_medicas$k$, $k$¿Y si la cartilla cambia después?$k$, array[$k$si la cartilla cambia$k$,$k$cartilla$k$,$k$dan de baja al medico$k$,$k$si sacan la clinica$k$]::text[], $k$«¿Y si la cartilla cambia después?». Puede ser: Riesgo de variabilidad futura.
Para entender (si hace falta): «¿Hay profesionales o instituciones indispensables para vos?»
Enfoque, con tus palabras: Las cartillas pueden modificarse; corresponde verificar su versión actual, mecanismos de aviso y opciones ante cambios, sin prometer estabilidad perpetua.
Evitá: Asegurar permanencia eterna de una clínica.
Vos no das cuotas, diferencias, cartillas ni aprobaciones: las confirma el asesor. No pidas diagnósticos.$k$, $k$Biblioteca Maestra, ficha O118$k$, null, true, 117),
  (2, $k$O119$k$, $k$objecion$k$, $k$marketing$k$, $k$Ya tengo redes sociales$k$, array[$k$ya tengo redes$k$,$k$ya tengo instagram$k$,$k$ya tengo facebook$k$,$k$ya publico$k$,$k$las redes las manejo$k$]::text[], $k$«Ya tengo redes sociales». Puede ser: Confunde presencia con estrategia, conversión y resultados.
Para entender (si hace falta): «¿Las redes hoy te traen consultas útiles o cumplen otra función?»
Enfoque, con tus palabras: Tener redes es un buen punto de partida. El valor de un servicio adicional depende de si necesitás contenido, medición, atención o ventas, no de publicar por publicar.
Evitá: Decir que sus redes están mal sin análisis.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O119$k$, null, true, 118),
  (2, $k$O120$k$, $k$objecion$k$, $k$marketing$k$, $k$No necesito una página web$k$, array[$k$no necesito una pagina$k$,$k$no necesito web$k$,$k$no necesito pagina$k$,$k$para que una web$k$,$k$no me hace falta una web$k$]::text[], $k$«No necesito una página web». Puede ser: No ve beneficio sobre WhatsApp e Instagram.
Para entender (si hace falta): «¿Te alcanza la presencia actual o perdés consultas por falta de información y medición?»
Enfoque, con tus palabras: Si tus canales actuales convierten bien, quizá no sea prioritario. Una web tiene sentido cuando mejora confianza, captación, automatización o conversión concreta.
Evitá: Afirmar que toda empresa necesita web cara.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O120$k$, null, true, 119),
  (2, $k$O121$k$, $k$objecion$k$, $k$marketing$k$, $k$Probé anuncios y perdí plata$k$, array[$k$probe anuncios$k$,$k$perdi plata$k$,$k$publicidad no funciona$k$,$k$los anuncios no sirven$k$,$k$ya invert*$k$,$k$no me funciono$k$]::text[], $k$«Probé anuncios y perdí plata». Puede ser: Experiencia negativa con campañas sin medición.
Para entender (si hace falta): «¿Medías ventas reales, consultas o sólo clics?»
Enfoque, con tus palabras: Un resultado malo puede deberse a segmentación, oferta, creatividad o seguimiento. Antes de invertir de nuevo conviene diagnosticar dónde se perdió el valor.
Evitá: Prometer retorno porque usamos IA.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O121$k$, null, true, 120),
  (2, $k$O122$k$, $k$objecion$k$, $k$marketing$k$, $k$Mi community manager cobra menos$k$, array[$k$community manager$k$,$k$mi cm$k$,$k$me cobra menos$k$,$k$un chico que me hace$k$,$k$mi sobrino$k$]::text[], $k$«Mi community manager cobra menos». Puede ser: Comparación de paquetes con alcances diferentes.
Para entender (si hace falta): «¿La comparación es por publicaciones, estrategia, publicidad o gestión de consultas?»
Enfoque, con tus palabras: Podemos desglosar entregables y responsabilidades. Si tus necesidades están cubiertas a menor costo, no tiene sentido pagar más sin beneficio claro.
Evitá: Descalificar al CM actual.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O122$k$, null, true, 121),
  (2, $k$O123$k$, $k$objecion$k$, $k$marketing$k$, $k$Quiero resultados garantizados$k$, array[$k$resultados garantizados$k$,$k$me garantizan$k$,$k$garantia de resultados$k$,$k$aseguran ventas$k$]::text[], $k$«Quiero resultados garantizados». Puede ser: Aversión al riesgo y experiencias con proveedores.
Para entender (si hace falta): «¿Qué resultado define éxito para vos: citas, ventas, ingresos o eficiencia?»
Enfoque, con tus palabras: Podemos acordar objetivos, medición y entregables; las ventas dependen también de producto, precio, presupuesto y ejecución comercial. No garantizamos cifras inciertas.
Evitá: Prometer cantidad fija de clientes sin base.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O123$k$, null, true, 122),
  (2, $k$O124$k$, $k$objecion$k$, $k$marketing$k$, $k$¿Cuánto tardan en llegar ventas?$k$, array[$k$cuanto tardan$k$,$k$en cuanto tiempo$k$,$k$cuando veo resultados$k$,$k$cuanto tarda en$k$]::text[], $k$«¿Cuánto tardan en llegar ventas?». Puede ser: Confunde tiempo de implementación con maduración comercial.
Para entender (si hace falta): «¿Tu oferta y proceso de atención ya están probados?»
Enfoque, con tus palabras: El plazo depende del canal, volumen de prueba y embudo. Podemos explicar etapas verificables, pero no una fecha universal de resultados.
Evitá: Fijar plazos irreales.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O124$k$, null, true, 123),
  (2, $k$O125$k$, $k$objecion$k$, $k$marketing$k$, $k$No quiero pagar publicidad$k$, array[$k$no quiero pagar publicidad$k$,$k$sin publicidad$k$,$k$no quiero pautar$k$,$k$no pauto$k$,$k$organico$k$]::text[], $k$«No quiero pagar publicidad». Puede ser: Restricción financiera y desconfianza en plataformas.
Para entender (si hace falta): «¿Buscás crecimiento orgánico o tenés una meta temporal exigente?»
Enfoque, con tus palabras: Sin pauta se puede trabajar contenido y posicionamiento, con dinámicas distintas. Elegir canal requiere contrastar objetivos, recursos y horizonte.
Evitá: Decir que sin anuncios no hay negocio.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O125$k$, null, true, 124),
  (2, $k$O126$k$, $k$objecion$k$, $k$marketing$k$, $k$Tengo muy poco presupuesto$k$, array[$k$poco presupuesto$k$,$k$presupuesto chico$k$,$k$no tengo presupuesto$k$,$k$poca plata$k$,$k$presupuesto bajo$k$]::text[], $k$«Tengo muy poco presupuesto». Puede ser: Necesidad de priorizar capacidades y riesgo.
Para entender (si hace falta): «¿Qué problema puntual querés resolver primero?»
Enfoque, con tus palabras: Con presupuesto limitado conviene focalizar en el cuello de botella medible, no venderte todo un ecosistema. Podemos plantear alcance reducido si resulta útil.
Evitá: Crear planes integrales imposibles de sostener.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O126$k$, null, true, 125),
  (2, $k$O127$k$, $k$objecion$k$, $k$marketing$k$, $k$¿Para qué un CRM si uso Excel?$k$, array[$k$crm$k$,$k$excel$k$,$k$planilla$k$,$k$uso una planilla$k$]::text[], $k$«¿Para qué un CRM si uso Excel?». Puede ser: Dudas sobre costo de cambio y valor de automatización.
Para entender (si hace falta): «¿Dónde aparecen duplicados, seguimientos perdidos o errores en tu planilla?»
Enfoque, con tus palabras: Excel puede alcanzar para operaciones simples. Un CRM agrega valor cuando necesitás trazabilidad, asignación, recordatorios e integraciones.
Evitá: Ridiculizar una herramienta que funciona.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O127$k$, null, true, 126),
  (2, $k$O128$k$, $k$objecion$k$, $k$marketing$k$, $k$La IA se equivoca$k$, array[$k$la ia se equivoca$k$,$k$la inteligencia artificial se equivoca$k$,$k$no confio en la ia$k$,$k$la ia inventa$k$]::text[], $k$«La IA se equivoca». Puede ser: Riesgo de alucinaciones y pérdida de reputación.
Para entender (si hace falta): «¿En qué parte del proceso te preocuparía más una respuesta incorrecta?»
Enfoque, con tus palabras: Tenés razón: la IA requiere límites, datos fiables, pruebas y control humano en acciones sensibles. No debería ponerse a cargo de decisiones críticas sin supervisión.
Evitá: Vender automatización como infalible.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O128$k$, null, true, 127),
  (2, $k$O129$k$, $k$objecion$k$, $k$marketing$k$, $k$No quiero que un bot atienda mis clientes$k$, array[$k$no quiero un bot$k$,$k$no quiero que un bot$k$,$k$bot atienda$k$,$k$los bots son$k$,$k$atencion automatica$k$]::text[], $k$«No quiero que un bot atienda mis clientes». Puede ser: Temor a frialdad y despersonalización.
Para entender (si hace falta): «¿Qué situaciones deberían seguir atendiendo personas sí o sí?»
Enfoque, con tus palabras: No todos los contactos necesitan automatización. Es posible usarla para clasificar o responder lo rutinario y dejar casos delicados a humanos.
Evitá: Esconder que hay automatización.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O129$k$, null, true, 128),
  (2, $k$O130$k$, $k$objecion$k$, $k$marketing$k$, $k$¿No me bloquean WhatsApp por mandar mensajes?$k$, array[$k$me bloquean$k$,$k$bloqueo de whatsapp$k$,$k$me banean$k$,$k$spam$k$,$k$mensajes masivos$k$,$k$envios masivos$k$]::text[], $k$«¿No me bloquean WhatsApp por mandar mensajes?». Puede ser: Riesgo real de calidad, consentimiento y costos.
Para entender (si hace falta): «¿Hablamos de contactos que solicitaron información o de prospección en frío?»
Enfoque, con tus palabras: La mensajería comercial tiene políticas y normas; los envíos masivos pueden afectar calidad y entregabilidad. Deben evaluarse permisos y alternativas legítimas, nunca prometer ausencia de bloqueos.
Evitá: Recomendar evasión de límites o spam.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O130$k$, null, true, 129),
  (2, $k$O131$k$, $k$objecion$k$, $k$marketing$k$, $k$Meta me cobra carísimo por mensaje$k$, array[$k$meta me cobra$k$,$k$cobran por mensaje$k$,$k$costo por mensaje$k$,$k$caro el mensaje$k$,$k$tarifa de whatsapp$k$]::text[], $k$«Meta me cobra carísimo por mensaje». Puede ser: Fricción por costo variable y bajo retorno.
Para entender (si hace falta): «¿Conocés costo por conversación útil o sólo costo de envío?»
Enfoque, con tus palabras: Conviene medir margen y respuesta por segmento, reducir mensajes sin interés y optimizar permiso, audiencia y canal dentro de las reglas. El mensaje barato que no convierte sigue siendo caro.
Evitá: Prometer tarifas no verificadas.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O131$k$, null, true, 130),
  (2, $k$O132$k$, $k$objecion$k$, $k$marketing$k$, $k$Tengo muchos leads pero no cierro$k$, array[$k$muchos leads$k$,$k$muchas consultas pero$k$,$k$no cierro$k$,$k$no concreto$k$,$k$no vendo$k$]::text[], $k$«Tengo muchos leads pero no cierro». Puede ser: Problema de calidad, tiempo de respuesta o oferta.
Para entender (si hace falta): «¿Dónde se caen: contacto, calificación, visita o cierre?»
Enfoque, con tus palabras: Más leads pueden aumentar pérdidas si falla seguimiento. Primero identificamos etapa y calidad antes de recomendar más pauta.
Evitá: Vender más tráfico como única solución.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O132$k$, null, true, 131),
  (2, $k$O133$k$, $k$objecion$k$, $k$marketing$k$, $k$Quiero seguidores, no ventas$k$, array[$k$seguidores$k$,$k$quiero seguidores$k$,$k$mas seguidores$k$,$k$likes$k$]::text[], $k$«Quiero seguidores, no ventas». Puede ser: Métrica de marca y objetivos distintos.
Para entender (si hace falta): «¿Buscás comunidad, notoriedad, autoridad o ventas futuras?»
Enfoque, con tus palabras: Los seguidores pueden tener valor si apoyan un objetivo real. Conviene definir qué indicador importa y no confundir popularidad con facturación.
Evitá: Desestimar objetivos no transaccionales.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O133$k$, null, true, 132),
  (2, $k$O134$k$, $k$objecion$k$, $k$marketing$k$, $k$Mi público no está en internet$k$, array[$k$mi publico no esta$k$,$k$mis clientes no usan$k$,$k$no estan en internet$k$,$k$mis clientes son grandes$k$]::text[], $k$«Mi público no está en internet». Puede ser: Hipótesis sobre mercado y audiencia.
Para entender (si hace falta): «¿Qué evidencias tenés de dónde descubre y compara tu cliente?»
Enfoque, con tus palabras: Puede ser cierto para algún segmento. Antes de recomendar canales, sirve investigar el recorrido de compra y probar hipótesis de bajo riesgo.
Evitá: Afirmar que todas las audiencias están en TikTok.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O134$k$, null, true, 133),
  (2, $k$O135$k$, $k$objecion$k$, $k$marketing$k$, $k$No quiero quedar atado a una agencia$k$, array[$k$atado a una agencia$k$,$k$quedar atado$k$,$k$depender de ustedes$k$,$k$contrato largo$k$]::text[], $k$«No quiero quedar atado a una agencia». Puede ser: Temor a dependencia operativa y propiedad de activos.
Para entender (si hace falta): «¿Te preocupa el acceso a cuentas, dominio, contenido o continuidad?»
Enfoque, con tus palabras: La titularidad de cuentas, activos y entregables debe aclararse. Un servicio sano permite entender qué recibís y cómo continúa si cambiás de proveedor.
Evitá: Retener credenciales como presión.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O135$k$, null, true, 134),
  (2, $k$O136$k$, $k$objecion$k$, $k$marketing$k$, $k$¿Los anuncios son tuyos o míos?$k$, array[$k$los anuncios son tuyos$k$,$k$de quien es la cuenta$k$,$k$quien es dueño$k$,$k$quien es dueno$k$,$k$la cuenta es mia$k$]::text[], $k$«¿Los anuncios son tuyos o míos?». Puede ser: Duda sobre titularidad de activos y píxeles.
Para entender (si hace falta): «¿Querés saber quién administra cuentas y quién conserva el historial?»
Enfoque, con tus palabras: La estructura de propiedad y permisos debe quedar explícita. Lo recomendable es que el cliente tenga control de sus activos cuando corresponda.
Evitá: Crear dependencia opaca por diseño.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O136$k$, null, true, 135),
  (2, $k$O137$k$, $k$objecion$k$, $k$marketing$k$, $k$No sé si necesito app o web$k$, array[$k$app o web$k$,$k$una app$k$,$k$aplicacion$k$,$k$app$k$]::text[], $k$«No sé si necesito app o web». Puede ser: Confunde canal, problema y solución técnica.
Para entender (si hace falta): «¿Qué funcionalidad específica debe usar tu cliente o tu equipo?»
Enfoque, con tus palabras: Una app no siempre es mejor que una web responsiva. La decisión depende de frecuencia de uso, notificaciones, hardware, costos y mantenimiento.
Evitá: Vender desarrollo caro por prestigio.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O137$k$, null, true, 136),
  (2, $k$O138$k$, $k$objecion$k$, $k$marketing$k$, $k$Me ofrecieron una web en un día$k$, array[$k$web en un dia$k$,$k$pagina en un dia$k$,$k$me la hacen en$k$,$k$web rapida$k$,$k$wix$k$,$k$tiendanube$k$]::text[], $k$«Me ofrecieron una web en un día». Puede ser: Compara velocidad aparente con alcance real.
Para entender (si hace falta): «¿Qué incluye exactamente: diseño, contenido, formularios, integraciones, SEO y soporte?»
Enfoque, con tus palabras: Una landing simple puede publicarse rápido; un sistema complejo requiere especificación y pruebas. Comparemos alcance y responsabilidad, no sólo plazo.
Evitá: Ridiculizar soluciones rápidas que pueden servir.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O138$k$, null, true, 137),
  (2, $k$O139$k$, $k$objecion$k$, $k$marketing$k$, $k$Quiero algo como Mercado Libre$k$, array[$k$como mercado libre$k$,$k$mercado libre$k$,$k$marketplace$k$,$k$como amazon$k$]::text[], $k$«Quiero algo como Mercado Libre». Puede ser: Idea amplia sin alcance, presupuesto ni validación.
Para entender (si hace falta): «¿Cuál es la operación mínima que querés resolver primero?»
Enfoque, con tus palabras: Una plataforma de ese tipo reúne múltiples sistemas y costos. Podemos conceptualizar un alcance inicial acotado y explicar complejidad sin ofrecer clones instantáneos.
Evitá: Prometer plataforma completa por precio de landing.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O139$k$, null, true, 138),
  (2, $k$O140$k$, $k$objecion$k$, $k$marketing$k$, $k$¿Se puede automatizar todo sin empleados?$k$, array[$k$automatizar todo$k$,$k$sin empleados$k$,$k$reemplazar a mi equipo$k$,$k$sin personal$k$]::text[], $k$«¿Se puede automatizar todo sin empleados?». Puede ser: Expectativa de reducción absoluta de personal.
Para entender (si hace falta): «¿Qué tareas son repetitivas y cuáles requieren juicio o responsabilidad?»
Enfoque, con tus palabras: Algunas acciones se automatizan muy bien; otras necesitan revisión humana por seguridad, confianza y calidad. Conviene medir ahorro real y riesgos.
Evitá: Afirmar sustitución total de personas.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O140$k$, null, true, 139),
  (2, $k$O141$k$, $k$objecion$k$, $k$marketing$k$, $k$¿Me garantizan estar primero en Google?$k$, array[$k$primero en google$k$,$k$primeros en google$k$,$k$posicionamiento$k$,$k$seo$k$,$k$aparecer en google$k$]::text[], $k$«¿Me garantizan estar primero en Google?». Puede ser: Desconocimiento de SEO y subastas de ads.
Para entender (si hace falta): «¿Te referís a posicionamiento orgánico o anuncios pagos?»
Enfoque, con tus palabras: SEO y publicidad son mecanismos distintos. Se pueden optimizar factores controlables, pero nadie serio garantiza el primer puesto orgánico universal.
Evitá: Vender ranking orgánico garantizado.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O141$k$, null, true, 140),
  (2, $k$O142$k$, $k$objecion$k$, $k$marketing$k$, $k$¿Cuánto vendo con dos millones de pauta?$k$, array[$k$cuanto vendo$k$,$k$cuanto voy a vender$k$,$k$dos millones$k$,$k$si pongo$k$,$k$retorno$k$]::text[], $k$«¿Cuánto vendo con dos millones de pauta?». Puede ser: Busca estimar rendimiento de inversión.
Para entender (si hace falta): «¿Tenés datos de ticket, margen, tasa de cierre y costo histórico por cliente?»
Enfoque, con tus palabras: Sin esas variables cualquier cifra sería especulativa. Se pueden modelar escenarios con supuestos transparentes y luego medir resultados reales.
Evitá: Hacer proyecciones como promesas.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O142$k$, null, true, 141),
  (2, $k$O143$k$, $k$objecion$k$, $k$marketing$k$, $k$¿Quién hace el contenido?$k$, array[$k$quien hace el contenido$k$,$k$contenido$k$,$k$quien diseña$k$,$k$quien disena$k$]::text[], $k$«¿Quién hace el contenido?». Puede ser: Necesita claridad de esfuerzo y ownership.
Para entender (si hace falta): «¿Disponés de fotos, videos y conocimiento del producto o habría que producirlos?»
Enfoque, con tus palabras: El alcance depende de producción, edición, diseño y aprobaciones. Debe quedar claro qué aporta cada parte y cómo se gestionan derechos de uso.
Evitá: Prometer material audiovisual ilimitado.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O143$k$, null, true, 142),
  (2, $k$O144$k$, $k$objecion$k$, $k$marketing$k$, $k$No tengo fotos ni videos$k$, array[$k$no tengo fotos$k$,$k$no tengo videos$k$,$k$sin fotos$k$,$k$sin material$k$]::text[], $k$«No tengo fotos ni videos». Puede ser: Falta de recursos y temor a empezar.
Para entender (si hace falta): «¿Tenés acceso al producto, local o equipo para generar material básico?»
Enfoque, con tus palabras: Se puede empezar con activos simples y producción planificada, pero no conviene inventar testimonios ni mostrar productos inexistentes. Calidad visual y autenticidad deben equilibrarse.
Evitá: Fabricar reseñas o casos de éxito.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O144$k$, null, true, 143),
  (2, $k$O145$k$, $k$objecion$k$, $k$marketing$k$, $k$No quiero pagar mantenimiento$k$, array[$k$mantenimiento$k$,$k$pagar mensual$k$,$k$abono mensual$k$,$k$hosting$k$]::text[], $k$«No quiero pagar mantenimiento». Puede ser: Temor a costos recurrentes y dependencia.
Para entender (si hace falta): «¿El proyecto necesita hosting, dominio, licencias o soporte evolutivo?»
Enfoque, con tus palabras: Hay costos técnicos que no desaparecen al publicar. Podemos distinguir infraestructura necesaria, mejoras opcionales y responsabilidad de actualizaciones.
Evitá: Ocultar gastos fijos hasta después de vender.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O145$k$, null, true, 144),
  (2, $k$O146$k$, $k$objecion$k$, $k$marketing$k$, $k$¿Cómo sé si ustedes me venden humo?$k$, array[$k$venden humo$k$,$k$humo$k$,$k$como se que funcionan$k$,$k$son todos iguales$k$]::text[], $k$«¿Cómo sé si ustedes me venden humo?». Puede ser: Desconfianza ante promesas de agencias.
Para entender (si hace falta): «¿Querés verificar entregables, medición, referencias o forma de trabajo?»
Enfoque, con tus palabras: Lo correcto es mostrar metodología, ejemplos verificables y métricas definidas, reconociendo límites. No pedimos fe ni garantizamos resultados ajenos a nuestro control.
Evitá: Inventar clientes y resultados.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O146$k$, null, true, 145),
  (2, $k$O147$k$, $k$objecion$k$, $k$marketing$k$, $k$No quiero compartir accesos$k$, array[$k$compartir accesos$k$,$k$contraseña$k$,$k$contrasena$k$,$k$mis claves$k$,$k$darte acceso$k$]::text[], $k$«No quiero compartir accesos». Puede ser: Seguridad de cuentas y temor a perder activos.
Para entender (si hace falta): «¿Te sirve evaluar permisos delegados en lugar de entregar contraseñas?»
Enfoque, con tus palabras: Se puede trabajar con roles de acceso y autorizaciones limitadas cuando la plataforma lo permite. Evitar compartir contraseñas reduce riesgos para ambas partes.
Evitá: Solicitar credenciales personales en mensajes.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O147$k$, null, true, 146),
  (2, $k$O148$k$, $k$objecion$k$, $k$marketing$k$, $k$¿Y si cancelo después del primer mes?$k$, array[$k$cancelo$k$,$k$cancelar despues$k$,$k$si cancelo$k$,$k$primer mes$k$]::text[], $k$«¿Y si cancelo después del primer mes?». Puede ser: Fricción contractual y expectativas.
Para entender (si hace falta): «¿Te preocupa permanencia, entregables o devolución de materiales?»
Enfoque, con tus palabras: La respuesta depende de condiciones pactadas, servicios ejecutados y activos entregables. Lo relevante es dejarlo por escrito antes de contratar.
Evitá: Prometer cancelación sin revisar contrato.
Vos no das precios, plazos ni resultados: el equipo arma el presupuesto (pedir_presupuesto).$k$, $k$Biblioteca Maestra, ficha O148$k$, null, true, 147)
on conflict (version, clave) do nothing;
