-- Distinct newborn activity topic counts by mentee × cycle.
-- Prefer essential_newborn_care practicum track when both are present.
-- Activity labels are lowercased in staging (CMEs → cmes, Practicums → practicums).

with tracking_by_cycle as (

    select
        c.cycle_id,
        t.mentee_id,
        t.facility_code,
        t.program,
        t.mentorship_activity,
        t.topic,
        toDate(t.submitted_at) as submission_date
    from {{ ref('stg_processed__newborn_curriculum_tracking') }} t
    inner join {{ ref('int_newborn_cohorts') }} c
        on toDate(t.submitted_at) between c.cycle_start and c.cycle_end

)

select
    cycle_id,
    mentee_id,
    max(facility_code) as facility_code,
    max(program) as program,

    countDistinctIf(
        topic,
        mentorship_activity = 'cmes'
        and topic is not null
        and trim(topic) <> ''
    ) as cme_count,

    countDistinctIf(
        topic,
        mentorship_activity = 'drills'
        and topic is not null
        and trim(topic) <> ''
    ) as drill_count,

    -- Prefer essential when present in the cycle; else comprehensive.
    if(
        max(program = 'essential_newborn_care') = 1,
        countDistinctIf(
            topic,
            mentorship_activity = 'practicums'
            and program = 'essential_newborn_care'
            and topic is not null
            and trim(topic) <> ''
        ),
        if(
            max(program = 'comprehensive_newborn_care') = 1,
            countDistinctIf(
                topic,
                mentorship_activity = 'practicums'
                and program = 'comprehensive_newborn_care'
                and topic is not null
                and trim(topic) <> ''
            ),
            toUInt64(0)
        )
    ) as practicum_count,

    countDistinctIf(
        topic,
        mentorship_activity = 'skill_demonstrations'
        and topic is not null
        and trim(topic) <> ''
    ) as skill_demo_count,

    countDistinctIf(
        topic,
        mentorship_activity = 'videos'
        and topic is not null
        and trim(topic) <> ''
    ) as video_count,

    countDistinctIf(
        topic,
        mentorship_activity = 'role plays'
        and topic is not null
        and trim(topic) <> ''
    ) as roleplay_count,

    countDistinctIf(
        topic,
        mentorship_activity = 'case scenarios'
        and topic is not null
        and trim(topic) <> ''
    ) as case_scenario_count,

    countDistinctIf(
        topic,
        mentorship_activity = 'group discussions'
        and topic is not null
        and trim(topic) <> ''
    ) as group_discussions_count

from tracking_by_cycle
group by cycle_id, mentee_id
