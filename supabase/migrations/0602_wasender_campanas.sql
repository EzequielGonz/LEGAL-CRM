-- 0602 · Campañas por Wasender (10/11, bloque 3).
-- Las campañas de Wasender usan la misma tabla, el mismo ritmo y el mismo
-- motor que las de Meta. Solo se agrega con qué método se envía, la línea
-- de Wasender y la plantilla propia. Las campañas existentes quedan en «meta».
-- Solo agrega: sin drop ni borrados. Se puede repetir sin error.

alter table public.campaigns
  add column if not exists proveedor text not null default 'meta',
  add column if not exists wasender_line_id uuid references public.wasender_lineas(id),
  add column if not exists wasender_plantilla_id uuid references public.wasender_plantillas(id);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'campaigns_proveedor_check') then
    alter table public.campaigns add constraint campaigns_proveedor_check check (proveedor in ('meta', 'wasender'));
  end if;
end $$;

create index if not exists campaigns_wasender_line_idx on public.campaigns (wasender_line_id) where wasender_line_id is not null;

-- Límite diario de cada línea de Wasender, sumando todas sus campañas (igual que el de las líneas de Meta).
alter table public.wasender_lineas add column if not exists limite_diario integer;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'wasender_lineas_limite_diario_check') then
    alter table public.wasender_lineas add constraint wasender_lineas_limite_diario_check check (limite_diario is null or (limite_diario between 1 and 1000));
  end if;
end $$;
