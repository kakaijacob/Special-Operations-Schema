-- Rolled-up skill-eval counts from individual EmONC progress (by progress year).
-- Partograph already excluded upstream.
select
    progress_year,
    count() as mentee_count,
    sum(skill_eval_count) as skill_eval_progress_count,
    round(avg(skill_eval_count), 3) as avg_skill_eval_count,
    countIf(skill_eval_count > 0) as mentees_with_skill_eval
from {{ ref('mart_individual_mentee_emonc_curriculum_progress') }}
group by progress_year
order by progress_year
