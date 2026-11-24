-- Intermediate summary: one row per product_type with catalog aggregates.
-- Built from staging; consumed by marts (e.g. product_type_summary).

with products as (
    select * from {{ ref('stg_products') }}
)

select
    product_type,
    count() as number_of_products,
    sum(product_price) as catalog_price_sum
from products
group by product_type
