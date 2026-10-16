-- =====================================================================
-- Etapa 3 · Comparación de agentes A/B/C en conversaciones reales (16/10)
--
--  * agent_experiments: un experimento de 4 semanas (estado, alcance y
--    fechas). Arrancarlo y detenerlo pide PIN; mientras no está en curso no
--    cambia nada de cómo responde el agente.
--  * agent_experiment_candidates: A (bot actual, modelo anterior), B
--    (manual + biblioteca, Gemini 3.8 Flash) y C (modelo ajustado en
--    Vertex). Cada uno con proveedor, modelo, contexto y tarifa por millón.
--  * agent_experiment_assignments: una oportunidad = un candidato, fijo
--    durante todo el experimento (único por experimento y oportunidad),
--    con el estrato (perfil | fuente | frío o actual) que se usó para
--    equilibrar.
--  * agent_turn_logs: cada turno de IA (candidato, modelo informado por el
--    proveedor, tokens, costo, demora y resultado). Sirve para costo y para
--    comprobar que cada candidato usa el modelo que le toca.
--  * agent_experiment_reports: informes de los días 7, 14, 21 y 28 (uno por
--    día), generados por el servidor aunque nadie tenga el panel abierto.
--  * agent_experiment_votes: un voto por informe.
--  * agent_incidents: fallos (fatal / grave / leve). Un fatal detiene al
--    candidato afectado.
--  * template_evaluations: evaluación de las plantillas por cada modelo.
--
-- Aditivo y repetible. Sin borrados (prevent_hard_delete) y sin acceso
-- para la clave pública. Reversión: docs/etapa3/sql/revertir_0310.sql.
-- =====================================================================

set lock_timeout = '5s';

