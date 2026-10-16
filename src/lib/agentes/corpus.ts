/**
 * Etapa 3 · Corpus y exportador (cap. 17). Puro, sin dependencias.
 *
 *  - División por FAMILIA de escenario (conversación, contacto y variantes
 *    quedan del mismo lado): entrenamiento / validación / reservado.
 *  - Metas del proyecto: 600 / 100 / 160 (150 / 25 / 40 por rubro); primero
 *    un piloto revisado. `planDistribucion` dice cuánto falta.
 *  - Exportador al JSONL de ajuste supervisado de Google Cloud (texto y
 *    llamadas a herramientas): `systemInstruction` + `contents` con roles
 *    user/model y `functionCall` / `functionResponse`. Solo se exportan casos
 *    APROBADOS en revisión. `validarJsonl` comprueba estructura antes de subir.
 *  - Hash del corpus para el trabajo trazable.
 */

import { createHash } from "node:crypto";

export type Particion = "entrenamiento" | "validacion" | "reservado";

export interface CasoCorpus {
  clave: string;
  familia: string;
  rubro: string;
  area: string;
  modo: string;
  particion: Particion;
  hechos: Record<string, unknown>;
  mensajes: { rol: "prospecto" | "asesor" | "herramienta"; texto?: string; acciones?: { herramienta: string; argumentos: Record<string, unknown> }[]; resultado?: unknown; nombre?: string }[];
  respuesta_correcta: string;
  revision: "pendiente" | "aprobado" | "rechazado";
  instrucciones?: string;
}

export const METAS = { entrenamiento: 600, validacion: 100, reservado: 160, porRubro: { entrenamiento: 150, validacion: 25, reservado: 40 } } as const;
export const PILOTO = 40;

/** Asigna partición por familia+rubro de forma determinista (hash), respetando proporciones 70/12/18. */
export function particionPara(familia: string, rubro: string, semilla = "etapa3"): Particion {
  const h = createHash("sha256").update(`${semilla}:${rubro}:${familia}`).digest();
  const v = h[0] / 255;
  if (v < 0.7) return "entrenamiento";
  if (v < 0.82) return "validacion";
  return "reservado";
}

/** Una familia (por rubro) nunca aparece en dos particiones. */
export function familiasCruzadas(casos: Pick<CasoCorpus, "familia" | "rubro" | "particion">[]): string[] {
  const m = new Map<string, Set<Particion>>();
  for (const c of casos) {
    const k = `${c.rubro}:${c.familia}`;
    if (!m.has(k)) m.set(k, new Set());
    m.get(k)!.add(c.particion);
  }
  return Array.from(m.entries()).filter(([, s]) => s.size > 1).map(([k]) => k);
}

export function planDistribucion(casos: Pick<CasoCorpus, "rubro" | "particion" | "revision">[]) {
  const rubros = ["juridico", "coberturas_medicas", "agencia_0km", "marketing"];
  const out: Record<string, Record<Particion, { aprobados: number; meta: number; faltan: number }>> = {};
  for (const r of rubros) {
    out[r] = {} as any;
    for (const p of ["entrenamiento", "validacion", "reservado"] as Particion[]) {
      const aprobados = casos.filter((c) => c.rubro === r && c.particion === p && c.revision === "aprobado").length;
      const meta = METAS.porRubro[p];
      out[r][p] = { aprobados, meta, faltan: Math.max(0, meta - aprobados) };
    }
  }
  const totalAprobados = casos.filter((c) => c.revision === "aprobado").length;
  return { porRubro: out, totalAprobados, pilotoCompleto: totalAprobados >= PILOTO };
}

export interface EjemploJsonl {
  systemInstruction: { role: "system"; parts: { text: string }[] };
  contents: { role: "user" | "model"; parts: ({ text: string } | { functionCall: { name: string; args: Record<string, unknown> } } | { functionResponse: { name: string; response: Record<string, unknown> } })[] }[];
}

