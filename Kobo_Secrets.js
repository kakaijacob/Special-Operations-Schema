// =====================================================
// Kobo Secrets
//
// Single place for credentials and sensitive IDs.
// Values live in Apps Script → Project Settings → Script properties.
// They are NEVER written into this file or logged in full.
//
// Load this file first in the Apps Script project.
//
// One-time setup (from the spreadsheet menu, or the editor):
//   promptSetKoboApiToken()
//   promptSetKoboSourceIds()
//   promptSetKoboAssetUid()
//   listKoboSecrets()
// =====================================================

var KOBO_SECRET_KIND_TOKEN = "token";
var KOBO_SECRET_KIND_ID = "id";
var KOBO_SECRET_KIND_PUBLIC = "public";

/**
 * Catalog of every secret / sensitive property the pipeline reads.
 * Keys are the Script Property names. Values are never stored here.
 */
function getKoboSecretsCatalog_() {
  return [
    {
      key: "KOBO_KPI_API_TOKEN",
      kind: KOBO_SECRET_KIND_TOKEN,
      required: true,
      label: "Kobo KPI API token"
    },
    {
      key: "KOBO_KPI_BASE_URL",
      kind: KOBO_SECRET_KIND_PUBLIC,
      required: false,
      label: "Kobo KPI base URL"
    },
    {
      key: "MENTEE_DATABASE_2026_SPREADSHEET_ID",
      kind: KOBO_SECRET_KIND_ID,
      required: true,
      label: "Mentee Database 2026 spreadsheet ID"
    },
    {
      key: "MENTOR_IFM_DATABASE_2026_SPREADSHEET_ID",
      kind: KOBO_SECRET_KIND_ID,
      required: true,
      label: "Mentor (IFM) Database 2026 spreadsheet ID"
    },
    {
      key: "EMONC_CTF_2026_SPREADSHEET_ID",
      kind: KOBO_SECRET_KIND_ID,
      required: false,
      label: "EmONC CTF form spreadsheet ID"
    },
    {
      key: "NEWBORN_CTF_SPREADSHEET_ID",
      kind: KOBO_SECRET_KIND_ID,
      required: false,
      label: "Newborn CTF form spreadsheet ID"
    },
    {
      key: "MOH_SAC_SPREADSHEET_ID",
      kind: KOBO_SECRET_KIND_ID,
      required: false,
      label: "MoH SAC form spreadsheet ID"
    },
    {
      key: "NEWBORN_KA_SPREADSHEET_ID",
      kind: KOBO_SECRET_KIND_ID,
      required: false,
      label: "Newborn KA form spreadsheet ID"
    },
    {
      key: "EMONC_KA_SPREADSHEET_ID",
      kind: KOBO_SECRET_KIND_ID,
      required: false,
      label: "EmONC KA form spreadsheet ID"
    },
    {
      key: "KOBO_ASSET_UID_EMONC_CTF",
      kind: KOBO_SECRET_KIND_ID,
      required: true,
      label: "Kobo asset UID · EmONC Curriculum Tracking"
    },
    {
      key: "KOBO_ASSET_UID_NEWBORN_CTF",
      kind: KOBO_SECRET_KIND_ID,
      required: true,
      label: "Kobo asset UID · Newborn Curriculum Tracking"
    },
    {
      key: "KOBO_ASSET_UID_MOH_SAC",
      kind: KOBO_SECRET_KIND_ID,
      required: true,
      label: "Kobo asset UID · MoH Skills Assessment"
    },
    {
      key: "KOBO_ASSET_UID_NEWBORN_KA",
      kind: KOBO_SECRET_KIND_ID,
      required: true,
      label: "Kobo asset UID · Newborn Knowledge Assessment"
    },
    {
      key: "KOBO_ASSET_UID_EMONC_KA",
      kind: KOBO_SECRET_KIND_ID,
      required: true,
      label: "Kobo asset UID · EmONC Knowledge Assessment"
    },
    {
      key: "KOBO_ASSET_UID_PO_EMONC_KA",
      kind: KOBO_SECRET_KIND_ID,
      required: false,
      label: "Kobo asset UID · PO EmONC Knowledge Assessment"
    },
    {
      key: "KOBO_ASSET_UID_QUIPS",
      kind: KOBO_SECRET_KIND_ID,
      required: false,
      label: "Kobo asset UID · QuIPS"
    }
  ];
}

function getKoboSecretCatalogEntry_(key) {
  var catalog = getKoboSecretsCatalog_();
  for (var i = 0; i < catalog.length; i++) {
    if (catalog[i].key === key) return catalog[i];
  }
  return { key: key, kind: KOBO_SECRET_KIND_ID, required: false, label: key };
}

