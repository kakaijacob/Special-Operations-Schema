# Building and deploying Kobo forms

How the pipeline fits together, how to add a new form, and the rules that came
out of real deployment failures. Read the rules section before writing a
builder — every one of them cost a failed deployment at least once.

## The pipeline

`refreshAllKoboTools()` in `Kobo_Tools_Orchestrator.js` is the only entry point.
A trigger or the **Kobo Tools** menu calls it; nothing else should be scheduled.

| Step | What happens | Where |
| --- | --- | --- |
| 0 | Lock, seed config, verify every file and the Kobo token | `Kobo_Tools_Orchestrator.js` |
| 1 | Copy Mentee Database 2026 → local `Mentee Database` | `syncMenteeDatabaseFromSource()` |
| 2 | Copy Mentor (IFM) Database 2026 → local `IFM List` | `syncIFMListFromSource()` |
| 3 | Turn the two local sheets into form content | `kobocreator.js` `generateAllOutputs()` |
| 4 | Build each form's `survey` / `choices` / `settings` tabs | one file per form |
| 5 | Validate, export xlsx, import to Kobo, deploy | `Kobo_Tools_Deployer.js` |

Only forms that build cleanly in step 4 are deployed in step 5, so one broken
form never blocks the others.

### Sync rules
- Rows with `Status = Inactive` are dropped from both local sheets.
- A Mentee ID is kept only when it is exactly nine digits and starts with `1`
  or `7`. An ID supplied as `2541xxxxxxxx` or `2547xxxxxxxx` loses the `254`
  first; an ID supplied as `01xxxxxxxx` or `07xxxxxxxx` loses the leading zero.
  The normalized nine-digit value is written locally. A leading `+` and visual
  spaces, hyphens or parentheses are ignored. Anything that remains the wrong
  length or starts with another digit is excluded entirely.
- The IFM list is restricted to the counties in
  `KOBO_TOOLS_ALLOWED_IFM_COUNTIES` and rewritten to canonical spellings.
- Mentee `Program` values of `EmONC Curriculum` become `MENTORS Curriculum`.

### What kobocreator produces
Builders never read the raw databases. They read these generated sheets:

| Sheet | Contains |
| --- | --- |
| `Variable Names` | one row per facility + program, with question name, type and relevance |
| `MoH Skills Assessment Checklist` | MENTORS mentee questions |
| `Curriculum Tracking Form` | MENTORS mentee questions, multi-select |
| `Survey Sheet (Newborn)` | newborn mentee questions |
| `Survey Sheet (IFM)` | IFM facility questions |
| `EmONC Mentees List (Choices)` | mentee choices, EmONC |
| `Newborn Mentees List (Choices)` | mentee choices, newborn |
| `IFM List (Choices)` | mentor choices |
| `All Facilities List (Choices)`, `EmONC Facilities List (Choices)` | facility choices per county |

Several of these are shared between forms. That sharing is useful but it is
also the source of Rule 5 below.

## Adding a new form

1. **Create the builder file**, `My_New_Form.js`, exposing one entry point:

   ```javascript
   function createMyNewForm() {
     return upsertMyNewForm_(SpreadsheetApp.getActiveSpreadsheet());
   }
   ```

   The entry point opens (or creates) the form spreadsheet, stores its ID in a
   Script Property, and overwrites the `survey`, `choices` and `settings` tabs.

2. **Build choices before survey**, then validate the survey against them:

   ```javascript
   var choiceRows = getMyNewFormChoiceRows_(sourceSs);
   var availableLists = koboKitCollectChoiceLists_(choiceRows);

   bodyRows = koboKitDropRowsWithMissingChoices_(
     bodyRows, availableLists, [7, 8, 9], "My New Form"
   );
   ```

   The helpers live in `Kobo_Form_Kit.js`. The array is the indexes of your
   expression columns (`relevant`, `choice_filter`, `calculation`, …), which
   differ per form because the column layouts differ.

3. **Grow the grid before writing**, or a large form fails mid-write:

   ```javascript
   koboKitEnsureSheetCapacity_(sheet, rows.length, rows[0].length);
   ```

4. **Register the tool** in two places, using the same `buildFnName`:
   - `getKoboToolsRegistry_()` in `Kobo_Tools_Orchestrator.js` — build order
   - `getKoboDeployToolsRegistry_()` in `Kobo_Tools_Deployer.js` — deployment

5. **Store the IDs as secrets**, not in source. Use **Kobo Tools → Secrets →
   Set asset UID…** (and Script Properties for the form spreadsheet ID). See
   `KOBO_SECRETS.md`. Leave the asset UID unset only if you want a brand new
   Kobo project created.

