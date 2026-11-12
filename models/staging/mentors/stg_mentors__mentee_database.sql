-- Swap this ref() for source('mentors', 'mentee_database') when real data lands.
with source as (

    select * from {{ ref('mentee_database_sample') }}

)

select
    nullIf(trim(mentee_id), '') as mentee_id,
    nullIf(trim(mentee_name), '') as mentee_name,
    nullIf(trim(county), '') as county,
    nullIf(trim(facility), '') as facility,
    nullIf(trim(facility_code), '') as facility_code,
    lowerUTF8(trim(program)) as program
from source
