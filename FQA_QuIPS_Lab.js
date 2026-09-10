/** Lab transformation and preferred headers. */

const LAB_SOURCE_KEYS = {
  starttime: true,
  start: true,
  endtime: true,
  end: true,
  'group_1/county': true,
  'group_1/facility': true,
  'group_1/gazetted': true,
  'group_1/contact': true,
};

function transformLabRecord_(rec) {
  const out = {};
  out[UUID_FIELD] =
    rec[UUID_FIELD] == null ? '' : rec[UUID_FIELD];

  /*
   * Preserve all fields except raw start/end fields and consumed
   * group_1 profile codes. `_submission_time` is also retained as a
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
  ];
}
