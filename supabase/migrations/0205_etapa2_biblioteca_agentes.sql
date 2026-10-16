-- =====================================================================
-- Etapa 2 · Bloque 4 — Biblioteca de agentes (parche 2.0, sección 13)
-- SOLO configuración y vista: principal + cuatro derivados por rubro, con
-- herencia de límites, conocimiento separado y versiones.
--
--  * Todos quedan APAGADOS. La columna de estado no admite «activo»: para
--    usar un agente de la biblioteca hará falta otra migración autorizada.
--  * No reemplaza ni toca `ai_agents` (el agente que responde hoy) ni sus
--    prompts, que se conservan como historial de solo lectura.
--  * Sin simulador, evaluación, entrenamiento ni llamadas a proveedores
--    (Fase 3 pausada).
--
-- Repetible. Reversión: docs/etapa2/sql/revertir_0203_0207.sql.
-- =====================================================================

set lock_timeout = '5s';

create table if not exists public.agent_library (
  id uuid primary key default gen_random_uuid(),
  clave text not null unique check (clave in ('principal', 'juridico', 'coberturas_medicas', 'agencia_0km', 'marketing')),
  rol text not null check (rol in ('principal', 'derivado')),
  hereda_de text references public.agent_library(clave) on delete restrict,
  rubro_id uuid references public.rubros(id),
  nombre text not null check (length(btrim(nombre)) between 1 and 80),
  objetivo text not null default '' check (length(objetivo) <= 600),
  modos text[] not null default array['frio', 'consulta_actual', 'seguimiento'],
  limites text[] not null default '{}',
  -- Conocimiento propio del agente (separado del de los demás): temas,
  -- fuentes y fecha de revisión. Nunca datos de prospectos ni secretos.
  conocimiento jsonb not null default '[]'::jsonb,
  estado text not null default 'apagado' check (estado in ('apagado', 'borrador')),
  version integer not null default 1 check (version >= 1),
  updated_at timestamptz not null default now(),
  updated_by text not null default 'sistema',
  created_at timestamptz not null default now(),
  check ((rol = 'principal' and hereda_de is null and rubro_id is null) or (rol = 'derivado' and hereda_de = 'principal' and rubro_id is not null))
);

-- Historial de cada versión (solo se agregan filas).
create table if not exists public.agent_library_versions (
  id bigint generated always as identity primary key,
  clave text not null references public.agent_library(clave) on delete restrict,
  version integer not null,
  snapshot jsonb not null,
  motivo text,
  created_by text not null,
  created_at timestamptz not null default now(),
  unique (clave, version)
);

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'agent_library_no_delete') then
    create trigger agent_library_no_delete before delete on public.agent_library
      for each row execute function public.prevent_hard_delete();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'agent_library_versions_append_only') then
    create trigger agent_library_versions_append_only before update or delete on public.agent_library_versions
      for each row execute function public.prevent_row_changes('El historial de versiones solo admite agregar filas');
  end if;
end $$;

-- Carga inicial: nombres y objetivos generales (editables desde el panel).
insert into public.agent_library (clave, rol, hereda_de, rubro_id, nombre, objetivo, limites) values
  ('principal', 'principal', null, null, 'Agente principal',
   'Conocimientos y habilidades comerciales comunes: escuchar, preguntar de a una cosa, responder objeciones sin presión, proponer un próximo paso explícito y respetar un rechazo.',
   array['No hacerse pasar por una persona real', 'No negar que es una automatización si se lo preguntan', 'No inventar disponibilidad, urgencia, testimonios ni credenciales'])
on conflict (clave) do nothing;
insert into public.agent_library (clave, rol, hereda_de, rubro_id, nombre, objetivo, limites) values
  ('juridico', 'derivado', 'principal', '11111111-1111-1111-1111-111111111111', 'Agente Jurídico',
   'Ordenar la consulta, agendar la revisión (Fase 1) y obtener el relato (Fase 2); captar al aceptar el análisis y el contacto del profesional.',
   array['Sin indemnizaciones, resultados, viabilidad ni asesoramiento definitivo']),
  ('coberturas_medicas', 'derivado', 'principal', '33333333-3333-3333-3333-333333333333', 'Agente Coberturas médicas',
   'Entender la necesidad y conseguir la aceptación de continuar con el asesor.',
   array['Sin planes, precios, coberturas garantizadas ni elegibilidad']),
  ('agencia_0km', 'derivado', 'principal', '22222222-2222-2222-2222-222222222222', 'Agente Autos 0 km',
   'Entender el interés y conseguir la aceptación del contacto del vendedor.',
   array['Sin stock, cuotas, financiación ni fechas de entrega']),
  ('marketing', 'derivado', 'principal', '44444444-4444-4444-4444-444444444444', 'Agente Marketing',
   'Entender el proyecto o la necesidad y acordar un siguiente paso (análisis, presupuesto o reunión).',
   array['Sin precios, rangos, plazos ni retorno prometido'])
on conflict (clave) do nothing;

insert into public.agent_library_versions (clave, version, snapshot, motivo, created_by)
select a.clave, a.version, to_jsonb(a) - 'id', 'Carga inicial', 'migracion'
  from public.agent_library a
on conflict (clave, version) do nothing;

alter table public.agent_library enable row level security;
alter table public.agent_library_versions enable row level security;
revoke all on public.agent_library, public.agent_library_versions from anon, authenticated;
grant select, insert, update on public.agent_library to service_role;
grant select, insert on public.agent_library_versions to service_role;
