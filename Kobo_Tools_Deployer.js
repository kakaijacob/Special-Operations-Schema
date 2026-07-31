// =====================================================
// Kobo Tools Deployer
// Upload / update / deploy generated Kobo xlsforms via KPI API v2.
//
// Supports every tool in getKoboDeployToolsRegistry_() —
// add a new entry there when you create another form builder.
//
// Apps Script install (after form builders):
//   ... form tool files...
//   Kobo_Tools_Deployer.js
//
// Setup once:
//   setupKoboDeployConfig()
//   setKoboToolAssetUid("emonc_ctf", "aXXXX...")   // optional per tool
//
// Deploy one tool:
//   deployKoboTool("emonc_ctf")
//   deployKoboTool("newborn_ctf", true)  // true = rebuild sheet first
//
// Deploy all enabled tools:
//   deployAllKoboTools()
// =====================================================

// Shared Script Properties
var KOBO_DEPLOY_PROP_API_TOKEN = "KOBO_KPI_API_TOKEN";
var KOBO_DEPLOY_PROP_KPI_BASE = "KOBO_KPI_BASE_URL";

// Defaults — override via setupKoboDeployConfig()
// European Union server (former OCHA / humanitarianresponse): https://eu.kobotoolbox.org
// Global server: https://kf.kobotoolbox.org
var KOBO_DEPLOY_DEFAULT_KPI_BASE = "https://eu.kobotoolbox.org";

// humanitarianresponse.info addresses were retired on 1 March 2024; Apps Script
// reports them as "Address unavailable".
var KOBO_DEPLOY_LEGACY_HOST_MAP = {
  "kf.humanitarianresponse.info": "eu.kobotoolbox.org",
  "kobo.humanitarianresponse.info": "eu.kobotoolbox.org",
  "kc.humanitarianresponse.info": "kc-eu.kobotoolbox.org"
};

function normalizeKoboBaseUrl_(baseUrl) {
  var base = String(baseUrl || KOBO_DEPLOY_DEFAULT_KPI_BASE).trim();
  base = base.replace(/\/+$/, "");
  if (base.indexOf("http") !== 0) {
    base = "https://" + base;
  }

  for (var legacyHost in KOBO_DEPLOY_LEGACY_HOST_MAP) {
    if (base.indexOf(legacyHost) !== -1) {
      var replacement = base.replace(
        legacyHost,
        KOBO_DEPLOY_LEGACY_HOST_MAP[legacyHost]
      );
      Logger.log(
        "Kobo server " + legacyHost + " was retired on 1 March 2024 — using " +
        replacement + " instead."
      );
      return replacement;
    }
  }

  return base;
}

/**
 * Register each deployable form tool here.
 * - id: stable key used in Script Properties + function args
 * - formIdProp: Script Property where the builder stored the Google Sheet ID
 * - assetUidProp: Script Property for that tool's Kobo asset UID
 * - buildFnName: optional rebuild entry point in another Apps Script file
 * - xlsxName: filename sent to Kobo import
 */
function getKoboDeployToolsRegistry_() {
  return [
    {
      id: "emonc_ctf",
      label: "EmONC Curriculum Tracking Form",
      formIdProp: "EMONC_CTF_2026_SPREADSHEET_ID",
      assetUidProp: "KOBO_ASSET_UID_EMONC_CTF",
      buildFnName: "createEmONCCurriculumTrackingForm2026",
      xlsxName: "EmONC_Curriculum_Tracking_Form.xlsx",
      enabled: true
    },
    {
      id: "newborn_ctf",
      label: "Newborn Curriculum Tracking Form",
      formIdProp: "NEWBORN_CTF_SPREADSHEET_ID",
      assetUidProp: "KOBO_ASSET_UID_NEWBORN_CTF",
      buildFnName: "createNewbornCurriculumTrackingForm",
      xlsxName: "Newborn_Curriculum_Tracking_Form.xlsx",
      enabled: true
    },
    {
      id: "moh_sac",
      label: "MoH Skills Assessment Checklist",
      formIdProp: "MOH_SAC_SPREADSHEET_ID",
      assetUidProp: "KOBO_ASSET_UID_MOH_SAC",
      buildFnName: "createMoHSkillsAssessmentChecklist",
      xlsxName: "MoH_Skills_Assessment_Checklist.xlsx",
      enabled: true
    },
    {
      id: "newborn_ka",
      label: "Newborn Knowledge Assessment",
      formIdProp: "NEWBORN_KA_SPREADSHEET_ID",
      assetUidProp: "KOBO_ASSET_UID_NEWBORN_KA",
      buildFnName: "createNewbornKnowledgeAssessment",
      xlsxName: "Newborn_Knowledge_Assessment.xlsx",
      enabled: true
    },
    {
      id: "emonc_ka",
      label: "MoH Mentee EmONC Knowledge Assessment",
      formIdProp: "EMONC_KA_SPREADSHEET_ID",
      assetUidProp: "KOBO_ASSET_UID_EMONC_KA",
      buildFnName: "createEmONCKnowledgeAssessment",
      xlsxName: "MoH_Mentee_EmONC_Knowledge_Assessment.xlsx",
      enabled: true
    }
    // Add more tools below as needed.
  ];
}

