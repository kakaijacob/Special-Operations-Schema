-- Deploy: recreate newborn resuscitation evaluation view
-- Fix: old/new form score cutoff uses date_submitted (not date_started)
-- so Newborn curriculum new-form rows are scored with the /46.5 formula.

CREATE OR REPLACE VIEW mentors.newborn_resuscitation_evaluation_2026
AS SELECT msc.submission_id, msc.date_started, msc.date_ended, msc.date_submitted, msc.county, msc.facility, msc.facility_code, msc.program, msc.mentee_name, msc.mentee_id, msc.skill_evaluation, msc.delivery_of_the_baby::integer AS "baby delivery", msc.apgar_score::integer AS "apgar score", msc.call_for_help_001::integer AS "call for help", msc.abc_assessement::integer AS "abc assessment", msc._40_60_ventilation_breathes::integer AS "ventilation breathes", msc.reasess_abc::integer AS "reassess abc", msc.when_to_start_cpr::integer AS "initiating cpr", msc.ventilation_compression_ratio::integer AS "cpr ratio", msc.right_mask_size::integer AS "right mask", msc.position_mask_correctly::integer AS "mask position", msc._2_hand_technique_cpr::integer AS "2hand technique", msc.depth_of_compression::integer AS "compression depth", msc.warm_chain::integer AS "warm chain", msc.subsequent_abc_reassessement::integer AS "2 abc reassessment", msc.bvm_1_min_hr_60::integer AS "stopping ventilation", msc.another_abc_reassesment::integer AS "3 abc reassessment", msc.put_on_oxygen::integer AS "on oxygen", msc.arrangement_for_transfer::integer AS transfer,
        CASE
            WHEN msc.date_submitted <= '2026-04-01'::date THEN (msc.delivery_of_the_baby::integer + msc.apgar_score::integer + msc.call_for_help_001::integer + msc.abc_assessement::integer + msc._40_60_ventilation_breathes::integer + msc.reasess_abc::integer + msc.when_to_start_cpr::integer + msc.ventilation_compression_ratio::integer + msc.right_mask_size::integer + msc.position_mask_correctly::integer + msc._2_hand_technique_cpr::integer + msc.depth_of_compression::integer + msc.warm_chain::integer + msc.subsequent_abc_reassessement::integer + msc.bvm_1_min_hr_60::integer + msc.another_abc_reassesment::integer + msc.put_on_oxygen::integer + msc.arrangement_for_transfer::integer)::numeric / 18.0
            ELSE (
            -- Matches Kobo calculate: points / 46.5 (stored as 0-1 average_score)
            -- review_anc_history
            CASE WHEN msc.q1a_gestational_age THEN 0.5 ELSE 0::numeric END +
            CASE WHEN COALESCE(msc.q1a_maternal_comorbidities, false) OR COALESCE(msc.q1a_complications, false) THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q1a_prenatal_care_visits THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q1a_anc_profile_lab_work THEN 0.5 ELSE 0::numeric END +
            -- check_safety (warm room + thermometer are one Kobo choice)
            CASE WHEN COALESCE(msc.q1b_warm_room_25_28c, false) OR COALESCE(msc.q1b_digital_room_thermometer, false) THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q1b_environment_no_sharps_spilage THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q1b_gloves_both_sterile_and_clean THEN 0.5 ELSE 0::numeric END +
            -- check_equipment_warmth
            CASE WHEN msc.q1c_perform_hand_hygiene_and_wear_clean_gloves THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q1c_radiant_warmer_prewarm_mode_with_two_towels_and_hat THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q1c_two_prewarmed_towels_and_hat THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q1c_mentions_about_clock THEN 0.5 ELSE 0::numeric END +
            -- check_airway
            CASE WHEN msc.q1d_penguine_sucker_or_suction_machine THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q1d_set_suction_machine_pressure_80_100mmhg THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q1d_suction_catheter_6f_8f_and_wide_bore_yankauer_sucker THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q1d_equipment_clean_and_functionality_checked THEN 0.5 ELSE 0::numeric END +
            -- check_breathing (pulse ox + cardiorespiratory monitor are one Kobo choice)
            CASE WHEN msc.q1e_bvm_size_200_300ml THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q1e_bvm_size_00_0_1 THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q1e_nasal_prongs THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q1e_neonatal_non_rebreather_mask THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q1e_oxygen_source THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q1e_oxygen_tubings THEN 0.5 ELSE 0::numeric END +
            CASE WHEN COALESCE(msc.q1e_pulse_oximeter_with_neonatal_probe, false) OR COALESCE(msc.q1e_cardiorespiratory_monitor, false) THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q1e_equipment_clean_and_functionality_checked THEN 0.5 ELSE 0::numeric END +
            -- check_circulation
            CASE WHEN msc.q1f_stethoscope THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q1f_iv_adrenaline_0_2ml_per_kg_1_10000 THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q1f_normal_saline THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.essential_newborn_care THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.check_apgar_timing THEN 0.5 ELSE 0::numeric END +
            -- dry_stimulate
            CASE WHEN msc.q2_cry_respiratory_effort THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q2_tone_activity THEN 0.5 ELSE 0::numeric END +
            -- wet_dry_cloth
            CASE WHEN msc.q3_remove_wet_cloth THEN 1 ELSE 0 END::numeric +
            CASE WHEN msc.q3_wrap_in_dry_warm_towel_cloth THEN 1 ELSE 0 END::numeric +
            CASE WHEN msc.q3_put_hat_on_baby_head THEN 1 ELSE 0 END::numeric +
            -- immediate_nb_management
            CASE WHEN msc.q4_immediately_cut_cord THEN 1 ELSE 0 END::numeric +
            CASE WHEN msc.q4_place_baby_on_prewarmed_radiant_warmer THEN 1 ELSE 0 END::numeric +
            -- initial_abc_assessment
            CASE WHEN msc.q5_look_in_mouth_and_nose THEN 1 ELSE 0 END::numeric +
            CASE WHEN msc.q5_clear_airway THEN 1 ELSE 0 END::numeric +
            -- abc_assessment
            CASE WHEN msc.q6_open_airway_sniffing_position_head_tilt_chin_lift THEN 1 ELSE 0 END::numeric +
            CASE WHEN msc.q6_look_listen_feel_breathing_5_seconds THEN 1 ELSE 0 END::numeric +
            CASE WHEN msc.shout_help_nnr THEN 1 ELSE 0 END::numeric +
            -- begin_bvm
            CASE WHEN msc.q8_size_bvm_mask THEN 1 ELSE 0 END::numeric +
            CASE WHEN msc.q8_good_c_and_e_grip THEN 1 ELSE 0 END::numeric +
            CASE WHEN msc.q8_give_40_60_continuous_ventilations_60_seconds THEN 1 ELSE 0 END::numeric +
            CASE WHEN msc.q8_correct_rate_breath_two_three THEN 1 ELSE 0 END::numeric +
            CASE WHEN msc.q8_ensure_chest_rises THEN 1 ELSE 0 END::numeric +
            -- assess_pulse
            CASE WHEN msc.q9_feel_umbilical_pulse_5_seconds THEN 1 ELSE 0 END::numeric +
            CASE WHEN msc.q9_connect_bvm_to_100_percent_oxygen THEN 1 ELSE 0 END::numeric +
            CASE WHEN msc.q9_connect_pulse_oximeter THEN 1 ELSE 0 END::numeric +
            -- continue_bvm
            CASE WHEN msc.q10_give_3_chest_compressions_1_ventilation_3_1_ratio_1_minute THEN 1 ELSE 0 END::numeric +
            CASE WHEN msc.q10_use_2_thumb_hand_encircling_technique THEN 1 ELSE 0 END::numeric +
            CASE WHEN msc.q10_location_lower_1_3_sternum THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q10_compress_1_3_ap_diameter THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q10_allow_chest_to_recoil THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q10_about_120_events_30_ventilations_90_chest_compressions_per_ THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.reassess_abc THEN 0.5 ELSE 0::numeric END +
            -- vetilations
            CASE WHEN msc.q12_give_ventilations_40_60_breaths_per_min_60_seconds THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q12_chest_rise_checking_for_chest_movement THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q12_ensure_baby_kept_warm THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.reassess_abc_2 THEN 0.5 ELSE 0::numeric END +
            -- post_resus_stablization (give O2 + monitor spo2/WOB are one Kobo choice)
            CASE WHEN msc.q14_connect_pulse_oximeter_and_monitor_spo2 THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q14_monitor_breathing_adequacy THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q14_switch_to_baby_mode_on_radiant_warmer THEN 0.5 ELSE 0::numeric END +
            CASE WHEN COALESCE(msc.q14_give_oxygen_using_nrm_10l_min, false) OR COALESCE(msc.q14_monitor_spo2_and_work_of_breathing, false) THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q14_titrate_wean_off_oxygen_based_on_spo2 THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q14_ensure_baby_kept_warm_36_5_37_5c THEN 0.5 ELSE 0::numeric END +
            -- continue_observation
            CASE WHEN msc.q15_airway THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q15_breathing THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q15_circulation THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q15_disability THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q15_exposure THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.q15_ifcdc THEN 0.5 ELSE 0::numeric END +
            CASE WHEN msc.documentation_nnr THEN 1 ELSE 0 END::numeric
            ) / 46.5
        END AS "average score"
   FROM mentors.moh_skills_checklist msc
  WHERE msc.skill_evaluation::text = 'Newborn resuscitation'::text;

