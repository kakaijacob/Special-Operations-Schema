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
| `FQA_QuIPS_Operating_Theatre.js` | Operating Theatre transform |
| `FQA_QuIPS_Pharmacy.js` | Pharmacy (dates + raw passthrough) |
| `FQA_QuIPS_Central_Store.js` | Central Store (dates + raw passthrough) |
| `FQA_QuIPS_Facility_General.js` | Facility General (dates + raw passthrough) |
| `FQA_QuIPS_Orchestrator.js` | `FORM_CONFIG`, `pullAllForms`, `fullRefreshAllForms`, then Scores; insight linkage is separate (`runFqaQuipsInsightLinkage`) |
| `FQA_QuIPS_Weighting.js` | Builds the `FQA Weighting` score catalog sheet |
| `FQA_QuIPS_Scores.js` | Builds the long-format `FQA Scores` totalling sheet |
| `FQA_QuIPS_Insight_Crosswalk.js` | QuIPS observation ↔ FQA resource/protocol theme map + classifiers |
| `FQA_QuIPS_Insight_Linkage.js` | Joins QuIPS Cleaned Data with FQA Scores (department tabs optional detail) |
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
6. Run `writeFqaWeightingSheet` on its own to create or refresh the
   `FQA Weighting` catalog (`Department/KOBO tool`, `variable`, `response`,
   `label`, `score`). Yes/No labels default to 1/0; other labels leave
   `score` blank so you can fill them in later. Re-running keeps scores
   already typed on that sheet. The orchestrator does not rebuild it.
7. After `FQA Scores` is available, run `writeFqaQuipsInsightLinkage`.
   QuIPS cleaned data is read from a local `QuIPS Cleaned Data` tab if
   present; otherwise from the QuIPS workbook
   `1CjK8cfDVR_Bb6rny4n_SYW2F6Ltx8kHRzP0A92bJtd4` (gid `1114469965`).
   The first run must authorize access to that spreadsheet. This builds:
   - `FQA-QuIPS Crosswalk` — catalog of QuIPS delivery observations linked
     to FQA resources / protocols / training (e.g. hand hygiene practice
     ↔ WASH supplies, handwashing SOP, IPC training)
   - `FQA-QuIPS Facility Insights` — facility × theme rows with QuIPS
     practice rate, FQA readiness, and an insight quadrant:
     Enabled & practiced / Practice gap / Adaptive practice / Structural gap
   - `FQA-QuIPS Insight Summary` — theme-level counts of those quadrants  
   **Required sources:** QuIPS cleaned data (local tab or linked workbook)
   + `FQA Scores` (join on `facility_code`; facility identity and readiness
   come from Scores).
   **Optional detail:** `Inpatient Maternity`, `Facility General`, and
   `Newborn Unit` — when present, categorical responses overlay Scores for
   richer enabler/gap text. Themes cover hand hygiene, PPE, uterotonics,
   newborn resuscitation readiness, essential newborn care, infection
   prevention, maternal monitoring, labour monitoring, respectful care,
   and avoidance of harmful practices.
