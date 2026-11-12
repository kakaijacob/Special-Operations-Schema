-- Share of mentees who completed required skill evaluations in each cycle.
-- Partograph is already excluded upstream in skill-eval progress.
select
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end,
    count() as mentee_count,
    countIf(skill_evaluation_completion >= 1) as covered_mentee_count,
    round(
        toFloat64(countIf(skill_evaluation_completion >= 1)) / nullIf(count(), 0),
        3
    ) as skill_evaluation_coverage_rate,
    round(avg(skill_evaluation_completion), 3) as avg_skill_evaluation_completion,
    round(avg(avg_skill_score), 3) as avg_of_avg_skill_score
from {{ ref('mart_emonc_curriculum_completion') }}
group by
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end
order by cycle_id
