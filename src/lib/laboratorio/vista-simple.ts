/**
 * Laboratorio simple (22/11). Queja del dueño: «demasiado técnico y no tiene ninguna función
 * en la que se pueda hacer algo». Funciones puras de la pantalla nueva: cifras en palabras,
 * comparación de la versión nueva con la anterior, plantillas de rol por rubro y armado del
 * rol a partir de un formulario corto. Sin acceso a datos.
 */
import type { SlugPerfil } from "@/lib/marca";

export interface TasasBot {
  conversaciones: number;
  /** Porcentajes enteros (0–100), como los entrega /api/perfiles/conocimiento. */
  tasa_captacion: number;
  tasa_escalado: number;
  tasa_sigue: number;
}

export interface CifrasSimples {
  atendidas: number;
  captados: number;
  derivados: number;
  tasaCaptacion: number;
  tasaDerivados: number;
}

const entre = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
const num = (n: unknown) => (Number.isFinite(Number(n)) ? Number(n) : 0);

/** Conversaciones atendidas, captados y derivados a una persona, más sus tasas. */
export function cifrasDelBot(t: Partial<TasasBot> | null | undefined): CifrasSimples {
  const atendidas = Math.max(0, Math.round(num(t?.conversaciones)));
  const tasaCaptacion = entre(Math.round(num(t?.tasa_captacion)), 0, 100);
  const tasaDerivados = entre(Math.round(num(t?.tasa_escalado)), 0, 100);
  return {
    atendidas,
    captados: Math.round((atendidas * tasaCaptacion) / 100),
    derivados: Math.round((atendidas * tasaDerivados) / 100),
    tasaCaptacion,
    tasaDerivados,
  };
}

/** Tope redondo para el anillo de conversaciones (20, 50, 100, 200, 500…), para que el arco se lea. */
export function metaDeAtendidas(n: number): number {
  const v = Math.max(0, Math.round(num(n)));
  for (const tope of [20, 50, 100, 200, 500, 1000, 2000, 5000]) if (v <= tope) return tope;
  return Math.ceil(v / 1000) * 1000;
}

/** «3 de cada 10»: la tasa en lenguaje de todos los días. */
export function deCada10(tasaPorCiento: number): string {
  const x = Math.round(entre(num(tasaPorCiento), 0, 100) / 10 * 10) / 10;
  const texto = Number.isInteger(x) ? String(x) : String(x).replace(".", ",");
  return `${texto} de cada 10`;
}

/** Con menos charlas que esto, comparar sería adivinar. */
export const MINIMO_PARA_COMPARAR = 20;

export interface ComparacionSimple {
  alcanza: boolean;
  frase: string;
  veredicto: "mejor" | "peor" | "igual" | "pocos_datos";
}

/** «La versión nueva capta X de cada 10; la anterior, Y.» Sin v1/v2 ni jerga. */
export function compararEnPalabras(nueva: Partial<TasasBot> | null | undefined, anterior: Partial<TasasBot> | null | undefined): ComparacionSimple {
  const n = cifrasDelBot(nueva);
  const a = cifrasDelBot(anterior);
  if (n.atendidas < MINIMO_PARA_COMPARAR || a.atendidas < MINIMO_PARA_COMPARAR) {
    return {
      alcanza: false,
      veredicto: "pocos_datos",
      frase: "Todavía hay pocas charlas con alguna de las dos versiones para comparar. Con unas 20 de cada una ya se puede ver.",
    };
  }
  const base = `La versión nueva capta ${deCada10(n.tasaCaptacion)}; la anterior, ${deCada10(a.tasaCaptacion)}.`;
  const dif = n.tasaCaptacion - a.tasaCaptacion;
  if (Math.abs(dif) < 3) return { alcanza: true, veredicto: "igual", frase: `${base} Rinden parecido.` };
  return dif > 0
    ? { alcanza: true, veredicto: "mejor", frase: `${base} La nueva viene mejor.` }
    : { alcanza: true, veredicto: "peor", frase: `${base} La anterior viene mejor: conviene revisar la nueva.` };
}

// ---------------------------------------------------------------------------
// Plantillas de rol por rubro
// ---------------------------------------------------------------------------

