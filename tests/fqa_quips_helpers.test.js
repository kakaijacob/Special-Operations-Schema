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
  'FQA_QuIPS_Weighting.js',
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
  'group_3/standard_lab_request': '1 3 10',
  'group_3/sample_accpt_rej_form': 1,
  'group_3/temp_monitoring_form': 0,
  'group_3/quality_control_freq': 1,
  'group_4/cert_lab_techs': 2,
  'group_4/contract_lab_techs': 0,
  'group_4/county_lab_tech_working': 1,
  'group_4/contract_lab_techs_working': 3,
  'group_4/personnel': 1,
  'group_4/inadequate_staff': 0,
  'group_5/training_blood_safety': 2,
  'group_5/training_unit_biosafety': 0,
  'group_5/training_pro_testing_HIV': 1,
  'group_5/yearly_cpd': 1,
  'group_5/eqa': 0,
  'group_6/handwashing_protocol': 2,
  'group_6/have_quality_manual': 1,
  'group_6/sop': '1 16',
  'group_6/specimen_collection': '2 4',
  'group_6/guide_ref_critical_values': 1,
  'group_6/packaging_specimen': 0,
  'group_6/sop_lab': 1,
  'group_6/stock_inv_control_store': 0,
  'group_6/stock_inv_control_reagents': 1,
  'group_6/confirm_sops': '1 9 31',
  'group_7/water_source': 1,
  'group_7/consistent_water': 1,
  'group_7/connected_drainage_system': 0,
  'group_7/soap_available': 2,
  'group_7/separate_sinks': 1,
  'group_7/waste_management_protocol': 3,
  'group_7/segregation_wastes': 0,
  'group_7/functional_toilet': 1,
  'group_7/toilet_handwashing_area': 0,
  'group_7/sharp_container': 1,
  'group_7/sharp_container_full': 0,
  'group_8/waiting_area8': 1,
  'group_8/working_tables8': 0,
  'group_8/safety_cabinents8': 1,
  'group_8/well_ventilated': 0,
  'group_8/access_disabled': 1,
  'group_8/evidence8': 0,
  'group_9/list_referral': 1,
  'group_9/evidence_cal_pipettes': 0,
  'group_9/maintenance_chart_colo_hae': 1,
  'group_9/PPE_equipment': '1 5',
  'group_9/tb_diagnostic': '2',
  'group_9/genexpert': '1 3',
  'group_9/available_pipettes': 1,
  'group_9/available_centrifuge': 2,
  'group_9/vortex_mixer': 3,
  'group_9/maint_contract_colo_hae': 0,
  'group_9/sputum_smear': 1,
  'group_9/blood_count': 2,
  'group_10/portable_cool_boxes': 1,
  'group_10/urine_test_kit10': 2,
  'group_10/serum_electrolyete': 3,
  'group_10/inorganic_phosporous': 1,
  'group_10/platlets_all_types': 2,
  'group_10/type_o': 3,
  'group_11/internal_control_iqc': 1,
  'group_11/external_contrlol_eqc': 0,
  'group_11/fridge_used11': 1,
  'group_11/temp_record_monitor': 0,
  'group_11/tincl_lab_report': '1 9',
  'group_11/tblood_product_labels': '3 4',
  'group_12/on_laboratory_open': 2,
  'group_12/cross_match_24hours': 1,
  'group_12/abo_rh_24hours': 0,
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
assert.strictEqual(lab.standard_lab_request_patient_name, 'Yes');
assert.strictEqual(lab.standard_lab_request_patient_age_date_of_birth, 'No');
assert.strictEqual(lab.standard_lab_request_patient_gender, 'Yes');
assert.strictEqual(lab.standard_lab_request_none, 'Yes');
assert.strictEqual(lab.standard_lab_request_clinical_background, 'No');
assert.strictEqual(lab.sample_accpt_rej_form, 'Yes');
assert.strictEqual(lab.temp_monitoring_form, 'No');
assert.strictEqual(lab.quality_control_freq, 'Yes');
assert.strictEqual(lab.cert_lab_techs, 2);
assert.strictEqual(lab.contract_lab_techs, 0);
assert.strictEqual(lab.county_lab_tech_working, 1);
assert.strictEqual(lab.contract_lab_techs_working, 3);
assert.strictEqual(lab.personnel, 'Present');
assert.strictEqual(lab.inadequate_staff, 'No');
assert.strictEqual(lab.training_blood_safety, 2);
assert.strictEqual(lab.training_unit_biosafety, 0);
assert.strictEqual(lab.training_pro_testing_HIV, 1);
assert.strictEqual(lab.yearly_cpd, 'Yes');
assert.strictEqual(lab.eqa, 'No');
assert.strictEqual(lab.handwashing_protocol, 'They have written up to date protocols, not displayed');
assert.strictEqual(lab.have_quality_manual, 'Yes');
assert.strictEqual(lab.sop_personal_protective_equipment_ppe_use, 'Yes');
assert.strictEqual(lab.sop_chemical_safety, 'No');
assert.strictEqual(lab.sop_none, 'Yes');
assert.strictEqual(lab.specimen_collection_labelling, 'No');
assert.strictEqual(lab.specimen_collection_patient_safety, 'Yes');
assert.strictEqual(lab.specimen_collection_transportation_to_persons_responsible_for_primary_sample_collection, 'Yes');
assert.strictEqual(lab.specimen_collection_none, 'No');
assert.strictEqual(lab.guide_ref_critical_values, 'Yes');
assert.strictEqual(lab.packaging_specimen, 'No');
assert.strictEqual(lab.sop_lab, 'Yes');
assert.strictEqual(lab.stock_inv_control_store, 'No');
assert.strictEqual(lab.stock_inv_control_reagents, 'Yes');
assert.strictEqual(lab.confirm_sops_abo_blood_group_and_rh_testing, 'Yes');
assert.strictEqual(lab.confirm_sops_hiv_rapid_testing, 'Yes');
assert.strictEqual(lab.confirm_sops_via_testing, 'Yes');
assert.strictEqual(lab.confirm_sops_hbsag_testing, 'No');
assert.strictEqual(lab.water_source, 'Present, functional');
assert.strictEqual(lab.consistent_water, 'Yes');
assert.strictEqual(lab.connected_drainage_system, 'No');
assert.strictEqual(lab.soap_available, 'Present in some service areas');
assert.strictEqual(lab.separate_sinks, 'Yes');
assert.strictEqual(lab.waste_management_protocol, 'Not present');
assert.strictEqual(lab.segregation_wastes, 'No');
assert.strictEqual(lab.functional_toilet, 'Yes');
assert.strictEqual(lab.toilet_handwashing_area, 'No');
assert.strictEqual(lab.sharp_container, 'Yes');
assert.strictEqual(lab.sharp_container_full, 'No');
assert.strictEqual(lab.waiting_area8, 'Yes');
assert.strictEqual(lab.working_tables8, 'No');
assert.strictEqual(lab.safety_cabinents8, 'Yes');
assert.strictEqual(lab.well_ventilated, 'No');
assert.strictEqual(lab.access_disabled, 'Yes');
assert.strictEqual(lab.evidence8, 'No');
assert.strictEqual(lab.list_referral, 'Yes');
assert.strictEqual(lab.evidence_cal_pipettes, 'No');
assert.strictEqual(lab.maintenance_chart_colo_hae, 'Yes');
assert.strictEqual(lab.PPE_equipment_gloves, 'Yes');
assert.strictEqual(lab.PPE_equipment_masks, 'No');
assert.strictEqual(lab.PPE_equipment_none, 'Yes');
assert.strictEqual(lab.tb_diagnostic_sputum_smear_microscopy, 'No');
assert.strictEqual(lab.tb_diagnostic_genexpert_mtb_rif_assay, 'Yes');
assert.strictEqual(lab.genexpert_genexpert_machine, 'Yes');
assert.strictEqual(lab.genexpert_reliable_power_source, 'Yes');
assert.strictEqual(lab.genexpert_cartridges, 'No');
assert.strictEqual(lab.available_pipettes, 'Yes, functional');
assert.strictEqual(lab.available_centrifuge, 'Yes, non-functional');
assert.strictEqual(lab.vortex_mixer, 'No');
assert.strictEqual(lab.maint_contract_colo_hae, 'Not available');
assert.strictEqual(lab.sputum_smear, 'Ziehl-Neelsen Staining');
assert.strictEqual(lab.blood_count, 'Manual Method');
assert.strictEqual(lab.portable_cool_boxes, 'Always available');
assert.strictEqual(lab.urine_test_kit10, 'Sometimes available');
assert.strictEqual(lab.serum_electrolyete, 'Never available');
assert.strictEqual(lab.inorganic_phosporous, 'Always available');
assert.strictEqual(lab.platlets_all_types, 'Sometimes available');
assert.strictEqual(lab.type_o, 'Never available');
assert.strictEqual(lab.internal_control_iqc, 'Yes');
assert.strictEqual(lab.external_contrlol_eqc, 'No');
assert.strictEqual(lab.fridge_used11, 'Yes');
assert.strictEqual(lab.temp_record_monitor, 'No');
assert.strictEqual(lab.tincl_lab_report_examination_performed, 'Yes');
assert.strictEqual(lab.tincl_lab_report_patient_identification, 'No');
assert.strictEqual(lab.tincl_lab_report_none, 'Yes');
assert.strictEqual(lab.tblood_product_labels_name_of_the_blood_product, 'No');
assert.strictEqual(lab.tblood_product_labels_blood_type_abo_and_rh_factor, 'Yes');
assert.strictEqual(lab.tblood_product_labels_batch_number, 'Yes');
assert.strictEqual(lab.tblood_product_labels_none, 'No');
assert.strictEqual(lab.on_laboratory_open, '8-12 HOURS');
assert.strictEqual(lab.cross_match_24hours, 'Yes');
assert.strictEqual(lab.abo_rh_24hours, 'No');
assert.strictEqual(lab.stand_lab_report, '');
assert.strictEqual(lab.stool_polypot, '');
assert.strictEqual(lab.ziehl_stain_bright_field_microscope, '');
assert.strictEqual(lab['group_12/on_laboratory_open'], undefined);
assert.strictEqual(lab['group_12/cross_match_24hours'], undefined);
assert.strictEqual(lab['group_12/abo_rh_24hours'], undefined);
assert.strictEqual(lab['group_11/internal_control_iqc'], undefined);
assert.strictEqual(lab['group_11/tincl_lab_report'], undefined);
assert.strictEqual(lab['group_11/tblood_product_labels'], undefined);
assert.strictEqual(lab['group_10/portable_cool_boxes'], undefined);
assert.strictEqual(lab['group_10/type_o'], undefined);
assert.strictEqual(lab['group_9/PPE_equipment'], undefined);
assert.strictEqual(lab['group_9/blood_count'], undefined);
assert.strictEqual(lab.chairs_staff8, '');
assert.strictEqual(lab['group_8/evidence8'], undefined);
assert.strictEqual(lab['group_8/waiting_area8'], undefined);
assert.strictEqual(lab['group_7/water_source'], undefined);
assert.strictEqual(lab['group_7/soap_available'], undefined);
assert.strictEqual(lab['group_6/sop'], undefined);
assert.strictEqual(lab['group_6/confirm_sops'], undefined);
assert.strictEqual(lab['group_6/handwashing_protocol'], undefined);
assert.strictEqual(lab['group_5/yearly_cpd'], undefined);
assert.strictEqual(lab['group_5/training_blood_safety'], undefined);
assert.strictEqual(lab['group_4/cert_lab_techs'], undefined);
assert.strictEqual(lab['group_4/personnel'], undefined);
assert.strictEqual(lab['group_3/standard_lab_request'], undefined);
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
assert.strictEqual(labComprehensive.standard_lab_request_patient_name, '');
assert.strictEqual(labComprehensive.standard_lab_request_none, '');
assert.strictEqual(labComprehensive.sample_accpt_rej_form, '');
assert.strictEqual(labComprehensive.cert_lab_techs, '');
assert.strictEqual(labComprehensive.personnel, '');
assert.strictEqual(labComprehensive.inadequate_staff, '');
assert.strictEqual(labComprehensive.training_blood_safety, '');
assert.strictEqual(labComprehensive.training_pro_testing_HIV, '');
assert.strictEqual(labComprehensive.yearly_cpd, '');
assert.strictEqual(labComprehensive.eqa, '');
assert.strictEqual(labComprehensive.handwashing_protocol, '');
assert.strictEqual(labComprehensive.have_quality_manual, '');
assert.strictEqual(labComprehensive.sop_none, '');
assert.strictEqual(labComprehensive.specimen_collection_labelling, '');
assert.strictEqual(labComprehensive.guide_ref_critical_values, '');
assert.strictEqual(labComprehensive.confirm_sops_via_testing, '');
assert.strictEqual(labComprehensive.water_source, '');
assert.strictEqual(labComprehensive.soap_available, '');
assert.strictEqual(labComprehensive.sharp_container_full, '');
assert.strictEqual(labComprehensive.waiting_area8, '');
assert.strictEqual(labComprehensive.access_disabled, '');
assert.strictEqual(labComprehensive.evidence8, '');
assert.strictEqual(labComprehensive.list_referral, '');
assert.strictEqual(labComprehensive.PPE_equipment_gloves, '');
assert.strictEqual(labComprehensive.available_pipettes, '');
assert.strictEqual(labComprehensive.blood_count, '');
assert.strictEqual(labComprehensive.portable_cool_boxes, '');
assert.strictEqual(labComprehensive.type_o, '');
assert.strictEqual(labComprehensive.internal_control_iqc, '');
assert.strictEqual(labComprehensive.external_contrlol_eqc, '');
assert.strictEqual(labComprehensive.tincl_lab_report_none, '');
assert.strictEqual(labComprehensive.tblood_product_labels_none, '');
assert.strictEqual(labComprehensive.on_laboratory_open, '');
assert.strictEqual(labComprehensive.cross_match_24hours, '');
assert.strictEqual(labComprehensive.abo_rh_24hours, '');

