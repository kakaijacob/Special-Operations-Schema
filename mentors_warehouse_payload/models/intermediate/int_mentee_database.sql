-- Combined mentee master: current (ke_mentors_mentees) ∪ legacy
-- (ke_mentors_legacy_mentees). One row per mentee_id.
-- Attributes prefer the current sheet when the same id appears in both;
-- flags record which sheet(s) contributed the id.

with unioned as (

    select
        mentee_id,
        mentee_name,
        county,
        facility,
        facility_code,
        program,
        date_activated,
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
        date_activated,
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

),

preferred as (

    select
        mentee_id,
        mentee_name,
        county,
        facility,
        facility_code,
        program,
        date_activated,
        mentee_source as preferred_source
    from ranked
    where rn = 1

),

source_flags as (

    select
        mentee_id,
        max(mentee_source = 'current') as in_current,
        max(mentee_source = 'legacy') as in_legacy
    from unioned
    group by mentee_id

)

select
    p.mentee_id,
    p.mentee_name,
    p.county,
    p.facility,
    p.facility_code,
    p.program,
    p.date_activated,
    p.preferred_source as mentee_source,
    toUInt8(f.in_current) as in_current,
    toUInt8(f.in_legacy) as in_legacy
from preferred p
inner join source_flags f
    on p.mentee_id = f.mentee_id
