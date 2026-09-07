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
// Secrets live in Script Properties — never in this file.
// Setup once from the spreadsheet menu:
//   Kobo Tools → Secrets → Set Kobo API token…
//   Kobo Tools → Secrets → Set asset UID…
// Or from the editor:
//   promptSetKoboApiToken()
//   setKoboToolAssetUid("emonc_ctf", "aXXXX...")
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
 * Validate deploy secrets. Does NOT write tokens, sheet IDs or asset UIDs.
 * Those must already be in Script Properties (Kobo Tools → Secrets).
 */
function setupKoboDeployConfig() {
  seedKoboPublicDefaults_();
  requireKoboPipelineSecrets_();
  Logger.log("Kobo deploy secrets are present (values masked).");
  Logger.log("KPI base: " + getKoboKpiBase_());
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
  Logger.log(
    "Saved asset UID for " + tool.id + ": " +
    maskKoboSecret_(assetUid, KOBO_SECRET_KIND_ID)
  );
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
      maskKoboSecret_(props.getProperty(tool.formIdProp), KOBO_SECRET_KIND_ID) +
      " | asset=" +
      maskKoboSecret_(props.getProperty(tool.assetUidProp), KOBO_SECRET_KIND_ID)
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

  // Captured before import so the deploy step can tell the new version apart
  // from the version that was already on the asset.
  var priorUid =
    PropertiesService.getScriptProperties().getProperty(tool.assetUidProp) || "";
  var priorVersionId = priorUid ? getKoboAssetVersionId_(priorUid) : "";

  var formSs = openKoboToolFormSpreadsheet_(tool);

  // The Drive export reads the saved file, so the build that just ran has to
  // be written out before the export or a stale form is what reaches Kobo.
  SpreadsheetApp.flush();

  assertKoboFormIsDeployable_(formSs, tool);

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

  var deployResult = deployKoboAsset_(
    assetUid,
    assetUid === priorUid ? priorVersionId : ""
  );
  Logger.log("Deploy finished: " + JSON.stringify(deployResult));
  Logger.log(
    "Done: " + tool.label + " → asset UID " +
    maskKoboSecret_(assetUid, KOBO_SECRET_KIND_ID)
  );

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

  Logger.log(
    "deployAllKoboTools finished: " +
    JSON.stringify(maskKoboPipelineSummary_({ deploy: results }).deploy)
  );
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
  var token = getKoboApiToken_();
  var base = getKoboKpiBase_();
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

// =====================================================
// PRE-DEPLOY VALIDATION
// Kobo reports these as "[row : N] List name not in choices sheet: x" and
// rejects the whole form, so catch them here where the row can be named.
// =====================================================

/**
 * Report what Kobo would reject, for every registered tool, without deploying.
 * Run this from the Apps Script editor when a deployment fails.
 */
function checkAllKoboFormsForDeployProblems() {
  var registry = getKoboDeployToolsRegistry_();
  var report = [];

  for (var i = 0; i < registry.length; i++) {
    var tool = registry[i];
    var entry = { toolId: tool.id, label: tool.label };

    try {
      var formSs = openKoboToolFormSpreadsheet_(tool);
      entry.problems = findKoboFormProblems_(formSs);
      entry.warnings = findKoboUnreachableComparisons_(formSs);
      entry.url = formSs.getUrl();
    } catch (err) {
      entry.error = String(err.message || err);
    }

    report.push(entry);
    Logger.log(
      tool.label + ": " +
      (entry.error
        ? "could not check — " + entry.error
        : entry.problems.length
          ? entry.problems.length + " problem(s)\n  " + entry.problems.join("\n  ")
          : "ready to deploy")
    );
    if (entry.warnings && entry.warnings.length) {
      Logger.log(
        tool.label + ": " + entry.warnings.length +
        " unreachable comparison(s) — the form deploys but these questions " +
        "never appear\n  " + entry.warnings.join("\n  ")
      );
    }
  }

  return report;
}

/**
 * Comparisons against a choice value that the form does not contain.
 *
 * Kobo accepts these, so they are warnings, not deploy blockers. They are the
 * silent failure: a relevance such as
 * ${makueni_facilities} = '12457_makueni_county_referral_hospital' is valid
 * XPath, but if the choices carry '..._refferal_hospital' the condition can
 * never be true and the question simply never appears. Nothing in the logs or
 * the Kobo UI says why.
 */
function findKoboUnreachableComparisons_(formSs) {
  var surveySheet = formSs.getSheetByName("survey");
  var choicesSheet = formSs.getSheetByName("choices");
  if (!surveySheet || !choicesSheet) return [];

  var survey = surveySheet.getDataRange().getValues();
  var choices = choicesSheet.getDataRange().getValues();
  if (survey.length < 2 || choices.length < 2) return [];

  var surveyHeader = survey[0];
  var typeIndex = indexOfKoboColumn_(surveyHeader, "type");
  var nameIndex = indexOfKoboColumn_(surveyHeader, "name");
  if (typeIndex === -1 || nameIndex === -1) return [];

  var choicesHeader = choices[0];
  var listNameIndex = indexOfKoboColumn_(choicesHeader, "list_name");
  var choiceNameIndex = indexOfKoboColumn_(choicesHeader, "name");
  if (listNameIndex === -1 || choiceNameIndex === -1) return [];

  // list_name -> { choice value: true }
  var valuesByList = {};
  for (var c = 1; c < choices.length; c++) {
    var list = String(choices[c][listNameIndex] || "").trim();
    var value = String(choices[c][choiceNameIndex] || "").trim();
    if (!list || !value) continue;
    if (!valuesByList[list]) valuesByList[list] = {};
    valuesByList[list][value] = true;
  }

  // Question name -> the list it selects from.
  var listByField = {};
  for (var s = 1; s < survey.length; s++) {
    var fieldName = String(survey[s][nameIndex] || "").trim();
    var listName = extractKoboSelectListName_(survey[s][typeIndex]);
    if (fieldName && listName) listByField[fieldName] = listName;
  }

  var expressionNames = ["relevant", "choice_filter", "calculation", "constraint"];
  var expressionColumns = [];
  for (var e = 0; e < expressionNames.length; e++) {
    var index = indexOfKoboColumn_(surveyHeader, expressionNames[e]);
    if (index !== -1) {
      expressionColumns.push({ name: expressionNames[e], index: index });
    }
  }

  var warnings = [];
  var comparison = /\$\{([A-Za-z0-9_]+)\}\s*=\s*'([^']*)'/g;

  for (var r = 1; r < survey.length; r++) {
    for (var x = 0; x < expressionColumns.length; x++) {
      var expression = survey[r][expressionColumns[x].index];
      if (!expression) continue;

      comparison.lastIndex = 0;
      var match;
      while ((match = comparison.exec(String(expression))) !== null) {
        var field = match[1];
        var wanted = match[2];
        var list = listByField[field];
        if (!list || !wanted) continue;
        if (!valuesByList[list]) continue;
        if (valuesByList[list][wanted]) continue;

        warnings.push(
          "[row : " + (r + 1) + "] " + expressionColumns[x].name +
          " compares ${" + field + "} with '" + wanted +
          "', which is not a choice in '" + list + "'" +
          (survey[r][nameIndex] ? " (question " + survey[r][nameIndex] + ")" : "")
        );
      }
    }
  }

  return warnings;
}

