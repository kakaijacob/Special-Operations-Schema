# Mentee Database Algo

Documentation for the Google Apps Script that cleans, derives, and validates rows on the **Mentees** sheet.

| Item | Detail |
|------|--------|
| Entry point | `updateAllStatusesByName()` |
| Primary script | `Mentee_Database_Algo.js` |
| Secrets helper | `Mentee_Database_Secrets.js` |
| Target sheet | `Mentees` (active spreadsheet) |
| External lookup | Master facilities workbook (DHIS codes) |
| Header / comment rows | Row 1 = headers, row 2 = column comments; data starts at row 3 |

---

## Purpose

On each run the algo:

1. Ensures the `pseudo_code` privacy column exists (after `Name`).
2. Loads the master facilities list for code/name checks.
3. Derives **Status**, **Learning Mode**, and **pseudo_code** for every mentee row.
4. Validates required fields, dates, IDs, phones, facilities, and program rules.
5. Marks invalid cells with a pink background and a note explaining each error.
6. Logs a run summary (eligible/ineligible counts, validation totals, pseudo fill rates).

It does **not** delete rows, invent mentee identity fields, or write secrets into the sheet.

---

## Inputs and secrets

### Active spreadsheet — sheet `Mentees`

| Role | Columns used |
|------|----------------|
| Identity | `Name`, `Mentee ID`, `pseudo_code` |
| Lifecycle | `Date Activated`, `Date Reactivated`, `Date Deactivated`, `Status`, `Reason for Deactivation` |
| Placement | `County`, `Facility Code`, `Facility`, `Cadre`, `Gender`, `New or Existing?` |
| Program | `Program`, in-person / DELTA curriculum flags (see below) |
| Contact | `whatsapp_phone_numbers` |
| Derived write targets | `Status`, `Learning Mode`, `pseudo_code` |

Curriculum / modality columns referenced by the algo:

- In-person: `EmONC In-person`, `Essential Newborn In-person`, `Comprehensive Newborn In-person`
- DELTA / virtual: `EmONC DELTA`, `Essential Newborn DELTA`, `Continuum of Care`
- Also treated as required when the row has any data: `Safe Surgery`, `OPOCUS`

### Script Properties (`Mentee_Database_Secrets.js`)

| Property | Required | Use |
|----------|----------|-----|
| `MASTER_FACILITIES_SHEET_ID` | Yes | Spreadsheet ID of the DHIS master facilities list |

Setup helpers (never commit real IDs into `.js` files):

- `promptSetMasterFacilitiesSheetId()` — UI prompt → Script Properties
- `listMenteeSecrets()` — logs masked values only
- `requireMenteeDatabaseSecrets_()` — aborts early if required secrets are missing

Log masking shows only the first/last 4 characters of spreadsheet IDs.

### Master facilities workbook

- Opens by ID; uses the **first sheet**.
- Required headers (case-insensitive): `dhis code`, `facility`.
- Builds two lookups:
  - **code → canonical facility name**
  - **normalized facility name → list of `{ code, facility }`**

---

## Sheet layout assumptions

```
Row 1  Headers
Row 2  Comment / guidance text per column
Row 3… Mentee data (processed)
```

`pseudo_code` is expected **immediately after** `Name`. If missing, the algo inserts it there. If a legacy header `Pseudo` exists, it is renamed in place to `pseudo_code` (data kept, no duplicate column).

Abort conditions before the main loop:

- Sheet `Mentees` not found
- `Name` column missing
- `pseudo_code` column cannot be created or found
- No data rows (`lastRow` ≤ comment row)
- Required secrets missing
- Master sheet missing `dhis code` / `facility` headers (throws)

---

## End-to-end pipeline

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Load secrets + open Mentees                              │
│ 2. ensurePseudoColumnAfterName_ (insert / migrate header)   │
│ 3. Resolve column indexes from headers                      │
│ 4. Read all data rows (row 3 → last row)                    │
│ 5. Load master facilities → masterByCode / masterByNormName │
│ 6. Build intra-sheet facility → codes map                   │
│ 7. Clear prior validation backgrounds + notes              │
│ 8. Per-row: Status → pseudo_code → Learning Mode → validate │
│ 9. Batch-write pseudo_code column                           │
│ 10. Log summary counts                                      │
└─────────────────────────────────────────────────────────────┘
```

### Step detail

| Step | What happens |
|------|----------------|
| Secrets | `requireMenteeDatabaseSecrets_()` then `getMasterFacilitiesSheetId_()` |
| Column ensure | Insert `pseudo_code` after `Name`, or rename legacy `Pseudo` |
| Normalization helpers | Defined for facility names and numeric-looking codes (see below) |
| Master load | Skip blank code/name pairs; warn if master sheet looks empty |
| Intra-sheet map | For rows with both Facility + Facility Code, group codes by normalized facility name |
| Clear formatting | Entire data block: background → default, notes cleared |
| Main loop | One pass per mentee row; Status & Learning Mode written per cell; pseudo collected for batch write |
| Batch pseudo write | Single `setValues` for the whole `pseudo_code` column |

---

## Normalization rules

### Facility name — `normalizeFacility(name)`

1. Stringify (blank → `""`)
2. Lowercase
3. Strip `' " . - _`
4. Collapse all whitespace
5. Trim

