/**
 * QuIPS Kobo Tool — Google Apps Script
 * ------------------------------------------------------------------
 * Replicates the QuIPS XLSForm (survey / choices / settings) in a
 * Google Sheet, rebuilds county–facility lists from Facility_Master,
 * and pushes the form to KoboToolbox given an API token + asset UID.
 *
 * Setup
 *   1. Create a Google Sheet, Extensions → Apps Script
 *   2. Paste this file and QuIPS_Kobo_Tool_Seed.js into the project
 *   3. Run menu: QuIPS Kobo Tool → Initialize workbook
 *   4. Fill Config!API_TOKEN and Config!ASSET_UID
 *   5. Edit Facility_Master as needed → Rebuild facilities from master
 *   6. Push form to Kobo
 *
 * Config sheet keys
 *   KOBO_SERVER   e.g. https://kf.humanitarianresponse.info
 *   API_TOKEN     Kobo API token
 *   ASSET_UID     Target form asset UID (e.g. aSwMMq2L7UbfpRAvLFkL6d)
 *   AUTO_REDEPLOY TRUE/FALSE — redeploy after content update
 */

// =====================================================
// MENU
// =====================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('QuIPS Kobo Tool')
    .addItem('1. Initialize workbook', 'initializeQuIPSWorkbook')
    .addItem('2. Rebuild facilities from master', 'rebuildFacilitiesFromMaster')
    .addSeparator()
    .addItem('3. Validate form sheets', 'validateQuIPSForm')
    .addItem('4. Push form to Kobo', 'pushFormToKobo')
    .addItem('5. Push + redeploy to Kobo', 'pushFormToKoboAndRedeploy')
    .addSeparator()
    .addItem('Show current Kobo asset info', 'showKoboAssetInfo')
    .addToUi();
}

// =====================================================
// INITIALIZE WORKBOOK
// =====================================================
function initializeQuIPSWorkbook() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  ensureConfigSheet_(ss);
  writeSheetFromSeed_(ss, 'survey', QUIPS_SEED.survey);
  writeSheetFromSeed_(ss, 'choices', QUIPS_SEED.choices);
  writeSheetFromSeed_(ss, 'settings', QUIPS_SEED.settings);
  writeFacilityMaster_(ss);

  SpreadsheetApp.getUi().alert(
    'QuIPS workbook initialized.\n\n' +
    'Next:\n' +
    '1) Set API_TOKEN and ASSET_UID on the Config sheet\n' +
    '2) Edit Facility_Master if needed\n' +
    '3) Run Rebuild facilities from master\n' +
    '4) Push form to Kobo'
  );
}

function ensureConfigSheet_(ss) {
  var sh = getOrCreateSheet_(ss, 'Config');
  var existing = {};
  var values = sh.getDataRange().getValues();
  for (var i = 0; i < values.length; i++) {
    if (values[i][0]) existing[String(values[i][0])] = values[i][1];
  }

  var defaults = [
    ['Key', 'Value'],
    ['KOBO_SERVER', existing.KOBO_SERVER || 'https://kf.humanitarianresponse.info'],
    ['API_TOKEN', existing.API_TOKEN || ''],
    ['ASSET_UID', existing.ASSET_UID || 'aSwMMq2L7UbfpRAvLFkL6d'],
    ['AUTO_REDEPLOY', existing.AUTO_REDEPLOY || 'TRUE'],
    ['FORM_TITLE', existing.FORM_TITLE || 'QuIPS Kobo Tool']
  ];

  sh.clear();
  sh.getRange(1, 1, defaults.length, 2).setValues(defaults);
  sh.setFrozenRows(1);
  sh.getRange('A1:B1').setFontWeight('bold');
  sh.setColumnWidth(1, 160);
  sh.setColumnWidth(2, 420);
}

function writeFacilityMaster_(ss) {
  var sh = getOrCreateSheet_(ss, 'Facility_Master');
  sh.clear();
  var rows = [QUIPS_FACILITY_MASTER_HEADERS].concat(QUIPS_FACILITY_MASTER_ROWS);
  sh.getRange(1, 1, rows.length, QUIPS_FACILITY_MASTER_HEADERS.length).setValues(rows);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, QUIPS_FACILITY_MASTER_HEADERS.length).setFontWeight('bold');
  sh.autoResizeColumns(1, QUIPS_FACILITY_MASTER_HEADERS.length);
}

