-- All individual EmONC progress counts rolled up for the progress year.
select
    progress_year,
    count() as mentee_count,
    sum(cme_count) as cme_progress_count,
    sum(drill_count) as drill_progress_count,
    sum(skill_demos_count) as skill_demos_progress_count,
    sum(return_demos_count) as return_demos_progress_count,
    sum(skill_eval_count) as skill_eval_progress_count,
    sum(labor_monitoring_count) as labor_monitoring_progress_count,
    round(avg(average_score), 3) as avg_average_score,
    countIf(cme_count > 0) as mentees_with_cme_progress,
    countIf(drill_count > 0) as mentees_with_drill_progress,
    countIf(skill_demos_count > 0) as mentees_with_skill_demos_progress,
    countIf(return_demos_count > 0) as mentees_with_return_demos_progress,
    countIf(skill_eval_count > 0) as mentees_with_skill_eval_progress,
    countIf(labor_monitoring_count > 0) as mentees_with_labor_monitoring_progress
from {{ ref('mart_individual_mentee_emonc_curriculum_progress') }}
group by progress_year
order by progress_year
