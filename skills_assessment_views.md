# SQL Queries Documentation

Use this file to record SQL queries for tasks, projects, or investigations.

## Project / Task
- Project name: Skills Assessment Views
- Task description: Document AMTSL evaluation view definition
- Date: 2026-06-30

## Queries
### 1. mentors.amstl_evaluation_2026 source
```sql
CREATE OR REPLACE VIEW mentors.amstl_evaluation_2026
AS SELECT msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.explain_procedure::integer AS "explain procedure", msc.obtain_consent_007::integer AS "obtain consent", msc.change_goloves::integer AS "change gloves", msc.check_second_twin::integer AS "check 2nd twin", msc.explain_medication::integer AS "explain medication", msc.administer_uterotonic::integer AS "administer uterotonic", msc.delayed_cord_clamp::integer AS "delayed cord clamping", msc.cct_001::integer AS cct, msc.recieve_placenta::integer AS "recieve placenta", msc.assess_fundal_tone::integer AS "fundal tone", msc.genital_trauma_assessment::integer AS "trauma assessment", msc.assess_blood_loss::integer AS "assess blood loss", msc._15min_uterine_massage::integer AS "uterine massage", msc.vital_signs_002::integer AS "vital sign", msc.message_to_mother_005::integer AS "message to mother", msc.unfold_v_drape::integer AS "unfold v drape", msc.cord_cut::integer AS "cord cut", msc.assess_blood_loss1::integer AS "assess blood loss v2", msc.health_messages::integer AS "health messages", msc.document_procedure1::integer AS "document procedure",
        CASE
            WHEN msc.date_submitted <= '2026-04-01'::date THEN (msc.explain_procedure::integer + msc.obtain_consent_007::integer + msc.change_goloves::integer + msc.check_second_twin::integer + msc.explain_medication::integer + msc.administer_uterotonic::integer + msc.delayed_cord_clamp::integer + msc.cct_001::integer + msc.recieve_placenta::integer + msc.assess_fundal_tone::integer + msc.genital_trauma_assessment::integer + msc.assess_blood_loss::integer + msc._15min_uterine_massage::integer + msc.vital_signs_002::integer + msc.message_to_mother_005::integer)::numeric::numeric(18,0) / 15.0
            ELSE (msc.explain_procedure::integer + msc.obtain_consent_007::integer + msc.change_goloves::integer + msc.check_second_twin::integer + msc.explain_medication::integer + msc.administer_uterotonic::integer + msc.unfold_v_drape::integer + msc.delayed_cord_clamp::integer + msc.cord_cut::integer + msc.cct_001::integer + msc.recieve_placenta::integer + msc.assess_fundal_tone::integer + msc.genital_trauma_assessment::integer + msc.assess_blood_loss1::integer + msc._15min_uterine_massage::integer + msc.vital_signs_002::integer + msc.message_to_mother_005::integer + msc.health_messages::integer + msc.document_procedure1::integer)::numeric::numeric(18,0) / 19.0
        END AS "average score"
   FROM mentors.moh_skills_checklist msc
  WHERE msc.skill_evaluation::text = 'AMTSL'::text;
```

### 2. mentors.avd_evaluation_2026 source
```sql
CREATE OR REPLACE VIEW mentors.avd_evaluation_2026
AS SELECT msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.obtain_consent_005::integer AS "obtain consent", msc.ask_for_help::integer AS "ask for help", msc.avd_contraindication::integer AS "avd contraindication", msc.empty_bladder_002::integer AS "empty bladder", msc.alert_theatre::integer AS "alert theatre", msc.proper_dilatation_descent::integer AS "evaluate descent", msc.adequate_contractions::integer AS "adequate contractions", msc.determine_position::integer AS "determine position", msc.mcroberts_position::integer AS "mcroberts position", msc.equipment_check::integer AS "equipment check", msc.vacuum_placement::integer AS "vacuum placement", msc.evaluates_for_episiotomy::integer AS "evaluate for episiotomy", msc.check_maternal_soft_tissue::integer AS "maternal soft tissue", msc.negative_pressure::integer AS "negative pressure", msc.apply_gentle_traction::integer AS "gentle traction", msc.cup_removal::integer AS "cup removal", msc.proceed_as_normal_delivery::integer AS "normal delivery", msc.when_to_halt::integer AS "when to halt", msc.message_to_mother_003::integer AS "message to mother", msc.fhr_check::integer AS "fhr check",
        CASE
            WHEN msc.date_submitted <= '2026-04-01'::date THEN (msc.obtain_consent_005::integer + msc.ask_for_help::integer + msc.avd_contraindication::integer + msc.empty_bladder_002::integer + msc.alert_theatre::integer + msc.proper_dilatation_descent::integer + msc.adequate_contractions::integer + msc.determine_position::integer + msc.mcroberts_position::integer + msc.equipment_check::integer + msc.vacuum_placement::integer + msc.evaluates_for_episiotomy::integer + msc.check_maternal_soft_tissue::integer + msc.negative_pressure::integer + msc.apply_gentle_traction::integer + msc.cup_removal::integer + msc.proceed_as_normal_delivery::integer + msc.when_to_halt::integer + msc.message_to_mother_003::integer)::numeric::numeric(18,0) / 19.0
            ELSE (msc.obtain_consent_005::integer + msc.ask_for_help::integer + msc.avd_contraindication::integer + msc.empty_bladder_002::integer + msc.alert_theatre::integer + msc.proper_dilatation_descent::integer + msc.adequate_contractions::integer + msc.determine_position::integer + msc.mcroberts_position::integer + msc.equipment_check::integer + msc.vacuum_placement::integer + msc.evaluates_for_episiotomy::integer + msc.check_maternal_soft_tissue::integer + msc.negative_pressure::integer + msc.apply_gentle_traction::integer + msc.cup_removal::integer + msc.fhr_check::integer + msc.proceed_as_normal_delivery::integer + msc.when_to_halt::integer + msc.message_to_mother_003::integer)::numeric::numeric(18,0) / 20.0
        END AS "average score"
   FROM mentors.moh_skills_checklist msc
  WHERE msc.skill_evaluation::text = 'Assisted vaginal vacuum delivery'::text;
```

### 3. mentors.b_lynch_evaluation_2026 source
```sql
CREATE OR REPLACE VIEW mentors.b_lynch_evaluation_2026
AS SELECT msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.qualified_medical_officer::integer AS "qualified mo", msc.obtain_consent_009::integer AS "obtain consent", msc.anesthesia::integer AS anesthesia, msc.cleaning_draping_abdomen::integer AS "clean & drape abdomen", msc.vital_signs_003::integer AS "vital signs", msc.open_abdomen_identify_uterus::integer AS "open abdomen & identify uterus", msc.assess_for_atony::integer AS "assess atony", msc.lower_uterine_segment_incision::integer AS "lower uterine segment incision", msc.remove_pcos::integer AS "remove pocs", msc.start_from_right_side::integer AS "where to start", msc.insert_compression_suture::integer AS "insert compression suture", msc.suture_over_funds::integer AS "suture over fundus", msc.loop_the_uterus_horizontally::integer AS "loop uterus horizontally", msc.another_loop::integer AS "another loop", msc.assistant_compress_uterus::integer AS "compress uterus", msc.tie_ends_together::integer AS "tie ends together", msc.vaginal_bleeding_controlled::integer AS "bleeding controlled", msc.close_uterine_incision::integer AS "close uterine incision", msc.hysteroctomy_indication::integer AS "hysterectomy indication", msc.message_to_mother_008::integer AS "message to mother", msc.drape_in_place::integer AS "drape in place", msc.document_results2::integer AS "document results",
        CASE
            WHEN msc.date_submitted <= '2026-04-01'::date THEN (msc.qualified_medical_officer::integer + msc.obtain_consent_009::integer + msc.anesthesia::integer + msc.cleaning_draping_abdomen::integer + msc.vital_signs_003::integer + msc.open_abdomen_identify_uterus::integer + msc.assess_for_atony::integer + msc.lower_uterine_segment_incision::integer + msc.remove_pcos::integer + msc.start_from_right_side::integer + msc.insert_compression_suture::integer + msc.suture_over_funds::integer + msc.loop_the_uterus_horizontally::integer + msc.another_loop::integer + msc.assistant_compress_uterus::integer + msc.tie_ends_together::integer + msc.vaginal_bleeding_controlled::integer + msc.close_uterine_incision::integer + msc.hysteroctomy_indication::integer + msc.message_to_mother_008::integer)::numeric::numeric(18,0) / 20.0
            ELSE (msc.qualified_medical_officer::integer + msc.obtain_consent_009::integer + msc.drape_in_place::integer + msc.anesthesia::integer + msc.cleaning_draping_abdomen::integer + msc.vital_signs_003::integer + msc.open_abdomen_identify_uterus::integer + msc.assess_for_atony::integer + msc.lower_uterine_segment_incision::integer + msc.remove_pcos::integer + msc.start_from_right_side::integer + msc.insert_compression_suture::integer + msc.suture_over_funds::integer + msc.loop_the_uterus_horizontally::integer + msc.another_loop::integer + msc.assistant_compress_uterus::integer + msc.tie_ends_together::integer + msc.vaginal_bleeding_controlled::integer + msc.close_uterine_incision::integer + msc.hysterectomy_indication::integer + msc.message_to_mother_008::integer + msc.document_results2::integer)::numeric::numeric(18,0) / 22.0
        END AS "average score"
   FROM mentors.moh_skills_checklist msc
  WHERE msc.skill_evaluation::text = 'B-LYNCH'::text;
```

### 4. mentors.bimanual_uterine_compression_evaluation_2026 source
```sql
CREATE OR REPLACE VIEW mentors.bimanual_uterine_compression_evaluation_2026
AS SELECT msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.shout_for_help_004::integer AS "shout for help", msc.obtain_consent_012::integer AS "obtain consent", msc.vaginal_exam_002::integer AS "vaginal exam", msc.identify_anterior_fornix::integer AS "identify anterior fornix", msc.fist_thumb_outside::integer AS "fist with thumb outside", msc.fist_on_anterior_wall::integer AS "fist on anterior wall", msc.pressure_posterior_wall::integer AS "pressure posterior wall", msc.pressure_until_hemostasis::integer AS "pressure until hemostasis", msc.message_to_mother_012::integer AS "message to mother", msc.hand_hygiene::integer AS "hand hygiene (old)", msc.hor_hygiene::integer AS "hand hygiene (new)", msc.insert_whole_hand::integer AS "insert hand (old)", msc.insert_whole_hor::integer AS "insert hand (new)",
        CASE
            WHEN msc.date_submitted <= '2026-04-01'::date THEN (msc.shout_for_help_004::integer + msc.obtain_consent_012::integer + msc.hand_hygiene::integer + msc.vaginal_exam_002::integer + msc.insert_whole_hand::integer + msc.identify_anterior_fornix::integer + msc.fist_thumb_outside::integer + msc.fist_on_anterior_wall::integer + msc.pressure_posterior_wall::integer + msc.pressure_until_hemostasis::integer + msc.message_to_mother_012::integer)::numeric::numeric(18,0) / 11.0
            ELSE (msc.shout_for_help_004::integer + msc.obtain_consent_012::integer + msc.hor_hygiene::integer + msc.vaginal_exam_002::integer + msc.insert_whole_hor::integer + msc.identify_anterior_fornix::integer + msc.fist_thumb_outside::integer + msc.fist_on_anterior_wall::integer + msc.pressure_posterior_wall::integer + msc.pressure_until_hemostasis::integer + msc.message_to_mother_012::integer)::numeric::numeric(18,0) / 11.0
        END AS "average score"
   FROM mentors.moh_skills_checklist msc
  WHERE msc.skill_evaluation::text = 'Bimanual uterine compression'::text;
```