const labHoursOpen = g('transformLabRecord_')({
  _uuid: 'lab-hours',
  _submission_time: '2026-05-08T12:00:00',
  'group_12/on_laboratory_open': 1,
  'group_12/cross_match_24hours': 0,
  'group_12/abo_rh_24hours': 1,
});
assert.strictEqual(labHoursOpen.on_laboratory_open, '<8 HOURS');
assert.strictEqual(labHoursOpen.cross_match_24hours, 'No');
assert.strictEqual(labHoursOpen.abo_rh_24hours, 'Yes');
assert.strictEqual(
  g('transformLabRecord_')({
    _uuid: 'lab-hours-24',
    _submission_time: '2026-05-08T13:00:00',
    'group_12/on_laboratory_open': 3,
  }).on_laboratory_open,
  '24 HOURS'
);

const labBloodCountNone = g('transformLabRecord_')({
  _uuid: 'lab-bc-3',
  _submission_time: '2026-05-07T12:00:00',
  'group_9/blood_count': 3,
  'group_9/sputum_smear': 2,
  'group_9/maint_contract_colo_hae': 1,
});
assert.strictEqual(labBloodCountNone.blood_count, 'Full blood count not available in this unit');
assert.strictEqual(labBloodCountNone.sputum_smear, 'Auramine-O Staining');
assert.strictEqual(labBloodCountNone.maint_contract_colo_hae, 'Available');

const labSoapNone = g('transformLabRecord_')({
  _uuid: 'lab-soap-3',
  _submission_time: '2026-05-06T12:00:00',
  'group_7/soap_available': 3,
  'group_7/water_source': 2,
  'group_7/waste_management_protocol': 1,
});
assert.strictEqual(labSoapNone.soap_available, 'Present in no service areas');
assert.strictEqual(labSoapNone.water_source, 'Present, non-functional');
assert.strictEqual(labSoapNone.waste_management_protocol, 'Present, well displayed');

const labHandwashingDisplayed = g('transformLabRecord_')({
  _uuid: 'lab-hw-1',
  _submission_time: '2026-05-04T12:00:00',
  'group_6/handwashing_protocol': 1,
});
assert.strictEqual(
  labHandwashingDisplayed.handwashing_protocol,
  'They have displayed, up to date protocols'
);

const labHandwashingNone = g('transformLabRecord_')({
  _uuid: 'lab-hw-3',
  _submission_time: '2026-05-05T12:00:00',
  'group_6/handwashing_protocol': 3,
});
assert.strictEqual(
  labHandwashingNone.handwashing_protocol,
  'They do not have up to date displayed or written protocols'
);

