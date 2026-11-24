-- Anticipatory stub: newborn curriculum tracking (parallel to EmONC later).
{% if var('use_sample_seeds', true) %}

select
    cast(null as Nullable(String)) as submission_id,
    cast(null as Nullable(DateTime)) as submitted_at
where 1 = 0

{% else %}

select * from {{ source('kobotoolbox', 'newbon_curriculum_tracking_submissions') }}

{% endif %}
