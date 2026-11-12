#!/usr/bin/env bash
# Idempotent Cloud Agent install for Special-Operations-Schema.
# Installs dbt + ClickHouse adapter; parses mentors dbt project when present.
set -euo pipefail

python3 -m pip install --user --upgrade pip
python3 -m pip install --user \
  "dbt-core==1.9.11" \
  "dbt-clickhouse==1.10.3"

export PATH="${HOME}/.local/bin:${PATH}"
dbt --version

# Prefer transfer payload; fall back to in-repo dbt/ tree.
DBT_DIR=""
if [[ -f mentors_warehouse_payload/dbt_project.yml ]]; then
  DBT_DIR="mentors_warehouse_payload"
elif [[ -f dbt/dbt_project.yml ]]; then
  DBT_DIR="dbt"
fi

if [[ -n "${DBT_DIR}" ]]; then
  echo "dbt project detected: ${DBT_DIR}"
  # Dummy connection values for parse-only (no live ClickHouse required).
  export DBT_PROFILES_DIR="$(pwd)/${DBT_DIR}"
  export DBT_HOST="${DBT_HOST:-127.0.0.1}"
  export DBT_USER="${DBT_USER:-default}"
  export DBT_PASSWORD="${DBT_PASSWORD:-unused}"
  export DBT_USER_SCHEMA="${DBT_USER_SCHEMA:-dev_cloud_agent}"

  # Ensure CI-style profiles.yml exists for parse
  if [[ ! -f "${DBT_DIR}/profiles.yml" ]]; then
    cat > "${DBT_DIR}/profiles.yml" <<'PROFILE'
warehouse_mentors_ke:
  target: dev
  outputs:
    dev:
      type: clickhouse
      schema: "{{ env_var('DBT_USER_SCHEMA', 'dev_cloud_agent') }}"
      host: "{{ env_var('DBT_HOST', '127.0.0.1') }}"
      port: 8443
      user: "{{ env_var('DBT_USER', 'default') }}"
      password: "{{ env_var('DBT_PASSWORD', 'unused') }}"
      secure: true
      threads: 1
PROFILE
  fi

  (cd "${DBT_DIR}" && dbt deps && dbt parse --target dev)
  echo "dbt parse OK (${DBT_DIR})"
else
  echo "No dbt project in checkout; dbt toolchain installed only."
fi
