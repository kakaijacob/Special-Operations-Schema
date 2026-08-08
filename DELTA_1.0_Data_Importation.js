/****************************
 * RAPIDPRO → GOOGLE SHEETS + Merge → MoH In-Person CMEs
 * Maternal & Newborn Curriculum
 * Replaces invalid numbers (#NUM!) with blanks
 ****************************/

const BASE_URL = "https://prompts.jacarandahealth.org/api/v2";
const API_TOKEN = "5f39306380a6dbe3cd497ce9bf8931deeaa6993a";

// Identity Flow UUID (contains cadre, county, facility)
const IDENTITY_FLOW_UUID = "8a4765d7-b608-41b1-a459-f6628b3d0559";

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

  let runs = [];
  let next = `${BASE_URL}/runs.json?flow=${flowUUID}`;

  while (next) {
    const data = rapidGet(next);
    runs = runs.concat(data.results);
    next = data.next;
  }

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
  if (rows.length > 0) sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

  Logger.log(`✔ Imported ${rows.length} records → ${sheetName}`);
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
  if (rows.length > 0) {
    masterSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  SpreadsheetApp.flush();
  Logger.log(`✔ Merged ${sheetNames.length} sheets into ${masterSheetName}`);
}

/***************** HELPERS *****************/
function rapidGet(url) {
  return JSON.parse(UrlFetchApp.fetch(url, {headers:{ Authorization:`Token ${API_TOKEN}` }}).getContentText());
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

// Enrich runs with identity flow fields
function enrichFlowWithIdentity(runs) {
  const identityLookup = fetchIdentityFlow();

  return runs.map(run => {
    const contactUUID = run.contact?.uuid;
    const identity = identityLookup[contactUUID] || {
      cadre: "Unspecified",
      county: "Unspecified",
      facility_name: "Unspecified"
    };

    return {
      ...run,
      values: {
        ...run.values,
        cadre: { value: identity.cadre },
        county: { value: identity.county },
        facility_name: { value: identity.facility_name }
      }
    };
  });
}

// Fetch identity flow data
// Cached for the lifetime of the execution: every flow needs the same lookup,
// and re-paginating it per flow risks the Apps Script execution time limit.
let identityLookupCache = null;

function fetchIdentityFlow() {
  if (identityLookupCache) return identityLookupCache;

  let runs = [];
  let next = `${BASE_URL}/runs.json?flow=${IDENTITY_FLOW_UUID}`;

  while (next) {
    const data = rapidGet(next);
    runs = runs.concat(data.results);
    next = data.next;
  }

  const identityLookup = {};
  runs.forEach(run => {
    const contactUUID = run.contact.uuid;
    identityLookup[contactUUID] = {
      cadre: run.values?.cadre?.value || "Unspecified",
      county: run.values?.county?.value || "Unspecified",
      facility_name: run.values?.facility_name?.value || "Unspecified"
    };
  });

  identityLookupCache = identityLookup;
  return identityLookup;
}
