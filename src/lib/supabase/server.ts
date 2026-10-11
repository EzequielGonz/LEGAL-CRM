import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cliente de Supabase para Server Components y Route Handlers.
 *
 * Etapa 1 · bloque 1.1: las lecturas y escrituras del panel se hacen del
 * lado del servidor, después de que el middleware verificó la sesión (PIN).
 * La clave pública del navegador ya no tiene acceso a las tablas (RLS
 * cerrado), así que acá se usa la clave de servicio, que nunca sale del
 * servidor. No importar este archivo desde un Client Component.
 */
export function createClient() {
  return createAdminClient();
}
