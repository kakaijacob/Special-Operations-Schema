-- Anticipatory stub: DELTA 1.0 learners / module scores.
{% if var('use_sample_seeds', true) %}

select
    cast(null as Nullable(String)) as learner_id,
    cast(null as Nullable(String)) as learner_name,
    cast(null as Nullable(String)) as module_name,
    cast(null as Nullable(Float64)) as pretest_score,
    cast(null as Nullable(Float64)) as posttest_score
where 1 = 0

{% else %}

select * from {{ source('googlesheets', 'ke_mentors_total_delta_users') }}

{% endif %}
