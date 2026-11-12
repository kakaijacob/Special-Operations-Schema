select
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end,
    count() as mentee_count,
    sum(cme_count) as cme_progress_count,
    round(avg(cme_count), 3) as avg_cme_count,
    countIf(cme_count > 0) as mentees_with_cme
from {{ ref('mart_individual_mentee_newborn_curriculum_progress') }}
group by cycle_id, cycle_label, cycle_start, cycle_end
order by cycle_id
