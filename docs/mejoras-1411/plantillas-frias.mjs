// Plantillas de inicio para bases frías por Wasender (14/11). Se SUMAN a las
// 40 del 13/11 (no se edita ninguna). 12 ángulos nuevos por perfil.
//
// Diferencia con las del 13/11: aquellas cambian una o dos palabras entre
// variantes («Hola/Buenas», «soy/te escribe»), y todas abren igual. Acá cada
// variante se arma con piezas distintas (saludo, presentación, gancho,
// pregunta, cierre) en estructuras distintas (presentación primero, pregunta
// primero, en dos párrafos, corta, sin saludo), y el generador se queda solo
// con las que se diferencian de verdad entre sí y de las que ya existen.
//
// Base fría: nunca se dice que la persona consultó antes. Sin promesas de
// resultado, montos, precios, cuotas, stock ni plazos. Marketing sin nombre de
// la persona (en esas bases suele venir el nombre del negocio).
//
// Reglas de texto: {{nombre}} nunca después de una coma ni al principio, para
// que sin nombre el saludo quede bien («Hola {{nombre}}, ¿cómo estás?» →
// «Hola, ¿cómo estás?»).

const conNombre = [
  "Hola {{nombre}}, ¿cómo estás?",
  "Hola {{nombre}}.",
  "Hola {{nombre}}, ¿cómo andás?",
  "Buenas {{nombre}}, ¿cómo estás?",
  "Qué tal {{nombre}}, ¿todo bien?",
  "¡Hola {{nombre}}!",
  "Hola {{nombre}}, ¿qué tal?",
  "Buenas {{nombre}}.",
  "Hola, ¿cómo va?",
  "Hola, ¿qué tal?",
  "Buenas, ¿cómo andás?",
  "",
];


const presentaciones = [
  "Soy {{asesor}}, de {{marca}}.",
  "Te escribe {{asesor}}, de {{marca}}.",
  "Mi nombre es {{asesor}} y te escribo desde {{marca}}.",
  "Te habla {{asesor}}, de {{marca}}.",
  "Acá {{asesor}}, de {{marca}}.",
  "Me presento: soy {{asesor}} y trabajo en {{marca}}.",
  "Te escribo desde {{marca}}, mi nombre es {{asesor}}.",
  "Soy {{asesor}} y te escribo de parte de {{marca}}.",
  "Te contacto desde {{marca}}; soy {{asesor}}.",
  "Te escribo de {{marca}}. Soy {{asesor}}.",
];

// Marketing va de «ustedes» (se le escribe a un negocio): sus piezas en plural.
const presentacionesPlural = [
  "Soy {{asesor}}, de {{marca}}.",
  "Les escribe {{asesor}}, de {{marca}}.",
  "Mi nombre es {{asesor}} y les escribo desde {{marca}}.",
  "Les habla {{asesor}}, de {{marca}}.",
  "Acá {{asesor}}, de {{marca}}.",
  "Me presento: soy {{asesor}} y trabajo en {{marca}}.",
  "Les escribo desde {{marca}}, mi nombre es {{asesor}}.",
  "Soy {{asesor}} y les escribo de parte de {{marca}}.",
  "Los contacto desde {{marca}}; soy {{asesor}}.",
];
const aperturasPlural = ["Les robo un minuto.", "Seré breve.", "Perdón por escribirles así, de golpe.", "Va una consulta corta."];
const previasPlural = ["Una consulta rápida:", "Les hago una pregunta corta:", "Les consulto algo:", "Pregunta rápida:"];
const cierresPlural = [
  "Si no es para ustedes, avísenme y no les escribo más.",
  "Cualquier cosa me responden por acá.",
  "Sin compromiso.",
  "Si no les interesa, díganmelo tranquilos y no insisto.",
  "Quedo atento.",
  "Cuando puedan me cuentan.",
];
const sinNombrePlural = ["Hola, ¿cómo están?", "Buenas, ¿qué tal?", "Hola, ¿qué tal?", "¿Cómo va?", "Hola, buenas.", "¡Hola!", "Hola, ¿todo bien?", ""];

const aperturas = ["Te robo un minuto.", "Seré breve.", "Te escribo cortito.", "Perdón por escribirte así, de golpe.", "Va una consulta corta."];
const previasPregunta = ["Una consulta rápida:", "Te hago una pregunta corta:", "Te consulto algo:", "Pregunta rápida:"];
const cierres = [
  "Si no es para vos, avisame y no te escribo más.",
  "Cualquier cosa me respondés por acá.",
  "Sin compromiso, ¿eh?",
  "Si no te interesa, decímelo tranquilo y no insisto.",
  "Quedo atento.",
  "Cuando puedas me contás.",
];

