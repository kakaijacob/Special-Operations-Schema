// =====================================================
// Kobo CTF Deployer (STARTER)
// Uploads / updates / deploys the EmONC Curriculum Tracking Form
// xlsform to KoboToolbox via KPI API v2.
//
// Prerequisites in the Apps Script project:
//   - EmONC_Curriculum_Tracking_Form_2026.js (builds the form sheet)
//   - This file
//
// Run once: setupKoboCtfDeployConfig()
// Then:     deployEmONCCurriculumTrackingFormToKobo()
// =====================================================

// ---------- Script Property keys ----------
var KOBO_CTF_PROP_API_TOKEN = "KOBO_KPI_API_TOKEN";
var KOBO_CTF_PROP_KPI_BASE = "KOBO_KPI_BASE_URL";
var KOBO_CTF_PROP_ASSET_UID = "KOBO_CTF_ASSET_UID"; // existing form UID (optional on first create)

// Defaults — override via setup / Script Properties
// Humanitarian / UN instance often uses:
//   https://kf.humanitarianresponse.info
// Public kobo.or.ke / kobotoolbox.org often uses:
//   https://kf.kobotoolbox.org
var KOBO_CTF_DEFAULT_KPI_BASE = "https://kf.humanitarianresponse.info";

/**
 * ONE-TIME SETUP
 * Fill in your values, then run this function from the Apps Script editor.
 *
 * WHAT YOU NEED:
 * 1) KOBO API TOKEN
 *    - Kobo → Account Settings → API Token (KPI token)
 * 2) KPI BASE URL
 *    - Must match the server where your projects live
 *    - Examples:
 *        https://kf.humanitarianresponse.info
 *        https://kf.kobotoolbox.org
 * 3) ASSET UID (form id) — only if UPDATING an existing project
 *    - Open the form in Kobo; UID is in the URL:
 *        .../forms/<ASSET_UID>
 *      or from API: GET /api/v2/assets/?format=json
 *    - Leave blank / omit to create a NEW project on first upload
 * 4) Form spreadsheet is taken from Script Property
 *      EMONC_CTF_2026_SPREADSHEET_ID
 *    (set automatically when you run createEmONCCurriculumTrackingForm2026)
 */
function setupKoboCtfDeployConfig() {
  // >>> EDIT THESE BEFORE RUNNING <<<
  var apiToken = "PASTE_YOUR_KOBO_API_TOKEN_HERE";
  var kpiBaseUrl = KOBO_CTF_DEFAULT_KPI_BASE;
  var existingAssetUid = ""; // e.g. "aXXXXXXXXXXXXXXXXXXXXX" or "" for new

  if (!apiToken || apiToken.indexOf("PASTE_") === 0) {
    throw new Error(
      "Set apiToken in setupKoboCtfDeployConfig() to your real Kobo API token."
    );
  }

  var props = PropertiesService.getScriptProperties();
  props.setProperty(KOBO_CTF_PROP_API_TOKEN, String(apiToken).trim());
  props.setProperty(
    KOBO_CTF_PROP_KPI_BASE,
    String(kpiBaseUrl || KOBO_CTF_DEFAULT_KPI_BASE).replace(/\/$/, "")
  );

  if (existingAssetUid) {
    props.setProperty(KOBO_CTF_PROP_ASSET_UID, String(existingAssetUid).trim());
  }

  Logger.log("Saved Kobo CTF deploy config.");
  Logger.log("KPI base: " + props.getProperty(KOBO_CTF_PROP_KPI_BASE));
  Logger.log(
    "Asset UID: " +
    (props.getProperty(KOBO_CTF_PROP_ASSET_UID) || "(none — will create new)")
  );
}

/**
 * MAIN ENTRY
 * 1) Ensures CTF form spreadsheet exists / is current (optional rebuild)
 * 2) Exports it as .xlsx
 * 3) Imports into Kobo (create or update)
 * 4) Deploys the latest version
 *
 * Set rebuildFirst = true if you want to regenerate the CTF sheet first.
 */