### 5. mentors.breech_delivery_evaluation_2026 source
```sql
CREATE OR REPLACE VIEW mentors.breech_delivery_evaluation_2026
AS SELECT msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.confirm_diagnosis_001::integer AS "confirm diagnosis", msc.obtain_consent_004::integer AS "obtain consent", msc.call_for_help::integer AS "call for help", msc.empty_bladder_001::integer AS "empty bladder", msc.consider_episiotomy::integer AS "consider episiotomy", msc.hands_off_breech::integer AS "hands off breech", msc.pinard_manuever::integer AS "pinard maneuver", msc.grip_pelvis_bone::integer AS "pelvis grip", msc.lovset_maneuver::integer AS "lovset maneuver", msc.maurecieu_smellie_veit_maneuve::integer AS "maureciue smellie veit", msc.amtsl::integer AS amtsl, msc.message_to_mother_002::integer AS "message to mother", msc.documentation_001::integer AS documentation,
        CASE
            WHEN msc.date_submitted <= '2026-04-01'::date THEN (msc.confirm_diagnosis_001::integer + msc.obtain_consent_004::integer + msc.call_for_help::integer + msc.empty_bladder_001::integer + msc.consider_episiotomy::integer + msc.hands_off_breech::integer + msc.pinard_manuever::integer + msc.grip_pelvis_bone::integer + msc.lovset_maneuver::integer + msc.maurecieu_smellie_veit_maneuve::integer + msc.amtsl::integer + msc.message_to_mother_002::integer + msc.documentation_001::integer)::numeric::numeric(18,0) / 13.0
            ELSE (msc.confirm_diagnosis_001::integer + msc.obtain_consent_004::integer + msc.call_for_help::integer + msc.empty_bladder_001::integer + msc.consider_episiotomy::integer + msc.hands_off_breech::integer + msc.pinard_manuever::integer + msc.grip_pelvis_bone::integer + msc.lovset_maneuver::integer + msc.maurecieu_smellie_veit_maneuve::integer + msc.amtsl::integer + msc.message_to_mother_002::integer + msc.documentation_001::integer)::numeric::numeric(18,0) / 13.0
        END AS "average score"
   FROM mentors.moh_skills_checklist msc
  WHERE msc.skill_evaluation::text = 'Assisted breech delivery'::text;
```

### 6. mentors.cervical_tear_repair_evaluation_2026 source
```sql
CREATE OR REPLACE VIEW mentors.cervical_tear_repair_evaluation_2026
AS SELECT msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.obtain_consent_011::integer AS "obtain consent", msc.analgesics_antibiotics_001::integer AS "analgesic antibiotics", msc.lithotomy_position_002::integer AS "lithotomy position", msc.clean_perinuem_002::integer AS "clean perinuem", msc.empty_bladder_003::integer AS "empty bladder", msc.regional_anesthesia_sedation::integer AS "regional anesthesia & sedation", msc.tear_examination::integer AS "tear examination", msc.apply_local_anesthetic::integer AS "local anesthesia", msc.grasp_cervix_oneside::integer AS "grasp cervix oneside", msc.grasp_otherside_of_cervix::integer AS "grasp cervix opposite side", msc.locate_tip_of_cervix::integer AS "locate cervical tip", msc.place_both_forceps_in_one_hand::integer AS "forceps on one hand", msc.placement_1st_suture::integer AS "1st suture placement", msc.place_continous_suture::integer AS "continous sutures", msc.theatre_if_no_hemostasis::integer AS "theatre if no hemostasis", msc.message_to_mother_011::integer AS "message to mother", msc.drape_in_place3::integer AS "drape in place", msc.document_results3::integer AS "document results", msc.place_both_forceps_in_one_hor::integer AS "forceps on one hand (new)",
        CASE
            WHEN msc.date_submitted <= '2026-04-01'::date THEN (msc.obtain_consent_011::integer + msc.analgesics_antibiotics_001::integer + msc.lithotomy_position_002::integer + msc.clean_perinuem_002::integer + msc.empty_bladder_003::integer + msc.regional_anesthesia_sedation::integer + msc.tear_examination::integer + msc.apply_local_anesthetic::integer + msc.grasp_cervix_oneside::integer + msc.grasp_otherside_of_cervix::integer + msc.locate_tip_of_cervix::integer + msc.place_both_forceps_in_one_hand::integer + msc.placement_1st_suture::integer + msc.place_continous_suture::integer + msc.theatre_if_no_hemostasis::integer + msc.message_to_mother_011::integer)::numeric::numeric(18,0) / 16.0
            ELSE (msc.obtain_consent_011::integer + msc.drape_in_place3::integer + msc.analgesics_antibiotics_001::integer + msc.lithotomy_position_002::integer + msc.clean_perinuem_002::integer + msc.empty_bladder_003::integer + msc.regional_anesthesia_sedation::integer + msc.tear_examination::integer + msc.apply_local_anesthetic::integer + msc.grasp_cervix_oneside::integer + msc.grasp_otherside_of_cervix::integer + msc.locate_tip_of_cervix::integer + msc.place_both_forceps_in_one_hor::integer + msc.placement_1st_suture::integer + msc.place_continous_suture::integer + msc.theatre_if_no_hemostasis::integer + msc.message_to_mother_011::integer + msc.document_results3::integer)::numeric::numeric(18,0) / 18.0
        END AS "average score"
   FROM mentors.moh_skills_checklist msc
  WHERE msc.skill_evaluation::text = 'Cervical tear repair'::text;
```

### 7. mentors.compression_abdominal_aorta_evaluation_2026 source
```sql
CREATE OR REPLACE VIEW mentors.compression_abdominal_aorta_evaluation_2026
AS SELECT msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.shout_for_help_005::integer AS "shout for help", msc.obtain_consent_013::integer AS "obtain consent", msc.locate_femoral_pulse::integer AS "locate femoral pulse", msc.fist_placement::integer AS "fist placement", msc.apply_down_pressure::integer AS "apply downward pressure", msc.femoral_pulse_check::integer AS "femoral pulse check", msc.adequacy_of_compression::integer AS "adequacy of compression", msc.compression_until_hemostasis::integer AS "compression to hemostasis", msc.message_to_mother_013::integer AS "message to mother", msc.v_drape2::integer AS "v drape",
        CASE
            WHEN msc.date_submitted <= '2026-04-01'::date THEN (msc.shout_for_help_005::integer + msc.obtain_consent_013::integer + msc.locate_femoral_pulse::integer + msc.fist_placement::integer + msc.apply_down_pressure::integer + msc.femoral_pulse_check::integer + msc.adequacy_of_compression::integer + msc.compression_until_hemostasis::integer + msc.message_to_mother_013::integer)::numeric::numeric(18,0) / 9.0
            ELSE (msc.shout_for_help_005::integer + msc.obtain_consent_013::integer + msc.v_drape2::integer + msc.locate_femoral_pulse::integer + msc.fist_placement::integer + msc.apply_down_pressure::integer + msc.femoral_pulse_check::integer + msc.adequacy_of_compression::integer + msc.compression_until_hemostasis::integer + msc.message_to_mother_013::integer)::numeric::numeric(18,0) / 10.0
        END AS "average score"
   FROM mentors.moh_skills_checklist msc
  WHERE msc.skill_evaluation::text = 'Compression of abdominal aorta'::text;
```

### 8. mentors.cord_prolapse_evaluation_2026 source
```sql
CREATE OR REPLACE VIEW mentors.cord_prolapse_evaluation_2026
AS SELECT msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.shout_for_help_001::integer AS "shout for help", msc.obtain_consent_003::integer AS "obtain consent", msc.vaginal_exam::integer AS "vaginal exam", msc.confirm_diagnosis::integer AS "confirm diagnosis", msc.confirms_cord_pulsation::integer AS "cord pulsation", msc.patient_position::integer AS "patient position", msc.manual_cord_decompression::integer AS "cord decompression", msc.consent_prep_emergency_cs::integer AS "emergency cs prep", msc.patient_transfer_position::integer AS "patient transfer position",
        CASE
            WHEN msc.date_submitted < '2026-04-01'::date THEN msc.hand_removal::integer
            ELSE msc.hor_removal::integer
        END AS "cord removal", msc.bladder_filling::integer AS "bladder filling", msc.tocolytics::integer AS tocolytics, msc.when_cord_not_pulsating::integer AS "nonpulsating cord", msc.expediting_delivery::integer AS "expediting delivery", msc.prepare_to_resuscitate::integer AS "prep for nnr", avg((msc.shout_for_help_001::integer + msc.obtain_consent_003::integer + msc.vaginal_exam::integer + msc.confirm_diagnosis::integer + msc.confirms_cord_pulsation::integer + msc.patient_position::integer + msc.manual_cord_decompression::integer + msc.consent_prep_emergency_cs::integer + msc.patient_transfer_position::integer +
        CASE
            WHEN msc.date_submitted < '2026-04-01'::date THEN msc.hand_removal::integer
            ELSE msc.hor_removal::integer
        END + msc.bladder_filling::integer + msc.tocolytics::integer + msc.when_cord_not_pulsating::integer + msc.expediting_delivery::integer + msc.prepare_to_resuscitate::integer)::numeric::numeric(18,0) / 15.0) AS "average score"
   FROM mentors.moh_skills_checklist msc
  WHERE msc.skill_evaluation::text = 'Cord prolapse'::text
  GROUP BY msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.shout_for_help_001, msc.obtain_consent_003, msc.vaginal_exam, msc.confirm_diagnosis, msc.confirms_cord_pulsation, msc.patient_position, msc.manual_cord_decompression, msc.consent_prep_emergency_cs, msc.patient_transfer_position, msc.hand_removal, msc.hor_removal, msc.bladder_filling, msc.tocolytics, msc.when_cord_not_pulsating, msc.expediting_delivery, msc.prepare_to_resuscitate;
```