/**
 * ONE-TIME SETUP (shared token + server for all tools)
 *
 * WHAT YOU NEED:
 * 1) Kobo API token — Account Settings → API Key
 * 2) KPI base URL — must match your Kobo server
 * 3) Per-tool asset UID (optional) — set with setKoboToolAssetUid(toolId, uid)
 *    Leave unset to create a NEW Kobo project on first deploy of that tool
 * 4) Each tool's Google Sheet must already exist (run its create* function
 *    or refreshAllKoboTools first)
 */
function setupKoboDeployConfig() {
  // >>> EDIT THESE BEFORE RUNNING <<<
  // Paste your Kobo API token here (do not commit real tokens to git).
  var apiToken = "PASTE_YOUR_KOBO_API_TOKEN_HERE";
  // EU server (former humanitarianresponse.info). Global server: https://kf.kobotoolbox.org
  var kpiBaseUrl = "https://eu.kobotoolbox.org";

  // Optional: seed known asset UIDs for tools that already exist in Kobo.
  // Leave blank / commented to create NEW Kobo projects on first deploy.
  // Example:
  //   var initialAssetUids = { emonc_ctf: "aXXXXXXXXXXXXXXXXXXXXX" };
  var initialAssetUids = {
    // emonc_ctf: "",
    // newborn_ctf: "",
    // moh_sac: "",
    // newborn_ka: "",
    // emonc_ka: ""
  };

  // formIdProp values stay as Script Property name placeholders in the registry.
  // Real Google Sheet IDs are written automatically when each create* builder runs.

  if (!apiToken || apiToken.indexOf("PASTE_") === 0) {
    throw new Error(
      "Set apiToken in setupKoboDeployConfig() to your real Kobo API token."
    );
  }

  var props = PropertiesService.getScriptProperties();
  props.setProperty(KOBO_DEPLOY_PROP_API_TOKEN, String(apiToken).trim());
  props.setProperty(KOBO_DEPLOY_PROP_KPI_BASE, normalizeKoboBaseUrl_(kpiBaseUrl));

  var registry = getKoboDeployToolsRegistry_();
  for (var i = 0; i < registry.length; i++) {
    var tool = registry[i];
    var uid = initialAssetUids[tool.id];
    if (uid) {
      props.setProperty(tool.assetUidProp, String(uid).trim());
    }
  }

  Logger.log("Saved shared Kobo deploy config.");
  Logger.log("KPI base: " + props.getProperty(KOBO_DEPLOY_PROP_KPI_BASE));
  listKoboDeployTools();
}

/**
 * Verify the saved server URL + token before attempting a deploy.
 * Logs the authenticated Kobo username on success.
 */
function testKoboConnection() {
  var cfg = getKoboDeploySharedConfig_();
  Logger.log("Testing Kobo server: " + cfg.base);

  var response = UrlFetchApp.fetch(cfg.base + "/me/?format=json", {
    method: "get",
    headers: koboAuthHeaders_(cfg.token),
    muteHttpExceptions: true
  });

  var code = response.getResponseCode();
  var body = response.getContentText();

  if (code === 401 || code === 403) {
    throw new Error(
      "Kobo rejected the API token (" + code + "). Confirm the token belongs " +
      "to an account on " + cfg.base + "."
    );
  }
  if (code >= 300) {
    throw new Error("Kobo connection test failed (" + code + "): " + body);
  }

  var me = JSON.parse(body);
  Logger.log("Connected to " + cfg.base + " as " + (me.username || "(unknown)"));
  return me;
}

/**
 * Save / replace the Kobo asset UID for one tool.
 *   setKoboToolAssetUid("emonc_ctf", "aXXXX...");
 */
