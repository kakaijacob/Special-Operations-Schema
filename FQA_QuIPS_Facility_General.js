/** Facility General transformation and preferred headers. */

/**
 * select_multiple: facility_profile/units
 * Columns: units_<choice_slug> = Yes / No / '' (blank if skipped).
 */
const FACILITY_GENERAL_UNITS_PREFIX = 'units';
const FACILITY_GENERAL_UNITS_CHOICES = [
  { code: '1', slug: 'outpatient_mnh_services' },
  { code: '2', slug: 'pharmacy_services' },
  { code: '3', slug: 'basic_laboratory_services' },
  { code: '4', slug: 'comprehensive_laboratory_services' },
  { code: '5', slug: 'inpatient_bemonc_services' },
  { code: '6', slug: 'newborn_unit_services' },
  { code: '7', slug: 'maternity_surgical_services_operating_theatre' },
  { code: '8', slug: 'central_store_non_pharm_commodities' },
  { code: '9', slug: 'rdt_testing_only' },
];

/** health_records_clients/data_collection_tools */
const FACILITY_GENERAL_DATA_COLLECTION_TOOLS_MAP = {
  1: 'Paper based charting',
  2: 'Electronic based charting',
  3: 'Both',
  4: 'Neither',
};

/**
 * health_records_clients/* Yes/No questions. 1 Yes / 0 No.
 * Names drop the group prefix. Keep unique_patient_identifer spelling.
 */
const FACILITY_GENERAL_HEALTH_RECORDS_YES_NO_FIELDS = [
  'unique_patient_identifer',
  'responsible_person',
  'storage_equipment',
  'electronic_registry',
  'data_storage_cap',
  'written_collection_tools',
];

/**
 * select_multiple: health_records_clients/secure_registers
 * Columns: secure_registers_<choice_slug> = Yes / No / '' (blank if skipped).
 */
const FACILITY_GENERAL_SECURE_REGISTERS_PREFIX = 'secure_registers';
const FACILITY_GENERAL_SECURE_REGISTERS_CHOICES = [
  { code: '1', slug: 'lockable_doors' },
  { code: '2', slug: 'grills' },
  { code: '3', slug: 'fireproof_cabinets' },
  { code: '4', slug: 'none' },
];

/**
 * national_data_collection/* Yes/No questions. 1 Yes / 0 No.
 * Names drop the group prefix.
 */
const FACILITY_GENERAL_NATIONAL_DATA_YES_NO_FIELDS = [
  'upload_data2',
  'standard_hours',
];

/**
 * select_multiple: national_data_collection/record
 * Columns: record_<choice_slug> = Yes / No / '' (blank if skipped).
 */
const FACILITY_GENERAL_RECORD_PREFIX = 'record';
const FACILITY_GENERAL_RECORD_CHOICES = [
  { code: '1', slug: 'computer_storage_space' },
  { code: '2', slug: 'computers_with_passwords_designated_for_health_record_use' },
  { code: '3', slug: 'inter_connectivity_inter_operability_system' },
  { code: '4', slug: 'data_repository' },
  { code: '5', slug: 'internet_connection_or_airtime' },
  { code: '6', slug: 'standard_operating_procedures' },
  { code: '7', slug: 'offline_capability_system_for_data_entry' },
  { code: '8', slug: 'none' },
];

/** national_data_collection/mpdr_committee2 */
const FACILITY_GENERAL_MPDR_COMMITTEE2_MAP = {
  1: 'monthly (or more frequently)',
  2: '> monthly - quarterly',
  3: '> quarterly - biannually',
  4: '> biannually - yearly',
  5: 'We do not have an MPDSR committee',
};

/**
 * human_resource_health staff counts and Yes/No questions, in form order.
 * Integers stay integers. Yes/No is 1 Yes / 0 No.
 */
