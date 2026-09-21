# Lesson 04 — Models (cheat sheet)

Use with `New_Stack_Tutor.md` §04. Project root: `jaffle_shop_dbt/`.

## Quick commands

```bash
cd ~/projects/Special-Operations-Schema/jaffle_shop_dbt
git pull
dbt debug
dbt run --select stg_customers
dbt ls
dbt run --select +customers
dbt compile
```

## DAG for this project

```text
raw.raw_*  --source()-->  stg_*  --ref()-->  int_* (summaries)  --ref()-->  marts
                                              └─ int_customer_order_summary
                                                                    └─ customers
```

## source vs ref

| Need | Macro |
|------|--------|
| Airbyte raw table | `{{ source('ecom', 'raw_customers') }}` |
| Another model | `{{ ref('stg_customers') }}` |

## Materializations here

| Folder | Default |
|--------|---------|
| `models/staging/` | view |
| `models/intermediate/` | view |
| `models/marts/` | table |

Set in `dbt_project.yml`. Override: `{{ config(materialized='table') }}`.

## Practice ladder

1. **Lab A:** `models/marts/product_type_summary.sql.lab` → rename → `dbt run --select product_type_summary`
2. **Practice:** `models/marts/order_items.sql.practice` → rename → `dbt run --select order_items`
3. Compare only if stuck: `_exemplar_order_items.sql.exemplar`

## Knowledge check

Five questions are in `New_Stack_Tutor.md` §11.  
Answers: `LESSON_04_MODELS_ANSWERS.md` (try first!).
