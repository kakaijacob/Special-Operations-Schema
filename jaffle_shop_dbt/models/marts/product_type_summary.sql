-- Mart: product type summary for analytics / Lab A.
-- Aggregation lives in int_product_type_summary; this mart selects it for consumers.

select
    product_type,
    number_of_products,
    catalog_price_sum
from {{ ref('int_product_type_summary') }}
order by product_type
