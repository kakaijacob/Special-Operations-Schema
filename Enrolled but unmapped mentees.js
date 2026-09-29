/**
 * Enrolled but unmapped mentees
 *
 * Pipeline:
 *   1) Pull EmONC curriculum submissions from KoBo and write ALL rows into one
 *      Enrollment sheet (not split across month-year tabs).
 *   2) Pull the mentee database into a local Mapping sheet.
 *   3) List Enrollment rows whose Mentee ID is missing from Mapping on
 *      Lost & Found.
 *
 * Run findUnmappedEnrolledMentees() (or use the Mentee QA menu).
 */

var ENROLLMENT_SHEET_NAME = "Enrollment";
var MAPPING_SHEET_NAME = "Mapping";
var LOST_AND_FOUND_SHEET_NAME = "Lost & Found";

var ENROLLMENT_MENTEE_ID_HEADER = "Mentee ID";
var MAPPING_MENTEE_ID_HEADER = "Mentee ID";

/** Mentee database spreadsheet (source for Mapping). */
var MENTEE_DATABASE_SPREADSHEET_ID =
  "1W6YzsLt8BKIWkZvCT-Ggvs3CtA2GBnW7ggSfujlJypA";

/** Preferred sheet names inside the mentee database workbook. */
var MENTEE_DATABASE_SHEET_CANDIDATES = ["Mentees", "Mapping", "Mentee Database"];

var KOBO_API_TOKEN = "1faf1291cb5e472b7f5a253f3888380d28e7900b";
var KOBO_FORM_UID = "aJaBJKDs7pCRMi8zm3BXze";
var KOBO_START_DATE = "2026-04-01T00:00:00";

var ENROLLMENT_HEADERS = [
  "Submission ID",
  "Submission Date",
  "Session Date",
  "Mentor Name",
  "County",
  "Facility Code",
  "Facility",
  "Mentee ID",
  "Mentee Name",
  "Activity",
  "Topic",
  "Month-Year"
];

/**
 * Main entry: KoBo → Enrollment (one sheet) → Mapping from mentee DB → Lost & Found.
 */
function findUnmappedEnrolledMentees() {
  Logger.log("Starting findUnmappedEnrolledMentees...");

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var enrollmentRows = fetchKoboEnrollmentRows_();
  writeEnrollmentSheet_(ss, enrollmentRows);
  pullMappingFromMenteeDatabase_(ss);
  var lostCount = buildLostAndFound_(ss);

  ss.toast(
    lostCount + " unmapped Enrollment row(s) → " + LOST_AND_FOUND_SHEET_NAME,
    "Enrolled but unmapped mentees",
    8
  );

  return lostCount;
}

/**
 * Fetch + transform KoBo curriculum rows (same logic as fetchKoboData_All),
 * returning row arrays. Does not write sheets.
 */
