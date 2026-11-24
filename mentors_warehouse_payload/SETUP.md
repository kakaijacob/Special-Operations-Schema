# SETUP — jacaranda_mentors / warehouse_mentors_ke

| Role | Name |
|------|------|
| GitHub repo | `Jacaranda-Health/mentors_warehouse` |
| dbt project `name` | `jacaranda_mentors` |
| Profile key | `warehouse_mentors_ke` |
| Prod schema | `dbt_mentors_ke` (+ `_gold` for marts/metrics) |
| Dev schema default | `dev_wanyama` |

Create databases, allowlist IP, copy `secrets.env.example` → `~/.config/warehouse_mentors_ke.env`,
merge `profiles.yml.example` into `~/.dbt/profiles.yml`, then `dbt deps && dbt debug --target dev`.

Models: staging → intermediate → marts → metrics (EmONC + newborn). Offline via `use_sample_seeds`.
