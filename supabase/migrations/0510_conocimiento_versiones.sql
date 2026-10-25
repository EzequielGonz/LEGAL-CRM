-- ---------------------------------------------------------------------
-- 25/10 · Versiones del conocimiento del bot (v1 actual, v2 Biblioteca
-- Maestra de Ventas) y estadísticas para compararlas.
--
-- 1) bot_knowledge_versions: catálogo de versiones. v1 = el bot como estaba
--    el 24/10 (reglas, guion, rol y ficha, sin biblioteca). v2 = v1 + la
--    biblioteca de ventas, objeciones y conocimiento por rubro.
-- 2) bot_knowledge_items: el contenido de cada versión (base general, base
--    por rubro, temas y fichas de objeción), editable desde Perfiles. La v1
--    no tiene ítems: es exactamente el bot de antes.
-- 3) bot_knowledge_assignment: qué versión rige en cada rubro. Opcional:
--    comparar con otra versión repartiendo las conversaciones (porcentaje).
--    Arranca todo en v1: publicar el código no cambia el bot.
-- 4) agent_turn_logs: versión y fichas usadas en cada respuesta.
-- 5) Funciones de estadísticas (solo lectura, para el panel y el asistente).
--
-- Repetible, con RLS y sin permisos para la clave pública. Sin borrados.
-- ---------------------------------------------------------------------
create table if not exists public.bot_knowledge_versions (
  version smallint primary key check (version between 1 and 99),
  nombre text not null check (char_length(nombre) between 2 and 80),
  descripcion text not null default '' check (char_length(descripcion) <= 1000),
  created_at timestamptz not null default now()
);
alter table public.bot_knowledge_versions enable row level security;
revoke all on public.bot_knowledge_versions from anon, authenticated;

insert into public.bot_knowledge_versions (version, nombre, descripcion) values
  (1, 'v1 · Bot del 24/10', 'Reglas del sistema, guion del agente, criterio del rubro, rol de la base o campaña y ficha del negocio. Sin biblioteca de ventas.'),
  (2, 'v2 · Biblioteca de ventas', 'Todo lo de la v1, sin cambios, más la base general de ventas, el conocimiento de cada rubro y 144 fichas de objeción (Biblioteca Maestra, 25/10). Se suma por debajo de las reglas, la ficha y el rol.')
on conflict (version) do nothing;

create table if not exists public.bot_knowledge_items (
  id uuid primary key default gen_random_uuid(),
  version smallint not null references public.bot_knowledge_versions(version),
  clave text not null check (char_length(clave) between 2 and 60),
  capa text not null check (capa in ('general', 'rubro', 'tema', 'objecion')),
  rubro text check (rubro is null or rubro in ('comun', 'juridico', 'agencia_0km', 'coberturas_medicas', 'marketing')),
  titulo text not null check (char_length(titulo) between 2 and 160),
  disparadores text[] not null default '{}',
  contenido text not null check (char_length(contenido) between 10 and 4000),
  fuente text,
  verificado_el date,
  activo boolean not null default true,
  orden integer not null default 0,
  updated_at timestamptz not null default now(),
  updated_by text not null default 'migracion',
  unique (version, clave)
);
create index if not exists bot_knowledge_items_version_idx on public.bot_knowledge_items (version, capa) where activo;
alter table public.bot_knowledge_items enable row level security;
revoke all on public.bot_knowledge_items from anon, authenticated;

create table if not exists public.bot_knowledge_assignment (
  rubro text primary key check (rubro in ('juridico', 'agencia_0km', 'coberturas_medicas', 'marketing')),
  version smallint not null references public.bot_knowledge_versions(version),
  comparar_con smallint references public.bot_knowledge_versions(version),
  porcentaje smallint not null default 100 check (porcentaje between 0 and 100),
  desde timestamptz not null default now(),
  updated_by text not null default 'migracion',
  check (comparar_con is null or comparar_con <> version)
);
alter table public.bot_knowledge_assignment enable row level security;
revoke all on public.bot_knowledge_assignment from anon, authenticated;

