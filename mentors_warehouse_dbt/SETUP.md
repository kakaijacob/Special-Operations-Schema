# SETUP — jacaranda_mentors / warehouse_mentors_ke

## Naming (decided)

| Role | Name |
|------|------|
| GitHub repo | `mentors_warehouse` |
| dbt project `name` | `jacaranda_mentors` |
| Profile key | `warehouse_mentors_ke` |
| ClickHouse host | `tplb1fkekn.eu-west-2.aws.clickhouse.cloud` |
| Prod schema | `dbt_mentors_ke` |
| Dev schema default | `dev_wanyama` |
| Marts/metrics schema suffix (prod only) | `_gold` |

If you prefer different prod schema naming (e.g. `mentors_ke` instead of `dbt_mentors_ke`), say so — it is centralized in `macros/generate_schema_name.sql` and `secrets.env.example`.

---

## 1. ClickHouse (real account)

```sql
CREATE DATABASE IF NOT EXISTS dbt_mentors_ke;
CREATE DATABASE IF NOT EXISTS dbt_mentors_ke_gold;
CREATE DATABASE IF NOT EXISTS dbt_mentors_ke_snapshots;
CREATE DATABASE IF NOT EXISTS dev_wanyama;
SHOW DATABASES;
```

Allow your laptop IP: service → Settings → IP access list.

Collect from **Connect**: host (already known), user, password.

---

## 2. Install dbt

```bash
python -m pip install --upgrade pip
python -m pip install dbt-core dbt-clickhouse
dbt --version
```

---

## 3. Clone repo

```bash
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/kakaijacob/mentors_warehouse.git
cd mentors_warehouse
```

Open this folder in Cursor.

---

## 4. Secrets (passwords as env secrets — never plaintext in profiles)

```bash
mkdir -p ~/.config
cp secrets.env.example ~/.config/warehouse_mentors_ke.env
nano ~/.config/warehouse_mentors_ke.env
```

Set at least:

```bash
export DBT_HOST='tplb1fkekn.eu-west-2.aws.clickhouse.cloud'
export DBT_USER='default'
export DBT_PASSWORD='your_real_secret'
export DBT_USER_SCHEMA='dev_wanyama'
```

```bash
source ~/.config/warehouse_mentors_ke.env
```

Optional: add the `source` line to `~/.bashrc`.

---

## 5. Local profiles.yml

```bash
mkdir -p ~/.dbt
# Merge warehouse_mentors_ke from profiles.yml.example into ~/.dbt/profiles.yml
# (or copy if this is your only profile)
nano ~/.dbt/profiles.yml
```

Password line must be:

```yaml
password: "{{ env_var('DBT_PASSWORD') }}"
```

Repo root `profiles.yml` is for **CI** (`DBT_PROFILES_DIR=./`) — also env_var only.

---

## 6. Debug

```bash
source ~/.config/warehouse_mentors_ke.env
cd ~/projects/mentors_warehouse
dbt deps
dbt debug --target dev
dbt ls
```

Expect: `Connection test: [OK connection ok]`

---

## 7. Folders ready (no business models yet)

```text
models/staging/
models/intermediate/
models/marts/
models/metrics/
models/exports/
```

Add `stg_` / `int_` / mart SQL after Airbyte (or other) loads land; declare them in `models/staging/_sources.yml`.

---

## Checklist

- [ ] Databases created (`dbt_mentors_ke`, `dev_wanyama`, optional gold/snapshots)
- [ ] IP allowlisted
- [ ] Repo cloned / open in Cursor
- [ ] `~/.config/warehouse_mentors_ke.env` filled (secrets)
- [ ] `~/.dbt/profiles.yml` has `warehouse_mentors_ke` with `env_var` password
- [ ] `dbt deps` + `dbt debug --target dev` OK
