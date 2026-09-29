select
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end,
    count() as mentee_count,
    sum(drill_count) as drill_progress_count,
    round(avg(drill_count), 3) as avg_drill_count,
    countIf(drill_count > 0) as mentees_with_drills
from {{ ref('mart_individual_mentee_newborn_curriculum_progress') }}
group by cycle_id, cycle_label, cycle_start, cycle_end
order by cycle_id
