# Special Operations Analytics

This repository contains Kobo transformations and a dbt project for building
PostgreSQL analytics models from source-aligned staging models through marts.

## dbt model layers

- `models/staging`: source declarations, renaming, type casting, and basic cleanup
- `models/intermediate`: reusable business transformations
- `models/marts`: analytics-ready facts, dimensions, and reporting aggregates

The first model chain is:

```text
mentors.moh_skills_checklist
  -> stg_mentors__moh_skills_checklist
  -> int_skill_assessment_submissions
  -> mart_skill_assessment_summary
```

## PostgreSQL configuration

Set these variables as Cursor environment secrets:

```bash
DBT_HOST=database-host
DBT_PORT=5432
DBT_USER=database-user
DBT_PASSWORD=database-password
DBT_DATABASE=database-name
DBT_SCHEMA=dbt_dev
DBT_SOURCE_SCHEMA=mentors
DBT_SSLMODE=require
```

`DBT_TARGET` and `DBT_THREADS` are optional and default to `dev` and `4`.
The committed `profiles.yml` only references environment variables; it contains
no database credentials.

## Development commands

```bash
dbt debug --profiles-dir .
dbt build --profiles-dir .
dbt docs generate --profiles-dir .
dbt docs serve --profiles-dir .
```

To build only the initial mart and all of its upstream dependencies:

```bash
dbt build --profiles-dir . --select +mart_skill_assessment_summary
```
