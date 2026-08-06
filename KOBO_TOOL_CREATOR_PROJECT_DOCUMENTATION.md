# Kobo Tool Creator — Project Documentation

**Build, validate & deploy pipeline** — a Google Apps Script automation for EmONC /
Newborn curriculum tracking, skills assessments, and knowledge assessments.

> This document is the project overview. For the day-to-day builder rules and the
> "how to add a form" checklist, see
> [KOBO_FORM_BUILDING_GUIDE.md](KOBO_FORM_BUILDING_GUIDE.md).
>
> **Want to see it rather than read it?** Open
> [`Kobo_Pipeline_Simulator.html`](Kobo_Pipeline_Simulator.html) in any browser —
> an animated simulator that follows one mentee record through every stage of
> the pipeline. Press `F` for fullscreen, `Space` to play/pause, arrow keys to
> step. Add `?step=12&autoplay=0` to freeze any moment (useful for printing).

---

## 1. Introduction

The Kobo Tool Creator is a Google Apps Script (JavaScript) automation system that
generates **and deploys** Kobo-compatible XLSForms from central datasets,
eliminating manual form building.

It was developed to solve the high manual workload of mapping thousands of
mentees into Kobo for EmONC and Newborn curriculum tracking, skills assessments,
and knowledge assessments across multiple counties and facilities. The original
process required manually preloading and mapping every eligible mentee into Kobo
so they could be selected during a training session. At programme scale —
thousands of mentees, continuous onboarding and attrition — this was slow,
repetitive, and error-prone. Manual entry produced incorrect facility mapping,
inconsistent naming, and broken unique identifiers, which in turn broke joins in
downstream systems such as Power BI.

What began as a single sheet generator (`kobocreator.js`) is now an **end-to-end
pipeline** that:

1. Pulls the latest data from the source databases
2. Cleans and standardizes it
3. Generates the intermediate survey / choices / logic sheets
4. Builds each Kobo form (survey / choices / settings tabs)
5. Validates every form the way Kobo will
6. Exports, imports, and deploys each form to the Kobo server — automatically

The whole cycle is a single click or a scheduled trigger, and only forms that
build cleanly are deployed, so one broken form never blocks the others.

## 2. What was the problem?

The primary challenge was the heavy manual workload of preparing Kobo tools for
mentee-based data collection. Every eligible mentee had to be manually entered
into Kobo and mapped to the correct facility. As the programme scaled to
thousands of mentees across many counties, this became unmanageable.

The mentee population is not static — people join and leave constantly — so the
forms needed constant manual updates. Manual work introduced data-quality risks:
incorrect facility mapping, inconsistent naming conventions, and malformed unique
identifiers, all of which degraded downstream analytics (e.g., Power BI joins
that depend on accurate mentee IDs).

## 3. What did we do?

We built an automated Google Apps Script pipeline that dynamically generates
**and deploys** all required Kobo XLSForm components from the centralized datasets
(Mentee Database and Mentor/IFM Database). The system:

- Standardizes facility and mentee information and generates consistent Kobo
  variable names.
- Builds survey questions, choice lists, and the relevance logic that controls
  form behaviour.
- Applies program filtering and status-based inclusion (active/inactive), and
  resolves each person to a single current record.
- Validates each generated form against the exact rules Kobo enforces before any
  upload.
- Exports each form to `.xlsx`, imports it to Kobo via the KPI API, and deploys
  the new version.

Any change in the source data is automatically reflected in the generated and
deployed Kobo tools, with no manual intervention.

## 4. Why was this important?

- **Efficiency:** eliminates repetitive manual entry of thousands of mentees; a
  full refresh + deploy is one action.
- **Accuracy & data integrity:** standardized naming and consistent
  mentee↔facility mapping remove a whole class of human error, protecting
  downstream analytics (Power BI joins on mentee IDs).
- **Scalability:** the same code handles 15+ counties and grows with the
  programme.
- **Responsiveness:** onboarding and attrition are reflected in real time through
  status-based filtering, so the live forms always represent the current active
  population.
- **Reliability:** a pre-deploy validation layer catches the errors Kobo would
  otherwise reject, with the exact row numbers, before anything is uploaded.

---

## 5. How the system works (end-to-end pipeline)

The single entry point is `refreshAllKoboTools()` in
`Kobo_Tools_Orchestrator.js`. A weekly/daily trigger or the **Kobo Tools**
spreadsheet menu calls it; nothing else should be scheduled. It always runs the
following sequence:

| Step | What happens | Where |
| --- | --- | --- |
| 0 | Acquire a script lock (prevents concurrent runs); seed missing configuration; validate that every required file, function, and the Kobo token are present | `refreshAllKoboTools()`, `ensureKoboToolsConfigured_()`, `validateKoboPipelineDependencies_()` |
| 1 | Sync external **Mentee Database 2026** → local `Mentee Database` | `syncMenteeDatabaseFromSource()` |
| 2 | Sync external **Mentor (IFM) Database 2026** → local `IFM List` | `syncIFMListFromSource()` |
| 3 | Transform the two local sheets into form content | `kobocreator.js` → `generateAllOutputs()` |
| 4 | Build each form's `survey` / `choices` / `settings` tabs | one builder file per form |
| 5 | Validate → export `.xlsx` → import to Kobo → deploy | `Kobo_Tools_Deployer.js` |

Only forms that build cleanly in step 4 are deployed in step 5. The run returns a
structured summary (`ok` or `completed_with_errors`) with per-tool build and
deploy results.

### 5.1 Step 0 — Lock, configure, validate

- A `LockService` script lock ensures only one pipeline runs at a time; a second
  concurrent run exits with `skipped_concurrent_run`.
- Configuration (source spreadsheet IDs/sheet names, Kobo token, server URL,
  per-tool form IDs and asset UIDs) is seeded into Script Properties if missing,
  without overwriting existing custom values.
- The pipeline verifies that every required global function exists (e.g.
  `generateAllOutputs`, each builder, `deployKoboTool`) and that the Kobo API
  token is available, **failing early** so a long sync/build never runs when it
  could not possibly deploy.
- `validateKoboPipelineFileRevisions_()` guards against a stale hand-pasted file:
  because Apps Script files are pasted in manually, the preflight names the file
  that is older than the pipeline expects.

### 5.2 Steps 1 & 2 — Sync source databases (with cleaning rules)

The builders never read the raw databases directly; they read cleaned local
copies. During sync:

- **Inactive rows are dropped.** Any row with `Status = Inactive` is removed from
  the local sheet.
- **Mentee ID normalization and validation.** A Mentee ID is kept only if, after
  normalizing, it is exactly nine digits starting with `1` or `7`:
  - `2541…` / `2547…` → strip the leading `254`.
  - `01…` / `07…` → strip the leading `0`.
  - A leading `+`, and any spaces, hyphens, or parentheses, are ignored.
  - Anything that remains the wrong length or starts with another digit is
    **excluded entirely** (and logged), protecting Power BI joins.
- **IFM county allowlist + canonical spellings.** The IFM list is restricted to
  the counties in `KOBO_TOOLS_ALLOWED_IFM_COUNTIES` (Busia, Kakamega, Kiambu,
  Kilifi, Kisii, Kwale, Machakos, Makueni, Meru, Mombasa, Muranga, Nairobi,
  Nakuru, Nyeri, Siaya) and rewritten to those canonical spellings.
- **Program canonicalization.** Mentee `Program` values of `EmONC Curriculum` are
  rewritten to `MENTORS Curriculum`.

### 5.3 Step 3 — Generate intermediate sheets (`generateAllOutputs()`)

`kobocreator.js` transforms the two cleaned local sheets into the shared
intermediate sheets that all builders consume. See the sheet-by-sheet
documentation in Section 8.

### 5.4 Step 4 — Build each form

Each registered builder opens (or creates) its own form spreadsheet, stores its
ID in a Script Property, and overwrites the `survey`, `choices`, and `settings`
tabs. Registered tools:

| Tool ID | Form | Builder function |
| --- | --- | --- |
| `emonc_ctf` | EmONC Curriculum Tracking Form | `createEmONCCurriculumTrackingForm2026` |
| `newborn_ctf` | Newborn Curriculum Tracking Form | `createNewbornCurriculumTrackingForm` |
| `moh_sac` | MoH Skills Assessment Checklist | `createMoHSkillsAssessmentChecklist` |
| `newborn_ka` | Newborn Knowledge Assessment | `createNewbornKnowledgeAssessment` |
| `emonc_ka` | MoH Mentee EmONC Knowledge Assessment | `createEmONCKnowledgeAssessment` |

