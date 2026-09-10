/** Lab transformation and preferred headers. */

const LAB_UNITS_MAP = {
  3: 'Basic Laboratory services',
  4: 'Comprehensive laboratory services',
};

/**
 * group_2 coded questions, in output order.
 * Always/Sometimes/Never unless the destination looks like a monthly Yes/No.
 */
const LAB_GROUP_2_FIELDS = [
  { source: 'group_2/abo_blood', dest: 'blood_group_testing' },
  { source: 'group_2/abo_monthly', dest: 'abo_monthly' },
  { source: 'group_2/perform_hbsag', dest: 'perform_hbsag' },
  { source: 'group_2/hbsag_monthly', dest: 'hbsag_monthly' },
  { source: 'group_2/perform_rpr', dest: 'perform_rpr' },
  { source: 'group_2/rpr_monthly', dest: 'rpr_monthly' },
  { source: 'group_2/perform_vdrl', dest: 'perform_vdrl' },
  { source: 'group_2/vdrl_monthly', dest: 'vdrl_monthly' },
  { source: 'group_2/perform_syphilis', dest: 'perform_syphilis' },
  { source: 'group_2/perform_microscopy', dest: 'perform_microscopy' },
  { source: 'group_2/microscopy_monthly', dest: 'microscopy_monthly' },
  { source: 'group_2/perform_hb', dest: 'perform_hb' },
  { source: 'group_2/HB_monthly', dest: 'HB_monthly' },
  { source: 'group_2/per_urinalyisis_micro', dest: 'per_urinalyisis_micro' },
  { source: 'group_2/urinalyisis_micro_mon', dest: 'urinalyisis_micro_mon' },
  { source: 'group_2/perform_urine_rapid', dest: 'perform_urine_rapid' },
  { source: 'group_2/urine_rapid_monthly', dest: 'urine_rapid_monthly' },
  { source: 'group_2/perform_urine_protein', dest: 'perform_urine_protein' },
  { source: 'group_2/urine_protein_monthly', dest: 'urine_protein_monthly' },
  { source: 'group_2/glucose_dipstick', dest: 'glucose_dipstick' },
  { source: 'group_2/glucose_dipstick_monthly', dest: 'glucose_dipstick_monthly' },
  { source: 'group_2/perform_hiv', dest: 'perform_hiv' },
  { source: 'group_2/hivrapid_monthly', dest: 'hivrapid_monthly' },
  { source: 'group_2/perform_malaria', dest: 'perform_malaria' },
  { source: 'group_2/malaria_monthly', dest: 'malaria_monthly' },
  { source: 'group_2/perform_tb', dest: 'perform_tb' },
  { source: 'group_2/tb_monthly', dest: 'tb_monthly' },
  { source: 'group_2/perform_blood_gluc', dest: 'perform_blood_gluc' },
  { source: 'group_2/blood_gluc_monthly', dest: 'blood_gluc_monthly' },
  { source: 'group_2/perform_vaginal_swab', dest: 'perform_vaginal_swab' },
  { source: 'group_2/vaginal_swab_monthly', dest: 'vaginal_swab_monthly' },
  { source: 'group_2/perform_esr', dest: 'perform_esr' },
  { source: 'group_2/esr_monthly', dest: 'esr_monthly' },
  { source: 'group_2/perform_thyroid', dest: 'perform_thyroid' },
  { source: 'group_2/thyroid_monthly', dest: 'thyroid_monthly' },
  { source: 'group_2/perform_hormone_prof', dest: 'perform_hormone_prof' },
  { source: 'group_2/hormone_prof_monthly', dest: 'hormone_prof_monthly' },
  { source: 'group_2/able_Hga1c', dest: 'able_Hga1c' },
  { source: 'group_2/Hga1c_monthly', dest: 'Hga1c_monthly' },
  { source: 'group_2/perform_crp', dest: 'perform_crp' },
  { source: 'group_2/crp_monthly', dest: 'crp_monthly' },
  { source: 'group_2/perform_coombs', dest: 'perform_coombs' },
  { source: 'group_2/coombs_monthly', dest: 'coombs_monthly' },
  { source: 'group_2/offer_bloodtransfusion', dest: 'offer_bloodtransfusion' },
  { source: 'group_2/transfusion_monthly', dest: 'transfusion_monthly' },
  { source: 'group_2/perform_crossmatch', dest: 'perform_crossmatch' },
  { source: 'group_2/crossmatch_monthly', dest: 'crossmatch_monthly' },
  { source: 'group_2/perform_hepc', dest: 'perform_hepc' },
  { source: 'group_2/hepc_monthly', dest: 'hepc_monthly' },
  { source: 'group_2/per_urinalysis_culture', dest: 'per_urinalysis_culture' },
  { source: 'group_2/culture_monthly', dest: 'culture_monthly' },
  { source: 'group_2/per_hiv_elisa', dest: 'per_hiv_elisa' },
  { source: 'group_2/hiv_elisa_monthly', dest: 'hiv_elisa_monthly' },
  { source: 'group_2/per_dbs', dest: 'per_dbs' },
  { source: 'group_2/dbs_monthly', dest: 'dbs_monthly' },
  { source: 'group_2/per_liver_tests', dest: 'per_liver_tests' },
  { source: 'group_2/liver_tests_monthly', dest: 'liver_tests_monthly' },
  { source: 'group_2/per_urea_elec', dest: 'per_urea_elec' },
  { source: 'group_2/urea_elec_monthly', dest: 'urea_elec_monthly' },
  { source: 'group_2/able_birirubin', dest: 'able_birirubin' },
  { source: 'group_2/birirubin_monthly', dest: 'birirubin_monthly' },
  { source: 'group_2/per_uric_acid', dest: 'per_uric_acid' },
  { source: 'group_2/uric_acid_monthly', dest: 'uric_acid_monthly' },
  { source: 'group_2/per_coagulation', dest: 'per_coagulation' },
  { source: 'group_2/coagulation_monthly', dest: 'coagulation_monthly' },
  { source: 'group_2/per_blood_culture', dest: 'per_blood_culture' },
  { source: 'group_2/blood_culture_monthly', dest: 'blood_culture_monthly' },
  { source: 'group_2/perform_pap_smear', dest: 'perform_pap_smear' },
  { source: 'group_2/pap_smear_monthly', dest: 'pap_smear_monthly' },
  { source: 'group_2/per_hpv_testing', dest: 'per_hpv_testing' },
  { source: 'group_2/HPV_testing_monthly', dest: 'HPV_testing_monthly' },
  { source: 'group_2/per_hpylori', dest: 'per_hpylori' },
  { source: 'group_2/hpylori_monthly', dest: 'hpylori_monthly' },
  { source: 'group_2/perform_via', dest: 'perform_via' },
  { source: 'group_2/via_monthly', dest: 'via_monthly' },
];

