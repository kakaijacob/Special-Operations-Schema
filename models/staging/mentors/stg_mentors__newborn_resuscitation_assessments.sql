-- Swap this ref() for the processed MoH skills source when real data lands.
with source as (

    select * from {{ ref('newborn_resuscitation_assessment_sample') }}

)

select
    submission_id,
    date_submitted as submitted_at,
    nullIf(trim(mentee_id), '') as mentee_id,
    nullIf(trim(mentee_name), '') as mentee_name,
    nullIf(trim(county), '') as county,
    nullIf(trim(facility), '') as facility,
    nullIf(trim(facility_code), '') as facility_code,
    lowerUTF8(trim(program)) as program,
    lowerUTF8(trim(skill_evaluation)) as skill_evaluation,
    toFloat64(average_score) as average_score
from source
where lowerUTF8(trim(skill_evaluation)) = 'newborn resuscitation'
  and lowerUTF8(trim(program)) = 'newborn curriculum'
