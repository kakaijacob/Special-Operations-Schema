# Mentee Mapping Tool — Survey

**Form title:** Mentee Mapping Tool  
**Form ID:** `mentee_mapping_tool`  
**Who fills it:** Maternity nurse incharge (or designated maternity lead)  
**Rule:** One mentee per submission

---

## Section A — Welcome

---

**NOTE**

**Mentee Mapping Tool**

This form is for maternity nurse incharges. Use it to activate a new mentee, deactivate a mentee who has left or stopped participating, or reactivate a previously deactivated mentee at your facility.

Submit once per mentee. Open the form again for the next mentee.

---

**Q. Are you the maternity nurse incharge (or designated maternity lead) for this facility?**  
*Required*

- [ ] Yes
- [ ] No

---

**NOTE** *(only if No)*

This tool is for the maternity nurse incharge or designated maternity lead only. Please hand the device to the incharge, or exit without submitting.

---

## Section B — Your facility

*(Shown only if Yes above)*

---

**Q. County**  
*Required · search*

- [ ] Kakamega
- [ ] *(other counties from master facilities list)*

---

**Q. Facility**  
*Required · search · filtered by County selected above*

- [ ] Malava Sub County Hospital
- [ ] *(other facilities in the selected county)*

---

**Q. Facility Code**  
*Auto-filled from Facility · or enter DHIS code (up to 5 digits)*  
*Required*

`_______________`  
*Example: 15996*

---

**NOTE**

You are mapping mentees for: **${Facility}** (Code ${Facility Code}), ${County}.

---

## Section C — What do you want to do?

---

**Q. What do you want to do for this mentee?**  
*Required*

- [ ] Activate a new mentee
- [ ] Deactivate an existing mentee
- [ ] Reactivate a deactivated mentee

→ **Activate** → go to Section D  
→ **Deactivate** → go to Section E  
→ **Reactivate** → go to Section F  

---

## Section D — Activate a new mentee

*(Shown only if “Activate a new mentee” selected)*

---

**NOTE**

Enter details for the mentee you are activating at this facility. Use the name as it appears on the maternity duty roster. Mentee ID is usually their primary phone number (9 digits starting with 1 or 7 — no country code, no leading zero).

---

**Q. Name**  
*Required*

`_______________`  
*Example: Geofrey Njebeli*

---

**Q. Mentee ID**  
*Required*  
*Hint: 9 digits starting with 1 or 7. Do not include 254 or a leading 0.*

`_______________`  
*Example: 705367519*

---

**Q. WhatsApp phone number**  
*Optional, unless Learning Mode will be Hybrid (Both) — then Required*  
*Hint: Same format as Mentee ID. Leave blank if the mentee has no WhatsApp.*

`_______________`  
*Example: 705367519*

---

**Q. Cadre**  
*Required*

- [ ] Nurse
- [ ] Midwife
- [ ] Clinical Officer
- [ ] Other

---

**Q. Gender**  
*Required*

- [ ] Male
- [ ] Female

---

**Q. New or Existing?**  
*Required*  
*Hint: New = joining mentorship for the first time. Existing = previously known to the program.*

- [ ] New
- [ ] Existing

---

**Q. Date Activated**  
*Required · default = today · cannot be in the future*

`____ / ____ / ________`  
*Example: 01 / 04 / 2026*

---

**Q. Program**  
*Required*

- [ ] EmONC Curriculum
- [ ] Newborn Curriculum
- [ ] Both
- [ ] Other

---

**NOTE — Curriculum and learning modality**

Answer Yes or No for each item below. These must match the Program you selected:

| Program | Rule |
|---------|------|
| EmONC Curriculum | EmONC In-person = Yes; Essential Newborn In-person = No; Comprehensive Newborn In-person = No |
| Newborn Curriculum | EmONC In-person = No; at least one newborn in-person option = Yes |
| Both | EmONC In-person = Yes **and** at least one newborn in-person option = Yes |
| Other | EmONC / Essential Newborn / Comprehensive Newborn In-person all = No |

