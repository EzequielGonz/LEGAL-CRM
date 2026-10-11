-- =====================================================================
-- Pruebas de integración · 2/3 — Datos de referencia previos a la Etapa 1
-- Perfiles (con los mismos identificadores que usan las migraciones) y
-- canales por área. Nombres y valores de prueba: ningún dato real.
-- =====================================================================
insert into public.rubros (id, slug, name, sort_order, active) values
  ('11111111-1111-1111-1111-111111111111', 'juridico', 'Estudio Jurídico (prueba)', 1, true),
  ('22222222-2222-2222-2222-222222222222', 'agencia_0km', 'Agencia 0KM (prueba)', 2, true),
  ('33333333-3333-3333-3333-333333333333', 'coberturas_medicas', 'Coberturas Médicas (prueba)', 3, true),
  ('44444444-4444-4444-4444-444444444444', 'marketing', 'Marketing (prueba)', 4, true)
on conflict (id) do nothing;

insert into public.channels (area, type, label) values
  ('civil', 'whatsapp', 'WhatsApp Civil'), ('civil', 'instagram', 'Instagram Civil'), ('civil', 'facebook', 'Facebook Civil'),
  ('penal', 'whatsapp', 'WhatsApp Penal'), ('penal', 'instagram', 'Instagram Penal'), ('penal', 'facebook', 'Facebook Penal'),
  ('civil', 'landing', 'Landing (Civil)'), ('penal', 'landing', 'Landing (Penal)'),
  ('marketing', 'whatsapp', 'WhatsApp Marketing'), ('agencia_0km', 'whatsapp', 'WhatsApp Agencia 0KM'),
  ('coberturas_medicas', 'whatsapp', 'WhatsApp Coberturas Médicas');
