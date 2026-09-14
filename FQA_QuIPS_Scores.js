/**
 * FQA Scores sheet.
 *
 * Long-format totalling table: one row per facility / department /
 * scored attribute, using scores from the FQA Weighting sheet.
 * Missing facility_code and subcounty are filled from the facility
 * master spreadsheet when county, level (facility_level), and a fuzzy
 * facility-name match all agree. The master code column is dhis_code.
 * thematic_area is filled as groupings are provided. Newborn Unit
 * commodity columns are Commodities, equipment columns are Equipment,
 * adherence columns are Adherence to evidence based practice, and
 * records columns are Health Records for clients, and hours of
 * operation columns are Hours of operation, and infrastructure
 * columns are Infrastructure, privacy columns are
 * Privacy/confidentiality, SOP columns are Standard operating
 * procedures/Protocols, WASH/IPC columns are WASH (Water,
 * Sanitation, Hygeine)/IPC, service columns are Services offered,
 * and HRH columns are HRH. Central Store records, commodities,
 * hours, equipment, infrastructure, SOP, and WASH/IPC columns use
 * those same thematic_area labels. Inpatient Maternity and Lab
 * groupings use the same thematic_area labels. Operating Theatre
 * dests also set hss_building_block and attribute_name. Facility
 * General dests also set those columns. Remaining
 * hss_building_block and attribute_name values stay blank until
 * those labels are provided.
 *
 * Run writeFqaScoreTable after the department tabs exist. It reads
 * scores from the FQA Weighting sheet when that sheet is present.
 * pullAllForms / fullRefreshAllForms refresh this table only.
 */

const FQA_SCORE_SHEET_NAME = 'FQA Scores';
const FQA_SCORE_HEADERS = [
  'county',
  'subcounty',
  'facility',
  'facility_code',
  'facility_level',
  'department',
  'thematic_area',
  'hss_building_block',
  'attribute',
  'attribute_name',
  'score',
];

const FQA_FACILITY_REFERENCE_SPREADSHEET_ID =
  '1EEZJU-DNERkydsMIDtCu-19hzopurtAR7cN5cZ6bvFI';
const FQA_FACILITY_REFERENCE_SHEET_GID = 0;
const FQA_FACILITY_MATCH_MIN = 0.86;
const FQA_FACILITY_CANONICAL_TOKENS = [
  'hospital',
  'referral',
  'teaching',
  'county',
  'subcounty',
  'health',
  'centre',
  'center',
  'dispensary',
  'clinic',
  'medical',
  'mission',
  'district',
  'maternity',
];

/**
 * Attribute → thematic area, by department sheet name.
 * Newborn Unit commodity columns are Commodities, equipment columns
 * are Equipment, and adherence columns are Adherence to evidence
 * based practice, records columns are Health Records for clients,
 * hours of operation columns are Hours of operation,
 * infrastructure columns are Infrastructure, privacy columns are
 * Privacy/confidentiality, SOP columns are Standard operating
 * procedures/Protocols, WASH/IPC columns are WASH (Water,
 * Sanitation, Hygeine)/IPC, service columns are Services offered,
 * and HRH columns are HRH. Central Store records, commodities,
 * hours, equipment, infrastructure, SOP, and WASH/IPC columns use
 * those same thematic_area labels. Inpatient Maternity, Lab, and
 * Operating Theatre dests use the same thematic_area labels.
 * Facility General adherence dests use Adherence to evidence
 * based practice. Facility General commodity dests use
 * Commodities. Facility General records dests use Health
 * Records for clients. Facility General hours dests use Hours
 * of operation. Facility General HRH dests use HRH. Facility
 * General infrastructure dests use Infrastructure. Facility
 * General national-data dests use National data collection.
 * Facility General service dests use Services offered.
 * Facility General WASH dests use WASH (Water, Sanitation,
 * Hygeine)/IPC. Other departments stay empty until their
 * groupings are defined.
 */
const FQA_THEMATIC_AREA_MAP = {
  'Newborn Unit': {},
  'Inpatient Maternity': {},
  'Outpatient': {},
  'Lab': {},
  'Operating Theatre': {},
  'Pharmacy': {},
  'Central Store': {},
  'Facility General': {},
};

/**
 * Attribute → HSS building block, by department sheet name.
 * Operating Theatre adherence dests are Leadership & Governance.
 * Operating Theatre commodity dests are Commodities. Operating
 * Theatre equipment dests are Equipment. Operating Theatre
 * records dests are Health Information System. Operating Theatre
 * hours dests are Service Delivery. Operating Theatre HRH dests
 * are Human Resource for Health. Operating Theatre
 * infrastructure dests are Infrastructure. Operating Theatre
 * privacy dests are Service Delivery. Operating Theatre
 * service dests are Service Delivery. Operating Theatre SOP
 * dests are Leadership & Governance. Operating Theatre
 * training dests are Human Resource for Health. Operating
 * Theatre WASH dests are Service Delivery. Facility General
 * adherence dests are Leadership & Governance. Facility
 * General commodity dests are Commodities. Facility General
 * records dests are Health Information System. Facility
 * General hours dests are Service Delivery. Facility General
 * HRH dests are Human Resource for Health. Facility General
 * infrastructure dests are Infrastructure. Facility General
 * national-data dests are Health Information System. Facility
 * General service dests are Service Delivery. Facility
 * General WASH dests are Service Delivery.
 */
const FQA_HSS_BUILDING_BLOCK_MAP = {
  'Newborn Unit': {},
  'Inpatient Maternity': {},
  'Outpatient': {},
  'Lab': {},
  'Operating Theatre': {},
  'Pharmacy': {},
  'Central Store': {},
  'Facility General': {},
};

/**
 * Attribute → display name, by department sheet name.
 * Operating Theatre dests and Facility General dests use the
 * provided labels.
 */
const FQA_ATTRIBUTE_NAME_MAP = {
  'Newborn Unit': {},
  'Inpatient Maternity': {},
  'Outpatient': {},
  'Lab': {},
  'Operating Theatre': {},
  'Pharmacy': {},
  'Central Store': {},
  'Facility General': {},
};

function lookupMappedLabel_(map, department, attribute) {
  const byDept = map[department];
  if (!byDept) return '';
  const value = byDept[attribute];
  return value == null || value === '' ? '' : value;
}

function selectMultipleAttributeNames_(prefix, choices) {
  return (choices || []).map(function (choice) {
    return prefix + '_' + choice.slug;
  });
}

function assignMappedLabels_(map, department, attributes, value) {
  if (!map[department]) map[department] = {};
  (attributes || []).forEach(function (attribute) {
    if (attribute) map[department][attribute] = value;
  });
}

function assignMappedLabelEntries_(map, department, entries) {
  if (!map[department]) map[department] = {};
  Object.keys(entries || {}).forEach(function (attribute) {
    if (attribute && entries[attribute] !== '' && entries[attribute] != null) {
      map[department][attribute] = entries[attribute];
    }
  });
}

// cups → feeding_cups, inf_form → infant_formula, syringes → syringe_sizes,
// needles → needles_sizes. catheters/1-4, tubes/1-4, suction/1-4, and
// materials/1-6 are the select_multiple indicators.
assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Newborn Unit', [
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
].concat(
  selectMultipleAttributeNames_('commodities_catheters', SIZE_4_6_8_CHOICES),
  selectMultipleAttributeNames_('commodities_materials', MATERIALS_CHOICES),
  selectMultipleAttributeNames_('commodities_suction', SIZE_4_6_8_CHOICES),
  selectMultipleAttributeNames_('commodities_tubes', SIZE_4_6_8_CHOICES)
), 'Commodities');

// beds → baby_beds, resuscitaires → resuscitaires_nbu, lamp → phototherapy_lamp,
// warmer → radiant_warmer, heat → heat_source, clock → wall_clock,
// thermometer → wall_thermometer, exam_light → exam_light_available,
// cpap → equipment_cpap, neobp → neonatal_bp, oximeters → oximeters_neonates,
// trans_kit → transfusion_kit, stethoscopes → stethoscopes_nbu,
// glucometer → glucometer_nbu, pump → sunction_pump, bulbs → sunction_bulbs,
// therm → thermometer_nbu, low_therm → thermometer_readings, scale → weighing_scale.
// resus_equip/1-6, oxy_source/1-6, and cannulae/1-3 are select_multiple indicators.
assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Newborn Unit', [
  'baby_beds',
  'resuscitaires_nbu',
  'bed_space',
  'phototherapy_lamp',
  'radiant_warmer',
  'heat_source',
  'wall_clock',
  'wall_thermometer',
  'exam_light_available',
  'equipment_cpap',
  'monitors',
  'neonatal_bp',
  'oximeters_neonates',
  'transfusion_kit',
  'drip_stands',
  'stethoscopes_nbu',
  'glucometer_nbu',
  'sunction_pump',
  'sunction_bulbs',
  'thermometer_nbu',
  'thermometer_readings',
  'weighing_scale',
].concat(
  selectMultipleAttributeNames_('equip_resus_equip', RESUS_EQUIP_CHOICES),
  selectMultipleAttributeNames_('equip_oxy_source', OXY_SOURCE_CHOICES),
  selectMultipleAttributeNames_('equip_cannulae', CANNULAE_CHOICES)
), 'Equipment');

// kmc2 → kmc_initiated, preterm → preterm_lowbirth, feeding → feeding_freq,
// express → express_milk, plan → monitoring_plan, neonates → neonate_review,
// disch_note → discharge_note, inf_refer → infact_referral,
// system → system_near_nbu, weight → weight_gain, condition → condition_stable,
// gestation → gestation_34wks, paediatric → paediatric_rco, care → specialized_care.
assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Newborn Unit', [
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
  'system_near_nbu',
  'caregiver',
  'weight_gain',
  'birth_weight',
  'condition_stable',
  'gestation_34wks',
  'paediatric_rco',
  'specialized_care',
], 'Adherence to evidence based practice');

// death_reg → death_register, consistent_use → deathreg_consistent_use,
// integrated_rh_mch → summary_register, inpatient_neonatal_reg → neonatal_register,
// nb_admission → newborn_admission. patient_files/1-13 are the
// select_multiple indicators (the form has 13 choices, not 14).
assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Newborn Unit', [
  'death_register',
  'deathreg_consistent_use',
  'summary_register',
  'neonatal_register',
  'newborn_admission',
  'perinatal_notification',
  'perinatal_review',
].concat(
  selectMultipleAttributeNames_('patient_files', PATIENT_FILES_CHOICES)
), 'Health Records for clients');

// lab_open → nbu_open
assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Newborn Unit',
  ['nbu_open'],
  'Hours of operation'
);

// maintenance → maintenance_infrastructure, lighting → well_lit,
// proc_rooms → procedure_rooms, chang_area → changing_area,
// fire → fire_extinguishers, signs → clear_signage, charter → clear_charter,
// cots → cots_incubator, priv_room → private_room, couns_room → counselling_room,
// desk → nurse_desk, neo_space → space_sick_neonates, iso_room → isolation_room,
// resus_area → resuscitation_area, sluice → sluice_room,
// temp_store → temporary_storage, dust → dust_evidence.
assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Newborn Unit', [
  'maintenance_infrastructure',
  'well_lit',
  'ventilation',
  'procedure_rooms',
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
], 'Infrastructure');

assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Newborn Unit', [
  'visual_privacy',
  'auditory_privacy',
], 'Privacy/confidentiality');

