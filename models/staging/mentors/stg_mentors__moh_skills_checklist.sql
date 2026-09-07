-- Reads the seed sample for practice. When real data is ingested into
-- ClickHouse, declare it as a source and swap this ref() for source().
with source as (

    select * from {{ ref('moh_skills_checklist_sample') }}

),

renamed as (

    select
        submission_id,
        date_started as started_at,
        date_ended as ended_at,
        date_submitted as submitted_at,
        nullIf(trim(county), '') as county,
        nullIf(trim(facility), '') as facility,
        nullIf(trim(facility_code), '') as facility_code,
        nullIf(trim(program), '') as program,
        nullIf(trim(mentee_name), '') as mentee_name,
        nullIf(trim(mentee_id), '') as mentee_id,
        nullIf(trim(skill_evaluation), '') as skill_evaluation
    from source

)

select * from renamed
