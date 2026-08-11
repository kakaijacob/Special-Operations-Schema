with tracking_by_cycle as (

    select
        c.cycle_id,
        c.req_cme,
        c.req_drills,
        c.req_skill_demo,
        c.req_return_demo,
        c.req_labor_monitoring,
        t.mentee_id,
        t.mentorship_activity,
        t.topic,
        toDate(t.submitted_at) as submission_date
    from {{ ref('stg_mentors__mentee_curriculum_tracking') }} t
    inner join {{ ref('int_emonc_cohorts') }} c
        on toDate(t.submitted_at) between c.cycle_start and c.cycle_end
    where t.topic is not null

),

topic_first as (

    select
        cycle_id,
        mentee_id,
        mentorship_activity,
        topic,
        min(submission_date) as first_date,
        max(req_cme) as req_cme,
        max(req_drills) as req_drills,
        max(req_skill_demo) as req_skill_demo,
        max(req_return_demo) as req_return_demo
    from tracking_by_cycle
    where mentorship_activity in (
        'cmes',
        'drills',
        'skill_demos_mentor',
        'skills_demos_mentee'
    )
    group by cycle_id, mentee_id, mentorship_activity, topic

),

topic_ranked as (

    select
        *,
        row_number() over (
            partition by cycle_id, mentee_id, mentorship_activity
            order by first_date, topic
        ) as topic_rank
    from topic_first

),

standard_progress as (

    select
        cycle_id,
        mentee_id,
        countIf(mentorship_activity = 'cmes') as cme_completed_topics,
        minOrNullIf(
            first_date,
            mentorship_activity = 'cmes' and topic_rank = req_cme
        ) as cme_threshold_date,
        countIf(mentorship_activity = 'drills') as drill_completed_topics,
        minOrNullIf(
            first_date,
            mentorship_activity = 'drills' and topic_rank = req_drills
        ) as drill_threshold_date,
        countIf(mentorship_activity = 'skill_demos_mentor') as skill_demo_completed_topics,
        minOrNullIf(
            first_date,
            mentorship_activity = 'skill_demos_mentor' and topic_rank = req_skill_demo
        ) as skill_demo_threshold_date,
        countIf(mentorship_activity = 'skills_demos_mentee') as return_demo_completed_topics,
        minOrNullIf(
            first_date,
            mentorship_activity = 'skills_demos_mentee' and topic_rank = req_return_demo
        ) as return_demo_threshold_date
    from topic_ranked
    group by cycle_id, mentee_id

),

labor_topic_first as (

    select
        cycle_id,
        mentee_id,
        topic,
        min(submission_date) as first_date,
        max(req_labor_monitoring) as req_labor_monitoring
    from tracking_by_cycle
    where mentorship_activity in (
        'video_case_scenarios',
        'videoa_case_scenarios',
        'case_scenarios'
    )
      and topic in (
        'Partograph_use_and_interpretation',
        'Labor Monitoring'
    )
    group by cycle_id, mentee_id, topic

),

labor_ranked as (

    select
        *,
        row_number() over (
            partition by cycle_id, mentee_id
            order by first_date, topic
        ) as topic_rank
    from labor_topic_first

),

labor_progress as (

    select
        cycle_id,
        mentee_id,
        count(*) as labor_monitoring_completed_topics,
        minOrNullIf(
            first_date,
            topic_rank = req_labor_monitoring
        ) as labor_monitoring_threshold_date
    from labor_ranked
    group by cycle_id, mentee_id

),

progress_ids as (

    select cycle_id, mentee_id from standard_progress
    union distinct
    select cycle_id, mentee_id from labor_progress

)

select
    ids.cycle_id as cycle_id,
    ids.mentee_id as mentee_id,
    s.cme_completed_topics,
    s.cme_threshold_date,
    s.drill_completed_topics,
    s.drill_threshold_date,
    s.skill_demo_completed_topics,
    s.skill_demo_threshold_date,
    s.return_demo_completed_topics,
    s.return_demo_threshold_date,
    l.labor_monitoring_completed_topics,
    l.labor_monitoring_threshold_date
from progress_ids ids
left join standard_progress s
    on ids.cycle_id = s.cycle_id
   and ids.mentee_id = s.mentee_id
left join labor_progress l
    on ids.cycle_id = l.cycle_id
   and ids.mentee_id = l.mentee_id
