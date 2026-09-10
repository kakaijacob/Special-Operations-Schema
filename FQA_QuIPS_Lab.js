/** Lab transformation and preferred headers. */

const LAB_UNITS_MAP = {
  3: 'Basic Laboratory services',
  4: 'Comprehensive laboratory services',
};

/**
 * group_2 coded questions, in output order.
 * Always/Sometimes/Never unless the destination looks like a monthly Yes/No.
 */
const LAB_GROUP_2_FIELDS = [
  { source: 'group_2/abo_blood', dest: 'blood_group_testing' },
  { source: 'group_2/abo_monthly', dest: 'abo_monthly' },
  { source: 'group_2/perform_hbsag', dest: 'perform_hbsag' },
  { source: 'group_2/hbsag_monthly', dest: 'hbsag_monthly' },
  { source: 'group_2/perform_rpr', dest: 'perform_rpr' },
  { source: 'group_2/rpr_monthly', dest: 'rpr_monthly' },
  { source: 'group_2/perform_vdrl', dest: 'perform_vdrl' },
  { source: 'group_2/vdrl_monthly', dest: 'vdrl_monthly' },
  { source: 'group_2/perform_syphilis', dest: 'perform_syphilis' },
  { source: 'group_2/perform_microscopy', dest: 'perform_microscopy' },
  { source: 'group_2/microscopy_monthly', dest: 'microscopy_monthly' },
  { source: 'group_2/perform_hb', dest: 'perform_hb' },
  { source: 'group_2/HB_monthly', dest: 'HB_monthly' },
  { source: 'group_2/per_urinalyisis_micro', dest: 'per_urinalyisis_micro' },
  { source: 'group_2/urinalyisis_micro_mon', dest: 'urinalyisis_micro_mon' },
  { source: 'group_2/perform_urine_rapid', dest: 'perform_urine_rapid' },
  { source: 'group_2/urine_rapid_monthly', dest: 'urine_rapid_monthly' },
  { source: 'group_2/perform_urine_protein', dest: 'perform_urine_protein' },
  { source: 'group_2/urine_protein_monthly', dest: 'urine_protein_monthly' },
  { source: 'group_2/glucose_dipstick', dest: 'glucose_dipstick' },
  { source: 'group_2/glucose_dipstick_monthly', dest: 'glucose_dipstick_monthly' },
  { source: 'group_2/perform_hiv', dest: 'perform_hiv' },
  { source: 'group_2/hivrapid_monthly', dest: 'hivrapid_monthly' },
  { source: 'group_2/perform_malaria', dest: 'perform_malaria' },
  { source: 'group_2/malaria_monthly', dest: 'malaria_monthly' },
  { source: 'group_2/perform_tb', dest: 'perform_tb' },
  { source: 'group_2/tb_monthly', dest: 'tb_monthly' },
  { source: 'group_2/perform_blood_gluc', dest: 'perform_blood_gluc' },
  { source: 'group_2/blood_gluc_monthly', dest: 'blood_gluc_monthly' },
  { source: 'group_2/perform_vaginal_swab', dest: 'perform_vaginal_swab' },
  { source: 'group_2/vaginal_swab_monthly', dest: 'vaginal_swab_monthly' },
  { source: 'group_2/perform_esr', dest: 'perform_esr' },
  { source: 'group_2/esr_monthly', dest: 'esr_monthly' },
  { source: 'group_2/perform_thyroid', dest: 'perform_thyroid' },
  { source: 'group_2/thyroid_monthly', dest: 'thyroid_monthly' },
  { source: 'group_2/perform_hormone_prof', dest: 'perform_hormone_prof' },
  { source: 'group_2/hormone_prof_monthly', dest: 'hormone_prof_monthly' },
  { source: 'group_2/able_Hga1c', dest: 'able_Hga1c' },
  { source: 'group_2/Hga1c_monthly', dest: 'Hga1c_monthly' },
  { source: 'group_2/perform_crp', dest: 'perform_crp' },
  { source: 'group_2/crp_monthly', dest: 'crp_monthly' },
  { source: 'group_2/perform_coombs', dest: 'perform_coombs' },
  { source: 'group_2/coombs_monthly', dest: 'coombs_monthly' },
  { source: 'group_2/offer_bloodtransfusion', dest: 'offer_bloodtransfusion' },
  { source: 'group_2/transfusion_monthly', dest: 'transfusion_monthly' },
  { source: 'group_2/perform_crossmatch', dest: 'perform_crossmatch' },
  { source: 'group_2/crossmatch_monthly', dest: 'crossmatch_monthly' },
  { source: 'group_2/perform_hepc', dest: 'perform_hepc' },
  { source: 'group_2/hepc_monthly', dest: 'hepc_monthly' },
  { source: 'group_2/per_urinalysis_culture', dest: 'per_urinalysis_culture' },
  { source: 'group_2/culture_monthly', dest: 'culture_monthly' },
  { source: 'group_2/per_hiv_elisa', dest: 'per_hiv_elisa' },
  { source: 'group_2/hiv_elisa_monthly', dest: 'hiv_elisa_monthly' },
  { source: 'group_2/per_dbs', dest: 'per_dbs' },
  { source: 'group_2/dbs_monthly', dest: 'dbs_monthly' },
  { source: 'group_2/per_liver_tests', dest: 'per_liver_tests' },
  { source: 'group_2/liver_tests_monthly', dest: 'liver_tests_monthly' },
  { source: 'group_2/per_urea_elec', dest: 'per_urea_elec' },
  { source: 'group_2/urea_elec_monthly', dest: 'urea_elec_monthly' },
  { source: 'group_2/able_birirubin', dest: 'able_birirubin' },
  { source: 'group_2/birirubin_monthly', dest: 'birirubin_monthly' },
  { source: 'group_2/per_uric_acid', dest: 'per_uric_acid' },
  { source: 'group_2/uric_acid_monthly', dest: 'uric_acid_monthly' },
  { source: 'group_2/per_coagulation', dest: 'per_coagulation' },
  { source: 'group_2/coagulation_monthly', dest: 'coagulation_monthly' },
  { source: 'group_2/per_blood_culture', dest: 'per_blood_culture' },
  { source: 'group_2/blood_culture_monthly', dest: 'blood_culture_monthly' },
  { source: 'group_2/perform_pap_smear', dest: 'perform_pap_smear' },
  { source: 'group_2/pap_smear_monthly', dest: 'pap_smear_monthly' },
  { source: 'group_2/per_hpv_testing', dest: 'per_hpv_testing' },
  { source: 'group_2/HPV_testing_monthly', dest: 'HPV_testing_monthly' },
  { source: 'group_2/per_hpylori', dest: 'per_hpylori' },
  { source: 'group_2/hpylori_monthly', dest: 'hpylori_monthly' },
  { source: 'group_2/perform_via', dest: 'perform_via' },
  { source: 'group_2/via_monthly', dest: 'via_monthly' },
];