const FACILITY_GENERAL_HRH_STAFF_FIELDS = [
  { dest: 'medical_officer', type: 'int' },
  { dest: 'medical_officer3', type: 'yesno' },
  { dest: 'clinical_officer', type: 'int' },
  { dest: 'clinical_officer3', type: 'yesno' },
  { dest: 'health_records', type: 'int' },
  { dest: 'nutritionist', type: 'int' },
  { dest: 'social_worker', type: 'int' },
  { dest: 'public_health', type: 'int' },
  { dest: 'health_promotion', type: 'int' },
  { dest: 'cleaning_staff_employed', type: 'int' },
  { dest: 'cleaning_staff_contract', type: 'int' },
  { dest: 'maintenance_staff', type: 'int' },
];

/**
 * select_multiple: human_resource_health/facility_staff3
 * Columns: facility_staff3_<choice_slug> = Yes / No / '' (blank if skipped).
 */
const FACILITY_GENERAL_FACILITY_STAFF3_PREFIX = 'facility_staff3';
const FACILITY_GENERAL_FACILITY_STAFF3_CHOICES = [
  { code: '1', slug: 'a_written_up_to_date_staffing_policy' },
  { code: '2', slug: 'a_list_that_details_staff_numbers' },
  { code: '3', slug: 'a_list_that_details_the_types_and_competence_of_staff' },
  { code: '4', slug: 'none' },
];

/** human_resource_health Yes/No questions after facility_staff3. */
const FACILITY_GENERAL_HRH_POLICY_YES_NO_FIELDS = [
  'roster_displayed',
  'clear_comm',
  'annual_appraise',
  'eval_verify',
];

/** human_resource_health/qit_meet and wit_meet */
const FACILITY_GENERAL_COMMITTEE_MEET_MAP = {
  1: 'monthly (or more frequently)',
  2: '> monthly - quarterly',
  3: '> quarterly - biannually',
  4: '> biannually - yearly',
  5: 'The committee does not meet',
};

/** human_resource_health/sit_meet — no monthly option. */
const FACILITY_GENERAL_SIT_MEET_MAP = {
  1: '> monthly - quarterly',
  2: '> quarterly - biannually',
  3: '> biannually - yearly',
  4: 'The committee does not meet',
};

function facilityGeneralHrhSource_(dest) {
  return 'human_resource_health/' + dest;
}

function facilityGeneralWashSource_(dest) {
  return 'wash_ipc/' + dest;
}

/** wash_ipc/dis_sharps */
const FACILITY_GENERAL_DIS_SHARPS_MAP = {
  1: 'Fuel powered burn incinerator',
  2: 'Electric powered burn incinerator.',
  3: 'Open burning in a protected area (Observe)',
  4: 'Open burning in a non-protected area (Observe)',
  5: 'Dump without burning in a protected area (Observe)',
  6: 'Dump without burning in a non-protected area (Observe)',
  7: 'Outside contract/remove offsite with protected storage (Ask to see contract/MOU)',
  8: 'Outside contract/remove offsite with non-protected storage (Ask to see contract/MOU)',
  9: 'Not available or stored without destruction (Please observe)',
};

/** wash_ipc/dispose_medwast */
const FACILITY_GENERAL_DISPOSE_MEDWAST_MAP = {
  1: 'Fuel powered burn incinerator',
  2: 'Electric powered burn incinerator.',
  3: 'Placenta macerator (Please observe)',
  4: 'Open burning in a protected area (Please observe)',
  5: 'Open burning in a non-protected area (Please observe)',
  6: 'Dump without burning in protected area (Please observe)',
  7: 'Dump without burning in a non-protected area (Please observe)',
  8: 'Compost or placenta pit which is free from pests, rodents, animals (Please observe)',
  9: 'Microwave (Please observe)',
  10: 'Remove offsite with protected storage (Check contract or MOU)',
  11: 'Not available or stored without destruction (Please observe)',
};

/** wash_ipc/designated_cleaning */
const FACILITY_GENERAL_PRESENT_MAP = {
  1: 'Present',
  0: 'Not present',
};

/** wash_ipc disinfectant availability. 1 Always / 2 Sometimes / 3 Never available. */
const FACILITY_GENERAL_ALWAYS_SOMETIMES_NEVER_AVAILABLE_MAP = {
  1: 'Always available',
  2: 'Sometimes available',
  3: 'Never available',
};

