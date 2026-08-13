function fetchKoboData_Generic() {

  // ================= CONFIG =================
  const apiToken = getKoboApiToken_();
  const formUid = getKoboAssetUidSecret_('KOBO_ASSET_UID_MOH_SAC');
  const startDate = "2026-05-25T00:00:00";

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheetName = 'NNR Assessment';
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  // ================= QUERY =================
  const queryObj = {
    "_submission_time": {
      "$gte": startDate
    },
    "group_mentorship_details/mentor_details/program": "tot"
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

    const existing = sheet
      .getRange(2, 1, lastRow - 1, 1)
      .getValues();

    existing.forEach(r => existingIds.add(r[0]));

  }

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

  function toTitleCase(str) {

    if (!str) return "";

    return str
      .toString()
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());

  }

  // ================= HEADERS =================
  const headers = [
    "_uuid",
    "date_started",
    "date_ended",
    "date_submitted",
    "session_date",
    "mentor_name",
    "assessment_type",
    "county",
    "facility_code",
    "facility",
    "mentee_name",
    "mentor_id",
    "skill_evaluation",

    "review_anc_history",
    "check_safety",
    "check_equipment_warmth",
    "check_airway",
    "check_breathing",
    "check_circulation",
    "essential_newborn_care",
    "check_apgar_timing",
    "dry_stimulate",
    "wet_dry_cloth",
    "immediate_nb_management",
    "initial_abc_assessment",
    "abc_assessment",
    "shout_help_nnr",
    "begin_bvm",
    "assess_pulse",
    "continue_bvm",
    "reassess_abc",
    "vetilations",
    "reassess_abc_2",
    "post_resus_stablization",
    "continue_observation",
    "documentation_nnr",

    "score"
  ];

  // ================= FLATTEN FUNCTION =================
  function flatten(obj, prefix = "") {

    let result = {};

    for (let key in obj) {

      const value = obj[key];

      // USING / INSTEAD OF .
      const newKey = prefix ? `${prefix}/${key}` : key;

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

  // ================= PROCESS DATA =================
  const rows = [];

  allResults.forEach(r => {

    if (existingIds.has(r._uuid)) return;

    const flat = flatten(r);

    // ================= FACILITY =================
    const facilityRaw =
      flat["group_mentorship_details/mentee_details/muranga_facilities"] || "";

    let facility_code = "";
    let facility = "";

    if (facilityRaw) {

      const parts = facilityRaw.split("_");

      facility_code = parts[0] || "";

      facility = toTitleCase(
        parts.slice(1).join(" ")
      );

    }

    // ================= SCORE =================
    const rawScore =
      Number(flat["skills_assessment/group_nnr/nnr_score"]) || 0;

    const score = rawScore / 100;

    // ================= ROW =================
    const row = {

      "_uuid": r._uuid || "",

      "date_started": formatDate(flat["start"]),
      "date_ended": formatDate(flat["end"]),
      "date_submitted": formatDate(flat["_submission_time"]),

      "session_date": formatDate(
        flat["group_mentorship_details/mentor_details/evaluation_date"]
      ),

      "mentor_name": toTitleCase(
        flat["group_mentorship_details/mentor_details/mentor_name"]
      ),

      "assessment_type":
        flat["group_mentorship_details/mentor_details/program"] || "",

      "county": toTitleCase(
        flat["group_mentorship_details/mentee_details/county"]
      ),

      "facility_code": facility_code,

      "facility": facility,

      "mentee_name": toTitleCase(
        flat["group_mentorship_details/mentees/ifm_name"]
      ),

      "mentor_id":
        flat["group_mentorship_details/mentees/ifm_id_2"] || "",

      "skill_evaluation":
        flat["skills_assessment/group_skills_checklist/skill_evaluation"] || "",

      "review_anc_history":
        flat["skills_assessment/group_nnr/review_anc_history"] || "",

      "check_safety":
        flat["skills_assessment/group_nnr/check_safety"] || "",

      "check_equipment_warmth":
        flat["skills_assessment/group_nnr/check_equipment_warmth"] || "",

      "check_airway":
        flat["skills_assessment/group_nnr/check_airway"] || "",

      "check_breathing":
        flat["skills_assessment/group_nnr/check_breathing"] || "",

      "check_circulation":
        flat["skills_assessment/group_nnr/check_circulation"] || "",

      "essential_newborn_care":
        flat["skills_assessment/group_nnr/essential_newborn_care"] || "",

      "check_apgar_timing":
        flat["skills_assessment/group_nnr/check_apgar_timing"] || "",

      "dry_stimulate":
        flat["skills_assessment/group_nnr/dry_stimulate"] || "",

      "wet_dry_cloth":
        flat["skills_assessment/group_nnr/wet_dry_cloth"] || "",

      "immediate_nb_management":
        flat["skills_assessment/group_nnr/immediate_nb_management"] || "",

      "initial_abc_assessment":
        flat["skills_assessment/group_nnr/initial_abc_assessment"] || "",

      "abc_assessment":
        flat["skills_assessment/group_nnr/abc_assessment"] || "",

      "shout_help_nnr":
        flat["skills_assessment/group_nnr/shout_help_nnr"] || "",

      "begin_bvm":
        flat["skills_assessment/group_nnr/begin_bvm"] || "",

      "assess_pulse":
        flat["skills_assessment/group_nnr/assess_pulse"] || "",

      "continue_bvm":
        flat["skills_assessment/group_nnr/continue_bvm"] || "",

      "reassess_abc":
        flat["skills_assessment/group_nnr/reassess_abc"] || "",

      "vetilations":
        flat["skills_assessment/group_nnr/vetilations"] || "",

      "reassess_abc_2":
        flat["skills_assessment/group_nnr/reassess_abc_2"] || "",

      "post_resus_stablization":
        flat["skills_assessment/group_nnr/post_resus_stablization"] || "",

      "continue_observation":
        flat["skills_assessment/group_nnr/continue_observation"] || "",

      "documentation_nnr":
        flat["skills_assessment/group_nnr/documentation_nnr"] || "",

      "score": score

    };

    rows.push(
      headers.map(h => row[h] ?? "")
    );

  });

  if (rows.length === 0) {
    Logger.log("No new records.");
    return;
  }

  // ================= WRITE HEADERS =================
  if (sheet.getLastRow() === 0) {

    sheet
      .getRange(1, 1, 1, headers.length)
      .setValues([headers]);

  }

  // ================= WRITE DATA =================
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