function fetchKoboEnrollmentRows_() {
  var queryObj = {
    _submission_time: { $gte: KOBO_START_DATE }
  };
  var query = JSON.stringify(queryObj);

  var url =
    "https://kc.humanitarianresponse.info/api/v2/assets/" +
    KOBO_FORM_UID +
    "/data/?format=json&query=" +
    encodeURIComponent(query) +
    "&ordering=-_submission_time&limit=100";

  var options = {
    method: "get",
    headers: { Authorization: "Token " + KOBO_API_TOKEN },
    contentType: "application/json",
    muteHttpExceptions: true
  };

  var allResults = [];

  while (url) {
    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();
    if (code < 200 || code >= 300) {
      throw new Error(
        "KoBo fetch failed (" + code + "): " + response.getContentText()
      );
    }

    var json = JSON.parse(response.getContentText());
    if (json.results && json.results.length > 0) {
      allResults = allResults.concat(json.results);
    }
    url = json.next || null;
    Logger.log("Fetched " + allResults.length + " KoBo records so far...");
  }

  if (allResults.length === 0) {
    Logger.log("No data found in KoBo.");
    return [];
  }

  var tz = Session.getScriptTimeZone();

  var toTitleCase = function (str) {
    return String(str || "")
      .toLowerCase()
      .split(" ")
      .map(function (w) {
        return w ? w.charAt(0).toUpperCase() + w.slice(1) : "";
      })
      .join(" ");
  };

  var formatDateTime = function (iso) {
    return iso
      ? Utilities.formatDate(new Date(iso), tz, "dd/MM/yyyy HH:mm")
      : "";
  };

  var formatDate = function (iso) {
    return iso
      ? Utilities.formatDate(new Date(iso), tz, "dd/MM/yyyy")
      : "";
  };

  var getMonthSheetName = function (iso) {
    return iso
      ? Utilities.formatDate(new Date(iso), tz, "MMMM-yyyy")
      : "";
  };

  var getSubmissionId = function (r) {
    return r._uuid || r._id;
  };

  var topicExactMap = {
    Partograph_use_and_interpretation: "Labor Monitoring",
    Maternal_Shock_Resuscitaion: "Maternal Shock",
    Preeclampsia_Eclampsia_Management: "Preeclampsia/Eclampsia Management",
    "Preeclampsia_/_eclampsia": "Preeclampsia/Eclampsia Management",
    Hypertension_in_pregnancy: "Preeclampsia/Eclampsia Management",
    PPH: "Postpartum Haemorrhage (PPH)",
    Vaginal_AVD: "Vacuum-Assisted Delivery",
    Vacuum_Assisted_Delivery: "Vacuum-Assisted Delivery",
    "B-lynch_suture": "B-Lynch Suture",
    Compression_of_Abdominal_Aorta: "Abdominal Aortic Compression",
    Perineal_tear_repair: "Perineal Tear Repair",
    Ubt_placement: "UBT Placement",
    UBT: "UBT Placement",
    "ubt_placement_(free_flow)": "UBT Placement (Free Flow)",
    "Ubt_placement_(free_flow))": "UBT Placement (Free Flow)"
  };

  var topicAfterSpaceMap = {
    "Postpartum haemorrhage (PPH)": "Postpartum Haemorrhage (PPH)",
    "Newborn resuscitation": "Neonatal Resuscitation",
    "Postpartum Hemorrhage (PPH)": "Postpartum Haemorrhage (PPH)",
    "PPH Drill": "Postpartum Haemorrhage (PPH)",
    "Preeclampsia / Eclampsia": "Preeclampsia/Eclampsia Management"
  };

  var formatTopic = function (raw) {
    if (!raw) return "";
    if (Object.prototype.hasOwnProperty.call(topicExactMap, raw)) {
      return topicExactMap[raw];
    }
    var spaced = String(raw).replace(/_/g, " ");
    if (Object.prototype.hasOwnProperty.call(topicAfterSpaceMap, spaced)) {
      return topicAfterSpaceMap[spaced];
    }
    return spaced;
  };

  // Discover facility / mentee fields from whatever appears under these groups
  // in the fetched KoBo data (no hardcoded facility/mentee choice lists).
  var facilityFields = collectKeysUnderGroups_(
    allResults,
    ["demographic_information/facility_details/"],
    function (key) {
      return !/\/county$/.test(key);
    }
  );
  // Facility selects can also appear under mentee_details in some form versions.
  facilityFields = facilityFields.concat(
    collectKeysUnderGroups_(
      allResults,
      ["demographic_information/mentee_details/"],
      function (key) {
        return /facilities/.test(key);
      }
    )
  );

  var menteeFields = collectKeysUnderGroups_(
    allResults,
    [
      "demographic_information/mentee_details/",
      "demographic_information/mentee_details_001/"
    ],
    function (key) {
      if (/\/county$/.test(key)) return false;
      if (/facilities/.test(key)) return false;
      return true;
    }
  );

  Logger.log(
    "Discovered " +
      facilityFields.length +
      " facility field(s) and " +
      menteeFields.length +
      " mentee field(s) from KoBo groups."
  );
  var activityTopicFields = {
    cmes: "emonc_training_curriculum/group_cmes/cmes",
    videos: "emonc_training_curriculum/group_videos/videos",
    case_scenarios:
      "emonc_training_curriculum/group_case_scenarios/case_scenarios",
    skill_demos_mentor:
      "emonc_training_curriculum/group_mentor_demo/mentor_skills_demo",
    skills_demos_mentee:
      "emonc_training_curriculum/group_return_demo/mentee_skills_return_demo",
    drills: "emonc_training_curriculum/group_drills/drills"
  };

  var rows = [];
  var seenOutputKeys = {};

  allResults.forEach(function (r) {
    var submissionId = getSubmissionId(r);
    var submissionTime = r._submission_time;
    var monthYear = getMonthSheetName(submissionTime);
    var submissionDate = formatDateTime(submissionTime);
    var sessionDate = formatDate(
      r["demographic_information/mentor_details/session_date"]
    );
    var mentorName = toTitleCase(
      String(
        r["demographic_information/mentor_details/mentor_name"] || ""
      ).replace(/_/g, " ")
    );
    var county =
      r["demographic_information/facility_details/county"] ||
      r["demographic_information/mentee_details/county"] ||
      "";

    var facilityCode = "";
    var facilityName = "";
    facilityFields.forEach(function (f) {
      if (r[f]) {
        var parts = String(r[f]).split("_");
        facilityCode = parts[0];
        facilityName = toTitleCase(
          parts.slice(1).join(" ").replace(/_/g, " ")
        );
      }
    });

    var mentees = [];
    var seenMenteeIds = {};
    menteeFields.forEach(function (f) {
      if (!r[f]) return;
      String(r[f])
        .split(" ")
        .forEach(function (m) {
          if (!m) return;
          var mParts = m.split("_");
          var menteeId = mParts[0];
          if (!menteeId || seenMenteeIds[menteeId]) return;
          seenMenteeIds[menteeId] = true;
          mentees.push({
            id: menteeId,
            name: toTitleCase(
              mParts.slice(1).join(" ").replace(/_/g, " ")
            )
          });
        });
    });

    var activities = [];
    var activitySeen = {};
    String(
      r[
        "emonc_training_curriculum/emonc_curriculum_activities/emonc_activities"
      ] || ""
    )
      .split(" ")
      .filter(Boolean)
      .forEach(function (a) {
        if (!activitySeen[a]) {
          activitySeen[a] = true;
          activities.push(a);
        }
      });

    var activityTopicPairs = [];
    var seenActivityTopicPairs = {};

    activities.forEach(function (a) {
      var topicField = activityTopicFields[a];
      if (!topicField || !r[topicField]) return;
      var activityLabel = toTitleCase(a.replace(/_/g, " "));
      String(r[topicField])
        .split(" ")
        .filter(Boolean)
        .forEach(function (topic) {
          var formattedTopic = formatTopic(topic);
          var pairKey = a + "|" + formattedTopic;
          if (seenActivityTopicPairs[pairKey]) return;
          seenActivityTopicPairs[pairKey] = true;
          activityTopicPairs.push({
            activity: activityLabel,
            topic: formattedTopic
          });
        });
    });

    mentees.forEach(function (m) {
      activityTopicPairs.forEach(function (pair) {
        var outputKey = [
          submissionId,
          m.id,
          pair.activity,
          pair.topic
        ].join("|");
        if (seenOutputKeys[outputKey]) return;
        seenOutputKeys[outputKey] = true;

        rows.push([
          submissionId,
          submissionDate,
          sessionDate,
          mentorName,
          county,
          facilityCode,
          facilityName,
          m.id,
          m.name,
          pair.activity,
          pair.topic,
          monthYear
        ]);
      });
    });
  });

  Logger.log("Transformed " + rows.length + " Enrollment row(s) from KoBo.");
  return rows;
}

