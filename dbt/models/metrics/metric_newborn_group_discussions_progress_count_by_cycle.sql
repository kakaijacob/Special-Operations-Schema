select
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end,
    count() as mentee_count,
    sum(group_discussions_count) as group_discussions_progress_count,
    round(avg(group_discussions_count), 3) as avg_group_discussions_count,
    countIf(group_discussions_count > 0) as mentees_with_group_discussions
from {{ ref('mart_individual_mentee_newborn_curriculum_progress') }}
group by cycle_id, cycle_label, cycle_start, cycle_end
order by cycle_id
