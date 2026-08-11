# Special Operations Analytics

This repository contains Kobo transformations and a dbt project for building
ClickHouse analytics models from staging through marts.

## dbt model layers

- `models/staging`: renaming, type casting, and basic cleanup
- `models/intermediate`: reusable business transformations
- `models/marts`: analytics-ready facts, dimensions, and reporting aggregates

The first model chain is:

```text
seeds/moh_skills_checklist_sample.csv   (sample data for practice)
  -> stg_mentors__moh_skills_checklist
  -> int_skill_assessment_submissions
  -> mart_skill_assessment_summary
```

The staging model currently reads the seed. When real assessment data is
ingested into ClickHouse, declare it as a dbt source and swap the `ref()` in
`stg_mentors__moh_skills_checklist` for a `source()`.

The EmONC curriculum-completion chain is:

```text
sample mentee, curriculum-tracking, and processed-skill seeds
  -> stg_mentors__mentee_database
  -> stg_mentors__mentee_curriculum_tracking
  -> stg_mentors__processed_skill_assessments
  -> int_emonc_cohorts / int_emonc_mentees
  -> int_emonc_mentee_cycles
  -> int_emonc_curriculum_activity_progress
  -> int_emonc_skill_evaluation_progress
  -> mart_emonc_curriculum_completion
```

This mart includes an empty progress row for every mentee/cohort combination.
It applies cohort-specific topic requirements, the 85% skill pass threshold,
and records the date on which the final curriculum requirement was reached.

The newborn curriculum-completion chain is:

```text
sample newborn tracking and NNR assessment seeds
  -> stg_mentors__newborn_curriculum_tracking
  -> stg_mentors__newborn_resuscitation_assessments
  -> int_newborn_cohorts / int_newborn_mentees
  -> int_newborn_mentee_cycles
  -> int_newborn_curriculum_activity_progress
  -> int_newborn_nnr_assessment_progress
  -> mart_newborn_curriculum_completion
```

Activity and program labels are normalized in staging. The mart applies
program-specific practicum requirements and treats the first NNR assessment as
baseline and the last assessment as endline; an endline score of at least 85%
is required for completion.

## Connection setup

dbt needs the ClickHouse adapter:

```bash
pip install dbt-core dbt-clickhouse
```

Copy `profiles.example.yml` to `~/.dbt/profiles.yml` and fill in your
ClickHouse host, user, password, and schema. The profile name must remain
`special_operations` to match `dbt_project.yml`. Never commit credentials.

## Development commands

Run from the repository root:

```bash
dbt debug          # verify connection
dbt build          # seeds + models + tests
dbt docs generate  # build documentation site
```

To build only the mart and everything upstream:

```bash
dbt build --select +mart_skill_assessment_summary
dbt build --select +mart_emonc_curriculum_completion
dbt build --select +mart_newborn_curriculum_completion
```
