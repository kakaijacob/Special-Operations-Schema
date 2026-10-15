# Mentee Mapping Tool — Survey

**Form title:** Mentee Mapping Tool  
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

1. Are you the maternity nurse incharge (or designated maternity lead) for this facility?  
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

2. What county is your facility in?  
   *Required · search*

   - [ ] Kakamega
   - [ ] *(other counties from master facilities list)*

---

3. What is your facility name?  
   *Required · search · filtered by county selected above*

   - [ ] Malava Sub County Hospital
   - [ ] *(other facilities in the selected county)*

---

4. What is your facility code (DHIS code)?  
   *Auto-filled from facility name where possible · Required*  
   *Hint: Up to 5 digits.*

   `_______________`  
   *Example: 15996*

---

**NOTE**

You are mapping mentees for: **${Facility name}** (Code ${Facility code}), ${County}.

---

## Section C — What do you want to do?

---

5. What do you want to do for this mentee?  
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

You are activating a new mentee at this facility. Please enter their details as they appear on the maternity duty roster. The mentee ID is usually their primary phone number (9 digits starting with 1 or 7 — no country code, no leading zero).

---

6. Please write the mentee’s full name.  
   *Required*

   `_______________`  
   *Example: Geofrey Njebeli*

---

7. Please write the mentee’s phone number (Mentee ID).  
   *Required*  
   *Hint: Enter 9 digits starting with 1 or 7. Do not include 254 or a leading 0.*

   `_______________`  
   *Example: 705367519*

---

8. Please write the mentee’s WhatsApp phone number.  
   *Optional, unless Learning Mode will be Hybrid (Both) — then Required*  
   *Hint: Same format as the phone number above. Leave blank if the mentee has no WhatsApp.*

   `_______________`  
   *Example: 705367519*

---

9. What is the mentee’s cadre?  
   *Required*

   - [ ] Nurse
   - [ ] Midwife
   - [ ] Clinical Officer
   - [ ] Other

---

10. What is the mentee’s gender?  
    *Required*

    - [ ] Male
    - [ ] Female

---

11. Is this mentee new to the mentorship program, or existing?  
    *Required*  
    *Hint: New = joining mentorship for the first time. Existing = previously known to the program.*

    - [ ] New
    - [ ] Existing

---

12. What is the date this mentee was activated?  
    *Required · default = today · cannot be in the future*

    `____ / ____ / ________`  
    *Example: 01 / 04 / 2026*

---

13. Which program is this mentee enrolled in?  
    *Required*

    - [ ] EmONC Curriculum
    - [ ] Newborn Curriculum
    - [ ] Both
    - [ ] Other

---

**NOTE — Curriculum and learning modality**

Please answer Yes or No for each item below. These must match the program you selected:

| Program | Rule |
|---------|------|
| EmONC Curriculum | EmONC In-person = Yes; Essential Newborn In-person = No; Comprehensive Newborn In-person = No |
| Newborn Curriculum | EmONC In-person = No; at least one newborn in-person option = Yes |
| Both | EmONC In-person = Yes **and** at least one newborn in-person option = Yes |
| Other | EmONC / Essential Newborn / Comprehensive Newborn In-person all = No |

Learning Mode is calculated from these answers (In-person Only / Virtually (DELTA) / Hybrid (Both)).

---

14. Is the mentee enrolled in EmONC In-person?  
    *Required*

    - [ ] Yes
    - [ ] No

---

15. Is the mentee enrolled in EmONC DELTA?  
    *Required*

    - [ ] Yes
    - [ ] No

---

16. Is the mentee enrolled in Essential Newborn In-person?  
    *Required*

    - [ ] Yes
    - [ ] No

---

17. Is the mentee enrolled in Essential Newborn DELTA?  
    *Required*

    - [ ] Yes
    - [ ] No

---

18. Is the mentee enrolled in Comprehensive Newborn In-person?  
    *Required*

    - [ ] Yes
    - [ ] No

---

19. Is the mentee enrolled in Continuum of Care?  
    *Required*

    - [ ] Yes
    - [ ] No

---

20. Is the mentee enrolled in Safe Surgery?  
    *Required*

    - [ ] Yes
    - [ ] No

---

21. Is the mentee enrolled in OPOCUS?  
    *Required*

    - [ ] Yes
    - [ ] No

---

**NOTE — Calculated (read only)**

**Learning Mode:** ${Learning Mode}  
*(In-person Only · Virtually (DELTA) · Hybrid (Both))*

**Status:** Eligible

If Learning Mode is **Hybrid (Both)**, the WhatsApp phone number is required before you can submit.

---

## Section E — Deactivate an existing mentee

*(Shown only if “Deactivate an existing mentee” selected)*

---

**NOTE**

Select an **Eligible** mentee currently mapped to this facility. After deactivation they become **Ineligible** and will drop off active Kobo mentee lists until reactivated.

---

22. Which mentee do you want to deactivate?  
    *Required · search · only Eligible mentees at this facility*

    - [ ] Geofrey Njebeli (705367519)
    - [ ] Judith Alusa (715372096)
    - [ ] Modesta Sumbati (710242428)
    - [ ] *(other Eligible mentees at this facility)*

---

**NOTE**

You selected: **${Mentee}** at ${Facility name}.

---

