/**
 * Plantillas de WhatsApp desde un archivo (18/10). La responsable sube un
 * CSV, Excel o JSON con las propuestas; el panel reconoce el rubro de cada
 * una (por la columna «perfil» o por el prefijo del nombre) y las manda a
 * revisión de Meta en la línea que corresponde. Pura.
 */
import type { PlantillaPropuesta } from "@/lib/plantillas/propuestas";

export const RUBROS_PLANTILLA = ["juridico", "coberturas_medicas", "agencia_0km", "marketing"] as const;
export type RubroPlantilla = (typeof RUBROS_PLANTILLA)[number];

const ALIAS: [RegExp, RubroPlantilla][] = [
  [/^(jur|juridico|jurídico|estudio|civil|penal)$/, "juridico"],
  [/^(cob|coberturas?|coberturas_medicas|salud|obra_social|prepaga)$/, "coberturas_medicas"],
  [/^(autos?|0km|agencia_0km|automotores)$/, "agencia_0km"],
  [/^(mkt|marketing|agencia)$/, "marketing"],
];

function norm(v: unknown): string {
  return typeof v === "string" ? v.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase().replace(/[\s-]+/g, "_") : "";
}

/** Rubro por texto («Coberturas», «mkt», «0km»…). */
export function rubroDeTexto(v: unknown): RubroPlantilla | null {
  const t = norm(v);
  if (!t) return null;
  return ALIAS.find(([re]) => re.test(t))?.[1] ?? null;
}

/** Rubro por el nombre de la plantilla: prefijo (jur_, cob_, autos_, mkt_) o sufijo (_jur, _cob, _autos, _mkt). */
export function rubroDeNombre(nombre: string): RubroPlantilla | null {
  const partes = nombre.split("_");
  return rubroDeTexto(partes[0]) ?? rubroDeTexto(partes[partes.length - 1]);
}

const CAMPOS: Record<string, string[]> = {
  perfil: ["perfil", "rubro", "linea", "línea"],
  nombre: ["nombre", "name", "plantilla"],
  categoria: ["categoria", "categoría", "category", "tipo"],
  cuerpo: ["cuerpo", "texto", "body", "mensaje"],
  botones: ["botones", "buttons", "respuestas"],
  proposito: ["proposito", "propósito", "uso"],
};

function campo(fila: Record<string, unknown>, clave: keyof typeof CAMPOS): unknown {
  const claves = Object.keys(fila);
  for (const alias of CAMPOS[clave]) {
    const k = claves.find((c) => norm(c) === norm(alias));
    if (k !== undefined) return fila[k];
  }
  return undefined;
}

export interface ErrorFila {
  fila: number;
  nombre: string | null;
  motivo: string;
}

export function normalizarFilasPlantillas(filas: unknown): { validas: PlantillaPropuesta[]; errores: ErrorFila[] } {
  const lista = Array.isArray(filas) ? filas : [];
  const validas: PlantillaPropuesta[] = [];
  const errores: ErrorFila[] = [];
  const vistos = new Set<string>();
  lista.slice(0, 300).forEach((f, i) => {
    const fila = (f && typeof f === "object" ? f : {}) as Record<string, unknown>;
    const nombre = norm(campo(fila, "nombre")).replace(/[^a-z0-9_]/g, "");
    const n = i + 1;
    if (!nombre) return errores.push({ fila: n, nombre: null, motivo: "Falta el nombre." });
    if (nombre.length > 512) return errores.push({ fila: n, nombre, motivo: "El nombre es demasiado largo." });
    const rubro = rubroDeTexto(campo(fila, "perfil")) ?? rubroDeNombre(nombre);
    if (!rubro) return errores.push({ fila: n, nombre, motivo: "No se reconoce el perfil: agregá la columna «perfil» o un prefijo (jur_, cob_, autos_, mkt_)." });
    const cuerpo = typeof campo(fila, "cuerpo") === "string" ? String(campo(fila, "cuerpo")).trim() : "";
    if (!cuerpo) return errores.push({ fila: n, nombre, motivo: "Falta el texto." });
    if (cuerpo.length > 1024) return errores.push({ fila: n, nombre, motivo: "El texto supera los 1024 caracteres de Meta." });
    const nums = Array.from(cuerpo.matchAll(/\{\{(\d+)\}\}/g)).map((m) => Number(m[1]));
    const esperados = Array.from(new Set(nums)).sort((a, b) => a - b);
    if (esperados.some((v, k) => v !== k + 1)) return errores.push({ fila: n, nombre, motivo: "Las variables tienen que ir en orden: {{1}}, {{2}}…" });
    const catRaw = norm(campo(fila, "categoria"));
    const categoria = catRaw === "utility" || catRaw === "utilidad" ? "UTILITY" : "MARKETING";
    const botonesRaw = campo(fila, "botones");
    const botones = (Array.isArray(botonesRaw) ? botonesRaw : typeof botonesRaw === "string" ? botonesRaw.split(/[|;\n]/) : [])
      .map((b) => String(b).trim())
      .filter(Boolean);
    if (botones.length > 3) return errores.push({ fila: n, nombre, motivo: "Hasta 3 botones de respuesta." });
    if (botones.some((b) => b.length > 25)) return errores.push({ fila: n, nombre, motivo: "Cada botón tiene hasta 25 caracteres." });
    if (vistos.has(nombre)) return errores.push({ fila: n, nombre, motivo: "Nombre repetido en el archivo." });
    vistos.add(nombre);
    const proposito = norm(campo(fila, "proposito")) || "archivo";
    validas.push({ rubro, proposito, nombre, categoria, cuerpo, botones });
  });
  return { validas, errores };
}

/** CSV de propuestas (para descargar, editar y volver a subir). Pura. */
export function csvPlantillas(lista: PlantillaPropuesta[]): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const filas = lista.map((p) => [p.rubro, p.nombre, p.categoria, p.proposito, p.cuerpo, p.botones.join(" | ")].map(esc).join(","));
  return ["perfil,nombre,categoria,proposito,cuerpo,botones", ...filas].join("\n");
}
