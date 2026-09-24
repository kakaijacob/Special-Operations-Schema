-- Intermediate: one deterministic row per mentee (dedupe / business keys).
-- Expand once stg_airbyte__mentees column map is confirmed.

with mentees as (
    select * from {{ ref('stg_airbyte__mentees') }}
)

select *
from mentees
-- TODO: add qualify / row_number dedupe on mentee business key