// sepsis → sepsis_sop, jaundice → jaundice_sop, neo_resus →
// neonatal_resuscitation_sop, kmc → kmc_sop, handwash → handwash_sop,
// referral → referral_sop. policy/1-19 are the select_multiple
// indicators (19 choices including none).
assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Newborn Unit', [
  'sepsis_sop',
  'jaundice_sop',
  'hypoglycemia_sop',
  'neonatal_resuscitation_sop',
  'kmc_sop',
  'handwash_sop',
  'referral_sop',
].concat(
  selectMultipleAttributeNames_('sop_policy', SOP_POLICY_CHOICES)
), 'Standard operating procedures/Protocols');

// wat_sour → water_source, wav_avail → water_available_consistently,
// drainage → drainage_system, sinks → separate_sink, hand → hand_hygiene,
// waste → waste_management, bins → waste_segregation,
// clean_reg → cleaning_register, decontamination → decontamination_area,
// checklist → decontamination_checklist, utensil → utensil_cleaning_area,
// sharp → sharp_container, lat_client → latrine_clients,
// station → handwashing_station, disinfect → disinfect_washrooms,
// clean → clean_washroom, access → access_disability,
// menstrual → menstrual_hygiene.
assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Newborn Unit', [
  'water_source',
  'water_available_consistently',
  'drainage_system',
  'separate_sink',
  'hand_hygiene',
  'waste_management',
  'waste_segregation',
  'cleaning_register',
  'decontamination_area',
  'decontamination_checklist',
  'utensil_cleaning_area',
  'laundry',
  'linen',
  'sharp_container',
  'sharp_full',
  'latrine',
  'latrine_clients',
  'handwashing_station',
  'disinfect_washrooms',
  'clean_washroom',
  'access_disability',
  'menstrual_hygiene',
], 'WASH (Water, Sanitation, Hygeine)/IPC');

// Premature NB care → premature_care, Stable-infant referral wt →
// referral_weight, Stable-baby nursing → nursing_care,
// Congenital malf. care → congenital_care, Asphyxia/meconium care →
// asphyxia_care, TBC/FHG capability → blood_count, Urinalysis → urine
// and urinalysis, Coombs test → coombs_testing, Blood group/X-match →
// blood_group, TFT → thyroid_test, U&E/Creatinine → electrolyte and
// creatinine, LFT → liver_function, Glucose (glucometer) →
// glucose_tests, Bilirubin test → bilirubin_testing, HIV EID →
// hiv_test, Imaging turnaround → imaging_time.
assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Newborn Unit', [
  'premature_care',
  'referral_weight',
  'nutritional_services',
  'nursing_care',
  'congenital_care',
  'asphyxia_care',
  'blood_count',
  'malaria_test',
  'urine',
  'blood_cultures',
  'lumbar_puncture',
  'coombs_testing',
  'bone_chemistry',
  'blood_group',
  'urinalysis',
  'crp_test',
  'thyroid_test',
  'electrolyte',
  'creatinine',
  'liver_function',
  'glucose_tests',
  'bilirubin_testing',
  'hiv_test',
  'cranial_ultrasound',
  'x_ray',
  'imaging_time',
], 'Services offered');

// employed_paed → employed_paediatrician, contract_paed →
// contracted_paediatrician, available_24hrs → neo_ped_24hrs,
// employed_mos → employed_mo, contract_mos → contract_mo,
// adeq_mos → adequate_mo, employed_rn → employed_nurses,
// contract_rn → contract_nurses, adeq_rn → adequate_reg_nurses,
// employed_cos → employed_co, contract_cos → contract_co,
// adeq_cos → adequate_co. paed_score, neonatologists_score,
// nurses_rn_score, and cos_score are not transformed dests.
assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Newborn Unit', [
  'employed_neonatologists',
  'contract_neonatologists',
  'employed_paediatrician',
  'contracted_paediatrician',
  'neo_ped_24hrs',
  'employed_mo',
  'contract_mo',
  'adequate_mo',
  'employed_nurses',
  'contract_nurses',
  'adequate_reg_nurses',
  'employed_co',
  'contract_co',
  'adequate_co',
], 'HRH');

assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Central Store', [
  'designated_space',
].concat(CENTRAL_STORE_HEALTH_YES_NO_FIELDS), 'Health Records for clients');

// needle_stock_001 → needle23_stock. Penguine_stock keeps the Kobo
// spelling. sry2 is the 2ml syringe availability dest.
assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Central Store',
  CENTRAL_STORE_COMMODITY_AVAIL_FIELDS.concat(
    CENTRAL_STORE_COMMODITY_YES_NO_FIELDS
  ),
  'Commodities'
);

assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Central Store',
  ['hours'],
  'Hours of operation'
);

assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Central Store',
  ['computer'],
  'Equipment'
);

assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Central Store', [
  'structures',
  'cabinets',
  'thermometer',
  'room',
  'dust',
], 'Infrastructure');

assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Central Store', [
  'odering_personnel',
  'stock_orders',
  'supplies',
  'fefo',
], 'Standard operating procedures/Protocols');

assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Central Store',
  ['hygiene'],
  'WASH (Water, Sanitation, Hygeine)/IPC'
);

// ultrasound_maintenance → ultrasound_adherence, calibration →
// equipment_calibration, consent_del → informed_consent,
// data_review_meeting → staff_meeting, arrival → arrival_assessment,
// guide → labour_care_guide, companion_labour → companion_support,
// delivery_reg → delivery_practices, counselling → counselling_offered,
// svd → svd_support, roaming → roaming_staff, support → labour_support,
// pnc_48 → pnc_adherence, passage → passage_of_urine, system →
// emergency_system. triage/1-10, charts/1-13, encourage/1-7, and
// discharge/1-12 are the select_multiple indicators. sc_stay is not
// a transformed dest.
assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Inpatient Maternity', [
  'ultrasound_adherence',
  'equipment_calibration',
  'documentation_adherence',
  'informed_consent',
  'staff_meeting',
  'arrival_assessment',
  'labour_care_guide',
  'pain_drugs',
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
  'examination_adherence',
  'clinical_review',
  'latching_support',
  'passage_of_urine',
  'register_complete',
  'maternal_observation',
  'feeding_adherence',
  'emergency_system',
].concat(
  selectMultipleAttributeNames_('triage_assessment', MATERNITY_TRIAGE_ASSESSMENT_CHOICES),
  selectMultipleAttributeNames_('labour_charts', MATERNITY_CHARTS_CHOICES),
  selectMultipleAttributeNames_('labour_counselling', MATERNITY_LABOUR_COUNSELLING_CHOICES),
  selectMultipleAttributeNames_('discharge_counselling', MATERNITY_DISCHARGE_COUNSELLING_CHOICES)
), 'Adherence to evidence based practice');

// latex → latex_gloves, sterile → sterile_gloves, iv → iv_cannulae,
// bcg → bcg_availability, hepb → hepb_availability, protein →
// protein_strips, glucose_dip → glucose_strips, ketone → ketone_strips,
// glucometer_strip → glucometer_strips, hiv → hiv_test_kits,
// syphilis → syphilis_test_kits. nasg and calibrated_drapes are not
// transformed dests.
assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Inpatient Maternity', [
  'tetracycline',
  'chlorhexidine',
  'vit_k',
  'bcg_availability',
  'hepb_availability',
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
  'malaria_rdt',
  'syphilis_test_kits',
  'hiv_test_kits',
  'protein_strips',
  'glucose_strips',
  'ketone_strips',
  'glucometer_strips',
], 'Commodities');

// obstetric → obstetric_kit, preclampsia → preeclampsia_kit,
// pharyngeal → pharyngeal_airway, ultrasound_machine →
// ultrasound_in_unit, vacuum → vacuum_extractor, beds_del →
// delivery_beds, catheters → catheter_quantity, bulbs → suction_bulbs,
// adult → adult_scale, infant → infant_scale, apparatus → bp_apparatus,
// ctg_equip → ctg_machine, quantity → oxygen_quantity, oxygen →
// oxygen_equipment, o2 → o2_source. supplies/1-6, em_tray/1-13, and
// equipment/1-13 are select_multiple indicators. pphkits and
// pre_eclampia are not transformed dests.
assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Inpatient Maternity', [
  'incubators',
  'ambubags',
  'vd_kits',
  'obstetric_kit',
  'preeclampsia_kit',
  'resus_kits',
  'pharyngeal_airway',
  'glucometer',
  'fetoscopes',
  'ultrasound_in_unit',
  'doppler',
  'oximeter',
  'exam_light',
  'vacuum_extractor',
  'delivery_beds',
  'suction',
  'catheter_quantity',
  'suction_bulbs',
  'adult_scale',
  'infant_scale',
  'stadiometer',
  'thermometers',
  'stethoscopes',
  'laryngoscope',
  'bp_apparatus',
  'ctg_machine',
  'towels',
  'oxygen_quantity',
  'oxygen_equipment',
  'o2_source',
  'storage',
  'milk_bank',
  'refrigerator',
  'resuscitaire',
].concat(
  selectMultipleAttributeNames_('equipment_supplies', MATERNITY_SUPPLIES_CHOICES),
  selectMultipleAttributeNames_('equipment_em_tray', MATERNITY_EM_TRAY_CHOICES),
  selectMultipleAttributeNames_('equipment_resus_cart', MATERNITY_RESUS_CART_CHOICES)
), 'Equipment');

// birth → birth_notification, bregister → birth_register, death →
// death_notification, dregister → death_register, birth_death →
// birth_death_notification, delivery → delivery_notes, dl_register →
// delivery_register, postnatal → postnatal_register, pregister →
// postnatal_register_alt, nutrition → nutrition_form, nregister →
// nursing_register, kmc → kmc_chart, imf → inpatient_maternity_file,
// newborn → newborn_file, maternal_death → maternal_death_notification,
// perinatal_death → perinatal_death_notification, maternal_review →
// maternal_death_review, perinatl_review → perinatal_death_review.
// patient_file/1-12 are the select_multiple indicators.
assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Inpatient Maternity', [
  'birth_notification',
  'birth_register',
  'death_notification',
  'death_register',
  'birth_death_notification',
  'delivery_notes',
  'delivery_register',
  'postnatal_register',
  'postnatal_register_alt',
  'nutrition_form',
  'newborn_register',
  'nursing_register',
  'kmc_chart',
  'inpatient_maternity_file',
  'newborn_file',
  'maternal_death_notification',
  'perinatal_death_notification',
  'maternal_death_review',
  'perinatal_death_review',
  'autopsy_forms',
].concat(
  selectMultipleAttributeNames_('health_records_patient_file', MATERNITY_PATIENT_FILE_CHOICES)
), 'Health Records for clients');

// operation → caesarean_wait_hours
assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Inpatient Maternity',
  ['caesarean_wait_hours'],
  'Hours of operation'
);

// rehab → rehab_staff. Other listed HRH names are not transformed dests.
assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Inpatient Maternity',
  ['rehab_staff'],
  'HRH'
);

// benches → waiting_benches, material → building_material, structures →
// sound_structures, lighting → well_lit, rooms → exam_rooms, access →
// disabled_access, isolate → isolation_space, extinguishers →
// fire_extinguishers, signs → clear_signage, charter → service_charter,
// labour_area → labour_area_privacy, childbirth_area →
// childbirth_area_privacy, temperature → temperature_control,
// draught → draught_free, dust → dust_evidence. education/1-7 are
// select_multiple indicators. beds_share is not a transformed dest.
assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Inpatient Maternity', [
  'triage_area',
  'waiting_area',
  'waiting_benches',
  'ventilation',
  'maintenance_infrastructure',
  'building_material',
  'sound_structures',
  'well_lit',
  'fan_available',
  'exam_rooms',
  'disabled_access',
  'isolation_space',
  'fire_extinguishers',
  'cabinets',
  'clear_signage',
  'service_charter',
  'labour_area_privacy',
  'childbirth_area_privacy',
  'recovery_room',
  'resuscitation_area',
  'temperature_control',
  'draught_free',
  'dust_evidence',
].concat(
  selectMultipleAttributeNames_('infrastructure_education', MATERNITY_EDUCATION_CHOICES)
), 'Infrastructure');

