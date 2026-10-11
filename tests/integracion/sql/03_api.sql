-- =====================================================================
-- Pruebas de integración · 3/3 — Avisar a la API (PostgREST) que relea la
-- estructura después de crear la base y aplicar las migraciones.
-- =====================================================================
notify pgrst, 'reload schema';
