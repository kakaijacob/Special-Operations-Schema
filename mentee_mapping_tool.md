# Mentee Mapping Tool (Kobo)

Facility-led Kobo form for **maternity nurse incharges** to **activate**, **deactivate**, or **reactivate** mentees at their facility.

One mentee per submission. Repeat the form for additional mentees.

**Form title:** Mentee Mapping Tool  
**Form ID:** `mentee_mapping_tool`  
**Version:** 2026.04.01

---

# SECTION A — Welcome & role

---

### Q1. Intro note
| | |
|--|--|
| **Type** | `note` |
| **Name** | `intro_note` |
| **Label** | Mentee Mapping Tool |
| **Hint** | For maternity nurse incharges. Use this form to activate a new mentee, deactivate a mentee who has left or stopped, or reactivate a previously deactivated mentee at your facility. |

---

### Q2. Are you the maternity nurse incharge?
| | |
|--|--|
| **Type** | `select_one yes_no` |
| **Name** | `confirm_incharge` |
| **Label** | Are you the maternity nurse incharge (or designated maternity lead) for this facility? |
| **Required** | Yes |
| **Choices** | `yes` = Yes · `no` = No |

**If No** → show stop note (Q3) and end. No further questions.

---

### Q3. Stop — not authorized *(only if Q2 = No)*
| | |
|--|--|
| **Type** | `note` |
| **Name** | `stop_not_incharge` |
| **Relevant** | `${confirm_incharge} = 'no'` |
| **Label** | This tool is for the maternity nurse incharge or designated maternity lead only. Please hand the device to the incharge, or exit without submitting. |

---

# SECTION B — Facility context

*Shown only when Q2 = Yes.*

---

### Q4. County
| | |
|--|--|
| **Type** | `select_one counties` |
| **Name** | `county` |
| **Label** | County |
| **Required** | Yes |
| **Relevant** | `${confirm_incharge} = 'yes'` |
| **Appearance** | `minimal` or search |
| **Choices** | From master facilities list (e.g. Kakamega, …) |

---

### Q5. Facility
| | |
|--|--|
| **Type** | `select_one facilities` |
| **Name** | `facility` |
| **Label** | Facility |
| **Required** | Yes |
| **Relevant** | `${confirm_incharge} = 'yes'` |
| **Choice filter** | `county = ${county}` |
| **Appearance** | search |
| **Example** | Malava Sub County Hospital |

---

### Q6. Facility Code (DHIS)
| | |
|--|--|
| **Type** | `calculate` *(preferred)* or `text` |
| **Name** | `facility_code` |
| **Label** | Facility Code |
| **Required** | Yes (if text) |
| **Constraint** | `regex(., '^\d{1,5}$')` |
| **Constraint message** | Facility Code must be up to 5 digits. |
| **Hint** | Prefer auto-fill from the selected facility (e.g. Malava → `15996`). |

---

### Q7. Facility confirmation note
| | |
|--|--|
| **Type** | `note` |
| **Name** | `facility_confirm` |
| **Label** | You are mapping mentees for: **${facility}** (Code ${facility_code}), ${county}. |

---

# SECTION C — Mapping action

---

### Q8. What do you want to do?
| | |
|--|--|
| **Type** | `select_one mapping_action` |
| **Name** | `mapping_action` |
| **Label** | What do you want to do for this mentee? |
| **Required** | Yes |
| **Relevant** | `${confirm_incharge} = 'yes'` |
| **Choices** | |

| name | label |
|------|-------|
| `activate` | Activate a new mentee |
| `deactivate` | Deactivate an existing mentee |
| `reactivate` | Reactivate a deactivated mentee |

→ **Activate** opens Section D  
→ **Deactivate** opens Section E  
→ **Reactivate** opens Section F  

---

# SECTION D — Activate a new mentee

*Shown only when Q8 = Activate.*

---

### Q9. Section note — Activate
| | |
|--|--|
| **Type** | `note` |
| **Name** | `activate_note` |
| **Relevant** | `${mapping_action} = 'activate'` |
| **Label** | Enter details for the mentee you are activating at this facility. |

---

### Q10. Name
| | |
|--|--|
| **Type** | `text` |
| **Name** | `mentee_name` |
| **Label** | Name |
| **Required** | Yes |
| **Relevant** | `${mapping_action} = 'activate'` |
| **Hint** | Full name as on the maternity duty roster. |
| **Example** | Geofrey Njebeli |

