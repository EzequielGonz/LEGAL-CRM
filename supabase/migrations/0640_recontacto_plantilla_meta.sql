-- ---------------------------------------------------------------------
-- 22/11 · Recontacto de las 72 h por plantilla de Meta (rama
-- captacion/recontacto-plantillas-y-gravedad). SIN APLICAR: la aplica el dueño.
--
-- Aditiva y repetible: no borra ni cambia filas existentes. Sin datos personales.
--
-- 1) Plantillas: nuevo propósito «recontacto» (contacto 2 fuera de la ventana
--    de 24 h de Meta). Se configura por línea en Plantillas, como los demás.
-- 2) followup_tasks.canal: marca la tarea que sale (o pudo salir) con la
--    plantilla de recontacto. Índice único: una misma persona no puede tener
--    dos recontactos por plantilla enviados, enviándose o inciertos en el mismo
--    perfil (nunca dos veces, aunque corran dos latidos a la vez).
-- 3) Asignación inicial: en cada línea de Meta activa se asigna para
--    «recontacto» la plantilla APROBADA que ya tiene para el contacto 2
--    («seguimiento»), con las mismas variables. Son las de hoy
--    (jur_/cob_/autos_/mkt_seguimiento_2): cortas, sin precios y con el botón
--    «No me escriban más». Si una línea no tiene contacto 2 aprobado, queda
--    sin plantilla de recontacto y no sale nada por ella.
-- 4) Encendido: clave `recontacto_plantilla_meta` en system_settings, con los
--    cuatro perfiles encendidos por Meta. Si la clave ya existe, no se toca.
--
-- Cómo apagarlo (sin borrar nada), por perfil:
--   update public.system_settings
--      set value = jsonb_set(value, '{juridico,activo}', 'false'::jsonb), updated_at = now()
--    where key = 'recontacto_plantilla_meta';
-- Apagado, el contacto 2 sale exactamente como antes del 22/11.
--
-- Reversión (manual, si hiciera falta):
--   update public.template_assignments set active = false, deactivated_at = now()
--    where purpose = 'recontacto' and active;
--   update public.system_settings set value = '{}'::jsonb where key = 'recontacto_plantilla_meta';
--   (la columna `canal` y el índice pueden quedar: sin la clave encendida no se usan)
-- ---------------------------------------------------------------------

set lock_timeout = '5s';

-- 1) Propósito «recontacto».
alter table public.template_assignments drop constraint if exists template_assignments_purpose_check;
alter table public.template_assignments add constraint template_assignments_purpose_check
  check (purpose in ('campana', 'seguimiento', 'seguimiento_3', 'recontacto', 'reagendamiento', 'inicio_cita', 'aviso_interno', 'formulario'));

-- 2) Marca de canal y «una sola vez por persona».
alter table public.followup_tasks add column if not exists canal text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'followup_tasks_canal_check') then
    alter table public.followup_tasks add constraint followup_tasks_canal_check
      check (canal is null or canal in ('plantilla_recontacto'));
  end if;
end $$;
create unique index if not exists followup_tasks_recontacto_una_vez
  on public.followup_tasks (rubro_id, contact_id)
  where canal = 'plantilla_recontacto' and status in ('enviando', 'enviada', 'a_revisar');
create index if not exists followup_tasks_recontacto_linea_dia
  on public.followup_tasks (line_id, sent_at)
  where canal = 'plantilla_recontacto' and status = 'enviada';

-- 3) Asignación inicial: la plantilla aprobada del contacto 2 de cada línea.
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

-- 4) Encendido por perfil (solo si todavía no existe la clave).
insert into public.system_settings (key, value, updated_by)
values ('recontacto_plantilla_meta', jsonb_build_object(
  'juridico', jsonb_build_object('activo', true, 'via', 'meta_plantilla'),
  'coberturas_medicas', jsonb_build_object('activo', true, 'via', 'meta_plantilla'),
  'agencia_0km', jsonb_build_object('activo', true, 'via', 'meta_plantilla'),
  'marketing', jsonb_build_object('activo', true, 'via', 'meta_plantilla'),
  'desde', now()
), 'migracion_0640')
on conflict (key) do nothing;