/**
 * group_3 Yes/No questions before the standard lab request multi.
 * Names drop the group_3/ prefix. 1 Yes / 0 No.
 */
const LAB_GROUP_3_REGISTER_FIELDS = [
  'lab_register',
  'lab_register_used',
  'lab_summary_register',
  'summary_reg_used',
  'consumption_register',
  'consumption_reg_used',
  'hts_register',
  'hts_reg_used',
  'referral_register',
  'request_form',
];

/**
 * select_multiple: group_3/standard_lab_request
 * Columns: standard_lab_request_<choice_slug> = Yes / No / '' (blank if skipped).
 */
const LAB_STANDARD_LAB_REQUEST_PREFIX = 'standard_lab_request';
const LAB_STANDARD_LAB_REQUEST_CHOICES = [
  { code: '1', slug: 'patient_name' },
  { code: '2', slug: 'patient_age_date_of_birth' },
  { code: '3', slug: 'patient_gender' },
  { code: '4', slug: 'patient_location_contact_information' },
  { code: '5', slug: 'name_or_unique_identifier_of_requesting_clinician' },
  { code: '6', slug: 'date_and_time_of_sample_collection' },
  { code: '7', slug: 'type_of_sample_collection_requested' },
  { code: '8', slug: 'clinical_background' },
  { code: '9', slug: 'urgency_classification' },
  { code: '10', slug: 'none' },
];

/** group_3 Yes/No questions after the standard lab request multi. */
const LAB_GROUP_3_FOLLOWUP_FIELDS = [
  'sample_accpt_rej_form',
  'temp_monitoring_form',
  'chart_filled_daily',
  'daily_rota',
  'rota_filled_daily',
  'qc_register',
  'quality_control_freq',
];

function labGroup3YesNoFields_() {
  return LAB_GROUP_3_REGISTER_FIELDS.concat(LAB_GROUP_3_FOLLOWUP_FIELDS);
}

/** group_4 integer counts; names drop the group_4/ prefix. */
const LAB_GROUP_4_COUNT_FIELDS = [
  'cert_lab_techs',
  'contract_lab_techs',
  'county_lab_tech_working',
  'contract_lab_techs_working',
];

/** group_4/personnel: 1 Present / 0 Not present. */
const LAB_PERSONNEL_MAP = {
  1: 'Present',
  0: 'Not present',
};

