# Cursor prompt — rebuild Kenya mentors dbt models

Copy everything below the line into Cursor in your new dbt repo after the project
scaffold (profile, `dbt_project.yml`, ClickHouse adapter) is working.

---

## Prompt (copy from here)

You are building the Kenya mentors analytics dbt project on ClickHouse
(Airbyte → ClickHouse). My dbt project is already set up. Create the full model
tree below **complete with comments**, YAML docs/tests, macros, and sample seeds
so models can parse/run offline first, then wire to live sources.

### Context / warehouse
- Warehouse: ClickHouse
- Raw Airbyte schemas:
  - `googlesheets`
  - `kobotoolbox`
- dbt project name / profile: use whatever is already in this repo
  (do not rename the project/profile unless necessary)
- Dialect: ClickHouse SQL (`toDate`, `toYear`, `toStartOfMonth`, `countDistinct`,
  `least`, `if`, `multiIf`, `lowerUTF8`, `nullIf`, `MergeTree`, etc.)
- Do **not** invent purple/AI-generic BI dashboards; this is SQL/dbt only.

### Layering rules (strict)
| Layer | Materialization | Rule |
|-------|-----------------|------|
| staging | view | Rename/cast/trim only; keep source grain |
| intermediate | table | One business job per model |
| marts | table | Stable BI contracts for Power BI |
| metrics | table | Aggregations only — never re-implement mart logic |

Folder layout:
```text
models/
  staging/
    googlesheets/
    kobotoolbox/
    processed/
  intermediate/
  marts/
  metrics/
macros/
seeds/
tests/
```

Every SQL model must start with a short header comment stating:
- purpose
- grain
- key business rules
- upstream refs/sources

### Sources to declare (`models/staging/_sources.yml`)

**googlesheets**
- `ke_mentors_legacy_mentees` — legacy mentee DB (2024–2025)
- `ke_mentors_mentees` — current mentee DB (2026)
- `ke_mentors_mentors` — in-facility mentors
- `ke_facility_prioritization_database` — facilities in program
- `ke_mentors_total_delta_users` — DELTA 1.0 learners
- `ke_legacy_emonc_knowledge_survey` — legacy knowledge assessments

**kobotoolbox**
- `emonc_curriculum_tracking_submissions`
- `moh_skills_assessment_submissions`
- `newbon_curriculum_tracking_submissions` (note spelling `newbon`)
- `quality_intrapartum_care_surveillance_submissions`

Confirm identifiers with `SHOW TABLES` if available; keep names configurable.

### Macros required
1. `resolve_column(relation, column_name)` — fuzzy-match Airbyte-rewritten Google
   Sheet headers (alphanumeric-only normalize).
2. `parse_sheet_date(column)` — handle DD/MM/YYYY and ISO dates → Nullable(Date).
3. `sentence_case(column)` — optional text cleanup helper.

### Project vars (`dbt_project.yml`)
```yaml
vars:
  use_sample_seeds: true          # true until ClickHouse sources are wired
  emonc_progress_year: 2026
  # EmONC individual composite metric caps (Cohort 2+ / Power BI DAX mirror)
  emonc_individual_req_cme: 13
  emonc_individual_req_drills: 5
  emonc_individual_req_skill_demos: 20
  emonc_individual_req_return_demos: 20
  emonc_individual_req_skill_eval: 20
  emonc_individual_req_labor: 1
  # Newborn individual composite metric caps
  newborn_individual_req_cme: 19
  newborn_individual_req_drills: 7
  newborn_individual_req_practicum_essential: 20
  newborn_individual_req_practicum_comprehensive: 22
  newborn_individual_req_skill_demo: 5
  newborn_individual_req_videos: 12
  newborn_individual_req_roleplay: 2
  newborn_individual_req_case_scenarios: 9
  newborn_individual_req_group_discussions: 7
```

When `use_sample_seeds: true`, staging/processed models read seeds.
When `false`, they read `source(...)` (sheets via `resolve_column`).

### Sample seeds (offline)
Create seeds with realistic columns so `dbt seed` + `dbt run` work without live CH:
- `mentee_database_sample` (+ `date_activated`)
- `mentee_database_legacy_sample` (+ `date_activated`)
- `mentee_curriculum_tracking_sample`
- `process_moh_skills_assessment_sample`
- `newborn_curriculum_tracking_sample` (include `program`, mixed activity labels)
- `newborn_resuscitation_assessment_sample`

