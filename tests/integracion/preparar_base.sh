#!/usr/bin/env bash
# Crea (o recrea) la base de pruebas desde cero:
#   1) lo mínimo de Supabase (roles, auth, permisos por defecto);
#   2) la estructura de producción previa a la Etapa 1, sin datos;
#   3) perfiles y canales de prueba;
#   4) TODAS las migraciones del repositorio, en orden (Etapa 1: 0100 … 0117 y 0199;
#      Etapa 2: 0200 en adelante);
#   5) aviso a la API para que relea la estructura.
# Uso: PSQL="<comando psql>" tests/integracion/preparar_base.sh
#   Con Docker (por defecto):  docker compose -f tests/integracion/docker-compose.yml exec -T db psql -U postgres
#   Con un PostgreSQL propio:  PSQL="psql -h localhost -p 5432 -U postgres"
set -euo pipefail
cd "$(dirname "$0")/../.."
COMPOSE="docker compose -f tests/integracion/docker-compose.yml"
PSQL="${PSQL:-$COMPOSE exec -T db psql -U postgres}"
DB="${PRUEBAS_DB:-crm_pruebas}"

run() { $PSQL -X -q -v ON_ERROR_STOP=1 -d "$1"; }

echo "Base de pruebas: $DB"
printf 'drop database if exists %s with (force);\ncreate database %s;\n' "$DB" "$DB" | run postgres
for f in tests/integracion/sql/00_supabase_minimo.sql \
         tests/integracion/sql/01_estructura_previa_etapa1.sql \
         tests/integracion/sql/02_referencia.sql; do
  echo "  $f"
  run "$DB" < "$f"
done
for f in supabase/migrations/0[1-9][0-9][0-9]_*.sql; do
  echo "  $f"
  run "$DB" < "$f"
done
run "$DB" < tests/integracion/sql/03_api.sql
echo "Lista."
