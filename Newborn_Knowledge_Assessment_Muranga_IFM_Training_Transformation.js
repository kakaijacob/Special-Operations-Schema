function fetchKoboData_Generic() {

  // ================= CONFIG =================
  const apiToken = '1faf1291cb5e472b7f5a253f3888380d28e7900b';
  const formUid = 'aFRcSLKi7wUvdrQ7js5Vbd';
  const startDate = "2026-05-25T00:00:00";

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheetName = 'Newborn Knowledge Assessment';
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  // ================= QUERY =================
  const queryObj = {
    "_submission_time": {
      "$gte": startDate
    }
  };

  let url =
    `https://kc.humanitarianresponse.info/api/v2/assets/${formUid}/data/` +
    `?format=json&query=${encodeURIComponent(JSON.stringify(queryObj))}` +
    `&ordering=-_submission_time&limit=100`;

  const options = {
    method: "get",
    headers: {
      "Authorization": "Token " + apiToken
    }
  };

  // ================= FETCH ALL DATA =================
  let allResults = [];

  while (url) {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());

    if (json.results?.length) {
      allResults = allResults.concat(json.results);
    }

    url = json.next;
  }

  if (allResults.length === 0) {
    Logger.log("No data found.");
    return;
  }

  // ================= DEDUPLICATION =================
  const existingIds = new Set();
  const lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    const existing = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    existing.forEach(r => existingIds.add(r[0]));
  }

  // ================= QUESTIONS =================
  const questionFields = [
    "initiating_breastfeeding",
    "neonatal_heatloss",
    "hyperthermia_risk_factors",
    "skin_to_skin",
    "golden_minute",
    "mask_size",
    "sga_infant",
    "weight_gain",
    "medication_seizure",
    "hypoglycemia_prevention",
    "cpap_contrandication",
    "causes_newborn_mortality",
    "neonate_transfer",
    "birth_weight",
    "handling_sharps",
    "nbu_hygiene",
    "feeding_regimen",
    "weight_monitoring",
    "cpr_ratio",
    "starting_cpr"
  ];

  // ================= HELPERS =================
  function formatDate(dateString) {
    if (!dateString) return "";

    const d = new Date(dateString);

    return Utilities.formatDate(
      d,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd HH:mm"
    );
  }

  function titleCase(str) {
    return str
      .toLowerCase()
      .split(" ")
      .map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(" ");
  }

  // ================= FLATTEN RECORDS =================
  const flatData = [];

  const headersSet = new Set([
    "_uuid",
    "date_started",
    "date_ended",
    "date_submitted",
    "evaluation",
    "mentee_id",
    "county",
    "facility_code",
    "facility",
    "score"
  ]);

  questionFields.forEach(q => headersSet.add(q));

  function flatten(obj, prefix = "") {
    let result = {};

    for (let key in obj) {

      const value = obj[key];

      const newKey = prefix
        ? `${prefix}.${key}`
        : key;

      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {

        Object.assign(result, flatten(value, newKey));

      } else {

        result[newKey] = Array.isArray(value)
          ? value.join(" ")
          : value;
      }
    }

    return result;
  }

  // ================= PROCESS RECORDS =================
  allResults.forEach(r => {

    if (existingIds.has(r._uuid)) return;

    const flat = flatten(r);

    const transformed = {};

    // ===== CORE FIELDS =====
    transformed["_uuid"] = r._uuid || "";

    transformed["date_started"] =
      formatDate(flat["start"]);

    transformed["date_ended"] =
      formatDate(flat["end"]);

    transformed["date_submitted"] =
      formatDate(flat["_submission_time"]);

    // ===== EVALUATION =====
    const submittedDate =
      formatDate(flat["_submission_time"]).split(" ")[0];

    transformed["evaluation"] =
      submittedDate === "2026-05-29"
        ? "Posttest"
        : "Pretest";

    transformed["mentee_id"] =
      flat["mentors_details/phone_confirm"] || "";

    transformed["county"] =
      titleCase(
        String(flat["mentors_details/county"] || "")
          .replace(/_/g, " ")
          .trim()
      );

    // ===== FACILITY =====
    const facilityRaw =
      flat["mentors_details/facility_mombasa"] ||
      flat["mentors_details/facility_Makueni"] ||
      flat["mentors_details/facility_muranga"] ||
      "";

    if (facilityRaw) {

      const firstUnderscore = facilityRaw.indexOf("_");

      if (firstUnderscore !== -1) {

        transformed["facility_code"] =
          facilityRaw.substring(0, firstUnderscore);

        const facilityName =
          facilityRaw.substring(firstUnderscore + 1);

        transformed["facility"] =
          titleCase(
            facilityName.replace(/_/g, " ")
          );

      } else {

        transformed["facility_code"] = "";
        transformed["facility"] = facilityRaw;
      }

    } else {

      transformed["facility_code"] = "";
      transformed["facility"] = "";
    }

    // ===== QUESTIONS =====
    let correctCount = 0;

    questionFields.forEach(q => {

      // Pull from BOTH grouped and ungrouped versions
      const value =
        flat[`newborn_assessment.${q}`] ||
        flat[`newborn_assessment/${q}`] ||
        flat[q] ||
        "";

      transformed[q] = value;

      if (
        String(value).trim().toLowerCase() === "correct"
      ) {
        correctCount++;
      }
    });

    // ===== SCORE =====
    transformed["score"] = (
      correctCount / questionFields.length
    ).toFixed(3);

    flatData.push(transformed);
  });

  if (flatData.length === 0) {
    Logger.log("No new records.");
    return;
  }

  // ================= BUILD HEADERS =================
  const preferredHeaders = [
    "_uuid",
    "date_started",
    "date_ended",
    "date_submitted",
    "evaluation",
    "mentee_id",
    "county",
    "facility_code",
    "facility",
    ...questionFields,
    "score"
  ];

  const remainingHeaders = Array.from(headersSet)
    .filter(h => !preferredHeaders.includes(h))
    .sort();

  const headers = [
    ...preferredHeaders,
    ...remainingHeaders
  ];

  // ================= WRITE HEADERS =================
  if (sheet.getLastRow() === 0) {

    sheet
      .getRange(1, 1, 1, headers.length)
      .setValues([headers]);
  }

  // ================= BUILD ROWS =================
  const rows = flatData.map(obj =>
    headers.map(h => obj[h] ?? "")
  );

  // ================= WRITE ROWS =================
  sheet
    .getRange(
      sheet.getLastRow() + 1,
      1,
      rows.length,
      headers.length
    )
    .setValues(rows);

  Logger.log(`Inserted ${rows.length} new records.`);
}
