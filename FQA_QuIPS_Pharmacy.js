/** Pharmacy transformation and preferred headers. */

/**
 * select_multiple: facility_profile/unit
 * Columns: units_<choice_slug> = Yes / No / '' (blank if skipped).
 */
const PHARMACY_UNITS_PREFIX = 'units';
const PHARMACY_UNITS_CHOICES = [
  { code: '1', slug: 'outpatient_mnh_services' },
  { code: '2', slug: 'pharmacy_services' },
  { code: '3', slug: 'basic_laboratory_services' },
  { code: '4', slug: 'comprehensive_laboratory_services' },
  { code: '5', slug: 'inpatient_bemonc_services' },
  { code: '6', slug: 'newborn_unit_services' },
  { code: '7', slug: 'maternity_surgical_services_operating_theatre' },
  { code: '8', slug: 'central_store_non_pharm_commodities' },
];

/** record/* Yes/No questions. 1 Yes / 0 No. Names drop the record/ prefix. */
const PHARMACY_RECORD_YES_NO_FIELDS = [
  'activity_logs',
  'activity_used',
  'workload',
  'workload_used',
  'auditing_report',
  'auditing_used',
  'inventory',
  'int_used',
  'dda_reg',
  'dda_used',
];

/** hrh/* integer counts. Names drop the hrh/ prefix. */
const PHARMACY_HRH_COUNT_FIELDS = [
  'pharmacist',
  'contract_pharm',
  'clinical_pharm',
  'contract_pharm2',
  'pharmce',
  'pharmtech',
];

/** hrh/* Yes/No questions. 1 Yes / 0 No. */
const PHARMACY_HRH_YES_NO_FIELDS = [
  'on_duty',
  'avail_opening',
];

/** hrh/prese: 1 Present / 0 Not present. */
const PHARMACY_PRESENT_MAP = {
  1: 'Present',
  0: 'Not present',
};

const PHARMACY_SOURCE_KEYS = (function () {
  const keys = {
    starttime: true,
    start: true,
    endtime: true,
    end: true,
    'facility_profile/county': true,
    'facility_profile/facility': true,
    'facility_profile/gazetted_facility': true,
    'facility_profile/contact': true,
    'group_1/nam_contact': true,
    'group_1/phone_contact': true,
    'facility_profile/nam_contact': true,
    'facility_profile/phone_contact': true,
    'facility_profile/unit': true,
  };
  PHARMACY_RECORD_YES_NO_FIELDS.forEach(function (dest) {
    keys['record/' + dest] = true;
  });
  PHARMACY_HRH_COUNT_FIELDS.forEach(function (dest) {
    keys['hrh/' + dest] = true;
  });
  PHARMACY_HRH_YES_NO_FIELDS.forEach(function (dest) {
    keys['hrh/' + dest] = true;
  });
  keys['hrh/prese'] = true;
  return keys;
})();

function transformPharmacyRecord_(rec) {
  const out = {};
  out[UUID_FIELD] =
    rec[UUID_FIELD] == null ? '' : rec[UUID_FIELD];

  assignPassthrough_(
    out,
    rec,
    PHARMACY_SOURCE_KEYS
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
    rec['facility_profile/facility'],
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
    rec['facility_profile/unit'],
    PHARMACY_UNITS_PREFIX,
    PHARMACY_UNITS_CHOICES
  );

  PHARMACY_RECORD_YES_NO_FIELDS.forEach(function (dest) {
    out[dest] = lookupCoded_(
      rec['record/' + dest],
      YES_NO_MAP
    );
  });

  PHARMACY_HRH_COUNT_FIELDS.forEach(function (dest) {
    out[dest] = toIntegerOrBlank_(rec['hrh/' + dest]);
  });

  PHARMACY_HRH_YES_NO_FIELDS.forEach(function (dest) {
    out[dest] = lookupCoded_(
      rec['hrh/' + dest],
      YES_NO_MAP
    );
  });

  out.prese = lookupCoded_(
    rec['hrh/prese'],
    PHARMACY_PRESENT_MAP
  );

  return out;
}

function pharmacyPreferredHeaders_() {
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
  ].concat(selectMultipleHeaders_(PHARMACY_UNITS_PREFIX, PHARMACY_UNITS_CHOICES))
    .concat(PHARMACY_RECORD_YES_NO_FIELDS)
    .concat(PHARMACY_HRH_COUNT_FIELDS)
    .concat(PHARMACY_HRH_YES_NO_FIELDS)
    .concat(['prese']);
}
