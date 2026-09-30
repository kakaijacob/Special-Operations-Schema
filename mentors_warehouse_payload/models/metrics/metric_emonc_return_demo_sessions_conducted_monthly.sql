select
    month_start,
    sessions_conducted as return_demo_sessions_conducted,
    mentees_reached,
    facilities_reached
from {{ ref('int_emonc_activity_sessions_monthly') }}
where mentorship_activity = 'skills_demos_mentee'
order by month_start
