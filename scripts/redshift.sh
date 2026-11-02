#!/usr/bin/env bash
# Query the data-team Redshift cluster using environment secrets.
# Usage:
#   ./scripts/redshift.sh
#   ./scripts/redshift.sh -c 'SELECT current_user, current_database()'
#   ./scripts/redshift.sh -f path/to/query.sql
set -euo pipefail

: "${REDSHIFT_HOST:?REDSHIFT_HOST is required}"
: "${REDSHIFT_USER:?REDSHIFT_USER is required}"
: "${REDSHIFT_PASSWORD:?REDSHIFT_PASSWORD is required}"

REDSHIFT_PORT="${REDSHIFT_PORT:-5439}"
REDSHIFT_DATABASE="${REDSHIFT_DATABASE:-data_warehouse}"
REDSHIFT_SCHEMA="${REDSHIFT_SCHEMA:-mentors}"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is not installed. On Ubuntu/WSL: sudo apt-get install -y postgresql-client" >&2
  exit 1
fi

export PGHOST="$REDSHIFT_HOST"
export PGPORT="$REDSHIFT_PORT"
export PGUSER="$REDSHIFT_USER"
export PGDATABASE="$REDSHIFT_DATABASE"
export PGPASSWORD="$REDSHIFT_PASSWORD"

if [[ $# -eq 0 ]]; then
  exec psql -v ON_ERROR_STOP=1 -c "SET search_path TO ${REDSHIFT_SCHEMA}; SELECT current_user, current_database(), current_schema();"
fi

exec psql -v ON_ERROR_STOP=1 "$@"
