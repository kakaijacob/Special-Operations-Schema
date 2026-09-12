/** Outpatient transformation and preferred headers. */

const OUTPATIENT_SOURCE_KEYS = makeKeySet_([
  'starttime',
  'start',
  'endtime',
  'end',
  'facility_profile/county',
  'facility_profile/gazetted',
  'facility_profile/contact',
  'facility_profile/nam_contact',
  'facility_profile/phone_contact',
  'facility_profile/unit',
  'general_services/admission',
  'general_services/preconception_service',
  'general_services/gynecological_service',
  'general_services/family_plan',
  'general_services/anc_low_risk',
  'general_services/anc_high_risk',
  'general_services/registration',
  'general_services/ultrasound',
  'general_services/mothers_pnc',
  'general_services/infants_pnc',
  'general_services/infant_imm',
  'general_services/foetal_nonstress',
  'general_services/via',
  'general_services/gen_microscopy',
  'general_services/hemogram',
  'general_services/urinalysis',
  'general_services/urine_rapid',
  'general_services/urine_protein',
  'general_services/urine_glucose',
  'general_services/hiv_rapid',
  'general_services/hiv_viral',
  'general_services/syphilis_screening',
  'general_services/blood_group',
  'general_services/malaria_smear',
  'general_services/malaria_bs',
  'general_services/hepatitis_b',
  'general_services/tb_test',
  'general_services/blood_glucose',
  'general_services/Infertility_counsel',
  'general_services/abortion_counseling',
  'general_services/referral_system',
  'general_services/abortion_referral',
  'human_resource_health/consultation',
  'human_resource_health/medical_officers',
  'human_resource_health/medical_officers3',
  'human_resource_health/nurse_midwives',
  'human_resource_health/nurse_midwives3',
  'human_resource_health/clinical_officers',
  'human_resource_health/clinical_officers3',
  'human_resource_health/mhe_access',
  'human_resource_health/staff_shortage',
  'health_records_facility/mc_booklet',
  'health_records_facility/anc_register',
  'health_records_facility/pnc_register',
  'health_records_facility/inf_charts',
  'health_records_facility/imm_register',
  'health_records_facility/imm_sheet',
  'health_records_facility/imm_tally',
  'health_records_facility/prev_mtc',
  'health_records_facility/fam_plan',
  'health_records_facility/gyna_files',
  'health_records_facility/mental_stat',
  'health_records_facility/aysrh_register',
  'health_records_facility/gbv_register',
  'health_records_facility/prc_form',
  'health_records_facility/cvc_form',
  'health_records_facility/cvc_register',
  'health_records_facility/pac_register',
  'health_records_facility/ptb_register',
  'health_records_facility/cwc_register',
  'health_records_facility/opd_register',
  'patient_confidentiality/visual_privacy',
  'patient_confidentiality/auditory_privacy',
  'patient_confidentiality/patient_files',
  'staff_training/date_canc',
  'staff_training/date_gbv',
  'staff_training/date_prtc',
  'staff_training/date_rmc',
  'staff_training/date_sicpti',
  'staff_training/date_pmtct',
  'staff_training/date_pnc',
  'staff_training/date_clients',
  'staff_training/date_fam_plan',
  'staff_training/date_crh',
  'staff_training/date_asrh',
  'staff_training/date_rhcs',
  'staff_training/date_preconception',
  'sops_policies/staffing_policy',
  'sops_policies/procument_protocols',
  'sops_policies/triage_protocols',
  'sops_policies/handwashing_protocols',
  'sops_policies/fam_plan_guide',
  'sops_policies/fam_plan_protocols',
  'sops_policies/cervical_cancer',
  'sops_policies/anc_protocols',
  'sops_policies/staff_sop_guide',
  'sops_policies/complicated_pregnancy',
  'sops_policies/pnc_protocols',
  'sops_policies/kepi_vaccine',
  'sops_policies/weaning_education',
  'sops_policies/child_growth',
  'sops_policies/inf_diarrhea',
  'sops_policies/preconception_protocols',
  'sops_policies/folic_acid',
  'sops_policies/child_immunization',
  'wash_ipc/water_source',
  'wash_ipc/water_availability',
  'wash_ipc/drainage_system',
  'wash_ipc/hand_hygiene',
  'wash_ipc/waste_mgt',
  'wash_ipc/waste_bins',
  'wash_ipc/functional_toilet',
  'wash_ipc/sharp_container',
  'wash_ipc/sharp_capacity',
  'wash_ipc/handwash_area',
  'wash_ipc/latrine_types',
  'wash_ipc/disinfectant',
  'wash_ipc/cleanliness',
  'wash_ipc/accessibility',
  'wash_ipc/gender_separation',
  'wash_ipc/menstrual_hygiene',
  'wash_ipc/handwash_stations',
  'wash_ipc/no_of_toilets',
  'overall_infrastructure/waiting_area',
  'overall_infrastructure/chair_availability',
  'overall_infrastructure/ventilation',
  'overall_infrastructure/tidiness',
  'overall_infrastructure/education_material',
  'overall_infrastructure/maintenance',
  'overall_infrastructure/lighting',
  'overall_infrastructure/ventilation_exam',
  'overall_infrastructure/exam_rooms',
  'overall_infrastructure/fire_extinguishers',
  'overall_infrastructure/facility_signs',
  'overall_infrastructure/service_charter',
  'overall_infrastructure/materials_display',
  'overall_infrastructure/service_areas',
  'overall_infrastructure/edu_mat',
  'equipment_availability/exam_couches',
  'equipment_availability/bp_apparatus',
  'equipment_availability/thermometers',
  'equipment_availability/stethoscopes',
  'equipment_availability/fetal_doppler',
  'equipment_availability/oximeter',
  'equipment_availability/measuring_tape',
  'equipment_availability/stadiometre',
  'equipment_availability/adult_scale',
  'equipment_availability/inf_scale',
  'equipment_availability/gestational_wheel',
  'equipment_availability/sterile_speculum',
  'equipment_availability/ultrasound_machine',
  'equipment_availability/light_source',
  'equipment_availability/vaccine_refrigerator',
  'equipment_availability/emergency_tray',
  'equipment_availability/resus_cart',
  'equipment_availability/iud_trays',
  'equipment_availability/implant_insertion',
  'equipment_availability/light_micros',
  'equipment_availability/glucometer',
  'equipment_availability/refrigerator',
  'equipment_availability/hemocue',
  'equipment_availability/bp_adequate',
  'equipment_availability/thermometers_adequate',
  'equipment_availability/stethoscopes_adequate',
  'equipment_availability/fetal_doppler_adequate',
  'commodities_available/itns',
  'commodities_available/latex_gloves',
  'commodities_available/sterile_gloves',
  'commodities_available/ppe',
  'commodities_available/glass_slides',
  'commodities_available/tetanus',
  'commodities_available/bcg',
  'commodities_available/pentavlent',
  'commodities_available/hepb',
  'commodities_available/rotavirus',
  'commodities_available/pneumococcal',
  'commodities_available/sterile_drugs',
  'commodities_available/ifas',
  'commodities_available/malaria_drugs',
  'commodities_available/deworming',
  'commodities_available/vitamin_a',
  'commodities_available/anaesthesia',
  'commodities_available/rutf',
  'commodities_available/zinc',
  'commodities_available/hiv_rtk',
  'commodities_available/dipstick_ketone',
  'commodities_available/glucometer_strips',
  'commodities_available/vitamin_c',
  'commodities_available/malaria_diagnostic',
  'commodities_available/syphilis_rdk',
  'commodities_available/urine_ptk',
  'commodities_available/dipstick_protein',
  'commodities_available/dipstick_urine',
  'commodities_available/filter_paper',
  'commodities_available/malaria_zone',
  'commodities_available/ors',
  'adherance_to_ebp/patient_id',
  'adherance_to_ebp/triage_process',
  'adherance_to_ebp/triage_record',
  'adherance_to_ebp/health_edu',
  'adherance_to_ebp/anc_visit',
  'adherance_to_ebp/third_trimester',
  'adherance_to_ebp/postnatal_exam',
  'adherance_to_ebp/pnc_visit',
  'adherance_to_ebp/anc_defaulters',
  'adherance_to_ebp/group_anc',
  'adherance_to_ebp/referral',
  'adherance_to_ebp/preconception_visit',
  'adherance_to_ebp/male_chaperone',
  'wash_ipc/other',
  'operation_hours/opening_hours',
  'Section_14_Enumerator_Comments/comments',
  'Section_14_Enumerator_Comments/data_quality',
]);

