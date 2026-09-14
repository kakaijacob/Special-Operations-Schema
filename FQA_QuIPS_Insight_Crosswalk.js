/**
 * FQA ↔ QuIPS insight crosswalk
 *
 * Links QuIPS intrapartum observation indicators (what was done at delivery)
 * to FQA resource / protocol / training attributes (what the facility has).
 *
 * Join key: facility_code
 *
 * Insight quadrants (facility × theme):
 *   Enabled & practiced — FQA ready + QuIPS practice strong
 *   Practice gap        — FQA ready + QuIPS practice weak
 *   Adaptive practice   — FQA not ready + QuIPS practice strong
 *   Structural gap      — FQA not ready + QuIPS practice weak
 *   Insufficient data   — too few QuIPS observations or missing FQA
 */

var QUIPS_CLEANED_SHEET_NAME = 'QuIPS Cleaned Data';
var FQA_QUIPS_CROSSWALK_SHEET = 'FQA-QuIPS Crosswalk';
var FQA_QUIPS_FACILITY_INSIGHTS_SHEET = 'FQA-QuIPS Facility Insights';
var FQA_QUIPS_INSIGHT_SUMMARY_SHEET = 'FQA-QuIPS Insight Summary';

var QUIPS_MIN_VALID_FOR_INSIGHT = 3;
var QUIPS_PRACTICE_STRONG = 0.8;
var QUIPS_PRACTICE_WEAK = 0.5;

var QUIPS_INVALID_PRACTICE_VALUES = {
  '': true,
  'unable to observe': true,
  'unable_to_observe': true,
  'not applicable': true,
  'not_applicable': true,
  'resuscitation required': true,
  'not initiated': true,
  'not performed': true,
  'not given': true,
};

/**
 * Analytic themes.
 * QuIPS fields: QuIPS_data_transformation.md cleaned columns.
 * FQA attributes: transformed department-sheet column names.
 */