const PERFILES = {
  juridico: {
    saludos: conNombre,
    angulos: [
      {
        nombre: "jur_fria_alta_temprana",
        angulo: "alta de la ART antes de estar bien",
        ganchos: [
          "Muchas personas reciben el alta de la ART cuando todavía no están del todo bien.",
          "Pasa seguido que la ART da el alta y la persona sigue con dolor o sin poder trabajar como antes.",
          "Un alta temprana de la ART es más común de lo que parece, y no siempre es la última palabra.",
          "Revisamos casos de personas a las que la ART les dio el alta antes de tiempo.",
          "Si la ART te dio el alta y seguís con molestias, eso se puede mirar con un abogado.",
          "Nos dedicamos a revisar altas de ART que llegan antes de que la persona esté recuperada.",
        ],
        preguntas: [
          "¿Te pasó algo así después de un accidente de trabajo?",
          "¿Tuviste un accidente laboral en los últimos años?",
          "¿Alguna vez te dieron el alta estando todavía con dolor?",
          "¿Es tu caso o el de alguien cercano?",
          "¿Te tocó pasar por una ART en algún momento?",
        ],
      },
      {
        nombre: "jur_fria_porcentaje",
        angulo: "incapacidad o porcentaje que fijó la ART",
        ganchos: [
          "El porcentaje de incapacidad que fija la ART no siempre refleja cómo quedó la persona.",
          "Muchas veces la ART calcula una incapacidad más baja de la que la persona siente que tiene.",
          "Revisamos porcentajes de incapacidad de accidentes de trabajo: a veces hay diferencias.",
          "Cuando la ART te pone un porcentaje, eso se puede revisar con un abogado.",
          "Hay casos en los que lo que paga la ART sale de un porcentaje que quedó corto.",
          "Una de las cosas que más revisamos es el porcentaje de incapacidad después de un accidente laboral.",
        ],
        preguntas: [
          "¿Te pasó de recibir un porcentaje que te pareció bajo?",
          "¿Tuviste algún accidente de trabajo con ART?",
          "¿La ART te fijó alguna incapacidad en algún momento?",
          "¿Te quedó alguna duda con lo que te reconocieron?",
          "¿Es algo que te haya tocado vivir?",
        ],
      },
      {
        nombre: "jur_fria_rechazo_art",
        angulo: "la ART rechazó o no reconoció el accidente",
        ganchos: [
          "A veces la ART rechaza un accidente o dice que no tiene que ver con el trabajo.",
          "Que la ART no reconozca un accidente no siempre cierra el tema.",
          "Revisamos casos en los que la ART rechazó la denuncia del accidente.",
          "Pasa que la ART dice que la lesión no es laboral, y no siempre tiene razón.",
          "Si la ART te rechazó un siniestro, un abogado puede revisarlo.",
          "Muchas personas dejan de reclamar cuando la ART les dice que no, y a veces había algo para revisar.",
        ],
        preguntas: [
          "¿Te pasó algo así alguna vez?",
          "¿Tuviste un accidente de trabajo que la ART no te reconoció?",
          "¿Te rechazaron alguna denuncia de accidente laboral?",
          "¿Conocés a alguien a quien le haya pasado?",
          "¿Tuviste algún problema con una ART?",
        ],
      },
      {
        nombre: "jur_fria_sin_registrar",
        angulo: "accidente trabajando sin registrar",
        ganchos: [
          "Tener un accidente trabajando sin estar registrado es más común de lo que parece.",
          "Aunque el trabajo no estuviera en blanco, un accidente se puede revisar con un abogado.",
          "Mucha gente piensa que, si no estaba registrada, no puede hacer nada después de un accidente. No siempre es así.",
          "Revisamos accidentes de trabajo también cuando la persona trabajaba en negro.",
          "Estar en negro no siempre deja a la persona sin opciones después de un accidente laboral.",
        ],
        preguntas: [
          "¿Te pasó algo así en algún trabajo?",
          "¿Tuviste un accidente trabajando sin estar registrado?",
          "¿Te lastimaste alguna vez en un trabajo informal?",
          "¿Es tu caso o el de alguien que conozcas?",
          "¿Te sirve que lo revisemos?",
        ],
      },
      {
        nombre: "jur_fria_comision_medica",
        angulo: "citación a comisión médica sin asesoramiento",
        ganchos: [
          "Muchas personas van a la comisión médica solas, sin saber bien qué se decide ahí.",
          "La comisión médica es un paso importante después de un accidente de trabajo, y conviene llegar asesorado.",
          "Acompañamos a personas que tienen que pasar por comisión médica por un accidente laboral.",
          "Si te citaron a comisión médica, vale la pena que antes lo mire un abogado.",
          "Lo que se decide en la comisión médica pesa mucho en lo que después se cobra.",
        ],
        preguntas: [
          "¿Te tocó pasar por comisión médica o te citaron hace poco?",
          "¿Tuviste algún accidente de trabajo en el último tiempo?",
          "¿Tenés alguna citación pendiente por un accidente laboral?",
          "¿Fuiste a comisión médica alguna vez?",
          "¿Te sirve que lo charlemos?",
        ],
      },
      {
        nombre: "jur_fria_moto_bici",
        angulo: "accidente en moto o bici",
        ganchos: [
          "Revisamos accidentes en moto y en bici, en la calle o yendo a trabajar.",
          "Los accidentes en moto son de los más comunes, y muchas veces nadie reclama lo que corresponde.",
          "Si tuviste un accidente en moto o en bicicleta, un abogado puede revisar qué se puede reclamar.",
          "Muchas personas que se accidentan en moto no saben que pueden reclamar al seguro del otro.",
          "Trabajamos con accidentes de tránsito en moto y en bici.",
        ],
        preguntas: [
          "¿Tuviste algún accidente así en los últimos años?",
          "¿Te pasó algo en moto o en bici en el último tiempo?",
          "¿Andás en moto o en bici seguido?",
          "¿Te pasó a vos o a alguien de tu familia?",
          "¿Quedó algo sin resolver de un accidente así?",
        ],
      },
      {
        nombre: "jur_fria_peaton_pasajero",
        angulo: "peatón o pasajero lesionado",
        ganchos: [
          "Si te lastimaste como peatón o viajando en colectivo, eso también se puede reclamar.",
          "Los accidentes de pasajeros en colectivo, taxi o remís también se revisan con un abogado.",
          "Mucha gente que se golpea en un colectivo o en la calle no sabe que puede reclamar.",
          "Revisamos casos de peatones y pasajeros que se lastimaron en un accidente de tránsito.",
          "Una caída en un colectivo o un atropello pueden tener un reclamo detrás.",
        ],
        preguntas: [
          "¿Te pasó algo así?",
          "¿Tuviste algún accidente como peatón o pasajero?",
          "¿Te lastimaste alguna vez viajando en transporte?",
          "¿Le pasó a alguien cercano?",
          "¿Quedó algo pendiente de un accidente así?",
        ],
      },
      {
        nombre: "jur_fria_familiar",
        angulo: "un familiar tuvo un accidente",
        ganchos: [
          "Muchas veces quien tuvo el accidente no tiene tiempo ni ganas de averiguar, y lo hace alguien de la familia.",
          "Revisamos accidentes de trabajo y de tránsito, también cuando el que consulta es un familiar.",
          "Si alguien de tu familia tuvo un accidente, podemos revisar su caso sin compromiso.",
          "A veces el accidente lo tuvo un familiar y nadie llegó a revisar si le correspondía algo más.",
        ],
        preguntas: [
          "¿Alguien de tu familia tuvo un accidente de trabajo o en la calle?",
          "¿Conocés a alguien que haya tenido un accidente hace poco?",
          "¿Hay alguien cerca tuyo que esté pasando por algo así?",
          "¿Te sirve que lo miremos para alguien de tu familia?",
        ],
      },
      {
        nombre: "jur_fria_plazos",
        angulo: "los reclamos tienen plazos",
        ganchos: [
          "Los reclamos por accidentes tienen plazos, y muchas personas se enteran tarde.",
          "Después de un accidente, el tiempo corre: conviene revisarlo antes de que se pase.",
          "Muchos casos se pierden solo porque nadie los revisó a tiempo.",
          "Un accidente de hace un tiempo todavía puede estar a tiempo de revisarse, pero no para siempre.",
        ],
        preguntas: [
          "¿Tuviste algún accidente de trabajo o de tránsito en los últimos años?",
          "¿Hay algún accidente tuyo que nunca llegaste a revisar?",
          "¿Te pasó algo que quedó sin reclamar?",
          "¿Querés que lo veamos antes de que pase más tiempo?",
        ],
      },
      {
        nombre: "jur_fria_lo_que_cobro",
        angulo: "cobró algo y no sabe si estaba bien",
        ganchos: [
          "Muchas personas cobran algo de la ART o del seguro y nunca saben si estaba bien calculado.",
          "Revisamos lo que pagó una ART o un seguro después de un accidente.",
          "A veces lo que se cobra después de un accidente queda corto y nadie lo revisa.",
          "Que te hayan pagado algo no siempre quiere decir que te pagaron todo.",
        ],
        preguntas: [
          "¿Cobraste algo por un accidente y te quedó la duda?",
          "¿Te pagaron alguna vez por un accidente de trabajo o de tránsito?",
          "¿Te quedó alguna duda con lo que te dieron?",
          "¿Te sirve que lo revisemos?",
        ],
      },
      {
        nombre: "jur_fria_pregunta_corta",
        angulo: "una sola pregunta directa",
        ganchos: [
          "Revisamos accidentes de trabajo y de tránsito.",
          "Trabajamos con accidentes laborales y choques.",
          "Nos dedicamos a accidentes de trabajo y de tránsito.",
          "Revisamos casos de accidentes, sin compromiso.",
        ],
        preguntas: [
          "¿Tuviste algún accidente de trabajo o en la calle en los últimos años?",
          "¿Te pasó algún accidente en el último tiempo?",
          "¿Tuviste un accidente que haya quedado sin resolver?",
          "¿Tenés algún accidente pendiente de revisar?",
        ],
      },
      {
        nombre: "jur_fria_enfermedad",
        angulo: "lesiones por esfuerzo o movimientos repetidos",
        ganchos: [
          "Hernias, problemas de columna o de manos por el trabajo de todos los días también pueden revisarse.",
          "No hace falta un accidente: el desgaste del trabajo también puede generar un reclamo.",
          "Revisamos problemas de salud que vienen del trabajo, como columna, rodillas, hombros o manos.",
          "Muchas lesiones aparecen de a poco, por hacer fuerza o repetir movimientos en el trabajo.",
          "Si el trabajo te dejó algún problema de salud, puede haber algo para revisar con un abogado.",
        ],
        preguntas: [
          "¿Tenés alguna dolencia que creas que viene de tu trabajo?",
          "¿Te diagnosticaron algo relacionado con tu trabajo?",
          "¿Te pasa algo así a vos o a alguien cercano?",
          "¿Tu trabajo es de mucho esfuerzo físico?",
          "¿Te duele algo que empezó trabajando?",
        ],
      },
    ],
  },
  coberturas_medicas: {
    saludos: conNombre,
    angulos: [
      {
        nombre: "cob_fria_monotributo",
        angulo: "monotributistas: usar el aporte",
        ganchos: [
          "Si sos monotributista, una parte de lo que pagás ya va para la obra social, y se puede aprovechar mejor.",
          "Muchos monotributistas pagan la obra social y no la usan porque no les sirve.",
          "Ayudamos a monotributistas a elegir una cobertura que realmente usen.",
          "El aporte del monotributo se puede usar para una cobertura que te sirva más.",
          "Hay monotributistas que pagan aparte una prepaga sin saber que pueden usar su aporte.",
        ],
        preguntas: [
          "¿Sos monotributista?",
          "¿Hoy usás la obra social del monotributo?",
          "¿Estás conforme con la cobertura que tenés?",
          "¿Te sirve que veamos opciones con tu aporte?",
          "¿Qué cobertura tenés hoy?",
        ],
      },
      {
        nombre: "cob_fria_cambio_trabajo",
        angulo: "cambio de trabajo: elegir obra social",
        ganchos: [
          "Cuando alguien empieza un trabajo nuevo, muchas veces puede elegir a qué obra social van sus aportes.",
          "Con un trabajo en relación de dependencia, el aporte se puede llevar a una cobertura que te convenga más.",
          "Mucha gente se queda con la obra social que le tocó sin saber que podía elegir.",
          "Ayudamos a elegir la obra social cuando hay un cambio de trabajo.",
        ],
        preguntas: [
          "¿Trabajás en relación de dependencia?",
          "¿Cambiaste de trabajo hace poco?",
          "¿Elegiste vos tu obra social o te la asignaron?",
          "¿Estás conforme con la que tenés hoy?",
          "¿Te sirve que lo revisemos juntos?",
        ],
      },
      {
        nombre: "cob_fria_hijos",
        angulo: "cobertura para los chicos",
        ganchos: [
          "Con chicos en casa, pediatría y guardia cerca pasan a ser lo más importante de una cobertura.",
          "Muchas familias eligen la cobertura pensando en los pediatras y las guardias de la zona.",
          "Comparamos coberturas pensando en lo que más usan las familias con hijos.",
          "Una buena cobertura para los chicos no siempre es la más cara.",
        ],
        preguntas: [
          "¿Tenés hijos que necesiten cobertura?",
          "¿Estás conforme con la cobertura de los chicos?",
          "¿La buscarías para toda la familia o solo para los chicos?",
          "¿Qué es lo que más usan en casa: pediatra, guardia, odontología?",
        ],
      },
      {
        nombre: "cob_fria_cartilla_zona",
        angulo: "médicos y sanatorios cerca de casa",
        ganchos: [
          "Una cobertura sirve de verdad cuando tenés médicos y sanatorios cerca de casa.",
          "Mucha gente paga una prepaga y para atenderse tiene que viajar lejos.",
          "Comparamos coberturas mirando qué cartilla hay en tu zona.",
          "Lo primero que miramos al comparar es qué médicos y clínicas te quedan cerca.",
        ],
        preguntas: [
          "¿En qué zona te atendés normalmente?",
          "¿Te queda cerca lo que cubre tu obra social o prepaga?",
          "¿Tenés que viajar mucho para atenderte?",
          "¿Hoy tenés cobertura médica?",
        ],
      },
      {
        nombre: "cob_fria_mayores",
        angulo: "opciones para personas mayores y jubiladas",
        ganchos: [
          "También comparamos coberturas para personas mayores y jubiladas.",
          "Muchas personas jubiladas no saben que pueden comparar opciones de cobertura.",
          "Ayudamos a personas mayores, o a sus familias, a revisar qué cobertura les conviene.",
          "Elegir cobertura para un padre o una madre mayor no es fácil: lo comparamos con vos.",
        ],
        preguntas: [
          "¿La buscarías para vos o para alguien de tu familia?",
          "¿Tenés a alguien mayor en casa que necesite cobertura?",
          "¿Estás conforme con la cobertura que tiene hoy?",
          "¿Te sirve que veamos opciones?",
        ],
      },
      {
        nombre: "cob_fria_aportes_doble",
        angulo: "paga prepaga y además le descuentan aportes",
        ganchos: [
          "Hay personas que pagan una prepaga y además les descuentan aportes que no usan.",
          "Si te descuentan aportes del sueldo, muchas veces se pueden derivar a la prepaga que ya pagás.",
          "Mucha gente paga dos veces por la salud sin darse cuenta.",
          "Derivar los aportes puede bajar lo que pagás de tu bolsillo.",
        ],
        preguntas: [
          "¿Hoy pagás una prepaga aparte?",
          "¿Te descuentan aportes de obra social del sueldo?",
          "¿Sabés a dónde van tus aportes?",
          "¿Te sirve que lo revisemos?",
        ],
      },
      {
        nombre: "cob_fria_turnos",
        angulo: "turnos que tardan",
        ganchos: [
          "Si conseguir un turno con un especialista te lleva semanas, quizás tu cobertura no es la que necesitás.",
          "Una de las quejas más comunes es lo que tardan los turnos.",
          "Comparamos coberturas mirando también cuánto cuesta conseguir turno.",
          "Pagar una cobertura y no conseguir turno es de lo más frustrante.",
        ],
        preguntas: [
          "¿Te cuesta conseguir turnos con tu cobertura actual?",
          "¿Estás conforme con cómo te atienden hoy?",
          "¿Qué especialista usás más?",
          "¿Hoy tenés obra social o prepaga?",
        ],
      },
      {
        nombre: "cob_fria_independiente",
        angulo: "trabaja por su cuenta, sin cobertura",
        ganchos: [
          "Muchas personas que trabajan por su cuenta se quedan sin cobertura médica.",
          "Si trabajás de forma independiente, hay opciones de cobertura de distintos niveles.",
          "Trabajar por tu cuenta no tiene por qué significar quedarte sin cobertura.",
          "Ayudamos a independientes a encontrar una cobertura que puedan sostener.",
        ],
        preguntas: [
          "¿Trabajás por tu cuenta?",
          "¿Hoy tenés alguna cobertura médica?",
          "¿Te atendés por hospital público?",
          "¿Te sirve que veamos opciones?",
        ],
      },
      {
        nombre: "cob_fria_comparar",
        angulo: "comparar sin compromiso",
        ganchos: [
          "Comparamos obras sociales y prepagas, sin compromiso.",
          "Te ayudamos a comparar coberturas para que elijas con información.",
          "Hacemos la comparación de coberturas por vos.",
          "Muchas personas nunca compararon su cobertura con otras.",
          "Comparar cobertura lleva tiempo; nosotros lo hacemos por vos.",
        ],
        preguntas: [
          "¿Hace cuánto que no comparás tu cobertura?",
          "¿Estás conforme con lo que tenés hoy?",
          "¿Te sirve que te pasemos opciones?",
          "¿Qué es lo que más te importa de una cobertura?",
        ],
      },
      {
        nombre: "cob_fria_pregunta_corta",
        angulo: "una sola pregunta directa",
        ganchos: [
          "Ayudamos a elegir obra social o prepaga.",
          "Comparamos coberturas médicas.",
          "Trabajamos con obras sociales y prepagas.",
          "Revisamos coberturas de salud.",
        ],
        preguntas: [
          "¿Hoy tenés obra social o prepaga?",
          "¿Estás conforme con tu cobertura médica?",
          "¿Estás buscando cobertura de salud?",
          "¿Te interesa comparar tu cobertura?",
        ],
      },
      {
        nombre: "cob_fria_familia",
        angulo: "toda la familia en un mismo plan",
        ganchos: [
          "Tener a toda la familia en un mismo plan suele ser más simple y, a veces, conviene.",
          "Muchas familias tienen a cada uno en una cobertura distinta sin saber que pueden unificar.",
          "Comparamos planes familiares según quiénes viven en casa.",
          "Sumar a la pareja o a los chicos a un plan es una consulta muy común.",
        ],
        preguntas: [
          "¿Cuántas personas serían para cubrir?",
          "¿Hoy cada uno tiene una cobertura distinta?",
          "¿La buscarías solo para vos o para la familia?",
          "¿Te sirve que veamos un plan para todos?",
        ],
      },
      {
        nombre: "cob_fria_reintegros",
        angulo: "especialistas, estudios y reintegros",
        ganchos: [
          "Lo que más diferencia a una cobertura de otra es cómo responde con especialistas y estudios.",
          "Hay coberturas con buena cartilla de especialistas y otras que te obligan a pagar aparte.",
          "Si terminás pagando consultas o estudios de tu bolsillo, vale la pena comparar.",
          "Comparamos coberturas mirando especialistas, estudios y reintegros.",
        ],
        preguntas: [
          "¿Te pasa de pagar consultas aparte?",
          "¿Qué especialistas usás más?",
          "¿Estás conforme con lo que te cubre hoy tu plan?",
          "¿Hoy tenés cobertura médica?",
        ],
      },
    ],
  },
  agencia_0km: {
    saludos: conNombre,
    angulos: [
      {
        nombre: "autos_fria_anticipo",
        angulo: "un anticipo y el resto financiado",
        ganchos: [
          "Mucha gente arranca con un anticipo y financia el resto del 0 km.",
          "No hace falta tener el total para un 0 km: hay formas de financiar una parte.",
          "Te ayudamos a ver cómo llegar al 0 km con lo que tenés hoy.",
          "Con una parte ahorrada y el resto financiado, el 0 km queda más cerca de lo que parece.",
        ],
        preguntas: [
          "¿Estás pensando en cambiar el auto?",
          "¿Tenés algo ahorrado para un auto?",
          "¿Te sirve que un asesor te muestre opciones?",
          "¿Qué modelo te gustaría?",
        ],
      },
      {
        nombre: "autos_fria_costo_total",
        angulo: "mirar el costo total, no solo la cuota",
        ganchos: [
          "Al financiar un auto, conviene mirar el costo total y no solo la cuota.",
          "Dos financiaciones con cuotas parecidas pueden terminar costando muy distinto.",
          "Te ayudamos a comparar financiaciones mirando cuánto pagás en total.",
          "La tasa, los gastos y el plazo cambian mucho el costo final del 0 km.",
        ],
        preguntas: [
          "¿Estás mirando algún auto para financiar?",
          "¿Ya pediste alguna cotización?",
          "¿Te sirve que te expliquemos las opciones?",
          "¿Estás pensando en un 0 km?",
        ],
      },
      {
        nombre: "autos_fria_plan_o_credito",
        angulo: "plan de ahorro o crédito",
        ganchos: [
          "Plan de ahorro o crédito: son caminos distintos para llegar al 0 km y conviene entender la diferencia.",
          "Muchas personas no saben si les conviene un plan de ahorro o un crédito prendario.",
          "Te contamos las diferencias entre plan de ahorro y crédito para que elijas tranquilo.",
          "Según cuándo necesites el auto, puede convenir un plan o un crédito.",
        ],
        preguntas: [
          "¿Cuándo te gustaría tener el auto?",
          "¿Ya estuviste mirando planes o créditos?",
          "¿Te sirve que un asesor te lo explique?",
          "¿Estás pensando en cambiar el auto?",
        ],
      },
      {
        nombre: "autos_fria_tasacion",
        angulo: "tasar el usado",
        ganchos: [
          "Si tenés un auto, se puede tasar y usar como parte de pago del 0 km.",
          "Saber cuánto vale tu usado es el primer paso para pensar en el 0 km.",
          "Tasamos tu auto actual para que veas cuánto te falta para el 0 km.",
          "Muchos clientes empiezan entregando su usado.",
        ],
        preguntas: [
          "¿Tenés un auto para entregar?",
          "¿Qué auto tenés hoy?",
          "¿Te sirve que lo tasemos?",
          "¿Estás pensando en cambiarlo?",
        ],
      },
      {
        nombre: "autos_fria_espacio",
        angulo: "más espacio: SUV o familiar",
        ganchos: [
          "Cada vez más gente busca un auto con más espacio para la familia o los viajes.",
          "Si el baúl ya no te alcanza, hay 0 km con mucho más espacio.",
          "Trabajamos con SUV y familiares 0 km.",
          "Un auto más grande cambia mucho los viajes con la familia.",
        ],
        preguntas: [
          "¿Estás buscando algo más grande?",
          "¿Para cuántas personas lo usarías?",
          "¿Te interesa ver opciones de SUV?",
          "¿Estás pensando en cambiar el auto?",
        ],
      },
      {
        nombre: "autos_fria_consumo",
        angulo: "un auto que gaste menos",
        ganchos: [
          "Con lo que cuesta cargar nafta, mucha gente busca un auto que gaste menos.",
          "Un 0 km moderno suele consumir bastante menos que un auto con años.",
          "Te ayudamos a encontrar un 0 km económico para el uso de todos los días.",
          "Hay modelos 0 km pensados para gastar poco en el día a día.",
        ],
        preguntas: [
          "¿Usás mucho el auto?",
          "¿Tu auto actual gasta mucho?",
          "¿Te interesa ver modelos económicos?",
          "¿Estás pensando en cambiar el auto?",
        ],
      },
      {
        nombre: "autos_fria_moto_a_auto",
        angulo: "pasar de la moto al auto",
        ganchos: [
          "Mucha gente que hoy anda en moto está pensando en pasarse al auto.",
          "Pasar de la moto al auto es un cambio grande y se puede planificar.",
          "Ayudamos a quienes quieren su primer auto después de la moto.",
          "Con lluvia, frío o familia, el auto empieza a hacer falta.",
        ],
        preguntas: [
          "¿Hoy te movés en moto?",
          "¿Estás pensando en tu primer auto?",
          "¿Te sirve que veamos opciones?",
          "¿Qué tipo de auto te gustaría?",
        ],
      },
      {
        nombre: "autos_fria_trabajo",
        angulo: "el auto como herramienta de trabajo",
        ganchos: [
          "Si usás el auto para trabajar, un 0 km te ahorra tiempo de taller y problemas.",
          "Para quien trabaja con el auto, tenerlo parado sale caro.",
          "Ayudamos a quienes usan el auto todos los días para trabajar.",
          "Un auto nuevo para trabajar se puede financiar.",
        ],
        preguntas: [
          "¿Usás el auto para trabajar?",
          "¿Tu auto actual te da problemas?",
          "¿Te sirve que veamos opciones?",
          "¿Qué uso le das al auto?",
        ],
      },
      {
        nombre: "autos_fria_taller",
        angulo: "auto viejo con gastos de taller",
        ganchos: [
          "Cuando el auto empieza a pasar más tiempo en el taller que en la calle, conviene hacer números.",
          "A veces lo que se gasta en arreglos se parece a lo que costaría financiar un 0 km.",
          "Mucha gente decide cambiar el auto cuando los arreglos se vuelven seguidos.",
          "Si tu auto ya tiene unos cuantos años, puede ser buen momento para pensar en el cambio.",
        ],
        preguntas: [
          "¿Tu auto te está dando muchos gastos?",
          "¿Cuántos años tiene tu auto?",
          "¿Estás pensando en cambiarlo?",
          "¿Te sirve que hagamos los números con vos?",
        ],
      },
      {
        nombre: "autos_fria_pregunta_corta",
        angulo: "una sola pregunta directa",
        ganchos: [
          "Trabajamos con 0 km.",
          "Vendemos autos 0 km con financiación.",
          "Ayudamos a conseguir 0 km.",
          "Asesoramos en la compra de 0 km.",
        ],
        preguntas: [
          "¿Estás pensando en cambiar el auto?",
          "¿Te interesa un 0 km?",
          "¿Estás buscando auto?",
          "¿Pensás cambiar el auto en los próximos meses?",
        ],
      },
      {
        nombre: "autos_fria_primer_auto",
        angulo: "el primer auto",
        ganchos: [
          "Comprar el primer auto genera muchas dudas, y es normal.",
          "Ayudamos a quienes van por su primer auto a entender bien las opciones.",
          "El primer 0 km es una decisión importante y se puede hacer paso a paso.",
          "Mucha gente joven está sacando su primer auto financiado.",
        ],
        preguntas: [
          "¿Sería tu primer auto?",
          "¿Ya tenés registro?",
          "¿Qué tipo de auto te gustaría?",
          "¿Te sirve que te expliquemos cómo es el proceso?",
        ],
      },
      {
        nombre: "autos_fria_modelos",
        angulo: "ver modelos disponibles",
        ganchos: [
          "Te podemos mostrar qué modelos hay y cómo se pueden financiar.",
          "Si tenés un modelo en la cabeza, te contamos qué opciones hay.",
          "Te contamos cómo se puede financiar el modelo que te guste.",
          "Lo más simple es empezar por el modelo que te gusta.",
        ],
        preguntas: [
          "¿Qué auto te gustaría tener?",
          "¿Tenés alguna marca preferida?",
          "¿Buscás algo chico, mediano o grande?",
          "¿Te interesa que te pasemos opciones?",
        ],
      },
    ],
  },
  marketing: {
    saludos: sinNombrePlural,
    plural: true,
    angulos: [
      {
        nombre: "mkt_fria_respuesta_rapida",
        angulo: "responder rápido en WhatsApp",
        ganchos: [
          "Muchos negocios pierden ventas solo por tardar en contestar el WhatsApp.",
          "Cuando una consulta tarda en responderse, el cliente suele comprarle a otro.",
          "Ayudamos a negocios a responder al instante, aunque estén ocupados.",
          "Responder rápido es de lo que más ayuda a vender por WhatsApp.",
        ],
        preguntas: [
          "¿Cómo manejan hoy las consultas que llegan por WhatsApp?",
          "¿Les pasa de no llegar a contestar todo?",
          "¿Les interesa que les cuente cómo lo resolvemos?",
          "¿Reciben muchas consultas por día?",
        ],
      },
      {
        nombre: "mkt_fria_web",
        angulo: "web propia o desactualizada",
        ganchos: [
          "Una web simple y clara ayuda mucho a que un negocio genere confianza.",
          "Muchos clientes buscan el negocio en internet antes de escribir.",
          "Hacemos webs para negocios, pensadas para recibir consultas.",
          "Una web vieja o lenta puede espantar clientes sin que te enteres.",
        ],
        preguntas: [
          "¿El negocio tiene página web?",
          "¿Les llegan consultas desde la web?",
          "¿Les interesa renovar su web?",
          "¿Quién se ocupa hoy de la web?",
        ],
      },
      {
        nombre: "mkt_fria_resenas",
        angulo: "reseñas en Google",
        ganchos: [
          "Las reseñas en Google pesan mucho a la hora de elegir un negocio.",
          "Un negocio con buenas reseñas recibe más consultas que uno sin reseñas.",
          "Ayudamos a negocios a conseguir más reseñas de sus clientes.",
          "Pocas reseñas o reseñas sin responder pueden hacer perder clientes.",
        ],
        preguntas: [
          "¿Le piden reseñas a sus clientes?",
          "¿Quién responde las reseñas del negocio?",
          "¿Les interesa mejorar eso?",
          "¿Saben cuántas reseñas tienen hoy?",
        ],
      },
      {
        nombre: "mkt_fria_instagram",
        angulo: "redes sin constancia",
        ganchos: [
          "Mantener las redes del negocio al día lleva tiempo, y muchas veces queda para después.",
          "Un Instagram activo le muestra al cliente que el negocio está vivo.",
          "Ayudamos a negocios a publicar con constancia sin que les quite tiempo.",
          "Muchos negocios tienen Instagram pero publican cada tanto.",
        ],
        preguntas: [
          "¿Quién maneja hoy las redes del negocio?",
          "¿Publican seguido?",
          "¿Les llegan clientes por Instagram?",
          "¿Les interesa que les cuente cómo trabajamos?",
        ],
      },
      {
        nombre: "mkt_fria_turnos",
        angulo: "reservas y turnos online",
        ganchos: [
          "Dar turnos o reservas por WhatsApp a mano consume muchísimo tiempo.",
          "Un sistema de turnos online le ahorra horas a cualquier negocio.",
          "Ayudamos a negocios a automatizar turnos y reservas.",
          "Los clientes valoran poder reservar a cualquier hora, sin esperar respuesta.",
        ],
        preguntas: [
          "¿Trabajan con turnos o reservas?",
          "¿Cómo los organizan hoy?",
          "¿Les interesa automatizarlo?",
          "¿Les lleva mucho tiempo coordinar?",
        ],
      },
      {
        nombre: "mkt_fria_anuncios",
        angulo: "anuncios que no rinden",
        ganchos: [
          "Muchos negocios invierten en anuncios y no saben bien qué les están dando.",
          "Pagar publicidad sin medir resultados es como tirar plata al aire.",
          "Ayudamos a negocios a ordenar sus anuncios y a medir qué funciona.",
          "Un anuncio bien armado puede rendir mucho más que varios mal hechos.",
        ],
        preguntas: [
          "¿Hacen publicidad en redes o en Google?",
          "¿Saben cuántas consultas les traen los anuncios?",
          "¿Les interesa revisarlo?",
          "¿Quién arma hoy los anuncios?",
        ],
      },
      {
        nombre: "mkt_fria_fuera_de_horario",
        angulo: "consultas fuera de horario",
        ganchos: [
          "Muchas consultas llegan de noche o el fin de semana, cuando no hay nadie para responder.",
          "Una atención automática por WhatsApp puede responder aunque el negocio esté cerrado.",
          "Ayudamos a negocios a no perder las consultas que llegan fuera de horario.",
          "El cliente que escribe a la noche quiere una respuesta en el momento.",
        ],
        preguntas: [
          "¿Les llegan consultas fuera de horario?",
          "¿Qué pasa hoy con esos mensajes?",
          "¿Les interesa que les cuente cómo funciona?",
          "¿Atienden ustedes mismos el WhatsApp?",
        ],
      },
      {
        nombre: "mkt_fria_competencia",
        angulo: "la competencia aparece primero",
        ganchos: [
          "Cuando alguien busca lo que ustedes venden, muchas veces aparece primero la competencia.",
          "Aparecer bien en Google Maps hace una diferencia grande para un negocio de barrio.",
          "Ayudamos a negocios a aparecer mejor en Google.",
          "Estar bien ubicado en las búsquedas trae clientes sin pagar publicidad.",
        ],
        preguntas: [
          "¿Probaron buscarse en Google como lo haría un cliente?",
          "¿Les llegan clientes desde Google?",
          "¿Les interesa mejorar cómo aparecen?",
          "¿Tienen la ficha de Google actualizada?",
        ],
      },
      {
        nombre: "mkt_fria_catalogo",
        angulo: "catálogo y respuestas ordenadas",
        ganchos: [
          "Tener un catálogo claro en WhatsApp ahorra muchas preguntas repetidas.",
          "Responder siempre lo mismo a mano cansa y quita tiempo.",
          "Ayudamos a negocios a ordenar su catálogo y sus respuestas frecuentes.",
          "Con respuestas rápidas y un catálogo, se vende más con menos esfuerzo.",
        ],
        preguntas: [
          "¿Les preguntan mucho lo mismo por WhatsApp?",
          "¿Tienen catálogo cargado?",
          "¿Les interesa que les muestre cómo armarlo?",
          "¿Venden productos o servicios?",
        ],
      },
      {
        nombre: "mkt_fria_pregunta_corta",
        angulo: "una sola pregunta directa",
        ganchos: [
          "Trabajamos con negocios en web, redes y WhatsApp.",
          "Ayudamos a negocios a conseguir más clientes.",
          "Hacemos marketing para negocios.",
          "Trabajamos en web, redes y atención automática.",
        ],
        preguntas: [
          "¿Quién maneja la parte digital del negocio?",
          "¿Les interesa conseguir más consultas?",
          "¿Tienen un minuto para que les cuente?",
          "¿Están buscando crecer en redes?",
        ],
      },
      {
        nombre: "mkt_fria_clientes_que_vuelven",
        angulo: "clientes que compran una vez y no vuelven",
        ganchos: [
          "Muchos clientes compran una vez y no vuelven porque nadie los vuelve a contactar.",
          "Volver a venderle a un cliente es mucho más fácil que conseguir uno nuevo.",
          "Ayudamos a negocios a hacer seguimiento de sus clientes de forma automática.",
          "Un mensaje en el momento justo puede traer de vuelta a un cliente.",
        ],
        preguntas: [
          "¿Hacen seguimiento a sus clientes?",
          "¿Tienen guardados los contactos de quienes ya compraron?",
          "¿Les interesa que les cuente cómo lo hacemos?",
          "¿Cuántos clientes suelen volver?",
        ],
      },
      {
        nombre: "mkt_fria_diagnostico",
        angulo: "un diagnóstico corto sin compromiso",
        ganchos: [
          "Hacemos un diagnóstico corto de cómo se ve el negocio en internet, sin compromiso.",
          "Revisamos la presencia digital del negocio y les contamos qué mejoraríamos.",
          "Con una mirada rápida a la web, las redes y Google se pueden ver mejoras concretas.",
          "Muchos negocios tienen dos o tres cosas simples para mejorar en internet.",
        ],
        preguntas: [
          "¿Les interesa que lo hagamos?",
          "¿Quieren que les pase lo que vemos?",
          "¿Tienen un rato esta semana para verlo?",
          "¿Les sirve una mirada de afuera?",
        ],
      },
    ],
  },
};

