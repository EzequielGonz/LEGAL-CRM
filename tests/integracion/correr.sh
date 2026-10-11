#!/usr/bin/env bash
# Pruebas de integración de punta a punta con Docker:
#   levanta PostgreSQL y PostgREST, crea la base de pruebas desde cero y
#   corre las pruebas. Meta, Storage y cualquier llamada externa están
#   simulados: ninguna prueba puede enviar un mensaje real.
# Requiere: Docker con "docker compose" y Node 20 o superior, con las
# dependencias instaladas (npm ci).
set -euo pipefail
cd "$(dirname "$0")/../.."
COMPOSE="docker compose -f tests/integracion/docker-compose.yml"
TSX="${TSX:-npx --yes tsx@4.23.12}"

$COMPOSE up -d --wait db
PSQL="$COMPOSE exec -T db psql -U postgres" bash tests/integracion/preparar_base.sh
$COMPOSE up -d rest
for i in $(seq 1 60); do
  curl -fsS -o /dev/null http://127.0.0.1:54331/ && break
  sleep 1
done

export PRUEBAS_REST_URL=http://127.0.0.1:54331
export PRUEBAS_JWT_SECRET=secreto-de-pruebas-locales-con-al-menos-32-caracteres
status=0
$TSX --tsconfig tests/tsconfig.json --test --test-concurrency=1 tests/integracion/*.int.test.ts || status=$?

if [ "${CONSERVAR:-0}" != "1" ]; then $COMPOSE down -v; fi
exit $status