/** group_5 training fields; names drop the group_5/ prefix. */
const LAB_GROUP_5_TRAINING_FIELDS = [
  'training_blood_safety',
  'training_unit_biosafety',
  'training_pro_testing_HIV',
];

/** group_5 Yes/No questions. 1 Yes / 0 No. */
const LAB_GROUP_5_YES_NO_FIELDS = [
  'yearly_cpd',
  'eqa',
];

/** group_6/handwashing_protocol */
const LAB_HANDWASHING_PROTOCOL_MAP = {
  1: 'They have displayed, up to date protocols',
  2: 'They have written up to date protocols, not displayed',
  3: 'They do not have up to date displayed or written protocols',
};

/**
 * select_multiple: group_6/sop
 * Columns: sop_<choice_slug> = Yes / No / '' (blank if skipped).
 */
const LAB_SOP_PREFIX = 'sop';
const LAB_SOP_CHOICES = [
  { code: '1', slug: 'personal_protective_equipment_ppe_use' },
  { code: '2', slug: 'handling_biological_specimens' },
  { code: '3', slug: 'chemical_safety' },
  { code: '4', slug: 'spill_management' },
  { code: '5', slug: 'emergency_preparedness' },
  { code: '6', slug: 'sharps_safety' },
  { code: '7', slug: 'equipment_preventive_maintenance' },
  { code: '8', slug: 'equipment_calibration' },
  { code: '9', slug: 'internal_quality_control' },
  { code: '10', slug: 'document_control' },
  { code: '11', slug: 'error_reporting_and_corrective_actions' },
  { code: '12', slug: 'sample_reception_and_handling' },
  { code: '13', slug: 'turnaround_time_monitoring' },
  { code: '14', slug: 'inventory_management' },
  { code: '15', slug: 'logbook_use' },
  { code: '16', slug: 'none' },
];

/**
 * select_multiple: group_6/specimen_collection
 * Columns: specimen_collection_<choice_slug> = Yes / No / '' (blank if skipped).
 */
const LAB_SPECIMEN_COLLECTION_PREFIX = 'specimen_collection';
const LAB_SPECIMEN_COLLECTION_CHOICES = [
  { code: '1', slug: 'labelling' },
  { code: '2', slug: 'patient_safety' },
  { code: '3', slug: 'staff_safety' },
  { code: '4', slug: 'transportation_to_persons_responsible_for_primary_sample_collection' },
  { code: '5', slug: 'none' },
];

/** group_6 Yes/No questions after specimen collection. */
const LAB_GROUP_6_YES_NO_FIELDS = [
  'guide_ref_critical_values',
  'packaging_specimen',
  'sop_lab',
  'stock_inv_control_store',
  'stock_inv_control_reagents',
];

/**
 * select_multiple: group_6/confirm_sops
 * Columns: confirm_sops_<choice_slug> = Yes / No / '' (blank if skipped).
 */
const LAB_CONFIRM_SOPS_PREFIX = 'confirm_sops';
const LAB_CONFIRM_SOPS_CHOICES = [
  { code: '1', slug: 'abo_blood_group_and_rh_testing' },
  { code: '2', slug: 'hbsag_testing' },
  { code: '3', slug: 'vdrl_or_rpr_testing' },
  { code: '4', slug: 'general_microscopy_wet_mounts' },
  { code: '5', slug: 'full_haemogram_testing' },
  { code: '6', slug: 'urine_for_microscopy' },
  { code: '7', slug: 'urine_rapid_test_for_pregnancy' },
  { code: '8', slug: 'urine_dipstick_testing' },
  { code: '9', slug: 'hiv_rapid_testing' },
  { code: '10', slug: 'malaria_testing_giemsa_stain' },
  { code: '11', slug: 'tb_testing' },
  { code: '12', slug: 'blood_glucose_test' },
  { code: '13', slug: 'high_vaginal_swab' },
  { code: '14', slug: 'esr_testing' },
  { code: '15', slug: 'thyroid_function_tests' },
  { code: '16', slug: 'hormone_profile_testing' },
  { code: '17', slug: 'hga1c_testing' },
  { code: '18', slug: 'crp_testing' },
  { code: '19', slug: 'coombs_ab_testing' },
  { code: '20', slug: 'cross_match_testing' },
  { code: '21', slug: 'hcv_testing' },
  { code: '22', slug: 'urinalysis_for_culture_and_sensitivity' },
  { code: '23', slug: 'dbs_for_hiv_viral_load' },
  { code: '24', slug: 'liver_function_testing' },
  { code: '25', slug: 'urea_electrolytes_and_creatinine_testing' },
  { code: '26', slug: 'bilirubin_testing' },
  { code: '27', slug: 'uric_acid_level_testing' },
  { code: '28', slug: 'coagulation_profile_testing' },
  { code: '29', slug: 'blood_culture_and_sensitivity' },
  { code: '30', slug: 'hpv_testing' },
  { code: '31', slug: 'via_testing' },
];