---

### Q11. Mentee ID
| | |
|--|--|
| **Type** | `text` |
| **Name** | `mentee_id` |
| **Label** | Mentee ID |
| **Required** | Yes |
| **Relevant** | `${mapping_action} = 'activate'` |
| **Hint** | Usually the mentee’s primary phone number. Enter 9 digits starting with 1 or 7. Do not include country code (254) or leading zero. |
| **Constraint** | `regex(., '^[17]\d{8}$')` |
| **Constraint message** | Mentee ID must be 9 digits starting with 1 or 7. |
| **Example** | 705367519 |

---

### Q12. WhatsApp phone number
| | |
|--|--|
| **Type** | `text` |
| **Name** | `phone_number_whatsapp` |
| **Label** | WhatsApp phone number |
| **Required** | Yes **if** Learning Mode will be Hybrid (Both); otherwise optional |
| **Relevant** | `${mapping_action} = 'activate'` |
| **Hint** | Same format as Mentee ID when provided. Leave blank if the mentee has no WhatsApp. Required if the mentee will learn both in-person and via DELTA. |
| **Constraint** | `regex(., '^[17]\d{8}$')` *(when not blank)* |
| **Constraint message** | WhatsApp number must be 9 digits starting with 1 or 7. |
| **Example** | 705367519 |

---

### Q13. Cadre
| | |
|--|--|
| **Type** | `select_one cadre` |
| **Name** | `cadre` |
| **Label** | Cadre |
| **Required** | Yes |
| **Relevant** | `${mapping_action} = 'activate'` |
| **Choices** | |

| name | label |
|------|-------|
| `nurse` | Nurse |
| `midwife` | Midwife |
| `clinical_officer` | Clinical Officer |
| `other` | Other |

---

### Q14. Gender
| | |
|--|--|
| **Type** | `select_one gender` |
| **Name** | `gender` |
| **Label** | Gender |
| **Required** | Yes |
| **Relevant** | `${mapping_action} = 'activate'` |
| **Choices** | |

| name | label |
|------|-------|
| `male` | Male |
| `female` | Female |

---

### Q15. New or Existing?
| | |
|--|--|
| **Type** | `select_one new_existing` |
| **Name** | `new_or_existing` |
| **Label** | New or Existing? |
| **Required** | Yes |
| **Relevant** | `${mapping_action} = 'activate'` |
| **Hint** | New = joining mentorship for the first time. Existing = previously known to the program. |
| **Choices** | |

| name | label |
|------|-------|
| `new` | New |
| `existing` | Existing |

---

### Q16. Date Activated
| | |
|--|--|
| **Type** | `date` |
| **Name** | `date_activated` |
| **Label** | Date Activated |
| **Required** | Yes |
| **Relevant** | `${mapping_action} = 'activate'` |
| **Default** | today |
| **Constraint** | `. <= today()` |
| **Constraint message** | Date Activated cannot be in the future. |
| **Example** | 2026-04-01 |

---

### Q17. Program
| | |
|--|--|
| **Type** | `select_one program` |
| **Name** | `program` |
| **Label** | Program |
| **Required** | Yes |
| **Relevant** | `${mapping_action} = 'activate'` |
| **Choices** | |

| name | label |
|------|-------|
| `emonc_curriculum` | EmONC Curriculum |
| `newborn_curriculum` | Newborn Curriculum |
| `both` | Both |
| `other` | Other |

---

### Q18. Group note — Curriculum / modality
| | |
|--|--|
| **Type** | `begin_group` |
| **Name** | `curriculum_flags` |
| **Label** | Curriculum and learning modality |
| **Relevant** | `${mapping_action} = 'activate'` |
| **Hint** | Answer Yes or No for each. These drive Learning Mode and must match the Program selected above. |

---

### Q19. EmONC In-person
| | |
|--|--|
| **Type** | `select_one yes_no` |
| **Name** | `emonc_inperson` |
| **Label** | EmONC In-person |
| **Required** | Yes |
| **Relevant** | `${mapping_action} = 'activate'` |
| **Choices** | `yes` = Yes · `no` = No |

---

### Q20. EmONC DELTA
| | |
|--|--|
| **Type** | `select_one yes_no` |
| **Name** | `emonc_delta` |
| **Label** | EmONC DELTA |
| **Required** | Yes |
| **Relevant** | `${mapping_action} = 'activate'` |
| **Choices** | `yes` = Yes · `no` = No |