23. What is the date this mentee was deactivated?  
    *Required · default = today · cannot be in the future · cannot be earlier than Date Activated*

    `____ / ____ / ________`

---

24. What is the reason for deactivation?  
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

25. Please specify the reason for deactivation.  
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

26. Which mentee do you want to reactivate?  
    *Required · search · only Ineligible mentees at this facility*

    - [ ] *(deactivated mentees at this facility — Name (phone number))*

---

**NOTE**

You selected: **${Mentee}** at ${Facility name}.

---

27. What is the date this mentee was reactivated?  
    *Required · default = today · cannot be in the future · cannot be earlier than Date Deactivated*

    `____ / ____ / ________`

---

28. Please write the mentee’s WhatsApp phone number if it has changed.  
    *Optional*  
    *Hint: Leave blank to keep the existing number. If entered, use 9 digits starting with 1 or 7.*

    `_______________`

---

29. Do you need to update this mentee’s program or curriculum enrolment?  
    *Required*

    - [ ] Yes
    - [ ] No

→ **No** → skip to Status note below  
→ **Yes** → answer the questions below  

---

*(Only if Yes — update program / curriculum)*

30. Which program is this mentee enrolled in?  
    *Required*

    - [ ] EmONC Curriculum
    - [ ] Newborn Curriculum
    - [ ] Both
    - [ ] Other

---

**NOTE — Curriculum and learning modality**

Please answer Yes or No for each. Same program rules as in Section D (Activate).

---

31. Is the mentee enrolled in EmONC In-person?  
    *Required*

    - [ ] Yes
    - [ ] No

---

32. Is the mentee enrolled in EmONC DELTA?  
    *Required*

    - [ ] Yes
    - [ ] No

---

33. Is the mentee enrolled in Essential Newborn In-person?  
    *Required*

    - [ ] Yes
    - [ ] No

---

34. Is the mentee enrolled in Essential Newborn DELTA?  
    *Required*

    - [ ] Yes
    - [ ] No

---

35. Is the mentee enrolled in Comprehensive Newborn In-person?  
    *Required*

    - [ ] Yes
    - [ ] No

---

36. Is the mentee enrolled in Continuum of Care?  
    *Required*

    - [ ] Yes
    - [ ] No

---

37. Is the mentee enrolled in Safe Surgery?  
    *Required*

    - [ ] Yes
    - [ ] No

---

38. Is the mentee enrolled in OPOCUS?  
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

**Facility:** ${Facility name} (${Facility code}), ${County}  
**Action:** ${Activate / Deactivate / Reactivate}

**If Activate:**
- Full name: ${Name}
- Phone number (Mentee ID): ${Mentee ID}
- WhatsApp phone number: ${WhatsApp}
- Cadre: ${Cadre}
- Gender: ${Gender}
- New or Existing?: ${New or Existing?}
- Date activated: ${Date Activated}
- Program: ${Program}
- Curriculum enrolment: EmONC In-person, EmONC DELTA, Essential Newborn In-person, Essential Newborn DELTA, Comprehensive Newborn In-person, Continuum of Care, Safe Surgery, OPOCUS
- Learning Mode: ${Learning Mode}
- Status: Eligible

**If Deactivate:**
- Mentee: ${Mentee}
- Date deactivated: ${Date Deactivated}
- Reason for deactivation: ${Reason}
- Status: Ineligible

**If Reactivate:**
- Mentee: ${Mentee}
- Date reactivated: ${Date Reactivated}
- WhatsApp (if updated): ${WhatsApp}
- Program / curriculum (if updated): ${…}
- Status: Eligible

---

39. Is all information correct? Do you want to submit this mapping update?  
    *Required*

    - [ ] Yes, submit
    - [ ] No, go back and edit

---

## Example — Activate (Malava Sub County Hospital)

**County:** Kakamega  
**Facility name:** Malava Sub County Hospital  
**Facility code:** 15996  
**Action:** Activate a new mentee  

| Question | Geofrey Njebeli | Judith Alusa | Modesta Sumbati |
|----------|-----------------|--------------|-----------------|
| Please write the mentee’s full name | Geofrey Njebeli | Judith Alusa | Modesta Sumbati |
| Please write the mentee’s phone number (Mentee ID) | 705367519 | 715372096 | 710242428 |
| Please write the mentee’s WhatsApp phone number | 705367519 | *(blank)* | 710242428 |
| What is the mentee’s cadre? | Nurse | Nurse | Nurse |
| What is the mentee’s gender? | Male | Female | Female |
| Is this mentee new or existing? | New | New | New |
| What is the date this mentee was activated? | 01 / 04 / 2026 | 01 / 04 / 2026 | 01 / 04 / 2026 |
| Which program is this mentee enrolled in? | EmONC Curriculum | EmONC Curriculum | EmONC Curriculum |
| EmONC In-person | Yes | Yes | Yes |
| EmONC DELTA | No | No | No |
| Essential Newborn In-person | No | No | No |
| Essential Newborn DELTA | No | No | No |
| Comprehensive Newborn In-person | No | No | No |
| Continuum of Care | Yes | Yes | Yes |
| Safe Surgery | No | No | No |
| OPOCUS | No | No | No |
| Learning Mode *(calc)* | In-person Only | In-person Only | In-person Only |
| Status *(calc)* | Eligible | Eligible | Eligible |
