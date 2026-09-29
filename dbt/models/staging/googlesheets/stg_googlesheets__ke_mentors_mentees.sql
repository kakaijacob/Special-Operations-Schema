{#
  Current mentee sheet. When use_sample_seeds=true, seed stands in.
  When false, resolve Airbyte column names against googlesheets.ke_mentors_mentees.
#}
{% if var('use_sample_seeds', true) %}

with source as (

    select * from {{ ref('mentee_database_sample') }}

)

select
    nullIf(trim(toString(mentee_id)), '') as mentee_id,
    nullIf(trim(toString(mentee_name)), '') as mentee_name,
    nullIf(trim(toString(county)), '') as county,
    nullIf(trim(toString(facility)), '') as facility,
    nullIf(trim(toString(facility_code)), '') as facility_code,
    lowerUTF8(trim(toString(program))) as program,
    toDateOrNull(toString(date_activated)) as date_activated,
    cast('current' as String) as mentee_source
from source

{% else %}

{%- set src = source('googlesheets', 'ke_mentors_mentees') -%}

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
        nullIf(trim(toString({{ resolve_column(src, 'Program') }})), '') as program,
        nullIf(trim(toString({{ resolve_column(src, 'Date Activated') }})), '') as raw_date_activated
    from source

)

select
    mentee_id,
    mentee_name,
    county,
    facility,
    facility_code,
    lowerUTF8(trim(program)) as program,
    {{ parse_sheet_date('raw_date_activated') }} as date_activated,
    cast('current' as String) as mentee_source
from cleaned

{% endif %}
