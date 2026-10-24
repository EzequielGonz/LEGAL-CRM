/** Reglas puras de los roles por base (21/10). */
import type { Rol } from "./roles";

export interface PedidoRol {
  nombre: unknown;
  objetivo?: unknown;
  tono?: unknown;
  instrucciones: unknown;
}

const limpiar = (v: unknown, max: number) => String(v ?? "").replace(/\s+\n/g, "\n").trim().slice(0, max);

/** Valida y normaliza un rol. Pura. */
export function validarRol(p: PedidoRol): { ok: true; rol: { nombre: string; objetivo: string; tono: string; instrucciones: string } } | { ok: false; error: string } {
  const nombre = limpiar(p.nombre, 80);
  const instrucciones = limpiar(p.instrucciones, 6000);
  if (nombre.length < 2) return { ok: false, error: "Poné un nombre para el rol (por ejemplo «Cierre agresivo para inmobiliarias»)." };
  if (instrucciones.length < 10) return { ok: false, error: "Escribí qué tiene que hacer el agente con esta base (al menos una frase)." };
  if (/\b\d{7,}\b/.test(instrucciones) || /[\w.+-]+@[\w-]+\.[\w.]+/.test(instrucciones)) {
    return { ok: false, error: "Las instrucciones no pueden tener teléfonos ni correos de personas." };
  }
  return { ok: true, rol: { nombre, objetivo: limpiar(p.objetivo, 500), tono: limpiar(p.tono, 300), instrucciones } };
}

/** Bloque que se suma al prompt del agente. Pura. */
export function bloqueDeRol(rol: Pick<Rol, "nombre" | "objetivo" | "tono" | "instrucciones">, nombreBase: string | null, origen: "base" | "campana" = "base"): string {
  const de = origen === "campana" ? "esta campaña" : "esta base";
  return [
    `Rol para ${de}${nombreBase ? ` («${nombreBase}»)` : ""}: ${rol.nombre}.`,
    `Este rol lo definió la responsable para este grupo de clientes y se SUMA a tu guion general: la base general sigue vigente (presentación, reglas, insistencia y cierre). El rol agrega o ajusta el enfoque para ${de}; si algo del rol choca con las reglas estrictas del sistema, valen las reglas. Nunca le digas «base» a la persona.`,
    rol.objetivo ? `Objetivo: ${rol.objetivo}` : "",
    rol.tono ? `Tono: ${rol.tono}` : "",
    "Instrucciones:",
    rol.instrucciones,
  ]
    .filter(Boolean)
    .join("\n");
}
