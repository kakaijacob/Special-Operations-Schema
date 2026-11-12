/** Operating Theatre transformation and preferred headers. */

/**
 * Apply coded / integer / text / select_multiple fields onto out.
 * Field shape: { source|sources, dest, type, map?, choices?, prefix? }
 * type: yesno | coded | int | text | multi
 */
function assignOperatingTheatreFields_(out, rec, fields) {
  fields.forEach(function (field) {
    const raw = field.sources
      ? firstValue_(rec, field.sources)
      : rec[field.source];
    if (field.type === 'int') {
      out[field.dest] = toIntegerOrBlank_(raw);
    } else if (field.type === 'text') {
      out[field.dest] = flattenCell_(raw);
    } else if (field.type === 'multi') {
      expandSelectMultiple_(
        out,
        raw,
        field.prefix || field.dest,
        field.choices
      );
    } else {
      out[field.dest] = lookupCoded_(raw, field.map || YES_NO_MAP);
    }
  });
}

function operatingTheatreFieldHeaders_(fields) {
  const headers = [];
  fields.forEach(function (field) {
    if (field.type === 'multi') {
      selectMultipleHeaders_(
        field.prefix || field.dest,
        field.choices
      ).forEach(function (h) {
        headers.push(h);
      });
    } else {
      headers.push(field.dest);
    }
  });
  return headers;
}

function markOperatingTheatreSources_(keys, fields) {
  fields.forEach(function (field) {
    if (field.sources) {
      field.sources.forEach(function (source) {
        keys[source] = true;
      });
    } else if (field.source) {
      keys[field.source] = true;
    }
  });
}

/** 1 Always / 2 Sometimes / 3 Never available. */
const OT_ALWAYS_SOMETIMES_NEVER_AVAILABLE_MAP = {
  1: 'Always available',
  2: 'Sometimes available',
  3: 'Never available',
};

/** sop/referral_proto — option 3 wording matches the OT form. */
const OT_REFERRAL_PROTO_MAP = {
  1: 'They have displayed, up to date protocols',
  2: 'They have written up to date protocols, not displayed',
  3: 'They do not have up displayed or written protocols',
};

/** Written-or-displayed SOP questions. 1 / 2 (not 1 / 0). */
const OT_WRITTEN_OR_DISPLAYED_MAP = {
  1: 'Yes (either written or displayed)',
  2: 'No',
};

/** wash/hand_hygiene — option 3 wording is OT-specific. */
const OT_HAND_HYGIENE_MAP = {
  1: 'Present in ALL service areas',
  2: 'Present in some service areas',
  3: 'Present in no service areas',
};

const OT_LATRINE_TYPE_MAP = {
  1: 'Flush/pour flush to piped sewer system, septic tank',
  2: 'Pit latrine (ventilated improved pit latrine (VIP)) with slab',
  3: 'Pit latrine without slab/open pit',
  4: 'Composting toilet',
  5: 'Bucket',
  6: 'Hanging toilet/hanging latrine',
  7: 'Other, specify',
  8: 'None',
};

const OT_CLEAN_FREQ_MAP = {
  1: 'Daily AND as necessary',
  2: 'Daily',
  3: 'ONLY when they are visibly dirty',
  4: 'They are not cleaned routinely with disinfectant solution',
};

const OT_SERVICING_MAP = {
  1: 'At least yearly and as needed',
  2: 'Once per year or less often',
  3: 'Only when they are broken',
  4: 'They are not serviced',
};

const OT_TURNAROUND_MAP = {
  1: '1/2 hour or less',
  2: '31-45 minutes',
  3: '46 min to an hour',
  4: 'Over 1 hour',
};

/** op/hrs_day — keep assessible spelling. */
const OT_HRS_DAY_MAP = {
  1: 'Accessible at all facility open times',
  2: 'Sometimes when the facility is open, but not always',
  3: 'Rarely assessible',
};

/**
 * select_multiple: health_record/cs_forms
 * Columns: cs_forms_<choice_slug> = Yes / No / '' (blank if skipped).
 */
const OT_CS_FORMS_PREFIX = 'cs_forms';
const OT_CS_FORMS_CHOICES = [
  { code: '1', slug: 'anesthesia_charts' },
  { code: '2', slug: 'pacu_monitoring_charts' },
  { code: '3', slug: 'patient_consent_forms' },
  { code: '4', slug: 'post_operative_record' },
  { code: '5', slug: 'safe_surgery_checklist' },
  { code: '6', slug: 'theatre_notes' },
  { code: '7', slug: 'doctors_admission_record' },
  { code: '8', slug: 'post_cs_order_form' },
  { code: '9', slug: 'anesthesia_pre_op_checklist' },
  { code: '10', slug: 'surgical_consumption_report' },
  { code: '11', slug: 'none' },
];