function transformOutpatientRecord_(rec) {
  const out = {};
  out[UUID_FIELD] = rec[UUID_FIELD] == null ? '' : rec[UUID_FIELD];

  /*
   * Preserve every field not transformed below.
   * `_submission_time` is retained as a raw column too.
   */
  assignPassthrough_(out, rec, OUTPATIENT_SOURCE_KEYS);

  out.date_started = formatDateMinute_(firstValue_(rec, ['starttime', 'start']));
  out.date_ended = formatDateMinute_(firstValue_(rec, ['endtime', 'end']));
  out.date_submitted = formatDateMinute_(rec['_submission_time']);

  out.county = lookupCoded_(rec['facility_profile/county'], COUNTY_MAP);
  out.facility_level = lookupCoded_(
    rec['facility_profile/gazetted'], OUTPATIENT_FACILITY_LEVEL_MAP
  );
  out.contact = lookupCoded_(rec['facility_profile/contact'], CONTACT_PERSON_MAP);
  out.contact_name = rec['facility_profile/nam_contact'] == null
    ? '' : rec['facility_profile/nam_contact'];
  out.phone_number = rec['facility_profile/phone_contact'] == null
    ? '' : rec['facility_profile/phone_contact'];
  out.unit = lookupCoded_(rec['facility_profile/unit'], OUTPATIENT_YES_NO_MAP);

  out.admission = toIntegerOrBlank_(rec['general_services/admission']);
  out.preconception_service = lookupCoded_(
    rec['general_services/preconception_service'], OUTPATIENT_YES_NO_MAP
  );
  out.gynecological_service = lookupCoded_(
    rec['general_services/gynecological_service'], OUTPATIENT_YES_NO_MAP
  );
  expandSelectMultiple_(
    out,
    rec['general_services/family_plan'],
    'general_services_family_plan',
    OUTPATIENT_FAMILY_PLAN_CHOICES
  );
  out.anc_low_risk = lookupCoded_(
    rec['general_services/anc_low_risk'], OUTPATIENT_YES_NO_MAP
  );
  out.anc_high_risk = lookupCoded_(
    rec['general_services/anc_high_risk'], OUTPATIENT_YES_NO_MAP
  );
  out.services_registration = lookupCoded_(
    rec['general_services/registration'], OUTPATIENT_YES_NO_MAP
  );
  out.ultrasound_services = lookupCoded_(
    rec['general_services/ultrasound'], OUTPATIENT_YES_NO_MAP
  );
  out.mothers_pnc = lookupCoded_(
    rec['general_services/mothers_pnc'], OUTPATIENT_YES_NO_MAP
  );
  out.infants_pnc = lookupCoded_(
    rec['general_services/infants_pnc'], OUTPATIENT_YES_NO_MAP
  );
  out.infant_immunization = lookupCoded_(
    rec['general_services/infant_imm'], OUTPATIENT_YES_NO_MAP
  );
  out.foetal_nonstress = lookupCoded_(
    rec['general_services/foetal_nonstress'], OUTPATIENT_YES_NO_MAP
  );
  out.services_via = lookupCoded_(
    rec['general_services/via'], OUTPATIENT_YES_NO_MAP
  );

  out.general_microscopy = lookupCoded_(
    rec['general_services/gen_microscopy'], LAB_AVAILABILITY_MAP
  );
  out.full_hemogram = lookupCoded_(
    rec['general_services/hemogram'], LAB_AVAILABILITY_MAP
  );
  out.perform_urinalysis = lookupCoded_(
    rec['general_services/urinalysis'], LAB_AVAILABILITY_MAP
  );
  out.urine_rapid = lookupCoded_(
    rec['general_services/urine_rapid'], LAB_AVAILABILITY_MAP
  );
  out.urine_protein = lookupCoded_(
    rec['general_services/urine_protein'], LAB_AVAILABILITY_MAP
  );
  out.urine_glucose = lookupCoded_(
    rec['general_services/urine_glucose'], LAB_AVAILABILITY_MAP
  );
  out.hiv_rapid = lookupCoded_(
    rec['general_services/hiv_rapid'], LAB_AVAILABILITY_MAP
  );
  out.hiv_viral = lookupCoded_(
    rec['general_services/hiv_viral'], LAB_AVAILABILITY_MAP
  );
  out.syphilis_screening = lookupCoded_(
    rec['general_services/syphilis_screening'], LAB_AVAILABILITY_MAP
  );
  out.blood_group = lookupCoded_(
    rec['general_services/blood_group'], LAB_AVAILABILITY_MAP
  );
  out.malaria_smear = lookupCoded_(
    rec['general_services/malaria_smear'], LAB_AVAILABILITY_MAP
  );
  out.malaria_bs = lookupCoded_(
    rec['general_services/malaria_bs'], LAB_AVAILABILITY_MAP
  );
  out.hepatitis_b = lookupCoded_(
    rec['general_services/hepatitis_b'], LAB_AVAILABILITY_MAP
  );
  out.tb_test = lookupCoded_(
    rec['general_services/tb_test'], LAB_AVAILABILITY_MAP
  );
  out.blood_glucose = lookupCoded_(
    rec['general_services/blood_glucose'], LAB_AVAILABILITY_MAP
  );
  out.Infertility_counsel = lookupCoded_(
    rec['general_services/Infertility_counsel'], OUTPATIENT_YES_NO_MAP
  );
  out.abortion_counseling = lookupCoded_(
    rec['general_services/abortion_counseling'], OUTPATIENT_YES_NO_MAP
  );
  out.referral_system = lookupCoded_(
    rec['general_services/referral_system'], OUTPATIENT_YES_NO_MAP
  );
  out.abortion_referral = lookupCoded_(
    rec['general_services/abortion_referral'], OUTPATIENT_YES_NO_MAP
  );

  out.consultation = lookupCoded_(
    rec['human_resource_health/consultation'], OUTPATIENT_YES_NO_MAP
  );
  out.hrh_medical_officer = toIntegerOrBlank_(
    rec['human_resource_health/medical_officers']
  );
  out.hrh_medical_officer3 = lookupCoded_(
    rec['human_resource_health/medical_officers3'], OUTPATIENT_YES_NO_MAP
  );
  out.hrh_nurse_midwives = toIntegerOrBlank_(
    rec['human_resource_health/nurse_midwives']
  );
  out.hrh_nurse_midwives3 = lookupCoded_(
    rec['human_resource_health/nurse_midwives3'], OUTPATIENT_YES_NO_MAP
  );
  out.hrh_clinical_officers = toIntegerOrBlank_(
    rec['human_resource_health/clinical_officers']
  );
  out.hrh_clinical_officers3 = lookupCoded_(
    rec['human_resource_health/clinical_officers3'], OUTPATIENT_YES_NO_MAP
  );
  out.mental_health_expertise_access = lookupCoded_(
    rec['human_resource_health/mhe_access'], OUTPATIENT_YES_NO_MAP
  );
  out.staff_shortage = lookupCoded_(
    rec['human_resource_health/staff_shortage'], OUTPATIENT_YES_NO_MAP
  );

  out.mc_booklet = lookupCoded_(
    rec['health_records_facility/mc_booklet'], NEWBORN_ADMISSION_AVAIL_MAP
  );
  out.anc_register = lookupCoded_(
    rec['health_records_facility/anc_register'], NEWBORN_ADMISSION_AVAIL_MAP
  );
  out.pnc_register = lookupCoded_(
    rec['health_records_facility/pnc_register'], NEWBORN_ADMISSION_AVAIL_MAP
  );
  out.infant_chart = lookupCoded_(
    rec['health_records_facility/inf_charts'], NEWBORN_ADMISSION_AVAIL_MAP
  );
  out.immunization_register = lookupCoded_(
    rec['health_records_facility/imm_register'], NEWBORN_ADMISSION_AVAIL_MAP
  );
  out.immunization_sheet = lookupCoded_(
    rec['health_records_facility/imm_sheet'], NEWBORN_ADMISSION_AVAIL_MAP
  );
  out.immunization_tally = lookupCoded_(
    rec['health_records_facility/imm_tally'], NEWBORN_ADMISSION_AVAIL_MAP
  );
  out.pmtct_register = lookupCoded_(
    rec['health_records_facility/prev_mtc'], NEWBORN_ADMISSION_AVAIL_MAP
  );
  out.family_planning_register = lookupCoded_(
    rec['health_records_facility/fam_plan'], NEWBORN_ADMISSION_AVAIL_MAP
  );
  out.gyna_outpatient_clinic_files = lookupCoded_(
    rec['health_records_facility/gyna_files'], NEWBORN_ADMISSION_AVAIL_MAP
  );
  out.mental_status_assessment_tool = lookupCoded_(
    rec['health_records_facility/mental_stat'], NEWBORN_ADMISSION_AVAIL_MAP
  );
  out.aysrh_register = lookupCoded_(
    rec['health_records_facility/aysrh_register'], NEWBORN_ADMISSION_AVAIL_MAP
  );
  out.gbv_register = lookupCoded_(
    rec['health_records_facility/gbv_register'], NEWBORN_ADMISSION_AVAIL_MAP
  );
  out.post_rape_care_form = lookupCoded_(
    rec['health_records_facility/prc_form'], NEWBORN_ADMISSION_AVAIL_MAP
  );
  out.cancer_screening_form = lookupCoded_(
    rec['health_records_facility/cvc_form'], NEWBORN_ADMISSION_AVAIL_MAP
  );
  out.cervical_cancer_screening_register = lookupCoded_(
    rec['health_records_facility/cvc_register'], NEWBORN_ADMISSION_AVAIL_MAP
  );
  out.post_abortion_care_register = lookupCoded_(
    rec['health_records_facility/pac_register'], NEWBORN_ADMISSION_AVAIL_MAP
  );
  out.presumptive_tb_register = lookupCoded_(
    rec['health_records_facility/ptb_register'], NEWBORN_ADMISSION_AVAIL_MAP
  );
  out.cwc_register = lookupCoded_(
    rec['health_records_facility/cwc_register'], NEWBORN_ADMISSION_AVAIL_MAP
  );
  out.opd_register = lookupCoded_(
    rec['health_records_facility/opd_register'], NEWBORN_ADMISSION_AVAIL_MAP
  );

  out.visual_privacy = lookupCoded_(
    rec['patient_confidentiality/visual_privacy'], ROOM_PRIVACY_MAP
  );
  out.auditory_privacy = lookupCoded_(
    rec['patient_confidentiality/auditory_privacy'], ROOM_PRIVACY_MAP
  );
  out.patient_filec_privacy = lookupCoded_(
    rec['patient_confidentiality/patient_files'], OUTPATIENT_YES_NO_MAP
  );

  out.training_date_canc = formatYearMonth_(rec['staff_training/date_canc']);
  out.training_date_gbv = formatYearMonth_(rec['staff_training/date_gbv']);
  out.training_date_prtc = formatYearMonth_(rec['staff_training/date_prtc']);
  out.training_date_rmc = formatYearMonth_(rec['staff_training/date_rmc']);
  out.training_date_ipc = formatYearMonth_(rec['staff_training/date_sicpti']);
  out.training_date_pmtct = formatYearMonth_(rec['staff_training/date_pmtct']);
  out.training_date_pnc = formatYearMonth_(rec['staff_training/date_pnc']);
  out.training_date_clients_support = formatYearMonth_(
    rec['staff_training/date_clients']
  );
  out.training_family_planning = formatYearMonth_(
    rec['staff_training/date_fam_plan']
  );
  out.training_date_crh = formatYearMonth_(rec['staff_training/date_crh']);
  out.training_date_adolescent_rh = formatYearMonth_(
    rec['staff_training/date_asrh']
  );
  out.training_date_rh_cancer_screening = formatYearMonth_(
    rec['staff_training/date_rhcs']
  );
  out.training_date_preconception = formatYearMonth_(
    rec['staff_training/date_preconception']
  );

  out.staffing_policy = lookupCoded_(
    rec['sops_policies/staffing_policy'], OUTPATIENT_YES_NO_MAP
  );
  out.procurement_protocol = lookupCoded_(
    rec['sops_policies/procument_protocols'], OUTPATIENT_YES_NO_MAP
  );
  out.triage_protocol = lookupCoded_(
    rec['sops_policies/triage_protocols'], OUTPATIENT_YES_NO_MAP
  );
  out.handwashing_protocols = lookupCoded_(
    rec['sops_policies/handwashing_protocols'], OUTPATIENT_SOP_DISPLAY_MAP
  );
  out.family_planning_guide = lookupCoded_(
    rec['sops_policies/fam_plan_guide'], OUTPATIENT_YES_NO_MAP
  );
  out.family_planning_protocol = lookupCoded_(
    rec['sops_policies/fam_plan_protocols'], OUTPATIENT_YES_NO_MAP
  );
  out.sop_cervical_cancer = lookupCoded_(
    rec['sops_policies/cervical_cancer'], OUTPATIENT_YES_NO_MAP
  );
  out.anc_protocols = lookupCoded_(
    rec['sops_policies/anc_protocols'], OUTPATIENT_SOP_DISPLAY_MAP
  );
  out.staff_sop_guide = lookupCoded_(
    rec['sops_policies/staff_sop_guide'], OUTPATIENT_YES_NO_MAP
  );
  out.complicated_pregnancy = lookupCoded_(
    rec['sops_policies/complicated_pregnancy'], OUTPATIENT_YES_NO_MAP
  );
  out.sops_pnc_protocol = lookupCoded_(
    rec['sops_policies/pnc_protocols'], OUTPATIENT_PROTOCOL_AVAILABILITY_MAP
  );
  out.sops_kepi_vaccine = lookupCoded_(
    rec['sops_policies/kepi_vaccine'], OUTPATIENT_PROTOCOL_AVAILABILITY_MAP
  );
  out.sops_weaning_education = lookupCoded_(
    rec['sops_policies/weaning_education'], OUTPATIENT_YES_NO_MAP
  );
  out.sops_child_growth = lookupCoded_(
    rec['sops_policies/child_growth'], OUTPATIENT_YES_NO_MAP
  );
  out.sops_infant_diarrhea = lookupCoded_(
    rec['sops_policies/inf_diarrhea'], OUTPATIENT_YES_NO_MAP
  );
  out.preconception_protocols = lookupCoded_(
    rec['sops_policies/preconception_protocols'],
    OUTPATIENT_PROTOCOL_AVAILABILITY_MAP
  );
  out.folic_acid = lookupCoded_(
    rec['sops_policies/folic_acid'], OUTPATIENT_YES_NO_MAP
  );
  out.child_immunization = lookupCoded_(
    rec['sops_policies/child_immunization'], OUTPATIENT_YES_NO_MAP
  );

  out.wash_water_source = lookupCoded_(
    rec['wash_ipc/water_source'], WATER_SOURCE_MAP
  );
  out.wash_water_availability = lookupCoded_(
    rec['wash_ipc/water_availability'], OUTPATIENT_YES_NO_MAP
  );
  out.wash_drainage = lookupCoded_(
    rec['wash_ipc/drainage_system'], OUTPATIENT_YES_NO_MAP
  );
  out.wash_hand_hygiene = lookupCoded_(
    rec['wash_ipc/hand_hygiene'], OUTPATIENT_HAND_HYGIENE_MAP
  );
  out.wash_waste_management = lookupCoded_(
    rec['wash_ipc/waste_mgt'], WASTE_MANAGEMENT_MAP
  );
  out.wash_waste_bins = lookupCoded_(
    rec['wash_ipc/waste_bins'], OUTPATIENT_YES_NO_MAP
  );
  out.wash_functional_toilet = lookupCoded_(
    rec['wash_ipc/functional_toilet'], OUTPATIENT_YES_NO_MAP
  );
  out.wash_sharp_container = lookupCoded_(
    rec['wash_ipc/sharp_container'], OUTPATIENT_YES_NO_MAP
  );
  out.wash_sharp_capacity = lookupCoded_(
    rec['wash_ipc/sharp_capacity'], OUTPATIENT_YES_NO_MAP
  );
  out.was_handwash_area = lookupCoded_(
    rec['wash_ipc/handwash_area'], OUTPATIENT_YES_NO_MAP
  );
  out.wash_latrine_type = lookupCoded_(
    rec['wash_ipc/latrine_types'], MATERNITY_LATRINE_MAP
  );
  out.wash_bathrooms_disinfected = lookupCoded_(
    rec['wash_ipc/disinfectant'], MATERNITY_BATHROOM_CLEANING_MAP
  );
  out.wash_cleanliness = lookupCoded_(
    rec['wash_ipc/cleanliness'], OUTPATIENT_YES_NO_MAP
  );
  out.wash_accessibility = lookupCoded_(
    rec['wash_ipc/accessibility'], OUTPATIENT_YES_NO_MAP
  );
  out.wash_gender_separation = lookupCoded_(
    rec['wash_ipc/gender_separation'], OUTPATIENT_YES_NO_MAP
  );
  out.wash_menstrual_hygiene = lookupCoded_(
    rec['wash_ipc/menstrual_hygiene'], OUTPATIENT_YES_NO_MAP
  );
  out.wash_handwash_stations = lookupCoded_(
    rec['wash_ipc/handwash_stations'], OUTPATIENT_YES_NO_MAP
  );
  out.wash_number_toilets = toIntegerOrBlank_(
    rec['wash_ipc/no_of_toilets']
  );
  out.wash_other_specify = rec['wash_ipc/other'] == null
    ? '' : rec['wash_ipc/other'];

  out.waiting_area = lookupCoded_(
    rec['overall_infrastructure/waiting_area'], OUTPATIENT_YES_NO_MAP
  );
  out.chair_availability = lookupCoded_(
    rec['overall_infrastructure/chair_availability'], OUTPATIENT_YES_NO_MAP
  );
  out.ventilation = lookupCoded_(
    rec['overall_infrastructure/ventilation'], OUTPATIENT_YES_NO_MAP
  );
  out.waiting_area_well_maintained = lookupCoded_(
    rec['overall_infrastructure/tidiness'], OUTPATIENT_YES_NO_MAP
  );
  out.educational_material = lookupCoded_(
    rec['overall_infrastructure/education_material'], OUTPATIENT_YES_NO_MAP
  );
  out.wall_well_maintained = lookupCoded_(
    rec['overall_infrastructure/maintenance'], OUTPATIENT_YES_NO_MAP
  );
  out.spaces_lighting = lookupCoded_(
    rec['overall_infrastructure/lighting'], OUTPATIENT_YES_NO_MAP
  );
  out.ventilation_exam = lookupCoded_(
    rec['overall_infrastructure/ventilation_exam'], OUTPATIENT_YES_NO_MAP
  );
  out.number_exam_rooms = toIntegerOrBlank_(
    rec['overall_infrastructure/exam_rooms']
  );
  out.fire_extinguisher = lookupCoded_(
    rec['overall_infrastructure/fire_extinguishers'], OUTPATIENT_YES_NO_MAP
  );
  out.facility_visible_signage = lookupCoded_(
    rec['overall_infrastructure/facility_signs'], OUTPATIENT_YES_NO_MAP
  );
  out.visible_service_charter = lookupCoded_(
    rec['overall_infrastructure/service_charter'], OUTPATIENT_YES_NO_MAP
  );
  expandSelectMultiple_(
    out,
    rec['overall_infrastructure/materials_display'],
    'overall_infrastructure_materials_display',
    OUTPATIENT_MATERIALS_DISPLAY_CHOICES
  );
  out.service_areas = lookupCoded_(
    rec['overall_infrastructure/service_areas'], OUTPATIENT_YES_NO_MAP
  );
  out.education_material_specify = rec['overall_infrastructure/edu_mat'] == null
    ? '' : rec['overall_infrastructure/edu_mat'];

  out.numbers_examination_couches = toIntegerOrBlank_(
    rec['equipment_availability/exam_couches']
  );
  out.number_bp_apparatus = toIntegerOrBlank_(
    rec['equipment_availability/bp_apparatus']
  );
  out.number_thermometers = toIntegerOrBlank_(
    rec['equipment_availability/thermometers']
  );
  out.number_stethoscopes = toIntegerOrBlank_(
    rec['equipment_availability/stethoscopes']
  );
  out.number_fetal_doppler = toIntegerOrBlank_(
    rec['equipment_availability/fetal_doppler']
  );
  out.number_oximeter = lookupCoded_(
    rec['equipment_availability/oximeter'], OUTPATIENT_EQUIP_FUNCTIONAL_MAP
  );
  out.number_measuring_tape = lookupCoded_(
    rec['equipment_availability/measuring_tape'], OUTPATIENT_YES_NO_MAP
  );
  out.number_stadiometre = lookupCoded_(
    rec['equipment_availability/stadiometre'], OUTPATIENT_YES_NO_MAP
  );
  out.adult_scale = lookupCoded_(
    rec['equipment_availability/adult_scale'], OUTPATIENT_YES_NO_MAP
  );
  out.infant_scale = lookupCoded_(
    rec['equipment_availability/inf_scale'], OUTPATIENT_YES_NO_MAP
  );
  out.gestational_wheel = lookupCoded_(
    rec['equipment_availability/gestational_wheel'], OUTPATIENT_YES_NO_MAP
  );
  out.sterile_speculum = lookupCoded_(
    rec['equipment_availability/sterile_speculum'], OUTPATIENT_YES_NO_MAP
  );
  out.ultrasound_machine = lookupCoded_(
    rec['equipment_availability/ultrasound_machine'],
    OUTPATIENT_ULTRASOUND_MACHINE_MAP
  );
  out.light_source = lookupCoded_(
    rec['equipment_availability/light_source'], OUTPATIENT_EQUIP_FUNCTIONAL_MAP
  );
  out.vaccine_refrigerator = lookupCoded_(
    rec['equipment_availability/vaccine_refrigerator'],
    OUTPATIENT_EQUIP_FUNCTIONAL_MAP
  );
  expandSelectMultiple_(
    out,
    rec['equipment_availability/emergency_tray'],
    'equipment_availability_emergency_tray',
    OUTPATIENT_EMERGENCY_TRAY_CHOICES
  );
  expandSelectMultiple_(
    out,
    rec['equipment_availability/resus_cart'],
    'equipment_availability_resus_cart',
    OUTPATIENT_RESUS_CART_CHOICES
  );
  out.iud_trays_availlable = lookupCoded_(
    rec['equipment_availability/iud_trays'], OUTPATIENT_YES_NO_MAP
  );
  out.implant_insertion_available = lookupCoded_(
    rec['equipment_availability/implant_insertion'], OUTPATIENT_YES_NO_MAP
  );
  out.light_microscope_available = lookupCoded_(
    rec['equipment_availability/light_micros'], OUTPATIENT_LAB_EQUIP_MAP
  );
  out.glucometer_available = lookupCoded_(
    rec['equipment_availability/glucometer'], OUTPATIENT_LAB_EQUIP_MAP
  );
  out.refregerator_available = lookupCoded_(
    rec['equipment_availability/refrigerator'], OUTPATIENT_EQUIP_FUNCTIONAL_MAP
  );
  out.haemoglobinometer = lookupCoded_(
    rec['equipment_availability/hemocue'], OUTPATIENT_LAB_EQUIP_MAP
  );
  out.bp_adequate = lookupCoded_(
    rec['equipment_availability/bp_adequate'], OUTPATIENT_YES_NO_MAP
  );
  out.thermometers_adequate = lookupCoded_(
    rec['equipment_availability/thermometers_adequate'], OUTPATIENT_YES_NO_MAP
  );
  out.stethoscopes_adequate = lookupCoded_(
    rec['equipment_availability/stethoscopes_adequate'], OUTPATIENT_YES_NO_MAP
  );
  out.fetal_dopper_adequate = lookupCoded_(
    rec['equipment_availability/fetal_doppler_adequate'], OUTPATIENT_YES_NO_MAP
  );

  out.insecticide_treated_nets_available = lookupCoded_(
    rec['commodities_available/itns'], OUTPATIENT_COMMODITY_STORE_MAP
  );
  out.latex_gloves_available = lookupCoded_(
    rec['commodities_available/latex_gloves'], OUTPATIENT_COMMODITY_STORE_MAP
  );
  out.sterile_gloves_available = lookupCoded_(
    rec['commodities_available/sterile_gloves'], OUTPATIENT_COMMODITY_STORE_MAP
  );
  out.ppe_available = lookupCoded_(
    rec['commodities_available/ppe'], OUTPATIENT_COMMODITY_STORE_MAP
  );
  out.glass_slides_available = lookupCoded_(
    rec['commodities_available/glass_slides'], OUTPATIENT_COMMODITY_STORE_MAP
  );
  out.available_tetanus = lookupCoded_(
    rec['commodities_available/tetanus'], OUTPATIENT_COMMODITY_PHARMACY_MAP
  );
  out.bcg_available = lookupCoded_(
    rec['commodities_available/bcg'], OUTPATIENT_COMMODITY_PHARMACY_MAP
  );
  out.pentavlent_available = lookupCoded_(
    rec['commodities_available/pentavlent'], OUTPATIENT_COMMODITY_PHARMACY_MAP
  );
  out.hepb_available = lookupCoded_(
    rec['commodities_available/hepb'], OUTPATIENT_COMMODITY_PHARMACY_MAP
  );
  out.available_rotavirus = lookupCoded_(
    rec['commodities_available/rotavirus'], OUTPATIENT_COMMODITY_PHARMACY_MAP
  );
  out.available_pneumococcal = lookupCoded_(
    rec['commodities_available/pneumococcal'], OUTPATIENT_COMMODITY_PHARMACY_MAP
  );
  out.available_sterile_drugs = lookupCoded_(
    rec['commodities_available/sterile_drugs'], OUTPATIENT_COMMODITY_PHARMACY_MAP
  );
  out.available_ifas = lookupCoded_(
    rec['commodities_available/ifas'], OUTPATIENT_COMMODITY_PHARMACY_MAP
  );
  out.malaria_drugs_available = lookupCoded_(
    rec['commodities_available/malaria_drugs'], OUTPATIENT_COMMODITY_PHARMACY_MAP
  );
  out.deworming_available = lookupCoded_(
    rec['commodities_available/deworming'], OUTPATIENT_COMMODITY_PHARMACY_MAP
  );
  out.vit_a_available = lookupCoded_(
    rec['commodities_available/vitamin_a'], OUTPATIENT_COMMODITY_PHARMACY_MAP
  );
  out.available_anaesthesia = lookupCoded_(
    rec['commodities_available/anaesthesia'], OUTPATIENT_COMMODITY_PHARMACY_MAP
  );
  out.available_rutf = lookupCoded_(
    rec['commodities_available/rutf'], OUTPATIENT_COMMODITY_PHARMACY_MAP
  );
  out.available_zinc = lookupCoded_(
    rec['commodities_available/zinc'], OUTPATIENT_COMMODITY_PHARMACY_MAP
  );
  out.available_hiv_rapid_test_kits = lookupCoded_(
    rec['commodities_available/hiv_rtk'], OUTPATIENT_COMMODITY_LAB_MAP
  );
  out.available_dipstick_ketone = lookupCoded_(
    rec['commodities_available/dipstick_ketone'], OUTPATIENT_COMMODITY_LAB_MAP
  );
  out.available_glucometer = lookupCoded_(
    rec['commodities_available/glucometer_strips'], OUTPATIENT_COMMODITY_LAB_MAP
  );
  out.vitamin_c_available = lookupCoded_(
    rec['commodities_available/vitamin_c'], OUTPATIENT_COMMODITY_PHARMACY_MAP
  );
  out.malaria_diagnostic = lookupCoded_(
    rec['commodities_available/malaria_diagnostic'], OUTPATIENT_COMMODITY_LAB_MAP
  );
  out.syphilis_rdk = lookupCoded_(
    rec['commodities_available/syphilis_rdk'], OUTPATIENT_COMMODITY_LAB_MAP
  );
  out.urine_ptk = lookupCoded_(
    rec['commodities_available/urine_ptk'], OUTPATIENT_COMMODITY_LAB_MAP
  );
  out.dipstick_protein = lookupCoded_(
    rec['commodities_available/dipstick_protein'], OUTPATIENT_COMMODITY_LAB_MAP
  );
  out.dipstick_urine = lookupCoded_(
    rec['commodities_available/dipstick_urine'], OUTPATIENT_COMMODITY_LAB_MAP
  );
  out.filter_paper_available = lookupCoded_(
    rec['commodities_available/filter_paper'], OUTPATIENT_COMMODITY_LAB_MAP
  );
  out.malaria_zone = lookupCoded_(
    rec['commodities_available/malaria_zone'], OUTPATIENT_YES_NO_MAP
  );
  out.available_ors = lookupCoded_(
    rec['commodities_available/ors'], OUTPATIENT_COMMODITY_PHARMACY_MAP
  );

  out.patient_identification = lookupCoded_(
    rec['adherance_to_ebp/patient_id'], ALWAYS_SOMETIMES_NEVER_MAP
  );
  out.triage_process = lookupCoded_(
    rec['adherance_to_ebp/triage_process'], OUTPATIENT_YES_NO_MAP
  );
  out.triage_record = lookupCoded_(
    rec['adherance_to_ebp/triage_record'], OUTPATIENT_YES_NO_MAP
  );
  expandSelectMultiple_(
    out,
    rec['adherance_to_ebp/health_edu'],
    'adherance_to_ebp_health_edu',
    OUTPATIENT_HEALTH_EDU_CHOICES
  );
  expandSelectMultiple_(
    out,
    rec['adherance_to_ebp/anc_visit'],
    'adherance_to_ebp_anc_visit',
    OUTPATIENT_ANC_VISIT_CHOICES
  );
  expandSelectMultiple_(
    out,
    rec['adherance_to_ebp/third_trimester'],
    'adherance_to_ebp_third_trimester',
    OUTPATIENT_THIRD_TRIMESTER_CHOICES
  );
  expandSelectMultiple_(
    out,
    rec['adherance_to_ebp/postnatal_exam'],
    'adherance_to_ebp_postnatal_exam',
    OUTPATIENT_POSTNATAL_EXAM_CHOICES
  );
  expandSelectMultiple_(
    out,
    rec['adherance_to_ebp/pnc_visit'],
    'adherance_to_ebp_pnc_visit',
    OUTPATIENT_PNC_VISIT_CHOICES
  );
  out.anc_defaulters = lookupCoded_(
    rec['adherance_to_ebp/anc_defaulters'], OUTPATIENT_YES_NO_MAP
  );
  out.group_anc = lookupCoded_(
    rec['adherance_to_ebp/group_anc'], OUTPATIENT_YES_NO_MAP
  );
  out.referral_mechanism = lookupCoded_(
    rec['adherance_to_ebp/referral'], OUTPATIENT_YES_NO_MAP
  );
  expandSelectMultiple_(
    out,
    rec['adherance_to_ebp/preconception_visit'],
    'adherance_to_ebp_preconception_visit',
    OUTPATIENT_PRECONCEPTION_VISIT_CHOICES
  );
  out.male_chaperone = lookupCoded_(
    rec['adherance_to_ebp/male_chaperone'], OUTPATIENT_YES_NO_MAP
  );

  out.opening_hours = lookupCoded_(
    rec['operation_hours/opening_hours'], MATERNITY_OPERATION_HOURS_MAP
  );
  out.comments = rec['Section_14_Enumerator_Comments/comments'] == null
    ? '' : rec['Section_14_Enumerator_Comments/comments'];
  out.data_quality = rec['Section_14_Enumerator_Comments/data_quality'] == null
    ? '' : rec['Section_14_Enumerator_Comments/data_quality'];

  return out;
}

