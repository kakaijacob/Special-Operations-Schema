with source as (
    select * from {{ source('ecom', 'raw_stores') }}
),

renamed as (
    select
        id as location_id,
        name as location_name,
        toFloat64OrZero(toString(tax_rate)) as tax_rate,
        parseDateTimeBestEffortOrNull(toString(opened_at)) as opened_at
    from source
)

select * from renamed