/**
 * select_multiple: infrastructure/theatre_space
 * Columns: theatre_space_<choice_slug> = Yes / No / '' (blank if skipped).
 */
const OT_THEATRE_SPACE_PREFIX = 'theatre_space';
const OT_THEATRE_SPACE_CHOICES = [
  { code: '1', slug: 'reception' },
  { code: '2', slug: 'anesthesia' },
  { code: '3', slug: 'surgery' },
  { code: '4', slug: 'recovery_of_patients' },
  { code: '5', slug: 'none' },
];

/**
 * select_multiple: equipment/bp_cuffs
 * Columns: bp_cuffs_<choice_slug> = Yes / No / '' (blank if skipped).
 */
const OT_BP_CUFFS_PREFIX = 'bp_cuffs';
const OT_BP_CUFFS_CHOICES = [
  { code: '1', slug: 'small' },
  { code: '2', slug: 'medium' },
  { code: '3', slug: 'large' },
  { code: '4', slug: 'none' },
];

/**
 * select_multiple: equipment/lary_blades
 * Columns: lary_blades_<choice_slug> = Yes / No / '' (blank if skipped).
 */
const OT_LARY_BLADES_PREFIX = 'lary_blades';
const OT_LARY_BLADES_CHOICES = [
  { code: '1', slug: 'size_0' },
  { code: '2', slug: 'size_1' },
  { code: '3', slug: 'size_4' },
  { code: '4', slug: 'size_5' },
  { code: '5', slug: 'none' },
];

/**
 * select_multiple: equipment/ett_tubes
 * Columns: ett_tubes_<choice_slug> = Yes / No / '' (blank if skipped).
 */
const OT_ETT_TUBES_PREFIX = 'ett_tubes';
const OT_ETT_TUBES_CHOICES = [
  { code: '1', slug: 'newborn_size_2_5' },
  { code: '2', slug: 'newborn_size_3_0' },
  { code: '3', slug: 'newborn_size_3_5' },
  { code: '4', slug: 'adult_size_6_0' },
  { code: '5', slug: 'adult_size_6_5' },
  { code: '6', slug: 'adult_size_7_0' },
  { code: '7', slug: 'adult_size_7_5' },
  { code: '8', slug: 'none' },
];

/**
 * select_multiple: equipment/pacu_trol
 * Columns: pacu_trol_<choice_slug> = Yes / No / '' (blank if skipped).
 * Keep calcium_gluconamte spelling from the form.
 */
const OT_PACU_TROL_PREFIX = 'pacu_trol';
const OT_PACU_TROL_CHOICES = [
  { code: '1', slug: 'tramadol' },
  { code: '2', slug: 'ketorolac' },
  { code: '3', slug: 'ephedrine_or_adrenaline' },
  { code: '4', slug: 'calcium_gluconamte' },
  { code: '5', slug: 'mgso4' },
  { code: '6', slug: 'sodium_bicarb' },
  { code: '7', slug: 'hydrocortisone' },
  { code: '8', slug: 'oxytocin' },
  { code: '9', slug: 'tranexamic_acid' },
  { code: '10', slug: 'lasix' },
  { code: '11', slug: 'misoprostol' },
  { code: '12', slug: 'naloxone' },
  { code: '13', slug: 'flumazenil' },
  { code: '14', slug: 'various_airways' },
  { code: '15', slug: 'endotracheal_tubes' },
  { code: '16', slug: 'difficult_airway_kit' },
  { code: '17', slug: 'no_trolley_for_emergency_drugs' },
];

/**
 * select_multiple: sec_12/pre_checks
 * Columns: pre_checks_<choice_slug> = Yes / No / '' (blank if skipped).
 */
const OT_PRE_CHECKS_PREFIX = 'pre_checks';
const OT_PRE_CHECKS_CHOICES = [
  { code: '1', slug: 'preoperative_monitoring_of_vital_signs' },
  { code: '2', slug: 'any_allergies_and_administered_preoperative_medication_verified' },
  { code: '3', slug: 'last_oral_intake_is_verified' },
  {
    code: '4',
    slug: 'a_designated_nurse_nurse_in_charge_completes_a_checklist_to_ensure_all_staff_and_equipment_is_ready_for_surgery',
  },
  { code: '5', slug: 'none' },
];

/**
 * select_multiple: sec_12/anaest_doc
 * Columns: anaest_doc_<choice_slug> = Yes / No / '' (blank if skipped).
 */