// visual → visual_privacy, auditory → auditory_privacy, files →
// files_privacy, beds_space → bed_spacing, barrier → visual_barrier.
assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Inpatient Maternity', [
  'visual_privacy',
  'auditory_privacy',
  'files_privacy',
  'single_rooms',
  'bed_spacing',
  'visual_barrier',
], 'Privacy/confidentiality');

// pocus → pocus_service, ultrasound → ultrasound_service, xray →
// xray_service, gestation → gestation_ultrasound, anomalies →
// anomalies_service, ctg → ctg_service, uterotonics →
// uterotonics_service, breastfeeding_counsel → breastfeeding_service,
// newborn_care → newborn_care_service, immunization/1-4 are
// select_multiple indicators. eid is not a transformed dest.
assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Inpatient Maternity', [
  'pocus_service',
  'ultrasound_service',
  'xray_service',
  'foetal_viability',
  'no_foetuses',
  'gestation_ultrasound',
  'anomalies_service',
  'placenta_det',
  'ctg_service',
  'uterotonics_service',
  'uterotonics_alt',
  'uterotonics_freq',
  'antibiotics_service',
  'antibiotics_freq',
  'anticonvulsant_lab',
  'anticonvulsant_freq',
  'retained_placenta_service',
  'retained_freq',
  'placenta_service',
  'placenta_freq',
  'avd_service',
  'avd_freq',
  'resuscitation_service',
  'resuscitation_freq',
  'perineal_care',
  'ppfp_service',
  'breastfeeding_service',
  'newborn_care_service',
  'microscopy_lab',
  'hgb_lab',
  'urinalysis_lab',
  'urine_rapid_lab',
  'urine_protein_lab',
  'urine_glucose_lab',
  'hiv_rapid_lab',
  'dbs_lab',
  'rpr_vdrl',
  'blood_group_lab',
  'malaria_lab',
  'bs_malaria_lab',
  'hep_b_lab',
  'tb_testing',
  'glucose_lab',
].concat(
  selectMultipleAttributeNames_('services_immunization', MATERNITY_IMMUNIZATION_CHOICES)
), 'Services offered');

// pph → pph_sop, pre_eclampsia → pre_eclampsia_sop, sepsis →
// sepsis_sop, newborn_mgt → newborn_mgt_sop, handwashing →
// handwashing_sop, referral → referral_sop, procure →
// procurement_protocol, sop → maternity_sop, checklist →
// maternity_checklist. policy_a/1-11, policy_b/1-11, policy_c/1-11,
// and policy_d/1-9 are the select_multiple indicators.
assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Inpatient Maternity', [
  'intrapartum_sop',
  'pph_sop',
  'pre_eclampsia_sop',
  'eclampsia_sop',
  'sepsis_sop',
  'newborn_mgt_sop',
  'resuscitation_sop',
  'handwashing_sop',
  'referral_sop',
  'procurement_protocol',
  'maternity_sop',
  'maternity_checklist',
].concat(
  selectMultipleAttributeNames_('sop_policy_a', MATERNITY_POLICY_A_CHOICES),
  selectMultipleAttributeNames_('sop_policy_b', MATERNITY_POLICY_B_CHOICES),
  selectMultipleAttributeNames_('sop_policy_c', MATERNITY_POLICY_C_CHOICES),
  selectMultipleAttributeNames_('sop_policy_d', MATERNITY_POLICY_D_CHOICES)
), 'Standard operating procedures/Protocols');

// Date dests only. The .1 Kobo names are not separate dests.
assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Inpatient Maternity', [
  'training_emonc_guidelines',
  'training_support',
  'training_nnr',
  'training_pnc',
  'training_ipc',
  'training_newborn_infection',
  'training_harmful_practices',
  'training_communication',
  'training_breastfeeding',
  'training_companion',
  'training_pain_relief',
  'training_emotional_support',
  'training_rmc',
  'training_obstetric_care',
  'training_newborn_care',
  'training_family_planning',
  'training_cardio',
  'training_haemovigilance',
  'training_stress_mgt',
  'training_mpdsr',
], 'Training');

assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Inpatient Maternity', [
  'wash_source',
  'wash_water_freq',
  'wash_hand_washing',
  'wash_drainage',
  'wash_disposable_towels',
  'wash_disposal',
  'wash_leak_proof',
  'wash_sharp',
  'wash_visible',
  'wash_latrine',
  'wash_station',
  'wash_bathrooms',
  'wash_clean',
  'wash_accessible',
  'wash_gender',
  'wash_menstrual',
  'wash_no_toilets',
  'wash_labour',
], 'WASH (Water, Sanitation, Hygeine)/IPC');

// incl_lab_report → tincl_lab_report_*, blood_product_labels →
// tblood_product_labels_*. external_contrlol_eqc keeps the Kobo
// spelling.
assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Lab',
  LAB_GROUP_11_YES_NO_FIELDS.concat(
    selectMultipleAttributeNames_(
      LAB_TINCL_LAB_REPORT_PREFIX,
      LAB_TINCL_LAB_REPORT_CHOICES
    ),
    selectMultipleAttributeNames_(
      LAB_TBLOOD_PRODUCT_LABELS_PREFIX,
      LAB_TBLOOD_PRODUCT_LABELS_CHOICES
    )
  ),
  'Adherence to evidence based practice'
);

// serum_elecrolyete → serum_electrolyete.
assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Lab',
  LAB_GROUP_10_FIELDS,
  'Commodities'
);

// PPE_equipment, tb_diagnostic, ziehl_stain, auramine_stain,
// genexpert, liver_function_equipment, bc_analyzer, bc_tools,
// hiv_testing_equipment, and blood_type_crossmatch_equi are
// select_multiple indicators.
assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Lab',
  LAB_GROUP_9_YES_NO_FIELDS.concat(
    LAB_GROUP_9_EQUIP_FUNCTIONAL_FIELDS,
    ['maint_contract_colo_hae', 'sputum_smear', 'blood_count'],
    labGroup9SelectMultiples_().reduce(function (names, field) {
      return names.concat(
        selectMultipleAttributeNames_(field.prefix, field.choices)
      );
    }, [])
  ),
  'Equipment'
);

// crossmatch_register, crossmatch_reg_used, and tb_register are
// not transformed dests. standard_lab_request/1-10 are the
// select_multiple indicators.
assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Lab',
  LAB_GROUP_3_REGISTER_FIELDS.concat(
    selectMultipleAttributeNames_(
      LAB_STANDARD_LAB_REQUEST_PREFIX,
      LAB_STANDARD_LAB_REQUEST_CHOICES
    ),
    LAB_GROUP_3_FOLLOWUP_FIELDS
  ),
  'Health Records for clients'
);

assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Lab',
  ['on_laboratory_open'].concat(LAB_GROUP_12_YES_NO_FIELDS),
  'Hours of operation'
);

// county_technologist and contract_technologist are not
// transformed dests.
assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Lab',
  LAB_GROUP_4_COUNT_FIELDS.concat(['personnel', 'inadequate_staff']),
  'HRH'
);

// abo_blood → blood_group_testing, via_test → perform_via.
// dipstick_param, eid_hiv, sample_viral, and pap_smear_referral
// are not transformed dests. Remaining group_2 dests
// (perform_syphilis, glucose_dipstick, pap_smear_monthly,
// per_hpylori and their monthly pairs) stay with this group.
assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Lab',
  LAB_GROUP_2_FIELDS.map(function (field) {
    return field.dest;
  }),
  'Services offered'
);

// sop/1-16, specimen_collection/1-5, and confirm_sops/1-31 are
// the select_multiple indicators. sop_total is not a dest.
// have_quality_manual is a dest but was not listed.
assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Lab',
  ['handwashing_protocol'].concat(
    selectMultipleAttributeNames_(LAB_SOP_PREFIX, LAB_SOP_CHOICES),
    selectMultipleAttributeNames_(
      LAB_SPECIMEN_COLLECTION_PREFIX,
      LAB_SPECIMEN_COLLECTION_CHOICES
    ),
    LAB_GROUP_6_YES_NO_FIELDS,
    selectMultipleAttributeNames_(
      LAB_CONFIRM_SOPS_PREFIX,
      LAB_CONFIRM_SOPS_CHOICES
    )
  ),
  'Standard operating procedures/Protocols'
);

assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Lab',
  LAB_GROUP_5_TRAINING_FIELDS.concat(LAB_GROUP_5_YES_NO_FIELDS),
  'Training'
);

assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Lab',
  LAB_GROUP_7_HEADERS,
  'WASH (Water, Sanitation, Hygeine)/IPC'
);

// pre_checks, anaest_doc, and anaest_chart parents are not dests.
// pre_checks/1-5, anaest_doc/1-10, and anaest_chart/1-13 are the
// select_multiple indicators. pre_checks/5 and anaest_chart/13
// have no attribute_name.
const OT_ADHERENCE_EVIDENCE_DESTS = [
  'clean_sched',
  'expiry_check',
  'anaest_serv',
  'bed_serv',
  'patient_id',
].concat(
  selectMultipleAttributeNames_(OT_PRE_CHECKS_PREFIX, OT_PRE_CHECKS_CHOICES),
  [
    'ecg_mon',
    'spo2_mon',
    'bp_mon',
    'surg_count',
    'op_board',
    'blood_spec',
    'mortality_rev',
    'anaest_rev',
  ],
  selectMultipleAttributeNames_(OT_ANAEST_DOC_PREFIX, OT_ANAEST_DOC_CHOICES),
  selectMultipleAttributeNames_(OT_ANAEST_CHART_PREFIX, OT_ANAEST_CHART_CHOICES),
  ['turnaround']
);

assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Operating Theatre',
  OT_ADHERENCE_EVIDENCE_DESTS,
  'Adherence to evidence based practice'
);

assignMappedLabels_(
  FQA_HSS_BUILDING_BLOCK_MAP,
  'Operating Theatre',
  OT_ADHERENCE_EVIDENCE_DESTS,
  'Leadership & Governance'
);