const labPersonnelMissing = g('transformLabRecord_')({
  _uuid: 'lab-personnel-0',
  _submission_time: '2026-05-03T12:00:00',
  'group_4/personnel': 0,
  'group_4/inadequate_staff': 1,
});
assert.strictEqual(labPersonnelMissing.personnel, 'Not present');
assert.strictEqual(labPersonnelMissing.inadequate_staff, 'Yes');

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
assert.ok(labHeaders.indexOf('request_form') < labHeaders.indexOf('standard_lab_request_patient_name'));
assert.ok(labHeaders.indexOf('standard_lab_request_none') < labHeaders.indexOf('sample_accpt_rej_form'));
assert.ok(labHeaders.indexOf('quality_control_freq') < labHeaders.indexOf('cert_lab_techs'));
assert.ok(labHeaders.indexOf('inadequate_staff') < labHeaders.indexOf('training_blood_safety'));
assert.ok(labHeaders.indexOf('training_pro_testing_HIV') < labHeaders.indexOf('yearly_cpd'));
assert.ok(labHeaders.indexOf('eqa') < labHeaders.indexOf('handwashing_protocol'));
assert.ok(labHeaders.indexOf('have_quality_manual') < labHeaders.indexOf('sop_personal_protective_equipment_ppe_use'));
assert.ok(labHeaders.indexOf('sop_none') < labHeaders.indexOf('specimen_collection_labelling'));
assert.ok(labHeaders.indexOf('specimen_collection_none') < labHeaders.indexOf('guide_ref_critical_values'));
assert.ok(labHeaders.indexOf('stock_inv_control_reagents') < labHeaders.indexOf('confirm_sops_abo_blood_group_and_rh_testing'));
assert.ok(labHeaders.indexOf('confirm_sops_via_testing') < labHeaders.indexOf('water_source'));
assert.ok(labHeaders.indexOf('sharp_container_full') < labHeaders.indexOf('waiting_area8'));
assert.ok(labHeaders.indexOf('access_disabled') < labHeaders.indexOf('evidence8'));
assert.ok(labHeaders.indexOf('evidence8') < labHeaders.indexOf('list_referral'));
assert.ok(labHeaders.indexOf('maintenance_chart_colo_hae') < labHeaders.indexOf('PPE_equipment_gloves'));
assert.ok(labHeaders.indexOf('blood_type_crossmatch_equi_none') < labHeaders.indexOf('available_pipettes'));
assert.ok(labHeaders.indexOf('vortex_mixer') < labHeaders.indexOf('maint_contract_colo_hae'));
assert.ok(labHeaders.indexOf('blood_count') < labHeaders.indexOf('portable_cool_boxes'));
assert.ok(labHeaders.indexOf('urine_test_kit10') < labHeaders.indexOf('serum_electrolyete'));
assert.ok(labHeaders.indexOf('type_o') < labHeaders.indexOf('internal_control_iqc'));
assert.ok(labHeaders.indexOf('temp_record_monitor') < labHeaders.indexOf('tincl_lab_report_examination_performed'));
assert.ok(labHeaders.indexOf('tincl_lab_report_none') < labHeaders.indexOf('tblood_product_labels_name_of_the_blood_product'));
assert.ok(labHeaders.indexOf('tblood_product_labels_none') < labHeaders.indexOf('on_laboratory_open'));
assert.strictEqual(labHeaders.slice(-3).join('|'),
  'on_laboratory_open|cross_match_24hours|abo_rh_24hours'
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
  'facility_profile/unit': '2 8',
  'record/activity_logs': 1,
  'record/activity_used': 0,
  'record/dda_used': 1,
  'hrh/pharmacist': 2,
  'hrh/pharmce': 0,
  'hrh/pharmtech': 4,
  'hrh/on_duty': 1,
  'hrh/avail_opening': 0,
  'hrh/prese': 1,
  'sop/handwashing': 2,
  'train/cpds': 1,
  'sop/request': 0,
  'sop/recording': 1,
  'sanitation/water_consistent': 1,
  'sanitation/drainage': 0,
  'sanitation/visible_cont': 1,
  'sanitation/water_source': 1,
  'sanitation/soap_disp': 2,
  'Section_7_Infrastructure/maintained': 1,
  'Section_7_Infrastructure/barrier': 0,
  'Section_7_Infrastructure/certification': 1,
  'Section_8_Privacy_Confidentiality/privacy': 0,
  'Section_9_Equipment/computer': 1,
  'Section_9_Equipment/therm_readings': 0,
  'Section_9_Equipment/fridge': 1,
  'Section_9_Equipment/cabinet': 2,
  'Section_9_Equipment/receipt': 3,
  'Section_10_Commodities/prescription': 1,
  'Section_10_Commodities/iron_tab': 2,
  'Section_10_Commodities/fe_condoms': 3,
  'Section_10_Commodities/nutrition': 2,
  'Section_10_Commodities/chlorxidine': 1,
  'Section_10_Commodities/Iv_hydro_freq': 1,
  'Section_10_Commodities/iron_freq': 0,
  'Section_10_Commodities/fe_cond_freq': 1,
  'Section_10_Commodities/oxy_store': 0,
  'best_practices/patient_info': 1,
  'best_practices/authorized': 0,
  'best_practices/secure': 1,
  'operation/opening': 2,
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
assert.strictEqual(routed[0].units_pharmacy_services, 'Yes');
assert.strictEqual(routed[0].units_outpatient_mnh_services, 'No');
assert.strictEqual(routed[0].units_central_store_non_pharm_commodities, 'Yes');
assert.strictEqual(routed[0].units_newborn_unit_services, 'No');
assert.strictEqual(routed[0].activity_logs, 'Yes');
assert.strictEqual(routed[0].activity_used, 'No');
assert.strictEqual(routed[0].dda_used, 'Yes');
assert.strictEqual(routed[0].workload, '');
assert.strictEqual(routed[0].pharmacist, 2);
assert.strictEqual(routed[0].pharmce, 0);
assert.strictEqual(routed[0].pharmtech, 4);
assert.strictEqual(routed[0].clinical_pharm, '');
assert.strictEqual(routed[0].on_duty, 'Yes');
assert.strictEqual(routed[0].avail_opening, 'No');
assert.strictEqual(routed[0].prese, 'Present');
assert.strictEqual(routed[0].handwashing, 'They have written up to date protocols, not displayed');
assert.strictEqual(routed[0].cpds, 'Yes');
assert.strictEqual(routed[0].request, 'No');
assert.strictEqual(routed[0].recording, 'Yes');
assert.strictEqual(routed[0].del_medication, '');
assert.strictEqual(routed[0].water_consistent, 'Yes');
assert.strictEqual(routed[0].drainage, 'No');
assert.strictEqual(routed[0].visible_cont, 'Yes');
assert.strictEqual(routed[0].water_source, 'Present, functional');
assert.strictEqual(routed[0].soap_disp, 'Present in some service areas');
assert.strictEqual(routed[0].maintained, 'Yes');
assert.strictEqual(routed[0].barrier, 'No');
assert.strictEqual(routed[0].certification, 'Yes');
assert.strictEqual(routed[0].work_tables, '');
assert.strictEqual(routed[0].privacy, 'No');
assert.strictEqual(routed[0].computer, 'Yes');
assert.strictEqual(routed[0].therm_readings, 'No');
assert.strictEqual(routed[0].fridge, 'Yes, functional');
assert.strictEqual(routed[0].cabinet, 'Yes, cabinet not locked today');
assert.strictEqual(routed[0].receipt, 'Not applicable');
assert.strictEqual(routed[0].prescription, 'Always available');
assert.strictEqual(routed[0].iron_tab, 'Sometimes available');
assert.strictEqual(routed[0].fe_condoms, 'Never available');
assert.strictEqual(routed[0].nutrition, 'Available in nutrition unit');
assert.strictEqual(routed[0].chlorxidine, 'Always available');
assert.strictEqual(routed[0].latex, '');
assert.strictEqual(routed[0].Iv_hydro_freq, 'Yes');
assert.strictEqual(routed[0].iron_freq, 'No');
assert.strictEqual(routed[0].fe_cond_freq, 'Yes');
assert.strictEqual(routed[0].oxy_store, 'No');
assert.strictEqual(routed[0].folic_freq, '');
assert.strictEqual(routed[0].patient_info, 'Yes');
assert.strictEqual(routed[0].authorized, 'No');
assert.strictEqual(routed[0].secure, 'Yes');
assert.strictEqual(routed[0].opening, 'Sometimes when the facility is open, but not always');
assert.strictEqual(routed[0]['best_practices/patient_info'], undefined);
assert.strictEqual(routed[0]['operation/opening'], undefined);
assert.strictEqual(routed[0]['Section_10_Commodities/nutrition'], undefined);
assert.strictEqual(routed[0]['Section_10_Commodities/prescription'], undefined);
assert.strictEqual(routed[0]['Section_10_Commodities/iron_freq'], undefined);
assert.strictEqual(routed[0]['Section_7_Infrastructure/maintained'], undefined);
assert.strictEqual(routed[0]['Section_9_Equipment/fridge'], undefined);
assert.strictEqual(routed[0]['sop/handwashing'], undefined);
assert.strictEqual(routed[0]['train/cpds'], undefined);
assert.strictEqual(routed[0]['sanitation/water_source'], undefined);
assert.strictEqual(routed[0]['facility_profile/unit'], undefined);
assert.strictEqual(routed[0]['record/activity_logs'], undefined);
assert.strictEqual(routed[0]['hrh/pharmacist'], undefined);
assert.strictEqual(routed[0]['hrh/prese'], undefined);

const phLegacy = g('transformPharmacyRecord_')({
  _uuid: 'ph-legacy',
  _submission_time: '2025-11-01T08:00:00',
  'facility_profile/facility': 16,
});
assert.strictEqual(phLegacy.facility, 'Iyabe Sub County Hospital');
assert.strictEqual(phLegacy.units_pharmacy_services, '');
assert.strictEqual(phLegacy.activity_logs, '');
assert.strictEqual(phLegacy.pharmacist, '');
assert.strictEqual(phLegacy.on_duty, '');
assert.strictEqual(phLegacy.prese, '');
assert.strictEqual(phLegacy.handwashing, '');
assert.strictEqual(phLegacy.cpds, '');
assert.strictEqual(phLegacy.water_source, '');
assert.strictEqual(phLegacy.soap_disp, '');
assert.strictEqual(phLegacy.maintained, '');
assert.strictEqual(phLegacy.fridge, '');
assert.strictEqual(phLegacy.cabinet, '');
assert.strictEqual(phLegacy.receipt, '');
assert.strictEqual(phLegacy.nutrition, '');
assert.strictEqual(phLegacy.prescription, '');
assert.strictEqual(phLegacy.iron_freq, '');
assert.strictEqual(phLegacy.Iv_hydro_freq, '');
assert.strictEqual(phLegacy.patient_info, '');
assert.strictEqual(phLegacy.authorized, '');
assert.strictEqual(phLegacy.secure, '');
assert.strictEqual(phLegacy.opening, '');

const phAlias = g('transformPharmacyRecord_')({
  _uuid: 'ph-alias',
  _submission_time: '2026-06-02T08:00:00',
  'facility_profile/nam_contact': 'Alias Name',
  'facility_profile/phone_contact': '0700000000',
  'hrh/prese': 0,
  'facility_profile/unit': '1 5 6',
  'sop/handwashing': 1,
  'sanitation/soap_disp': 3,
  'sanitation/water_source': 2,
  'Section_9_Equipment/fridge': 2,
  'Section_9_Equipment/cabinet': 1,
  'Section_9_Equipment/receipt': 2,
  'Section_10_Commodities/artesunete': 2,
  'Section_10_Commodities/pyrizimomide': 3,
  'record/dda_used': 1,
  'Section_7_Infrastructure/wall_clock': 1,
});
assert.strictEqual(phAlias.contact_name, 'Alias Name');
assert.strictEqual(phAlias.phone_number, '0700000000');
assert.strictEqual(phAlias.prese, 'Not present');
assert.strictEqual(phAlias.units_outpatient_mnh_services, 'Yes');
assert.strictEqual(phAlias.units_inpatient_bemonc_services, 'Yes');
assert.strictEqual(phAlias.units_newborn_unit_services, 'Yes');
assert.strictEqual(phAlias.units_pharmacy_services, 'No');
assert.strictEqual(phAlias.handwashing, 'They have displayed, up to date protocols');
assert.strictEqual(phAlias.soap_disp, 'Absent in all service areas');
assert.strictEqual(phAlias.water_source, 'Present, non-functional');
assert.strictEqual(
  g('transformPharmacyRecord_')({
    _uuid: 'ph-hw-3',
    _submission_time: '2026-06-03T08:00:00',
    'sop/handwashing': 3,
  }).handwashing,
  'They do not have up displayed or written protocols'
);
assert.strictEqual(phAlias.fridge, 'Yes, non-functional');
assert.strictEqual(phAlias.cabinet, 'Yes, cabinet locked today');
assert.strictEqual(phAlias.receipt, 'No');
assert.strictEqual(
  g('transformPharmacyRecord_')({
    _uuid: 'ph-nutrition-4',
    _submission_time: '2026-06-06T08:00:00',
    'Section_10_Commodities/nutrition': 4,
  }).nutrition,
  'Never available'
);
assert.strictEqual(
  g('transformPharmacyRecord_')({
    _uuid: 'ph-nutrition-3',
    _submission_time: '2026-06-06T08:00:00',
    'Section_10_Commodities/nutrition': 3,
  }).nutrition,
  'Sometimes available'
);
assert.strictEqual(
  g('transformPharmacyRecord_')({
    _uuid: 'ph-nutrition-1',
    _submission_time: '2026-06-06T08:00:00',
    'Section_10_Commodities/nutrition': 1,
  }).nutrition,
  'Always available'
);
assert.strictEqual(
  g('transformPharmacyRecord_')({
    _uuid: 'ph-opening-1',
    _submission_time: '2026-06-07T08:00:00',
    'best_practices/patient_info': 0,
    'best_practices/authorized': 1,
    'best_practices/secure': 0,
    'operation/opening': 1,
  }).opening,
  'Accessible at all facility open times'
);
assert.strictEqual(
  g('transformPharmacyRecord_')({
    _uuid: 'ph-opening-3',
    _submission_time: '2026-06-07T08:00:00',
    'operation/opening': 3,
  }).opening,
  'Rarely assessible (it is often difficult to access pharmaceuticals in this facility)'
);
assert.strictEqual(
  g('transformPharmacyRecord_')({
    _uuid: 'ph-opening-1b',
    _submission_time: '2026-06-07T08:00:00',
    'best_practices/patient_info': 0,
    'best_practices/authorized': 1,
    'best_practices/secure': 0,
    'operation/opening': 1,
  }).patient_info,
  'No'
);
assert.strictEqual(
  g('transformPharmacyRecord_')({
    _uuid: 'ph-opening-1c',
    _submission_time: '2026-06-07T08:00:00',
    'best_practices/authorized': 1,
  }).authorized,
  'Yes'
);
assert.strictEqual(
  g('transformPharmacyRecord_')({
    _uuid: 'ph-opening-1d',
    _submission_time: '2026-06-07T08:00:00',
    'best_practices/secure': 0,
  }).secure,
  'No'
);
assert.strictEqual(phAlias.artesunete, 'Sometimes available');
assert.strictEqual(phAlias.pyrizimomide, 'Never available');
assert.strictEqual(phAlias.dda_used, 'Yes');
assert.strictEqual(phAlias.wall_clock, 'Yes');
const phCommodityOverlap = g('transformPharmacyRecord_')({
  _uuid: 'ph-commod-overlap',
  _submission_time: '2026-06-05T08:00:00',
  'record/dda_used': 1,
  'Section_7_Infrastructure/wall_clock': 1,
  'Section_10_Commodities/dda_used': 0,
  'Section_10_Commodities/wall_clock': 0,
});
assert.strictEqual(phCommodityOverlap.dda_used, 'No');
assert.strictEqual(phCommodityOverlap.wall_clock, 'No');
assert.strictEqual(
  g('transformPharmacyRecord_')({
    _uuid: 'ph-equip-3',
    _submission_time: '2026-06-04T08:00:00',
    'Section_9_Equipment/fridge': 3,
    'Section_9_Equipment/cabinet': 3,
    'Section_9_Equipment/receipt': 1,
  }).fridge,
  'No'
);
assert.strictEqual(
  g('transformPharmacyRecord_')({
    _uuid: 'ph-equip-3b',
    _submission_time: '2026-06-04T08:00:00',
    'Section_9_Equipment/cabinet': 3,
    'Section_9_Equipment/receipt': 1,
  }).cabinet,
  'No'
);
assert.strictEqual(
  g('transformPharmacyRecord_')({
    _uuid: 'ph-equip-3c',
    _submission_time: '2026-06-04T08:00:00',
    'Section_9_Equipment/receipt': 1,
  }).receipt,
  'Yes'
);
assert.strictEqual(
  g('pharmacyPreferredHeaders_')().slice(0, 10).join('|'),
  '_uuid|date_started|date_ended|date_submitted|county|facility|facility_level|contact|contact_name|phone_number'
);
const phHeaders = g('pharmacyPreferredHeaders_')();
assert.ok(phHeaders.indexOf('phone_number') < phHeaders.indexOf('units_outpatient_mnh_services'));
assert.ok(phHeaders.indexOf('units_central_store_non_pharm_commodities') < phHeaders.indexOf('activity_logs'));
assert.ok(phHeaders.indexOf('dda_used') < phHeaders.indexOf('pharmacist'));
assert.ok(phHeaders.indexOf('pharmtech') < phHeaders.indexOf('on_duty'));
assert.ok(phHeaders.indexOf('avail_opening') < phHeaders.indexOf('prese'));
assert.ok(phHeaders.indexOf('prese') < phHeaders.indexOf('handwashing'));
assert.ok(phHeaders.indexOf('handwashing') < phHeaders.indexOf('cpds'));
assert.ok(phHeaders.indexOf('recording') < phHeaders.indexOf('water_consistent'));
assert.ok(phHeaders.indexOf('visible_cont') < phHeaders.indexOf('water_source'));
assert.ok(phHeaders.indexOf('soap_disp') < phHeaders.indexOf('maintained'));
assert.ok(phHeaders.indexOf('certification') < phHeaders.indexOf('privacy'));
assert.ok(phHeaders.indexOf('privacy') < phHeaders.indexOf('computer'));
assert.ok(phHeaders.indexOf('therm_readings') < phHeaders.indexOf('fridge'));
assert.ok(phHeaders.indexOf('receipt') < phHeaders.indexOf('prescription'));
assert.ok(phHeaders.indexOf('fe_condoms') < phHeaders.indexOf('nutrition'));
assert.ok(phHeaders.indexOf('nutrition') < phHeaders.indexOf('iron_freq'));
assert.ok(phHeaders.indexOf('Iv_hydro_freq') < phHeaders.indexOf('oxy_store'));
assert.ok(phHeaders.indexOf('fe_cond_freq') < phHeaders.indexOf('patient_info'));
assert.ok(phHeaders.indexOf('patient_info') < phHeaders.indexOf('authorized'));
assert.ok(phHeaders.indexOf('authorized') < phHeaders.indexOf('secure'));
assert.ok(phHeaders.indexOf('secure') < phHeaders.indexOf('opening'));
assert.strictEqual(phHeaders.slice(-4).join('|'),
  'patient_info|authorized|secure|opening'
);
assert.strictEqual(g('preferredHeadersForSheet_')('Lab')[0], '_uuid');

const routedFg = g('transformRecordsForSheet_')('Facility General', [{
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
  'facility_profile/units': '1 8 9',
  'health_records_clients/data_collection_tools': 3,
  'health_records_clients/unique_patient_identifer': 1,
  'health_records_clients/responsible_person': 0,
  'health_records_clients/storage_equipment': 1,
  'health_records_clients/electronic_registry': 0,
  'health_records_clients/data_storage_cap': 1,
  'health_records_clients/written_collection_tools': 0,
  'health_records_clients/secure_registers': '1 3',
  'national_data_collection/upload_data2': 1,
  'national_data_collection/record': '2 5 8',
  'national_data_collection/mpdr_committee2': 5,
  'national_data_collection/standard_hours': 0,
  'human_resource_health/medical_officer': 3,
  'human_resource_health/medical_officer3': 1,
  'human_resource_health/clinical_officer': 0,
  'human_resource_health/clinical_officer3': 0,
  'human_resource_health/health_records': 2,
  'human_resource_health/nutritionist': 1,
  'human_resource_health/facility_staff3': '1 4',
  'human_resource_health/roster_displayed': 1,
  'human_resource_health/clear_comm': 0,
  'human_resource_health/have_qit': 1,
  'human_resource_health/qit_meet': 1,
  'human_resource_health/have_wit': 0,
  'human_resource_health/wit_meet': 5,
  'human_resource_health/have_sit': 1,
  'human_resource_health/sit_meet': 4,
  'wash_ipc/ipc_committee': 1,
  'wash_ipc/dis_sharps': 2,
  'wash_ipc/inci_avail_funct': 0,
  'wash_ipc/inci_petrol': 1,
  'wash_ipc/dispose_medwast': 3,
  'wash_ipc/designated_cleaning': 1,
  'wash_ipc/control_traffic': 0,
  'wash_ipc/three_bucket': 1,
  'wash_ipc/sop_instrument': 0,
  'wash_ipc/chlorine': 1,
  'wash_ipc/enzymatic_sol': 2,
  'wash_ipc/chlorine_exidine': 3,
  'wash_ipc/central_steril': 1,
  'wash_ipc/sterlization_place': '2 5',
  'wash_ipc/safe_water': 1,
  'wash_ipc/func_water_source': 0,
  'wash_ipc/main_source': 10,
  'wash_ipc/specify_main': 'Roof tank',
  'wash_ipc/oth_source': '1 11',
  'wash_ipc/specify_oth_source': 'Vendor jerry cans',
  'wash_ipc/soiled_linen_pro': 3,
  'wash_ipc/contact_patient': 1,
  'wash_ipc/equipment_cleaned': 2,
  'wash_ipc/floors': 1,
  'wash_ipc/sinks': 4,
  'wash_ipc/bathrooms': 3,
  'wash_ipc/sche_bathrooms': 1,
  'wash_ipc/table_tops': 2,
  'infrastructure/two_doors': 1,
  'infrastructure/access_ramp': 0,
  'infrastructure/licence': 1,
  'infrastructure/maintencance_log': 0,
  'infrastructure/cleaning_protocol': 1,
  'infrastructure/vis_signage': 2,
  'infrastructure/main_elec_source': 4,
  'infrastructure/elect_source': 'Mini hydro',
  'infrastructure/elect_sec': 'Shared solar',
  'infrastructure/processed_linens': 1,
  'infrastructure/sec_electricity': '1 3',
  'infrastructure/security_measures6': '2 4',
  'infrastructure/housekeeping': '1 7',
  'services_offered/functional_ambulance': 1,
  'services_offered/unable_to_transport': 0,
  'services_offered/formal_agreement': 1,
  'services_offered/systems_place': '1 5',
  'commodities/run_out_fuel': 0,
  'adherence_best_practice/uniforms_badges': 1,
  'adherence_best_practice/pest_control': 0,
  'hours_operation/opening_hours': 2,
  leftover_fg: 'keep',
}]);
assert.strictEqual(routedFg.length, 1);
const fg = routedFg[0];
assert.strictEqual(fg.county, "Murang'a");
assert.strictEqual(fg.facility, "Murang'a County Referal Hospital");
assert.strictEqual(fg.facility_level, 'Level 4');
assert.strictEqual(fg.contact, 'Facility in charge');
assert.strictEqual(fg.contact_name, 'Faith General');
assert.strictEqual(fg.phone_number, '0733333333');
assert.strictEqual(fg.leftover_fg, 'keep');
assert.strictEqual(fg.units_outpatient_mnh_services, 'Yes');
assert.strictEqual(fg.units_central_store_non_pharm_commodities, 'Yes');
assert.strictEqual(fg.units_rdt_testing_only, 'Yes');
assert.strictEqual(fg.units_pharmacy_services, 'No');
assert.strictEqual(fg.units_newborn_unit_services, 'No');
assert.strictEqual(fg.data_collection_tools, 'Both');
assert.strictEqual(fg.unique_patient_identifer, 'Yes');
assert.strictEqual(fg.responsible_person, 'No');
assert.strictEqual(fg.storage_equipment, 'Yes');
assert.strictEqual(fg.electronic_registry, 'No');
assert.strictEqual(fg.data_storage_cap, 'Yes');
assert.strictEqual(fg.written_collection_tools, 'No');
assert.strictEqual(fg.secure_registers_lockable_doors, 'Yes');
assert.strictEqual(fg.secure_registers_grills, 'No');
assert.strictEqual(fg.secure_registers_fireproof_cabinets, 'Yes');
assert.strictEqual(fg.secure_registers_none, 'No');
assert.strictEqual(fg.upload_data2, 'Yes');
assert.strictEqual(fg.record_computer_storage_space, 'No');
assert.strictEqual(fg.record_computers_with_passwords_designated_for_health_record_use, 'Yes');
assert.strictEqual(fg.record_internet_connection_or_airtime, 'Yes');
assert.strictEqual(fg.record_none, 'Yes');
assert.strictEqual(fg.record_data_repository, 'No');
assert.strictEqual(fg.mpdr_committee2, 'We do not have an MPDSR committee');
assert.strictEqual(fg.standard_hours, 'No');
assert.strictEqual(fg.medical_officer, 3);
assert.strictEqual(fg.medical_officer3, 'Yes');
assert.strictEqual(fg.clinical_officer, 0);
assert.strictEqual(fg.clinical_officer3, 'No');
assert.strictEqual(fg.health_records, 2);
assert.strictEqual(fg.nutritionist, 1);
assert.strictEqual(fg.social_worker, '');
assert.strictEqual(fg.maintenance_staff, '');
assert.strictEqual(fg.facility_staff3_a_written_up_to_date_staffing_policy, 'Yes');
assert.strictEqual(fg.facility_staff3_a_list_that_details_staff_numbers, 'No');
assert.strictEqual(fg.facility_staff3_a_list_that_details_the_types_and_competence_of_staff, 'No');
assert.strictEqual(fg.facility_staff3_none, 'Yes');
assert.strictEqual(fg.roster_displayed, 'Yes');
assert.strictEqual(fg.clear_comm, 'No');
assert.strictEqual(fg.annual_appraise, '');
assert.strictEqual(fg.have_qit, 'Yes');
assert.strictEqual(fg.qit_meet, 'monthly (or more frequently)');
assert.strictEqual(fg.have_wit, 'No');
assert.strictEqual(fg.wit_meet, 'The committee does not meet');
assert.strictEqual(fg.have_sit, 'Yes');
assert.strictEqual(fg.sit_meet, 'The committee does not meet');
assert.strictEqual(fg.ipc_committee, 'Yes');
assert.strictEqual(fg.dis_sharps, 'Electric powered burn incinerator.');
assert.strictEqual(fg.inci_avail_funct, 'No');
assert.strictEqual(fg.inci_petrol, 'Yes');
assert.strictEqual(fg.dispose_medwast, 'Placenta macerator (Please observe)');
assert.strictEqual(fg.designated_cleaning, 'Present');
assert.strictEqual(fg.control_traffic, 'No');
assert.strictEqual(fg.three_bucket, 'Yes');
assert.strictEqual(fg.sop_instrument, 'No');
assert.strictEqual(fg.chlorine, 'Always available');
assert.strictEqual(fg.enzymatic_sol, 'Sometimes available');
assert.strictEqual(fg.chlorine_exidine, 'Never available');
assert.strictEqual(fg.alcohol, '');
assert.strictEqual(fg.central_steril, 'Yes');
assert.strictEqual(fg.sterlization_place_electric_autoclave, 'Yes');
assert.strictEqual(fg.sterlization_place_containers_for_high_level_disinfection, 'No');
assert.strictEqual(fg.sterlization_place_not_applicable_for_this_facility, 'Yes');
assert.strictEqual(fg.safe_water, 'Yes');
assert.strictEqual(fg.func_water_source, 'No');
assert.strictEqual(fg.main_source, 'OTHER (SPECIFY)');
assert.strictEqual(fg.specify_main, 'Roof tank');
assert.strictEqual(fg.oth_source_main_public_supply, 'Yes');
assert.strictEqual(fg.oth_source_no_water_source, 'Yes');
assert.strictEqual(fg.oth_source_tanker_truck, 'No');
assert.strictEqual(fg.specify_oth_source, 'Vendor jerry cans');
assert.strictEqual(fg.soiled_linen_pro, 'Laundered without being disinfected');
assert.strictEqual(fg.contact_patient, 'Wiped with disinfectant then cleaned with water');
assert.strictEqual(fg.equipment_cleaned, 'Daily');
assert.strictEqual(fg.floors, 'Daily AND anytime they are soiled');
assert.strictEqual(fg.sinks, 'They are not cleaned routinely with disinfectant solution');
assert.strictEqual(fg.bathrooms, 'ONLY when they are soiled');
assert.strictEqual(fg.sche_bathrooms, 'Yes');
assert.strictEqual(fg.table_tops, 'Daily');
assert.strictEqual(fg.two_doors, 'Yes');
assert.strictEqual(fg.access_ramp, 'No');
assert.strictEqual(fg.licence, 'Yes');
assert.strictEqual(fg.maintencance_log, 'No');
assert.strictEqual(fg.cleaning_protocol, 'Yes');
assert.strictEqual(fg.access_via_road, '');
assert.strictEqual(fg.vis_signage, 'Yes, but missing in some places or signs not clear');
assert.strictEqual(fg.main_elec_source, 'Other, specify');
assert.strictEqual(fg.elect_source, 'Mini hydro');
assert.strictEqual(fg.elect_sec, 'Shared solar');
assert.strictEqual(fg.processed_linens, 'With an onsite washing machine (Observe)');
assert.strictEqual(fg.sec_electricity_generator, 'Yes');
assert.strictEqual(fg.sec_electricity_solar_system, 'No');
assert.strictEqual(fg.sec_electricity_other_specify, 'Yes');
assert.strictEqual(fg.security_measures6_security_guards_or_watchmen_at_all_times, 'No');
assert.strictEqual(fg.security_measures6_perimeter_wall_around_the_facility, 'Yes');
assert.strictEqual(fg.security_measures6_none, 'Yes');
assert.strictEqual(fg.housekeeping_eyewear_or_goggles, 'Yes');
assert.strictEqual(fg.housekeeping_facemask, 'No');
assert.strictEqual(fg.housekeeping_none, 'Yes');
assert.strictEqual(fg.functional_ambulance, 'Yes');
assert.strictEqual(fg.unable_to_transport, 'No');
assert.strictEqual(fg.formal_agreement, 'Yes');
assert.strictEqual(fg.network_facility, '');
assert.strictEqual(fg.systems_place_clients_who_are_visually_impaired, 'Yes');
assert.strictEqual(fg.systems_place_clients_who_are_speech_impaired, 'No');
assert.strictEqual(fg.systems_place_none, 'Yes');
assert.strictEqual(fg.run_out_fuel, 'No');
assert.strictEqual(fg.uniforms_badges, 'Yes');
assert.strictEqual(fg.pest_control, 'No');
assert.strictEqual(fg.opening_hours, '8-12 hours');
assert.strictEqual(fg['facility_profile/facilities'], undefined);
assert.strictEqual(fg['facility_profile/units'], undefined);
assert.strictEqual(fg['health_records_clients/data_collection_tools'], undefined);
assert.strictEqual(fg['health_records_clients/unique_patient_identifer'], undefined);
assert.strictEqual(fg['health_records_clients/secure_registers'], undefined);
assert.strictEqual(fg['national_data_collection/upload_data2'], undefined);
assert.strictEqual(fg['national_data_collection/record'], undefined);
assert.strictEqual(fg['national_data_collection/mpdr_committee2'], undefined);
assert.strictEqual(fg['national_data_collection/standard_hours'], undefined);
assert.strictEqual(fg['human_resource_health/medical_officer'], undefined);
assert.strictEqual(fg['human_resource_health/facility_staff3'], undefined);
assert.strictEqual(fg['human_resource_health/qit_meet'], undefined);
assert.strictEqual(fg['human_resource_health/sit_meet'], undefined);
assert.strictEqual(fg['wash_ipc/ipc_committee'], undefined);
assert.strictEqual(fg['wash_ipc/dis_sharps'], undefined);
assert.strictEqual(fg['wash_ipc/sterlization_place'], undefined);
assert.strictEqual(fg['wash_ipc/specify_main'], undefined);
assert.strictEqual(fg['wash_ipc/oth_source'], undefined);
assert.strictEqual(fg['wash_ipc/table_tops'], undefined);
assert.strictEqual(fg['infrastructure/two_doors'], undefined);
assert.strictEqual(fg['infrastructure/vis_signage'], undefined);
assert.strictEqual(fg['infrastructure/elect_source'], undefined);
assert.strictEqual(fg['infrastructure/sec_electricity'], undefined);
assert.strictEqual(fg['infrastructure/housekeeping'], undefined);
assert.strictEqual(fg['services_offered/functional_ambulance'], undefined);
assert.strictEqual(fg['services_offered/systems_place'], undefined);
assert.strictEqual(fg['commodities/run_out_fuel'], undefined);
assert.strictEqual(fg['adherence_best_practice/uniforms_badges'], undefined);
assert.strictEqual(fg['hours_operation/opening_hours'], undefined);

assert.strictEqual(
  g('transformFacilityGeneralRecord_')({
    _uuid: 'fg-tools-1',
    _submission_time: '2026-07-02T08:00:00',
    'health_records_clients/data_collection_tools': 1,
  }).data_collection_tools,
  'Paper based charting'
);
assert.strictEqual(
  g('transformFacilityGeneralRecord_')({
    _uuid: 'fg-tools-2',
    _submission_time: '2026-07-02T08:00:00',
    'health_records_clients/data_collection_tools': 2,
  }).data_collection_tools,
  'Electronic based charting'
);
assert.strictEqual(
  g('transformFacilityGeneralRecord_')({
    _uuid: 'fg-tools-4',
    _submission_time: '2026-07-02T08:00:00',
    'health_records_clients/data_collection_tools': 4,
  }).data_collection_tools,
  'Neither'
);
assert.strictEqual(
  g('transformFacilityGeneralRecord_')({
    _uuid: 'fg-mpdr-1',
    _submission_time: '2026-07-03T08:00:00',
    'national_data_collection/mpdr_committee2': 1,
  }).mpdr_committee2,
  'monthly (or more frequently)'
);
assert.strictEqual(
  g('transformFacilityGeneralRecord_')({
    _uuid: 'fg-mpdr-2',
    _submission_time: '2026-07-03T08:00:00',
    'national_data_collection/mpdr_committee2': 2,
  }).mpdr_committee2,
  '> monthly - quarterly'
);
assert.strictEqual(
  g('transformFacilityGeneralRecord_')({
    _uuid: 'fg-mpdr-3',
    _submission_time: '2026-07-03T08:00:00',
    'national_data_collection/mpdr_committee2': 3,
  }).mpdr_committee2,
  '> quarterly - biannually'
);
assert.strictEqual(
  g('transformFacilityGeneralRecord_')({
    _uuid: 'fg-mpdr-4',
    _submission_time: '2026-07-03T08:00:00',
    'national_data_collection/mpdr_committee2': 4,
  }).mpdr_committee2,
  '> biannually - yearly'
);
assert.strictEqual(
  g('transformFacilityGeneralRecord_')({
    _uuid: 'fg-qit-2',
    _submission_time: '2026-07-04T08:00:00',
    'human_resource_health/qit_meet': 2,
  }).qit_meet,
  '> monthly - quarterly'
);
assert.strictEqual(
  g('transformFacilityGeneralRecord_')({
    _uuid: 'fg-wit-3',
    _submission_time: '2026-07-04T08:00:00',
    'human_resource_health/wit_meet': 3,
  }).wit_meet,
  '> quarterly - biannually'
);
assert.strictEqual(
  g('transformFacilityGeneralRecord_')({
    _uuid: 'fg-sit-1',
    _submission_time: '2026-07-04T08:00:00',
    'human_resource_health/sit_meet': 1,
  }).sit_meet,
  '> monthly - quarterly'
);
assert.strictEqual(
  g('transformFacilityGeneralRecord_')({
    _uuid: 'fg-sit-3',
    _submission_time: '2026-07-04T08:00:00',
    'human_resource_health/sit_meet': 3,
  }).sit_meet,
  '> biannually - yearly'
);
assert.strictEqual(
  g('transformFacilityGeneralRecord_')({
    _uuid: 'fg-sharps-9',
    _submission_time: '2026-07-05T08:00:00',
    'wash_ipc/dis_sharps': 9,
  }).dis_sharps,
  'Not available or stored without destruction (Please observe)'
);
assert.strictEqual(
  g('transformFacilityGeneralRecord_')({
    _uuid: 'fg-waste-8',
    _submission_time: '2026-07-05T08:00:00',
    'wash_ipc/dispose_medwast': 8,
  }).dispose_medwast,
  'Compost or placenta pit which is free from pests, rodents, animals (Please observe)'
);
assert.strictEqual(
  g('transformFacilityGeneralRecord_')({
    _uuid: 'fg-clean-0',
    _submission_time: '2026-07-05T08:00:00',
    'wash_ipc/designated_cleaning': 0,
  }).designated_cleaning,
  'Not present'
);
assert.strictEqual(
  g('transformFacilityGeneralRecord_')({
    _uuid: 'fg-water-11',
    _submission_time: '2026-07-05T08:00:00',
    'wash_ipc/main_source': 11,
  }).main_source,
  'No water source'
);
assert.strictEqual(
  g('transformFacilityGeneralRecord_')({
    _uuid: 'fg-linen-1',
    _submission_time: '2026-07-05T08:00:00',
    'wash_ipc/soiled_linen_pro': 1,
  }).soiled_linen_pro,
  'Disinfected prior to being taken to laundry'
);
assert.strictEqual(
  g('transformFacilityGeneralRecord_')({
    _uuid: 'fg-contact-3',
    _submission_time: '2026-07-05T08:00:00',
    'wash_ipc/contact_patient': 3,
  }).contact_patient,
  'Cleaned with water only'
);
assert.strictEqual(
  g('transformFacilityGeneralRecord_')({
    _uuid: 'fg-sign-1',
    _submission_time: '2026-07-06T08:00:00',
    'infrastructure/vis_signage': 1,
  }).vis_signage,
  'Yes, clear and visible'
);
assert.strictEqual(
  g('transformFacilityGeneralRecord_')({
    _uuid: 'fg-sign-3',
    _submission_time: '2026-07-06T08:00:00',
    'infrastructure/vis_signage': 3,
  }).vis_signage,
  'No'
);
assert.strictEqual(
  g('transformFacilityGeneralRecord_')({
    _uuid: 'fg-elec-1',
    _submission_time: '2026-07-06T08:00:00',
    'infrastructure/main_elec_source': 1,
  }).main_elec_source,
  'Central supply (KPLC)'
);
assert.strictEqual(
  g('transformFacilityGeneralRecord_')({
    _uuid: 'fg-linen-2',
    _submission_time: '2026-07-06T08:00:00',
    'infrastructure/processed_linens': 2,
  }).processed_linens,
  'They are processed offsite (Verify contract or MOU)'
);
assert.strictEqual(
  g('transformFacilityGeneralRecord_')({
    _uuid: 'fg-linen-4',
    _submission_time: '2026-07-06T08:00:00',
    'infrastructure/processed_linens': 4,
  }).processed_linens,
  'Not applicable for this facility'
);
assert.strictEqual(
  g('transformFacilityGeneralRecord_')({
    _uuid: 'fg-hours-1',
    _submission_time: '2026-07-07T08:00:00',
    'hours_operation/opening_hours': 1,
  }).opening_hours,
  '<8 hours'
);
assert.strictEqual(
  g('transformFacilityGeneralRecord_')({
    _uuid: 'fg-hours-3',
    _submission_time: '2026-07-07T08:00:00',
    'hours_operation/opening_hours': 3,
  }).opening_hours,
  '24 hours'
);

const fgLegacy = g('transformFacilityGeneralRecord_')({
  _uuid: 'fg-legacy',
  _submission_time: '2025-06-01T08:00:00',
  'facility_profile/facilities': 16,
});
assert.strictEqual(fgLegacy.facility, 'Iyabe Sub County Hospital');
assert.strictEqual(fgLegacy.units_outpatient_mnh_services, '');
assert.strictEqual(fgLegacy.units_rdt_testing_only, '');
assert.strictEqual(fgLegacy.data_collection_tools, '');
assert.strictEqual(fgLegacy.unique_patient_identifer, '');
assert.strictEqual(fgLegacy.secure_registers_none, '');
assert.strictEqual(fgLegacy.upload_data2, '');
assert.strictEqual(fgLegacy.record_none, '');
assert.strictEqual(fgLegacy.mpdr_committee2, '');
assert.strictEqual(fgLegacy.standard_hours, '');
assert.strictEqual(fgLegacy.medical_officer, '');
assert.strictEqual(fgLegacy.medical_officer3, '');
assert.strictEqual(fgLegacy.facility_staff3_none, '');
assert.strictEqual(fgLegacy.roster_displayed, '');
assert.strictEqual(fgLegacy.qit_meet, '');
assert.strictEqual(fgLegacy.sit_meet, '');
assert.strictEqual(fgLegacy.ipc_committee, '');
assert.strictEqual(fgLegacy.dis_sharps, '');
assert.strictEqual(fgLegacy.chlorine, '');
assert.strictEqual(fgLegacy.sterlization_place_electric_autoclave, '');
assert.strictEqual(fgLegacy.specify_main, '');
assert.strictEqual(fgLegacy.oth_source_no_water_source, '');
assert.strictEqual(fgLegacy.table_tops, '');
assert.strictEqual(fgLegacy.two_doors, '');
assert.strictEqual(fgLegacy.maintencance_log, '');
assert.strictEqual(fgLegacy.vis_signage, '');
assert.strictEqual(fgLegacy.elect_source, '');
assert.strictEqual(fgLegacy.processed_linens, '');
assert.strictEqual(fgLegacy.sec_electricity_generator, '');
assert.strictEqual(fgLegacy.housekeeping_none, '');
assert.strictEqual(fgLegacy.functional_ambulance, '');
assert.strictEqual(fgLegacy.systems_place_none, '');
assert.strictEqual(fgLegacy.run_out_fuel, '');
assert.strictEqual(fgLegacy.uniforms_badges, '');
assert.strictEqual(fgLegacy.opening_hours, '');
assert.strictEqual(
  g('facilityGeneralPreferredHeaders_')().slice(0, 10).join('|'),
  '_uuid|date_started|date_ended|date_submitted|county|facility|facility_level|contact|contact_name|phone_number'
);
const fgHeaders = g('facilityGeneralPreferredHeaders_')();
assert.ok(fgHeaders.indexOf('phone_number') < fgHeaders.indexOf('units_outpatient_mnh_services'));
assert.ok(fgHeaders.indexOf('units_central_store_non_pharm_commodities') < fgHeaders.indexOf('units_rdt_testing_only'));
assert.ok(fgHeaders.indexOf('units_rdt_testing_only') < fgHeaders.indexOf('data_collection_tools'));
assert.ok(fgHeaders.indexOf('data_collection_tools') < fgHeaders.indexOf('unique_patient_identifer'));
assert.ok(fgHeaders.indexOf('written_collection_tools') < fgHeaders.indexOf('secure_registers_lockable_doors'));
assert.ok(fgHeaders.indexOf('secure_registers_none') < fgHeaders.indexOf('upload_data2'));
assert.ok(fgHeaders.indexOf('upload_data2') < fgHeaders.indexOf('record_computer_storage_space'));
assert.ok(fgHeaders.indexOf('record_none') < fgHeaders.indexOf('mpdr_committee2'));
assert.ok(fgHeaders.indexOf('mpdr_committee2') < fgHeaders.indexOf('standard_hours'));
assert.ok(fgHeaders.indexOf('standard_hours') < fgHeaders.indexOf('medical_officer'));
assert.ok(fgHeaders.indexOf('medical_officer') < fgHeaders.indexOf('medical_officer3'));
assert.ok(fgHeaders.indexOf('clinical_officer') < fgHeaders.indexOf('clinical_officer3'));
assert.ok(fgHeaders.indexOf('maintenance_staff') < fgHeaders.indexOf('facility_staff3_a_written_up_to_date_staffing_policy'));
assert.ok(fgHeaders.indexOf('facility_staff3_none') < fgHeaders.indexOf('roster_displayed'));
assert.ok(fgHeaders.indexOf('eval_verify') < fgHeaders.indexOf('have_qit'));
assert.ok(fgHeaders.indexOf('have_qit') < fgHeaders.indexOf('qit_meet'));
assert.ok(fgHeaders.indexOf('have_wit') < fgHeaders.indexOf('wit_meet'));
assert.ok(fgHeaders.indexOf('have_sit') < fgHeaders.indexOf('sit_meet'));
assert.ok(fgHeaders.indexOf('sit_meet') < fgHeaders.indexOf('ipc_committee'));
assert.ok(fgHeaders.indexOf('ipc_committee') < fgHeaders.indexOf('dis_sharps'));
assert.ok(fgHeaders.indexOf('sop_instrument') < fgHeaders.indexOf('chlorine'));
assert.ok(fgHeaders.indexOf('chlorine_exidine') < fgHeaders.indexOf('central_steril'));
assert.ok(fgHeaders.indexOf('sterlization_place_not_applicable_for_this_facility') < fgHeaders.indexOf('safe_water'));
assert.ok(fgHeaders.indexOf('main_source') < fgHeaders.indexOf('specify_main'));
assert.ok(fgHeaders.indexOf('specify_main') < fgHeaders.indexOf('oth_source_main_public_supply'));
assert.ok(fgHeaders.indexOf('oth_source_no_water_source') < fgHeaders.indexOf('specify_oth_source'));
assert.ok(fgHeaders.indexOf('bathrooms') < fgHeaders.indexOf('sche_bathrooms'));
assert.ok(fgHeaders.indexOf('sche_bathrooms') < fgHeaders.indexOf('table_tops'));
assert.ok(fgHeaders.indexOf('table_tops') < fgHeaders.indexOf('two_doors'));
assert.ok(fgHeaders.indexOf('two_doors') < fgHeaders.indexOf('access_ramp'));
assert.ok(fgHeaders.indexOf('maintencance_log') < fgHeaders.indexOf('working_machine'));
assert.ok(fgHeaders.indexOf('cleaning_protocol') < fgHeaders.indexOf('vis_signage'));
assert.ok(fgHeaders.indexOf('vis_signage') < fgHeaders.indexOf('main_elec_source'));
assert.ok(fgHeaders.indexOf('elect_source') < fgHeaders.indexOf('elect_sec'));
assert.ok(fgHeaders.indexOf('processed_linens') < fgHeaders.indexOf('sec_electricity_generator'));
assert.ok(fgHeaders.indexOf('sec_electricity_other_specify') < fgHeaders.indexOf('security_measures6_security_guards_or_watchmen_at_all_times'));
assert.ok(fgHeaders.indexOf('security_measures6_none') < fgHeaders.indexOf('housekeeping_eyewear_or_goggles'));
assert.ok(fgHeaders.indexOf('housekeeping_none') < fgHeaders.indexOf('functional_ambulance'));
assert.ok(fgHeaders.indexOf('formal_agreement') < fgHeaders.indexOf('systems_place_clients_who_are_visually_impaired'));
assert.ok(fgHeaders.indexOf('systems_place_none') < fgHeaders.indexOf('run_out_fuel'));
assert.ok(fgHeaders.indexOf('run_out_fuel') < fgHeaders.indexOf('uniforms_badges'));
assert.ok(fgHeaders.indexOf('pest_control') < fgHeaders.indexOf('opening_hours'));
assert.strictEqual(fgHeaders.slice(-4).join('|'),
  'run_out_fuel|uniforms_badges|pest_control|opening_hours'
);

const otProfile = g('transformOperatingTheatreRecord_')({
  _uuid: 'ot-1',
  start: '2026-08-01T08:00:00',
  end: '2026-08-01T09:00:00',
  _submission_time: '2026-08-01T10:00:00',
  'facility_profile/county': 2,
  'facility_profile/facilities': 58,
  'facility_profile/gazetted_facility': 4,
  'facility_profile/contact': 5,
  'group_1/nam_contact': 'Owen Theatre',
  'group_1/phone_contact': '0744444444',
});
assert.strictEqual(otProfile.county, 'Makueni');
assert.strictEqual(otProfile.facility, 'Makueni County Referral Hospital');
assert.strictEqual(otProfile.facility_level, 'Level 4');
assert.strictEqual(otProfile.contact, 'Medical officer in charge');
assert.strictEqual(otProfile.contact_name, 'Owen Theatre');
assert.strictEqual(otProfile.phone_number, '0744444444');
assert.strictEqual(otProfile['facility_profile/facilities'], undefined);
assert.strictEqual(otProfile['facility_profile/facility'], undefined);

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

const routedOt = g('transformRecordsForSheet_')('Operating Theatre', [{
  _uuid: 'ot-full',
  starttime: '2026-09-01T08:00:00',
  endtime: '2026-09-01T09:00:00',
  _submission_time: '2026-09-01T10:00:00',
  'facility_profile/county': 2,
  'facility_profile/facilities': 58,
  'facility_profile/gazetted_facility': 4,
  'facility_profile/contact': 5,
  'group_1/nam_contact': 'Owen Theatre',
  'group_1/phone_contact': '0744444444',
  'facility_profile/units': 1,
  'services_offered/routine_cs': 1,
  'services_offered/routine_cs_6m': 0,
  'services_offered/emerg_cs': 1,
  'services_offered/emerg_cs_6m': 1,
  'services_offered/emerg_anaes': 1,
  'services_offered/anaes_6m': 0,
  'services_offered/tubal_lig': 1,
  'services_offered/laparotomy': 0,
  'services_offered/dnc': 1,
  'services_offered/cystotomy': 0,
  'services_offered/cs_hyst': 1,
  'services_offered/eua': 0,
  'services_offered/marsupial': 1,
  'services_offered/cerclage': 0,
  'services_offered/cerv_tear': 1,
  'services_offered/incision_drain': 0,
  'services_offered/sec_wound': 1,
  'services_offered/blynch_sature': 0,
  'hrh/county_anaesthes': '2',
  'hrh/contract_anaesthes ': '3',
  'hrh/county_co_anaest ': '4',
  'hrh/contract_co_anaest': '1',
  'hrh/county_nurse_anaest ': '5',
  'hrh/contract_nurse_anaest': '0',
  'hrh/county_theatre_nurse': '6',
  'hrh/contract_theatre_nurse': '2',
  'hrh/theatre_cleaners': '3',
  'hrh/theatre_matron_patron': '1',
  'hrh/anaesth_24hr': 1,
  'hrh/anaesth_assist_24hr': 0,
  'hrh/referral_no_anaesth': 1,
  'hrh/obstetric_24hr': 0,
  'hrh/surg_assist_24hr': 1,
  'hrh/referral_no_surg': 0,
  'hrh/team_leader_24hr': 1,
  'hrh/scrub_nurse_24hr': 0,
  'hrh/circulate_nurse_24hr': 1,
  'hrh/baby_nurse_24hr': 0,
  'hrh/referral_no_nurse': 1,
  'hrh/pacu_nurse_24hr': 0,
  'hrh/on_call_roster': 1,
  'health_record/theatre_list': 1,
  'health_record/delivery_reg': 0,
  'health_record/reg_used': 1,
  'health_record/theatre_reg': 0,
  'health_record/theatre_reg_used': 1,
  'health_record/cs_forms': '1 5 11',
  'health_record/referral_forms': 1,
  'privacy/preop_vis_priv': 1,
  'privacy/postop_vis_priv': 2,
  'privacy/preop_aud_priv': 3,
  'privacy/postop_aud_priv': 1,
  'privacy/files_sec': 0,
  'training/last_train': '2024-06',
  'training/cpd_required': '20 hours',
  'sop/anaes_proto': 1,
  'sop/referral_proto': 1,
  'sop/ppe_radio_proto': 1,
  'sop/recovery_proto': 2,
  'sop/theatre_ppe': 1,
  'sop/sedation_proto': 2,
  'sop/clean_proto': 1,
  'wash/water_access': 1,
  'wash/water_1m': 1,
  'wash/sep_sinks': 0,
  'wash/drain_system': 1,
  'wash/postop_sink': 2,
  'wash/hand_hygiene': 3,
  'wash/waste_proto': 1,
  'wash/waste_bins_label': 1,
  'wash/sharps_full': 0,
  'wash/latrine': 1,
  'wash/latrine_type': 7,
  'wash/specify': 'compost pit',
  'wash/handwash_station': 1,
  'wash/clean_freq': 1,
  'wash/clean_today': 0,
  'wash/access_mobility': 1,
  'wash/gender_sep': 0,
  'wash/mens_hygiene': 1,
  'wash/instr_cleaning': 0,
  'infrastructure/theatre_space': '2 3',
  'infrastructure/maintained': 1,
  'infrastructure/exam_light': 0,
  'infrastructure/exam_vent': 1,
  'infrastructure/preop_area': 1,
  'infrastructure/preop_beds': '4',
  'infrastructure/preop_change': 0,
  'infrastructure/surg_rooms': '2',
  'infrastructure/intercom': 1,
  'infrastructure/postop_beds': '6',
  'infrastructure/bed_ref': 0,
  'infrastructure/pharm_store': 1,
  'infrastructure/sterile_store': 0,
  'infrastructure/fire_ext': 1,
  'infrastructure/signage': 0,
  'infrastructure/charter': 1,
  'infrastructure/nurse_station': 0,
  'infrastructure/postop_access': 1,
  'infrastructure/backup_power': 0,
  'infrastructure/temp_ctrl': 1,
  'infrastructure/staff_lounge': 0,
  'infrastructure/ipd_dist': 1,
  'equipment/op_table': 1,
  'equipment/surg_lamp': 1,
  'equipment/inf_scale': 0,
  'equipment/chair': 1,
  'equipment/cauter': 0,
  'equipment/mayo': 1,
  'equipment/instr_trol': 0,
  'equipment/cs_sets': 2,
  'equipment/resusc': 3,
  'equipment/ster_date': 1,
  'equipment/suction': 2,
  'equipment/res_bag_mom': 1,
  'equipment/res_bag_infant': 0,
  'equipment/mack_apron': 1,
  'equipment/eye_shield': 3,
  'equipment/gum_boots': 2,
  'equipment/anest_machine': 1,
  'equipment/emerg_trol': 1,
  'equipment/anest_maint': 0,
  'equipment/stetho': 1,
  'equipment/monitor': 2,
  'equipment/spo2_probe': 1,
  'equipment/bp_cuffs': '1 3',
  'equipment/ecg_leads': 1,
  'equipment/airways': 0,
  'equipment/laryngo': 1,
  'equipment/lary_blades': '1 2',
  'equipment/ett_tubes': '6 8',
  'equipment/magill': 1,
  'equipment/fridge': 2,
  'equipment/note2_pacu': 0,
  'equipment/pacu_trol': '4 17',
  'equipment/pacu_gluco': 1,
  'equipment/pacu_lamp': 3,
  'equipment/pacu_defib': 2,
  'equipment/pacu_temp': 1,
  'equipment/temp_18_24': 0,
  'equipment/pacu_bp': 1,
  'equipment/pacu_spo2': 1,
  'equipment/pacu_ecg': 3,
  'equipment/pacu_o2': 1,
  'equipment/pacu_desk': 0,
  'commodities/lidocaine': 1,
  'commodities/povidine': 2,
  'commodities/socks': 3,
  'sec_12/clean_sched': 1,
  'sec_12/expiry_check': 0,
  'sec_12/anaest_serv': 1,
  'sec_12/bed_serv': 4,
  'sec_12/patient_id': 1,
  'sec_12/pre_checks': '1 5',
  'sec_12/ecg_mon': 2,
  'sec_12/spo2_mon': 1,
  'sec_12/bp_mon': 3,
  'sec_12/surg_count': 1,
  'sec_12/op_board': 2,
  'sec_12/blood_spec': 1,
  'sec_12/mortality_rev': 3,
  'sec_12/anaest_rev': 1,
  'sec_12/anaest_doc': '10',
  'sec_12/anaest_chart': '4 13',
  'sec_12/turnaround': 2,
  'op/hrs_day': 3,
  leftover_ot: 'keep',
}]);
assert.strictEqual(routedOt.length, 1);
const ot = routedOt[0];
assert.strictEqual(ot.county, 'Makueni');
assert.strictEqual(ot.facility, 'Makueni County Referral Hospital');
assert.strictEqual(ot.leftover_ot, 'keep');
assert.strictEqual(ot.facility_unit, 'Yes');
assert.strictEqual(ot.routine_cs, 'Yes');
assert.strictEqual(ot.routine_cs_6months, 'No');
assert.strictEqual(ot.emergency_cs, 'Yes');
assert.strictEqual(ot.emergency_cs_6months, 'Yes');
assert.strictEqual(ot.emergency_obstetric_anaesthesia, 'Yes');
assert.strictEqual(ot.emergency_obstetric_anaesthesia_6m, 'No');
assert.strictEqual(ot.tubal_ligation, 'Yes');
assert.strictEqual(ot.dilation_curettage, 'Yes');
assert.strictEqual(ot.cesarean_hysterectomy, 'Yes');
assert.strictEqual(ot.exam_under_anesthesia, 'No');
assert.strictEqual(ot.cervical_cerclage, 'No');
assert.strictEqual(ot.cervical_tear_repair, 'Yes');
assert.strictEqual(ot.secondary_wound_closure, 'Yes');
assert.strictEqual(ot.blynch_sature, 'No');
assert.strictEqual(ot.county_anaesthesiologists, 2);
assert.strictEqual(ot.contract_anaesthesiologists, 3);
assert.strictEqual(ot.county_co_anaesthetists, 4);
assert.strictEqual(ot.contract_co_anaesthetists, 1);
assert.strictEqual(ot.county_nurse_anaesthetists, 5);
assert.strictEqual(ot.contract_nurse_anaesthetists, 0);
assert.strictEqual(ot.county_theatre_nurse, 6);
assert.strictEqual(ot.theatre_matron_patron, 1);
assert.strictEqual(ot.anaesthetist_available_24hrs, 'Yes');
assert.strictEqual(ot.anaesth_assist_24hr, 'No');
assert.strictEqual(ot.on_call_roster, 'Yes');
assert.strictEqual(ot.theatre_list, 'Yes');
assert.strictEqual(ot.delivery_reg, 'No');
assert.strictEqual(ot.theatre_reg_used, 'Yes');
assert.strictEqual(ot.cs_forms_anesthesia_charts, 'Yes');
assert.strictEqual(ot.cs_forms_safe_surgery_checklist, 'Yes');
assert.strictEqual(ot.cs_forms_none, 'Yes');
assert.strictEqual(ot.cs_forms_theatre_notes, 'No');
assert.strictEqual(ot.cs_forms_doctors_admission_record, 'No');
assert.strictEqual(ot.referral_forms, 'Always available');
assert.strictEqual(ot.preop_vis_priv, 'All rooms');
assert.strictEqual(ot.postop_vis_priv, 'Some rooms');
assert.strictEqual(ot.preop_aud_priv, 'No rooms');
assert.strictEqual(ot.files_sec, 'No');
assert.strictEqual(ot.last_train, '2024-06');
assert.strictEqual(ot.cpd_required, '20 hours');
assert.strictEqual(ot.anaes_proto, 'Yes');
assert.strictEqual(ot.referral_proto, 'They have displayed, up to date protocols');
assert.strictEqual(ot.ppe_radio_proto, 'Yes (either written or displayed)');
assert.strictEqual(ot.recovery_proto, 'No');
assert.strictEqual(ot.water_access, 'Present, functional');
assert.strictEqual(ot.postop_sink, 'Yes, non-functional');
assert.strictEqual(ot.hand_hygiene, 'Present in no service areas');
assert.strictEqual(ot.waste_proto, 'Present, well displayed');
assert.strictEqual(ot.latrine_type, 'Other, specify');
assert.strictEqual(ot.specify_latrine, 'compost pit');
assert.strictEqual(ot.clean_freq, 'Daily AND as necessary');
assert.strictEqual(ot.gender_seperation, 'No');
assert.strictEqual(ot.theatre_space_anesthesia, 'Yes');
assert.strictEqual(ot.theatre_space_surgery, 'Yes');
assert.strictEqual(ot.theatre_space_reception, 'No');
assert.strictEqual(ot.theatre_space_none, 'No');
assert.strictEqual(ot.maintained, 'Yes');
assert.strictEqual(ot.preop_beds, 4);
assert.strictEqual(ot.surg_rooms, 2);
assert.strictEqual(ot.postop_beds, 6);
assert.strictEqual(ot.ipd_dist, 'Yes');
assert.strictEqual(ot.op_table, 'Yes');
assert.strictEqual(ot.surg_lamp, 'Yes, functional');
assert.strictEqual(ot.cs_sets, 'Sometimes available');
assert.strictEqual(ot.resusc, 'No');
assert.strictEqual(ot.mack_apron, 'Always available');
assert.strictEqual(ot.eye_shield, 'Never available');
assert.strictEqual(ot.bp_cuffs_small, 'Yes');
assert.strictEqual(ot.bp_cuffs_medium, 'No');
assert.strictEqual(ot.bp_cuffs_large, 'Yes');
assert.strictEqual(ot.bp_cuffs_none, 'No');
assert.strictEqual(ot.lary_blades_size_0, 'Yes');
assert.strictEqual(ot.lary_blades_size_1, 'Yes');
assert.strictEqual(ot.lary_blades_none, 'No');
assert.strictEqual(ot.ett_tubes_adult_size_7_0, 'Yes');
assert.strictEqual(ot.ett_tubes_none, 'Yes');
assert.strictEqual(ot.ett_tubes_newborn_size_2_5, 'No');
assert.strictEqual(ot.pacu_trol_calcium_gluconamte, 'Yes');
assert.strictEqual(ot.pacu_trol_no_trolley_for_emergency_drugs, 'Yes');
assert.strictEqual(ot.pacu_trol_tramadol, 'No');
assert.strictEqual(ot.pacu_lamp, 'No');
assert.strictEqual(ot.pacu_temp, 'Yes');
assert.strictEqual(ot.lidocaine, 'Always');
assert.strictEqual(ot.povidine, 'Sometimes');
assert.strictEqual(ot.socks, 'Never');
assert.strictEqual(ot.clean_sched, 'Yes');
assert.strictEqual(ot.anaest_serv, 'At least yearly and as needed');
assert.strictEqual(ot.bed_serv, 'They are not serviced');
assert.strictEqual(ot.patient_id, 'Always');
assert.strictEqual(ot.pre_checks_preoperative_monitoring_of_vital_signs, 'Yes');
assert.strictEqual(ot.pre_checks_none, 'Yes');
assert.strictEqual(ot.pre_checks_last_oral_intake_is_verified, 'No');
assert.strictEqual(ot.ecg_mon, 'Sometimes');
assert.strictEqual(ot.spo2_mon, 'Always');
assert.strictEqual(ot.bp_mon, 'Never');
assert.strictEqual(ot.blood_spec, 'Yes');
assert.strictEqual(ot.anaest_doc_no_documentation_provided, 'Yes');
assert.strictEqual(
  ot.anaest_doc_diagnosis_and_indication_for_surgery,
  'No'
);
assert.strictEqual(ot.anaest_chart_diagnosis_and_planed_surgery, 'Yes');
assert.strictEqual(ot.anaest_chart_none, 'Yes');
assert.strictEqual(ot.anaest_chart_clients_name, 'No');
assert.strictEqual(ot.turnaround, '31-45 minutes');
assert.strictEqual(ot.hrs_day, 'Rarely assessible');
assert.strictEqual(ot['facility_profile/facilities'], undefined);
assert.strictEqual(ot['facility_profile/units'], undefined);
assert.strictEqual(ot['services_offered/routine_cs'], undefined);
assert.strictEqual(ot['hrh/county_anaesthes'], undefined);
assert.strictEqual(ot['hrh/contract_anaesthes '], undefined);
assert.strictEqual(ot['health_record/cs_forms'], undefined);
assert.strictEqual(ot['health_record/theatre_reg_used'], undefined);
assert.strictEqual(ot['health_record/referral_forms'], undefined);
assert.strictEqual(ot['privacy/preop_vis_priv'], undefined);
assert.strictEqual(ot['training/last_train'], undefined);
assert.strictEqual(ot['sop/referral_proto'], undefined);
assert.strictEqual(ot['wash/specify'], undefined);
assert.strictEqual(ot['infrastructure/theatre_space'], undefined);
assert.strictEqual(ot['equipment/bp_cuffs'], undefined);
assert.strictEqual(ot['equipment/pacu_trol'], undefined);
assert.strictEqual(ot['equipment/pacu_lamp'], undefined);
assert.strictEqual(ot['commodities/lidocaine'], undefined);
assert.strictEqual(ot['sec_12/pre_checks'], undefined);
assert.strictEqual(ot['sec_12/spo2_mon'], undefined);
assert.strictEqual(ot['sec_12/anaest_doc'], undefined);
assert.strictEqual(ot['sec_12/anaest_chart'], undefined);
assert.strictEqual(ot['op/hrs_day'], undefined);

const otHrhTrimmed = g('transformOperatingTheatreRecord_')({
  _uuid: 'ot-hrh-trim',
  _submission_time: '2026-09-01T10:00:00',
  'hrh/contract_anaesthes': '7',
  'hrh/county_co_anaest': '8',
  'hrh/county_nurse_anaest': '9',
});
assert.strictEqual(otHrhTrimmed.contract_anaesthesiologists, 7);
assert.strictEqual(otHrhTrimmed.county_co_anaesthetists, 8);
assert.strictEqual(otHrhTrimmed.county_nurse_anaesthetists, 9);

const otSkipped = g('transformOperatingTheatreRecord_')({
  _uuid: 'ot-skip',
  _submission_time: '2026-09-01T10:00:00',
  'facility_profile/county': 2,
});
assert.strictEqual(otSkipped.cs_forms_anesthesia_charts, '');
assert.strictEqual(otSkipped.theatre_space_surgery, '');
assert.strictEqual(otSkipped.bp_cuffs_small, '');
assert.strictEqual(otSkipped.lary_blades_size_0, '');
assert.strictEqual(otSkipped.ett_tubes_none, '');
assert.strictEqual(otSkipped.pacu_trol_tramadol, '');
assert.strictEqual(otSkipped.pre_checks_none, '');
assert.strictEqual(otSkipped.anaest_doc_no_documentation_provided, '');
assert.strictEqual(otSkipped.anaest_chart_none, '');
assert.strictEqual(otSkipped.facility_unit, '');
assert.strictEqual(otSkipped.hrs_day, '');

const otHeaders = g('operatingTheatrePreferredHeaders_')();
assert.ok(otHeaders.indexOf('phone_number') < otHeaders.indexOf('facility_unit'));
assert.ok(otHeaders.indexOf('facility_unit') < otHeaders.indexOf('routine_cs'));
assert.ok(otHeaders.indexOf('routine_cs_6months') < otHeaders.indexOf('emergency_cs'));
assert.ok(otHeaders.indexOf('blynch_sature') < otHeaders.indexOf('county_anaesthesiologists'));
assert.ok(otHeaders.indexOf('theatre_matron_patron') < otHeaders.indexOf('anaesthetist_available_24hrs'));
assert.ok(otHeaders.indexOf('on_call_roster') < otHeaders.indexOf('theatre_list'));
assert.ok(otHeaders.indexOf('theatre_reg_used') < otHeaders.indexOf('cs_forms_anesthesia_charts'));
assert.ok(otHeaders.indexOf('cs_forms_none') < otHeaders.indexOf('referral_forms'));
assert.ok(otHeaders.indexOf('files_sec') < otHeaders.indexOf('last_train'));
assert.ok(otHeaders.indexOf('cpd_required') < otHeaders.indexOf('anaes_proto'));
assert.ok(otHeaders.indexOf('clean_proto') < otHeaders.indexOf('water_access'));
assert.ok(otHeaders.indexOf('instr_cleaning') < otHeaders.indexOf('theatre_space_reception'));
assert.ok(otHeaders.indexOf('theatre_space_none') < otHeaders.indexOf('maintained'));
assert.ok(otHeaders.indexOf('ipd_dist') < otHeaders.indexOf('op_table'));
assert.ok(otHeaders.indexOf('spo2_probe') < otHeaders.indexOf('bp_cuffs_small'));
assert.ok(otHeaders.indexOf('bp_cuffs_none') < otHeaders.indexOf('ecg_leads'));
assert.ok(otHeaders.indexOf('laryngo') < otHeaders.indexOf('lary_blades_size_0'));
assert.ok(otHeaders.indexOf('lary_blades_none') < otHeaders.indexOf('ett_tubes_newborn_size_2_5'));
assert.ok(otHeaders.indexOf('ett_tubes_none') < otHeaders.indexOf('magill'));
assert.ok(otHeaders.indexOf('note2_pacu') < otHeaders.indexOf('pacu_trol_tramadol'));
assert.ok(otHeaders.indexOf('pacu_trol_no_trolley_for_emergency_drugs') < otHeaders.indexOf('pacu_gluco'));
assert.ok(otHeaders.indexOf('pacu_desk') < otHeaders.indexOf('lidocaine'));
assert.ok(otHeaders.indexOf('socks') < otHeaders.indexOf('clean_sched'));
assert.ok(otHeaders.indexOf('patient_id') < otHeaders.indexOf('pre_checks_preoperative_monitoring_of_vital_signs'));
assert.ok(otHeaders.indexOf('pre_checks_none') < otHeaders.indexOf('ecg_mon'));
assert.ok(otHeaders.indexOf('ecg_mon') < otHeaders.indexOf('spo2_mon'));
assert.ok(otHeaders.indexOf('anaest_rev') < otHeaders.indexOf('anaest_doc_anaesthetic_processes_from_pre_anaesthetic_review_to_reversal_of_anaesthesia_including_any_incidents_that_may_have_occurred'));
assert.ok(otHeaders.indexOf('anaest_doc_no_documentation_provided') < otHeaders.indexOf('anaest_chart_clients_name'));
assert.ok(otHeaders.indexOf('anaest_chart_none') < otHeaders.indexOf('turnaround'));
assert.ok(otHeaders.indexOf('turnaround') < otHeaders.indexOf('hrs_day'));
assert.strictEqual(otHeaders.slice(-4).join('|'),
  'anaest_chart_any_drugs_and_iv_fluids_given_during_the_period_they_are_under_anaesthesia|anaest_chart_none|turnaround|hrs_day'
);

const routedCs = g('transformRecordsForSheet_')('Central Store', [{
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
  'facility_profile/units': '2 7',
  'health/designated_space': 2,
  'health/inventory': 1,
  'health/tools': 0,
  'health/logs': 1,
  'health/temp_log': 0,
  'health/chart': 1,
  'health/chr_tool': 0,
  'health/ctr_form': 1,
  'health/ctr_use': 0,
  'health/bin_card': 1,
  'health/bin_card_update': 0,
  'sop/odering_personnel': 4,
  'sop/stock_orders': 1,
  'sop/supplies': 1,
  'sop/fefo': 0,
  'sanitation/hygiene': 1,
  'infras/structures': 0,
  'infras/cabinets': 1,
  'infras/thermometer': 0,
  'infras/room': 1,
  'infras/dust': 0,
  'equip/computer': 1,
  'commod/cord': 1,
  'commod/scissors': 2,
  'commod/sry2': 3,
  'commod/penguine': 1,
  'commod/wedge': 2,
  'commod/c_stock': 1,
  'commod/scis_stock': 0,
  'commod/syr2_stock': 1,
  'commod/Penguine_stock': 0,
  'commod/ubt_kit': 1,
  'commod/wedge_stock': 0,
  'hour/hours': 2,
  leftover_cs: 'keep',
}]);
assert.strictEqual(routedCs.length, 1);
const cs = routedCs[0];
assert.strictEqual(cs.county, 'Kakamega');
assert.strictEqual(cs.facility, 'Kakamega County General Refferal Hospital');
assert.strictEqual(cs.facility_level, 'Level 4');
assert.strictEqual(cs.contact, 'Clinical officer in charge');
assert.strictEqual(cs.contact_name, 'Cora Store');
assert.strictEqual(cs.phone_number, '0755555555');
assert.strictEqual(cs.leftover_cs, 'keep');
assert.strictEqual(cs.units_pharmacy_services, 'Yes');
assert.strictEqual(cs.units_maternity_surgical_services_operating_theatre, 'Yes');
assert.strictEqual(cs.units_outpatient_mnh_services, 'No');
assert.strictEqual(cs.units_basic_laboratory_services, 'No');
assert.strictEqual(cs.units_comprehensive_laboratory_services, 'No');
assert.strictEqual(cs.units_inpatient_bemonc_services, 'No');
assert.strictEqual(cs.units_newborn_unit_services, 'No');
assert.strictEqual(cs.designated_space, 'Yes (a designated area within the pharmacy)');
assert.strictEqual(cs.inventory, 'Yes');
assert.strictEqual(cs.tools, 'No');
assert.strictEqual(cs.logs, 'Yes');
assert.strictEqual(cs.temp_log, 'No');
assert.strictEqual(cs.chart, 'Yes');
assert.strictEqual(cs.chr_tool, 'No');
assert.strictEqual(cs.ctr_form, 'Yes');
assert.strictEqual(cs.ctr_use, 'No');
assert.strictEqual(cs.bin_card, 'Yes');
assert.strictEqual(cs.bin_card_update, 'No');
assert.strictEqual(cs.odering_personnel, 'One person - central store manager');
assert.strictEqual(cs.stock_orders, 'Quarterly or more often');
assert.strictEqual(cs.supplies, 'Yes');
assert.strictEqual(cs.fefo, 'No');
assert.strictEqual(cs.hygiene, 'Yes');
assert.strictEqual(cs.structures, 'No');
assert.strictEqual(cs.cabinets, 'Yes');
assert.strictEqual(cs.thermometer, 'No');
assert.strictEqual(cs.room, 'Yes');
assert.strictEqual(cs.dust, 'No');
assert.strictEqual(cs.computer, 'Yes');
assert.strictEqual(cs.cord, 'Always available');
assert.strictEqual(cs.scissors, 'Sometimes available');
assert.strictEqual(cs.sry2, 'Never available');
assert.strictEqual(cs.penguine, 'Always available');
assert.strictEqual(cs.wedge, 'Sometimes available');
assert.strictEqual(cs.airway_adult, '');
assert.strictEqual(cs.c_stock, 'Yes');
assert.strictEqual(cs.scis_stock, 'No');
assert.strictEqual(cs.syr2_stock, 'Yes');
assert.strictEqual(cs.Penguine_stock, 'No');
assert.strictEqual(cs.ubt_kit, 'Yes');
assert.strictEqual(cs.wedge_stock, 'No');
assert.strictEqual(cs.hours, 'Sometimes when the facility is open, but not always');
assert.strictEqual(cs.airway_infant_sto, '');
assert.strictEqual(cs['facility_profile/county'], undefined);
assert.strictEqual(cs['facility_profile/units'], undefined);
assert.strictEqual(cs['health/designated_space'], undefined);
assert.strictEqual(cs['health/inventory'], undefined);
assert.strictEqual(cs['sop/odering_personnel'], undefined);
assert.strictEqual(cs['sop/stock_orders'], undefined);
assert.strictEqual(cs['sop/supplies'], undefined);
assert.strictEqual(cs['sanitation/hygiene'], undefined);
assert.strictEqual(cs['infras/cabinets'], undefined);
assert.strictEqual(cs['equip/computer'], undefined);
assert.strictEqual(cs['commod/cord'], undefined);
assert.strictEqual(cs['commod/sry2'], undefined);
assert.strictEqual(cs['commod/Penguine_stock'], undefined);
assert.strictEqual(cs['commod/ubt_kit'], undefined);
assert.strictEqual(cs['hour/hours'], undefined);

assert.strictEqual(
  g('transformCentralStoreRecord_')({
    _uuid: 'cs-space-1',
    _submission_time: '2026-09-02T08:00:00',
    'health/designated_space': 1,
  }).designated_space,
  'Yes (a designated central store room)'
);
assert.strictEqual(
  g('transformCentralStoreRecord_')({
    _uuid: 'cs-space-3',
    _submission_time: '2026-09-02T08:00:00',
    'health/designated_space': 3,
  }).designated_space,
  'Yes (a designated area NOT located within the pharmacy)'
);
assert.strictEqual(
  g('transformCentralStoreRecord_')({
    _uuid: 'cs-space-4',
    _submission_time: '2026-09-02T08:00:00',
    'health/designated_space': 4,
  }).designated_space,
  'No, there is no designated space. Commodities can be found only in service delivery areas'
);
assert.strictEqual(
  g('transformCentralStoreRecord_')({
    _uuid: 'cs-order-1',
    _submission_time: '2026-09-03T08:00:00',
    'sop/odering_personnel': 1,
  }).odering_personnel,
  'One person - nurse in charge'
);
assert.strictEqual(
  g('transformCentralStoreRecord_')({
    _uuid: 'cs-order-2',
    _submission_time: '2026-09-03T08:00:00',
    'sop/odering_personnel': 2,
  }).odering_personnel,
  'One person - pharmacy staff'
);
assert.strictEqual(
  g('transformCentralStoreRecord_')({
    _uuid: 'cs-order-3',
    _submission_time: '2026-09-03T08:00:00',
    'sop/odering_personnel': 3,
  }).odering_personnel,
  'One person - laboratory staff'
);
assert.strictEqual(
  g('transformCentralStoreRecord_')({
    _uuid: 'cs-order-5',
    _submission_time: '2026-09-03T08:00:00',
    'sop/odering_personnel': 5,
  }).odering_personnel,
  'One person - other'
);
assert.strictEqual(
  g('transformCentralStoreRecord_')({
    _uuid: 'cs-order-6',
    _submission_time: '2026-09-03T08:00:00',
    'sop/odering_personnel': 6,
  }).odering_personnel,
  'More than one person is responsible for this task'
);
assert.strictEqual(
  g('transformCentralStoreRecord_')({
    _uuid: 'cs-stock-2',
    _submission_time: '2026-09-04T08:00:00',
    'sop/stock_orders': 2,
  }).stock_orders,
  'Biannually'
);
assert.strictEqual(
  g('transformCentralStoreRecord_')({
    _uuid: 'cs-stock-3',
    _submission_time: '2026-09-04T08:00:00',
    'sop/stock_orders': 3,
  }).stock_orders,
  'Only when funds are available'
);
assert.strictEqual(
  g('transformCentralStoreRecord_')({
    _uuid: 'cs-hours-1',
    _submission_time: '2026-09-05T08:00:00',
    'hour/hours': 1,
  }).hours,
  'Accessible at all facility open times'
);
assert.strictEqual(
  g('transformCentralStoreRecord_')({
    _uuid: 'cs-hours-3',
    _submission_time: '2026-09-05T08:00:00',
    'hour/hours': 3,
  }).hours,
  'Rarely assessible (it is difficult to access non-pharm commodities in this facility)'
);

const csLegacy = g('transformCentralStoreRecord_')({
  _uuid: 'cs-legacy',
  _submission_time: '2025-04-01T08:00:00',
  'facility_profile/facility': 16,
});
assert.strictEqual(csLegacy.facility, 'Iyabe Sub County Hospital');
assert.strictEqual(csLegacy.units_pharmacy_services, '');
assert.strictEqual(csLegacy.units_newborn_unit_services, '');
assert.strictEqual(csLegacy.designated_space, '');
assert.strictEqual(csLegacy.inventory, '');
assert.strictEqual(csLegacy.bin_card_update, '');
assert.strictEqual(csLegacy.odering_personnel, '');
assert.strictEqual(csLegacy.stock_orders, '');
assert.strictEqual(csLegacy.supplies, '');
assert.strictEqual(csLegacy.computer, '');
assert.strictEqual(csLegacy.cord, '');
assert.strictEqual(csLegacy.sry2, '');
assert.strictEqual(csLegacy.penguine, '');
assert.strictEqual(csLegacy.c_stock, '');
assert.strictEqual(csLegacy.Penguine_stock, '');
assert.strictEqual(csLegacy.ubt_kit, '');
assert.strictEqual(csLegacy.hours, '');
assert.strictEqual(
  g('centralStorePreferredHeaders_')().slice(0, 10).join('|'),
  '_uuid|date_started|date_ended|date_submitted|county|facility|facility_level|contact|contact_name|phone_number'
);
const csHeaders = g('centralStorePreferredHeaders_')();
assert.ok(csHeaders.indexOf('phone_number') < csHeaders.indexOf('units_outpatient_mnh_services'));
assert.ok(csHeaders.indexOf('units_outpatient_mnh_services') < csHeaders.indexOf('units_pharmacy_services'));
assert.ok(csHeaders.indexOf('units_maternity_surgical_services_operating_theatre') < csHeaders.indexOf('designated_space'));
assert.ok(csHeaders.indexOf('designated_space') < csHeaders.indexOf('inventory'));
assert.ok(csHeaders.indexOf('inventory') < csHeaders.indexOf('tools'));
assert.ok(csHeaders.indexOf('bin_card') < csHeaders.indexOf('bin_card_update'));
assert.ok(csHeaders.indexOf('bin_card_update') < csHeaders.indexOf('odering_personnel'));
assert.ok(csHeaders.indexOf('odering_personnel') < csHeaders.indexOf('stock_orders'));
assert.ok(csHeaders.indexOf('stock_orders') < csHeaders.indexOf('supplies'));
assert.ok(csHeaders.indexOf('fefo') < csHeaders.indexOf('hygiene'));
assert.ok(csHeaders.indexOf('hygiene') < csHeaders.indexOf('structures'));
assert.ok(csHeaders.indexOf('dust') < csHeaders.indexOf('computer'));
assert.ok(csHeaders.indexOf('computer') < csHeaders.indexOf('cord'));
assert.ok(csHeaders.indexOf('sry2') < csHeaders.indexOf('syr10'));
assert.ok(csHeaders.indexOf('penguine') < csHeaders.indexOf('cling_film'));
assert.ok(csHeaders.indexOf('wedge') < csHeaders.indexOf('c_stock'));
assert.ok(csHeaders.indexOf('c_stock') < csHeaders.indexOf('scis_stock'));
assert.ok(csHeaders.indexOf('ubt_kit') < csHeaders.indexOf('canscalp_stock'));
assert.ok(csHeaders.indexOf('Penguine_stock') < csHeaders.indexOf('cling_film_stock'));
assert.ok(csHeaders.indexOf('wedge_stock') < csHeaders.indexOf('hours'));
assert.strictEqual(csHeaders.slice(-4).join('|'),
  'Penguine_stock|cling_film_stock|wedge_stock|hours'
);

let threw = false;
try { g('transformRecordsForSheet_')('Unknown', []); } catch (e) { threw = true; }
assert.ok(threw);

assert.strictEqual(
  g('FQA_WEIGHTING_SHEET_NAME'),
  'FQA Weighting'
);
assert.strictEqual(
  g('FQA_WEIGHTING_HEADERS').join('|'),
  'Department/KOBO tool|variable|response|label|score'
);

const weightingTable = g('buildFqaWeightingTableRows_({})');
assert.ok(weightingTable.length > 100, 'expected a full scored-column catalog');

function weightingRowsFor(department, variable) {
  return weightingTable.filter(function (row) {
    return row[0] === department && row[1] === variable;
  });
}

const routineCs = weightingRowsFor('Operating Theatre', 'routine_cs');
assert.strictEqual(routineCs.length, 2);
assert.strictEqual(routineCs[0].join('|'), 'Operating Theatre|routine_cs|1|Yes|1');
assert.strictEqual(routineCs[1].join('|'), 'Operating Theatre|routine_cs|0|No|0');

const csFormsAnesthesia = weightingRowsFor(
  'Operating Theatre',
  'cs_forms_anesthesia_charts'
);
assert.strictEqual(
  csFormsAnesthesia.map(function (row) { return row.slice(2).join('|'); }).join(';'),
  '1|Yes|1;0|No|0'
);

const lidocaine = weightingRowsFor('Operating Theatre', 'lidocaine');
assert.strictEqual(lidocaine.length, 3);
assert.strictEqual(lidocaine[0][3], 'Always');
assert.strictEqual(lidocaine[1][3], 'Sometimes');
assert.strictEqual(lidocaine[2][3], 'Never');
assert.strictEqual(lidocaine[0][4], '');
assert.strictEqual(lidocaine[1][4], '');
assert.strictEqual(lidocaine[2][4], '');

const weightingDepartments = [];
weightingTable.forEach(function (row) {
  if (weightingDepartments.indexOf(row[0]) === -1) {
    weightingDepartments.push(row[0]);
  }
});
assert.strictEqual(
  weightingDepartments.join('|'),
  'Newborn Unit|Inpatient Maternity|Outpatient|Lab|Operating Theatre|Pharmacy|Central Store|Facility General'
);

const excludedWeightingVars = {
  _uuid: true,
  date_started: true,
  date_ended: true,
  date_submitted: true,
  county: true,
  facility: true,
  facility_level: true,
  contact: true,
  contact_name: true,
  phone_number: true,
  preop_beds: true,
  surg_rooms: true,
  postop_beds: true,
};
weightingTable.forEach(function (row) {
  assert.ok(
    !excludedWeightingVars[row[1]],
    'non-scored column leaked into weighting table: ' + row[1]
  );
});

const preserved = g(
  'buildFqaWeightingTableRows_({"Operating Theatre\troutine_cs\t1": 9})'
);
const preservedRoutineYes = preserved.filter(function (row) {
  return row[0] === 'Operating Theatre' && row[1] === 'routine_cs' && row[2] === 1;
})[0];
assert.strictEqual(preservedRoutineYes[4], 9);
const preservedRoutineNo = preserved.filter(function (row) {
  return row[0] === 'Operating Theatre' && row[1] === 'routine_cs' && row[2] === 0;
})[0];
assert.strictEqual(preservedRoutineNo[4], 0);

const existingScores = g(
  'readExistingWeightingScoresFromValues_([[' +
    '"Department/KOBO tool","variable","response","label","score"],' +
    '["Operating Theatre","routine_cs",1,"Yes",4],' +
    '["Operating Theatre","routine_cs",0,"No",""]' +
  '])'
);
assert.strictEqual(existingScores['Operating Theatre\troutine_cs\t1'], 4);
assert.strictEqual(
  Object.prototype.hasOwnProperty.call(existingScores, 'Operating Theatre\troutine_cs\t0'),
  false
);

const orchestrator = fs.readFileSync(path.join(ROOT, 'FQA_QuIPS_Orchestrator.js'), 'utf8');
assert.ok(orchestrator.indexOf('writeFqaWeightingSheet') === -1);
assert.ok(orchestrator.indexOf('FQA Weighting') === -1);

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
