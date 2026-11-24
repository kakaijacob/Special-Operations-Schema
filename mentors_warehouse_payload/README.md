# Jacaranda Mentors (Kenya) — dbt warehouse

| Item | Value |
|------|--------|
| dbt project (`name`) | `jacaranda_mentors` |
| Profile | `warehouse_mentors_ke` |
| ClickHouse host | `tplb1fkekn.eu-west-2.aws.clickhouse.cloud` |
| Prod schema convention | `dbt_mentors_ke` (+ `_gold` / `_snapshots` in prod) |
| Repo | https://github.com/Jacaranda-Health/mentors_warehouse |

Full setup: **[SETUP.md](./SETUP.md)**

## Layout

```text
models/
  staging/         # googlesheets / kobotoolbox / processed facts
  intermediate/    # mentee spine, EmONC + newborn cohort logic
  marts/           # BI tables → gold schema in prod
  metrics/         # coverage / progress / sessions → gold
  exports/         # external interfaces (pending)
macros/
seeds/
profiles.yml
profiles.yml.example
secrets.env.example
packages.yml
```

## Quick start

```bash
cp secrets.env.example ~/.config/warehouse_mentors_ke.env
source ~/.config/warehouse_mentors_ke.env
# merge profiles.yml.example into ~/.dbt/profiles.yml
dbt deps && dbt debug --target dev
dbt seed --target dev && dbt run --target dev
```

Default `use_sample_seeds: true`. Set false after wiring live Airbyte tables.
