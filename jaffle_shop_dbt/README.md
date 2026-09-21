# jaffle_shop_dbt

dbt project for the New Stack Tutor: transform Airbyte-loaded Jaffle Shop tables in ClickHouse.

## Layers

```text
raw.* (Airbyte)
  → staging (stg_*)
  → intermediate (int_customer_order_summary)
  → marts (customers, orders, order_items, …)
```

## Quick start

1. Install: `pip install dbt-core dbt-clickhouse`
2. Copy `profiles.yml.example` ideas into `~/.dbt/profiles.yml`
3. `export CLICKHOUSE_PASSWORD='...'`
4. `dbt debug`
5. `dbt run && dbt test`

See `New_Stack_Tutor.md` Part 3 / §04 Models for full steps.