const OT_ANAEST_DOC_PREFIX = 'anaest_doc';
const OT_ANAEST_DOC_CHOICES = [
  {
    code: '1',
    slug: 'anaesthetic_processes_from_pre_anaesthetic_review_to_reversal_of_anaesthesia_including_any_incidents_that_may_have_occurred',
  },
  { code: '2', slug: 'diagnosis_and_indication_for_surgery' },
  {
    code: '3',
    slug: 'baseline_vital_signs_measurement_blood_pressure_pulse_respiratory_rate',
  },
  { code: '4', slug: 'results_of_pre_op_investigations_done' },
  { code: '5', slug: 'comprehensive_pre_op_physical_examination' },
  { code: '6', slug: 'previous_anaesthetic_exposure_and_surgical_history' },
  {
    code: '7',
    slug: 'medical_history_presence_of_allergies_chronic_illness_or_regular_drug_use',
  },
  {
    code: '8',
    slug: 'airway_assessment_and_examination_assesses_adequacy_of_mouth_chin_jaw_and_neck_for_endotracheal_intubation_if_needed',
  },
  {
    code: '9',
    slug: 'the_anaesthesia_impression_which_includes_the_asa_classification_and_proposed_anaesthetic_technique_to_be_used',
  },
  { code: '10', slug: 'no_documentation_provided' },
];

/**
 * select_multiple: sec_12/anaest_chart
 * Columns: anaest_chart_<choice_slug> = Yes / No / '' (blank if skipped).
 * Keep planed spelling from the form.
 */
const OT_ANAEST_CHART_PREFIX = 'anaest_chart';
const OT_ANAEST_CHART_CHOICES = [
  { code: '1', slug: 'clients_name' },
  { code: '2', slug: 'client_age_or_date_of_birth' },
  { code: '3', slug: 'client_hospital_number' },
  { code: '4', slug: 'diagnosis_and_planed_surgery' },
  {
    code: '5',
    slug: 'name_of_surgeon_anaesthetist_assistant_surgeon_and_scrub_nurse',
  },
  {
    code: '6',
    slug: 'date_and_time_of_start_and_end_of_surgery_and_anaesthesia',
  },
  { code: '7', slug: 'type_of_anaesthesia_given' },
  {
    code: '8',
    slug: 'maternal_vitals_maternal_pulse_blood_pressure_and_spo2_every_15_minutes',
  },
  { code: '9', slug: 'estimated_blood_loss' },
  { code: '10', slug: 'reversal_procedure' },
  { code: '11', slug: 'immediate_post_operative_management' },
  {
    code: '12',
    slug: 'any_drugs_and_iv_fluids_given_during_the_period_they_are_under_anaesthesia',
  },
  { code: '13', slug: 'none' },
];

/** facility_profile/units is select_one Yes/No on this form. */
const OT_FACILITY_UNIT_FIELDS = [
  {
    source: 'facility_profile/units',
    dest: 'facility_unit',
    type: 'yesno',
    map: YES_NO_MAP,
  },
];

/** services_offered/* Yes/No questions. 1 Yes / 0 No. */
const OT_SERVICES_FIELDS = [
  { source: 'services_offered/routine_cs', dest: 'routine_cs' },
  { source: 'services_offered/routine_cs_6m', dest: 'routine_cs_6months' },
  { source: 'services_offered/emerg_cs', dest: 'emergency_cs' },
  { source: 'services_offered/emerg_cs_6m', dest: 'emergency_cs_6months' },
  {
    source: 'services_offered/emerg_anaes',
    dest: 'emergency_obstetric_anaesthesia',
  },
  {
    source: 'services_offered/anaes_6m',
    dest: 'emergency_obstetric_anaesthesia_6m',
  },
  { source: 'services_offered/tubal_lig', dest: 'tubal_ligation' },
  { source: 'services_offered/laparotomy', dest: 'laparotomy' },
  { source: 'services_offered/dnc', dest: 'dilation_curettage' },
  { source: 'services_offered/cystotomy', dest: 'cystotomy' },
  { source: 'services_offered/cs_hyst', dest: 'cesarean_hysterectomy' },
  { source: 'services_offered/eua', dest: 'exam_under_anesthesia' },
  { source: 'services_offered/marsupial', dest: 'marsupial' },
  { source: 'services_offered/cerclage', dest: 'cervical_cerclage' },
  { source: 'services_offered/cerv_tear', dest: 'cervical_tear_repair' },
  { source: 'services_offered/incision_drain', dest: 'incision_drain' },
  { source: 'services_offered/sec_wound', dest: 'secondary_wound_closure' },
  { source: 'services_offered/blynch_sature', dest: 'blynch_sature' },
].map(function (field) {
  field.type = 'yesno';
  field.map = YES_NO_MAP;
  return field;
});

/**
 * hrh/* staff counts. Try spaced Kobo keys then the trimmed alias.
 * Dest names drop trailing spaces from the mapping note.
 */
