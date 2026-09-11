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
assert.strictEqual(cs['facility_profile/county'], undefined);
assert.strictEqual(cs['health/designated_space'], undefined);
assert.strictEqual(cs['health/inventory'], undefined);
assert.strictEqual(cs['sop/odering_personnel'], undefined);
assert.strictEqual(cs['sop/stock_orders'], undefined);
assert.strictEqual(cs['sop/supplies'], undefined);
assert.strictEqual(cs['sanitation/hygiene'], undefined);
assert.strictEqual(cs['infras/cabinets'], undefined);
assert.strictEqual(cs['equip/computer'], undefined);

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

const csLegacy = g('transformCentralStoreRecord_')({
  _uuid: 'cs-legacy',
  _submission_time: '2025-04-01T08:00:00',
  'facility_profile/facility': 16,
});
assert.strictEqual(csLegacy.facility, 'Iyabe Sub County Hospital');
assert.strictEqual(csLegacy.designated_space, '');
assert.strictEqual(csLegacy.inventory, '');
assert.strictEqual(csLegacy.bin_card_update, '');
assert.strictEqual(csLegacy.odering_personnel, '');
assert.strictEqual(csLegacy.stock_orders, '');
assert.strictEqual(csLegacy.supplies, '');
assert.strictEqual(csLegacy.computer, '');
assert.strictEqual(
  g('centralStorePreferredHeaders_')().slice(0, 10).join('|'),
  '_uuid|date_started|date_ended|date_submitted|county|facility|facility_level|contact|contact_name|phone_number'
);
const csHeaders = g('centralStorePreferredHeaders_')();
assert.ok(csHeaders.indexOf('phone_number') < csHeaders.indexOf('designated_space'));
assert.ok(csHeaders.indexOf('designated_space') < csHeaders.indexOf('inventory'));
assert.ok(csHeaders.indexOf('inventory') < csHeaders.indexOf('tools'));
assert.ok(csHeaders.indexOf('bin_card') < csHeaders.indexOf('bin_card_update'));
assert.ok(csHeaders.indexOf('bin_card_update') < csHeaders.indexOf('odering_personnel'));
assert.ok(csHeaders.indexOf('odering_personnel') < csHeaders.indexOf('stock_orders'));
assert.ok(csHeaders.indexOf('stock_orders') < csHeaders.indexOf('supplies'));
assert.ok(csHeaders.indexOf('fefo') < csHeaders.indexOf('hygiene'));
assert.ok(csHeaders.indexOf('hygiene') < csHeaders.indexOf('structures'));
assert.ok(csHeaders.indexOf('dust') < csHeaders.indexOf('computer'));
assert.strictEqual(csHeaders.slice(-4).join('|'),
  'thermometer|room|dust|computer'
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