function setKoboToolAssetUid(toolId, assetUid) {
  var tool = getKoboDeployToolById_(toolId);
  if (!assetUid) {
    throw new Error("assetUid is required.");
  }
  PropertiesService.getScriptProperties().setProperty(
    tool.assetUidProp,
    String(assetUid).trim()
  );
  Logger.log("Saved asset UID for " + tool.id + ": " + assetUid);
}

/**
 * Clear saved asset UID so the next deploy creates a NEW Kobo project.
 */
function clearKoboToolAssetUid(toolId) {
  var tool = getKoboDeployToolById_(toolId);
  PropertiesService.getScriptProperties().deleteProperty(tool.assetUidProp);
  Logger.log("Cleared asset UID for " + tool.id);
}

/**
 * Log registered deploy tools + whether sheet ID / asset UID are configured.
 */
function listKoboDeployTools() {
  var props = PropertiesService.getScriptProperties();
  var registry = getKoboDeployToolsRegistry_();
  for (var i = 0; i < registry.length; i++) {
    var tool = registry[i];
    Logger.log(
      tool.id +
      " | " +
      tool.label +
      " | enabled=" +
      !!tool.enabled +
      " | sheet=" +
      (props.getProperty(tool.formIdProp) || "(missing)") +
      " | asset=" +
      (props.getProperty(tool.assetUidProp) || "(none — will create new)")
    );
  }
  return registry;
}

/**
 * Deploy one tool by registry id.
 *   deployKoboTool("emonc_ctf");
 *   deployKoboTool("newborn_ka", true); // rebuild Google Sheet first
 */
function deployKoboTool(toolId, rebuildFirst) {
  var tool = getKoboDeployToolById_(toolId);
  if (!tool.enabled) {
    throw new Error("Tool '" + toolId + "' is disabled in the deploy registry.");
  }

  if (rebuildFirst) {
    Logger.log("Rebuilding: " + tool.label);
    var buildFn = resolveKoboDeployFunction_(tool.buildFnName);
    if (!buildFn) {
      throw new Error(
        "Build function " + tool.buildFnName + " not found in this project."
      );
    }
    buildFn();
  }

  var formSs = openKoboToolFormSpreadsheet_(tool);
  Logger.log("Exporting: " + tool.label + " → " + formSs.getUrl());

  var xlsxBlob = exportSpreadsheetAsXlsxBlob_(
    formSs.getId(),
    tool.xlsxName || (tool.id + ".xlsx")
  );

  var importResult = importXlsformToKobo_(xlsxBlob, tool);
  Logger.log("Import finished: " + JSON.stringify(importResult));

  var assetUid = importResult.assetUid;
  if (!assetUid) {
    throw new Error(
      "Import did not return an asset UID for " +
      tool.id +
      ". Check Logs / import response."
    );
  }

  PropertiesService.getScriptProperties().setProperty(
    tool.assetUidProp,
    assetUid
  );

  var deployResult = deployKoboAsset_(assetUid);
  Logger.log("Deploy finished: " + JSON.stringify(deployResult));
  Logger.log("Done: " + tool.label + " → asset UID " + assetUid);

  return {
    toolId: tool.id,
    label: tool.label,
    assetUid: assetUid,
    import: importResult,
    deploy: deployResult
  };
}

/**
 * Deploy every enabled tool in the registry.
 * Continues past individual failures and returns a results array.
 */
function deployAllKoboTools(rebuildFirst) {
  var registry = getKoboDeployToolsRegistry_();
  var results = [];

  for (var i = 0; i < registry.length; i++) {
    var tool = registry[i];
    if (!tool.enabled) {
      results.push({
        toolId: tool.id,
        label: tool.label,
        status: "skipped_disabled"
      });
      continue;
    }

    try {
      var out = deployKoboTool(tool.id, !!rebuildFirst);
      results.push({
        toolId: tool.id,
        label: tool.label,
        status: "ok",
        assetUid: out.assetUid
      });
    } catch (err) {
      Logger.log("FAILED " + tool.id + ": " + err.message);
      results.push({
        toolId: tool.id,
        label: tool.label,
        status: "error",
        error: String(err.message || err)
      });
    }
  }

  Logger.log("deployAllKoboTools finished: " + JSON.stringify(results));
  return results;
}

// ---------- Backward-compatible CTF helpers ----------

