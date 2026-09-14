/**
 * FQA Weighting sheet.
 *
 * Lists every transformed coded column that can carry a score, one row
 * per Department / variable / response / label. Run writeFqaWeightingSheet
 * after mapping updates. Existing score cells are kept on refresh.
 */

const FQA_WEIGHTING_SHEET_NAME = 'FQA Weighting';
const FQA_WEIGHTING_HEADERS = [
  'Department/KOBO tool',
  'variable',
  'response',
  'label',
  'score',
];

function weightingRowKey_(department, variable, response) {
  return String(department) + '\t' + String(variable) + '\t' + String(response);
}

/** Yes/No labels get 1/0 so the sheet matches the scoring template. */
function defaultWeightingScore_(label) {
  if (label === 'Yes') return 1;
  if (label === 'No') return 0;
  return '';
}

function mapCodesInDisplayOrder_(map) {
  if (map[1] === 'Yes' && map[0] === 'No') return [1, 0];
  return Object.keys(map).sort(function (a, b) {
    return Number(a) - Number(b);
  }).map(function (code) {
    return isNaN(Number(code)) ? code : Number(code);
  });
}

function appendScoreRowsFromMap_(rows, department, variable, map) {
  mapCodesInDisplayOrder_(map).forEach(function (code) {
    rows.push({
      department: department,
      variable: variable,
      response: code,
      label: map[code],
    });
  });
}

function appendScoreRowsFromDests_(rows, department, dests, map) {
  dests.forEach(function (dest) {
    appendScoreRowsFromMap_(rows, department, dest, map);
  });
}

function appendSelectMultipleScoreRows_(rows, department, prefix, choices) {
  choices.forEach(function (choice) {
    appendScoreRowsFromMap_(
      rows,
      department,
      prefix + '_' + choice.slug,
      YES_NO_MAP
    );
  });
}

function appendScoreRowsFromTypedFields_(rows, department, fields) {
  fields.forEach(function (field) {
    if (field.type === 'int' || field.type === 'text') return;
    if (field.type === 'multi') {
      appendSelectMultipleScoreRows_(
        rows,
        department,
        field.prefix || field.dest,
        field.choices
      );
      return;
    }
    if (field.map) {
      appendScoreRowsFromMap_(rows, department, field.dest, field.map);
    }
  });
}

function newbornUnitScoreCatalog_() {
  const dept = 'Newborn Unit';
  const rows = [];
  appendScoreRowsFromDests_(rows, dept, [
    'functional_nbu',
    'premature_care',
    'nutritional_services',
    'nursing_care',
    'congenital_care',
    'asphyxia_care',
  ], YES_NO_MAP);
  appendScoreRowsFromMap_(rows, dept, 'referral_weight', REFERRAL_WEIGHT_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'blood_count',
    'malaria_test',
    'urine',
    'blood_cultures',
    'lumbar_puncture',
    'hiv_test',
    'coombs_testing',
    'bone_chemistry',
    'blood_group',
    'urinalysis',
    'crp_test',
    'thyroid_test',
    'electrolyte',
    'liver_function',
    'creatinine',
  ], LAB_AVAILABILITY_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'glucose_tests',
    'bilirubin_testing',
  ], UNIT_AVAILABILITY_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'cranial_ultrasound',
    'x_ray',
  ], RADIOLOGY_AVAILABILITY_MAP);
  appendScoreRowsFromMap_(rows, dept, 'imaging_time', IMAGING_TIME_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'neo_ped_24hrs',
    'adequate_mo',
    'adequate_reg_nurses',
    'adequate_co',
    'death_register',
    'deathreg_consistent_use',
    'summary_register',
    'neonatal_register',
  ], YES_NO_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'newborn_admission',
    'perinatal_notification',
    'perinatal_review',
  ], NEWBORN_ADMISSION_AVAIL_MAP);
  appendSelectMultipleScoreRows_(rows, dept, 'patient_files', PATIENT_FILES_CHOICES);
  appendScoreRowsFromDests_(rows, dept, [
    'visual_privacy',
    'auditory_privacy',
  ], ROOM_PRIVACY_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'sepsis_sop',
    'jaundice_sop',
    'hypoglycemia_sop',
    'neonatal_resuscitation_sop',
    'kmc_sop',
    'handwash_sop',
    'referral_sop',
  ], SOP_PROTOCOL_MAP);
  appendSelectMultipleScoreRows_(rows, dept, 'sop_policy', SOP_POLICY_CHOICES);
  appendScoreRowsFromMap_(rows, dept, 'water_source', WATER_SOURCE_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'water_available_consistently',
    'drainage_system',
    'separate_sink',
  ], YES_NO_MAP);
  appendScoreRowsFromMap_(rows, dept, 'hand_hygiene', HAND_HYGIENE_MAP);
  appendScoreRowsFromMap_(rows, dept, 'waste_management', WASTE_MANAGEMENT_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'waste_segregation',
    'cleaning_register',
    'decontamination_area',
    'decontamination_checklist',
    'utensil_cleaning_area',
    'laundry',
    'linen',
    'sharp_container',
    'sharp3_4full',
    'sharp_full',
    'latrine',
    'latrine_clients',
    'handwashing_station',
    'disinfect_washrooms',
    'clean_washroom',
    'access_disability',
    'menstrual_hygiene',
    'maintenance_infrastructure',
    'well_lit',
    'ventilation',
    'changing_area',
    'kitchionette',
    'fire_extinguishers',
    'clear_signage',
    'clear_charter',
    'cots_incubator',
    'kmc_area',
    'room_temp',
    'draught',
    'private_room',
    'counselling_room',
    'worktop',
    'nurse_desk',
    'space_sick_neonates',
    'isolation_room',
    'resuscitation_area',
    'sluice_room',
    'temporary_storage',
    'cctv',
    'dust_evidence',
    'bed_space',
  ], YES_NO_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'phototherapy_lamp',
    'radiant_warmer',
    'heat_source',
    'exam_light_available',
    'equipment_cpap',
    'monitors',
    'oximeters_neonates',
    'glucometer_nbu',
    'sunction_pump',
    'weighing_scale',
  ], EQUIP_FUNCTIONAL_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'wall_clock',
    'wall_thermometer',
    'neonatal_bp',
    'transfusion_kit',
    'drip_stands',
    'sunction_bulbs',
    'thermometer_readings',
  ], YES_NO_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'stethoscopes_nbu',
    'thermometer_nbu',
  ], ALWAYS_SOMETIMES_NEVER_MAP);
  appendSelectMultipleScoreRows_(rows, dept, 'equip_resus_equip', RESUS_EQUIP_CHOICES);
  appendSelectMultipleScoreRows_(rows, dept, 'equip_oxy_source', OXY_SOURCE_CHOICES);
  appendSelectMultipleScoreRows_(rows, dept, 'equip_cannulae', CANNULAE_CHOICES);
  appendScoreRowsFromDests_(rows, dept, [
    'tetraycline',
    'chlorhexidine',
    'iv_fluid',
    'vitk',
    'latex',
    'sterile',
    'soluset',
    'infant_formula',
    'feeding_cups',
    'syringe_sizes',
    'needles_sizes',
    'microdrippers',
    'iv_sets',
  ], NEWBORN_ADMISSION_AVAIL_MAP);
  appendSelectMultipleScoreRows_(rows, dept, 'commodities_catheters', SIZE_4_6_8_CHOICES);
  appendSelectMultipleScoreRows_(rows, dept, 'commodities_materials', MATERIALS_CHOICES);
  appendSelectMultipleScoreRows_(rows, dept, 'commodities_suction', SIZE_4_6_8_CHOICES);
  appendSelectMultipleScoreRows_(rows, dept, 'commodities_tubes', SIZE_4_6_8_CHOICES);
  appendScoreRowsFromDests_(rows, dept, [
    'kmc_initiated',
    'preterm_lowbirth',
    'feeding_freq',
    'breastmilk',
    'express_milk',
    'monitoring_plan',
    'neonate_review',
    'discharge',
    'discharge_note',
    'infact_referral',
    'caregiver',
    'weight_gain',
    'birth_weight',
    'condition_stable',
    'gestation_34wks',
    'paediatric_rco',
    'specialized_care',
  ], ALWAYS_SOMETIMES_NEVER_MAP);
  appendScoreRowsFromMap_(rows, dept, 'system_near_nbu', YES_NO_MAP);
  appendScoreRowsFromMap_(rows, dept, 'nbu_open', NBU_OPEN_MAP);
  return rows;
}

