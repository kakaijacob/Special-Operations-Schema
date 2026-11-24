/****************************
 * RAPIDPRO → GOOGLE SHEETS
 * One Sheet Per Flow + Merge → DELTA Newborn Curriculum
 * Newborn Curriculum
 ****************************/

// All names in this file use an NB_ prefix so it can be pasted into the same
// Apps Script project as DELTA_1.0_Data_Importation.js without global collisions.
const NB_BASE_URL = "https://prompts.jacarandahealth.org/api/v2";
const NB_API_TOKEN = "5f39306380a6dbe3cd497ce9bf8931deeaa6993a";
const NB_RECORD_CHUNK_SIZE = 500;
const NB_UNSPECIFIED = "Unspecified";

const NB_MASTER_SHEET_NAME = "DELTA Newborn Curriculum";
const NB_ARCHIVE_START_DATE = "2024-06-01";
const NB_ARCHIVE_SHEET_NAME = "_newborn_archived_runs";
const NB_ARCHIVE_PROGRESS_KEY = "DELTA_NEWBORN_ARCHIVES_COMPLETED";
const NB_ARCHIVE_TIME_BUDGET_MS = 4.5 * 60 * 1000;
const NB_ARCHIVE_SHEET_HEADERS = [
  "run_id", "flow_uuid", "contact_uuid", "contact_name", "urn",
  "created_on", "modified_on", "pre_score", "post_score"
];

const NB_CONTACT_SHEET_NAME = "_newborn_contact_identity";
const NB_CONTACT_SHEET_HEADERS = [
  "contact_uuid", "cadre", "county", "facility_name"
];
const NB_CONTACT_LOOKUP_BUDGET_MS = 2 * 60 * 1000;
const NB_IDENTITY_FIELD_KEYS = {
  cadre: ["cadre"],
  county: ["county"],
  facility_name: ["facility_name", "facilityname"]
};

// FLOW UUID : Sheet name
const NB_FLOWS = {
  "2ffe62e7-ab42-4ead-b75b-6a077b0f6892": "Family Centred Care",
  "c03b3041-29fd-487b-900b-21d76e7483f2": "Essential Newborn Care",
  "a04af878-1ed6-4067-b162-f8270750d56f": "Neonatal Resuscitation",
  "98216d49-90ab-45f6-8524-bce32cf162c4": "Sick Newborn",
  "08b37fb2-45fb-4d7a-95b5-8276cbb14ab1": "Newborn Emergency Management 1",
  "bc9b4183-8a15-44db-81ef-35f071e309b9": "Newborn Emergency Management 2",
  "7a2916ab-e4e4-4535-82fb-003a998e6756": "Safe Transfer Requirements",
  "f1c60360-39f0-40fa-8953-550fee05b773": "Infection Prevention",
  "d3fac004-0c2d-47d2-96cf-106d2bd41630": "Newborn Feeding & Fluids"
};

// The supplied script mixed "Cadre", "Field:Cadre", "facility Name", and
// "Facility Name". Those are display-label variants, not RapidPro result keys.
// Identity fields actually live on the contact, so every module uses one
// normalized field map and is enriched from /contacts.json.
const NB_STANDARD_FIELDS = [
  { field: "contact_uuid", header: "Contact UUID", type: "contact", key: "uuid" },
  { field: "contact_name", header: "Mentee Name", type: "contact", key: "name" },
  { field: "urn", header: "Mentee ID", type: "contact", key: "urn" },
  { field: "cadre", header: "Cadre" },
  { field: "county", header: "County" },
  { field: "facility_name", header: "Facility" },
  { field: "created_on", header: "Date Submitted", type: "meta" },
  { field: "modified_on", header: "Date Modified", type: "meta" },
  { field: "pre_score", header: "Pretest Score" },
  { field: "post_score", header: "Posttest Score" }
];

/****************** MAIN RUNNER ******************/
function importDeltaNewbornModules() {
  NB_resetExecutionCaches();
  const importedSheets = [];

  Object.keys(NB_FLOWS).forEach(function(flowUUID) {
    const sheetName = NB_exportFlow(flowUUID);
    if (sheetName) importedSheets.push(sheetName);
  });

  NB_mergeSheets(importedSheets);
}