Used so `"St. Mary's"` and `"st marys"` compare equal against the master list and across mentee rows.

### Facility / ID codes — `normalizeCode(code)`

1. Stringify
2. Strip trailing `.0` (Sheets number artifact)
3. Trim

### Master header match — `findHeaderIndex`

Case-insensitive, trimmed equality (e.g. `DHIS Code` matches `dhis code`).

---

## Derived fields

### Status

Written every run from activation dates (priority order):

| Condition | Status |
|-----------|--------|
| `Date Reactivated` present | **Eligible** |
| else `Date Deactivated` present | **Ineligible** |
| else `Date Activated` present | **Eligible** |
| else (no activation dates) | **Ineligible** |

### Learning Mode

Only if the `Learning Mode` column exists. From Yes/No curriculum flags:

| In-person any Yes? | DELTA any Yes? (`EmONC DELTA` or `Essential Newborn DELTA`) | Learning Mode |
|--------------------|------------------------------------------------------------|---------------|
| Yes | Yes | `Hybrid (Both)` |
| Yes | No | `In-person Only` |
| No | Yes | `Virtually (DELTA)` |
| No | No | *(blank)* |

`Continuum of Care` is **not** part of Learning Mode derivation (it is used in program / required-field rules).

### `pseudo_code` (privacy display code)

Format: `{FacilityCode}-{XXXX}` where `XXXX` is the first 4 hex characters (uppercase) of:

```text
SHA-256( UTF-8( "{FacilityCode}|{MenteeID}" ) )
```

Rules:

- Generated only when **Mentee ID** is present.
- Facility Code is preferred; if missing/blank after normalize, falls back to `"0"` so a code can still be produced.
- Name is **never** hashed.
- Same Facility Code + Mentee ID → same `pseudo_code` (deterministic).
- One-way: cannot reverse `pseudo_code` to Mentee ID.
- Blank rows (no mentee identity) stay blank.
- Values are collected in memory and **batch-written** after the loop.

Example (illustrative IDs only):

```text
Input:  15996|712345678
Digest: fdc360e1…
Output: 15996-FDC3
```

Implementation: `privacyDisplayCode(facilityCode, menteeId)` (also shared with related pipeline scripts where needed).

---

## Validation catalog

How errors are shown:

- Invalid cell background: `#F4CCCC`
- Cell note: one message per line (multiple rules can flag the same cell)
- Prior run marks are cleared at the start of each run
- A started row = any cell in the row is non-empty / non-null

### 1. Required fields (started rows only)

Each of these must be non-blank if the header exists:

| Field |
|-------|
| Program |
| EmONC In-person |
| EmONC DELTA |
| Essential Newborn In-person |
| Essential Newborn DELTA |
| Comprehensive Newborn In-person |
| Continuum of Care |
| Safe Surgery |
| OPOCUS |
| Name |
| Mentee ID |
| County |
| Facility Code |
| Facility |
| Cadre |
| Gender |
| New or Existing? |
| Date Activated |

Message: `{Field} is required.`

### 2. Reason for Deactivation

| When | Rule |
|------|------|
| Status is `Ineligible` and reason blank | `Required if mentee is mapped as 'Ineligible'!` |

### 3. WhatsApp phone (Hybrid)

| When | Rule |
|------|------|
| Learning Mode is `Hybrid (Both)` and `whatsapp_phone_numbers` blank | `Required if Learning Mode is Hybrid.` |

### 4. `pseudo_code` generation

| When | Rule |
|------|------|
| Started row, `pseudo_code` column present, value could not be generated | `pseudo_code could not be generated. Mentee ID is required.` |

### 5. Date ordering

| Condition | Column flagged | Message |
|-----------|----------------|---------|
| Reactivated & Activated set, and Reactivated &lt; Activated | Date Reactivated | Cannot be earlier than Date Activated. |
| Deactivated & Activated set, and Deactivated &lt; Activated | Date Deactivated | Cannot be earlier than Date Activated. |
| Reactivated & Deactivated set, and Reactivated &lt; Deactivated | Date Reactivated | Cannot be earlier than Date Deactivated. |

### 6. Facility Code format

| Rule | Message |
|------|---------|
| Non-blank code must match `^\d{1,5}$` after normalize | Must be up to 5 digits. |

### 7. Mentee ID format

| Rule | Message |
|------|---------|
| Non-blank ID must match `^[17]\d{8}$` (9 digits, starts with 1 or 7) | Must be 9 digits starting with 1 or 7. |

