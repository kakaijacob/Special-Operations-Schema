-- Anticipatory stub: legacy EmONC knowledge baseline/endline.
{% if var('use_sample_seeds', true) %}

select
    cast(null as Nullable(String)) as respondent_id,
    cast(null as Nullable(String)) as assessment_wave,
    cast(null as Nullable(Date)) as assessment_date,
    cast(null as Nullable(Float64)) as score
where 1 = 0

{% else %}

select * from {{ source('googlesheets', 'ke_legacy_emonc_knowledge_survey') }}

{% endif %}