---

### Q21. Essential Newborn In-person
| | |
|--|--|
| **Type** | `select_one yes_no` |
| **Name** | `essential_nb_inperson` |
| **Label** | Essential Newborn In-person |
| **Required** | Yes |
| **Relevant** | `${mapping_action} = 'activate'` |
| **Choices** | `yes` = Yes · `no` = No |

---

### Q22. Essential Newborn DELTA
| | |
|--|--|
| **Type** | `select_one yes_no` |
| **Name** | `essential_nb_delta` |
| **Label** | Essential Newborn DELTA |
| **Required** | Yes |
| **Relevant** | `${mapping_action} = 'activate'` |
| **Choices** | `yes` = Yes · `no` = No |

---

### Q23. Comprehensive Newborn In-person
| | |
|--|--|
| **Type** | `select_one yes_no` |
| **Name** | `comprehensive_nb_inperson` |
| **Label** | Comprehensive Newborn In-person |
| **Required** | Yes |
| **Relevant** | `${mapping_action} = 'activate'` |
| **Choices** | `yes` = Yes · `no` = No |

---

### Q24. Continuum of Care
| | |
|--|--|
| **Type** | `select_one yes_no` |
| **Name** | `continuum_of_care` |
| **Label** | Continuum of Care |
| **Required** | Yes |
| **Relevant** | `${mapping_action} = 'activate'` |
| **Choices** | `yes` = Yes · `no` = No |

---

### Q25. Safe Surgery
| | |
|--|--|
| **Type** | `select_one yes_no` |
| **Name** | `safe_surgery` |
| **Label** | Safe Surgery |
| **Required** | Yes |
| **Relevant** | `${mapping_action} = 'activate'` |
| **Choices** | `yes` = Yes · `no` = No |

---

### Q26. OPOCUS
| | |
|--|--|
| **Type** | `select_one yes_no` |
| **Name** | `opocus` |
| **Label** | OPOCUS |
| **Required** | Yes |
| **Relevant** | `${mapping_action} = 'activate'` |
| **Choices** | `yes` = Yes · `no` = No |

---

### Q27. End group — Curriculum / modality
| | |
|--|--|
| **Type** | `end_group` |
| **Name** | `curriculum_flags` |

**Program ↔ flag rules (enforce with constraints):**

| If Program is… | Then |
|----------------|------|
| EmONC Curriculum | EmONC In-person = Yes; Essential Newborn In-person = No; Comprehensive Newborn In-person = No |
| Newborn Curriculum | EmONC In-person = No; at least one of Essential or Comprehensive Newborn In-person = Yes |
| Both | EmONC In-person = Yes **and** at least one newborn in-person = Yes |
| Other | EmONC / Essential / Comprehensive In-person all = No |

---

### Q28. Learning Mode *(calculated — read only)*
| | |
|--|--|
| **Type** | `calculate` + `note` to display |
| **Name** | `learning_mode` |
| **Label** | Learning Mode |
| **Relevant** | `${mapping_action} = 'activate'` |
| **Calculation** | |

| Any in-person* Yes? | Any DELTA** Yes? | Result |
|---------------------|------------------|--------|
| Yes | Yes | `Hybrid (Both)` |
| Yes | No | `In-person Only` |
| No | Yes | `Virtually (DELTA)` |
| No | No | *(blank — review)* |

\* EmONC / Essential Newborn / Comprehensive Newborn In-person  
\*\* EmONC DELTA / Essential Newborn DELTA  

If result = `Hybrid (Both)` and WhatsApp (Q12) is blank → block submit.

---

### Q29. Status *(calculated)*
| | |
|--|--|
| **Type** | `calculate` |
| **Name** | `status` |
| **Label** | Status |
| **Relevant** | `${mapping_action} = 'activate'` |
| **Calculation** | `'Eligible'` |

---

# SECTION E — Deactivate an existing mentee

*Shown only when Q8 = Deactivate.*

---

### Q30. Section note — Deactivate
| | |
|--|--|
| **Type** | `note` |
| **Name** | `deactivate_note` |
| **Relevant** | `${mapping_action} = 'deactivate'` |
| **Label** | Select an Eligible mentee at this facility to deactivate. They will become Ineligible and drop off active Kobo mentee lists. |

