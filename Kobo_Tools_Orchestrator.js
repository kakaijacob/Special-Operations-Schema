// =====================================================
// Kobo Tools Orchestrator
// Shared pipeline for all curriculum / assessment Kobo form builders.
//
// Trigger / menu should call ONLY refreshAllKoboTools().
// Sequence (always in this order):
//   1) Sync external Mentee Database 2026 → local "Mentee Database"
//   2) Run kobocreator.js generateAllOutputs()
//   3) Create/update every registered Kobo form tool
// =====================================================

// Script Properties
var KOBO_TOOLS_PROP_SOURCE_ID = "MENTEE_DATABASE_2026_SPREADSHEET_ID";
var KOBO_TOOLS_PROP_SOURCE_SHEET = "MENTEE_DATABASE_2026_SHEET_NAME";

var KOBO_TOOLS_DEFAULT_SOURCE_ID =
  "1W6YzsLt8BKIWkZvCT-Ggvs3CtA2GBnW7ggSfujlJypA";
var KOBO_TOOLS_DEFAULT_SOURCE_SHEET = "Mentee Database";
var KOBO_TOOLS_LOCAL_MENTEE_SHEET = "Mentee Database";

/**
 * Register each form builder here as you add tools (~10 planned).
 * buildFnName must match a global function in another Apps Script file.
 */
function getKoboToolsRegistry_() {
  return [
    {
      id: "newborn_ctf",
      label: "Newborn Curriculum Tracking Form",
      buildFnName: "createNewbornCurriculumTrackingForm",
      enabled: true
    },
    {
      id: "emonc_ctf_2026",
      label: "EmONC Curriculum Tracking Form",
      buildFnName: "createEmONCCurriculumTrackingForm2026",
      enabled: true
    }
    // Add more tools below, e.g.:
    // {
    //   id: "ifm_assessment",
    //   label: "IFM Assessment Form",
    //   buildFnName: "createIFMAssessmentForm",
    //   enabled: true
    // }
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
    .addItem("Install Daily Auto-Refresh", "installKoboToolsDailyTrigger")
    .addItem("Remove Auto-Refresh", "removeKoboToolsTriggers")
    .addToUi();
}

/**
 * One-time setup: store external Mentee Database 2026 spreadsheet ID.
 */
function setupKoboToolsSource() {
  setKoboToolsSourceConfig(KOBO_TOOLS_DEFAULT_SOURCE_ID);
}

/**
 * Store source spreadsheet ID (and optional sheet name).
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
 * MASTER PIPELINE — call this from the trigger / menu.
 * Do NOT put separate triggers on sync, kobocreator, or individual form builders.
 */
function refreshAllKoboTools() {
  Logger.log("=== Kobo Tools refresh started ===");

  // 1) Sync mentee database first
  syncMenteeDatabaseFromSource();

  // 2) Run kobocreator generators (shared intermediate sheets)
  Logger.log("Running kobocreator generateAllOutputs()...");
  generateAllOutputs();
  Logger.log("kobocreator complete.");

  // 3) Build / update every registered form
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
 * Step 3: call every enabled registry builder that exists in this project.
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