### 5.5 Step 5 — Validate, export, import, deploy

For each successfully built tool, `deployKoboTool()`:

1. **Flush** — `SpreadsheetApp.flush()` forces buffered writes to disk so the
   exported `.xlsx` is never one build behind.
2. **Pre-deploy validation** — `assertKoboFormIsDeployable_()` inspects the
   `survey`/`choices` tabs and refuses to upload if it finds:
   - a `select_one`/`select_multiple` pointing at a **list that has no choices**
     (`List name not in choices sheet`),
   - a **duplicate question name**,
   - an **unbalanced expression** (mismatched parentheses / unterminated quote),
     ignoring parentheses inside quoted text.

   Row numbers count the header, exactly matching Kobo's `[row : N]` errors.
3. **Export** — the form spreadsheet is exported as an `.xlsx` blob via the Drive
   export endpoint.
4. **Import** — the blob is POSTed to `…/api/v2/imports/`. If the tool already
   has a Kobo asset UID, the import targets that asset as its `destination`
   (update in place); otherwise a new Kobo project is created. The import status
   is polled until `complete` (or `error`).
5. **Deploy** — `…/api/v2/assets/<uid>/deployment/`. If the asset has no active
   deployment, it POSTs `active=true` (first deployment); otherwise it PATCHes the
   new `version_id` (redeploy). The new asset UID is saved back to Script
   Properties for next time.

The Kobo server is `https://eu.kobotoolbox.org` (the EU / former
humanitarianresponse server). Legacy `*.humanitarianresponse.info` hosts were
retired on 1 March 2024 and are auto-mapped to the EU host.

---

## 6. Core source sheets

- **Mentee Database 2026** — the central dataset: mentee IDs, names, counties,
  facilities, facility codes, programs, status (active/inactive), and
  newborn-care flags. Primary driver for most outputs.
- **Mentor (IFM) Database 2026** — IFM records: IFM IDs, names, counties, and
  facility mappings. Drives the IFM choices, IFM assessment structures, and IFM
  survey logic.

## 7. Main workflow controllers & helpers

### 7.1 Controllers

- **`generateAllOutputs()`** (`kobocreator.js`) — runs every intermediate-sheet
  generator in dependency order.
- **`refreshAllKoboTools()`** (`Kobo_Tools_Orchestrator.js`) — the true entry
  point: sync → generate → build → validate → deploy.

### 7.2 Helper functions

- **`getOrCreateSheet(name)`** — creates the output sheet if missing, clears it if
  present.
- **`cleanForKobo(text)`** — converts raw text to a Kobo-safe token: folds accents
  (e.g. `Murangá` → `muranga`), drops apostrophes (`Murang'a` → `muranga`),
  lowercases, removes special characters, and replaces spaces with single
  underscores. Used for **all** place-derived variable names so every generator
  lands on the same spelling.
- **`cleanMenteeID(id)`** — removes spaces from identifiers to form consistent
  unique keys.
- **`generateKoboVariable(facility, isNewborn)`** — builds standardized
  facility-based variable names with context-aware suffixes (`_mentees`,
  `_nbc_mentees`) and special handling for long/duplicate facility names.
- **`assignFacilityListNames_()`** — allocates **one list name per facility code**,
  so two facilities that shorten to the same base don't collide: the first keeps
  the plain name, later ones get `_02`, `_03`, etc.
- **Shared build guards (`Kobo_Form_Kit.js`)** — `koboKitCollectChoiceLists_`,
  `koboKitDropRowsWithMissingChoices_`, `koboKitEnsureSheetCapacity_` — reused
  across builders to keep new forms consistent.

---

## 8. Sheet-by-sheet documentation (intermediate sheets)

**Mentee List** — A simplified, Kobo-ready list of all mentees, with a unique
Mentee Kobo ID (mentee ID + cleaned name) plus county, facility, and program.
Reference dataset for mentee-level selection/validation.

**Variable Names** — The central configuration sheet. Standardizes
facility–program combinations and generates all Kobo metadata (variable names,
labels, data types, relevance logic). Splits `Both` into Mentors and Newborn,
applies status filtering, and only emits a question for a facility that actually
has a selectable mentee, so no question ever references an empty choice list.

**Mentee-Facility Logic** — Conditional relevance expressions linking mentees,
facilities, programs, and IFM conditions, so only the correct mentees appear
under the correct facility/program context (Skills Assessment and IFM logic).

