select
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end,
    count() as mentee_count,
    sum(roleplay_count) as roleplay_progress_count,
    round(avg(roleplay_count), 3) as avg_roleplay_count,
    countIf(roleplay_count > 0) as mentees_with_roleplay
from {{ ref('mart_individual_mentee_newborn_curriculum_progress') }}
group by cycle_id, cycle_label, cycle_start, cycle_end
order by cycle_id
