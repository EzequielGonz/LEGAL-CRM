/**
 * Laboratorio · ayudas para probar y revisar roles (22/11). Funciones puras, sin acceso a datos:
 * mensajes de ejemplo por rubro, checklist de calidad de un rol y pedido precargado para Jarvis.
 * Todo es lectura y texto: no envía nada a nadie ni cambia ningún rol.
 */
import type { SlugPerfil } from "@/lib/marca";

/** Mensajes de ejemplo para probar el bot en un toque. Sin nombres, teléfonos ni documentos. */
export const EJEMPLOS_POR_RUBRO: Record<SlugPerfil, readonly string[]> = {
  juridico: [
    "Hola, me despidieron sin causa, ¿qué puedo hacer?",
    "Tuve un choque y el seguro no me responde. ¿Me pueden ayudar?",
    "Quiero iniciar un divorcio, ¿cómo es el trámite?",
    "¿Cuánto me sale la primera consulta?",
  ],
  coberturas_medicas: [
    "Hola, quiero cotizar una prepaga para mi familia.",
    "Tengo monotributo, ¿qué cobertura me conviene?",
    "¿Puedo cambiarme de obra social sin perder los aportes?",
    "¿Tiene carencias el plan más barato?",
  ],
  agencia_0km: [
    "Hola, vi un auto en su publicación, ¿sigue disponible?",
    "¿Qué planes de financiación tienen para un 0 km?",
    "Quiero entregar mi usado como parte de pago, ¿lo toman?",
    "¿Cuánto tarda en llegar la entrega?",
  ],
  marketing: [
    "Hola, tengo un negocio y quiero más clientes por Instagram.",
    "¿Cuánto cuesta que me manejen las redes?",
    "¿Me pueden garantizar que voy a vender más?",
    "Quiero una landing para mi emprendimiento, ¿cómo trabajan?",
  ],
};

export interface RolParaRevisar {
  nombre: string;
  objetivo?: string | null;
  tono?: string | null;
  instrucciones?: string | null;
}

export type ClaveCheck = "saludo" | "datos" | "persona" | "promesas";

export interface ItemCalidad {
  clave: ClaveCheck;
  titulo: string;
  ok: boolean;
  /** Qué hace falta para tildarlo (vacío si ya está). */
  falta: string;
}

export interface RevisionRol {
  items: ItemCalidad[];
  cumplidos: number;
  total: number;
  faltan: ItemCalidad[];
}

const juntar = (r: RolParaRevisar) => [r.nombre, r.objetivo, r.tono, r.instrucciones].filter(Boolean).join("\n").toLowerCase();

const RE_SALUDO = /\b(salud[aoá]|hola|bienvenid|buen(os|as) (d[ií]as|tardes|noches)|present[aá](te|rte)|presentarse)/;
const RE_PEDIR = /\b(ped[ií]|pedir|pedile|pregunt[aá]|preguntar|averigu[aá]|consult[aá]|recab|tom[aá]|anot[aá])/;
const RE_DATO = /\b(datos?|nombre|zona|localidad|ciudad|motivo|contacto|situaci[oó]n|edad|necesidad)/;
const RE_PERSONA = /\b(deriv|persona del equipo|una persona|lo (va a )?ve(r|rá) (una|el)|asesor|abogad[ao]s?|humano|pas[aá](lo|rlo|le)|te (va a )?contact)/;
const RE_NO_PROMETER = /\b(no (debe |deb[eé]s |hay que |podés |pod[eé]s )?(prometer|asegurar|garantizar)|no prometas|sin (prometer|garantizar)|nunca (prometas|asegures|garantices))/;
const RE_PROMETE = /\b(garantizamos|te garantizo|te aseguro|aseguramos|100 ?% (seguro|garantizado)|ganamos seguro|sin riesgo)/;

/** Checklist de calidad de un rol: saludo, datos mínimos, derivación a persona y no prometer resultados. */
export function revisarRol(rol: RolParaRevisar): RevisionRol {
  const t = juntar(rol);
  const promete = RE_PROMETE.test(t);
  const items: ItemCalidad[] = [
    { clave: "saludo", titulo: "Tiene saludo", ok: RE_SALUDO.test(t), falta: "Sumá cómo saluda y se presenta el bot al empezar." },
    { clave: "datos", titulo: "Pide los datos mínimos", ok: RE_PEDIR.test(t) && RE_DATO.test(t), falta: "Indicá qué datos pide (por ejemplo nombre, zona y motivo de la consulta)." },
    { clave: "persona", titulo: "Deriva a una persona", ok: RE_PERSONA.test(t), falta: "Aclará cuándo pasa la charla a una persona del equipo." },
    {
      clave: "promesas",
      titulo: "Evita prometer resultados",
      ok: RE_NO_PROMETER.test(t) && !promete,
      falta: promete ? "El texto promete o garantiza algo: sacalo y dejalo en manos de una persona." : "Escribí qué no debe prometer (precios, plazos, resultados).",
    },
  ];
  const faltan = items.filter((i) => !i.ok);
  return { items, cumplidos: items.length - faltan.length, total: items.length, faltan };
}

/** Pedido precargado para Jarvis: revisar el rol y proponer mejoras, siempre con confirmación. Máx. 1000 letras (lo que lee /asistente). */
export function pedidoMejorarRol(rubroNombre: string, rol: RolParaRevisar): string {
  const rev = revisarRol(rol);
  const faltas = rev.faltan.length ? ` Hoy le falta: ${rev.faltan.map((f) => f.titulo.toLowerCase()).join(", ")}.` : " La revisión rápida no marca faltantes.";
  const texto =
    `Revisá el rol «${rol.nombre.trim()}» del bot de ${rubroNombre} en el laboratorio y proponeme mejoras concretas ` +
    `(saludo, datos mínimos, derivación a una persona y qué no prometer).${faltas} ` +
    `No cambies nada ni envíes mensajes a prospectos: mostrame la propuesta y esperá mi confirmación.`;
  return texto.slice(0, 1000);
}

export function enlaceMejorarRol(rubroNombre: string, rol: RolParaRevisar): string {
  return `/asistente?pedido=${encodeURIComponent(pedidoMejorarRol(rubroNombre, rol))}`;
}
