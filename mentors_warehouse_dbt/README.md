# Mentors Warehouse dbt project

Production analytics project for the mentors platform.  
ClickHouse database / default schema: **`mentors_warehouse`**.

Learning / Jaffle work stays in `jaffle_shop_dbt/`. This project is for **real account** work.

## Folder layout

```text
mentors_warehouse_dbt/
  models/
    staging/         # stg_*  — clean raw sources
    intermediate/    # int_*  — reusable joins / summaries
    marts/           # business-ready tables
  macros/
  seeds/
  tests/
  profiles.yml.example
  dbt_project.yml
```

Models are empty on purpose — add them after sources are connected.

---

## Step-by-step setup

### 1. Confirm ClickHouse database

In the **real** ClickHouse Cloud SQL console (new account / service):

```sql
CREATE DATABASE IF NOT EXISTS mentors_warehouse;
SHOW DATABASES;
```

You said this already exists — confirm with `SHOW DATABASES`.

Optional (if you use custom schemas from `dbt_project.yml`):

```sql
-- Only needed if your adapter creates mentors_warehouse_staging etc.
-- With +schema: staging/intermediate/marts, dbt-clickhouse typically creates:
--   mentors_warehouse_staging
--   mentors_warehouse_intermediate
--   mentors_warehouse_marts
-- OR uses generate_schema_name. Adjust if you prefer everything in mentors_warehouse only.
```

> If you want **all models in one database** `mentors_warehouse` (no `_staging` suffix), remove the `+schema:` lines under staging/intermediate/marts in `dbt_project.yml` (same pattern as the Jaffle tutor).

### 2. Collect connection details from ClickHouse Cloud

From the service → **Connect**:

| Placeholder | Where to get it |
|-------------|-----------------|
| `REPLACE_ME_CLICKHOUSE_HOST` | Host only, e.g. `xxxx.region.azure.clickhouse.cloud` (no `https://`) |
| Port | `8443` (HTTPS) |
| `REPLACE_ME_CLICKHOUSE_USER` | Usually `default` or a dedicated `dbt_user` |
| Password | Service password (store in env var, not git) |
| Schema / database | `mentors_warehouse` |

### 3. Allow your laptop IP

ClickHouse Cloud → service → **Settings** → **IP access list** → add your current public IP.

### 4. Install dbt + ClickHouse adapter (if needed)

```bash
python -m pip install --upgrade pip
python -m pip install dbt-core dbt-clickhouse
dbt --version
```

### 5. Create / update `~/.dbt/profiles.yml`

```bash
mkdir -p ~/.dbt
nano ~/.dbt/profiles.yml
```

Paste from `profiles.yml.example`, then replace placeholders:

```yaml
mentors_warehouse:
  target: dev
  outputs:
    dev:
      type: clickhouse
      host: REPLACE_ME_CLICKHOUSE_HOST
      port: 8443
      user: REPLACE_ME_CLICKHOUSE_USER
      password: "{{ env_var('CLICKHOUSE_PASSWORD') }}"
      schema: mentors_warehouse
      secure: true
      verify: true
      threads: 4
```

You can keep `jaffle_clickhouse` / `special_operations` in the **same** file as other profiles.

### 6. Set password in the shell

```bash
export CLICKHOUSE_PASSWORD='your_real_password_here'
```

### 7. Open the project and test

```bash
cd ~/projects/Special-Operations-Schema
git fetch origin
git checkout cursor/mentors-warehouse-scaffold-bea8
cd mentors_warehouse_dbt

dbt debug
```

Expect: `Connection test: [OK connection ok]`

### 8. List project (no models yet)

```bash
dbt ls
```

You should see the project resolve with empty/nearly empty model list until you add `.sql` files.

### 9. Later — add models

When Airbyte (or other loaders) land tables:

1. Declare them in `models/staging/_sources.yml`
2. Add `stg_*.sql` under `models/staging/`
3. Add `int_*.sql` under `models/intermediate/`
4. Add marts under `models/marts/`
5. `dbt run` / `dbt test`

---

## Placeholder checklist

- [ ] Real ClickHouse host filled in
- [ ] User filled in
- [ ] `CLICKHOUSE_PASSWORD` exported
- [ ] IP allowlisted
- [ ] `mentors_warehouse` database exists
- [ ] `dbt debug` OK
- [ ] Decide: single DB vs `+schema` sub-databases (staging/intermediate/marts)

---

## Profile name reminder

| Item | Value |
|------|--------|
| `dbt_project.yml` → `profile` | `mentors_warehouse` |
| `profiles.yml` top key | `mentors_warehouse` |
| Default database (`schema`) | `mentors_warehouse` |
