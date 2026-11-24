select
    month_start,
    sessions_conducted as cme_sessions_conducted,
    mentees_reached,
    facilities_reached
from {{ ref('int_newborn_activity_sessions_monthly') }}
where mentorship_activity = 'cmes'
order by month_start
