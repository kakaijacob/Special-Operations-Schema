select *
from {{ ref('mart_newborn_curriculum_completion') }}
where curriculum_completion = 1
  and date_completed is null
