# EmONC Data Quality / Data Integrity Assurance Framework

**Program:** MENTORS — EmONC in-facility mentorship  
**Primary data source:** EmONC Curriculum Tracking Form (KoBo)  
**Audience:** DnA, Programs, County POs, Audit / QA teams  
**Purpose:** Detect fabricated or inflated mentorship activity early, target facilities for audit, and standardize how integrity risk is scored and actioned.

---

## 1. Problem statement

Last year, some IFMs uploaded EmONC curriculum activities for mentees in facilities where:

- the activities did not take place, or
- mentees did not participate even if some activity occurred.

This year we need a **repeatable early-warning system** that:

1. Defines measurable data-collection norms.
2. Flags records and facilities that violate those norms (red flags).
3. Produces an **Integrity / Data Quality Score** for prioritising verification.
4. Combines **random** and **purposive** verification (phone + field).
5. Feeds a **monthly red-flag package** to Programs so intervention happens while the trail is still fresh.

---

## 2. What “good” mentorship data should look like (norms)

These norms are the measurable “generally accepted” standards against which every submission, mentor-day, mentee, and facility is scored. Thresholds marked **[CALIBRATE]** should be set from last year’s clean cohorts / known-good facilities, then locked for the year (with a mid-year review).

### 2.1 Activity types in scope

From the EmONC Curriculum Tracking Form:

| Code / group | Activity |
|---|---|
| `cmes` | CME / didactic teaching |
| `videos` | Video viewing |
| `case_scenarios` | Case scenario discussion |
| `mentor_skills_demo` | Mentor skill demonstration |
| `mentee_skills_return_demo` | Mentee return demonstration |
| `drills` | Drill / simulation |

A single KoBo **submission** can cover multiple mentees, multiple activity types, and multiple topics. The activities log expands this to mentee × activity × topic rows. Integrity checks must therefore run at **three grains**:

| Grain | Definition |
|---|---|
| **Submission** | One KoBo `_uuid` / submission ID |
| **Mentor-day** | Mentor + facility + calendar session date |
| **Facility-month** | Facility + reporting month |

### 2.2 Realistic session duration and volume

Mentees are on duty. High-quality EmONC mentorship is typically done in short protected blocks between (or around) clinical work—not as a full-day classroom.

**Proposed session norms (starting point — confirm with Programs / clinical trainers):**

| Parameter | Proposed norm | Rationale |
|---|---|---|
| Typical protected teaching block | **45–90 minutes** | Compatible with maternity shift work |
| Maximum realistic continuous mentorship block in one day | **≤ 3 hours** (broken into 1–2 sittings) | Beyond this, clinical coverage usually suffers |
| Distinct activity *types* per mentee per sitting | **≤ 3** | e.g. CME + video + case; or demo + return demo + short drill |
| Distinct topics per mentee per sitting | **≤ 2** (preferably 1 deep topic) | Multi-topic “everything” sessions are a classic inflation pattern |
| Mentored mentees per sitting (same submission) | **≤ 4–6** for skills/return demos; **≤ 8–10** for CME/video only | Skills require observation time per person |
| Activities attributable to one mentee in one calendar day | **≤ 4 activity-type credits** | See scoring note below |
| Activities a mentor can credibly deliver in one facility-day | **≤ 12–15 mentee-activity credits** across all mentees | Above this → bulk-day red flag |

**Activity time budgets (indicative, for combination rules):**

| Activity | Minimum quality time (per topic, per mentee or small group) |
|---|---|
| CME | 20–40 min |
| Video | 10–25 min |
| Case scenario | 15–30 min |
| Mentor demo | 15–25 min |
| Return demo (per mentee) | 15–30 min |
| Drill | 30–60 min |

**Rule of thumb:** Sum of activity time budgets in one sitting should not exceed **~90 minutes** for a skills-heavy session, or **~120 minutes** for a didactic-heavy session.

### 2.3 What can realistically be done together in one sitting?

**Allowed / common combinations (same topic preferred):**

1. CME → Video → Case scenario *(didactic path)*  
2. Mentor demo → Return demo *(skills path; same topic)*  
3. Mentor demo → Return demo → Short drill *(skills + consolidation; same topic)*  
4. Video → Case scenario  
5. CME alone, or Drill alone (especially multi-person drills)

