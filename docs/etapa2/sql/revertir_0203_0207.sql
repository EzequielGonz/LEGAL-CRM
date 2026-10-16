-- =====================================================================
-- Reversión de 0203–0206 (Etapa 2, bloques 1 a 5). 0207 no se revierte:
-- solo quita permisos públicos y fija search_path (dejarlo es lo seguro).
--
-- PRIMERO volver el código a la versión anterior (Instant Rollback en
-- Vercel): el código nuevo usa estas tablas y columnas.
--
-- Se DETIENE sin tocar nada si ya hay datos de estos bloques (nada se
-- borra: en ese caso se decide con la responsable qué conservar).
-- Después de revertir, 0203–0207 se pueden volver a aplicar sin errores.
-- =====================================================================

set lock_timeout = '5s';

do $$
declare v_motivo text;
begin
  select string_agg(m, '; ') into v_motivo from (
    select 'capture_events: ' || count(*) m from public.capture_events having count(*) > 0
    union all select 'cita_tareas: ' || count(*) from public.cita_tareas having count(*) > 0
    union all select 'citas de IA: ' || count(*) from public.appointments where kind = 'ia' having count(*) > 0
    union all select 'resultados posteriores: ' || count(*) from public.opportunities where post_derivation_state is not null having count(*) > 0
    union all select 'fuentes acreditadas: ' || count(*) from public.opportunities where first_source is not null having count(*) > 0
    union all select 'mensajes con origen: ' || count(*) from public.messages where origin is not null having count(*) > 0
    union all select 'piezas de contenido: ' || count(*) from public.content_pieces having count(*) > 0
    union all select 'pedidos de contenido: ' || count(*) from public.content_requests having count(*) > 0
    union all select 'versiones editadas de agentes: ' || count(*) from public.agent_library_versions where version > 1 having count(*) > 0
    union all select 'conexiones de Search Console: ' || count(*) from public.search_console_connections having count(*) > 0
  ) x;
  if v_motivo is not null then
    raise exception 'No se revierte: ya hay datos de la Etapa 2 (%). Nada se borró.', v_motivo;
  end if;
end $$;

-- 0206 · contenido y SEO
drop function if exists public.content_claim(uuid, uuid);
drop table if exists public.content_results;
drop table if exists public.content_publish_attempts;
drop table if exists public.content_pieces;
drop table if exists public.content_requests;
drop table if exists public.content_policies;
drop table if exists public.search_console_connections;

-- 0205 · biblioteca de agentes
drop table if exists public.agent_library_versions;
drop table if exists public.agent_library;

-- 0204 · operación diaria
drop trigger if exists imported_base_rows_base_text on public.imported_base_rows;
drop function if exists public.imported_base_rows_base_text();
drop function if exists public.contact_base_text_refresh(uuid);
alter table public.contacts drop column if exists base_text;
alter table public.conversations drop column if exists text_request_at;
alter table public.rubros drop column if exists source_identifiers;
alter table public.opportunities drop constraint if exists opportunities_first_source_check;
drop index if exists public.opportunities_first_source_idx;
alter table public.opportunities
  drop column if exists first_source,
  drop column if exists first_source_detail,
  drop column if exists first_source_at;

-- 0203 · reglas de base y captación
drop function if exists public.capture_register(uuid, text, text, jsonb, text);
drop table if exists public.cita_tareas;
drop index if exists public.appointments_reschedule_once;
alter table public.appointments drop constraint if exists appointments_kind_check;
alter table public.appointments
  drop column if exists opportunity_id,
  drop column if exists reschedule_of,
  drop column if exists start_sent_at,
  drop column if exists start_message_id,
  drop column if exists kind;
drop table if exists public.capture_notices;
drop table if exists public.capture_events;
alter table public.opportunity_events drop constraint if exists opportunity_events_dimension_check;
alter table public.opportunity_events add constraint opportunity_events_dimension_check check (dimension in (
  'contacto', 'captacion', 'seguimiento', 'atencion', 'derivacion', 'ficha', 'detencion', 'revision'));
drop index if exists public.opportunities_post_derivation_idx;
drop index if exists public.opportunities_attention_idx;
alter table public.opportunities drop constraint if exists opportunities_post_derivation_state_check;
alter table public.opportunities drop constraint if exists opportunities_post_derivation_source_check;
alter table public.opportunities drop constraint if exists opportunities_location_zone_check;
alter table public.opportunities drop constraint if exists opportunities_attention_category_check;
alter table public.opportunities drop constraint if exists opportunities_legal_route_check;
alter table public.opportunities
  drop column if exists post_derivation_state,
  drop column if exists post_derivation_at,
  drop column if exists post_derivation_source,
  drop column if exists post_derivation_reason,
  drop column if exists post_derivation_note,
  drop column if exists post_derivation_contact_expected_at,
  drop column if exists capture_warnings,
  drop column if exists location_zone,
  drop column if exists attention_category,
  drop column if exists attention_reason,
  drop column if exists legal_route;
alter table public.rubros drop column if exists inbound_24h_enabled, drop column if exists capture_notice_recipients;
alter table public.messages drop constraint if exists messages_origin_check;
alter table public.messages drop column if exists origin;
-- Registro de accesos: vuelve a la lista de 0201 (si no hay eventos nuevos).
do $$ begin
  if not exists (select 1 from public.access_events where kind in ('atencion_entrante_24h', 'biblioteca_agentes', 'politica_publicacion')) then
    alter table public.access_events drop constraint if exists access_events_kind_check;
    alter table public.access_events add constraint access_events_kind_check check (kind in (
      'ingreso', 'ingreso_fallido', 'bloqueo_origen', 'intento_bloqueado', 'salida',
      'cambio_pin', 'cambio_pin_fallido', 'recuperacion_pin', 'pin_inicial',
      'cierre_todas_sesiones', 'pausa_general', 'seguimiento_automatico'));
  end if;
end $$;
