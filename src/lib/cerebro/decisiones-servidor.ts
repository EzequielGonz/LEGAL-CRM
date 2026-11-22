import { readFileSync } from "node:fs";
import { join } from "node:path";
import { decisionesDe, type Decision } from "@/lib/cerebro/decisiones";

/** Lee `cerebro/02-ordenes-vigentes.md` (viaja con el despliegue: ver `outputFileTracingIncludes` en next.config.mjs). */
export function leerDecisiones(): Decision[] {
  try {
    return decisionesDe(readFileSync(join(process.cwd(), "cerebro", "02-ordenes-vigentes.md"), "utf8"));
  } catch {
    return [];
  }
}
