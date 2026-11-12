{#
  Processed NNR assessments for newborn curriculum:
  skill_evaluation = newborn resuscitation, program = newborn curriculum.

  Today: seed stand-in.
  Next: filter/parse from stg_kobotoolbox__moh_skills_assessment_submissions
  (or stg_processed__moh_skills_assessment once program is mapped).
#}
{% if var('use_sample_seeds', true) %}

with source as (

    select * from {{ ref('newborn_resuscitation_assessment_sample') }}

)

select
    toString(submission_id) as submission_id,
    toDateTime(date_submitted) as submitted_at,
    nullIf(trim(toString(mentee_id)), '') as mentee_id,
    nullIf(trim(toString(mentee_name)), '') as mentee_name,
    nullIf(trim(toString(county)), '') as county,
    nullIf(trim(toString(facility)), '') as facility,
    nullIf(trim(toString(facility_code)), '') as facility_code,
    lowerUTF8(trim(toString(program))) as program,
    lowerUTF8(trim(toString(skill_evaluation))) as skill_evaluation,
    toFloat64(average_score) as average_score
from source
where lowerUTF8(trim(toString(skill_evaluation))) = 'newborn resuscitation'
  and lowerUTF8(trim(toString(program))) = 'newborn curriculum'

{% else %}

select
    cast(null as Nullable(String)) as submission_id,
    cast(null as Nullable(DateTime)) as submitted_at,
    cast(null as Nullable(String)) as mentee_id,
    cast(null as Nullable(String)) as mentee_name,
    cast(null as Nullable(String)) as county,
    cast(null as Nullable(String)) as facility,
    cast(null as Nullable(String)) as facility_code,
    cast(null as Nullable(String)) as program,
    cast(null as Nullable(String)) as skill_evaluation,
    cast(null as Nullable(Float64)) as average_score
from {{ ref('stg_kobotoolbox__moh_skills_assessment_submissions') }}
where 1 = 0

{% endif %}
