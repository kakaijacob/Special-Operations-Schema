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

5. **Seed the IDs** in `setupKoboDeployConfig()`: the form spreadsheet ID under
   `initialFormIds`, and the Kobo asset UID under `initialAssetUids`. Leave the
   asset UID out only if you want a brand new Kobo project created.

6. **Check before deploying**: run `checkAllKoboFormsForDeployProblems()`. It
   reports empty choice lists, duplicate names and unbalanced expressions for
   every tool, with the row numbers Kobo would use, without uploading anything.

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