var FQA_QUIPS_INSIGHT_THEMES = [
  {
    id: 'hand_hygiene',
    name: 'Hand hygiene before / at delivery',
    insight_question:
      'Is hand hygiene observed during birth preparation, and does the maternity unit have hand-hygiene resources, protocols, and IPC training?',
    quips_section: 'Birth preparedness',
    quips_indicators: [
      {
        field: 'hand_hygiene',
        label: 'Provider performed hand hygiene',
        positive: ['yes'],
      },
    ],
    fqa_enablers: [
      {
        department: 'Inpatient Maternity',
        attribute: 'wash_hand_washing',
        thematic_area: 'WASH (Water, Sanitation, Hygeine)/IPC',
        label: 'Hand hygiene present in service areas',
        readiness_kind: 'hand_hygiene_coverage',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'wash_disposable_towels',
        thematic_area: 'WASH (Water, Sanitation, Hygeine)/IPC',
        label: 'Hand hygiene supplies in service areas',
        readiness_kind: 'hand_hygiene_coverage',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'wash_source',
        thematic_area: 'WASH (Water, Sanitation, Hygeine)/IPC',
        label: 'Functional water source',
        readiness_kind: 'water_source',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'wash_water_freq',
        thematic_area: 'WASH (Water, Sanitation, Hygeine)/IPC',
        label: 'Water consistent (past 3 months)',
        readiness_kind: 'yes_no',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'wash_station',
        thematic_area: 'WASH (Water, Sanitation, Hygeine)/IPC',
        label: 'Hand-wash station near latrines',
        readiness_kind: 'yes_no',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'handwashing_sop',
        thematic_area: 'Standard operating procedures/Protocols',
        label: 'Handwashing protocol',
        readiness_kind: 'protocol',
      },
      {
        department: 'Inpatient Maternity',
        attribute:
          'sop_policy_a_standard_infection_prevention_control_and_precautions_for_transmission',
        thematic_area: 'Standard operating procedures/Protocols',
        label: 'IPC precautions protocol present',
        readiness_kind: 'yes_no',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'training_ipc',
        thematic_area: 'Training',
        label: 'IPC training date on record',
        readiness_kind: 'has_value',
      },
      {
        department: 'Facility General',
        attribute: 'ipc_committee',
        thematic_area: 'WASH (Water, Sanitation, Hygeine)/IPC',
        label: 'Facility IPC committee',
        readiness_kind: 'yes_no',
      },
      {
        department: 'Facility General',
        attribute: 'safe_water',
        thematic_area: 'WASH (Water, Sanitation, Hygeine)/IPC',
        label: 'Safe water available',
        readiness_kind: 'yes_no',
      },
      {
        department: 'Facility General',
        attribute: 'func_water_source',
        thematic_area: 'WASH (Water, Sanitation, Hygeine)/IPC',
        label: 'Functional water source (facility)',
        readiness_kind: 'yes_no',
      },
    ],
  },

  {
    id: 'ppe_gloves',
    name: 'PPE / gloves at delivery',
    insight_question:
      'Are gloves used during birth preparation, and are gloves / masks / aprons available in the labour ward?',
    quips_section: 'Birth preparedness',
    quips_indicators: [
      {
        field: 'ppe_gloves',
        label: 'Gloves worn',
        positive: ['yes'],
      },
    ],
    fqa_enablers: [
      {
        department: 'Inpatient Maternity',
        attribute: 'latex_gloves',
        thematic_area: 'Commodities',
        label: 'Latex gloves availability',
        readiness_kind: 'availability',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'sterile_gloves',
        thematic_area: 'Commodities',
        label: 'Sterile gloves availability',
        readiness_kind: 'availability',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'masks',
        thematic_area: 'Commodities',
        label: 'Masks (PPE) availability',
        readiness_kind: 'availability',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'aprons',
        thematic_area: 'Commodities',
        label: 'Aprons availability',
        readiness_kind: 'availability',
      },
    ],
  },

  {
    id: 'uterotonic_amtsl',
    name: 'Uterotonic readiness and timely AMTSL',
    insight_question:
      'Is a uterotonic prepared and given within 1 minute of birth, and does maternity stock uterotonics with a PPH protocol?',
    quips_section: 'Birth preparedness + Technical quality',
    quips_indicators: [
      {
        field: 'uterotonic_preparation',
        label: 'Uterotonic prepared before delivery',
        positive: ['yes'],
      },
      {
        field: 'timely_uterotonic_administration',
        label: 'Uterotonic within 1 minute of birth',
        positive: ['yes'],
      },
    ],
    fqa_enablers: [
      {
        department: 'Inpatient Maternity',
        attribute: 'oxytocin',
        thematic_area: 'Commodities',
        label: 'Oxytocin availability',
        readiness_kind: 'availability',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'hsc',
        thematic_area: 'Commodities',
        label: 'Heat-stable carbetocin availability',
        readiness_kind: 'availability',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'misoprostol',
        thematic_area: 'Commodities',
        label: 'Misoprostol availability',
        readiness_kind: 'availability',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'tranexamic',
        thematic_area: 'Commodities',
        label: 'Tranexamic acid availability',
        readiness_kind: 'availability',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'pph_sop',
        thematic_area: 'Standard operating procedures/Protocols',
        label: 'PPH protocol / job-aid',
        readiness_kind: 'protocol',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'sop_policy_a_obstetric_hemorrhage',
        thematic_area: 'Standard operating procedures/Protocols',
        label: 'Obstetric hemorrhage protocol',
        readiness_kind: 'yes_no',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'obstetric_kit',
        thematic_area: 'Equipment',
        label: 'Obstetric hemorrhage kit / trolley',
        readiness_kind: 'availability_or_yes',
      },
    ],
  },

  {
    id: 'newborn_resuscitation_readiness',
    name: 'Newborn resuscitation readiness',
    insight_question:
      'Is NNR equipment prepared before birth, and does the unit have resus kits, resuscitaires, protocols, and NNR training?',
    quips_section: 'Birth preparedness',
    quips_indicators: [
      {
        field: 'nnr_equipment_preparation',
        label: 'NNR equipment prepared',
        positive: ['yes'],
      },
    ],
    fqa_enablers: [
      {
        department: 'Inpatient Maternity',
        attribute: 'resus_kits',
        thematic_area: 'Equipment',
        label: 'NNR kits / trays',
        readiness_kind: 'availability_or_yes',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'resuscitaire',
        thematic_area: 'Equipment',
        label: 'Resuscitaire',
        readiness_kind: 'availability_or_yes',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'ambubags',
        thematic_area: 'Equipment',
        label: 'Ambubags',
        readiness_kind: 'availability_or_yes',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'resuscitation_area',
        thematic_area: 'Infrastructure',
        label: 'Resuscitation area',
        readiness_kind: 'yes_no',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'newborn_mgt_sop',
        thematic_area: 'Standard operating procedures/Protocols',
        label: 'Newborn management / NNR protocol',
        readiness_kind: 'protocol',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'sop_policy_c_neonatal_asphyxia',
        thematic_area: 'Standard operating procedures/Protocols',
        label: 'Neonatal asphyxia protocol',
        readiness_kind: 'yes_no',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'training_nnr',
        thematic_area: 'Training',
        label: 'NNR training date',
        readiness_kind: 'has_value',
      },
      {
        department: 'Newborn Unit',
        attribute: 'neonatal_resuscitation_sop',
        thematic_area: 'Standard operating procedures/Protocols',
        label: 'NBU resus protocol displayed',
        readiness_kind: 'protocol',
      },
    ],
  },

  {
    id: 'essential_newborn_care',
    name: 'Essential newborn care after birth',
    insight_question:
      'Are drying, warmth, sterile cord care, Vitamin K, skin-to-skin, and breastfeeding initiation observed, and are related commodities / ENC protocols in place?',
    quips_section: 'Technical quality following delivery',
    quips_indicators: [
      {
        field: 'drying_stimulation',
        label: 'Immediate drying / stimulation',
        positive: ['yes'],
      },
      {
        field: 'newborn_kept_warm',
        label: 'Newborn kept warm',
        positive: ['yes'],
      },
      {
        field: 'sterilized_blade_clamp',
        label: 'Sterile blade / clamp used',
        positive: ['yes'],
      },
      {
        field: 'administer_vitamin_k',
        label: 'Vitamin K administered',
        positive: ['yes'],
      },
      {
        field: 'provider_initiate_breastfeeding',
        label: 'Provider initiated breastfeeding',
        positive: ['yes'],
      },
      {
        field: 'skin_to_skin',
        label: 'Skin-to-skin initiated',
        positive: ['yes'],
      },
    ],
    fqa_enablers: [
      {
        department: 'Inpatient Maternity',
        attribute: 'vit_k',
        thematic_area: 'Commodities',
        label: 'Vitamin K injection',
        readiness_kind: 'availability',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'chlorhexidine',
        thematic_area: 'Commodities',
        label: 'Chlorhexidine 7.1% (cord)',
        readiness_kind: 'availability',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'towels',
        thematic_area: 'Equipment',
        label: 'Clean towels',
        readiness_kind: 'availability_or_yes',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'sop_policy_c_essential_newborn_care',
        thematic_area: 'Standard operating procedures/Protocols',
        label: 'Essential newborn care protocol',
        readiness_kind: 'yes_no',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'sop_policy_a_breastfeeding',
        thematic_area: 'Standard operating procedures/Protocols',
        label: 'Breastfeeding protocol',
        readiness_kind: 'yes_no',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'training_breastfeeding',
        thematic_area: 'Training',
        label: 'Breastfeeding training date',
        readiness_kind: 'has_value',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'training_newborn_care',
        thematic_area: 'Training',
        label: 'Essential newborn care training date',
        readiness_kind: 'has_value',
      },
      {
        department: 'Newborn Unit',
        attribute: 'handwash_sop',
        thematic_area: 'Standard operating procedures/Protocols',
        label: 'NBU handwashing protocol',
        readiness_kind: 'protocol',
      },
    ],
  },

  {
    id: 'infection_prevention_postbirth',
    name: 'Post-birth infection prevention (sharps / waste)',
    insight_question:
      'Are sharps and waste disposed correctly after delivery, and does maternity have sharps containers, waste protocols, and IPC systems?',
    quips_section: 'Post-birth infection prevention',
    quips_indicators: [
      {
        field: 'sharps_disposal',
        label: 'Sharps disposed safely',
        positive: ['yes'],
      },
      {
        field: 'waste_disposal',
        label: 'Waste disposed correctly',
        positive: ['yes'],
      },
    ],
    fqa_enablers: [
      {
        department: 'Inpatient Maternity',
        attribute: 'wash_sharp',
        thematic_area: 'WASH (Water, Sanitation, Hygeine)/IPC',
        label: 'Sharps containers in all areas',
        readiness_kind: 'yes_no',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'wash_visible',
        thematic_area: 'WASH (Water, Sanitation, Hygeine)/IPC',
        label: 'Sharps containers <3/4 full',
        readiness_kind: 'yes_no',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'wash_disposal',
        thematic_area: 'WASH (Water, Sanitation, Hygeine)/IPC',
        label: 'Waste protocol displayed',
        readiness_kind: 'yes_no',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'wash_leak_proof',
        thematic_area: 'WASH (Water, Sanitation, Hygeine)/IPC',
        label: 'Leak-proof / colour-coded waste bins',
        readiness_kind: 'yes_no',
      },
      {
        department: 'Inpatient Maternity',
        attribute:
          'sop_policy_d_handling_and_processing_of_contaminated_materials_and_infectious_waste',
        thematic_area: 'Standard operating procedures/Protocols',
        label: 'Infectious waste handling policy',
        readiness_kind: 'yes_no',
      },
      {
        department: 'Facility General',
        attribute: 'dis_sharps',
        thematic_area: 'WASH (Water, Sanitation, Hygeine)/IPC',
        label: 'Facility sharps disposal system',
        readiness_kind: 'availability_or_yes',
      },
    ],
  },

  {
    id: 'maternal_monitoring',
    name: 'Maternal vital signs after birth',
    insight_question:
      'Are maternal BP, temperature, and pulse taken after birth, and does the unit have monitoring equipment plus intrapartum protocols?',
    quips_section: 'Technical quality following delivery',
    quips_indicators: [
      {
        field: 'take_mother_bp',
        label: 'Maternal BP taken',
        positive: ['yes'],
      },
      {
        field: 'take_mother_temperature',
        label: 'Maternal temperature taken',
        positive: ['yes'],
      },
      {
        field: 'take_mother_pulse',
        label: 'Maternal pulse taken',
        positive: ['yes'],
      },
    ],
    fqa_enablers: [
      {
        department: 'Inpatient Maternity',
        attribute: 'bp_apparatus',
        thematic_area: 'Equipment',
        label: 'BP apparatus',
        readiness_kind: 'availability_or_yes',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'thermometers',
        thematic_area: 'Equipment',
        label: 'Thermometers',
        readiness_kind: 'availability_or_yes',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'stethoscopes',
        thematic_area: 'Equipment',
        label: 'Stethoscopes',
        readiness_kind: 'availability_or_yes',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'intrapartum_sop',
        thematic_area: 'Standard operating procedures/Protocols',
        label: 'Intrapartum care protocol',
        readiness_kind: 'protocol',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'vital_signs_adherence',
        thematic_area: 'Adherence to evidence based practice',
        label: 'Vital signs adherence (FQA)',
        readiness_kind: 'availability_or_yes',
      },
    ],
  },

  {
    id: 'labour_monitoring',
    name: 'Labour monitoring (partograph / LCG)',
    insight_question:
      'Is the partograph or labour care guide used, and does FQA show labour-care-guide adherence, partograph records, and monitoring equipment?',
    quips_section: 'Partograph / Labour care guide review',
    quips_indicators: [
      {
        field: 'partogragh_initiation',
        label: 'Partograph initiated',
        positive: ['yes'],
      },
      {
        field: 'lcg_initiated_correct',
        label: 'Labour care guide initiated correctly',
        positive: ['yes'],
      },
    ],
    fqa_enablers: [
      {
        department: 'Inpatient Maternity',
        attribute: 'labour_care_guide',
        thematic_area: 'Adherence to evidence based practice',
        label: 'Labour care guide used (FQA)',
        readiness_kind: 'availability_or_yes',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'health_records_patient_file_partograph',
        thematic_area: 'Health Records for clients',
        label: 'Partograph in patient file',
        readiness_kind: 'yes_no',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'fetoscopes',
        thematic_area: 'Equipment',
        label: 'Fetoscopes available',
        readiness_kind: 'has_value',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'doppler',
        thematic_area: 'Equipment',
        label: 'Foetal doppler available',
        readiness_kind: 'has_value',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'intrapartum_sop',
        thematic_area: 'Standard operating procedures/Protocols',
        label: 'Intrapartum care protocol',
        readiness_kind: 'protocol',
      },
    ],
  },

  {
    id: 'respectful_maternity_care',
    name: 'Respectful maternity care / birth companion',
    insight_question:
      'Is a birth companion present and respectful care observed, and does FQA allow companions with RMC policies and training?',
    quips_section: 'Respectful maternity care',
    quips_indicators: [
      {
        field: 'birth_companion',
        label: 'Birth companion present',
        positive: ['yes'],
      },
      {
        field: 'spoken_to_kindly',
        label: 'Mother spoken to kindly',
        positive: ['yes', 'always'],
      },
      {
        field: 'rmc_no_disrespect_to_mother',
        label: 'No disrespect / abuse observed',
        positive: ['yes'],
      },
    ],
    fqa_enablers: [
      {
        department: 'Inpatient Maternity',
        attribute: 'companion_support',
        thematic_area: 'Adherence to evidence based practice',
        label: 'Birth companions allowed',
        readiness_kind: 'availability_or_yes',
      },
      {
        department: 'Inpatient Maternity',
        attribute:
          'sop_policy_d_companion_of_choice_during_labour_childbirth_and_immediate_postnatal_period',
        thematic_area: 'Standard operating procedures/Protocols',
        label: 'Companion-of-choice policy',
        readiness_kind: 'yes_no',
      },
      {
        department: 'Inpatient Maternity',
        attribute:
          'sop_policy_d_zero_tolerance_non_discriminatory_policy_against_mistreatment',
        thematic_area: 'Standard operating procedures/Protocols',
        label: 'Anti-mistreatment policy',
        readiness_kind: 'yes_no',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'training_rmc',
        thematic_area: 'Training',
        label: 'RMC training date',
        readiness_kind: 'has_value',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'training_companion',
        thematic_area: 'Training',
        label: 'Birth companion training date',
        readiness_kind: 'has_value',
      },
    ],
  },

  {
    id: 'avoid_harmful_practices',
    name: 'Avoidance of harmful practices',
    insight_question:
      'Are harmful practices avoided during labour/delivery, and does FQA have a harmful-practices protocol plus related training?',
    quips_section: 'Avoidance of harmful practices',
    quips_indicators: [
      {
        field: 'fundal_pressure',
        label: 'No fundal pressure (good = No)',
        positive: ['no'],
      },
      {
        field: 'perineum_stretching',
        label: 'No perineum stretching (good = No)',
        positive: ['no'],
      },
      {
        field: 'newborn_slapped',
        label: 'Newborn not slapped (good = No)',
        positive: ['no'],
      },
      {
        field: 'newborn_upside_down',
        label: 'Newborn not held upside down (good = No)',
        positive: ['no'],
      },
    ],
    fqa_enablers: [
      {
        department: 'Inpatient Maternity',
        attribute:
          'sop_policy_a_harmful_practices_and_unnecessary_interventions_during_labour_childbirth_and_the_early_postnatal_period',
        thematic_area: 'Standard operating procedures/Protocols',
        label: 'Harmful practices protocol',
        readiness_kind: 'yes_no',
      },
      {
        department: 'Inpatient Maternity',
        attribute: 'training_harmful_practices',
        thematic_area: 'Training',
        label: 'Harmful practices training date',
        readiness_kind: 'has_value',
      },
    ],
  },
];