const OT_HRH_COUNT_FIELDS = [
  {
    sources: ['hrh/county_anaesthes'],
    dest: 'county_anaesthesiologists',
  },
  {
    sources: ['hrh/contract_anaesthes ', 'hrh/contract_anaesthes'],
    dest: 'contract_anaesthesiologists',
  },
  {
    sources: ['hrh/county_co_anaest ', 'hrh/county_co_anaest'],
    dest: 'county_co_anaesthetists',
  },
  {
    sources: ['hrh/contract_co_anaest'],
    dest: 'contract_co_anaesthetists',
  },
  {
    sources: ['hrh/county_nurse_anaest ', 'hrh/county_nurse_anaest'],
    dest: 'county_nurse_anaesthetists',
  },
  {
    sources: ['hrh/contract_nurse_anaest'],
    dest: 'contract_nurse_anaesthetists',
  },
  {
    sources: ['hrh/county_theatre_nurse'],
    dest: 'county_theatre_nurse',
  },
  {
    sources: ['hrh/contract_theatre_nurse'],
    dest: 'contract_theatre_nurse',
  },
  {
    sources: ['hrh/theatre_cleaners'],
    dest: 'theatre_cleaners',
  },
  {
    sources: ['hrh/theatre_matron_patron'],
    dest: 'theatre_matron_patron',
  },
].map(function (field) {
  field.type = 'int';
  return field;
});

/** hrh/* Yes/No questions. 1 Yes / 0 No. */
const OT_HRH_YES_NO_FIELDS = [
  { source: 'hrh/anaesth_24hr', dest: 'anaesthetist_available_24hrs' },
  { source: 'hrh/anaesth_assist_24hr', dest: 'anaesth_assist_24hr' },
  { source: 'hrh/referral_no_anaesth', dest: 'referral_no_anaesth' },
  { source: 'hrh/obstetric_24hr', dest: 'obstetric_24hr' },
  { source: 'hrh/surg_assist_24hr', dest: 'surg_assist_24hr' },
  { source: 'hrh/referral_no_surg', dest: 'referral_no_surg' },
  { source: 'hrh/team_leader_24hr', dest: 'team_leader_24hr' },
  { source: 'hrh/scrub_nurse_24hr', dest: 'scrub_nurse_24hr' },
  { source: 'hrh/circulate_nurse_24hr', dest: 'circulate_nurse_24hr' },
  { source: 'hrh/baby_nurse_24hr', dest: 'baby_nurse_24hr' },
  { source: 'hrh/referral_no_nurse', dest: 'referral_no_nurse' },
  { source: 'hrh/pacu_nurse_24hr', dest: 'pacu_nurse_24hr' },
  { source: 'hrh/on_call_roster', dest: 'on_call_roster' },
].map(function (field) {
  field.type = 'yesno';
  field.map = YES_NO_MAP;
  return field;
});

/**
 * health_record/* Yes/No questions. Empty dests use the field name.
 */
const OT_HEALTH_RECORD_YES_NO_FIELDS = [
  { source: 'health_record/theatre_list', dest: 'theatre_list' },
  { source: 'health_record/delivery_reg', dest: 'delivery_reg' },
  { source: 'health_record/reg_used', dest: 'reg_used' },
  { source: 'health_record/theatre_reg', dest: 'theatre_reg' },
  { source: 'health_record/theatre_reg_used', dest: 'theatre_reg_used' },
].map(function (field) {
  field.type = 'yesno';
  field.map = YES_NO_MAP;
  return field;
});

const OT_CS_FORMS_FIELDS = [
  {
    source: 'health_record/cs_forms',
    dest: OT_CS_FORMS_PREFIX,
    type: 'multi',
    prefix: OT_CS_FORMS_PREFIX,
    choices: OT_CS_FORMS_CHOICES,
  },
];

const OT_RECORDS_PRIVACY_TRAINING_FIELDS = [
  {
    source: 'health_record/referral_forms',
    dest: 'referral_forms',
    type: 'coded',
    map: OT_ALWAYS_SOMETIMES_NEVER_AVAILABLE_MAP,
  },
  {
    source: 'privacy/preop_vis_priv',
    dest: 'preop_vis_priv',
    type: 'coded',
    map: ROOM_PRIVACY_MAP,
  },
  {
    source: 'privacy/postop_vis_priv',
    dest: 'postop_vis_priv',
    type: 'coded',
    map: ROOM_PRIVACY_MAP,
  },
  {
    source: 'privacy/preop_aud_priv',
    dest: 'preop_aud_priv',
    type: 'coded',
    map: ROOM_PRIVACY_MAP,
  },
  {
    source: 'privacy/postop_aud_priv',
    dest: 'postop_aud_priv',
    type: 'coded',
    map: ROOM_PRIVACY_MAP,
  },
  {
    source: 'privacy/files_sec',
    dest: 'files_sec',
    type: 'yesno',
    map: YES_NO_MAP,
  },
  { source: 'training/last_train', dest: 'last_train', type: 'text' },
  { source: 'training/cpd_required', dest: 'cpd_required', type: 'text' },
];

