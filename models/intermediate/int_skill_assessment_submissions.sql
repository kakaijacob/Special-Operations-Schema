with assessments as (

    select * from {{ ref('stg_mentors__moh_skills_checklist') }}

)

select
    submission_id,
    submitted_at::date as submission_date,
    date_trunc('month', submitted_at)::date as submission_month,
    started_at,
    ended_at,
    submitted_at,
    extract(epoch from (ended_at - started_at)) / 60.0 as assessment_duration_minutes,
    county,
    facility,
    facility_code,
    program,
    mentee_name,
    mentee_id,
    skill_evaluation
from assessments
