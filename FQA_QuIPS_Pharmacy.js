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

/** sop/handwashing — option 3 wording is Pharmacy-specific. */
const PHARMACY_HANDWASHING_MAP = {
  1: 'They have displayed, up to date protocols',
  2: 'They have written up to date protocols, not displayed',
  3: 'They do not have up displayed or written protocols',
};

/**
 * train/, sop/, and sanitation/ Yes/No questions. 1 Yes / 0 No.
 * Names drop the group prefix.
 */
const PHARMACY_SOP_SANITATION_YES_NO_FIELDS = [
  { source: 'train/cpds', dest: 'cpds' },
  { source: 'sop/request', dest: 'request' },
  { source: 'sop/del_medication', dest: 'del_medication' },
  { source: 'sop/sop_dispensing', dest: 'sop_dispensing' },
  { source: 'sop/sop_expiry', dest: 'sop_expiry' },
  { source: 'sop/moni_temp', dest: 'moni_temp' },
  { source: 'sop/recording', dest: 'recording' },
  { source: 'sanitation/water_consistent', dest: 'water_consistent' },
  { source: 'sanitation/drainage', dest: 'drainage' },
  { source: 'sanitation/sharps', dest: 'sharps' },
  { source: 'sanitation/available_cont', dest: 'available_cont' },
  { source: 'sanitation/visible_cont', dest: 'visible_cont' },
];

/** sanitation/soap_disp — option 3 is "Absent in all service areas". */
const PHARMACY_SOAP_DISP_MAP = {
  1: 'Present in ALL service areas',
  2: 'Present in some service areas',
  3: 'Absent in all service areas',
};

/**
 * Infrastructure, privacy, and equipment Yes/No questions. 1 Yes / 0 No.
 * Names drop the section prefix.
 */
const PHARMACY_INFRA_EQUIP_YES_NO_FIELDS = [
  { source: 'Section_7_Infrastructure/maintained', dest: 'maintained' },
  { source: 'Section_7_Infrastructure/barrier', dest: 'barrier' },
  { source: 'Section_7_Infrastructure/work_tables', dest: 'work_tables' },
  { source: 'Section_7_Infrastructure/chairs', dest: 'chairs' },
  { source: 'Section_7_Infrastructure/cabinets', dest: 'cabinets' },
  { source: 'Section_7_Infrastructure/storage', dest: 'storage' },
  { source: 'Section_7_Infrastructure/wash_basin', dest: 'wash_basin' },
  { source: 'Section_7_Infrastructure/well_lit', dest: 'well_lit' },
  { source: 'Section_7_Infrastructure/well_vent', dest: 'well_vent' },
  { source: 'Section_7_Infrastructure/wall_clock', dest: 'wall_clock' },
  { source: 'Section_7_Infrastructure/certification', dest: 'certification' },
  { source: 'Section_8_Privacy_Confidentiality/privacy', dest: 'privacy' },
  { source: 'Section_9_Equipment/computer', dest: 'computer' },
  { source: 'Section_9_Equipment/fridge_temp', dest: 'fridge_temp' },
  { source: 'Section_9_Equipment/lock_cabin', dest: 'lock_cabin' },
  { source: 'Section_9_Equipment/label', dest: 'label' },
  { source: 'Section_9_Equipment/room_therm', dest: 'room_therm' },
  { source: 'Section_9_Equipment/therm_readings', dest: 'therm_readings' },
];

/** Section_9_Equipment/cabinet */
const PHARMACY_CABINET_MAP = {
  1: 'Yes, cabinet locked today',
  2: 'Yes, cabinet not locked today',
  3: 'No',
};

/** Section_9_Equipment/receipt */
const PHARMACY_RECEIPT_MAP = {
  1: 'Yes',
  2: 'No',
  3: 'Not applicable',
};

/** Section_10_Commodities select_one. 1 Always / 2 Sometimes / 3 Never available. */
const PHARMACY_ALWAYS_SOMETIMES_NEVER_AVAILABLE_MAP = {
  1: 'Always available',
  2: 'Sometimes available',
  3: 'Never available',
};

/** Section_10_Commodities/nutrition */
const PHARMACY_NUTRITION_MAP = {
  1: 'Always available',
  2: 'Available in nutrition unit',
  3: 'Sometimes available',
  4: 'Never available',
};