insert into public.bot_knowledge_assignment (rubro, version) values
  ('juridico', 1), ('agencia_0km', 1), ('coberturas_medicas', 1), ('marketing', 1)
on conflict (rubro) do nothing;

alter table public.agent_turn_logs add column if not exists knowledge_version smallint;
alter table public.agent_turn_logs add column if not exists knowledge_items text[];
create index if not exists agent_turn_logs_created_idx on public.agent_turn_logs (created_at);

-- Estadísticas por rubro y versión en un período. La unidad es la
-- conversación atendida por el bot; los turnos anteriores a esta migración
-- (sin versión) cuentan como v1. Solo lectura.
create or replace function public.conocimiento_estadisticas(p_desde timestamptz, p_hasta timestamptz)
returns table (
  rubro_id uuid, version smallint, conversaciones bigint, turnos bigint, siguieron bigint,
  captados bigint, escalados bigint, detenidos bigint, retenidos bigint, tokens_promedio numeric, latencia_promedio numeric
)
language sql stable
set search_path = public
as $$
  with t as (
    select l.rubro_id, coalesce(l.knowledge_version, 1)::smallint as v, l.conversation_id, l.created_at,
           l.herramientas, l.resultado, l.tokens_entrada, l.latencia_ms
      from agent_turn_logs l
     where l.created_at >= p_desde and l.created_at < p_hasta
       and coalesce(l.uso, 'conversacion') = 'conversacion'
       and l.experiment_id is null
       and l.conversation_id is not null
  ), c as (
    select t.rubro_id, t.conversation_id, mode() within group (order by t.v) as v, min(t.created_at) as primero,
           count(*) filter (where t.resultado = 'enviado') as turnos,
           bool_or('escalar_a_humano' = any(coalesce(t.herramientas, '{}'))) as escalado,
           count(*) filter (where t.resultado = 'retenido') as retenidos,
           avg(t.tokens_entrada) as tok, avg(t.latencia_ms) as lat
      from t group by t.rubro_id, t.conversation_id
  ), x as (
    select c.*,
           exists (select 1 from messages m where m.conversation_id = c.conversation_id and m.direction = 'entrante' and m.created_at > c.primero) as siguio,
           exists (select 1 from opportunities o where o.conversation_id = c.conversation_id and o.captured_at >= c.primero) as captado,
           exists (select 1 from conversations cv join contact_detentions d on d.contact_id = cv.contact_id
                    where cv.id = c.conversation_id and d.created_at >= c.primero) as detenido
      from c
  )
  select x.rubro_id, x.v, count(*), coalesce(sum(x.turnos), 0)::bigint, count(*) filter (where x.siguio),
         count(*) filter (where x.captado), count(*) filter (where x.escalado), count(*) filter (where x.detenido),
         coalesce(sum(x.retenidos), 0)::bigint, round(avg(x.tok)), round(avg(x.lat))
    from x group by x.rubro_id, x.v;
$$;
revoke all on function public.conocimiento_estadisticas(timestamptz, timestamptz) from public, anon, authenticated;

-- Uso de cada ficha: cuántas respuestas la usaron y en cuántas la persona
-- volvió a escribir en las 24 h siguientes.
create or replace function public.conocimiento_fichas(p_desde timestamptz, p_hasta timestamptz)
returns table (rubro_id uuid, clave text, usos bigint, siguieron bigint)
language sql stable
set search_path = public
as $$
  select l.rubro_id, k.clave, count(*),
         count(*) filter (where exists (
           select 1 from messages m where m.conversation_id = l.conversation_id and m.direction = 'entrante'
              and m.created_at > l.created_at and m.created_at < l.created_at + interval '24 hours'))
    from agent_turn_logs l
    cross join lateral unnest(coalesce(l.knowledge_items, '{}')) as k(clave)
   where l.created_at >= p_desde and l.created_at < p_hasta and l.resultado = 'enviado'
   group by l.rubro_id, k.clave;
$$;
revoke all on function public.conocimiento_fichas(timestamptz, timestamptz) from public, anon, authenticated;