Learning Mode is calculated from these answers (In-person Only / Virtually (DELTA) / Hybrid (Both)).

---

**Q. EmONC In-person**  
*Required*

- [ ] Yes
- [ ] No

---

**Q. EmONC DELTA**  
*Required*

- [ ] Yes
- [ ] No

---

**Q. Essential Newborn In-person**  
*Required*

- [ ] Yes
- [ ] No

---

**Q. Essential Newborn DELTA**  
*Required*

- [ ] Yes
- [ ] No

---

**Q. Comprehensive Newborn In-person**  
*Required*

- [ ] Yes
- [ ] No

---

**Q. Continuum of Care**  
*Required*

- [ ] Yes
- [ ] No

---

**Q. Safe Surgery**  
*Required*

- [ ] Yes
- [ ] No

---

**Q. OPOCUS**  
*Required*

- [ ] Yes
- [ ] No

---

**NOTE — Calculated (read only)**

**Learning Mode:** ${Learning Mode}  
*(In-person Only · Virtually (DELTA) · Hybrid (Both))*

**Status:** Eligible

If Learning Mode is **Hybrid (Both)**, WhatsApp phone number is required before you can submit.

---

## Section E — Deactivate an existing mentee

*(Shown only if “Deactivate an existing mentee” selected)*

---

**NOTE**

Select an **Eligible** mentee currently mapped to this facility. After deactivation they become **Ineligible** and will drop off active Kobo mentee lists until reactivated.

---

**Q. Select mentee to deactivate**  
*Required · search · only Eligible mentees at this facility*

- [ ] Geofrey Njebeli (705367519)
- [ ] Judith Alusa (715372096)
- [ ] Modesta Sumbati (710242428)
- [ ] *(other Eligible mentees at this facility)*

---

**NOTE**

You selected: **${Mentee}** at ${Facility}.

---

**Q. Date Deactivated**  
*Required · default = today · cannot be in the future · cannot be earlier than Date Activated*

`____ / ____ / ________`

---

**Q. Reason for Deactivation**  
*Required*

- [ ] Transfer to another facility
- [ ] Promotion / role change
- [ ] Retirement
- [ ] Resignation / left service
- [ ] Lack of participation
- [ ] Extended leave
- [ ] Deceased
- [ ] Other

---

**Q. Please specify the reason for deactivation**  
*(Only if Reason = Other)*  
*Required*

`_______________`

---

**NOTE — Calculated (read only)**

**Status:** Ineligible

---

## Section F — Reactivate a deactivated mentee

*(Shown only if “Reactivate a deactivated mentee” selected)*

---

**NOTE**

Select an **Ineligible** (deactivated) mentee at this facility to bring them back as **Eligible**.

---

**Q. Select mentee to reactivate**  
*Required · search · only Ineligible mentees at this facility*

- [ ] *(deactivated mentees at this facility — Name (Mentee ID))*

---

**NOTE**

You selected: **${Mentee}** at ${Facility}.

---

**Q. Date Reactivated**  
*Required · default = today · cannot be in the future · cannot be earlier than Date Deactivated*

`____ / ____ / ________`

---

**Q. WhatsApp phone number (update if changed)**  
*Optional*  
*Hint: Leave blank to keep the existing number. If entered, use 9 digits starting with 1 or 7.*

`_______________`

---

**Q. Do you need to update this mentee’s Program or curriculum flags?**  
*Required*

- [ ] Yes
- [ ] No

→ **No** → skip to Status note below  
→ **Yes** → answer the questions below  

---

*(Only if Yes — update program / curriculum)*

**Q. Program**  
*Required*

- [ ] EmONC Curriculum
- [ ] Newborn Curriculum
- [ ] Both
- [ ] Other

---

**NOTE — Curriculum and learning modality**

Answer Yes or No for each. Same Program rules as in Section D (Activate).

---

