-- Mart: mentee master for BI / ops.
-- Keep thin until staging column contracts are locked.

select *
from {{ ref('int_mentees') }}
