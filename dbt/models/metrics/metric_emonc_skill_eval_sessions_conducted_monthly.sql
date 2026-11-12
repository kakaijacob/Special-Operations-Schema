select
    month_start,
    sessions_conducted as skill_eval_sessions_conducted,
    mentees_reached,
    facilities_reached,
    skills_assessed
from {{ ref('int_emonc_skill_eval_sessions_monthly') }}
order by month_start
