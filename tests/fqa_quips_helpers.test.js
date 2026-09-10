#!/usr/bin/env node
/**
 * Load the FQA QuIPS Apps Script files in a mocked Node context and
 * exercise transforms, routing, and secret hygiene.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatDate(d) {
  return (
    d.getUTCFullYear() +
    '-' + pad(d.getUTCMonth() + 1) +
    '-' + pad(d.getUTCDate()) +
    ' ' + pad(d.getUTCHours()) +
    ':' + pad(d.getUTCMinutes())
  );
}

const sandbox = {
  PropertiesService: {
    getScriptProperties: function () {
      return { getProperty: function () { return null; } };
    },
  },
  UrlFetchApp: {},
  Utilities: {
    formatDate: function (d) { return formatDate(d); },
    sleep: function () {},
  },
  Session: { getScriptTimeZone: function () { return 'UTC'; } },
  SpreadsheetApp: {},
  ScriptApp: {
    newTrigger: function () {
      return {
        timeBased: function () {
          return {
            everyDays: function () {
              return { atHour: function () { return { create: function () {} }; } };
            },
          };
        },
      };
    },
  },
  Logger: { log: function () {} },
  console: console,
};

vm.createContext(sandbox);

const files = [
  'FQA_QuIPS_Config.js',
  'FQA_QuIPS_Newborn_Unit.js',
  'FQA_QuIPS_Inpatient_Maternity.js',
  'FQA_QuIPS_Outpatient.js',
  'FQA_QuIPS_Lab.js',
  'FQA_QuIPS_Operating_Theatre.js',
  'FQA_QuIPS_Pharmacy.js',
  'FQA_QuIPS_Central_Store.js',
  'FQA_QuIPS_Facility_General.js',
  'FQA_QuIPS_Orchestrator.js',
];

files.forEach(function (name) {
  const code = fs.readFileSync(path.join(ROOT, name), 'utf8');
  vm.runInContext(code, sandbox, { filename: name });
});

function g(expr) {
  return vm.runInContext(expr, sandbox);
}

assert.strictEqual(g('KOBO_BASE_URL'), 'https://eu.kobotoolbox.org');
assert.strictEqual(g('PAGE_SIZE'), 300);
assert.strictEqual(g('FORM_CONFIG.length'), 8);

assert.strictEqual(g('lookupCoded_(1, YES_NO_MAP)'), 'Yes');
assert.strictEqual(g('lookupCoded_(0, YES_NO_MAP)'), 'No');
assert.strictEqual(g("lookupCoded_('', YES_NO_MAP)"), '');
assert.strictEqual(g('lookupCoded_(2, OUTPATIENT_YES_NO_MAP)'), 'No');

const nbu = g('transformNewbornUnitRecord_')({
  _uuid: 'nbu-1',
  starttime: '2026-02-01T08:15:00',
  endtime: '2026-02-01T10:00:00',
  today: '2026-02-01',
  'facility_profile/county': 4,
  'facility_profile/facility': 80,
  'facility_profile/gazetted_facility': 4,
  'facility_profile/unit': 1,
  'records/patient_files': '1 3',
  leftover_raw: 'keep-me',
});
assert.strictEqual(nbu._uuid, 'nbu-1');
assert.strictEqual(nbu.county, 'Nakuru');
assert.strictEqual(nbu.functional_nbu, 'Yes');
assert.strictEqual(nbu.patient_files_observation_charts, 'Yes');
assert.strictEqual(nbu.patient_files_weight_chart, 'Yes');
assert.strictEqual(nbu.patient_files_treatment_sheet, 'No');
assert.strictEqual(nbu.leftover_raw, 'keep-me');
assert.ok(g('newbornUnitPreferredHeaders_')().indexOf('_uuid') === 0);

const mat = g('transformInpatientMaternityRecord_')({
  _uuid: 'mat-1',
  starttime: '2026-03-02T09:00:00',
  _submission_time: '2026-03-02T12:00:00',
  'facility_profile/county': 1,
  'facility_profile/facility': 59,
  'facility_profile/gaz_facility': 3,
  'facility_profile/units': 1,
  'Section_5_Privacy_Confidentiality/beds_space': 1,
  'Section_7_Standard_operating_procedure/policy_a': '1 11',
  'wash/latrine': 8,
  leftover_mat: 'yes',
});
assert.strictEqual(mat.county, 'Mombasa');
assert.strictEqual(mat.facility_level, 'Level 3');
assert.strictEqual(mat.functional_maternity_unit, 'Yes');
assert.strictEqual(mat.bed_spacing, 'All beds are appropriately spaced');
assert.strictEqual(mat.sop_policy_a_pain_management_in_labour, 'Yes');
assert.strictEqual(mat.sop_policy_a_none, 'Yes');
assert.strictEqual(mat.wash_latrine, 'None');
assert.strictEqual(mat.leftover_mat, 'yes');

const opd = g('transformOutpatientRecord_')({
  _uuid: 'opd-1',
  start: '2026-04-01T07:00:00',
  end: '2026-04-01T08:00:00',
  _submission_time: '2026-04-01T09:00:00',
  'facility_profile/county': 6,
  'facility_profile/gazetted': 4,
  'facility_profile/unit': 2,
  'general_services/family_plan': '6',
});
assert.strictEqual(opd.county, 'Kakamega');
assert.strictEqual(opd.facility_level, 'Level 4');
assert.strictEqual(opd.unit, 'No');
assert.strictEqual(opd.general_services_family_plan_condoms_male_or_female, 'Yes');
assert.strictEqual(opd.general_services_family_plan_none, 'No');

const lab = g('transformLabRecord_')({
  _uuid: 'lab-1',
  starttime: '2026-05-01T11:00:00',
  endtime: '2026-05-01T11:30:00',
  _submission_time: '2026-05-01T12:00:00',
  'group_1/county': 4,
  'group_1/facility': 80,
  'group_1/gazetted': 3,
  'group_1/contact': 2,
  'group_1/nam_contact': 'Jane Lab',
  'group_1/phone_contact': '0711111111',
  'group_1/units': 3,
  'group_2/abo_blood': 1,
  'group_2/abo_monthly': 0,
  'group_2/perform_hbsag': 2,
  'group_2/hbsag_monthly': 1,
  'group_2/perform_rpr': 3,
  'group_2/rpr_monthly': 1,
  'group_2/perform_syphilis': 1,
  'group_2/urinalyisis_micro_mon': 0,
  'group_2/HPV_testing_monthly': 1,
  'group_3/lab_register': 1,
  'group_3/lab_register_used': 0,
  'group_3/request_form': 1,
  extra_lab: 9,
});
assert.strictEqual(lab.extra_lab, 9);
assert.ok(lab.date_started.indexOf('2026-05-01') === 0);
assert.strictEqual(lab.county, 'Nakuru');
assert.strictEqual(lab.facility, 'Bahati Sub County Hospital');
assert.strictEqual(lab.facility_level, 'Level 3');
assert.strictEqual(lab.contact, 'Nursing officer in charge');
assert.strictEqual(lab.contact_name, 'Jane Lab');
assert.strictEqual(lab.phone_number, '0711111111');
assert.strictEqual(lab.units, 'Basic Laboratory services');
assert.strictEqual(lab.blood_group_testing, 'Always');
assert.strictEqual(lab.abo_monthly, 'No');
assert.strictEqual(lab.perform_hbsag, 'Sometimes');
assert.strictEqual(lab.hbsag_monthly, 'Yes');
assert.strictEqual(lab.perform_rpr, 'Never');
assert.strictEqual(lab.rpr_monthly, 'Yes');
assert.strictEqual(lab.perform_syphilis, 'Always');
assert.strictEqual(lab.urinalyisis_micro_mon, 'No');
assert.strictEqual(lab.HPV_testing_monthly, 'Yes');
assert.strictEqual(lab.lab_register, 'Yes');
assert.strictEqual(lab.lab_register_used, 'No');
assert.strictEqual(lab.request_form, 'Yes');
assert.strictEqual(lab['group_3/lab_register'], undefined);
assert.strictEqual(lab['group_1/county'], undefined);
assert.strictEqual(lab['group_1/nam_contact'], undefined);
assert.strictEqual(lab['group_2/abo_blood'], undefined);
assert.strictEqual(lab['group_1/units'], undefined);

const labComprehensive = g('transformLabRecord_')({
  _uuid: 'lab-comp',
  _submission_time: '2026-05-02T12:00:00',
  'group_1/units': 4,
});
assert.strictEqual(labComprehensive.units, 'Comprehensive laboratory services');

const labLegacy = g('transformLabRecord_')({
  _uuid: 'lab-legacy',
  _submission_time: '2025-12-15T12:00:00',
  'group_1/facility': 80,
});
assert.strictEqual(labLegacy.facility, 'Matiliku Sub County Hospital');
assert.strictEqual(
  g('labPreferredHeaders_')().slice(0, 17).join('|'),
  '_uuid|date_started|date_ended|date_submitted|county|facility|facility_level|contact|contact_name|phone_number|units|blood_group_testing|abo_monthly|perform_hbsag|hbsag_monthly|perform_rpr|rpr_monthly'
);
const labHeaders = g('labPreferredHeaders_')();
assert.ok(labHeaders.indexOf('via_monthly') < labHeaders.indexOf('lab_register'));
assert.strictEqual(labHeaders.slice(-10).join('|'),
  'lab_register|lab_register_used|lab_summary_register|summary_reg_used|consumption_register|consumption_reg_used|hts_register|hts_reg_used|referral_register|request_form'
);

const routed = g('transformRecordsForSheet_')('Pharmacy', [{
  _uuid: 'ph-1',
  start: '2026-06-01T01:00:00',
  _submission_time: '2026-06-01T02:00:00',
  'facility_profile/county': 3,
  'facility_profile/facility': 16,
  'facility_profile/gazetted_facility': 4,
  'facility_profile/contact': 6,
  'group_1/nam_contact': 'Paul Pharmacy',
  'group_1/phone_contact': '0722222222',
}]);
assert.strictEqual(routed.length, 1);
assert.strictEqual(routed[0]._uuid, 'ph-1');
assert.strictEqual(routed[0].county, 'Kisii');
assert.strictEqual(routed[0].facility, 'Kisii Teaching And Referral Hospital (Level 6)');
assert.strictEqual(routed[0].facility_level, 'Level 4');
assert.strictEqual(routed[0].contact, 'Medical superintendent');
assert.strictEqual(routed[0].contact_name, 'Paul Pharmacy');
assert.strictEqual(routed[0].phone_number, '0722222222');
assert.strictEqual(routed[0]['facility_profile/county'], undefined);

const phLegacy = g('transformPharmacyRecord_')({
  _uuid: 'ph-legacy',
  _submission_time: '2025-11-01T08:00:00',
  'facility_profile/facility': 16,
});
assert.strictEqual(phLegacy.facility, 'Iyabe Sub County Hospital');

const phAlias = g('transformPharmacyRecord_')({
  _uuid: 'ph-alias',
  _submission_time: '2026-06-02T08:00:00',
  'facility_profile/nam_contact': 'Alias Name',
  'facility_profile/phone_contact': '0700000000',
});
assert.strictEqual(phAlias.contact_name, 'Alias Name');
assert.strictEqual(phAlias.phone_number, '0700000000');
assert.strictEqual(
  g('pharmacyPreferredHeaders_')().slice(0, 10).join('|'),
  '_uuid|date_started|date_ended|date_submitted|county|facility|facility_level|contact|contact_name|phone_number'
);
assert.strictEqual(g('preferredHeadersForSheet_')('Lab')[0], '_uuid');

const fg = g('transformFacilityGeneralRecord_')({
  _uuid: 'fg-1',
  starttime: '2026-07-01T09:00:00',
  endtime: '2026-07-01T10:00:00',
  _submission_time: '2026-07-01T11:00:00',
  'facility_profile/county': 5,
  'facility_profile/facilities': 109,
  'facility_profile/gazetted_facility': 4,
  'facility_profile/contact': 3,
  'group_1/nam_contact': 'Faith General',
  'group_1/phone_contact': '0733333333',
  leftover_fg: 'keep',
});
assert.strictEqual(fg.county, "Murang'a");
assert.strictEqual(fg.facility, "Murang'a County Referal Hospital");
assert.strictEqual(fg.facility_level, 'Level 4');
assert.strictEqual(fg.contact, 'Facility in charge');
assert.strictEqual(fg.contact_name, 'Faith General');
assert.strictEqual(fg.phone_number, '0733333333');
assert.strictEqual(fg.leftover_fg, 'keep');
assert.strictEqual(fg['facility_profile/facilities'], undefined);

const fgLegacy = g('transformFacilityGeneralRecord_')({
  _uuid: 'fg-legacy',
  _submission_time: '2025-06-01T08:00:00',
  'facility_profile/facilities': 16,
});
assert.strictEqual(fgLegacy.facility, 'Iyabe Sub County Hospital');
assert.strictEqual(
  g('facilityGeneralPreferredHeaders_')().slice(0, 10).join('|'),
  '_uuid|date_started|date_ended|date_submitted|county|facility|facility_level|contact|contact_name|phone_number'
);

const ot = g('transformOperatingTheatreRecord_')({
  _uuid: 'ot-1',
  start: '2026-08-01T08:00:00',
  end: '2026-08-01T09:00:00',
  _submission_time: '2026-08-01T10:00:00',
  'facility_profile/county': 2,
  'facility_profile/facility': 58,
  'facility_profile/gazetted_facility': 4,
  'facility_profile/contact': 5,
  'group_1/nam_contact': 'Owen Theatre',
  'group_1/phone_contact': '0744444444',
});
assert.strictEqual(ot.county, 'Makueni');
assert.strictEqual(ot.facility, 'Makueni County Referral Hospital');
assert.strictEqual(ot.facility_level, 'Level 4');
assert.strictEqual(ot.contact, 'Medical officer in charge');
assert.strictEqual(ot.contact_name, 'Owen Theatre');
assert.strictEqual(ot.phone_number, '0744444444');
assert.strictEqual(ot['facility_profile/facility'], undefined);

const otLegacy = g('transformOperatingTheatreRecord_')({
  _uuid: 'ot-legacy',
  _submission_time: '2025-03-01T08:00:00',
  'facility_profile/facility': 58,
});
assert.strictEqual(otLegacy.facility, 'Kasikeu Dispensary');
assert.strictEqual(
  g('operatingTheatrePreferredHeaders_')().slice(0, 10).join('|'),
  '_uuid|date_started|date_ended|date_submitted|county|facility|facility_level|contact|contact_name|phone_number'
);

const cs = g('transformCentralStoreRecord_')({
  _uuid: 'cs-1',
  starttime: '2026-09-01T08:00:00',
  endtime: '2026-09-01T09:00:00',
  _submission_time: '2026-09-01T10:00:00',
  'facility_profile/county': 6,
  'facility_profile/facility': 125,
  'facility_profile/gazetted_facility': 4,
  'facility_profile/contact': 1,
  'group_1/nam_contact': 'Cora Store',
  'group_1/phone_contact': '0755555555',
});
assert.strictEqual(cs.county, 'Kakamega');
assert.strictEqual(cs.facility, 'Kakamega County General Refferal Hospital');
assert.strictEqual(cs.facility_level, 'Level 4');
assert.strictEqual(cs.contact, 'Clinical officer in charge');
assert.strictEqual(cs.contact_name, 'Cora Store');
assert.strictEqual(cs.phone_number, '0755555555');
assert.strictEqual(cs['facility_profile/county'], undefined);

const csLegacy = g('transformCentralStoreRecord_')({
  _uuid: 'cs-legacy',
  _submission_time: '2025-04-01T08:00:00',
  'facility_profile/facility': 16,
});
assert.strictEqual(csLegacy.facility, 'Iyabe Sub County Hospital');
assert.strictEqual(
  g('centralStorePreferredHeaders_')().slice(0, 10).join('|'),
  '_uuid|date_started|date_ended|date_submitted|county|facility|facility_level|contact|contact_name|phone_number'
);

let threw = false;
try { g('transformRecordsForSheet_')('Unknown', []); } catch (e) { threw = true; }
assert.ok(threw);

files.concat(['FQA_QuIPS_Token.example.js', 'FQA_QuIPS_README.md', '.gitignore']).forEach(function (name) {
  const text = fs.readFileSync(path.join(ROOT, name), 'utf8');
  assert.ok(
    !/KOBO_API_TOKEN_OVERRIDE\s*=\s*["'][a-f0-9]{20,}["']/.test(text),
    'token override leaked in ' + name
  );
});

const example = fs.readFileSync(path.join(ROOT, 'FQA_QuIPS_Token.example.js'), 'utf8');
assert.ok(/KOBO_API_TOKEN_OVERRIDE = ''/.test(example));

const ignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
assert.ok(ignore.indexOf('FQA_QuIPS_Token.js') !== -1);

console.log('fqa_quips_helpers.test.js: all assertions passed');