/** group_7/soap_available — option 3 is "Present in no service areas". */
const LAB_SOAP_AVAILABLE_MAP = {
  1: 'Present in ALL service areas',
  2: 'Present in some service areas',
  3: 'Present in no service areas',
};

/** group_7 Yes/No questions. 1 Yes / 0 No. */
const LAB_GROUP_7_YES_NO_FIELDS = [
  'consistent_water',
  'connected_drainage_system',
  'separate_sinks',
  'segregation_wastes',
  'functional_toilet',
  'toilet_handwashing_area',
  'sharp_container',
  'sharp_container_full',
];

const LAB_GROUP_7_HEADERS = [
  'water_source',
  'consistent_water',
  'connected_drainage_system',
  'soap_available',
  'separate_sinks',
  'waste_management_protocol',
  'segregation_wastes',
  'functional_toilet',
  'toilet_handwashing_area',
  'sharp_container',
  'sharp_container_full',
];

/** group_8 Yes/No questions. 1 Yes / 0 No. Names drop the group_8/ prefix. */
const LAB_GROUP_8_YES_NO_FIELDS = [
  'waiting_area8',
  'working_tables8',
  'chairs_staff8',
  'safety_cabinents8',
  'storage_shelves8',
  'wash_basin8',
  'well_lit8',
  'well_ventilated',
  'wall_clock',
  'wall_thermometer',
  'designated_spaces',
  'special_area_samples',
  'lockable_doors8',
  'certification',
  'access_disabled',
  'evidence8',
];

/** group_9 Yes/No questions. 1 Yes / 0 No. */
const LAB_GROUP_9_YES_NO_FIELDS = [
  'list_referral',
  'evidence_cal_pipettes',
  'evidence_cal_centrifuge',
  'centrifuge_maintenance',
  'evidence_cal_balance',
  'evidence_cal_thermo',
  'maint_microscope_chart',
  'refrigerator_thermometer',
  'temp_monitor_chart',
  'maintenance_refrigerator',
  'cal_glucometer',
  'evid_colorimeter_haemoglobin',
  'maintenance_chart_colo_hae',
];

const LAB_PPE_EQUIPMENT_CHOICES = [
  { code: '1', slug: 'gloves' },
  { code: '2', slug: 'masks' },
  { code: '3', slug: 'lab_coats' },
  { code: '4', slug: 'eye_shields' },
  { code: '5', slug: 'none' },
];

const LAB_TB_DIAGNOSTIC_CHOICES = [
  { code: '1', slug: 'sputum_smear_microscopy' },
  { code: '2', slug: 'genexpert_mtb_rif_assay' },
  { code: '3', slug: 'none_available' },
];

const LAB_ZIEHL_STAIN_CHOICES = [
  { code: '1', slug: 'bright_field_microscope' },
  { code: '2', slug: 'carbol_fuchsin_primary_stain' },
  { code: '3', slug: 'acid_alcohol_decolorizer' },
  { code: '4', slug: 'methylene_blue_counterstain' },
  { code: '5', slug: 'slides_and_coverslips' },
  { code: '6', slug: 'bunsen_burner_or_spirit_lamp_for_heat_fixation' },
  { code: '7', slug: 'immersion_oil_for_bright_field_microscopy' },
  { code: '8', slug: 'sputum_containers' },
];

const LAB_AURAMINE_STAIN_CHOICES = [
  { code: '1', slug: 'fluorescence_microscope' },
  { code: '2', slug: 'auramine_o_primary_stain' },
  { code: '3', slug: 'potassium_permanganate_or_acridine_orange_counterstain' },
  { code: '4', slug: 'slides_and_coverslips' },
  { code: '5', slug: 'bunsen_burner_or_spirit_lamp_for_heat_fixation' },
  { code: '6', slug: 'sputum_containers' },
];

const LAB_GENEXPERT_CHOICES = [
  { code: '1', slug: 'genexpert_machine' },
  { code: '2', slug: 'cartridges' },
  { code: '3', slug: 'reliable_power_source' },
];

const LAB_LIVER_FUNCTION_EQUIPMENT_CHOICES = [
  { code: '1', slug: 'biochemistry_analyzer' },
  { code: '2', slug: 'specific_assay_kits_liver_function_test' },
  { code: '3', slug: 'specific_assay_kits_renal_function_test' },
  { code: '4', slug: 'none' },
];

