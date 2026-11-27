/**
 * Lógica pura de la pantalla «Hoy» renovada (22/11): saludo según la hora argentina, las dos frases de
 * Jarvis, las filas de «Para decidir» y la franja de estado. Sin base, sin navegador y sin reloj propio:
 * quien llama pasa la hora y los conteos, así el resultado es idéntico en servidor y cliente y se prueba
 * sin red. Nunca lleva el nombre de una persona (el saludo es «Buen día», sin nombre inventado).
 */

/** Hora (0 a 23) en Buenos Aires para un instante dado. */
export function horaEnBuenosAires(ahora: Date): number {
  const h = Number(new Intl.DateTimeFormat("es-AR", { hour: "numeric", hourCycle: "h23", timeZone: "America/Argentina/Buenos_Aires" }).format(ahora));
  return Number.isFinite(h) ? h % 24 : 12;
}

/** Saludo según la hora de Buenos Aires, con las mismas reglas que el parte de Jarvis: de 5 a 11 «Buen día», de 12 a 19 «Buenas tardes», el resto «Buenas noches». */
export function saludoPorHora(hora: number): string {
  if (hora >= 5 && hora < 12) return "Buen día";
  if (hora >= 12 && hora < 20) return "Buenas tardes";
  return "Buenas noches";
}

const plural = (n: number, uno: string, varios: string) => `${n.toLocaleString("es-AR")} ${n === 1 ? uno : varios}`;

export interface ConteosHoy {
  /** Personas a las que hay que responder (el bot no les contesta). */
  esperan: number;
  /** Captados que faltan derivar. */
  porDerivar: number;
  /** De esos captados, cuántos esperan el llamado hace más de 24 horas. */
  esperanDeMas: number;
  /** Posibles captaciones para revisar. */
  posibles: number;
}

/** Las dos frases cortas de Jarvis, sin jerga. */
export function frasesDeHoy(c: ConteosHoy): [string, string?] {
  const a: string[] = [];
  if (c.esperan > 0) a.push(c.esperan === 1 ? "Una persona te espera para que le respondas." : `${c.esperan.toLocaleString("es-AR")} personas te esperan para que les respondas.`);
  if (c.porDerivar > 0) a.push(c.porDerivar === 1 ? "Hay un captado para pasar a quien lo atiende." : `Hay ${c.porDerivar.toLocaleString("es-AR")} captados para pasar a quien los atiende.`);
  if (a.length === 0) return ["Todo al día: no hay nadie esperando una respuesta tuya.", "Cuando entre algo, lo vas a ver acá."];
  if (a.length === 1 && c.esperanDeMas > 0) a.push(c.esperanDeMas === 1 ? "Uno espera hace más de 24 horas." : `${c.esperanDeMas.toLocaleString("es-AR")} esperan hace más de 24 horas.`);
  return [a[0], a[1]];
}

export interface FilaDecidir {
  clave: string;
  titulo: string;
  detalle: string;
  boton: string;
  href: string;
  /** Para ordenar: lo urgente primero. */
  urgencia: number;
}

export interface EntradaDecidir extends ConteosHoy {
  /** Enlace a la lista de a quién responder (en «Hoy», «Ver más» abierto). */
  hrefResponder: string;
  hrefDerivar: string;
  hrefPosibles: string;
  campana?: { texto: string; href: string; tono: "rojo" | "amarillo" | "verde" | "gris" } | null;
}