/** Convierte un caso aprobado al formato de ejemplo (texto + herramientas). */
export function casoAEjemplo(c: CasoCorpus): EjemploJsonl {
  const contents: EjemploJsonl["contents"] = [];
  // Dos mensajes seguidos de la misma parte (p. ej. la persona escribe dos veces
  // antes de que el asesor conteste) se unen en un solo turno: el formato exige roles alternados.
  const empujar = (role: "user" | "model", parts: EjemploJsonl["contents"][number]["parts"]) => {
    const ultimo = contents[contents.length - 1];
    if (ultimo && ultimo.role === role && !parts.some((p) => "functionResponse" in p) && !ultimo.parts.some((p) => "functionResponse" in p)) {
      ultimo.parts.push(...parts);
      return;
    }
    contents.push({ role, parts });
  };
  for (const m of c.mensajes) {
    if (m.rol === "prospecto") empujar("user", [{ text: m.texto ?? "" }]);
    else if (m.rol === "asesor") {
      const parts: EjemploJsonl["contents"][number]["parts"] = [];
      if (m.texto) parts.push({ text: m.texto });
      for (const a of m.acciones ?? []) parts.push({ functionCall: { name: a.herramienta, args: a.argumentos } });
      empujar("model", parts);
    } else if (m.rol === "herramienta") {
      contents.push({ role: "user", parts: [{ functionResponse: { name: m.nombre ?? "herramienta", response: (m.resultado as Record<string, unknown>) ?? {} } }] });
    }
  }
  // La respuesta correcta cierra el ejemplo como último turno del modelo si el caso termina en la persona.
  const ultimo = contents[contents.length - 1];
  if (!ultimo || ultimo.role === "user") contents.push({ role: "model", parts: [{ text: c.respuesta_correcta }] });
  return { systemInstruction: { role: "system", parts: [{ text: c.instrucciones ?? "" }] }, contents };
}

export function exportarJsonl(casos: CasoCorpus[], particion: Particion): { lineas: string[]; omitidos: string[] } {
  const lineas: string[] = [];
  const omitidos: string[] = [];
  for (const c of casos) {
    if (c.particion !== particion) continue;
    if (c.revision !== "aprobado") {
      omitidos.push(`${c.clave}: revisión ${c.revision}`);
      continue;
    }
    lineas.push(JSON.stringify(casoAEjemplo(c)));
  }
  return { lineas, omitidos };
}

/** Validación estructural de un JSONL antes de subir (roles alternados, sin vacíos, sin partes mezcladas). */
export function validarJsonl(lineas: string[]): { ok: boolean; errores: string[] } {
  const errores: string[] = [];
  lineas.forEach((l, i) => {
    let e: any;
    try {
      e = JSON.parse(l);
    } catch {
      errores.push(`línea ${i + 1}: JSON inválido`);
      return;
    }
    if (!e?.systemInstruction?.parts?.[0]?.text?.trim()) errores.push(`línea ${i + 1}: sin instrucción del sistema`);
    if (!Array.isArray(e?.contents) || e.contents.length < 2) errores.push(`línea ${i + 1}: menos de dos turnos`);
    else {
      let prev: string | null = null;
      e.contents.forEach((c: any, j: number) => {
        if (c.role !== "user" && c.role !== "model") errores.push(`línea ${i + 1}, turno ${j + 1}: rol inválido`);
        if (c.role === prev && !(c.parts ?? []).some((p: any) => p.functionResponse)) errores.push(`línea ${i + 1}, turno ${j + 1}: dos turnos seguidos del mismo rol`);
        if (!Array.isArray(c.parts) || c.parts.length === 0) errores.push(`línea ${i + 1}, turno ${j + 1}: sin partes`);
        for (const p of c.parts ?? []) {
          if (typeof p.text === "string" && !p.text.trim()) errores.push(`línea ${i + 1}, turno ${j + 1}: texto vacío`);
          if (p.functionCall && c.role !== "model") errores.push(`línea ${i + 1}, turno ${j + 1}: functionCall fuera del modelo`);
          if (p.functionResponse && c.role !== "user") errores.push(`línea ${i + 1}, turno ${j + 1}: functionResponse fuera del usuario`);
        }
        prev = c.role;
      });
      if (e.contents[e.contents.length - 1].role !== "model") errores.push(`línea ${i + 1}: no termina en el modelo`);
    }
  });
  return { ok: errores.length === 0, errores };
}

export function hashCorpus(lineas: string[]): string {
  return createHash("sha256").update(lineas.join("\n")).digest("hex");
}

/** Minimización para conversaciones reales (solo con autorización): quita teléfonos, documentos, correos y nombres marcados. */
export function anonimizar(texto: string): string {
  return texto
    .replace(/\+?\d[\d\s().-]{8,}\d/g, "[teléfono]")
    .replace(/\b\d{2}\.?\d{3}\.?\d{3}\b/g, "[documento]")
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[correo]")
    .replace(/\[\[([^\]]+)\]\]/g, "[nombre]");
}
