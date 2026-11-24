with enriched as (

    select
        mc.mentee_id as mentee_id,
        mc.mentee_name as mentee_name,
        mc.county as county,
        mc.facility as facility,
        mc.facility_code as facility_code,
        coalesce(
            nullIf(a.cycle_program, ''),
            nullIf(a.practicum_program, '')
        ) as program,
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
        a.cme_completed_topics as cme_completed_topics,
        a.cme_threshold_date as cme_threshold_date,
        a.drill_completed_topics as drill_completed_topics,
        a.drill_threshold_date as drill_threshold_date,
        a.practicum_completed_topics as practicum_completed_topics,
        a.practicum_required_topics as practicum_required_topics,
        a.practicum_threshold_date as practicum_threshold_date,
        a.skill_demo_completed_topics as skill_demo_completed_topics,
        a.skill_demo_threshold_date as skill_demo_threshold_date,
        a.video_completed_topics as video_completed_topics,
        a.video_threshold_date as video_threshold_date,
        a.roleplay_completed_topics as roleplay_completed_topics,
        a.roleplay_threshold_date as roleplay_threshold_date,
        a.case_scenario_completed_topics as case_scenario_completed_topics,
        a.case_scenario_threshold_date as case_scenario_threshold_date,
        a.group_discussion_completed_topics as group_discussion_completed_topics,
        a.group_discussion_threshold_date as group_discussion_threshold_date,
        nnr.baseline_score as baseline_score,
        nnr.endline_score as endline_score,
        nnr.assessment_completion_date as assessment_completion_date
    from {{ ref('int_newborn_mentee_cycles') }} mc
    left join {{ ref('int_newborn_curriculum_activity_progress') }} a
        on mc.mentee_id = a.mentee_id
       and mc.cycle_id = a.cycle_id
    left join {{ ref('int_newborn_nnr_assessment_progress') }} nnr
        on mc.mentee_id = nnr.mentee_id
       and mc.cycle_id = nnr.cycle_id

),

progress as (

    select
        *,
        round(
            least(toFloat64(coalesce(cme_completed_topics, 0)) / req_cme, 1.0),
            3
        ) as cme_completion,
        round(
            least(toFloat64(coalesce(drill_completed_topics, 0)) / req_drills, 1.0),
            3
        ) as drill_completion,
        round(
            least(
                toFloat64(coalesce(practicum_completed_topics, 0))
                    / coalesce(
                        nullIf(practicum_required_topics, 0),
                        if(
                            program = 'comprehensive_newborn_care',
                            req_practicum_comprehensive,
                            req_practicum_essential
                        )
                    ),
                1.0
            ),
            3
        ) as practicum_completion,
        round(
            least(
                toFloat64(coalesce(skill_demo_completed_topics, 0)) / req_skill_demo,
                1.0
            ),
            3
        ) as skill_demo_completion,
        round(
            least(toFloat64(coalesce(video_completed_topics, 0)) / req_videos, 1.0),
            3
        ) as video_completion,
        round(
            least(toFloat64(coalesce(roleplay_completed_topics, 0)) / req_roleplay, 1.0),
            3
        ) as roleplay_completion,
        round(
            least(
                toFloat64(coalesce(case_scenario_completed_topics, 0))
                    / req_case_scenarios,
                1.0
            ),
            3
        ) as case_scenario_completion,
        round(
            least(
                toFloat64(coalesce(group_discussion_completed_topics, 0))
                    / req_group_discussions,
                1.0
            ),
            3
        ) as group_discussions_completion,
        round(baseline_score, 3) as rounded_baseline_score,
        round(endline_score, 3) as rounded_endline_score,
        toUInt8(
            baseline_score is not null
            and endline_score is not null
            and endline_score >= 0.85
        ) as nnr_assessment_completion
    from enriched

),

completion_flags as (

    select
        *,
        toUInt8(
            cme_completion >= 1
            and drill_completion >= 1
            and practicum_completion >= 1
            and skill_demo_completion >= 1
            and video_completion >= 1
            and roleplay_completion >= 1
            and case_scenario_completion >= 1
            and group_discussions_completion >= 1
            and nnr_assessment_completion = 1
        ) as curriculum_completion
    from progress

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
    cme_completion,
    drill_completion,
    practicum_completion,
    skill_demo_completion,
    video_completion,
    roleplay_completion,
    case_scenario_completion,
    group_discussions_completion,
    rounded_baseline_score as baseline_score,
    rounded_endline_score as endline_score,
    nnr_assessment_completion,
    curriculum_completion,
    if(
        curriculum_completion = 1
        and cme_threshold_date is not null
        and drill_threshold_date is not null
        and practicum_threshold_date is not null
        and skill_demo_threshold_date is not null
        and video_threshold_date is not null
        and roleplay_threshold_date is not null
        and case_scenario_threshold_date is not null
        and group_discussion_threshold_date is not null
        and assessment_completion_date is not null,
        greatest(
            cme_threshold_date,
            drill_threshold_date,
            practicum_threshold_date,
            skill_demo_threshold_date,
            video_threshold_date,
            roleplay_threshold_date,
            case_scenario_threshold_date,
            group_discussion_threshold_date,
            assessment_completion_date
        ),
        cast(null as Nullable(Date))
    ) as date_completed,
    assessment_completion_date
from completion_flags
order by mentee_id, cycle_id