---

## MODELS TO CREATE (exact names)

### Staging — googlesheets
1. `stg_googlesheets__ke_mentors_mentees`
2. `stg_googlesheets__ke_mentors_legacy_mentees`
3. `stg_googlesheets__ke_mentors_mentors` (stub OK)
4. `stg_googlesheets__ke_facility_prioritization_database` (stub OK)
5. `stg_googlesheets__ke_mentors_total_delta_users` (stub OK)
6. `stg_googlesheets__ke_legacy_emonc_knowledge_survey` (stub OK)

Mentee staging must expose at least:
`mentee_id, mentee_name, county, facility, facility_code, program, date_activated, mentee_source`
with `program` lowercased.

### Staging — kobotoolbox (raw stubs OK until explode exists)
7. `stg_kobotoolbox__emonc_curriculum_tracking_submissions`
8. `stg_kobotoolbox__moh_skills_assessment_submissions`
9. `stg_kobotoolbox__newbon_curriculum_tracking_submissions`
10. `stg_kobotoolbox__quality_intrapartum_care_surveillance_submissions`

### Staging — processed facts (seed-backed until Kobo explode/parse exists)
11. `stg_processed__emonc_curriculum_tracking`
    - Grain: submission × mentee × mentorship_activity × topic
    - Lowercase `mentorship_activity`
12. `stg_processed__moh_skills_assessment`
    - Grain: submission × mentee × skill_evaluation with `average_score` in [0,1]
13. `stg_processed__newborn_curriculum_tracking`
    - Include `program`; lowercase activity + program
14. `stg_processed__newborn_resuscitation_assessments`
    - Filter: skill = newborn resuscitation AND program = newborn curriculum

---

### Intermediate — shared
15. `int_mentee_database`
    - Union current ∪ legacy mentee sheets
    - Prefer current attributes on `mentee_id` collision
    - Flags: `in_current`, `in_legacy`
    - Keep `date_activated`

### Intermediate — EmONC completion
16. `int_emonc_cohorts`
    - Cohort 1: 2024-01-01 → 2026-03-31; req 11/5/18/18/1/18
    - Cohort 2: 2026-04-01 → 2027-03-31; req 13/5/20/20/1/20
    - Cohort 3: 2027-04-01 → 2028-03-31; same as Cohort 2
    - Inclusive windows: cycle_start <= date <= cycle_end
    - Comment how to add Cohort 4 with UNION ALL
17. `int_emonc_mentees`
    - Spine: program in (`emonc curriculum`,`both`) from `int_mentee_database`
      UNION fact-only mentees from EmONC tracking + MoH skills
18. `int_emonc_mentee_cycles` — mentees × cohorts
19. `int_emonc_curriculum_activity_progress`
    - Distinct topics by activity within cycle
    - Activities: `cmes`, `drills`, `skill_demos_mentor`, `skills_demos_mentee`
    - Labor monitoring from activities
      (`video_case_scenarios`,`videoa_case_scenarios`,`case_scenarios`)
      and topics (`Partograph_use_and_interpretation`,`Labor Monitoring`)
    - Threshold date = date the Nth required distinct topic was first completed
20. `int_emonc_skill_evaluation_progress`
    - Per skill: MAX(average_score); avg of those maxima
    - Pass when max >= 0.85
    - **Exclude Partograph**
    - Threshold date when Nth passing skill is reached

### Intermediate — newborn completion
21. `int_newborn_cohorts`
    - All cohorts: req CME 19, drills 7, practicum essential 20 / comprehensive 22,
      skill demo 5, videos 12, roleplay 2, case scenarios 9, group discussions 7
    - Same date windows as EmONC cohorts
22. `int_newborn_mentees`
    - program in (`newborn curriculum`,`both`) ∪ fact-only (tracking + NNR)
23. `int_newborn_mentee_cycles`
24. `int_newborn_curriculum_activity_progress`
    - Standard activities (lowercased): cmes, drills, skill_demonstrations,
      videos, role plays, case scenarios, group discussions
    - Practicum: prefer `essential_newborn_care` when both tracks present;
      activity normalizes to `practicums` (case distinction was essential vs
      comprehensive program)
25. `int_newborn_nnr_assessment_progress`
    - First attempt = baseline; last attempt = endline **only if assessment_count > 1**
      (used by completion mart)