/**
 * Write all KoBo rows into one Enrollment sheet (full refresh).
 */
function writeEnrollmentSheet_(ss, rows) {
  var sheet = ss.getSheetByName(ENROLLMENT_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(ENROLLMENT_SHEET_NAME);
    Logger.log("Created sheet: " + ENROLLMENT_SHEET_NAME);
  } else {
    sheet.clear();
    Logger.log("Cleared existing sheet: " + ENROLLMENT_SHEET_NAME);
  }

  sheet
    .getRange(1, 1, 1, ENROLLMENT_HEADERS.length)
    .setValues([ENROLLMENT_HEADERS])
    .setFontWeight("bold");
  sheet.setFrozenRows(1);

  if (rows.length > 0) {
    sheet
      .getRange(2, 1, rows.length, ENROLLMENT_HEADERS.length)
      .setValues(rows);
  }

  Logger.log(
    "Wrote " + rows.length + " row(s) to " + ENROLLMENT_SHEET_NAME + "."
  );
}

/**
 * Copy mentee database rows into the local Mapping sheet.
 */
function pullMappingFromMenteeDatabase_(ss) {
  Logger.log(
    "Opening mentee database: " + MENTEE_DATABASE_SPREADSHEET_ID
  );

  var sourceSs = SpreadsheetApp.openById(MENTEE_DATABASE_SPREADSHEET_ID);
  var sourceSheet = null;
  var i;

  for (i = 0; i < MENTEE_DATABASE_SHEET_CANDIDATES.length; i++) {
    sourceSheet = sourceSs.getSheetByName(MENTEE_DATABASE_SHEET_CANDIDATES[i]);
    if (sourceSheet) {
      Logger.log(
        "Using mentee database sheet: " + MENTEE_DATABASE_SHEET_CANDIDATES[i]
      );
      break;
    }
  }

  if (!sourceSheet) {
    sourceSheet = sourceSs.getSheets()[0];
    Logger.log(
      "No named mentee sheet found; using first sheet: " +
        sourceSheet.getName()
    );
  }

  var lastRow = sourceSheet.getLastRow();
  var lastCol = sourceSheet.getLastColumn();
  if (lastRow < 1 || lastCol < 1) {
    throw new Error("Mentee database sheet is empty.");
  }

  var values = sourceSheet.getRange(1, 1, lastRow, lastCol).getValues();

  var mappingSheet = ss.getSheetByName(MAPPING_SHEET_NAME);
  if (!mappingSheet) {
    mappingSheet = ss.insertSheet(MAPPING_SHEET_NAME);
    Logger.log("Created sheet: " + MAPPING_SHEET_NAME);
  } else {
    // clear() removes contents, formatting, AND data-validation rules.
    mappingSheet.clear();
    Logger.log("Cleared existing sheet (incl. validations): " + MAPPING_SHEET_NAME);
  }

  // Extra safety: strip validations on the write range before setValues.
  var destRange = mappingSheet.getRange(1, 1, values.length, values[0].length);
  destRange.clearDataValidations();
  destRange.setValues(values);
  mappingSheet.getRange(1, 1, 1, values[0].length).setFontWeight("bold");
  mappingSheet.setFrozenRows(1);

  Logger.log(
    "Pulled " +
      values.length +
      " row(s) (incl. header) from mentee database → " +
      MAPPING_SHEET_NAME
  );
}

