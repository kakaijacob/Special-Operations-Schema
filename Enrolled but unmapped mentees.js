/**
 * Enrolled but unmapped mentees
 *
 * Compares mentee_id values on the Enrollment sheet against Mentee ID on the
 * Mapping sheet. Enrollment rows whose mentee_id is missing from Mapping are
 * written to a Lost & Found sheet (full Enrollment columns).
 *
 * Sheets expected in the active spreadsheet:
 *   - Enrollment
 *   - Mapping
 *   - Lost & Found  (created / overwritten by this script)
 *
 * Enrollment columns:
 *   county, date_submitted, facility, facility_code, id, mentee_id,
 *   mentee_name, mentorship_activity, submission_id, topic, updated_at,
 *   mentor_name, Year, Month, Day, submission_date, session_date
 *
 * Mapping columns (Mentee ID is the join key):
 *   Name, pseudo_code, Mentee ID, phone_number_whatsapp, Learning Mode,
 *   County, Facility Code, Facility, Cadre, Gender, New or Existing?,
 *   Date Activated, Date Deactivated, Date Reactivated,
 *   Reason for Deactivation, Status, Program, EmONC In-person, EmONC DELTA,
 *   Essential Newborn In-person, Essential Newborn DELTA,
 *   Comprehensive Newborn In-person, Continuum of Care, Safe Surgery, OPOCUS
 *
 * Run findUnmappedEnrolledMentees() from the Apps Script editor / a menu.
 */

var ENROLLMENT_SHEET_NAME = "Enrollment";
var MAPPING_SHEET_NAME = "Mapping";
var LOST_AND_FOUND_SHEET_NAME = "Lost & Found";

var ENROLLMENT_MENTEE_ID_HEADER = "mentee_id";
var MAPPING_MENTEE_ID_HEADER = "Mentee ID";

/**
 * Main entry: find Enrollment mentee_ids not present in Mapping and list those
 * Enrollment rows on Lost & Found.
 */
