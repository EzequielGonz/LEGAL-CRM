#!/usr/bin/env bash
# Cola de la tanda 2 (03/12 al 07/12). Espera a que termine cola.sh (tanda base 1) y después produce cada reel
# apenas su voz figura en audio/voces-listas.txt. Se puede relanzar: lote.py saltea los que ya tienen out/<id>.mp4.
cd "$(dirname "$0")"
while pgrep -f '\./cola\.sh' >/dev/null; do sleep 30; done
for d in 0312 0412 0512 0612 0712; do for m in vita marketing coberturas autos; do for l in a b; do
  id="$m-$d-$l"; n=0
  until grep -q "^$id " audio/voces-listas.txt 2>/dev/null; do sleep 30; n=$((n+1)); [ $n -gt 720 ] && break; done
  grep -q "^$id FALLA" audio/voces-listas.txt || python3 lote.py "$id"
done; done; done
echo "$(date +%H:%M:%S) cola2 terminada" >> lote.log