// ---------- pure helpers (unit-tested) ----------

function normalizeInsightText_(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ');
}

function isValidQuipsPracticeValue_(value) {
  var v = normalizeInsightText_(value);
  return !QUIPS_INVALID_PRACTICE_VALUES[v];
}

/** 1 = good practice, 0 = valid but not good, null = invalid / unobserved. */
function scoreQuipsIndicatorResponse_(indicator, value) {
  if (!isValidQuipsPracticeValue_(value)) return null;
  var v = normalizeInsightText_(value);
  var positives = (indicator.positive || ['yes']).map(normalizeInsightText_);
  return positives.indexOf(v) !== -1 ? 1 : 0;
}

function aggregateQuipsPractice_(theme, rows) {
  var scored = 0;
  var good = 0;
  var byField = {};

  (theme.quips_indicators || []).forEach(function (ind) {
    byField[ind.field] = { valid: 0, good: 0 };
  });

  (rows || []).forEach(function (row) {
    (theme.quips_indicators || []).forEach(function (ind) {
      var s = scoreQuipsIndicatorResponse_(ind, row[ind.field]);
      if (s === null) return;
      scored += 1;
      good += s;
      byField[ind.field].valid += 1;
      byField[ind.field].good += s;
    });
  });

  var rate = scored === 0 ? null : good / scored;
  var practiceLevel = 'insufficient_data';
  if (scored >= QUIPS_MIN_VALID_FOR_INSIGHT && rate !== null) {
    if (rate >= QUIPS_PRACTICE_STRONG) practiceLevel = 'strong';
    else if (rate <= QUIPS_PRACTICE_WEAK) practiceLevel = 'weak';
    else practiceLevel = 'mixed';
  }

  return {
    observation_count: (rows || []).length,
    scored_responses: scored,
    good_responses: good,
    practice_rate: rate,
    practice_level: practiceLevel,
    by_field: byField,
  };
}