### Intermediate — newborn individual inspection
26. `int_newborn_individual_curriculum_counts`
    - Distinct topic counts by mentee×cycle (raw counts)
    - Prefer essential practicum when both present
27. `int_newborn_individual_nnr_progress`
    - Endline always = last attempt; expose `assessment_count`
    - Completion flag still requires count > 1 in the mart

### Intermediate — monthly sessions
28. `int_emonc_activity_sessions_monthly`
    - Grain: month_start × mentorship_activity
    - `sessions_conducted` = countDistinct(submission_id)
29. `int_newborn_activity_sessions_monthly` — same pattern
30. `int_emonc_skill_eval_sessions_monthly` — Partograph excluded
31. `int_newborn_nnr_sessions_monthly`

---

### Marts
32. `mart_emonc_curriculum_completion`
    - Grain: mentee_id × cycle_id (include empty progress rows)
    - Output component completion rates capped at 1, `avg_skill_score`,
      `curriculum_completion` (all six >= 1), `date_completed` = GREATEST of
      threshold dates when complete else NULL

33. `mart_individual_mentee_emonc_curriculum_progress`
    - Grain: one row per mentee activated in `emonc_progress_year` (default 2026)
    - Program EmONC/Both; LEFT JOIN activity counts for that year
    - Columns: cme_count, drill_count, skill_demos_count, return_demos_count,
      skill_eval_count, average_score, labor_monitoring_count
    - Labor topics: Partograph* OR Labor_Monitoring / Labor Monitoring
    - Partograph skill evals excluded
    - Keep zero-activity mentees

34. `mart_newborn_curriculum_completion`
    - Grain: mentee_id × cycle_id
    - Component completion ratios + NNR baseline/endline
    - NNR complete when baseline & endline present and endline >= 0.85
    - `date_completed` when all nine requirements met

35. `mart_individual_mentee_newborn_curriculum_progress`
    - Grain: mentee_id × cycle_id with **raw counts**
    - `curriculum_completion` uses **exact equality** to requirements
      (practicum req depends on program; -1/fail if program missing)
    - NNR completion requires assessment_count > 1 and endline >= 0.85

---

### Metrics — EmONC cohort coverage (`*_by_cycle`)
36. `metric_emonc_curriculum_completion_by_cycle`
37. `metric_emonc_cme_coverage_by_cycle`
38. `metric_emonc_drill_coverage_by_cycle`
39. `metric_emonc_skill_demo_coverage_by_cycle`
40. `metric_emonc_return_demo_coverage_by_cycle`
41. `metric_emonc_labor_monitoring_coverage_by_cycle`
42. `metric_emonc_skill_evaluation_coverage_by_cycle`

Coverage definition: share of mentees with component_completion >= 1 in that cycle.

### Metrics — EmONC individual progress (`*_by_cycle` naming even if grain is progress_year)
43. `metric_cme_progress_count_by_cycle`
44. `metric_drill_progress_count_by_cycle`
45. `metric_skill_demos_progress_count_by_cycle`
46. `metric_return_demos_progress_count_by_cycle`
47. `metric_skill_eval_progress_count_by_cycle`
48. `metric_average_score_progress_by_cycle`
49. `metric_labor_monitoring_progress_count_by_cycle`
50. `metric_individual_mentee_emonc_curriculum_progress_by_cycle`
    - **Must mirror this Power BI DAX exactly** (average of per-mentee capped ratios):

```dax
AVERAGEX(
    individual_mentee_curriculum_progress_inspection,
    DIVIDE(
        MIN(cme_count, 13) +
        MIN(drill_count, 5) +
        MIN(skill_demos_count, 20) +
        MIN(return_demos_count, 20) +
        MIN(skill_eval_count, 20) +
        IF(average_score >= 0.85, 1, 0) +
        MIN(labor_monitoring_count, 1),
        13 + 5 + 20 + 20 + 20 + 1 + 1,
        0
    )
)
```

Use project vars for the caps; denominator = 80 by default.

### Metrics — newborn cohort coverage
51. `metric_newborn_curriculum_completion_by_cycle`
52. `metric_newborn_cme_coverage_by_cycle`
53. `metric_newborn_drill_coverage_by_cycle`
54. `metric_newborn_practicum_coverage_by_cycle`
55. `metric_newborn_skill_demo_coverage_by_cycle`
56. `metric_newborn_video_coverage_by_cycle`
57. `metric_newborn_roleplay_coverage_by_cycle`
58. `metric_newborn_case_scenario_coverage_by_cycle`
59. `metric_newborn_group_discussions_coverage_by_cycle`
60. `metric_newborn_nnr_assessment_coverage_by_cycle`

