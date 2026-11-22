-- ---------------------------------------------------------------------
-- Arreglos 22/11 de captación, cifras y separación por rubro (rama
-- arreglos/captacion-y-cifras-2211). Solo AGREGA columnas e índices:
-- no cambia ni borra datos, no toca funciones existentes. Repetible
-- (if not exists). Sin datos personales. SIN APLICAR: la aplica el dueño.
--
-- 1) webhook_quarantine.rubro_id: perfil de la línea por la que llegó el
--    mensaje retenido. Cada panel muestra solo los suyos; los que quedan
--    sin rubro (anteriores a esta migración o de una línea sin asignar)
--    se ven únicamente en Jurídico, rotulados «sin perfil».
-- 2) capture_events.evidence_message_id: id del mensaje real de la persona
--    que respalda la captación (evita falsos captados con contestadores).
-- 3) push_subscriptions.rubro_id: de qué perfil recibe avisos cada
--    dispositivo. Sin rubro = recibe los de todos (dispositivos ya
--    registrados, hasta que se les asigne un perfil).
--
-- Reversión (manual, si hiciera falta; no hay datos que perder):
--   alter table public.webhook_quarantine drop column if exists rubro_id;
--   alter table public.capture_events drop column if exists evidence_message_id;
--   alter table public.push_subscriptions drop column if exists rubro_id;
-- ---------------------------------------------------------------------

set lock_timeout = '5s';

alter table public.webhook_quarantine
  add column if not exists rubro_id uuid references public.rubros(id);
create index if not exists webhook_quarantine_rubro_pending_idx
  on public.webhook_quarantine (rubro_id, received_at desc) where reviewed_at is null;

alter table public.capture_events
  add column if not exists evidence_message_id uuid references public.messages(id) on delete set null;
create index if not exists capture_events_evidence_message_idx
  on public.capture_events (evidence_message_id) where evidence_message_id is not null;

alter table public.push_subscriptions
  add column if not exists rubro_id uuid references public.rubros(id);

-- Las tablas ya tienen RLS activa y sin permisos para la clave pública
-- (migraciones 0101, 0203 y 0113); las columnas nuevas heredan eso.
