-- Cycle-level EmONC curriculum completion rates for dashboards.
select
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end,
    count() as mentee_count,
    countIf(curriculum_completion = 1) as completed_mentee_count,
    round(
        toFloat64(countIf(curriculum_completion = 1)) / nullIf(count(), 0),
        3
    ) as curriculum_completion_rate,
    round(avg(cme_completion), 3) as avg_cme_completion,
    round(avg(drill_completion), 3) as avg_drill_completion,
    round(avg(skill_demo_completion), 3) as avg_skill_demo_completion,
    round(avg(return_demo_completion), 3) as avg_return_demo_completion,
    round(avg(labor_monitoring_completion), 3) as avg_labor_monitoring_completion,
    round(avg(skill_evaluation_completion), 3) as avg_skill_evaluation_completion,
    round(avg(avg_skill_score), 3) as avg_of_avg_skill_score
from {{ ref('mart_emonc_curriculum_completion') }}
group by
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end
order by cycle_id
