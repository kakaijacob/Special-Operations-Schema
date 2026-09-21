with customers as (
    select * from {{ ref('stg_customers') }}
),

customer_order_summary as (
    select * from {{ ref('int_customer_order_summary') }}
)

select
    customers.customer_id,
    customers.customer_name,
    customer_order_summary.first_order_at,
    customer_order_summary.most_recent_order_at,
    coalesce(customer_order_summary.number_of_orders, 0) as number_of_orders,
    coalesce(customer_order_summary.lifetime_spend, 0) as lifetime_spend
from customers
left join customer_order_summary
    on customers.customer_id = customer_order_summary.customer_id
