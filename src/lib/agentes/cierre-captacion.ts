/**
 * Cierre después de captar (15/11). Al captar, el chat pasa a una persona y la
 * IA queda en pausa: la respuesta de ese turno es la última del bot. Si en vez
 * de despedirse hacía otra pregunta, o no decía nada, la persona contestaba y
 * quedaba en «visto». Acá están, por rubro, la instrucción para el modelo, el
 * control del texto y un cierre fijo de reserva. Funciones puras.
 */
import type { Area } from "@/lib/supabase/database.types";

interface Rubro {
  /** quién se comunica */
  quien: string;
  /** para qué (sin día ni hora) */
  paraQue: string;
  /** cierre de reserva; {nombre} se reemplaza por «, Nombre» o por nada */
  reserva: string;
  /** si conviene saludar por el nombre (en Marketing suele ser el de un negocio) */
  usarNombre: boolean;
}

const JURIDICO: Rubro = {
  quien: "un abogado del estudio",
  paraQue: "para ver su caso",
  reserva:
    "¡Muchas gracias{nombre}! Ya quedó registrada tu consulta. Un abogado del estudio se va a comunicar con vos para ver tu caso. Si querés sumar algo mientras tanto, dejalo por acá y lo ve el profesional.",
  usarNombre: true,
};

const RUBROS: Record<Area, Rubro> = {
  civil: JURIDICO,
  penal: JURIDICO,
  coberturas_medicas: {
    quien: "un asesor",
    paraQue: "para mostrarle las opciones de cobertura que mejor se ajustan a lo que busca",
    reserva:
      "¡Muchas gracias{nombre}! Ya le pasé tus datos a un asesor, que se va a comunicar con vos para mostrarte las opciones de cobertura que mejor se ajustan a lo que buscás. Si querés sumar algo mientras tanto, dejalo por acá.",
    usarNombre: true,
  },
  agencia_0km: {
    quien: "un asesor comercial",
    paraQue: "para pasarle la propuesta por escrito",
    reserva:
      "¡Muchas gracias{nombre}! Ya le pasé tu consulta a un asesor comercial, que se va a comunicar con vos para pasarte la propuesta por escrito. Si querés sumar algo mientras tanto, dejalo por acá.",
    usarNombre: true,
  },
  marketing: {
    quien: "una persona del equipo",
    paraQue: "para avanzar con la propuesta",
    reserva:
      "¡Muchas gracias{nombre}! Ya le pasé los detalles al equipo, que se va a comunicar con vos para avanzar con la propuesta. Cualquier dato que quieras sumar, dejalo por acá.",
    usarNombre: false,
  },
};

/** Instrucción que recibe el modelo en la respuesta de la herramienta de captación. */
export function instruccionCierre(area: Area): string {
  const r = RUBROS[area] ?? RUBROS.civil;
  return [
    "Quedó captado y el chat pasa a una persona: esta es tu ÚLTIMA respuesta y es obligatoria (nunca la dejes en blanco).",
    `Escribí un cierre cálido de dos o tres oraciones: agradecé, confirmá que ${r.quien} se va a comunicar con la persona ${r.paraQue} y despedite.`,
    "Sin preguntas ni pedidos de más datos. No prometas día, hora, resultados ni precios.",
  ].join(" ");
}

/** Primer nombre presentable o null (evita nombres de negocio, números y textos raros). */
export function primerNombre(nombreCompleto: string | null | undefined): string | null {
  const w = String(nombreCompleto ?? "").trim().split(/\s+/)[0] ?? "";
  if (!/^\p{L}{2,20}$/u.test(w)) return null;
  return w.charAt(0).toLocaleUpperCase("es-AR") + w.slice(1).toLocaleLowerCase("es-AR");
}

/** Cierre fijo de reserva para el rubro. */
export function cierreDeReserva(area: Area, nombreCompleto?: string | null): string {
  const r = RUBROS[area] ?? RUBROS.civil;
  const n = r.usarNombre ? primerNombre(nombreCompleto) : null;
  return r.reserva.replace("{nombre}", n ? `, ${n}` : "");
}

/** El texto sirve como cierre: no está vacío y no hace preguntas (la persona quedaría en visto). */
export function esCierreValido(texto: string | null | undefined): boolean {
  const t = String(texto ?? "").trim();
  return t.length >= 10 && !/[?¿]/.test(t);
}

/** Pedido de corrección cuando el modelo respondió algo que no cierra. */
export function pedidoDeCierre(area: Area): string {
  return `Tu respuesta no sirve como cierre: hace una pregunta o está vacía, y el chat ya pasó a una persona, así que nadie del bot va a leer la respuesta. ${instruccionCierre(area)} Respondé solo con el texto del cierre.`;
}
