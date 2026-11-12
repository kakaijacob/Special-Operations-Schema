-- NNR: baseline + endline present and endline >= 0.85.
select
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end,
    count() as mentee_count,
    countIf(nnr_assessment_completion = 1) as covered_mentee_count,
    round(
        toFloat64(countIf(nnr_assessment_completion = 1)) / nullIf(count(), 0),
        3
    ) as nnr_assessment_coverage_rate,
    round(avg(baseline_score), 3) as avg_baseline_score,
    round(avg(endline_score), 3) as avg_endline_score
from {{ ref('mart_newborn_curriculum_completion') }}
group by cycle_id, cycle_label, cycle_start, cycle_end
order by cycle_id
