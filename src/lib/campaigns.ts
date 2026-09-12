import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppTemplate } from "@/lib/whatsapp/client";
import { findOrCreateConversation } from "@/lib/contacts";

/**
 * Motor de envío de campañas — modelo "a pasos" (tick-based).
 *
 * Por qué no es un loop síncrono: las funciones serverless de Vercel tienen
 * un tiempo máximo de ejecución (10-60s en plan Hobby, hasta 300s en Pro).
 * El ritmo que necesitamos para no generar bloqueos de WhatsApp — 1 mensaje
 * nuevo cada 1.5 minutos, en lotes de 10, con una pausa de 5 minutos entre
 * lote y lote — implica que una campaña real puede tardar horas en
 * terminar. Ninguna función serverless puede quedarse "despierta" tanto
 * tiempo dentro de una sola request.
 *
 * En cambio: cada invocación de `tickCampaign` manda COMO MÁXIMO un mensaje
 * (o ninguno, si todavía no le toca por el ritmo configurado) y guarda en la
 * fila de `campaigns` el estado necesario para saber cuándo le toca el
 * próximo (`last_sent_at`, `sent_in_batch`, `batch_paused_until`). Algo
 * externo (un cron gratuito que pega a `/api/campaigns/tick` cada 1 minuto,
 * ver docs/SETUP.md) es