function inpatientMaternityScoreCatalog_() {
  const dept = 'Inpatient Maternity';
  const rows = [];
  appendScoreRowsFromMap_(rows, dept, 'functional_maternity_unit', YES_NO_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'birth_notification',
    'birth_death_notification',
    'birth_register',
    'death_notification',
    'delivery_notes',
    'delivery_register',
    'death_register',
    'autopsy_forms',
    'inpatient_maternity_file',
    'kmc_chart',
    'maternal_death_notification',
    'maternal_death_review',
    'newborn_file',
    'newborn_register',
    'nursing_register',
    'nutrition_form',
    'perinatal_death_notification',
    'perinatal_death_review',
    'postnatal_register',
    'postnatal_register_alt',
  ], MATERNITY_FILE_AVAILABILITY_MAP);
  appendSelectMultipleScoreRows_(
    rows, dept, 'health_records_patient_file', MATERNITY_PATIENT_FILE_CHOICES
  );
  appendScoreRowsFromMap_(rows, dept, 'auditory_privacy', ROOM_PRIVACY_MAP);
  appendScoreRowsFromMap_(rows, dept, 'visual_barrier', MATERNITY_BARRIER_MAP);
  appendScoreRowsFromMap_(rows, dept, 'bed_spacing', MATERNITY_BED_SPACE_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'files_privacy',
    'single_rooms',
  ], YES_NO_MAP);
  appendScoreRowsFromMap_(rows, dept, 'visual_privacy', ROOM_PRIVACY_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'eclampsia_sop',
    'handwashing_sop',
    'intrapartum_sop',
    'newborn_mgt_sop',
    'pph_sop',
    'pre_eclampsia_sop',
    'referral_sop',
    'resuscitation_sop',
    'sepsis_sop',
    'maternity_sop',
  ], SOP_PROTOCOL_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'procurement_protocol',
    'maternity_checklist',
  ], YES_NO_MAP);
  appendSelectMultipleScoreRows_(rows, dept, 'sop_policy_a', MATERNITY_POLICY_A_CHOICES);
  appendSelectMultipleScoreRows_(rows, dept, 'sop_policy_b', MATERNITY_POLICY_B_CHOICES);
  appendSelectMultipleScoreRows_(rows, dept, 'sop_policy_c', MATERNITY_POLICY_C_CHOICES);
  appendSelectMultipleScoreRows_(rows, dept, 'sop_policy_d', MATERNITY_POLICY_D_CHOICES);
  appendScoreRowsFromDests_(rows, dept, [
    'triage_area',
    'waiting_area',
    'disabled_access',
    'waiting_benches',
    'cabinets',
    'service_charter',
    'draught_free',
    'dust_evidence',
    'fire_extinguishers',
    'fan_available',
    'isolation_space',
    'well_lit',
    'maintenance_infrastructure',
    'building_material',
    'recovery_room',
    'resuscitation_area',
    'clear_signage',
    'sound_structures',
    'temperature_control',
    'ventilation',
  ], YES_NO_MAP);
  appendSelectMultipleScoreRows_(
    rows, dept, 'infrastructure_education', MATERNITY_EDUCATION_CHOICES
  );
  appendScoreRowsFromMap_(
    rows, dept, 'labour_area_privacy', MATERNITY_LABOUR_AREA_PRIVACY_MAP
  );
  appendScoreRowsFromMap_(
    rows, dept, 'childbirth_area_privacy', MATERNITY_CHILDBIRTH_AREA_PRIVACY_MAP
  );
  appendScoreRowsFromDests_(rows, dept, [
    'ambubags',
    'doppler',
    'exam_light',
    'fetoscopes',
    'glucometer',
    'obstetric_kit',
    'oximeter',
    'pharyngeal_airway',
    'preeclampsia_kit',
    'resus_kits',
    'vd_kits',
    'vacuum_extractor',
    'suction',
    'adult_scale',
    'infant_scale',
    'stadiometer',
    'thermometers',
    'stethoscopes',
    'laryngoscope',
    'bp_apparatus',
    'ctg_machine',
    'oxygen_equipment',
    'o2_source',
    'storage',
    'milk_bank',
    'refrigerator',
    'resuscitaire',
  ], EQUIP_FUNCTIONAL_MAP);
  appendScoreRowsFromMap_(rows, dept, 'incubators', MATERNITY_INCUBATOR_MAP);
  appendScoreRowsFromMap_(rows, dept, 'ultrasound_in_unit', ULTRASOUND_AVAIL_MAP);
  appendScoreRowsFromDests_(rows, dept, ['suction_bulbs', 'towels'], YES_NO_MAP);
  appendSelectMultipleScoreRows_(
    rows, dept, 'equipment_supplies', MATERNITY_SUPPLIES_CHOICES
  );
  appendSelectMultipleScoreRows_(
    rows, dept, 'equipment_em_tray', MATERNITY_EM_TRAY_CHOICES
  );
  appendSelectMultipleScoreRows_(
    rows, dept, 'equipment_resus_cart', MATERNITY_RESUS_CART_CHOICES
  );
  appendScoreRowsFromDests_(rows, dept, [
    'tetracycline',
    'chlorhexidine',
    'vit_k',
    'oxytocin',
    'hsc',
    'misoprostol',
    'tranexamic',
    'magnesium',
    'calcium',
    'hydralazine',
    'saline',
    'methyldopa',
    'dexamethasone',
    'latex_gloves',
    'sterile_gloves',
    'masks',
    'aprons',
    'iv_cannulae',
  ], NEWBORN_ADMISSION_AVAIL_MAP);
  appendScoreRowsFromMap_(rows, dept, 'bcg_availability', MATERNITY_BCG_AVAIL_MAP);
  appendScoreRowsFromMap_(rows, dept, 'hepb_availability', MATERNITY_HEPB_AVAIL_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'malaria_rdt',
    'hiv_test_kits',
    'glucose_strips',
    'ketone_strips',
    'glucometer_strips',
    'protein_strips',
    'syphilis_test_kits',
  ], MATERNITY_LAB_UNIT_AVAIL_MAP);
  appendScoreRowsFromMap_(rows, dept, 'ultrasound_adherence', ULTRASOUND_AVAIL_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'equipment_calibration',
    'documentation_adherence',
    'informed_consent',
    'staff_meeting',
    'arrival_assessment',
    'labour_care_guide',
    'companion_support',
    'delivery_practices',
    'information_sharing',
    'counselling_offered',
    'svd_support',
    'roaming_staff',
    'labour_support',
    'vital_signs_adherence',
    'pnc_adherence',
    'grief_support',
    'pain_drugs',
    'examination_adherence',
    'clinical_review',
    'latching_support',
    'passage_of_urine',
    'register_complete',
    'maternal_observation',
    'feeding_adherence',
    'emergency_system',
  ], ALWAYS_SOMETIMES_NEVER_MAP);
  appendSelectMultipleScoreRows_(
    rows, dept, 'triage_assessment', MATERNITY_TRIAGE_ASSESSMENT_CHOICES
  );
  appendSelectMultipleScoreRows_(rows, dept, 'labour_charts', MATERNITY_CHARTS_CHOICES);
  appendSelectMultipleScoreRows_(
    rows, dept, 'labour_counselling', MATERNITY_LABOUR_COUNSELLING_CHOICES
  );
  appendSelectMultipleScoreRows_(
    rows, dept, 'discharge_counselling', MATERNITY_DISCHARGE_COUNSELLING_CHOICES
  );
  appendScoreRowsFromMap_(
    rows, dept, 'caesarean_wait_hours', MATERNITY_OPERATION_HOURS_MAP
  );
  appendScoreRowsFromDests_(rows, dept, [
    'anomalies_service',
    'antibiotics_service',
    'avd_service',
    'breastfeeding_service',
    'newborn_care_service',
    'perineal_care',
    'placenta_service',
    'ppfp_service',
    'resuscitation_service',
    'retained_placenta_service',
    'understand_service',
    'uterotonics_service',
    'uterotonics_alt',
  ], YES_NO_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'antibiotics_freq',
    'anticonvulsant_freq',
    'avd_freq',
    'placenta_freq',
    'resuscitation_freq',
    'retained_freq',
    'uterotonics_freq',
  ], ALWAYS_SOMETIMES_NEVER_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'anticonvulsant_lab',
    'blood_group_lab',
    'bs_malaria_lab',
    'dbs_lab',
    'foetal_viability',
    'gestation_ultrasound',
    'glucose_lab',
    'hep_b_lab',
    'hgb_lab',
    'hiv_rapid_lab',
    'malaria_lab',
    'microscopy_lab',
    'no_foetuses',
    'placenta_det',
    'rpr_vdrl',
    'tb_testing',
    'urinalysis_lab',
    'urine_glucose_lab',
    'urine_protein_lab',
    'urine_rapid_lab',
  ], MATERNITY_LAB_AVAILABILITY_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'ctg_service',
    'xray_service',
  ], RADIOLOGY_AVAILABILITY_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'pocus_service',
    'ultrasound_service',
  ], ULTRASOUND_AVAIL_MAP);
  appendSelectMultipleScoreRows_(
    rows, dept, 'services_immunization', MATERNITY_IMMUNIZATION_CHOICES
  );
  appendScoreRowsFromMap_(rows, dept, 'wash_accessible', YES_NO_MAP);
  appendScoreRowsFromMap_(rows, dept, 'wash_bathrooms', MATERNITY_BATHROOM_CLEANING_MAP);
  appendScoreRowsFromMap_(rows, dept, 'wash_clean', YES_NO_MAP);
  appendScoreRowsFromMap_(
    rows, dept, 'wash_disposable_towels', MATERNITY_DISPOSABLE_TOWELS_MAP
  );
  appendScoreRowsFromDests_(rows, dept, [
    'wash_disposal',
    'wash_drainage',
    'wash_gender',
  ], YES_NO_MAP);
  appendScoreRowsFromMap_(rows, dept, 'wash_hand_washing', HAND_HYGIENE_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'wash_labour',
  ], YES_NO_MAP);
  appendScoreRowsFromMap_(rows, dept, 'wash_latrine', MATERNITY_LATRINE_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'wash_leak_proof',
    'wash_menstrual',
    'wash_sharp',
  ], YES_NO_MAP);
  appendScoreRowsFromMap_(rows, dept, 'wash_source', WATER_SOURCE_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'wash_station',
    'wash_visible',
    'wash_water_freq',
  ], YES_NO_MAP);
  return rows;
}