function writeSheetFromSeed_(ss, sheetName, seed) {
  var sh = getOrCreateSheet_(ss, sheetName);
  sh.clear();
  var headers = seed.headers;
  var data = [headers];
  for (var i = 0; i < seed.rows.length; i++) {
    data.push(seed.rows[i].map(function (v) {
      return v === null || typeof v === 'undefined' ? '' : v;
    }));
  }
  sh.getRange(1, 1, data.length, headers.length).setValues(data);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
}

// =====================================================
// REBUILD FACILITIES FROM MASTER
// =====================================================
/**
 * Reads Facility_Master and regenerates:
 *  - county choices
 *  - per-county facility choice lists ({county}f)
 *  - survey facility select_one rows + facilities calculate
 */
function rebuildFacilitiesFromMaster() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var master = ss.getSheetByName('Facility_Master');
  var survey = ss.getSheetByName('survey');
  var choices = ss.getSheetByName('choices');

  if (!master || !survey || !choices) {
    throw new Error('Missing Facility_Master, survey, or choices sheet. Run Initialize workbook first.');
  }

  var facilities = readFacilityMaster_(master);
  if (!facilities.length) {
    throw new Error('Facility_Master has no data rows.');
  }

  var byCounty = groupFacilitiesByCounty_(facilities);
  var counties = Object.keys(byCounty);

  rebuildChoiceLists_(choices, byCounty, counties);
  rebuildSurveyFacilityBlock_(survey, counties);

  SpreadsheetApp.getUi().alert(
    'Facilities rebuilt.\n\nCounties: ' + counties.join(', ') +
    '\nFacilities: ' + facilities.length +
    '\n\nReview survey/choices, then Push form to Kobo.'
  );
}

function readFacilityMaster_(sh) {
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];

  var header = values[0].map(function (h) { return String(h || '').trim(); });
  var countyIdx = indexOfHeader_(header, ['County']);
  var facilityIdx = indexOfHeader_(header, ['Facility', 'Facility (master name)']);
  var codeIdx = indexOfHeader_(header, ['Facility Code', 'FacilityCode', 'Code']);

  if (countyIdx < 0 || facilityIdx < 0 || codeIdx < 0) {
    throw new Error('Facility_Master must include County, Facility, and Facility Code columns.');
  }

  var out = [];
  for (var i = 1; i < values.length; i++) {
    var county = String(values[i][countyIdx] || '').trim();
    var facility = String(values[i][facilityIdx] || '').trim();
    var code = String(values[i][codeIdx] || '').trim();
    if (!county || !facility || !code) continue;
    out.push({
      county: county,
      facility: facility,
      code: code,
      listName: facilityListName_(county),
      koboName: code + '_' + cleanForKobo_(facility)
    });
  }
  return out;
}

function groupFacilitiesByCounty_(facilities) {
  var byCounty = {};
  for (var i = 0; i < facilities.length; i++) {
    var f = facilities[i];
    if (!byCounty[f.county]) byCounty[f.county] = [];
    byCounty[f.county].push(f);
  }
  // Keep each county's facilities A-Z by label for Kobo choice order
  Object.keys(byCounty).forEach(function (county) {
    byCounty[county].sort(function (a, b) {
      return String(a.facility || '').toLowerCase().localeCompare(String(b.facility || '').toLowerCase());
    });
  });
  return byCounty;
}

