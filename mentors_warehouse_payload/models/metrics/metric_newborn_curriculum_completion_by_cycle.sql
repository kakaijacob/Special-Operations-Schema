-- Cycle-level newborn curriculum completion rates.
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
    round(avg(practicum_completion), 3) as avg_practicum_completion,
    round(avg(skill_demo_completion), 3) as avg_skill_demo_completion,
    round(avg(video_completion), 3) as avg_video_completion,
    round(avg(roleplay_completion), 3) as avg_roleplay_completion,
    round(avg(case_scenario_completion), 3) as avg_case_scenario_completion,
    round(avg(group_discussions_completion), 3) as avg_group_discussions_completion,
    round(avg(nnr_assessment_completion), 3) as avg_nnr_assessment_completion
from {{ ref('mart_newborn_curriculum_completion') }}
group by
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end
order by cycle_id
