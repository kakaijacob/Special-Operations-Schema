with source as (

    select * from {{ source('airbyte', 'mentees') }}

),

cleaned as (

    select
        nullIf(trim(toString(`Name`)), '') as raw_mentee_name,
        nullIf(trim(toString(`Mentee ID`)), '') as mentee_id,
        nullIf(trim(toString(`County`)), '') as raw_county,
        nullIf(trim(toString(`Facility Code`)), '') as facility_code,
        nullIf(trim(toString(`Facility`)), '') as raw_facility,
        nullIf(trim(toString(`Cadre`)), '') as raw_cadre,
        nullIf(trim(toString(`Gender`)), '') as raw_gender,
        nullIf(trim(toString(`New or Existing?`)), '') as raw_new_existing,
        nullIf(trim(toString(`Date Activated`)), '') as raw_date_activated,
        nullIf(trim(toString(`Date Deactivated`)), '') as raw_date_deactivated,
        nullIf(trim(toString(`Date Reactivated`)), '') as raw_date_reactivated,
        nullIf(trim(toString(`Status`)), '') as raw_status,
        nullIf(trim(toString(`Program`)), '') as raw_program,
        nullIf(trim(toString(`EmONC In-person`)), '') as raw_emonc_inperson,
        nullIf(trim(toString(`EmONC DELTA`)), '') as raw_emons_delta,
        nullIf(trim(toString(`Essential Newborn In-person`)), '')
            as raw_essential_newborn_inperson,
        nullIf(trim(toString(`Essential Newborn DELTA`)), '')
            as raw_essential_newborn_delta,
        nullIf(trim(toString(`Comprehensive Newborn In-person`)), '')
            as raw_comprehensive_newborn_inperson,
        nullIf(trim(toString(`Continuum of Care`)), '') as raw_continuum_of_care
    from source

),

transformed as (

    select
        initcapUTF8(raw_mentee_name) as mentee_name,
        mentee_id,
        concat(
            upperUTF8(substringUTF8(raw_county, 1, 1)),
            lowerUTF8(substringUTF8(raw_county, 2))
        ) as county,
        facility_code,
        initcapUTF8(raw_facility) as facility,
        concat(
            upperUTF8(substringUTF8(raw_cadre, 1, 1)),
            lowerUTF8(substringUTF8(raw_cadre, 2))
        ) as cadre,
        concat(
            upperUTF8(substringUTF8(raw_gender, 1, 1)),
            lowerUTF8(substringUTF8(raw_gender, 2))
        ) as gender,
        multiIf(
            lowerUTF8(raw_new_existing) in ('yes', 'new'), 'New',
            lowerUTF8(raw_new_existing) in ('no', 'existing'), 'Existing',
            initcapUTF8(raw_new_existing)
        ) as new_existing,
        if(
            match(raw_date_activated, '^[0-9]{2}/[0-9]{2}/[0-9]{4}$'),
            toDateOrNull(concat(
                substring(raw_date_activated, 7, 4), '-',
                substring(raw_date_activated, 4, 2), '-',
                substring(raw_date_activated, 1, 2)
            )),
            toDateOrNull(raw_date_activated)
        ) as date_activated,
        if(
            match(raw_date_deactivated, '^[0-9]{2}/[0-9]{2}/[0-9]{4}$'),
            toDateOrNull(concat(
                substring(raw_date_deactivated, 7, 4), '-',
                substring(raw_date_deactivated, 4, 2), '-',
                substring(raw_date_deactivated, 1, 2)
            )),
            toDateOrNull(raw_date_deactivated)
        ) as date_deactivated,
        if(
            match(raw_date_reactivated, '^[0-9]{2}/[0-9]{2}/[0-9]{4}$'),
            toDateOrNull(concat(
                substring(raw_date_reactivated, 7, 4), '-',
                substring(raw_date_reactivated, 4, 2), '-',
                substring(raw_date_reactivated, 1, 2)
            )),
            toDateOrNull(raw_date_reactivated)
        ) as date_reactivated,
        concat(
            upperUTF8(substringUTF8(raw_status, 1, 1)),
            lowerUTF8(substringUTF8(raw_status, 2))
        ) as status,
        concat(
            upperUTF8(substringUTF8(raw_program, 1, 1)),
            lowerUTF8(substringUTF8(raw_program, 2))
        ) as program,
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
