{#
  Processed EmONC curriculum tracking fact grain:
  one row per (submission × mentee × mentorship_activity × topic).

  Today: seed stand-in (matches mentors.mentee_curriculum_tracking shape).
  Next: replace body with int explode of
  stg_kobotoolbox__emonc_curriculum_tracking_submissions.
#}
{% if var('use_sample_seeds', true) %}

with source as (

    select * from {{ ref('mentee_curriculum_tracking_sample') }}

)

select
    toString(submission_id) as submission_id,
    toDateTime(date_submitted) as submitted_at,
    nullIf(trim(toString(mentee_id)), '') as mentee_id,
    nullIf(trim(toString(mentee_name)), '') as mentee_name,
    nullIf(trim(toString(county)), '') as county,
    nullIf(trim(toString(facility)), '') as facility,
    nullIf(trim(toString(facility_code)), '') as facility_code,
    lowerUTF8(trim(toString(mentorship_activity))) as mentorship_activity,
    nullIf(trim(toString(topic)), '') as topic
from source

{% else %}

-- Placeholder until Kobo explode intermediate exists.
-- Point this at the processed intermediate once built.
select
    cast(null as Nullable(String)) as submission_id,
    cast(null as Nullable(DateTime)) as submitted_at,
    cast(null as Nullable(String)) as mentee_id,
    cast(null as Nullable(String)) as mentee_name,
    cast(null as Nullable(String)) as county,
    cast(null as Nullable(String)) as facility,
    cast(null as Nullable(String)) as facility_code,
    cast(null as Nullable(String)) as mentorship_activity,
    cast(null as Nullable(String)) as topic
from {{ ref('stg_kobotoolbox__emonc_curriculum_tracking_submissions') }}
where 1 = 0

{% endif %}