export interface PlantillaRol {
  nombre: string;
  paraQue: string;
  tono: string;
  noPrometer: string;
}

export const PLANTILLAS_ROL: Record<SlugPerfil, readonly PlantillaRol[]> = {
  juridico: [
    {
      nombre: "Recepción de consultas civiles",
      paraQue: "Recibir a quien consulta por un tema civil (daños, contratos, sucesiones, familia), entender el caso en pocas preguntas y dejarlo listo para que lo vea el estudio.",
      tono: "Cercano, claro y sin palabras difíciles",
      noPrometer: "Resultados, plazos de un juicio, montos de indemnización ni honorarios. No dar un dictamen: eso lo hace el abogado.",
    },
    {
      nombre: "Penal urgente",
      paraQue: "Atender con rapidez a quien tiene un problema penal en curso (detención, citación, denuncia), juntar lo mínimo y derivar de inmediato a una persona del estudio.",
      tono: "Sereno, breve y que dé tranquilidad",
      noPrometer: "Que alguien salga en libertad, el resultado de la causa ni qué va a decidir un juez. No opinar sobre si la persona es culpable.",
    },
    {
      nombre: "Seguimiento de documentación",
      paraQue: "Recordarle con amabilidad a quien ya consultó qué documentos faltan y cómo mandarlos, para que el estudio pueda avanzar.",
      tono: "Amable y paciente, sin apurar",
      noPrometer: "Que con esos papeles el caso queda resuelto, ni fechas de trámite. No pedir datos que no hagan falta.",
    },
  ],
  coberturas_medicas: [
    {
      nombre: "Cotizador de planes",
      paraQue: "Preguntar edad, zona y necesidades de quien consulta para orientarlo hacia un plan y pasarlo con un asesor que le arme la cotización.",
      tono: "Claro, cálido y consultivo",
      noPrometer: "Precios finales, descuentos, cobertura de una prestación puntual ni tiempos de carencia sin confirmación del asesor.",
    },
    {
      nombre: "Afiliaciones",
      paraQue: "Acompañar a quien ya eligió un plan: explicar los pasos de la afiliación, qué documentación hace falta y quién lo va a contactar.",
      tono: "Ordenado, paciente y tranquilizador",
      noPrometer: "Fechas exactas de alta, aprobación de la afiliación ni coberturas que no estén en el plan elegido.",
    },
    {
      nombre: "Consultas de cobertura",
      paraQue: "Responder dudas generales sobre qué incluye una cobertura y derivar a un asesor las preguntas puntuales.",
      tono: "Simple, sin tecnicismos",
      noPrometer: "Que una prestación o un médico está cubierto sin que lo confirme un asesor.",
    },
  ],
  agencia_0km: [
    {
      nombre: "Turno de prueba de manejo",
      paraQue: "Invitar a quien consulta por un 0 km a probar el auto, proponerle día y horario y dejar el turno para que lo confirme el concesionario.",
      tono: "Entusiasta pero sin presionar",
      noPrometer: "Stock, fecha de entrega, precio final ni descuentos. Todo eso lo confirma el vendedor.",
    },
    {
      nombre: "Plan de ahorro",
      paraQue: "Explicar en palabras simples cómo funciona un plan de ahorro, contestar lo básico y derivar a un asesor para el detalle y las cuotas.",
      tono: "Didáctico, honesto y paciente",
      noPrometer: "Fechas de adjudicación, valor de la cuota futura ni que le toque el auto en un plazo.",
    },
    {
      nombre: "Seguimiento de cotización",
      paraQue: "Retomar con quien pidió precio para ver si sigue interesado y proponerle hablar con un vendedor.",
      tono: "Cordial y breve",
      noPrometer: "Precios vigentes, bonificaciones ni disponibilidad sin confirmación del vendedor.",
    },
  ],
  marketing: [
    {
      nombre: "Prospección de negocios",
      paraQue: "Presentarse a dueños de negocios, entender qué necesitan para conseguir clientes y proponerles una charla corta con alguien del equipo.",
      tono: "Profesional, directo y respetuoso",
      noPrometer: "Cantidad de clientes, ventas ni resultados garantizados de una campaña. Tampoco precios cerrados.",
    },
    {
      nombre: "Agenda de reuniones",
      paraQue: "Coordinar día y horario para una reunión con quien mostró interés, y dejarla confirmada para el equipo.",
      tono: "Ágil, amable y claro",
      noPrometer: "Qué se va a incluir en el servicio ni presupuestos antes de la reunión.",
    },
    {
      nombre: "Seguimiento de propuesta",
      paraQue: "Retomar con quien recibió una propuesta, resolver dudas simples y ofrecerle hablar con una persona del equipo.",
      tono: "Cercano y sin insistir de más",
      noPrometer: "Descuentos, plazos de entrega ni resultados garantizados.",
    },
  ],
};

