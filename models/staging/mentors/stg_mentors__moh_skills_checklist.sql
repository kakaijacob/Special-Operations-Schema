with source as (

    select * from {{ source('mentors', 'moh_skills_checklist') }}

),

renamed as (

    select
        submission_id,
        date_started::timestamp as started_at,
        date_ended::timestamp as ended_at,
        date_submitted::timestamp as submitted_at,
        nullif(trim(county::text), '') as county,
        nullif(trim(facility::text), '') as facility,
        nullif(trim(facility_code::text), '') as facility_code,
        nullif(trim(program::text), '') as program,
        nullif(trim(mentee_name::text), '') as mentee_name,
        nullif(trim(mentee_id::text), '') as mentee_id,
        nullif(trim(skill_evaluation::text), '') as skill_evaluation
    from source

)

select * from renamed