function classifyFqaReadiness_(readinessKind, value) {
  var v = normalizeInsightText_(value);
  if (!v) return 'unknown';

  switch (readinessKind) {
    case 'yes_no':
      if (v === 'yes') return 'ready';
      if (v === 'no') return 'not_ready';
      return 'unknown';

    case 'protocol':
      if (v.indexOf('displayed') !== -1 && v.indexOf('not displayed') === -1) {
        return 'ready';
      }
      if (v.indexOf('written') !== -1 || v.indexOf('not displayed') !== -1) {
        return 'partial';
      }
      if (
        v.indexOf('do not have') !== -1 ||
        v.indexOf('do not') !== -1 ||
        v === 'no'
      ) {
        return 'not_ready';
      }
      return 'unknown';

    case 'availability':
      if (v.indexOf('always') !== -1) return 'ready';
      if (v.indexOf('sometimes') !== -1) return 'partial';
      if (v.indexOf('never') !== -1) return 'not_ready';
      if (v === 'yes') return 'ready';
      if (v === 'no') return 'not_ready';
      return 'unknown';

    case 'availability_or_yes':
      if (
        v === 'yes' ||
        v.indexOf('always') !== -1 ||
        v.indexOf('present, functional') === 0
      ) {
        return 'ready';
      }
      if (v.indexOf('sometimes') !== -1 || v.indexOf('non-functional') !== -1) {
        return 'partial';
      }
      if (
        v === 'no' ||
        v.indexOf('never') !== -1 ||
        v.indexOf('not present') !== -1
      ) {
        return 'not_ready';
      }
      return 'unknown';

    case 'hand_hygiene_coverage':
      if (v.indexOf('all service') !== -1) return 'ready';
      if (v.indexOf('some service') !== -1) return 'partial';
      if (v.indexOf('no service') !== -1 || v.indexOf('not present') !== -1) {
        return 'not_ready';
      }
      return 'unknown';

    case 'water_source':
      if (
        v.indexOf('present, functional') !== -1 ||
        v === 'present functional'
      ) {
        return 'ready';
      }
      if (
        v.indexOf('non-functional') !== -1 ||
        v.indexOf('non functional') !== -1
      ) {
        return 'partial';
      }
      if (v.indexOf('not present') !== -1) return 'not_ready';
      return 'unknown';

    case 'has_value':
      return 'ready';

    default:
      if (v === 'yes') return 'ready';
      if (v === 'no') return 'not_ready';
      return 'unknown';
  }
}

