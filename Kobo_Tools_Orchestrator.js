// =====================================================
// Kobo Tools Orchestrator
// Shared pipeline for all curriculum / assessment Kobo form builders.
//
// Apps Script project file order (recommended):
//   1) kobocreator.js
//   2) Kobo_Tools_Orchestrator.js  ← this file (ONLY onOpen / trigger)
//   3) EmONC_Curriculum_Tracking_Form_2026.js
//   4) Newborn_Curriculum_Tracking_Form.js
//   5) MoH_Skills_Assessment_Checklist.js
//   6) Newborn_Knowledge_Assessment.js
//   7) EmONC_Knowledge_Assessment.js
//   8) Kobo_Tools_Deployer.js  (upload/deploy; refresh skips deploy if missing)
//
// Trigger / menu should call ONLY refreshAllKoboTools().
// Sequence (always in this order):
//   0) Acquire a lock; initialize missing config; validate every dependency
//   1) Sync external Mentee Database 2026 → local "Mentee Database"
//   2) Sync external Mentor (IFM) Database 2026 → local "IFM List"
//   3) Run kobocreator.js generateAllOutputs()
//   4) Create/update every registered Kobo form tool
//   5) Upload / deploy only forms successfully built in this run
// =====================================================

// Script Properties — Mentee Database 2026
var KOBO_TOOLS_PROP_SOURCE_ID = "MENTEE_DATABASE_2026_SPREADSHEET_ID";
var KOBO_TOOLS_PROP_SOURCE_SHEET = "MENTEE_DATABASE_2026_SHEET_NAME";

var KOBO_TOOLS_DEFAULT_SOURCE_ID =
  "1W6YzsLt8BKIWkZvCT-Ggvs3CtA2GBnW7ggSfujlJypA";
var KOBO_TOOLS_DEFAULT_SOURCE_SHEET = "Mentee Database";
var KOBO_TOOLS_LOCAL_MENTEE_SHEET = "Mentee Database";

// Script Properties — Mentor (IFM) Database 2026
var KOBO_TOOLS_PROP_IFM_SOURCE_ID = "MENTOR_IFM_DATABASE_2026_SPREADSHEET_ID";
var KOBO_TOOLS_PROP_IFM_SOURCE_SHEET = "MENTOR_IFM_DATABASE_2026_SHEET_NAME";
var KOBO_TOOLS_PROP_IFM_SOURCE_GID = "MENTOR_IFM_DATABASE_2026_SHEET_GID";

var KOBO_TOOLS_DEFAULT_IFM_SOURCE_ID =
  "1VPz5l3LwbMvwjEWv55c-4Fftm2sz7JCgZlX2TYwm0PY";
var KOBO_TOOLS_DEFAULT_IFM_SOURCE_SHEET = "Mentor (IFM) Database 2026";
var KOBO_TOOLS_DEFAULT_IFM_SOURCE_GID = 586824847;
var KOBO_TOOLS_LOCAL_IFM_SHEET = "IFM List";

/**
 * Register each form builder here as you add tools.
 * buildFnName must match a global function in another Apps Script file.
 */
function getKoboToolsRegistry_() {
  return [
    {
      id: "emonc_ctf",
      label: "EmONC Curriculum Tracking Form",
      buildFnName: "createEmONCCurriculumTrackingForm2026",
      enabled: true
    },
    {
      id: "newborn_ctf",
      label: "Newborn Curriculum Tracking Form",
      buildFnName: "createNewbornCurriculumTrackingForm",
      enabled: true
    },
    {
      id: "moh_sac",
      label: "MoH Skills Assessment Checklist",
      buildFnName: "createMoHSkillsAssessmentChecklist",
      enabled: true
    },
    {
      id: "newborn_ka",
      label: "Newborn Knowledge Assessment",
      buildFnName: "createNewbornKnowledgeAssessment",
      enabled: true
    },
    {
      id: "emonc_ka",
      label: "MoH Mentee EmONC Knowledge Assessment",
      buildFnName: "createEmONCKnowledgeAssessment",
      enabled: true
    }
    // Add more tools below as needed.
  ];
}