function rebuildChoiceLists_(choicesSheet, byCounty, counties) {
  var values = choicesSheet.getDataRange().getValues();
  var headers = values[0];
  var listIdx = headers.indexOf('list_name');
  var nameIdx = headers.indexOf('name');
  var labelIdx = headers.indexOf('label');
  if (listIdx < 0 || nameIdx < 0 || labelIdx < 0) {
    throw new Error('choices sheet must have list_name, name, label columns.');
  }

  // Managed lists: county + current/new facility lists + any legacy
  // facility list whose choice names look like {facilityCode}_{slug}
  var managedLists = { county: true };
  for (var c = 0; c < counties.length; c++) {
    managedLists[facilityListName_(counties[c])] = true;
  }
  for (var r0 = 1; r0 < values.length; r0++) {
    var existingList = values[r0][listIdx];
    var existingName = values[r0][nameIdx];
    if (existingList && existingName && /^\d+_/.test(String(existingName))) {
      managedLists[String(existingList)] = true;
    }
  }

  var kept = [headers];
  for (var r = 1; r < values.length; r++) {
    var listName = values[r][listIdx];
    if (managedLists[listName]) continue;
    kept.push(values[r]);
  }

  // Append county choices
  for (var i = 0; i < counties.length; i++) {
    var row = blankChoiceRow_(headers.length);
    row[listIdx] = 'county';
    row[nameIdx] = counties[i];
    row[labelIdx] = counties[i];
    kept.push(row);
  }

  // Append facility choices per county
  for (var j = 0; j < counties.length; j++) {
    var county = counties[j];
    var list = byCounty[county];
    for (var k = 0; k < list.length; k++) {
      var f = list[k];
      var frow = blankChoiceRow_(headers.length);
      frow[listIdx] = f.listName;
      frow[nameIdx] = f.koboName;
      frow[labelIdx] = f.facility;
      kept.push(frow);
    }
  }

  choicesSheet.clear();
  choicesSheet.getRange(1, 1, kept.length, headers.length).setValues(kept);
  choicesSheet.setFrozenRows(1);
  choicesSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
}

function blankChoiceRow_(width) {
  var row = [];
  for (var i = 0; i < width; i++) row.push('');
  return row;
}

function rebuildSurveyFacilityBlock_(surveySheet, counties) {
  var values = surveySheet.getDataRange().getValues();
  var headers = values[0];
  var typeIdx = headers.indexOf('type');
  var nameIdx = headers.indexOf('name');
  var labelIdx = headers.indexOf('label');
  var requiredIdx = headers.indexOf('required');
  var relevantIdx = headers.indexOf('relevant');
  var calcIdx = headers.indexOf('calculation');

  if (typeIdx < 0 || nameIdx < 0) {
    throw new Error('survey sheet must have type and name columns.');
  }

  var countyRow = -1;
  var calcRow = -1;
  for (var r = 1; r < values.length; r++) {
    if (values[r][nameIdx] === 'county') countyRow = r;
    if (values[r][nameIdx] === 'facilities') calcRow = r;
  }
  if (countyRow < 0 || calcRow < 0) {
    throw new Error('survey must contain county and facilities questions.');
  }

  // Keep rows before county (inclusive) and after facilities calculate (exclusive of old facility rows)
  // Remove any facility_* rows and the old facilities calculate between county and the next non-facility question
  var before = values.slice(0, countyRow + 1); // includes header + through county
  // Actually values[0] is header; countyRow is index in values
  var head = [values[0]];
  var prefix = [];
  for (var i = 1; i <= countyRow; i++) prefix.push(values[i]);

  var suffixStart = calcRow + 1;
  // Walk back: anything between county and calc that is facility_* or facilities will be replaced
  var suffix = values.slice(suffixStart);

  var facilityRows = [];
  for (var c = 0; c < counties.length; c++) {
    var county = counties[c];
    var listName = facilityListName_(county);
    var fieldName = 'facility_' + cleanForKobo_(county);
    var row = blankSurveyRow_(headers.length);
    row[typeIdx] = 'select_one ' + listName;
    row[nameIdx] = fieldName;
    row[labelIdx] = '2. Which facility are you reporting on?';
    if (requiredIdx >= 0) row[requiredIdx] = 'true';
    if (relevantIdx >= 0) row[relevantIdx] = "${county} = '" + county + "'";
    facilityRows.push(row);
  }

  var calc = blankSurveyRow_(headers.length);
  calc[typeIdx] = 'calculate';
  calc[nameIdx] = 'facilities';
  calc[labelIdx] = 'Facilities';
  if (requiredIdx >= 0) calc[requiredIdx] = 'true';
  if (calcIdx >= 0) calc[calcIdx] = buildFacilitiesCalculate_(counties);

  var out = head.concat(prefix).concat(facilityRows).concat([calc]).concat(suffix);

  // Deduplicate in case suffix somehow still has facility rows (shouldn't)
  surveySheet.clear();
  surveySheet.getRange(1, 1, out.length, headers.length).setValues(out);
  surveySheet.setFrozenRows(1);
  surveySheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
}

function blankSurveyRow_(width) {
  var row = [];
  for (var i = 0; i < width; i++) row.push('');
  return row;
}

function buildFacilitiesCalculate_(counties) {
  // Nested if(${facility_x} != '', ${facility_x}, ... )
  function nest(i) {
    if (i >= counties.length) return "''";
    var field = 'facility_' + cleanForKobo_(counties[i]);
    return "if(${" + field + "} != '', ${" + field + "}, " + nest(i + 1) + ")";
  }
  return nest(0);
}

