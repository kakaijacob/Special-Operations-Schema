# Mentors Warehouse — prepare real ClickHouse + dbt project
#
# Project path: mentors_warehouse_dbt/
# ClickHouse database: mentors_warehouse
# Profile name: mentors_warehouse

## Code sequence (run in order)

### A. ClickHouse (SQL console on the real account)

```sql
CREATE DATABASE IF NOT EXISTS mentors_warehouse;
SHOW DATABASES;
```

Collect from **Connect**:
- host (no https://)
- port `8443`
- user
- password

Allow your laptop IP under Settings → IP access list.

---

### B. Local machine — install

```bash
python -m pip install --upgrade pip
python -m pip install dbt-core dbt-clickhouse
dbt --version
```

---

### C. Profile (`~/.dbt/profiles.yml`)

```bash
mkdir -p ~/.dbt
nano ~/.dbt/profiles.yml
```

Use / merge this block (placeholders):

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

```bash
export CLICKHOUSE_PASSWORD='REPLACE_ME_PASSWORD'
```

Full template also in: `mentors_warehouse_dbt/profiles.yml.example`

---

### D. Pull project and debug

```bash
cd ~/projects/Special-Operations-Schema
git fetch origin
git checkout cursor/mentors-warehouse-scaffold-bea8
cd mentors_warehouse_dbt

dbt debug
dbt ls
```

Expect folders in the IDE:

```text
models/staging/
models/intermediate/
models/marts/
```

No business models yet — add `stg_` / `int_` / mart `.sql` files when ready.

---

### E. Later (when sources exist)

1. Edit `models/staging/_sources.yml`
2. Add staging → intermediate → mart SQL
3. `dbt run && dbt test`
