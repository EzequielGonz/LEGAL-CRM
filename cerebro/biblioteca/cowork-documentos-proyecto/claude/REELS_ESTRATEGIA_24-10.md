# Reels · 4 rubros · 25/10 al 5/11 (24-25/10)

Pedido de Vita: sumar reels a los 4 rubros, 2 nuevos por día por rubro + 2 repeticiones en días distintos (4 por día), hasta donde hay publicaciones programadas (5/11).

## Producción
- 96 reels únicos (24 por rubro), 1080×1920, 30 fps, ~15 s, base musical suave propia.
- Paleta de cada marca de `src/lib/marca.ts`; monograma con el acento (logos del repo de 128 px, no aptos para video).
- Estructura: gancho (palabras que entran una a una) → 3 pasos numerados con contador 1/3 y barra de progreso → placa de captación con palabra clave + WhatsApp + web, y pregunta para comentarios.
- Reglas: sin precios, plazos, resultados ni promesas; leyenda legal por rubro.

## Alojamiento
- Vercel Blob `reels-redes` (store_VSQc3OOWUqT7ZEBj, público, gru1, plan Hobby, ~323 MB de 1 GB). Videos en `descargas/reels_todos/reels/<rubro>_NN.mp4` (subidos por Vita desde el panel). Metricool copia cada video a su propio almacenamiento al programar.
- Pendiente opcional: borrar `descargas/reels_todos.zip` del store (no se usa).

## Calendario (hora Argentina; VITA :00, Coberturas :07, Autos :14, Marketing :21)
- 13:30 y 20:30: reel nuevo en Instagram + Facebook.
- 10:00 y 17:00 (desde el 26/10): repetición del reel del día anterior como Trial Reel de Instagram (solo no seguidores).
- Cada video se usa 2 veces como máximo.

## Estado (evidencia)
- **Programado: 184/184** (46 por rubro). Cada alta devolvió id de Metricool y estado PENDING; verificado con lectura del 25/10 de VITA (2 reels a 13:30 y 20:30).
- Publicado: todavía no (primera salida 25/10 13:30).
- Textos y horarios: `calendario_reels.csv` (entregado en el chat).