const FACILITY_GENERAL_WASH_AVAIL_FIELDS = [
  'chlorine',
  'enzymatic_sol',
  'glutaraldehyde',
  'formaldehyde',
  'ethylene_oxide',
  'alcohol',
  'chlorine_exidine',
];

/**
 * select_multiple: wash_ipc/sterlization_place
 * Columns: sterlization_place_<choice_slug>. Keep Kobo spelling.
 */
const FACILITY_GENERAL_STERLIZATION_PLACE_PREFIX = 'sterlization_place';
const FACILITY_GENERAL_STERLIZATION_PLACE_CHOICES = [
  { code: '1', slug: 'containers_for_high_level_disinfection' },
  { code: '2', slug: 'electric_autoclave' },
  { code: '3', slug: 'dry_heat_sterilizer' },
  { code: '4', slug: 'eto_ethylene_oxide_sterilizer' },
  { code: '5', slug: 'not_applicable_for_this_facility' },
];

/** wash_ipc/main_source and oth_source share these labels. */
const FACILITY_GENERAL_WATER_SOURCE_MAP = {
  1: 'Main public supply',
  2: 'Tubewell or Borehole',
  3: 'PROTECTED DUG WELL (has a lock)',
  4: 'UNPROTECTED DUG WELL (does not have lock)',
  5: 'Protected SPRING water',
  6: 'RAINWATER COLLECTION',
  7: 'CART W/SMALL TANK/DRUM',
  8: 'TANKER TRUCK',
  9: 'SURFACE WATER',
  10: 'OTHER (SPECIFY)',
  11: 'No water source',
};

/**
 * select_multiple: wash_ipc/oth_source
 * Columns: oth_source_<choice_slug> = Yes / No / '' (blank if skipped).
 */
const FACILITY_GENERAL_OTH_SOURCE_PREFIX = 'oth_source';
const FACILITY_GENERAL_OTH_SOURCE_CHOICES = [
  { code: '1', slug: 'main_public_supply' },
  { code: '2', slug: 'tubewell_or_borehole' },
  { code: '3', slug: 'protected_dug_well' },
  { code: '4', slug: 'unprotected_dug_well' },
  { code: '5', slug: 'protected_spring_water' },
  { code: '6', slug: 'rainwater_collection' },
  { code: '7', slug: 'cart_w_small_tank_drum' },
  { code: '8', slug: 'tanker_truck' },
  { code: '9', slug: 'surface_water' },
  { code: '10', slug: 'other_specify' },
  { code: '11', slug: 'no_water_source' },
];

/** wash_ipc/soiled_linen_pro */
const FACILITY_GENERAL_SOILED_LINEN_MAP = {
  1: 'Disinfected prior to being taken to laundry',
  2: 'Disinfected once taken to laundry unit',
  3: 'Laundered without being disinfected',
  4: 'Not applicable for this facility',
};

/** wash_ipc/contact_patient */
const FACILITY_GENERAL_CONTACT_PATIENT_MAP = {
  1: 'Wiped with disinfectant then cleaned with water',
  2: 'Wiped with disinfectant only',
  3: 'Cleaned with water only',
};

/** wash_ipc cleaning-frequency questions. */
const FACILITY_GENERAL_SURFACE_CLEAN_MAP = {
  1: 'Daily AND anytime they are soiled',
  2: 'Daily',
  3: 'ONLY when they are soiled',
  4: 'They are not cleaned routinely with disinfectant solution',
};

const FACILITY_GENERAL_SURFACE_CLEAN_FIELDS = [
  'equipment_cleaned',
  'floors',
  'sinks',
  'bathrooms',
];

const FACILITY_GENERAL_WASH_YES_NO_FIELDS = [
  'ipc_committee',
  'inci_avail_funct',
  'inci_petrol',
  'control_traffic',
  'three_bucket',
  'sop_instrument',
  'central_steril',
  'safe_water',
  'func_water_source',
  'sche_bathrooms',
];

