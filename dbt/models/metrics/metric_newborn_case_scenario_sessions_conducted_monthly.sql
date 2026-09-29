select
    month_start,
    sessions_conducted as case_scenario_sessions_conducted,
    mentees_reached,
    facilities_reached
from {{ ref('int_newborn_activity_sessions_monthly') }}
where mentorship_activity = 'case scenarios'
order by month_start
