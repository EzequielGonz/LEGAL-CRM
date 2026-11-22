import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { seccionesDe, type SeccionCerebro } from "@/lib/jarvis/cerebro-memoria";

let cache: SeccionCerebro[] | null = null;

/** Lee una vez por instancia todos los `.md` de `cerebro/` (viajan con el despliegue, ver next.config). */
export function seccionesDelCerebro(): SeccionCerebro[] {
  if (cache) return cache;
  const raiz = join(process.cwd(), "cerebro");
  const out: SeccionCerebro[] = [];
  const recorrer = (dir: string, prof: number) => {
    let nombres: string[] = [];
    try {
      nombres = readdirSync(dir);
    } catch {
      return;
    }
    for (const n of nombres) {
      const ruta = join(dir, n);
      let st;
      try {
        st = statSync(ruta);
      } catch {
        continue;
      }
      if (st.isDirectory() && prof < 3) recorrer(ruta, prof + 1);
      else if (n.endsWith(".md") && st.size < 400_000) {
        try {
          out.push(...seccionesDe(relative(raiz, ruta), readFileSync(ruta, "utf8")));
        } catch {
          /* un archivo ilegible no corta la búsqueda */
        }
      }
    }
  };
  recorrer(raiz, 0);
  cache = out;
  return out;
}