const PHARMACY_COMMODITY_AVAIL_FIELDS = [
  'prescription',
  'latex',
  'iron_tab',
  'folic_acid',
  'ifas',
  'calcium',
  'multivit',
  'iron_syrup',
  'vit_d',
  'vit_k',
  'tetra',
  'deworming',
  'disinfectant',
  'lidocaine',
  'lidocaine1',
  'dextrose10',
  'dextrose5',
  'dextrose15',
  'water_inj',
  'saline_45',
  'saline_90',
  'saline3',
  'potassium',
  'chlorxidine',
  'anti_d',
  'plasma',
  'ringers_lactate',
  'lasix',
  'esomeprazole',
  'esomeprazole_iv',
  'para_tabs',
  'para_suspe',
  'para_iv',
  'morphine',
  'tramadol',
  'aspirin',
  'metform',
  'insulin',
  'thyroxine',
  'pyritone',
  'odt',
  'metroclo',
  'enoxaparin',
  'warfarin',
  'genta',
  'ampicilin',
  'cephalo',
  'flucloxacilin',
  'metra',
  'clindamycin',
  'vancomycin',
  'amoxil',
  'benzathine',
  'amikacin',
  'ampiclox',
  'aminophylin',
  'artemether',
  'sulfadoxine',
  'artesunete',
  'isoniazid',
  'rifampicin',
  'pyrizimomide',
  'ethambutol',
  'vitB6',
  'acyclovir',
  'salbutemol',
  'salbutamol_oral',
  'salbutamol_inhaler',
  'iprapitm',
  'nifedi',
  'hydralazine',
  'hydralazine_oral',
  'methyl',
  'labetalol',
  'calcium_inj',
  'mgso4',
  'phenytoin',
  'diazapam',
  'midazolam',
  'phenobar',
  'betametha',
  'iv_hydro',
  'oral_hydro',
  'inj_oxytocin',
  'carbetocin',
  'tranexamic',
  'misoprostol',
  'ergometrine',
  'nevirapine',
  'nevirapine_tab',
  'azt',
  'abacavir_dtg',
  'tenofovir_alafenamide',
  'dolutegravir',
  'abacavir_tdf',
  'naloxone',
  'adrenaline',
  'atropine',
  'amiodarone',
  'caffeine',
  'surfactant',
  'bicarbonate',
  'bcg_vaccine',
  'polio',
  'hep_b',
  'formula',
  'progesterone',
  'e_contra',
  'progest_pills',
  'iud',
  'copper',
  'combined',
  'inj_implant',
  'depo',
  'condoms',
  'fe_condoms',
];

/**
 * Section_10_Commodities Yes/No questions. 1 Yes / 0 No.
 * Names drop the section prefix. dda_used and wall_clock also exist
 * earlier from record/ and Section_7_Infrastructure/.
 */
const PHARMACY_COMMODITY_YES_NO_FIELDS = [
  'dda_used',
  'wall_clock',
  'iron_freq',
  'folic_freq',
  'ifas_freq',
  'cal_freq',
  'nut_freq',
  'multivit_freq',
  'syrup_freq',
  'vit_freq',
  'vitk_freq',
  'tetra_freq',
  'deworm_freq',
  'dis_freq',
  'lido_freq',
  'lido_freq1',
  'dex_freq10',
  'dex_freq5',
  'dex_freq15',
  'inj_freq',
  'saline_freq45',
  'saline_freq90',
  'saline_freq3',
  'pota_freq',
  'chlor_freq',
  'anti_dfreq',
  'plasma_frq',
  'ringers_freq',
  'lasix_freq',
  'esome_freq',
  'esomeprazole_iv_freq',
  'tabs_freq',
  'suspe_freq',
  'iv_freq',
  'morph_freq',
  'trama_freq',
  'aspirin_freq',
  'metform_freq',
  'insulin_freq',
  'thyro_freq',
  'pyrit_freq',
  'odt_freq',
  'metro_freq',
  'enoxa_freq',
  'warf_freq',
  'genta_freq',
  'ampi_freq',
  'cepha_freq',
  'fluclo_freq',
  'metra_freq',
  'clinda_freq',
  'canco_freq',
  'amoxil_freq',
  'benza_freq',
  'amika_freq',
  'ampiclo_freq',
  'amino_freq',
  'arte_freq',
  'sulfa_freq',
  'artesu_freq',
  'ison_freq',
  'rifam_freq',
  'pyrizi_freq',
  'etham_freq',
  'vitB6_freq',
  'acyclo_freq',
  'sulbu_freq',
  'salbutamol_oral_freq',
  'salbutamol_inhaler_freq',
  'iprap_freq',
  'nifedi_freq',
  'hydra_freq',
  'hydralazine_oral_freq',
  'methyl_freq',
  'labe_freq',
  'cal_inj_freq',
  'mgso4_freq',
  'pheny_freq',
  'diaza_freq',
  'mida_freq',
  'pheno_freq',
  'betame_freq',
  'Iv_hydro_freq',
  'oral_freq',
  'oxyto_freq',
  'oxy_store',
  'carbe_freq',
  'trane_freq',
  'miso_freq',
  'ergo_freq',
  'nevira_freq',
  'nevirapine_tab_freq',
  'azt_freq',
  'abacavir_dtg_freq',
  'tenofovir_alafenamide_freq',
  'dolutegravir_freq',
  'abacavir_tdf_freq',
  'nalo_freq',
  'adren_freq',
  'atropine_freq',
  'amiodarone_freq',
  'caffe_freq',
  'surfa_freq',
  'biocar_freq',
  'bcg_frq',
  'polio_freq',
  'hep_freq',
  'formula_freq',
  'proge_freq',
  'contra_freq',
  'progest_freq',
  'iud_freq',
  'copper_freq',
  'combined_freq',
  'mplant_freq',
  'depo_freq',
  'cond_freq',
  'fe_cond_freq',
];

