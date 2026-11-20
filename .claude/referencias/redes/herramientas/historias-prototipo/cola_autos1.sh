#!/bin/bash
# Cola de render del tramo autos-1: sonido + render + borrar cuadros, uno por vez.
cd "$(dirname "$0")"; for id in "$@"; do python3 sonido.py $id > /dev/null 2>&1; bash render_a.sh $id 30 1 4; rm -rf fr/$id-h; echo "LISTO $id $(date +%H:%M)"; done