assignMappedLabelEntries_(FQA_ATTRIBUTE_NAME_MAP, 'Operating Theatre', {
  clean_sched: 'Cleaning schedule current',
  expiry_check: 'Expiry checked regularly',
  anaest_serv: 'Routine servicing of anaesthetic machines',
  bed_serv: 'Routine servicing of operating beds',
  patient_id: 'Pre-sedation ID/consent',
  pre_checks_preoperative_monitoring_of_vital_signs: 'Pre-op vitals monitoring',
  pre_checks_any_allergies_and_administered_preoperative_medication_verified:
    'Allergies/meds verified',
  pre_checks_last_oral_intake_is_verified: 'NPO verified',
  pre_checks_a_designated_nurse_nurse_in_charge_completes_a_checklist_to_ensure_all_staff_and_equipment_is_ready_for_surgery:
    'Nurse CL completed',
  ecg_mon: 'Intra-op ECG monitoring',
  spo2_mon: 'Intra-op SpO₂ monitoring',
  bp_mon: 'Intra-op BP monitoring',
  surg_count: 'Surgical count performed before incision and closure',
  op_board: 'Operation details board',
  blood_spec: 'Blood/specimen workflow',
  mortality_rev: 'M&M reviews conducted',
  anaest_rev: 'Pre-op anaes. review',
  anaest_doc_anaesthetic_processes_from_pre_anaesthetic_review_to_reversal_of_anaesthesia_including_any_incidents_that_may_have_occurred:
    'Anaes. process & incidents',
  anaest_doc_diagnosis_and_indication_for_surgery: 'Diagnosis & indication',
  anaest_doc_baseline_vital_signs_measurement_blood_pressure_pulse_respiratory_rate:
    'Baseline vitals',
  anaest_doc_results_of_pre_op_investigations_done: 'Pre-op investigations',
  anaest_doc_comprehensive_pre_op_physical_examination: 'Pre-op physical exam',
  anaest_doc_previous_anaesthetic_exposure_and_surgical_history:
    'Prev. anaes./surg. hx',
  anaest_doc_medical_history_presence_of_allergies_chronic_illness_or_regular_drug_use:
    'Med hx (allergies/illness)',
  anaest_doc_airway_assessment_and_examination_assesses_adequacy_of_mouth_chin_jaw_and_neck_for_endotracheal_intubation_if_needed:
    'Airway assessment',
  anaest_doc_the_anaesthesia_impression_which_includes_the_asa_classification_and_proposed_anaesthetic_technique_to_be_used:
    'Anaes. impression & ASA',
  anaest_doc_no_documentation_provided: 'No documentation',
  anaest_chart_clients_name: 'Client name',
  anaest_chart_client_age_or_date_of_birth: 'Client age/DOB',
  anaest_chart_client_hospital_number: 'Hospital number',
  anaest_chart_diagnosis_and_planed_surgery: 'Diagnosis/planned surgery',
  anaest_chart_name_of_surgeon_anaesthetist_assistant_surgeon_and_scrub_nurse:
    'Surgeon/anaes/asst/scrub',
  anaest_chart_date_and_time_of_start_and_end_of_surgery_and_anaesthesia:
    'Surg/anaes start–end time',
  anaest_chart_type_of_anaesthesia_given: 'Anaesthesia type',
  anaest_chart_maternal_vitals_maternal_pulse_blood_pressure_and_spo2_every_15_minutes:
    'Maternal vitals q15min',
  anaest_chart_estimated_blood_loss: 'Estimated blood loss',
  anaest_chart_reversal_procedure: 'Reversal procedure',
  anaest_chart_immediate_post_operative_management: 'Immediate post-op mgmt',
  anaest_chart_any_drugs_and_iv_fluids_given_during_the_period_they_are_under_anaesthesia:
    'Drugs/IV fluids given',
  turnaround: 'Average theatre turnaround time',
});

// bupi_0.5, spinalpacks, and spinalpacks/1-8 are not transformed
// dests. tranexamic is a dest but was not listed.
const OT_COMMODITY_EVIDENCE_DESTS = OT_COMMODITY_FIELDS.map(function (field) {
  return field.dest;
}).filter(function (dest) {
  return dest !== 'tranexamic';
});

assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Operating Theatre',
  OT_COMMODITY_EVIDENCE_DESTS,
  'Commodities'
);

assignMappedLabels_(
  FQA_HSS_BUILDING_BLOCK_MAP,
  'Operating Theatre',
  OT_COMMODITY_EVIDENCE_DESTS,
  'Commodities'
);

assignMappedLabelEntries_(FQA_ATTRIBUTE_NAME_MAP, 'Operating Theatre', {
  lidocaine: 'Plain lidocaine',
  povidine: 'Povidone',
  ephedrine: 'Ephedrine/phenylephrine',
  iv_fluids: 'IV fluids',
  mag_sulfate: 'Magnesium sulphate',
  naloxone: 'Naloxone',
  ceftriaxone: 'Ceftriaxone',
  hydralazine: 'Hydralazine',
  flumazenil: 'Flumazenil',
  adrenaline: 'Adrenaline',
  diazepam: 'Diazepam',
  midazolam: 'Midazolam',
  cal_gluconate: 'Calcium gluconate',
  tranex_acid: 'Tranexamic acid',
  lasix: 'Lasix',
  antiemetic: 'Metoclopramide/ondansetron',
  chlorphenir: 'Chlorpheniramine',
  plasma_exp: 'Plasma/volume expanders',
  nitrous: 'Nitrous oxide',
  halothane: 'Halothane',
  ketamine: 'Ketamine',
  suxameth: 'Suxamethonium',
  atropine: 'Atropine',
  neostig_physio: 'Neostigmine/physostigmine',
  esomep: 'Esomeprazole',
  vit_k: 'Vitamin K',
  chlorhex: 'Chlorhexidine',
  tetra_eye: 'Tetracycline eye oint.',
  oxytocin: 'Oxytocin',
  misoprostol: 'Misoprostol',
  paracetamol: 'Paracetamol IV',
  carbetocin: 'Heat-stable carbetocin',
  facemasks: 'Facemasks',
  latex_gloves: 'Latex gloves',
  sterile_gloves: 'Sterile gloves (sizes)',
  spinal_packs: 'Sterile spinal packs',
  sterile_sutures: 'Sterile sutures',
  wound_dressing: 'Dressing/wound material',
  sterile_drapes: 'Sterile drapes',
  iv_sets: 'IV infusion sets',
  blood_sets: 'Blood giving sets',
  cannulae: 'Cannulae (sizes)',
  needles_syringes: 'Needles & syringes (sizes)',
  catheters: 'Urethral catheters',
  urine_bags: 'Urine bags',
  gauze: 'Sterile raytex gauze',
  cotton_wool: 'Cotton wool',
  cauter_tips: 'Cauterisation tips',
  cauter_pad: 'Cautery grounding pad',
  infant_id_bands: 'Infant ID bands',
  pethidine: 'Pethidine',
  morphine: 'Morphine',
  nevirapine: 'Nevirapine',
  azt: 'AZT (zidovudine)',
  cord_clamp: 'Cord clamp',
  caps: 'Baby caps',
  socks: 'Infant socks',
});

// bp_cuffs, lary_blades, ett_tubes, and pacu_trol parents are not
// dests. bp_cuffs/4, lary_blades/5, and ett_tubes/8 have no
// attribute_name.
const OT_EQUIPMENT_EVIDENCE_DESTS = OT_EQUIPMENT_FIELDS.reduce(function (names, field) {
  if (field.type === 'multi') {
    return names.concat(
      selectMultipleAttributeNames_(field.prefix || field.dest, field.choices)
    );
  }
  names.push(field.dest);
  return names;
}, []);

assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Operating Theatre',
  OT_EQUIPMENT_EVIDENCE_DESTS,
  'Equipment'
);

assignMappedLabels_(
  FQA_HSS_BUILDING_BLOCK_MAP,
  'Operating Theatre',
  OT_EQUIPMENT_EVIDENCE_DESTS,
  'Equipment'
);

assignMappedLabelEntries_(FQA_ATTRIBUTE_NAME_MAP, 'Operating Theatre', {
  op_table: 'Operating table functional',
  surg_lamp: 'Surg. lamp/theatre',
  inf_scale: 'Infant scale/theatre',
  chair: 'Backless chair/theatre',
  cauter: 'Cauterisation eqmt',
  mayo: 'Mayo trolleys/theatre',
  instr_trol: 'Instrument trolleys/thtr',
  cs_sets: 'Full CS sets',
  resusc: 'Resuscitaire/OR',
  ster_date: 'Steril. date on CS packs',
  suction: 'Suction apparatus/thtr',
  res_bag_mom: 'Adult self-inflating bag',
  res_bag_infant: 'Infant self-inflating bag',
  mack_apron: 'Mackintosh aprons',
  eye_shield: 'Eye shields',
  gum_boots: 'Gum boots/clogs',
  anest_machine: 'Anaes. machine/theatre',
  emerg_trol: 'Anaes. emerg. trolley',
  anest_maint: 'Anaes. machine maint. rec.',
  stetho: 'Stethoscope/anaes. mach.',
  monitor: 'Patient monitor/theatre',
  spo2_probe: 'Pulse oximeter probe',
  bp_cuffs_small: 'Small',
  bp_cuffs_medium: 'Medium',
  bp_cuffs_large: 'Large',
  ecg_leads: 'ECG leads',
  airways: 'Oropharyngeal airway',
  laryngo: 'Laryngoscope (lights)',
  lary_blades_size_0: 'Size 0',
  lary_blades_size_1: 'Size 1',
  lary_blades_size_4: 'Size 4',
  lary_blades_size_5: 'Size 5',
  ett_tubes_newborn_size_2_5: 'NB size 2.5',
  ett_tubes_newborn_size_3_0: 'NB size 3.0',
  ett_tubes_newborn_size_3_5: 'NB size 3.5',
  ett_tubes_adult_size_6_0: 'Adult 6.0',
  ett_tubes_adult_size_6_5: 'Adult 6.5',
  ett_tubes_adult_size_7_0: 'Adult 7.0',
  ett_tubes_adult_size_7_5: 'Adult 7.5',
  magill: 'Magill\'s forceps',
  fridge: 'Refrigerator',
  note2_pacu: 'PACU wall clock working',
  pacu_trol_tramadol: 'Tramadol',
  pacu_trol_ketorolac: 'Ketorolac',
  pacu_trol_ephedrine_or_adrenaline: 'Ephedrine/adrenaline',
  pacu_trol_calcium_gluconamte: 'Calcium gluconate',
  pacu_trol_mgso4: 'MgSO4',
  pacu_trol_sodium_bicarb: 'Sodium bicarb',
  pacu_trol_hydrocortisone: 'Hydrocortisone',
  pacu_trol_oxytocin: 'Oxytocin',
  pacu_trol_tranexamic_acid: 'Tranexamic acid',
  pacu_trol_lasix: 'Lasix',
  pacu_trol_misoprostol: 'Misoprostol',
  pacu_trol_naloxone: 'Naloxone',
  pacu_trol_flumazenil: 'Flumazenil',
  pacu_trol_various_airways: 'Various airways',
  pacu_trol_endotracheal_tubes: 'ETT',
  pacu_trol_difficult_airway_kit: 'Difficult airway kit',
  pacu_trol_no_trolley_for_emergency_drugs: 'No trolley',
  pacu_gluco: 'PACU glucometer',
  pacu_lamp: 'PACU procedure lamp',
  pacu_defib: 'PACU defibrillator',
  pacu_temp: 'PACU wall thermometer',
  temp_18_24: 'PACU temp 18–24°C',
  pacu_bp: 'PACU BP monitor',
  pacu_spo2: 'PACU SpO₂ monitor',
  pacu_ecg: 'PACU ECG monitor',
  pacu_o2: 'PACU oxygen capability',
  pacu_desk: 'PACU staff desk',
});

// anesthetic_reg, anesthetic_reg_used, safety_checklist, and
// safety_checklist_used are not transformed dests. cs_forms
// parent is not a dest. cs_forms/11 has no attribute_name.
const OT_RECORDS_EVIDENCE_DESTS = OT_HEALTH_RECORD_YES_NO_FIELDS.map(function (field) {
  return field.dest;
}).concat(
  selectMultipleAttributeNames_(OT_CS_FORMS_PREFIX, OT_CS_FORMS_CHOICES),
  ['referral_forms']
);

assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Operating Theatre',
  OT_RECORDS_EVIDENCE_DESTS,
  'Health Records for clients'
);

assignMappedLabels_(
  FQA_HSS_BUILDING_BLOCK_MAP,
  'Operating Theatre',
  OT_RECORDS_EVIDENCE_DESTS,
  'Health Information System'
);

