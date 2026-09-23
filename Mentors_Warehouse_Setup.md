# Mentors Warehouse — setup sequence (real ClickHouse account)

Repo: https://github.com/kakaijacob/mentors_warehouse  
Profile name: `mentors_warehouse`  
ClickHouse database: `mentors_warehouse`

Run these steps in order on your laptop (WSL).

---

## 1. Create / confirm ClickHouse database

In the **real** ClickHouse Cloud SQL console:

```sql
CREATE DATABASE IF NOT EXISTS mentors_warehouse;
SHOW DATABASES;
```

From the service → **Connect**, copy:

| Detail | Example shape |
|--------|----------------|
| Host | `xxxx.region.azure.clickhouse.cloud` (no `https://`) |
| Port | `8443` |
| User | `default` (or dedicated user) |
| Password | (shown once / your vault) |

**Settings → Security → IP access list** → allow your laptop IP.

---

## 2. Install dbt

```bash
python -m pip install --upgrade pip
python -m pip install dbt-core dbt-clickhouse
dbt --version
```

---

## 3. Clone this repo

```bash
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/kakaijacob/mentors_warehouse.git
cd mentors_warehouse
ls models
# expect: staging  intermediate  marts
```

Open the folder in Cursor: **Open project** → `~/projects/mentors_warehouse`.

---

## 4. Create `~/.dbt/profiles.yml` (placeholders)

```bash
mkdir -p ~/.dbt
nano ~/.dbt/profiles.yml
```

Paste (replace every `REPLACE_ME_*`):

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

Same template lives in the repo as `profiles.yml.example`.

You may keep older profiles (`jaffle_clickhouse`, `special_operations`) in the **same** file.

---

## 5. Export password and test

```bash
export CLICKHOUSE_PASSWORD='REPLACE_ME_PASSWORD'

cd ~/projects/mentors_warehouse
dbt debug
```

Expect: `Connection test: [OK connection ok]`

```bash
dbt ls
```

Model folders are ready; no business `.sql` models yet.

---

## 6. What you should see in the IDE

```text
mentors_warehouse/
  models/
    staging/         # pending stg_*.sql
    intermediate/    # pending int_*.sql
    marts/           # pending marts
  macros/
  seeds/
  tests/
  dbt_project.yml
  profiles.yml.example
  SETUP.md
  README.md
```

---

## 7. Later — when Airbyte / raw tables exist

1. Edit `models/staging/_sources.yml` (declare raw tables)
2. Add `stg_*.sql` under `models/staging/`
3. Add `int_*.sql` under `models/intermediate/`
4. Add marts under `models/marts/`
5. Run:

```bash
dbt run
dbt test
```

---

## Checklist

- [ ] `mentors_warehouse` database exists in ClickHouse
- [ ] Host / user / password known
- [ ] Laptop IP allowlisted
- [ ] Repo cloned
- [ ] `~/.dbt/profiles.yml` profile `mentors_warehouse` filled in
- [ ] `CLICKHOUSE_PASSWORD` exported
- [ ] `dbt debug` OK
- [ ] IDE shows `staging` / `intermediate` / `marts`
