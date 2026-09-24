// IDs fijos de cada rubro (ver migración "add_rubros_multirubro"). Se usan
// acá para no tener que leerlos de la base cada vez que el código todavía
// asume "todo es Jurídico" (por ejemplo, el flujo de intake que crea
// contactos nuevos sin especificar rubro).
export const RUBRO_IDS = {
  juridico: "11111111-1111-1111-1111-111111111111",
  agencia_0km: "22222222-2222-2222-2222-222222222222",
  coberturas_medicas: "33333333-3333-3333-3333-333333333333",
  marketing: "44444444-4444-4444-4444-444444444444",
} as const;

export type RubroSlug = keyof typeof RUBRO_IDS;

// "area" (civil/penal/agencia_0km/coberturas_medicas/marketing) -> a qué
// rubro pertenece. Para Jurídico, civil y penal apuntan las dos al mismo
// rubro; para los rubros nuevos, cada area es 1:1 con su rubro. Se usa al
// crear contactos nuevos (findOrCreateContact) para que rubro_id quede
// bien puesto desde el vamos, en vez de caer siempre en el default de
// Jurídico que tiene la columna.
export const AREA_TO_RUBRO_ID: Record<string, string> = {
  civil: RUBRO_IDS.juridico,
  penal: RUBRO_IDS.juridico,
  agencia_0km: RUBRO_IDS.agencia_0km,
  coberturas_medicas: RUBRO_IDS.coberturas_medicas,
  marketing: RUBRO_IDS.marketing,
};

// Prefijo de las variables de entorno de WhatsApp Cloud API para cada area
// nueva (las de Jurídico siguen siendo WHATSAPP_CIVIL_* / WHATSAPP_PENAL_*,
// sin cambios). Ej.: area "agencia_0km" -> WHATSAPP_AGENCIA_0KM_PHONE_NUMBER_ID
// y WHATSAPP_AGENCIA_0KM_ACCESS_TOKEN. Se arma automáticamente a partir del
// nombre del area, así que agregar un rubro más no requiere tocar esta lista.
export const NUEVAS_AREAS_WHATSAPP = [
  "agencia_0km",
  "coberturas_medicas",
  "marketing",
] as const;

export function envPrefixForArea(area: string): string {
  return `WHATSAPP_${area.toUpperCase()}`;
}
