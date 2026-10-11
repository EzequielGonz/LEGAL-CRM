import { normalizePhoneAR } from "@/lib/phone";
import { resolveRowFields, type ColumnMapping } from "./mapping";

/**
 * Validación de una carga (bloque 1.6). Es la MISMA función para la vista
 * previa del navegador (PC y teléfono) y para el servidor que guarda la
 * base: no hay validaciones distintas según la pantalla de entrada.
 * Validar no guarda ni envía nada.
 */

export type RowProblem = "sin_telefono" | "telefono_irreconocible";

export const ROW_PROBLEM_LABEL: Record<RowProblem, string> = {
  sin_telefono: "Sin teléfono",
  telefono_irreconocible: "Teléfono con formato irreconocible",
};

export interface RowCheck {
  rowNumber: number;
  phone: string | null;
  confidence: "alta" | "revisar";
  phoneOriginal: string | null;
  problem: RowProblem | null;
  /** texto para mostrar y guardar como motivo de la fila */
  reason: string | null;
}

export function checkRow(rawRow: Record<string, unknown>, rowNumber: number, mapping?: ColumnMapping | null): RowCheck {
  const fields = resolveRowFields(rawRow, mapping);
  const raw = fields.phone_raw;
  const { phone, confidence } = normalizePhoneAR(raw);
  if (!phone) {
    const problem: RowProblem = raw && raw.trim() ? "telefono_irreconocible" : "sin_telefono";
    return {
      rowNumber,
      phone: null,
      confidence,
      phoneOriginal: raw ?? null,
      problem,
      reason: problem === "sin_telefono" ? ROW_PROBLEM_LABEL.sin_telefono : `${ROW_PROBLEM_LABEL.telefono_irreconocible} («${raw}»)`,
    };
  }
  return {
    rowNumber,
    phone,
    confidence,
    phoneOriginal: raw ?? null,
    problem: null,
    reason: confidence === "revisar" ? "Teléfono normalizado con baja confianza: revisar" : null,
  };
}

export interface ValidationSummary {
  /** filas leídas del archivo */
  total: number;
  /** filas con teléfono utilizable (incluye las de baja confianza) */
  utilizables: number;
  /** teléfonos distintos entre las utilizables */
  telefonos_distintos: number;
  /** filas utilizables cuyo teléfono ya apareció más arriba en el mismo archivo */
  repetidas_en_archivo: number;
  /** filas que no se pueden usar para contactar (quedan guardadas con su motivo) */
  invalidas: number;
  /** utilizables con teléfono de baja confianza (conviene revisarlas) */
  a_revisar: number;
  /** primeras filas con problema, para mostrar el motivo */
  ejemplos: { rowNumber: number; reason: string; original: string | null }[];
}

export function validateRows(
  rows: Record<string, unknown>[],
  mapping?: ColumnMapping | null,
  maxExamples = 20
): ValidationSummary {
  const seen = new Set<string>();
  const out: ValidationSummary = {
    total: rows.length,
    utilizables: 0,
    telefonos_distintos: 0,
    repetidas_en_archivo: 0,
    invalidas: 0,
    a_revisar: 0,
    ejemplos: [],
  };
  rows.forEach((row, i) => {
    const c = checkRow(row, i + 1, mapping);
    if (!c.phone) {
      out.invalidas++;
      if (out.ejemplos.length < maxExamples) out.ejemplos.push({ rowNumber: c.rowNumber, reason: c.reason!, original: c.phoneOriginal });
      return;
    }
    out.utilizables++;
    if (c.confidence === "revisar") {
      out.a_revisar++;
      if (out.ejemplos.length < maxExamples) out.ejemplos.push({ rowNumber: c.rowNumber, reason: c.reason!, original: c.phoneOriginal });
    }
    if (seen.has(c.phone)) out.repetidas_en_archivo++;
    else seen.add(c.phone);
  });
  out.telefonos_distintos = seen.size;
  return out;
}

/** Encabezados en el orden en que aparecen (primera fila que los trae). */
export function headersOf(rows: Record<string, unknown>[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of rows) {
    for (const k of Object.keys(r)) {
      if (!seen.has(k)) {
        seen.add(k);
        out.push(k);
      }
    }
  }
  return out;
}
