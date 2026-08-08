/****************************
 * RAPIDPRO → GOOGLE SHEETS + Merge → MoH In-Person CMEs
 * Maternal & Newborn Curriculum
 * Replaces invalid numbers (#NUM!) with blanks
 ****************************/

const BASE_URL = "https://prompts.jacarandahealth.org/api/v2";
const API_TOKEN = "5f39306380a6dbe3cd497ce9bf8931deeaa6993a";
const RECORD_CHUNK_SIZE = 500;

// RapidPro keeps only recent runs in /runs.json and moves older ones into
// archives, so history has to be read from /archives.json. The CME module
// flows were created on 2024-03-25, hence the default start date.
const ARCHIVE_START_DATE = "2024-03-01";

// Archived runs are staged in their own sheet because exportFlow() rewrites the
// module sheets on every import. Rows are keyed by run id so the backfill can be
// resumed and re-run without duplicating anything.
const ARCHIVE_SHEET_NAME = "_archived_runs";
const ARCHIVE_SHEET_HEADERS = [
  "run_id","flow_uuid","contact_uuid","contact_name","urn",
  "created_on","modified_on","pre_score","post_score"
];

// One archive can expand to tens of megabytes, so the backfill processes as many
// as fit in this budget and records progress, letting the next run continue.
const ARCHIVE_TIME_BUDGET_MS = 4.5 * 60 * 1000;
const ARCHIVE_PROGRESS_KEY = "DELTA_ARCHIVES_COMPLETED";

// Identity Flow UUID (captures cadre, county, facility)
const IDENTITY_FLOW_UUID = "8a4765d7-b608-41b1-a459-f6628b3d0559";

// The identity flow saves these details onto the contact record instead of
// exposing them as flow results, and /runs.json only returns a contact's
// uuid/name/urn. They therefore have to be read from contact fields, which is
// also why a manual flow-results export shows them but the API did not.
// Some contacts were registered against older field keys, hence the fallbacks.
const IDENTITY_FIELD_KEYS = {
  cadre: ["cadre"],
  county: ["county"],
  facility_name: ["facility_name", "facilityname"]
};

const UNSPECIFIED = "Unspecified";

// FLOW UUID : SheetName
const FLOWS = {
  "4638aa69-0191-4ba1-a0d7-3f195ddd87a1": "PIH",
  "9b52d228-e62e-4ea6-a8ec-eb661be15013": "NNR",
  "f453595c-620f-4963-b582-6aa78d8b8c31": "Maternal Shock",
  "e0bf0deb-0f1e-47b1-ad8b-254ba4a6d4a0": "Maternal Resuscitation",
  "0980e214-ca17-4e06-9561-f5dcb3a21ffc": "AVD",
  "588a7a45-a8f6-4ec3-802f-9165896d7daa": "Shoulder Dystocia",
  "1c1d6c41-0364-4ea7-b30a-d9e44b9c221c": "Breech",
  "028c85cc-32c1-4ee3-a6b0-71b9f983751b": "PPH",
  "d5e4c0c6-b69b-4eac-ab28-abf2eec2259d": "Cord Prolapse",
  "bb21ae09-0548-4199-b6c8-b162cf4eeff0": "Partograph",
  "4e5f0f67-a25b-4720-b629-d3e51772a5f8": "AMTSL"
};