function facilityListName_(county) {
  return cleanForKobo_(county) + 'f';
}

// =====================================================
// VALIDATE
// =====================================================
function validateQuIPSForm() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var survey = ss.getSheetByName('survey');
  var choices = ss.getSheetByName('choices');
  var issues = [];

  if (!survey) issues.push('Missing survey sheet');
  if (!choices) issues.push('Missing choices sheet');

  if (survey && choices) {
    var surveyData = survey.getDataRange().getValues();
    var choiceData = choices.getDataRange().getValues();
    var sHeaders = surveyData[0];
    var cHeaders = choiceData[0];
    var sType = sHeaders.indexOf('type');
    var sName = sHeaders.indexOf('name');
    var cList = cHeaders.indexOf('list_name');
    var cName = cHeaders.indexOf('name');

    var lists = {};
    for (var i = 1; i < choiceData.length; i++) {
      var ln = choiceData[i][cList];
      if (!ln) continue;
      if (!lists[ln]) lists[ln] = {};
      var cn = choiceData[i][cName];
      if (cn) lists[ln][String(cn)] = true;
    }

    var names = {};
    for (var r = 1; r < surveyData.length; r++) {
      var type = String(surveyData[r][sType] || '');
      var name = String(surveyData[r][sName] || '');
      if (!name) continue;
      if (names[name]) issues.push('Duplicate survey name: ' + name);
      names[name] = true;

      var m = type.match(/^select_(?:one|multiple)\s+(\S+)/);
      if (m && !lists[m[1]]) {
        issues.push('Missing choice list "' + m[1] + '" used by ' + name);
      }
    }

    if (!names.county) issues.push('Missing survey question: county');
    if (!names.facilities) issues.push('Missing calculate: facilities');
  }

  var msg = issues.length ?
    ('Validation found ' + issues.length + ' issue(s):\n\n- ' + issues.join('\n- ')) :
    'Validation passed. survey/choices look consistent.';
  SpreadsheetApp.getUi().alert(msg);
  return issues;
}

// =====================================================
// KOBO API — PUSH / REDEPLOY
// =====================================================
function pushFormToKobo() {
  pushFormToKobo_(false);
}

function pushFormToKoboAndRedeploy() {
  pushFormToKobo_(true);
}

function pushFormToKobo_(forceRedeploy) {
  var cfg = readConfig_();
  if (!cfg.API_TOKEN) throw new Error('Config!API_TOKEN is empty.');
  if (!cfg.ASSET_UID) throw new Error('Config!ASSET_UID is empty.');

  var issues = validateQuIPSFormSilent_();
  if (issues.length) {
    var proceed = SpreadsheetApp.getUi().alert(
      'Validation warnings',
      'Found ' + issues.length + ' issue(s). Push anyway?\n\n- ' + issues.slice(0, 8).join('\n- '),
      SpreadsheetApp.getUi().ButtonSet.YES_NO
    );
    if (proceed !== SpreadsheetApp.getUi().Button.YES) return;
  }

  var content = buildKoboContentFromSheets_();
  if (cfg.FORM_TITLE) {
    content.settings = content.settings || {};
    if (!content.settings.id_string && !content.settings.form_title) {
      content.settings.form_title = cfg.FORM_TITLE;
    } else if (!content.settings.form_title) {
      content.settings.form_title = cfg.FORM_TITLE;
    }
  }

  var url = joinUrl_(cfg.KOBO_SERVER, '/api/v2/assets/' + cfg.ASSET_UID + '/');
  var payload = { content: content };

  var response = UrlFetchApp.fetch(url, {
    method: 'patch',
    contentType: 'application/json',
    headers: {
      Authorization: 'Token ' + cfg.API_TOKEN,
      Accept: 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  var code = response.getResponseCode();
  var body = response.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error('Kobo content update failed (' + code + '):\n' + body.substring(0, 1500));
  }

  var redeploy = forceRedeploy || String(cfg.AUTO_REDEPLOY).toUpperCase() === 'TRUE';
  var deployMsg = '';
  if (redeploy) {
    deployMsg = redeployKoboAsset_(cfg);
  }

  SpreadsheetApp.getUi().alert(
    'Kobo form updated successfully.\n\n' +
    'Asset: ' + cfg.ASSET_UID + '\n' +
    'Server: ' + cfg.KOBO_SERVER + '\n' +
    (redeploy ? ('Redeploy: ' + deployMsg) : 'Redeploy: skipped')
  );
}

function redeployKoboAsset_(cfg) {
  // PATCH deployment replaces the deployed form with latest asset content
  var url = joinUrl_(cfg.KOBO_SERVER, '/api/v2/assets/' + cfg.ASSET_UID + '/deployment/');
  var response = UrlFetchApp.fetch(url, {
    method: 'patch',
    contentType: 'application/json',
    headers: {
      Authorization: 'Token ' + cfg.API_TOKEN,
      Accept: 'application/json'
    },
    payload: JSON.stringify({}),
    muteHttpExceptions: true
  });

  var code = response.getResponseCode();
  // If never deployed, try POST
  if (code === 404 || code === 405 || code === 400) {
    response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Token ' + cfg.API_TOKEN,
        Accept: 'application/json'
      },
      payload: JSON.stringify({}),
      muteHttpExceptions: true
    });
    code = response.getResponseCode();
  }

  if (code < 200 || code >= 300) {
    return 'FAILED (' + code + '): ' + response.getContentText().substring(0, 400);
  }
  return 'OK (' + code + ')';
}

