# Mentors Warehouse — setup sequence (real ClickHouse account)

**Dedicated repo (preferred):** https://github.com/kakaijacob/mentors_warehouse  
**Scaffold also in:** `Special-Operations-Schema/mentors_warehouse_dbt/`

| Setting | Value |
|---------|--------|
| dbt profile name | `mentors_warehouse` |
| ClickHouse database | `mentors_warehouse` |

---

## 0. Put the project into `mentors_warehouse` (one-time)

If that GitHub repo is still empty:

```bash
cd ~/projects
git clone https://github.com/kakaijacob/Special-Operations-Schema.git
cd Special-Operations-Schema
git fetch origin && git checkout cursor/mentors-warehouse-scaffold-bea8

cd ~/projects
git clone https://github.com/kakaijacob/mentors_warehouse.git
cd mentors_warehouse
cp -a ~/projects/Special-Operations-Schema/mentors_warehouse_dbt/. .

git add -A
git commit -m "Scaffold mentors_warehouse dbt project"
git branch -M main
git push -u origin main
```

---

## 1. ClickHouse database

```sql
CREATE DATABASE IF NOT EXISTS mentors_warehouse;
SHOW DATABASES;
```

Collect from **Connect**: host (no `https://`), port `8443`, user, password.  
Allow your laptop IP under Settings → IP access list.

---

## 2. Install dbt

```bash
python -m pip install --upgrade pip
python -m pip install dbt-core dbt-clickhouse
dbt --version
```

---

## 3. Profile (`~/.dbt/profiles.yml`)

```bash
mkdir -p ~/.dbt
nano ~/.dbt/profiles.yml
```

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

---

## 4. Debug

```bash
cd ~/projects/mentors_warehouse
dbt debug
dbt ls
```

Expect IDE folders: `models/staging`, `models/intermediate`, `models/marts`.

---

## 5. Later

1. Fill `models/staging/_sources.yml`
2. Add `stg_` → `int_` → mart SQL
3. `dbt run && dbt test`
