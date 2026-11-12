with source as (
    select * from {{ source('ecom', 'raw_supplies') }}
),

renamed as (
    select
        id as supply_id,
        sku,
        name as supply_name,
        toInt64OrZero(toString(cost)) as cost_cents,
        {{ cents_to_dollars('cost') }} as supply_cost,
        upper(toString(perishable)) in ('TRUE', '1', 'T', 'YES') as is_perishable
    from source
)

select * from renamed