/**
 * Unified spreadsheet menu for all Kobo tools.
 * Keep this as the ONLY onOpen in the project (remove per-tool onOpen).
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Kobo Tools")
    .addItem("Run Full Pipeline", "refreshAllKoboTools")
    .addSeparator()
    .addItem("Install Weekly Auto-Refresh", "installKoboToolsWeeklyTrigger")
    .addItem("Install Daily Auto-Refresh", "installKoboToolsDailyTrigger")
    .addItem("Remove Auto-Refresh", "removeKoboToolsTriggers")
    .addToUi();
}

/**
 * One-time setup: store external Mentee + Mentor (IFM) Database 2026 IDs.
 */
function setupKoboToolsSource() {
  setKoboToolsSourceConfig(KOBO_TOOLS_DEFAULT_SOURCE_ID);
  setKoboToolsIFMSourceConfig(
    KOBO_TOOLS_DEFAULT_IFM_SOURCE_ID,
    KOBO_TOOLS_DEFAULT_IFM_SOURCE_SHEET,
    KOBO_TOOLS_DEFAULT_IFM_SOURCE_GID
  );
}

/**
 * Store mentee source spreadsheet ID (and optional sheet name).
 *   setKoboToolsSourceConfig("1abc...xyz");
 *   setKoboToolsSourceConfig("1abc...xyz", "Mentee Database");
 */
function setKoboToolsSourceConfig(sourceSpreadsheetId, sheetName) {
  if (!sourceSpreadsheetId) {
    sourceSpreadsheetId = KOBO_TOOLS_DEFAULT_SOURCE_ID;
  }
  if (!sourceSpreadsheetId) {
    throw new Error("sourceSpreadsheetId is required.");
  }

  var props = PropertiesService.getScriptProperties();
  props.setProperty(KOBO_TOOLS_PROP_SOURCE_ID, String(sourceSpreadsheetId).trim());

  if (sheetName) {
    props.setProperty(KOBO_TOOLS_PROP_SOURCE_SHEET, String(sheetName).trim());
  }

  Logger.log(
    "Saved Mentee Database 2026 source ID: " + sourceSpreadsheetId
  );
}

/**
 * Store Mentor (IFM) Database 2026 source spreadsheet ID.
 * Optional sheetName and/or sheetGid (tab gid from the Sheets URL).
 *   setKoboToolsIFMSourceConfig("1VPz5...");
 *   setKoboToolsIFMSourceConfig("1VPz5...", "Mentor (IFM) Database 2026", 586824847);
 */
function setKoboToolsIFMSourceConfig(sourceSpreadsheetId, sheetName, sheetGid) {
  if (!sourceSpreadsheetId) {
    sourceSpreadsheetId = KOBO_TOOLS_DEFAULT_IFM_SOURCE_ID;
  }
  if (!sourceSpreadsheetId) {
    throw new Error("IFM sourceSpreadsheetId is required.");
  }

  var props = PropertiesService.getScriptProperties();
  props.setProperty(
    KOBO_TOOLS_PROP_IFM_SOURCE_ID,
    String(sourceSpreadsheetId).trim()
  );

  if (sheetName) {
    props.setProperty(
      KOBO_TOOLS_PROP_IFM_SOURCE_SHEET,
      String(sheetName).trim()
    );
  }

  if (sheetGid != null && sheetGid !== "") {
    props.setProperty(
      KOBO_TOOLS_PROP_IFM_SOURCE_GID,
      String(sheetGid).trim()
    );
  } else if (!props.getProperty(KOBO_TOOLS_PROP_IFM_SOURCE_GID)) {
    props.setProperty(
      KOBO_TOOLS_PROP_IFM_SOURCE_GID,
      String(KOBO_TOOLS_DEFAULT_IFM_SOURCE_GID)
    );
  }

  Logger.log(
    "Saved Mentor (IFM) Database 2026 source ID: " + sourceSpreadsheetId
  );
}

/**
 * MASTER PIPELINE — call this from the trigger / menu.
 * Do NOT put separate triggers on sync, kobocreator, individual builders,
 * or the Kobo deployer.
 */
