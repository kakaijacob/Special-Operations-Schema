# Planned model map (edit as sources land)

## Staging
| Model | Source | Status |
|-------|--------|--------|
| `stg_airbyte__mentees` | `airbyte.mentees` (`Mentees`) | Stubbed |
| `stg_airbyte__mentors` | TBD | Pending |
| `stg_airbyte__mentee_curriculum_tracking` | TBD | Pending |
| `stg_airbyte__skill_assessments` | TBD | Pending |

## Intermediate
| Model | Builds from | Status |
|-------|-------------|--------|
| `int_mentees` | `stg_airbyte__mentees` | Stubbed |

## Marts
| Model | Builds from | Status |
|-------|-------------|--------|
| `mentee_database` | `int_mentees` | Stubbed |

## Tomorrow after grants
1. `SHOW TABLES FROM default` (or raw DB) — confirm Airbyte names
2. Update `_sources.yml` identifiers
3. Replace `select *` stubs with real renames/casts
4. `dbt run --select +mentee_database`