---

### Q31. Select mentee
| | |
|--|--|
| **Type** | `select_one facility_mentees` |
| **Name** | `mentee_select` |
| **Label** | Select mentee to deactivate |
| **Required** | Yes |
| **Relevant** | `${mapping_action} = 'deactivate'` |
| **Choice filter** | Facility Code = `${facility_code}` **and** Status = Eligible |
| **Appearance** | search |
| **Choice format** | name = Mentee ID · label = `Name (Mentee ID)` |
| **Example label** | Geofrey Njebeli (705367519) |

---

### Q32. Selected mentee confirmation
| | |
|--|--|
| **Type** | `note` |
| **Name** | `mentee_selected_note` |
| **Relevant** | `${mapping_action} = 'deactivate'` |
| **Label** | You selected: **${mentee_select}** at ${facility}. |

---

### Q33. Date Deactivated
| | |
|--|--|
| **Type** | `date` |
| **Name** | `date_deactivated` |
| **Label** | Date Deactivated |
| **Required** | Yes |
| **Relevant** | `${mapping_action} = 'deactivate'` |
| **Default** | today |
| **Constraint** | `. <= today()` *(and ≥ Date Activated when known from mentee record)* |
| **Constraint message** | Date Deactivated cannot be in the future (or earlier than Date Activated). |

---

### Q34. Reason for Deactivation
| | |
|--|--|
| **Type** | `select_one deactivation_reason` |
| **Name** | `reason_for_deactivation` |
| **Label** | Reason for Deactivation |
| **Required** | Yes |
| **Relevant** | `${mapping_action} = 'deactivate'` |
| **Choices** | |

| name | label |
|------|-------|
| `transfer` | Transfer to another facility |
| `promotion` | Promotion / role change |
| `retirement` | Retirement |
| `resignation` | Resignation / left service |
| `non_participation` | Lack of participation |
| `leave` | Extended leave |
| `deceased` | Deceased |
| `other` | Other |

---

### Q35. Specify other reason *(only if Q34 = Other)*
| | |
|--|--|
| **Type** | `text` |
| **Name** | `reason_other` |
| **Label** | Please specify the reason for deactivation |
| **Required** | Yes |
| **Relevant** | `${mapping_action} = 'deactivate' and ${reason_for_deactivation} = 'other'` |

---

### Q36. Status after deactivate *(calculated)*
| | |
|--|--|
| **Type** | `calculate` |
| **Name** | `status_deactivate` |
| **Label** | Status |
| **Relevant** | `${mapping_action} = 'deactivate'` |
| **Calculation** | `'Ineligible'` |

---

# SECTION F — Reactivate a deactivated mentee

*Shown only when Q8 = Reactivate.*

---

### Q37. Section note — Reactivate
| | |
|--|--|
| **Type** | `note` |
| **Name** | `reactivate_note` |
| **Relevant** | `${mapping_action} = 'reactivate'` |
| **Label** | Select an Ineligible (deactivated) mentee at this facility to bring them back as Eligible. |

---

### Q38. Select deactivated mentee
| | |
|--|--|
| **Type** | `select_one facility_mentees_inactive` |
| **Name** | `mentee_select_inactive` |
| **Label** | Select mentee to reactivate |
| **Required** | Yes |
| **Relevant** | `${mapping_action} = 'reactivate'` |
| **Choice filter** | Facility Code = `${facility_code}` **and** Status = Ineligible |
| **Appearance** | search |
| **Choice format** | name = Mentee ID · label = `Name (Mentee ID)` |

---

### Q39. Selected mentee confirmation
| | |
|--|--|
| **Type** | `note` |
| **Name** | `mentee_reactivate_note` |
| **Relevant** | `${mapping_action} = 'reactivate'` |
| **Label** | You selected: **${mentee_select_inactive}** at ${facility}. |

---

### Q40. Date Reactivated
| | |
|--|--|
| **Type** | `date` |
| **Name** | `date_reactivated` |
| **Label** | Date Reactivated |
| **Required** | Yes |
| **Relevant** | `${mapping_action} = 'reactivate'` |
| **Default** | today |
| **Constraint** | `. <= today()` *(and ≥ Date Deactivated when known)* |
| **Constraint message** | Date Reactivated cannot be in the future (or earlier than Date Deactivated). |

---

