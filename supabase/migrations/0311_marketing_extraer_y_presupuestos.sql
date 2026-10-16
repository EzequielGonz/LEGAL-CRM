-- =====================================================================
-- Marketing · Extraer negocios y Pide presupuesto (16/10)
--
--  * marketing_extracciones: una extracción = una base (tipo de negocio,
--    zonas, tope de cantidad). El servidor la corre de a una zona por
--    latido con Outscraper y deduplica como siempre. Topes de gasto por
--    extracción y por día en system_settings.limites_outscraper.
--  * marketing_leads: etapa de venta (apertura → aceptó → análisis →
--    propuesta → presupuesto pedido → enviado → cerrado / no interesado),
--    fechas de cada paso y datos de venta para automatizar después.
--    analysis_status suma 'no_iniciado': el análisis profundo se hace
--    recién cuando la persona acepta escuchar la propuesta.
--  * marketing_budgets: pedidos de presupuesto (lo que pidió, servicios,
--    monto, moneda, alcance, plazo de entrega, archivo, envío y resultado).
--    «Pide presupuesto» cuenta como captado; aprobado = cerrado.
--  * campaigns.marketing_extraccion_id: campaña creada con «Ejecutar base».
--
-- Aditivo y repetible. Sin borrados y sin acceso para la clave pública.
-- Reversión: docs/etapa3/sql/revertir_0311.sql.
-- =====================================================================

set lock_timeout = '5s';

create table if not exists public.marketing_extracciones (
  id uuid primary key default gen_random_uuid(),
  nombre_base text not null check (length(btrim(nombre_base)) between 3 and 120),
  tipo_negocio text not null check (length(btrim(tipo_negocio)) between 2 and 120),
  -- ["Toda Argentina"] o provincias / localidades elegidas.
  zonas text[] not null check (coalesce(array_length(zonas, 1), 0) between 1 and 60),
  cantidad_max integer not null check (cantidad_max between 1 and 1000),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'ejecutando', 'listo', 'error', 'cancelado')),
  base_id uuid references public.imported_bases(id),
  -- {"hechas": ["Córdoba", ...], "pendientes": [...], "consultas": 3}
  progreso jsonb not null default '{}'::jsonb,
  encontrados integer not null default 0,
  creados integer not null default 0,
  duplicados integer not null default 0,
  invalidos integer not null default 0,
  error text,
  creado_por text not null default 'operador',
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists marketing_extracciones_estado_idx on public.marketing_extracciones (estado, created_at);

alter table public.marketing_leads
  add column if not exists sale_stage text not null default 'apertura',
  add column if not exists accepted_at timestamptz,
  add column if not exists proposal_at timestamptz,
  add column if not exists budget_requested_at timestamptz,
  add column if not exists budget_sent_at timestamptz,
  add column if not exists closed_won_at timestamptz,
  add column if not exists extraction_id uuid references public.marketing_extracciones(id),
  -- Necesidad, servicios conversados, precios mencionados, objeciones, plazos.
  add column if not exists sale_data jsonb not null default '{}'::jsonb;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'marketing_leads_sale_stage_check') then
    alter table public.marketing_leads add constraint marketing_leads_sale_stage_check check (sale_stage in (
      'apertura', 'acepto', 'analisis', 'propuesta', 'presupuesto_pedido', 'presupuesto_enviado', 'cerrado', 'no_interesado'));
  end if;
end $$;
alter table public.marketing_leads drop constraint if exists marketing_leads_analysis_status_check;
alter table public.marketing_leads add constraint marketing_leads_analysis_status_check
  check (analysis_status in ('no_iniciado', 'pendiente', 'analizando', 'listo', 'error', 'omitido'));
create index if not exists marketing_leads_sale_stage_idx on public.marketing_leads (sale_stage, updated_at);

create table if not exists public.marketing_budgets (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.marketing_leads(id),
  contact_id uuid not null references public.contacts(id),
  opportunity_id uuid references public.opportunities(id),
  conversation_id uuid references public.conversations(id),
  estado text not null default 'pedido' check (estado in ('pedido', 'listo', 'enviado', 'aprobado', 'rechazado', 'sin_respuesta', 'anulado')),
  pedido_at timestamptz not null default now(),
  -- Lo que pidió la persona, con sus palabras.
  detalle_pedido text not null,
  servicios text[] not null default '{}',
  presupuesto_mencionado text,
  urgencia text,
  -- Lo que carga el equipo al subir el archivo.
  monto numeric(14,2),
  moneda text check (moneda is null or moneda in ('ARS', 'USD')),
  alcance text,
  plazo_entrega text,
  archivo_path text,
  archivo_nombre text,
  archivo_mime text,
  listo_at timestamptz,
  enviado_at timestamptz,
  enviado_via text check (enviado_via is null or enviado_via in ('ventana', 'plantilla')),
  plantilla_pendiente boolean not null default false,
  respuesta_at timestamptz,
  resultado_detalle text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists marketing_budgets_estado_idx on public.marketing_budgets (estado, pedido_at);
create index if not exists marketing_budgets_contact_idx on public.marketing_budgets (contact_id);

alter table public.campaigns add column if not exists marketing_extraccion_id uuid references public.marketing_extracciones(id);

do $$
declare t text;
begin
  foreach t in array array['marketing_extracciones', 'marketing_budgets'] loop
    if not exists (select 1 from pg_trigger where tgname = t || '_no_delete') then
      execute format('create trigger %I before delete on public.%I for each row execute function public.prevent_hard_delete()', t || '_no_delete', t);
    end if;
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update on public.%I to service_role', t);
  end loop;
end $$;

-- Topes de gasto de Outscraper (editables): resultados por extracción y por día.
insert into public.system_settings (key, value)
values ('limites_outscraper', '{"por_extraccion": 500, "por_dia": 1000}'::jsonb)
on conflict (key) do nothing;

-- Bucket privado para los archivos de presupuesto (si no existe).
do $$ begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public)
    values ('presupuestos', 'presupuestos', false)
    on conflict (id) do nothing;
  end if;
end $$;