### 8. WhatsApp phone format

Same pattern as Mentee ID when `whatsapp_phone_numbers` is non-blank:

| Rule | Message |
|------|---------|
| Must match `^[17]\d{8}$` | Must be 9 digits starting with 1 or 7. |

### 9. Facility consistency (intra-sheet)

Built before the loop: normalized facility name → set of codes seen in the mentee sheet.

| Rule | Message |
|------|---------|
| Same facility name maps to more than one distinct code in this sheet | Facility maps to multiple codes. |

### 10. Facility vs master list

**When Facility Code is a valid 1–5 digit string:**

| Situation | Column(s) | Message pattern |
|-----------|-----------|-----------------|
| Code not in master | Facility Code | Facility Code not found in master facilities list. |
| Code in master, name present, normalized names differ, mentee name matches other master row(s) | Facility + Facility Code | Name/code mismatch with master name and suggested matches |
| Code in master, name present, names differ, no master name match | Facility | Facility name has likely been misspelt! Expected "…" for code …. |

**When Facility Code is missing/unusable but Facility name is present:**

| Situation | Column | Message |
|-----------|--------|---------|
| Normalized name not in master | Facility | Facility name not found in master facilities list. |
| Name in master but code blank | Facility Code | Facility Code is missing. Possible master match: … |

### 11. Program logic

#### Program = `EmONC Curriculum`

| Rule | Column | Message |
|------|--------|---------|
| EmONC In-person is `No` | Program | EmONC must be Yes for EmONC Curriculum. |
| Essential Newborn In-person is `Yes` | Essential Newborn In-person | Program mismatch! … |
| Comprehensive Newborn In-person is `Yes` | Comprehensive Newborn In-person | Program mismatch! … |

#### Program = `Newborn Curriculum`

| Rule | Column | Message |
|------|--------|---------|
| EmONC In-person is `Yes` | EmONC In-person | Program mismatch! … |
| Neither Essential nor Comprehensive Newborn In-person is `Yes` | Program | At least one newborn option must be Yes. |

#### Program = `Other`

| Rule | Column | Message |
|------|--------|---------|
| Any of EmONC / Essential / Comprehensive In-person is `Yes` | That column | Program mismatch! … |
| None of EmONC DELTA, Essential Newborn DELTA, Continuum of Care is `Yes` | All three DELTA columns | At least one DELTA must be Yes. |

#### Program = `Both`

| Rule | Column | Message |
|------|--------|---------|
| EmONC In-person is not `Yes`, **or** neither newborn in-person option is `Yes` | Program | For 'Both': EmONC must be Yes AND one newborn option must be Yes. |

---

## Error presentation and logging

Per invalid column on a row:

1. Background `#F4CCCC`
2. Note = joined messages (`\n`)
3. Logger line: row number, invalid column count, Status, Program

End-of-run log includes:

- Eligible / Ineligible counts
- `pseudo_code` filled count
- Rows with errors
- Total validation messages

If the batch pseudo write cannot run (column missing or length mismatch), an error is logged with `colPseudo`, value count, and `numRows`.

---

## Helper functions

| Function | Role |
|----------|------|
| `updateAllStatusesByName()` | Full pipeline entry point |
| `ensurePseudoColumnAfterName_(sheet, headerRow, commentRow)` | Ensure / migrate `pseudo_code` after `Name` |
| `privacyDisplayCode(facilityCode, menteeId)` | SHA-256-based privacy label |
| `requireMenteeDatabaseSecrets_()` | Fail if Script Properties incomplete |
| `getMasterFacilitiesSheetId_()` | Read master workbook ID |
| `maskMenteeSecret_(value, kind)` | Safe logging of IDs |
| `promptSetMasterFacilitiesSheetId()` | One-time operator setup |
| `listMenteeSecrets()` | Support / audit of secret presence |

---

## Operational checklist

1. Deploy `Mentee_Database_Algo.js` and `Mentee_Database_Secrets.js` in the same Apps Script project bound to the mentee workbook.
2. Run `promptSetMasterFacilitiesSheetId()` once (or set Script Properties manually).
3. Confirm sheet tab is named exactly `Mentees`, with headers on row 1 and comments on row 2.
4. Confirm master facilities first sheet has `dhis code` and `facility`.
5. Run `updateAllStatusesByName()` (menu, trigger, or editor).
6. Review pink cells + notes; fix source data; re-run until clean.
7. Use `pseudo_code` on shared dashboards; keep `Name` / `Mentee ID` out of public views.

---

## What this algo does not do

- Does not call Kobo or warehouse APIs (those are separate transformation scripts).
- Does not auto-correct facility spelling or codes (only flags and suggests).
- Does not overwrite mentee-entered identity fields other than derived `Status`, `Learning Mode`, and `pseudo_code`.
- Does not store the master facilities spreadsheet ID in source control.
