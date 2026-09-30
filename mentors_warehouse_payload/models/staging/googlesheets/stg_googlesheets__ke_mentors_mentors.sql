-- Anticipatory stub: expand renames/casts after DESCRIBE googlesheets.ke_mentors_mentors.
{% if var('use_sample_seeds', true) %}

select
    cast(null as Nullable(String)) as mentor_id,
    cast(null as Nullable(String)) as mentor_name,
    cast(null as Nullable(String)) as county,
    cast(null as Nullable(String)) as facility,
    cast(null as Nullable(String)) as facility_code
where 1 = 0

{% else %}

select * from {{ source('googlesheets', 'ke_mentors_mentors') }}

{% endif %}