function assertKoboFormIsDeployable_(formSs, tool) {
  // Kobo accepts these, so they must not block the deployment — but they are
  // the faults nothing else reports, so name them in the log every run.
  var warnings = findKoboUnreachableComparisons_(formSs);
  if (warnings.length) {
    Logger.log(
      tool.label + ": " + warnings.length + " comparison(s) can never be true, " +
      "so those questions will never appear:\n  " + warnings.join("\n  ")
    );
  }

  var problems = findKoboFormProblems_(formSs);
  if (!problems.length) return;

  throw new Error(
    tool.label + " would be rejected by Kobo:\n  " +
    problems.join("\n  ") +
    "\nThe survey and choices tabs come from " + tool.buildFnName +
    "(); rebuild the form (refreshAllKoboTools) and check that the Apps " +
    "Script copy of that builder is up to date."
  );
}

/**
 * Selects pointing at an empty choice list, and duplicate question names.
 * Row numbers count the header, matching Kobo's "[row : N]".
 */
function findKoboFormProblems_(formSs) {
  var surveySheet = formSs.getSheetByName("survey");
  var choicesSheet = formSs.getSheetByName("choices");
  var problems = [];

  if (!surveySheet) return ["no 'survey' tab in " + formSs.getName()];
  if (!choicesSheet) return ["no 'choices' tab in " + formSs.getName()];

  var survey = surveySheet.getDataRange().getValues();
  var choices = choicesSheet.getDataRange().getValues();
  if (survey.length < 2) return ["'survey' tab is empty"];

  var availableLists = collectKoboChoiceListNames_(choices);

  var surveyHeader = survey[0];
  var typeIndex = indexOfKoboColumn_(surveyHeader, "type");
  var nameIndex = indexOfKoboColumn_(surveyHeader, "name");
  if (typeIndex === -1 || nameIndex === -1) {
    return ["'survey' tab is missing a type or name column"];
  }

  var expressionColumns = [];
  var expressionNames = [
    "relevant", "choice_filter", "calculation", "constraint", "parameters"
  ];
  for (var e = 0; e < expressionNames.length; e++) {
    var expressionIndex = indexOfKoboColumn_(surveyHeader, expressionNames[e]);
    if (expressionIndex !== -1) {
      expressionColumns.push({ name: expressionNames[e], index: expressionIndex });
    }
  }

  var seenNames = {};

  for (var i = 1; i < survey.length; i++) {
    var type = String(survey[i][typeIndex] == null ? "" : survey[i][typeIndex]).trim();
    var name = String(survey[i][nameIndex] == null ? "" : survey[i][nameIndex]).trim();
    var row = i + 1;

    for (var x = 0; x < expressionColumns.length; x++) {
      var column = expressionColumns[x];
      var expression = survey[i][column.index];
      if (!expression) continue;

      var fault = describeKoboExpressionFault_(String(expression));
      if (fault) {
        problems.push(
          "[row : " + row + "] " + fault + " in " + column.name +
          (name ? " for " + name : "")
        );
      }
    }

    var listName = extractKoboSelectListName_(type);
    if (listName && !availableLists[listName]) {
      problems.push(
        "[row : " + row + "] List name not in choices sheet: " + listName
      );
    }

    if (name && type !== "end_group" && type !== "end_repeat") {
      if (seenNames[name]) {
        problems.push(
          "[row : " + row + "] Duplicate question name: " + name +
          " (first used on row " + seenNames[name] + ")"
        );
      } else {
        seenNames[name] = row;
      }
    }
  }

  return problems;
}