// FLOW UUID : Field mapping
const FLOW_FIELDS = {
  // PIH
  "4638aa69-0191-4ba1-a0d7-3f195ddd87a1": [
    {field:"contact_uuid", header:"Contact UUID", type:"contact", key:"uuid"},
    {field:"contact_name", header:"Mentee Name", type:"contact", key:"name"},
    {field:"urn", header:"Mentee ID", type:"contact", key:"urn"},
    {field:"cadre", header:"Cadre"},
    {field:"county", header:"County"},
    {field:"facility_name", header:"Facility"},
    {field:"created_on", header:"Date Submitted", type:"meta"},
    {field:"modified_on", header:"Date Modified", type:"meta"},
    {field:"pre_score", header:"Pretest Score"},
    {field:"post_score", header:"Posttest Score"}
  ],
  // AMTSL
  "4e5f0f67-a25b-4720-b629-d3e51772a5f8": [
    {field:"contact_uuid", header:"Contact UUID", type:"contact", key:"uuid"},
    {field:"contact_name", header:"Contact Name", type:"contact", key:"name"},
    {field:"urn", header:"URN Value", type:"contact", key:"urn"},
    {field:"cadre", header:"Cadre"},
    {field:"county", header:"County"},
    {field:"facility_name", header:"Facility"},
    {field:"created_on", header:"Started", type:"meta"},
    {field:"modified_on", header:"Modified", type:"meta"},
    {field:"pre_score", header:"Pretest Score"},
    {field:"post_score", header:"Posttest Score"}
  ],
  // Partograph
  "bb21ae09-0548-4199-b6c8-b162cf4eeff0": [
    {field:"contact_uuid", header:"Contact UUID", type:"contact", key:"uuid"},
    {field:"contact_name", header:"Contact Name", type:"contact", key:"name"},
    {field:"urn", header:"URN Value", type:"contact", key:"urn"},
    {field:"cadre", header:"Cadre"},
    {field:"county", header:"County"},
    {field:"facility_name", header:"Facility"},
    {field:"created_on", header:"Started", type:"meta"},
    {field:"modified_on", header:"Modified", type:"meta"},
    {field:"pre_score", header:"Pretest Score"},
    {field:"post_score", header:"Posttest Score"}
  ],
  // NNR
  "9b52d228-e62e-4ea6-a8ec-eb661be15013": [
    {field:"contact_uuid", header:"Contact UUID", type:"contact", key:"uuid"},
    {field:"contact_name", header:"Contact Name", type:"contact", key:"name"},
    {field:"urn", header:"URN Value", type:"contact", key:"urn"},
    {field:"cadre", header:"Cadre"},
    {field:"county", header:"County"},
    {field:"facility_name", header:"Facility"},
    {field:"created_on", header:"Started", type:"meta"},
    {field:"modified_on", header:"Modified", type:"meta"},
    {field:"pre_score", header:"Pretest Score"},
    {field:"post_score", header:"Posttest Score"}
  ],
  // AVD
  "0980e214-ca17-4e06-9561-f5dcb3a21ffc": [
    {field:"contact_uuid", header:"Contact UUID", type:"contact", key:"uuid"},
    {field:"contact_name", header:"Contact Name", type:"contact", key:"name"},
    {field:"urn", header:"URN Value", type:"contact", key:"urn"},
    {field:"cadre", header:"Cadre"},
    {field:"county", header:"County"},
    {field:"facility_name", header:"Facility"},
    {field:"created_on", header:"Started", type:"meta"},
    {field:"modified_on", header:"Modified", type:"meta"},
    {field:"pre_score", header:"Pretest Score"},
    {field:"post_score", header:"Posttest Score"}
  ],
  // Maternal Resuscitation
  "e0bf0deb-0f1e-47b1-ad8b-254ba4a6d4a0": [
    {field:"contact_uuid", header:"Contact UUID", type:"contact", key:"uuid"},
    {field:"contact_name", header:"Contact Name", type:"contact", key:"name"},
    {field:"urn", header:"URN Value", type:"contact", key:"urn"},
    {field:"cadre", header:"Cadre"},
    {field:"county", header:"County"},
    {field:"facility_name", header:"Facility"},
    {field:"created_on", header:"Started", type:"meta"},
    {field:"modified_on", header:"Modified", type:"meta"},
    {field:"pre_score", header:"Pretest Score"},
    {field:"post_score", header:"Posttest Score"}
  ],
  // Maternal Shock
  "f453595c-620f-4963-b582-6aa78d8b8c31": [
    {field:"contact_uuid", header:"Contact UUID", type:"contact", key:"uuid"},
    {field:"contact_name", header:"Contact Name", type:"contact", key:"name"},
    {field:"urn", header:"URN Value", type:"contact", key:"urn"},
    {field:"cadre", header:"Cadre"},
    {field:"county", header:"County"},
    {field:"facility_name", header:"Facility"},
    {field:"created_on", header:"Started", type:"meta"},
    {field:"modified_on", header:"Modified", type:"meta"},
    {field:"pre_score", header:"Pretest Score"},
    {field:"post_score", header:"Posttest Score"}
  ],
  // S Dystocia
  "588a7a45-a8f6-4ec3-802f-9165896d7daa": [
    {field:"contact_uuid", header:"Contact UUID", type:"contact", key:"uuid"},
    {field:"contact_name", header:"Contact Name", type:"contact", key:"name"},
    {field:"urn", header:"URN Value", type:"contact", key:"urn"},
    {field:"cadre", header:"Cadre"},
    {field:"county", header:"County"},
    {field:"facility_name", header:"Facility"},
    {field:"created_on", header:"Started", type:"meta"},
    {field:"modified_on", header:"Modified", type:"meta"},
    {field:"pre_score", header:"Pretest Score"},
    {field:"post_score", header:"Posttest Score"}
  ],
  // Breech
  "1c1d6c41-0364-4ea7-b30a-d9e44b9c221c": [
    {field:"contact_uuid", header:"Contact UUID", type:"contact", key:"uuid"},
    {field:"contact_name", header:"Contact Name", type:"contact", key:"name"},
    {field:"urn", header:"URN Value", type:"contact", key:"urn"},
    {field:"cadre", header:"Cadre"},
    {field:"county", header:"County"},
    {field:"facility_name", header:"Facility"},
    {field:"created_on", header:"Started", type:"meta"},
    {field:"modified_on", header:"Modified", type:"meta"},
    {field:"pre_score", header:"Pretest Score"},
    {field:"post_score", header:"Posttest Score"}
  ],
  // PPH
  "028c85cc-32c1-4ee3-a6b0-71b9f983751b": [
    {field:"contact_uuid", header:"Contact UUID", type:"contact", key:"uuid"},
    {field:"contact_name", header:"Contact Name", type:"contact", key:"name"},
    {field:"urn", header:"URN Value", type:"contact", key:"urn"},
    {field:"cadre", header:"Cadre"},
    {field:"county", header:"County"},
    {field:"facility_name", header:"Facility"},
    {field:"created_on", header:"Started", type:"meta"},
    {field:"modified_on", header:"Modified", type:"meta"},
    {field:"pre_score", header:"Pretest Score"},
    {field:"post_score", header:"Posttest Score"}
  ],
  // Cord Prolapse
  "d5e4c0c6-b69b-4eac-ab28-abf2eec2259d": [
    {field:"contact_uuid", header:"Contact UUID", type:"contact", key:"uuid"},
    {field:"contact_name", header:"Contact Name", type:"contact", key:"name"},
    {field:"urn", header:"URN Value", type:"contact", key:"urn"},
    {field:"cadre", header:"Cadre"},
    {field:"county", header:"County"},
    {field:"facility_name", header:"Facility"},
    {field:"created_on", header:"Started", type:"meta"},
    {field:"modified_on", header:"Modified", type:"meta"},
    {field:"pre_score", header:"Pretest Score"},
    {field:"post_score", header:"Posttest Score"}
  ]
};

