-- Unique grain on (mentee_id, cycle_id) for individual newborn progress.
select
    mentee_id,
    cycle_id,
    count() as row_count
from {{ ref('mart_individual_mentee_newborn_curriculum_progress') }}
group by mentee_id, cycle_id
having count() > 1
