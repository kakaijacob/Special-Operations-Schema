-- Cohort windows and EmONC curriculum thresholds.
-- Add a future cohort with another UNION ALL row.
-- Windows are inclusive: cycle_start <= date <= cycle_end.
--
-- Cohort 1: 11 CME / 5 drills / 18 skill demo / 18 return demo / 1 labor / 18 skill eval
-- Cohort 2+: 13 CME / 5 drills / 20 skill demo / 20 return demo / 1 labor / 20 skill eval

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
    toUInt8(20),
    toUInt8(20),
    toUInt8(1),
    toUInt8(20)

union all

select
    toUInt8(3),
    'Cohort 3',
    toDate('2027-04-01'),
    toDate('2028-03-31'),
    toUInt8(13),
    toUInt8(5),
    toUInt8(20),
    toUInt8(20),
    toUInt8(1),
    toUInt8(20)
