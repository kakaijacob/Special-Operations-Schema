select
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end,
    count() as mentee_count,
    countIf(skill_demo_completion >= 1) as covered_mentee_count,
    round(
        toFloat64(countIf(skill_demo_completion >= 1)) / nullIf(count(), 0),
        3
    ) as skill_demo_coverage_rate,
    round(avg(skill_demo_completion), 3) as avg_skill_demo_completion
from {{ ref('mart_newborn_curriculum_completion') }}
group by cycle_id, cycle_label, cycle_start, cycle_end
order by cycle_id
