-- =====================================================================
-- Módulo de importación de bases (Fase 1): BASES → IMPORTAR BASE
-- La base original queda guardada tal cual se subió (fila por fila, sin
-- tocar) para poder auditar siempre de dónde salió cada contacto.
-- =====================================================================

create type import_row_status as enum ('creado', 'duplicado', 'invalido');

create table imported_bases (
  id uuid primary key default gen_random_uuid(),
  area area_type not null,
  name text not null,               -- ej: "Base accidentes laborales septiembre"
  source_label text not null,       -- fuente de la base (de dónde salió), texto libre
  file_name text,
  total_rows int not null default 0,
  created_rows int not null default 0,
  duplicate_rows int not null default 0,
  invalid_rows int not null default 0,
  imported_by uuid references admin_profiles(id),
  created_at timestamptz not null default now()
);

-- Fila cruda de la base, tal cual vino del archivo (CSV/Excel). Nunca se
-- edita ni se borra desde el panel: es el registro auditable de origen.
create table imported_base_rows (
  id uuid primary key default gen_random_uuid(),
  base_id uuid not null references imported_bases(id) on delete cascade,
  row_number int not null,
  raw_data jsonb not null,
  status import_row_status not null,
  error text,
  contact_id uuid references contacts(id),
  created_at timestamptz not null default now()
);

create index idx_imported_base_rows_base on imported_base_rows(base_id);

alter table imported_bases enable row level security;
alter table imported_base_rows enable row level security;

create policy "admins_full_access" on imported_bases for all using (is_admin()) with check (is_admin());
create policy "admins_full_access" on imported_base_rows for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- Datos adicionales en `contacts` que trae la base (no todos los
-- prospectos los van a tener, ej. los que llegan por Instagram/landing).
-- ---------------------------------------------------------------------

alter table contacts add column dni_cuil text;
alter table contacts add column imported_base_id uuid references imported_bases(id);