assignMappedLabelEntries_(FQA_ATTRIBUTE_NAME_MAP, 'Operating Theatre', {
  theatre_list: 'Theatre list (E+E)',
  delivery_reg: 'MOH333 delivery register',
  reg_used: 'Delivery reg. used cons.',
  theatre_reg: 'Theatre operative register',
  theatre_reg_used: 'Theatre op reg used cons.',
  cs_forms_anesthesia_charts: 'Anaesthesia chart',
  cs_forms_pacu_monitoring_charts: 'PACU monitoring chart',
  cs_forms_patient_consent_forms: 'Consent form',
  cs_forms_post_operative_record: 'Post-op record',
  cs_forms_safe_surgery_checklist: 'Safe surgery CL',
  cs_forms_theatre_notes: 'Theatre notes',
  cs_forms_doctors_admission_record: 'Doctor admission rec.',
  cs_forms_post_cs_order_form: 'Post-CS order form',
  cs_forms_anesthesia_pre_op_checklist: 'Anaes. pre-op CL',
  cs_forms_surgical_consumption_report: 'Surg. consumption rpt',
  referral_forms: 'Blank referral forms',
});

assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Operating Theatre',
  ['hrs_day'],
  'Hours of operation'
);

assignMappedLabels_(
  FQA_HSS_BUILDING_BLOCK_MAP,
  'Operating Theatre',
  ['hrs_day'],
  'Service Delivery'
);

assignMappedLabelEntries_(FQA_ATTRIBUTE_NAME_MAP, 'Operating Theatre', {
  hrs_day: 'OT accessibility',
});

// county_anaesthes → county_anaesthesiologists,
// contract_anaesthes → contract_anaesthesiologists,
// county_co_anaest → county_co_anaesthetists,
// contract_co_anaest → contract_co_anaesthetists,
// county_nurse_anaest → county_nurse_anaesthetists,
// contract_nurse_anaest → contract_nurse_anaesthetists,
// anaesth_24hr → anaesthetist_available_24hrs.
// Theater Nurses_score is not a transformed dest.
// anaesth_assist_24hr and surg_assist_24hr are dests but were
// not listed.
const OT_HRH_EVIDENCE_DESTS = [
  'county_anaesthesiologists',
  'contract_anaesthesiologists',
  'county_co_anaesthetists',
  'contract_co_anaesthetists',
  'county_nurse_anaesthetists',
  'contract_nurse_anaesthetists',
  'county_theatre_nurse',
  'contract_theatre_nurse',
  'theatre_cleaners',
  'theatre_matron_patron',
  'anaesthetist_available_24hrs',
  'referral_no_anaesth',
  'obstetric_24hr',
  'referral_no_surg',
  'team_leader_24hr',
  'scrub_nurse_24hr',
  'circulate_nurse_24hr',
  'baby_nurse_24hr',
  'referral_no_nurse',
  'pacu_nurse_24hr',
  'on_call_roster',
];

assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Operating Theatre',
  OT_HRH_EVIDENCE_DESTS,
  'HRH'
);

assignMappedLabels_(
  FQA_HSS_BUILDING_BLOCK_MAP,
  'Operating Theatre',
  OT_HRH_EVIDENCE_DESTS,
  'Human Resource for Health'
);

assignMappedLabelEntries_(FQA_ATTRIBUTE_NAME_MAP, 'Operating Theatre', {
  county_anaesthesiologists: 'Number of county-employed anaesthesiologists',
  contract_anaesthesiologists: 'Number of contracted anaesthesiologists',
  county_co_anaesthetists: 'Number of county-employed clinical officer anaesthetists',
  contract_co_anaesthetists: 'Number of contracted clinical officer anaesthetists',
  county_nurse_anaesthetists: 'Number of county-employed anaesthetist nurses',
  contract_nurse_anaesthetists: 'Number of contracted anaesthetist nurses',
  county_theatre_nurse: 'Number of county-employed theatre nurses',
  contract_theatre_nurse: 'Number of contracted theatre nurses',
  theatre_cleaners: 'Number of operating theatre cleaners',
  theatre_matron_patron: 'Number of theatre matrons/patrons',
  anaesthetist_available_24hrs: 'Anaes. 24h avail.',
  referral_no_anaesth: 'Anaes. unavail referral 3m',
  obstetric_24hr: 'Obstetrician/MO 24h CS',
  referral_no_surg: 'Surg. unavail referral 3m',
  team_leader_24hr: 'Team leader 24h avail.',
  scrub_nurse_24hr: 'Scrub nurse 24h/theatre',
  circulate_nurse_24hr: 'Circ. nurse 24h/theatre',
  baby_nurse_24hr: 'Baby-receiving nurse 24h',
  referral_no_nurse: 'Nursing unavail referral 3m',
  pacu_nurse_24hr: 'PACU nurse 24h (1:2 beds)',
  on_call_roster: 'Emerg-surg on-call roster',
});

// changing_rooms → preop_change. adequate_surg_rooms is not a
// dest. theatre_space/1-5 are dests but were not listed.
const OT_INFRA_EVIDENCE_DESTS = OT_INFRA_FIELDS.map(function (field) {
  return field.dest;
});

assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Operating Theatre',
  OT_INFRA_EVIDENCE_DESTS,
  'Infrastructure'
);

assignMappedLabels_(
  FQA_HSS_BUILDING_BLOCK_MAP,
  'Operating Theatre',
  OT_INFRA_EVIDENCE_DESTS,
  'Infrastructure'
);

assignMappedLabelEntries_(FQA_ATTRIBUTE_NAME_MAP, 'Operating Theatre', {
  maintained: 'Unit physical maint.',
  exam_light: 'Exam spaces lighting',
  exam_vent: 'OT ventilation',
  preop_area: 'Pre-op area',
  preop_beds: 'Number of preoperative patient beds',
  preop_change: 'Pre-op changing rooms',
  surg_rooms: 'Number of operating rooms',
  intercom: 'Anaes. phone/intercom',
  postop_beds: 'Number of postoperative patient beds',
  bed_ref: 'Bed-shortage refs (1m)',
  pharm_store: 'Pharma/surg storage',
  sterile_store: 'Sterilised mat. storage',
  fire_ext: 'Fire-fighting apparatus',
  signage: 'Visible signage',
  charter: 'Visible service charter',
  nurse_station: 'Post-op nursing desk',
  postop_access: 'Post-op ≤1 min from OR',
  backup_power: 'Theatre backup power',
  temp_ctrl: 'Temperature control (AC)',
  staff_lounge: 'Theatre staff lounge',
  ipd_dist: 'Theatre–IPD ≤2 min',
});

// files_storage → files_sec.
const OT_PRIVACY_EVIDENCE_DESTS = [
  'preop_vis_priv',
  'postop_vis_priv',
  'preop_aud_priv',
  'postop_aud_priv',
  'files_sec',
];

assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Operating Theatre',
  OT_PRIVACY_EVIDENCE_DESTS,
  'Privacy/confidentiality'
);

assignMappedLabels_(
  FQA_HSS_BUILDING_BLOCK_MAP,
  'Operating Theatre',
  OT_PRIVACY_EVIDENCE_DESTS,
  'Service Delivery'
);

assignMappedLabelEntries_(FQA_ATTRIBUTE_NAME_MAP, 'Operating Theatre', {
  preop_vis_priv: 'Pre-op visual privacy',
  postop_vis_priv: 'Post-op visual privacy',
  preop_aud_priv: 'Pre-op auditory privacy',
  postop_aud_priv: 'Post-op auditory privacy',
  files_sec: 'Files in secure cabinets',
});

// routine_cs_6m → routine_cs_6months, emerg_cs → emergency_cs,
// emerg_cs_6m → emergency_cs_6months, emerg_anaes →
// emergency_obstetric_anaesthesia, anaes_6m →
// emergency_obstetric_anaesthesia_6m, tubal_lig → tubal_ligation,
// dnc → dilation_curettage, cs_hyst → cesarean_hysterectomy,
// eua → exam_under_anesthesia, cerclage → cervical_cerclage,
// cerv_tear → cervical_tear_repair, sec_wound →
// secondary_wound_closure. blynch_sature keeps the form spelling.
// marsupial is a dest but was not listed.
const OT_SERVICES_EVIDENCE_DESTS = OT_SERVICES_FIELDS.map(function (field) {
  return field.dest;
}).filter(function (dest) {
  return dest !== 'marsupial';
});

assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Operating Theatre',
  OT_SERVICES_EVIDENCE_DESTS,
  'Services offered'
);

assignMappedLabels_(
  FQA_HSS_BUILDING_BLOCK_MAP,
  'Operating Theatre',
  OT_SERVICES_EVIDENCE_DESTS,
  'Service Delivery'
);

assignMappedLabelEntries_(FQA_ATTRIBUTE_NAME_MAP, 'Operating Theatre', {
  routine_cs: 'Routine CS',
  routine_cs_6months: 'Routine CS — 6m',
  emergency_cs: 'Emergency CS',
  emergency_cs_6months: 'Emergency CS — 6m',
  emergency_obstetric_anaesthesia: 'Emergency obstetric anaes.',
  emergency_obstetric_anaesthesia_6m: 'Emerg. obs. anaes. — 6m',
  tubal_ligation: 'Tubal ligation',
  laparotomy: 'Exploratory laparotomy',
  dilation_curettage: 'Dilation & curettage',
  cystotomy: 'Cystotomy repair',
  cesarean_hysterectomy: 'Caesarean hysterectomy',
  exam_under_anesthesia: 'Exam under anaesthesia',
  cervical_cerclage: 'Cervical cerclage',
  cervical_tear_repair: 'Cervical tear repair',
  incision_drain: 'Incision & drainage',
  secondary_wound_closure: 'Secondary wound closure',
  blynch_sature: 'B-Lynch/comp. suture',
});

const OT_SOP_EVIDENCE_DESTS = OT_SOP_FIELDS.map(function (field) {
  return field.dest;
});

assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Operating Theatre',
  OT_SOP_EVIDENCE_DESTS,
  'Standard operating procedures/Protocols'
);

assignMappedLabels_(
  FQA_HSS_BUILDING_BLOCK_MAP,
  'Operating Theatre',
  OT_SOP_EVIDENCE_DESTS,
  'Leadership & Governance'
);

assignMappedLabelEntries_(FQA_ATTRIBUTE_NAME_MAP, 'Operating Theatre', {
  anaes_proto: 'Anaes. machine check prot.',
  referral_proto: 'Referral protocol display',
  ppe_radio_proto: 'PPE in radiology prot.',
  recovery_proto: 'PACU monitoring prot.',
  theatre_ppe: 'Theatre clothing/PPE prot.',
  sedation_proto: 'Anaes. mixtures prot.',
  clean_proto: 'OT cleaning/disinfect prot.',
});

// last_train_score is not a transformed dest. last_train and
// cpd_required are text dests.
assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Operating Theatre',
  ['last_train', 'cpd_required'],
  'Training'
);

assignMappedLabels_(
  FQA_HSS_BUILDING_BLOCK_MAP,
  'Operating Theatre',
  ['last_train', 'cpd_required'],
  'Human Resource for Health'
);

assignMappedLabelEntries_(FQA_ATTRIBUTE_NAME_MAP, 'Operating Theatre', {
  last_train: 'Training on management of obstetric emergencies',
  cpd_required: 'Anaes. CPD required',
});

// WASH dests from OT_WASH_FIELDS. gender_sep → gender_seperation.
// specify_latrine is text (no FQA Scores rows).
const OT_WASH_EVIDENCE_DESTS = OT_WASH_FIELDS.map(function (field) {
  return field.dest;
});

assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Operating Theatre',
  OT_WASH_EVIDENCE_DESTS,
  'WASH (Water, Sanitation, Hygeine)/IPC'
);

