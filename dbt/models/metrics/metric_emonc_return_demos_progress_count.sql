select
    progress_year,
    count() as mentee_count,
    sum(return_demos_count) as return_demos_progress_count,
    countIf(return_demos_count > 0) as mentees_with_progress,
    round(avg(return_demos_count), 3) as avg_return_demos_count
from {{ ref('mart_individual_mentee_emonc_curriculum_progress') }}
group by progress_year
order by progress_year
