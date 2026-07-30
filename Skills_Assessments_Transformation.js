function fetchKoboData_Generic() {

  // ================= CONFIG =================
  const apiToken = '1faf1291cb5e472b7f5a253f3888380d28e7900b';
  const formUid = 'aR4bTSJFw3Tnev6o77S3Sg';
  const startDate = "2026-04-01T00:00:00"; // optional incremental window

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ================= OUTPUT SHEET =================
  const sheetName = 'Skills Assessment Data';
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  // ================= QUERY =================
  const queryObj = {
    "_submission_time": {
      "$gte": startDate
    },
    "group_mentorship_details/mentor_details/program": "newborn_curriculum",
    "group_mentorship_details/mentee_details/county": {
      "$in": ["Muranga", "Mombasa", "Kakamega"]
    },
    "skills_assessment/group_skills_checklist/skill_evaluation": "Newborn_resuscitation"
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

  // ================= HELPERS =================
  function formatDateTime(value) {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return Utilities.formatDate(
      d,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd HH:mm"
    );
  }

  function formatDateOnly(value) {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      // Already a YYYY-MM-DD (or similar) string from Kobo
      const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
      return match ? match[1] : value;
    }
    return Utilities.formatDate(
      d,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd"
    );
  }

  function toTitleCase(str) {
    if (!str) return "";
    return str
      .toString()
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  }

  function splitFacility(raw) {
    if (!raw) return { facility_code: "", facility: "" };
    const value = raw.toString().trim();
    const idx = value.indexOf("_");
    if (idx === -1) {
      return { facility_code: value, facility: "" };
    }
    // e.g. 1234_ruiru_hospital -> facility_code "1234_", facility "Ruiru Hospital"
    return {
      facility_code: value.substring(0, idx + 1),
      facility: toTitleCase(value.substring(idx + 1))
    };
  }

  function splitMentee(raw) {
    if (!raw) return { mentee_id: "", mentee: "" };
    const value = raw.toString().trim();
    const idx = value.indexOf("_");
    if (idx === -1) {
      return { mentee_id: value, mentee: "" };
    }
    // e.g. 724504326_Kakai_Jacob -> mentee_id "724504326", mentee "Kakai Jacob"
    return {
      mentee_id: value.substring(0, idx).trim(),
      mentee: toTitleCase(value.substring(idx + 1))
    };
  }

  // Facility-specific mentee select fields under group_mentorship_details/mentees/
  const menteeFields = [
    "chombeli_nbc_mentees",
    "kuvasali_nbc_mentees",
    "shivanga_nbc_mentees",
    "emali_sub_nbc_mentees",
    "kalawa_nbc_mentees",
    "kambu_sub_nbc_mentees",
    "kibwezi_nbc_mentees",
    "kilungu_nbc_mentees",
    "kisau_sub_nbc_mentees",
    "makindu_nbc_mentees",
    "makueni_nbc_mentees",
    "matiliku_nbc_mentees",
    "mbooni_nbc_mentees",
    "mtito_andei_nbc_mentees",
    "mukuyuni_nbc_mentees",
    "nthongoni_nbc_mentees",
    "sultan_nbc_mentees",
    "tawa_sub_nbc_mentees",
    "tulimani_nbc_mentees",
    "coast_general_nbc_mentees",
    "likoni_nbc_mentees",
    "mbuta_health_nbc_mentees",
    "mlaleo_nbc_mentees",
    "mrima_maternity_nbc_mentees",
    "port_reitz_nbc_mentees",
    "shimo_la_nbc_mentees",
    "gaichanjiru_nbc_mentees",
    "ithanga_nbc_mentees",
    "kamahuha_nbc_mentees",
    "kandara_nbc_mentees",
    "kangema_nbc_mentees",
    "kenol_hospital_nbc_mentees",
    "kigumo_nbc_mentees",
    "kiriaini_nbc_mentees",
    "kirwara_nbc_mentees",
    "makuyu_nbc_mentees",
    "maragua_nbc_mentees",
    "muriranjas_nbc_mentees"
  ];

  function extractMentees(flat) {
    const pairs = menteeFields
      .map(f => flat[`group_mentorship_details/mentees/${f}`])
      .filter(v => v && v.toString().trim() !== "")
      .flatMap(v =>
        // select_multiple values may be space-separated
        v.toString().trim().split(/\s+/).filter(Boolean)
      )
      .map(splitMentee)
      .filter(m => m.mentee_id || m.mentee);

    return {
      mentee_id: pairs.map(m => m.mentee_id).filter(Boolean).join(", "),
      mentee: pairs.map(m => m.mentee).filter(Boolean).join(", ")
    };
  }

  // ================= OUTPUT HEADERS =================
  const headers = [
    "submission_uuid",
    "date_started",
    "date_ended",
    "date_submitted",
    "evaluation_date",
    "submission_id",
    "mentor_name",
    "program",
    "county",
    "facility_code",
    "facility",
    "mentee_id",
    "mentee",
    "score"
  ];

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

  // ================= DEDUPLICATION (submission_uuid) =================
  const existingIds = new Set();
  const lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    const existing = sheet.getRange(2, 1, lastRow, 1).getValues();
    existing.forEach(r => {
      if (r[0]) existingIds.add(String(r[0]));
    });
  }

  // ================= FLATTEN =================
  function flatten(obj, prefix = "") {
    const result = {};

    for (const key in obj) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}/${key}` : key;

      if (value && typeof value === "object" && !Array.isArray(value)) {
        Object.assign(result, flatten(value, newKey));
      } else {
        result[newKey] = Array.isArray(value) ? value.join(" ") : value;
      }
    }

    return result;
  }

  // ================= TRANSFORM (new rows only) =================
  const rows = [];

  allResults.forEach(r => {
    const uuid = r._uuid || "";
    if (!uuid || existingIds.has(String(uuid))) return;

    const flat = flatten(r);

    const facilityInfo = splitFacility(
      flat["group_mentorship_details/mentee_details/muranga_facilities"] || ""
    );
    const menteeInfo = extractMentees(flat);

    const row = {
      submission_uuid: uuid,
      date_started: formatDateTime(flat["start"] || r.start),
      date_ended: formatDateTime(flat["end"] || r.end),
      date_submitted: formatDateTime(flat["_submission_time"] || r._submission_time),
      evaluation_date: formatDateOnly(
        flat["group_mentorship_details/mentor_details/evaluation_date"]
      ),
      submission_id: flat["_id"] != null ? flat["_id"] : (r._id != null ? r._id : ""),
      mentor_name: toTitleCase(
        flat["group_mentorship_details/mentor_details/mentor_name"] || ""
      ),
      program: toTitleCase(
        flat["group_mentorship_details/mentor_details/program"] || ""
      ),
      county: flat["group_mentorship_details/mentee_details/county"] || "",
      facility_code: facilityInfo.facility_code,
      facility: facilityInfo.facility,
      mentee_id: menteeInfo.mentee_id,
      mentee: menteeInfo.mentee,
      score: flat["skills_assessment/group_nnr/nnr_score"] ?? ""
    };

    rows.push(headers.map(h => (row[h] != null ? row[h] : "")));
    existingIds.add(String(uuid));
  });

  if (rows.length === 0) {
    Logger.log("No new records.");
    return;
  }

  // ================= WRITE HEADERS =================
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  // ================= APPEND NEW ROWS =================
  sheet
    .getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length)
    .setValues(rows);

  Logger.log(`Inserted ${rows.length} new records.`);
}