function outpatientScoreCatalog_() {
  const dept = 'Outpatient';
  const rows = [];
  appendScoreRowsFromDests_(rows, dept, [
    'unit',
    'preconception_service',
    'gynecological_service',
    'anc_low_risk',
    'anc_high_risk',
    'services_registration',
    'ultrasound_services',
    'mothers_pnc',
    'infants_pnc',
    'infant_immunization',
    'foetal_nonstress',
    'services_via',
  ], OUTPATIENT_YES_NO_MAP);
  appendSelectMultipleScoreRows_(
    rows, dept, 'general_services_family_plan', OUTPATIENT_FAMILY_PLAN_CHOICES
  );
  appendScoreRowsFromDests_(rows, dept, [
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
  ], LAB_AVAILABILITY_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'Infertility_counsel',
    'abortion_counseling',
    'referral_system',
    'abortion_referral',
    'consultation',
    'hrh_medical_officer3',
    'hrh_nurse_midwives3',
    'hrh_clinical_officers3',
    'mental_health_expertise_access',
    'staff_shortage',
  ], OUTPATIENT_YES_NO_MAP);
  appendScoreRowsFromDests_(rows, dept, [
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
    'cwc_register',
    'opd_register',
  ], NEWBORN_ADMISSION_AVAIL_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'visual_privacy',
    'auditory_privacy',
  ], ROOM_PRIVACY_MAP);
  appendScoreRowsFromMap_(
    rows, dept, 'patient_filec_privacy', OUTPATIENT_YES_NO_MAP
  );
  appendScoreRowsFromDests_(rows, dept, [
    'staffing_policy',
    'procurement_protocol',
    'triage_protocol',
  ], OUTPATIENT_YES_NO_MAP);
  appendScoreRowsFromMap_(
    rows, dept, 'handwashing_protocols', OUTPATIENT_SOP_DISPLAY_MAP
  );
  appendScoreRowsFromDests_(rows, dept, [
    'family_planning_guide',
    'family_planning_protocol',
    'sop_cervical_cancer',
  ], OUTPATIENT_YES_NO_MAP);
  appendScoreRowsFromMap_(rows, dept, 'anc_protocols', OUTPATIENT_SOP_DISPLAY_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'staff_sop_guide',
    'complicated_pregnancy',
  ], OUTPATIENT_YES_NO_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'sops_pnc_protocol',
    'sops_kepi_vaccine',
    'preconception_protocols',
  ], OUTPATIENT_PROTOCOL_AVAILABILITY_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'sops_weaning_education',
    'sops_child_growth',
    'sops_infant_diarrhea',
    'folic_acid',
    'child_immunization',
  ], OUTPATIENT_YES_NO_MAP);
  appendScoreRowsFromMap_(rows, dept, 'wash_water_source', WATER_SOURCE_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'wash_water_availability',
    'wash_drainage',
  ], OUTPATIENT_YES_NO_MAP);
  appendScoreRowsFromMap_(
    rows, dept, 'wash_hand_hygiene', OUTPATIENT_HAND_HYGIENE_MAP
  );
  appendScoreRowsFromMap_(rows, dept, 'wash_waste_management', WASTE_MANAGEMENT_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'wash_waste_bins',
    'wash_functional_toilet',
    'wash_sharp_container',
    'wash_sharp_capacity',
    'was_handwash_area',
  ], OUTPATIENT_YES_NO_MAP);
  appendScoreRowsFromMap_(rows, dept, 'wash_latrine_type', MATERNITY_LATRINE_MAP);
  appendScoreRowsFromMap_(
    rows, dept, 'wash_bathrooms_disinfected', MATERNITY_BATHROOM_CLEANING_MAP
  );
  appendScoreRowsFromDests_(rows, dept, [
    'wash_cleanliness',
    'wash_accessibility',
    'wash_gender_separation',
    'wash_menstrual_hygiene',
    'wash_handwash_stations',
    'waiting_area',
    'chair_availability',
    'ventilation',
    'waiting_area_well_maintained',
    'educational_material',
    'wall_well_maintained',
    'spaces_lighting',
    'ventilation_exam',
    'fire_extinguisher',
    'facility_visible_signage',
    'visible_service_charter',
  ], OUTPATIENT_YES_NO_MAP);
  appendSelectMultipleScoreRows_(
    rows,
    dept,
    'overall_infrastructure_materials_display',
    OUTPATIENT_MATERIALS_DISPLAY_CHOICES
  );
  appendScoreRowsFromMap_(rows, dept, 'service_areas', OUTPATIENT_YES_NO_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'number_oximeter',
    'light_source',
    'vaccine_refrigerator',
    'refregerator_available',
  ], OUTPATIENT_EQUIP_FUNCTIONAL_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'number_measuring_tape',
    'number_stadiometre',
    'adult_scale',
    'infant_scale',
    'gestational_wheel',
    'sterile_speculum',
    'iud_trays_availlable',
    'implant_insertion_available',
    'bp_adequate',
    'thermometers_adequate',
    'stethoscopes_adequate',
    'fetal_dopper_adequate',
  ], OUTPATIENT_YES_NO_MAP);
  appendScoreRowsFromMap_(
    rows, dept, 'ultrasound_machine', OUTPATIENT_ULTRASOUND_MACHINE_MAP
  );
  appendSelectMultipleScoreRows_(
    rows, dept, 'equipment_availability_emergency_tray', OUTPATIENT_EMERGENCY_TRAY_CHOICES
  );
  appendSelectMultipleScoreRows_(
    rows, dept, 'equipment_availability_resus_cart', OUTPATIENT_RESUS_CART_CHOICES
  );
  appendScoreRowsFromDests_(rows, dept, [
    'light_microscope_available',
    'glucometer_available',
    'haemoglobinometer',
  ], OUTPATIENT_LAB_EQUIP_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'insecticide_treated_nets_available',
    'latex_gloves_available',
    'sterile_gloves_available',
    'ppe_available',
    'glass_slides_available',
  ], OUTPATIENT_COMMODITY_STORE_MAP);
  appendScoreRowsFromDests_(rows, dept, [
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
    'vitamin_c_available',
    'available_ors',
  ], OUTPATIENT_COMMODITY_PHARMACY_MAP);
  appendScoreRowsFromDests_(rows, dept, [
    'available_hiv_rapid_test_kits',
    'available_dipstick_ketone',
    'available_glucometer',
    'malaria_diagnostic',
    'syphilis_rdk',
    'urine_ptk',
    'dipstick_protein',
    'dipstick_urine',
    'filter_paper_available',
  ], OUTPATIENT_COMMODITY_LAB_MAP);
  appendScoreRowsFromMap_(rows, dept, 'malaria_zone', OUTPATIENT_YES_NO_MAP);
  appendScoreRowsFromMap_(
    rows, dept, 'patient_identification', ALWAYS_SOMETIMES_NEVER_MAP
  );
  appendScoreRowsFromDests_(rows, dept, [
    'triage_process',
    'triage_record',
  ], OUTPATIENT_YES_NO_MAP);
  appendSelectMultipleScoreRows_(
    rows, dept, 'adherance_to_ebp_health_edu', OUTPATIENT_HEALTH_EDU_CHOICES
  );
  appendSelectMultipleScoreRows_(
    rows, dept, 'adherance_to_ebp_anc_visit', OUTPATIENT_ANC_VISIT_CHOICES
  );
  appendSelectMultipleScoreRows_(
    rows, dept, 'adherance_to_ebp_third_trimester', OUTPATIENT_THIRD_TRIMESTER_CHOICES
  );
  appendSelectMultipleScoreRows_(
    rows, dept, 'adherance_to_ebp_postnatal_exam', OUTPATIENT_POSTNATAL_EXAM_CHOICES
  );
  appendSelectMultipleScoreRows_(
    rows, dept, 'adherance_to_ebp_pnc_visit', OUTPATIENT_PNC_VISIT_CHOICES
  );
  appendScoreRowsFromDests_(rows, dept, [
    'anc_defaulters',
    'group_anc',
    'referral_mechanism',
    'male_chaperone',
  ], OUTPATIENT_YES_NO_MAP);
  appendSelectMultipleScoreRows_(
    rows,
    dept,
    'adherance_to_ebp_preconception_visit',
    OUTPATIENT_PRECONCEPTION_VISIT_CHOICES
  );
  appendScoreRowsFromMap_(
    rows, dept, 'opening_hours', MATERNITY_OPERATION_HOURS_MAP
  );
  return rows;
}