**Discouraged / improbable in one sitting (combination mismatch candidates):**

| Pattern | Why it is suspicious |
|---|---|
| All 6 activity types in one submission | Time-impossible for quality training while on duty |
| CME + Video + Case + Mentor demo + Return demo + Drill on **different topics** in one submission | Inflated “catch-up” packaging |
| Return demo **without** prior/same-session mentor demo on that topic *(unless mentee already had demo earlier — check history)* | Pedagogically odd; sometimes legitimate, so soft flag |
| Multiple unrelated drills + multiple return demos for **many mentees** under one submission ID | Classic bulk fabrication signature |
| Same mentee credited with **>2 return demos** on different topics in one day | Observation time does not scale |

**Hard combination mismatch (proposed):**

Flag a submission if **any** of the following hold:

- Activity-type count in the submission ≥ **5** distinct types, **or**
- Activity-type count ≥ 4 **and** distinct topics ≥ 3, **or**
- Estimated session effort score (see §4) exceeds the daily effort ceiling.

### 2.4 Timeliness of upload

You already track:

- `session_date` (reported session delivery date)
- `_submission_time` / Submission Date (KoBo metadata)

**Proposed timeliness norms:**

| Band | Definition | Integrity interpretation |
|---|---|---|
| **On-time** | Submitted within **≤ 15 minutes** of session end *if* start/end timestamps exist; otherwise same calendar day as `session_date` | Compliant |
| **Acceptable delay** | Submitted within **1–3 calendar days** of `session_date` | Mild quality issue (connectivity / batching) |
| **Late** | **4–7 days** after `session_date` | Soft red flag |
| **Very late** | **> 7 days** after `session_date` | Strong red flag |
| **Impossible** | `_submission_time` **before** `session_date` (timezone-adjusted) | Data error or manipulation |
| **Future session** | `session_date` after submission date | Invalid |

**Note on the “≤ 15 minutes” rule:** This is only enforceable if the form captures **session start and session end** (or “form opened at end of session”). Today many CTF records only have `session_date` (date, not datetime). Recommendation:

- **Short term:** score delay in **days** using `session_date` vs `_submission_time`.
- **Form enhancement:** add `session_start_time` and `session_end_time`; then enforce ≤ 15 minutes from `session_end_time` to `_submission_time` (or use KoBo `start`/`end` metadata if mentors open the form during the session).

Also use KoBo metadata where available:

- `start`, `end`, `_submission_time` duration of form fill
- Very short form-fill time with very large activity payloads → bulk-entry suspicion
- GPS / device ID consistency (if enabled) across a mentor’s submissions

### 2.5 Pedagogical sequence norms (curriculum logic)

Using historical mentee × topic activity history:

| Norm | Measurable check |
|---|---|
| Skills before assessment | Return demo / skill eval should not systematically precede any exposure to that topic |
| Drill after orientation | Drill on a topic ideally follows CME/video/demo exposure (soft rule) |
| No identical duplicate credits | Same mentee + same activity type + same topic within **≤ 7 days** without justification → duplicate soft flag |
| Progress velocity | Completing an entire year’s topic requirements for one activity type in **≤ 2 calendar weeks** → velocity red flag |

### 2.6 Facility operating norms

| Norm | Measurable check |
|---|---|
| Mentorship cadence | Most facilities show a steady weekly/biweekly pattern, not one mega-upload month |
| Mentor coverage | Activity volume should scale with # of active IFMs and # of enrolled mentees |
| Duty conflict | Large volumes on known night-only or extreme off-pattern days (if duty roster available) |

---

## 3. Red flags (grounds for targeted audit)

Red flags are **signals**, not proof of fraud. They trigger purposive verification. Stack multiple flags → higher priority.

### 3.1 Core red flags (DnA + extensions)

