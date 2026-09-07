with progress as (

    select
        mc.mentee_id as mentee_id,
        mc.mentee_name as mentee_name,
        mc.county as county,
        mc.facility as facility,
        mc.facility_code as facility_code,
        mc.cycle_id as cycle_id,
        mc.cycle_label as cycle_label,
        mc.cycle_start as cycle_start,
        mc.cycle_end as cycle_end,

        round(
            least(
                toFloat64(coalesce(a.cme_completed_topics, 0)) / mc.req_cme,
                1.0
            ),
            3
        ) as cme_completion,

        round(
            least(
                toFloat64(coalesce(a.drill_completed_topics, 0)) / mc.req_drills,
                1.0
            ),
            3
        ) as drill_completion,

        round(
            least(
                toFloat64(coalesce(a.skill_demo_completed_topics, 0)) / mc.req_skill_demo,
                1.0
            ),
            3
        ) as skill_demo_completion,

        round(
            least(
                toFloat64(coalesce(a.return_demo_completed_topics, 0)) / mc.req_return_demo,
                1.0
            ),
            3
        ) as return_demo_completion,

        round(
            least(
                toFloat64(coalesce(a.labor_monitoring_completed_topics, 0))
                    / mc.req_labor_monitoring,
                1.0
            ),
            3
        ) as labor_monitoring_completion,

        round(
            least(
                toFloat64(coalesce(se.completed_assessments, 0)) / mc.req_skill_eval,
                1.0
            ),
            3
        ) as skill_evaluation_completion,

        round(se.avg_skill_score, 3) as avg_skill_score,
        a.cme_threshold_date as cme_threshold_date,
        a.drill_threshold_date as drill_threshold_date,
        a.skill_demo_threshold_date as skill_demo_threshold_date,
        a.return_demo_threshold_date as return_demo_threshold_date,
        a.labor_monitoring_threshold_date as labor_monitoring_threshold_date,
        se.threshold_date as skill_evaluation_threshold_date
    from {{ ref('int_emonc_mentee_cycles') }} mc
    left join {{ ref('int_emonc_curriculum_activity_progress') }} a
        on mc.mentee_id = a.mentee_id
       and mc.cycle_id = a.cycle_id
    left join {{ ref('int_emonc_skill_evaluation_progress') }} se
        on mc.mentee_id = se.mentee_id
       and mc.cycle_id = se.cycle_id

),

completion_flags as (

    select
        *,
        toUInt8(
            cme_completion >= 1
            and drill_completion >= 1
            and skill_demo_completion >= 1
            and return_demo_completion >= 1
            and labor_monitoring_completion >= 1
            and skill_evaluation_completion >= 1
        ) as curriculum_completion
    from progress

)

select
    mentee_id,
    mentee_name,
    county,
    facility,
    facility_code,
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end,
    cme_completion,
    drill_completion,
    skill_demo_completion,
    return_demo_completion,
    labor_monitoring_completion,
    skill_evaluation_completion,
    avg_skill_score,
    curriculum_completion,
    if(
        curriculum_completion = 1
        and cme_threshold_date is not null
        and drill_threshold_date is not null
        and skill_demo_threshold_date is not null
        and return_demo_threshold_date is not null
        and labor_monitoring_threshold_date is not null
        and skill_evaluation_threshold_date is not null,
        greatest(
            cme_threshold_date,
            drill_threshold_date,
            skill_demo_threshold_date,
            return_demo_threshold_date,
            labor_monitoring_threshold_date,
            skill_evaluation_threshold_date
        ),
        cast(null as Nullable(Date))
    ) as date_completed
from completion_flags
order by mentee_id, cycle_id