/****************** MAIN RUNNER ******************/
function importRapidProAndMerge() {
  const importedSheets = [];

  Object.keys(FLOWS).forEach(uuid => {
    const sheetName = exportFlow(uuid);
    if (sheetName) importedSheets.push(sheetName);
  });

  mergeSheetsToMoH(importedSheets);
}

/**************** PROCESS ONE FLOW ****************/
function exportFlow(flowUUID) {
  const sheetName = FLOWS[flowUUID] || `Flow-${flowUUID}`;
  const sheet = getSheet(sheetName);
  sheet.clearContents();

  // No date filter is applied, but /runs.json only holds recent runs: RapidPro
  // archives older ones. Combine the live runs with any history already staged
  // by backfillArchivedRuns(), then sort oldest first.
  const liveRuns = fetchAllRapidProResults(
    `${BASE_URL}/runs.json?flow=${encodeURIComponent(flowUUID)}`
  );
  const archivedRuns = getStagedRuns(flowUUID);
  let runs = mergeRunsById(archivedRuns, liveRuns);
  runs.sort((a, b) => new Date(a.created_on) - new Date(b.created_on));

  Logger.log(`${sheetName}: ${liveRuns.length} live + ${archivedRuns.length} archived = ${runs.length} run(s)`);

  // Enrich runs with identity flow fields
  runs = enrichFlowWithIdentity(runs);

  if (runs.length === 0) return null;

  const fieldMap = FLOW_FIELDS[flowUUID] || [];
  const headers = fieldMap.map(f => f.header);

  const rows = runs.map(r => fieldMap.map(f => {
    if (f.type === "contact") {
      let v = r.contact?.[f.key] || "";
      if (f.key === "urn") v = v.replace(/^whatsapp:254/, "");
      return v;
    }
    if (f.type === "meta") {
      const date = r[f.field] || "";
      return date ? date.split("T")[0] : "";
    }
    return r.values?.[f.field]?.value || "";
  }));

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  writeRowsInChunks(sheet, 2, rows, headers.length);

  const missingIdentity = runs.filter(r =>
    r.values.cadre.value === UNSPECIFIED && r.values.county.value === UNSPECIFIED
  ).length;

  Logger.log(`✔ Imported ${rows.length} records → ${sheetName}` +
    (missingIdentity ? ` (${missingIdentity} without cadre/county on their contact record)` : ""));
  return sheetName;
}

