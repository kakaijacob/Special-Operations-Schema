select
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end,
    count() as mentee_count,
    countIf(video_completion >= 1) as covered_mentee_count,
    round(
        toFloat64(countIf(video_completion >= 1)) / nullIf(count(), 0),
        3
    ) as video_coverage_rate,
    round(avg(video_completion), 3) as avg_video_completion
from {{ ref('mart_newborn_curriculum_completion') }}
group by cycle_id, cycle_label, cycle_start, cycle_end
order by cycle_id
