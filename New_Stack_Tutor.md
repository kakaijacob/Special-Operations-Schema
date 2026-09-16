# New Stack Tutor

Learn the modern analytics data stack from scratch:

**Airbyte → ClickHouse → dbt**

| Tool | Role in the stack |
|------|-------------------|
| **Airbyte** | Extract & load (EL) — move data from sources into ClickHouse |
| **ClickHouse** | Analytical warehouse — store and query large volumes fast |
| **dbt** | Transform (T) — model, test, and document data in the warehouse |

This guide walks you through each piece in order. Start here with ClickHouse, then continue to Airbyte and dbt in later sections.

---

## Part 1 — Free ClickHouse Cloud account + setup

ClickHouse Cloud does not offer an unlimited free forever plan. For learning, you use the **free trial**:

- **$300 in credits**
- **30 days** (whichever comes first: credits used up or 30 days)
- No credit card required to start the trial

That is more than enough for learning Airbyte + ClickHouse + dbt.

Official links:

- Sign up: [https://console.clickhouse.cloud/signUp](https://console.clickhouse.cloud/signUp)
- Cloud overview: [https://clickhouse.com/cloud](https://clickhouse.com/cloud)
- Quick start docs: [https://clickhouse.com/docs/get-started/setup/cloud](https://clickhouse.com/docs/get-started/setup/cloud)

---

### Step 1 — Create your ClickHouse Cloud account

1. Open **[https://console.clickhouse.cloud/signUp](https://console.clickhouse.cloud/signUp)**.
2. Choose how to sign up:
   - **Email + password**, or
   - **Google SSO**, or
   - **Microsoft SSO**, or
   - Cloud marketplace (AWS / GCP / Azure) if you prefer billing through them later
3. If you used email/password:
   - Check your inbox for a verification email
   - Click the link **within 24 hours**
4. Log in at [https://console.clickhouse.cloud](https://console.clickhouse.cloud).

You now have a ClickHouse Cloud **organization** (your account/workspace).

---

### Step 2 — Create your first service (the database cluster)

After login, the onboarding wizard asks you to create a service.

Fill it in like this for learning:

| Setting | Recommended for learning |
|---------|--------------------------|
| **Service name** | `new-stack-tutor` (or any clear name) |
| **Cloud provider** | AWS (simplest default) |
| **Region** | Closest to you (e.g. `eu-west-1`, `us-east-1`) |
| **Plan / tier** | Prefer **Basic** if offered — cheaper and enough for learning. Default may be **Scale** (larger/more expensive). You can change org tier later under **Plans**. |
| **Idle / auto-pause** | Leave **enabled** so the service sleeps when unused and saves credits |

Then click **Create service**.

Provisioning usually takes about **1–2 minutes**. Wait until the status is **Running**.

> **Tip:** Basic tier is fixed-size (single replica, ~8–12 GiB memory, up to 1 TB storage). Perfect for a learning sandbox. Scale is for production-style multi-replica workloads and burns credits faster.

---

### Step 3 — Save your credentials (do this immediately)

When the service is ready, ClickHouse shows connection details. The **password for the `default` user is shown only once** at creation. Copy and store it somewhere safe (password manager / private notes). Do **not** commit it to git.

You will need:

| Detail | Where / what it looks like |
|--------|----------------------------|
| **Host** | `xxxxx.<region>.<aws\|gcp\|azure>.clickhouse.cloud` |
| **HTTPS port** | `8443` |
| **Native (TCP) port** | `9440` |
| **Username** | `default` (unless you create another user) |
| **Password** | Generated at service creation |
| **Default database** | `default` |

If you lose the password later: open the service → reset / regenerate password for `default` (this invalidates the old one).

To find connection details again anytime:

1. Open your service in the Cloud console
2. Click **Connect** (left menu or service page)
3. Pick a client type from the dropdown (e.g. **Native**, **HTTPS**, JDBC, Python, etc.)
4. Copy the prefilled connection string / command

---

### Step 4 — Allow your IP (if required)

By default, some setups allow broad access; others prompt you to add IP filters.

1. Go to your service → **Settings** → **Network / IP Access List** (wording may vary)
2. Add your current public IP, **or** temporarily allow `0.0.0.0/0` for learning only
3. Save

> For a personal learning project, allowing your IP only is safer. If Airbyte Cloud or another SaaS needs to connect later, you will add that provider’s IPs (or use a broader allow list carefully).

---

### Step 5 — Run your first query in the SQL console

1. In the Cloud console, open your service
2. Open the **SQL console** (web query editor)
3. Run:

```sql
SELECT version();
```

You should get a ClickHouse version string back.

Then try:

```sql
SHOW DATABASES;
```

You should see at least:

- `default`
- `system`
- `INFORMATION_SCHEMA` / `information_schema`

---

### Step 6 — Create a practice database and table

Still in the SQL console:

```sql
CREATE DATABASE IF NOT EXISTS learning;

CREATE TABLE learning.first_events
(
    user_id    UInt32,
    event_name String,
    event_time DateTime,
    metric     Float32
)
ENGINE = MergeTree()
ORDER BY (user_id, event_time);
```

Insert a few rows:

```sql
INSERT INTO learning.first_events (user_id, event_name, event_time, metric) VALUES
    (101, 'signup', now(), 1.0),
    (102, 'login',  now() - INTERVAL 1 HOUR, 0.5),
    (101, 'purchase', now() - INTERVAL 10 MINUTE, 42.0);
```

Query them:

```sql
SELECT *
FROM learning.first_events
ORDER BY event_time;
```

If that returns rows, your warehouse is ready for Airbyte and dbt.

---

### Step 7 — Optional: connect from your laptop with the CLI

Install the ClickHouse CLI:

```bash
curl https://clickhouse.com/cli | sh
```

Connect with the native protocol (replace host and password):

```bash
clickhouse client \
  --host YOUR_HOST.REGION.aws.clickhouse.cloud \
  --secure \
  --port 9440 \
  --user default \
  --password 'YOUR_PASSWORD'
```

Or verify over HTTPS with curl:

```bash
curl --user 'default:YOUR_PASSWORD' \
  'https://YOUR_HOST.REGION.aws.clickhouse.cloud:8443/?query=SELECT%201'
```

Expected result: `1`

---

### Step 8 — Keep your trial credits alive

While you learn:

1. Leave **idle / auto-pause** on so compute stops when you are not querying
2. Prefer **Basic** over Scale for day-to-day practice
3. Stop the service manually when you will be away for days: service menu → **Stop**
4. Watch usage under **Billing / Credits** in the console
5. Do **not** load huge public datasets until you understand what burns credits (compute + storage + egress)

When the trial ends, you can add a payment method to continue, or delete the service if you are done.

---

### Step 9 — Checklist before moving on

You are ready for Airbyte when all of these are true:

- [ ] ClickHouse Cloud account created and email verified
- [ ] Service is **Running** (or you know how to start it)
- [ ] Host, ports (`8443` / `9440`), user, and password saved privately
- [ ] SQL console can run `SELECT 1` / `SELECT version()`
- [ ] Practice database `learning` exists with at least one table
- [ ] Idle/pause is enabled (or you know how to stop the service)

---

### Connection cheat sheet (for Airbyte + dbt later)

Save this template in a private notes file (not in git):

```text
CLICKHOUSE_HOST=xxxxx.region.aws.clickhouse.cloud
CLICKHOUSE_HTTPS_PORT=8443
CLICKHOUSE_NATIVE_PORT=9440
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=********
CLICKHOUSE_DATABASE=learning
CLICKHOUSE_SECURE=true
```

- **Airbyte** will usually connect over **HTTPS (8443)** to load raw tables
- **dbt** (`dbt-clickhouse`) will usually connect over **native TLS (9440)** or HTTP(S), depending on your profile config

---

### Your service (verified) — Part 1 complete

Status as of 2026-09-16: **connected and practice data loaded**.

| Field | Value |
|-------|--------|
| **Provider / region** | Azure · `germanywestcentral` |
| **Host** | `s88yqw81q8.germanywestcentral.azure.clickhouse.cloud` |
| **HTTPS port** | `8443` |
| **Native port** | `9440` |
| **User** | `default` |
| **Password** | *(keep private — never commit to git or paste in chat)* |
| **ClickHouse version** | `26.4.1.2359` |
| **Practice database** | `learning` |
| **Practice table** | `learning.first_events` (3 sample rows) |

How to read a JDBC URL like the one from the console:

```text
jdbc:clickhouse://HOST:8443?user=default&password=...&ssl=true
                 └─────┬────┘ └──┬──┘
                     host      HTTPS port
```

For tools that ask for separate fields (Airbyte, dbt), use:

- **Host:** `s88yqw81q8.germanywestcentral.azure.clickhouse.cloud`
- **Port:** `8443` (HTTPS) or `9440` (native)
- **SSL / secure:** enabled
- **Database:** `learning` (or `default` until you create more)

**Security:** If this password was shared in chat, email, or a ticket, **rotate it now** in the ClickHouse Cloud console (service → Connect / Users → reset `default` password). Update your private notes only. Do not put the new password in this repo.

Verify anytime in the SQL console:

```sql
SELECT * FROM learning.first_events ORDER BY event_time;
```

Checklist:

- [x] ClickHouse Cloud account created
- [x] Service running on Azure Germany West Central
- [x] Host / ports recorded (password stored privately)
- [x] `SELECT version()` works (`26.4.1.2359`)
- [x] Practice database `learning` + table `first_events` created
- [ ] Idle/pause confirmed in service Settings (do this if not already)

---

## Part 2 — Airbyte: Jaffle Shop → ClickHouse

**Goal:** Load classic **Jaffle Shop** raw data (`customers`, `orders`, `payments`) into ClickHouse with Airbyte, so dbt can transform them next.

Airbyte does **not** ship a built-in “Jaffle Shop” connector. Use either:

| Path | How | Best when |
|------|-----|-----------|
| **A — Google Sheets (recommended here)** | Download CSVs → import into one spreadsheet (3 tabs) → **one** Google Sheets source | You want an editable, familiar source |
| **B — File (HTTPS)** | Point Airbyte at the public GitHub CSV URLs (3 File sources) | You want zero Google setup |

Prepared on your warehouse already:

- Database `raw` (Airbyte landing zone)
- Database `jaffle_shop` (optional later for dbt models)

---

### What you will build (Path A — Google Sheets)

```text
Download 3 CSVs from GitHub
   └─ One Google Spreadsheet with 3 tabs
         (raw_customers / raw_orders / raw_payments)
         └─ Airbyte Google Sheets source × 1
               └─ Airbyte connection × 1
                     └─ ClickHouse destination → database `raw`
                           └─ tables for each sheet/stream
```

Download links (classic jaffle shop):

| Sheet / stream name | Download CSV |
|---------------------|--------------|
| `raw_customers` | [raw_customers.csv](https://raw.githubusercontent.com/dbt-labs/jaffle-shop-classic/refs/heads/main/seeds/raw_customers.csv) |
| `raw_orders` | [raw_orders.csv](https://raw.githubusercontent.com/dbt-labs/jaffle-shop-classic/refs/heads/main/seeds/raw_orders.csv) |
| `raw_payments` | [raw_payments.csv](https://raw.githubusercontent.com/dbt-labs/jaffle-shop-classic/refs/heads/main/seeds/raw_payments.csv) |

---

### Step 0 — Create an Airbyte account (do this first)

**Recommended for learning:** [Airbyte Cloud](https://cloud.airbyte.com/signup)

1. Open **https://cloud.airbyte.com/signup**
2. Sign up (email / Google / GitHub — whatever the page offers)
3. Create a workspace, e.g. `new-stack-tutor`
4. Stay on the free trial / starter credits while learning

**Alternative:** self-host with Docker (`git clone` Airbyte + `./run-ab-platform.sh`) if you prefer local. Cloud is faster for this tutorial.

Docs:

- ClickHouse destination: [docs.airbyte.com/integrations/destinations/clickhouse](https://docs.airbyte.com/integrations/destinations/clickhouse)
- Google Sheets source: [docs.airbyte.com/integrations/sources/google-sheets](https://docs.airbyte.com/integrations/sources/google-sheets)

---

### Step 1 — Open ClickHouse network access for Airbyte

Airbyte Cloud must reach your Azure ClickHouse service.

1. In **ClickHouse Cloud** → your service → **Settings** → **Security** → **IP access list**
2. Either:
   - Temporarily **Allow from anywhere** (ok for a short learning session), **or**
   - Add Airbyte Cloud egress IPs from [Airbyte IP allow list](https://docs.airbyte.com/platform/operating-airbyte/ip-allowlist) (default US residency uses the GCP us-west-3 / us-central-1 addresses listed there)
3. Save

If the destination “Test connection” fails later, IP allowlisting is the first thing to check.

---

### Step 2 — Create a dedicated ClickHouse user for Airbyte

In the **ClickHouse SQL console**, run (pick your own strong password — do not reuse the one pasted in chat):

```sql
CREATE USER IF NOT EXISTS airbyte_user IDENTIFIED BY 'REPLACE_WITH_A_STRONG_PASSWORD';

ALTER USER airbyte_user SETTINGS async_insert = 0;

-- Broad CREATE so Airbyte can make helper DBs/tables if needed
GRANT CREATE ON * TO airbyte_user;

-- Permissions on the landing database
GRANT CREATE DATABASE ON raw.* TO airbyte_user;
GRANT CREATE TABLE  ON raw.* TO airbyte_user;
GRANT DROP TABLE    ON raw.* TO airbyte_user;
GRANT ALTER         ON raw.* TO airbyte_user;
GRANT TRUNCATE      ON raw.* TO airbyte_user;
GRANT INSERT        ON raw.* TO airbyte_user;
GRANT SELECT        ON raw.* TO airbyte_user;
```

Store `airbyte_user` + password in your **private** notes only.

> You *can* use `default` for a quick test, but a dedicated user is the habit you want.

---

### Step 3 — Add ClickHouse as an Airbyte destination

1. In Airbyte → **Destinations** → **+ New destination**
2. Choose **ClickHouse**
3. Fill in:

| Field | Value |
|-------|--------|
| **Destination name** | `ClickHouse Jaffle` |
| **Host** | `s88yqw81q8.germanywestcentral.azure.clickhouse.cloud` |
| **Port** | `8443` |
| **Database** | `raw` |
| **Username** | `airbyte_user` (or `default`) |
| **Password** | *(your private password)* |
| **Enable JSON** | optional; leave default / on if offered |

4. Click **Set up destination** / **Test and save**
5. Wait for a successful test

On Airbyte Cloud, SSL/HTTPS is handled for you when you use port `8443`.

---

### Step 4 — Download CSVs and build one Google Sheet

#### 4a — Download the three files

1. Open each CSV link above in your browser
2. Save them locally as:
   - `raw_customers.csv`
   - `raw_orders.csv`
   - `raw_payments.csv`

#### 4b — Create the spreadsheet

1. Go to [sheets.google.com](https://sheets.google.com) → **Blank spreadsheet**
2. Name it `jaffle_shop_raw`
3. You need **three tabs** (sheets). Rename them exactly:
   - `raw_customers`
   - `raw_orders`
   - `raw_payments`

Airbyte treats **each tab name** as a stream name, so keep these names clean (letters, numbers, underscores).

#### 4c — Import each CSV into its tab

For each tab:

1. Open the tab (e.g. `raw_customers`)
2. **File → Import → Upload** → choose the matching CSV
3. Import location: **Replace current sheet** (or “Replace spreadsheet” only if you are careful not to wipe other tabs — prefer replace **current sheet**)
4. Separator type: **Detect automatically** / Comma
5. Convert text to numbers/dates: **Yes**
6. Repeat for `raw_orders` and `raw_payments`

#### 4d — Sheet hygiene (important)

- Row 1 must be headers (`id`, `first_name`, …)
- No blank header cells
- No extra title rows above the header
- Do not merge cells
- Prefer one header row only

#### 4e — Sharing

1. Click **Share** → **Copy link**
2. You will paste that link into Airbyte
3. With **OAuth (Airbyte Cloud)**: sign in as the Google user who can open the sheet — simplest path
4. With **Service Account** (optional / OSS): share the sheet with the service account `client_email` as **Viewer**

---

### Step 5 — Create the Google Sheets source in Airbyte

1. Airbyte → **Sources** → **+ New source** → **Google Sheets**
2. **Source name:** `Jaffle Shop Sheets`
3. **Spreadsheet Link:** paste the Google Sheets URL / share link
4. **Authentication (Airbyte Cloud):** choose **Authenticate via Google (OAuth)** → **Sign in with Google** → allow access
5. Leave name-conversion options off unless you know you need them
6. **Set up source** and wait for a successful test

You should see streams matching your tab names: `raw_customers`, `raw_orders`, `raw_payments`.

---

### Step 6 — Create one connection and sync

1. **Connections** → **+ New connection**
2. Source: `Jaffle Shop Sheets`
3. Destination: `ClickHouse Jaffle`
4. Connection settings:

| Setting | Recommended |
|---------|-------------|
| **Replication frequency** | `Manual` (while learning) |
| **Destination Namespace** | Destination default (`raw`) |
| **Streams** | enable `raw_customers`, `raw_orders`, `raw_payments` |
| **Sync mode** | `Full refresh \| Overwrite` for each |

5. Save → **Sync now**
6. Wait until status is **Succeeded**

One spreadsheet → one source → one connection is why Sheets is nicer than three File sources for this dataset.

---

### Step 7 — Verify data landed in ClickHouse

In the ClickHouse SQL console:

```sql
SHOW TABLES FROM raw;

SELECT count() AS n FROM raw.raw_customers;
SELECT count() AS n FROM raw.raw_orders;
SELECT count() AS n FROM raw.raw_payments;

SELECT * FROM raw.raw_customers LIMIT 5;
SELECT * FROM raw.raw_orders LIMIT 5;
SELECT * FROM raw.raw_payments LIMIT 5;
```

Classic seed sizes are roughly:

| Table | Approx rows |
|-------|-------------|
| `raw_customers` | ~100 |
| `raw_orders` | ~99 |
| `raw_payments` | ~113 |

Exact names may differ slightly by connector/namespace. If you do not see those tables:

```sql
SHOW TABLES FROM raw;
SHOW DATABASES;
```

Use whatever names Airbyte created when you set up dbt sources later.

---

### Step 8 — Part 2 checklist (Google Sheets path)

- [ ] Airbyte Cloud workspace created
- [ ] ClickHouse IP access allows Airbyte (or “anywhere” temporarily)
- [ ] `airbyte_user` created with grants on `raw`
- [ ] ClickHouse destination tested successfully
- [ ] CSVs / sheets imported and Google Sheets (or File) source tested
- [ ] Connection synced successfully
- [ ] Row counts visible in `raw.*` tables

---

### Your sync (verified) — Part 2 complete

Status as of 2026-09-16: **Airbyte → ClickHouse succeeded**.

You loaded the **modern Jaffle Shop** dataset (not the tiny classic `raw_payments` version):

| Table | Rows |
|-------|------|
| `raw.raw_customers` | 930 |
| `raw.raw_orders` | 63,148 |
| `raw.raw_items` | 90,183 |
| `raw.raw_products` | 10 |
| `raw.raw_stores` | 6 |
| `raw.raw_supplies` | 29 |

Airbyte metadata columns on each table: `_airbyte_raw_id`, `_airbyte_extracted_at`, `_airbyte_meta`, `_airbyte_generation_id`.

Checklist:

- [x] ClickHouse destination working
- [x] Jaffle raw tables present in database `raw`
- [x] Row counts verified

---

### Option B — File (HTTPS) sources instead of Sheets

Skip Steps 4–6 above and create **three** File sources instead (one CSV URL each):

| Source name | Dataset Name | URL |
|-------------|--------------|-----|
| `Jaffle raw_customers` | `raw_customers` | `https://raw.githubusercontent.com/dbt-labs/jaffle-shop-classic/refs/heads/main/seeds/raw_customers.csv` |
| `Jaffle raw_orders` | `raw_orders` | `https://raw.githubusercontent.com/dbt-labs/jaffle-shop-classic/refs/heads/main/seeds/raw_orders.csv` |
| `Jaffle raw_payments` | `raw_payments` | `https://raw.githubusercontent.com/dbt-labs/jaffle-shop-classic/refs/heads/main/seeds/raw_payments.csv` |

For each: Source type **File** → Format **csv** → Storage **HTTPS: Public Web** → then create **three** connections to the same ClickHouse destination (Manual / Full refresh Overwrite).

---

### Troubleshooting (common)

| Symptom | Fix |
|---------|-----|
| Destination test fails / timeout | Open ClickHouse IP allow list; host has **no** `https://` prefix; port `8443` |
| `Failed to insert expected rows` | `ALTER USER airbyte_user SETTINGS async_insert = 0;` |
| Permission denied | Re-run the `GRANT` statements on database `raw` |
| Google Sheets auth fails | Re-run OAuth as the sheet owner; or share sheet with service account email |
| Missing / wrong columns | Header must be row 1; re-import CSV; no merged cells |
| Stream names ugly | Rename tabs to `raw_customers` etc. before setting up the source |
| Tables missing in `raw` | Check connection namespace; `SHOW DATABASES` / `SHOW TABLES FROM raw` |

---

## Part 3 — dbt on ClickHouse (Jaffle Shop)

**Goal:** Transform `raw.*` into clean staging views and simple marts in database `jaffle_shop`.

A starter project lives in this repo at **`jaffle_shop_dbt/`**.

---

### Step 1 — Install dbt + ClickHouse adapter

On your machine (Python 3.9+ recommended):

```bash
python -m pip install --upgrade pip
python -m pip install dbt-core dbt-clickhouse
dbt --version
```

You should see `dbt-clickhouse` listed among plugins.

---

### Step 2 — Point your existing dbt profile at the new ClickHouse host

You already have a dbt profile (EmONC / `special_operations`). Do **not** create a brand-new file from scratch if `~/.dbt/profiles.yml` already exists — **edit the host** (and keep both profiles in one file).

#### 2a — Open your local profile

```bash
# macOS / Linux
open ~/.dbt/profiles.yml      # or: code ~/.dbt/profiles.yml
# Windows (PowerShell)
notepad $env:USERPROFILE\.dbt\profiles.yml
```

#### 2b — Change only what moved to the new service

| Field | Old (example) | New (this service) |
|-------|---------------|--------------------|
| **host** | `….eu-west-1.aws.clickhouse.cloud` (or whatever you had) | `s88yqw81q8.germanywestcentral.azure.clickhouse.cloud` |
| **port** | `8443` | `8443` (keep) |
| **secure** | `true` | `true` (keep) |
| **password** | old service password | **new** service password (or `{{ env_var('CLICKHOUSE_PASSWORD') }}`) |

Reference file in this repo: **`profiles.example.yml`** (includes `special_operations` + `jaffle_clickhouse`).

Minimal edit for your existing profile:

```yaml
special_operations:
  target: dev
  outputs:
    dev:
      type: clickhouse
      host: s88yqw81q8.germanywestcentral.azure.clickhouse.cloud   # <-- new hostname
      port: 8443
      user: default
      password: "{{ env_var('CLICKHOUSE_PASSWORD') }}"            # <-- new password
      schema: dbt_dev                                             # keep your old schema name if you prefer
      secure: true
      verify: true
      threads: 4
```

Add a second profile for the Jaffle tutor project (same host, different schema):

```yaml
jaffle_clickhouse:
  target: dev
  outputs:
    dev:
      type: clickhouse
      host: s88yqw81q8.germanywestcentral.azure.clickhouse.cloud
      port: 8443
      user: default
      password: "{{ env_var('CLICKHOUSE_PASSWORD') }}"
      schema: jaffle_shop
      secure: true
      verify: true
      threads: 4
```

Then in your shell:

```bash
export CLICKHOUSE_PASSWORD='your_private_password'
```

Also allow your **laptop IP** in ClickHouse Cloud (Settings → IP access list) — same list Airbyte uses.

> `dbt_project.yml` profile names:
> - EmONC project → `profile: special_operations`
> - Jaffle tutor (`jaffle_shop_dbt/`) → `profile: jaffle_clickhouse`
---

### Step 3 — Open the starter project and test the connection

```bash
cd jaffle_shop_dbt
dbt debug
```

Expect: `Connection test: [OK connection ok]`

If it fails:

- Wrong password / need to re-export `CLICKHOUSE_PASSWORD`
- IP not allowlisted
- Host mistyped (no `https://`, no port in host field)

---

### Step 4 — What the project builds

| Layer | Models | Purpose |
|-------|--------|---------|
| **Sources** | `ecom` → `raw.raw_*` | Point at Airbyte tables |
| **Staging** | `stg_customers`, `stg_orders`, `stg_order_items`, `stg_products`, `stg_locations`, `stg_supplies` | Rename, cast types, drop Airbyte meta cols |
| **Marts** | `customers`, `orders` | Simple analytics-ready tables |

Money fields in raw data are **integer cents stored as strings** (Airbyte typing). Staging casts them to numbers and converts to dollars.

---

### Step 5 — Run dbt

```bash
cd jaffle_shop_dbt
dbt run
dbt test
```

Then in ClickHouse SQL console:

```sql
SHOW TABLES FROM jaffle_shop;

SELECT * FROM jaffle_shop.stg_customers LIMIT 5;
SELECT * FROM jaffle_shop.customers LIMIT 5;
SELECT count() FROM jaffle_shop.orders;
```

---

### Step 6 — Part 3 checklist

- [x] `dbt-clickhouse` installed (verified in this environment)
- [x] `profiles.yml` connects (`dbt debug` OK)
- [x] `dbt run` built 6 staging views + 2 mart tables in `jaffle_shop`
- [x] `dbt test` — 16/16 passed
- [x] Sample mart query works (top spender: David Leonard, 122 orders)

On your laptop: copy `jaffle_shop_dbt/profiles.yml.example` → `~/.dbt/profiles.yml`, set `CLICKHOUSE_PASSWORD`, then `dbt run`.

---

## Stack status

| Layer | Status |
|-------|--------|
| ClickHouse Cloud (Azure DE) | Ready |
| Airbyte → `raw.*` Jaffle tables | Synced |
| dbt → `jaffle_shop` staging + marts | Built |

You now have the full loop: **extract/load (Airbyte) → warehouse (ClickHouse) → transform (dbt)**.
