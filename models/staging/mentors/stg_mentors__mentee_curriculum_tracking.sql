-- Swap this ref() for source('mentors', 'mentee_curriculum_tracking') when real data lands.
with source as (

    select * from {{ ref('mentee_curriculum_tracking_sample') }}

)

select
    submission_id,
    date_submitted as submitted_at,
    nullIf(trim(mentee_id), '') as mentee_id,
    nullIf(trim(mentee_name), '') as mentee_name,
    nullIf(trim(county), '') as county,
    nullIf(trim(facility), '') as facility,
    nullIf(trim(facility_code), '') as facility_code,
    lowerUTF8(trim(mentorship_activity)) as mentorship_activity,
    nullIf(trim(topic), '') as topic
from source