/**************** PROCESS ONE FLOW ****************/
function NB_exportFlow(flowUUID) {
  const sheetName = NB_FLOWS[flowUUID] || `Newborn-${flowUUID}`;
  const sheet = NB_getSheet(sheetName);
  sheet.clearContents();

  const liveRuns = NB_fetchAllPages(
    `${NB_BASE_URL}/runs.json?flow=${encodeURIComponent(flowUUID)}`
  );
  const archivedRuns = NB_getStagedRuns(flowUUID);
  let runs = NB_mergeRunsById(archivedRuns, liveRuns);
  runs.sort(function(a, b) {
    return new Date(a.created_on) - new Date(b.created_on);
  });

  Logger.log(
    `${sheetName}: ${liveRuns.length} live + ${archivedRuns.length} archived ` +
    `= ${runs.length} run(s)`
  );

  if (runs.length === 0) {
    // Keep the schema visible even when all history is still waiting for the
    // archive backfill.
    sheet.getRange(1, 1, 1, NB_STANDARD_FIELDS.length)
      .setValues([NB_STANDARD_FIELDS.map(function(field) { return field.header; })]);
    return null;
  }

  runs = NB_enrichWithContactIdentity(runs);

  const headers = NB_STANDARD_FIELDS.map(function(field) { return field.header; });
  const rows = runs.map(function(run) {
    return NB_STANDARD_FIELDS.map(function(field) {
      if (field.type === "contact") {
        let value = (run.contact && run.contact[field.key]) || "";
        if (field.key === "urn") {
          value = String(value).replace(/^whatsapp:254/, "");
        }
        return value;
      }

      if (field.type === "meta") {
        const value = run[field.field] || "";
        return value ? String(value).split("T")[0] : "";
      }

      return NB_resultValue(run, field.field);
    });
  });

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  NB_writeRowsInChunks(sheet, 2, rows, headers.length);

  const missingIdentity = runs.filter(function(run) {
    return NB_resultValue(run, "cadre") === NB_UNSPECIFIED &&
      NB_resultValue(run, "county") === NB_UNSPECIFIED;
  }).length;

  Logger.log(
    `✔ Imported ${rows.length} records → ${sheetName}` +
    (missingIdentity
      ? ` (${missingIdentity} without cadre/county on their contact record)`
      : "")
  );

  return sheetName;
}

