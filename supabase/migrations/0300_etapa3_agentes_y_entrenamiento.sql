-- =====================================================================
-- Etapa 3 · Agentes IA, entrenamiento, corpus, ajuste y comparación
-- (ACTUALIZACION_INTEGRAL_Y_ETAPA_3_CRM v1.0, capítulos 12 a 18)
--
-- Todo aditivo y repetible. NO cambia al agente que responde hoy
-- (`ai_agents` sigue igual), no activa modelos ni crea trabajos pagos.
--
--  * agent_library: suma instrucciones estables, modelo técnico por
--    defecto y estado de publicación (preparado / ajustado / publicado /
--    pausado). «activo» no existe: activar = asignación + PIN.
--  * agent_assignments: qué agente y versión responde en cada perfil/área
--    (vacío hasta que Vita lo decida; mientras tanto responde ai_agents).
--  * agent_modules: módulos del manual (comunes y por rubro), versionados.
--  * agent_requests: «Pedir mejora» en lenguaje natural.
--  * simulation_runs / simulation_turns: pruebas con datos sintéticos; el
--    simulador nunca escribe mensajes, citas ni captaciones reales.
--  * eval_cases / eval_results: casos de control (T, H, C, cap. 15) y
--    resultados por versión y modelo.
--  * training_cases / training_sets: corpus revisable con familias; el
--    reservado se congela.
--  * tuning_jobs: trabajo de ajuste trazable con límite de gasto; nunca se
--    crea sin autorización registrada.
--  * model_comparisons: comparación A/B/C/D con conjunto congelado.
--  * brand_briefs: brief de marca por perfil para contenido.
--  * landing_audits: auditorías de landings (solo lectura del sitio).
-- Reversión: docs/etapa3/sql/revertir_0300.sql.
-- =====================================================================

set lock_timeout = '5s';

-- ---------------------------------------------------------------------
-- 1) Biblioteca: instrucciones, modelo técnico y estado
-- ---------------------------------------------------------------------
alter table public.agent_library
  add column if not exists instrucciones text not null default '',
  add column if not exists modelo_proveedor text not null default 'gemini_api',
  add column if not exists modelo_identificador text,
  add column if not exists publicacion text not null default 'preparado',
  add column if not exists version_aprobada integer,
  add column if not exists ultima_evaluacion jsonb;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'agent_library_modelo_proveedor_check') then
    alter table public.agent_library add constraint agent_library_modelo_proveedor_check
      check (modelo_proveedor in ('gemini_api', 'vertex', 'simulado'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'agent_library_publicacion_check') then
    alter table public.agent_library add constraint agent_library_publicacion_check
      check (publicacion in ('preparado', 'ajustado', 'publicado', 'pausado'));
  end if;
end $$;
-- La biblioteca ya admite agentes nuevos creados desde el principal.
alter table public.agent_library drop constraint if exists agent_library_clave_check;
alter table public.agent_library add constraint agent_library_clave_check
  check (clave ~ '^[a-z0-9_]{2,40}$');
alter table public.agent_library drop constraint if exists agent_library_check;
alter table public.agent_library add constraint agent_library_check
  check ((rol = 'principal' and hereda_de is null) or (rol = 'derivado' and hereda_de is not null));
alter table public.agent_library add column if not exists creado_desde text;

-- ---------------------------------------------------------------------
-- 2) Asignaciones (perfil + área → agente + versión + modelo)
-- ---------------------------------------------------------------------
create table if not exists public.agent_assignments (
  id uuid primary key default gen_random_uuid(),
  rubro_id uuid not null references public.rubros(id),
  area text not null,
  agente_clave text not null references public.agent_library(clave),
  version integer not null,
  modelo_proveedor text not null default 'gemini_api' check (modelo_proveedor in ('gemini_api', 'vertex', 'simulado')),
  modelo_identificador text,
  -- apagada: ai_agents sigue respondiendo; activa: responde la biblioteca.
  estado text not null default 'apagada' check (estado in ('apagada', 'activa', 'pausada')),
  motivo text,
  created_by text not null default 'operador',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rubro_id, area)
);

-- ---------------------------------------------------------------------
-- 3) Módulos del manual y conocimiento por rubro (versionados)
-- ---------------------------------------------------------------------
create table if not exists public.agent_modules (
  id uuid primary key default gen_random_uuid(),
  clave text not null,
  version integer not null default 1,
  tipo text not null check (tipo in ('instrucciones_comunes', 'modulo_comercial', 'conocimiento_rubro', 'ejemplo', 'prueba')),
  rubro_id uuid references public.rubros(id),
  titulo text not null,
  contenido text not null,
  -- Capítulos del manual 0.6 o del Word de Etapa 3 de donde sale.
  referencia text,
  -- Cuándo se recupera: modos y señales (p. ej. {"modos":["frio"],"senales":["objecion"]}).
  pertinencia jsonb not null default '{}'::jsonb,
  vigente boolean not null default true,
  revisado_at date,
  created_at timestamptz not null default now(),
  unique (clave, version)
);
create index if not exists agent_modules_tipo_idx on public.agent_modules (tipo, rubro_id) where vigente;

