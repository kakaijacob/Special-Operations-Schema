select
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end,
    count() as mentee_count,
    countIf(roleplay_completion >= 1) as covered_mentee_count,
    round(
        toFloat64(countIf(roleplay_completion >= 1)) / nullIf(count(), 0),
        3
    ) as roleplay_coverage_rate,
    round(avg(roleplay_completion), 3) as avg_roleplay_completion
from {{ ref('mart_newborn_curriculum_completion') }}
group by cycle_id, cycle_label, cycle_start, cycle_end
order by cycle_id
