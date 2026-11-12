-- Completed EmONC cycles must have a non-null date_completed.
select
    mentee_id,
    cycle_id
from {{ ref('mart_emonc_curriculum_completion') }}
where curriculum_completion = 1
  and date_completed is null