8. `pullAllForms` and `fullRefreshAllForms` both finish by running
   `writeFqaScoreTable`. The `FQA Scores` sheet is the totalling table:
   `county`, `subcounty`, `facility`, `facility_code`, `facility_level`,
   `department`, `thematic_area`, `hss_building_block`, `attribute`,
   `attribute_name`, `score`. It reads scores from the existing FQA
   Weighting sheet. Missing `facility_code` and `subcounty` are filled
   from the facility master spreadsheet when county, `level` (same as
   `facility_level`), and a fuzzy facility-name match all agree. The
   master code column is `dhis_code`. The first run must authorize
   access to that spreadsheet. Newborn Unit commodity columns get
   `thematic_area` = Commodities, equipment columns get Equipment, and
   adherence columns get Adherence to evidence based practice, and
   records columns get Health Records for clients, and hours of
   operation columns get Hours of operation, and infrastructure
   columns get Infrastructure, privacy columns get
   Privacy/confidentiality, SOP columns get Standard operating
   procedures/Protocols, WASH/IPC columns get WASH (Water,
   Sanitation, Hygeine)/IPC, service columns get Services offered,
   and HRH columns get HRH. Central Store records, commodities,
   hours, equipment, infrastructure, SOP, and WASH/IPC columns use
   those same `thematic_area` labels. Inpatient Maternity and Lab
   groupings use the same `thematic_area` labels. Operating Theatre
   adherence dests also fill `hss_building_block` (Leadership &
   Governance) and `attribute_name`. Operating Theatre commodity
   dests fill `thematic_area` and `hss_building_block` as Commodities
   plus the provided `attribute_name` labels. Operating Theatre
   equipment dests fill those same columns as Equipment. Operating
   Theatre records dests fill `thematic_area` as Health Records for
   clients, `hss_building_block` as Health Information System, and
   the provided `attribute_name` labels. `hrs_day` fills Hours of
   operation / Service Delivery / OT accessibility. Operating
   Theatre HRH dests fill HRH / Human Resource for Health and the
   provided `attribute_name` labels. Operating Theatre
   infrastructure dests fill Infrastructure and the provided
   `attribute_name` labels. Operating Theatre privacy dests fill
   Privacy/confidentiality / Service Delivery (`files_storage` →
   `files_sec`). Operating Theatre service dests fill Services
   offered / Service Delivery. Operating Theatre SOP dests fill
   Standard operating procedures/Protocols / Leadership &
   Governance. Operating Theatre training dests fill Training /
   Human Resource for Health. Operating Theatre WASH dests from
   `OT_WASH_FIELDS` fill WASH (Water, Sanitation, Hygeine)/IPC /
   Service Delivery (`gender_sep` → `gender_seperation`;
   `specify_latrine` is text). Facility General adherence dests
   (`uniforms_badges`, `pest_control`) fill Adherence to evidence
   based practice / Leadership & Governance. Facility General
   `run_out_fuel` fills Commodities / Commodities. Facility General
   records dests fill Health Records for clients / Health
   Information System (`secure_registers` parent is not a dest).
   Facility General `opening_hours` fills Hours of operation /
   Service Delivery. Facility General HRH, infrastructure,
   national-data, service, and WASH dests fill those same three
   columns (`facility_staff3`, `sec_electricity`,
   `security_measures6`, `housekeeping`, `record`, `systems_place`,
   `sterlization_place`, and `oth_source` parents are not dests).
   Pharmacy dests fill `thematic_area`, `hss_building_block`, and
   `attribute_name` (`dda_used` stays Health Records;
   `wall_clock` stays Infrastructure; `units_*` leftovers stay
   blank). Newborn Unit dests now fill those same three columns,
   including Training year-month dests (`hypothermia` and
   `*_score` columns are not dests). Select-multiple parents and
   listed count names are not dests. `patient_files` dests follow
   form choice codes, not the listed /1 remumbering. Leftovers
   stay blank: `functional_nbu`, `newborn_admissions`,
   `sharp3_4full`. Inpatient Maternity dests now fill those same
   three columns. Parent counts, `pphkits`, `pre_eclampia`, HRH
   `.1` scores, and `eid` are not dests. Leftovers stay blank:
   `functional_maternity_unit`, `privacy_beds`,
   `labour_ward_beds`, `training_abortion_care`,
   `understand_service`. Outpatient dests now fill those same
   three columns, including Training year-month dests.
   Select-multiple parents and listed count names are not dests.
   `patient_id` → `patient_identification`; `referral` →
   `referral_mechanism`; `hemocue` → `haemoglobinometer`
   (Infrastructure). Training `.1` columns are not dests.
   Leftovers stay blank: `unit`, `admission`,
   `foetal_nonstress`, `services_via`, `infant_chart`,
   `urine_glucose`, `vitamin_c_available`, `dipstick_urine`,
   `training_date_crh`, `comments`, `data_quality`. Lab dests
   now fill those same three columns, including Infrastructure.
   Select-multiple parents and listed count names are not dests.
   `incl_lab_report` → `tincl_lab_report_*`;
   `blood_product_labels` → `tblood_product_labels_*`;
   `abo_blood` → `blood_group_testing`; `via_test` →
   `perform_via`; `serum_elecrolyete` → `serum_electrolyete`.
   `crossmatch_register`, `tb_register`, `county_technologist`,
   `contract_technologist`, `dipstick_param`, `eid_hiv`,
   `sample_viral`, `pap_smear_referral`, and `sop_total` are
   not dests. Leftovers stay blank: `have_quality_manual`,
   `units`. Other `thematic_area` values,
   `hss_building_block`, and `attribute_name` stay blank until
   those labels are added. You can still run
   `writeFqaScoreTable` on its own.

## Tests

```bash
node tests/fqa_quips_helpers.test.js
```


## Incremental refresh

Each run appends submissions whose `_uuid` is not already on the tab.
Newborn Unit and Inpatient Maternity keep unconsumed raw Kobo fields after
the transformed columns (`KEEP_UNTRANSFORMED_COLUMNS`). Flip those flags to
`false` when a form's transforms are finished.
