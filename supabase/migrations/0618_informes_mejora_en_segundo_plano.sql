-- 0618 · El informe de mejoras del bot se genera en segundo plano (14/11).
-- La IA puede tardar más que lo que espera el navegador: el pedido deja el
-- informe «procesando» y la pantalla consulta hasta que queda listo.
-- Repetible. No borra datos.
alter table public.bot_informes_mejora drop constraint if exists bot_informes_mejora_estado_check;
alter table public.bot_informes_mejora
  add constraint bot_informes_mejora_estado_check check (estado in ('procesando', 'listo', 'error'));