/**
 * Mask a secret for logs and UI. Tokens show first/last 4 chars only.
 */
function maskKoboSecret_(value, kind) {
  if (value === null || value === undefined || value === "") {
    return "(missing)";
  }
  var text = String(value);
  var mode = kind || KOBO_SECRET_KIND_ID;
  if (mode === KOBO_SECRET_KIND_PUBLIC) {
    return text;
  }
  if (text.length <= 8) {
    return "•••• (" + text.length + " chars)";
  }
  return text.slice(0, 4) + "…" + text.slice(-4) + " (" + text.length + " chars)";
}

function getKoboSecret_(key, required) {
  var value = PropertiesService.getScriptProperties().getProperty(key);
  if ((required !== false) && !value) {
    throw new Error(
      "Missing secret '" + key + "'. Set it from the Kobo Tools → Secrets " +
      "menu, or Apps Script → Project Settings → Script properties. " +
      "Do not paste the value into a .js file."
    );
  }
  return value || "";
}

function setKoboSecret_(key, value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    throw new Error("Refusing to store an empty value for " + key + ".");
  }
  PropertiesService.getScriptProperties().setProperty(
    key,
    String(value).trim()
  );
  var entry = getKoboSecretCatalogEntry_(key);
  Logger.log(
    "Saved " + entry.label + " (" + key + ") = " +
    maskKoboSecret_(value, entry.kind)
  );
}

function deleteKoboSecret_(key) {
  PropertiesService.getScriptProperties().deleteProperty(key);
  Logger.log("Cleared secret " + key + ".");
}

function getKoboApiToken_() {
  return getKoboSecret_("KOBO_KPI_API_TOKEN", true);
}

function getKoboKpiBase_() {
  var fallback =
    typeof KOBO_DEPLOY_DEFAULT_KPI_BASE !== "undefined"
      ? KOBO_DEPLOY_DEFAULT_KPI_BASE
      : "https://eu.kobotoolbox.org";
  var base = getKoboSecret_("KOBO_KPI_BASE_URL", false) || fallback;
  if (typeof normalizeKoboBaseUrl_ === "function") {
    return normalizeKoboBaseUrl_(base);
  }
  return String(base).replace(/\/+$/, "");
}

function getKoboAssetUidSecret_(propertyKey) {
  return getKoboSecret_(propertyKey, true);
}

/**
 * Public defaults only — never tokens, spreadsheet IDs, or asset UIDs.
 */
function seedKoboPublicDefaults_() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty("KOBO_KPI_BASE_URL")) {
    props.setProperty("KOBO_KPI_BASE_URL", "https://eu.kobotoolbox.org");
  }
  if (
    typeof KOBO_TOOLS_PROP_SOURCE_SHEET !== "undefined" &&
    !props.getProperty(KOBO_TOOLS_PROP_SOURCE_SHEET)
  ) {
    props.setProperty(
      KOBO_TOOLS_PROP_SOURCE_SHEET,
      typeof KOBO_TOOLS_DEFAULT_SOURCE_SHEET !== "undefined"
        ? KOBO_TOOLS_DEFAULT_SOURCE_SHEET
        : "Mentee Database"
    );
  }
  if (
    typeof KOBO_TOOLS_PROP_IFM_SOURCE_SHEET !== "undefined" &&
    !props.getProperty(KOBO_TOOLS_PROP_IFM_SOURCE_SHEET)
  ) {
    props.setProperty(
      KOBO_TOOLS_PROP_IFM_SOURCE_SHEET,
      typeof KOBO_TOOLS_DEFAULT_IFM_SOURCE_SHEET !== "undefined"
        ? KOBO_TOOLS_DEFAULT_IFM_SOURCE_SHEET
        : "Mentor (IFM) Database 2026"
    );
  }
}

/**
 * Fail early if required secrets are missing. Used by the pipeline preflight.
 */
function requireKoboPipelineSecrets_() {
  var catalog = getKoboSecretsCatalog_();
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
      "Kobo pipeline secrets are not configured. Missing: " +
      missing.join("; ") +
      ". Use Kobo Tools → Secrets, or Project Settings → Script properties."
    );
  }
}

/**
 * Log every catalog entry with a masked value. Safe to run in support logs.
 */
