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

## 3. Profile + secrets (no plaintext passwords)

### 3a. profiles.yml — password via `env_var` (secret)

```bash
mkdir -p ~/.dbt
nano ~/.dbt/profiles.yml
```

Paste from `profiles.yml.example` (important lines):

```yaml
mentors_warehouse:
  target: dev
  outputs:
    dev:
      type: clickhouse
      host: "{{ env_var('MENTORS_CLICKHOUSE_HOST', 'REPLACE_ME_CLICKHOUSE_HOST') }}"
      port: 8443
      user: "{{ env_var('MENTORS_CLICKHOUSE_USER', 'default') }}"
      # SECRET — never paste the real password here
      password: "{{ env_var('MENTORS_CLICKHOUSE_PASSWORD') }}"
      schema: mentors_warehouse
      secure: true
      verify: true
      threads: 4
```

### 3b. Store secrets outside git

```bash
mkdir -p ~/.config
cp secrets.env.example ~/.config/mentors_warehouse.env
nano ~/.config/mentors_warehouse.env
```

Fill real values (this file stays on your machine only):

```bash
export MENTORS_CLICKHOUSE_PASSWORD='your_real_secret_password'
export MENTORS_CLICKHOUSE_HOST='xxxx.region.azure.clickhouse.cloud'
export MENTORS_CLICKHOUSE_USER='default'
```

Load secrets in every terminal before dbt:

```bash
source ~/.config/mentors_warehouse.env
```

Optional: add that `source` line to `~/.bashrc` so it loads automatically.

---

## 4. Debug

```bash
source ~/.config/mentors_warehouse.env
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