| ID | Red flag | Definition (proposed) | Severity |
|---|---|---|---|
| **RF-01 Activity bulk (mentor-day)** | Mentor submits more than **[X = 12]** mentee-activity credits in a single session date at one facility | High |
| **RF-02 Submission bulk** | Under one submission ID, mentee × activity × topic expanded rows exceed **[X = 40]**, **or** distinct activity types ≥ 5 | High |
| **RF-03 Submission delay** | % of facility-month submissions with delay > 7 days exceeds **[X = 30%]**; or any submission delay > 14 days | Medium–High |
| **RF-04 Combination mismatch** | Submission matches hard combination rules in §2.3 | High |
| **RF-05 Multi-mentee identical package** | ≥ **[X = 5]** mentees receive the *exact* same activity+topic set in one submission with skills-heavy mix | Medium–High |
| **RF-06 Impossible chronology** | Submission time before session date; or future session date | High |
| **RF-07 Form-fill anomaly** | KoBo `end − start` < **[X = 90 seconds]** while submission credits ≥ **[Y = 10]** activities | High |
| **RF-08 Overnight / off-hours burst** | Large batch submitted between **00:00–05:00** local time (unless known connectivity pattern) | Medium |
| **RF-09 Velocity spike** | Facility or mentor Z-score of weekly activity volume > **[X = 2.5]** vs own 8-week baseline | Medium–High |
| **RF-10 Duplicate stacking** | Same mentee+activity+topic repeated ≥ 2× within 7 days | Medium |
| **RF-11 Orphan mentee** | Activities logged for mentee IDs not on facility mentee list / inactive / wrong facility | High |
| **RF-12 Cross-facility mentor anomaly** | Same mentor logs high volume in ≥ 2 distant facilities same day | High |
| **RF-13 Phone verification fail** | Mentee denies session, or cannot recall activity/topic/date within tolerance | Critical (confirmed) |
| **RF-14 Spot-check fail** | Observation finds no session / no attendance / data entered before or without activity | Critical (confirmed) |
| **RF-15 Supervision mismatch** | Supervision / QuIPS / visit notes indicate no mentorship on dates with heavy CTF uploads *(when linkable)* | High |

### 3.2 Suggested default thresholds (pending calibration)

Calibrate **[X]** using the distribution from facilities with **prior clean verification** or low historical integrity risk:

| Metric | Soft flag (P90) | Hard flag (P95 / clinical ceiling) |
|---|---|---|
| Mentee-activity credits / mentor-day | 8 | 12 |
| Distinct activity types / submission | 3 | 5 |
| Distinct topics / submission | 2 | 4 |
| Expanded rows / submission | 24 | 40 |
| Mentored mentees / skills submission | 4 | 6 |
| Days session→submit | 3 | 7 |
| Form fill seconds / credit | — | < 90s for ≥10 credits |

---

## 4. Integrity / Data Quality Score

Create a column (and facility roll-up) called **`integrity_dq_score`**.

### 4.1 Score direction

- **100 = fully compliant** with norms  
- **0 = severe integrity risk**

Lower scores → audit first.

### 4.2 Record-level score (each submission or mentee-activity package)

Start at 100; subtract weighted penalties:

| Check | Penalty if triggered |
|---|---|
| RF-02 / RF-04 combination or submission bulk | −25 |
| RF-01 mentor-day bulk (attribute to each related submission) | −20 |
| RF-03 delay 4–7 days | −10 |
| RF-03 delay > 7 days | −20 |
| RF-06 impossible chronology | −30 |
| RF-07 form-fill anomaly | −20 |
| RF-05 identical multi-mentee package | −15 |
| RF-10 duplicate stacking | −10 |
| RF-08 off-hours burst | −5 |
| Timely same-day submit, ≤3 activity types, ≤2 topics, ≤4 mentees | **+0** (no bonus needed; absence of penalties is the reward) |

Floor at 0. Optionally band:

| Band | Score | Action |
|---|---|---|
| Green | 80–100 | Routine random verification only |
| Amber | 50–79 | Include in monthly purposive call list |
| Red | 0–49 | Priority calls + consider field visit |
| Confirmed fail | N/A | Programs escalation; pause counting suspect records pending review |

### 4.3 Facility-month roll-up

```
facility_integrity_score =
  0.50 * mean(submission integrity_dq_score)
+ 0.20 * (100 − 100 * %_submissions_with_any_high_severity_flag)
+ 0.15 * (100 − min(100, velocity_spike_index))
+ 0.15 * verification_pass_rate_last_90_days
```