**MoH Skills Assessment Checklist** — Kobo survey rows for MENTORS skills
assessments, filtered to active mentees under the relevant programs, formatted
into `type` / `name` / `label` / `relevant`.

**Curriculum Tracking Form** — Kobo survey rows for curriculum completion,
filtered to MENTORS Curriculum, producing `select_multiple` fields per
facility/mentee group.

**EmONC Mentees List (Choices)** — Kobo choices for selecting EmONC mentees;
active mentees only, standardized labels/values from mentee IDs and names.

**EmONC Facilities List (Choices)** — Facilities for EmONC data collection,
mapped to counties and deduplicated, with Kobo list names for filtering. Program
filter is normalized (see Section 11).

**All Facilities List (Choices)** — The master facility registry used across all
programmes, with an `allowed` column defining which programmes each facility can
participate in (`mentors_curriculum`, `newborn_curriculum`, `ifm_assessment`,
`tot`). Eligibility is aggregated across every source row for a facility code.

**IFM Assessment Facilities List (Choices)** — Facility lists for IFM
assessments, grouped under IFM-specific list names, deduplicated per facility
code.

**IFM List (Choices)** — Kobo choice options for individual IFM participants (IFM
ID + name), grouped by facility-based list names.

**Newborn Facilities List (Choices)** — Facility-level newborn-care capability:
essential, comprehensive, or both, written to the `allowed` value.

**Newborn Mentees List (Choices)** — Kobo choices for newborn mentees, filtered
by program and active status, using newborn-specific naming.

**Survey Sheet (IFM)** — Kobo survey structure for IFM assessments: facility-level
selects with relevance logic, required fields, structured labels; shown only
under the correct facility/program.

**Survey Sheet (Newborn)** — Kobo survey structure for newborn tracking: relevance
mapped from Variable Names, eligible facilities/programmes only.

---

## 9. Deployed forms (the Kobo tools)

Beyond the intermediate sheets, the pipeline builds and deploys five complete
Kobo forms:

1. **EmONC Curriculum Tracking Form** — curriculum activity tracking for MENTORS
   facilities, including the curriculum video/activity checklists.
2. **Newborn Curriculum Tracking Form** — essential/comprehensive newborn-care
   tracking, scoped to the newborn counties.
3. **MoH Skills Assessment Checklist** — the large clinical skills assessment
   (UBT, AMTSL, cord prolapse, shoulder dystocia, NASG, newborn resuscitation,
   B-Lynch, and many more), with per-skill scoring and pass/fail feedback, plus
   county → facility → mentee/IFM/PO cascades.
4. **Newborn Knowledge Assessment** — yearly knowledge test for the newborn
   programme.
5. **MoH Mentee EmONC Knowledge Assessment** — yearly knowledge test for the
   EmONC programme.

### 9.1 Yearly knowledge tests — the Question Bank

Knowledge-assessment questions are edited in a spreadsheet, not in code.
`Kobo_Question_Bank.js` generates the survey rows, the choices block, and the
score formula from **one** sheet, so the three can never disagree:

- Create the sheet once: `createKoboQuestionBankTemplate("EmONC Question Bank")`
  / `("Newborn Question Bank")`.
- Fill one row per question (Question ID, Question, Type, Options A–D, Correct,
  Required, Hint).
- The **score divisor always equals the number of scored questions**, so a
  perfect paper is exactly 100. Free-text or unscored questions are excluded and
  logged.