create table if not exists public.agent_experiments (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  estado text not null default 'preparado'
    check (estado in ('preparado', 'en_curso', 'finalizado', 'cancelado')),
  semanas smallint not null default 4 check (semanas between 1 and 12),
  -- {"perfiles": ["juridico", ...], "canales": ["entrante", "campana", "base_fria"]}
  alcance jsonb not null default '{}'::jsonb,
  inicio_at timestamptz,
  fin_at timestamptz,
  -- Ganador aplicado al cierre (letra) y versión anterior conservada.
  ganador text,
  ganador_aplicado_at timestamptz,
  configuracion_anterior jsonb,
  creado_por text not null default 'operador',
  motivo_cierre text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Un solo experimento en curso a la vez.
create unique index if not exists agent_experiments_uno_en_curso
  on public.agent_experiments ((true)) where estado = 'en_curso';

create table if not exists public.agent_experiment_candidates (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.agent_experiments(id),
  letra text not null check (letra in ('A', 'B', 'C')),
  nombre text not null,
  descripcion text,
  proveedor text not null check (proveedor in ('gemini_api', 'vertex', 'simulado')),
  -- Identificador del modelo (gemini-3.6-flash, gemini-3.8-flash) o
  -- recurso del endpoint ajustado de Vertex (projects/../endpoints/..).
  modelo text,
  -- actual: prompt de ai_agents como hoy; biblioteca: manual + módulos.
  contexto text not null check (contexto in ('actual', 'biblioteca')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'listo', 'detenido')),
  listo_at timestamptz,
  detenido_at timestamptz,
  detenido_motivo text,
  -- Tarifa en USD por millón de tokens (null = sin tarifa cargada: el costo
  -- se informa como «sin dato», nunca se inventa).
  precio_entrada_millon numeric(10,4),
  precio_salida_millon numeric(10,4),
  tuning_job_id uuid references public.tuning_jobs(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (experiment_id, letra)
);

create table if not exists public.agent_experiment_assignments (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.agent_experiments(id),
  opportunity_id uuid not null references public.opportunities(id),
  rubro_id uuid not null references public.rubros(id),
  candidato text not null check (candidato in ('A', 'B', 'C')),
  estrato text not null,
  canal text not null check (canal in ('entrante', 'campana', 'base_fria')),
  asignado_at timestamptz not null default now(),
  unique (experiment_id, opportunity_id)
);
create index if not exists agent_exp_assign_estrato_idx
  on public.agent_experiment_assignments (experiment_id, estrato, candidato, asignado_at);
create index if not exists agent_exp_assign_cand_idx
  on public.agent_experiment_assignments (experiment_id, candidato, rubro_id);

create table if not exists public.agent_turn_logs (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid references public.agent_experiments(id),
  candidato text check (candidato in ('A', 'B', 'C')),
  opportunity_id uuid references public.opportunities(id),
  conversation_id uuid references public.conversations(id),
  rubro_id uuid references public.rubros(id),
  proveedor text not null,
  modelo_pedido text not null,
  -- Modelo que informó el proveedor en la respuesta (modelVersion).
  modelo_respuesta text,
  llamadas smallint not null default 0,
  tokens_entrada integer not null default 0,
  tokens_salida integer not null default 0,
  tokens_razonamiento integer not null default 0,
  costo_usd numeric(12,6),
  latencia_ms integer,
  herramientas text[] not null default '{}',
  resultado text not null check (resultado in ('enviado', 'retenido', 'sin_texto', 'bloqueado', 'error')),
  validador_motivos text[] not null default '{}',
  error text,
  -- Uso del modelo fuera de la conversación (análisis de Marketing, plantillas).
  uso text not null default 'conversacion' check (uso in ('conversacion', 'analisis', 'evaluacion_plantillas')),
  created_at timestamptz not null default now()
);
create index if not exists agent_turn_logs_exp_idx on public.agent_turn_logs (experiment_id, candidato, created_at);
create index if not exists agent_turn_logs_opp_idx on public.agent_turn_logs (opportunity_id);

create table if not exists public.agent_experiment_reports (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null references public.agent_experiments(id),
  dia smallint not null check (dia in (7, 14, 21, 28)),
  desde timestamptz not null,
  hasta timestamptz not null,
  metricas jsonb not null default '{}'::jsonb,
  recomendacion jsonb not null default '{}'::jsonb,
  avisos text[] not null default '{}',
  generado_at timestamptz not null default now(),
  unique (experiment_id, dia)
);

create table if not exists public.agent_experiment_votes (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null unique references public.agent_experiment_reports(id),
  candidato text not null check (candidato in ('A', 'B', 'C')),
  votado_por text not null default 'operador',
  nota text,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_incidents (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid references public.agent_experiments(id),
  candidato text check (candidato in ('A', 'B', 'C')),
  gravedad text not null check (gravedad in ('fatal', 'grave', 'leve')),
  tipo text not null,
  detalle text not null,
  opportunity_id uuid references public.opportunities(id),
  conversation_id uuid references public.conversations(id),
  candidato_detenido boolean not null default false,
  resuelto_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists agent_incidents_exp_idx on public.agent_incidents (experiment_id, candidato, gravedad);

create table if not exists public.template_evaluations (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid references public.agent_experiments(id),
  candidato text check (candidato in ('A', 'B', 'C')),
  modelo text not null,
  plantilla text not null,
  rubro_slug text,
  proposito text,
  -- {"claridad":1-5,"cumplimiento":1-5,"tono":1-5,"respuesta_esperada":1-5,"riesgo":"bajo|medio|alto"}
  puntajes jsonb not null default '{}'::jsonb,
  comentario text,
  sugerencia text,
  created_at timestamptz not null default now()
);
create index if not exists template_evaluations_plantilla_idx on public.template_evaluations (plantilla, candidato);

-- Seguridad: RLS sin políticas (solo la clave de servicio), sin borrados.
do $$
declare t text;
begin
  foreach t in array array['agent_experiments', 'agent_experiment_candidates', 'agent_experiment_assignments', 'agent_turn_logs',
                           'agent_experiment_reports', 'agent_experiment_votes', 'agent_incidents', 'template_evaluations'] loop
    if not exists (select 1 from pg_trigger where tgname = t || '_no_delete') then
      execute format('create trigger %I before delete on public.%I for each row execute function public.prevent_hard_delete()', t || '_no_delete', t);
    end if;
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update on public.%I to service_role', t);
  end loop;
end $$;

-- Registro de accesos: acciones con PIN de este bloque.
alter table public.access_events drop constraint if exists access_events_kind_check;
alter table public.access_events add constraint access_events_kind_check check (kind in (
  'ingreso', 'ingreso_fallido', 'bloqueo_origen', 'intento_bloqueado', 'salida',
  'cambio_pin', 'cambio_pin_fallido', 'recuperacion_pin', 'pin_inicial',
  'cierre_todas_sesiones', 'pausa_general', 'seguimiento_automatico',
  'atencion_entrante_24h', 'biblioteca_agentes', 'politica_publicacion',
  'asignacion_agente', 'ajuste_autorizado', 'ejecutor_tareas',
  'experimento_agentes', 'extraccion_negocios', 'ejecutar_base', 'presupuesto'));

-- Experimento preparado (no corre hasta que se arranque con PIN).
insert into public.agent_experiments (nombre, estado, semanas, alcance)
select 'Comparación A/B/C · 4 semanas', 'preparado', 4,
       '{"perfiles": ["juridico", "coberturas_medicas", "agencia_0km", "marketing"], "canales": ["entrante", "campana", "base_fria"]}'::jsonb
where not exists (select 1 from public.agent_experiments);

insert into public.agent_experiment_candidates (experiment_id, letra, nombre, descripcion, proveedor, modelo, contexto, estado, listo_at, precio_entrada_millon, precio_salida_millon)
select e.id, c.letra, c.nombre, c.descripcion, c.proveedor, c.modelo, c.contexto, c.estado, case when c.estado = 'listo' then now() end, c.pe, c.ps
  from public.agent_experiments e
  cross join (values
    ('A', 'Bot actual', 'Prompt y herramientas de hoy (ai_agents) con su modelo anterior.', 'gemini_api', 'gemini-3.6-flash', 'actual', 'listo', null::numeric, null::numeric),
    ('B', 'Manual + biblioteca', 'Instrucciones comunes del manual, cuatro roles, ejemplos y biblioteca por rubro, fase y conversación; reglas esenciales siempre presentes.', 'gemini_api', 'gemini-3.8-flash', 'biblioteca', 'listo', 0.75, 3.75),
    ('C', 'Modelo ajustado', 'Gemini 3.5 Flash ajustado en Vertex con el corpus aprobado, más el mismo contexto que B.', 'vertex', null, 'biblioteca', 'pendiente', 2.25, 13.50)
  ) as c(letra, nombre, descripcion, proveedor, modelo, contexto, estado, pe, ps)
 where e.nombre = 'Comparación A/B/C · 4 semanas'
on conflict (experiment_id, letra) do nothing;
