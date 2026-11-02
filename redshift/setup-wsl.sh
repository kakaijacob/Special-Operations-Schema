#!/usr/bin/env bash
# Install the Redshift client from this clone of
# https://github.com/kakaijacob/Special-Operations-Schema
# Safe to re-run. The password is written only to ~/.pgpass (mode 600).
set -euo pipefail

ROOT="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
CONF="$ROOT/pg_service.conf"

if ! command -v psql >/dev/null 2>&1; then
  sudo apt update
  sudo apt install -y postgresql-client
fi

host="$(awk -F= '/^host=/{print $2; exit}' "$CONF")"
port="$(awk -F= '/^port=/{print $2; exit}' "$CONF")"
dbname="$(awk -F= '/^dbname=/{print $2; exit}' "$CONF")"
user="$(awk -F= '/^user=/{print $2; exit}' "$CONF")"

if [[ -z "$host" || -z "$port" || -z "$dbname" || -z "$user" ]]; then
  echo "Could not read host, port, dbname, and user from $CONF" >&2
  exit 1
fi

mkdir -p "$HOME/bin"
chmod 700 "$HOME/bin"

read -s -p "Redshift password: " REDSHIFT_PASSWORD
echo
printf '%s\n' "${host}:${port}:${dbname}:${user}:${REDSHIFT_PASSWORD}" > "$HOME/.pgpass"
chmod 600 "$HOME/.pgpass"
unset REDSHIFT_PASSWORD

chmod 700 "$ROOT/redshift"
ln -sfn "$ROOT/redshift" "$HOME/bin/redshift"

if [[ -f "$HOME/.bashrc" ]] && grep -q 'HOME/bin' "$HOME/.bashrc"; then
  :
else
  printf '\nexport PATH="$HOME/bin:$PATH"\n' >> "$HOME/.bashrc"
fi
export PATH="$HOME/bin:$PATH"

"$ROOT/redshift" -c "SELECT current_user, current_database(), current_schema();"
