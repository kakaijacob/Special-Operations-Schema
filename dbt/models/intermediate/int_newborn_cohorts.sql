-- Cohort windows and newborn curriculum thresholds.
-- Add a future cohort with another UNION ALL row.
-- Windows are inclusive: cycle_start <= date <= cycle_end.

select
    toUInt8(1) as cycle_id,
    'Cohort 1' as cycle_label,
    toDate('2024-01-01') as cycle_start,
    toDate('2026-03-31') as cycle_end,
    toUInt8(19) as req_cme,
    toUInt8(7) as req_drills,
    toUInt8(20) as req_practicum_essential,
    toUInt8(22) as req_practicum_comprehensive,
    toUInt8(5) as req_skill_demo,
    toUInt8(12) as req_videos,
    toUInt8(2) as req_roleplay,
    toUInt8(9) as req_case_scenarios,
    toUInt8(7) as req_group_discussions

union all

select
    toUInt8(2),
    'Cohort 2',
    toDate('2026-04-01'),
    toDate('2027-03-31'),
    toUInt8(19),
    toUInt8(7),
    toUInt8(20),
    toUInt8(22),
    toUInt8(5),
    toUInt8(12),
    toUInt8(2),
    toUInt8(9),
    toUInt8(7)

union all

select
    toUInt8(3),
    'Cohort 3',
    toDate('2027-04-01'),
    toDate('2028-03-31'),
    toUInt8(19),
    toUInt8(7),
    toUInt8(20),
    toUInt8(22),
    toUInt8(5),
    toUInt8(12),
    toUInt8(2),
    toUInt8(9),
    toUInt8(7)
