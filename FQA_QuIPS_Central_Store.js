/** Central Store transformation and preferred headers. */

/** health/designated_space */
const CENTRAL_STORE_DESIGNATED_SPACE_MAP = {
  1: 'Yes (a designated central store room)',
  2: 'Yes (a designated area within the pharmacy)',
  3: 'Yes (a designated area NOT located within the pharmacy)',
  4: 'No, there is no designated space. Commodities can be found only in service delivery areas',
};

/** health/* Yes/No questions. 1 Yes / 0 No. Names drop the health/ prefix. */
const CENTRAL_STORE_HEALTH_YES_NO_FIELDS = [
  'inventory',
  'tools',
  'logs',
  'temp_log',
  'chart',
  'chr_tool',
  'ctr_form',
  'ctr_use',
  'bin_card',
  'bin_card_update',
];

/** sop/odering_personnel — keep Kobo spelling. */
const CENTRAL_STORE_ORDERING_PERSONNEL_MAP = {
  1: 'One person - nurse in charge',
  2: 'One person - pharmacy staff',
  3: 'One person - laboratory staff',
  4: 'One person - central store manager',
  5: 'One person - other',
  6: 'More than one person is responsible for this task',
};

/** sop/stock_orders */
const CENTRAL_STORE_STOCK_ORDERS_MAP = {
  1: 'Quarterly or more often',
  2: 'Biannually',
  3: 'Only when funds are available',
};

/**
 * sop/, sanitation/, infras/, and equip/ Yes/No questions. 1 Yes / 0 No.
 * Names drop the group prefix.
 */
const CENTRAL_STORE_SOP_INFRA_EQUIP_YES_NO_FIELDS = [
  { source: 'sop/supplies', dest: 'supplies' },
  { source: 'sop/fefo', dest: 'fefo' },
  { source: 'sanitation/hygiene', dest: 'hygiene' },
  { source: 'infras/structures', dest: 'structures' },
  { source: 'infras/cabinets', dest: 'cabinets' },
  { source: 'infras/thermometer', dest: 'thermometer' },
  { source: 'infras/room', dest: 'room' },
  { source: 'infras/dust', dest: 'dust' },
  { source: 'equip/computer', dest: 'computer' },
];

const CENTRAL_STORE_SOURCE_KEYS = (function () {
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
    'health/designated_space': true,
  };
  CENTRAL_STORE_HEALTH_YES_NO_FIELDS.forEach(function (dest) {
    keys['health/' + dest] = true;
  });
  keys['sop/odering_personnel'] = true;
  keys['sop/stock_orders'] = true;
  CENTRAL_STORE_SOP_INFRA_EQUIP_YES_NO_FIELDS.forEach(function (field) {
    keys[field.source] = true;
  });
  return keys;
})();

function transformCentralStoreRecord_(rec) {
  const out = {};
  out[UUID_FIELD] =
    rec[UUID_FIELD] == null ? '' : rec[UUID_FIELD];

  assignPassthrough_(
    out,
    rec,
    CENTRAL_STORE_SOURCE_KEYS
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

  out.designated_space = lookupCoded_(
    rec['health/designated_space'],
    CENTRAL_STORE_DESIGNATED_SPACE_MAP
  );

  CENTRAL_STORE_HEALTH_YES_NO_FIELDS.forEach(function (dest) {
    out[dest] = lookupCoded_(
      rec['health/' + dest],
      YES_NO_MAP
    );
  });

  out.odering_personnel = lookupCoded_(
    rec['sop/odering_personnel'],
    CENTRAL_STORE_ORDERING_PERSONNEL_MAP
  );

  out.stock_orders = lookupCoded_(
    rec['sop/stock_orders'],
    CENTRAL_STORE_STOCK_ORDERS_MAP
  );

  CENTRAL_STORE_SOP_INFRA_EQUIP_YES_NO_FIELDS.forEach(function (field) {
    out[field.dest] = lookupCoded_(
      rec[field.source],
      YES_NO_MAP
    );
  });

  return out;
}

function centralStorePreferredHeaders_() {
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
    'designated_space',
  ].concat(CENTRAL_STORE_HEALTH_YES_NO_FIELDS)
    .concat(['odering_personnel', 'stock_orders'])
    .concat(CENTRAL_STORE_SOP_INFRA_EQUIP_YES_NO_FIELDS.map(function (field) {
      return field.dest;
    }));
}