assignMappedLabels_(
  FQA_HSS_BUILDING_BLOCK_MAP,
  'Operating Theatre',
  OT_WASH_EVIDENCE_DESTS,
  'Service Delivery'
);

assignMappedLabelEntries_(FQA_ATTRIBUTE_NAME_MAP, 'Operating Theatre', {
  water_access: 'Each OT — water source',
  water_1m: 'Water consist. (1m)',
  sep_sinks: 'Separate sinks HW/fluids',
  drain_system: 'Drainage system',
  postop_sink: 'Post-op water point',
  hand_hygiene: 'Hand hygiene coverage',
  waste_proto: 'Waste mgmt protocol',
  waste_bins_label: 'Segregated waste bins',
  sharps_full: 'Sharps containers in areas',
  latrine: 'Sharps containers <3/4',
  latrine_type: 'Latrine type (JMP ladder)',
  specify_latrine: 'Latrine type (other)',
  handwash_station: 'Sanitation HW station',
  clean_freq: 'Bathroom clean freq.',
  clean_today: 'Bathrooms clean today',
  access_mobility: 'Sanitation accessibility',
  gender_seperation: 'Gender-sep sanitation',
  mens_hygiene: 'Menstrual hygiene mgmt',
  instr_cleaning: 'Instrument cleaning area',
});

// Facility General adherence dests from FACILITY_GENERAL_ADHERENCE_YES_NO_FIELDS.
assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Facility General',
  FACILITY_GENERAL_ADHERENCE_YES_NO_FIELDS,
  'Adherence to evidence based practice'
);

assignMappedLabels_(
  FQA_HSS_BUILDING_BLOCK_MAP,
  'Facility General',
  FACILITY_GENERAL_ADHERENCE_YES_NO_FIELDS,
  'Leadership & Governance'
);

assignMappedLabelEntries_(FQA_ATTRIBUTE_NAME_MAP, 'Facility General', {
  uniforms_badges: 'Staff uniforms & ID badges',
  pest_control: 'Pest-control mechanism',
});

assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Facility General',
  ['run_out_fuel'],
  'Commodities'
);

assignMappedLabels_(
  FQA_HSS_BUILDING_BLOCK_MAP,
  'Facility General',
  ['run_out_fuel'],
  'Commodities'
);

assignMappedLabelEntries_(FQA_ATTRIBUTE_NAME_MAP, 'Facility General', {
  run_out_fuel: 'No fuel stockout past month',
});

// secure_registers parent is not a dest. unique_patient_identifer
// keeps the form spelling.
const FACILITY_GENERAL_RECORDS_EVIDENCE_DESTS = [
  'data_collection_tools',
].concat(
  FACILITY_GENERAL_HEALTH_RECORDS_YES_NO_FIELDS,
  selectMultipleAttributeNames_(
    FACILITY_GENERAL_SECURE_REGISTERS_PREFIX,
    FACILITY_GENERAL_SECURE_REGISTERS_CHOICES
  )
);

assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Facility General',
  FACILITY_GENERAL_RECORDS_EVIDENCE_DESTS,
  'Health Records for clients'
);

assignMappedLabels_(
  FQA_HSS_BUILDING_BLOCK_MAP,
  'Facility General',
  FACILITY_GENERAL_RECORDS_EVIDENCE_DESTS,
  'Health Information System'
);

assignMappedLabelEntries_(FQA_ATTRIBUTE_NAME_MAP, 'Facility General', {
  data_collection_tools: 'Tool type used at facility (paper / electronic / both / neither)',
  unique_patient_identifer: 'Unique patient identifier system in use',
  responsible_person: 'Records officer designated',
  secure_registers_lockable_doors: 'Registry has lockable doors',
  secure_registers_grills: 'Registry has security grills',
  secure_registers_fireproof_cabinets: 'Registry has fireproof cabinets',
  secure_registers_none: 'No security features present',
  storage_equipment: 'Electronic storage equipment exists',
  electronic_registry: 'Password-protected electronic registry',
  data_storage_cap: 'No data-storage stockout in past month',
  written_collection_tools: 'No paper-tool stockout in past month',
});

assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Facility General',
  ['opening_hours'],
  'Hours of operation'
);

assignMappedLabels_(
  FQA_HSS_BUILDING_BLOCK_MAP,
  'Facility General',
  ['opening_hours'],
  'Service Delivery'
);

assignMappedLabelEntries_(FQA_ATTRIBUTE_NAME_MAP, 'Facility General', {
  opening_hours: 'Operating-hours band',
});

// facility_staff3 parent is not a dest. Staff counts are integers
// (no FQA Scores rows).
const FACILITY_GENERAL_HRH_EVIDENCE_DESTS = FACILITY_GENERAL_HRH_STAFF_FIELDS.map(function (field) {
  return field.dest;
}).concat(
  selectMultipleAttributeNames_(
    FACILITY_GENERAL_FACILITY_STAFF3_PREFIX,
    FACILITY_GENERAL_FACILITY_STAFF3_CHOICES
  ),
  FACILITY_GENERAL_HRH_POLICY_YES_NO_FIELDS,
  ['have_qit', 'qit_meet', 'have_wit', 'wit_meet', 'have_sit', 'sit_meet']
);

assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Facility General',
  FACILITY_GENERAL_HRH_EVIDENCE_DESTS,
  'HRH'
);

assignMappedLabels_(
  FQA_HSS_BUILDING_BLOCK_MAP,
  'Facility General',
  FACILITY_GENERAL_HRH_EVIDENCE_DESTS,
  'Human Resource for Health'
);

assignMappedLabelEntries_(FQA_ATTRIBUTE_NAME_MAP, 'Facility General', {
  medical_officer: 'Number of county-employed medical officers',
  medical_officer3: 'MO availability during opening',
  clinical_officer: 'Number of clinical officers',
  clinical_officer3: 'CO availability during opening',
  health_records: 'Number of health records officers',
  nutritionist: 'Number of nutritionists',
  social_worker: 'Number of social workers',
  public_health: 'Number of public health officers/technicians',
  health_promotion: 'Number of health promotion officers',
  cleaning_staff_employed: 'Number of permanent cleaning staff',
  cleaning_staff_contract: 'Number of contracted cleaning staff',
  maintenance_staff: 'Number of maintenance staff',
  facility_staff3_a_written_up_to_date_staffing_policy:
    'Staffing doc: Written up-to-date staffing policy',
  facility_staff3_a_list_that_details_staff_numbers:
    'Staffing doc: List with staff numbers',
  facility_staff3_a_list_that_details_the_types_and_competence_of_staff:
    'Staffing doc: List with staff types & competence',
  facility_staff3_none: 'Staffing doc: None',
  roster_displayed: 'Roster displayed',
  clear_comm: 'Communication channels functional',
  annual_appraise: 'Annual staff appraisal conducted',
  eval_verify: 'Credential verification process',
  have_qit: 'QIT active',
  qit_meet: 'QIT meeting frequency',
  have_wit: 'WIT active',
  wit_meet: 'WIT meeting frequency',
  have_sit: 'SIT active',
  sit_meet: 'SIT meeting frequency',
});

// sec_electricity, security_measures6, and housekeeping parents
// are not dests. elect_source and elect_sec are text (no FQA
// Scores rows). maintencance_log keeps the form spelling.
const FACILITY_GENERAL_INFRA_EVIDENCE_DESTS = FACILITY_GENERAL_INFRA_YES_NO_FIELDS.concat(
  ['vis_signage', 'main_elec_source', 'elect_source', 'elect_sec', 'processed_linens'],
  selectMultipleAttributeNames_(
    FACILITY_GENERAL_SEC_ELECTRICITY_PREFIX,
    FACILITY_GENERAL_SEC_ELECTRICITY_CHOICES
  ),
  selectMultipleAttributeNames_(
    FACILITY_GENERAL_SECURITY_MEASURES6_PREFIX,
    FACILITY_GENERAL_SECURITY_MEASURES6_CHOICES
  ),
  selectMultipleAttributeNames_(
    FACILITY_GENERAL_HOUSEKEEPING_PREFIX,
    FACILITY_GENERAL_HOUSEKEEPING_CHOICES
  )
);

assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Facility General',
  FACILITY_GENERAL_INFRA_EVIDENCE_DESTS,
  'Infrastructure'
);

assignMappedLabels_(
  FQA_HSS_BUILDING_BLOCK_MAP,
  'Facility General',
  FACILITY_GENERAL_INFRA_EVIDENCE_DESTS,
  'Infrastructure'
);

assignMappedLabelEntries_(FQA_ATTRIBUTE_NAME_MAP, 'Facility General', {
  two_doors: 'Two doors present',
  access_ramp: 'Ramp present',
  access_via_road: 'Road-accessible',
  service_charter: 'Service charter displayed',
  dis_charter: 'GRM displayed',
  vis_signage: 'Quality of facility signage',
  licence: 'Licence current',
  main_elec_source: 'Primary electricity source',
  elect_source: 'Other – text',
  other_primary_elec: 'Backup electricity present',
  sec_electricity_generator: 'Backup electrical: Generator (fuel or battery)',
  sec_electricity_solar_system: 'Backup electrical: Solar system',
  sec_electricity_other_specify: 'Backup electrical: Other (specify)',
  elect_sec: 'Other – text',
  elec_available: 'Continuous electricity',
  suff_sockets: 'Sockets adequate',
  maintenance_unit6: 'Maintenance capacity',
  maintencance_log: 'Maintenance log used',
  processed_linens: 'Linen-processing method',
  working_machine: 'Washing machine functional',
  secure_storage6: 'Staff storage secure',
  feedback_mechanism: 'Feedback mechanism functional',
  dedicated_office6: 'Complaints office',
  ethics_committee: 'Ethics committee active',
  security_measures6_security_guards_or_watchmen_at_all_times:
    'Security measure: Security guards / watchmen at all times',
  security_measures6_perimeter_wall_around_the_facility:
    'Security measure: Perimeter wall around the facility',
  security_measures6_twenty_four_hours_surveillance_cctv:
    'Security measure: 24-hour CCTV surveillance',
  security_measures6_none: 'Security measure: None',
  cleaning_protocol: 'Cleaning protocol known',
  housekeeping_eyewear_or_goggles: 'Housekeeping PPE: Eyewear / goggles',
  housekeeping_facemask: 'Housekeeping PPE: Facemask',
  housekeeping_utility_gloves: 'Housekeeping PPE: Utility gloves',
  housekeeping_plastic_apron: 'Housekeeping PPE: Plastic apron',
  housekeeping_gumboots: 'Housekeeping PPE: Gumboots',
  housekeeping_head_gear: 'Housekeeping PPE: Head gear',
  housekeeping_none: 'Housekeeping PPE: None',
});

// record parent is not a dest.
const FACILITY_GENERAL_NATIONAL_DATA_EVIDENCE_DESTS = FACILITY_GENERAL_NATIONAL_DATA_YES_NO_FIELDS.concat(
  selectMultipleAttributeNames_(
    FACILITY_GENERAL_RECORD_PREFIX,
    FACILITY_GENERAL_RECORD_CHOICES
  ),
  ['mpdr_committee2']
);

assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Facility General',
  FACILITY_GENERAL_NATIONAL_DATA_EVIDENCE_DESTS,
  'National data collection'
);

assignMappedLabels_(
  FQA_HSS_BUILDING_BLOCK_MAP,
  'Facility General',
  FACILITY_GENERAL_NATIONAL_DATA_EVIDENCE_DESTS,
  'Health Information System'
);