// ── Generador ─────────────────────────────────────────────────────────────

function azarConSemilla(semilla) {
  let h = 2166136261;
  for (const c of semilla) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  let a = h || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const uno = (az, lista) => lista[Math.floor(az() * lista.length)];

/** Mismo criterio que src/lib/wasender/ritmo-humano.ts. */
function normalizar(t) {
  return String(t ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\{\{\s*\w+\s*\}\}/g, " ").replace(/[^a-z0-9ñ\s]/g, " ").replace(/\s+/g, " ").trim();
}
function pares(t) {
  const p = normalizar(t).split(" ").filter(Boolean);
  const m = new Map();
  if (p.length === 1) m.set(p[0], 1);
  for (let i = 0; i < p.length - 1; i++) m.set(`${p[i]} ${p[i + 1]}`, (m.get(`${p[i]} ${p[i + 1]}`) ?? 0) + 1);
  return m;
}
function parecido(pa, pb) {
  const ta = [...pa.values()].reduce((x, y) => x + y, 0);
  const tb = [...pb.values()].reduce((x, y) => x + y, 0);
  if (!ta || !tb) return ta === tb ? 1 : 0;
  let c = 0;
  for (const [k, n] of pa) c += Math.min(n, pb.get(k) ?? 0);
  return (2 * c) / (ta + tb);
}

/**
 * Preguntas que se entienden solas, sin la frase de contexto: solo esas van
 * primero o en los mensajes cortos. «¿Te pasó algo así?» necesita contexto.
 */
const DEPENDE = /\b(así|esto|eso|lo|la|los|las|opciones|sirve|mirada|verlo|registro|alguno|parecido|ustedes mismos|cuente|muestre|expliquemos|tasemos|charlemos|revisemos|miremos|veamos|hagamos|vemos|cercano|todos|esos)\b/i;
const seEntiendeSola = (q) => !DEPENDE.test(q);

/** «¿Andás…?» → «¿andás…?» (después de «Pregunta rápida:»). */
function enMinuscula(q) {
  return q.startsWith("¿") ? `¿${q.charAt(1).toLowerCase()}${q.slice(2)}` : `${q.charAt(0).toLowerCase()}${q.slice(1)}`;
}

/** Arma un texto con una de varias estructuras. */
function armar(az, def, a) {
  const pl = !!def.plural;
  const saludos = def.saludos;
  const s = uno(az, saludos);
  const p = uno(az, pl ? presentacionesPlural : presentaciones);
  const g = uno(az, a.ganchos);
  const q = uno(az, a.preguntas);
  const solas = a.preguntas.filter(seEntiendeSola);
  const qSola = solas.length ? uno(az, solas) : null;
  // Sin «Te escribe…» seguido de «Te escribo cortito».
  const aps = (pl ? aperturasPlural : aperturas).filter((x) => !(/escrib/i.test(p) && /escrib/i.test(x)));
  const ap = az() < 0.18 ? ` ${uno(az, aps)}` : "";
  const ci = az() < 0.3 ? ` ${uno(az, pl ? cierresPlural : cierres)}` : "";
  const sp = s ? `${s} ` : "";
  const forma = Math.floor(az() * 7);
  if ((forma === 3 || forma === 4) && !qSola) return null;
  switch (forma) {
    case 0: return `${sp}${p}${ap} ${g} ${q}${ci}`;
    case 1: return `${sp}${p}\n\n${g} ${q}${ci}`;
    case 2: return `${sp}${g} ${p} ${q}${ci}`;
    case 3: return `${sp}${uno(az, pl ? previasPlural : previasPregunta)} ${enMinuscula(qSola)}\n\n${p} ${g}${ci}`;
    case 4: return `${sp}${p} ${qSola}${ci}`;
    case 5: return `${sp}${p}${ap}\n\n${g}\n\n${q}${ci}`;
    default: return `${s || uno(az, saludos.filter(Boolean))} ${g}\n\n${p} ${q}${ci}`;
  }
}

/** Sin nombre, el texto tiene que quedar bien (mismo reemplazo que el panel). */
function sinNombreQuedaBien(t) {
  const lleno = t.replace(/\{\{\s*nombre\s*\}\}/g, "").replace(/[ \t]+([,.;:!?])/g, "$1").replace(/[ \t]{2,}/g, " ");
  return !/[,;:]\s*[.,?!]|¡!|^\s*[,.]/m.test(lleno);
}

export function generar(existentes = {}, { porPlantilla = 60, umbral = 0.6, intentos = 8000 } = {}) {
  const salida = {};
  for (const [perfil, def] of Object.entries(PERFILES)) {
    const yaHay = (existentes[perfil] ?? []).map(pares);
    salida[perfil] = def.angulos.map((a) => {
      const az = azarConSemilla(`${perfil}:${a.nombre}`);
      const elegidos = [];
      const paresElegidos = [];
      for (let i = 0; i < intentos && elegidos.length < porPlantilla; i++) {
        const crudo = armar(az, def, a);
        if (!crudo) continue;
        const t = crudo.replace(/ {2,}/g, " ").trim();
        if (!sinNombreQuedaBien(t)) continue;
        if (perfil === "marketing" && t.includes("{{nombre}}")) continue;
        const pt = pares(t);
        if (paresElegidos.some((pe) => parecido(pt, pe) >= umbral)) continue;
        if (yaHay.some((pe) => parecido(pt, pe) >= 0.8)) continue;
        elegidos.push(t);
        paresElegidos.push(pt);
      }
      return { nombre: a.nombre, angulo: a.angulo, cuerpo: elegidos[0], variantes: elegidos.slice(1) };
    });
  }
  return salida;
}

export { PERFILES };
