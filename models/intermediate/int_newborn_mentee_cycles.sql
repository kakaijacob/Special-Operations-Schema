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
    c.req_practicum_essential,
    c.req_practicum_comprehensive,
    c.req_skill_demo,
    c.req_videos,
    c.req_roleplay,
    c.req_case_scenarios,
    c.req_group_discussions
from {{ ref('int_newborn_mentees') }} m
cross join {{ ref('int_newborn_cohorts') }} c