function facilityGeneralInfraSource_(dest) {
  return 'infrastructure/' + dest;
}

/**
 * infrastructure/* Yes/No questions. 1 Yes / 0 No.
 * Names drop the prefix. Keep maintencance_log spelling.
 */
const FACILITY_GENERAL_INFRA_YES_NO_FIELDS = [
  'two_doors',
  'access_ramp',
  'access_via_road',
  'service_charter',
  'dis_charter',
  'licence',
  'other_primary_elec',
  'elec_available',
  'suff_sockets',
  'maintenance_unit6',
  'maintencance_log',
  'working_machine',
  'secure_storage6',
  'feedback_mechanism',
  'dedicated_office6',
  'ethics_committee',
  'cleaning_protocol',
];

/** infrastructure/vis_signage */
const FACILITY_GENERAL_VIS_SIGNAGE_MAP = {
  1: 'Yes, clear and visible',
  2: 'Yes, but missing in some places or signs not clear',
  3: 'No',
};

/** infrastructure/main_elec_source */
const FACILITY_GENERAL_MAIN_ELEC_SOURCE_MAP = {
  1: 'Central supply (KPLC)',
  2: 'Generator (fuel or battery operated generator)',
  3: 'Solar system',
  4: 'Other, specify',
};

/** infrastructure/processed_linens */
const FACILITY_GENERAL_PROCESSED_LINENS_MAP = {
  1: 'With an onsite washing machine (Observe)',
  2: 'They are processed offsite (Verify contract or MOU)',
  3: 'Via manual washing at facility (Observe location where washing occurs)',
  4: 'Not applicable for this facility',
};

/**
 * select_multiple: infrastructure/sec_electricity
 * Columns: sec_electricity_<choice_slug> = Yes / No / '' (blank if skipped).
 */
const FACILITY_GENERAL_SEC_ELECTRICITY_PREFIX = 'sec_electricity';
const FACILITY_GENERAL_SEC_ELECTRICITY_CHOICES = [
  { code: '1', slug: 'generator' },
  { code: '2', slug: 'solar_system' },
  { code: '3', slug: 'other_specify' },
];

/**
 * select_multiple: infrastructure/security_measures6
 * Columns: security_measures6_<choice_slug> = Yes / No / '' (blank if skipped).
 */
const FACILITY_GENERAL_SECURITY_MEASURES6_PREFIX = 'security_measures6';
const FACILITY_GENERAL_SECURITY_MEASURES6_CHOICES = [
  { code: '1', slug: 'security_guards_or_watchmen_at_all_times' },
  { code: '2', slug: 'perimeter_wall_around_the_facility' },
  { code: '3', slug: 'twenty_four_hours_surveillance_cctv' },
  { code: '4', slug: 'none' },
];

/**
 * select_multiple: infrastructure/housekeeping
 * Columns: housekeeping_<choice_slug> = Yes / No / '' (blank if skipped).
 */
const FACILITY_GENERAL_HOUSEKEEPING_PREFIX = 'housekeeping';
const FACILITY_GENERAL_HOUSEKEEPING_CHOICES = [
  { code: '1', slug: 'eyewear_or_goggles' },
  { code: '2', slug: 'facemask' },
  { code: '3', slug: 'utility_gloves' },
  { code: '4', slug: 'plastic_apron' },
  { code: '5', slug: 'gumboots' },
  { code: '6', slug: 'head_gear' },
  { code: '7', slug: 'none' },
];

