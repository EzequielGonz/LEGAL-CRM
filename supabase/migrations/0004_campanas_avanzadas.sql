-- =====================================================================
-- Fase 2 del plan: velocidad/límite de envío configurables por campaña.
-- =====================================================================

alter table campaigns add column send_delay_seconds int not null default 2;
alter table campaigns add column daily_send_limit int; -- null = sin límite