const OT_SOP_FIELDS = [
  {
    source: 'sop/anaes_proto',
    dest: 'anaes_proto',
    type: 'yesno',
    map: YES_NO_MAP,
  },
  {
    source: 'sop/referral_proto',
    dest: 'referral_proto',
    type: 'coded',
    map: OT_REFERRAL_PROTO_MAP,
  },
  {
    source: 'sop/ppe_radio_proto',
    dest: 'ppe_radio_proto',
    type: 'coded',
    map: OT_WRITTEN_OR_DISPLAYED_MAP,
  },
  {
    source: 'sop/recovery_proto',
    dest: 'recovery_proto',
    type: 'coded',
    map: OT_WRITTEN_OR_DISPLAYED_MAP,
  },
  {
    source: 'sop/theatre_ppe',
    dest: 'theatre_ppe',
    type: 'coded',
    map: OT_WRITTEN_OR_DISPLAYED_MAP,
  },
  {
    source: 'sop/sedation_proto',
    dest: 'sedation_proto',
    type: 'coded',
    map: OT_WRITTEN_OR_DISPLAYED_MAP,
  },
  {
    source: 'sop/clean_proto',
    dest: 'clean_proto',
    type: 'coded',
    map: OT_WRITTEN_OR_DISPLAYED_MAP,
  },
];

const OT_WASH_FIELDS = [
  {
    source: 'wash/water_access',
    dest: 'water_access',
    type: 'coded',
    map: WATER_SOURCE_MAP,
  },
  { source: 'wash/water_1m', dest: 'water_1m', type: 'yesno', map: YES_NO_MAP },
  { source: 'wash/sep_sinks', dest: 'sep_sinks', type: 'yesno', map: YES_NO_MAP },
  {
    source: 'wash/drain_system',
    dest: 'drain_system',
    type: 'yesno',
    map: YES_NO_MAP,
  },
  {
    source: 'wash/postop_sink',
    dest: 'postop_sink',
    type: 'coded',
    map: EQUIP_FUNCTIONAL_MAP,
  },
  {
    source: 'wash/hand_hygiene',
    dest: 'hand_hygiene',
    type: 'coded',
    map: OT_HAND_HYGIENE_MAP,
  },
  {
    source: 'wash/waste_proto',
    dest: 'waste_proto',
    type: 'coded',
    map: WASTE_MANAGEMENT_MAP,
  },
  {
    source: 'wash/waste_bins_label',
    dest: 'waste_bins_label',
    type: 'yesno',
    map: YES_NO_MAP,
  },
  {
    source: 'wash/sharps_full',
    dest: 'sharps_full',
    type: 'yesno',
    map: YES_NO_MAP,
  },
  { source: 'wash/latrine', dest: 'latrine', type: 'yesno', map: YES_NO_MAP },
  {
    source: 'wash/latrine_type',
    dest: 'latrine_type',
    type: 'coded',
    map: OT_LATRINE_TYPE_MAP,
  },
  { source: 'wash/specify', dest: 'specify_latrine', type: 'text' },
  {
    source: 'wash/handwash_station',
    dest: 'handwash_station',
    type: 'yesno',
    map: YES_NO_MAP,
  },
  {
    source: 'wash/clean_freq',
    dest: 'clean_freq',
    type: 'coded',
    map: OT_CLEAN_FREQ_MAP,
  },
  {
    source: 'wash/clean_today',
    dest: 'clean_today',
    type: 'yesno',
    map: YES_NO_MAP,
  },
  {
    source: 'wash/access_mobility',
    dest: 'access_mobility',
    type: 'yesno',
    map: YES_NO_MAP,
  },
  {
    source: 'wash/gender_sep',
    dest: 'gender_seperation',
    type: 'yesno',
    map: YES_NO_MAP,
  },
  {
    source: 'wash/mens_hygiene',
    dest: 'mens_hygiene',
    type: 'yesno',
    map: YES_NO_MAP,
  },
  {
    source: 'wash/instr_cleaning',
    dest: 'instr_cleaning',
    type: 'yesno',
    map: YES_NO_MAP,
  },
];

const OT_THEATRE_SPACE_FIELDS = [
  {
    source: 'infrastructure/theatre_space',
    dest: OT_THEATRE_SPACE_PREFIX,
    type: 'multi',
    prefix: OT_THEATRE_SPACE_PREFIX,
    choices: OT_THEATRE_SPACE_CHOICES,
  },
];

