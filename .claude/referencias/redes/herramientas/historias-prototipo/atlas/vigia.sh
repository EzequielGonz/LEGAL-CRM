#!/usr/bin/env bash
# Aloja cada reel apenas lote.py lo deja LISTO. La programación en Metricool la hace Claude.
# Marca por reel: out/<id>.alojado. Si el mp4 es más nuevo que la marca (reel rehecho), se vuelve a alojar.
# Reels alojados antes de existir las marcas: si alojados.log ya tiene «mp4 200», se crea la marca y se saltea.
# Se puede relanzar sin riesgo.
cd "$(dirname "$0")"
while true; do
  for f in out/*-[0-9][0-9][0-9][0-9]-[a-e].mp4; do
    [ -e "$f" ] || continue; id=$(basename "$f" .mp4); dd=$(echo "$id" | cut -d- -f2); marca=out/$id.alojado
    grep -q " $id LISTO" lote.log || continue
    if [ -e "$marca" ]; then
      [ "$f" -nt "$marca" ] || continue
    elif grep -q " $id mp4 200 " alojados.log 2>/dev/null; then
      touch -r "$f" "$marca"; continue
    fi
    ./alojar.sh "$dd" "$id" >> vigia.out 2>&1 && touch "$marca"
  done
  sleep 60
done
