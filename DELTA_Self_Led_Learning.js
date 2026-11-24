/****************************
 * RAPIDPRO → GOOGLE SHEETS
 * One Sheet Per Flow + Merge → DELTA Self-led Learning
 ****************************/

// SL_ names prevent collisions with the other DELTA files when all are pasted
// into the same Google Apps Script project.
const SL_BASE_URL = "https://prompts.jacarandahealth.org/api/v2";
const SL_API_TOKEN = "5f39306380a6dbe3cd497ce9bf8931deeaa6993a";
const SL_RECORD_CHUNK_SIZE = 500;
const SL_UNSPECIFIED = "Unspecified";

const SL_MASTER_SHEET_NAME = "DELTA Self-led Learning";
const SL_ARCHIVE_START_DATE = "2020-08-01";
const SL_ARCHIVE_SHEET_NAME = "_self_led_archived_runs";
const SL_ARCHIVE_PROGRESS_KEY = "DELTA_SELF_LED_ARCHIVES_COMPLETED";
const SL_ARCHIVE_TIME_BUDGET_MS = 4.5 * 60 * 1000;
const SL_ARCHIVE_HEADERS = [
  "run_id", "flow_uuid", "contact_uuid", "contact_name", "urn",
  "created_on", "modified_on", "pre_score", "final_score"
];

const SL_CONTACT_SHEET_NAME = "_self_led_contact_identity";
const SL_CONTACT_HEADERS = [
  "contact_uuid", "cadre", "county", "facility_name"
];
const SL_CONTACT_LOOKUP_BUDGET_MS = 2 * 60 * 1000;
const SL_IDENTITY_FIELD_KEYS = {
  cadre: ["cadre"],
  county: ["county"],
  facility_name: ["facility_name", "facilityname"]
};

const SL_FLOWS = {
  "f6b72cf2-502e-4d05-9707-66f6aed2e97c": "Breech",
  "029941ba-e47b-4c47-a774-455fd81f3df8": "Antepartum Hemorrhage",
  "171ce6c4-5a11-4a41-a0de-12468a15d1fa": "Post Abortion Care",
  "85b08166-bb3a-446e-b2ec-fc4819c0396e": "Learning COVID-19",
  "8b5c948e-02e0-431b-8acf-b7ab511a288e": "Respectful Maternity Care",
  "b31180d6-2dd8-4362-97ee-7be44bfb6dc2": "Pregnancy Induced Hypertension",
  "5c53cdc3-349a-4ea4-a7d5-0d3b741dab2d": "Infection Prevention",
  "4ba22f5b-4fa2-41ce-8efe-bafedd879e2d": "Management of Normal Labor",
  "b92df3d6-512d-4345-b7aa-cbe4e0cda8b0": "Shoulder Dystocia",
  "ee1e8bfc-16d7-40a0-a362-7ec75f87fd60": "PPH",
  "b2c69712-2ee0-4220-9f93-9b622aec52ba": "Neonatal Resuscitation"
};

// The supplied flow maps omitted Cadre, County, and Facility even though the
// merge required them. Those values live on RapidPro contacts, so all modules
// use one normalized schema and are enriched from /contacts.json.
const SL_STANDARD_FIELDS = [
  { field: "contact_uuid", header: "Contact UUID", type: "contact", key: "uuid" },
  { field: "contact_name", header: "Mentee Name", type: "contact", key: "name" },
  { field: "urn", header: "Mentee ID", type: "contact", key: "urn" },
  { field: "cadre", header: "Cadre" },
  { field: "county", header: "County" },
  { field: "facility_name", header: "Facility" },
  { field: "created_on", header: "Date Submitted", type: "meta" },
  { field: "modified_on", header: "Date Modified", type: "meta" },
  { field: "pre_score", header: "Pretest Score" },
  { field: "final_score", header: "Posttest Score" }
];

/****************** PUBLIC ENTRY POINT ******************/
function importDeltaSelfLedLearning() {
  SL_resetExecutionCaches();
  const importedSheets = [];

  Object.keys(SL_FLOWS).forEach(function(flowUUID) {
    const sheetName = SL_exportFlow(flowUUID);
    if (sheetName) importedSheets.push(sheetName);
  });

  SL_mergeSheets(importedSheets);
}