/***************** MERGE SHEETS INTO MoH *****************/
function mergeSheetsToMoH(sheetNames) {
  if (sheetNames.length === 0) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheetName = "moH_in_person_cmes";
  let masterSheet = ss.getSheetByName(masterSheetName);

  if (!masterSheet) {
    masterSheet = ss.insertSheet(masterSheetName);
  } else {
    masterSheet.clear();
  }

  const headers = [
    "mentee_id","cadre","county","date_submitted","year","month","quarter",
    "cme_module","pretest_score","posttest_score","knowledge_change",
    "status","kpi","module_count"
  ];

  let allData = [];

  sheetNames.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return;

    const headerRow = data[0].map(h => h.toString().trim().toLowerCase());

    // Sheets use slightly different header wording per flow (e.g. PIH), so
    // accept every known spelling of the columns needed for the merge.
    const urnIdx = findHeaderIndex(headerRow, ["urn value", "mentee id", "urn"]);
    const cadreIdx = findHeaderIndex(headerRow, ["cadre"]);
    const countyIdx = findHeaderIndex(headerRow, ["county"]);
    const dateIdx = findHeaderIndex(headerRow, ["started", "date submitted"]);
    const preIdx = findHeaderIndex(headerRow, ["pretest score"]);
    const postIdx = findHeaderIndex(headerRow, ["posttest score"]);

    if ([urnIdx, cadreIdx, countyIdx, dateIdx, preIdx, postIdx].includes(-1)) {
      Logger.log(`⚠ Skipped ${sheetName}: expected columns not found`);
      return;
    }

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const mentee_id = row[urnIdx] || "";
      const cadre = row[cadreIdx] || "Unspecified";
      const county = row[countyIdx] || "Unspecified";
      const date_submitted = row[dateIdx] ? new Date(row[dateIdx]) : null;
      const year = date_submitted ? date_submitted.getFullYear() : "";
      const month = date_submitted ? date_submitted.getMonth() + 1 : "";
      const quarter = month ? Math.ceil(month / 3) : "";
      let pretest_score = parseFloat(row[preIdx]);
      let posttest_score = parseFloat(row[postIdx]);
      if (isNaN(pretest_score)) pretest_score = "";
      if (isNaN(posttest_score)) posttest_score = "";

      let knowledge_change = "";
      if (pretest_score !== "" && posttest_score !== "") {
        knowledge_change = (posttest_score - pretest_score) / pretest_score;
        if (!isFinite(knowledge_change)) knowledge_change = "";
      }

      allData.push({
        mentee_id,
        cadre,
        county,
        date_submitted,
        year,
        month,
        quarter,
        cme_module: sheetName,
        pretest_score,
        posttest_score,
        knowledge_change
      });
    }
  });

  // Calculate module_count, status, KPI
  const menteeModules = {};
  allData.forEach(item => {
    if (!menteeModules[item.mentee_id]) menteeModules[item.mentee_id] = new Set();
    menteeModules[item.mentee_id].add(item.cme_module);
  });

  const totalModules = sheetNames.length;

  const rows = allData.map(item => {
    const module_count = menteeModules[item.mentee_id].size;
    const status = module_count === totalModules ? "Completed" : "In Progress";
    const kpi = (item.posttest_score !== "" && item.posttest_score >= 80)
      ? "Pass"
      : (item.posttest_score !== "" ? "Fail" : "");

    return [
      item.mentee_id,item.cadre,item.county,item.date_submitted,item.year,item.month,item.quarter,
      item.cme_module,item.pretest_score,item.posttest_score,item.knowledge_change,
      status,kpi,module_count
    ];
  });

  masterSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  writeRowsInChunks(masterSheet, 2, rows, headers.length);

  SpreadsheetApp.flush();
  Logger.log(`✔ Merged ${sheetNames.length} sheets into ${masterSheetName}`);
}

