select
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end,
    count() as mentee_count,
    countIf(case_scenario_completion >= 1) as covered_mentee_count,
    round(
        toFloat64(countIf(case_scenario_completion >= 1)) / nullIf(count(), 0),
        3
    ) as case_scenario_coverage_rate,
    round(avg(case_scenario_completion), 3) as avg_case_scenario_completion
from {{ ref('mart_newborn_curriculum_completion') }}
group by cycle_id, cycle_label, cycle_start, cycle_end
order by cycle_id