create table if not exists public.agent_requests (
  id uuid primary key default gen_random_uuid(),
  agente_clave text not null references public.agent_library(clave),
  pedido text not null check (length(btrim(pedido)) between 3 and 2000),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_curso', 'resuelto', 'descartado')),
  resolucion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4) Simulador (datos sintéticos; sin efectos de producción)
-- ---------------------------------------------------------------------
create table if not exists public.simulation_runs (
  id uuid primary key default gen_random_uuid(),
  agente_clave text not null references public.agent_library(clave),
  version integer not null,
  rubro_id uuid references public.rubros(id),
  area text not null,
  modo text not null check (modo in ('frio', 'consulta_actual', 'seguimiento')),
  -- Variante de contexto: A actual observado, B revisado, C candidato base, D ajustado.
  variante text not null default 'B' check (variante in ('A', 'B', 'C', 'D')),
  modelo_proveedor text not null,
  modelo_identificador text,
  caso_id text,
  hechos jsonb not null default '{}'::jsonb,
  estado text not null default 'en_curso' check (estado in ('en_curso', 'terminada', 'error')),
  resumen jsonb not null default '{}'::jsonb,
  tokens_entrada integer not null default 0,
  tokens_salida integer not null default 0,
  costo_estimado numeric(10,4),
  created_by text not null default 'operador',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.simulation_turns (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.simulation_runs(id) on delete restrict,
  orden integer not null,
  rol text not null check (rol in ('prospecto', 'asesor', 'herramienta', 'sistema')),
  texto text,
  acciones jsonb not null default '[]'::jsonb,
  datos jsonb not null default '{}'::jsonb,
  validacion jsonb not null default '{}'::jsonb,
  -- Corrección del revisor: respuesta correcta y si se guarda como ejemplo candidato.
  correccion text,
  ejemplo_candidato boolean not null default false,
  created_at timestamptz not null default now(),
  unique (run_id, orden)
);

-- ---------------------------------------------------------------------
-- 5) Evaluación: casos de control y resultados
-- ---------------------------------------------------------------------
create table if not exists public.eval_cases (
  id text primary key, -- T01…, H01…, C01…, W01… (cap. 15)
  familia text not null,
  rubro_id uuid references public.rubros(id),
  area text,
  modo text not null check (modo in ('frio', 'consulta_actual', 'seguimiento')),
  titulo text not null,
  hechos jsonb not null default '{}'::jsonb,
  mensajes jsonb not null default '[]'::jsonb,
  -- Qué tiene que pasar: estados, acciones, prohibiciones.
  esperado jsonb not null default '{}'::jsonb,
  regla text,
  procedencia text not null default 'original',
  reservado boolean not null default false,
  congelado_at timestamptz,
  vigente boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.eval_results (
  id bigint generated always as identity primary key,
  case_id text not null references public.eval_cases(id),
  agente_clave text not null,
  version integer not null,
  variante text not null,
  modelo_identificador text,
  run_id uuid references public.simulation_runs(id),
  -- Controles deterministas (aprobado/fallo por control), rúbricas y fallos críticos.
  controles jsonb not null default '{}'::jsonb,
  comercial smallint check (comercial between 0 and 16),
  naturalidad smallint check (naturalidad between 0 and 14),
  fallos_criticos text[] not null default '{}',
  evaluador text not null default 'determinista',
  created_at timestamptz not null default now()
);
create index if not exists eval_results_idx on public.eval_results (agente_clave, version, variante, created_at);

-- ---------------------------------------------------------------------
-- 6) Corpus de ajuste supervisado
-- ---------------------------------------------------------------------
create table if not exists public.training_sets (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  objetivo text,
  -- piloto / completo
  alcance text not null default 'piloto' check (alcance in ('piloto', 'completo')),
  congelado_at timestamptz,
  hash_corpus text,
  created_at timestamptz not null default now()
);
create table if not exists public.training_cases (
  id uuid primary key default gen_random_uuid(),
  set_id uuid references public.training_sets(id),
  clave text not null unique,
  familia text not null,
  rubro_id uuid references public.rubros(id),
  area text not null,
  rol text not null default 'derivado',
  modo text not null check (modo in ('frio', 'consulta_actual', 'seguimiento')),
  -- entrenamiento / validacion / reservado: una familia nunca está en dos lados.
  particion text not null check (particion in ('entrenamiento', 'validacion', 'reservado')),
  hechos jsonb not null default '{}'::jsonb,
  -- [{rol: prospecto|asesor|herramienta, texto, acciones?}]
  mensajes jsonb not null default '[]'::jsonb,
  herramientas jsonb not null default '[]'::jsonb,
  respuesta_correcta text not null,
  estado_esperado jsonb not null default '{}'::jsonb,
  regla text,
  procedencia text not null default 'original' check (procedencia in ('original', 'simulador', 'real_anonimizada')),
  revision text not null default 'pendiente' check (revision in ('pendiente', 'aprobado', 'rechazado')),
  revisado_por text,
  revisado_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists training_cases_set_idx on public.training_cases (set_id, particion, familia);

-- ---------------------------------------------------------------------
-- 7) Ajuste y comparación (trazables; sin consumo hasta autorización)
-- ---------------------------------------------------------------------
create table if not exists public.tuning_jobs (
  id uuid primary key default gen_random_uuid(),
  objetivo text not null,
  set_id uuid not null references public.training_sets(id),
  hash_corpus text not null,
  agente_clave text not null,
  version_instrucciones integer not null,
  modelo_base text not null,
  proveedor text not null default 'vertex' check (proveedor in ('vertex')),
  proyecto_gcp text,
  region text,
  parametros jsonb not null default '{}'::jsonb,
  estimacion_usd numeric(10,2),
  limite_usd numeric(10,2),
  -- Autorización registrada ANTES de crear el trabajo en el proveedor.
  autorizado_por text,
  autorizado_at timestamptz,
  estado text not null default 'preparado' check (estado in (
    'preparado', 'autorizado', 'enviando', 'en_curso', 'completado', 'fallido', 'cancelacion_pedida', 'cancelado', 'rechazado_evaluacion', 'aprobado')),
  proveedor_job_id text unique,
  modelo_resultado text,
  endpoint_resultado text,
  resultado jsonb not null default '{}'::jsonb,
  diagnostico text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.model_comparisons (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  set_reservado uuid references public.training_sets(id),
  casos text[] not null default '{}',
  -- {"A": {...}, "B": {...}, "C": {...}, "D": {...}} con totales por rol y fallos críticos.
  resultados jsonb not null default '{}'::jsonb,
  umbral_comercial smallint not null default 14,
  umbral_preferencia smallint not null default 60,
  decision text,
  decidido_por text,
  congelado_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 8) Contenido: brief de marca y auditorías de landings
-- ---------------------------------------------------------------------
create table if not exists public.brand_briefs (
  rubro_id uuid primary key references public.rubros(id),
  nombre_publico text,
  logo_ref text,
  colores jsonb not null default '{}'::jsonb,
  servicios text[] not null default '{}',
  publico text,
  zonas text,
  tono text,
  contacto jsonb not null default '{}'::jsonb,
  web text,
  objetivos text,
  afirmaciones_autorizadas text[] not null default '{}',
  prohibido text[] not null default '{}',
  completo boolean not null default false,
  updated_at timestamptz not null default now()
);
create table if not exists public.landing_audits (
  id uuid primary key default gen_random_uuid(),
  rubro_id uuid references public.rubros(id),
  url text not null,
  resultado jsonb not null default '{}'::jsonb,
  problemas jsonb not null default '[]'::jsonb,
  puntaje smallint,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 9) Registro de accesos (acciones con PIN de esta etapa)
-- ---------------------------------------------------------------------
alter table public.access_events drop constraint if exists access_events_kind_check;
alter table public.access_events add constraint access_events_kind_check check (kind in (
  'ingreso', 'ingreso_fallido', 'bloqueo_origen', 'intento_bloqueado', 'salida',
  'cambio_pin', 'cambio_pin_fallido', 'recuperacion_pin', 'pin_inicial',
  'cierre_todas_sesiones', 'pausa_general', 'seguimiento_automatico',
  'atencion_entrante_24h', 'biblioteca_agentes', 'politica_publicacion',
  'asignacion_agente', 'ajuste_autorizado', 'ejecutor_tareas'));

-- Pausa general: ejecutor de tareas de cita y contenido (apagado por defecto).
-- Se lee como system_settings.tareas_servidor = {"citas": false, "contenido": false}.
insert into public.system_settings (key, value)
values ('tareas_servidor', '{"citas": false, "contenido": false}'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- 10) Sin borrados, RLS y permisos
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['agent_assignments', 'agent_modules', 'simulation_runs', 'simulation_turns', 'eval_cases', 'eval_results',
                           'training_sets', 'training_cases', 'tuning_jobs', 'model_comparisons', 'brand_briefs', 'landing_audits', 'agent_requests'] loop
    if not exists (select 1 from pg_trigger where tgname = t || '_no_delete') then
      execute format('create trigger %I before delete on public.%I for each row execute function public.prevent_hard_delete()', t || '_no_delete', t);
    end if;
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update on public.%I to service_role', t);
  end loop;
end $$;