/**************** PROCESS ONE FLOW ****************/
function SL_exportFlow(flowUUID) {
  const sheetName = SL_FLOWS[flowUUID] || `Self-led-${flowUUID}`;
  const sheet = SL_getSheet(sheetName);
  sheet.clearContents();

  const liveRuns = SL_fetchAllPages(
    `${SL_BASE_URL}/runs.json?flow=${encodeURIComponent(flowUUID)}`
  );
  const archivedRuns = SL_getStagedRuns(flowUUID);
  let runs = SL_mergeRunsById(archivedRuns, liveRuns);
  runs.sort(function(a, b) {
    return new Date(a.created_on) - new Date(b.created_on);
  });

  Logger.log(
    `${sheetName}: ${liveRuns.length} live + ${archivedRuns.length} archived ` +
    `= ${runs.length} run(s)`
  );

  const headers = SL_STANDARD_FIELDS.map(function(field) {
    return field.header;
  });

  if (runs.length === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return null;
  }

  runs = SL_enrichWithContactIdentity(runs);

  const rows = runs.map(function(run) {
    return SL_STANDARD_FIELDS.map(function(field) {
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

      return SL_resultValue(run, field.field);
    });
  });

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  SL_writeRowsInChunks(sheet, 2, rows, headers.length);

  const missingIdentity = runs.filter(function(run) {
    return SL_resultValue(run, "cadre") === SL_UNSPECIFIED &&
      SL_resultValue(run, "county") === SL_UNSPECIFIED;
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
function SL_mergeSheets(sheetNames) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let masterSheet = ss.getSheetByName(SL_MASTER_SHEET_NAME);

  if (!masterSheet) {
    masterSheet = ss.insertSheet(SL_MASTER_SHEET_NAME);
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

    const contactIdx = SL_findHeaderIndex(headerRow, ["contact uuid"]);
    const dateIdx = SL_findHeaderIndex(headerRow, ["date submitted", "started"]);
    const menteeIdx = SL_findHeaderIndex(headerRow, ["mentee id", "urn value", "urn"]);
    const cadreIdx = SL_findHeaderIndex(headerRow, ["cadre", "field:cadre"]);
    const countyIdx = SL_findHeaderIndex(headerRow, ["county", "field:county"]);
    const facilityIdx = SL_findHeaderIndex(
      headerRow,
      ["facility", "field:facility name", "facility name"]
    );
    const preIdx = SL_findHeaderIndex(headerRow, ["pretest score"]);
    const postIdx = SL_findHeaderIndex(headerRow, ["posttest score"]);

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
      // Avoid combining every blank Mentee ID into one false "person".
      const menteeKey = menteeID
        ? `id:${menteeID}`
        : (contactUUID ? `contact:${contactUUID}` : `row:${sheetName}:${i}`);

      const preScore = SL_parseScore(source[preIdx]);
      const postScore = SL_parseScore(source[postIdx]);
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
          source[cadreIdx] || SL_UNSPECIFIED,
          source[countyIdx] || SL_UNSPECIFIED,
          source[facilityIdx] || SL_UNSPECIFIED,
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
    if (!menteeModules[item.menteeKey]) menteeModules[item.menteeKey] = {};
    menteeModules[item.menteeKey][item.module] = true;
  });

  // Always require all 11 configured modules. Using sheetNames.length would
  // falsely lower the completion threshold when a module has no records.
  const totalModules = Object.keys(SL_FLOWS).length;
  const rows = allData.map(function(item) {
    const moduleCount = Object.keys(menteeModules[item.menteeKey]).length;
    item.row[12] = moduleCount === totalModules ? "Completed" : "In Progress";
    return item.row;
  });

  masterSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  SL_writeRowsInChunks(masterSheet, 2, rows, headers.length);
  SpreadsheetApp.flush();

  Logger.log(
    `✔ Merged ${sheetNames.length} populated self-led sheets into ` +
    `${SL_MASTER_SHEET_NAME} (${rows.length} rows)`
  );
}

/**************** ARCHIVED (HISTORICAL) RUNS ****************/
// RapidPro moves older runs out of /runs.json. Run this repeatedly until it
// reports no archives remaining, then run importDeltaSelfLedLearning().
function backfillSelfLedArchivedRuns() {
  const startedAt = Date.now();
  const properties = PropertiesService.getScriptProperties();
  const completed = JSON.parse(
    properties.getProperty(SL_ARCHIVE_PROGRESS_KEY) || "[]"
  );
  const archives = SL_listRunArchives().filter(function(archive) {
    return completed.indexOf(SL_archiveKey(archive)) === -1;
  });

  if (archives.length === 0) {
    Logger.log("✔ No Self-led archives left to process.");
    return;
  }

  const sheet = SL_getSheet(SL_ARCHIVE_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, SL_ARCHIVE_HEADERS.length)
      .setValues([SL_ARCHIVE_HEADERS]);
  }

  const stagedRunIds = SL_readStagedRunIds(sheet);
  let appended = 0;
  let processed = 0;
  let failed = 0;

  Logger.log(
    `Processing ${archives.length} remaining Self-led archive(s) from ` +
    `${SL_ARCHIVE_START_DATE}`
  );

  for (const archive of archives) {
    if (Date.now() - startedAt > SL_ARCHIVE_TIME_BUDGET_MS) break;

    const result = SL_readArchiveRows(archive, stagedRunIds);
    if (!result.ok) {
      failed++;
      if (result.fatal) break;
      continue;
    }

    if (result.rows.length > 0) {
      SL_writeRowsInChunks(
        sheet,
        sheet.getLastRow() + 1,
        result.rows,
        SL_ARCHIVE_HEADERS.length
      );
      SpreadsheetApp.flush();
      appended += result.rows.length;
    }

    completed.push(SL_archiveKey(archive));
    properties.setProperty(
      SL_ARCHIVE_PROGRESS_KEY,
      JSON.stringify(completed)
    );
    processed++;
    Logger.log(
      `  ${archive.period} ${archive.start_date}: staged ` +
      `${result.rows.length} Self-led run(s)`
    );
  }

  const remaining = archives.length - processed - failed;
  Logger.log(
    `✔ Staged ${appended} Self-led run(s) from ${processed} archive(s).` +
    (failed ? ` ${failed} archive(s) could not be downloaded.` : "") +
    (remaining
      ? ` ${remaining} archive(s) remain — run backfillSelfLedArchivedRuns() again.`
      : "")
  );
}