Where `verification_pass_rate` comes from phone + spot checks (100 if no checks yet, but mark as **unverified** separately so never-audited high-volume sites are not falsely “green”).

**Always surface two fields:**

1. `integrity_dq_score` (algorithmic)  
2. `verification_status` = `Unverified | Pass | Partial | Fail`

### 4.4 Effort score (optional helper used inside red flags)

Assign minutes to each activity credit (from §2.2), sum within a sitting:

```
effort_minutes ≈
  Σ (activity_minutes × topic_count_weight × mentee_weight)
```

- For group CME/video/case: mentee_weight can be `1 + 0.15 × (n_mentees − 1)`  
- For return demos: mentee_weight = `n_mentees` (near-linear)

Flag if `effort_minutes > 120` for one sitting or `> 180` for one mentor-day.

---

## 5. Sampling & verification design

### 5.1 Two complementary tracks (as DnA proposes)

| Track | Method | Goal |
|---|---|---|
| **A. Random structured phone calls** | Probability sample of mentees | Unbiased prevalence of integrity issues |
| **B. Purposive / red-flag calls** | Target Amber/Red facilities, mentors, submissions | Catch foul play early |

Do **both** every month. Random alone misses concentrated fraud; purposive alone cannot estimate overall integrity.

### 5.2 Random call verification — how often and how to pick

**Proposed cadence:** monthly.

**Sample size (starting point):**

- **2–5%** of active mentees with ≥1 activity in the prior 30 days,  
  with a **minimum of 2 mentees per county** that had activity,  
  and a **cap** so workload stays feasible (e.g. 40–80 calls/month nationally — adjust to PO capacity).

**Selection steps:**

1. Frame = mentees with ≥1 CTF activity in last 30 days.  
2. Stratify by county (and optionally facility size / volume quintile).  
3. Random select within strata.  
4. Exclude mentees called in the previous **60 days** unless they hit a critical red flag.  
5. If mentee unreachable after 3 attempts → replace within same stratum; log as `unreachable`.

### 5.3 Purposive call verification — how to decide county / facility / mentee

**Monthly prioritisation order:**

1. Facilities with `facility_integrity_score` in bottom **20%** and volume above median.  
2. Mentors with ≥2 High severity flags in the month.  
3. Submissions with RF-01, RF-02, RF-04, RF-06, RF-07.  
4. Facilities with sudden velocity spike (RF-09).  
5. Facilities never verified in the last **90 days** but in top volume quartile (**unverified high-volume**).

Within a flagged facility, sample:

- 1–2 mentees from the **flagged submission(s)**, plus  
- 1 mentee from a **non-flagged** recent submission at the same facility (contrast check).

### 5.4 Phone questionnaire — what to ask (map to variables)

Use a structured script. Capture coded answers for analysis.

| # | Question | Variable to store | Pass criterion |
|---|---|---|---|
| 1 | Confirm mentee name, facility, cadre | `identity_match` | Matches database |
| 2 | Were you mentored / trained on EmONC topics in [month]? | `any_mentorship_recall` | Yes / No |
| 3 | Do you recall a session on or about [session_date ± 3 days]? | `date_recall` | Yes / approximate |
| 4 | Who facilitated? (name/role) | `mentor_recall_match` | Matches IFM on record (± known alias) |
| 5 | What activities happened? (read list; don’t lead with the full claimed set first—ask open, then probe) | `activities_recalled[]` | ≥50% overlap with claimed set for light sessions; higher bar for skills |
| 6 | What topic(s)? | `topics_recalled[]` | At least one claimed topic recalled |
| 7 | About how long did the session last? | `duration_recalled_min` | Within 2× of effort estimate; not “all day” for tiny claim or “5 minutes” for drill+demos |
| 8 | How many colleagues joined? | `group_size_recalled` | Within ±3 of submission mentee count |
| 9 | Was data entered during/after the session in your presence? | `saw_data_entry` | Informational |
| 10 | Any reason the record might be wrong? | `mentee_notes` | Free text |

**Call outcome codes:** `Verified | Partial match | Denied | Unreachable | Wrong number | Refused`

