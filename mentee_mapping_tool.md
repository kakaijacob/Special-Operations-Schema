# Mentee Mapping Tool (Kobo) — Conceptualization

Facility-led Kobo form for **maternity nurse incharges** to register mentees at their facilities and manage lifecycle: **activate**, **deactivate**, or **reactivate**.

This design is the facility-led “future state” of mentee mapping: incharges submit mentee details from the facility, and submissions feed (or mirror) the **Mentees** mapping database used by Kobo tool builders.

---

## 1. Purpose

| Item | Detail |
|------|--------|
| Actor | Facility maternity nurse incharge (or delegated maternity lead) |
| Scope | One facility per submission session (county → facility cascade) |
| Actions | Activate new mentee · Deactivate existing mentee · Reactivate previously deactivated mentee |
| Output | Rows shaped like the mentee mapping database (see §7) |
| Downstream | Status / Learning Mode / `pseudo_code` remain derivable by `Mentee_Database_Algo` rules |

---

## 2. Lifecycle model

```
                 ┌──────────────────┐
   Activate ───► │ Eligible         │ ◄── Reactivate
                 │ (mapped / active)│
                 └────────┬─────────┘
                          │ Deactivate
                          ▼
                 ┌──────────────────┐
                 │ Ineligible       │
                 │ (deactivated)    │
                 └──────────────────┘
```

| Action | What the incharge does | Dates written | Status after algo |
|--------|------------------------|---------------|-------------------|
| **Activate** | Capture identity, placement, program, curriculum flags | `Date Activated` | Eligible |
| **Deactivate** | Select mentee + reason | `Date Deactivated` + `Reason for Deactivation` | Ineligible |
| **Reactivate** | Select deactivated mentee; optionally refresh contact / program | `Date Reactivated` (clears effective inactivity) | Eligible |

Priority for derived **Status** (same as mentee database algo):

1. `Date Reactivated` present → **Eligible**
2. else `Date Deactivated` present → **Ineligible**
3. else `Date Activated` present → **Eligible**
4. else → **Ineligible**

---

## 3. Form flow (sections)

```
A. Intro + consent / role confirm
B. Facility context (County → Facility → Facility Code)
C. Mapping action (activate | deactivate | reactivate)
D. Action-specific mentee block
E. Review summary (calculate / note)
F. Submit
```

Only one mentee is processed per submission (keeps audits simple). Repeat the form for additional mentees.

---

## 4. Survey structure (XLSForm conceptualization)

Column headers follow standard Kobo survey sheets:  
`type | name | label | hint | required | constraint | constraint_message | relevant | calculation | appearance`

### A. Intro

| type | name | label | required |
|------|------|-------|----------|
| start | start | | |
| end | end | | |
| today | today | | |
| username | username | | |
| deviceid | deviceid | | |
| note | intro_note | Mentee Mapping Tool — for maternity nurse incharges. Use this form to activate, deactivate, or reactivate mentees at your facility. | |
| select_one yes_no | confirm_incharge | Are you the maternity nurse incharge (or designated maternity lead) for this facility? | true |

### B. Facility context

| type | name | label | required | relevant / notes |
|------|------|-------|----------|------------------|
| select_one counties | county | County | true | `confirm_incharge = 'yes'` |
| select_one facilities | facility | Facility | true | `choice_filter` on county |
| text | facility_code | Facility Code (DHIS) | true | Prefer `select_one` or calculate from facility; constraint `regex(., '^\d{1,5}$')` |
| note | facility_confirm | You are mapping mentees for: **${facility}** (${facility_code}), ${county} | | |

### C. Mapping action

| type | name | label | required |
|------|------|-------|----------|
| select_one mapping_action | mapping_action | What do you want to do? | true |

Choices (`mapping_action`):

| name | label |
|------|-------|
| activate | Activate a new mentee |
| deactivate | Deactivate an existing mentee |
| reactivate | Reactivate a deactivated mentee |

### D1. Activate — new mentee

Relevant when `mapping_action = 'activate'`.