function showKoboAssetInfo() {
  var cfg = readConfig_();
  if (!cfg.API_TOKEN || !cfg.ASSET_UID) {
    throw new Error('Set API_TOKEN and ASSET_UID on the Config sheet first.');
  }
  var url = joinUrl_(cfg.KOBO_SERVER, '/api/v2/assets/' + cfg.ASSET_UID + '/');
  var response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: {
      Authorization: 'Token ' + cfg.API_TOKEN,
      Accept: 'application/json'
    },
    muteHttpExceptions: true
  });
  var code = response.getResponseCode();
  var body = response.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error('Failed to fetch asset (' + code + '):\n' + body.substring(0, 1000));
  }
  var asset = JSON.parse(body);
  SpreadsheetApp.getUi().alert(
    'Asset info\n\n' +
    'UID: ' + (asset.uid || cfg.ASSET_UID) + '\n' +
    'Name: ' + (asset.name || '') + '\n' +
    'Deployed: ' + (asset.deployment_status || asset.deployment__active || '') + '\n' +
    'Has deployment: ' + !!(asset.deployment__identifier || asset.has_deployment) + '\n' +
    'URL: ' + (asset.url || url)
  );
}

// =====================================================
// BUILD KOBO CONTENT JSON FROM SHEETS
// =====================================================
function buildKoboContentFromSheets_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var surveySheet = ss.getSheetByName('survey');
  var choicesSheet = ss.getSheetByName('choices');
  var settingsSheet = ss.getSheetByName('settings');

  var survey = sheetToObjects_(surveySheet);
  var choices = sheetToObjects_(choicesSheet);
  var settingsRows = settingsSheet ? sheetToObjects_(settingsSheet) : [];

  var contentSurvey = [];
  for (var i = 0; i < survey.length; i++) {
    var row = survey[i];
    if (!row.type && !row.name) continue;
    contentSurvey.push(xlsRowToSurveyItem_(row));
  }

  var contentChoices = [];
  for (var j = 0; j < choices.length; j++) {
    var ch = choices[j];
    if (!ch.list_name || !ch.name) continue;
    var item = {
      list_name: String(ch.list_name),
      name: String(ch.name),
      label: [String(ch.label || ch.name)]
    };
    if (ch.order !== '' && ch.order !== null && typeof ch.order !== 'undefined') {
      item.order = ch.order;
    }
    if (ch.allowed !== '' && ch.allowed !== null && typeof ch.allowed !== 'undefined') {
      // custom column used by this form's choice_filter
      item.allowed = String(ch.allowed);
    }
    contentChoices.push(item);
  }

  var settings = {};
  for (var s = 0; s < settingsRows.length; s++) {
    var keys = Object.keys(settingsRows[s]);
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      var val = settingsRows[s][key];
      if (val !== '' && val !== null && typeof val !== 'undefined') {
        settings[key] = String(val);
      }
    }
  }

  return {
    schema: '1',
    survey: contentSurvey,
    choices: contentChoices,
    settings: settings,
    translated: ['label', 'hint', 'constraint_message'],
    translations: [null]
  };
}

