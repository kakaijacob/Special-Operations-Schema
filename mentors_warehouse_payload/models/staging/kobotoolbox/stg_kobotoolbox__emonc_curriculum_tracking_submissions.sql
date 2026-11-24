-- Raw Kobo EmONC curriculum tracking. Wide/nested payload; explode in intermediate.
{% if var('use_sample_seeds', true) %}

select
    cast(null as Nullable(String)) as submission_id,
    cast(null as Nullable(DateTime)) as submitted_at,
    cast(null as Nullable(String)) as raw_payload_note
where 1 = 0

{% else %}

select * from {{ source('kobotoolbox', 'emonc_curriculum_tracking_submissions') }}

{% endif %}