6. **Check before deploying**: run `checkAllKoboFormsForDeployProblems()`. It
   reports empty choice lists, duplicate names and unbalanced expressions for
   every tool, with the row numbers Kobo would use, without uploading anything.

## Changing the knowledge tests each year

Knowledge assessment questions are edited in a spreadsheet, not in code. Each
question used to live in three places that had to agree — the survey row, the
choices block, and the score formula with its item count — which is how a score
ends up dividing by the wrong number. The question bank generates all three
from one sheet.

1. Create the sheet once, from the Apps Script editor:

   ```javascript
   createKoboQuestionBankTemplate("EmONC Question Bank");    // EmONC assessment
   createKoboQuestionBankTemplate("Newborn Question Bank");  // Newborn assessment
   ```

2. Fill it in. One row per question:

   | Question ID | Question | Type | Option A | Option B | Option C | Option D | Correct | Required | Hint |
   | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
   | `amtsl_uterotonic_drug` | 1. Which uterotonic during AMTSL? | select_one | IM Carboprost | Oxytocin 10 IU IM | Misoprostol | Carbetocin | B | true | |
   | `pph_causes` | 2. Which two are causes of PPH? | select_multiple | Uterine atony | Retained placenta | Anaemia | Hypertension | A,B | true | Pick two |
   | `comments` | 3. Any comments? | text | | | | | | false | |

3. Run `refreshAllKoboTools()`. The form is rebuilt and deployed.

What the bank does for you:
- **Score.** Built from the questions that carry a `Correct` answer, so the
  divisor always equals the number of scored questions and a perfect paper is
  exactly 100. Questions with no `Correct` (free text, or a question you want
  asked but not marked) are excluded and logged.
- **Choices.** A single right answer is stored as `Correct`, matching what the
  assessments already collect, so this year's exports line up with previous
  years. A `select_multiple` with several right answers stores option letters
  instead, because two options both named `Correct` would be a duplicate
  choice. Scoring then requires exactly the right set to be ticked.
- **Checks.** A duplicate Question ID, a `Correct` letter with no matching
  option, a `select_one` with two right answers, or a select with fewer than
  two options all stop the build with the sheet row named.

Keep a Question ID unchanged between years to keep that question comparable
over time; changing it starts a new column in your exports. Option letters are
positional, so reordering options changes what `Correct` refers to — move the
letter too.

While a question bank sheet is missing or empty, the assessment keeps using the
questions written in its builder, so nothing changes until you fill one in.
Question IDs keep underscores and capitalisation exactly as typed; note that
`cleanForKobo()` is for place names and strips underscores, so it is the wrong
tool for a field name.

## The rules

Each rule exists because ignoring it broke a live deployment.

### 1. Every select must have choices
**Symptom:** `[row : 327] List name not in choices sheet: kanyakine_mentees` —
Kobo rejects the whole form.

A question was generated for a facility whose choice list came out empty,
because the question and the choices were produced by different filters. Build
both from one resolved set of records, and drop any question whose list is
empty. When you drop a question, replace `${that_question}` in the remaining
expressions with `''` — leaving the reference behind only trades one deploy
error for another.

### 2. Question names must be unique
**Symptom:** `Duplicate question name: sagana_mentees`.

Facility names are shortened to one or two words, so different facilities
collapse onto the same name. Allocate one name per facility code: the first
keeps the plain name, later ones get `_02`, `_03`. Never key this on the
facility name — two facilities can share a name and differ by code.

### 3. Field names must be plain ASCII
**Symptom:** `There has been a problem trying to replace ${murangá_facilities}
with the XPath to the survey element named 'murangá_facilities'`.

County and facility names are typed by hand: `Murang'a`, `Murangá` and
`Muranga` all occur. Always build variable names through `cleanForKobo()`,
which drops apostrophes and folds accents. Never lowercase a name yourself —
that is exactly how the bad reference got in.

### 4. Expressions must be balanced
**Symptom:** ODK Validate: `Mismatched brackets or parentheses in expression`.

Watch the score pattern. On one line the third parenthesis belongs to the first
item and is correct:

```javascript
"round(((${a}='yes')+(${b}='yes'))*100 div 2,0)"
```

Split across lines it must open only two, because the item opens its own:

```javascript
"round((" +
"(${a}='yes')+" +
"(${b}='yes')" +
")*100 div 2)";
```

The deployer balance-checks every expression before upload, ignoring
parentheses inside quoted text.