function listKoboSecrets() {
  var catalog = getKoboSecretsCatalog_();
  var props = PropertiesService.getScriptProperties();
  var setCount = 0;
  var missingRequired = 0;

  Logger.log("=== Kobo secrets (values masked) ===");
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
      maskKoboSecret_(raw, entry.kind) +
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

function promptSetKoboApiToken() {
  var ui = SpreadsheetApp.getUi();
  var result = ui.prompt(
    "Set Kobo API token",
    "Paste the token from Kobo → Account Settings → API Key. " +
    "It is stored in Script Properties only — never written back to a file.",
    ui.ButtonSet.OK_CANCEL
  );
  if (result.getSelectedButton() !== ui.Button.OK) return;
  setKoboSecret_("KOBO_KPI_API_TOKEN", result.getResponseText());
  ui.alert(
    "Token saved as " +
    maskKoboSecret_(result.getResponseText(), KOBO_SECRET_KIND_TOKEN)
  );
}

function promptSetKoboSourceIds() {
  var ui = SpreadsheetApp.getUi();
  var mentee = ui.prompt(
    "Mentee Database 2026",
    "Paste the Google Spreadsheet ID (the long id in the sheet URL).",
    ui.ButtonSet.OK_CANCEL
  );
  if (mentee.getSelectedButton() !== ui.Button.OK) return;
  setKoboSecret_(
    "MENTEE_DATABASE_2026_SPREADSHEET_ID",
    mentee.getResponseText()
  );

  var ifm = ui.prompt(
    "Mentor (IFM) Database 2026",
    "Paste the Google Spreadsheet ID for the mentor / IFM source workbook.",
    ui.ButtonSet.OK_CANCEL
  );
  if (ifm.getSelectedButton() !== ui.Button.OK) return;
  setKoboSecret_(
    "MENTOR_IFM_DATABASE_2026_SPREADSHEET_ID",
    ifm.getResponseText()
  );
  ui.alert("Source spreadsheet IDs saved in Script Properties.");
}

function promptSetKoboAssetUid() {
  var ui = SpreadsheetApp.getUi();
  var tool = ui.prompt(
    "Which tool?",
    "Enter a tool id: emonc_ctf, newborn_ctf, moh_sac, newborn_ka, emonc_ka, " +
    "po_emonc_ka, or quips.",
    ui.ButtonSet.OK_CANCEL
  );
  if (tool.getSelectedButton() !== ui.Button.OK) return;

  var id = String(tool.getResponseText() || "").trim().toLowerCase();
  var keyMap = {
    emonc_ctf: "KOBO_ASSET_UID_EMONC_CTF",
    newborn_ctf: "KOBO_ASSET_UID_NEWBORN_CTF",
    moh_sac: "KOBO_ASSET_UID_MOH_SAC",
    newborn_ka: "KOBO_ASSET_UID_NEWBORN_KA",
    emonc_ka: "KOBO_ASSET_UID_EMONC_KA",
    po_emonc_ka: "KOBO_ASSET_UID_PO_EMONC_KA",
    quips: "KOBO_ASSET_UID_QUIPS"
  };
  var key = keyMap[id];
  if (!key) {
    ui.alert("Unknown tool id '" + id + "'.");
    return;
  }

  var uid = ui.prompt(
    "Kobo asset UID for " + id,
    "Paste the asset UID (starts with 'a'). Stored in Script Properties only.",
    ui.ButtonSet.OK_CANCEL
  );
  if (uid.getSelectedButton() !== ui.Button.OK) return;
  setKoboSecret_(key, uid.getResponseText());
  ui.alert("Saved " + key + " = " + maskKoboSecret_(uid.getResponseText(), KOBO_SECRET_KIND_ID));
}

/**
 * Editor helper: set one secret without putting it in a committed file.
 *   setKoboSecret("KOBO_KPI_API_TOKEN", "the-token")
 */
function setKoboSecret(key, value) {
  setKoboSecret_(key, value);
}

function clearKoboSecret(key) {
  if (!key) throw new Error("key is required.");
  deleteKoboSecret_(key);
}

/**
 * Copy a pipeline / deploy summary with asset UIDs masked for logs.
 */
function maskKoboPipelineSummary_(summary) {
  var copy = {
    status: summary && summary.status,
    build: summary && summary.build,
    deploy: []
  };
  var deploy = (summary && summary.deploy) || [];
  for (var i = 0; i < deploy.length; i++) {
    var row = {};
    var src = deploy[i] || {};
    for (var key in src) {
      if (!src.hasOwnProperty(key)) continue;
      row[key] = key === "assetUid"
        ? maskKoboSecret_(src[key], KOBO_SECRET_KIND_ID)
        : src[key];
    }
    copy.deploy.push(row);
  }
  return copy;
}