/**************** MERGE MODULE SHEETS ****************/
function NB_mergeSheets(sheetNames) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let masterSheet = ss.getSheetByName(NB_MASTER_SHEET_NAME);

  if (!masterSheet) {
    masterSheet = ss.insertSheet(NB_MASTER_SHEET_NAME);
  } else {
    masterSheet.clear();
  }

  const headers = [
    "Date Submitted", "Year", "Month", "Quarter", "Mentee ID",
    "Cadre", "County", "Facility", "Module", "Pretest Score",
    "Posttest Score", "Knowledge Change", "Status", "KPI"
  ];
  const allData = [];

  sheetNames.forEach(function(sheetName) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return;

    const headerRow = data[0].map(function(value) {
      return String(value).trim().toLowerCase();
    });

    const contactIdx = NB_findHeaderIndex(headerRow, ["contact uuid"]);
    const dateIdx = NB_findHeaderIndex(headerRow, ["date submitted", "started"]);
    const menteeIdx = NB_findHeaderIndex(headerRow, ["mentee id", "urn value", "urn"]);
    const cadreIdx = NB_findHeaderIndex(headerRow, ["cadre", "field:cadre"]);
    const countyIdx = NB_findHeaderIndex(headerRow, ["county", "field:county"]);
    const facilityIdx = NB_findHeaderIndex(
      headerRow,
      ["facility", "field:facility name", "facility name"]
    );
    const preIdx = NB_findHeaderIndex(headerRow, ["pretest score"]);
    const postIdx = NB_findHeaderIndex(headerRow, ["posttest score"]);

    if ([dateIdx, menteeIdx, cadreIdx, countyIdx, facilityIdx, preIdx, postIdx]
      .indexOf(-1) !== -1) {
      Logger.log(`⚠ Skipped ${sheetName}: expected columns not found`);
      return;
    }

    for (let i = 1; i < data.length; i++) {
      const source = data[i];
      const rawDate = source[dateIdx];
      const dateSubmitted = rawDate ? new Date(rawDate) : null;
      const validDate = dateSubmitted && !isNaN(dateSubmitted.getTime());
      const year = validDate ? dateSubmitted.getFullYear() : "";
      const month = validDate ? dateSubmitted.getMonth() + 1 : "";
      const quarter = month ? Math.ceil(month / 3) : "";

      const menteeID = source[menteeIdx] || "";
      const contactUUID = contactIdx === -1 ? "" : source[contactIdx];
      // Never group all blank IDs as if they were one mentee.
      const menteeKey = menteeID
        ? `id:${menteeID}`
        : (contactUUID ? `contact:${contactUUID}` : `row:${sheetName}:${i}`);

      const preScore = NB_parseScore(source[preIdx]);
      const postScore = NB_parseScore(source[postIdx]);
      let knowledgeChange = "";

      if (preScore !== "" && postScore !== "" && preScore !== 0) {
        knowledgeChange = (postScore - preScore) / preScore;
        if (!isFinite(knowledgeChange)) knowledgeChange = "";
      }

      const kpi = postScore === "" ? "" : (postScore >= 80 ? "Pass" : "Fail");

      allData.push({
        menteeKey: menteeKey,
        module: sheetName,
        row: [
          validDate ? dateSubmitted : "",
          year,
          month,
          quarter,
          menteeID,
          source[cadreIdx] || NB_UNSPECIFIED,
          source[countyIdx] || NB_UNSPECIFIED,
          source[facilityIdx] || NB_UNSPECIFIED,
          sheetName,
          preScore,
          postScore,
          knowledgeChange,
          "",
          kpi
        ]
      });
    }
  });

  const menteeModules = {};
  allData.forEach(function(item) {
    if (!menteeModules[item.menteeKey]) {
      menteeModules[item.menteeKey] = {};
    }
    menteeModules[item.menteeKey][item.module] = true;
  });

  // Always require all nine configured modules. Using sheetNames.length would
  // falsely mark mentees complete whenever a module has no rows.
  const totalModules = Object.keys(NB_FLOWS).length;
  const rows = allData.map(function(item) {
    const moduleCount = Object.keys(menteeModules[item.menteeKey]).length;
    item.row[12] = moduleCount === totalModules ? "Completed" : "In Progress";
    return item.row;
  });

  masterSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  NB_writeRowsInChunks(masterSheet, 2, rows, headers.length);
  SpreadsheetApp.flush();

  Logger.log(
    `✔ Merged ${sheetNames.length} populated module sheets into ` +
    `${NB_MASTER_SHEET_NAME} (${rows.length} rows)`
  );
}

/**************** ARCHIVED (HISTORICAL) RUNS ****************/
// All nine Newborn flows currently have zero live runs: their 866 historical
// runs are archived. Run this repeatedly until it reports no archives remaining.
function backfillNewbornArchivedRuns() {
  const startedAt = Date.now();
  const properties = PropertiesService.getScriptProperties();
  const completed = JSON.parse(
    properties.getProperty(NB_ARCHIVE_PROGRESS_KEY) || "[]"
  );

  const archives = NB_listRunArchives().filter(function(archive) {
    return completed.indexOf(NB_archiveKey(archive)) === -1;
  });

  if (archives.length === 0) {
    Logger.log("✔ No Newborn archives left to process.");
    return;
  }

  const sheet = NB_getSheet(NB_ARCHIVE_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, NB_ARCHIVE_SHEET_HEADERS.length)
      .setValues([NB_ARCHIVE_SHEET_HEADERS]);
  }

  const stagedRunIds = NB_readStagedRunIds(sheet);
  let appended = 0;
  let processed = 0;
  let failed = 0;

  Logger.log(
    `Processing ${archives.length} remaining Newborn archive(s) from ` +
    `${NB_ARCHIVE_START_DATE}`
  );

  for (const archive of archives) {
    if (Date.now() - startedAt > NB_ARCHIVE_TIME_BUDGET_MS) break;

    const result = NB_readArchiveRows(archive, stagedRunIds);
    if (!result.ok) {
      failed++;
      if (result.fatal) break;
      continue;
    }

    if (result.rows.length > 0) {
      NB_writeRowsInChunks(
        sheet,
        sheet.getLastRow() + 1,
        result.rows,
        NB_ARCHIVE_SHEET_HEADERS.length
      );
      SpreadsheetApp.flush();
      appended += result.rows.length;
    }

    completed.push(NB_archiveKey(archive));
    properties.setProperty(
      NB_ARCHIVE_PROGRESS_KEY,
      JSON.stringify(completed)
    );
    processed++;
    Logger.log(
      `  ${archive.period} ${archive.start_date}: staged ` +
      `${result.rows.length} Newborn run(s)`
    );
  }

  const remaining = archives.length - processed - failed;
  Logger.log(
    `✔ Staged ${appended} Newborn run(s) from ${processed} archive(s).` +
    (failed ? ` ${failed} archive(s) could not be downloaded.` : "") +
    (remaining
      ? ` ${remaining} archive(s) remain — run backfillNewbornArchivedRuns() again.`
      : "")
  );
}

