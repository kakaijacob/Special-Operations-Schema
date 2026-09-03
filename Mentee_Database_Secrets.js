// =====================================================
// Mentee Database Secrets
//
// Sensitive spreadsheet IDs live in Apps Script →
// Project Settings → Script properties.
// They are NEVER written into this file or logged in full.
//
// Load this file in the same Apps Script project as
// Mentee_Database_Algo.js.
//
// One-time setup (from the editor, or a custom menu):
//   promptSetMasterFacilitiesSheetId()
//   listMenteeSecrets()
// =====================================================

var MENTEE_SECRET_KIND_ID = "id";

/**
 * Catalog of secrets the mentee database algo reads.
 * Keys are Script Property names. Values are never stored here.
 */
function getMenteeSecretsCatalog_() {
  return [
    {
      key: "MASTER_FACILITIES_SHEET_ID",
      kind: MENTEE_SECRET_KIND_ID,
      required: true,
      label: "Master facilities spreadsheet ID"
    }
  ];
}

function getMenteeSecretCatalogEntry_(key) {
  var catalog = getMenteeSecretsCatalog_();
  for (var i = 0; i < catalog.length; i++) {
    if (catalog[i].key === key) return catalog[i];
  }
  return {
    key: key,
    kind: MENTEE_SECRET_KIND_ID,
    required: false,
    label: key
  };
}

/**
 * Mask a secret for logs and UI. IDs show first/last 4 chars only.
 */
function maskMenteeSecret_(value, kind) {
  if (value === null || value === undefined || value === "") {
    return "(missing)";
  }
  var text = String(value);
  if (text.length <= 8) {
    return "•••• (" + text.length + " chars)";
  }
  return text.slice(0, 4) + "…" + text.slice(-4) + " (" + text.length + " chars)";
}

function getMenteeSecret_(key, required) {
  var value = PropertiesService.getScriptProperties().getProperty(key);
  if ((required !== false) && !value) {
    throw new Error(
      "Missing secret '" + key + "'. Set it with promptSetMasterFacilitiesSheetId() " +
      "or Apps Script → Project Settings → Script properties. " +
      "Do not paste the value into a .js file."
    );
  }
  return value || "";
}

function setMenteeSecret_(key, value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    throw new Error("Refusing to store an empty value for " + key + ".");
  }
  PropertiesService.getScriptProperties().setProperty(
    key,
    String(value).trim()
  );
  var entry = getMenteeSecretCatalogEntry_(key);
  Logger.log(
    "Saved " + entry.label + " (" + key + ") = " +
    maskMenteeSecret_(value, entry.kind)
  );
}

function deleteMenteeSecret_(key) {
  PropertiesService.getScriptProperties().deleteProperty(key);
  Logger.log("Cleared secret " + key + ".");
}

/**
 * Master DHIS facilities workbook ID used by updateAllStatusesByName().
 */
function getMasterFacilitiesSheetId_() {
  return getMenteeSecret_("MASTER_FACILITIES_SHEET_ID", true);
}

/**
 * Fail early if required secrets are missing.
 */
function requireMenteeDatabaseSecrets_() {
  var catalog = getMenteeSecretsCatalog_();
  var missing = [];
  for (var i = 0; i < catalog.length; i++) {
    var entry = catalog[i];
    if (!entry.required) continue;
    if (!PropertiesService.getScriptProperties().getProperty(entry.key)) {
      missing.push(entry.key + " (" + entry.label + ")");
    }
  }
  if (missing.length) {
    throw new Error(
      "Mentee database secrets are not configured. Missing: " +
      missing.join("; ") +
      ". Use promptSetMasterFacilitiesSheetId(), or Project Settings → Script properties."
    );
  }
}

/**
 * Log every catalog entry with a masked value. Safe to run in support logs.
 */
function listMenteeSecrets() {
  var catalog = getMenteeSecretsCatalog_();
  var props = PropertiesService.getScriptProperties();
  var setCount = 0;
  var missingRequired = 0;

  Logger.log("=== Mentee database secrets (values masked) ===");
  for (var i = 0; i < catalog.length; i++) {
    var entry = catalog[i];
    var raw = props.getProperty(entry.key);
    if (raw) setCount++;
    if (entry.required && !raw) missingRequired++;
    Logger.log(
      (raw ? "SET  " : "MISS ") +
      entry.key +
      " · " +
      entry.label +
      " · " +
      maskMenteeSecret_(raw, entry.kind) +
      (entry.required ? " [required]" : "")
    );
  }
  Logger.log(
    "Summary: " + setCount + "/" + catalog.length +
    " set, " + missingRequired + " required secret(s) missing."
  );
  return {
    set: setCount,
    total: catalog.length,
    missingRequired: missingRequired
  };
}

/**
 * Prompt to store the master facilities spreadsheet ID in Script Properties.
 */
function promptSetMasterFacilitiesSheetId() {
  var ui = SpreadsheetApp.getUi();
  var result = ui.prompt(
    "Master facilities spreadsheet",
    "Paste the Google Spreadsheet ID (the long id in the sheet URL). " +
    "It is stored in Script Properties only — never written back to a file.",
    ui.ButtonSet.OK_CANCEL
  );
  if (result.getSelectedButton() !== ui.Button.OK) return;
  setMenteeSecret_("MASTER_FACILITIES_SHEET_ID", result.getResponseText());
  ui.alert(
    "Saved MASTER_FACILITIES_SHEET_ID = " +
    maskMenteeSecret_(result.getResponseText(), MENTEE_SECRET_KIND_ID)
  );
}

/**
 * Editor helper: set one secret without putting it in a committed file.
 *   setMenteeSecret("MASTER_FACILITIES_SHEET_ID", "paste-then-delete-this-call")
 */
function setMenteeSecret(key, value) {
  setMenteeSecret_(key, value);
}

function clearMenteeSecret(key) {
  if (!key) throw new Error("key is required.");
  deleteMenteeSecret_(key);
}
