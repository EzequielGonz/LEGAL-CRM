-- =====================================================================
-- Etapa 1 · Envíos seguros (1/2) — dos estados nuevos del destinatario
--  * 'enviando': reservado por una sola ejecución del motor de campañas.
--    Nadie más puede tomarlo mientras tanto.
--  * 'revisar':  no se sabe si Meta aceptó el mensaje (o Meta lo rechazó
--    por un motivo no clasificado). Nunca se reenvía solo: lo decide una
--    persona desde el detalle de la campaña.
-- Va sola en su archivo: PostgreSQL no permite usar un valor nuevo de un
-- tipo enumerado en la misma transacción en que se agrega. Solo agrega.
-- =====================================================================

alter type public.campaign_contact_status add value if not exists 'enviando';
alter type public.campaign_contact_status add value if not exists 'revisar';
