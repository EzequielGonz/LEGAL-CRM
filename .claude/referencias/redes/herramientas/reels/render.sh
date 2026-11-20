#!/bin/bash
# Renderiza fotogramas (1080x1920) y codifica dos versiones de cada reel: con voz y con música y efectos.
cd "$(dirname "$0")"; mkdir -p out fr
for id in "$@"; do
  [ -f out/$id-voz.mp4 ] && [ -f out/$id-tendencia.mp4 ] && continue
  rm -rf fr/$id
  for k in 0 1 2 3; do N=4 K=$k node ../tools/frames.js "http://127.0.0.1:8765/v6/motor.html?r=$id" fr/$id 1 30 > /tmp/fr-$id-$k.log 2>&1 & done; wait
  if grep -q ERR /tmp/fr-$id-*.log; then echo "$id ERROR"; grep ERR /tmp/fr-$id-*.log | head -3; continue; fi
  ffmpeg -y -v error -framerate 30 -i fr/$id/%04d.jpg -i aud/$id-mix-voz.wav -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p -c:a aac -b:a 160k -shortest -movflags +faststart out/$id-voz.mp4
  ffmpeg -y -v error -framerate 30 -i fr/$id/%04d.jpg -i aud/$id-mix-sinvoz.wav -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p -c:a aac -b:a 160k -shortest -movflags +faststart out/$id-tendencia.mp4
  echo "$id $(ls fr/$id | wc -l) cuadros $(du -h out/$id-voz.mp4 | cut -f1)"; rm -rf fr/$id
done
