with cohort_dates as (

    select
        toUInt8(1) as cycle_id,
        'Cohort 1' as cycle_label,
        toDate('2024-01-01') as cycle_start,
        toDate('2026-03-31') as cycle_end

    union all

    select
        toUInt8(2),
        'Cohort 2',
        toDate('2026-04-01'),
        toDate('2027-03-31')

    union all

    select
        toUInt8(3),
        'Cohort 3',
        toDate('2027-04-01'),
        toDate('2028-03-31')

)

select
    cycle_id,
    cycle_label,
    cycle_start,
    cycle_end,
    toUInt8(19) as req_cme,
    toUInt8(7) as req_drills,
    toUInt8(20) as req_practicum_essential,
    toUInt8(22) as req_practicum_comprehensive,
    toUInt8(5) as req_skill_demo,
    toUInt8(12) as req_videos,
    toUInt8(2) as req_roleplay,
    toUInt8(9) as req_case_scenarios,
    toUInt8(7) as req_group_discussions
from cohort_dates
