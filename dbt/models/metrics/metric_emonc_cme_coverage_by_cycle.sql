-- Share of mentees who completed required CMEs in each cycle.
select
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end,
    count() as mentee_count,
    countIf(cme_completion >= 1) as covered_mentee_count,
    round(
        toFloat64(countIf(cme_completion >= 1)) / nullIf(count(), 0),
        3
    ) as cme_coverage_rate,
    round(avg(cme_completion), 3) as avg_cme_completion
from {{ ref('mart_emonc_curriculum_completion') }}
group by
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end
order by cycle_id