function labScoreCatalog_() {
  const dept = 'Lab';
  const rows = [];
  appendScoreRowsFromMap_(rows, dept, 'units', LAB_UNITS_MAP);
  LAB_GROUP_2_FIELDS.forEach(function (field) {
    appendScoreRowsFromMap_(rows, dept, field.dest, labGroup2Map_(field.dest));
  });
  appendScoreRowsFromDests_(rows, dept, labGroup3YesNoFields_(), YES_NO_MAP);
  appendSelectMultipleScoreRows_(
    rows, dept, LAB_STANDARD_LAB_REQUEST_PREFIX, LAB_STANDARD_LAB_REQUEST_CHOICES
  );
  appendScoreRowsFromMap_(rows, dept, 'personnel', LAB_PERSONNEL_MAP);
  appendScoreRowsFromMap_(rows, dept, 'inadequate_staff', YES_NO_MAP);
  appendScoreRowsFromDests_(rows, dept, LAB_GROUP_5_YES_NO_FIELDS, YES_NO_MAP);
  appendScoreRowsFromMap_(
    rows, dept, 'handwashing_protocol', LAB_HANDWASHING_PROTOCOL_MAP
  );
  appendScoreRowsFromMap_(rows, dept, 'have_quality_manual', YES_NO_MAP);
  appendSelectMultipleScoreRows_(rows, dept, LAB_SOP_PREFIX, LAB_SOP_CHOICES);
  appendSelectMultipleScoreRows_(
    rows, dept, LAB_SPECIMEN_COLLECTION_PREFIX, LAB_SPECIMEN_COLLECTION_CHOICES
  );
  appendScoreRowsFromDests_(rows, dept, LAB_GROUP_6_YES_NO_FIELDS, YES_NO_MAP);
  appendSelectMultipleScoreRows_(
    rows, dept, LAB_CONFIRM_SOPS_PREFIX, LAB_CONFIRM_SOPS_CHOICES
  );
  appendScoreRowsFromMap_(rows, dept, 'water_source', WATER_SOURCE_MAP);
  appendScoreRowsFromDests_(rows, dept, LAB_GROUP_7_YES_NO_FIELDS, YES_NO_MAP);
  appendScoreRowsFromMap_(rows, dept, 'soap_available', LAB_SOAP_AVAILABLE_MAP);
  appendScoreRowsFromMap_(
    rows, dept, 'waste_management_protocol', WASTE_MANAGEMENT_MAP
  );
  appendScoreRowsFromDests_(rows, dept, LAB_GROUP_8_YES_NO_FIELDS, YES_NO_MAP);
  appendScoreRowsFromDests_(rows, dept, LAB_GROUP_9_YES_NO_FIELDS, YES_NO_MAP);
  labGroup9SelectMultiples_().forEach(function (field) {
    appendSelectMultipleScoreRows_(rows, dept, field.prefix, field.choices);
  });
  appendScoreRowsFromDests_(
    rows, dept, LAB_GROUP_9_EQUIP_FUNCTIONAL_FIELDS, EQUIP_FUNCTIONAL_MAP
  );
  appendScoreRowsFromMap_(
    rows, dept, 'maint_contract_colo_hae', LAB_AVAILABLE_NOT_AVAILABLE_MAP
  );
  appendScoreRowsFromMap_(rows, dept, 'sputum_smear', LAB_SPUTUM_SMEAR_MAP);
  appendScoreRowsFromMap_(rows, dept, 'blood_count', LAB_BLOOD_COUNT_MAP);
  appendScoreRowsFromDests_(
    rows, dept, LAB_GROUP_10_FIELDS, LAB_ALWAYS_SOMETIMES_NEVER_AVAILABLE_MAP
  );
  appendScoreRowsFromDests_(rows, dept, LAB_GROUP_11_YES_NO_FIELDS, YES_NO_MAP);
  labGroup11SelectMultiples_().forEach(function (field) {
    appendSelectMultipleScoreRows_(rows, dept, field.prefix, field.choices);
  });
  appendScoreRowsFromMap_(
    rows, dept, 'on_laboratory_open', LAB_ON_LABORATORY_OPEN_MAP
  );
  appendScoreRowsFromDests_(rows, dept, LAB_GROUP_12_YES_NO_FIELDS, YES_NO_MAP);
  return rows;
}

