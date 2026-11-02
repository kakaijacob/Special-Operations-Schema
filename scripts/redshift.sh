#!/usr/bin/env bash
# Open a psql session on the data warehouse. Password comes from REDSHIFT_PASSWORD,
# a gitignored .env file, or ~/.pgpass. Never pass the password on the command line.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

: "${REDSHIFT_HOST:=data-team-redshift-cluster.cl7jeettwzsg.us-east-2.redshift.amazonaws.com}"
: "${REDSHIFT_PORT:=5439}"
: "${REDSHIFT_DATABASE:=data_warehouse}"
: "${REDSHIFT_USER:=jacob_kakai}"
: "${REDSHIFT_SCHEMA:=mentors}"

if [[ ! "$REDSHIFT_SCHEMA" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
  echo "REDSHIFT_SCHEMA must be a plain identifier." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is not installed. On Ubuntu/WSL: sudo apt-get update && sudo apt-get install -y postgresql-client" >&2
  exit 1
fi

if [[ -z "${REDSHIFT_PASSWORD:-}" && ! -f "${PGPASSFILE:-$HOME/.pgpass}" ]]; then
  echo "Set REDSHIFT_PASSWORD in .env or the environment, or create ~/.pgpass. Do not commit the password." >&2
  exit 1
fi

if [[ -n "${REDSHIFT_PASSWORD:-}" ]]; then
  export PGPASSWORD="$REDSHIFT_PASSWORD"
fi

exec psql \
  "host=${REDSHIFT_HOST} port=${REDSHIFT_PORT} dbname=${REDSHIFT_DATABASE} user=${REDSHIFT_USER} sslmode=require connect_timeout=20" \
  -v ON_ERROR_STOP=1 \
  -c "SET search_path TO ${REDSHIFT_SCHEMA}, public;" \
  "$@"
