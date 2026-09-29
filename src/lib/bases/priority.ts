// Prioridad de envio de campanas segun la lesion del prospecto.
//
// Pedido de Vita: cuando se manda una lista/campana, los casos de fractura,
// muerte o amputacion tienen que mandarse ANTES que el resto -- las tres al
// mismo nivel de prioridad entre si (no hay un orden particular entre
// fractura/muerte/amputacion, cualquiera de las tres va primero que un caso
// que no es ninguna de esas).
//
// De donde sale el dato: en las planillas reales (de ART/aseguradoras) el
// tipo de lesion viene en la columna "DIAGNOSTICO" (ver el alias
// `diagnostico` en ./mapping.ts) -- texto libre como "Fractura de otro dedo
// de la mano" o "Contusion de la rodilla". Tambien se revisa, como
// respaldo, la columna "Tipo de consulta"/"Motivo" por si en otra planilla
// la lesion viniera anotada ahi en vez de en "Diagnostico".
//
// Nota tecnica: a proposito NO se usa la normalizacion de acentos que usa
// normalizeHeader() en ./mapping.ts (esa saca tildes con un rango unicode
// en una expresion regular). Aca no hace falta: ninguna de las cuatro
// palabras clave de abajo lleva tilde en la parte que se busca (ni
// "fractura", ni "muerte", ni "fallec[imiento]", ni "amputac[ion]" --
// aunque el texto real diga "amputacion" con tilde, la comparacion es por
// el prefijo "amputac", que matchea igual). Evitar esa expresion regular
// ademas evita tener que escribir caracteres unicode "combinantes" en este
// archivo, que son justamente el tipo de caracter que se corrompe al
// copiar y pegar codigo entre el chat y el editor de GitHub.
const HIGH_PRIORITY_TOKENS = ["fractura", "muerte", "fallec", "amputac"];

/**
 * Devuelve la prioridad de envio para un contacto/fila de campana:
 * 0 = prioritario (fractura, muerte/fallecimiento o amputacion detectada),
 * 1 = prioridad normal (todo lo demas, incluido cuando no hay diagnostico).
 *
 * Menor numero = se manda primero (ver el ORDER BY en tickCampaign).
 */
export function computeCampaignPriority(
  ...texts: (string | null | undefined)[]
): number {
  const combined = texts
    .filter((t): t is string => Boolean(t))
    .join(" ")
    .toLowerCase();
  const isHighPriority = HIGH_PRIORITY_TOKENS.some((token) => combined.includes(token));
  return isHighPriority ? 0 : 1;
}