/********** ARCHIVED (HISTORICAL) RUNS **********/
// Run once (repeatedly, if it reports remaining work) to pull the history that
// /runs.json no longer serves. importRapidProAndMerge() then combines the staged
// archived runs with the live ones on every import.
function backfillArchivedRuns() {
  const startedAt = Date.now();
  const properties = PropertiesService.getScriptProperties();
  const completed = JSON.parse(properties.getProperty(ARCHIVE_PROGRESS_KEY) || "[]");

  const archives = listRunArchives().filter(a => completed.indexOf(archiveKey(a)) === -1);
  if (archives.length === 0) {
    Logger.log("✔ No archives left to process. History is already staged.");
    return;
  }

  Logger.log(`Processing ${archives.length} remaining archive(s) from ${ARCHIVE_START_DATE}`);

  const sheet = getSheet(ARCHIVE_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, ARCHIVE_SHEET_HEADERS.length).setValues([ARCHIVE_SHEET_HEADERS]);
  }

  const stagedRunIds = readStagedRunIds(sheet);
  let appended = 0;
  let processed = 0;
  let failed = 0;

  for (const archive of archives) {
    if (Date.now() - startedAt > ARCHIVE_TIME_BUDGET_MS) break;

    const result = readArchiveRows(archive, stagedRunIds);

    // A failed download is left uncheckpointed so the next run retries it.
    if (!result.ok) {
      failed++;
      if (result.fatal) break;
      continue;
    }

    if (result.rows.length > 0) {
      writeRowsInChunks(sheet, sheet.getLastRow() + 1, result.rows, ARCHIVE_SHEET_HEADERS.length);
      SpreadsheetApp.flush();
      appended += result.rows.length;
    }

    completed.push(archiveKey(archive));
    properties.setProperty(ARCHIVE_PROGRESS_KEY, JSON.stringify(completed));
    processed++;
    Logger.log(`  ${archive.period} ${archive.start_date}: staged ${result.rows.length} module run(s)`);
  }

  const remaining = archives.length - processed - failed;
  Logger.log(`✔ Staged ${appended} archived run(s) from ${processed} archive(s).` +
    (failed > 0 ? ` ${failed} archive(s) could not be downloaded.` : "") +
    (remaining > 0 ? ` ${remaining} archive(s) remaining — run backfillArchivedRuns() again.` : ""));
}