function aggregateFqaReadiness_(theme, fqaValues) {
  var details = [];
  var ready = 0;
  var partial = 0;
  var notReady = 0;
  var unknown = 0;

  (theme.fqa_enablers || []).forEach(function (enabler) {
    var key = enabler.department + '::' + enabler.attribute;
    var raw =
      fqaValues && fqaValues[key] !== undefined ? fqaValues[key] : '';
    var level = classifyFqaReadiness_(enabler.readiness_kind, raw);
    details.push({
      department: enabler.department,
      attribute: enabler.attribute,
      label: enabler.label,
      thematic_area: enabler.thematic_area || '',
      value: raw === null || raw === undefined ? '' : String(raw),
      readiness: level,
    });
    if (level === 'ready') ready += 1;
    else if (level === 'partial') partial += 1;
    else if (level === 'not_ready') notReady += 1;
    else unknown += 1;
  });

  var known = ready + partial + notReady;
  var readinessLevel = 'insufficient_data';
  if (known > 0) {
    var score = (ready + 0.5 * partial) / known;
    if (score >= 0.7) readinessLevel = 'ready';
    else if (score >= 0.4) readinessLevel = 'partial';
    else readinessLevel = 'not_ready';
  }

  return {
    readiness_level: readinessLevel,
    ready_count: ready,
    partial_count: partial,
    not_ready_count: notReady,
    unknown_count: unknown,
    known_count: known,
    details: details,
  };
}

