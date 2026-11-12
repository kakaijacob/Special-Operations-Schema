-- Newborn resuscitation (NNR) assessment sessions by calendar month.

select
    toStartOfMonth(toDate(submitted_at)) as month_start,
    countDistinct(submission_id) as sessions_conducted,
    countDistinct(mentee_id) as mentees_reached,
    countDistinct(nullIf(facility_code, '')) as facilities_reached
from {{ ref('stg_processed__newborn_resuscitation_assessments') }}
where submitted_at is not null
group by month_start
order by month_start
