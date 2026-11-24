/**
 * KoboToolbox → Google Sheets puller
 * ------------------------------------------------
 * Pulls submission data from 8 Kobo forms (assets) via the KoboToolbox API v2
 * and writes each form's data into its own sheet tab.
 *
 * Incremental refresh: on each run, existing rows are kept and only submissions
 * whose `_uuid` is not already in the sheet are appended.
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
 * 6. To wipe a tab and reload everything, run `fullRefreshAllForms`
 *    (or clear the tab manually, then run `pullAllForms`).
 */

// ---------- CONFIG ----------

const KOBO_BASE_URL = 'https://kobo.humanitarianresponse.info'; // OCHA humanitarian server

// Kobo submission unique id used for incremental appends
const UUID_FIELD = '_uuid';

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
      const result = appendNewRecordsToSheet(ss, form.sheetName, records);
      Logger.log(
        'Sheet "' + form.sheetName + '": appended ' + result.appended +
        ' new row(s); skipped ' + result.skipped + ' existing uuid(s).'
      );
    } catch (err) {
      Logger.log('ERROR pulling ' + form.uid + ': ' + err.message);
    }
  });
}

/**
 * Clears each form tab and reloads all submissions (non-incremental).
 */
function fullRefreshAllForms() {
  const token = getApiToken();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  FORM_CONFIG.forEach(function (form) {
    try {
      Logger.log('Full refresh for form: ' + form.uid);
      const sheet = ss.getSheetByName(form.sheetName);
      if (sheet) {
        sheet.clearContents();
      }
      const records = fetchAllSubmissions(form.uid, token);
      const result = appendNewRecordsToSheet(ss, form.sheetName, records);
      Logger.log(
        'Sheet "' + form.sheetName + '": wrote ' + result.appended + ' row(s).'
      );
    } catch (err) {
      Logger.log('ERROR refreshing ' + form.uid + ': ' + err.message);
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

// ---------- SHEET WRITING (INCREMENTAL) ----------

/**
 * Appends only submissions whose `_uuid` is not already present in the sheet.
 * First run (empty sheet) writes all rows. New fields from later submissions
 * are added as extra columns on the right.
 */
function appendNewRecordsToSheet(ss, sheetName, records) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  if (!records || records.length === 0) {
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1).setValue('No submissions found.');
    }
    return { appended: 0, skipped: 0 };
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const firstCell = lastRow > 0 ? String(sheet.getRange(1, 1).getValue()) : '';
  const isEmptyOrPlaceholder =
    lastRow === 0 ||
    lastCol === 0 ||
    (lastRow === 1 && firstCell === 'No submissions found.');

  let headers;
  let existingUuidSet = {};

  if (isEmptyOrPlaceholder) {
    sheet.clearContents();
    headers = buildHeaderUnion_(records);
    // Ensure uuid column exists and is first for easier inspection
    headers = ensureUuidFirst_(headers);
    writeRows_(sheet, headers, records, /*startRow=*/2, /*writeHeader=*/true);
    sheet.setFrozenRows(1);
    return { appended: records.length, skipped: 0 };
  }

  headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  const uuidColIndex = headers.indexOf(UUID_FIELD);

  if (uuidColIndex === -1) {
    throw new Error(
      'Sheet "' + sheetName + '" has no "' + UUID_FIELD +
      '" column. Run fullRefreshAllForms() once to rebuild tabs.'
    );
  }

  if (lastRow >= 2) {
    const uuidValues = sheet.getRange(2, uuidColIndex + 1, lastRow, uuidColIndex + 1).getValues();
    uuidValues.forEach(function (row) {
      const uuid = row[0];
      if (uuid !== '' && uuid !== null && uuid !== undefined) {
        existingUuidSet[String(uuid)] = true;
      }
    });
  }

  const newRecords = records.filter(function (rec) {
    const uuid = rec[UUID_FIELD];
    if (uuid === undefined || uuid === null || uuid === '') return false;
    return !existingUuidSet[String(uuid)];
  });

  const skipped = records.length - newRecords.length;

  if (newRecords.length === 0) {
    return { appended: 0, skipped: skipped };
  }

  // Expand headers if new submissions introduce new fields
  const incomingKeys = buildHeaderUnion_(newRecords);
  const headerSet = {};
  headers.forEach(function (h) {
    headerSet[h] = true;
  });
  incomingKeys.forEach(function (key) {
    if (!headerSet[key]) {
      headers.push(key);
      headerSet[key] = true;
    }
  });

  // Update header row if columns were added
  if (headers.length > lastCol) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  writeRows_(sheet, headers, newRecords, /*startRow=*/lastRow + 1, /*writeHeader=*/false);
  sheet.setFrozenRows(1);
  return { appended: newRecords.length, skipped: skipped };
}

function buildHeaderUnion_(records) {
  const headerSet = {};
  records.forEach(function (rec) {
    Object.keys(rec).forEach(function (key) {
      headerSet[key] = true;
    });
  });
  return Object.keys(headerSet);
}

function ensureUuidFirst_(headers) {
  const withoutUuid = headers.filter(function (h) {
    return h !== UUID_FIELD;
  });
  return [UUID_FIELD].concat(withoutUuid);
}

function flattenCell_(val) {
  if (val === undefined || val === null) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return val;
}

function writeRows_(sheet, headers, records, startRow, writeHeader) {
  if (writeHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  const rows = records.map(function (rec) {
    return headers.map(function (h) {
      return flattenCell_(rec[h]);
    });
  });

  if (rows.length > 0) {
    sheet.getRange(startRow, 1, startRow + rows.length - 1, headers.length).setValues(rows);
  }
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