/** group_3 register questions: 1 Yes / 0 No, names without the group_3/ prefix. */
const LAB_GROUP_3_FIELDS = [
  'lab_register',
  'lab_register_used',
  'lab_summary_register',
  'summary_reg_used',
  'consumption_register',
  'consumption_reg_used',
  'hts_register',
  'hts_reg_used',
  'referral_register',
  'request_form',
];

function labGroup2Map_(dest) {
  if (/monthly|_mon$/i.test(dest)) return YES_NO_MAP;
  return ALWAYS_SOMETIMES_NEVER_MAP;
}

const LAB_SOURCE_KEYS = (function () {
  const keys = {
    starttime: true,
    start: true,
    endtime: true,
    end: true,
    'group_1/county': true,
    'group_1/facility': true,
    'group_1/gazetted': true,
    'group_1/contact': true,
    'group_1/nam_contact': true,
    'group_1/phone_contact': true,
    'group_1/units': true,
  };
  LAB_GROUP_2_FIELDS.forEach(function (field) {
    keys[field.source] = true;
  });
  LAB_GROUP_3_FIELDS.forEach(function (dest) {
    keys['group_3/' + dest] = true;
  });
  return keys;
})();

function transformLabRecord_(rec) {
  const out = {};
  out[UUID_FIELD] =
    rec[UUID_FIELD] == null ? '' : rec[UUID_FIELD];

  /*
   * Preserve all fields except raw start/end fields and consumed
   * group_1 / group_2 / group_3 codes. `_submission_time` is also retained as a
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
  assignContactNamePhone_(out, rec);

  out.units = lookupCoded_(
    rec['group_1/units'],
    LAB_UNITS_MAP
  );

  LAB_GROUP_2_FIELDS.forEach(function (field) {
    out[field.dest] = lookupCoded_(
      rec[field.source],
      labGroup2Map_(field.dest)
    );
  });

  LAB_GROUP_3_FIELDS.forEach(function (dest) {
    out[dest] = lookupCoded_(
      rec['group_3/' + dest],
      YES_NO_MAP
    );
  });

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
    'contact_name',
    'phone_number',
    'units',
  ].concat(LAB_GROUP_2_FIELDS.map(function (field) {
    return field.dest;
  })).concat(LAB_GROUP_3_FIELDS);
}
