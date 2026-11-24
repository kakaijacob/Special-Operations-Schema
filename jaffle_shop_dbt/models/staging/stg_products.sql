with source as (
    select * from {{ source('ecom', 'raw_products') }}
),

renamed as (
    select
        sku,
        name as product_name,
        type as product_type,
        toInt64OrZero(toString(price)) as price_cents,
        {{ cents_to_dollars('price') }} as product_price,
        description
    from source
)

select * from renamed
