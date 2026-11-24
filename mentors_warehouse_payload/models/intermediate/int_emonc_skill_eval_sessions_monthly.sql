-- EmONC MoH skill-evaluation sessions by calendar month.
-- Partograph excluded (no longer essential).

select
    toStartOfMonth(toDate(submitted_at)) as month_start,
    countDistinct(submission_id) as sessions_conducted,
    countDistinct(mentee_id) as mentees_reached,
    countDistinct(nullIf(facility_code, '')) as facilities_reached,
    countDistinct(skill_evaluation) as skills_assessed
from {{ ref('stg_processed__moh_skills_assessment') }}
where submitted_at is not null
  and skill_evaluation is not null
  and lowerUTF8(trim(skill_evaluation)) <> 'partograph'
group by month_start
order by month_start