const FACILITY_GENERAL_SOURCE_KEYS = (function () {
  const keys = {
    starttime: true,
    start: true,
    endtime: true,
    end: true,
    'facility_profile/county': true,
    'facility_profile/facilities': true,
    'facility_profile/gazetted_facility': true,
    'facility_profile/contact': true,
    'group_1/nam_contact': true,
    'group_1/phone_contact': true,
    'facility_profile/nam_contact': true,
    'facility_profile/phone_contact': true,
    'facility_profile/units': true,
    'health_records_clients/data_collection_tools': true,
    'health_records_clients/secure_registers': true,
    'national_data_collection/record': true,
    'national_data_collection/mpdr_committee2': true,
  };
  FACILITY_GENERAL_HEALTH_RECORDS_YES_NO_FIELDS.forEach(function (dest) {
    keys['health_records_clients/' + dest] = true;
  });
  FACILITY_GENERAL_NATIONAL_DATA_YES_NO_FIELDS.forEach(function (dest) {
    keys['national_data_collection/' + dest] = true;
  });
  FACILITY_GENERAL_HRH_STAFF_FIELDS.forEach(function (field) {
    keys[facilityGeneralHrhSource_(field.dest)] = true;
  });
  keys['human_resource_health/facility_staff3'] = true;
  FACILITY_GENERAL_HRH_POLICY_YES_NO_FIELDS.forEach(function (dest) {
    keys[facilityGeneralHrhSource_(dest)] = true;
  });
  keys['human_resource_health/have_qit'] = true;
  keys['human_resource_health/qit_meet'] = true;
  keys['human_resource_health/have_wit'] = true;
  keys['human_resource_health/wit_meet'] = true;
  keys['human_resource_health/have_sit'] = true;
  keys['human_resource_health/sit_meet'] = true;
  FACILITY_GENERAL_WASH_YES_NO_FIELDS.forEach(function (dest) {
    keys[facilityGeneralWashSource_(dest)] = true;
  });
  keys['wash_ipc/dis_sharps'] = true;
  keys['wash_ipc/dispose_medwast'] = true;
  keys['wash_ipc/designated_cleaning'] = true;
  FACILITY_GENERAL_WASH_AVAIL_FIELDS.forEach(function (dest) {
    keys[facilityGeneralWashSource_(dest)] = true;
  });
  keys['wash_ipc/sterlization_place'] = true;
  keys['wash_ipc/main_source'] = true;
  keys['wash_ipc/specify_main'] = true;
  keys['wash_ipc/oth_source'] = true;
  keys['wash_ipc/specify_oth_source'] = true;
  keys['wash_ipc/soiled_linen_pro'] = true;
  keys['wash_ipc/contact_patient'] = true;
  FACILITY_GENERAL_SURFACE_CLEAN_FIELDS.forEach(function (dest) {
    keys[facilityGeneralWashSource_(dest)] = true;
  });
  keys['wash_ipc/table_tops'] = true;
  FACILITY_GENERAL_INFRA_YES_NO_FIELDS.forEach(function (dest) {
    keys[facilityGeneralInfraSource_(dest)] = true;
  });
  keys['infrastructure/vis_signage'] = true;
  keys['infrastructure/main_elec_source'] = true;
  keys['infrastructure/elect_source'] = true;
  keys['infrastructure/elect_sec'] = true;
  keys['infrastructure/processed_linens'] = true;
  keys['infrastructure/sec_electricity'] = true;
  keys['infrastructure/security_measures6'] = true;
  keys['infrastructure/housekeeping'] = true;
  return keys;
})();

