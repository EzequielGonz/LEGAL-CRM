-- ---------------------------------------------------------------------
-- 22/11 · Recontacto de las 72 h por plantilla de Meta (rama
-- captacion/recontacto-plantillas-y-gravedad). SIN APLICAR: la aplica el dueño.
--
-- Aditiva y repetible (todo en una transacción): no borra ni cambia filas existentes.
-- Sin datos personales. Sin permisos nuevos: la columna es de una tabla que ya tiene RLS y
-- sin acceso para la clave pública; la función solo la ejecuta la clave de servicio.
--
-- Regla (decisión del director, 22/11): el recontacto por plantilla sale UNA vez por oportunidad
-- (ya lo garantiza `followup_tasks_step_once`) y como MÁXIMO UNA por teléfono cada 30 días dentro
-- del rubro. Si ya recibió en los últimos 30 días, la tarea se cancela con motivo y la
-- oportunidad NO pasa a «caído». La ventana de 30 días se aplica en código y dentro de la
-- función `followup_recontacto_reservar` (un índice único no puede tener ventana de tiempo).
--
-- 1) Plantillas: nuevo propósito «recontacto» (contacto 2 fuera de la ventana
--    de 24 h de Meta). Se configura por línea en Plantillas, como los demás.
-- 2) followup_tasks.canal marca la tarea que sale (o pudo salir) con la plantilla de
--    recontacto; followup_tasks.telefono_clave guarda el teléfono normalizado (54 + 9 + área +
--    abonado) para comparar personas aunque estén en dos contactos o con/sin el «9».
--    Índice único por OPORTUNIDAD (no perpetuo por persona).
-- 3) Función `followup_recontacto_reservar`: candado por teléfono (advisory lock) y por
--    rubro; dentro del candado comprueba la ventana de 30 días y el tope diario del rubro, y
--    deja la marca. Dos latidos simultáneos no pueden mandarle a la misma persona.
-- 4) Asignación inicial: en cada línea de Meta activa se asigna para
--    «recontacto» la plantilla APROBADA que ya tiene para el contacto 2
--    («seguimiento»), con las mismas variables. Son las de hoy
--    (jur_/cob_/autos_/mkt_seguimiento_2): cortas, sin precios y con el botón
--    «No me escriban más». Si una línea no tiene contacto 2 aprobado, queda
--    sin plantilla de recontacto y no sale nada por ella.
-- 5) Encendido: clave `recontacto_plantilla_meta` en system_settings. SOLO Jurídico queda
--    encendido; Coberturas, Autos 0 km y Marketing quedan apagados (activo=false) hasta que
--    el dueño los encienda. `max_dia` = tope de recontactos por plantilla por día y por perfil
--    (40 por defecto). Si la clave ya existe, no se toca.
--
-- Cómo encender otro perfil / apagar uno (sin borrar nada):
--   update public.system_settings
--      set value = jsonb_set(value, '{coberturas_medicas,activo}', 'true'::jsonb), updated_at = now()
--    where key = 'recontacto_plantilla_meta';
--   (cambiar a 'false' para apagar; perfiles: juridico, coberturas_medicas, agencia_0km, marketing)
-- Apagado, el contacto 2 sale exactamente como antes del 22/11.
--
-- Reversión (manual, si hiciera falta):
--   update public.template_assignments set active = false, deactivated_at = now()
--    where purpose = 'recontacto' and active;
--   update public.system_settings set value = '{}'::jsonb where key = 'recontacto_plantilla_meta';
--   (la columna, el índice y la función pueden quedar: sin la clave encendida no se usan)
-- ---------------------------------------------------------------------

begin;

set local lock_timeout = '5s';

-- 1) Propósito «recontacto».
alter table public.template_assignments drop constraint if exists template_assignments_purpose_check;
alter table public.template_assignments add constraint template_assignments_purpose_check
  check (purpose in ('campana', 'seguimiento', 'seguimiento_3', 'recontacto', 'reagendamiento', 'inicio_cita', 'aviso_interno', 'formulario'));

-- 2) Marca de canal, clave de teléfono e índices.
alter table public.followup_tasks add column if not exists canal text;
alter table public.followup_tasks add column if not exists telefono_clave text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'followup_tasks_canal_check') then
    alter table public.followup_tasks add constraint followup_tasks_canal_check
      check (canal is null or canal in ('plantilla_recontacto'));
  end if;
end $$;
-- Antes de esta versión el índice era perpetuo por (rubro, contacto): se reemplaza por uno por oportunidad.
drop index if exists public.followup_tasks_recontacto_una_vez;
create unique index if not exists followup_tasks_recontacto_por_oportunidad
  on public.followup_tasks (opportunity_id)
  where canal = 'plantilla_recontacto' and status in ('enviando', 'enviada', 'a_revisar');
create index if not exists followup_tasks_recontacto_telefono
  on public.followup_tasks (rubro_id, telefono_clave, sent_at)
  where canal = 'plantilla_recontacto';
