with tracking_by_cycle as (

    select
        c.cycle_id,
        c.req_cme,
        c.req_drills,
        c.req_practicum_essential,
        c.req_practicum_comprehensive,
        c.req_skill_demo,
        c.req_videos,
        c.req_roleplay,
        c.req_case_scenarios,
        c.req_group_discussions,
        t.mentee_id,
        t.mentorship_activity,
        t.program,
        t.topic,
        toDate(t.submitted_at) as submission_date
    from {{ ref('stg_mentors__newborn_curriculum_tracking') }} t
    inner join {{ ref('int_newborn_cohorts') }} c
        on toDate(t.submitted_at) between c.cycle_start and c.cycle_end
    where t.topic is not null

),

cycle_program as (

    select
        cycle_id,
        mentee_id,
        max(program) as program
    from tracking_by_cycle
    group by cycle_id, mentee_id

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
        max(req_videos) as req_videos,
        max(req_roleplay) as req_roleplay,
        max(req_case_scenarios) as req_case_scenarios,
        max(req_group_discussions) as req_group_discussions
    from tracking_by_cycle
    where mentorship_activity in (
        'cmes',
        'drills',
        'skill_demonstrations',
        'videos',
        'role plays',
        'case scenarios',
        'group discussions'
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
        countIf(mentorship_activity = 'skill_demonstrations') as skill_demo_completed_topics,
        minOrNullIf(
            first_date,
            mentorship_activity = 'skill_demonstrations' and topic_rank = req_skill_demo
        ) as skill_demo_threshold_date,
        countIf(mentorship_activity = 'videos') as video_completed_topics,
        minOrNullIf(
            first_date,
            mentorship_activity = 'videos' and topic_rank = req_videos
        ) as video_threshold_date,
        countIf(mentorship_activity = 'role plays') as roleplay_completed_topics,
        minOrNullIf(
            first_date,
            mentorship_activity = 'role plays' and topic_rank = req_roleplay
        ) as roleplay_threshold_date,
        countIf(mentorship_activity = 'case scenarios') as case_scenario_completed_topics,
        minOrNullIf(
            first_date,
            mentorship_activity = 'case scenarios' and topic_rank = req_case_scenarios
        ) as case_scenario_threshold_date,
        countIf(mentorship_activity = 'group discussions') as group_discussion_completed_topics,
        minOrNullIf(
            first_date,
            mentorship_activity = 'group discussions' and topic_rank = req_group_discussions
        ) as group_discussion_threshold_date
    from topic_ranked
    group by cycle_id, mentee_id

),

practicum_topic_first as (

    select
        cycle_id,
        mentee_id,
        program,
        topic,
        min(submission_date) as first_date,
        max(req_practicum_essential) as req_practicum_essential,
        max(req_practicum_comprehensive) as req_practicum_comprehensive
    from tracking_by_cycle
    where mentorship_activity = 'practicums'
      and program in (
          'essential_newborn_care',
          'comprehensive_newborn_care'
      )
    group by cycle_id, mentee_id, program, topic

),

practicum_ranked as (

    select
        *,
        row_number() over (
            partition by cycle_id, mentee_id, program
            order by first_date, topic
        ) as topic_rank
    from practicum_topic_first

),

practicum_by_program as (

    select
        cycle_id,
        mentee_id,
        program,
        count(*) as completed_topics,
        if(
            program = 'essential_newborn_care',
            max(req_practicum_essential),
            max(req_practicum_comprehensive)
        ) as required_topics,
        minOrNullIf(
            first_date,
            (
                program = 'essential_newborn_care'
                and topic_rank = req_practicum_essential
            )
            or (
                program = 'comprehensive_newborn_care'
                and topic_rank = req_practicum_comprehensive
            )
        ) as threshold_date
    from practicum_ranked
    group by cycle_id, mentee_id, program

),

practicum_progress as (

    select
        cycle_id,
        mentee_id,
        if(
            countIf(program = 'essential_newborn_care') > 0,
            'essential_newborn_care',
            'comprehensive_newborn_care'
        ) as practicum_program,
        if(
            countIf(program = 'essential_newborn_care') > 0,
            maxIf(completed_topics, program = 'essential_newborn_care'),
            maxIf(completed_topics, program = 'comprehensive_newborn_care')
        ) as practicum_completed_topics,
        if(
            countIf(program = 'essential_newborn_care') > 0,
            maxIf(required_topics, program = 'essential_newborn_care'),
            maxIf(required_topics, program = 'comprehensive_newborn_care')
        ) as practicum_required_topics,
        if(
            countIf(program = 'essential_newborn_care') > 0,
            maxIf(threshold_date, program = 'essential_newborn_care'),
            maxIf(threshold_date, program = 'comprehensive_newborn_care')
        ) as practicum_threshold_date
    from practicum_by_program
    group by cycle_id, mentee_id

)

select
    cp.cycle_id as cycle_id,
    cp.mentee_id as mentee_id,
    cp.program as cycle_program,
    s.cme_completed_topics,
    s.cme_threshold_date,
    s.drill_completed_topics,
    s.drill_threshold_date,
    p.practicum_program,
    p.practicum_completed_topics,
    p.practicum_required_topics,
    p.practicum_threshold_date,
    s.skill_demo_completed_topics,
    s.skill_demo_threshold_date,
    s.video_completed_topics,
    s.video_threshold_date,
    s.roleplay_completed_topics,
    s.roleplay_threshold_date,
    s.case_scenario_completed_topics,
    s.case_scenario_threshold_date,
    s.group_discussion_completed_topics,
    s.group_discussion_threshold_date
from cycle_program cp
left join standard_progress s
    on cp.cycle_id = s.cycle_id
   and cp.mentee_id = s.mentee_id
left join practicum_progress p
    on cp.cycle_id = p.cycle_id
   and cp.mentee_id = p.mentee_id