### 9. mentors.emotive_evaluation_2026 source
```sql
CREATE OR REPLACE VIEW mentors.emotive_evaluation_2026
AS SELECT msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.shout_assemble_team::integer AS "assemble team", msc.assign_team_roles::integer AS "assign roles", msc.reassure_explain_mother::integer AS "reassure mother", msc.check_bleeding_amount::integer AS "check bleeding", msc.assess_abcs_resuscitate::integer AS "abcs resuscitate", msc.trigger_first_bundle::integer AS "first bundle", msc.trigger_uterus_massage::integer AS "uterus massage", msc.check_bladder_catheter::integer AS "bladder catheter", msc.insert_iv_cannulas::integer AS "iv cannulas", msc.collect_blood_samples::integer AS "blood samples", msc.infuse_oxytocin::integer AS "oxytocin infusion", msc.administer_misoprostol::integer AS misoprostol, msc.administer_tranexamic_acid::integer AS "tranexamic acid", msc.give_iv_fluids::integer AS "iv fluids", msc.recheck_uterus::integer AS "recheck uterus", msc.check_for_tears::integer AS "check tears", msc.check_placenta_completeness::integer AS "placenta check", msc.monitor_bleeding_vitals::integer AS "monitor vitals", msc.provide_respectful_care::integer AS "respectful care", msc.inform_mother_progress::integer AS "inform mother", msc.document_management_chart::integer AS documentation, avg((msc.shout_assemble_team::integer + msc.assign_team_roles::integer + msc.reassure_explain_mother::integer + msc.check_bleeding_amount::integer + msc.assess_abcs_resuscitate::integer + msc.trigger_first_bundle::integer + msc.trigger_uterus_massage::integer + msc.check_bladder_catheter::integer + msc.insert_iv_cannulas::integer + msc.collect_blood_samples::integer + msc.infuse_oxytocin::integer + msc.administer_misoprostol::integer + msc.administer_tranexamic_acid::integer + msc.give_iv_fluids::integer + msc.recheck_uterus::integer + msc.check_for_tears::integer + msc.check_placenta_completeness::integer + msc.monitor_bleeding_vitals::integer + msc.provide_respectful_care::integer + msc.inform_mother_progress::integer + msc.document_management_chart::integer)::numeric::numeric(18,0) / 21.0) AS "average score"
   FROM mentors.moh_skills_checklist msc
  WHERE msc.skill_evaluation::text = 'EMOTIVE'::text
  GROUP BY msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.shout_assemble_team, msc.assign_team_roles, msc.reassure_explain_mother, msc.check_bleeding_amount, msc.assess_abcs_resuscitate, msc.trigger_first_bundle, msc.trigger_uterus_massage, msc.check_bladder_catheter, msc.insert_iv_cannulas, msc.collect_blood_samples, msc.infuse_oxytocin, msc.administer_misoprostol, msc.administer_tranexamic_acid, msc.give_iv_fluids, msc.recheck_uterus, msc.check_for_tears, msc.check_placenta_completeness, msc.monitor_bleeding_vitals, msc.provide_respectful_care, msc.inform_mother_progress, msc.document_management_chart;
```

### 10. mentors.manual_placenta_removal_evaluation_2026 source
```sql
CREATE OR REPLACE VIEW mentors.manual_placenta_removal_evaluation_2026
AS SELECT msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation,
        CASE
            WHEN msc.date_submitted < '2026-04-01'::date THEN msc.shout_for_help::integer
            ELSE msc.shout_for_help1::integer
        END AS "shout for help", msc.obtain_consent_001::integer AS "obtain consent",
        CASE
            WHEN msc.date_submitted < '2026-04-01'::date THEN NULL::integer
            ELSE msc.v_drape::integer
        END AS "v drape", msc.insert_iv_lines::integer AS "insert iv lines", msc.lithotomy_position_001::integer AS "lithotomy position", msc.repeat_oxytocin::integer AS "repeat oxytocin", msc.empty_bladder::integer AS "empty bladder", msc.analgesics_antibiotics::integer AS "analgesics & antibiotics", msc.wear_gynecological_gloves::integer AS "gynecological gloves",
        CASE
            WHEN msc.date_submitted < '2026-04-01'::date THEN msc.guide_hand_into_uterus::integer
            ELSE msc.guide_hor_into_uterus::integer
        END AS "hand into uterus", msc.locate_placenta_edge::integer AS "locate placental edge", msc.placenta_removal::integer AS "remove placenta", msc.cct::integer AS cct, msc.check_for_atony::integer AS "atony check", msc.placenta_examination::integer AS "placenta exam", msc.explore_for_fragments::integer AS "fragments exploration", msc.remove_fragments::integer AS "remove fragments", msc.laceration_repair::integer AS "laceration repair", msc.oxytocin_20_iu::integer AS "oxytocin 20iu", msc.vital_signs_001::integer AS "vital signs", msc.message_to_mother::integer AS "message to mother", msc.other_managment::integer AS "other management", avg((
        CASE
            WHEN msc.date_submitted < '2026-04-01'::date THEN msc.shout_for_help::integer
            ELSE msc.shout_for_help1::integer
        END + msc.obtain_consent_001::integer +
        CASE
            WHEN msc.date_submitted < '2026-04-01'::date THEN 0
            ELSE msc.v_drape::integer
        END + msc.insert_iv_lines::integer + msc.lithotomy_position_001::integer + msc.repeat_oxytocin::integer + msc.empty_bladder::integer + msc.analgesics_antibiotics::integer + msc.wear_gynecological_gloves::integer +
        CASE
            WHEN msc.date_submitted < '2026-04-01'::date THEN msc.guide_hand_into_uterus::integer
            ELSE msc.guide_hor_into_uterus::integer
        END + msc.locate_placenta_edge::integer + msc.placenta_removal::integer + msc.cct::integer + msc.check_for_atony::integer + msc.placenta_examination::integer + msc.explore_for_fragments::integer + msc.remove_fragments::integer + msc.laceration_repair::integer + msc.oxytocin_20_iu::integer + msc.vital_signs_001::integer + msc.message_to_mother::integer + msc.other_managment::integer)::numeric::numeric(18,0) / 22.0) AS "average score"
   FROM mentors.moh_skills_checklist msc
  WHERE msc.skill_evaluation::text = 'Manual removal of placenta'::text
  GROUP BY msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.shout_for_help, msc.shout_for_help1, msc.obtain_consent_001, msc.v_drape, msc.insert_iv_lines, msc.lithotomy_position_001, msc.repeat_oxytocin, msc.empty_bladder, msc.analgesics_antibiotics, msc.wear_gynecological_gloves, msc.guide_hand_into_uterus, msc.guide_hor_into_uterus, msc.locate_placenta_edge, msc.placenta_removal, msc.cct, msc.check_for_atony, msc.placenta_examination, msc.explore_for_fragments, msc.remove_fragments, msc.laceration_repair, msc.oxytocin_20_iu, msc.vital_signs_001, msc.message_to_mother, msc.other_managment;
```

### 11. mentors.maternal_resuscitation_evaluation_2026 source
```sql
CREATE OR REPLACE VIEW mentors.maternal_resuscitation_evaluation_2026
AS SELECT msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.safety_assessement::integer AS "safety assessment", msc.check_response::integer AS "check response", msc.shout_for_help_003::integer AS "shout for help", msc.initiate_cpr_001::integer AS "initiate cpr", msc.offer_leadership::integer AS "offer leadership", msc.assess::integer AS assess, msc.head_titl_chin_lift::integer AS "head tilt chin lift", msc.jaw_thrust::integer AS "jaw thrust", msc.maintain_airway::integer AS "maintain airway", msc.demo_cpr::integer AS "demo cpr", msc._30_2_cpr::integer AS "cpr ratio", msc.reassess_breathing::integer AS "reassess breathing", msc._2min_exchanges_cpr::integer AS "2 min exchanges", msc.perimotem_cs::integer AS "perimortem cs", msc.assess_circulation_inverted_j::integer AS inverted_j, msc.perform_secondary_survey::integer AS "2ndry survey", msc.recovery_position::integer AS "recovery position", msc.debrief_and_assign_tasks::integer AS "assign tasks (old)", msc.debrief_or_assign_tasks::integer AS "assign tasks (new)", msc.identify_cpr_landmarks::integer AS "cpr landmarks (old)", msc.identify_cpr_lormarks::integer AS "cpr landmarks (new)", msc.o2_recovery_room::integer AS "recovery o2 (old)", msc.o2_recovery_room::integer AS "recovery o2 (new)", msc.iv_fluids::integer AS "iv fluids (old)", msc.iv_fluids::integer AS "iv fluids (new)",
        CASE
            WHEN msc.date_submitted <= '2026-04-01'::date THEN (msc.safety_assessement::integer + msc.check_response::integer + msc.shout_for_help_003::integer + msc.initiate_cpr_001::integer + msc.debrief_and_assign_tasks::integer + msc.offer_leadership::integer + msc.assess::integer + msc.head_titl_chin_lift::integer + msc.jaw_thrust::integer + msc.maintain_airway::integer + msc.identify_cpr_landmarks::integer + msc.demo_cpr::integer + msc._30_2_cpr::integer + msc.reassess_breathing::integer + msc._2min_exchanges_cpr::integer + msc.perimotem_cs::integer + msc.o2_recovery_room::integer + msc.assess_circulation_inverted_j::integer + msc.iv_fluids::integer + msc.perform_secondary_survey::integer + msc.recovery_position::integer)::numeric::numeric(18,0) / 21.0
            ELSE (msc.safety_assessement::integer + msc.check_response::integer + msc.shout_for_help_003::integer + msc.initiate_cpr_001::integer + msc.debrief_or_assign_tasks::integer + msc.offer_leadership::integer + msc.assess::integer + msc.head_titl_chin_lift::integer + msc.jaw_thrust::integer + msc.maintain_airway::integer + msc.identify_cpr_lormarks::integer + msc.demo_cpr::integer + msc._30_2_cpr::integer + msc.reassess_breathing::integer + msc._2min_exchanges_cpr::integer + msc.perimotem_cs::integer + msc.o2_recovery_room::integer + msc.assess_circulation_inverted_j::integer + msc.iv_fluids::integer + msc.perform_secondary_survey::integer + msc.recovery_position::integer)::numeric::numeric(18,0) / 21.0
        END AS "average score"
   FROM mentors.moh_skills_checklist msc
  WHERE msc.skill_evaluation::text = 'Maternal resuscitation'::character varying::text;
```

### 12. mentors.nasg_evaluation_2026 source
```sql
CREATE OR REPLACE VIEW mentors.nasg_evaluation_2026
AS SELECT msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.obtain_consent_008::integer AS "obtain consent", msc.ipc_precautions::integer AS ipc, msc.placing_woman_on_nasg::integer AS "nasg placement", msc.segment1_2_application::integer AS "segment 1 & 2", msc.nasg_snapping_test::integer AS "snapping test", msc.segment2_3_application::integer AS "segment 2 & 3", msc.segment4_application::integer AS "segment 4", msc.segment5_placement::integer AS "segment 5", msc.segment_6_placement_001::integer AS "segment 6", msc.woman_can_breathe_normally::integer AS "can breathe normally", msc.other_pph_management::integer AS "other management", msc.monitor_sob_oliguria::integer AS "sob & oliguria monitoring", msc.message_to_mother_006::integer AS "when to remove", msc.vital_signs_before_removal::integer AS "vital signs", msc.open_segment_pair_1_or_2::integer AS "open segment 1/2", msc.when_to_remove_next_segment::integer AS "next segment removal", msc.when_reclose_segments::integer AS "reclose segments", msc.message_to_mother_007::integer AS "message to mother", msc.document_results::integer AS "document results",
        CASE
            WHEN msc.date_submitted <= '2026-04-01'::date THEN (msc.obtain_consent_008::integer + msc.ipc_precautions::integer + msc.placing_woman_on_nasg::integer + msc.segment1_2_application::integer + msc.nasg_snapping_test::integer + msc.segment2_3_application::integer + msc.segment4_application::integer + msc.segment5_placement::integer + msc.segment_6_placement_001::integer + msc.woman_can_breathe_normally::integer + msc.other_pph_management::integer + msc.monitor_sob_oliguria::integer + msc.message_to_mother_006::integer + msc.vital_signs_before_removal::integer + msc.open_segment_pair_1_or_2::integer + msc.when_to_remove_next_segment::integer + msc.when_reclose_segments::integer + msc.message_to_mother_007::integer)::numeric::numeric(18,0) / 18.0
            ELSE (msc.obtain_consent_008::integer + msc.ipc_precautions::integer + msc.placing_woman_on_nasg::integer + msc.segment1_2_application::integer + msc.nasg_snapping_test::integer + msc.segment2_3_application::integer + msc.segment4_application::integer + msc.segment5_placement::integer + msc.segment_6_placement_001::integer + msc.woman_can_breathe_normally::integer + msc.other_pph_management::integer + msc.monitor_sob_oliguria::integer + msc.message_to_mother_006::integer + msc.vital_signs_before_removal::integer + msc.open_segment_pair_1_or_2::integer + msc.when_to_remove_next_segment::integer + msc.when_reclose_segments::integer + msc.message_to_mother_007::integer + msc.document_results::integer)::numeric::numeric(18,0) / 19.0
        END AS "average score"
   FROM mentors.moh_skills_checklist msc
  WHERE msc.skill_evaluation::text = 'NASG'::text;
```

