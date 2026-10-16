-- =====================================================================
-- Índices para las claves foráneas del esquema public que no tienen uno
-- (asesor de Supabase «unindexed_foreign_keys»). Acelera Inbox, fichas,
-- campañas y los borrados lógicos en cascada de consultas.
-- Aditivo y repetible: crea solo los que faltan. No toca los respaldos.
-- Reversión: borrar los índices terminados en _fk_idx.
-- =====================================================================
set lock_timeout = '5s';

do $$
declare
  r record;
  nombre text;
begin
  for r in
    select c.conrelid::regclass as tabla,
           cl.relname as tabla_nombre,
           c.conkey,
           (select string_agg(quote_ident(a.attname), ', ' order by k.ord)
              from unnest(c.conkey) with ordinality as k(attnum, ord)
              join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum) as columnas,
           (select string_agg(a.attname, '_' order by k.ord)
              from unnest(c.conkey) with ordinality as k(attnum, ord)
              join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum) as columnas_nombre
      from pg_constraint c
      join pg_class cl on cl.oid = c.conrelid
      join pg_namespace n on n.oid = cl.relnamespace
     where c.contype = 'f' and n.nspname = 'public'
       and not exists (
         select 1 from pg_index i
          where i.indrelid = c.conrelid
            and (i.indkey::int2[])[0:array_length(c.conkey, 1) - 1] = c.conkey
       )
  loop
    nombre := left(r.tabla_nombre || '_' || r.columnas_nombre, 56) || '_fk_idx';
    execute format('create index if not exists %I on %s (%s)', nombre, r.tabla, r.columnas);
  end loop;
end $$;
