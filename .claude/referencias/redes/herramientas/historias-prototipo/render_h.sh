#!/bin/bash
# ./render_h.sh <id> <fps> <dsf> <workers>  (PORT=puerto del servidor, 8799 por defecto; SINVOZ=0 no arma la versión sin voz) → out/<id>-h[-4k].mp4 (con voz) y -sinvoz.mp4
cd "$(dirname "$0")"; id=$1; fps=${2:-60}; dsf=${3:-1}; W=${4:-4}; suf=$([ "$dsf" = 2 ] && echo -4k || echo ""); dir=fr/$id-h$suf; mkdir -p out
for k in $(seq 0 $((W-1))); do node render_h.js $id $dir $fps $dsf $W $k > /tmp/rh-$id-$k.log 2>&1 & done; wait
crf=$([ "$dsf" = 2 ] && echo 18 || echo 16)
ffmpeg -y -v error -framerate $fps -i $dir/%05d.jpg -i audio/$id-mix-voz.wav -c:v libx264 -preset slow -crf $crf -pix_fmt yuv420p -profile:v high -c:a aac -b:a 256k -shortest -movflags +faststart out/$id-h$suf.mp4
[ "${SINVOZ:-1}" = 1 ] && ffmpeg -y -v error -framerate $fps -i $dir/%05d.jpg -i audio/$id-mix-sinvoz.wav -c:v libx264 -preset slow -crf $crf -pix_fmt yuv420p -profile:v high -c:a aac -b:a 256k -shortest -movflags +faststart out/$id-h$suf-sinvoz.mp4
echo "$id $suf $(ls $dir | wc -l) cuadros"
