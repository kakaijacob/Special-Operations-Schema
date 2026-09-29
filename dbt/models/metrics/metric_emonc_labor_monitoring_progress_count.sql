select
    progress_year,
    count() as mentee_count,
    sum(labor_monitoring_count) as labor_monitoring_progress_count,
    countIf(labor_monitoring_count > 0) as mentees_with_progress,
    round(avg(labor_monitoring_count), 3) as avg_labor_monitoring_count
from {{ ref('mart_individual_mentee_emonc_curriculum_progress') }}
group by progress_year
order by progress_year
