{#
  Legacy mentee sheet (2024–2025). Sample path reuses mentee_database_sample with
  mentee_source='legacy' so the union spine compiles offline. Replace with real
  column map once DESCRIBE googlesheets.ke_mentors_legacy_mentees is available.
#}
{% if var('use_sample_seeds', true) %}

-- Offline: no separate legacy seed yet — empty relation with correct schema.
select
    cast(null as Nullable(String)) as mentee_id,
    cast(null as Nullable(String)) as mentee_name,
    cast(null as Nullable(String)) as county,
    cast(null as Nullable(String)) as facility,
    cast(null as Nullable(String)) as facility_code,
    cast(null as Nullable(String)) as program,
    cast('legacy' as String) as mentee_source
where 1 = 0

{% else %}

{%- set src = source('googlesheets', 'ke_mentors_legacy_mentees') -%}

with source as (

    select * from {{ src }}

),

cleaned as (

    select
        nullIf(trim(toString({{ resolve_column(src, 'Mentee ID') }})), '') as mentee_id,
        nullIf(trim(toString({{ resolve_column(src, 'Name') }})), '') as mentee_name,
        nullIf(trim(toString({{ resolve_column(src, 'County') }})), '') as county,
        nullIf(trim(toString({{ resolve_column(src, 'Facility') }})), '') as facility,
        nullIf(trim(toString({{ resolve_column(src, 'Facility Code') }})), '') as facility_code,
        nullIf(trim(toString({{ resolve_column(src, 'Program') }})), '') as program
    from source

)

select
    mentee_id,
    mentee_name,
    county,
    facility,
    facility_code,
    lowerUTF8(trim(program)) as program,
    cast('legacy' as String) as mentee_source
from cleaned

{% endif %}