const LAB_BC_ANALYZER_CHOICES = [
  { code: '1', slug: 'a_basic_3_part_or_5_part_hematology_analyzer' },
  { code: '2', slug: 'diluent_reagents' },
  { code: '3', slug: 'lyse_reagents' },
  { code: '4', slug: 'cleaning_solutions' },
  { code: '5', slug: 'control_samples_for_calibration_and_quality_control' },
];

const LAB_BC_TOOLS_CHOICES = [
  { code: '1', slug: 'light_microscope_with_100x_magnification_for_differential_wbc_count' },
  { code: '2', slug: 'hemocytometer' },
  { code: '3', slug: 'cuvettes_or_tubes' },
  { code: '4', slug: 'microhematocrit_centrifuge' },
  { code: '5', slug: 'capillary_tubes' },
  { code: '6', slug: 'leishman_stain_or_wright_giemsa_stain' },
  { code: '7', slug: 'drabkins_solution' },
  { code: '8', slug: 'edta_tubes_or_heparin' },
  { code: '9', slug: 'saline_solution' },
];

const LAB_HIV_TESTING_EQUIPMENT_CHOICES = [
  { code: '1', slug: 'cd4_count_testing_option' },
  { code: '2', slug: 'flow_cytometry_and_fluorescent_antibodies_for_cd4_identification' },
  { code: '3', slug: 'equipment_not_available' },
];

const LAB_BLOOD_TYPE_CROSSMATCH_EQUI_CHOICES = [
  { code: '1', slug: '37c_incubator' },
  { code: '2', slug: 'water_bath_at_37c' },
  { code: '3', slug: 'grouping_sera' },
  { code: '4', slug: 'none' },
];

function labGroup9SelectMultiples_() {
  return [
    { source: 'group_9/PPE_equipment', prefix: 'PPE_equipment', choices: LAB_PPE_EQUIPMENT_CHOICES },
    { source: 'group_9/tb_diagnostic', prefix: 'tb_diagnostic', choices: LAB_TB_DIAGNOSTIC_CHOICES },
    { source: 'group_9/ziehl_stain', prefix: 'ziehl_stain', choices: LAB_ZIEHL_STAIN_CHOICES },
    { source: 'group_9/auramine_stain', prefix: 'auramine_stain', choices: LAB_AURAMINE_STAIN_CHOICES },
    { source: 'group_9/genexpert', prefix: 'genexpert', choices: LAB_GENEXPERT_CHOICES },
    { source: 'group_9/liver_function_equipment', prefix: 'liver_function_equipment', choices: LAB_LIVER_FUNCTION_EQUIPMENT_CHOICES },
    { source: 'group_9/bc_analyzer', prefix: 'bc_analyzer', choices: LAB_BC_ANALYZER_CHOICES },
    { source: 'group_9/bc_tools', prefix: 'bc_tools', choices: LAB_BC_TOOLS_CHOICES },
    { source: 'group_9/hiv_testing_equipment', prefix: 'hiv_testing_equipment', choices: LAB_HIV_TESTING_EQUIPMENT_CHOICES },
    { source: 'group_9/blood_type_crossmatch_equi', prefix: 'blood_type_crossmatch_equi', choices: LAB_BLOOD_TYPE_CROSSMATCH_EQUI_CHOICES },
  ];
}

/** group_9 select_one: 1 Yes, functional / 2 Yes, non-functional / 3 No. */
const LAB_GROUP_9_EQUIP_FUNCTIONAL_FIELDS = [
  'available_pipettes',
  'available_centrifuge',
  'available_balance',
  'available_thermometer',
  'avail_light_microscope',
  'working_refrigerator',
  'avail_glucometer',
  'colorimeter_haemoglobin',
  'fridge_blood_products',
  'vortex_mixer',
];

const LAB_AVAILABLE_NOT_AVAILABLE_MAP = {
  1: 'Available',
  0: 'Not available',
};

const LAB_SPUTUM_SMEAR_MAP = {
  1: 'Ziehl-Neelsen Staining',
  2: 'Auramine-O Staining',
};

const LAB_BLOOD_COUNT_MAP = {
  1: 'Automated hematology analyzer',
  2: 'Manual Method',
  3: 'Full blood count not available in this unit',
};

/**
 * group_10 select_one supplies. 1 Always available / 2 Sometimes available /
 * 3 Never available. Names drop the group_10/ prefix.
 */
const LAB_ALWAYS_SOMETIMES_NEVER_AVAILABLE_MAP = {
  1: 'Always available',
  2: 'Sometimes available',
  3: 'Never available',
};