### 13. mentors.partograph_evaluation_2026 source
```sql
CREATE OR REPLACE VIEW mentors.partograph_evaluation_2026
AS SELECT msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.explain_procedure_mother::integer AS explain_procedure_mother, msc.obtain_informed_consent::integer AS obtain_informed_consent, msc.decide_partograph_case::integer AS decide_partograph_case, msc.plot_patient_biodata::integer AS plot_patient_biodata, msc.plot_cervical_dilatation::integer AS plot_cervical_dilatation, msc.plot_descent::integer AS plot_descent, msc.plot_fetal_heart::integer AS plot_fetal_heart, msc.plot_amniotic_fluid::integer AS plot_amniotic_fluid, msc.plot_moulding::integer AS plot_moulding, msc.plot_contractions::integer AS plot_contractions, msc.plot_maternal_vitals::integer AS plot_maternal_vitals, msc.interpret_findings::integer AS interpret_findings, msc.explain_labour_progress::integer AS explain_labour_progress, msc.joint_decision_mother::integer AS joint_decision_mother, msc.document_procedures::integer AS document_procedures, avg((msc.explain_procedure_mother::integer + msc.obtain_informed_consent::integer + msc.decide_partograph_case::integer + msc.plot_patient_biodata::integer + msc.plot_cervical_dilatation::integer + msc.plot_descent::integer + msc.plot_fetal_heart::integer + msc.plot_amniotic_fluid::integer + msc.plot_moulding::integer + msc.plot_contractions::integer + msc.plot_maternal_vitals::integer + msc.interpret_findings::integer + msc.explain_labour_progress::integer + msc.joint_decision_mother::integer + msc.document_procedures::integer)::numeric::numeric(18,0) / 15.0) AS "average score"
   FROM mentors.moh_skills_checklist msc
  WHERE msc.skill_evaluation::text = 'Partograph'::character varying::text
  GROUP BY msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.explain_procedure_mother, msc.obtain_informed_consent, msc.decide_partograph_case, msc.plot_patient_biodata, msc.plot_cervical_dilatation, msc.plot_descent, msc.plot_fetal_heart, msc.plot_amniotic_fluid, msc.plot_moulding, msc.plot_contractions, msc.plot_maternal_vitals, msc.interpret_findings, msc.explain_labour_progress, msc.joint_decision_mother, msc.document_procedures;
```

### 14. mentors.perineal_tear_repair_evaluation_2026 source
```sql
CREATE OR REPLACE VIEW mentors.perineal_tear_repair_evaluation_2026
AS SELECT msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.obtain_consent_010::integer AS "obtain consent",
        CASE
            WHEN msc.date_submitted::date <= '2026-04-01'::date THEN msc.high_lithotomy_position::integer
            ELSE msc.drape_in_place2::integer
        END AS "drape in place", msc.high_lithotomy_position::integer AS "high lithotomy", msc.asepsis::integer AS asepsis, msc.clean_perinuem_001::integer AS "cleaning perineum", msc.draping_catheterization::integer AS "draping & catheterization", msc.local_anesthesia_examination::integer AS "local anesthesia & exam", msc.classify_tear_degree::integer AS "tear classification", msc.gauze_to_improve_visibility::integer AS "gauze for visibility", msc.suturing_from_appex::integer AS "suturing from apex", msc.non_locking_stitch::integer AS "non locking stitch", msc.avoiding_hematoma::integer AS "avoiding hematoma", msc.completing_perineal_repair::integer AS "completing repair", msc.message_to_mother_009::integer AS "terminal loop knot", msc.anal_sphincter_repair::integer AS "anal sphincter repair", msc.message_to_mother_010::integer AS "message to mother", msc.health_talk::integer AS "health talk", (msc.obtain_consent_010::integer +
        CASE
            WHEN msc.date_submitted::date <= '2026-04-01'::date THEN msc.high_lithotomy_position::integer
            ELSE msc.drape_in_place2::integer
        END + msc.high_lithotomy_position::integer + msc.asepsis::integer + msc.clean_perinuem_001::integer + msc.draping_catheterization::integer + msc.local_anesthesia_examination::integer + msc.classify_tear_degree::integer + msc.gauze_to_improve_visibility::integer + msc.suturing_from_appex::integer + msc.non_locking_stitch::integer + msc.avoiding_hematoma::integer + msc.completing_perineal_repair::integer + msc.message_to_mother_009::integer + msc.anal_sphincter_repair::integer + msc.message_to_mother_010::integer + msc.health_talk::integer)::numeric::numeric(18,0) / 17.0 AS "average score"
   FROM mentors.moh_skills_checklist msc
  WHERE msc.skill_evaluation::text = 'Perineal repair'::character varying::text
  GROUP BY msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.obtain_consent_010, msc.high_lithotomy_position, msc.drape_in_place2, msc.asepsis, msc.clean_perinuem_001, msc.draping_catheterization, msc.local_anesthesia_examination, msc.classify_tear_degree, msc.gauze_to_improve_visibility, msc.suturing_from_appex, msc.non_locking_stitch, msc.avoiding_hematoma, msc.completing_perineal_repair, msc.message_to_mother_009, msc.anal_sphincter_repair, msc.message_to_mother_010, msc.health_talk;
```

### 15. mentors.pih_evaluation_2026 source
```sql
CREATE OR REPLACE VIEW mentors.pih_evaluation_2026
AS SELECT msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.diagnosis::integer AS diagnosis, msc.management_principles::integer AS "management principles", msc.explain_to_mother::integer AS "explain to mother",
        CASE
            WHEN msc.date_submitted < '2026-04-01'::date THEN msc.handwashing_and_start::integer
            ELSE msc.horwashing_or_start::integer
        END AS "hand washing", msc.fix_iv_line::integer AS "iv line", msc.mgso4_preparation::integer AS "mgso4 prep", msc.iv_loading_dose::integer AS "iv ld dose", msc.duration_mgso4_bolus::integer AS "iv bolus duration", msc.dosage_duration::integer AS "ld dosage duration", msc.maintenance_dose_duration::integer AS "maintaince dose duration", msc.dosing_iv_im::integer AS "iv im dosage", msc.eclampsia_diagnosis::integer AS "eclampsia diagnosis", msc.assess_for_danger::integer AS "assess danger", msc.toxicity_monitoring::integer AS "toxicity monitoring", msc.left_lateral_tilt_position::integer AS "patient position", msc.airway_protection::integer AS "airway protection", msc.convulsions_controlled::integer AS "fit controlled", msc._80mls_hr_infusion::integer AS "iv fluids", msc.managing_recurrent_seizures::integer AS "recurrent fits", msc.monitoring_before_next_dose::integer AS "mgso4 monitoring", msc.first_signs_mgso4_toxicity::integer AS "mgso4 toxicity signs", msc.mgso4_toxicity_checks::integer AS "mgso4 toxicity checks", msc.mgso4_antidote::integer AS "mgso4 antidote", avg((msc.diagnosis::integer + msc.management_principles::integer + msc.explain_to_mother::integer +
        CASE
            WHEN msc.date_submitted < '2026-04-01'::date THEN msc.handwashing_and_start::integer
            ELSE msc.horwashing_or_start::integer
        END + msc.fix_iv_line::integer + msc.mgso4_preparation::integer + msc.iv_loading_dose::integer + msc.duration_mgso4_bolus::integer + msc.dosage_duration::integer + msc.maintenance_dose_duration::integer + msc.dosing_iv_im::integer + msc.eclampsia_diagnosis::integer + msc.assess_for_danger::integer + msc.toxicity_monitoring::integer + msc.left_lateral_tilt_position::integer + msc.airway_protection::integer + msc.convulsions_controlled::integer + msc._80mls_hr_infusion::integer + msc.managing_recurrent_seizures::integer + msc.monitoring_before_next_dose::integer + msc.first_signs_mgso4_toxicity::integer + msc.mgso4_toxicity_checks::integer + msc.mgso4_antidote::integer)::numeric::numeric(18,0) /
        CASE
            WHEN msc.date_submitted < '2026-04-01'::date THEN 24.0
            ELSE 23.0
        END) AS "average score"
   FROM mentors.moh_skills_checklist msc
  WHERE msc.skill_evaluation::text = 'Preeclampsia / Eclampsia'::text
  GROUP BY msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.diagnosis, msc.management_principles, msc.explain_to_mother, msc.handwashing_and_start, msc.horwashing_or_start, msc.fix_iv_line, msc.mgso4_preparation, msc.iv_loading_dose, msc.duration_mgso4_bolus, msc.dosage_duration, msc.maintenance_dose_duration, msc.dosing_iv_im, msc.eclampsia_diagnosis, msc.assess_for_danger, msc.toxicity_monitoring, msc.left_lateral_tilt_position, msc.airway_protection, msc.convulsions_controlled, msc._80mls_hr_infusion, msc.managing_recurrent_seizures, msc.monitoring_before_next_dose, msc.first_signs_mgso4_toxicity, msc.mgso4_toxicity_checks, msc.mgso4_antidote;
```

