-- Average of per-mentee×cycle capped progress ratios (newborn individual inspection).
-- Caps: CME 19, drills 7, practicum 20/22 by program, skill demo 5, videos 12,
-- roleplay 2, case scenarios 9, group discussions 7, NNR completion flag 1.

{% set req_cme = var('newborn_individual_req_cme', 19) | int %}
{% set req_drills = var('newborn_individual_req_drills', 7) | int %}
{% set req_practicum_essential = var('newborn_individual_req_practicum_essential', 20) | int %}
{% set req_practicum_comprehensive = var('newborn_individual_req_practicum_comprehensive', 22) | int %}
{% set req_skill_demo = var('newborn_individual_req_skill_demo', 5) | int %}
{% set req_videos = var('newborn_individual_req_videos', 12) | int %}
{% set req_roleplay = var('newborn_individual_req_roleplay', 2) | int %}
{% set req_case_scenarios = var('newborn_individual_req_case_scenarios', 9) | int %}
{% set req_group_discussions = var('newborn_individual_req_group_discussions', 7) | int %}
{% set req_nnr = 1 %}

with mentee_ratios as (

    select
        cycle_id,
        cycle_label,
        cycle_start,
        cycle_end,
        mentee_id,
        multiIf(
            program = 'comprehensive_newborn_care', {{ req_practicum_comprehensive }},
            {{ req_practicum_essential }}
        ) as req_practicum,
        toFloat64(
            least(cme_count, {{ req_cme }})
            + least(drill_count, {{ req_drills }})
            + least(
                practicum_count,
                multiIf(
                    program = 'comprehensive_newborn_care', {{ req_practicum_comprehensive }},
                    {{ req_practicum_essential }}
                )
            )
            + least(skill_demo_count, {{ req_skill_demo }})
            + least(video_count, {{ req_videos }})
            + least(roleplay_count, {{ req_roleplay }})
            + least(case_scenario_count, {{ req_case_scenarios }})
            + least(group_discussions_count, {{ req_group_discussions }})
            + nnr_assessment_completion
        ) as capped_progress_points
    from {{ ref('mart_individual_mentee_newborn_curriculum_progress') }}

),

with_denom as (

    select
        *,
        toFloat64(
            {{ req_cme }}
            + {{ req_drills }}
            + req_practicum
            + {{ req_skill_demo }}
            + {{ req_videos }}
            + {{ req_roleplay }}
            + {{ req_case_scenarios }}
            + {{ req_group_discussions }}
            + {{ req_nnr }}
        ) as required_points,
        if(
            (
                {{ req_cme }}
                + {{ req_drills }}
                + req_practicum
                + {{ req_skill_demo }}
                + {{ req_videos }}
                + {{ req_roleplay }}
                + {{ req_case_scenarios }}
                + {{ req_group_discussions }}
                + {{ req_nnr }}
            ) = 0,
            toFloat64(0),
            capped_progress_points / toFloat64(
                {{ req_cme }}
                + {{ req_drills }}
                + req_practicum
                + {{ req_skill_demo }}
                + {{ req_videos }}
                + {{ req_roleplay }}
                + {{ req_case_scenarios }}
                + {{ req_group_discussions }}
                + {{ req_nnr }}
            )
        ) as mentee_progress_ratio
    from mentee_ratios

)

select
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end,
    count() as mentee_count,
    round(avg(mentee_progress_ratio), 3) as individual_mentee_newborn_curriculum_progress,
    round(avg(capped_progress_points), 3) as avg_capped_progress_points,
    countIf(mentee_progress_ratio >= 1) as fully_progressed_mentee_count
from with_denom
group by
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end
order by cycle_id
