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

**Goal:** Load classic **Jaffle Shop** raw CSVs (`customers`, `orders`, `payments`) into ClickHouse with Airbyte, so dbt can transform them next.

Airbyte does **not** ship a built-in “Jaffle Shop” connector. We use three **File (HTTPS)** sources pointing at the public dbt Labs CSVs, and one **ClickHouse** destination.

Prepared on your warehouse already:

- Database `raw` (Airbyte landing zone)
- Database `jaffle_shop` (optional later for dbt models)

---

### What you will build

```text
GitHub CSV (HTTPS)
   └─ Airbyte File source × 3  (customers / orders / payments)
         └─ Airbyte connection × 3
               └─ ClickHouse destination → database `raw`
                     └─ tables: raw_customers, raw_orders, raw_payments
```

Public source files (classic jaffle shop):

| Stream / dataset name | URL |
|-----------------------|-----|
| `raw_customers` | https://raw.githubusercontent.com/dbt-labs/jaffle-shop-classic/refs/heads/main/seeds/raw_customers.csv |
| `raw_orders` | https://raw.githubusercontent.com/dbt-labs/jaffle-shop-classic/refs/heads/main/seeds/raw_orders.csv |
| `raw_payments` | https://raw.githubusercontent.com/dbt-labs/jaffle-shop-classic/refs/heads/main/seeds/raw_payments.csv |

---

### Step 0 — Create an Airbyte account (do this first)

**Recommended for learning:** [Airbyte Cloud](https://cloud.airbyte.com/signup)

1. Open **https://cloud.airbyte.com/signup**
2. Sign up (email / Google / GitHub — whatever the page offers)
3. Create a workspace, e.g. `new-stack-tutor`
4. Stay on the free trial / starter credits while learning

**Alternative:** self-host with Docker (`git clone` Airbyte + `./run-ab-platform.sh`) if you prefer local. Cloud is faster for this tutorial.

Official ClickHouse destination docs: [docs.airbyte.com/integrations/destinations/clickhouse](https://docs.airbyte.com/integrations/destinations/clickhouse)

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

### Step 4 — Add three File sources (Jaffle Shop CSVs)

Airbyte’s File connector loads **one file per source**. Create three sources the same way.

#### 4a — Customers

1. **Sources** → **+ New source** → **File (CSV, JSON, Excel, Feather, Parquet)**
2. Settings:

| Field | Value |
|-------|--------|
| **Source name** | `Jaffle raw_customers` |
| **Dataset Name** | `raw_customers` |
| **File Format** | `csv` |
| **Storage Provider** | `HTTPS: Public Web` |
| **URL** | `https://raw.githubusercontent.com/dbt-labs/jaffle-shop-classic/refs/heads/main/seeds/raw_customers.csv` |
| **Reader Options** | leave blank (or `{}`) |

3. **Set up source** and confirm the test passes.

#### 4b — Orders

Same as above, but:

| Field | Value |
|-------|--------|
| **Source name** | `Jaffle raw_orders` |
| **Dataset Name** | `raw_orders` |
| **URL** | `https://raw.githubusercontent.com/dbt-labs/jaffle-shop-classic/refs/heads/main/seeds/raw_orders.csv` |

#### 4c — Payments

| Field | Value |
|-------|--------|
| **Source name** | `Jaffle raw_payments` |
| **Dataset Name** | `raw_payments` |
| **URL** | `https://raw.githubusercontent.com/dbt-labs/jaffle-shop-classic/refs/heads/main/seeds/raw_payments.csv` |

---

### Step 5 — Create connections and sync

Do this three times (one connection per source → same ClickHouse destination).

1. **Connections** → **+ New connection**
2. Source: `Jaffle raw_customers` (then later orders / payments)
3. Destination: `ClickHouse Jaffle`
4. Connection settings:

| Setting | Recommended |
|---------|-------------|
| **Replication frequency** | `Manual` (while learning) |
| **Destination Namespace** | Destination default (`raw`) — or Custom = `raw` |
| **Stream** | enable `raw_customers` / `raw_orders` / `raw_payments` |
| **Sync mode** | `Full refresh \| Overwrite` |

5. Save the connection
6. Click **Sync now**
7. Wait until status is **Succeeded**
8. Repeat for orders and payments

---

### Step 6 — Verify data landed in ClickHouse

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

Exact names may include Airbyte prefixes depending on connector version / namespace settings. If you do not see `raw.raw_customers`, run:

```sql
SHOW TABLES FROM raw;
SHOW DATABASES;
```

and note the actual table names Airbyte created (sometimes under a namespace database). Use those names in dbt sources later.

---

### Step 7 — Part 2 checklist

- [ ] Airbyte Cloud workspace created
- [ ] ClickHouse IP access allows Airbyte (or “anywhere” temporarily)
- [ ] `airbyte_user` created with grants on `raw`
- [ ] ClickHouse destination tested successfully
- [ ] Three File sources for jaffle CSVs created
- [ ] Three connections synced successfully
- [ ] Row counts visible in `raw.*` tables

---

### Troubleshooting (common)

| Symptom | Fix |
|---------|-----|
| Destination test fails / timeout | Open ClickHouse IP allow list; confirm host has **no** `https://` prefix; port `8443` |
| `Failed to insert expected rows` | `ALTER USER airbyte_user SETTINGS async_insert = 0;` |
| Permission denied | Re-run the `GRANT` statements on database `raw` |
| File source test fails | Open the CSV URL in a browser; must be publicly readable |
| Tables missing in `raw` | Check connection namespace; `SHOW DATABASES` / `SHOW TABLES FROM raw` |

---

## Part 3 — dbt (coming next)

After the three raw tables are in ClickHouse, we will:

1. Install dbt + `dbt-clickhouse`
2. Point `profiles.yml` at your Azure service
3. Declare sources on `raw.raw_customers` / `raw_orders` / `raw_payments`
4. Build staging + marts (`stg_*`, `dim_customers`, `fct_orders`)

---

## How to use this tutor

1. ~~Part 1 — ClickHouse~~ done
2. **Do Part 2 now:** Airbyte signup → destination → 3 file sources → sync jaffle CSVs
3. Reply with sync success (or paste errors / `SHOW TABLES FROM raw` output) and we will add **Part 3 — dbt**

Warehouse ✓ → **pipelines (this section)** → models next.