create index if not exists followup_tasks_recontacto_linea_dia
  on public.followup_tasks (line_id, sent_at)
  where canal = 'plantilla_recontacto' and status = 'enviada';

-- 2b) Reserva con candado: ventana de 30 días por teléfono y tope diario por rubro.
-- Devuelve 'ok', 'ya_recibio', 'tope_dia' o 'reserva_perdida'. Hay que llamarla con la tarea ya
-- reservada (status 'enviando' y su token).
create or replace function public.followup_recontacto_reservar(
  p_task uuid,
  p_token uuid,
  p_clave text,
  p_desde timestamptz,
  p_max_dia integer default null,
  p_desde_dia timestamptz default null
)
returns text
language plpgsql
set search_path = public
as $$
declare
  v_rubro uuid;
begin
  select t.rubro_id into v_rubro
    from public.followup_tasks t
   where t.id = p_task and t.status = 'enviando' and t.claim_token = p_token;
  if not found then
    return 'reserva_perdida';
  end if;
  if p_clave is null or p_clave = '' then
    return 'ya_recibio';
  end if;

  -- Un candado por rubro y teléfono, otro por rubro (tope diario). Se toman siempre en el mismo orden.
  perform pg_advisory_xact_lock(hashtextextended('recontacto-dia:' || v_rubro::text, 0));
  perform pg_advisory_xact_lock(hashtextextended('recontacto-tel:' || v_rubro::text || ':' || p_clave, 0));

  if exists (
    select 1 from public.followup_tasks o
     where o.rubro_id = v_rubro
       and o.telefono_clave = p_clave
       and o.canal = 'plantilla_recontacto'
       and o.status in ('enviando', 'enviada', 'a_revisar')
       and o.id <> p_task
       and coalesce(o.sent_at, o.claimed_at, o.updated_at) >= p_desde
  ) then
    return 'ya_recibio';
  end if;

  if p_max_dia is not null and p_desde_dia is not null and (
    select count(*) from public.followup_tasks o
     where o.rubro_id = v_rubro
       and o.canal = 'plantilla_recontacto'
       and o.status in ('enviando', 'enviada', 'a_revisar')
       and o.id <> p_task
       and coalesce(o.sent_at, o.claimed_at, o.updated_at) >= p_desde_dia
  ) >= p_max_dia then
    return 'tope_dia';
  end if;

  update public.followup_tasks
     set canal = 'plantilla_recontacto', telefono_clave = p_clave, updated_at = now()
   where id = p_task and status = 'enviando' and claim_token = p_token;
  if not found then
    return 'reserva_perdida';
  end if;
  return 'ok';
exception
  when unique_violation then
    -- Ya hay un recontacto de esta misma oportunidad (índice por oportunidad).
    return 'ya_recibio';
end;
$$;

revoke all on function public.followup_recontacto_reservar(uuid, uuid, text, timestamptz, integer, timestamptz) from public, anon, authenticated;
grant execute on function public.followup_recontacto_reservar(uuid, uuid, text, timestamptz, integer, timestamptz) to service_role;

-- 4) Asignación inicial: la plantilla aprobada del contacto 2 de cada línea.
insert into public.template_assignments (rubro_id, line_id, purpose, template_id, variable_sources, active, note)
select a.rubro_id, a.line_id, 'recontacto', a.template_id, a.variable_sources, true,
       '22/11: recontacto de las 72 h; misma plantilla aprobada que el contacto 2'
  from public.template_assignments a
  join public.profile_lines l on l.id = a.line_id and l.active
  join public.whatsapp_templates t on t.id = a.template_id
 where a.purpose = 'seguimiento'
   and a.active
   and t.status = 'APPROVED'
   and t.missing_since is null
   and not exists (
     select 1 from public.template_assignments r
      where r.line_id = a.line_id and r.purpose = 'recontacto' and r.active
   )
   -- Si una línea tuviera más de una, se toma la más reciente.
   and a.created_at = (
     select max(a2.created_at) from public.template_assignments a2
      where a2.line_id = a.line_id and a2.purpose = 'seguimiento' and a2.active
   );

-- 5) Encendido por perfil (solo si todavía no existe la clave): SOLO Jurídico.
insert into public.system_settings (key, value, updated_by)
values ('recontacto_plantilla_meta', jsonb_build_object(
  'juridico', jsonb_build_object('activo', true, 'via', 'meta_plantilla', 'max_dia', 40),
  'coberturas_medicas', jsonb_build_object('activo', false, 'via', 'meta_plantilla', 'max_dia', 40),
  'agencia_0km', jsonb_build_object('activo', false, 'via', 'meta_plantilla', 'max_dia', 40),
  'marketing', jsonb_build_object('activo', false, 'via', 'meta_plantilla', 'max_dia', 40),
  'desde', now()
), 'migracion_0640')
on conflict (key) do nothing;

commit;
