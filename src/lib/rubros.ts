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
