#!/usr/bin/env bash
# Demo: prove Lesson 04 Models path against ClickHouse (requires profiles.yml + CLICKHOUSE_PASSWORD).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== dbt debug =="
dbt debug

echo "== list models =="
dbt ls --resource-type model

echo "== run staging sample =="
dbt run --select stg_customers stg_products

echo "== compile marts customers (shows ref resolution) =="
dbt compile --select customers
COMPILED=$(find target/compiled -path '*marts/customers.sql' | head -1)
echo "Compiled file: $COMPILED"
rg -n "ref|jaffle_shop|stg_" "$COMPILED" | head -20 || true

echo "== verify Lab A SQL builds =="
cp models/marts/product_type_summary.sql.solution models/marts/_demo_product_type_summary.sql
dbt run --select _demo_product_type_summary
rm -f models/marts/_demo_product_type_summary.sql

echo "== verify order_items exemplar builds =="
cp models/marts/_exemplar_order_items.sql.exemplar models/marts/_demo_order_items.sql
dbt run --select _demo_order_items
rm -f models/marts/_demo_order_items.sql

echo "== demo complete =="
echo "Drop demo tables in ClickHouse if desired:"
echo "  DROP TABLE IF EXISTS jaffle_shop._demo_product_type_summary;"
echo "  DROP TABLE IF EXISTS jaffle_shop._demo_order_items;"