function transformFacilityGeneralRecord_(rec) {
  const out = {};
  out[UUID_FIELD] =
    rec[UUID_FIELD] == null ? '' : rec[UUID_FIELD];

  assignPassthrough_(
    out,
    rec,
    FACILITY_GENERAL_SOURCE_KEYS
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
    rec['facility_profile/facilities'],
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

  expandSelectMultiple_(
    out,
    rec['facility_profile/units'],
    FACILITY_GENERAL_UNITS_PREFIX,
    FACILITY_GENERAL_UNITS_CHOICES
  );

  out.data_collection_tools = lookupCoded_(
    rec['health_records_clients/data_collection_tools'],
    FACILITY_GENERAL_DATA_COLLECTION_TOOLS_MAP
  );

  FACILITY_GENERAL_HEALTH_RECORDS_YES_NO_FIELDS.forEach(function (dest) {
    out[dest] = lookupCoded_(
      rec['health_records_clients/' + dest],
      YES_NO_MAP
    );
  });

  expandSelectMultiple_(
    out,
    rec['health_records_clients/secure_registers'],
    FACILITY_GENERAL_SECURE_REGISTERS_PREFIX,
    FACILITY_GENERAL_SECURE_REGISTERS_CHOICES
  );

  out.upload_data2 = lookupCoded_(
    rec['national_data_collection/upload_data2'],
    YES_NO_MAP
  );

  expandSelectMultiple_(
    out,
    rec['national_data_collection/record'],
    FACILITY_GENERAL_RECORD_PREFIX,
    FACILITY_GENERAL_RECORD_CHOICES
  );

  out.mpdr_committee2 = lookupCoded_(
    rec['national_data_collection/mpdr_committee2'],
    FACILITY_GENERAL_MPDR_COMMITTEE2_MAP
  );

  out.standard_hours = lookupCoded_(
    rec['national_data_collection/standard_hours'],
    YES_NO_MAP
  );

  FACILITY_GENERAL_HRH_STAFF_FIELDS.forEach(function (field) {
    const raw = rec[facilityGeneralHrhSource_(field.dest)];
    out[field.dest] = field.type === 'int'
      ? toIntegerOrBlank_(raw)
      : lookupCoded_(raw, YES_NO_MAP);
  });

  expandSelectMultiple_(
    out,
    rec['human_resource_health/facility_staff3'],
    FACILITY_GENERAL_FACILITY_STAFF3_PREFIX,
    FACILITY_GENERAL_FACILITY_STAFF3_CHOICES
  );

  FACILITY_GENERAL_HRH_POLICY_YES_NO_FIELDS.forEach(function (dest) {
    out[dest] = lookupCoded_(
      rec[facilityGeneralHrhSource_(dest)],
      YES_NO_MAP
    );
  });

  out.have_qit = lookupCoded_(
    rec['human_resource_health/have_qit'],
    YES_NO_MAP
  );
  out.qit_meet = lookupCoded_(
    rec['human_resource_health/qit_meet'],
    FACILITY_GENERAL_COMMITTEE_MEET_MAP
  );
  out.have_wit = lookupCoded_(
    rec['human_resource_health/have_wit'],
    YES_NO_MAP
  );
  out.wit_meet = lookupCoded_(
    rec['human_resource_health/wit_meet'],
    FACILITY_GENERAL_COMMITTEE_MEET_MAP
  );
  out.have_sit = lookupCoded_(
    rec['human_resource_health/have_sit'],
    YES_NO_MAP
  );
  out.sit_meet = lookupCoded_(
    rec['human_resource_health/sit_meet'],
    FACILITY_GENERAL_SIT_MEET_MAP
  );

  out.ipc_committee = lookupCoded_(
    rec['wash_ipc/ipc_committee'],
    YES_NO_MAP
  );
  out.dis_sharps = lookupCoded_(
    rec['wash_ipc/dis_sharps'],
    FACILITY_GENERAL_DIS_SHARPS_MAP
  );
  out.inci_avail_funct = lookupCoded_(
    rec['wash_ipc/inci_avail_funct'],
    YES_NO_MAP
  );
  out.inci_petrol = lookupCoded_(
    rec['wash_ipc/inci_petrol'],
    YES_NO_MAP
  );
  out.dispose_medwast = lookupCoded_(
    rec['wash_ipc/dispose_medwast'],
    FACILITY_GENERAL_DISPOSE_MEDWAST_MAP
  );
  out.designated_cleaning = lookupCoded_(
    rec['wash_ipc/designated_cleaning'],
    FACILITY_GENERAL_PRESENT_MAP
  );
  out.control_traffic = lookupCoded_(
    rec['wash_ipc/control_traffic'],
    YES_NO_MAP
  );
  out.three_bucket = lookupCoded_(
    rec['wash_ipc/three_bucket'],
    YES_NO_MAP
  );
  out.sop_instrument = lookupCoded_(
    rec['wash_ipc/sop_instrument'],
    YES_NO_MAP
  );

  FACILITY_GENERAL_WASH_AVAIL_FIELDS.forEach(function (dest) {
    out[dest] = lookupCoded_(
      rec[facilityGeneralWashSource_(dest)],
      FACILITY_GENERAL_ALWAYS_SOMETIMES_NEVER_AVAILABLE_MAP
    );
  });

  out.central_steril = lookupCoded_(
    rec['wash_ipc/central_steril'],
    YES_NO_MAP
  );

  expandSelectMultiple_(
    out,
    rec['wash_ipc/sterlization_place'],
    FACILITY_GENERAL_STERLIZATION_PLACE_PREFIX,
    FACILITY_GENERAL_STERLIZATION_PLACE_CHOICES
  );

  out.safe_water = lookupCoded_(
    rec['wash_ipc/safe_water'],
    YES_NO_MAP
  );
  out.func_water_source = lookupCoded_(
    rec['wash_ipc/func_water_source'],
    YES_NO_MAP
  );
  out.main_source = lookupCoded_(
    rec['wash_ipc/main_source'],
    FACILITY_GENERAL_WATER_SOURCE_MAP
  );
  out.specify_main = rec['wash_ipc/specify_main'] == null || rec['wash_ipc/specify_main'] === ''
    ? ''
    : flattenCell_(rec['wash_ipc/specify_main']);

  expandSelectMultiple_(
    out,
    rec['wash_ipc/oth_source'],
    FACILITY_GENERAL_OTH_SOURCE_PREFIX,
    FACILITY_GENERAL_OTH_SOURCE_CHOICES
  );

  out.specify_oth_source = rec['wash_ipc/specify_oth_source'] == null || rec['wash_ipc/specify_oth_source'] === ''
    ? ''
    : flattenCell_(rec['wash_ipc/specify_oth_source']);
  out.soiled_linen_pro = lookupCoded_(
    rec['wash_ipc/soiled_linen_pro'],
    FACILITY_GENERAL_SOILED_LINEN_MAP
  );
  out.contact_patient = lookupCoded_(
    rec['wash_ipc/contact_patient'],
    FACILITY_GENERAL_CONTACT_PATIENT_MAP
  );

  FACILITY_GENERAL_SURFACE_CLEAN_FIELDS.forEach(function (dest) {
    out[dest] = lookupCoded_(
      rec[facilityGeneralWashSource_(dest)],
      FACILITY_GENERAL_SURFACE_CLEAN_MAP
    );
  });

  out.sche_bathrooms = lookupCoded_(
    rec['wash_ipc/sche_bathrooms'],
    YES_NO_MAP
  );
  out.table_tops = lookupCoded_(
    rec['wash_ipc/table_tops'],
    FACILITY_GENERAL_SURFACE_CLEAN_MAP
  );

  FACILITY_GENERAL_INFRA_YES_NO_FIELDS.forEach(function (dest) {
    out[dest] = lookupCoded_(
      rec[facilityGeneralInfraSource_(dest)],
      YES_NO_MAP
    );
  });

  out.vis_signage = lookupCoded_(
    rec['infrastructure/vis_signage'],
    FACILITY_GENERAL_VIS_SIGNAGE_MAP
  );
  out.main_elec_source = lookupCoded_(
    rec['infrastructure/main_elec_source'],
    FACILITY_GENERAL_MAIN_ELEC_SOURCE_MAP
  );
  out.elect_source = rec['infrastructure/elect_source'] == null || rec['infrastructure/elect_source'] === ''
    ? ''
    : flattenCell_(rec['infrastructure/elect_source']);
  out.elect_sec = rec['infrastructure/elect_sec'] == null || rec['infrastructure/elect_sec'] === ''
    ? ''
    : flattenCell_(rec['infrastructure/elect_sec']);
  out.processed_linens = lookupCoded_(
    rec['infrastructure/processed_linens'],
    FACILITY_GENERAL_PROCESSED_LINENS_MAP
  );

  expandSelectMultiple_(
    out,
    rec['infrastructure/sec_electricity'],
    FACILITY_GENERAL_SEC_ELECTRICITY_PREFIX,
    FACILITY_GENERAL_SEC_ELECTRICITY_CHOICES
  );
  expandSelectMultiple_(
    out,
    rec['infrastructure/security_measures6'],
    FACILITY_GENERAL_SECURITY_MEASURES6_PREFIX,
    FACILITY_GENERAL_SECURITY_MEASURES6_CHOICES
  );
  expandSelectMultiple_(
    out,
    rec['infrastructure/housekeeping'],
    FACILITY_GENERAL_HOUSEKEEPING_PREFIX,
    FACILITY_GENERAL_HOUSEKEEPING_CHOICES
  );

  return out;
}

function facilityGeneralPreferredHeaders_() {
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
  ].concat(selectMultipleHeaders_(FACILITY_GENERAL_UNITS_PREFIX, FACILITY_GENERAL_UNITS_CHOICES))
    .concat(['data_collection_tools'])
    .concat(FACILITY_GENERAL_HEALTH_RECORDS_YES_NO_FIELDS)
    .concat(selectMultipleHeaders_(
      FACILITY_GENERAL_SECURE_REGISTERS_PREFIX,
      FACILITY_GENERAL_SECURE_REGISTERS_CHOICES
    ))
    .concat(['upload_data2'])
    .concat(selectMultipleHeaders_(
      FACILITY_GENERAL_RECORD_PREFIX,
      FACILITY_GENERAL_RECORD_CHOICES
    ))
    .concat(['mpdr_committee2', 'standard_hours'])
    .concat(FACILITY_GENERAL_HRH_STAFF_FIELDS.map(function (field) {
      return field.dest;
    }))
    .concat(selectMultipleHeaders_(
      FACILITY_GENERAL_FACILITY_STAFF3_PREFIX,
      FACILITY_GENERAL_FACILITY_STAFF3_CHOICES
    ))
    .concat(FACILITY_GENERAL_HRH_POLICY_YES_NO_FIELDS)
    .concat([
      'have_qit',
      'qit_meet',
      'have_wit',
      'wit_meet',
      'have_sit',
      'sit_meet',
    ])
    .concat([
      'ipc_committee',
      'dis_sharps',
      'inci_avail_funct',
      'inci_petrol',
      'dispose_medwast',
      'designated_cleaning',
      'control_traffic',
      'three_bucket',
      'sop_instrument',
    ])
    .concat(FACILITY_GENERAL_WASH_AVAIL_FIELDS)
    .concat(['central_steril'])
    .concat(selectMultipleHeaders_(
      FACILITY_GENERAL_STERLIZATION_PLACE_PREFIX,
      FACILITY_GENERAL_STERLIZATION_PLACE_CHOICES
    ))
    .concat(['safe_water', 'func_water_source', 'main_source', 'specify_main'])
    .concat(selectMultipleHeaders_(
      FACILITY_GENERAL_OTH_SOURCE_PREFIX,
      FACILITY_GENERAL_OTH_SOURCE_CHOICES
    ))
    .concat([
      'specify_oth_source',
      'soiled_linen_pro',
      'contact_patient',
    ])
    .concat(FACILITY_GENERAL_SURFACE_CLEAN_FIELDS)
    .concat(['sche_bathrooms', 'table_tops'])
    .concat(FACILITY_GENERAL_INFRA_YES_NO_FIELDS)
    .concat([
      'vis_signage',
      'main_elec_source',
      'elect_source',
      'elect_sec',
      'processed_linens',
    ])
    .concat(selectMultipleHeaders_(
      FACILITY_GENERAL_SEC_ELECTRICITY_PREFIX,
      FACILITY_GENERAL_SEC_ELECTRICITY_CHOICES
    ))
    .concat(selectMultipleHeaders_(
      FACILITY_GENERAL_SECURITY_MEASURES6_PREFIX,
      FACILITY_GENERAL_SECURITY_MEASURES6_CHOICES
    ))
    .concat(selectMultipleHeaders_(
      FACILITY_GENERAL_HOUSEKEEPING_PREFIX,
      FACILITY_GENERAL_HOUSEKEEPING_CHOICES
    ));
}