/**
 * ODK Validate rejects the form for "Mismatched brackets or parentheses in
 * expression", which only shows up once the xlsform reaches Kobo. Report it
 * here instead, against the row it came from.
 * Returns "" when the expression is well formed.
 */
function describeKoboExpressionFault_(expression) {
  var depth = 0;
  var quote = "";

  for (var i = 0; i < expression.length; i++) {
    var ch = expression.charAt(i);

    if (quote) {
      if (ch === quote) quote = "";
      continue;
    }

    if (ch === "'" || ch === '"') {
      quote = ch;
    } else if (ch === "(") {
      depth++;
    } else if (ch === ")") {
      depth--;
      if (depth < 0) return "Unmatched closing parenthesis";
    }
  }

  if (quote) return "Unterminated quote";
  if (depth > 0) {
    return "Mismatched parentheses: " + depth + " unclosed";
  }

  return "";
}

function collectKoboChoiceListNames_(choices) {
  var lists = {};
  if (!choices || choices.length < 2) return lists;

  var header = choices[0];
  var listNameIndex = indexOfKoboColumn_(header, "list_name");
  var nameIndex = indexOfKoboColumn_(header, "name");
  if (listNameIndex === -1 || nameIndex === -1) return lists;

  for (var i = 1; i < choices.length; i++) {
    var listName = String(
      choices[i][listNameIndex] == null ? "" : choices[i][listNameIndex]
    ).trim();
    var choiceName = String(
      choices[i][nameIndex] == null ? "" : choices[i][nameIndex]
    ).trim();
    if (listName && choiceName) lists[listName] = true;
  }

  return lists;
}

function indexOfKoboColumn_(header, columnName) {
  for (var i = 0; i < header.length; i++) {
    if (String(header[i] == null ? "" : header[i]).trim().toLowerCase() === columnName) {
      return i;
    }
  }
  return -1;
}

