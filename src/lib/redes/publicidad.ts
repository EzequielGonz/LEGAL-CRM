/**
 * Publicidad paga (18/10): solo configuración, apagada. Deja listo por
 * perfil el objetivo, el presupuesto diario tope, el público y la cuenta
 * publicitaria, para encenderla cuando haya presupuesto. Nada de esto crea
 * anuncios ni gasta: no hay ningún ejecutor conectado y encenderla pide
 * autorización expresa de la responsable. Pura.
 */
export const OBJETIVOS_ANUNCIO = ["mensajes_whatsapp", "visitas_web", "alcance"] as const;
export type ObjetivoAnuncio = (typeof OBJETIVOS_ANUNCIO)[number];

export const OBJETIVO_LABEL: Record<ObjetivoAnuncio, string> = {
  mensajes_whatsapp: "Que escriban por WhatsApp",
  visitas_web: "Visitas a la web",
  alcance: "Que más gente conozca la marca",
};

export interface ConfigAnuncios {
  objetivo: ObjetivoAnuncio;
  presupuesto_diario: number | null;
  zona: string;
  edades: string;
  intereses: string;
  cuenta_publicitaria: string;
  redes: ("instagram" | "facebook")[];
}

export const CONFIG_VACIA: ConfigAnuncios = { objetivo: "mensajes_whatsapp", presupuesto_diario: null, zona: "", edades: "", intereses: "", cuenta_publicitaria: "", redes: ["instagram", "facebook"] };

export function validarConfigAnuncios(v: Record<string, unknown>): ConfigAnuncios {
  const texto = (k: string, max: number) => (typeof v[k] === "string" ? (v[k] as string).trim().slice(0, max) : "");
  const objetivo = (OBJETIVOS_ANUNCIO as readonly string[]).includes(String(v.objetivo)) ? (v.objetivo as ObjetivoAnuncio) : "mensajes_whatsapp";
  const monto = Number(v.presupuesto_diario);
  const presupuesto_diario = Number.isFinite(monto) && monto > 0 ? Math.min(Math.round(monto), 10_000_000) : null;
  const cuenta = texto("cuenta_publicitaria", 40);
  if (cuenta && !/^(act_)?\d{5,25}$/.test(cuenta)) throw new Error("La cuenta publicitaria es un número (por ejemplo act_123456789).");
  const redes = Array.isArray(v.redes) ? (v.redes.filter((r) => r === "instagram" || r === "facebook") as ConfigAnuncios["redes"]) : [];
  return { objetivo, presupuesto_diario, zona: texto("zona", 200), edades: texto("edades", 40), intereses: texto("intereses", 400), cuenta_publicitaria: cuenta, redes: redes.length ? redes : ["instagram", "facebook"] };
}
