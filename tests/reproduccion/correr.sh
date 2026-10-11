#!/usr/bin/env bash
# Reproduce los 6 puntos de la revisión contra la versión anterior (la del zip
# kocos-pipeline-etapa1.zip aplicado sobre 7c721bf), con la misma base de
# pruebas y la misma red simulada que tests/integracion.
# Uso: bash tests/reproduccion/correr.sh /ruta/a/la/version-anterior
set -euo pipefail
cd "$(dirname "$0")/../.."
ANTERIOR="$(cd "${1:?Indicá la carpeta de la versión anterior}" && pwd)"
[ -f "$ANTERIOR/src/lib/campaigns.ts" ] || { echo "No parece la carpeta del proyecto: $ANTERIOR"; exit 1; }
# La versión anterior usa las mismas dependencias (mismo package-lock.json).
[ -e "$ANTERIOR/node_modules" ] || ln -s "$PWD/node_modules" "$ANTERIOR/node_modules"

COMPOSE="docker compose -f tests/integracion/docker-compose.yml"
TSX="${TSX:-npx --yes tsx@4.23.12}"
$COMPOSE up -d --wait db
PSQL="$COMPOSE exec -T db psql -U postgres" bash tests/integracion/preparar_base.sh
$COMPOSE up -d rest
for i in $(seq 1 60); do curl -fsS -o /dev/null http://127.0.0.1:54331/ && break; sleep 1; done

TMP="$(mktemp -d)"
cat > "$TMP/tsconfig.json" <<JSON
{ "compilerOptions": { "target": "ES2022", "module": "esnext", "moduleResolution": "bundler", "strict": false,
    "esModuleInterop": true, "skipLibCheck": true, "baseUrl": "/", "paths": { "@/*": ["$ANTERIOR/src/*"] } } }
JSON
export PRUEBAS_REST_URL=http://127.0.0.1:54331
export PRUEBAS_JWT_SECRET=secreto-de-pruebas-locales-con-al-menos-32-caracteres
status=0
$TSX --tsconfig "$TMP/tsconfig.json" --test tests/reproduccion/entrega-anterior.test.ts || status=$?
if [ "${CONSERVAR:-0}" != "1" ]; then $COMPOSE down -v; fi
exit $status
