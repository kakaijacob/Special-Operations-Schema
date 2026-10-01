-- Rolled-up drill topic counts from individual EmONC progress (by progress year).
select
    progress_year,
    count() as mentee_count,
    sum(drill_count) as drill_progress_count,
    round(avg(drill_count), 3) as avg_drill_count,
    countIf(drill_count > 0) as mentees_with_drills
from {{ ref('mart_individual_mentee_emonc_curriculum_progress') }}
group by progress_year
order by progress_year
