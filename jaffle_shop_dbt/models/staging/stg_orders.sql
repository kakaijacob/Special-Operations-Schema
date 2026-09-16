with source as (
    select * from {{ source('ecom', 'raw_orders') }}
),

renamed as (
    select
        id as order_id,
        customer as customer_id,
        store_id as location_id,
        toInt64OrZero(toString(subtotal)) as subtotal_cents,
        toInt64OrZero(toString(tax_paid)) as tax_paid_cents,
        toInt64OrZero(toString(order_total)) as order_total_cents,
        {{ cents_to_dollars('subtotal') }} as subtotal,
        {{ cents_to_dollars('tax_paid') }} as tax_paid,
        {{ cents_to_dollars('order_total') }} as order_total,
        parseDateTimeBestEffortOrNull(toString(ordered_at)) as ordered_at
    from source
)

select * from renamed