### 5. Imported relevance must match this form's choices
**Symptom:** a section never opens, with no error anywhere.

`Survey Sheet (Newborn)` carries `and (${program} = 'newborn_curriculum')`,
which is right for the MoH checklist. The Newborn tracking form's `program`
question offers `essential_newborn_care` / `comprehensive_newborn_care`, so the
clause was never true, the mentee questions never appeared, and the calculate
that gates Section 2 stayed empty. When you import rows from a shared sheet,
rewrite any clause that references a question **your** form defines
differently.

### 6. Only ask about facilities that have people
A facility with no active mentee (or no mentee carrying an ID and a name)
should get no question at all. This is what keeps Rule 1 from recurring.

### 7. Resolve people per posting, last row wins
A person is identified by ID + Facility Code, not by ID alone. The last row for
a posting is the current one, so someone reactivated and later deactivated
counts as inactive. Normalise `Program` and `Status` before comparing —
`"Both"`, `"both "` and `"BOTH"` all appear.

### 8. Flush before exporting
Sheets writes are buffered. `SpreadsheetApp.flush()` runs before the Drive
export so the uploaded xlsx cannot be one build behind.

### 9. Notes are not scorable
A `note` can never hold `'yes'`, so including one in a score sum adds nothing.
Check that a score's divisor equals the number of real scored questions and
that a perfect run reaches exactly 100.

### 10. One global namespace
Every `.js` file is loaded into the same Apps Script project, so two functions
with one name silently collide and the last definition wins. Prefix helpers per
form (`getMoHSAC…`, `getNewbornCTF…`) or use the shared `koboKit…` helpers.
`kobocreator.js` once defined `cleanForKobo()` twice with different behaviour,
which made it easy to fix the copy that never ran.

### 12. Normalize Program before filtering facilities into a county list
**Symptom:** a county select is missing facilities that are correctly mapped to
that county in the database.

`Program` is typed by hand, so `MENTORS Curriculum`, `Mentors Curriculum`,
`MENTORS Curriculum ` and `both` all occur. A strict `program === "MENTORS
Curriculum"` filter drops every variant, and those facilities never appear
under their county in Kobo even though the sheet maps them correctly. Compare
`String(program).trim().toLowerCase()` against `"mentors curriculum"` /
`"newborn curriculum"` / `"both"`, the same way the mentee resolver does. This
is Rule 7 applied to facilities. (A facility whose only program is the *other*
curriculum is still correctly excluded — an EmONC form does not list a
newborn-only facility.)

### 11. Aggregate facility eligibility across every source row
**Symptom:** a facility with MENTORS and Newborn mentees appears in
`All Facilities List (Choices)` with only
`mentors_curriculum,ifm_assessment,tot`.

A facility appears once per mentee in the source, so the first source row is
not the facility's complete programme eligibility. Group rows by Facility Code
first, union every supported `Program`, and only then write the one facility
choice. If both programmes occur — whether on separate rows or as `Both` — the
output `Program` is `Both` and `allowed` includes both curricula. Never mark a
facility as processed before its programme rows have been aggregated.

## Testing without Apps Script

Every fix in this pipeline was verified offline first. Run a builder under
Node by supplying a fake Spreadsheet service — an object with
`getSheetByName`, `insertSheet`, `getDataRange().getValues()` and a `getRange`
that records `setValues`. Then assert on the generated tabs:

- every `select_one` / `select_multiple` list appears in `choices`
- no question name repeats
- every expression's brackets balance
- `begin_group` / `end_group` nest to zero

You can go further and simulate filling the form: evaluate each row's
`relevant`, blank the value of any question whose relevance is false (ODK does
this), recompute the `calculate` rows, and check the section you expect to open
actually opens. That is how the Newborn Section 2 fault was found and proved
fixed.

Always run the same check against the previous commit. If it does not fail
there, it is not testing what you think.

## Deploying

- `refreshAllKoboTools()` — the whole pipeline.
- `checkAllKoboFormsForDeployProblems()` — validate every form, deploy nothing.
- `deployKoboTool("moh_sac", true)` — rebuild and deploy a single tool.
- `testKoboConnection()` — confirm the server and token.

Kobo lives at `https://eu.kobotoolbox.org`. The old
`kf.humanitarianresponse.info` host was retired and shows up in Apps Script as
"Address unavailable".

The files are pasted into Apps Script by hand, so the preflight fails with the
file name when a copy is older than the pipeline expects. If you add a fix that
later code depends on, add its function to
`validateKoboPipelineFileRevisions_()`.
