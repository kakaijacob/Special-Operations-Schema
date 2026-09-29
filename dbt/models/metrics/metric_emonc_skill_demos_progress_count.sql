select
    progress_year,
    count() as mentee_count,
    sum(skill_demos_count) as skill_demos_progress_count,
    countIf(skill_demos_count > 0) as mentees_with_progress,
    round(avg(skill_demos_count), 3) as avg_skill_demos_count
from {{ ref('mart_individual_mentee_emonc_curriculum_progress') }}
group by progress_year
order by progress_year
