#!/usr/bin/env bash
# Aloja reels terminados en la landing de cada marca (apps/web/public/redes/<ddmm>/) y comprueba el 200.
# Uso: ./alojar.sh <ddmm> <id> [<id> ...]   (necesita out/<id>.mp4 y out/<id>.jpg)
# Sube primero a main y después a la rama de trabajo. Escribe una línea por archivo en alojados.log.
set -u
cd "$(dirname "$0")"; ATLAS=$(pwd); DD=$1; shift
declare -A REPO=([vita]=estudio-juridico-vita-final [coberturas]=coberturas-sociales-landing [autos]=0km-kocos-agencia [marketing]=agencia-kocos-mkt)
declare -A DOM=([vita]=www.estudiojuridicovita.com [coberturas]=www.comparatuobrasocial.com [autos]=www.autoskocos.com [marketing]=www.kocosmkt.com)
RAMA=claude/brave-hawking-nzsr60
declare -A TOCADOS=()
for id in "$@"; do
  m=${id%%-*}; r=/home/user/${REPO[$m]}; d=$r/apps/web/public/redes/$DD
  [ -f out/$id.mp4 ] || { echo "$id SIN VIDEO" >> alojados.log; continue; }
  mkdir -p "$d" && cp out/$id.mp4 out/$id.jpg "$d"/ && TOCADOS[$m]=1
done
for m in "${!TOCADOS[@]}"; do
  r=/home/user/${REPO[$m]}
  ( cd "$r" && git fetch -q origin main && git merge -q --ff-only origin/main 2>/dev/null; git add apps/web/public/redes/$DD \
    && git commit -qm "Redes: reels del $DD" && git push -q origin HEAD:main && git push -q origin HEAD:$RAMA ) || echo "$m ERROR al subir" >> "$ATLAS/alojados.log"
done
sleep 90
for id in "$@"; do
  m=${id%%-*}
  for ext in mp4 jpg; do
    u="https://${DOM[$m]}/redes/$DD/$id.$ext"; c=0
    for k in 1 2 3 4 5 6; do c=$(curl -s -o /dev/null -w '%{http_code}' -I "$u"); [ "$c" = 200 ] && break; sleep 45; done
    echo "$(date +%H:%M) $id $ext $c $u" >> "$ATLAS/alojados.log"
  done
done