### 16. mentors.process_moh_skills_assessment_2026 source
```sql
CREATE OR REPLACE VIEW mentors.process_moh_skills_assessment_2026
AS ((((((((((((((((((( SELECT amstl_evaluation_2026.submission_id, amstl_evaluation_2026.date_started, amstl_evaluation_2026.date_ended, amstl_evaluation_2026.date_submitted, amstl_evaluation_2026.county, amstl_evaluation_2026.facility, amstl_evaluation_2026.facility_code, amstl_evaluation_2026.program, amstl_evaluation_2026.mentee_name, amstl_evaluation_2026.mentee_id, amstl_evaluation_2026.skill_evaluation, amstl_evaluation_2026."average score" AS average_score
   FROM mentors.amstl_evaluation_2026
UNION ALL
 SELECT avd_evaluation_2026.submission_id, avd_evaluation_2026.date_started, avd_evaluation_2026.date_ended, avd_evaluation_2026.date_submitted, avd_evaluation_2026.county, avd_evaluation_2026.facility, avd_evaluation_2026.facility_code, avd_evaluation_2026.program, avd_evaluation_2026.mentee_name, avd_evaluation_2026.mentee_id, avd_evaluation_2026.skill_evaluation, avd_evaluation_2026."average score" AS average_score
   FROM mentors.avd_evaluation_2026)
UNION ALL
 SELECT b_lynch_evaluation_2026.submission_id, b_lynch_evaluation_2026.date_started, b_lynch_evaluation_2026.date_ended, b_lynch_evaluation_2026.date_submitted, b_lynch_evaluation_2026.county, b_lynch_evaluation_2026.facility, b_lynch_evaluation_2026.facility_code, b_lynch_evaluation_2026.program, b_lynch_evaluation_2026.mentee_name, b_lynch_evaluation_2026.mentee_id, b_lynch_evaluation_2026.skill_evaluation, b_lynch_evaluation_2026."average score" AS average_score
   FROM mentors.b_lynch_evaluation_2026)
UNION ALL
 SELECT bimanual_uterine_compression_evaluation_2026.submission_id, bimanual_uterine_compression_evaluation_2026.date_started, bimanual_uterine_compression_evaluation_2026.date_ended, bimanual_uterine_compression_evaluation_2026.date_submitted, bimanual_uterine_compression_evaluation_2026.county, bimanual_uterine_compression_evaluation_2026.facility, bimanual_uterine_compression_evaluation_2026.facility_code, bimanual_uterine_compression_evaluation_2026.program, bimanual_uterine_compression_evaluation_2026.mentee_name, bimanual_uterine_compression_evaluation_2026.mentee_id, bimanual_uterine_compression_evaluation_2026.skill_evaluation, bimanual_uterine_compression_evaluation_2026."average score" AS average_score
   FROM mentors.bimanual_uterine_compression_evaluation_2026)
UNION ALL
 SELECT breech_delivery_evaluation_2026.submission_id, breech_delivery_evaluation_2026.date_started, breech_delivery_evaluation_2026.date_ended, breech_delivery_evaluation_2026.date_submitted, breech_delivery_evaluation_2026.county, breech_delivery_evaluation_2026.facility, breech_delivery_evaluation_2026.facility_code, breech_delivery_evaluation_2026.program, breech_delivery_evaluation_2026.mentee_name, breech_delivery_evaluation_2026.mentee_id, breech_delivery_evaluation_2026.skill_evaluation, breech_delivery_evaluation_2026."average score" AS average_score
   FROM mentors.breech_delivery_evaluation_2026)
UNION ALL
 SELECT mre.submission_id, mre.date_started, mre.date_ended, mre.date_submitted, mre.county, mre.facility, mre.facility_code, mre.program, mre.mentee_name, mre.mentee_id, mre.skill_evaluation, mre."average score" AS average_score
   FROM mentors.maternal_resuscitation_evaluation_2026 mre)
UNION ALL
 SELECT cervical_tear_repair_evaluation_2026.submission_id, cervical_tear_repair_evaluation_2026.date_started, cervical_tear_repair_evaluation_2026.date_ended, cervical_tear_repair_evaluation_2026.date_submitted, cervical_tear_repair_evaluation_2026.county, cervical_tear_repair_evaluation_2026.facility, cervical_tear_repair_evaluation_2026.facility_code, cervical_tear_repair_evaluation_2026.program, cervical_tear_repair_evaluation_2026.mentee_name, cervical_tear_repair_evaluation_2026.mentee_id, cervical_tear_repair_evaluation_2026.skill_evaluation, cervical_tear_repair_evaluation_2026."average score" AS average_score
   FROM mentors.cervical_tear_repair_evaluation_2026)
UNION ALL
 SELECT compression_abdominal_aorta_evaluation_2026.submission_id, compression_abdominal_aorta_evaluation_2026.date_started, compression_abdominal_aorta_evaluation_2026.date_ended, compression_abdominal_aorta_evaluation_2026.date_submitted, compression_abdominal_aorta_evaluation_2026.county, compression_abdominal_aorta_evaluation_2026.facility, compression_abdominal_aorta_evaluation_2026.facility_code, compression_abdominal_aorta_evaluation_2026.program, compression_abdominal_aorta_evaluation_2026.mentee_name, compression_abdominal_aorta_evaluation_2026.mentee_id, compression_abdominal_aorta_evaluation_2026.skill_evaluation, compression_abdominal_aorta_evaluation_2026."average score" AS average_score
   FROM mentors.compression_abdominal_aorta_evaluation_2026)
UNION ALL
 SELECT cord_prolapse_evaluation_2026.submission_id, cord_prolapse_evaluation_2026.date_started, cord_prolapse_evaluation_2026.date_ended, cord_prolapse_evaluation_2026.date_submitted, cord_prolapse_evaluation_2026.county, cord_prolapse_evaluation_2026.facility, cord_prolapse_evaluation_2026.facility_code, cord_prolapse_evaluation_2026.program, cord_prolapse_evaluation_2026.mentee_name, cord_prolapse_evaluation_2026.mentee_id, cord_prolapse_evaluation_2026.skill_evaluation, cord_prolapse_evaluation_2026."average score" AS average_score
   FROM mentors.cord_prolapse_evaluation_2026)
UNION ALL
 SELECT maternal_shock_evaluation_2026.submission_id, maternal_shock_evaluation_2026.date_started, maternal_shock_evaluation_2026.date_ended, maternal_shock_evaluation_2026.date_submitted, maternal_shock_evaluation_2026.county, maternal_shock_evaluation_2026.facility, maternal_shock_evaluation_2026.facility_code, maternal_shock_evaluation_2026.program, maternal_shock_evaluation_2026.mentee_name, maternal_shock_evaluation_2026.mentee_id, maternal_shock_evaluation_2026.skill_evaluation, maternal_shock_evaluation_2026."average score" AS average_score
   FROM mentors.maternal_shock_evaluation_2026)
UNION ALL
 SELECT nasg_evaluation_2026.submission_id, nasg_evaluation_2026.date_started, nasg_evaluation_2026.date_ended, nasg_evaluation_2026.date_submitted, nasg_evaluation_2026.county, nasg_evaluation_2026.facility, nasg_evaluation_2026.facility_code, nasg_evaluation_2026.program, nasg_evaluation_2026.mentee_name, nasg_evaluation_2026.mentee_id, nasg_evaluation_2026.skill_evaluation, nasg_evaluation_2026."average score" AS average_score
   FROM mentors.nasg_evaluation_2026)
UNION ALL
 SELECT perineal_tear_repair_evaluation_2026.submission_id, perineal_tear_repair_evaluation_2026.date_started, perineal_tear_repair_evaluation_2026.date_ended, perineal_tear_repair_evaluation_2026.date_submitted, perineal_tear_repair_evaluation_2026.county, perineal_tear_repair_evaluation_2026.facility, perineal_tear_repair_evaluation_2026.facility_code, perineal_tear_repair_evaluation_2026.program, perineal_tear_repair_evaluation_2026.mentee_name, perineal_tear_repair_evaluation_2026.mentee_id, perineal_tear_repair_evaluation_2026.skill_evaluation, perineal_tear_repair_evaluation_2026."average score" AS average_score
   FROM mentors.perineal_tear_repair_evaluation_2026)
UNION ALL
 SELECT pih_evaluation_2026.submission_id, pih_evaluation_2026.date_started, pih_evaluation_2026.date_ended, pih_evaluation_2026.date_submitted, pih_evaluation_2026.county, pih_evaluation_2026.facility, pih_evaluation_2026.facility_code, pih_evaluation_2026.program, pih_evaluation_2026.mentee_name, pih_evaluation_2026.mentee_id, pih_evaluation_2026.skill_evaluation, pih_evaluation_2026."average score" AS average_score
   FROM mentors.pih_evaluation_2026)
UNION ALL
 SELECT shoulder_dystocia_evaluation_2026.submission_id, shoulder_dystocia_evaluation_2026.date_started, shoulder_dystocia_evaluation_2026.date_ended, shoulder_dystocia_evaluation_2026.date_submitted, shoulder_dystocia_evaluation_2026.county, shoulder_dystocia_evaluation_2026.facility, shoulder_dystocia_evaluation_2026.facility_code, shoulder_dystocia_evaluation_2026.program, shoulder_dystocia_evaluation_2026.mentee_name, shoulder_dystocia_evaluation_2026.mentee_id, shoulder_dystocia_evaluation_2026.skill_evaluation, shoulder_dystocia_evaluation_2026."average score" AS average_score
   FROM mentors.shoulder_dystocia_evaluation_2026)
UNION ALL
 SELECT ubt_evaluation_2026.submission_id, ubt_evaluation_2026.date_started, ubt_evaluation_2026.date_ended, ubt_evaluation_2026.date_submitted, ubt_evaluation_2026.county, ubt_evaluation_2026.facility, ubt_evaluation_2026.facility_code, ubt_evaluation_2026.program, ubt_evaluation_2026.mentee_name, ubt_evaluation_2026.mentee_id, ubt_evaluation_2026.skill_evaluation, ubt_evaluation_2026."average score" AS average_score
   FROM mentors.ubt_evaluation_2026)
UNION ALL
 SELECT ubt_free_flow_evaluation_2026.submission_id, ubt_free_flow_evaluation_2026.date_started, ubt_free_flow_evaluation_2026.date_ended, ubt_free_flow_evaluation_2026.date_submitted, ubt_free_flow_evaluation_2026.county, ubt_free_flow_evaluation_2026.facility, ubt_free_flow_evaluation_2026.facility_code, ubt_free_flow_evaluation_2026.program, ubt_free_flow_evaluation_2026.mentee_name, ubt_free_flow_evaluation_2026.mentee_id, ubt_free_flow_evaluation_2026.skill_evaluation, ubt_free_flow_evaluation_2026."average score" AS average_score
   FROM mentors.ubt_free_flow_evaluation_2026)
UNION ALL
 SELECT manual_placenta_removal_evaluation_2026.submission_id, manual_placenta_removal_evaluation_2026.date_started, manual_placenta_removal_evaluation_2026.date_ended, manual_placenta_removal_evaluation_2026.date_submitted, manual_placenta_removal_evaluation_2026.county, manual_placenta_removal_evaluation_2026.facility, manual_placenta_removal_evaluation_2026.facility_code, manual_placenta_removal_evaluation_2026.program, manual_placenta_removal_evaluation_2026.mentee_name, manual_placenta_removal_evaluation_2026.mentee_id, manual_placenta_removal_evaluation_2026.skill_evaluation, manual_placenta_removal_evaluation_2026."average score" AS average_score
   FROM mentors.manual_placenta_removal_evaluation_2026)
UNION ALL
 SELECT uterine_inversion_evaluation_2026.submission_id, uterine_inversion_evaluation_2026.date_started, uterine_inversion_evaluation_2026.date_ended, uterine_inversion_evaluation_2026.date_submitted, uterine_inversion_evaluation_2026.county, uterine_inversion_evaluation_2026.facility, uterine_inversion_evaluation_2026.facility_code, uterine_inversion_evaluation_2026.program, uterine_inversion_evaluation_2026.mentee_name, uterine_inversion_evaluation_2026.mentee_id, uterine_inversion_evaluation_2026.skill_evaluation, uterine_inversion_evaluation_2026."average score" AS average_score
   FROM mentors.uterine_inversion_evaluation_2026)
UNION ALL
 SELECT partograph_evaluation_2026.submission_id, partograph_evaluation_2026.date_started, partograph_evaluation_2026.date_ended, partograph_evaluation_2026.date_submitted, partograph_evaluation_2026.county, partograph_evaluation_2026.facility, partograph_evaluation_2026.facility_code, partograph_evaluation_2026.program, partograph_evaluation_2026.mentee_name, partograph_evaluation_2026.mentee_id, partograph_evaluation_2026.skill_evaluation, partograph_evaluation_2026."average score" AS average_score
   FROM mentors.partograph_evaluation_2026)
UNION ALL
 SELECT emotive_evaluation_2026.submission_id, emotive_evaluation_2026.date_started, emotive_evaluation_2026.date_ended, emotive_evaluation_2026.date_submitted, emotive_evaluation_2026.county, emotive_evaluation_2026.facility, emotive_evaluation_2026.facility_code, emotive_evaluation_2026.program, emotive_evaluation_2026.mentee_name, emotive_evaluation_2026.mentee_id, emotive_evaluation_2026.skill_evaluation, emotive_evaluation_2026."average score" AS average_score
   FROM mentors.emotive_evaluation_2026)
UNION ALL
 SELECT newborn_resuscitation_evaluation_2026.submission_id, newborn_resuscitation_evaluation_2026.date_started, newborn_resuscitation_evaluation_2026.date_ended, newborn_resuscitation_evaluation_2026.date_submitted, newborn_resuscitation_evaluation_2026.county, newborn_resuscitation_evaluation_2026.facility, newborn_resuscitation_evaluation_2026.facility_code, newborn_resuscitation_evaluation_2026.program, newborn_resuscitation_evaluation_2026.mentee_name, newborn_resuscitation_evaluation_2026.mentee_id, newborn_resuscitation_evaluation_2026.skill_evaluation, newborn_resuscitation_evaluation_2026."average score" AS average_score
   FROM mentors.newborn_resuscitation_evaluation_2026;
```

