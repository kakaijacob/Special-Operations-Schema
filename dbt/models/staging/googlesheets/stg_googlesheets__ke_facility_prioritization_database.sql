-- Anticipatory stub: facility prioritization dimension.
{% if var('use_sample_seeds', true) %}

select
    cast(null as Nullable(String)) as facility_code,
    cast(null as Nullable(String)) as facility,
    cast(null as Nullable(String)) as county,
    cast(null as Nullable(String)) as prioritization_status
where 1 = 0

{% else %}

select * from {{ source('googlesheets', 'ke_facility_prioritization_database') }}

{% endif %}
