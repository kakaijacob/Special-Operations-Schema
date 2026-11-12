{#
  Processed MoH skill assessment fact grain:
  one row per (submission × mentee × skill_evaluation) with average_score in [0,1].

  Today: seed stand-in (matches mentors.process_moh_skills_assessment_2026).
  Next: parse from stg_kobotoolbox__moh_skills_assessment_submissions.
#}
{% if var('use_sample_seeds', true) %}

with source as (

    select * from {{ ref('process_moh_skills_assessment_sample') }}

)

select
    toString(submission_id) as submission_id,
    toDateTime(date_submitted) as submitted_at,
    nullIf(trim(toString(mentee_id)), '') as mentee_id,
    nullIf(trim(toString(mentee_name)), '') as mentee_name,
    nullIf(trim(toString(county)), '') as county,
    nullIf(trim(toString(facility)), '') as facility,
    nullIf(trim(toString(facility_code)), '') as facility_code,
    nullIf(trim(toString(skill_evaluation)), '') as skill_evaluation,
    toFloat64(average_score) as average_score
from source

{% else %}

select
    cast(null as Nullable(String)) as submission_id,
    cast(null as Nullable(DateTime)) as submitted_at,
    cast(null as Nullable(String)) as mentee_id,
    cast(null as Nullable(String)) as mentee_name,
    cast(null as Nullable(String)) as county,
    cast(null as Nullable(String)) as facility,
    cast(null as Nullable(String)) as facility_code,
    cast(null as Nullable(String)) as skill_evaluation,
    cast(null as Nullable(Float64)) as average_score
from {{ ref('stg_kobotoolbox__moh_skills_assessment_submissions') }}
where 1 = 0

{% endif %}