### 17. mentors.shoulder_dystocia_evaluation_2026 source
```sql
CREATE OR REPLACE VIEW mentors.shoulder_dystocia_evaluation_2026
AS SELECT msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.shout_for_help_002::integer AS "shout for help", msc.obtain_consent_006::integer AS "obtain consent", msc.aim_to_deliver_within_5_min::integer AS "aim to deliver < 5", msc.woman_not_to_push::integer AS "woman not to push", msc.evaluates_for_episiotomy_001::integer AS "evaluate episiotomy", msc.mcrobert_position::integer AS "mcroberts position", msc.rubin_1_maneuver::integer AS "rubin 1", msc.rubin_2_maneuver::integer AS "rubin 2", msc.wood_screw_maneuver::integer AS "wood screw maneuver", msc.deliver_posterior_shoulder::integer AS "deliver posterior shoulder", msc.gaskins_maneuver::integer AS "gaskins maneuver", msc._3rd_stage_labor::integer AS "3rd stage labor", msc.prep_for_nnr::integer AS "prepare for nnr", msc.message_to_mother_004::integer AS "message to mother", msc.monitor_the_baby::integer AS "monitor the baby", (msc.shout_for_help_002::integer + msc.obtain_consent_006::integer + msc.aim_to_deliver_within_5_min::integer + msc.woman_not_to_push::integer + msc.evaluates_for_episiotomy_001::integer + msc.mcrobert_position::integer + msc.rubin_1_maneuver::integer + msc.rubin_2_maneuver::integer + msc.wood_screw_maneuver::integer + msc.deliver_posterior_shoulder::integer + msc.gaskins_maneuver::integer + msc._3rd_stage_labor::integer + msc.prep_for_nnr::integer + msc.message_to_mother_004::integer + msc.monitor_the_baby::integer)::numeric::numeric(18,0) / 15.0 AS "average score"
   FROM mentors.moh_skills_checklist msc
  WHERE msc.skill_evaluation::text = 'Shoulder dystocia'::character varying::text
  GROUP BY msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.shout_for_help_002, msc.obtain_consent_006, msc.aim_to_deliver_within_5_min, msc.woman_not_to_push, msc.evaluates_for_episiotomy_001, msc.mcrobert_position, msc.rubin_1_maneuver, msc.rubin_2_maneuver, msc.wood_screw_maneuver, msc.deliver_posterior_shoulder, msc.gaskins_maneuver, msc._3rd_stage_labor, msc.prep_for_nnr, msc.message_to_mother_004, msc.monitor_the_baby;
```

### 18. mentors.ubt_evaluation_2026 source
```sql
CREATE OR REPLACE VIEW mentors.ubt_evaluation_2026
AS SELECT msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.obtain_consent_002::integer AS "obtain consent", msc.sterile_gloves_001::integer AS "sterile gloves", msc.balloon_over_catheter::integer AS "balloon over catheter", msc.tie_the_balloon::integer AS "tie balloon", msc.inflate_balloon_with_20cc::integer AS "inflate balloon 20cc", msc.inflate_balloon_with_20cc_001::integer AS "identify cervix", msc.grasp_anterior_cervix::integer AS "grasp anterior cervix", msc.place_balloon_into_uterus::integer AS "balloon into uterus", msc.inflate_balloon_300ml_500ml::integer AS "inflate 300–500ml", msc.clamp_catheter::integer AS "clamp catheter", msc.balloon_insitu_24hrs::integer AS "balloon in situ 24hrs", msc.oxytocin_20iu_in_ns::integer AS "oxytocin 20iu in ns", msc.antibiotics_001::integer AS antibiotics, msc.monitoring::integer AS monitoring, msc.deflate_50mls_q_hr::integer AS "deflate 50ml/hr", msc.reinflate_50mls_bleeding_recur::integer AS "reinflate if bleeding recurs", msc.surgical_intervention_bleeding::integer AS "surgical intervention", msc.transfusion::integer AS transfusion, msc.message_to_mother_001::integer AS "message to mother", msc.documentation::integer AS documentation, (msc.obtain_consent_002::integer + msc.sterile_gloves_001::integer + msc.balloon_over_catheter::integer + msc.tie_the_balloon::integer + msc.inflate_balloon_with_20cc::integer + msc.inflate_balloon_with_20cc_001::integer + msc.grasp_anterior_cervix::integer + msc.place_balloon_into_uterus::integer + msc.inflate_balloon_300ml_500ml::integer + msc.clamp_catheter::integer + msc.balloon_insitu_24hrs::integer + msc.oxytocin_20iu_in_ns::integer + msc.antibiotics_001::integer + msc.monitoring::integer + msc.deflate_50mls_q_hr::integer + msc.reinflate_50mls_bleeding_recur::integer + msc.surgical_intervention_bleeding::integer + msc.transfusion::integer + msc.message_to_mother_001::integer + msc.documentation::integer)::numeric::numeric(18,0) / 20.0 AS "average score"
   FROM mentors.moh_skills_checklist msc
  WHERE msc.skill_evaluation::text = 'UBT'::character varying::text
  GROUP BY msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.obtain_consent_002, msc.sterile_gloves_001, msc.balloon_over_catheter, msc.tie_the_balloon, msc.inflate_balloon_with_20cc, msc.inflate_balloon_with_20cc_001, msc.grasp_anterior_cervix, msc.place_balloon_into_uterus, msc.inflate_balloon_300ml_500ml, msc.clamp_catheter, msc.balloon_insitu_24hrs, msc.oxytocin_20iu_in_ns, msc.antibiotics_001, msc.monitoring, msc.deflate_50mls_q_hr, msc.reinflate_50mls_bleeding_recur, msc.surgical_intervention_bleeding, msc.transfusion, msc.message_to_mother_001, msc.documentation;
```

### 19. mentors.ubt_free_flow_evaluation_2026 source
```sql
CREATE OR REPLACE VIEW mentors.ubt_free_flow_evaluation_2026
AS SELECT msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.obtain_consent::integer AS "obtain consent", msc.sterile_gloves::integer AS "sterile gloves", msc.assemble_ubt::integer AS "assemble utb", msc.hungon_drip_stand_valve_closed::integer AS "close valve", msc.lithotomy_position::integer AS "lithotomy position", msc.clean_perinuem::integer AS "clean perineum", msc.catheterize::integer AS catheterize, msc.drape_patient::integer AS "drape patient", msc.visualize_cervix_sims_speculum::integer AS "visualize cervix", msc.stabilize_uterus::integer AS "stabilize uterus", msc.remove_speculum::integer AS "remove speculum", msc.insert_balloon::integer AS "insert balloon", msc.withdraw_forceps::integer AS "withdraw forceps", msc.prevent_expulsion_when_inflati::integer AS "prevent expulsion", msc.inflate_balloon::integer AS "inflate balloon", msc.inflate_until_equilibrium::integer AS "attain equilibrium", msc.balloon_insitu_check_bleeding::integer AS "check bleeding", msc.determine_approp_bag_height::integer AS "appropriate bag height", msc.not_level_when_bleeding_stops::integer AS "note level bleeding stops", msc.observe_patient::integer AS "observe patient", msc.secure_tubing::integer AS "secure tubing", msc.antibiotics::integer AS antibiotics, msc.documentation_time_level::integer AS "document time & level", msc.continue_iv_fluids::integer AS "continue iv fluids", msc.vital_signs::integer AS "vital signs", msc.when_to_remove::integer AS "when to remove", msc.drain_balloon::integer AS "drain balloon", msc.remove_balloon_gently::integer AS "remove balloon gently", msc.post_removal_monitoring::integer AS "monitoring post removal", msc.activity_resumption::integer AS "activity resumption", msc.what_if_bleeing_resumes::integer AS "if bleeding resumes", msc.referral::integer AS referral, msc.close_valve_in_transfer::integer AS "valve closure & transfer", msc.document::integer AS document, (msc.obtain_consent::integer + msc.sterile_gloves::integer + msc.assemble_ubt::integer + msc.hungon_drip_stand_valve_closed::integer + msc.lithotomy_position::integer + msc.clean_perinuem::integer + msc.catheterize::integer + msc.drape_patient::integer + msc.visualize_cervix_sims_speculum::integer + msc.stabilize_uterus::integer + msc.remove_speculum::integer + msc.insert_balloon::integer + msc.withdraw_forceps::integer + msc.prevent_expulsion_when_inflati::integer + msc.inflate_balloon::integer + msc.inflate_until_equilibrium::integer + msc.balloon_insitu_check_bleeding::integer + msc.determine_approp_bag_height::integer + msc.not_level_when_bleeding_stops::integer + msc.observe_patient::integer + msc.secure_tubing::integer + msc.antibiotics::integer + msc.documentation_time_level::integer + msc.continue_iv_fluids::integer + msc.vital_signs::integer + msc.when_to_remove::integer + msc.drain_balloon::integer + msc.remove_balloon_gently::integer + msc.post_removal_monitoring::integer + msc.activity_resumption::integer + msc.what_if_bleeing_resumes::integer + msc.referral::integer + msc.close_valve_in_transfer::integer + msc.document::integer)::numeric::numeric(18,0) / 34.0 AS "average score"
   FROM mentors.moh_skills_checklist msc
  WHERE msc.skill_evaluation::text = 'UBT (free flow)'::character varying::text
  GROUP BY msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.obtain_consent, msc.sterile_gloves, msc.assemble_ubt, msc.hungon_drip_stand_valve_closed, msc.lithotomy_position, msc.clean_perinuem, msc.catheterize, msc.drape_patient, msc.visualize_cervix_sims_speculum, msc.stabilize_uterus, msc.remove_speculum, msc.insert_balloon, msc.withdraw_forceps, msc.prevent_expulsion_when_inflati, msc.inflate_balloon, msc.inflate_until_equilibrium, msc.balloon_insitu_check_bleeding, msc.determine_approp_bag_height, msc.not_level_when_bleeding_stops, msc.observe_patient, msc.secure_tubing, msc.antibiotics, msc.documentation_time_level, msc.continue_iv_fluids, msc.vital_signs, msc.when_to_remove, msc.drain_balloon, msc.remove_balloon_gently, msc.post_removal_monitoring, msc.activity_resumption, msc.what_if_bleeing_resumes, msc.referral, msc.close_valve_in_transfer, msc.document;
```

