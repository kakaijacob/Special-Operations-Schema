select
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end,
    count() as mentee_count,
    countIf(practicum_completion >= 1) as covered_mentee_count,
    round(
        toFloat64(countIf(practicum_completion >= 1)) / nullIf(count(), 0),
        3
    ) as practicum_coverage_rate,
    round(avg(practicum_completion), 3) as avg_practicum_completion
from {{ ref('mart_newborn_curriculum_completion') }}
group by cycle_id, cycle_label, cycle_start, cycle_end
order by cycle_id
