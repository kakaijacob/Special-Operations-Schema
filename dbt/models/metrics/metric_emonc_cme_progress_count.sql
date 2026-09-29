-- Aggregate CME topic progress for mentees in the individual EmONC progress mart.
select
    progress_year,
    count() as mentee_count,
    sum(cme_count) as cme_progress_count,
    countIf(cme_count > 0) as mentees_with_progress,
    round(avg(cme_count), 3) as avg_cme_count
from {{ ref('mart_individual_mentee_emonc_curriculum_progress') }}
group by progress_year
order by progress_year