function extractKoboSelectListName_(type) {
  var match = String(type == null ? "" : type)
    .trim()
    .match(/^select_(?:one|multiple)\s+(\S+)/);
  return match ? match[1] : "";
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
      if (!assetUid) {
        Logger.log(
          "Import completed without a recognizable asset UID [" + tool.id +
          "]: " + JSON.stringify(last.messages || last)
        );
      }
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

  // KPI reports created/updated assets as objects ({uid, kind, summary, ...}),
  // so a plain string match on the entry never finds the UID.
  var messages = importJson.messages || {};
  var buckets = [messages.created, messages.updated];
  for (var b = 0; b < buckets.length; b++) {
    var uid = extractAssetUidFromImportMessages_(buckets[b]);
    if (uid) return uid;
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

function extractAssetUidFromImportMessages_(entries) {
  if (!entries || !entries.length) return "";

  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (!entry) continue;

    if (typeof entry === "object") {
      if (entry.uid) return String(entry.uid);
      var fromUrl = String(entry.url || "").match(/\/assets\/([^/]+)/);
      if (fromUrl) return fromUrl[1];
      continue;
    }

    var fromString = String(entry).match(/\/assets\/([^/]+)/);
    if (fromString) return fromString[1];
  }

  return "";
}

function getKoboAssetVersionId_(assetUid) {
  if (!assetUid) return "";
  var asset = fetchKoboAsset_(assetUid, true);
  return asset && asset.version_id ? String(asset.version_id) : "";
}

function fetchKoboAsset_(assetUid, tolerateMissing) {
  var cfg = getKoboDeploySharedConfig_();
  var response = UrlFetchApp.fetch(
    cfg.base + "/api/v2/assets/" + assetUid + "/?format=json",
    {
      method: "get",
      headers: koboAuthHeaders_(cfg.token),
      muteHttpExceptions: true
    }
  );

  var code = response.getResponseCode();
  if (code >= 300) {
    if (tolerateMissing) return null;
    throw new Error(
      "Failed to read asset " + assetUid + " (" + code + "): " +
      response.getContentText()
    );
  }

  return JSON.parse(response.getContentText());
}

function countKoboAssetContent_(asset) {
  var content = (asset && asset.content) || {};
  return {
    survey: content.survey ? content.survey.length : 0,
    choices: content.choices ? content.choices.length : 0
  };
}

/**
 * Kobo marks the import complete before the new asset content is always
 * readable, and deploying the pre-import version fails with pyxform errors
 * such as "There should be a choices sheet in this xlsform".
 * Wait until the asset carries a new version with survey + choices content.
 */
function waitForKoboDeployableAsset_(assetUid, previousVersionId) {
  var asset = null;

  for (var attempt = 0; attempt < 12; attempt++) {
    asset = fetchKoboAsset_(assetUid, false);
    var counts = countKoboAssetContent_(asset);
    var versionId = String(asset.version_id || "");
    var isNewVersion = !previousVersionId || versionId !== previousVersionId;

    if (isNewVersion && counts.survey > 0 && counts.choices > 0) {
      Logger.log(
        "Asset " + assetUid + " ready — version_id=" + versionId +
        ", survey rows=" + counts.survey + ", choices rows=" + counts.choices
      );
      return asset;
    }

    Logger.log(
      "Waiting for imported content on " + assetUid + " — version_id=" +
      versionId + ", survey rows=" + counts.survey + ", choices rows=" +
      counts.choices
    );
    Utilities.sleep(2500);
  }

  var finalCounts = countKoboAssetContent_(asset);
  if (finalCounts.choices === 0) {
    throw new Error(
      "Asset " + assetUid + " has no choices content after import. Confirm the " +
      "form spreadsheet has a 'choices' tab with list_name, name and label " +
      "columns, then rebuild before deploying."
    );
  }

  throw new Error(
    "Asset " + assetUid + " did not report a new version after import " +
    "(version_id still " + previousVersionId + ")."
  );
}

/**
 * Deploy (or redeploy) an asset.
 */
function deployKoboAsset_(assetUid, previousVersionId) {
  var cfg = getKoboDeploySharedConfig_();
  var assetUrl = cfg.base + "/api/v2/assets/" + assetUid + "/";
  var deployUrl = assetUrl + "deployment/";

  var asset = waitForKoboDeployableAsset_(assetUid, previousVersionId || "");
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
