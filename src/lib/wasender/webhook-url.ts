/**
 * Dirección del webhook de una línea de Wasender (10/11). Pura: se prueba sola.
 *
 * - En la Preview se usa la dirección fija de la rama (VERCEL_BRANCH_URL) y,
 *   como Vercel pide inicio de sesión en las Preview, se agrega el bypass
 *   para automatización (VERCEL_AUTOMATION_BYPASS_SECRET, que Vercel carga
 *   sola cuando se genera en Deployment Protection). Esa dirección solo la
 *   recibe Wasender: nunca se muestra en el panel ni se registra.
 * - En producción se usa la dirección pública del panel, sin bypass.
 */

type Env = Record<string, string | undefined>;

export interface DireccionWebhook {
  url: string | null;
  /** Qué falta para armarla (para mostrar en la pantalla, sin valores). */
  falta: string[];
  esPreview: boolean;
}

function host(v: string | undefined): string | null {
  const s = (v ?? "").trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return s ? s : null;
}

export function direccionWebhook(lineaId: string, env: Env = process.env): DireccionWebhook {
  const esPreview = env.VERCEL_ENV === "preview";
  const falta: string[] = [];
  const base = esPreview ? host(env.VERCEL_BRANCH_URL) ?? host(env.VERCEL_URL) : host(env.NEXT_PUBLIC_APP_URL) ?? host(env.VERCEL_PROJECT_PRODUCTION_URL);
  if (!base) falta.push(esPreview ? "La dirección de la Preview (VERCEL_BRANCH_URL)" : "La dirección pública del panel (NEXT_PUBLIC_APP_URL)");
  const bypass = (env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "").trim();
  if (esPreview && !bypass) falta.push("El acceso a la Preview para Wasender (Protection Bypass for Automation en Vercel)");
  if (!base || falta.length) return { url: null, falta, esPreview };
  const p = new URLSearchParams({ linea: lineaId });
  if (esPreview) p.set("x-vercel-protection-bypass", bypass);
  return { url: `https://${base}/api/webhooks/wasender?${p.toString()}`, falta, esPreview };
}

/** Qué falta en la configuración privada para usar Wasender (solo nombres, nunca valores). */
export function configuracionWasender(env: Env = process.env): { lista: boolean; items: { clave: string; texto: string; ok: boolean }[] } {
  const esPreview = env.VERCEL_ENV === "preview";
  const items = [
    { clave: "WASENDER_PAT", texto: "Token de la cuenta de Wasender (WASENDER_PAT)", ok: !!(env.WASENDER_PAT ?? "").trim() },
    { clave: "WASENDER_CLAVE_CIFRADO", texto: "Clave para guardar cifradas las claves de las líneas (WASENDER_CLAVE_CIFRADO)", ok: (env.WASENDER_CLAVE_CIFRADO ?? "").trim().length >= 16 },
    ...(esPreview
      ? [{ clave: "VERCEL_AUTOMATION_BYPASS_SECRET", texto: "Acceso de Wasender a la Preview (Protection Bypass for Automation)", ok: !!(env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "").trim() }]
      : []),
    { clave: "WASENDER_HABILITADO", texto: "Interruptor general de envíos por Wasender (WASENDER_HABILITADO=true)", ok: (env.WASENDER_HABILITADO ?? "").trim() === "true" },
  ];
  return { lista: items.every((i) => i.ok), items };
}
