select
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end,
    count() as mentee_count,
    sum(practicum_count) as practicum_progress_count,
    round(avg(practicum_count), 3) as avg_practicum_count,
    countIf(practicum_count > 0) as mentees_with_practicum
from {{ ref('mart_individual_mentee_newborn_curriculum_progress') }}
group by cycle_id, cycle_label, cycle_start, cycle_end
order by cycle_id
