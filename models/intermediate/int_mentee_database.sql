with ranked as (

    select
        *,
        row_number() over (
            partition by mentee_id
            order by
                coalesce(
                    greatest(
                        date_reactivated,
                        date_activated,
                        date_deactivated
                    ),
                    toDate('1970-01-01')
                ) desc,
                status = 'Active' desc,
                mentee_name desc,
                facility_code desc
        ) as record_rank
    from {{ ref('stg_airbyte__mentees') }}
    where mentee_id is not null

)

select
    mentee_name,
    mentee_id,
    county,
    facility_code,
    facility,
    cadre,
    gender,
    new_existing,
    date_activated,
    date_deactivated,
    date_reactivated,
    status,
    program,
    emonc_inperson,
    emons_delta,
    essential_newborn_inperson,
    essential_newborn_delta,
    comprehensive_newborn_inperson,
    continuum_of_care
from ranked
where record_rank = 1