function refreshAllKoboTools() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    Logger.log("Kobo Tools pipeline skipped — another run is already active.");
    return { status: "skipped_concurrent_run" };
  }

  try {
    Logger.log("=== Kobo Tools full pipeline started ===");

    // 0) Initialize missing config and fail early on missing code/token access
    ensureKoboToolsConfigured_();
    validateKoboPipelineDependencies_();

    // 1) Sync mentee database first
    syncMenteeDatabaseFromSource();

    // 2) Sync IFM mentor database → local IFM List
    syncIFMListFromSource();

    // 3) Run kobocreator generators (shared intermediate sheets)
    Logger.log("Running kobocreator generateAllOutputs()...");
    generateAllOutputs();
    Logger.log("kobocreator complete.");

    // 4) Build / update every registered form
    var buildResults = buildRegisteredKoboTools_();

    // 5) Deploy only forms that were successfully built in this run
    var deployResults = deployRegisteredKoboTools_(buildResults);

    var summary = {
      status: hasKoboPipelineErrors_(buildResults, deployResults)
        ? "completed_with_errors"
        : "ok",
      build: buildResults,
      deploy: deployResults
    };

    Logger.log("=== Kobo Tools full pipeline finished: " + summary.status + " ===");
    Logger.log(JSON.stringify(summary));
    return summary;
  } catch (err) {
    Logger.log("=== Kobo Tools full pipeline FAILED ===");
    Logger.log(String(err && err.stack ? err.stack : err));
    throw err;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Step 0a: initialize configuration without overwriting existing custom source
 * settings. The deployer setup is invoked on every run so its embedded token,
 * server, initial form IDs and initial asset UIDs are applied automatically.
 */
function ensureKoboToolsConfigured_() {
  var props = PropertiesService.getScriptProperties();

  if (!props.getProperty(KOBO_TOOLS_PROP_SOURCE_ID)) {
    props.setProperty(KOBO_TOOLS_PROP_SOURCE_ID, KOBO_TOOLS_DEFAULT_SOURCE_ID);
  }
  if (!props.getProperty(KOBO_TOOLS_PROP_SOURCE_SHEET)) {
    props.setProperty(
      KOBO_TOOLS_PROP_SOURCE_SHEET,
      KOBO_TOOLS_DEFAULT_SOURCE_SHEET
    );
  }
  if (!props.getProperty(KOBO_TOOLS_PROP_IFM_SOURCE_ID)) {
    props.setProperty(
      KOBO_TOOLS_PROP_IFM_SOURCE_ID,
      KOBO_TOOLS_DEFAULT_IFM_SOURCE_ID
    );
  }
  if (!props.getProperty(KOBO_TOOLS_PROP_IFM_SOURCE_SHEET)) {
    props.setProperty(
      KOBO_TOOLS_PROP_IFM_SOURCE_SHEET,
      KOBO_TOOLS_DEFAULT_IFM_SOURCE_SHEET
    );
  }
  if (!props.getProperty(KOBO_TOOLS_PROP_IFM_SOURCE_GID)) {
    props.setProperty(
      KOBO_TOOLS_PROP_IFM_SOURCE_GID,
      String(KOBO_TOOLS_DEFAULT_IFM_SOURCE_GID)
    );
  }

  var setupDeployFn = resolveGlobalFunction_("setupKoboDeployConfig");
  if (!setupDeployFn) {
    throw new Error(
      "Kobo_Tools_Deployer.js is missing: setupKoboDeployConfig() not found."
    );
  }

  try {
    setupDeployFn();
  } catch (err) {
    var tokenProp =
      typeof KOBO_DEPLOY_PROP_API_TOKEN !== "undefined"
        ? KOBO_DEPLOY_PROP_API_TOKEN
        : "KOBO_KPI_API_TOKEN";
    if (!props.getProperty(tokenProp)) {
      throw err;
    }
    Logger.log(
      "Kobo setup warning (using already-saved deployment config): " +
      err.message
    );
  }
  Logger.log("Source and Kobo deployment configuration ready.");
}

/**
 * Step 0b: verify all code and deploy credentials before touching source data.
 * This prevents a long sync/build run that can never deploy.
 */
function validateKoboPipelineDependencies_() {
  var requiredFunctions = [
    "generateAllOutputs",
    "deployKoboTool",
    "testKoboConnection"
  ];
  var registry = getKoboToolsRegistry_();
  var i;

  for (i = 0; i < registry.length; i++) {
    if (registry[i].enabled) {
      requiredFunctions.push(registry[i].buildFnName);
    }
  }

  var sourceFiles = {
    generateAllOutputs: "kobocreator.js",
    deployKoboTool: "Kobo_Tools_Deployer.js",
    testKoboConnection: "Kobo_Tools_Deployer.js",
    createEmONCCurriculumTrackingForm2026:
      "EmONC_Curriculum_Tracking_Form_2026.js",
    createNewbornCurriculumTrackingForm: "Newborn_Curriculum_Tracking_Form.js",
    createMoHSkillsAssessmentChecklist: "MoH_Skills_Assessment_Checklist.js",
    createNewbornKnowledgeAssessment: "Newborn_Knowledge_Assessment.js",
    createEmONCKnowledgeAssessment: "EmONC_Knowledge_Assessment.js"
  };

  var missing = [];
  for (i = 0; i < requiredFunctions.length; i++) {
    var fnName = requiredFunctions[i];
    if (!resolveGlobalFunction_(fnName)) {
      var file = sourceFiles[fnName];
      missing.push(fnName + "()" + (file ? " from " + file : ""));
    }
  }
  if (missing.length) {
    throw new Error(
      "Kobo pipeline cannot start. Add the missing file(s) to this Apps Script " +
      "project: " + missing.join("; ")
    );
  }

  var tokenProp =
    typeof KOBO_DEPLOY_PROP_API_TOKEN !== "undefined"
      ? KOBO_DEPLOY_PROP_API_TOKEN
      : "KOBO_KPI_API_TOKEN";
  if (!PropertiesService.getScriptProperties().getProperty(tokenProp)) {
    throw new Error(
      "Kobo API token is missing after setup. Put the token in " +
      "setupKoboDeployConfig() in Kobo_Tools_Deployer.js."
    );
  }

  resolveGlobalFunction_("testKoboConnection")();
  Logger.log("Pipeline preflight complete: code, server and token verified.");
}

/**
 * Step 5: deploy only tools whose builder returned status "ok" in this run.
 * This prevents a failed builder from redeploying a stale spreadsheet.
 */
function deployRegisteredKoboTools_(buildResults) {
  var deployFn = resolveGlobalFunction_("deployKoboTool");
  var results = [];

  for (var i = 0; i < buildResults.length; i++) {
    var build = buildResults[i];
    if (build.status !== "ok") {
      results.push({
        toolId: build.id,
        label: build.label,
        status: "skipped_build_failed"
      });
      continue;
    }

    try {
      Logger.log("Deploying: " + build.label + "...");
      var out = deployFn(build.id, false);
      results.push({
        toolId: build.id,
        label: build.label,
        status: "ok",
        assetUid: out.assetUid
      });
    } catch (err) {
      Logger.log("DEPLOY FAILED: " + build.label + " — " + err.message);
      results.push({
        toolId: build.id,
        label: build.label,
        status: "error",
        error: String(err.message || err)
      });
    }
  }

  return results;
}

function hasKoboPipelineErrors_(buildResults, deployResults) {
  var all = buildResults.concat(deployResults);
  for (var i = 0; i < all.length; i++) {
    if (
      all[i].status === "error" ||
      all[i].status === "skipped_missing_function" ||
      all[i].status === "skipped_build_failed"
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Step 1: Copy external Mentee Database 2026 → local "Mentee Database".
 * Excludes Status=Inactive and normalizes Program
 * "EmONC Curriculum" → "MENTORS Curriculum".
 */
function syncMenteeDatabaseFromSource() {
  var props = PropertiesService.getScriptProperties();
  var sourceId =
    props.getProperty(KOBO_TOOLS_PROP_SOURCE_ID) ||
    KOBO_TOOLS_DEFAULT_SOURCE_ID;

  if (!sourceId) {
    throw new Error(
      "Mentee Database 2026 spreadsheet ID is not configured. " +
      "Run setupKoboToolsSource() first."
    );
  }

  var sourceSs = SpreadsheetApp.openById(sourceId);
  var sourceSheetName =
    props.getProperty(KOBO_TOOLS_PROP_SOURCE_SHEET) ||
    KOBO_TOOLS_DEFAULT_SOURCE_SHEET;

  var sourceSheet = sourceSs.getSheetByName(sourceSheetName);
  if (!sourceSheet) {
    sourceSheet = sourceSs.getSheets()[0];
  }
  if (!sourceSheet) {
    throw new Error("No sheets found in Mentee Database 2026 spreadsheet.");
  }

  var values = sourceSheet.getDataRange().getValues();
  if (!values || values.length === 0) {
    throw new Error("Mentee Database 2026 source sheet is empty.");
  }

  var statusFilter = filterInactiveRows_(values, "Mentee Database 2026");
  values = statusFilter.values;
  var programNormalize = normalizeSourceProgramValues_(values);
  values = programNormalize.values;

  var localSs = SpreadsheetApp.getActiveSpreadsheet();
  var localSheet = localSs.getSheetByName(KOBO_TOOLS_LOCAL_MENTEE_SHEET);
  if (!localSheet) {
    localSheet = localSs.insertSheet(KOBO_TOOLS_LOCAL_MENTEE_SHEET);
  }

  // Clear dropdown / validation rules that can block overwrite
  var fullRange = localSheet.getRange(
    1,
    1,
    localSheet.getMaxRows(),
    localSheet.getMaxColumns()
  );
  fullRange.clearDataValidations();

  var filter = localSheet.getFilter();
  if (filter) {
    filter.remove();
  }

  localSheet.clearContents();
  localSheet
    .getRange(1, 1, values.length, values[0].length)
    .setValues(values);

  Logger.log(
    "Synced " + (values.length - 1) +
    " mentee rows from '" + sourceSheet.getName() + "' into '" +
    KOBO_TOOLS_LOCAL_MENTEE_SHEET + "'. " +
    "Excluded " + statusFilter.removed + " Status=Inactive row(s). " +
    "Converted Program 'EmONC Curriculum' → 'MENTORS Curriculum' on " +
    programNormalize.converted + " row(s)."
  );

  return localSheet;
}

function normalizeSourceProgramValues_(values) {
  var converted = 0;
  if (!values || values.length < 2) {
    return { values: values, converted: converted };
  }

  var header = values[0];
  var programIndex = -1;
  for (var c = 0; c < header.length; c++) {
    if (String(header[c]).trim() === "Program") {
      programIndex = c;
      break;
    }
  }

  if (programIndex === -1) {
    throw new Error("Source Mentee Database is missing a 'Program' column.");
  }

  for (var i = 1; i < values.length; i++) {
    var raw = values[i][programIndex];
    var cleaned = String(raw == null ? "" : raw).trim();
    if (cleaned.toLowerCase() === "emonc curriculum") {
      values[i][programIndex] = "MENTORS Curriculum";
      converted++;
    }
  }

  return { values: values, converted: converted };
}

/**
 * Keep the header and every record except Status=Inactive.
 * Status comparison is trimmed and case-insensitive; blank/other statuses stay.
 */
function filterInactiveRows_(values, sourceLabel) {
  if (!values || !values.length) {
    return { values: values, removed: 0 };
  }

  var statusIndex = findCaseInsensitiveHeaderIndex_(values[0], "Status");
  if (statusIndex === -1) {
    throw new Error(
      sourceLabel + " is missing the 'Status' column required for syncing."
    );
  }

  var output = [values[0]];
  var removed = 0;

  for (var i = 1; i < values.length; i++) {
    var status = String(
      values[i][statusIndex] == null ? "" : values[i][statusIndex]
    ).trim().toLowerCase();

    if (status === "inactive") {
      removed++;
      continue;
    }
    output.push(values[i]);
  }

  return { values: output, removed: removed };
}

function findCaseInsensitiveHeaderIndex_(header, name) {
  var wanted = String(name).trim().toLowerCase();
  for (var i = 0; i < header.length; i++) {
    if (
      String(header[i] == null ? "" : header[i]).trim().toLowerCase() === wanted
    ) {
      return i;
    }
  }
  return -1;
}

/**
 * Step 2: Copy external Mentor (IFM) Database 2026 → local "IFM List".
 * Excludes every posting whose Status is Inactive.
 * Chooses the source tab with real mentor rows (gid preferred, then best match).
 *
 * Downstream consumers (kobocreator) — ALL read local IFM List only:
 *   IFM List → IFM List (Choices)
 *   IFM List → Survey Sheet (IFM)
 *   IFM List → IFM Assessment Facilities List (Choices)
 */
function syncIFMListFromSource() {
  var props = PropertiesService.getScriptProperties();
  var sourceId =
    props.getProperty(KOBO_TOOLS_PROP_IFM_SOURCE_ID) ||
    KOBO_TOOLS_DEFAULT_IFM_SOURCE_ID;

  if (!sourceId) {
    throw new Error(
      "Mentor (IFM) Database 2026 spreadsheet ID is not configured. " +
      "Run setupKoboToolsSource() first."
    );
  }

  var sourceSs = SpreadsheetApp.openById(sourceId);
  var selected = selectIFMSourceTable_(sourceSs, props);

  if (!selected || !selected.values || selected.values.length < 2) {
    throw new Error(
      "Mentor (IFM) Database 2026 (" +
      sourceId +
      ") has no usable IFM table with Mentor ID/IFM ID, county, Facility, " +
      "Facility Code and at least one filled data row. " +
      (selected && selected.scanLog ? selected.scanLog : "")
    );
  }

  var values = selected.values;
  var sourceUsableRows = countIFMUsableRows_(values);

  if (sourceUsableRows < 1) {
    throw new Error(
      "Selected IFM source sheet '" +
      selected.sheetName +
      "' has headers but 0 rows with county + Facility + Facility Code filled. " +
      "Headers: [" +
      values[0].join(" | ") +
      "]."
    );
  }

  // Map Mentor (IFM) Database headers → original kobocreator IFM List names
  // so generateIFM* can keep using County / IFM ID / Status / etc.
  values = normalizeIFMListHeadersForKobocreator_(values);
  var statusFilter = filterInactiveRows_(
    values,
    "Mentor (IFM) Database 2026"
  );
  values = statusFilter.values;
  var usableRows = countIFMUsableRows_(values);
  var header = values[0];

  var localSs = SpreadsheetApp.getActiveSpreadsheet();
  var localSheet = localSs.getSheetByName(KOBO_TOOLS_LOCAL_IFM_SHEET);
  if (!localSheet) {
    localSheet = localSs.insertSheet(KOBO_TOOLS_LOCAL_IFM_SHEET);
  }

  var fullRange = localSheet.getRange(
    1,
    1,
    localSheet.getMaxRows(),
    localSheet.getMaxColumns()
  );
  fullRange.clearDataValidations();

  var filter = localSheet.getFilter();
  if (filter) {
    filter.remove();
  }

  localSheet.clearContents();
  localSheet
    .getRange(1, 1, values.length, values[0].length)
    .setValues(values);

  Logger.log(
    "Synced IFM List from '" +
    selected.sheetName +
    "' (gid=" +
    selected.sheetId +
    ", spreadsheet " +
    sourceId +
    "): " +
    (values.length - 1) +
    " row(s), " +
    usableRows +
    " with County/Facility/Facility Code. Excluded " +
    statusFilter.removed +
    " Status=Inactive posting(s). " +
    "Normalized headers: [" +
    header.join(" | ") +
    "]"
  );

  return localSheet;
}

/**
 * Rename Mentor (IFM) Database 2026 headers to the names kobocreator expects.
 *   county     → County
 *   Mentor ID  → IFM ID
 * Other familiar names (Facility, Facility Code, Name, Status) stay as-is.
 */
function normalizeIFMListHeadersForKobocreator_(values) {
  if (!values || !values.length) return values;

  var header = values[0];
  var mapped = [];

  for (var c = 0; c < header.length; c++) {
    var raw = String(header[c] == null ? "" : header[c]).trim();
    var key = raw.toLowerCase();

    if (key === "county") {
      mapped.push("County");
    } else if (
      key === "mentor id" ||
      key === "mentorid" ||
      key === "ifm id"
    ) {
      mapped.push("IFM ID");
    } else if (key === "facility code") {
      mapped.push("Facility Code");
    } else if (key === "facility") {
      mapped.push("Facility");
    } else if (key === "name") {
      mapped.push("Name");
    } else if (key === "status") {
      mapped.push("Status");
    } else {
      mapped.push(raw);
    }
  }

  values[0] = mapped;
  return values;
}

/**
 * Prefer configured gid/name sheet when it has usable rows; otherwise pick
 * the workbook tab with the most usable IFM rows.
 */
function selectIFMSourceTable_(sourceSs, props) {
  var gidRaw =
    props.getProperty(KOBO_TOOLS_PROP_IFM_SOURCE_GID) ||
    String(KOBO_TOOLS_DEFAULT_IFM_SOURCE_GID);
  var gid = parseInt(gidRaw, 10);
  var preferredName =
    props.getProperty(KOBO_TOOLS_PROP_IFM_SOURCE_SHEET) ||
    KOBO_TOOLS_DEFAULT_IFM_SOURCE_SHEET;

  var sheets = sourceSs.getSheets();
  var scanParts = [];
  var best = null;
  var preferred = null;

  for (var i = 0; i < sheets.length; i++) {
    var sh = sheets[i];
    var parsed = parseIFMSourceSheet_(sh);
    scanParts.push(
      sh.getName() +
      "(gid=" +
      sh.getSheetId() +
      ", usable=" +
      parsed.usableRows +
      ")"
    );

    if (parsed.usableRows < 1) continue;

    if (!best || parsed.usableRows > best.usableRows) {
      best = parsed;
    }

    var isPreferredGid = !isNaN(gid) && sh.getSheetId() === gid;
    var isPreferredName = sh.getName() === preferredName;
    if ((isPreferredGid || isPreferredName) && !preferred) {
      preferred = parsed;
    }
  }

  var chosen = preferred && preferred.usableRows > 0 ? preferred : best;
  if (!chosen) {
    return { scanLog: "Tabs scanned: " + scanParts.join("; ") };
  }

  chosen.scanLog = "Tabs scanned: " + scanParts.join("; ");
  return chosen;
}

/**
 * Read one source sheet and normalize to header-first values if it looks like IFM.
 */
function parseIFMSourceSheet_(sheet) {
  var values = sheet.getDataRange().getValues();
  var headerRowIndex = findIFMSourceHeaderRowIndex_(values);
  if (headerRowIndex === -1) {
    return {
      sheetName: sheet.getName(),
      sheetId: sheet.getSheetId(),
      values: null,
      usableRows: 0
    };
  }

  if (headerRowIndex > 0) {
    values = values.slice(headerRowIndex);
  }

  return {
    sheetName: sheet.getName(),
    sheetId: sheet.getSheetId(),
    values: values,
    usableRows: countIFMUsableRows_(values)
  };
}

function countIFMUsableRows_(values) {
  if (!values || values.length < 2) return 0;

  var header = values[0];
  var countyIndex = findIFMSourceHeaderIndex_(header, ["county", "County"]);
  var facilityIndex = findIFMSourceHeaderIndex_(header, ["Facility"]);
  var codeIndex = findIFMSourceHeaderIndex_(header, [
    "Facility Code",
    "Facility code"
  ]);

  if (countyIndex === -1 || facilityIndex === -1 || codeIndex === -1) {
    return 0;
  }

  var usable = 0;
  for (var i = 1; i < values.length; i++) {
    var county = String(
      values[i][countyIndex] == null ? "" : values[i][countyIndex]
    ).trim();
    var facility = String(
      values[i][facilityIndex] == null ? "" : values[i][facilityIndex]
    ).trim();
    var code = String(
      values[i][codeIndex] == null ? "" : values[i][codeIndex]
    ).trim();
    if (county && facility && code) usable++;
  }
  return usable;
}

/**
 * Find header row in Mentor (IFM) source values (first ~15 rows).
 */
function findIFMSourceHeaderRowIndex_(rows) {
  if (!rows || !rows.length) return -1;
  var maxScan = Math.min(rows.length, 15);
  for (var r = 0; r < maxScan; r++) {
    var row = rows[r];
    var hasId =
      findIFMSourceHeaderIndex_(row, [
        "Mentor ID",
        "IFM ID",
        "Mentor Id",
        "MentorID"
      ]) !== -1;
    var hasFacility = findIFMSourceHeaderIndex_(row, ["Facility"]) !== -1;
    var hasCode =
      findIFMSourceHeaderIndex_(row, ["Facility Code", "Facility code"]) !==
      -1;
    var hasCounty =
      findIFMSourceHeaderIndex_(row, ["county", "County"]) !== -1;

    if (hasId && hasFacility && hasCode && hasCounty) {
      return r;
    }
  }
  return -1;
}

function findIFMSourceHeaderIndex_(headerRow, names) {
  var aliases =
    Object.prototype.toString.call(names) === "[object Array]"
      ? names
      : [names];
  var i;
  var c;
  var want;

  for (i = 0; i < aliases.length; i++) {
    var exact = headerRow.indexOf(aliases[i]);
    if (exact !== -1) return exact;
  }

  for (i = 0; i < aliases.length; i++) {
    want = String(aliases[i] == null ? "" : aliases[i]).trim().toLowerCase();
    for (c = 0; c < headerRow.length; c++) {
      if (
        String(headerRow[c] == null ? "" : headerRow[c]).trim().toLowerCase() ===
        want
      ) {
        return c;
      }
    }
  }
  return -1;
}

/**
 * Step 4: call every enabled registry builder that exists in this project.
 */
function buildRegisteredKoboTools_() {
  var registry = getKoboToolsRegistry_();
  var results = [];

  for (var i = 0; i < registry.length; i++) {
    var tool = registry[i];
    if (!tool.enabled) {
      results.push({
        id: tool.id,
        label: tool.label,
        status: "skipped_disabled"
      });
      continue;
    }

    var fn = resolveGlobalFunction_(tool.buildFnName);
    if (!fn) {
      Logger.log(
        "Skipping " + tool.label +
        " — function " + tool.buildFnName + " not found in this project."
      );
      results.push({
        id: tool.id,
        label: tool.label,
        status: "skipped_missing_function",
        buildFnName: tool.buildFnName
      });
      continue;
    }

    try {
      Logger.log("Building: " + tool.label + " ...");
      var formSs = fn();
      var url = formSs && formSs.getUrl ? formSs.getUrl() : "";
      Logger.log("Built: " + tool.label + (url ? " → " + url : ""));
      results.push({
        id: tool.id,
        label: tool.label,
        status: "ok",
        url: url
      });
    } catch (err) {
      Logger.log("FAILED: " + tool.label + " — " + err.message);
      results.push({
        id: tool.id,
        label: tool.label,
        status: "error",
        error: String(err.message || err)
      });
    }
  }

  return results;
}

function resolveGlobalFunction_(fnName) {
  try {
    // Apps Script global scope
    if (typeof this[fnName] === "function") return this[fnName];
  } catch (e1) {}

  try {
    if (typeof globalThis !== "undefined" && typeof globalThis[fnName] === "function") {
      return globalThis[fnName];
    }
  } catch (e2) {}

  // Fallback: eval in global context (Apps Script-friendly for registered names only)
  try {
    var fn = eval(fnName);
    if (typeof fn === "function") return fn;
  } catch (e3) {}

  return null;
}

/**
 * Preferred: install weekly trigger on refreshAllKoboTools only.
 */
function installKoboToolsWeeklyTrigger() {
  removeKoboToolsTriggers();

  ScriptApp.newTrigger("refreshAllKoboTools")
    .timeBased()
    .everyWeeks(1)
    .create();

  Logger.log("Installed weekly trigger for refreshAllKoboTools().");
}

/**
 * Install daily trigger on refreshAllKoboTools only.
 */
function installKoboToolsDailyTrigger() {
  removeKoboToolsTriggers();

  ScriptApp.newTrigger("refreshAllKoboTools")
    .timeBased()
    .everyDays(1)
    .create();

  Logger.log("Installed daily trigger for refreshAllKoboTools().");
}

/**
 * Optional hourly trigger.
 */
function installKoboToolsHourlyTrigger() {
  removeKoboToolsTriggers();

  ScriptApp.newTrigger("refreshAllKoboTools")
    .timeBased()
    .everyHours(1)
    .create();

  Logger.log("Installed hourly trigger for refreshAllKoboTools().");
}

/**
 * Remove orchestrator auto-refresh triggers.
 */
function removeKoboToolsTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  var removed = 0;
  var pipelineHandlers = {
    refreshAllKoboTools: true,
    syncMenteeDatabaseFromSource: true,
    syncIFMListFromSource: true,
    generateAllOutputs: true,
    buildRegisteredKoboTools_: true,
    deployRegisteredKoboTools_: true,
    deployAllKoboTools: true,
    deployEmONCCurriculumTrackingFormToKobo: true,
    createEmONCCurriculumTrackingForm2026: true,
    createNewbornCurriculumTrackingForm: true,
    createMoHSkillsAssessmentChecklist: true,
    createNewbornKnowledgeAssessment: true,
    createEmONCKnowledgeAssessment: true
  };

  for (var i = 0; i < triggers.length; i++) {
    var handler = triggers[i].getHandlerFunction();
    if (pipelineHandlers[handler]) {
      ScriptApp.deleteTrigger(triggers[i]);
      removed++;
    }
  }

  Logger.log(
    "Removed " + removed +
    " Kobo pipeline trigger(s). Only refreshAllKoboTools may be installed."
  );
}
