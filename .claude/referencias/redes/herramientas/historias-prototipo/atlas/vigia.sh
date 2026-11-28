#!/usr/bin/env bash
# Aloja solo cada reel apenas lote.py lo deja LISTO (una vez por reel). La programación en Metricool la hace Claude.
# Se puede relanzar sin riesgo: saltea los que ya tienen «mp4 200» en alojados.log.
cd "$(dirname "$0")"
while true; do
  for f in out/*-[0-9][0-9][0-9][0-9]-[ab].mp4; do
    [ -e "$f" ] || continue; id=$(basename "$f" .mp4); dd=$(echo "$id" | cut -d- -f2)
    grep -q " $id LISTO" lote.log || continue
    grep -q " $id mp4 200 " alojados.log 2>/dev/null && continue
    ./alojar.sh "$dd" "$id" >> vigia.out 2>&1
  done
  sleep 60
done
