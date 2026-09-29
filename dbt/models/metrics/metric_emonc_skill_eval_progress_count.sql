select
    progress_year,
    count() as mentee_count,
    sum(skill_eval_count) as skill_eval_progress_count,
    countIf(skill_eval_count > 0) as mentees_with_progress,
    round(avg(skill_eval_count), 3) as avg_skill_eval_count,
    round(avg(average_score), 3) as avg_average_score
from {{ ref('mart_individual_mentee_emonc_curriculum_progress') }}
group by progress_year
order by progress_year
