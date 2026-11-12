-- Swap this ref() for source('mentors', 'process_moh_skills_assessment_2026')
-- when the processed skill-assessment table is available in ClickHouse.
with source as (

    select * from {{ ref('process_moh_skills_assessment_sample') }}

)

select
    submission_id,
    date_submitted as submitted_at,
    nullIf(trim(mentee_id), '') as mentee_id,
    nullIf(trim(mentee_name), '') as mentee_name,
    nullIf(trim(county), '') as county,
    nullIf(trim(facility), '') as facility,
    nullIf(trim(facility_code), '') as facility_code,
    nullIf(trim(skill_evaluation), '') as skill_evaluation,
    toFloat64(average_score) as average_score
from source