function operatingTheatreScoreCatalog_() {
  const rows = [];
  OT_TRANSFORM_FIELD_GROUPS.forEach(function (fields) {
    appendScoreRowsFromTypedFields_(rows, 'Operating Theatre', fields);
  });
  return rows;
}

function pharmacyScoreCatalog_() {
  const dept = 'Pharmacy';
  const rows = [];
  appendSelectMultipleScoreRows_(
    rows, dept, PHARMACY_UNITS_PREFIX, PHARMACY_UNITS_CHOICES
  );
  appendScoreRowsFromDests_(rows, dept, PHARMACY_RECORD_YES_NO_FIELDS, YES_NO_MAP);
  appendScoreRowsFromDests_(rows, dept, PHARMACY_HRH_YES_NO_FIELDS, YES_NO_MAP);
  appendScoreRowsFromMap_(rows, dept, 'prese', PHARMACY_PRESENT_MAP);
  appendScoreRowsFromMap_(rows, dept, 'handwashing', PHARMACY_HANDWASHING_MAP);
  PHARMACY_SOP_SANITATION_YES_NO_FIELDS.forEach(function (field) {
    appendScoreRowsFromMap_(rows, dept, field.dest, YES_NO_MAP);
  });
  appendScoreRowsFromMap_(rows, dept, 'water_source', WATER_SOURCE_MAP);
  appendScoreRowsFromMap_(rows, dept, 'soap_disp', PHARMACY_SOAP_DISP_MAP);
  PHARMACY_INFRA_EQUIP_YES_NO_FIELDS.forEach(function (field) {
    appendScoreRowsFromMap_(rows, dept, field.dest, YES_NO_MAP);
  });
  appendScoreRowsFromMap_(rows, dept, 'fridge', EQUIP_FUNCTIONAL_MAP);
  appendScoreRowsFromMap_(rows, dept, 'cabinet', PHARMACY_CABINET_MAP);
  appendScoreRowsFromMap_(rows, dept, 'receipt', PHARMACY_RECEIPT_MAP);
  appendScoreRowsFromDests_(
    rows,
    dept,
    PHARMACY_COMMODITY_AVAIL_FIELDS,
    PHARMACY_ALWAYS_SOMETIMES_NEVER_AVAILABLE_MAP
  );
  appendScoreRowsFromMap_(rows, dept, 'nutrition', PHARMACY_NUTRITION_MAP);
  appendScoreRowsFromDests_(
    rows, dept, PHARMACY_COMMODITY_YES_NO_FIELDS, YES_NO_MAP
  );
  appendScoreRowsFromDests_(
    rows, dept, PHARMACY_BEST_PRACTICES_YES_NO_FIELDS, YES_NO_MAP
  );
  appendScoreRowsFromMap_(rows, dept, 'opening', PHARMACY_OPENING_MAP);
  return rows;
}

