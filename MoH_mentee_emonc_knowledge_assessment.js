function fetchKoboData_Generic() {

  // ================= CONFIG =================
  const apiToken = getKoboApiToken_();
  const formUid = getKoboAssetUidSecret_('KOBO_ASSET_UID_EMONC_KA');
  const startDate = "2026-01-01T00:00:00";

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheetName = 'MoH EmONC Knowledge Assessment';
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  // ================= QUERY =================
  const queryObj = {
    "_submission_time": { "$gte": startDate }
  };

  let url =
    `https://kc.humanitarianresponse.info/api/v2/assets/${formUid}/data/` +
    `?format=json&query=${encodeURIComponent(JSON.stringify(queryObj))}` +
    `&ordering=-_submission_time&limit=1000`;

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
    existing.forEach(r => r[0] && existingIds.add(r[0]));
  }

  // ================= FACILITY COLUMNS (CLEANED) =================
  const facilityColumns = [
    "mentors_facilities/q_facility_mombasa",
    "mentors_facilities/q_facility_bungoma",
    "mentors_facilities/q_facility_kiambu",
    "mentors_facilities/q_facility_makueni",
    "mentors_facilities/q_facility_nairobi",
    "mentors_facilities/q_facility_machakos",
    "mentors_facilities/q_facility_busia",
    "mentors_facilities/q_facility_kakamega",
    "mentors_facilities/q_facility_kitui",
    "mentors_facilities/q_facility_siaya",
    "mentors_facilities/q_facility_kilifi",
    "mentors_facilities/q_facility_kirinyaga",
    "mentors_facilities/q_facility_kisii",
    "mentors_facilities/q_facility_meru",
    "mentors_facilities/q_facility_narok",
    "mentors_facilities/q_facility_nyeri",
    "mentors_facilities/q_facility_kajiado",
    "mentors_facilities/q_facility_nakuru",
    "mentors_facilities/q_facility_muranga",

    "mentors_facilities/busia_facilities",
    "mentors_facilities/kakamega_facilities",
    "mentors_facilities/kiambu_facilities",
    "mentors_facilities/kilifi_facilities",
    "mentors_facilities/kisii_facilities",
    "mentors_facilities/kirinyaga_facilities",
    "mentors_facilities/machakos_facilities",
    "mentors_facilities/makueni_facilities",
    "mentors_facilities/meru_facilities",
    "mentors_facilities/mombasa_facilities",
    "mentors_facilities/muranga_facilities",
    "mentors_facilities/nairobi_facilities",
    "mentors_facilities/nakuru_facilities",
    "mentors_facilities/siaya_facilities"
  ];

  // ================= CLINICAL COLUMNS =================
  const clinicalColumns = allResults[0]
    ? Object.keys(allResults[0]).filter(k =>
        k.startsWith("introduction_001/")
      )
    : [];

  const clinicalHeaders = clinicalColumns.map(col => {
    const name = col.replace("introduction_001/", "").replace(/_/g, " ");
    return capitalizeWords(name);
  });

  // ================= HEADERS =================
  const headers = [
    "_uuid",
    "Evaluation Date",
    "Mentee Name",
    "Mentee ID",
    "County",
    "Facility Code",
    "Facility",
    ...clinicalHeaders,
    "Score"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  // ================= HELPERS =================
  function formatDateKobo(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${("0"+d.getDate()).slice(-2)}/${("0"+(d.getMonth()+1)).slice(-2)}/${d.getFullYear()}`;
  }

  function capitalizeWords(str) {
    return String(str || "").replace(
      /\w\S*/g,
      w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    );
  }

  // ================= BUILD ROWS =================
  const rows = [];

  allResults.reverse().forEach(sub => {

    if (existingIds.has(sub._uuid)) return;

    const evaluationDate = formatDateKobo(sub.end || sub._submission_time);

    const menteeName = capitalizeWords(
      `${sub["mentors_facilities/first_name"] || ""} ${sub["mentors_facilities/last_name"] || ""}`.trim()
    );

    const menteeId = sub["mentors_facilities/mentee_id"] || "";

    // ✅ FIXED: sentence case county
    const county = capitalizeWords(sub["mentors_facilities/county"] || "");

    const rawFacility =
      facilityColumns.map(f => sub[f]).find(v => v && String(v).trim()) || "";

    let facilityCode = "";
    let facilityName = "";

    if (rawFacility) {
      const idx = rawFacility.indexOf("_");

      if (idx !== -1) {
        facilityCode = rawFacility.slice(0, idx);
        facilityName = capitalizeWords(
          rawFacility.slice(idx + 1).replace(/_/g, " ")
        );
      } else {
        facilityName = capitalizeWords(rawFacility.replace(/_/g, " "));
      }
    }

    const clinicalData = clinicalColumns.map(c => sub[c] || "");

    const correctCount = clinicalData.filter(v =>
      String(v).toLowerCase().includes("correct")
    ).length;

    const score = clinicalColumns.length
      ? (correctCount / clinicalColumns.length).toFixed(2)
      : "";

    rows.push([
      sub._uuid,
      evaluationDate,
      menteeName,
      menteeId,
      county,
      facilityCode,
      facilityName,
      ...clinicalData,
      score
    ]);

  });

  // ================= WRITE DATA =================
  if (rows.length > 0) {
    sheet.getRange(
      sheet.getLastRow() + 1,
      1,
      rows.length,
      headers.length
    ).setValues(rows);

    Logger.log(`Inserted ${rows.length} new records.`);
  } else {
    Logger.log("No new records.");
  }
}
