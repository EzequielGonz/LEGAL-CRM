"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para Client Components (auth en el browser,
 * suscripciones realtime del Inbox, etc.)
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