function outpatientPreferredHeaders_() {
  return [
    UUID_FIELD,
    'date_started',
    'date_ended',
    'date_submitted',
    'county',
    'facility_level',
    'contact',
    'contact_name',
    'phone_number',
    'unit',
    'admission',
    'preconception_service',
    'gynecological_service',
  ]
    .concat(selectMultipleHeaders_(
      'general_services_family_plan',
      OUTPATIENT_FAMILY_PLAN_CHOICES
    ))
    .concat([
      'anc_low_risk',
      'anc_high_risk',
      'services_registration',
      'ultrasound_services',
      'mothers_pnc',
      'infants_pnc',
      'infant_immunization',
      'foetal_nonstress',
      'services_via',
      'general_microscopy',
      'full_hemogram',
      'perform_urinalysis',
      'urine_rapid',
      'urine_protein',
      'urine_glucose',
      'hiv_rapid',
      'hiv_viral',
      'syphilis_screening',
      'blood_group',
      'malaria_smear',
      'malaria_bs',
      'hepatitis_b',
      'tb_test',
      'blood_glucose',
      'consultation',
      'hrh_medical_officer',
      'hrh_medical_officer3',
      'hrh_nurse_midwives',
      'hrh_nurse_midwives3',
      'hrh_clinical_officers',
      'hrh_clinical_officers3',
      'mental_health_expertise_access',
      'staff_shortage',
      'mc_booklet',
      'anc_register',
      'pnc_register',
      'infant_chart',
      'immunization_register',
      'immunization_sheet',
      'immunization_tally',
      'pmtct_register',
      'family_planning_register',
      'gyna_outpatient_clinic_files',
      'mental_status_assessment_tool',
      'aysrh_register',
      'gbv_register',
      'post_rape_care_form',
      'cancer_screening_form',
      'cervical_cancer_screening_register',
      'post_abortion_care_register',
      'presumptive_tb_register',
      'visual_privacy',
      'auditory_privacy',
      'patient_filec_privacy',
      'training_date_canc',
      'training_date_gbv',
      'training_date_prtc',
      'training_date_rmc',
      'training_date_ipc',
      'training_date_pmtct',
      'training_date_pnc',
      'training_date_clients_support',
      'training_family_planning',
      'training_date_crh',
      'training_date_adolescent_rh',
      'training_date_rh_cancer_screening',
      'staffing_policy',
      'procurement_protocol',
      'triage_protocol',
      'handwashing_protocols',
      'family_planning_guide',
      'family_planning_protocol',
      'sop_cervical_cancer',
      'anc_protocols',
      'staff_sop_guide',
      'complicated_pregnancy',
      'sops_pnc_protocol',
      'sops_kepi_vaccine',
      'sops_weaning_education',
      'sops_child_growth',
      'sops_infant_diarrhea',
      'wash_water_source',
      'wash_water_availability',
      'wash_drainage',
      'wash_hand_hygiene',
      'wash_waste_management',
      'wash_waste_bins',
      'wash_functional_toilet',
      'wash_sharp_container',
      'wash_sharp_capacity',
      'was_handwash_area',
      'wash_latrine_type',
      'wash_bathrooms_disinfected',
      'wash_cleanliness',
      'wash_accessibility',
      'wash_gender_separation',
      'wash_menstrual_hygiene',
      'wash_handwash_stations',
      'wash_number_toilets',
      'wash_other_specify',
      'waiting_area',
      'chair_availability',
      'ventilation',
      'waiting_area_well_maintained',
      'educational_material',
      'wall_well_maintained',
      'spaces_lighting',
      'ventilation_exam',
      'number_exam_rooms',
      'fire_extinguisher',
      'facility_visible_signage',
      'visible_service_charter',
    ])
    .concat(selectMultipleHeaders_(
      'overall_infrastructure_materials_display',
      OUTPATIENT_MATERIALS_DISPLAY_CHOICES
    ))
    .concat([
      'service_areas',
      'numbers_examination_couches',
      'number_bp_apparatus',
      'number_thermometers',
      'number_stethoscopes',
      'number_fetal_doppler',
      'number_oximeter',
      'number_measuring_tape',
      'number_stadiometre',
      'adult_scale',
      'infant_scale',
      'gestational_wheel',
      'sterile_speculum',
      'ultrasound_machine',
      'light_source',
      'vaccine_refrigerator',
    ])
    .concat(selectMultipleHeaders_(
      'equipment_availability_emergency_tray',
      OUTPATIENT_EMERGENCY_TRAY_CHOICES
    ))
    .concat(selectMultipleHeaders_(
      'equipment_availability_resus_cart',
      OUTPATIENT_RESUS_CART_CHOICES
    ))
    .concat([
      'iud_trays_availlable',
      'implant_insertion_available',
      'light_microscope_available',
      'glucometer_available',
      'refregerator_available',
      'haemoglobinometer',
      'insecticide_treated_nets_available',
      'latex_gloves_available',
      'sterile_gloves_available',
      'ppe_available',
      'glass_slides_available',
      'available_tetanus',
      'bcg_available',
      'pentavlent_available',
      'hepb_available',
      'available_rotavirus',
      'available_pneumococcal',
      'available_sterile_drugs',
      'available_ifas',
      'malaria_drugs_available',
      'deworming_available',
      'vit_a_available',
      'available_anaesthesia',
      'available_rutf',
      'available_zinc',
      'available_hiv_rapid_test_kits',
      'available_dipstick_ketone',
      'available_glucometer',
      'patient_identification',
      'triage_process',
      'triage_record',
    ])
    .concat(selectMultipleHeaders_(
      'adherance_to_ebp_health_edu',
      OUTPATIENT_HEALTH_EDU_CHOICES
    ))
    .concat(selectMultipleHeaders_(
      'adherance_to_ebp_anc_visit',
      OUTPATIENT_ANC_VISIT_CHOICES
    ))
    .concat(selectMultipleHeaders_(
      'adherance_to_ebp_third_trimester',
      OUTPATIENT_THIRD_TRIMESTER_CHOICES
    ))
    .concat(selectMultipleHeaders_(
      'adherance_to_ebp_postnatal_exam',
      OUTPATIENT_POSTNATAL_EXAM_CHOICES
    ))
    .concat(selectMultipleHeaders_(
      'adherance_to_ebp_pnc_visit',
      OUTPATIENT_PNC_VISIT_CHOICES
    ))
    .concat([
      'anc_defaulters',
      'group_anc',
      'referral_mechanism',
    ])
    .concat(selectMultipleHeaders_(
      'adherance_to_ebp_preconception_visit',
      OUTPATIENT_PRECONCEPTION_VISIT_CHOICES
    ))
    .concat([
      'vitamin_c_available',
      'opening_hours',
      'comments',
      'data_quality',
      'education_material_specify',
      'Infertility_counsel',
      'abortion_counseling',
      'training_date_preconception',
      'preconception_protocols',
      'folic_acid',
      'child_immunization',
      'bp_adequate',
      'thermometers_adequate',
      'stethoscopes_adequate',
      'fetal_dopper_adequate',
      'malaria_diagnostic',
      'syphilis_rdk',
      'urine_ptk',
      'dipstick_protein',
      'dipstick_urine',
      'filter_paper_available',
      'referral_system',
      'abortion_referral',
      'malaria_zone',
      'cwc_register',
      'opd_register',
      'available_ors',
      'male_chaperone',
    ]);
}
