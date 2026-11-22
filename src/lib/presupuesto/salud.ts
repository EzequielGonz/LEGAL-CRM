/**
 * Controles de Salud por el gasto de IA (22/11). Pura: recibe el resumen ya
 * leído y devuelve los controles; no lee nada ni conoce el aspecto visual.
 */
import type { ItemSalud } from "@/lib/salud/reglas";
import { evaluarPresupuesto, type ConfigPresupuesto } from "./reglas";

export interface ResumenParaSalud {
  config: ConfigPresupuesto;
  mesUsd: number;
  perfiles: { slug: string; nombre: string; diaUsd: number; topeDiaUsd: number; turnosFrenadosHoy: number }[];
}

const usd = (n: number) => `USD ${n.toFixed(2).replace(".", ",")}`;

/** Un control del mes (de todo el sistema) y uno por cada perfil que llegó a su tope de hoy. Pura. */
export function itemsPresupuestoGemini(r: ResumenParaSalud | null | undefined): ItemSalud[] {
  if (!r) return [];
  const items: ItemSalud[] = [];
  const mes = evaluarPresupuesto({ mesUsd: r.mesUsd, diaPerfilUsd: 0 }, r.config);
  if (mes.estado === "tope_mes") {
    items.push({
      clave: "presupuesto_gemini",
      estado: "rojo",
      titulo: `Gasto de IA: tope del mes alcanzado (${usd(mes.gastoMesUsd)} de ${usd(r.config.mensualUsd)})`,
      detalle: r.config.frenar
        ? "Los bots no usan la IA: cada conversación nueva se cierra con el mensaje de respaldo y pasa a una persona. El recontacto automático no sale."
        : "El freno está apagado: los bots siguen usando la IA por encima del presupuesto.",
      accion: "Decidir si se sube el presupuesto del mes",
      href: "/configuracion",
    });
  } else if (mes.estado === "aviso" || mes.estado === "tope_dia" || mes.estado === "libre") {
    const aviso = mes.gastoMesUsd >= r.config.mensualUsd * r.config.avisoFraccion;
    items.push(
      aviso
        ? { clave: "presupuesto_gemini", estado: "amarillo", titulo: `Gasto de IA al ${mes.porcentajeMes} % del mes`, detalle: `${usd(mes.gastoMesUsd)} de ${usd(r.config.mensualUsd)}. Al llegar al 100 % los bots dejan de usar la IA.`, accion: "Revisar el gasto", href: "/configuracion" }
        : { clave: "presupuesto_gemini", estado: "verde", titulo: "Gasto de IA del mes", detalle: `${usd(mes.gastoMesUsd)} de ${usd(r.config.mensualUsd)} (${mes.porcentajeMes} %).` }
    );
  }
  for (const p of r.perfiles) {
    if (p.diaUsd < p.topeDiaUsd) continue;
    items.push({
      clave: `presupuesto_dia_${p.slug}`,
      estado: "amarillo",
      perfil: p.slug,
      titulo: `${p.nombre}: tope diario de IA alcanzado`,
      detalle: `Hoy lleva ${usd(p.diaUsd)} de ${usd(p.topeDiaUsd)}.${p.turnosFrenadosHoy ? ` ${p.turnosFrenadosHoy} conversación(es) pasaron a una persona.` : ""} Se destraba a la medianoche de Argentina.`,
      accion: "Mirar las conversaciones que pasaron a una persona",
      href: "/inbox",
    });
  }
  return items;
}
