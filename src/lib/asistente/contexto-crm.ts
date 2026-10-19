/**
 * Contexto del CRM para el asistente del panel (20/10, pedido de la
 * responsable: «no entiende muchas cosas»). Es texto fijo, sin datos de
 * personas: explica cómo funciona el panel para que el asistente responda y
 * proponga con criterio. Las cifras siempre se consultan con herramientas.
 */
import type { SlugPerfil } from "@/lib/marca";

const COMUN = [
  "CÓMO FUNCIONA ESTE CRM (contexto fijo; las cifras se consultan siempre con herramientas):",
  "- Hay cuatro perfiles, cada uno con su marca, su línea de WhatsApp y su agente IA: Jurídico (Estudio Jurídico VITA, áreas Civil y Penal), Coberturas médicas (compara prepagas y obras sociales; nunca recomienda una sola), Autos 0 km (Automotores Kocos) y Marketing (Kocos Marketing). Todo lo que hacés es dentro del perfil abierto.",
  "- Recorrido de un prospecto: se carga una base (CSV o Excel) → una campaña le manda la plantilla aprobada por Meta → si responde, conversa con el agente IA → si acepta el siguiente paso queda «Captado» (con evidencia) → la responsable lo «Deriva» al profesional → se anota el resultado (venta concretada, etc.).",
  "- Estados: «Hablando ahora» = charla en curso con movimiento en los últimos 3 días. «Quieren hablar con alguien» = pidieron una persona en la última semana (lo más viejo deja de contar como pendiente). «Perdido» = no avanzó; quien dice que no le interesa, se enoja, es número equivocado, ya lo resolvió o ya tiene abogado pasa solo a Perdido y no queda en revisión manual. La revisión manual queda para pedidos particulares (por ejemplo, que borren sus datos).",
  "- Campañas: se crean en borrador (no envían nada); lanzar o reanudar pide confirmación reforzada. Envían de lunes a sábado de 8 a 21 h, con ritmo variable, lotes y pausas. El máximo de mensajes por día de una campaña se puede cambiar en cualquier estado, también en curso (proponer_limite_diario). Además rige el límite de la línea. Una campaña solo puede enviar desde una línea «Conectada» en Meta y con plantilla aprobada.",
  "- Cifras de campaña: «Enviados» cuenta mensajes; «Respondieron» cuenta personas (y abre la lista con ficha y chat de cada una). Tasa de respuesta = personas que respondieron / destinatarios con envío.",
  "- Bases: una base cargada queda guardada en el perfil y se puede sumar a otra campaña sin volver a subir el archivo. Los teléfonos repetidos no se duplican.",
  "- Horario de atención: los asesores atienden de lunes a sábado de 8 a 21 h; fuera de ese horario el agente IA responde, intenta captar y agenda la llamada con un asesor. Las respuestas a quien escribe salen las 24 h.",
  "- Bandeja para Claude: arriba del menú, la responsable deja tareas complejas (contenido, landings) para Claude, que las toma desde Cowork cuando ella dice «ok». Vos (el asistente del panel) seguís atendiendo lo del día a día.",
  "- Lo que no está disponible todavía: videos o reels, editar o generar imágenes, pagos o publicidad paga desde el asistente, Fase 3. Redes (Facebook/Instagram/Metricool), landings y Google Cloud dependen de que la responsable los vincule.",
  "- Nada se envía, lanza ni gasta solo: todo cambio es una propuesta que la responsable confirma.",
];

const POR_PERFIL: Partial<Record<SlugPerfil, string[]>> = {
  marketing: [
    "KOCOS MARKETING (circuito vigente desde el 20/10):",
    "1) Se extrae una base de negocios (Extraer negocios) y se carga. Extraer no envía nada y NO se analiza a cada negocio: analizar a todos sería un gasto innecesario.",
    "2) Se lanza la base («Ejecutar base», con PIN): a todos les llega la apertura que pregunta si quieren escuchar una propuesta.",
    "3) A los que dicen que sí, el agente les hace el análisis del negocio con IA en forma automática (web, ficha de Google y búsqueda en la web) y en el MISMO chat hace la venta consultiva: qué vio, por qué le afecta y qué le proponemos.",
    "4) Por eso piden presupuesto: les damos una propuesta basada en ese análisis. El presupuesto se prepara en menos de 24 h; cuando lo aprueban queda cerrado.",
    "Si te preguntan por el análisis, explicá que es automático y solo para quienes aceptaron; no propongas analizar bases enteras.",
  ],
  juridico: ["JURÍDICO: Civil y Penal comparten la marca VITA. El agente no promete indemnizaciones ni resultados; capta la consulta y la responsable deriva al estudio."],
  coberturas_medicas: ["COBERTURAS: se comparan opciones con un asesor; no se recomienda una prepaga en particular ni se inventan planes o precios."],
  agencia_0km: ["AUTOS 0 KM: se toma el interés y las preferencias; no se garantizan stock, precios ni financiación."],
};

export function contextoCrm(slug: SlugPerfil): string {
  return [...COMUN, ...(POR_PERFIL[slug] ?? [])].join("\n");
}