// Forget the checkpoint so the next backfill re-reads every archive.
function resetArchiveBackfill() {
  PropertiesService.getScriptProperties().deleteProperty(ARCHIVE_PROGRESS_KEY);
  Logger.log("✔ Archive progress reset.");
}

function listRunArchives() {
  const archives = fetchAllRapidProResults(`${BASE_URL}/archives.json?archive_type=run`);
  return archives
    .filter(a => a.record_count > 0 && a.start_date >= ARCHIVE_START_DATE)
    .sort((a, b) => (a.start_date < b.start_date ? -1 : 1));
}

function archiveKey(archive) {
  return `${archive.period}:${archive.start_date}`;
}

// Archives are gzipped JSONL covering every flow in the workspace, so records
// are filtered down to the configured modules as they are read.
function readArchiveRows(archive, stagedRunIds) {
  const response = UrlFetchApp.fetch(archive.download_url, { muteHttpExceptions: true });

  if (response.getResponseCode() !== 200) {
    const body = response.getContentText();
    Logger.log(`⚠ Could not download ${archiveKey(archive)}: HTTP ${response.getResponseCode()}. ` +
      `${body.slice(0, 200)}`);

    // RapidPro signs archive links with AWS Signature V2 while the bucket now
    // requires V4, which no client can work around, so stop rather than retry
    // every remaining archive.
    const signingRejected = body.indexOf("AWS4-HMAC-SHA256") !== -1;
    if (signingRejected) {
      Logger.log("⚠ RapidPro is generating obsolete AWS SigV2 archive links. " +
        "The workspace administrator must configure SigV4 signing (or supply the " +
        "archives directly) before history can be imported.");
    }

    return { ok: false, rows: [], fatal: signingRejected };
  }

  const blob = response.getBlob().setContentType("application/x-gzip");
  const lines = Utilities.ungzip(blob).getDataAsString().split("\n");
  const rows = [];

  lines.forEach(line => {
    if (!line) return;

    const run = JSON.parse(line);
    const flowUUID = run.flow?.uuid;
    if (!FLOWS[flowUUID]) return;

    const runId = String(run.id);
    if (stagedRunIds[runId]) return;
    stagedRunIds[runId] = true;

    rows.push([
      runId,
      flowUUID,
      run.contact?.uuid || "",
      run.contact?.name || "",
      run.contact?.urn || "",
      run.created_on || "",
      run.modified_on || "",
      resultValue(run, "pre_score"),
      resultValue(run, "post_score")
    ]);
  });

  return { ok: true, rows: rows };
}

function resultValue(run, key) {
  const result = run.values?.[key];
  if (result === undefined || result === null) return "";
  return (typeof result === "object" ? result.value : result) || "";
}

function readStagedRunIds(sheet) {
  const ids = {};
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return ids;

  sheet.getRange(2, 1, lastRow - 1, 1).getValues().forEach(row => {
    if (row[0] !== "") ids[String(row[0])] = true;
  });

  return ids;
}

// Staged rows are read once per execution and reshaped to look like API runs so
// exportFlow() can treat archived and live history identically.
let stagedRunsByFlow = null;

function getStagedRuns(flowUUID) {
  if (stagedRunsByFlow === null) {
    stagedRunsByFlow = {};

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(ARCHIVE_SHEET_NAME);
    const lastRow = sheet ? sheet.getLastRow() : 0;

    if (lastRow > 1) {
      const values = sheet.getRange(2, 1, lastRow - 1, ARCHIVE_SHEET_HEADERS.length).getValues();

      values.forEach(row => {
        const flow = row[1];
        if (!flow) return;

        (stagedRunsByFlow[flow] = stagedRunsByFlow[flow] || []).push({
          id: row[0],
          contact: { uuid: row[2], name: row[3], urn: row[4] },
          created_on: toIsoString(row[5]),
          modified_on: toIsoString(row[6]),
          values: {
            pre_score: { value: row[7] },
            post_score: { value: row[8] }
          }
        });
      });
    }
  }

  return stagedRunsByFlow[flowUUID] || [];
}