function deployEmONCCurriculumTrackingFormToKobo() {
  var rebuildFirst = false; // set true to call createEmONCCurriculumTrackingForm2026() first

  if (rebuildFirst) {
    Logger.log("Rebuilding EmONC Curriculum Tracking Form...");
    createEmONCCurriculumTrackingForm2026();
  }

  var formSs = openEmONCCtfFormSpreadsheet_();
  Logger.log("Exporting form spreadsheet: " + formSs.getUrl());

  var xlsxBlob = exportSpreadsheetAsXlsxBlob_(
    formSs.getId(),
    "EmONC_Curriculum_Tracking_Form.xlsx"
  );

  var importResult = importXlsformToKobo_(xlsxBlob);
  Logger.log("Import finished: " + JSON.stringify(importResult));

  var assetUid = importResult.assetUid;
  if (!assetUid) {
    throw new Error(
      "Import did not return an asset UID. Check import status in Logs."
    );
  }

  // Persist UID so later runs UPDATE this project instead of creating another
  PropertiesService.getScriptProperties().setProperty(
    KOBO_CTF_PROP_ASSET_UID,
    assetUid
  );

  var deployResult = deployKoboAsset_(assetUid);
  Logger.log("Deploy finished: " + JSON.stringify(deployResult));
  Logger.log(
    "Done. Form asset UID: " + assetUid +
    " — open it in Kobo KPI under your projects."
  );

  return {
    assetUid: assetUid,
    import: importResult,
    deploy: deployResult
  };
}

// =====================================================
// KOBO API HELPERS (starter implementations)
// =====================================================

function getKoboCtfConfig_() {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty(KOBO_CTF_PROP_API_TOKEN);
  var base =
    props.getProperty(KOBO_CTF_PROP_KPI_BASE) || KOBO_CTF_DEFAULT_KPI_BASE;
  base = String(base).replace(/\/$/, "");

  if (!token) {
    throw new Error(
      "Missing Kobo API token. Run setupKoboCtfDeployConfig() first."
    );
  }

  return {
    token: token,
    base: base,
    assetUid: props.getProperty(KOBO_CTF_PROP_ASSET_UID) || ""
  };
}

function koboAuthHeaders_(token, extra) {
  var headers = {
    Authorization: "Token " + token,
    Accept: "application/json"
  };
  if (extra) {
    for (var k in extra) {
      if (extra.hasOwnProperty(k)) headers[k] = extra[k];
    }
  }
  return headers;
}

/**
 * Upload xlsform via POST /api/v2/imports/
 * - If Script Property KOBO_CTF_ASSET_UID is set → update that asset
 * - Else → create a new asset from the import
 */
function importXlsformToKobo_(xlsxBlob) {
  var cfg = getKoboCtfConfig_();
  var url = cfg.base + "/api/v2/imports/";

  // UrlFetchApp multipart: pass payload as object with blob file
  var payload = {
    library: "false",
    file: xlsxBlob
  };

  if (cfg.assetUid) {
    // Update existing project instead of creating a new one
    payload.destination = cfg.base + "/api/v2/assets/" + cfg.assetUid + "/";
    Logger.log("Updating existing asset: " + cfg.assetUid);
  } else {
    Logger.log("No asset UID saved — Kobo will create a NEW project.");
  }

  var response = UrlFetchApp.fetch(url, {
    method: "post",
    headers: koboAuthHeaders_(cfg.token),
    payload: payload,
    muteHttpExceptions: true
  });

  var code = response.getResponseCode();
  var body = response.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error("Kobo import POST failed (" + code + "): " + body);
  }

  var json = JSON.parse(body);
  var importUid = json.uid;
  if (!importUid) {
    throw new Error("Kobo import response missing uid: " + body);
  }

  // Poll until processing completes
  var statusUrl = cfg.base + "/api/v2/imports/" + importUid + "/";
  var assetUid = cfg.assetUid || "";
  var last = json;

  for (var attempt = 0; attempt < 30; attempt++) {
    Utilities.sleep(2000);
    var statusResp = UrlFetchApp.fetch(statusUrl, {
      method: "get",
      headers: koboAuthHeaders_(cfg.token),
      muteHttpExceptions: true
    });
    last = JSON.parse(statusResp.getContentText());
    Logger.log(
      "Import poll " + (attempt + 1) + ": status=" + last.status
    );

    if (last.status === "complete") {
      // New imports usually expose created asset under messages / summary
      assetUid =
        extractAssetUidFromImport_(last) ||
        assetUid;
      break;
    }
    if (last.status === "error") {
      throw new Error("Kobo import error: " + JSON.stringify(last));
    }
  }

  if (!assetUid) {
    // Fallback: try to read from complete response again
    assetUid = extractAssetUidFromImport_(last);
  }

  return {
    importUid: importUid,
    assetUid: assetUid,
    raw: last
  };
}

function extractAssetUidFromImport_(importJson) {
  if (!importJson) return "";

  // Common shapes seen across KPI versions
  if (importJson.messages && importJson.messages.created) {
    // sometimes: ["https://.../assets/aXXXX/"]
    var created = importJson.messages.created;
    if (created && created.length) {
      var m = String(created[0]).match(/\/assets\/([^/]+)/);
      if (m) return m[1];
    }
  }

  if (importJson.summary && importJson.summary.uid) {
    return importJson.summary.uid;
  }

  if (importJson.destination) {
    var d = String(importJson.destination).match(/\/assets\/([^/]+)/);
    if (d) return d[1];
  }

  return "";
}