### 20. mentors.uterine_inversion_evaluation_2026 source
```sql
CREATE OR REPLACE VIEW mentors.uterine_inversion_evaluation_2026
AS SELECT msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.shout_for_help::integer AS shout_for_help, msc.blood_monitoring_drape::integer AS blood_monitoring_drape, msc.emergency_team_roles::integer AS emergency_team_roles, msc.rapid_initial_assessment::integer AS rapid_initial_assessment, msc.ensure_patient_privacy::integer AS ensure_patient_privacy, msc.explain_procedure_mother1::integer AS explain_procedure_mother1, msc.obtain_informed_consent1::integer AS obtain_informed_consent1, msc.assess_blood_loss::integer AS assess_blood_loss, msc.assess_abcs_resuscitate1::integer AS assess_abcs_resuscitate1, msc.stop_uterotonic_drugs::integer AS stop_uterotonic_drugs, msc.insert_iv_cannulae::integer AS insert_iv_cannulae, msc.collect_blood_samples1::integer AS collect_blood_samples1, msc.start_crystalloid_infusion::integer AS start_crystalloid_infusion, msc.insert_urinary_catheter::integer AS insert_urinary_catheter, msc.administer_analgesics_antibiotics::integer AS administer_analgesics_antibiotics, msc.hor_hygiene_ppe::integer AS hor_hygiene_ppe, msc.replace_uterine_fundus::integer AS replace_uterine_fundus, msc.remove_retained_placenta::integer AS remove_retained_placenta, msc.start_oxytocin_infusion::integer AS start_oxytocin_infusion, msc.examine_repair_tears::integer AS examine_repair_tears, msc.monitor_vitals_bleeding::integer AS monitor_vitals_bleeding, msc.explain_procedure_results::integer AS explain_procedure_results, msc.prepare_operating_theatre::integer AS prepare_operating_theatre, msc.inform_client_outcomes::integer AS inform_client_outcomes, msc.document_blood_loss::integer AS document_blood_loss, avg((msc.shout_for_help::integer + msc.blood_monitoring_drape::integer + msc.emergency_team_roles::integer + msc.rapid_initial_assessment::integer + msc.ensure_patient_privacy::integer + msc.explain_procedure_mother1::integer + msc.obtain_informed_consent1::integer + msc.assess_blood_loss::integer + msc.assess_abcs_resuscitate1::integer + msc.stop_uterotonic_drugs::integer + msc.insert_iv_cannulae::integer + msc.collect_blood_samples1::integer + msc.start_crystalloid_infusion::integer + msc.insert_urinary_catheter::integer + msc.administer_analgesics_antibiotics::integer + msc.hor_hygiene_ppe::integer + msc.replace_uterine_fundus::integer + msc.remove_retained_placenta::integer + msc.start_oxytocin_infusion::integer + msc.examine_repair_tears::integer + msc.monitor_vitals_bleeding::integer + msc.explain_procedure_results::integer + msc.prepare_operating_theatre::integer + msc.inform_client_outcomes::integer + msc.document_blood_loss::integer)::numeric::numeric(18,0) / 24.0) AS "average score"
   FROM mentors.moh_skills_checklist msc
  WHERE msc.skill_evaluation::text = 'Uterine Inversion'::character varying::text
  GROUP BY msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.shout_for_help, msc.blood_monitoring_drape, msc.emergency_team_roles, msc.rapid_initial_assessment, msc.ensure_patient_privacy, msc.explain_procedure_mother1, msc.obtain_informed_consent1, msc.assess_blood_loss, msc.assess_abcs_resuscitate1, msc.stop_uterotonic_drugs, msc.insert_iv_cannulae, msc.collect_blood_samples1, msc.start_crystalloid_infusion, msc.insert_urinary_catheter, msc.administer_analgesics_antibiotics, msc.hor_hygiene_ppe, msc.replace_uterine_fundus, msc.remove_retained_placenta, msc.start_oxytocin_infusion, msc.examine_repair_tears, msc.monitor_vitals_bleeding, msc.explain_procedure_results, msc.prepare_operating_theatre, msc.inform_client_outcomes, msc.document_blood_loss;
```

### 21. mentors.maternal_shock_evaluation_2026 source
```sql
CREATE OR REPLACE VIEW mentors.maternal_shock_evaluation_2026
AS SELECT msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.check_for_safety::integer AS "safety check", msc.check_for_response::integer AS "response check", msc.call_for_help_002::integer AS "call for help", msc.initiate_cpr::integer AS "initiate cpr", msc.assign_team_tasks::integer AS "assign tasks", msc.offer_leadership::integer AS "offer leader", msc.assess_airway::integer AS "assess airway", msc.oropharyngeal_airway::integer AS "oropharyngeal airway", msc.assess_breathing::integer AS "assess breathing", msc.assess_carotid_pulse::integer AS "carotid pulse", msc.cpr_30_2::integer AS "cpr ratio", msc.breathing_assessment::integer AS "breathing assessment", msc.give_oxygen::integer AS "give oxygen", msc.manage_circulation::integer AS "manage circulation", msc.check_pulse_bp::integer AS "check bp & pulse", msc.iv_fluids::integer AS "iv fluids", msc.transfuse_in_anemia::integer AS transfusion, msc.palpate_the_uterus::integer AS "uterine palpation", msc.inspect_external_genitalia::integer AS "inspect genitalia", msc.vaginal_exam_001::integer AS "vaginal exam", msc.repeat_vital_signs::integer AS "repeat vital signs", msc.input_output_monitoring::integer AS "i/o monitoring", msc.iv_antibiotics::integer AS "iv antibiotics", msc.offer_leadership::integer AS "offer leadership (standard)", msc.offer_leadership::integer AS "offer leadership (alt casing)",
        CASE
            WHEN msc.date_submitted <= '2026-04-01'::date THEN (msc.check_for_safety::integer + msc.check_for_response::integer + msc.call_for_help_002::integer + msc.initiate_cpr::integer + msc.assign_team_tasks::integer + msc.offer_leadership::integer + msc.assess_airway::integer + msc.oropharyngeal_airway::integer + msc.assess_breathing::integer + msc.assess_carotid_pulse::integer + msc.cpr_30_2::integer + msc.breathing_assessment::integer + msc.give_oxygen::integer + msc.manage_circulation::integer + msc.check_pulse_bp::integer + msc.iv_fluids::integer + msc.transfuse_in_anemia::integer + msc.palpate_the_uterus::integer + msc.inspect_external_genitalia::integer + msc.vaginal_exam_001::integer + msc.repeat_vital_signs::integer + msc.input_output_monitoring::integer + msc.iv_antibiotics::integer)::numeric::numeric(18,0) / 23.0
            ELSE (msc.check_for_safety::integer + msc.check_for_response::integer + msc.call_for_help_002::integer + msc.initiate_cpr::integer + msc.assign_team_tasks::integer + msc.offer_leadership::integer + msc.assess_airway::integer + msc.oropharyngeal_airway::integer + msc.assess_breathing::integer + msc.assess_carotid_pulse::integer + msc.cpr_30_2::integer + msc.breathing_assessment::integer + msc.give_oxygen::integer + msc.manage_circulation::integer + msc.check_pulse_bp::integer + msc.iv_fluids::integer + msc.transfuse_in_anemia::integer + msc.palpate_the_uterus::integer + msc.inspect_external_genitalia::integer + msc.vaginal_exam_001::integer + msc.repeat_vital_signs::integer + msc.input_output_monitoring::integer + msc.iv_antibiotics::integer)::numeric::numeric(18,0) / 23.0
        END AS "average score"
   FROM mentors.moh_skills_checklist msc
  WHERE msc.skill_evaluation::text = 'Maternal shock'::text;
```

