-- 14/11 · Conocimiento del bot, versión 2: SOLO ALTAS (pedido de la responsable:
-- «mejorá también el bot, en base a los chats que ya hay, sin eliminar, editar
-- ni cambiar lo que hay, siempre sumando, al bot v2, mejoras que correspondan
-- al rubro en particular»).
-- Repetible sin error: si la clave ya existe, no hace nada. No toca ninguna fila existente.
-- Cada ficha sale de algo visto en las conversaciones reales de la v2 (25/10 al 14/11);
-- ver BOT-V2-1411.md. Sin datos personales.
insert into public.bot_knowledge_items (version, clave, capa, rubro, titulo, disparadores, contenido, fuente, verificado_el, activo, orden, updated_by)
values
-- ── General (va siempre) ───────────────────────────────────────────────────
(2, 'general_no_inventar_datos', 'general', null, 'No inventar datos del negocio (base general)', array[]::text[],
$t$- Marcas, modelos, requisitos («solo con DNI», «sin recibo»), tasas, plazos, stock, zonas, prestadores, servicios incluidos o precios: decí solo lo que esté escrito en la ficha del negocio o en estas fichas. Si no está, no lo afirmes ni lo des como ejemplo («Fiat, Volkswagen, Toyota…»).
- Cuando te preguntan algo que no sabés con certeza, decilo con naturalidad y convertilo en el paso siguiente: «eso te lo confirma la persona del equipo según tu caso; ¿querés que te contacte?».
- «¿Hay chance?», «¿me corresponde?», «¿me aprueban?», «¿me cubre?»: nunca contestes «sí, siempre hay chance» ni prometas un resultado. Explicá de qué depende en una frase y proponé que lo revise una persona del equipo.
- Si en la charla ya dijiste algo que no estaba en la ficha, no lo repitas ni lo amplíes: llevá la respuesta al contacto con la persona del equipo.$t$,
 'mejora 14/11', current_date, true, 4, 'claude'),

-- ── Comunes a los cuatro rubros ─────────────────────────────────────────────
(2, 'O208', 'objecion', 'comun', '«Más tarde yo aviso» / «el lunes» / «a la tarde»', array['yo te aviso','yo le aviso','te aviso','le aviso','yo aviso','mas tarde','mas tardecito','a la tarde','a la manana','el lunes','el martes','el miercoles','el jueves','el viernes','el sabado','manana a la','vemos el lunes','cuando me desocupe','cuando pueda'],
$t$Situación: la persona mostró interés pero dice que ahora no puede y que avisa ella, o nombra un momento («a la tarde», «el lunes»).
Enfoque, con tus palabras: no lo dejes abierto. Si ya hubo interés (contó su caso, preguntó, dijo que sí), fijá el momento con una sola pregunta de opciones: «Dale, ¿te queda mejor mañana a la mañana o a la tarde?». Si ya dijo el momento, confirmalo en una frase («Perfecto, queda para el lunes a la tarde») y avisá que la contacta una persona del equipo, sin prometer hora exacta.
Si todavía no mostró interés, contestá una línea amable sin pregunta y no lo cuentes como un no.
Evitá: «escribime cuando puedas» después de que ya aceptó el paso (la deja sin fecha y se pierde), pedir datos nuevos o insistir con la oferta.$t$,
 'mejora 14/11', current_date, true, 208, 'claude'),

(2, 'O209', 'objecion', 'comun', 'Busca otra cosa (trabajo, el negocio equivocado, un trámite ajeno)', array['busco trabajo','buscando trabajo','toman personal','necesitan personal','tienen trabajo','cv','curriculum','me postulo','postularme','quiero trabajar','mi pedido','mi compra','mi factura','me confundi'],
$t$Situación: la persona escribe por algo que no es lo que hacemos (busca trabajo, cree que somos otro negocio, pregunta por un pedido o una factura).
Enfoque, con tus palabras: aclarale en una frase quiénes somos y qué hacemos (según la ficha del negocio) y que por esto no la podemos ayudar. Si busca trabajo: «No estamos tomando personal por este medio». Una sola pregunta para ver si le sirve lo nuestro, solo si tiene sentido; si no, despedite cordial.
Evitá: inventar datos de contacto de otro negocio, prometer que alguien la va a llamar o insistir con la oferta.$t$,
 'mejora 14/11', current_date, true, 209, 'claude'),

