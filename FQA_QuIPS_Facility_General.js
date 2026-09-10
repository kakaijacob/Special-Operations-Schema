/** Facility General transformation and preferred headers. */

const FACILITY_GENERAL_SOURCE_KEYS = {
  starttime: true,
  start: true,
  endtime: true,
  end: true,
};

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

  return out;
}

function facilityGeneralPreferredHeaders_() {
  return [
    UUID_FIELD,
    'date_started',
    'date_ended',
    'date_submitted',
  ];
}
