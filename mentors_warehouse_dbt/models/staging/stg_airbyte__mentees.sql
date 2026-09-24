-- Staging: clean mentee rows from Airbyte.
-- Confirm source table name/columns after first sync, then expand renames/casts.

with source as (
    select * from {{ source('airbyte', 'mentees') }}
),

renamed as (
    select
        -- TODO: map real Airbyte column names after inspecting DESCRIBE TABLE
        *
    from source
)

select * from renamed
