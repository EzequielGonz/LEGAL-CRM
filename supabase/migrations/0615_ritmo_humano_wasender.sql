-- 0615 · Ritmo humano de Wasender (14/11).
-- Índice para leer rápido los últimos primeros mensajes de cada línea de Wasender:
-- el motor de campañas los mira para no repetir plantilla ni un texto parecido.
-- Repetible sin error. No borra ni cambia datos.
create index if not exists messages_wasender_linea_inicio_idx
  on public.messages ((metadata ->> 'wasender_line_id'), created_at desc)
  where direction = 'saliente'
    and origin = 'inicio_campana'
    and (metadata ->> 'wasender_line_id') is not null;