/** infrastructure/* after theatre_space. Integers stay integers. */
const OT_INFRA_FIELDS = [
  { dest: 'maintained', type: 'yesno' },
  { dest: 'exam_light', type: 'yesno' },
  { dest: 'exam_vent', type: 'yesno' },
  { dest: 'preop_area', type: 'yesno' },
  { dest: 'preop_beds', type: 'int' },
  { dest: 'preop_change', type: 'yesno' },
  { dest: 'surg_rooms', type: 'int' },
  { dest: 'intercom', type: 'yesno' },
  { dest: 'postop_beds', type: 'int' },
  { dest: 'bed_ref', type: 'yesno' },
  { dest: 'pharm_store', type: 'yesno' },
  { dest: 'sterile_store', type: 'yesno' },
  { dest: 'fire_ext', type: 'yesno' },
  { dest: 'signage', type: 'yesno' },
  { dest: 'charter', type: 'yesno' },
  { dest: 'nurse_station', type: 'yesno' },
  { dest: 'postop_access', type: 'yesno' },
  { dest: 'backup_power', type: 'yesno' },
  { dest: 'temp_ctrl', type: 'yesno' },
  { dest: 'staff_lounge', type: 'yesno' },
  { dest: 'ipd_dist', type: 'yesno' },
].map(function (field) {
  field.source = 'infrastructure/' + field.dest;
  if (field.type === 'yesno') field.map = YES_NO_MAP;
  return field;
});

/**
 * equipment/* in form order. Dest paths with a leftover group prefix
 * (pacu_lamp, pacu_temp) are stripped to the field name.
 */
const OT_EQUIPMENT_FIELDS = [
  { dest: 'op_table', type: 'yesno' },
  { dest: 'surg_lamp', type: 'coded', map: EQUIP_FUNCTIONAL_MAP },
  { dest: 'inf_scale', type: 'yesno' },
  { dest: 'chair', type: 'yesno' },
  { dest: 'cauter', type: 'yesno' },
  { dest: 'mayo', type: 'yesno' },
  { dest: 'instr_trol', type: 'yesno' },
  { dest: 'cs_sets', type: 'coded', map: OT_ALWAYS_SOMETIMES_NEVER_AVAILABLE_MAP },
  { dest: 'resusc', type: 'coded', map: EQUIP_FUNCTIONAL_MAP },
  { dest: 'ster_date', type: 'yesno' },
  { dest: 'suction', type: 'coded', map: EQUIP_FUNCTIONAL_MAP },
  { dest: 'res_bag_mom', type: 'yesno' },
  { dest: 'res_bag_infant', type: 'yesno' },
  {
    dest: 'mack_apron',
    type: 'coded',
    map: OT_ALWAYS_SOMETIMES_NEVER_AVAILABLE_MAP,
  },
  {
    dest: 'eye_shield',
    type: 'coded',
    map: OT_ALWAYS_SOMETIMES_NEVER_AVAILABLE_MAP,
  },
  {
    dest: 'gum_boots',
    type: 'coded',
    map: OT_ALWAYS_SOMETIMES_NEVER_AVAILABLE_MAP,
  },
  { dest: 'anest_machine', type: 'coded', map: EQUIP_FUNCTIONAL_MAP },
  { dest: 'emerg_trol', type: 'yesno' },
  { dest: 'anest_maint', type: 'yesno' },
  { dest: 'stetho', type: 'yesno' },
  { dest: 'monitor', type: 'coded', map: EQUIP_FUNCTIONAL_MAP },
  { dest: 'spo2_probe', type: 'yesno' },
  {
    dest: OT_BP_CUFFS_PREFIX,
    type: 'multi',
    prefix: OT_BP_CUFFS_PREFIX,
    choices: OT_BP_CUFFS_CHOICES,
  },
  {
    dest: 'ecg_leads',
    type: 'coded',
    map: OT_ALWAYS_SOMETIMES_NEVER_AVAILABLE_MAP,
  },
  { dest: 'airways', type: 'yesno' },
  { dest: 'laryngo', type: 'coded', map: EQUIP_FUNCTIONAL_MAP },
  {
    dest: OT_LARY_BLADES_PREFIX,
    type: 'multi',
    prefix: OT_LARY_BLADES_PREFIX,
    choices: OT_LARY_BLADES_CHOICES,
  },
  {
    dest: OT_ETT_TUBES_PREFIX,
    type: 'multi',
    prefix: OT_ETT_TUBES_PREFIX,
    choices: OT_ETT_TUBES_CHOICES,
  },
  { dest: 'magill', type: 'yesno' },
  { dest: 'fridge', type: 'coded', map: EQUIP_FUNCTIONAL_MAP },
  { dest: 'note2_pacu', type: 'yesno' },
  {
    dest: OT_PACU_TROL_PREFIX,
    type: 'multi',
    prefix: OT_PACU_TROL_PREFIX,
    choices: OT_PACU_TROL_CHOICES,
  },
  { dest: 'pacu_gluco', type: 'coded', map: EQUIP_FUNCTIONAL_MAP },
  { dest: 'pacu_lamp', type: 'coded', map: EQUIP_FUNCTIONAL_MAP },
  { dest: 'pacu_defib', type: 'coded', map: EQUIP_FUNCTIONAL_MAP },
  { dest: 'pacu_temp', type: 'yesno' },
  { dest: 'temp_18_24', type: 'yesno' },
  { dest: 'pacu_bp', type: 'yesno' },
  { dest: 'pacu_spo2', type: 'coded', map: EQUIP_FUNCTIONAL_MAP },
  { dest: 'pacu_ecg', type: 'coded', map: EQUIP_FUNCTIONAL_MAP },
  { dest: 'pacu_o2', type: 'yesno' },
  { dest: 'pacu_desk', type: 'yesno' },
].map(function (field) {
  field.source = 'equipment/' + (field.sourceDest || field.dest);
  if (field.type === 'yesno') field.map = YES_NO_MAP;
  return field;
});