function findUnmappedEnrolledMentees() {
  Logger.log("Starting findUnmappedEnrolledMentees...");

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var enrollmentSheet = ss.getSheetByName(ENROLLMENT_SHEET_NAME);
  var mappingSheet = ss.getSheetByName(MAPPING_SHEET_NAME);

  if (!enrollmentSheet) {
    throw new Error("Sheet '" + ENROLLMENT_SHEET_NAME + "' not found.");
  }
  if (!mappingSheet) {
    throw new Error("Sheet '" + MAPPING_SHEET_NAME + "' not found.");
  }

  var enrollmentLastRow = enrollmentSheet.getLastRow();
  var enrollmentLastCol = enrollmentSheet.getLastColumn();
  var mappingLastRow = mappingSheet.getLastRow();
  var mappingLastCol = mappingSheet.getLastColumn();

  if (enrollmentLastRow < 1 || enrollmentLastCol < 1) {
    throw new Error("Enrollment sheet is empty.");
  }
  if (mappingLastRow < 1 || mappingLastCol < 1) {
    throw new Error("Mapping sheet is empty.");
  }

  var enrollmentValues = enrollmentSheet
    .getRange(1, 1, enrollmentLastRow, enrollmentLastCol)
    .getValues();
  var mappingValues = mappingSheet
    .getRange(1, 1, mappingLastRow, mappingLastCol)
    .getValues();

  var enrollmentHeaders = enrollmentValues[0];
  var mappingHeaders = mappingValues[0];

  var enrollmentMenteeIdIdx = findHeaderIndex_(
    enrollmentHeaders,
    ENROLLMENT_MENTEE_ID_HEADER
  );
  var mappingMenteeIdIdx = findHeaderIndex_(
    mappingHeaders,
    MAPPING_MENTEE_ID_HEADER
  );

  if (enrollmentMenteeIdIdx === -1) {
    throw new Error(
      "Enrollment sheet must include a '" + ENROLLMENT_MENTEE_ID_HEADER + "' column."
    );
  }
  if (mappingMenteeIdIdx === -1) {
    throw new Error(
      "Mapping sheet must include a '" + MAPPING_MENTEE_ID_HEADER + "' column."
    );
  }

  Logger.log(
    "Enrollment mentee_id col index: " +
      enrollmentMenteeIdIdx +
      "; Mapping 'Mentee ID' col index: " +
      mappingMenteeIdIdx
  );

  // Build set of mapped mentee IDs (normalized).
  var mappedIds = {};
  for (var m = 1; m < mappingValues.length; m++) {
    var mappedId = normalizeMenteeId_(mappingValues[m][mappingMenteeIdIdx]);
    if (mappedId) {
      mappedIds[mappedId] = true;
    }
  }

  Logger.log(
    "Mapped mentee IDs loaded: " + Object.keys(mappedIds).length
  );

  // Collect Enrollment rows whose mentee_id is blank-skipped or missing from Mapping.
  var lostRows = [];
  var blankMenteeIdCount = 0;
  var checkedCount = 0;

  for (var e = 1; e < enrollmentValues.length; e++) {
    var row = enrollmentValues[e];
    var menteeId = normalizeMenteeId_(row[enrollmentMenteeIdIdx]);

    if (!menteeId) {
      blankMenteeIdCount++;
      continue;
    }

    checkedCount++;

    if (!mappedIds[menteeId]) {
      lostRows.push(row);
    }
  }

  writeLostAndFound_(ss, enrollmentHeaders, lostRows);

  Logger.log(
    "Checked " +
      checkedCount +
      " Enrollment row(s) with mentee_id; " +
      blankMenteeIdCount +
      " blank mentee_id row(s) skipped; " +
      lostRows.length +
      " unmapped row(s) written to '" +
      LOST_AND_FOUND_SHEET_NAME +
      "'."
  );

  SpreadsheetApp.getActiveSpreadsheet().toast(
    lostRows.length +
      " unmapped Enrollment row(s) → " +
      LOST_AND_FOUND_SHEET_NAME,
    "Enrolled but unmapped mentees",
    8
  );

  return lostRows.length;
}

/**
 * Create or clear Lost & Found and write Enrollment headers + unmapped rows.
 */
function writeLostAndFound_(ss, headers, rows) {
  var sheet = ss.getSheetByName(LOST_AND_FOUND_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(LOST_AND_FOUND_SHEET_NAME);
    Logger.log("Created sheet: " + LOST_AND_FOUND_SHEET_NAME);
  } else {
    sheet.clearContents();
    Logger.log("Cleared existing sheet: " + LOST_AND_FOUND_SHEET_NAME);
  }

  // Always write headers so the sheet is usable even when nothing is missing.
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  sheet.setFrozenRows(1);
}

/**
 * Case-insensitive header lookup; returns 0-based index or -1.
 */
function findHeaderIndex_(headerValues, label) {
  var target = String(label || "")
    .toLowerCase()
    .trim();

  for (var i = 0; i < headerValues.length; i++) {
    if (
      String(headerValues[i] || "")
        .toLowerCase()
        .trim() === target
    ) {
      return i;
    }
  }
  return -1;
}

/**
 * Normalize mentee IDs so Sheets number/text quirks still match.
 * Trims, stringifies, and strips a trailing ".0" from numeric cells.
 */
function normalizeMenteeId_(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  var id = String(value).trim();

  // Sheets often stores numeric IDs as 12345.0
  if (/^\d+\.0$/.test(id)) {
    id = id.replace(/\.0$/, "");
  }

  return id;
}

/**
 * Optional menu for running from the spreadsheet UI.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Mentee QA")
    .addItem(
      "Find enrolled but unmapped mentees",
      "findUnmappedEnrolledMentees"
    )
    .addToUi();
}