function classifyInsightQuadrant_(fqaLevel, practiceLevel) {
  if (practiceLevel === 'mixed') {
    if (
      fqaLevel === 'ready' ||
      fqaLevel === 'partial' ||
      fqaLevel === 'not_ready'
    ) {
      return 'Mixed practice — review case mix';
    }
    return 'Insufficient data';
  }

  if (
    fqaLevel === 'insufficient_data' ||
    practiceLevel === 'insufficient_data'
  ) {
    return 'Insufficient data';
  }

  var fqaOk = fqaLevel === 'ready' || fqaLevel === 'partial';
  var practiceOk = practiceLevel === 'strong';

  if (fqaOk && practiceOk) return 'Enabled & practiced';
  if (fqaOk && !practiceOk) return 'Practice gap';
  if (!fqaOk && practiceOk) return 'Adaptive practice';
  return 'Structural gap';
}

function buildCrosswalkCatalogRows_() {
  var rows = [];
  FQA_QUIPS_INSIGHT_THEMES.forEach(function (theme) {
    var quipsFields = (theme.quips_indicators || [])
      .map(function (i) {
        return i.field;
      })
      .join(', ');
    (theme.fqa_enablers || []).forEach(function (enabler) {
      rows.push({
        theme_id: theme.id,
        theme_name: theme.name,
        insight_question: theme.insight_question,
        quips_section: theme.quips_section,
        quips_fields: quipsFields,
        fqa_department: enabler.department,
        fqa_thematic_area: enabler.thematic_area || '',
        fqa_attribute: enabler.attribute,
        fqa_attribute_label: enabler.label,
        readiness_kind: enabler.readiness_kind,
      });
    });
  });
  return rows;
}

