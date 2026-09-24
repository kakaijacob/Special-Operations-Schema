# Workstream while ClickHouse privileges are pending

Connection/`dbt debug` can wait until `jh_dna_dev` can use a schema
(`dev_wanyama` or `default`) with CREATE/SELECT grants.

## Do today (no live warehouse required)

1. **Confirm repo is pushed** — https://github.com/kakaijacob/mentors_warehouse
2. **Inventory raw tables** — list what Airbyte (or others) will load; fill `models/staging/_sources.yml`
3. **Write staging / int / mart stubs** — SQL + YAML docs (this PR adds starters)
4. **Document privilege ask** — send `docs/clickhouse_grants_request.sql` to whoever admins ClickHouse
5. **Keep secrets in env only** — `~/.config/warehouse_mentors_ke.env` (never commit passwords)
6. **Optional:** `dbt parse` once connection works; until then just review files in the IDE

## Do tomorrow (after grants)

```bash
cd ~/projects/mentors_warehouse
source ~/.config/warehouse_mentors_ke.env
# Prefer your own schema once created+granted:
#   export DBT_USER_SCHEMA='dev_wanyama'
dbt debug --target dev
dbt run --select staging.*
dbt test
```

## Privilege ask (copy to admin)

See `docs/clickhouse_grants_request.sql`.