### 22. mentors.newborn_resuscitation_evaluation_2026 source
```sql
CREATE OR REPLACE VIEW mentors.newborn_resuscitation_evaluation_2026
AS SELECT msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.delivery_of_the_baby::integer AS "baby delivery", msc.apgar_score::integer AS "apgar score", msc.call_for_help_001::integer AS "call for help", msc.abc_assessement::integer AS "abc assessment", msc._40_60_ventilation_breathes::integer AS "ventilation breathes", msc.reasess_abc::integer AS "reassess abc", msc.when_to_start_cpr::integer AS "initiating cpr", msc.ventilation_compression_ratio::integer AS "cpr ratio", msc.right_mask_size::integer AS "right mask", msc.position_mask_correctly::integer AS "mask position", msc._2_hand_technique_cpr::integer AS "2hand technique", msc.depth_of_compression::integer AS "compression depth", msc.warm_chain::integer AS "warm chain", msc.subsequent_abc_reassessement::integer AS "2 abc reassessment", msc.bvm_1_min_hr_60::integer AS "stopping ventilation", msc.another_abc_reassesment::integer AS "3 abc reassessment", msc.put_on_oxygen::integer AS "on oxygen", msc.arrangement_for_transfer::integer AS transfer,
        CASE
            WHEN msc.date_started <= '2026-04-01'::date THEN (msc.delivery_of_the_baby::integer + msc.apgar_score::integer + msc.call_for_help_001::integer + msc.abc_assessement::integer + msc._40_60_ventilation_breathes::integer + msc.reasess_abc::integer + msc.when_to_start_cpr::integer + msc.ventilation_compression_ratio::integer + msc.right_mask_size::integer + msc.position_mask_correctly::integer + msc._2_hand_technique_cpr::integer + msc.depth_of_compression::integer + msc.warm_chain::integer + msc.subsequent_abc_reassessement::integer + msc.bvm_1_min_hr_60::integer + msc.another_abc_reassesment::integer + msc.put_on_oxygen::integer + msc.arrangement_for_transfer::integer)::numeric::numeric(18,0) / 18.0
            ELSE (
            CASE
                WHEN msc.q1a_gestational_age THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1a_maternal_comorbidities THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1a_complications THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1a_prenatal_care_visits THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1a_anc_profile_lab_work THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1a_sultrasound_report_if_any THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1b_warm_room_25_28c THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1b_digital_room_thermometer THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1b_environment_no_sharps_spilage THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1b_gloves_both_sterile_and_clean THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1c_perform_hand_hygiene_and_wear_clean_gloves THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1c_radiant_warmer_prewarm_mode_with_two_towels_and_hat THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1c_two_prewarmed_towels_and_hat THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1c_mentions_about_clock THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1d_penguine_sucker_or_suction_machine THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1d_set_suction_machine_pressure_80_100mmhg THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1d_suction_catheter_6f_8f_and_wide_bore_yankauer_sucker THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1d_equipment_clean_and_functionality_checked THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1e_bvm_size_200_300ml THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1e_bvm_size_00_0_1 THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1e_nasal_prongs THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1e_neonatal_non_rebreather_mask THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1e_oxygen_source THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1e_oxygen_tubings THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1e_pulse_oximeter_with_neonatal_probe THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1e_cardiorespiratory_monitor THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1e_equipment_clean_and_functionality_checked THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1f_stethoscope THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1f_iv_adrenaline_0_2ml_per_kg_1_10000 THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q1f_normal_saline THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.essential_newborn_care THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.check_apgar_timing THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.shout_help_nnr THEN 1
                ELSE 0
            END::numeric +
            CASE
                WHEN msc.reassess_abc THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.reassess_abc_2 THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.documentation_nnr THEN 1
                ELSE 0
            END::numeric +
            CASE
                WHEN msc.q2_cry_respiratory_effort THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q2_tone_activity THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q3_remove_wet_cloth THEN 1
                ELSE 0
            END::numeric +
            CASE
                WHEN msc.q3_wrap_in_dry_warm_towel_cloth THEN 1
                ELSE 0
            END::numeric +
            CASE
                WHEN msc.q3_put_hat_on_baby_head THEN 1
                ELSE 0
            END::numeric +
            CASE
                WHEN msc.q4_immediately_cut_cord THEN 1
                ELSE 0
            END::numeric +
            CASE
                WHEN msc.q4_place_baby_on_prewarmed_radiant_warmer THEN 1
                ELSE 0
            END::numeric +
            CASE
                WHEN msc.q5_look_in_mouth_and_nose THEN 1
                ELSE 0
            END::numeric +
            CASE
                WHEN msc.q5_clear_airway THEN 1
                ELSE 0
            END::numeric +
            CASE
                WHEN msc.q6_open_airway_sniffing_position_head_tilt_chin_lift THEN 1
                ELSE 0
            END::numeric +
            CASE
                WHEN msc.q6_look_listen_feel_breathing_5_seconds THEN 1
                ELSE 0
            END::numeric +
            CASE
                WHEN msc.q8_size_bvm_mask THEN 1
                ELSE 0
            END::numeric +
            CASE
                WHEN msc.q8_good_c_and_e_grip THEN 1
                ELSE 0
            END::numeric +
            CASE
                WHEN msc.q8_give_40_60_continuous_ventilations_60_seconds THEN 1
                ELSE 0
            END::numeric +
            CASE
                WHEN msc.q8_correct_rate_breath_two_three THEN 1
                ELSE 0
            END::numeric +
            CASE
                WHEN msc.q8_ensure_chest_rises THEN 1
                ELSE 0
            END::numeric +
            CASE
                WHEN msc.q9_feel_umbilical_pulse_5_seconds THEN 1
                ELSE 0
            END::numeric +
            CASE
                WHEN msc.q9_connect_bvm_to_100_percent_oxygen THEN 1
                ELSE 0
            END::numeric +
            CASE
                WHEN msc.q9_connect_pulse_oximeter THEN 1
                ELSE 0
            END::numeric +
            CASE
                WHEN msc.q10_give_3_chest_compressions_1_ventilation_3_1_ratio_1_minute THEN 1
                ELSE 0
            END::numeric +
            CASE
                WHEN msc.q10_use_2_thumb_hand_encircling_technique THEN 1
                ELSE 0
            END::numeric +
            CASE
                WHEN msc.q10_location_lower_1_3_sternum THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q10_compress_1_3_ap_diameter THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q10_allow_chest_to_recoil THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q10_about_120_events_30_ventilations_90_chest_compressions_per_ THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q12_give_ventilations_40_60_breaths_per_min_60_seconds THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q12_chest_rise_checking_for_chest_movement THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q12_ensure_baby_kept_warm THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q14_connect_pulse_oximeter_and_monitor_spo2 THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q14_monitor_breathing_adequacy THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q14_switch_to_baby_mode_on_radiant_warmer THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q14_give_oxygen_using_nrm_10l_min THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q14_monitor_spo2_and_work_of_breathing THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q14_titrate_wean_off_oxygen_based_on_spo2 THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q14_ensure_baby_kept_warm_36_5_37_5c THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q15_airway THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q15_breathing THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q15_circulation THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q15_disability THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q15_exposure THEN 0.5
                ELSE 0::numeric
            END +
            CASE
                WHEN msc.q15_ifcdc THEN 0.5
                ELSE 0::numeric
            END)::numeric(18,0) / 49::numeric
        END AS "average score"
   FROM mentors.moh_skills_checklist msc
  WHERE msc.skill_evaluation::text = 'Newborn resuscitation'::text;
```

## Notes
- Purpose: Capture AMTSL evaluation scores in a reusable view
- Database: mentors
- Results / observations: View calculates average score using different item sets before and after 2026-04-01

## Review: why `process_moh_skills_assessment_2026` drops rows from `moh_skills_checklist`

`process_moh_skills_assessment_2026` is only a `UNION ALL` of per-skill views. It does not read `moh_skills_checklist` directly. A checklist row appears in the process view only if it passes the filter of one of those child views.

### 1. Hard date cutoff on Shoulder dystocia — fixed

`shoulder_dystocia_evaluation_2026` previously filtered with:

```sql
AND msc.date_submitted <= '2026-04-01'::date
```

That excluded every Shoulder dystocia submission after `2026-04-01`. The date filter has been removed from the `WHERE` clause so all Shoulder dystocia rows from `moh_skills_checklist` are included (same pattern as the other skill views).

### 2. Exact `skill_evaluation` whitelist

Each child view keeps only one exact label. Covered labels in this file:

| View | Required `skill_evaluation` |
| --- | --- |
| amstl_evaluation_2026 | `AMTSL` |
| avd_evaluation_2026 | `Assisted vaginal vacuum delivery` |
| b_lynch_evaluation_2026 | `B-LYNCH` |
| bimanual_uterine_compression_evaluation_2026 | `Bimanual uterine compression` |
| breech_delivery_evaluation_2026 | `Assisted breech delivery` |
| cervical_tear_repair_evaluation_2026 | `Cervical tear repair` |
| compression_abdominal_aorta_evaluation_2026 | `Compression of abdominal aorta` |
| cord_prolapse_evaluation_2026 | `Cord prolapse` |
| emotive_evaluation_2026 | `EMOTIVE` |
| manual_placenta_removal_evaluation_2026 | `Manual removal of placenta` |
| maternal_resuscitation_evaluation_2026 | `Maternal resuscitation` |
| maternal_shock_evaluation_2026 | `Maternal shock` |
| nasg_evaluation_2026 | `NASG` |
| newborn_resuscitation_evaluation_2026 | `Newborn resuscitation` |
| partograph_evaluation_2026 | `Partograph` |
| perineal_tear_repair_evaluation_2026 | `Perineal repair` |
| pih_evaluation_2026 | `Preeclampsia / Eclampsia` |
| shoulder_dystocia_evaluation_2026 | `Shoulder dystocia` |
| ubt_evaluation_2026 | `UBT` |
| ubt_free_flow_evaluation_2026 | `UBT (free flow)` |
| uterine_inversion_evaluation_2026 | `Uterine Inversion` |

Any other value (new skill, renamed label, casing/spacing variant, or `NULL`) never enters the union. Likely mismatches to check in source data:

- `Perineal repair` vs `Perineal Tear Repair` / `Perineal tear repair`
- `UBT` / `UBT (free flow)` vs placement-style labels
- `B-LYNCH` casing/punctuation variants
- `Preeclampsia / Eclampsia` spacing/slash variants

### 3. Maternal shock and Newborn resuscitation — no date exclusion

Both views are now documented in this file. Neither filters by date in `WHERE`:

- `maternal_shock_evaluation_2026` keeps `skill_evaluation = 'Maternal shock'`
- `newborn_resuscitation_evaluation_2026` keeps `skill_evaluation = 'Newborn resuscitation'`

They use date only inside score `CASE` logic (`date_submitted` for maternal shock; `date_started` for newborn resuscitation).

### 4. Downstream filter (not a process-view drop, but looks like one)

`mentee_curriculum_completion_progress` further filters:

```sql
FROM mentors.process_moh_skills_assessment_2026
WHERE skill_evaluation IS NOT NULL
  AND average_score IS NOT NULL
```

In the child views, average score is usually a sum of cast checklist items. In PostgreSQL, if any item in that sum is `NULL`, the whole average becomes `NULL`. Those rows can still exist in the process view but disappear from completion metrics.

### Diagnostic queries

```sql
-- A) Labels present in checklist but absent from process view
SELECT skill_evaluation, COUNT(*) AS checklist_rows
FROM mentors.moh_skills_checklist
GROUP BY skill_evaluation
ORDER BY checklist_rows DESC;

SELECT skill_evaluation, COUNT(*) AS process_rows
FROM mentors.process_moh_skills_assessment_2026
GROUP BY skill_evaluation
ORDER BY process_rows DESC;

-- B) Rows in checklist missing from process view
SELECT msc.skill_evaluation, COUNT(*) AS missing_rows
FROM mentors.moh_skills_checklist msc
LEFT JOIN mentors.process_moh_skills_assessment_2026 p
  ON p.submission_id = msc.submission_id
 AND p.skill_evaluation = msc.skill_evaluation
WHERE p.submission_id IS NULL
GROUP BY msc.skill_evaluation
ORDER BY missing_rows DESC;

-- C) Shoulder dystocia specifically (after fix, post-2026-04-01 should appear)
SELECT
  CASE
    WHEN date_submitted <= DATE '2026-04-01' THEN 'on/before 2026-04-01'
    WHEN date_submitted > DATE '2026-04-01' THEN 'after 2026-04-01'
    ELSE 'null date_submitted'
  END AS date_bucket,
  COUNT(*) AS checklist_rows
FROM mentors.moh_skills_checklist
WHERE skill_evaluation = 'Shoulder dystocia'
GROUP BY 1;

SELECT
  CASE
    WHEN date_submitted <= DATE '2026-04-01' THEN 'on/before 2026-04-01'
    WHEN date_submitted > DATE '2026-04-01' THEN 'after 2026-04-01'
    ELSE 'null date_submitted'
  END AS date_bucket,
  COUNT(*) AS process_rows
FROM mentors.process_moh_skills_assessment_2026
WHERE skill_evaluation = 'Shoulder dystocia'
GROUP BY 1;

-- D) Confirm maternal shock / newborn resuscitation are present
SELECT skill_evaluation, COUNT(*) AS process_rows
FROM mentors.process_moh_skills_assessment_2026
WHERE skill_evaluation IN ('Maternal shock', 'Newborn resuscitation')
GROUP BY skill_evaluation;
```

### Remaining likely causes (after Shoulder dystocia fix)

Apply the updated `shoulder_dystocia_evaluation_2026` definition in the database, then re-check missing rows. Remaining gaps are expected to be **`skill_evaluation` values that do not exactly match a child-view label**.