### Metrics — newborn individual progress counts
61. `metric_newborn_cme_progress_count_by_cycle`
62. `metric_newborn_drill_progress_count_by_cycle`
63. `metric_newborn_practicum_progress_count_by_cycle`
64. `metric_newborn_skill_demo_progress_count_by_cycle`
65. `metric_newborn_video_progress_count_by_cycle`
66. `metric_newborn_roleplay_progress_count_by_cycle`
67. `metric_newborn_case_scenario_progress_count_by_cycle`
68. `metric_newborn_group_discussions_progress_count_by_cycle`
69. `metric_newborn_nnr_assessment_progress_count_by_cycle`
70. `metric_individual_mentee_newborn_curriculum_progress_by_cycle`
    - Average of per-mentee×cycle capped ratios using newborn req vars
    - Practicum cap depends on program (20 essential / 22 comprehensive; default essential if unknown)
    - Include NNR completion flag (0/1) in numerator; +1 in denominator

### Metrics — monthly sessions conducted
Session = `countDistinct(submission_id)` in calendar month (`toStartOfMonth`).
Also expose `mentees_reached`, `facilities_reached` where useful.

**EmONC**
71. `metric_emonc_cme_sessions_conducted_monthly`
72. `metric_emonc_drill_sessions_conducted_monthly`
73. `metric_emonc_skill_demo_sessions_conducted_monthly`
74. `metric_emonc_return_demo_sessions_conducted_monthly`
75. `metric_emonc_labor_monitoring_sessions_conducted_monthly`
76. `metric_emonc_skill_eval_sessions_conducted_monthly`

**Newborn**
77. `metric_newborn_cme_sessions_conducted_monthly`
78. `metric_newborn_drill_sessions_conducted_monthly`
79. `metric_newborn_practicum_sessions_conducted_monthly`
80. `metric_newborn_skill_demo_sessions_conducted_monthly`
81. `metric_newborn_video_sessions_conducted_monthly`
82. `metric_newborn_roleplay_sessions_conducted_monthly`
83. `metric_newborn_case_scenario_sessions_conducted_monthly`
84. `metric_newborn_group_discussions_sessions_conducted_monthly`
85. `metric_newborn_nnr_assessment_sessions_conducted_monthly`

---

## YAML / tests / docs requirements
- Add `_stg_models.yml`, `_int_models.yml`, `_marts_models.yml`, `_metrics_models.yml`
  with descriptions and key uniqueness / not_null / accepted_values tests.
- Singular tests:
  - completed EmONC/newborn cycles must have non-null `date_completed`
  - mart uniqueness on (mentee_id, cycle_id) where applicable
- Keep a modelling plan doc (e.g. `dbt_modelling` or `docs/MODELLING.md`) summarizing
  grains, cohorts, and metric definitions.
- Comment non-obvious business rules in SQL (Partograph exclusion, practicum
  preference, DAX mirror formula, session vs topic distinction).

## Implementation order
1. macros + sources + seeds
2. staging (sheets → kobo stubs → processed)
3. `int_mentee_database` + cohorts
4. EmONC intermediate → marts → metrics
5. Newborn intermediate → marts → metrics
6. monthly session intermediates → metrics
7. `dbt parse` (and `dbt seed` + selective `dbt run` if ClickHouse is available)

## Acceptance criteria
- All models listed above exist with the exact names
- `dbt parse` succeeds
- Every metric name ends with `_by_cycle` or `_monthly` as specified
- EmONC individual composite metric matches the DAX formula
- Partograph excluded from EmONC skill evaluations everywhere relevant
- Header comments present on every model
- No secrets committed; profiles via example/env only

## Out of scope for this pass
- Full Kobo JSON explode transformers (leave processed models seed-backed / stubbed
  with clear TODOs to wire explode intermediates later)
- QuIPS / DELTA / mentors / facility prioritization marts (staging stubs only)
- Changing live production Redshift SQL artifacts outside this dbt project

When done, list every model created (one name per line, grouped by layer) and note
any assumptions you had to make.

## End of prompt