assignMappedLabelEntries_(FQA_ATTRIBUTE_NAME_MAP, 'Facility General', {
  upload_data2: 'KHIS upload capacity present',
  record_computer_storage_space:
    'Data-protection component present: Computer storage space',
  record_computers_with_passwords_designated_for_health_record_use:
    'Data-protection component present: Computers with passwords for health records',
  record_inter_connectivity_inter_operability_system:
    'Data-protection component present: Interoperability system',
  record_data_repository:
    'Data-protection component present: Data repository (centralised)',
  record_internet_connection_or_airtime:
    'Data-protection component present: Internet connection / airtime',
  record_standard_operating_procedures:
    'Data-protection component present: Standard operating procedures',
  record_offline_capability_system_for_data_entry:
    'Data-protection component present: Offline data-entry capability',
  record_none: 'Data-protection component present: None',
  mpdr_committee2: 'How often MPDSR committee meets',
  standard_hours: 'Data-management SOPs present',
});

// systems_place parent is not a dest.
const FACILITY_GENERAL_SERVICES_EVIDENCE_DESTS = FACILITY_GENERAL_SERVICES_YES_NO_FIELDS.concat(
  selectMultipleAttributeNames_(
    FACILITY_GENERAL_SYSTEMS_PLACE_PREFIX,
    FACILITY_GENERAL_SYSTEMS_PLACE_CHOICES
  )
);

assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Facility General',
  FACILITY_GENERAL_SERVICES_EVIDENCE_DESTS,
  'Services offered'
);

assignMappedLabels_(
  FQA_HSS_BUILDING_BLOCK_MAP,
  'Facility General',
  FACILITY_GENERAL_SERVICES_EVIDENCE_DESTS,
  'Service Delivery'
);

assignMappedLabelEntries_(FQA_ATTRIBUTE_NAME_MAP, 'Facility General', {
  functional_ambulance: 'Emergency transport available',
  unable_to_transport: 'Transport never failed in past month',
  network_facility: 'Referral network list current',
  standardized_forms: 'Standardised referral form',
  reliable_communication: 'Communication functional',
  formal_agreement: 'Referral protocols & feedback',
  systems_place_clients_who_are_visually_impaired:
    'Communication for: Clients who are visually impaired',
  systems_place_clients_who_are_speech_impaired:
    'Communication for: Clients who are speech impaired',
  systems_place_clients_who_are_hearing_impaired:
    'Communication for: Clients who are hearing impaired',
  systems_place_clients_who_are_mentally_challenged:
    'Communication for: Clients who are mentally challenged',
  systems_place_none: 'Communication for: None',
});

// sterlization_place and oth_source parents are not dests.
// specify_main and specify_oth_source are text (no FQA Scores
// rows). oth_source dests follow form choice codes, not the
// listed 10/11 remumbering.
const FACILITY_GENERAL_WASH_EVIDENCE_DESTS = FACILITY_GENERAL_WASH_YES_NO_FIELDS.concat(
  ['dis_sharps', 'dispose_medwast', 'designated_cleaning'],
  FACILITY_GENERAL_WASH_AVAIL_FIELDS,
  selectMultipleAttributeNames_(
    FACILITY_GENERAL_STERLIZATION_PLACE_PREFIX,
    FACILITY_GENERAL_STERLIZATION_PLACE_CHOICES
  ),
  ['main_source', 'specify_main'],
  selectMultipleAttributeNames_(
    FACILITY_GENERAL_OTH_SOURCE_PREFIX,
    FACILITY_GENERAL_OTH_SOURCE_CHOICES
  ),
  ['specify_oth_source', 'soiled_linen_pro', 'contact_patient'],
  FACILITY_GENERAL_SURFACE_CLEAN_FIELDS,
  ['table_tops']
);

assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Facility General',
  FACILITY_GENERAL_WASH_EVIDENCE_DESTS,
  'WASH (Water, Sanitation, Hygeine)/IPC'
);

assignMappedLabels_(
  FQA_HSS_BUILDING_BLOCK_MAP,
  'Facility General',
  FACILITY_GENERAL_WASH_EVIDENCE_DESTS,
  'Service Delivery'
);

assignMappedLabelEntries_(FQA_ATTRIBUTE_NAME_MAP, 'Facility General', {
  ipc_committee: 'IPC committee functional',
  dis_sharps: 'Method of sharps waste disposal',
  inci_avail_funct: 'Incinerator functional today',
  inci_petrol: 'Incinerator fuel available today',
  dispose_medwast: 'Method of red/yellow waste disposal',
  designated_cleaning: 'Designated cleaning area exists',
  control_traffic: 'Traffic-flow mechanism present',
  three_bucket: 'Three-bucket method possible',
  sop_instrument: 'Instrument-processing SOP present',
  chlorine: 'Disinfectant availability: Chlorine availability',
  enzymatic_sol: 'Disinfectant availability: Enzymatic solution availability',
  glutaraldehyde: 'Disinfectant availability: Glutaraldehyde (Cidex) availability',
  formaldehyde: 'Disinfectant availability: Formaldehyde / formalin availability',
  ethylene_oxide: 'Disinfectant availability: Ethylene oxide availability',
  alcohol: 'Disinfectant availability: Alcohol (spirit) 60–90% availability',
  chlorine_exidine:
    'Disinfectant availability: Chlorhexidine gluconate / hibitane / iodine availability',
  central_steril: 'CSSD present',
  sterlization_place_containers_for_high_level_disinfection:
    'Sterilization equipment: Containers for high-level disinfection',
  sterlization_place_electric_autoclave:
    'Sterilization equipment: Electric autoclave (steam sterilizer)',
  sterlization_place_dry_heat_sterilizer:
    'Sterilization equipment: Dry heat sterilizer (e.g. hot-air oven)',
  sterlization_place_eto_ethylene_oxide_sterilizer:
    'Sterilization equipment: E.T.O. (ethylene oxide) sterilizer',
  sterlization_place_not_applicable_for_this_facility:
    'Sterilization equipment: Not applicable',
  safe_water: 'Safe drinking water available',
  func_water_source: 'Non-drinking water source',
  main_source: 'Primary water source type',
  specify_main: 'Other main source – text',
  oth_source_main_public_supply: 'Other water source: Main public supply',
  oth_source_tubewell_or_borehole: 'Other water source: Tubewell / borehole',
  oth_source_protected_dug_well: 'Other water source: Protected dug well',
  oth_source_unprotected_dug_well: 'Other water source: Unprotected dug well',
  oth_source_protected_spring_water: 'Other water source: Protected spring water',
  oth_source_rainwater_collection: 'Other water source: Rainwater collection',
  oth_source_cart_w_small_tank_drum: 'Other water source: Cart with small tank/drum',
  oth_source_tanker_truck: 'Other water source: Tanker truck',
  oth_source_surface_water: 'Other water source: Surface water',
  oth_source_other_specify: 'Other water source: Other (specify)',
  oth_source_no_water_source: 'Other water source: No water source',
  specify_oth_source: 'Other water source – text',
  soiled_linen_pro: 'How soiled linen is processed',
  contact_patient: 'How patient-contact surfaces with body fluids are cleaned',
  equipment_cleaned: 'How equipment is cleaned',
  floors: 'Frequency of cleaning: Floors / hallways mopping frequency',
  sinks: 'Frequency of cleaning: Sinks scrubbing frequency',
  bathrooms: 'Frequency of cleaning: Bathrooms/toilets/latrines cleaning frequency',
  sche_bathrooms: 'Cleaning schedule observed',
  table_tops: 'Frequency of cleaning: Table tops & legs cleaning frequency',
});

function thematicAreaFor_(department, attribute) {
  return lookupMappedLabel_(FQA_THEMATIC_AREA_MAP, department, attribute);
}

function hssBuildingBlockFor_(department, attribute) {
  return lookupMappedLabel_(FQA_HSS_BUILDING_BLOCK_MAP, department, attribute);
}

function attributeNameFor_(department, attribute) {
  return lookupMappedLabel_(FQA_ATTRIBUTE_NAME_MAP, department, attribute);
}

function isBlankScoreCell_(value) {
  return value === '' || value === undefined || value === null;
}

