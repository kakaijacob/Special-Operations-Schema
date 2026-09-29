-- Rolled-up average skill scores from individual EmONC progress (by progress year).
select
    progress_year,
    count() as mentee_count,
    round(avg(average_score), 3) as average_score_progress,
    round(avgIf(average_score, skill_eval_count > 0), 3) as avg_score_among_assessed,
    countIf(skill_eval_count > 0) as mentees_with_skill_eval
from {{ ref('mart_individual_mentee_emonc_curriculum_progress') }}
group by progress_year
order by progress_year
