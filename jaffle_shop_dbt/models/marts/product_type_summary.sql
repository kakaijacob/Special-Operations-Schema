-- SOLUTION for Lab A — only open after you try product_type_summary.sql.lab
-- To use: copy contents into product_type_summary.sql then:
--   dbt run --select product_type_summary

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