**Q. EmONC In-person**  
*Required*

- [ ] Yes
- [ ] No

---

**Q. EmONC DELTA**  
*Required*

- [ ] Yes
- [ ] No

---

**Q. Essential Newborn In-person**  
*Required*

- [ ] Yes
- [ ] No

---

**Q. Essential Newborn DELTA**  
*Required*

- [ ] Yes
- [ ] No

---

**Q. Comprehensive Newborn In-person**  
*Required*

- [ ] Yes
- [ ] No

---

**Q. Continuum of Care**  
*Required*

- [ ] Yes
- [ ] No

---

**Q. Safe Surgery**  
*Required*

- [ ] Yes
- [ ] No

---

**Q. OPOCUS**  
*Required*

- [ ] Yes
- [ ] No

---

**NOTE — Calculated (read only)**

**Learning Mode:** ${Learning Mode}  
**Status:** Eligible

---

## Section G — Review and submit

*(Shown after completing Activate, Deactivate, or Reactivate)*

---

**NOTE — Please review before submitting**

**Facility:** ${Facility} (${Facility Code}), ${County}  
**Action:** ${Activate / Deactivate / Reactivate}

**If Activate:**
- Name: ${Name}
- Mentee ID: ${Mentee ID}
- WhatsApp: ${WhatsApp}
- Cadre: ${Cadre}
- Gender: ${Gender}
- New or Existing?: ${New or Existing?}
- Date Activated: ${Date Activated}
- Program: ${Program}
- EmONC In-person: ${…} · EmONC DELTA: ${…}
- Essential Newborn In-person: ${…} · Essential Newborn DELTA: ${…}
- Comprehensive Newborn In-person: ${…}
- Continuum of Care: ${…} · Safe Surgery: ${…} · OPOCUS: ${…}
- Learning Mode: ${Learning Mode}
- Status: Eligible

**If Deactivate:**
- Mentee: ${Mentee}
- Date Deactivated: ${Date Deactivated}
- Reason for Deactivation: ${Reason}
- Status: Ineligible

**If Reactivate:**
- Mentee: ${Mentee}
- Date Reactivated: ${Date Reactivated}
- WhatsApp (if updated): ${WhatsApp}
- Program / flags (if updated): ${…}
- Status: Eligible

---

**Q. Is all information correct? Submit this mapping update?**  
*Required*

- [ ] Yes, submit
- [ ] No, go back and edit

---

## Example — Activate (ready to fill)

**County:** Kakamega  
**Facility:** Malava Sub County Hospital  
**Facility Code:** 15996  
**Action:** Activate a new mentee  

| Question | Geofrey Njebeli | Judith Alusa | Modesta Sumbati |
|----------|-----------------|--------------|-----------------|
| Name | Geofrey Njebeli | Judith Alusa | Modesta Sumbati |
| Mentee ID | 705367519 | 715372096 | 710242428 |
| WhatsApp phone number | 705367519 | *(blank)* | 710242428 |
| Cadre | Nurse | Nurse | Nurse |
| Gender | Male | Female | Female |
| New or Existing? | New | New | New |
| Date Activated | 01 / 04 / 2026 | 01 / 04 / 2026 | 01 / 04 / 2026 |
| Program | EmONC Curriculum | EmONC Curriculum | EmONC Curriculum |
| EmONC In-person | Yes | Yes | Yes |
| EmONC DELTA | No | No | No |
| Essential Newborn In-person | No | No | No |
| Essential Newborn DELTA | No | No | No |
| Comprehensive Newborn In-person | No | No | No |
| Continuum of Care | Yes | Yes | Yes |
| Safe Surgery | *(blank / No)* | *(blank / No)* | *(blank / No)* |
| OPOCUS | *(blank / No)* | *(blank / No)* | *(blank / No)* |
| Learning Mode *(calc)* | In-person Only | In-person Only | In-person Only |
| Status *(calc)* | Eligible | Eligible | Eligible |