/** Filas de «Para decidir»: una por tipo de pendiente, con verbo y botón; no lleva nombres ni teléfonos. */
export function filasParaDecidir(e: EntradaDecidir): FilaDecidir[] {
  const f: FilaDecidir[] = [];
  if (e.esperan > 0)
    f.push({ clave: "responder", titulo: `Responder a ${plural(e.esperan, "persona", "personas")}`, detalle: "Escribieron y el bot no les contesta", boton: "Responder", href: e.hrefResponder, urgencia: 1 });
  if (e.porDerivar > 0)
    f.push({
      clave: "derivar",
      titulo: `Derivar a ${plural(e.porDerivar, "captado", "captados")}`,
      detalle: e.esperanDeMas > 0 ? `${e.esperanDeMas === 1 ? "Uno espera" : `${e.esperanDeMas.toLocaleString("es-AR")} esperan`} hace más de 24 horas` : "Ya aceptaron el siguiente paso",
      boton: "Derivar",
      href: e.hrefDerivar,
      urgencia: e.esperanDeMas > 0 ? 1 : 2,
    });
  if (e.campana && (e.campana.tono === "rojo" || e.campana.tono === "amarillo")) f.push({ clave: "campana", titulo: "Revisar la campaña", detalle: e.campana.texto, boton: "Ver", href: e.campana.href, urgencia: e.campana.tono === "rojo" ? 2 : 3 });
  if (e.posibles > 0) f.push({ clave: "posibles", titulo: `Revisar ${plural(e.posibles, "posible captación", "posibles captaciones")}`, detalle: "Mostraron interés y falta confirmarlo", boton: "Revisar", href: e.hrefPosibles, urgencia: 3 });
  return f.sort((a, b) => a.urgencia - b.urgencia);
}

export type EstadoFranja = "ok" | "aviso" | "mal";

export interface EntradaFranja {
  /** Problemas que frenan la operación (rojos de Salud). */
  rojos: number;
  /** Puntos para revisar (amarillos de Salud). */
  amarillos: number;
  /** Texto del primer problema, ya en palabras simples. */
  primero?: string | null;
  hrefSalud: string;
  /** Líneas de WhatsApp o paros que la pantalla vio caídos (rojo) o dudosos (amarillo), con su enlace. */
  lineas: { tono: "rojo" | "amarillo" | "verde" | "gris"; texto: string; href?: string }[];
  /** Cifras que no se pudieron leer. */
  cifrasSinLeer?: number;
}

export interface Franja {
  estado: EstadoFranja;
  titulo: string;
  detalle: string | null;
  accion: string | null;
  href: string | null;
}

/** Una sola franja de estado: «Todo en orden» o lo más grave, con su enlace. Lo grave nunca queda detrás de «Ver más». */
export function franjaDeEstado(e: EntradaFranja): Franja {
  const lineasRojas = e.lineas.filter((l) => l.tono === "rojo");
  const lineasAmarillas = e.lineas.filter((l) => l.tono === "amarillo");
  if (e.rojos > 0)
    return { estado: "mal", titulo: e.rojos === 1 ? "Un problema frena la operación" : `${e.rojos} problemas frenan la operación`, detalle: e.primero ?? null, accion: "Ver qué hacer", href: e.hrefSalud };
  if (lineasRojas.length > 0)
    return { estado: "mal", titulo: lineasRojas.length === 1 ? "Una línea con problema" : `${lineasRojas.length} líneas con problema`, detalle: lineasRojas[0].texto, accion: "Ver", href: lineasRojas[0].href ?? e.hrefSalud };
  const puntos = e.amarillos + lineasAmarillas.length;
  if (puntos > 0) return { estado: "aviso", titulo: puntos === 1 ? "Un punto para revisar" : `${puntos} puntos para revisar`, detalle: e.primero ?? lineasAmarillas[0]?.texto ?? null, accion: "Ver", href: e.hrefSalud };
  if ((e.cifrasSinLeer ?? 0) > 0)
    return { estado: "aviso", titulo: "Faltan algunas cifras", detalle: "No se pudieron leer; figuran como «—» y no son cero.", accion: null, href: null };
  return { estado: "ok", titulo: "Todo en orden", detalle: "La línea y las campañas andan bien.", accion: null, href: null };
}

/** Fracción para el anillo grande: captados que esperan sobre (esperan + ya derivados esta semana). Nunca divide por cero. */
export function metaDelAnillo(porDerivar: number, derivadosSemana: number | null): number {
  return Math.max(1, porDerivar + Math.max(0, derivadosSemana ?? 0));
}
