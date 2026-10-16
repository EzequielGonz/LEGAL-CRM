-- =====================================================================
-- Etapa 2 · Bloque 3 — Operación diaria (bloques 2.6 y 2.8, búsqueda)
--
--  * Fuente acreditada de cada oportunidad (2.8): la PRIMERA fuente que se
--    pudo comprobar en un mensaje (landing, Facebook, Instagram, anuncio,
--    base importada) o «no_informada» si el mensaje no trae referencia.
--    Nunca se pisa después ni se inventa atribución paga u orgánica.
--  * Textos identificadores de mensajes prearmados por perfil
--    (`rubros.source_identifiers`): vacío hasta que la responsable los cargue.
--  * Búsqueda en columnas importadas: `contacts.base_text` reúne los valores
--    de las filas de bases del contacto (se mantiene solo con un disparador)
--    para que Inbox y Prospectos busquen ahí también, con conteo correcto.
--  * Adjuntos no legibles (2.6): `conversations.text_request_at` registra el
--    último pedido de «¿me lo podés escribir?» para no repetirlo.
--
-- Aditiva y repetible. No envía nada. Reversión: docs/etapa2/sql/revertir_0203_0207.sql.
-- =====================================================================

set lock_timeout = '5s';

alter table public.opportunities
  add column if not exists first_source text,
  add column if not exists first_source_detail text,
  add column if not exists first_source_at timestamptz;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'opportunities_first_source_check') then
    alter table public.opportunities add constraint opportunities_first_source_check check (
      first_source is null or first_source in ('landing', 'facebook', 'instagram', 'anuncio', 'base_importada', 'no_informada'));
  end if;
end $$;
create index if not exists opportunities_first_source_idx on public.opportunities (rubro_id, first_source);

-- [{ "texto": "Hola, vengo de la web", "fuente": "landing" }]
alter table public.rubros add column if not exists source_identifiers jsonb not null default '[]'::jsonb;

alter table public.conversations add column if not exists text_request_at timestamptz;

-- ---------------------------------------------------------------------
-- Búsqueda en las columnas importadas
-- ---------------------------------------------------------------------
alter table public.contacts add column if not exists base_text text;

create or replace function public.contact_base_text_refresh(p_contact uuid)
returns void
language sql
set search_path = public
as $$
  update public.contacts c
     set base_text = (
       select left(string_agg(distinct btrim(e.value), ' '), 4000)
         from public.imported_base_rows r
         cross join lateral jsonb_each_text(case when jsonb_typeof(r.raw_data) = 'object' then r.raw_data else '{}'::jsonb end) e
        where r.contact_id = p_contact and coalesce(btrim(e.value), '') <> '')
   where c.id = p_contact;
$$;

create or replace function public.imported_base_rows_base_text()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.contact_id is not null then
    perform public.contact_base_text_refresh(new.contact_id);
  end if;
  if tg_op = 'UPDATE' and old.contact_id is not null and old.contact_id is distinct from new.contact_id then
    perform public.contact_base_text_refresh(old.contact_id);
  end if;
  return new;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'imported_base_rows_base_text') then
    create trigger imported_base_rows_base_text
      after insert or update of raw_data, contact_id on public.imported_base_rows
      for each row execute function public.imported_base_rows_base_text();
  end if;
end $$;

-- Carga inicial (solo contactos que todavía no la tienen).
update public.contacts c
   set base_text = x.t
  from (
    select r.contact_id, left(string_agg(distinct btrim(e.value), ' '), 4000) as t
      from public.imported_base_rows r
      cross join lateral jsonb_each_text(case when jsonb_typeof(r.raw_data) = 'object' then r.raw_data else '{}'::jsonb end) e
     where r.contact_id is not null and coalesce(btrim(e.value), '') <> ''
     group by r.contact_id
  ) x
 where c.id = x.contact_id and c.base_text is null;

revoke all on function public.contact_base_text_refresh(uuid) from public, anon, authenticated;
grant execute on function public.contact_base_text_refresh(uuid) to service_role;
revoke all on function public.imported_base_rows_base_text() from public, anon, authenticated;
