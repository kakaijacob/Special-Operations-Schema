select
    toUInt8(1) as cycle_id,
    'Cohort 1' as cycle_label,
    toDate('2024-01-01') as cycle_start,
    toDate('2026-03-31') as cycle_end,
    toUInt8(11) as req_cme,
    toUInt8(5) as req_drills,
    toUInt8(18) as req_skill_demo,
    toUInt8(18) as req_return_demo,
    toUInt8(1) as req_labor_monitoring,
    toUInt8(18) as req_skill_eval

union all

select
    toUInt8(2),
    'Cohort 2',
    toDate('2026-04-01'),
    toDate('2027-03-31'),
    toUInt8(13),
    toUInt8(5),
    toUInt8(21),
    toUInt8(21),
    toUInt8(1),
    toUInt8(21)

union all

select
    toUInt8(3),
    'Cohort 3',
    toDate('2027-04-01'),
    toDate('2028-03-31'),
    toUInt8(13),
    toUInt8(5),
    toUInt8(21),
    toUInt8(21),
    toUInt8(1),
    toUInt8(21)
