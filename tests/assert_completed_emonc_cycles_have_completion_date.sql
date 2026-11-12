select *
from {{ ref('mart_emonc_curriculum_completion') }}
where curriculum_completion = 1
  and date_completed is null
