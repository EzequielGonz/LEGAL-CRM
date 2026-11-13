-- 0609 · Índice para las cifras de una campaña (13/11, auditoría).
-- `campaign_metrics` contaba los mensajes de la campaña recorriendo toda la
-- tabla de mensajes; en producción llegó a quedarse sin tiempo
-- («canceling statement due to statement timeout» en la lista de campañas).
-- Repetible. No borra nada.
create index if not exists messages_campaign_saliente_idx
  on public.messages ((metadata->>'campaign_id'))
  where direction = 'saliente' and (metadata->>'campaign_id') is not null;