// Sheets may hand back either the original ISO text or a parsed Date.
function toIsoString(value) {
  if (value instanceof Date) return value.toISOString();
  return value ? String(value) : "";
}

function mergeRunsById(archivedRuns, liveRuns) {
  const merged = [];
  const seen = {};

  // Live runs win: an archived copy of the same run is always older.
  liveRuns.concat(archivedRuns).forEach(run => {
    const id = String(run.id);
    if (seen[id]) return;
    seen[id] = true;
    merged.push(run);
  });

  return merged;
}

/***************** HELPERS *****************/
function rapidGet(url) {
  return JSON.parse(UrlFetchApp.fetch(url, {headers:{ Authorization:`Token ${API_TOKEN}` }}).getContentText());
}

// Retrieve every available API record in pages of 500. The first request
// explicitly sets page_size; RapidPro's `next` URL carries pagination forward.
function fetchAllRapidProResults(url) {
  let next = addQueryParameter(url, "page_size", RECORD_CHUNK_SIZE);
  const results = [];
  let pageNumber = 0;

  while (next) {
    const data = rapidGet(next);
    const pageResults = data.results || [];
    results.push(...pageResults);
    pageNumber++;
    Logger.log(`Fetched page ${pageNumber}: ${pageResults.length} records (${results.length} total)`);
    next = data.next || null;
  }

  return results;
}