function xlsRowToSurveyItem_(row) {
  var item = {};
  var typeRaw = String(row.type || '').trim();
  var selectMatch = typeRaw.match(/^(select_one|select_multiple)\s+(\S+)$/);
  if (selectMatch) {
    item.type = selectMatch[1];
    item.select_from_list_name = selectMatch[2];
  } else {
    item.type = typeRaw;
  }

  if (row.name) item.name = String(row.name);

  ['label', 'hint', 'constraint_message'].forEach(function (field) {
    if (row[field] !== '' && row[field] !== null && typeof row[field] !== 'undefined') {
      item[field] = [String(row[field])];
    }
  });

  ['required', 'relevant', 'calculation', 'constraint', 'choice_filter', 'appearance', 'default'].forEach(function (field) {
    if (row[field] !== '' && row[field] !== null && typeof row[field] !== 'undefined') {
      item[field] = String(row[field]);
    }
  });

  return item;
}

// =====================================================
// CONFIG / HELPERS
// =====================================================
function readConfig_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Config');
  if (!sh) throw new Error('Missing Config sheet. Run Initialize workbook first.');
  var values = sh.getDataRange().getValues();
  var cfg = {};
  for (var i = 0; i < values.length; i++) {
    var key = String(values[i][0] || '').trim();
    if (!key || key === 'Key') continue;
    cfg[key] = values[i][1];
  }
  cfg.KOBO_SERVER = String(cfg.KOBO_SERVER || 'https://kf.humanitarianresponse.info').replace(/\/$/, '');
  cfg.API_TOKEN = String(cfg.API_TOKEN || '').trim();
  cfg.ASSET_UID = String(cfg.ASSET_UID || '').trim();
  cfg.AUTO_REDEPLOY = String(cfg.AUTO_REDEPLOY || 'TRUE').trim();
  cfg.FORM_TITLE = String(cfg.FORM_TITLE || 'QuIPS Kobo Tool').trim();
  return cfg;
}

function validateQuIPSFormSilent_() {
  // reuse validate without UI — quick structural checks
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var survey = ss.getSheetByName('survey');
  var choices = ss.getSheetByName('choices');
  var issues = [];
  if (!survey) issues.push('Missing survey');
  if (!choices) issues.push('Missing choices');
  if (!survey || !choices) return issues;

  var surveyData = survey.getDataRange().getValues();
  var choiceData = choices.getDataRange().getValues();
  var sType = surveyData[0].indexOf('type');
  var sName = surveyData[0].indexOf('name');
  var cList = choiceData[0].indexOf('list_name');
  var lists = {};
  for (var i = 1; i < choiceData.length; i++) {
    if (choiceData[i][cList]) lists[choiceData[i][cList]] = true;
  }
  for (var r = 1; r < surveyData.length; r++) {
    var type = String(surveyData[r][sType] || '');
    var name = String(surveyData[r][sName] || '');
    var m = type.match(/^select_(?:one|multiple)\s+(\S+)/);
    if (m && !lists[m[1]]) issues.push('Missing list ' + m[1] + ' for ' + name);
  }
  return issues;
}

function sheetToObjects_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (!values.length) return [];
  var headers = values[0].map(function (h) { return String(h || '').trim(); });
  var out = [];
  for (var r = 1; r < values.length; r++) {
    var obj = {};
    var empty = true;
    for (var c = 0; c < headers.length; c++) {
      if (!headers[c]) continue;
      var v = values[r][c];
      if (v !== '' && v !== null && typeof v !== 'undefined') empty = false;
      obj[headers[c]] = v;
    }
    if (!empty) out.push(obj);
  }
  return out;
}

function getOrCreateSheet_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (sh) return sh;
  return ss.insertSheet(name);
}

function indexOfHeader_(header, candidates) {
  for (var i = 0; i < candidates.length; i++) {
    var idx = header.indexOf(candidates[i]);
    if (idx >= 0) return idx;
  }
  // case-insensitive fallback
  var lower = header.map(function (h) { return String(h).toLowerCase(); });
  for (var j = 0; j < candidates.length; j++) {
    var idx2 = lower.indexOf(String(candidates[j]).toLowerCase());
    if (idx2 >= 0) return idx2;
  }
  return -1;
}

function cleanForKobo_(str) {
  if (!str) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function joinUrl_(base, path) {
  return String(base).replace(/\/$/, '') + path;
}
