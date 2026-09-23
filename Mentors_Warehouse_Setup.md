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

## 4. Profile + secrets (passwords as secrets, not plaintext)

### 4a. `~/.dbt/profiles.yml` — password via `env_var`

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
      host: "{{ env_var('MENTORS_CLICKHOUSE_HOST', 'REPLACE_ME_CLICKHOUSE_HOST') }}"
      port: 8443
      user: "{{ env_var('MENTORS_CLICKHOUSE_USER', 'default') }}"
      # SECRET — never paste the real password into this file
      password: "{{ env_var('MENTORS_CLICKHOUSE_PASSWORD') }}"
      schema: mentors_warehouse
      secure: true
      verify: true
      threads: 4
```

Template: `profiles.yml.example` in the project.

### 4b. Keep secrets in a local env file (outside the repo)

```bash
mkdir -p ~/.config
cp secrets.env.example ~/.config/mentors_warehouse.env
nano ~/.config/mentors_warehouse.env
```

```bash
export MENTORS_CLICKHOUSE_PASSWORD='your_real_secret_password'
export MENTORS_CLICKHOUSE_HOST='xxxx.region.azure.clickhouse.cloud'
export MENTORS_CLICKHOUSE_USER='default'
```

```bash
source ~/.config/mentors_warehouse.env
```

Never commit that env file. Optional: add the `source` line to `~/.bashrc`.

You may keep older profiles (`jaffle_clickhouse`, `special_operations`) in the same `profiles.yml`, each with its own `env_var('…_PASSWORD')`.

---

## 5. Test

```bash
source ~/.config/mentors_warehouse.env
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
- [ ] `~/.dbt/profiles.yml` uses `env_var('MENTORS_CLICKHOUSE_PASSWORD')` (no plaintext password)
- [ ] Secrets loaded via `source ~/.config/mentors_warehouse.env`
- [ ] `dbt debug` OK
- [ ] IDE shows `staging` / `intermediate` / `marts`
