-- 0608 · Categoría «reclamo» para la atención humana (13/11).
-- Amenaza legal o denuncia contra nosotros, y queja de un cliente captado:
-- lo único que queda como incidencia de una persona. Repetible. No borra nada.
alter table public.opportunities drop constraint if exists opportunities_attention_category_check;
alter table public.opportunities
  add constraint opportunities_attention_category_check check (
    attention_category is null or attention_category = any (array[
      'comercial', 'detencion', 'procedencia', 'solicitud_datos', 'excepcion_datos',
      'incidencia_operativa', 'registro_historico', 'reclamo'
    ]::text[]));

-- Una sola incidencia abierta por persona y tipo de reclamo: si vuelve a
-- escribir enojada, no se multiplican.
create unique index if not exists incidences_reclamo_abierto_unico
  on public.incidences (contact_id, kind)
  where status = 'abierta' and kind in ('amenaza_legal', 'queja_cliente_captado') and contact_id is not null;