**Documentation:** one row per call in a shared Verification Log (Google Sheet / Redshift table) with: call_id, date, caller, county, facility, mentee_id, submission_ids referenced, outcome, mismatch details, follow-up action.

### 5.5 Random spot checks / field observation

**Cadence (proposed):**

- **Monthly desk review** of red-flag package (DnA + Programs).  
- **Field spot checks:** at least **1 facility per priority county per quarter**, skewed to Red/Amber + unverified high-volume sites.  
- Align with existing Programs audit / supportive supervision visits (ride-along) to reduce extra travel cost.

**What spot checks seek (specify each variable):**

| Variable | What observer records |
|---|---|
| `session_observed` | Was a mentorship session happening as scheduled/claimed? (Y/N) |
| `start_time_obs` / `end_time_obs` | Observed times |
| `mentees_present_count` | Headcount present |
| `mentees_present_ids` | Names/IDs vs claimed list |
| `activities_observed` | CME / video / case / demo / return demo / drill |
| `topics_observed` | Topic(s) covered |
| `teaching_quality_notes` | Brief quality notes (not scored for integrity) |
| `data_entry_when` | Before session / during / immediately after / much later / not observed |
| `tool_used` | KoBo CTF on phone/tablet? Paper then later? |
| `connectivity_notes` | Offline entry, delayed sync excuses |
| `discrepancy_flag` | Match / Partial / Mismatch vs CTF claim for that day |
| `photos_or_attendance` | Optional attendance sheet / permissioned evidence |
| `observer_id` / `visit_date` | Audit trail |

**Documentation:** Field Spot-Check Form (Kobo or paper→digitise) linked to `facility_code` + `visit_date` + optional `submission_id`.

### 5.6 Role of the supervision tool

Clarify with Programs which tool is meant (facility supervision checklist, QuIPS observation, PO visit form, etc.). Useful integrity signals **if date-linkable to CTF**:

| Supervision signal | Integrity use |
|---|---|
| Visit date with “mentorship observed: No” while CTF shows heavy same-day activity | RF-15 mismatch |
| Mentorship observed: Yes + topic/activity noted | Corroborates CTF |
| Staff on duty / absentee notes | Challenges “all mentees present” claims |
| Equipment / space unavailable for drills | Soft challenge to drill-heavy claims that day |
| PO comments on IFM engagement | Contextual risk rating |

**Recommendation:** build a monthly join of supervision visits ↔ CTF on `facility_code` + date (±1 day). Do not treat absence of a supervision visit as a negative—only contradictions when both exist.

---

## 6. Monthly red-flagging algorithm (shareable package)

### 6.1 Pipeline (conceptual)

1. Ingest CTF activities log (submission id, times, mentor, county, facility, mentee, activity, topic).  
2. Compute grain-level metrics (submission, mentor-day, facility-month).  
3. Apply red-flag rules RF-01…RF-12.  
4. Compute `integrity_dq_score` at submission and facility-month.  
5. Merge phone + spot-check outcomes (RF-13/14) and supervision mismatches (RF-15).  
6. Output a **Programs monthly pack**.

### 6.2 Monthly pack contents

| Sheet / tab | Contents |
|---|---|
| Facility Risk League | Facility-month score, volume, # high flags, verification status, recommended action |
| Mentor Watchlist | Mentors with repeated high flags |
| Flagged Submissions | Submission-level detail for purposive calls |
| Call List | Random + purposive mentee contacts for the month |
| Verification Outcomes | Prior month results + trend |
| Threshold Appendix | Current [X] values and last calibration date |

**Recommended action codes for Programs:**

- `Monitor`  
- `Phone verify`  
- `PO coaching / refresher`  
- `Field audit`  
- `Escalate / freeze suspect records`

### 6.3 Intervention timeline

| When | Who | What |
|---|---|---|
| Week 1 of month | DnA | Generate red-flag pack for prior month |
| Week 1–2 | Programs / POs | Execute call lists; document outcomes |
| Ongoing | Programs + DnA | Schedule field visits on Red facilities alongside audit teams |
| Quarterly | DnA + Programs | Recalibrate thresholds; review false-positive rate |
| Quarterly | Programs | Kobo CTF refresher for POs → IFMs |

