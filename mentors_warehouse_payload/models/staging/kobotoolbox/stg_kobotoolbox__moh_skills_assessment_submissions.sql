-- Raw Kobo MoH skills assessment. Score/skill parse lands in intermediate.
{% if var('use_sample_seeds', true) %}

select
    cast(null as Nullable(String)) as submission_id,
    cast(null as Nullable(DateTime)) as submitted_at,
    cast(null as Nullable(String)) as raw_payload_note
where 1 = 0

{% else %}

select * from {{ source('kobotoolbox', 'moh_skills_assessment_submissions') }}

{% endif %}