### Q41. WhatsApp phone number (update if changed)
| | |
|--|--|
| **Type** | `text` |
| **Name** | `phone_number_whatsapp_update` |
| **Label** | WhatsApp phone number (update if changed) |
| **Required** | No *(Yes if Learning Mode becomes Hybrid after refresh)* |
| **Relevant** | `${mapping_action} = 'reactivate'` |
| **Hint** | Leave blank to keep the existing number. If entered, use 9 digits starting with 1 or 7. |
| **Constraint** | `regex(., '^[17]\d{8}$')` *(when not blank)* |

---

### Q42. Update program / curriculum flags?
| | |
|--|--|
| **Type** | `select_one yes_no` |
| **Name** | `refresh_program` |
| **Label** | Do you need to update this mentee’s Program or curriculum flags? |
| **Required** | Yes |
| **Relevant** | `${mapping_action} = 'reactivate'` |
| **Choices** | `yes` = Yes · `no` = No |

**If No** → skip to Q54 (Status).  
**If Yes** → ask Q43–Q53 (same as Activate program + curriculum block).

---

### Q43. Program *(reactivate refresh)*
| | |
|--|--|
| **Type** | `select_one program` |
| **Name** | `program_refresh` |
| **Label** | Program |
| **Required** | Yes |
| **Relevant** | `${mapping_action} = 'reactivate' and ${refresh_program} = 'yes'` |
| **Choices** | Same as Q17 |

---

### Q44–Q51. Curriculum flags *(reactivate refresh)*

Same questions as **Q19–Q26**, with names suffixed `_refresh` and relevant when  
`${mapping_action} = 'reactivate' and ${refresh_program} = 'yes'`:

| # | Name | Label |
|---|------|-------|
| Q44 | `emonc_inperson_refresh` | EmONC In-person |
| Q45 | `emonc_delta_refresh` | EmONC DELTA |
| Q46 | `essential_nb_inperson_refresh` | Essential Newborn In-person |
| Q47 | `essential_nb_delta_refresh` | Essential Newborn DELTA |
| Q48 | `comprehensive_nb_inperson_refresh` | Comprehensive Newborn In-person |
| Q49 | `continuum_of_care_refresh` | Continuum of Care |
| Q50 | `safe_surgery_refresh` | Safe Surgery |
| Q51 | `opocus_refresh` | OPOCUS |

Each: `select_one yes_no`, Required = Yes. Same Program ↔ flag rules as Activate.

---

### Q52. Learning Mode *(calculated on refresh)*
| | |
|--|--|
| **Type** | `calculate` |
| **Name** | `learning_mode_refresh` |
| **Relevant** | `${mapping_action} = 'reactivate' and ${refresh_program} = 'yes'` |
| **Calculation** | Same rules as Q28 |

---

### Q53. Status after reactivate *(calculated)*
| | |
|--|--|
| **Type** | `calculate` |
| **Name** | `status_reactivate` |
| **Label** | Status |
| **Relevant** | `${mapping_action} = 'reactivate'` |
| **Calculation** | `'Eligible'` |

---

# SECTION G — Review & submit

*Shown for all successful paths (after Q2 = Yes and an action is completed).*

---

### Q54. Review summary
| | |
|--|--|
| **Type** | `note` |
| **Name** | `review_summary` |
| **Relevant** | `${confirm_incharge} = 'yes'` |
| **Label** | **Please review before submitting** |

**Activate path shows:**
- Facility: ${facility} (${facility_code}), ${county}
- Action: Activate
- Name: ${mentee_name}
- Mentee ID: ${mentee_id}
- Cadre / Gender / New or Existing?
- Date Activated: ${date_activated}
- Program: ${program}
- Learning Mode: ${learning_mode}
- Status: Eligible

**Deactivate path shows:**
- Facility + selected mentee
- Action: Deactivate
- Date Deactivated: ${date_deactivated}
- Reason: ${reason_for_deactivation}
- Status: Ineligible

**Reactivate path shows:**
- Facility + selected mentee
- Action: Reactivate
- Date Reactivated: ${date_reactivated}
- Status: Eligible
- (Plus refreshed program/flags if Q42 = Yes)

---

### Q55. Confirm submission
| | |
|--|--|
| **Type** | `select_one yes_no` |
| **Name** | `confirm_submit` |
| **Label** | Is all information correct? Submit this mapping update? |
| **Required** | Yes |
| **Relevant** | `${confirm_incharge} = 'yes'` |
| **Choices** | `yes` = Yes, submit · `no` = No, go back and edit |

