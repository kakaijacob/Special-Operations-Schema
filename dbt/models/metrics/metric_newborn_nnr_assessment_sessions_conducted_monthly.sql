select
    month_start,
    sessions_conducted as nnr_assessment_sessions_conducted,
    mentees_reached,
    facilities_reached
from {{ ref('int_newborn_nnr_sessions_monthly') }}
order by month_start