function resetSelfLedArchiveBackfill() {
  PropertiesService.getScriptProperties()
    .deleteProperty(SL_ARCHIVE_PROGRESS_KEY);
  Logger.log("✔ Self-led archive progress reset.");
}

function SL_listRunArchives() {
  return SL_fetchAllPages(
    `${SL_BASE_URL}/archives.json?archive_type=run`
  )
    .filter(function(archive) {
      return archive.record_count > 0 &&
        archive.start_date >= SL_ARCHIVE_START_DATE;
    })
    .sort(function(a, b) {
      return a.start_date < b.start_date ? -1 : 1;
    });
}

function SL_archiveKey(archive) {
  return `${archive.period}:${archive.start_date}`;
}

function SL_readArchiveRows(archive, stagedRunIds) {
  const response = UrlFetchApp.fetch(archive.download_url, {
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    const body = response.getContentText();
    Logger.log(
      `⚠ Could not download Self-led ${SL_archiveKey(archive)}: ` +
      `HTTP ${response.getResponseCode()}. ${body.slice(0, 200)}`
    );

    const signingRejected = body.indexOf("AWS4-HMAC-SHA256") !== -1;
    if (signingRejected) {
      Logger.log(
        "⚠ RapidPro is generating obsolete AWS SigV2 archive links. " +
        "The workspace administrator must configure SigV4 signing (or supply " +
        "the archives directly) before Self-led history can be imported."
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
    if (!SL_FLOWS[flowUUID]) return;

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
      SL_resultValue(run, "pre_score"),
      SL_resultValue(run, "final_score")
    ]);
  });

  return { ok: true, rows: rows };
}

function SL_readStagedRunIds(sheet) {
  const ids = {};
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return ids;

  sheet.getRange(2, 1, lastRow - 1, 1).getValues()
    .forEach(function(row) {
      if (row[0] !== "") ids[String(row[0])] = true;
    });

  return ids;
}

let SL_stagedRunsByFlow = null;

