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
    .concat(['mpdr_committee2', 'standard_hours']);
}
