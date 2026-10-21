/**
 * Estado real de los canales (22/10). Antes la pantalla leía la columna
 * `channels.is_connected`, que nadie actualizaba, y mostraba «Sin conectar»
 * aunque la línea funcionara. Ahora se calcula con las credenciales cargadas
 * en Vercel (solo se mira si existen, nunca su valor). Pura.
 */
type Env = Record<string, string | undefined>;

export function canalConectado(c: { area: string; type: string }, env: Env = process.env): boolean {
  const area = String(c.area).toUpperCase();
  const hay = (k: string) => Boolean(env[k]?.trim());
  switch (c.type) {
    case "whatsapp":
      return hay(`WHATSAPP_${area}_ACCESS_TOKEN`) && hay(`WHATSAPP_${area}_PHONE_NUMBER_ID`);
    case "instagram":
    case "facebook":
      return hay(`FACEBOOK_${area}_PAGE_ACCESS_TOKEN`);
    case "landing":
      // El formulario público no necesita credenciales: siempre recibe.
      return true;
    default:
      return false;
  }
}

/** Devuelve los canales con `is_connected` calculado. */
export function conEstadoReal<T extends { area: string; type: string; is_connected?: boolean | null }>(channels: T[] | null | undefined, env: Env = process.env): T[] {
  return (channels ?? []).map((c) => ({ ...c, is_connected: canalConectado(c, env) }));
}