| type | name | label | required | constraint / hint |
|------|------|-------|----------|-------------------|
| text | mentee_name | Name | true | Full name as on duty roster |
| text | mentee_id | Mentee ID | true | 9 digits starting with 1 or 7; usually the primary phone. Constraint: `regex(., '^[17]\d{8}$')` |
| text | phone_number_whatsapp | WhatsApp phone number | false* | Same format as Mentee ID when provided. *Required when Learning Mode is Hybrid (see §5). |
| select_one cadre | cadre | Cadre | true | |
| select_one gender | gender | Gender | true | |
| select_one new_existing | new_or_existing | New or Existing? | true | New to mentorship program vs previously known |
| date | date_activated | Date Activated | true | Default `${today}`; must be ≤ today |
| select_one program | program | Program | true | |
| begin_group | curriculum_flags | Curriculum / modality | | |
| select_one yes_no | emonc_inperson | EmONC In-person | true | |
| select_one yes_no | emonc_delta | EmONC DELTA | true | |
| select_one yes_no | essential_nb_inperson | Essential Newborn In-person | true | |
| select_one yes_no | essential_nb_delta | Essential Newborn DELTA | true | |
| select_one yes_no | comprehensive_nb_inperson | Comprehensive Newborn In-person | true | |
| select_one yes_no | continuum_of_care | Continuum of Care | true | |
| select_one yes_no | safe_surgery | Safe Surgery | true | |
| select_one yes_no | opocus | OPOCUS | true | |
| end_group | curriculum_flags | | | |
| calculate | learning_mode | Learning Mode | | Derived — see §5 |
| calculate | status | Status | | `Eligible` on activate |
| calculate | pseudo_code | Pseudo code | | Server/post-process preferred — see §5 |

**Program ↔ curriculum rules (mirror mentee database algo):**

| Program | Rule |
|---------|------|
| EmONC Curriculum | EmONC In-person = Yes; Essential / Comprehensive Newborn In-person must be No |
| Newborn Curriculum | EmONC In-person = No; at least one of Essential or Comprehensive Newborn In-person = Yes |
| Both | EmONC In-person = Yes **and** at least one newborn in-person = Yes |
| Other | All of EmONC / Essential / Comprehensive In-person = No |

### D2. Deactivate — existing mentee

Relevant when `mapping_action = 'deactivate'`.

| type | name | label | required | notes |
|------|------|-------|----------|-------|
| select_one facility_mentees | mentee_select | Select mentee | true | Choices filtered to this facility’s currently **Eligible** mentees |
| note | mentee_selected_note | Selected: ${mentee_select} | | |
| date | date_deactivated | Date Deactivated | true | ≥ Date Activated; ≤ today |
| select_one deactivation_reason | reason_for_deactivation | Reason for Deactivation | true | Required whenever status becomes Ineligible |
| text | reason_other | Specify other reason | true | relevant if reason = `other` |

### D3. Reactivate — previously deactivated mentee

Relevant when `mapping_action = 'reactivate'`.

| type | name | label | required | notes |
|------|------|-------|----------|-------|
| select_one facility_mentees_inactive | mentee_select_inactive | Select deactivated mentee | true | Filtered to this facility’s **Ineligible** mentees |
| date | date_reactivated | Date Reactivated | true | ≥ Date Deactivated; ≤ today |
| text | phone_number_whatsapp_update | WhatsApp phone number (update if changed) | false | Same ID format when provided |
| select_one yes_no | refresh_program | Update program / curriculum flags? | true | |
| *(same curriculum block as Activate)* | | | | relevant if `refresh_program = 'yes'` |

---

## 5. Derived fields

### Learning Mode

From Yes/No curriculum flags (Continuum of Care / Safe Surgery / OPOCUS do **not** drive Learning Mode):

| Any in-person* Yes? | Any DELTA** Yes? | Learning Mode |
|---------------------|------------------|---------------|
| Yes | Yes | Hybrid (Both) |
| Yes | No | In-person Only |
| No | Yes | Virtually (DELTA) |
| No | No | *(blank — flag for review)* |

