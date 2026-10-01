select
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end,
    count() as mentee_count,
    sum(video_count) as video_progress_count,
    round(avg(video_count), 3) as avg_video_count,
    countIf(video_count > 0) as mentees_with_video
from {{ ref('mart_individual_mentee_newborn_curriculum_progress') }}
group by cycle_id, cycle_label, cycle_start, cycle_end
order by cycle_id
