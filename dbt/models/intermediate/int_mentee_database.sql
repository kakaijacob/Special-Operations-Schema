-- Prefer current sheet over legacy when the same mentee_id appears in both.
with unioned as (

    select
        mentee_id,
        mentee_name,
        county,
        facility,
        facility_code,
        program,
        mentee_source,
        toUInt8(1) as source_priority
    from {{ ref('stg_googlesheets__ke_mentors_mentees') }}
    where mentee_id is not null

    union all

    select
        mentee_id,
        mentee_name,
        county,
        facility,
        facility_code,
        program,
        mentee_source,
        toUInt8(2) as source_priority
    from {{ ref('stg_googlesheets__ke_mentors_legacy_mentees') }}
    where mentee_id is not null

),

ranked as (

    select
        *,
        row_number() over (
            partition by mentee_id
            order by source_priority, mentee_name
        ) as rn
    from unioned

)

select
    mentee_id,
    mentee_name,
    county,
    facility,
    facility_code,
    program,
    mentee_source
from ranked
where rn = 1