\* EmONC In-person, Essential Newborn In-person, Comprehensive Newborn In-person  
\*\* EmONC DELTA, Essential Newborn DELTA

WhatsApp phone is **required** when Learning Mode = `Hybrid (Both)`.

### Status

Set by action (and re-derived by algo from dates):

| Action | Status |
|--------|--------|
| Activate | Eligible |
| Deactivate | Ineligible |
| Reactivate | Eligible |

### `pseudo_code`

Format: `{FacilityCode}-{XXXX}` where `XXXX` = first 4 hex chars (uppercase) of  
`SHA-256( UTF-8( "{FacilityCode}|{MenteeID}" ) )`.

- Generated when Mentee ID is present; Facility Code preferred (fallback `"0"`).
- Name is never hashed; deterministic; one-way.
- Prefer compute in post-processing / mentee database algo rather than on-device if SHA-256 is awkward in XLSForm.

---

## 6. Choice lists (initial)

### `yes_no`
| name | label |
|------|-------|
| yes | Yes |
| no | No |

### `cadre` (extend as needed)
| name | label |
|------|-------|
| nurse | Nurse |
| midwife | Midwife |
| clinical_officer | Clinical Officer |
| other | Other |

### `gender`
| name | label |
|------|-------|
| male | Male |
| female | Female |

### `new_existing`
| name | label |
|------|-------|
| new | New |
| existing | Existing |

### `program`
| name | label |
|------|-------|
| emonc_curriculum | EmONC Curriculum |
| newborn_curriculum | Newborn Curriculum |
| both | Both |
| other | Other |

### `deactivation_reason`
| name | label |
|------|-------|
| transfer | Transfer to another facility |
| promotion | Promotion / role change |
| retirement | Retirement |
| resignation | Resignation / left service |
| non_participation | Lack of participation |
| leave | Extended leave |
| deceased | Deceased |
| other | Other |

### `counties` / `facilities` / mentee select lists
- **counties** & **facilities**: from master facilities (DHIS code + name), same source as mentee database algo.
- **facility_mentees** / **facility_mentees_inactive**: built from current Mentees sheet (Eligible vs Ineligible), choice name = Mentee ID, label = `Name (Mentee ID)`, filtered by facility code.

---

## 7. Target row schema (mapping database)

Every successful submission should be mappable to one row with these columns:

| Column | Source on form | Example |
|--------|----------------|---------|
| Name | `mentee_name` / selected mentee | Geofrey Njebeli |
| pseudo_code | derived | 15996-BEAE |
| Mentee ID | `mentee_id` / selected | 705367519 |
| phone_number_whatsapp | WhatsApp field | 705367519 |
| Learning Mode | derived | In-person Only |
| County | `county` | Kakamega |
| Facility Code | `facility_code` | 15996 |
| Facility | `facility` | Malava Sub County Hospital |
| Cadre | `cadre` | Nurse |
| Gender | `gender` | Male |
| New or Existing? | `new_or_existing` | New |
| Date Activated | `date_activated` | Apr 1, 2026 |
| Date Deactivated | `date_deactivated` | |
| Date Reactivated | `date_reactivated` | |
| Reason for Deactivation | `reason_for_deactivation` | |
| Status | derived | Eligible |
| Program | `program` | EmONC Curriculum |
| EmONC In-person | flag | Yes |
| EmONC DELTA | flag | No |
| Essential Newborn In-person | flag | No |
| Essential Newborn DELTA | flag | No |
| Comprehensive Newborn In-person | flag | No |
| Continuum of Care | flag | Yes |
| Safe Surgery | flag | |
| OPOCUS | flag | |

### Sample activate rows (Malava Sub County Hospital)