-- ── Jurídico ───────────────────────────────────────────────────────────────
(2, 'juridico_hay_chance', 'tema', 'juridico', '«¿Hay chance de reclamar?» o «¿me corresponde algo?»', array['hay chance','hay alguna chance','se puede reclamar','puedo reclamar','me corresponde','corresponde algo','tengo derecho','se puede hacer algo','vale la pena','sirve reclamar','gano algo','cobro algo'],
$t$- No prometas resultado ni monto: «siempre hay chance» o «sí, te corresponde» no se dicen.
- Respondé con lo que sí se puede decir: que depende de cómo fue el accidente, de las lesiones o secuelas, del tratamiento y de lo que ya hizo la ART; y que justamente eso lo revisa el abogado del equipo (si la ficha del negocio dice que esa revisión no tiene costo, decilo; si no, no lo menciones).
- Si contó su caso con detalle o ya aceptó hablar, no hagas más preguntas: confirmá que la contacta una persona del equipo y preguntá solo la franja (mañana o tarde) si todavía no la dijo.
- Si es un tema que el estudio no trabaja según la ficha del negocio, decilo con claridad en vez de dar esperanzas.$t$,
 'mejora 14/11', current_date, true, 22, 'claude'),

(2, 'juridico_ya_la_llamaron', 'tema', 'juridico', '«Ya me llamaron varios estudios» o «me dijeron que no se puede»', array['varios estudios','muchos estudios','otros estudios','ya me llamaron','me llamaron de','me dijeron que no','no tiene cobertura','no se puede reclamar','no se puede hacer nada','me dijeron que no correspondia'],
$t$- No hables mal de otros estudios ni discutas lo que le dijeron.
- Una frase concreta: cada caso se mira con sus papeles y sus secuelas. Si la ficha del negocio dice que la revisión no tiene costo, sumalo; si no, no lo menciones.
- Una sola pregunta de sí o no: si quiere que un abogado del equipo lo revise. Si dice que no o ya está cansada de llamados, disculpate por la molestia y cerrá en una línea.
- Si explica que el problema que le dijeron es puntual (por ejemplo, un tratamiento que «no tiene cobertura»), no afirmes que sí la tiene: decí que eso lo evalúa el abogado con su caso.$t$,
 'mejora 14/11', current_date, true, 23, 'claude'),

(2, 'juridico_sigue_en_tratamiento', 'tema', 'juridico', 'Sigue en tratamiento, la ART demora o le cancela sesiones', array['sigo en tratamiento','estoy en tratamiento','kinesio*','sesiones','me cancelaron','me suspendieron','no me dan turno','no me atienden','me tienen a las vueltas','sigo con dolor','todavia no me dieron el alta','sigo de baja','estoy de baja'],
$t$- Es una de las señales más claras de interés: la persona está en pleno trámite y con problemas. No hagas más de una pregunta antes de proponer el paso.
- Reconocé lo que cuenta en una frase («qué bronca que te cancelen las sesiones»), sin dramatizar.
- Proponé que la contacte un abogado del equipo para ver cómo sigue su caso con la ART, y preguntá solo la franja (mañana o tarde).
- No des indicaciones médicas ni le digas qué hacer con la ART; tampoco prometas que el abogado va a conseguir las sesiones.$t$,
 'mejora 14/11', current_date, true, 24, 'claude'),

-- ── Coberturas médicas ──────────────────────────────────────────────────────
(2, 'cob_tramite_de_su_cobertura', 'tema', 'coberturas_medicas', 'Pide un trámite de su obra social actual (credencial, situación, turno, baja)', array['quiero comunicarme con','comunicarme con','saber mi situacion','mi situacion','mi credencial','credencial','mi afiliacion','estoy afiliad*','sacar turno','pedir turno','autorizacion','autorizar','dar de baja mi','mi numero de afiliado'],
$t$- Aclarale en una frase que no somos su obra social ni su prepaga: comparamos coberturas y no tenemos acceso a su ficha, sus turnos ni sus trámites.
- Orientala sin inventar datos: que el trámite lo hace por los canales de su cobertura (la credencial o la app suelen traer el teléfono). No des números ni direcciones que no estén en la ficha del negocio.
- Una sola vez, si tiene sentido, ofrecé lo nuestro: «si en algún momento querés comparar si te conviene otra cobertura, te ayudo». Si no le interesa, despedite cordial.$t$,
 'mejora 14/11', current_date, true, 21, 'claude'),

