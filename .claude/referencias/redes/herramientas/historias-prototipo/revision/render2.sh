#!/bin/bash
# Render de las dos versiones del boceto: 60 cps con desenfoque de movimiento real → 30 cps, 1080×1920.
cd /home/user/LEGAL-CRM/.claude/referencias/redes/herramientas/historias-prototipo
for id in vita vita-b; do
  rm -rf fr/$id-h; ./render_h.sh $id 60 1 4 > /tmp/claude-0/r-$id.log 2>&1
  ffmpeg -v error -y -i out/$id-h.mp4 -vf "tmix=frames=2:weights='1 1',fps=30" -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -c:a copy -movflags +faststart out/$id-v3-1080.mp4
done; ls -la out/
