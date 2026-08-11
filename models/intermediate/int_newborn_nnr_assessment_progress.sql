with ranked as (

    select
        c.cycle_id,
        s.mentee_id,
        s.submission_id,
        toDate(s.submitted_at) as submission_date,
        s.average_score,
        row_number() over (
            partition by c.cycle_id, s.mentee_id
            order by toDate(s.submitted_at), s.submission_id
        ) as first_rank,
        row_number() over (
            partition by c.cycle_id, s.mentee_id
            order by toDate(s.submitted_at) desc, s.submission_id desc
        ) as last_rank,
        count(*) over (
            partition by c.cycle_id, s.mentee_id
        ) as assessment_count
    from {{ ref('stg_mentors__newborn_resuscitation_assessments') }} s
    inner join {{ ref('int_newborn_cohorts') }} c
        on toDate(s.submitted_at) between c.cycle_start and c.cycle_end
    where s.average_score is not null

)

select
    cycle_id,
    mentee_id,
    maxOrNullIf(average_score, first_rank = 1) as baseline_score,
    maxOrNullIf(
        average_score,
        assessment_count > 1 and last_rank = 1
    ) as endline_score,
    maxOrNullIf(
        submission_date,
        assessment_count > 1 and last_rank = 1
    ) as assessment_completion_date
from ranked
group by cycle_id, mentee_id
