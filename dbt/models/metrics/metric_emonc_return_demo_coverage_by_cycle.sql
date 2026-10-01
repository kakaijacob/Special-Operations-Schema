-- Share of mentees who completed required return demos (mentee) in each cycle.
select
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end,
    count() as mentee_count,
    countIf(return_demo_completion >= 1) as covered_mentee_count,
    round(
        toFloat64(countIf(return_demo_completion >= 1)) / nullIf(count(), 0),
        3
    ) as return_demo_coverage_rate,
    round(avg(return_demo_completion), 3) as avg_return_demo_completion
from {{ ref('mart_emonc_curriculum_completion') }}
group by
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end
order by cycle_id