- A single correct answer is stored as `Correct` (matching prior years' exports);
  `select_multiple` with several right answers stores option letters. Duplicate
  Question IDs, a `Correct` letter with no matching option, a `select_one` with
  two right answers, or a select with fewer than two options all stop the build
  with the offending row named.
- Keep a Question ID stable across years to keep that question comparable in
  exports.

---

## 10. Data-quality rules (learned from real deployment failures)

These are enforced in code and checked before upload:

1. **Every select must have choices.** Build questions and choices from one
   resolved record set; drop any question whose list is empty, and rewrite
   `${dropped_question}` references to `''`.
2. **Question names must be unique.** Allocate one name per facility code
   (`sagana_mentees`, `sagana_mentees_02`, …); never key on the facility name.
3. **Field names must be plain ASCII.** Always build names through
   `cleanForKobo()` (folds accents, drops apostrophes); never lowercase a name by
   hand.
4. **Expressions must be balanced.** The deployer balance-checks every expression
   (ignoring quoted text). Watch the split-across-lines score pattern.
5. **Imported relevance must match this form's choices.** When importing rows from
   a shared sheet, rewrite any clause that references a question your form defines
   differently (e.g. a `program` value that this form doesn't offer).
6. **Only ask about facilities that have people.** A facility with no active
   mentee carrying an ID and a name gets no question at all.
7. **Resolve people per posting, last row wins.** A person is identified by ID +
   Facility Code; the last row is the current state; normalize `Program`/`Status`
   before comparing.
8. **Flush before exporting.** `SpreadsheetApp.flush()` before the Drive export.
9. **Notes are not scorable.** A `note` can never hold `'yes'`; the score divisor
   must equal the number of real scored questions.
10. **One global namespace.** All `.js` files share one Apps Script namespace;
    prefix helpers per form or use `koboKit…` helpers to avoid silent collisions.
11. **Aggregate facility eligibility across every source row.** Group facility
    rows by Facility Code, union every supported `Program`, then write one choice;
    if both curricula occur (separate rows or `Both`), `Program` is `Both` and
    `allowed` includes both.
12. **Normalize Program before filtering facilities into a county list.** Compare
    `String(program).trim().toLowerCase()` against `"mentors curriculum"` /
    `"newborn curriculum"` / `"both"` — a strict `===` drops hand-typed variants
    and silently omits facilities from their county.
13. **One canonical facility name per Facility Code.** A facility choice value is
    `"<code>_<cleaned facility>"`, and every question that filters on a facility
    rebuilds that same string. Because the name is typed by hand, one code can
    arrive spelled two ways (`Makueni County Referral Hospital` /
    `Makueni County Refferal Hospital`). If the choices sheet takes one spelling
    and the question's relevance takes the other, the equality is never true:
    the question is on the form, the mentees are in the choices, and selecting
    the facility reveals nothing. **Nothing errors**, so it survives deployment.
    Always build the value through `facilityChoiceValue_()`, which resolves one
    spelling per code (most-used wins, ties to the first row) and logs the codes
    that need correcting at source.

---

## 11. Recent enhancements and fixes

- **Program normalization for county facility lists** — `EmONC Facilities List
  (Choices)` and `Newborn Facilities List (Choices)` now trim and lowercase
  `Program` before filtering, so variants like `Mentors Curriculum`, a trailing
  space, or `both` are no longer dropped. This restored missing facilities (e.g.
  Kirinyaga) under their counties (Rule 12).
- **Facility eligibility aggregation** — `All Facilities List (Choices)` unions
  every program for a facility code before writing one choice, so a facility with
  both MENTORS and Newborn mentees is correctly marked `Both` with both curricula
  in `allowed` (fixed e.g. Makindu) (Rule 11).
- **MoH SAC county list derived from generated facilities** — the county choices,
  the Section 1b facility selects, and the `next_group_hide1` calculation are now
  all built from `All Facilities List (Choices)` instead of a hand-typed list.
  This fixed **Kirinyaga and Kwale** being absent from the county question (their
  facility questions existed but no county choice could reveal them), and keeps
  the three in step whenever a county is added. A county's `allowed` value is the
  union across its facilities. A guard also blanks any `${x_facilities}` reference
  for a county that has no facility question, so pyxform never fails on a dangling
  reference.
- **Canonical facility name per Facility Code** — every generator now builds the
  facility choice value through one shared registry
  (`facilityChoiceValue_()` / `canonicalFacilityName_()`) instead of
  re-deriving `code + "_" + cleanForKobo(facility)` from whichever row it
  happened to read. This fixed **Makueni County Referral Hospital** under the
  newborn programme, where the county facility list carried the misspelling
  `..._refferal_hospital` (taken from the first row for that code, a MENTORS
  mentee) while the newborn question's relevance was built from the correctly
  spelled newborn rows — so selecting the facility revealed no mentees, with no
  error anywhere. Codes with more than one spelling are logged for correction at
  source (Rule 13).
- **Unreachable-comparison detector** — `findKoboUnreachableComparisons_()` in
  the deployer reports any `${field} = 'value'` whose value is not a choice in
  that field's list, naming the row and question. Reported as a **warning**, not
  a deploy blocker, because Kobo accepts these happily — they are exactly the
  faults nothing else surfaces. Shown on every deploy and in
  `checkAllKoboFormsForDeployProblems()`.
- **Orphan-choice and duplicate-name protection, accent/apostrophe folding, and
  balanced-expression checking** — implemented across `kobocreator.js` and the
  builders and enforced by the pre-deploy validator.
- **EU server + legacy host mapping** — deployment targets
  `https://eu.kobotoolbox.org`; retired `humanitarianresponse.info` hosts are
  auto-corrected.

---

## 12. Operating the pipeline

- **`refreshAllKoboTools()`** — run the whole pipeline (sync → generate → build →
  validate → deploy). Also available from the **Kobo Tools** menu, and installable
  as a daily/weekly trigger.
- **`checkAllKoboFormsForDeployProblems()`** — validate every form and deploy
  nothing; reports empty choice lists, duplicate names, and unbalanced
  expressions with Kobo-style row numbers.
- **`deployKoboTool("moh_sac", true)`** — rebuild and deploy a single tool
  (`true` = rebuild the sheet first).
- **`deployAllKoboTools(true)`** — rebuild and deploy every enabled tool,
  continuing past individual failures.
- **`testKoboConnection()`** — confirm the Kobo server and token.

### 12.1 Adding a new form (summary)

1. Create `My_New_Form.js` with one entry point `createMyNewForm()` that upserts
   the `survey` / `choices` / `settings` tabs.
2. Build choices first, then validate the survey against them with the `koboKit…`
   helpers; grow the grid with `koboKitEnsureSheetCapacity_()` before writing.
3. Register the tool in **both** registries (`getKoboToolsRegistry_()` for build
   order in the orchestrator, `getKoboDeployToolsRegistry_()` for deployment).
4. Seed the form spreadsheet ID and Kobo asset UID in `setupKoboDeployConfig()`
   (omit the asset UID to create a brand-new Kobo project).
5. Run `checkAllKoboFormsForDeployProblems()` before deploying.

### 12.2 Testing without Apps Script

Every fix is verified offline first by running a builder under Node with a fake
Spreadsheet service (`getSheetByName`, `insertSheet`, `getDataRange().getValues()`,
and a `getRange` that records `setValues`), then asserting: every select list
appears in choices, no question name repeats, every expression's brackets
balance, and `begin_group` / `end_group` nest to zero. Filling can be simulated
(evaluate `relevant`, blank hidden fields, recompute `calculate`) to confirm the
intended section actually opens. Always run the same check against the previous
commit — if it doesn't fail there, it isn't testing what you think.

---

## 13. Recommended Apps Script file order

1. `kobocreator.js`
2. `Kobo_Tools_Orchestrator.js` ← only `onOpen` / trigger
3. `EmONC_Curriculum_Tracking_Form_2026.js`
4. `Newborn_Curriculum_Tracking_Form.js`
5. `MoH_Skills_Assessment_Checklist.js`
6. `Newborn_Knowledge_Assessment.js`
7. `EmONC_Knowledge_Assessment.js`
8. `Kobo_Question_Bank.js`
9. `Kobo_Form_Kit.js`
10. `Kobo_Tools_Deployer.js`

---

## 14. Resources and Links

Fill in the live URLs as needed. **Do not paste API tokens into this document.**

- [Link] to Kobo Creator Tool (`kobocreator.js`)
- [Link] to Kobo Tools Orchestrator (`Kobo_Tools_Orchestrator.js`) — pipeline entry point
- [Link] to Kobo Tools Deployer (`Kobo_Tools_Deployer.js`) — validation + Kobo upload/deploy
- [Link] to Kobo Form Kit (`Kobo_Form_Kit.js`) — shared build guards
- [Link] to Kobo Question Bank (`Kobo_Question_Bank.js`) — yearly knowledge-test generator
- [Link] to Mentee Database 2026
- [Link] to Mentor (IFM) Database 2026
- [Link] to EmONC Curriculum Tracking Form Builder
- [Link] to Newborn Curriculum Tracking Form Builder
- [Link] to MoH Skills Assessment Checklist Form Builder
- [Link] to Newborn Knowledge Assessment Builder
- [Link] to MoH Mentee EmONC Knowledge Assessment Builder
- Kobo server: `https://eu.kobotoolbox.org`

---

*Note: API tokens and other secrets live in Apps Script Script Properties only
and are intentionally omitted from this document.*
