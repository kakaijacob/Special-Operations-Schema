function fetchKoboData_Generic() {

  // ================= CONFIG =================
  const apiToken = getKoboApiToken_();
  const formUid = getKoboAssetUidSecret_('KOBO_ASSET_UID_PO_EMONC_KA');
  const startDate = "2026-01-01T00:00:00";

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = 'PO EmONC Knowledge Assessment';
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  // ================= SCORE FIELDS =================
  const scoreFields = [
    "aortic_compression_effectiveness",
    "aph_fetal_complication",
    "augmentation_contraindication",
    "blynch_mechanism",
    "breech_delivery_mode_rationale",
    "breech_head_entrapment",
    "collapse_first_priority",
    "cord_prolapse_sign",
    "dystocia_prevention",
    "eclampsia_immediate_action",
    "emotive_next_step",
    "footling_cord_prolapse",
    "gaskin_biomechanics",
    "gasping_newborn_management",
    "gestational_hypertension",
    "group_mentorship",
    "hellp_syndrome_diagnosis",
    "hemorrhagic_shock_complication",
    "jaw_thrust_airway",
    "labor_progress_issue",
    "labour_fluid_management",
    "late_deceleration_management",
    "lateral_tilt_reason",
    "lcg_critical_thinking",
    "lcg_labor_delay",
    "lcg_mobility_documentation",
    "lcg_philosophy",
    "magnesium_toxicity_sign",
    "meconium_active_baby",
    "mentorship_communication",
    "msv_finger_placement",
    "nasg_rule_twenty",
    "neonatal_compression_depth",
    "occiput_posterior",
    "oneonone_mentorship",
    "perineal_tear_degree",
    "placenta_delivery_step",
    "placenta_previa_type",
    "postpartum_concerning_finding",
    "pph_cause",
    "pph_fluid_management",
    "preeclampsia_prevention_intervention",
    "pregnancy_airway_challenge",
    "previa_management",
    "septic_shock_progression_sign",
    "shoulder_dystocia_fetal_complication",
    "uterotonic_contra_asthma",
    "vacuum_delivery_indication",
    "vacuum_traction_timing",
    "variable_decel_cause"
  ];

  // ================= QUERY =================
  const queryObj = {
    "_submission_time": { "$gte": startDate }
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

  // ================= HELPERS =================
  function formatTitleCase(str) {
    return (str || "")
      .toString()
      .split(" ")
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  function formatDateTime(value) {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d)) return value;
    return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  }

  function computeCorrectScore(obj) {
    let count = 0;

    scoreFields.forEach(f => {
      if ((obj[f] || "").toString().trim().toLowerCase() === "correct") {
        count++;
      }
    });

    return parseFloat((count / 50).toFixed(3));
  }

  // ================= EXCLUDED FIELDS =================
  const excludedFields = new Set([
    "formhub/uuid",
    "formhub.uuid",
    "__version__",
    "_attachments",
    "_geolocation",
    "_id",
    "_notes",
    "_status",
    "_submitted_by",
    "_tags",
    "_xform_id_string",
    "meta/instanceID",
    "meta/rootUuid"
  ]);

  // ================= FLATTEN + TRANSFORM =================
  const flatData = [];
  const headersSet = new Set(["_uuid"]);

  function flatten(obj, prefix = "", target = {}) {

    for (let key in obj) {
      let value = obj[key];
      let newKey = prefix ? `${prefix}.${key}` : key;

      if (excludedFields.has(newKey)) continue;

      if (newKey === "start") {
        target["date_started"] = formatDateTime(value);
        headersSet.add("date_started");
        continue;
      }

      if (newKey === "end") {
        target["date_ended"] = formatDateTime(value);
        headersSet.add("date_ended");
        continue;
      }

      if (newKey === "_submission_time") {
        target["date_submitted"] = formatDateTime(value);
        headersSet.add("date_submitted");
        continue;
      }

      if (newKey === "officer_details/po_details" && value) {
        const parts = value.toString().split("_");
        const po_id = parts[0] || "";
        const po_name = parts.slice(1).join(" ").replace(/_/g, " ");

        target["po_id"] = po_id;
        target["po_name"] = formatTitleCase(po_name);

        headersSet.add("po_id");
        headersSet.add("po_name");
        continue;
      }

      if (newKey.startsWith("po_competency_assessment/")) {
        newKey = newKey.replace("po_competency_assessment/", "");
      }

      if (value && typeof value === "object" && !Array.isArray(value)) {
        flatten(value, newKey, target);
      } else {
        target[newKey] = Array.isArray(value) ? value.join(" ") : value;
        headersSet.add(newKey);
      }
    }

    return target;
  }

  // ================= PROCESS RECORDS =================
  allResults.forEach(r => {
    if (existingIds.has(r._uuid)) return;

    const flat = flatten(r);

    flat["score"] = computeCorrectScore(flat);

    // NEW: outcome logic
    flat["outcome"] = flat["score"] >= 0.90 ? "Pass" : "Fail";

    flatData.push(flat);
  });

  if (flatData.length === 0) {
    Logger.log("No new records.");
    return;
  }

  // ================= BUILD HEADERS =================
  let headers = Array.from(headersSet);

  headers = headers.filter(h => h !== "score" && h !== "outcome");

  const baseOrder = [
    "_uuid",
    "date_started",
    "date_ended",
    "date_submitted",
    "po_id",
    "po_name"
  ];

  let ordered = baseOrder.filter(h => headers.includes(h));

  let rest = headers
    .filter(h => !baseOrder.includes(h))
    .sort((a, b) => a.localeCompare(b));

  headers = [...ordered, ...rest, "score", "outcome"];

  // ================= WRITE HEADERS =================
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  // ================= WRITE ROWS =================
  const rows = flatData.map(obj =>
    headers.map(h => obj[h] || "")
  );

  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length)
    .setValues(rows);

  Logger.log(`Inserted ${rows.length} new records.`);
}