/**
 * Deploy (or redeploy) an asset.
 * First deploy: POST .../deployment/ with active=true
 * Redeploy: GET asset → version_id, then PATCH deployment
 */
function deployKoboAsset_(assetUid) {
  var cfg = getKoboCtfConfig_();
  var assetUrl = cfg.base + "/api/v2/assets/" + assetUid + "/";
  var deployUrl = assetUrl + "deployment/";

  var assetResp = UrlFetchApp.fetch(assetUrl + "?format=json", {
    method: "get",
    headers: koboAuthHeaders_(cfg.token),
    muteHttpExceptions: true
  });
  if (assetResp.getResponseCode() >= 300) {
    throw new Error(
      "Failed to read asset (" +
      assetResp.getResponseCode() +
      "): " +
      assetResp.getContentText()
    );
  }

  var asset = JSON.parse(assetResp.getContentText());
  var versionId = asset.version_id;
  var hasDeployment = !!(asset.deployment__active || asset.deployment__identifier);

  if (!hasDeployment) {
    Logger.log("No prior deployment — POST active=true");
    var postResp = UrlFetchApp.fetch(deployUrl, {
      method: "post",
      headers: koboAuthHeaders_(cfg.token),
      payload: { active: "true" },
      muteHttpExceptions: true
    });
    if (postResp.getResponseCode() >= 300) {
      throw new Error(
        "Deploy POST failed (" +
        postResp.getResponseCode() +
        "): " +
        postResp.getContentText()
      );
    }
    return JSON.parse(postResp.getContentText());
  }

  Logger.log("Redeploying version_id=" + versionId);
  var patchResp = UrlFetchApp.fetch(deployUrl, {
    method: "patch",
    headers: koboAuthHeaders_(cfg.token),
    payload: { version_id: versionId },
    muteHttpExceptions: true
  });
  if (patchResp.getResponseCode() >= 300) {
    throw new Error(
      "Deploy PATCH failed (" +
      patchResp.getResponseCode() +
      "): " +
      patchResp.getContentText()
    );
  }
  return JSON.parse(patchResp.getContentText());
}

// =====================================================
// GOOGLE SHEET → XLSX
// =====================================================

function openEmONCCtfFormSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  // Property written by EmONC_Curriculum_Tracking_Form_2026.js
  var formId = props.getProperty("EMONC_CTF_2026_SPREADSHEET_ID");
  if (!formId) {
    throw new Error(
      "EMONC_CTF_2026_SPREADSHEET_ID not set. " +
      "Run createEmONCCurriculumTrackingForm2026() first."
    );
  }
  return SpreadsheetApp.openById(formId);
}

/**
 * Export a Google Spreadsheet as an .xlsx blob (Drive export).
 * The CTF workbook should contain survey / choices / settings tabs.
 */
function exportSpreadsheetAsXlsxBlob_(spreadsheetId, filename) {
  var exportUrl =
    "https://docs.google.com/spreadsheets/d/" +
    spreadsheetId +
    "/export?format=xlsx";

  var response = UrlFetchApp.fetch(exportUrl, {
    headers: {
      Authorization: "Bearer " + ScriptApp.getOAuthToken()
    },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() >= 300) {
    throw new Error(
      "Sheet export failed (" +
      response.getResponseCode() +
      "): " +
      response.getContentText()
    );
  }

  return response.getBlob().setName(filename || "form.xlsx");
}

/**
 * Optional helper: list recent assets so you can copy a UID.
 * Run from the editor and check Logs / Executions.
 */
function listKoboAssetsForCtfSetup() {
  var cfg = getKoboCtfConfig_();
  var url = cfg.base + "/api/v2/assets/?format=json&limit=20&ordering=-date_modified";
  var response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: koboAuthHeaders_(cfg.token),
    muteHttpExceptions: true
  });
  if (response.getResponseCode() >= 300) {
    throw new Error(
      "List assets failed (" +
      response.getResponseCode() +
      "): " +
      response.getContentText()
    );
  }

  var data = JSON.parse(response.getContentText());
  var results = data.results || [];
  for (var i = 0; i < results.length; i++) {
    Logger.log(
      (results[i].uid || "") +
      " | " +
      (results[i].name || "") +
      " | deployed=" +
      !!results[i].deployment__active
    );
  }
  return results;
}
