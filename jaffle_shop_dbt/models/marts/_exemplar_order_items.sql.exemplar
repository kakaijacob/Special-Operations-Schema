-- EXEMPLAR — reference only. Do not copy blindly; try the practice file first.
-- Production model path after you finish practice: models/marts/order_items.sql

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