| Name | pseudo_code | Mentee ID | phone_number_whatsapp | Learning Mode | County | Facility Code | Facility | Cadre | Gender | New or Existing? | Date Activated | Date Deactivated | Date Reactivated | Reason for Deactivation | Status | Program | EmONC In-person | EmONC DELTA | Essential Newborn In-person | Essential Newborn DELTA | Comprehensive Newborn In-person | Continuum of Care | Safe Surgery | OPOCUS |
|------|-------------|-----------|----------------------|---------------|--------|---------------|----------|-------|--------|------------------|----------------|------------------|------------------|-------------------------|--------|---------|-----------------|-------------|-----------------------------|-------------------------|---------------------------------|-------------------|--------------|--------|
| Geofrey Njebeli | 15996-BEAE | 705367519 | 705367519 | In-person Only | Kakamega | 15996 | Malava Sub County Hospital | Nurse | Male | New | Apr 1, 2026 | | | | Eligible | EmONC Curriculum | Yes | No | No | No | No | Yes | | |
| Judith Alusa | 15996-76C5 | 715372096 | | In-person Only | Kakamega | 15996 | Malava Sub County Hospital | Nurse | Female | New | Apr 1, 2026 | | | | Eligible | EmONC Curriculum | Yes | No | No | No | No | Yes | | |
| Modesta Sumbati | 15996-C0BA | 710242428 | 710242428 | In-person Only | Kakamega | 15996 | Malava Sub County Hospital | Nurse | Female | New | Apr 1, 2026 | | | | Eligible | EmONC Curriculum | Yes | No | No | No | No | Yes | | |

---

## 8. Validation checklist (form + post-process)

| Check | Rule |
|-------|------|
| Mentee ID | `^[17]\d{8}$` when present |
| WhatsApp | Same pattern when present; required if Hybrid |
| Facility Code | `^\d{1,5}$` |
| Date order | Deactivated ≥ Activated; Reactivated ≥ Deactivated; all ≤ today |
| Reason | Required on deactivate / whenever Status = Ineligible |
| Program flags | Rules in §4 D1 |
| Duplicate activate | Block if Mentee ID already Eligible at any facility (post-process or external choice exclusion) |
| Deactivate target | Must currently be Eligible at selected facility |
| Reactivate target | Must currently be Ineligible at selected facility |

---

## 9. Settings (Kobo)

| setting | value |
|---------|-------|
| form_title | Mentee Mapping Tool |
| form_id | mentee_mapping_tool |
| version | 2026.04.01 |
| submission_url | *(Kobo project)* |
| default_language | English (en) |

---

## 10. Integration path (recommended)

1. **Collect** — Deploy this form to maternity nurse incharges (facility-led).
2. **Normalize** — Pull submissions into a staging sheet; map Yes/No + choice names to mentee database labels (`Yes`/`No`, `EmONC Curriculum`, etc.).
3. **Upsert** — Write/update the **Mentees** sheet by Mentee ID (+ Facility Code).
4. **Derive** — Run `updateAllStatusesByName()` for Status, Learning Mode, `pseudo_code`, and pink-cell validations.
5. **Propagate** — Existing Kobo tool refresh (`kobocreator` → form builders → deploy) picks up Eligible mentees only.

```
Incharge (Kobo Mapping Tool)
        │
        ▼
 Staging / upsert by Mentee ID
        │
        ▼
 Mentees sheet  ──►  Mentee_Database_Algo  ──►  kobocreator  ──►  CTF / assessments / etc.
```

---

## 11. Out of scope (v1)

- Bulk multi-mentee repeat groups in one submission
- Direct on-device SHA-256 for `pseudo_code` (use algo post-process)
- Changing County/Facility of an already mapped mentee (use deactivate + activate at new site, or a later “transfer” action)
- Mentor/IFM self-mapping (this tool is for facility maternity nurse incharges)

---

## 12. Build next

When ready to implement:

1. Add `Mentee_Mapping_Tool.js` builder (`survey` / `choices` / `settings`) following `KOBO_FORM_BUILDING_GUIDE.md` patterns.
2. Register in `Kobo_Tools_Orchestrator` + `Kobo_Tools_Deployer`.
3. Seed facility and mentee choice lists from the synced Mentee Database / master facilities.
4. Pilot with one county (e.g. Kakamega / Malava) using the sample activate rows above.
