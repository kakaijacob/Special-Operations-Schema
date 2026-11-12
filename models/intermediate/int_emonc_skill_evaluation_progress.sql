with skill_eval_by_skill as (

    select
        c.cycle_id,
        c.req_skill_eval,
        s.mentee_id,
        s.skill_evaluation,
        max(s.average_score) as max_score,
        minOrNullIf(
            toDate(s.submitted_at),
            s.average_score >= 0.85
        ) as first_pass_date
    from {{ ref('stg_mentors__processed_skill_assessments') }} s
    inner join {{ ref('int_emonc_cohorts') }} c
        on toDate(s.submitted_at) between c.cycle_start and c.cycle_end
    where s.skill_evaluation is not null
      and s.average_score is not null
    group by
        c.cycle_id,
        c.req_skill_eval,
        s.mentee_id,
        s.skill_evaluation

),

skill_eval_passed as (

    select
        *,
        row_number() over (
            partition by cycle_id, mentee_id
            order by first_pass_date, skill_evaluation
        ) as skill_rank
    from skill_eval_by_skill
    where max_score >= 0.85
      and first_pass_date is not null

),

skill_eval_stats as (

    select
        cycle_id,
        mentee_id,
        countIf(max_score >= 0.85) as completed_assessments,
        max(req_skill_eval) as required_assessments,
        avg(max_score) as avg_skill_score
    from skill_eval_by_skill
    group by cycle_id, mentee_id

),

skill_eval_threshold as (

    select
        cycle_id,
        mentee_id,
        minOrNullIf(
            first_pass_date,
            skill_rank = req_skill_eval
        ) as threshold_date
    from skill_eval_passed
    group by cycle_id, mentee_id

)

select
    s.cycle_id,
    s.mentee_id,
    s.completed_assessments,
    s.required_assessments,
    toNullable(s.avg_skill_score) as avg_skill_score,
    t.threshold_date
from skill_eval_stats s
left join skill_eval_threshold t
    on s.cycle_id = t.cycle_id
   and s.mentee_id = t.mentee_id
