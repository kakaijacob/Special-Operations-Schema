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
//
// Trigger / menu should call ONLY refreshAllKoboTools().
// Sequence (always in this order):
//   1) Sync external Mentee Database 2026 → local "Mentee Database"
//   2) Sync external Mentor (IFM) Database 2026 → local "IFM List"
//   3) Run kobocreator.js generateAllOutputs()
//   4) Create/update every registered Kobo form tool
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
    .addItem("Refresh All Forms", "refreshAllKoboTools")
    .addItem("Setup Source Database", "setupKoboToolsSource")
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
 * Do NOT put separate triggers on sync, kobocreator, or individual form builders.
 */
function refreshAllKoboTools() {
  Logger.log("=== Kobo Tools refresh started ===");

  // 1) Sync mentee database first
  syncMenteeDatabaseFromSource();

  // 2) Sync IFM mentor database → local IFM List
  syncIFMListFromSource();

  // 3) Run kobocreator generators (shared intermediate sheets)
  Logger.log("Running kobocreator generateAllOutputs()...");
  generateAllOutputs();
  Logger.log("kobocreator complete.");

  // 4) Build / update every registered form
  var results = buildRegisteredKoboTools_();

  Logger.log("=== Kobo Tools refresh finished ===");
  Logger.log(JSON.stringify(results));
  return results;
}

/**
 * Step 1: Copy external Mentee Database 2026 → local "Mentee Database".
 * Also normalizes Program "EmONC Curriculum" → "MENTORS Curriculum".
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
 * Step 2: Copy external Mentor (IFM) Database 2026 → local "IFM List".
 * Prefers sheet gid from the source URL; falls back to sheet name, then first tab.
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
  var sourceSheet = resolveIFMSourceSheet_(sourceSs, props);

  if (!sourceSheet) {
    throw new Error(
      "No sheets found in Mentor (IFM) Database 2026 spreadsheet."
    );
  }

  var values = sourceSheet.getDataRange().getValues();
  if (!values || values.length === 0) {
    throw new Error("Mentor (IFM) Database 2026 source sheet is empty.");
  }

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
    "Synced " + (values.length - 1) +
    " IFM rows from '" + sourceSheet.getName() + "' into '" +
    KOBO_TOOLS_LOCAL_IFM_SHEET + "'."
  );

  return localSheet;
}

function resolveIFMSourceSheet_(sourceSs, props) {
  var gidRaw =
    props.getProperty(KOBO_TOOLS_PROP_IFM_SOURCE_GID) ||
    String(KOBO_TOOLS_DEFAULT_IFM_SOURCE_GID);
  var gid = parseInt(gidRaw, 10);

  if (!isNaN(gid)) {
    try {
      var byId = sourceSs.getSheetById(gid);
      if (byId) return byId;
    } catch (err) {
      Logger.log(
        "IFM source sheet gid " + gid + " not found; trying name fallback."
      );
    }
  }

  var sourceSheetName =
    props.getProperty(KOBO_TOOLS_PROP_IFM_SOURCE_SHEET) ||
    KOBO_TOOLS_DEFAULT_IFM_SOURCE_SHEET;

  var byName = sourceSs.getSheetByName(sourceSheetName);
  if (byName) return byName;

  return sourceSs.getSheets()[0] || null;
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

  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "refreshAllKoboTools") {
      ScriptApp.deleteTrigger(triggers[i]);
      removed++;
    }
  }

  Logger.log("Removed " + removed + " Kobo Tools auto-refresh trigger(s).");
}
