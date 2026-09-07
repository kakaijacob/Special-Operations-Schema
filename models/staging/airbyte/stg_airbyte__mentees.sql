{#
    Column names are resolved at compile time because Airbyte rewrites the
    Google Sheet headers when it loads them into ClickHouse.
#}
{%- set mentees = source('airbyte', 'mentees') -%}

with source as (

    select * from {{ mentees }}

),

cleaned as (

    select
        nullIf(trim(toString({{ resolve_column(mentees, 'Name') }})), '')
            as raw_mentee_name,
        nullIf(trim(toString({{ resolve_column(mentees, 'Mentee ID') }})), '')
            as mentee_id,
        nullIf(trim(toString({{ resolve_column(mentees, 'County') }})), '')
            as raw_county,
        nullIf(trim(toString({{ resolve_column(mentees, 'Facility Code') }})), '')
            as facility_code,
        nullIf(trim(toString({{ resolve_column(mentees, 'Facility') }})), '')
            as raw_facility,
        nullIf(trim(toString({{ resolve_column(mentees, 'Cadre') }})), '')
            as raw_cadre,
        nullIf(trim(toString({{ resolve_column(mentees, 'Gender') }})), '')
            as raw_gender,
        nullIf(trim(toString({{ resolve_column(mentees, 'New or Existing?') }})), '')
            as raw_new_existing,
        nullIf(trim(toString({{ resolve_column(mentees, 'Date Activated') }})), '')
            as raw_date_activated,
        nullIf(trim(toString({{ resolve_column(mentees, 'Date Deactivated') }})), '')
            as raw_date_deactivated,
        nullIf(trim(toString({{ resolve_column(mentees, 'Date Reactivated') }})), '')
            as raw_date_reactivated,
        nullIf(
            trim(toString({{ resolve_column(mentees, 'Reason for Deactivation') }})),
            ''
        ) as raw_reason_for_deactivation,
        nullIf(trim(toString({{ resolve_column(mentees, 'Status') }})), '')
            as raw_status,
        nullIf(trim(toString({{ resolve_column(mentees, 'Program') }})), '')
            as raw_program,
        nullIf(trim(toString({{ resolve_column(mentees, 'EmONC In-person') }})), '')
            as raw_emonc_inperson,
        nullIf(trim(toString({{ resolve_column(mentees, 'EmONC DELTA') }})), '')
            as raw_emons_delta,
        nullIf(
            trim(toString({{ resolve_column(mentees, 'Essential Newborn In-person') }})),
            ''
        ) as raw_essential_newborn_inperson,
        nullIf(
            trim(toString({{ resolve_column(mentees, 'Essential Newborn DELTA') }})),
            ''
        ) as raw_essential_newborn_delta,
        nullIf(
            trim(toString({{ resolve_column(mentees, 'Comprehensive Newborn In-person') }})),
            ''
        ) as raw_comprehensive_newborn_inperson,
        nullIf(trim(toString({{ resolve_column(mentees, 'Continuum of Care') }})), '')
            as raw_continuum_of_care
    from source

),

transformed as (

    select
        initcapUTF8(raw_mentee_name) as mentee_name,
        mentee_id,
        {{ sentence_case('raw_county') }} as county,
        facility_code,
        initcapUTF8(raw_facility) as facility,
        {{ sentence_case('raw_cadre') }} as cadre,
        {{ sentence_case('raw_gender') }} as gender,
        multiIf(
            lowerUTF8(raw_new_existing) in ('yes', 'new'), 'New',
            lowerUTF8(raw_new_existing) in ('no', 'existing'), 'Existing',
            initcapUTF8(raw_new_existing)
        ) as new_existing,
        {{ parse_sheet_date('raw_date_activated') }} as date_activated,
        {{ parse_sheet_date('raw_date_deactivated') }} as date_deactivated,
        {{ parse_sheet_date('raw_date_reactivated') }} as date_reactivated,
        raw_reason_for_deactivation as reason_for_deactivation,
        {{ sentence_case('raw_status') }} as status,
        {{ sentence_case('raw_program') }} as program,
        initcapUTF8(raw_emonc_inperson) as emonc_inperson,
        initcapUTF8(raw_emons_delta) as emons_delta,
        initcapUTF8(raw_essential_newborn_inperson) as essential_newborn_inperson,
        initcapUTF8(raw_essential_newborn_delta) as essential_newborn_delta,
        initcapUTF8(raw_comprehensive_newborn_inperson)
            as comprehensive_newborn_inperson,
        initcapUTF8(raw_continuum_of_care) as continuum_of_care
    from cleaned

)

select * from transformed
