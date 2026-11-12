-- Intermediate summary: one row per customer with order activity aggregates.
-- Built from staging; consumed by marts (e.g. customers).

with orders as (
    select * from {{ ref('stg_orders') }}
)

select
    customer_id,
    min(ordered_at) as first_order_at,
    max(ordered_at) as most_recent_order_at,
    count() as number_of_orders,
    sum(order_total) as lifetime_spend
from orders
group by customer_id
