/**
 * Jarvis consulta la memoria del cerebro (22/11). Pedido del dueño: «Jarvis y el cerebro manejan
 * todo; el cerebro tiene que recopilar muchísima más información». Los archivos `cerebro/*.md`
 * (órdenes vigentes, estado, pendientes, bitácora, estilo, biblioteca, mapa del código) viajan con
 * el despliegue y Jarvis busca en ellos por palabras. Función pura: recibe los textos y devuelve
 * las secciones que mejor responden. Sin datos de prospectos (el cerebro no los guarda).
 */

export interface SeccionCerebro {
  archivo: string;
  titulo: string;
  texto: string;
}

const VACIAS = new Set(["de", "la", "el", "los", "las", "y", "o", "que", "en", "un", "una", "por", "para", "con", "del", "al", "se", "es", "lo", "como", "qué", "cómo", "me", "mi", "a"]);

export function normalizar(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function palabras(s: string): string[] {
  return normalizar(s)
    .split(/[^a-z0-9ñ]+/)
    .filter((w) => w.length > 2 && !VACIAS.has(w));
}

/** Parte un markdown en secciones por títulos `#`/`##`/`###`. */
export function seccionesDe(archivo: string, md: string): SeccionCerebro[] {
  const out: SeccionCerebro[] = [];
  let titulo = archivo;
  let buf: string[] = [];
  const cerrar = () => {
    const texto = buf.join("\n").trim();
    if (texto) out.push({ archivo, titulo, texto });
  };
  for (const linea of md.split("\n")) {
    const m = /^#{1,3}\s+(.*)$/.exec(linea);
    if (m) {
      cerrar();
      titulo = m[1].trim();
      buf = [];
    } else buf.push(linea);
  }
  cerrar();
  return out;
}

/** Las secciones que mejor responden la pregunta (por palabras en común; el título pesa doble; lo más nuevo desempata). */
export function buscarEnCerebro(secciones: SeccionCerebro[], pregunta: string, max = 3, largo = 1400): SeccionCerebro[] {
  const q = [...new Set(palabras(pregunta))];
  if (q.length === 0) return [];
  const puntuadas = secciones.map((s, i) => {
    const t = normalizar(s.titulo);
    const c = normalizar(s.texto);
    let p = 0;
    for (const w of q) {
      if (t.includes(w)) p += 2;
      if (c.includes(w)) p += 1;
    }
    return { s, p, i };
  });
  return puntuadas
    .filter((x) => x.p > 0)
    .sort((a, b) => b.p - a.p || b.i - a.i)
    .slice(0, max)
    .map(({ s }) => ({ ...s, texto: s.texto.length > largo ? `${s.texto.slice(0, largo - 1)}…` : s.texto }));
}
