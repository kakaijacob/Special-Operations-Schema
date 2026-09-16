# Lesson 04 — Exact copy-paste walkthrough

Do this in WSL from `jaffle_shop_dbt`. Takes ~20–30 minutes if you follow exactly.

```bash
cd ~/projects/Special-Operations-Schema
git pull origin cursor/new-stack-tutor-bea8
cd jaffle_shop_dbt
dbt debug
```

---

## Part 1 — What is a model? (2 min)

A model is a `.sql` file. Filename = warehouse object name.

Already built for you:

- `models/staging/stg_customers.sql` → `jaffle_shop.stg_customers` (view)
- `models/marts/customers.sql` → `jaffle_shop.customers` (table)

```bash
dbt run --select stg_customers
dbt ls --select staging.*
```

---

## Part 2 — Lab A: first model from scratch (8 min)

```bash
# create the real model file from the lab template
cp models/marts/product_type_summary.sql.lab models/marts/product_type_summary.sql
```

Open `models/marts/product_type_summary.sql` and replace **all** contents with:

```sql
with products as (
    select * from {{ ref('stg_products') }}
)

select
    product_type,
    count() as number_of_products,
    sum(product_price) as catalog_price_sum
from products
group by product_type
order by product_type
```

```bash
dbt run --select product_type_summary
```

ClickHouse check:

```sql
SELECT * FROM jaffle_shop.product_type_summary;
```

Expect: `beverage` and `jaffle` rows.

**Concepts used:** model file, `ref()`, mart folder → table materialization.

---

## Part 3 — Modularity + ref (5 min)

Open `models/marts/customers.sql`. Note it does **not** read `raw.raw_customers` directly — it uses `ref('stg_customers')` and `ref('stg_orders')`.

```bash
dbt compile --select customers
# inspect compiled SQL (refs resolved to jaffle_shop.stg_*):
find target/compiled -name customers.sql | head -1 | xargs head -40
```

| Upstream | Macro |
|----------|--------|
| Airbyte raw | `source('ecom', 'raw_…')` |
| dbt model | `ref('…')` |

---

## Part 4 — Troubleshooting + selection (3 min)

```bash
dbt run --select stg_customers          # one model
dbt run --select +customers             # customers + parents
dbt run --select staging.*                # folder (may need path syntax)
dbt ls
```

If something fails: `dbt debug`, check `~/.dbt/profiles.yml` indent, confirm IP allowlist.

---

## Part 5 — Frameworks, naming, folders, materializations (5 min)

- **Staging** `stg_*` = clean/rename (views)
- **Marts** = business tables (tables)
- Names: `customer_id`, `ordered_at`, `is_perishable`
- Config in `dbt_project.yml` under `models.jaffle_shop_dbt.staging|marts`

```sql
SELECT name, engine
FROM system.tables
WHERE database = 'jaffle_shop'
ORDER BY name;
```

---

## Part 6 — Practice: order_items (10 min)

```bash
cp models/marts/order_items.sql.practice models/marts/order_items.sql
```

Replace contents of `order_items.sql` with:

```sql
with order_items as (
    select * from {{ ref('stg_order_items') }}
),

products as (
    select * from {{ ref('stg_products') }}
),

orders as (
    select * from {{ ref('stg_orders') }}
)

select
    order_items.order_item_id,
    order_items.order_id,
    orders.customer_id,
    order_items.sku,
    products.product_name,
    products.product_type,
    products.product_price,
    orders.ordered_at,
    orders.order_total
from order_items
left join products
    on order_items.sku = products.sku
left join orders
    on order_items.order_id = orders.order_id
```

```bash
dbt run --select order_items
```

```sql
SELECT count() FROM jaffle_shop.order_items;  -- ~90183
SELECT * FROM jaffle_shop.order_items LIMIT 5;
```

---

## Part 7 — Knowledge check (5 min)

Answer without looking, then open `LESSON_04_MODELS_ANSWERS.md`:

1. Staging default materialization here? Why?
2. `source()` vs `ref()`?
3. Command to rebuild `customers` and its upstream?
4. Why `customer_id` not `id`?
5. Why mart as table not view?

---

## Done when

- [ ] `product_type_summary` exists in ClickHouse
- [ ] `order_items` ~90183 rows
- [ ] Knowledge check attempted
