-- 0623 · Freno por respuesta que se puede saltear a mano (15/11).
-- Si una campaña se frenó porque casi nadie contesta (menos del 1 % con 100
-- envíos o más en 7 días) y la responsable la reanuda, queda anotado cuándo:
-- ese freno no vuelve a frenarla durante 7 días (decisión propia; los frenos por
-- fallas de entrega siguen igual). Solo agrega una columna. Repetible sin error.
-- Para volver atrás: drop column freno_respuesta_ignorado_at.
alter table public.campaigns add column if not exists freno_respuesta_ignorado_at timestamptz;