const LAB_GROUP_10_FIELDS = [
  'portable_cool_boxes',
  'stool_polypot',
  'urine_container',
  'pipettes',
  'scalp_vein_set',
  'pdt_test_blood',
  'urine_strips',
  'rota_adeno_virus',
  'sat_antigen_test',
  'h_pylori_antibody',
  'h_pylori_antigen',
  'malaria_antigen',
  'vdrl_test_kit',
  'hbsag_test_kit',
  'plain_vacutainers',
  'red_top_microcontainers',
  'edta_vacutainer',
  'edta_microtainers',
  'glass_slides',
  'alcohol_swabs',
  'auto_tips',
  'dri_biochem_test',
  'vaginal_swab',
  'yellow_blue_tips',
  'latex_gloves',
  'glucometer_test_strips',
  'wright_parasite_stain',
  'urine_ketone_bodies',
  'filter_paper',
  'cover_for_microscopy',
  'malaria_diag_kit',
  'syphillis_diag_kit',
  'hiv_test_kit',
  'urine_test_kit10',
  'serum_electrolyete',
  'gram_stains_available',
  'cryptococcal_antigen',
  'anti_a',
  'anti_d',
  'anti_b',
  'anti_ab',
  'agh_confirmation',
  'creatinine',
  'bun',
  'electrolytes',
  'reference_fluid',
  'total_bilirubin',
  'direct_bilirubin',
  'got',
  'gpt',
  'ggt',
  'alp',
  'total_protein',
  'albumin',
  'calcium',
  'inorganic_phosporous',
  'crp',
  'culture_bacteriology',
  'bacterioscopy',
  'blood_culture10',
  'blood_glucose',
  'rh_factor_tests',
  'coagulation_test10',
  'haemoglobin_det',
  'hep_B_testing',
  'random_blood_sugar',
  'syphilis_tests',
  'urinalysis',
  'peripheral_blood_film',
  'bacillus_aafb',
  'grouping_crossmatch_bottles',
  'packed_red_blood_cells',
  'ffp_all_types',
  'platlets_all_types',
  'whole_all_types',
  'type_o',
];

function labGroup2Map_(dest) {
  if (/monthly|_mon$/i.test(dest)) return YES_NO_MAP;
  return ALWAYS_SOMETIMES_NEVER_MAP;
}

const LAB_SOURCE_KEYS = (function () {
  const keys = {
    starttime: true,
    start: true,
    endtime: true,
    end: true,
    'group_1/county': true,
    'group_1/facility': true,
    'group_1/gazetted': true,
    'group_1/contact': true,
    'group_1/nam_contact': true,
    'group_1/phone_contact': true,
    'group_1/units': true,
  };
  LAB_GROUP_2_FIELDS.forEach(function (field) {
    keys[field.source] = true;
  });
  labGroup3YesNoFields_().forEach(function (dest) {
    keys['group_3/' + dest] = true;
  });
  keys['group_3/standard_lab_request'] = true;
  LAB_GROUP_4_COUNT_FIELDS.forEach(function (dest) {
    keys['group_4/' + dest] = true;
  });
  keys['group_4/personnel'] = true;
  keys['group_4/inadequate_staff'] = true;
  LAB_GROUP_5_TRAINING_FIELDS.forEach(function (dest) {
    keys['group_5/' + dest] = true;
  });
  LAB_GROUP_5_YES_NO_FIELDS.forEach(function (dest) {
    keys['group_5/' + dest] = true;
  });
  keys['group_6/handwashing_protocol'] = true;
  keys['group_6/have_quality_manual'] = true;
  keys['group_6/sop'] = true;
  keys['group_6/specimen_collection'] = true;
  LAB_GROUP_6_YES_NO_FIELDS.forEach(function (dest) {
    keys['group_6/' + dest] = true;
  });
  keys['group_6/confirm_sops'] = true;
  keys['group_7/water_source'] = true;
  keys['group_7/soap_available'] = true;
  keys['group_7/waste_management_protocol'] = true;
  LAB_GROUP_7_YES_NO_FIELDS.forEach(function (dest) {
    keys['group_7/' + dest] = true;
  });
  LAB_GROUP_8_YES_NO_FIELDS.forEach(function (dest) {
    keys['group_8/' + dest] = true;
  });
  LAB_GROUP_9_YES_NO_FIELDS.forEach(function (dest) {
    keys['group_9/' + dest] = true;
  });
  labGroup9SelectMultiples_().forEach(function (field) {
    keys[field.source] = true;
  });
  LAB_GROUP_9_EQUIP_FUNCTIONAL_FIELDS.forEach(function (dest) {
    keys['group_9/' + dest] = true;
  });
  keys['group_9/maint_contract_colo_hae'] = true;
  keys['group_9/sputum_smear'] = true;
  keys['group_9/blood_count'] = true;
  LAB_GROUP_10_FIELDS.forEach(function (dest) {
    keys['group_10/' + dest] = true;
  });
  return keys;
})();