function SL_getStagedRuns(flowUUID) {
  if (SL_stagedRunsByFlow === null) {
    SL_stagedRunsByFlow = {};

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SL_ARCHIVE_SHEET_NAME);
    const lastRow = sheet ? sheet.getLastRow() : 0;

    if (lastRow > 1) {
      sheet.getRange(
        2,
        1,
        lastRow - 1,
        SL_ARCHIVE_HEADERS.length
      ).getValues().forEach(function(row) {
        const flowUUID = row[1];
        if (!flowUUID) return;

        if (!SL_stagedRunsByFlow[flowUUID]) {
          SL_stagedRunsByFlow[flowUUID] = [];
        }

        SL_stagedRunsByFlow[flowUUID].push({
          id: row[0],
          contact: {
            uuid: row[2],
            name: row[3],
            urn: row[4]
          },
          created_on: SL_toIsoString(row[5]),
          modified_on: SL_toIsoString(row[6]),
          values: {
            pre_score: { value: row[7] },
            final_score: { value: row[8] }
          }
        });
      });
    }
  }

  return SL_stagedRunsByFlow[flowUUID] || [];
}

function SL_mergeRunsById(archivedRuns, liveRuns) {
  const merged = [];
  const seen = {};

  liveRuns.concat(archivedRuns).forEach(function(run) {
    const runId = String(run.id);
    if (seen[runId]) return;
    seen[runId] = true;
    merged.push(run);
  });

  return merged;
}

/**************** CONTACT IDENTITY ****************/
let SL_contactIdentityCache = null;
let SL_contactLookupStartedAt = null;

function SL_enrichWithContactIdentity(runs) {
  SL_cacheContactIdentities(runs.map(function(run) {
    return run.contact && run.contact.uuid;
  }));

  return runs.map(function(run) {
    const contactUUID = run.contact && run.contact.uuid;
    const identity = SL_contactIdentityCache[contactUUID] || {};

    return Object.assign({}, run, {
      values: Object.assign({}, run.values || {}, {
        cadre: { value: SL_firstValue(identity.cadre) },
        county: { value: SL_firstValue(identity.county) },
        facility_name: { value: SL_firstValue(identity.facility_name) }
      })
    });
  });
}

function SL_cacheContactIdentities(contactUUIDs) {
  const sheet = SL_loadContactIdentityCache();
  const pending = contactUUIDs
    .filter(function(uuid) {
      return uuid && !Object.prototype.hasOwnProperty.call(
        SL_contactIdentityCache,
        uuid
      );
    })
    .filter(function(uuid, index, list) {
      return list.indexOf(uuid) === index;
    });

  if (pending.length === 0) return;
  if (SL_contactLookupStartedAt === null) {
    SL_contactLookupStartedAt = Date.now();
  }

  const requestChunkSize = 25;
  const newRows = [];
  let lookedUp = 0;

  for (let i = 0; i < pending.length; i += requestChunkSize) {
    if (
      Date.now() - SL_contactLookupStartedAt >
      SL_CONTACT_LOOKUP_BUDGET_MS
    ) break;

    const chunk = pending.slice(i, i + requestChunkSize);
    const responses = UrlFetchApp.fetchAll(chunk.map(function(uuid) {
      return {
        url: `${SL_BASE_URL}/contacts.json?uuid=${encodeURIComponent(uuid)}`,
        headers: { Authorization: `Token ${SL_API_TOKEN}` },
        muteHttpExceptions: true
      };
    }));

    responses.forEach(function(response, index) {
      const uuid = chunk[index];
      const identity = {};

      if (response.getResponseCode() === 200) {
        const results = JSON.parse(response.getContentText()).results || [];
        const fields = (results[0] && results[0].fields) || {};

        Object.keys(SL_IDENTITY_FIELD_KEYS).forEach(function(target) {
          const candidates = SL_IDENTITY_FIELD_KEYS[target].map(function(key) {
            return fields[key];
          });
          const value = SL_firstValue.apply(null, candidates);
          if (value !== SL_UNSPECIFIED) identity[target] = value;
        });
      } else {
        Logger.log(
          `⚠ Self-led contact lookup failed for ${uuid}: ` +
          `HTTP ${response.getResponseCode()}`
        );
      }

      SL_contactIdentityCache[uuid] = identity;
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
    SL_writeRowsInChunks(
      sheet,
      sheet.getLastRow() + 1,
      newRows,
      SL_CONTACT_HEADERS.length
    );
  }

  if (lookedUp < pending.length) {
    Logger.log(
      `⚠ Looked up ${lookedUp} of ${pending.length} new Self-led contacts; ` +
      "run importDeltaSelfLedLearning() again to resolve the rest."
    );
  }
}

function SL_loadContactIdentityCache() {
  const sheet = SL_getSheet(SL_CONTACT_SHEET_NAME);

  if (SL_contactIdentityCache === null) {
    SL_contactIdentityCache = {};

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, SL_CONTACT_HEADERS.length)
        .setValues([SL_CONTACT_HEADERS]);
    } else if (sheet.getLastRow() > 1) {
      sheet.getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        SL_CONTACT_HEADERS.length
      ).getValues().forEach(function(row) {
        if (!row[0]) return;
        const identity = {};
        if (row[1]) identity.cadre = row[1];
        if (row[2]) identity.county = row[2];
        if (row[3]) identity.facility_name = row[3];
        SL_contactIdentityCache[String(row[0])] = identity;
      });
    }
  }

  return sheet;
}

