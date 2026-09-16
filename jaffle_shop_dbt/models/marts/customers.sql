with customers as (
    select * from {{ ref('stg_customers') }}
),

orders as (
    select * from {{ ref('stg_orders') }}
),

customer_orders as (
    select
        customer_id,
        min(ordered_at) as first_order_at,
        max(ordered_at) as most_recent_order_at,
        count() as number_of_orders,
        sum(order_total) as lifetime_spend
    from orders
    group by customer_id
)

select
    customers.customer_id,
    customers.customer_name,
    customer_orders.first_order_at,
    customer_orders.most_recent_order_at,
    coalesce(customer_orders.number_of_orders, 0) as number_of_orders,
    coalesce(customer_orders.lifetime_spend, 0) as lifetime_spend
from customers
left join customer_orders
    on customers.customer_id = customer_orders.customer_id