/** @deprecated Use setupKoboDeployConfig() */
function setupKoboCtfDeployConfig() {
  setupKoboDeployConfig();
}

/** @deprecated Use deployKoboTool("emonc_ctf") */
function deployEmONCCurriculumTrackingFormToKobo() {
  return deployKoboTool("emonc_ctf", false);
}

// =====================================================
// Shared Kobo API helpers
// =====================================================

function getKoboDeployToolById_(toolId) {
  var registry = getKoboDeployToolsRegistry_();
  for (var i = 0; i < registry.length; i++) {
    if (registry[i].id === toolId) return registry[i];
  }
  throw new Error(
    "Unknown deploy tool id '" +
    toolId +
    "'. Run listKoboDeployTools() to see valid ids."
  );
}

function getKoboDeploySharedConfig_() {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty(KOBO_DEPLOY_PROP_API_TOKEN);
  var base = normalizeKoboBaseUrl_(
    props.getProperty(KOBO_DEPLOY_PROP_KPI_BASE) || KOBO_DEPLOY_DEFAULT_KPI_BASE
  );

  if (!token) {
    throw new Error(
      "Missing Kobo API token. Run setupKoboDeployConfig() first."
    );
  }

  return { token: token, base: base };
}

function koboAuthHeaders_(token) {
  return {
    Authorization: "Token " + token,
    Accept: "application/json"
  };
}

function openKoboToolFormSpreadsheet_(tool) {
  var formId = PropertiesService.getScriptProperties().getProperty(
    tool.formIdProp
  );
  if (!formId) {
    throw new Error(
      tool.formIdProp +
      " not set for " +
      tool.id +
      ". Run " +
      tool.buildFnName +
      "() or refreshAllKoboTools() first."
    );
  }
  return SpreadsheetApp.openById(formId);
}

function resolveKoboDeployFunction_(fnName) {
  if (!fnName) return null;
  try {
    if (typeof this[fnName] === "function") return this[fnName];
  } catch (e1) {}
  try {
    if (
      typeof globalThis !== "undefined" &&
      typeof globalThis[fnName] === "function"
    ) {
      return globalThis[fnName];
    }
  } catch (e2) {}
  try {
    var fn = eval(fnName);
    if (typeof fn === "function") return fn;
  } catch (e3) {}
  return null;
}

/**
 * Export a Google Spreadsheet as an .xlsx blob (Drive export).
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
 * Upload xlsform via POST /api/v2/imports/
 * Uses tool.assetUidProp when set to update an existing Kobo project.
 */
function importXlsformToKobo_(xlsxBlob, tool) {
  var cfg = getKoboDeploySharedConfig_();
  var props = PropertiesService.getScriptProperties();
  var existingUid = props.getProperty(tool.assetUidProp) || "";
  var url = cfg.base + "/api/v2/imports/";

  var payload = {
    library: "false",
    file: xlsxBlob
  };

  if (existingUid) {
    payload.destination = cfg.base + "/api/v2/assets/" + existingUid + "/";
    Logger.log("Updating existing asset for " + tool.id + ": " + existingUid);
  } else {
    Logger.log("No asset UID for " + tool.id + " — creating NEW Kobo project.");
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

  var statusUrl = cfg.base + "/api/v2/imports/" + importUid + "/";
  var assetUid = existingUid;
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
      "Import poll " + (attempt + 1) + " [" + tool.id + "]: " + last.status
    );

    if (last.status === "complete") {
      assetUid = extractAssetUidFromImport_(last) || assetUid;
      break;
    }
    if (last.status === "error") {
      throw new Error(
        "Kobo import error for " + tool.id + ": " + JSON.stringify(last)
      );
    }
  }

  if (!assetUid) {
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

  if (importJson.messages && importJson.messages.created) {
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
 */
function deployKoboAsset_(assetUid) {
  var cfg = getKoboDeploySharedConfig_();
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
  var hasDeployment = !!(
    asset.deployment__active || asset.deployment__identifier
  );

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

/**
 * List recent Kobo assets (to copy UIDs into setKoboToolAssetUid).
 */
function listKoboAssetsForSetup() {
  var cfg = getKoboDeploySharedConfig_();
  var url =
    cfg.base + "/api/v2/assets/?format=json&limit=30&ordering=-date_modified";
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

/** @deprecated Use listKoboAssetsForSetup() */
function listKoboAssetsForCtfSetup() {
  return listKoboAssetsForSetup();
}
