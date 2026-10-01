select
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end,
    count() as mentee_count,
    sum(skill_demo_count) as skill_demo_progress_count,
    round(avg(skill_demo_count), 3) as avg_skill_demo_count,
    countIf(skill_demo_count > 0) as mentees_with_skill_demo
from {{ ref('mart_individual_mentee_newborn_curriculum_progress') }}
group by cycle_id, cycle_label, cycle_start, cycle_end
order by cycle_id
