# Mentors Warehouse

dbt project for the **real** mentors analytics warehouse on ClickHouse.

- Preferred repo: https://github.com/kakaijacob/mentors_warehouse  
- Profile: `mentors_warehouse`  
- Database: `mentors_warehouse`  

**Full setup:** [SETUP.md](./SETUP.md) (also `Mentors_Warehouse_Setup.md` in the monorepo).

## Layout

```text
models/
  staging/         # stg_* — clean sources (pending)
  intermediate/    # int_* — joins / summaries (pending)
  marts/           # business tables (pending)
macros/
seeds/
tests/
snapshots/
profiles.yml.example
dbt_project.yml
```

## Quick start

```bash
cd ~/projects/mentors_warehouse
# copy profiles.yml.example → ~/.dbt/profiles.yml (password via env_var)
cp secrets.env.example ~/.config/mentors_warehouse.env   # fill real secrets
source ~/.config/mentors_warehouse.env
dbt debug
```
