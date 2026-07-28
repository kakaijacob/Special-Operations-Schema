/**
 * KoboToolbox → Google Sheets puller
 * ------------------------------------------------
 * Pulls submission data from 8 Kobo forms (assets) via the KoboToolbox API v2
 * and writes each form's data into its own sheet tab.
 *
 * SETUP
 * 1. In Script Properties (Project Settings > Script Properties), add:
 *      KOBO_API_TOKEN  -> your Kobo API token
 *    (Get this from Kobo: Account Settings > Security > API Token)
 * 2. Base URL below is set to the OCHA humanitarian Kobo server
 *    (kobo.humanitarianresponse.info). Change it if that's not the
 *    right server for your forms.
 * 3. Fill in FORM_CONFIG below with your 8 form (asset) UIDs and the
 *    sheet tab name you want each one written to.
 * 4. Run `pullAllForms` once manually to authorize the script.
 * 5. Optionally run `createDailyTrigger` once to schedule this to run
 *    automatically (see bottom of file).
 */

// ---------- CONFIG ----------

const KOBO_BASE_URL = 'https://kobo.humanitarianresponse.info'; // OCHA humanitarian server

// Add your 8 form UIDs here, each mapped to the sheet tab name it should
// write to. The asset UID is the string in the Kobo URL:
// https://kobo.humanitarianresponse.info/#/forms/aXXXXXXXXXXXXXXXXXXXXXX/
const FORM_CONFIG = [
  { uid: 'aQb68NgWt27XdYZcLjBeEg', sheetName: 'Newborn Unit' },
  { uid: 'ayJmtRyKnrwh2qVL5BRmBv', sheetName: 'Inpatient Maternity' },
  { uid: 'a6kFhM7A67mPyb26udMR3o', sheetName: 'Outpatient' },
  { uid: 'aJxN6izu5HKcEQMkbMyAb6', sheetName: 'Lab' },
  { uid: 'aPk9ZZ4YMqX4uYaMFXmDQF', sheetName: 'Operating Theatre' },
  { uid: 'aaaFehxBcdYrZuQQBAGMkF', sheetName: 'Pharmacy' },
  { uid: 'afkfnzSqqg3DiGxgvP8nR2', sheetName: 'Central Store' },
  { uid: 'ajaViXRxTMrixfE9udoord', sheetName: 'Facility General' },
];

const PAGE_SIZE = 1000; // Kobo API page size for pagination

// ---------- MAIN ENTRY POINT ----------

function pullAllForms() {
  const token = getApiToken();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  FORM_CONFIG.forEach(function (form) {
    try {
      Logger.log('Pulling form: ' + form.uid);
      const records = fetchAllSubmissions(form.uid, token);
      writeRecordsToSheet(ss, form.sheetName, records);
      Logger.log('Wrote ' + records.length + ' records to "' + form.sheetName + '"');
    } catch (err) {
      Logger.log('ERROR pulling ' + form.uid + ': ' + err.message);
    }
  });
}

// ---------- KOBO API ----------

function getApiToken() {
  const token = PropertiesService.getScriptProperties().getProperty('KOBO_API_TOKEN');
  if (!token) {
    throw new Error('Missing KOBO_API_TOKEN in Script Properties. See setup instructions at top of file.');
  }
  return token;
}

/**
 * Fetches all submissions for a given form UID, handling pagination.
 */
function fetchAllSubmissions(assetUid, token) {
  let allResults = [];
  let start = 0;
  let total = null;

  do {
    const url = KOBO_BASE_URL + '/api/v2/assets/' + assetUid + '/data.json'
      + '?limit=' + PAGE_SIZE + '&start=' + start;

    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        Authorization: 'Token ' + token,
      },
      muteHttpExceptions: true,
    });

    const code = response.getResponseCode();
    if (code !== 200) {
      throw new Error('Kobo API returned HTTP ' + code + ' for ' + assetUid + ': ' + response.getContentText());
    }

    const json = JSON.parse(response.getContentText());
    total = json.count;
    allResults = allResults.concat(json.results);
    start += PAGE_SIZE;

    // Be polite to the API
    Utilities.sleep(200);
  } while (start < total);

  return allResults;
}

// ---------- SHEET WRITING ----------

function writeRecordsToSheet(ss, sheetName, records) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  sheet.clearContents();

  if (!records || records.length === 0) {
    sheet.getRange(1, 1).setValue('No submissions found.');
    return;
  }

  // Build a union of all keys across records, since Kobo records can have
  // slightly different fields (e.g. repeat groups, skip logic).
  const headerSet = {};
  records.forEach(function (rec) {
    Object.keys(rec).forEach(function (key) {
      headerSet[key] = true;
    });
  });
  const headers = Object.keys(headerSet);

  const rows = records.map(function (rec) {
    return headers.map(function (h) {
      const val = rec[h];
      if (val === undefined || val === null) return '';
      // Flatten nested objects/arrays (e.g. repeat groups, geopoints) to JSON strings
      if (typeof val === 'object') return JSON.stringify(val);
      return val;
    });
  });

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.setFrozenRows(1);
}

// ---------- OPTIONAL: SCHEDULED TRIGGER ----------

/**
 * Run this once manually to set up a daily automatic pull at 6am.
 * Delete existing triggers first if you re-run this to avoid duplicates.
 */
function createDailyTrigger() {
  ScriptApp.newTrigger('pullAllForms')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();
}
