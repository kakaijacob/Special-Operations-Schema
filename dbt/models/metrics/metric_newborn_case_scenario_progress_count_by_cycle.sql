select
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end,
    count() as mentee_count,
    sum(case_scenario_count) as case_scenario_progress_count,
    round(avg(case_scenario_count), 3) as avg_case_scenario_count,
    countIf(case_scenario_count > 0) as mentees_with_case_scenario
from {{ ref('mart_individual_mentee_newborn_curriculum_progress') }}
group by cycle_id, cycle_label, cycle_start, cycle_end
order by cycle_id
