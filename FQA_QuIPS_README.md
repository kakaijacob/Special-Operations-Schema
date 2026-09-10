# FQA QuIPS Linkage data pull

Google Apps Script project that pulls eight FQA/QuIPS Kobo forms from
`https://eu.kobotoolbox.org` and writes transformed rows into sheet tabs.

## Files (paste all of these into one Apps Script project)

| File | Role |
| --- | --- |
| `FQA_QuIPS_Config.js` | Maps, fetch, retries, sheet append helpers |
| `FQA_QuIPS_Newborn_Unit.js` | Newborn Unit transform |
| `FQA_QuIPS_Inpatient_Maternity.js` | Inpatient Maternity transform |
| `FQA_QuIPS_Outpatient.js` | Outpatient transform |
| `FQA_QuIPS_Lab.js` | Lab (dates + raw passthrough) |
| `FQA_QuIPS_Operating_Theatre.js` | Operating Theatre (dates + raw passthrough) |
| `FQA_QuIPS_Pharmacy.js` | Pharmacy (dates + raw passthrough) |
| `FQA_QuIPS_Central_Store.js` | Central Store (dates + raw passthrough) |
| `FQA_QuIPS_Facility_General.js` | Facility General (dates + raw passthrough) |
| `FQA_QuIPS_Orchestrator.js` | `FORM_CONFIG`, `pullAllForms`, `fullRefreshAllForms` |
| `FQA_QuIPS_Token.example.js` | Template for a local token override |

## Setup

1. Copy every `FQA_QuIPS_*.js` file into the spreadsheet's Apps Script project.
2. Set Script property `KOBO_API_TOKEN` (Project Settings → Script properties).
   Optionally copy `FQA_QuIPS_Token.example.js` to local `FQA_QuIPS_Token.js`
   (gitignored) and set `KOBO_API_TOKEN_OVERRIDE` there. Do not commit a token.
3. Run `pullAllForms` once to authorize.
4. Optionally run `createDailyTrigger` for a daily 6am incremental pull.
5. Use `fullRefreshAllForms` to wipe tabs and reload. Fetch/transform runs
   **before** the sheet is cleared so a failed pull does not wipe good data.

## Tests

```bash
node tests/fqa_quips_helpers.test.js
```


## Incremental refresh

Each run appends submissions whose `_uuid` is not already on the tab.
Newborn Unit and Inpatient Maternity keep unconsumed raw Kobo fields after
the transformed columns (`KEEP_UNTRANSFORMED_COLUMNS`). Flip those flags to
`false` when a form's transforms are finished.
