-- Share of mentees who completed required labor monitoring in each cycle.
select
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end,
    count() as mentee_count,
    countIf(labor_monitoring_completion >= 1) as covered_mentee_count,
    round(
        toFloat64(countIf(labor_monitoring_completion >= 1)) / nullIf(count(), 0),
        3
    ) as labor_monitoring_coverage_rate,
    round(avg(labor_monitoring_completion), 3) as avg_labor_monitoring_completion
from {{ ref('mart_emonc_curriculum_completion') }}
group by
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end
order by cycle_id