/** commodities/* select_one. 1 Always / 2 Sometimes / 3 Never. */
const OT_COMMODITY_FIELDS = [
  'lidocaine',
  'povidine',
  'ephedrine',
  'iv_fluids',
  'mag_sulfate',
  'naloxone',
  'ceftriaxone',
  'hydralazine',
  'flumazenil',
  'adrenaline',
  'diazepam',
  'midazolam',
  'cal_gluconate',
  'tranex_acid',
  'lasix',
  'antiemetic',
  'chlorphenir',
  'plasma_exp',
  'nitrous',
  'halothane',
  'ketamine',
  'suxameth',
  'atropine',
  'neostig_physio',
  'esomep',
  'vit_k',
  'chlorhex',
  'tetra_eye',
  'oxytocin',
  'tranexamic',
  'misoprostol',
  'paracetamol',
  'carbetocin',
  'facemasks',
  'latex_gloves',
  'sterile_gloves',
  'spinal_packs',
  'sterile_sutures',
  'wound_dressing',
  'sterile_drapes',
  'iv_sets',
  'blood_sets',
  'cannulae',
  'needles_syringes',
  'catheters',
  'urine_bags',
  'gauze',
  'cotton_wool',
  'cauter_tips',
  'cauter_pad',
  'infant_id_bands',
  'pethidine',
  'morphine',
  'nevirapine',
  'azt',
  'cord_clamp',
  'caps',
  'socks',
].map(function (dest) {
  return {
    source: 'commodities/' + dest,
    dest: dest,
    type: 'coded',
    map: ALWAYS_SOMETIMES_NEVER_MAP,
  };
});

/**
 * sec_12/* adherence, then op/hrs_day.
 * spo2_mon dest strips the leftover group prefix; empty use() follows
 * the Always / Sometimes / Never siblings.
 */