function buildFacilityThemeInsight_(facilityMeta, theme, quipsRows, fqaValues) {
  var practice = aggregateQuipsPractice_(theme, quipsRows);
  var readiness = aggregateFqaReadiness_(theme, fqaValues);
  var quadrant = classifyInsightQuadrant_(
    readiness.readiness_level,
    practice.practice_level
  );

  var weakEnablers = readiness.details
    .filter(function (d) {
      return d.readiness === 'not_ready' || d.readiness === 'partial';
    })
    .map(function (d) {
      return d.label + ' (' + (d.value || d.readiness) + ')';
    });

  var strongEnablers = readiness.details
    .filter(function (d) {
      return d.readiness === 'ready';
    })
    .map(function (d) {
      return d.label;
    });

  return {
    county: facilityMeta.county || '',
    facility_code: facilityMeta.facility_code || '',
    facility: facilityMeta.facility || '',
    theme_id: theme.id,
    theme_name: theme.name,
    insight_question: theme.insight_question,
    quips_observations: practice.observation_count,
    quips_scored_responses: practice.scored_responses,
    quips_practice_rate:
      practice.practice_rate === null
        ? ''
        : Number(practice.practice_rate.toFixed(3)),
    quips_practice_level: practice.practice_level,
    fqa_readiness_level: readiness.readiness_level,
    fqa_ready_count: readiness.ready_count,
    fqa_partial_count: readiness.partial_count,
    fqa_not_ready_count: readiness.not_ready_count,
    fqa_unknown_count: readiness.unknown_count,
    insight_quadrant: quadrant,
    fqa_ready_enablers: strongEnablers.join('; '),
    fqa_gap_enablers: weakEnablers.join('; '),
  };
}
