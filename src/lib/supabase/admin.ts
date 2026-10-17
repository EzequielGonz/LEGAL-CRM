import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con la service_role key: SOLO para usar en código de servidor que
 * corre sin sesión de usuario (webhooks entrantes de WhatsApp/Meta, cron de
 * campañas, el orquestador del agente IA). Nunca importar esto en un
 * Client Component ni exponerlo al browser.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      // Siempre datos frescos: sin esto, Next 14 puede guardar en su caché de
      // datos lecturas de la base (se vio en el entorno aislado: el brief de
      // marca guardado no volvía en la lectura siguiente). Las cachés
      // intencionales (marca, barra de salud) usan `unstable_cache` con su
      // propio vencimiento y etiqueta.
      global: { fetch: (entrada: RequestInfo | URL, init?: RequestInit) => fetch(entrada, { ...init, cache: "no-store" }) },
    }
  );
}