function addQueryParameter(url, key, value) {
  const encodedKey = encodeURIComponent(key);
  const keyPattern = new RegExp(`([?&])${encodedKey}=`);
  if (keyPattern.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${encodedKey}=${encodeURIComponent(value)}`;
}

// Keep large setValues operations bounded as the historical dataset grows.
function writeRowsInChunks(sheet, startRow, rows, columnCount) {
  for (let i = 0; i < rows.length; i += RECORD_CHUNK_SIZE) {
    const chunk = rows.slice(i, i + RECORD_CHUNK_SIZE);
    sheet.getRange(startRow + i, 1, chunk.length, columnCount).setValues(chunk);
  }
}

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function findHeaderIndex(headerRow, aliases) {
  for (const alias of aliases) {
    const idx = headerRow.indexOf(alias);
    if (idx !== -1) return idx;
  }
  return -1;
}

// Enrich runs with cadre / county / facility.
// Contact fields are authoritative; identity flow results are a fallback in
// case the flow is later changed to save these as results too.
function enrichFlowWithIdentity(runs) {
  cacheContactIdentities(runs.map(r => r.contact?.uuid));
  const flowIdentities = fetchIdentityFlow();

  return runs.map(run => {
    const contactUUID = run.contact?.uuid;
    const fromContact = contactIdentityCache[contactUUID] || {};
    const fromFlow = flowIdentities[contactUUID] || {};

    return {
      ...run,
      values: {
        ...run.values,
        cadre: { value: firstValue(fromContact.cadre, fromFlow.cadre) },
        county: { value: firstValue(fromContact.county, fromFlow.county) },
        facility_name: { value: firstValue(fromContact.facility_name, fromFlow.facility_name) }
      }
    };
  });
}

// Contact identities are cached in a sheet as well as in memory. The historical
// dataset spans thousands of contacts and each one costs a request, so lookups
// accumulate across executions instead of being repeated on every import.
const CONTACT_SHEET_NAME = "_contact_identity";
const CONTACT_SHEET_HEADERS = ["contact_uuid", "cadre", "county", "facility_name"];
const CONTACT_LOOKUP_BUDGET_MS = 2 * 60 * 1000;

let contactIdentityCache = null;

function cacheContactIdentities(contactUUIDs) {
  const sheet = loadContactIdentityCache();

  const pending = contactUUIDs
    .filter(uuid => uuid && !contactIdentityCache[uuid])
    .filter((uuid, i, list) => list.indexOf(uuid) === i);

  if (pending.length === 0) return;

  const startedAt = Date.now();
  const CHUNK_SIZE = 25;
  const newRows = [];
  let looked = 0;

  for (let i = 0; i < pending.length; i += CHUNK_SIZE) {
    if (Date.now() - startedAt > CONTACT_LOOKUP_BUDGET_MS) break;

    const chunk = pending.slice(i, i + CHUNK_SIZE);

    const responses = UrlFetchApp.fetchAll(chunk.map(uuid => ({
      url: `${BASE_URL}/contacts.json?uuid=${encodeURIComponent(uuid)}`,
      headers: { Authorization: `Token ${API_TOKEN}` },
      muteHttpExceptions: true
    })));

    responses.forEach((response, idx) => {
      const uuid = chunk[idx];
      const identity = {};

      if (response.getResponseCode() === 200) {
        const results = JSON.parse(response.getContentText()).results || [];
        const fields = results[0]?.fields || {};

        Object.keys(IDENTITY_FIELD_KEYS).forEach(target => {
          const value = firstValue(...IDENTITY_FIELD_KEYS[target].map(k => fields[k]));
          if (value !== UNSPECIFIED) identity[target] = value;
        });
      } else {
        Logger.log(`⚠ Contact lookup failed for ${uuid}: HTTP ${response.getResponseCode()}`);
      }

      contactIdentityCache[uuid] = identity;
      newRows.push([uuid, identity.cadre || "", identity.county || "", identity.facility_name || ""]);
      looked++;
    });
  }

  if (newRows.length > 0) {
    writeRowsInChunks(sheet, sheet.getLastRow() + 1, newRows, CONTACT_SHEET_HEADERS.length);
  }

  if (looked < pending.length) {
    Logger.log(`⚠ Looked up ${looked} of ${pending.length} new contacts; ` +
      `re-run the import to resolve the rest.`);
  }
}

function loadContactIdentityCache() {
  const sheet = getSheet(CONTACT_SHEET_NAME);

  if (contactIdentityCache === null) {
    contactIdentityCache = {};

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, CONTACT_SHEET_HEADERS.length).setValues([CONTACT_SHEET_HEADERS]);
    } else if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, CONTACT_SHEET_HEADERS.length)
        .getValues()
        .forEach(row => {
          if (!row[0]) return;
          const identity = {};
          if (row[1]) identity.cadre = row[1];
          if (row[2]) identity.county = row[2];
          if (row[3]) identity.facility_name = row[3];
          contactIdentityCache[String(row[0])] = identity;
        });
    }
  }

  return sheet;
}

// Fetch identity flow results, cached for the lifetime of the execution.
let identityFlowCache = null;

function fetchIdentityFlow() {
  if (identityFlowCache) return identityFlowCache;

  const runs = fetchAllRapidProResults(
    `${BASE_URL}/runs.json?flow=${encodeURIComponent(IDENTITY_FLOW_UUID)}`
  );

  // Oldest first so a newer run wins, and blanks never overwrite a value that
  // an earlier run already supplied.
  runs.sort((a, b) => new Date(a.modified_on) - new Date(b.modified_on));

  const identityLookup = {};
  runs.forEach(run => {
    const contactUUID = run.contact?.uuid;
    if (!contactUUID) return;

    const identity = identityLookup[contactUUID] || (identityLookup[contactUUID] = {});
    Object.keys(IDENTITY_FIELD_KEYS).forEach(target => {
      const value = firstValue(run.values?.[target]?.value);
      if (value !== UNSPECIFIED) identity[target] = value;
    });
  });

  identityFlowCache = identityLookup;
  return identityLookup;
}

// A few contact records hold spreadsheet error text (e.g. "#REF!") from an
// earlier bulk import, which is treated the same as a missing value.
const ERROR_LITERAL = /^#(REF|NUM|N\/A|VALUE|DIV\/0|NAME|NULL)[!?]?$/i;

function firstValue(...candidates) {
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) continue;
    const value = String(candidate).trim();
    if (value !== "" && !ERROR_LITERAL.test(value)) return value;
  }
  return UNSPECIFIED;
}
