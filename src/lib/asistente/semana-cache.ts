import { unstable_cache } from "next/cache";
import { resumenSemana } from "@/lib/asistente/semana";

/**
 * La comparación de la semana (22/11, velocidad): son ~40 conteos contra la base y cambian
 * despacio. Se guardan 2 minutos y los comparten Resumen, Cerebro y Jarvis; las cifras de lo
 * pendiente de hoy siguen leyéndose en vivo.
 */
export const resumenSemanaEnMemoria = unstable_cache(() => resumenSemana(), ["resumen-semana"], { revalidate: 120 });
