/**
 * Resumen de una base para recomendar plantillas (19/10). Puro.
 * Solo devuelve nombres de columnas y la distribución de columnas de
 * categoría (por ejemplo tipo de consulta o diagnóstico). Nunca devuelve
 * nombres, teléfonos, mails, documentos ni direcciones de las personas.
 */
const SENSIBLE = /(tel|cel|phone|movil|whats|nombre|name|apellido|mail|correo|dni|cuit|cuil|direccion|domicilio|calle|patente|documento|observ|nota|coment)/;

const norm = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();

export interface ColumnaResumen {
  columna: string;
  completas: number;
  valores?: { valor: string; cantidad: number }[];
  nota?: string;
}

export function resumirColumnas(filas: Record<string, unknown>[]): { filas: number; columnas: ColumnaResumen[] } {
  const total = filas.length;
  const nombres: string[] = [];
  for (const f of filas.slice(0, 50)) for (const k of Object.keys(f)) if (!nombres.includes(k)) nombres.push(k);
  const columnas: ColumnaResumen[] = nombres.slice(0, 40).map((col) => {
    const conteo = new Map<string, number>();
    let completas = 0;
    for (const f of filas) {
      const v = f[col];
      if (v === null || v === undefined || String(v).trim() === "") continue;
      completas++;
      const clave = String(v).trim().slice(0, 40);
      conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
    }
    if (SENSIBLE.test(norm(col))) return { columna: col, completas, nota: "dato personal: no se muestran valores" };
    if (conteo.size > 0 && conteo.size <= 30) {
      const valores = Array.from(conteo.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([valor, cantidad]) => ({ valor, cantidad }));
      return { columna: col, completas, valores };
    }
    return { columna: col, completas, nota: "valores muy variados" };
  });
  return { filas: total, columnas };
}
