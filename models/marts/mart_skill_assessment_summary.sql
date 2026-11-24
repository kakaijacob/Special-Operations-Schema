with assessments as (

    select * from {{ ref('int_skill_assessment_submissions') }}

)

select
    submission_month,
    county,
    facility_code,
    facility,
    program,
    skill_evaluation,
    count(*) as assessment_count,
    count(distinct mentee_id) as assessed_mentee_count,
    avg(assessment_duration_minutes) as average_assessment_duration_minutes,
    min(submitted_at) as first_submitted_at,
    max(submitted_at) as last_submitted_at
from assessments
group by
    submission_month,
    county,
    facility_code,
    facility,
    program,
    skill_evaluation