function resetNewbornArchiveBackfill() {
  PropertiesService.getScriptProperties()
    .deleteProperty(NB_ARCHIVE_PROGRESS_KEY);
  Logger.log("✔ Newborn archive progress reset.");
}

function NB_listRunArchives() {
  return NB_fetchAllPages(
    `${NB_BASE_URL}/archives.json?archive_type=run`
  )
    .filter(function(archive) {
      return archive.record_count > 0 &&
        archive.start_date >= NB_ARCHIVE_START_DATE;
    })
    .sort(function(a, b) {
      return a.start_date < b.start_date ? -1 : 1;
    });
}

function NB_archiveKey(archive) {
  return `${archive.period}:${archive.start_date}`;
}

function NB_readArchiveRows(archive, stagedRunIds) {
  const response = UrlFetchApp.fetch(archive.download_url, {
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    const body = response.getContentText();
    Logger.log(
      `⚠ Could not download Newborn ${NB_archiveKey(archive)}: ` +
      `HTTP ${response.getResponseCode()}. ${body.slice(0, 200)}`
    );

    const signingRejected = body.indexOf("AWS4-HMAC-SHA256") !== -1;
    if (signingRejected) {
      Logger.log(
        "⚠ RapidPro is generating obsolete AWS SigV2 archive links. " +
        "The workspace administrator must configure SigV4 signing (or supply " +
        "the archives directly) before Newborn history can be imported."
      );
    }

    return { ok: false, rows: [], fatal: signingRejected };
  }

  const blob = response.getBlob().setContentType("application/x-gzip");
  const lines = Utilities.ungzip(blob).getDataAsString().split("\n");
  const rows = [];

  lines.forEach(function(line) {
    if (!line) return;

    const run = JSON.parse(line);
    const flowUUID = run.flow && run.flow.uuid;
    if (!NB_FLOWS[flowUUID]) return;

    const runId = String(run.id);
    if (stagedRunIds[runId]) return;
    stagedRunIds[runId] = true;

    rows.push([
      runId,
      flowUUID,
      (run.contact && run.contact.uuid) || "",
      (run.contact && run.contact.name) || "",
      (run.contact && run.contact.urn) || "",
      run.created_on || "",
      run.modified_on || "",
      NB_resultValue(run, "pre_score"),
      NB_resultValue(run, "post_score")
    ]);
  });

  return { ok: true, rows: rows };
}

function NB_readStagedRunIds(sheet) {
  const ids = {};
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return ids;

  sheet.getRange(2, 1, lastRow - 1, 1).getValues()
    .forEach(function(row) {
      if (row[0] !== "") ids[String(row[0])] = true;
    });

  return ids;
}

let NB_stagedRunsByFlow = null;

function NB_getStagedRuns(flowUUID) {
  if (NB_stagedRunsByFlow === null) {
    NB_stagedRunsByFlow = {};

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(NB_ARCHIVE_SHEET_NAME);
    const lastRow = sheet ? sheet.getLastRow() : 0;

    if (lastRow > 1) {
      sheet.getRange(
        2,
        1,
        lastRow - 1,
        NB_ARCHIVE_SHEET_HEADERS.length
      ).getValues().forEach(function(row) {
        const flowUUID = row[1];
        if (!flowUUID) return;

        if (!NB_stagedRunsByFlow[flowUUID]) {
          NB_stagedRunsByFlow[flowUUID] = [];
        }

        NB_stagedRunsByFlow[flowUUID].push({
          id: row[0],
          contact: {
            uuid: row[2],
            name: row[3],
            urn: row[4]
          },
          created_on: NB_toIsoString(row[5]),
          modified_on: NB_toIsoString(row[6]),
          values: {
            pre_score: { value: row[7] },
            post_score: { value: row[8] }
          }
        });
      });
    }
  }

  return NB_stagedRunsByFlow[flowUUID] || [];
}

function NB_mergeRunsById(archivedRuns, liveRuns) {
  const merged = [];
  const seen = {};

  // Live runs win if an archive overlaps the live retention window.
  liveRuns.concat(archivedRuns).forEach(function(run) {
    const runId = String(run.id);
    if (seen[runId]) return;
    seen[runId] = true;
    merged.push(run);
  });

  return merged;
}

/**************** CONTACT IDENTITY ****************/
let NB_contactIdentityCache = null;
let NB_contactLookupStartedAt = null;

function NB_enrichWithContactIdentity(runs) {
  NB_cacheContactIdentities(runs.map(function(run) {
    return run.contact && run.contact.uuid;
  }));

  return runs.map(function(run) {
    const contactUUID = run.contact && run.contact.uuid;
    const identity = NB_contactIdentityCache[contactUUID] || {};

    return Object.assign({}, run, {
      values: Object.assign({}, run.values || {}, {
        cadre: {
          value: NB_firstValue(identity.cadre)
        },
        county: {
          value: NB_firstValue(identity.county)
        },
        facility_name: {
          value: NB_firstValue(identity.facility_name)
        }
      })
    });
  });
}

function NB_cacheContactIdentities(contactUUIDs) {
  const sheet = NB_loadContactIdentityCache();
  const pending = contactUUIDs
    .filter(function(uuid) {
      return uuid && !Object.prototype.hasOwnProperty.call(
        NB_contactIdentityCache,
        uuid
      );
    })
    .filter(function(uuid, index, list) {
      return list.indexOf(uuid) === index;
    });

  if (pending.length === 0) return;
  if (NB_contactLookupStartedAt === null) {
    NB_contactLookupStartedAt = Date.now();
  }

  const requestChunkSize = 25;
  const newRows = [];
  let lookedUp = 0;

  for (let i = 0; i < pending.length; i += requestChunkSize) {
    if (
      Date.now() - NB_contactLookupStartedAt >
      NB_CONTACT_LOOKUP_BUDGET_MS
    ) break;

    const chunk = pending.slice(i, i + requestChunkSize);
    const responses = UrlFetchApp.fetchAll(chunk.map(function(uuid) {
      return {
        url: `${NB_BASE_URL}/contacts.json?uuid=${encodeURIComponent(uuid)}`,
        headers: { Authorization: `Token ${NB_API_TOKEN}` },
        muteHttpExceptions: true
      };
    }));

    responses.forEach(function(response, index) {
      const uuid = chunk[index];
      const identity = {};

      if (response.getResponseCode() === 200) {
        const results = JSON.parse(response.getContentText()).results || [];
        const fields = (results[0] && results[0].fields) || {};

        Object.keys(NB_IDENTITY_FIELD_KEYS).forEach(function(target) {
          const candidates = NB_IDENTITY_FIELD_KEYS[target].map(function(key) {
            return fields[key];
          });
          const value = NB_firstValue.apply(null, candidates);
          if (value !== NB_UNSPECIFIED) identity[target] = value;
        });
      } else {
        Logger.log(
          `⚠ Newborn contact lookup failed for ${uuid}: ` +
          `HTTP ${response.getResponseCode()}`
        );
      }

      NB_contactIdentityCache[uuid] = identity;
      newRows.push([
        uuid,
        identity.cadre || "",
        identity.county || "",
        identity.facility_name || ""
      ]);
      lookedUp++;
    });
  }

  if (newRows.length) {
    NB_writeRowsInChunks(
      sheet,
      sheet.getLastRow() + 1,
      newRows,
      NB_CONTACT_SHEET_HEADERS.length
    );
  }

  if (lookedUp < pending.length) {
    Logger.log(
      `⚠ Looked up ${lookedUp} of ${pending.length} new Newborn contacts; ` +
      "run importDeltaNewbornModules() again to resolve the rest."
    );
  }
}

function NB_loadContactIdentityCache() {
  const sheet = NB_getSheet(NB_CONTACT_SHEET_NAME);

  if (NB_contactIdentityCache === null) {
    NB_contactIdentityCache = {};

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, NB_CONTACT_SHEET_HEADERS.length)
        .setValues([NB_CONTACT_SHEET_HEADERS]);
    } else if (sheet.getLastRow() > 1) {
      sheet.getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        NB_CONTACT_SHEET_HEADERS.length
      ).getValues().forEach(function(row) {
        if (!row[0]) return;
        const identity = {};
        if (row[1]) identity.cadre = row[1];
        if (row[2]) identity.county = row[2];
        if (row[3]) identity.facility_name = row[3];
        NB_contactIdentityCache[String(row[0])] = identity;
      });
    }
  }

  return sheet;
}

