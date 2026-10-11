import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Interruptor general de automatizaciones (system_settings.automation_pause).
 *
 * - aiRepliesPaused: el agente IA no responde (los mensajes entrantes se
 *   siguen guardando y quedan para atención manual).
 * - outboundPaused: no sale ningún envío automático (campañas, seguimientos,
 *   prospección automática, plantilla de la landing). Los mensajes que
 *   escribe una persona desde el panel no se bloquean.
 *
 * Si no se puede leer el estado, o la configuración falta, está vacía o
 * incompleta, se asume PAUSADO: ante la duda, no se contacta a nadie de
 * forma automática, y el panel muestra el problema.
 */
export interface AutomationPause {
  aiRepliesPaused: boolean;
  outboundPaused: boolean;
  since: string | null;
  reason: string | null;
  readError?: string;
  /**
   * La configuración falta, está vacía o le faltan campos: se asume TODO en
   * pausa y el panel muestra el problema para corregirlo.
   */
  configProblem?: string;
}

/**
 * Interpreta el registro de la pausa general. Solo un `false` explícito
 * levanta una pausa: si falta el registro, el valor es nulo, no es un objeto
 * o falta (o no es booleano) alguno de los dos campos, esa pausa queda activa.
 * Función pura: se prueba sin base de datos.
 */
export function parseAutomationPause(row: { value?: unknown } | null | undefined): AutomationPause {
  const paused = (configProblem: string): AutomationPause => ({
    aiRepliesPaused: true,
    outboundPaused: true,
    since: null,
    reason: null,
    configProblem,
  });
  if (!row) {
    return paused(
      "No existe la configuración de la pausa general (system_settings.automation_pause). Se mantienen en pausa la IA y los envíos automáticos hasta guardarla desde este panel."
    );
  }
  const v = row.value;
  if (v === null || v === undefined || typeof v !== "object" || Array.isArray(v)) {
    return paused(
      "La configuración de la pausa general está vacía o no es válida. Se mantienen en pausa la IA y los envíos automáticos hasta guardarla desde este panel."
    );
  }
  const value = v as Record<string, unknown>;
  const missing: string[] = [];
  if (typeof value.ai_replies_paused !== "boolean") missing.push("respuestas de la IA (ai_replies_paused)");
  if (typeof value.outbound_automations_paused !== "boolean") missing.push("envíos automáticos (outbound_automations_paused)");
  return {
    aiRepliesPaused: value.ai_replies_paused !== false,
    outboundPaused: value.outbound_automations_paused !== false,
    since: typeof value.since === "string" ? value.since : null,
    reason: typeof value.reason === "string" ? value.reason : null,
    ...(missing.length
      ? {
          configProblem: `A la configuración de la pausa general le falta un valor válido para: ${missing.join(" y ")}. Esas pausas se mantienen activas hasta guardarla desde este panel.`,
        }
      : {}),
  };
}

export async function getAutomationPause(): Promise<AutomationPause> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "automation_pause")
      .maybeSingle();
    if (error) throw new Error(error.message);
    const pause = parseAutomationPause(data);
    if (pause.configProblem) console.error("[pausa]", pause.configProblem);
    return pause;
  } catch (err: any) {
    console.error("[pausa] No se pudo leer el estado de pausa; se asume pausado:", err?.message ?? err);
    return {
      aiRepliesPaused: true,
      outboundPaused: true,
      since: null,
      reason: "No se pudo leer el estado de pausa.",
      readError: String(err?.message ?? err),
    };
  }
}

export class AutomationPausedError extends Error {
  constructor(message = "Los envíos automáticos están en pausa general. Se reanudan desde Configuración → Pausa general.") {
    super(message);
    this.name = "AutomationPausedError";
  }
}

/** Corta un envío automático si la pausa general está activa. */
export async function assertOutboundAllowed(): Promise<void> {
  const pause = await getAutomationPause();
  if (pause.outboundPaused) throw new AutomationPausedError();
}
