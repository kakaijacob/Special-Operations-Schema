# Lesson 04 — Knowledge check answers

Try the questions in `New_Stack_Tutor.md` before reading these.

1. **View.** `dbt_project.yml` sets `staging: +materialized: view` so staging stays cheap and always reflects upstream when queried.

2. **`source()`** for raw/loaded warehouse tables declared in `_sources.yml` (Airbyte). **`ref()`** for other dbt models so dbt can order the DAG and resolve schemas.

3. **`dbt run --select +customers`** (plus sign *before* the model = include upstream parents). That rebuilds `stg_orders` (and other parents) then `customers`.

4. **`customer_id` is explicit** — after joins, bare `id` is ambiguous (`order_id` vs `customer_id`). Clear names make marts safer.

5. **Tables are faster for BI** (precomputed storage) / avoid re-running heavy joins on every dashboard query. Views recompute every time.
