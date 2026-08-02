---
marp: true
title: One Click, Five Forms — Automated Kobo Deployment
paginate: true
theme: default
---

<!--
Render this deck:
  - VS Code: install the "Marp for VS Code" extension, open this file, Export (PDF / PPTX / HTML).
  - CLI: npx @marp-team/marp-cli KOBO_PIPELINE_SLIDES.md --pptx
  - Or paste each slide (between the --- rules) into Google Slides / PowerPoint.
Speaker notes are in HTML comments under each slide.
-->

# One Click, Five Forms
## Automated Kobo form creation, sync, import & deployment

Jacaranda Health · MENTORS & Newborn programs

<!--
Opening line: "Everything you're about to see now happens from a single command,
and can run by itself every month."
-->

---

# The problem we solved

- Each Kobo form was built and updated **by hand**
- Facility and mentee lists **change constantly** across 15 counties
- Every manual rebuild risked broken drop-downs, duplicate fields and failed uploads
- **Five tools** meant five separate manual workflows, each easy to get wrong

<!--
Land the pain: a form that fails to deploy, or deploys with a facility that has no
mentees, costs a day of debugging and delays data collection in the field.
-->

---

# What's possible now

- **One command** — `refreshAllKoboTools` — does everything, end to end
- Create → **Sync** → **Import** → **Deploy**, across all five tools at once
- Tools covered:
  - EmONC Curriculum Tracking Form
  - Newborn Curriculum Tracking Form
  - MoH Skills Assessment Checklist
  - Newborn Knowledge Assessment
  - EmONC (MoH Mentee) Knowledge Assessment

<!--
The five tools are all fed from the same two live databases, so they stay consistent
with each other automatically.
-->

---

# The pipeline in one move

1. Sync the live **Mentee Database**
2. Sync the live **Mentor (IFM) Database**
3. Generate all form content from source data
4. Build all five Kobo forms (survey / choices / settings)
5. Upload and deploy each form to Kobo

> Only forms that build cleanly are deployed — **one broken form never blocks the others**

<!--
Emphasise step 5's safety: a failure is isolated. Four forms still go out while the
fifth is reported with the exact problem.
-->

---

# Always working from live data

- Pulls directly from the Mentee and Mentor (IFM) databases each run
- **Inactive** mentors and mentees are dropped automatically
- IFM import is scoped to the **15 active counties**
- County spellings are standardized — `Murang'a`, `Murangá` → `Muranga`
- **Mentee IDs are validated**: 9 digits starting 1 or 7; `2547…`, `07…` normalized, bad IDs excluded

<!--
No more manual copy-paste, no stale facility lists, no malformed phone-number IDs
reaching the field.
-->

---

# Built-in quality checks — the safety net

Before anything reaches Kobo, the system verifies each form and **names the exact row** if something is wrong:

- No question pointing at an **empty list of choices**
- No **two questions sharing a name**
- No **broken score formulas** (mismatched brackets)
- Problems are caught **locally**, not at upload

<!--
This is the reassurance line for leadership: the difference between a 2-minute fix
with a row number and an afternoon lost to a cryptic Kobo rejection.
-->

---

# Smarter, self-correcting form generation

- Every facility gets its **own** question — even similarly named ones (`sagana_mentees`, `sagana_mentees_02`)
- Questions appear **only** for facilities that actually have eligible participants
- Skill scores validated to total correctly (**100% when all steps met**)
- Existing Kobo projects are **updated in place** — historical data and links preserved

<!--
"Updated in place" matters: we are not creating new projects each year, so submitted
data and shared form links keep working.
-->

---

# Knowledge tests: edited in a spreadsheet

- Knowledge tests change **every year**
- Questions, options, correct answers and scoring now live in **one sheet**
- Fill the sheet → run the pipeline → the form rebuilds itself
- The **score can't disagree** with the questions — it's generated from them

<!--
This removes engineering from the yearly cycle entirely. A programme lead edits a
spreadsheet; no code change, no developer.
-->

---

# Scheduled, hands-off deployment

- Runs automatically on a schedule — e.g. the **start of every new month**
- Weekly or daily options also available
- Forms stay continuously in sync with the databases, **zero manual effort**
- Set it once; it maintains itself

<!--
"Start of every new month" is concretely supported via the Apps Script trigger —
promise it plainly.
-->

---

# Impact & next steps

**Impact**
- Minutes instead of hours to refresh all forms
- Consistent, error-free deployments; one person manages the whole estate
- Fewer field errors from outdated or malformed forms

**Next steps**
- Enable the monthly auto-refresh
- Load this year's knowledge-test questions into the question bank
- Monitor the first automated run

<!--
Close by inviting the decision: switch on the monthly schedule and let it run.
-->