function centralStoreScoreCatalog_() {
  const dept = 'Central Store';
  const rows = [];
  appendSelectMultipleScoreRows_(
    rows, dept, CENTRAL_STORE_UNITS_PREFIX, CENTRAL_STORE_UNITS_CHOICES
  );
  appendScoreRowsFromMap_(
    rows, dept, 'designated_space', CENTRAL_STORE_DESIGNATED_SPACE_MAP
  );
  appendScoreRowsFromDests_(
    rows, dept, CENTRAL_STORE_HEALTH_YES_NO_FIELDS, YES_NO_MAP
  );
  appendScoreRowsFromMap_(
    rows, dept, 'odering_personnel', CENTRAL_STORE_ORDERING_PERSONNEL_MAP
  );
  appendScoreRowsFromMap_(
    rows, dept, 'stock_orders', CENTRAL_STORE_STOCK_ORDERS_MAP
  );
  CENTRAL_STORE_SOP_INFRA_EQUIP_YES_NO_FIELDS.forEach(function (field) {
    appendScoreRowsFromMap_(rows, dept, field.dest, YES_NO_MAP);
  });
  appendScoreRowsFromDests_(
    rows,
    dept,
    CENTRAL_STORE_COMMODITY_AVAIL_FIELDS,
    CENTRAL_STORE_ALWAYS_SOMETIMES_NEVER_AVAILABLE_MAP
  );
  appendScoreRowsFromDests_(
    rows, dept, CENTRAL_STORE_COMMODITY_YES_NO_FIELDS, YES_NO_MAP
  );
  appendScoreRowsFromMap_(rows, dept, 'hours', CENTRAL_STORE_HOURS_MAP);
  return rows;
}

