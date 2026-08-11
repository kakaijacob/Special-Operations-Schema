with db_mentees as (

    select
        mentee_id,
        any(mentee_name) as mentee_name,
        any(county) as county,
        any(facility) as facility,
        any(facility_code) as facility_code
    from {{ ref('stg_mentors__mentee_database') }}
    where program in ('emonc curriculum', 'both')
      and mentee_id is not null
    group by mentee_id

),

fact_mentees as (

    select
        mentee_id,
        max(mentee_name) as mentee_name,
        max(county) as county,
        max(facility) as facility,
        max(facility_code) as facility_code
    from (
        select
            mentee_id,
            mentee_name,
            county,
            facility,
            facility_code
        from {{ ref('stg_mentors__mentee_curriculum_tracking') }}

        union all

        select
            mentee_id,
            mentee_name,
            county,
            facility,
            facility_code
        from {{ ref('stg_mentors__processed_skill_assessments') }}
    )
    where mentee_id is not null
    group by mentee_id

),

mentee_ids as (

    select mentee_id from db_mentees
    union distinct
    select mentee_id from fact_mentees

)

select
    ids.mentee_id as mentee_id,
    coalesce(nullIf(d.mentee_name, ''), nullIf(f.mentee_name, '')) as mentee_name,
    coalesce(nullIf(d.county, ''), nullIf(f.county, '')) as county,
    coalesce(nullIf(d.facility, ''), nullIf(f.facility, '')) as facility,
    coalesce(nullIf(d.facility_code, ''), nullIf(f.facility_code, '')) as facility_code
from mentee_ids ids
left join db_mentees d on ids.mentee_id = d.mentee_id
left join fact_mentees f on ids.mentee_id = f.mentee_id