export interface FormularioRol {
  nombre: string;
  paraQue: string;
  tono: string;
  noPrometer: string;
}

export const FORMULARIO_VACIO: FormularioRol = { nombre: "", paraQue: "", tono: "", noPrometer: "" };

export function formularioDePlantilla(p: PlantillaRol): FormularioRol {
  return { nombre: p.nombre, paraQue: p.paraQue, tono: p.tono, noPrometer: p.noPrometer };
}

const limpiar = (s: unknown) => String(s ?? "").replace(/\s+/g, " ").trim();

/** Valida el formulario corto con el mismo criterio que la API (nombre ≥ 2, instrucciones ≥ 10, sin teléfonos ni correos). */
export function validarFormularioRol(f: FormularioRol): { ok: true } | { ok: false; error: string } {
  if (limpiar(f.nombre).length < 2) return { ok: false, error: "Ponele un nombre al rol, por ejemplo «Turno de prueba de manejo»." };
  if (limpiar(f.paraQue).length < 10) return { ok: false, error: "Contá en una frase para qué sirve el rol (al menos 10 letras)." };
  const todo = `${f.nombre} ${f.paraQue} ${f.tono} ${f.noPrometer}`;
  if (/\b\d{7,}\b/.test(todo) || /[\w.+-]+@[\w-]+\.[\w.]+/.test(todo)) return { ok: false, error: "No pongas teléfonos ni correos de personas en el rol." };
  return { ok: true };
}

/** Cuerpo para POST /api/agentes/roles { accion: "guardar" }. */
export function cuerpoCrearRol(perfil: SlugPerfil, f: FormularioRol) {
  const noPrometer = limpiar(f.noPrometer);
  const paraQue = limpiar(f.paraQue);
  return {
    perfil,
    accion: "guardar" as const,
    nombre: limpiar(f.nombre).slice(0, 80),
    objetivo: paraQue.slice(0, 500),
    tono: limpiar(f.tono).slice(0, 300),
    instrucciones: [paraQue, noPrometer ? `No debe prometer: ${noPrometer}` : "", "Si la persona pide algo que no podés confirmar, decile que lo va a ver una persona del equipo."]
      .filter(Boolean)
      .join("\n")
      .slice(0, 6000),
  };
}

/** Cuerpo para POST /api/agentes/pedidos. Los roles no son agentes de la biblioteca: el pedido va al principal con el rol nombrado. */
export function cuerpoPedirMejora(rubroNombre: string, rolNombre: string, pedido: string) {
  return { clave: "principal", pedido: `[${rubroNombre} · rol «${rolNombre}»] ${limpiar(pedido)}`.slice(0, 2000) };
}

export function cuerpoArchivarRol(perfil: SlugPerfil, id: string) {
  return { perfil, accion: "archivar" as const, id };
}

export function cuerpoRolACampana(perfil: SlugPerfil, campaignId: string, rolId: string | null) {
  return { perfil, accion: "asignar_campana" as const, campaign_id: campaignId, rol_id: rolId ?? "" };
}

/** ¿La ficha cambió de verdad? (ignora espacios al final de cada línea y líneas vacías sobrantes). */
export function fichaCambio(actual: string, nueva: string): boolean {
  const norm = (s: string) => s.replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
  return norm(actual ?? "") !== norm(nueva ?? "");
}

export const LIMITE_FICHA = 6000;
