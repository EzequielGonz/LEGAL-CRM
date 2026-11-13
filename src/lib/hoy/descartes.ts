/**
 * Descartes de «Hoy» (12/11, pedido de la responsable): quien contesta que ya
 * tiene abogado, que ya lo resolvió o que no le interesa no es trabajo
 * pendiente. No se mezcla con quienes sí hay que atender: se reconoce, se saca
 * de la vista y se cierra como perdido con un clic. No se borra nada.
 *
 * Solo frases claras. Ante la duda, NO es descarte (queda en atención humana).
 * Pura: se prueba sola.
 */

export interface Descarte {
  clave: "ya_tiene_profesional" | "ya_resuelto" | "no_interesa" | "numero_equivocado" | "no_escribir";
  etiqueta: string;
}

const sinAcentos = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[¿?¡!.,;:«»"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const REGLAS: { clave: Descarte["clave"]; etiqueta: string; patron: RegExp }[] = [
  { clave: "no_escribir", etiqueta: "Pidió que no le escriban", patron: /\b(no me (escriban|escribas|escriba|molesten|molestes|contacten|llamen)|dejen? de (escribir|molestar)|no quiero (que me escriban|recibir|mas mensajes))\b/ },
  { clave: "numero_equivocado", etiqueta: "Número equivocado", patron: /\b(numero equivocado|se equivoco de (numero|persona)|te equivocaste|no soy (esa persona|yo|el|ella)|equivocad[oa])\b/ },
  { clave: "ya_tiene_profesional", etiqueta: "Ya tiene quien lo atienda", patron: /\b(ya )?(tengo|tenemos|estoy con|contrate) (un |una |mi |otro |otra )?(abogad[oa]s?|estudio|asesor[a]?|gestor[a]?|agencia|concesionari[ao]|prepaga|obra social|cobertura)\b/ },
  { clave: "ya_resuelto", etiqueta: "Ya lo resolvió", patron: /\b(ya (esta|fue|quedo) (resuelto|solucionado|cerrado|arreglado)|ya (lo|la) (resolvi|solucione|cerre|arregle|cobre)|caso (ya )?(esta )?(resuelto|cerrado)|ya cobre|ya me pagaron|ya (lo )?compre)\b/ },
  { clave: "no_interesa", etiqueta: "No le interesa", patron: /^(no gracias|no muchas gracias|no,? ?gracias.*|no me interesa.*|no estoy interesad[oa].*|no,? ?no me interesa.*|por ahora no gracias|no quiero|no)$|\bno me interesa\b|\bno estoy interesad[oa]\b/ },
];

/** Motivo de descarte del último mensaje de la persona, o null si no es un descarte claro. */
export function descarteDe(texto: string | null | undefined): Descarte | null {
  const t = sinAcentos(texto ?? "");
  if (!t || t.length > 160) return null;
  // Una pregunta o un «pero» indican que la charla sigue: no es descarte.
  if (/\b(pero|aunque|igual|cuanto|como seria|quisiera|me interesa saber)\b/.test(t) && !/\bno me (escriban|interesa)\b/.test(t)) return null;
  for (const r of REGLAS) if (r.patron.test(t)) return { clave: r.clave, etiqueta: r.etiqueta };
  return null;
}