function pharmacyCommoditySource_(dest) {
  return 'Section_10_Commodities/' + dest;
}

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
  keys['sop/handwashing'] = true;
  PHARMACY_SOP_SANITATION_YES_NO_FIELDS.forEach(function (field) {
    keys[field.source] = true;
  });
  keys['sanitation/water_source'] = true;
  keys['sanitation/soap_disp'] = true;
  PHARMACY_INFRA_EQUIP_YES_NO_FIELDS.forEach(function (field) {
    keys[field.source] = true;
  });
  keys['Section_9_Equipment/fridge'] = true;
  keys['Section_9_Equipment/cabinet'] = true;
  keys['Section_9_Equipment/receipt'] = true;
  PHARMACY_COMMODITY_AVAIL_FIELDS.forEach(function (dest) {
    keys[pharmacyCommoditySource_(dest)] = true;
  });
  keys['Section_10_Commodities/nutrition'] = true;
  PHARMACY_COMMODITY_YES_NO_FIELDS.forEach(function (dest) {
    keys[pharmacyCommoditySource_(dest)] = true;
  });
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

  out.handwashing = lookupCoded_(
    rec['sop/handwashing'],
    PHARMACY_HANDWASHING_MAP
  );

  PHARMACY_SOP_SANITATION_YES_NO_FIELDS.forEach(function (field) {
    out[field.dest] = lookupCoded_(
      rec[field.source],
      YES_NO_MAP
    );
  });

  out.water_source = lookupCoded_(
    rec['sanitation/water_source'],
    WATER_SOURCE_MAP
  );

  out.soap_disp = lookupCoded_(
    rec['sanitation/soap_disp'],
    PHARMACY_SOAP_DISP_MAP
  );

  PHARMACY_INFRA_EQUIP_YES_NO_FIELDS.forEach(function (field) {
    out[field.dest] = lookupCoded_(
      rec[field.source],
      YES_NO_MAP
    );
  });

  out.fridge = lookupCoded_(
    rec['Section_9_Equipment/fridge'],
    EQUIP_FUNCTIONAL_MAP
  );

  out.cabinet = lookupCoded_(
    rec['Section_9_Equipment/cabinet'],
    PHARMACY_CABINET_MAP
  );

  out.receipt = lookupCoded_(
    rec['Section_9_Equipment/receipt'],
    PHARMACY_RECEIPT_MAP
  );

  PHARMACY_COMMODITY_AVAIL_FIELDS.forEach(function (dest) {
    out[dest] = lookupCoded_(
      rec[pharmacyCommoditySource_(dest)],
      PHARMACY_ALWAYS_SOMETIMES_NEVER_AVAILABLE_MAP
    );
  });

  out.nutrition = lookupCoded_(
    rec['Section_10_Commodities/nutrition'],
    PHARMACY_NUTRITION_MAP
  );

  PHARMACY_COMMODITY_YES_NO_FIELDS.forEach(function (dest) {
    const raw = rec[pharmacyCommoditySource_(dest)];
    if ((dest === 'dda_used' || dest === 'wall_clock') &&
        (raw == null || raw === '')) {
      return;
    }
    out[dest] = lookupCoded_(raw, YES_NO_MAP);
  });

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
    .concat(['prese', 'handwashing'])
    .concat(PHARMACY_SOP_SANITATION_YES_NO_FIELDS.map(function (field) {
      return field.dest;
    }))
    .concat(['water_source', 'soap_disp'])
    .concat(PHARMACY_INFRA_EQUIP_YES_NO_FIELDS.map(function (field) {
      return field.dest;
    }))
    .concat(['fridge', 'cabinet', 'receipt'])
    .concat(PHARMACY_COMMODITY_AVAIL_FIELDS)
    .concat(['nutrition'])
    .concat(PHARMACY_COMMODITY_YES_NO_FIELDS);
}
