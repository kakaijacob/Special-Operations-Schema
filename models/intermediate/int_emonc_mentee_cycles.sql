select
    m.mentee_id,
    m.mentee_name,
    m.county,
    m.facility,
    m.facility_code,
    c.cycle_id,
    c.cycle_label,
    c.cycle_start,
    c.cycle_end,
    c.req_cme,
    c.req_drills,
    c.req_skill_demo,
    c.req_return_demo,
    c.req_labor_monitoring,
    c.req_skill_eval
from {{ ref('int_emonc_mentees') }} m
cross join {{ ref('int_emonc_cohorts') }} c