const OT_ADHERENCE_FIELDS = [
  {
    source: 'sec_12/clean_sched',
    dest: 'clean_sched',
    type: 'yesno',
    map: YES_NO_MAP,
  },
  {
    source: 'sec_12/expiry_check',
    dest: 'expiry_check',
    type: 'yesno',
    map: YES_NO_MAP,
  },
  {
    source: 'sec_12/anaest_serv',
    dest: 'anaest_serv',
    type: 'coded',
    map: OT_SERVICING_MAP,
  },
  {
    source: 'sec_12/bed_serv',
    dest: 'bed_serv',
    type: 'coded',
    map: OT_SERVICING_MAP,
  },
  {
    source: 'sec_12/patient_id',
    dest: 'patient_id',
    type: 'coded',
    map: ALWAYS_SOMETIMES_NEVER_MAP,
  },
  {
    source: 'sec_12/pre_checks',
    dest: OT_PRE_CHECKS_PREFIX,
    type: 'multi',
    prefix: OT_PRE_CHECKS_PREFIX,
    choices: OT_PRE_CHECKS_CHOICES,
  },
  {
    source: 'sec_12/ecg_mon',
    dest: 'ecg_mon',
    type: 'coded',
    map: ALWAYS_SOMETIMES_NEVER_MAP,
  },
  {
    source: 'sec_12/spo2_mon',
    dest: 'spo2_mon',
    type: 'coded',
    map: ALWAYS_SOMETIMES_NEVER_MAP,
  },
  {
    source: 'sec_12/bp_mon',
    dest: 'bp_mon',
    type: 'coded',
    map: ALWAYS_SOMETIMES_NEVER_MAP,
  },
  {
    source: 'sec_12/surg_count',
    dest: 'surg_count',
    type: 'coded',
    map: ALWAYS_SOMETIMES_NEVER_MAP,
  },
  {
    source: 'sec_12/op_board',
    dest: 'op_board',
    type: 'coded',
    map: ALWAYS_SOMETIMES_NEVER_MAP,
  },
  {
    source: 'sec_12/blood_spec',
    dest: 'blood_spec',
    type: 'yesno',
    map: YES_NO_MAP,
  },
  {
    source: 'sec_12/mortality_rev',
    dest: 'mortality_rev',
    type: 'coded',
    map: ALWAYS_SOMETIMES_NEVER_MAP,
  },
  {
    source: 'sec_12/anaest_rev',
    dest: 'anaest_rev',
    type: 'coded',
    map: ALWAYS_SOMETIMES_NEVER_MAP,
  },
  {
    source: 'sec_12/anaest_doc',
    dest: OT_ANAEST_DOC_PREFIX,
    type: 'multi',
    prefix: OT_ANAEST_DOC_PREFIX,
    choices: OT_ANAEST_DOC_CHOICES,
  },
  {
    source: 'sec_12/anaest_chart',
    dest: OT_ANAEST_CHART_PREFIX,
    type: 'multi',
    prefix: OT_ANAEST_CHART_PREFIX,
    choices: OT_ANAEST_CHART_CHOICES,
  },
  {
    source: 'sec_12/turnaround',
    dest: 'turnaround',
    type: 'coded',
    map: OT_TURNAROUND_MAP,
  },
  {
    source: 'op/hrs_day',
    dest: 'hrs_day',
    type: 'coded',
    map: OT_HRS_DAY_MAP,
  },
];

const OT_TRANSFORM_FIELD_GROUPS = [
  OT_FACILITY_UNIT_FIELDS,
  OT_SERVICES_FIELDS,
  OT_HRH_COUNT_FIELDS,
  OT_HRH_YES_NO_FIELDS,
  OT_HEALTH_RECORD_YES_NO_FIELDS,
  OT_CS_FORMS_FIELDS,
  OT_RECORDS_PRIVACY_TRAINING_FIELDS,
  OT_SOP_FIELDS,
  OT_WASH_FIELDS,
  OT_THEATRE_SPACE_FIELDS,
  OT_INFRA_FIELDS,
  OT_EQUIPMENT_FIELDS,
  OT_COMMODITY_FIELDS,
  OT_ADHERENCE_FIELDS,
];

const OPERATING_THEATRE_SOURCE_KEYS = (function () {
  const keys = {
    starttime: true,
    start: true,
    endtime: true,
    end: true,
    'facility_profile/county': true,
    'facility_profile/facilities': true,
    'facility_profile/facility': true,
    'facility_profile/gazetted_facility': true,
    'facility_profile/contact': true,
    'group_1/nam_contact': true,
    'group_1/phone_contact': true,
    'facility_profile/nam_contact': true,
    'facility_profile/phone_contact': true,
  };
  OT_TRANSFORM_FIELD_GROUPS.forEach(function (fields) {
    markOperatingTheatreSources_(keys, fields);
  });
  return keys;
})();

function transformOperatingTheatreRecord_(rec) {
  const out = {};
  out[UUID_FIELD] =
    rec[UUID_FIELD] == null ? '' : rec[UUID_FIELD];

  assignPassthrough_(
    out,
    rec,
    OPERATING_THEATRE_SOURCE_KEYS
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
    rec['facility_profile/county'],
    COUNTY_MAP
  );

  const facilityMap = isOnOrAfterCutoff_(out.date_submitted, FACILITY_MAP_CUTOFF)
    ? FACILITY_MAP_FROM_2026
    : FACILITY_MAP_BEFORE_2026;
  out.facility = lookupCoded_(
    firstValue_(rec, [
      'facility_profile/facilities',
      'facility_profile/facility',
    ]),
    facilityMap
  );

  out.facility_level = lookupCoded_(
    rec['facility_profile/gazetted_facility'],
    FACILITY_LEVEL_MAP
  );

  out.contact = lookupCoded_(
    rec['facility_profile/contact'],
    CONTACT_PERSON_MAP
  );
  assignContactNamePhone_(out, rec);

  OT_TRANSFORM_FIELD_GROUPS.forEach(function (fields) {
    assignOperatingTheatreFields_(out, rec, fields);
  });

  return out;
}

function operatingTheatrePreferredHeaders_() {
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
  ].concat(OT_TRANSFORM_FIELD_GROUPS.reduce(function (headers, fields) {
    return headers.concat(operatingTheatreFieldHeaders_(fields));
  }, []));
}
