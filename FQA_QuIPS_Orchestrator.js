/**
 * FQA QuIPS Orchestrator
 *
 * Runs extraction and transformation for all 8 Kobo forms,
 * then refreshes the FQA Weighting sheet.
 */

const FORM_CONFIG = [
  {
    uid: 'aQb68NgWt27XdYZcLjBeEg',
    sheetName: 'Newborn Unit',
  },
  {
    uid: 'ayJmtRyKnrwh2qVL5BRmBv',
    sheetName: 'Inpatient Maternity',
  },
  {
    uid: 'a6kFhM7A67mPyb26udMR3o',
    sheetName: 'Outpatient',
  },
  {
    uid: 'aJxN6izu5HKcEQMkbMyAb6',
    sheetName: 'Lab',
  },
  {
    uid: 'aPk9ZZ4YMqX4uYaMFXmDQF',
    sheetName: 'Operating Theatre',
  },
  {
    uid: 'aaaFehxBcdYrZuQQBAGMkF',
    sheetName: 'Pharmacy',
  },
  {
    uid: 'afkfnzSqqg3DiGxgvP8nR2',
    sheetName: 'Central Store',
  },
  {
    uid: 'ajaViXRxTMrixfE9udoord',
    sheetName: 'Facility General',
  },
];

/**
 * Incremental refresh.
 *
 * Appends submissions whose `_uuid` is not already in the sheet.
 */
function pullAllForms() {
  const token = getApiToken();
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  FORM_CONFIG.forEach(function (form, index) {
    try {
      Logger.log(
        'Pulling form: ' +
        form.uid +
        ' → "' +
        form.sheetName +
        '"'
      );

      let records = fetchAllSubmissions(
        form.uid,
        token
      );

      records = transformRecordsForSheet_(
        form.sheetName,
        records
      );

      const preferredHeaders =
        preferredHeadersForSheet_(
          form.sheetName
        );

      const result = appendNewRecordsToSheet(
        spreadsheet,
        form.sheetName,
        records,
        preferredHeaders
      );

      Logger.log(
        'Sheet "' +
        form.sheetName +
        '": appended ' +
        result.appended +
        ' new row(s); skipped ' +
        result.skipped +
        ' existing UUID(s).'
      );
    } catch (err) {
      Logger.log(
        'ERROR pulling ' +
        form.uid +
        ' → "' +
        form.sheetName +
        '": ' +
        err.message +
        (err.stack ? '\n' + err.stack : '')
      );
    }

    if (index < FORM_CONFIG.length - 1) {
      Utilities.sleep(KOBO_FORM_PAUSE_MS);
    }
  });

  refreshFqaWeightingSheet_();
}

/**
 * Full refresh.
 *
 * Fetches and transforms data before clearing each sheet.
 */
function fullRefreshAllForms() {
  const token = getApiToken();
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  FORM_CONFIG.forEach(function (form, index) {
    try {
      Logger.log(
        'Full refresh for form: ' +
        form.uid +
        ' → "' +
        form.sheetName +
        '"'
      );

      /*
       * Fetch and transform successfully before clearing existing data.
       */
      let records = fetchAllSubmissions(
        form.uid,
        token
      );

      records = transformRecordsForSheet_(
        form.sheetName,
        records
      );

      const preferredHeaders =
        preferredHeadersForSheet_(
          form.sheetName
        );

      const sheet = spreadsheet.getSheetByName(
        form.sheetName
      );

      if (sheet) {
        sheet.clearContents();
      }

      const result = appendNewRecordsToSheet(
        spreadsheet,
        form.sheetName,
        records,
        preferredHeaders
      );

      Logger.log(
        'Sheet "' +
        form.sheetName +
        '": wrote ' +
        result.appended +
        ' row(s).'
      );
    } catch (err) {
      Logger.log(
        'ERROR refreshing ' +
        form.uid +
        ' → "' +
        form.sheetName +
        '": ' +
        err.message +
        (err.stack ? '\n' + err.stack : '')
      );
    }

    if (index < FORM_CONFIG.length - 1) {
      Utilities.sleep(KOBO_FORM_PAUSE_MS);
    }
  });

  refreshFqaWeightingSheet_();
}

/**
 * Refresh the FQA Weighting catalog after form pulls.
 * Failures are logged and do not throw, matching per-form error handling.
 */
function refreshFqaWeightingSheet_() {
  try {
    writeFqaWeightingSheet();
  } catch (err) {
    Logger.log(
      'ERROR writing "' +
      FQA_WEIGHTING_SHEET_NAME +
      '": ' +
      err.message +
      (err.stack ? '\n' + err.stack : '')
    );
  }
}

/**
 * Route records to the appropriate transformation.
 */
function transformRecordsForSheet_(
  sheetName,
  records
) {
  if (sheetName === 'Newborn Unit') {
    return records.map(
      transformNewbornUnitRecord_
    );
  }

  if (sheetName === 'Inpatient Maternity') {
    return records.map(
      transformInpatientMaternityRecord_
    );
  }

  if (sheetName === 'Outpatient') {
    return records.map(
      transformOutpatientRecord_
    );
  }

  if (sheetName === 'Lab') {
    return records.map(
      transformLabRecord_
    );
  }

  if (sheetName === 'Operating Theatre') {
    return records.map(
      transformOperatingTheatreRecord_
    );
  }

  if (sheetName === 'Pharmacy') {
    return records.map(
      transformPharmacyRecord_
    );
  }

  if (sheetName === 'Central Store') {
    return records.map(
      transformCentralStoreRecord_
    );
  }

  if (sheetName === 'Facility General') {
    return records.map(
      transformFacilityGeneralRecord_
    );
  }

  throw new Error(
    'No transformation configured for sheet "' +
    sheetName +
    '".'
  );
}

/**
 * Return the preferred output-column order for each sheet.
 */
function preferredHeadersForSheet_(
  sheetName
) {
  if (sheetName === 'Newborn Unit') {
    return newbornUnitPreferredHeaders_();
  }

  if (sheetName === 'Inpatient Maternity') {
    return inpatientMaternityPreferredHeaders_();
  }

  if (sheetName === 'Outpatient') {
    return outpatientPreferredHeaders_();
  }

  if (sheetName === 'Lab') {
    return labPreferredHeaders_();
  }

  if (sheetName === 'Operating Theatre') {
    return operatingTheatrePreferredHeaders_();
  }

  if (sheetName === 'Pharmacy') {
    return pharmacyPreferredHeaders_();
  }

  if (sheetName === 'Central Store') {
    return centralStorePreferredHeaders_();
  }

  if (sheetName === 'Facility General') {
    return facilityGeneralPreferredHeaders_();
  }

  throw new Error(
    'No preferred headers configured for sheet "' +
    sheetName +
    '".'
  );
}

/**
 * Run once manually to create a daily incremental pull at 6 AM.
 *
 * Delete an existing pullAllForms trigger before running this again.
 */
function createDailyTrigger() {
  ScriptApp
    .newTrigger('pullAllForms')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();
}
