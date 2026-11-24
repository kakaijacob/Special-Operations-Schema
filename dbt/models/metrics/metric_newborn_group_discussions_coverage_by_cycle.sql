select
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end,
    count() as mentee_count,
    countIf(group_discussions_completion >= 1) as covered_mentee_count,
    round(
        toFloat64(countIf(group_discussions_completion >= 1)) / nullIf(count(), 0),
        3
    ) as group_discussions_coverage_rate,
    round(avg(group_discussions_completion), 3) as avg_group_discussions_completion
from {{ ref('mart_newborn_curriculum_completion') }}
group by cycle_id, cycle_label, cycle_start, cycle_end
order by cycle_id
