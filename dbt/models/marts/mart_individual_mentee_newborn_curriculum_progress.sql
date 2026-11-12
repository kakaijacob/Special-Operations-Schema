-- Individual newborn curriculum progress inspection.
-- Grain: one row per (mentee_id, cycle_id), including empty mentee×cycle rows.
-- Counts distinct topics within each cohort window; curriculum_completion uses
-- exact equality to cohort requirements (not capped ratios).

with progress as (

    select
        mc.mentee_id as mentee_id,
        mc.mentee_name as mentee_name,
        mc.county as county,
        mc.facility as facility,
        coalesce(
            nullIf(mc.facility_code, ''),
            nullIf(cs.facility_code, '')
        ) as facility_code,
        cs.program as program,
        mc.cycle_id as cycle_id,
        mc.cycle_label as cycle_label,
        mc.cycle_start as cycle_start,
        mc.cycle_end as cycle_end,
        mc.req_cme as req_cme,
        mc.req_drills as req_drills,
        mc.req_practicum_essential as req_practicum_essential,
        mc.req_practicum_comprehensive as req_practicum_comprehensive,
        mc.req_skill_demo as req_skill_demo,
        mc.req_videos as req_videos,
        mc.req_roleplay as req_roleplay,
        mc.req_case_scenarios as req_case_scenarios,
        mc.req_group_discussions as req_group_discussions,

        coalesce(cs.cme_count, 0) as cme_count,
        coalesce(cs.drill_count, 0) as drill_count,
        coalesce(cs.practicum_count, 0) as practicum_count,
        coalesce(cs.skill_demo_count, 0) as skill_demo_count,
        coalesce(cs.video_count, 0) as video_count,
        coalesce(cs.roleplay_count, 0) as roleplay_count,
        coalesce(cs.case_scenario_count, 0) as case_scenario_count,
        coalesce(cs.group_discussions_count, 0) as group_discussions_count,

        nnr.baseline_score as baseline_score,
        nnr.endline_score as endline_score,
        coalesce(nnr.assessment_count, 0) as assessment_count,
        nnr.assessment_completion_date as assessment_completion_date
    from {{ ref('int_newborn_mentee_cycles') }} mc
    left join {{ ref('int_newborn_individual_curriculum_counts') }} cs
        on mc.mentee_id = cs.mentee_id
       and mc.cycle_id = cs.cycle_id
    left join {{ ref('int_newborn_individual_nnr_progress') }} nnr
        on mc.mentee_id = nnr.mentee_id
       and mc.cycle_id = nnr.cycle_id

)

select
    mentee_id,
    mentee_name,
    county,
    facility,
    facility_code,
    program,
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end,

    cme_count,
    drill_count,
    practicum_count,
    skill_demo_count,
    video_count,
    roleplay_count,
    case_scenario_count,
    group_discussions_count,

    baseline_score,
    endline_score,

    toUInt8(
        assessment_count > 1
        and baseline_score is not null
        and endline_score is not null
        and endline_score >= 0.85
    ) as nnr_assessment_completion,

    toUInt8(
        cme_count = req_cme
        and drill_count = req_drills
        and practicum_count = multiIf(
            program = 'essential_newborn_care', req_practicum_essential,
            program = 'comprehensive_newborn_care', req_practicum_comprehensive,
            toInt64(-1)
        )
        and skill_demo_count = req_skill_demo
        and video_count = req_videos
        and roleplay_count = req_roleplay
        and case_scenario_count = req_case_scenarios
        and group_discussions_count = req_group_discussions
        and assessment_count > 1
        and baseline_score is not null
        and endline_score is not null
        and endline_score >= 0.85
    ) as curriculum_completion,

    assessment_completion_date
from progress
order by mentee_id, cycle_id
