#!/usr/bin/env bash
# Cola de producción: sigue el orden por día y marca. Espera a que la voz figure en audio/voces-listas.txt
# (el operador de voces la anota recién cuando el wav está terminado) y corre lote.py. Uso: ./cola.sh [pid a esperar]
cd "$(dirname "$0")"
[ -n "$1" ] && while kill -0 "$1" 2>/dev/null; do sleep 20; done
for d in 2811 2911 3011 0112 0212; do for m in vita marketing coberturas autos; do for l in a b; do
  id="$m-$d-$l"; n=0
  until grep -q "^$id " audio/voces-listas.txt 2>/dev/null; do sleep 30; n=$((n+1)); [ $n -gt 360 ] && break; done
  grep -q "^$id FALLA" audio/voces-listas.txt || python3 lote.py "$id"
done; done; done
echo "$(date +%H:%M:%S) cola terminada" >> lote.log
