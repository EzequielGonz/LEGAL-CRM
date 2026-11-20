#!/bin/bash
# Tramo mkt-1: voz → sonido → cuadros → mp4 liviano (crf 20) → portada → hoja → entrega en docs/redes/produccion-2011/entregas/mkt-1/
# Uso: bash entregar_mkt1.sh <id> <t_portada>
set -e; cd "$(dirname "$0")"; id=$1; tp=${2:-0.4}; W=4; fps=30; dir=fr/$id-h
ENT=../../../../../docs/redes/produccion-2011/entregas/mkt-1; mkdir -p $ENT out
python3 historia_voz.py $id | tail -1; python3 sonido.py $id | tail -1
for k in $(seq 0 $((W-1))); do node render_h.js $id $dir $fps 1 $W $k > /tmp/rh-$id-$k.log 2>&1 & done; wait
ffmpeg -y -v error -framerate $fps -i $dir/%05d.jpg -i audio/$id-mix-voz.wav -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -profile:v high -c:a aac -b:a 192k -shortest -movflags +faststart out/$id-h.mp4
rm -rf $dir; cp out/$id-h.mp4 $ENT/$id.mp4
node revision/cuadros.js $id /tmp/st-$id $tp; cp /tmp/st-$id/t_*.jpg $ENT/$id.jpg; rm -rf /tmp/st-$id
ffmpeg -v error -y -i out/$id-h.mp4 -vf "fps=1,scale=170:-1,tile=12x3" /tmp/hoja-$id.png
echo "$id $(du -h $ENT/$id.mp4 | cut -f1) $(ffprobe -v error -show_entries format=duration -of csv=p=0 out/$id-h.mp4)s LUFS $(ffmpeg -nostats -i out/$id-h.mp4 -af ebur128 -f null - 2>&1 | grep -A1 'Integrated' | grep -o 'I: *[-0-9.]*' | tail -1)"