/**
 * Compare Enrollment Mentee ID vs Mapping Mentee ID; write misses to Lost & Found.
 */
function buildLostAndFound_(ss) {
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
      "Enrollment sheet must include a '" +
        ENROLLMENT_MENTEE_ID_HEADER +
        "' column."
    );
  }
  if (mappingMenteeIdIdx === -1) {
    throw new Error(
      "Mapping sheet must include a '" + MAPPING_MENTEE_ID_HEADER + "' column."
    );
  }

  var mappedIds = {};
  var m;
  for (m = 1; m < mappingValues.length; m++) {
    var mappedId = normalizeMenteeId_(mappingValues[m][mappingMenteeIdIdx]);
    if (mappedId) {
      mappedIds[mappedId] = true;
    }
  }

  Logger.log("Mapped mentee IDs loaded: " + Object.keys(mappedIds).length);

  var lostRows = [];
  var blankMenteeIdCount = 0;
  var checkedCount = 0;
  var e;

  for (e = 1; e < enrollmentValues.length; e++) {
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
      " Enrollment row(s); " +
      blankMenteeIdCount +
      " blank mentee_id skipped; " +
      lostRows.length +
      " unmapped → '" +
      LOST_AND_FOUND_SHEET_NAME +
      "'."
  );

  return lostRows.length;
}

function writeLostAndFound_(ss, headers, rows) {
  var sheet = ss.getSheetByName(LOST_AND_FOUND_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(LOST_AND_FOUND_SHEET_NAME);
    Logger.log("Created sheet: " + LOST_AND_FOUND_SHEET_NAME);
  } else {
    sheet.clear();
    Logger.log("Cleared existing sheet: " + LOST_AND_FOUND_SHEET_NAME);
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  sheet.setFrozenRows(1);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

function findHeaderIndex_(headerValues, label) {
  var target = String(label || "")
    .toLowerCase()
    .trim();
  var i;
  for (i = 0; i < headerValues.length; i++) {
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
 * Collect unique KoBo field paths that sit under any of the given group prefixes
 * and pass the optional predicate. Scans keys present on the fetched records.
 */
function collectKeysUnderGroups_(results, prefixes, predicate) {
  var found = {};
  var i;
  var r;
  var keys;
  var k;
  var p;

  for (i = 0; i < results.length; i++) {
    r = results[i];
    keys = Object.keys(r);
    for (k = 0; k < keys.length; k++) {
      var key = keys[k];
      for (p = 0; p < prefixes.length; p++) {
        if (key.indexOf(prefixes[p]) === 0) {
          if (!predicate || predicate(key)) {
            found[key] = true;
          }
          break;
        }
      }
    }
  }

  return Object.keys(found);
}

function normalizeMenteeId_(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  var id = String(value).trim();
  if (/^\d+\.0$/.test(id)) {
    id = id.replace(/\.0$/, "");
  }
  return id;
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Mentee QA")
    .addItem(
      "Find enrolled but unmapped mentees",
      "findUnmappedEnrolledMentees"
    )
    .addToUi();
}