function normalizeHeaderKey_(name) {
  return String(name == null ? '' : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function normalizeMatchText_(value) {
  return String(value == null ? '' : value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/sub[-\s]*county/g, 'subcounty')
    .replace(/health\s+center/g, 'health centre')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countyKey_(value) {
  // Muranga, Murang'a, and Murang'a County are the same county.
  return normalizeMatchText_(
    String(value == null ? '' : value).replace(/['\u2018\u2019`]/g, '')
  )
    .replace(/\bcounty\b/g, '')
    .replace(/\s+/g, '')
    .trim();
}

function facilityLevelKey_(value) {
  const text = String(value == null ? '' : value).toLowerCase();
  const labeled = text.match(/level\s*([2-6])/);
  if (labeled) return labeled[1];
  const bare = text.match(/\b([2-6])\b/);
  return bare ? bare[1] : '';
}

function canonicalizeFacilityToken_(token) {
  let best = token;
  let bestSim = 0.8;
  FQA_FACILITY_CANONICAL_TOKENS.forEach(function (canon) {
    const similarity = levenshteinSimilarity_(token, canon);
    if (similarity >= bestSim) {
      best = canon;
      bestSim = similarity;
    }
  });
  return best;
}

function facilityTokens_(value) {
  const stop = { the: true, of: true, and: true, at: true };
  return normalizeMatchText_(value).split(' ').filter(function (token) {
    return token && !stop[token];
  }).map(canonicalizeFacilityToken_);
}

function distinctiveFacilityTokens_(value) {
  const generic = {
    hospital: true,
    referral: true,
    teaching: true,
    county: true,
    subcounty: true,
    health: true,
    centre: true,
    center: true,
    dispensary: true,
    clinic: true,
    medical: true,
    mission: true,
    district: true,
    level: true,
    model: true,
    maternity: true,
  };
  return facilityTokens_(value).filter(function (token) {
    return !generic[token] && !/^[0-9]+$/.test(token);
  });
}

function levenshteinDistance_(left, right) {
  const a = String(left || '');
  const b = String(right || '');
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const prev = [];
  const curr = [];
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      const insertion = curr[j - 1] + 1;
      const deletion = prev[j] + 1;
      const substitution = prev[j - 1] + cost;
      curr[j] = Math.min(insertion, deletion, substitution);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

function levenshteinSimilarity_(left, right) {
  const a = normalizeMatchText_(left);
  const b = normalizeMatchText_(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const distance = levenshteinDistance_(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

function tokenJaccard_(leftTokens, rightTokens) {
  if (!leftTokens.length || !rightTokens.length) return 0;
  const counts = {};
  rightTokens.forEach(function (token) {
    counts[token] = (counts[token] || 0) + 1;
  });
  let inter = 0;
  leftTokens.forEach(function (token) {
    if (counts[token]) {
      inter += 1;
      counts[token] -= 1;
    }
  });
  return inter / (leftTokens.length + rightTokens.length - inter);
}

function sharesFacilityTypeToken_(left, right) {
  const types = {
    hospital: true,
    dispensary: true,
    clinic: true,
    centre: true,
    center: true,
  };
  const rightSet = {};
  facilityTokens_(right).forEach(function (token) {
    rightSet[token] = true;
  });
  return facilityTokens_(left).some(function (token) {
    return types[token] && rightSet[token];
  });
}

function facilityNameSimilarity_(left, right) {
  const a = normalizeMatchText_(left);
  const b = normalizeMatchText_(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const jaccard = tokenJaccard_(facilityTokens_(left), facilityTokens_(right));
  const distinctiveLeft = distinctiveFacilityTokens_(left);
  const distinctiveRight = distinctiveFacilityTokens_(right);
  let distinctive = 0;
  if (distinctiveLeft.length && distinctiveRight.length) {
    if (distinctiveLeft.join(' ') === distinctiveRight.join(' ')) {
      if (jaccard >= 0.45 || sharesFacilityTypeToken_(left, right)) {
        distinctive = 0.92;
      }
    } else {
      distinctive = tokenJaccard_(distinctiveLeft, distinctiveRight);
    }
  }
  let score = Math.max(jaccard, distinctive, levenshteinSimilarity_(left, right));
  if (
    (a.indexOf(b) !== -1 || b.indexOf(a) !== -1) &&
    distinctiveLeft.length &&
    distinctiveRight.length
  ) {
    score = Math.max(score, 0.9);
  }
  return score;
}

function detectFacilityReferenceColumns_(headers) {
  const normalized = (headers || []).map(normalizeHeaderKey_);
  function find(aliases) {
    for (let i = 0; i < aliases.length; i++) {
      const idx = normalized.indexOf(aliases[i]);
      if (idx !== -1) return idx;
    }
    return -1;
  }
  return {
    county: find(['county']),
    subcounty: find(['subcounty', 'sub_county', 'sub_county_name']),
    facility: find(['facility_name', 'facility', 'name']),
    facility_code: find([
      'dhis_code',
      'facility_code',
      'mfl_code',
      'mfl',
      'code',
    ]),
    facility_level: find([
      'facility_level',
      'keph_level',
      'level',
    ]),
  };
}

function parseFacilityReferenceRows_(values) {
  const rows = [];
  if (!values || values.length < 2) return rows;
  const cols = detectFacilityReferenceColumns_(values[0]);
  if (cols.facility < 0) return rows;
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row) continue;
    const facility = cellAt_(row, cols.facility);
    if (isBlankScoreCell_(facility)) continue;
    rows.push({
      county: cellAt_(row, cols.county),
      subcounty: cellAt_(row, cols.subcounty),
      facility: facility,
      facility_code: cellAt_(row, cols.facility_code),
      facility_level: cellAt_(row, cols.facility_level),
    });
  }
  return rows;
}

function isHighFacilityMatch_(query, candidate, similarity) {
  if (similarity < FQA_FACILITY_MATCH_MIN) return false;
  const qCounty = countyKey_(query.county);
  const cCounty = countyKey_(candidate.county);
  if (!qCounty || !cCounty || qCounty !== cCounty) return false;
  const qLevel = facilityLevelKey_(query.facility_level);
  const cLevel = facilityLevelKey_(candidate.facility_level);
  if (!qLevel || !cLevel || qLevel !== cLevel) return false;
  return true;
}

function findBestFacilityReference_(query, referenceRows) {
  if (!query || isBlankScoreCell_(query.facility) || !referenceRows) {
    return null;
  }
  const matches = [];
  referenceRows.forEach(function (candidate) {
    const similarity = facilityNameSimilarity_(query.facility, candidate.facility);
    if (!isHighFacilityMatch_(query, candidate, similarity)) return;
    matches.push({
      candidate: candidate,
      similarity: similarity,
    });
  });
  if (!matches.length) return null;
  matches.sort(function (a, b) {
    return b.similarity - a.similarity;
  });
  const best = matches[0];
  const bestCode = String(best.candidate.facility_code || '');
  const bestSubcounty = String(best.candidate.subcounty || '');
  for (let i = 1; i < matches.length; i++) {
    const other = matches[i];
    if (other.similarity < best.similarity - 0.02) continue;
    const otherCode = String(other.candidate.facility_code || '');
    const otherSubcounty = String(other.candidate.subcounty || '');
    if (otherCode !== bestCode || otherSubcounty !== bestSubcounty) {
      return null;
    }
  }
  return best.candidate;
}

function enrichFacilityIdentity_(identity, referenceRows, cache) {
  const next = {
    county: identity.county,
    subcounty: identity.subcounty,
    facility: identity.facility,
    facility_code: identity.facility_code,
    facility_level: identity.facility_level,
  };
  const needsCode = isBlankScoreCell_(next.facility_code);
  const needsSubcounty = isBlankScoreCell_(next.subcounty);
  if (!needsCode && !needsSubcounty) return next;
  if (isBlankScoreCell_(next.facility)) return next;
  const key =
    countyKey_(next.county) + '\t' +
    normalizeMatchText_(next.facility) + '\t' +
    facilityLevelKey_(next.facility_level);
  let match = null;
  if (cache && Object.prototype.hasOwnProperty.call(cache, key)) {
    match = cache[key];
  } else {
    match = findBestFacilityReference_(next, referenceRows);
    if (cache) cache[key] = match;
  }
  if (!match) return next;
  if (needsCode && !isBlankScoreCell_(match.facility_code)) {
    next.facility_code = match.facility_code;
  }
  if (needsSubcounty && !isBlankScoreCell_(match.subcounty)) {
    next.subcounty = match.subcounty;
  }
  return next;
}

function buildFqaWeightingScoreLookupFromValues_(values) {
  const lookup = {};
  if (!values || values.length < 2) return lookup;
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row || row.length < 5) continue;
    const department = String(row[0]);
    const variable = String(row[1]);
    const response = row[2];
    const label = row[3];
    const score = row[4];
    if (!lookup[department]) lookup[department] = {};
    if (!lookup[department][variable]) {
      lookup[department][variable] = { byLabel: {}, byResponse: {} };
    }
    const entry = lookup[department][variable];
    if (!isBlankScoreCell_(label)) {
      entry.byLabel[String(label)] = score;
    }
    if (!isBlankScoreCell_(response)) {
      entry.byResponse[String(response)] = score;
    }
  }
  return lookup;
}

function lookupScoredAttribute_(lookup, department, attribute, cellValue) {
  const byDept = lookup[department];
  const entry = byDept && byDept[attribute];
  if (!entry) return null;
  if (isBlankScoreCell_(cellValue)) return null;
  const asString = String(cellValue);
  if (Object.prototype.hasOwnProperty.call(entry.byLabel, asString)) {
    return { score: entry.byLabel[asString] };
  }
  if (Object.prototype.hasOwnProperty.call(entry.byResponse, asString)) {
    return { score: entry.byResponse[asString] };
  }
  return null;
}

function headerIndex_(headers, name) {
  return headers.indexOf(name);
}

function cellAt_(row, idx) {
  if (idx < 0) return '';
  return isBlankScoreCell_(row[idx]) ? '' : row[idx];
}

function appendFqaScoreRowsFromSheetValues_(
  rows,
  department,
  values,
  lookup,
  referenceRows,
  matchCache
) {
  if (!values || values.length < 2) return;
  const headers = values[0].map(function (header) {
    return String(header);
  });
  const countyIdx = headerIndex_(headers, 'county');
  const subcountyIdx = headerIndex_(headers, 'subcounty');
  const facilityIdx = headerIndex_(headers, 'facility');
  const facilityCodeIdx = headerIndex_(headers, 'facility_code');
  const levelIdx = headerIndex_(headers, 'facility_level');
  const scoredCols = [];
  headers.forEach(function (header, idx) {
    if (lookup[department] && lookup[department][header]) {
      scoredCols.push({ attribute: header, idx: idx });
    }
  });
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    if (!row) continue;
    const identity = enrichFacilityIdentity_({
      county: cellAt_(row, countyIdx),
      subcounty: cellAt_(row, subcountyIdx),
      facility: cellAt_(row, facilityIdx),
      facility_code: cellAt_(row, facilityCodeIdx),
      facility_level: cellAt_(row, levelIdx),
    }, referenceRows, matchCache);
    scoredCols.forEach(function (col) {
      const matched = lookupScoredAttribute_(
        lookup,
        department,
        col.attribute,
        row[col.idx]
      );
      if (!matched) return;
      rows.push([
        identity.county,
        identity.subcounty,
        identity.facility,
        identity.facility_code,
        identity.facility_level,
        department,
        thematicAreaFor_(department, col.attribute),
        hssBuildingBlockFor_(department, col.attribute),
        col.attribute,
        attributeNameFor_(department, col.attribute),
        matched.score,
      ]);
    });
  }
}

function buildFqaScoreTableRows_(
  departmentSheets,
  weightingValues,
  facilityReferenceValues
) {
  const lookup = buildFqaWeightingScoreLookupFromValues_(weightingValues);
  const referenceRows = parseFacilityReferenceRows_(facilityReferenceValues);
  const matchCache = {};
  const rows = [];
  (departmentSheets || []).forEach(function (entry) {
    appendFqaScoreRowsFromSheetValues_(
      rows,
      entry.department,
      entry.values,
      lookup,
      referenceRows,
      matchCache
    );
  });
  return rows;
}

function loadFqaWeightingValues_(ss) {
  const sheet = ss.getSheetByName(FQA_WEIGHTING_SHEET_NAME);
  if (sheet && sheet.getLastRow() > 1 && sheet.getLastColumn() > 0) {
    return sheet.getRange(1, 1, sheet.getLastRow(), 5).getValues();
  }
  return [FQA_WEIGHTING_HEADERS].concat(buildFqaWeightingTableRows_({}));
}

function sheetByGid_(ss, gid) {
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    if (String(sheets[i].getSheetId()) === String(gid)) return sheets[i];
  }
  return sheets[0];
}

function loadFacilityReferenceValues_() {
  const ss = SpreadsheetApp.openById(FQA_FACILITY_REFERENCE_SPREADSHEET_ID);
  const sheet = sheetByGid_(ss, FQA_FACILITY_REFERENCE_SHEET_GID);
  if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() < 1) {
    return [];
  }
  return sheet.getRange(
    1,
    1,
    sheet.getLastRow(),
    sheet.getLastColumn()
  ).getValues();
}

function collectDepartmentSheetValues_(ss) {
  return FORM_CONFIG.map(function (form) {
    const sheet = ss.getSheetByName(form.sheetName);
    if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() < 1) {
      return { department: form.sheetName, values: [] };
    }
    return {
      department: form.sheetName,
      values: sheet.getRange(
        1,
        1,
        sheet.getLastRow(),
        sheet.getLastColumn()
      ).getValues(),
    };
  });
}

function writeFqaScoreRowsToSheet_(sheet, rows) {
  sheet.clearContents();
  ensureSheetCapacity_(sheet, rows.length + 1, FQA_SCORE_HEADERS.length);
  sheet.getRange(1, 1, 1, FQA_SCORE_HEADERS.length)
    .setValues([FQA_SCORE_HEADERS]);
  const CHUNK = 500;
  let offset = 0;
  while (offset < rows.length) {
    const slice = rows.slice(offset, offset + CHUNK);
    sheet.getRange(
      2 + offset,
      1,
      slice.length,
      FQA_SCORE_HEADERS.length
    ).setValues(slice);
    offset += slice.length;
  }
  sheet.setFrozenRows(1);
}

/**
 * Create or refresh the FQA Scores totalling sheet from the department
 * tabs and the FQA Weighting catalog.
 */
function writeFqaScoreTable() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let facilityReferenceValues = [];
  try {
    facilityReferenceValues = loadFacilityReferenceValues_();
  } catch (err) {
    Logger.log(
      'Could not read facility reference spreadsheet: ' +
      err.message +
      (err.stack ? '\n' + err.stack : '')
    );
  }
  const rows = buildFqaScoreTableRows_(
    collectDepartmentSheetValues_(ss),
    loadFqaWeightingValues_(ss),
    facilityReferenceValues
  );
  let sheet = ss.getSheetByName(FQA_SCORE_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(FQA_SCORE_SHEET_NAME);
  writeFqaScoreRowsToSheet_(sheet, rows);
  Logger.log(
    'Wrote ' + rows.length + ' score rows to "' +
    FQA_SCORE_SHEET_NAME + '"'
  );
}
