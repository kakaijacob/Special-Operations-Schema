# Jacaranda Mentors (Kenya) — dbt warehouse

| Item | Value |
|------|--------|
| dbt project (`name`) | `jacaranda_mentors` |
| Profile | `warehouse_mentors_ke` |
| ClickHouse host | `tplb1fkekn.eu-west-2.aws.clickhouse.cloud` |
| Prod schema convention | `dbt_mentors_ke` (+ `_gold` / `_snapshots` in prod) |
| Repo | https://github.com/kakaijacob/mentors_warehouse |

Full setup: **[SETUP.md](./SETUP.md)**

## Layout

```text
models/
  staging/         # stg_* (pending)
  intermediate/    # int_* (pending)
  marts/           # BI tables → gold schema in prod (pending)
  metrics/         # indicators → gold (pending)
  exports/         # external interfaces (pending)
macros/            # includes generate_schema_name.sql
profiles.yml       # CI profile (env_var secrets only)
profiles.yml.example
secrets.env.example
packages.yml       # dbt_utils
```

## Quick start (local)

```bash
git clone https://github.com/kakaijacob/mentors_warehouse.git
cd mentors_warehouse

cp secrets.env.example ~/.config/warehouse_mentors_ke.env
nano ~/.config/warehouse_mentors_ke.env   # set DBT_PASSWORD etc.
source ~/.config/warehouse_mentors_ke.env

cp profiles.yml.example ~/.dbt/profiles.yml   # or merge the warehouse_mentors_ke block
# ensure profile: warehouse_mentors_ke exists in ~/.dbt/profiles.yml

dbt deps
dbt debug --target dev
```