function transformLabRecord_(rec) {
  const out = {};
  out[UUID_FIELD] =
    rec[UUID_FIELD] == null ? '' : rec[UUID_FIELD];

  /*
   * Preserve all fields except raw start/end fields and consumed
   * group_1 through group_10 codes. `_submission_time` is also retained as a
   * raw column.
   */
  assignPassthrough_(
    out,
    rec,
    LAB_SOURCE_KEYS
  );

  out.date_started = formatDateMinute_(
    firstValue_(rec, ['starttime', 'start'])
  );

  out.date_ended = formatDateMinute_(
    firstValue_(rec, ['endtime', 'end'])
  );

  out.date_submitted = formatDateMinute_(
    rec['_submission_time']
  );

  out.county = lookupCoded_(
    rec['group_1/county'],
    COUNTY_MAP
  );

  const facilityMap = isOnOrAfterCutoff_(out.date_submitted, FACILITY_MAP_CUTOFF)
    ? FACILITY_MAP_FROM_2026
    : FACILITY_MAP_BEFORE_2026;
  out.facility = lookupCoded_(
    rec['group_1/facility'],
    facilityMap
  );

  out.facility_level = lookupCoded_(
    rec['group_1/gazetted'],
    FACILITY_LEVEL_MAP
  );

  out.contact = lookupCoded_(
    rec['group_1/contact'],
    CONTACT_PERSON_MAP
  );
  assignContactNamePhone_(out, rec);

  out.units = lookupCoded_(
    rec['group_1/units'],
    LAB_UNITS_MAP
  );

  LAB_GROUP_2_FIELDS.forEach(function (field) {
    out[field.dest] = lookupCoded_(
      rec[field.source],
      labGroup2Map_(field.dest)
    );
  });

  labGroup3YesNoFields_().forEach(function (dest) {
    out[dest] = lookupCoded_(
      rec['group_3/' + dest],
      YES_NO_MAP
    );
  });

  expandSelectMultiple_(
    out,
    rec['group_3/standard_lab_request'],
    LAB_STANDARD_LAB_REQUEST_PREFIX,
    LAB_STANDARD_LAB_REQUEST_CHOICES
  );

  LAB_GROUP_4_COUNT_FIELDS.forEach(function (dest) {
    out[dest] = toIntegerOrBlank_(rec['group_4/' + dest]);
  });

  out.personnel = lookupCoded_(
    rec['group_4/personnel'],
    LAB_PERSONNEL_MAP
  );

  out.inadequate_staff = lookupCoded_(
    rec['group_4/inadequate_staff'],
    YES_NO_MAP
  );

  LAB_GROUP_5_TRAINING_FIELDS.forEach(function (dest) {
    out[dest] = toIntegerOrBlank_(rec['group_5/' + dest]);
  });

  LAB_GROUP_5_YES_NO_FIELDS.forEach(function (dest) {
    out[dest] = lookupCoded_(
      rec['group_5/' + dest],
      YES_NO_MAP
    );
  });

  out.handwashing_protocol = lookupCoded_(
    rec['group_6/handwashing_protocol'],
    LAB_HANDWASHING_PROTOCOL_MAP
  );

  out.have_quality_manual = lookupCoded_(
    rec['group_6/have_quality_manual'],
    YES_NO_MAP
  );

  expandSelectMultiple_(
    out,
    rec['group_6/sop'],
    LAB_SOP_PREFIX,
    LAB_SOP_CHOICES
  );

  expandSelectMultiple_(
    out,
    rec['group_6/specimen_collection'],
    LAB_SPECIMEN_COLLECTION_PREFIX,
    LAB_SPECIMEN_COLLECTION_CHOICES
  );

  LAB_GROUP_6_YES_NO_FIELDS.forEach(function (dest) {
    out[dest] = lookupCoded_(
      rec['group_6/' + dest],
      YES_NO_MAP
    );
  });

  expandSelectMultiple_(
    out,
    rec['group_6/confirm_sops'],
    LAB_CONFIRM_SOPS_PREFIX,
    LAB_CONFIRM_SOPS_CHOICES
  );

  out.water_source = lookupCoded_(
    rec['group_7/water_source'],
    WATER_SOURCE_MAP
  );

  out.consistent_water = lookupCoded_(
    rec['group_7/consistent_water'],
    YES_NO_MAP
  );

  out.connected_drainage_system = lookupCoded_(
    rec['group_7/connected_drainage_system'],
    YES_NO_MAP
  );

  out.soap_available = lookupCoded_(
    rec['group_7/soap_available'],
    LAB_SOAP_AVAILABLE_MAP
  );

  out.separate_sinks = lookupCoded_(
    rec['group_7/separate_sinks'],
    YES_NO_MAP
  );

  out.waste_management_protocol = lookupCoded_(
    rec['group_7/waste_management_protocol'],
    WASTE_MANAGEMENT_MAP
  );

  out.segregation_wastes = lookupCoded_(
    rec['group_7/segregation_wastes'],
    YES_NO_MAP
  );

  out.functional_toilet = lookupCoded_(
    rec['group_7/functional_toilet'],
    YES_NO_MAP
  );

  out.toilet_handwashing_area = lookupCoded_(
    rec['group_7/toilet_handwashing_area'],
    YES_NO_MAP
  );

  out.sharp_container = lookupCoded_(
    rec['group_7/sharp_container'],
    YES_NO_MAP
  );

  out.sharp_container_full = lookupCoded_(
    rec['group_7/sharp_container_full'],
    YES_NO_MAP
  );

  LAB_GROUP_8_YES_NO_FIELDS.forEach(function (dest) {
    out[dest] = lookupCoded_(
      rec['group_8/' + dest],
      YES_NO_MAP
    );
  });

  LAB_GROUP_9_YES_NO_FIELDS.forEach(function (dest) {
    out[dest] = lookupCoded_(
      rec['group_9/' + dest],
      YES_NO_MAP
    );
  });

  labGroup9SelectMultiples_().forEach(function (field) {
    expandSelectMultiple_(
      out,
      rec[field.source],
      field.prefix,
      field.choices
    );
  });

  LAB_GROUP_9_EQUIP_FUNCTIONAL_FIELDS.forEach(function (dest) {
    out[dest] = lookupCoded_(
      rec['group_9/' + dest],
      EQUIP_FUNCTIONAL_MAP
    );
  });

  out.maint_contract_colo_hae = lookupCoded_(
    rec['group_9/maint_contract_colo_hae'],
    LAB_AVAILABLE_NOT_AVAILABLE_MAP
  );

  out.sputum_smear = lookupCoded_(
    rec['group_9/sputum_smear'],
    LAB_SPUTUM_SMEAR_MAP
  );

  out.blood_count = lookupCoded_(
    rec['group_9/blood_count'],
    LAB_BLOOD_COUNT_MAP
  );

  LAB_GROUP_10_FIELDS.forEach(function (dest) {
    out[dest] = lookupCoded_(
      rec['group_10/' + dest],
      LAB_ALWAYS_SOMETIMES_NEVER_AVAILABLE_MAP
    );
  });

  return out;
}