(2, 'cob_pide_un_prestador', 'tema', 'coberturas_medicas', 'Pide una cobertura que incluya un hospital, sanatorio o médico puntual', array['que tenga el','que tenga la','que incluya','que cubra el','que entre el','hospital','sanatorio','clinica','que este mi medico','con mi medico','cartilla con'],
$t$- Es una señal fuerte de interés: tomá el prestador como prioridad y decilo en una frase («anoto que tiene que estar tal sanatorio»).
- No afirmes qué planes lo incluyen ni cuánto cuestan: eso lo confirma el asesor con la cartilla vigente.
- Preguntá solo lo que falte para comparar, de a una cosa: para quiénes sería (cantidad y edades) y en qué zona. Con eso, proponé que la contacte el asesor.
- No pidas diagnósticos ni datos de salud.$t$,
 'mejora 14/11', current_date, true, 22, 'claude'),

-- ── Autos 0 km ──────────────────────────────────────────────────────────────
(2, 'autos_marcas_y_requisitos', 'tema', 'agencia_0km', '«¿Con qué marcas trabajan?», «¿reciben DNI?», «¿qué piden?»', array['que marcas','con que marcas','marcas trabajan','trabajan con','que marca','reciben dni','solo dni','solo con dni','que piden','que requisitos','requisitos','que necesito para'],
$t$- Respondé solo con lo que diga la ficha del negocio. Si no nombra marcas, no las nombres ni des ejemplos.
- Si no sabés los requisitos exactos, no digas «sí, solo con DNI»: explicá que dependen del modelo y de la forma de pago, y que el vendedor se los confirma.
- Convertí la pregunta en el paso: «¿Qué modelo o tipo de auto te interesa? Con eso el vendedor te dice marcas, requisitos y opciones». Si ya contó qué busca, proponé directamente que lo contacte el vendedor.$t$,
 'mejora 14/11', current_date, true, 21, 'claude'),

(2, 'autos_busca_usado', 'tema', 'agencia_0km', 'Busca un usado o está mirando autos de años anteriores', array['busco usado*','busco un usado','viendo usados','mirando usados','prefiero usado*','prefiero un usado','quiero un usado','auto usado','usado reciente','con poco uso'],
$t$- Sé claro: trabajamos con 0 km (según la ficha del negocio). No digas que conseguimos usados.
- Una sola comparación útil, sin presión: con un 0 km financiado a veces la diferencia con un usado reciente es menor de lo que parece, y tiene garantía; no des cifras.
- Una pregunta de sí o no: si le sirve ver una opción 0 km del tipo de auto que busca. Si dice que no o que quiere usado sí o sí, despedite cordial.
- Si cuenta que espera cobrar un seguro o vender su auto, anotalo como dato para el vendedor; no calcules montos.$t$,
 'mejora 14/11', current_date, true, 22, 'claude'),

-- ── Marketing ───────────────────────────────────────────────────────────────
(2, 'mkt_pasan_otro_contacto', 'tema', 'marketing', 'Pasan el contacto de otra persona (encargado, dueño, área de marketing)', array['te paso el contacto','te envio el contacto','te mando el contacto','contacto compartido','habla con','hablá con','comunicate con','el encargado','la encargada','el dueño','el dueno','la duena','sector de marketing','quien maneja','lo maneja'],
$t$- No es un rechazo: es una puerta. Agradecé en una línea y confirmá que le vamos a escribir a esa persona.
- Vos no podés escribirle a otro número desde esta conversación: usá escalar_a_humano con el motivo «pasaron el contacto de quien decide» para que una persona del equipo lo tome. No cierres la conversación como perdida.
- No pidas más datos a quien te pasó el contacto ni repitas la propuesta.$t$,
 'mejora 14/11', current_date, true, 21, 'claude'),

(2, 'mkt_ya_conto_su_situacion', 'tema', 'marketing', 'El negocio ya contó cómo le llegan los clientes: proponer el paso', array['boca a boca','boca en boca','nos llegan','nos escriben','por recomendacion','redes y pagina','pagina web','publicitamos','pautamos','algunas funcionan','nos funciona','mitad y mitad','la mitad','curiosos','consultas que no compran'],
$t$- Si el negocio ya te contó dos cosas concretas (de dónde le llegan los clientes, qué le funciona o qué le falla), no sigas preguntando: ya tenés lo necesario.
- Devolvé una frase que muestre que entendiste su caso con sus palabras y proponé el siguiente paso, con opciones: un análisis corto de su presencia digital o una llamada breve con el equipo. «¿Te sirve que te lo mostremos en una llamada de 15 minutos esta semana, o preferís que te lo mandemos por acá?».
- No des precios, plazos ni resultados prometidos; si piden precio, eso lo pasa una persona del equipo.$t$,
 'mejora 14/11', current_date, true, 22, 'claude')
on conflict (version, clave) do nothing;