---

## 7. Answers to the open design questions (summary)

| Question | Suggestion |
|---|---|
| How many activities/day if quality + on-duty? | Aim ≤ **3 activity types / mentee / sitting**; ≤ **4 credits / mentee / day**; ≤ **12–15 credits / mentor-day** |
| Can CME + video + case + demos + drill all happen in one sitting? | **Not at quality.** Treat ≥5 types (or 4 types + many topics) as combination mismatch |
| Realistic combinations? | Didactic path (CME/video/case) **or** skills path (demo → return demo ± drill), preferably **one topic** |
| Upload within ≤15 minutes? | Enforce when start/end times exist; until then use **same-day / days-late** bands; enhance form |
| What can supervision add? | Date-linked corroboration or contradiction (RF-15)—not a substitute for CTF checks |
| Spot check frequency & variables? | ≥1 priority facility/county/quarter; record variables in §5.5 |
| Random call frequency & targeting? | Monthly stratified random sample (§5.2) **plus** purposive red-flag sample (§5.3) |

---

## 8. Operational recommendations (beyond detection)

1. **Continue random structured phone calls** using the questionnaire in §5.4.  
2. **Add purposive sampling** driven by the red-flag algorithm.  
3. **Publish the monthly red-flag pack** to Programs within the first week of each month.  
4. **Schedule field visits** with Programs audit teams on Red / high-volume-unverified facilities; observe live mentorship and *when* data is entered.  
5. **Quarterly KoBo refresher** for POs → IFMs (focus: one session = one coherent package; enter promptly; do not batch-fabricate).  
6. **Form improvements (high ROI):**
   - `session_start_time` / `session_end_time`
   - optional attendance confirmation
   - constrain multi-select activity types (warn if ≥5 selected)
   - capture GPS / device ID if ethically and operationally acceptable
7. **Do not weaponise the score blindly:** Amber/Red triggers verification, coaching, and support first; confirmed fabrication triggers escalation per Programs policy.  
8. **Protect whistleblowers / honest mentees** during calls—frame as routine data quality, not accusation.

---

## 9. Implementation sketch (for DnA)

### 9.1 Minimum viable product (first month)

- SQL/Python job on `mentors.mentee_curriculum_tracking` (+ raw submission metadata if available).  
- Implement RF-01, RF-02, RF-03, RF-04, RF-06, RF-09, RF-10.  
- Facility-month league table + flagged submissions extract.  
- Verification log template for call outcomes.

### 9.2 Next iteration

- Effort-minute model and combination matrix by activity.  
- Join supervision / visit data.  
- Automate call lists (random + purposive).  
- Dashboard (Green/Amber/Red) with drill-down to submission IDs.

### 9.3 Fields required from CTF activities log

Already available via EmONC activities log transformation:

- Submission ID, Submission Date, Session Date  
- Mentor Name, County, Facility Code, Facility  
- Mentee ID, Mentee Name  
- Activity, Topic  

**Nice-to-have from raw KoBo:** `start`, `end`, `_submission_time`, device id, geo, username.

---

## 10. Decision log — items to confirm with Programs / clinical trainers

Before locking thresholds for the year, confirm:

1. Official max activity types per sitting and preferred pedagogical sequences.  
2. Whether return demo without same-day mentor demo is allowed.  
3. Target phone-call capacity (calls/month).  
4. Which supervision tool is authoritative for RF-15 joins.  
5. Policy when verification **Fails**: remove records, coach, restart mentorship count, HR escalation, etc.  
6. Whether IFMs may submit offline and sync later (affects delay scoring).  
7. Calibration sample: which counties/facilities are “known clean” from last year’s investigations.

---

## 11. One-page theory of change

```
Measurable norms
    → automated red flags + integrity_dq_score
        → monthly random + purposive verification
            → early detection of inflated/fake activities
                → PO coaching / field audit / escalation
                    → cleaner EmONC mentorship data and fairer mentee progress
```

---

*Document status: working framework for DnA–Programs alignment. Thresholds marked for calibration should be updated after the first historical distribution pass on CTF data.*