function facilityGeneralScoreCatalog_() {
  const dept = 'Facility General';
  const rows = [];
  appendSelectMultipleScoreRows_(
    rows, dept, FACILITY_GENERAL_UNITS_PREFIX, FACILITY_GENERAL_UNITS_CHOICES
  );
  appendScoreRowsFromMap_(
    rows, dept, 'data_collection_tools', FACILITY_GENERAL_DATA_COLLECTION_TOOLS_MAP
  );
  appendScoreRowsFromDests_(
    rows, dept, FACILITY_GENERAL_HEALTH_RECORDS_YES_NO_FIELDS, YES_NO_MAP
  );
  appendSelectMultipleScoreRows_(
    rows,
    dept,
    FACILITY_GENERAL_SECURE_REGISTERS_PREFIX,
    FACILITY_GENERAL_SECURE_REGISTERS_CHOICES
  );
  appendScoreRowsFromMap_(rows, dept, 'upload_data2', YES_NO_MAP);
  appendSelectMultipleScoreRows_(
    rows, dept, FACILITY_GENERAL_RECORD_PREFIX, FACILITY_GENERAL_RECORD_CHOICES
  );
  appendScoreRowsFromMap_(
    rows, dept, 'mpdr_committee2', FACILITY_GENERAL_MPDR_COMMITTEE2_MAP
  );
  appendScoreRowsFromMap_(rows, dept, 'standard_hours', YES_NO_MAP);
  FACILITY_GENERAL_HRH_STAFF_FIELDS.forEach(function (field) {
    if (field.type === 'yesno') {
      appendScoreRowsFromMap_(rows, dept, field.dest, YES_NO_MAP);
    }
  });
  appendSelectMultipleScoreRows_(
    rows,
    dept,
    FACILITY_GENERAL_FACILITY_STAFF3_PREFIX,
    FACILITY_GENERAL_FACILITY_STAFF3_CHOICES
  );
  appendScoreRowsFromDests_(
    rows, dept, FACILITY_GENERAL_HRH_POLICY_YES_NO_FIELDS, YES_NO_MAP
  );
  appendScoreRowsFromMap_(rows, dept, 'have_qit', YES_NO_MAP);
  appendScoreRowsFromMap_(
    rows, dept, 'qit_meet', FACILITY_GENERAL_COMMITTEE_MEET_MAP
  );
  appendScoreRowsFromMap_(rows, dept, 'have_wit', YES_NO_MAP);
  appendScoreRowsFromMap_(
    rows, dept, 'wit_meet', FACILITY_GENERAL_COMMITTEE_MEET_MAP
  );
  appendScoreRowsFromMap_(rows, dept, 'have_sit', YES_NO_MAP);
  appendScoreRowsFromMap_(
    rows, dept, 'sit_meet', FACILITY_GENERAL_SIT_MEET_MAP
  );
  appendScoreRowsFromMap_(rows, dept, 'ipc_committee', YES_NO_MAP);
  appendScoreRowsFromMap_(
    rows, dept, 'dis_sharps', FACILITY_GENERAL_DIS_SHARPS_MAP
  );
  appendScoreRowsFromDests_(rows, dept, [
    'inci_avail_funct',
    'inci_petrol',
  ], YES_NO_MAP);
  appendScoreRowsFromMap_(
    rows, dept, 'dispose_medwast', FACILITY_GENERAL_DISPOSE_MEDWAST_MAP
  );
  appendScoreRowsFromMap_(
    rows, dept, 'designated_cleaning', FACILITY_GENERAL_PRESENT_MAP
  );
  appendScoreRowsFromDests_(rows, dept, [
    'control_traffic',
    'three_bucket',
    'sop_instrument',
  ], YES_NO_MAP);
  appendScoreRowsFromDests_(
    rows,
    dept,
    FACILITY_GENERAL_WASH_AVAIL_FIELDS,
    FACILITY_GENERAL_ALWAYS_SOMETIMES_NEVER_AVAILABLE_MAP
  );
  appendScoreRowsFromMap_(rows, dept, 'central_steril', YES_NO_MAP);
  appendSelectMultipleScoreRows_(
    rows,
    dept,
    FACILITY_GENERAL_STERLIZATION_PLACE_PREFIX,
    FACILITY_GENERAL_STERLIZATION_PLACE_CHOICES
  );
  appendScoreRowsFromDests_(rows, dept, [
    'safe_water',
    'func_water_source',
  ], YES_NO_MAP);
  appendScoreRowsFromMap_(
    rows, dept, 'main_source', FACILITY_GENERAL_WATER_SOURCE_MAP
  );
  appendSelectMultipleScoreRows_(
    rows, dept, FACILITY_GENERAL_OTH_SOURCE_PREFIX, FACILITY_GENERAL_OTH_SOURCE_CHOICES
  );
  appendScoreRowsFromMap_(
    rows, dept, 'soiled_linen_pro', FACILITY_GENERAL_SOILED_LINEN_MAP
  );
  appendScoreRowsFromMap_(
    rows, dept, 'contact_patient', FACILITY_GENERAL_CONTACT_PATIENT_MAP
  );
  appendScoreRowsFromDests_(
    rows, dept, FACILITY_GENERAL_SURFACE_CLEAN_FIELDS, FACILITY_GENERAL_SURFACE_CLEAN_MAP
  );
  appendScoreRowsFromMap_(rows, dept, 'sche_bathrooms', YES_NO_MAP);
  appendScoreRowsFromMap_(
    rows, dept, 'table_tops', FACILITY_GENERAL_SURFACE_CLEAN_MAP
  );
  appendScoreRowsFromDests_(
    rows, dept, FACILITY_GENERAL_INFRA_YES_NO_FIELDS, YES_NO_MAP
  );
  appendScoreRowsFromMap_(
    rows, dept, 'vis_signage', FACILITY_GENERAL_VIS_SIGNAGE_MAP
  );
  appendScoreRowsFromMap_(
    rows, dept, 'main_elec_source', FACILITY_GENERAL_MAIN_ELEC_SOURCE_MAP
  );
  appendScoreRowsFromMap_(
    rows, dept, 'processed_linens', FACILITY_GENERAL_PROCESSED_LINENS_MAP
  );
  appendSelectMultipleScoreRows_(
    rows,
    dept,
    FACILITY_GENERAL_SEC_ELECTRICITY_PREFIX,
    FACILITY_GENERAL_SEC_ELECTRICITY_CHOICES
  );
  appendSelectMultipleScoreRows_(
    rows,
    dept,
    FACILITY_GENERAL_SECURITY_MEASURES6_PREFIX,
    FACILITY_GENERAL_SECURITY_MEASURES6_CHOICES
  );
  appendSelectMultipleScoreRows_(
    rows,
    dept,
    FACILITY_GENERAL_HOUSEKEEPING_PREFIX,
    FACILITY_GENERAL_HOUSEKEEPING_CHOICES
  );
  appendScoreRowsFromDests_(
    rows, dept, FACILITY_GENERAL_SERVICES_YES_NO_FIELDS, YES_NO_MAP
  );
  appendSelectMultipleScoreRows_(
    rows,
    dept,
    FACILITY_GENERAL_SYSTEMS_PLACE_PREFIX,
    FACILITY_GENERAL_SYSTEMS_PLACE_CHOICES
  );
  appendScoreRowsFromMap_(rows, dept, 'run_out_fuel', YES_NO_MAP);
  appendScoreRowsFromDests_(
    rows, dept, FACILITY_GENERAL_ADHERENCE_YES_NO_FIELDS, YES_NO_MAP
  );
  appendScoreRowsFromMap_(
    rows, dept, 'opening_hours', FACILITY_GENERAL_OPENING_HOURS_MAP
  );
  return rows;
}

