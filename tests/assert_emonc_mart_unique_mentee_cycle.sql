select
    mentee_id,
    cycle_id,
    count(*) as row_count
from {{ ref('mart_emonc_curriculum_completion') }}
group by mentee_id, cycle_id
having count(*) > 1
