with assessments as (

    select * from {{ ref('stg_mentors__moh_skills_checklist') }}

)

select
    submission_id,
    toDate(submitted_at) as submission_date,
    toStartOfMonth(submitted_at) as submission_month,
    started_at,
    ended_at,
    submitted_at,
    dateDiff('second', started_at, ended_at) / 60.0 as assessment_duration_minutes,
    county,
    facility,
    facility_code,
    program,
    mentee_name,
    mentee_id,
    skill_evaluation
from assessments