function resetNewbornContactIdentityCache() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(NB_CONTACT_SHEET_NAME);
  if (sheet) sheet.clear();
  NB_contactIdentityCache = null;
  Logger.log("✔ Newborn contact identity cache reset.");
}

/**************** HELPERS ****************/
function NB_resetExecutionCaches() {
  NB_stagedRunsByFlow = null;
  NB_contactIdentityCache = null;
  NB_contactLookupStartedAt = null;
}

function NB_get(url) {
  const response = UrlFetchApp.fetch(url, {
    headers: { Authorization: `Token ${NB_API_TOKEN}` },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error(
      `RapidPro request failed: HTTP ${response.getResponseCode()} ${url} ` +
      response.getContentText().slice(0, 300)
    );
  }

  return JSON.parse(response.getContentText());
}

function NB_fetchAllPages(url) {
  let next = NB_addQueryParameter(
    url,
    "page_size",
    NB_RECORD_CHUNK_SIZE
  );
  const results = [];
  let pageNumber = 0;

  while (next) {
    const data = NB_get(next);
    const pageResults = data.results || [];
    Array.prototype.push.apply(results, pageResults);
    pageNumber++;
    Logger.log(
      `Newborn page ${pageNumber}: ${pageResults.length} records ` +
      `(${results.length} total)`
    );
    next = data.next || null;
  }

  return results;
}

function NB_addQueryParameter(url, key, value) {
  const encodedKey = encodeURIComponent(key);
  const pattern = new RegExp(`([?&])${encodedKey}=`);
  if (pattern.test(url)) return url;

  return `${url}${url.indexOf("?") === -1 ? "?" : "&"}` +
    `${encodedKey}=${encodeURIComponent(value)}`;
}

function NB_writeRowsInChunks(sheet, startRow, rows, columnCount) {
  for (let i = 0; i < rows.length; i += NB_RECORD_CHUNK_SIZE) {
    const chunk = rows.slice(i, i + NB_RECORD_CHUNK_SIZE);
    sheet.getRange(startRow + i, 1, chunk.length, columnCount)
      .setValues(chunk);
  }
}

function NB_getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function NB_findHeaderIndex(headerRow, aliases) {
  for (const alias of aliases) {
    const index = headerRow.indexOf(alias);
    if (index !== -1) return index;
  }
  return -1;
}

function NB_parseScore(value) {
  const score = parseFloat(value);
  return isNaN(score) || !isFinite(score) ? "" : score;
}

function NB_resultValue(run, key) {
  const result = run.values && run.values[key];
  if (result === undefined || result === null) return "";

  const value = typeof result === "object" ? result.value : result;
  return value === undefined || value === null ? "" : value;
}

function NB_toIsoString(value) {
  if (value instanceof Date) return value.toISOString();
  return value ? String(value) : "";
}

const NB_ERROR_LITERAL =
  /^#(REF|NUM|N\/A|VALUE|DIV\/0|NAME|NULL)[!?]?$/i;

function NB_firstValue() {
  for (let i = 0; i < arguments.length; i++) {
    const candidate = arguments[i];
    if (candidate === undefined || candidate === null) continue;
    const value = String(candidate).trim();
    if (value && !NB_ERROR_LITERAL.test(value)) return value;
  }
  return NB_UNSPECIFIED;
}