function fqaWeightingCatalogBuilders_() {
  return [
    { department: 'Newborn Unit', build: newbornUnitScoreCatalog_ },
    { department: 'Inpatient Maternity', build: inpatientMaternityScoreCatalog_ },
    { department: 'Outpatient', build: outpatientScoreCatalog_ },
    { department: 'Lab', build: labScoreCatalog_ },
    { department: 'Operating Theatre', build: operatingTheatreScoreCatalog_ },
    { department: 'Pharmacy', build: pharmacyScoreCatalog_ },
    { department: 'Central Store', build: centralStoreScoreCatalog_ },
    { department: 'Facility General', build: facilityGeneralScoreCatalog_ },
  ];
}

function collectFqaWeightingRows_() {
  const rows = [];
  fqaWeightingCatalogBuilders_().forEach(function (entry) {
    entry.build().forEach(function (row) {
      rows.push(row);
    });
  });
  return rows;
}

function readExistingWeightingScoresFromValues_(values) {
  const scores = {};
  if (!values || values.length < 2) return scores;
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row || row.length < 5) continue;
    const score = row[4];
    if (score === '' || score === undefined || score === null) continue;
    scores[weightingRowKey_(row[0], row[1], row[2])] = score;
  }
  return scores;
}

function buildFqaWeightingTableRows_(existingScores) {
  const kept = existingScores || {};
  return collectFqaWeightingRows_().map(function (row) {
    const key = weightingRowKey_(row.department, row.variable, row.response);
    const score = Object.prototype.hasOwnProperty.call(kept, key)
      ? kept[key]
      : defaultWeightingScore_(row.label);
    return [
      row.department,
      row.variable,
      row.response,
      row.label,
      score,
    ];
  });
}

/**
 * Create or refresh the FQA Weighting sheet.
 * Scores already entered on the sheet are preserved.
 */
function writeFqaWeightingSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(FQA_WEIGHTING_SHEET_NAME);
  let existing = {};
  if (sheet && sheet.getLastRow() > 1 && sheet.getLastColumn() > 0) {
    existing = readExistingWeightingScoresFromValues_(
      sheet.getRange(1, 1, sheet.getLastRow(), 5).getValues()
    );
  }
  const rows = buildFqaWeightingTableRows_(existing);
  if (!sheet) sheet = ss.insertSheet(FQA_WEIGHTING_SHEET_NAME);
  sheet.clearContents();
  ensureSheetCapacity_(sheet, rows.length + 1, FQA_WEIGHTING_HEADERS.length);
  sheet.getRange(1, 1, 1, FQA_WEIGHTING_HEADERS.length)
    .setValues([FQA_WEIGHTING_HEADERS]);
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, FQA_WEIGHTING_HEADERS.length)
      .setValues(rows);
  }
  sheet.setFrozenRows(1);
  Logger.log(
    'Wrote ' + rows.length + ' weighting rows to "' +
    FQA_WEIGHTING_SHEET_NAME + '"'
  );
}
