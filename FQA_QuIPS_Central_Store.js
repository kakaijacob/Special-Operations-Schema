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

/** commod/* select_one. 1 Always / 2 Sometimes / 3 Never available. */
const CENTRAL_STORE_ALWAYS_SOMETIMES_NEVER_AVAILABLE_MAP = {
  1: 'Always available',
  2: 'Sometimes available',
  3: 'Never available',
};

const CENTRAL_STORE_COMMODITY_AVAIL_FIELDS = [
  'cord',
  'scissors',
  'airway_adult',
  'airway_infant',
  'del_set',
  'cs_kit',
  'tray',
  'dnc',
  'suture',
  'gloves',
  'gyna_glv',
  'latex',
  'ambu5',
  'ambu2',
  'ambu3',
  'reserv_bag',
  'mask1',
  'mask00',
  'mask0',
  'mask2',
  'torniq',
  'rebreather',
  'rebmask',
  'oxyg',
  'iv_kit',
  'solusets',
  'bld_sets',
  'syr5',
  'sry2',
  'syr10',
  'syr20',
  'syr50',
  'needle21',
  'needle23',
  'lbcann',
  'strap',
  'vepacks',
  'trans_kit',
  'spinal',
  'lp_kit',
  'guedel',
  'spec',
  'catheter',
  'neocath',
  'cath3',
  'suction',
  'ubt',
  'canscalp',
  'nasg',
  'vd_kits',
  'itn',
  'caps',
  'socks',
  'diapers',
  'cups',
  'angt',
  'ingt',
  'aet',
  'iet',
  'pump',
  'breast',
  'sudsyr',
  'dressing',
  'cotton',
  'blades',
  'linen',
  'towel',
  'drape_jar',
  'patellar',
  'penguine',
  'cling_film',
  'wedge',
];

/**
 * commod/* Yes/No questions. 1 Yes / 0 No.
 * Names drop the commod/ prefix. Keep Kobo spellings (sry2, Penguine_stock).
 */
const CENTRAL_STORE_COMMODITY_YES_NO_FIELDS = [
  'c_stock',
  'scis_stock',
  'airw_stock',
  'airway_infant_sto',
  'del_stock',
  'cs_stock',
  'tray_stock',
  'dnc_stock',
  'sut_stock',
  'glov_stock',
  'gyna_stock',
  'latex_stock',
  'ambu5_stock',
  'ambu2_stock',
  'ambu3_stock',
  'bag_stock',
  'mask1_stock',
  'mask00_stock',
  'mask0_stock',
  'mask2_stock',
  'torniq_stock',
  'rebre_stock',
  'rebmask_stock',
  'oxytub_stock',
  'iv_stock',
  'solu_stock',
  'bld_stock',
  'syr5_stock',
  'syr2_stock',
  'syr10_stock',
  'syr20_stock',
  'syr50_stock',
  'needle_stock',
  'needle23_stock',
  'lbcann_stock',
  'strap_stock',
  'vepack_stock',
  'trans_stock',
  'spinal_stock',
  'lp_stock',
  'guedel_stock',
  'spec_stock',
  'catheter_stock',
  'neocath_stock',
  'cath3_stock',
  'suction_stock',
  'ubt_kit',
  'canscalp_stock',
  'nasg_stock',
  'vdkits_stock',
  'itn_stock',
  'caps_stock',
  'sock_stock',
  'diaper_stock',
  'cup_stock',
  'angt_stock',
  'ingt_stock',
  'aet_stock',
  'iet_stock',
  'pump_stock',
  'breast_stock',
  'sudsyr_stock',
  'dressing_stock',
  'cotton_stock',
  'blades_stock',
  'linen_stock',
  'towel_stock',
  'drape_jar_stock',
  'patellar_stock',
  'Penguine_stock',
  'cling_film_stock',
  'wedge_stock',
];

function centralStoreCommoditySource_(dest) {
  return 'commod/' + dest;
}

/** hour/hours */
const CENTRAL_STORE_HOURS_MAP = {
  1: 'Accessible at all facility open times',
  2: 'Sometimes when the facility is open, but not always',
  3: 'Rarely assessible (it is difficult to access non-pharm commodities in this facility)',
};

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
  CENTRAL_STORE_COMMODITY_AVAIL_FIELDS.forEach(function (dest) {
    keys[centralStoreCommoditySource_(dest)] = true;
  });
  CENTRAL_STORE_COMMODITY_YES_NO_FIELDS.forEach(function (dest) {
    keys[centralStoreCommoditySource_(dest)] = true;
  });
  keys['hour/hours'] = true;
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

  CENTRAL_STORE_COMMODITY_AVAIL_FIELDS.forEach(function (dest) {
    out[dest] = lookupCoded_(
      rec[centralStoreCommoditySource_(dest)],
      CENTRAL_STORE_ALWAYS_SOMETIMES_NEVER_AVAILABLE_MAP
    );
  });

  CENTRAL_STORE_COMMODITY_YES_NO_FIELDS.forEach(function (dest) {
    out[dest] = lookupCoded_(
      rec[centralStoreCommoditySource_(dest)],
      YES_NO_MAP
    );
  });

  out.hours = lookupCoded_(
    rec['hour/hours'],
    CENTRAL_STORE_HOURS_MAP
  );

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
    }))
    .concat(CENTRAL_STORE_COMMODITY_AVAIL_FIELDS)
    .concat(CENTRAL_STORE_COMMODITY_YES_NO_FIELDS)
    .concat(['hours']);
}
