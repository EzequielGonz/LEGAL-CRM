#!/bin/bash
# Renderiza fotogramas (1080x1920) y codifica las dos versiones de cada reel.
cd "$(dirname "$0")"; mkdir -p out fr; DIR=$(basename "$PWD")
for id in "$@"; do
  rm -rf fr/$id
  for k in 0 1 2 3; do N=4 K=$k node fotogramas.js "http://127.0.0.1:8765/$DIR/motor.html?r=$id" fr/$id 1 30 > /tmp/fr-$id-$k.log 2>&1 & done; wait
  ffmpeg -y -v error -framerate 30 -i fr/$id/%04d.jpg -i aud/$id-mix-voz.wav -c:v libx264 -preset medium -crf 22 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart out/$id-voz.mp4
  ffmpeg -y -v error -framerate 30 -i fr/$id/%04d.jpg -i aud/$id-mix-efectos.wav -c:v libx264 -preset medium -crf 22 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart out/$id-tendencia.mp4
  echo "$id $(ls fr/$id | wc -l) cuadros"; rm -rf fr/$id
done