function labPreferredHeaders_() {
  return [
    UUID_FIELD,
    'date_started',
    'date_ended',
    'date_submitted',
    'county',
    'facility',
    'facility_level',
    'contact',
    'contact_name',
    'phone_number',
    'units',
  ].concat(LAB_GROUP_2_FIELDS.map(function (field) {
    return field.dest;
  })).concat(LAB_GROUP_3_REGISTER_FIELDS)
    .concat(selectMultipleHeaders_(
      LAB_STANDARD_LAB_REQUEST_PREFIX,
      LAB_STANDARD_LAB_REQUEST_CHOICES
    ))
    .concat(LAB_GROUP_3_FOLLOWUP_FIELDS)
    .concat(LAB_GROUP_4_COUNT_FIELDS)
    .concat(['personnel', 'inadequate_staff'])
    .concat(LAB_GROUP_5_TRAINING_FIELDS)
    .concat(LAB_GROUP_5_YES_NO_FIELDS)
    .concat(['handwashing_protocol', 'have_quality_manual'])
    .concat(selectMultipleHeaders_(LAB_SOP_PREFIX, LAB_SOP_CHOICES))
    .concat(selectMultipleHeaders_(
      LAB_SPECIMEN_COLLECTION_PREFIX,
      LAB_SPECIMEN_COLLECTION_CHOICES
    ))
    .concat(LAB_GROUP_6_YES_NO_FIELDS)
    .concat(selectMultipleHeaders_(
      LAB_CONFIRM_SOPS_PREFIX,
      LAB_CONFIRM_SOPS_CHOICES
    ))
    .concat(LAB_GROUP_7_HEADERS)
    .concat(LAB_GROUP_8_YES_NO_FIELDS)
    .concat(LAB_GROUP_9_YES_NO_FIELDS)
    .concat(labGroup9SelectMultiples_().reduce(function (headers, field) {
      return headers.concat(selectMultipleHeaders_(field.prefix, field.choices));
    }, []))
    .concat(LAB_GROUP_9_EQUIP_FUNCTIONAL_FIELDS)
    .concat(['maint_contract_colo_hae', 'sputum_smear', 'blood_count'])
    .concat(LAB_GROUP_10_FIELDS);
}