Constraint: must equal `yes` to finalize (or allow edit by going back).

---

# Metadata (auto-captured)

| Type | Name | Purpose |
|------|------|---------|
| `start` | `start` | Start timestamp |
| `end` | `end` | End timestamp |
| `today` | `today` | Submission date |
| `username` | `username` | Kobo username |
| `deviceid` | `deviceid` | Device ID |

---

# Choice lists (full)

### `yes_no`
| name | label |
|------|-------|
| yes | Yes |
| no | No |

### `mapping_action`
| name | label |
|------|-------|
| activate | Activate a new mentee |
| deactivate | Deactivate an existing mentee |
| reactivate | Reactivate a deactivated mentee |

### `cadre`
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

### Dynamic lists (built from databases)
| list_name | Source | Filter |
|-----------|--------|--------|
| `counties` | Master facilities | Distinct counties |
| `facilities` | Master facilities | By `${county}`; name = facility key, label = facility name; store DHIS code for Q6 |
| `facility_mentees` | Mentees sheet | Facility Code + Status = Eligible |
| `facility_mentees_inactive` | Mentees sheet | Facility Code + Status = Ineligible |

---

# How answers land on the Mentees sheet

| Mentees column | From question(s) |
|----------------|------------------|
| Name | Q10 / Q31 / Q38 |
| pseudo_code | Post-process: `{FacilityCode}-{SHA256(FacilityCode\|MenteeID)[0:4]}` |
| Mentee ID | Q11 / Q31 / Q38 |
| phone_number_whatsapp | Q12 / Q41 |
| Learning Mode | Q28 / Q52 (or algo) |
| County | Q4 |
| Facility Code | Q6 |
| Facility | Q5 |
| Cadre | Q13 |
| Gender | Q14 |
| New or Existing? | Q15 |
| Date Activated | Q16 |
| Date Deactivated | Q33 |
| Date Reactivated | Q40 |
| Reason for Deactivation | Q34 (+ Q35 if Other) |
| Status | Q29 / Q36 / Q53 (or algo from dates) |
| Program | Q17 / Q43 |
| EmONC In-person … OPOCUS | Q19–Q26 / Q44–Q51 |

### Sample Activate submissions (Malava)

| Name | Mentee ID | WhatsApp | Learning Mode | County | Code | Facility | Cadre | Gender | New/Existing | Date Activated | Status | Program | EmONC IP | EmONC Δ | Ess NB IP | Ess NB Δ | Comp NB IP | Continuum | Safe Surgery | OPOCUS |
|------|-----------|----------|---------------|--------|------|----------|-------|--------|--------------|----------------|--------|---------|----------|---------|-----------|----------|------------|-----------|--------------|--------|
| Geofrey Njebeli | 705367519 | 705367519 | In-person Only | Kakamega | 15996 | Malava Sub County Hospital | Nurse | Male | New | Apr 1, 2026 | Eligible | EmONC Curriculum | Yes | No | No | No | No | Yes | | |
| Judith Alusa | 715372096 | | In-person Only | Kakamega | 15996 | Malava Sub County Hospital | Nurse | Female | New | Apr 1, 2026 | Eligible | EmONC Curriculum | Yes | No | No | No | No | Yes | | |
| Modesta Sumbati | 710242428 | 710242428 | In-person Only | Kakamega | 15996 | Malava Sub County Hospital | Nurse | Female | New | Apr 1, 2026 | Eligible | EmONC Curriculum | Yes | No | No | No | No | Yes | | |

---

# Question index

| # | Section | Question |
|---|---------|----------|
| Q1 | A Welcome | Intro note |
| Q2 | A Welcome | Are you the maternity nurse incharge? |
| Q3 | A Welcome | Stop — not authorized |
| Q4 | B Facility | County |
| Q5 | B Facility | Facility |
| Q6 | B Facility | Facility Code |
| Q7 | B Facility | Facility confirmation |
| Q8 | C Action | Activate / Deactivate / Reactivate |
| Q9–Q29 | D Activate | Name → Status (Eligible) |
| Q30–Q36 | E Deactivate | Select mentee → Status (Ineligible) |
| Q37–Q53 | F Reactivate | Select mentee → Status (Eligible) |
| Q54–Q55 | G Review | Summary + confirm submit |
