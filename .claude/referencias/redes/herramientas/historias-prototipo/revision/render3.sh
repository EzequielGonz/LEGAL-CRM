#!/bin/bash
# Cola: espera el render de VITA y después hace Coberturas, Autos y Kocos a 30 cps, 1080×1920.
cd /home/user/LEGAL-CRM/.claude/referencias/redes/herramientas/historias-prototipo
while pgrep -f render2.sh >/dev/null; do sleep 10; done
for id in cob autos mkt; do rm -rf fr/$id-h; ./render_h.sh $id 30 1 4 > /tmp/claude-0/r-$id.log 2>&1; cp out/$id-h.mp4 out/$id-v3-1080.mp4; done; ls -la out/