function resetSelfLedContactIdentityCache() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SL_CONTACT_SHEET_NAME);
  if (sheet) sheet.clear();
  SL_contactIdentityCache = null;
  Logger.log("✔ Self-led contact identity cache reset.");
}

/**************** HELPERS ****************/
function SL_resetExecutionCaches() {
  SL_stagedRunsByFlow = null;
  SL_contactIdentityCache = null;
  SL_contactLookupStartedAt = null;
}

function SL_get(url) {
  const response = UrlFetchApp.fetch(url, {
    headers: { Authorization: `Token ${SL_API_TOKEN}` },
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

function SL_fetchAllPages(url) {
  let next = SL_addQueryParameter(url, "page_size", SL_RECORD_CHUNK_SIZE);
  const results = [];
  let pageNumber = 0;

  while (next) {
    const data = SL_get(next);
    const pageResults = data.results || [];
    Array.prototype.push.apply(results, pageResults);
    pageNumber++;
    Logger.log(
      `Self-led page ${pageNumber}: ${pageResults.length} records ` +
      `(${results.length} total)`
    );
    next = data.next || null;
  }

  return results;
}

function SL_addQueryParameter(url, key, value) {
  const encodedKey = encodeURIComponent(key);
  const pattern = new RegExp(`([?&])${encodedKey}=`);
  if (pattern.test(url)) return url;

  return `${url}${url.indexOf("?") === -1 ? "?" : "&"}` +
    `${encodedKey}=${encodeURIComponent(value)}`;
}

function SL_writeRowsInChunks(sheet, startRow, rows, columnCount) {
  for (let i = 0; i < rows.length; i += SL_RECORD_CHUNK_SIZE) {
    const chunk = rows.slice(i, i + SL_RECORD_CHUNK_SIZE);
    sheet.getRange(startRow + i, 1, chunk.length, columnCount)
      .setValues(chunk);
  }
}

function SL_getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function SL_findHeaderIndex(headerRow, aliases) {
  for (const alias of aliases) {
    const index = headerRow.indexOf(alias);
    if (index !== -1) return index;
  }
  return -1;
}

function SL_parseScore(value) {
  const score = parseFloat(value);
  return isNaN(score) || !isFinite(score) ? "" : score;
}

function SL_resultValue(run, key) {
  const result = run.values && run.values[key];
  if (result === undefined || result === null) return "";

  const value = typeof result === "object" ? result.value : result;
  return value === undefined || value === null ? "" : value;
}

function SL_toIsoString(value) {
  if (value instanceof Date) return value.toISOString();
  return value ? String(value) : "";
}

const SL_ERROR_LITERAL =
  /^#(REF|NUM|N\/A|VALUE|DIV\/0|NAME|NULL)[!?]?$/i;

function SL_firstValue() {
  for (let i = 0; i < arguments.length; i++) {
    const candidate = arguments[i];
    if (candidate === undefined || candidate === null) continue;
    const value = String(candidate).trim();
    if (value && !SL_ERROR_LITERAL.test(value)) return value;
  }
  return SL_UNSPECIFIED;
}
