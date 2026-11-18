/**
 * QuIPS — secret keys and asset details.
 *
 * One Apps Script project, five files (all share a global function scope):
 *   1. QuIPS_Secrets.js            this file
 *   2. QuIPS_Data_Extraction.js    fetch + column transform
 *   3. QuIPS_Facility_Targets.js   observation targets by facility code
 *   4. QuIPS_Scoring.js            quality-of-care and section scores
 *   5. QuIPS_Data_Quality.js       integrity checks, formatting, dedupe
 *
 * The Kobo API token and form asset UID live only in this file.
 * Run installQuipsSecrets once from the editor. That copies them into
 * Script Properties (Project Settings → Script properties). The other
 * files read getQuipsSecrets_() and never contain the token or asset UID.
 *
 * Sheet name keeps its trailing space. That is the live tab name.
 */

var QUIPS_SECRET_DEFAULTS = {
  apiToken: "1faf1291cb5e472b7f5a253f3888380d28e7900b",
  formUid: "aSwMMq2L7UbfpRAvLFkL6d",
  koboDataServer: "https://kc.humanitarianresponse.info",
  startDate: "2026-04-30T00:00:00",
  sheetName: "QuIPS Transformed Data "
};

function installQuipsSecrets() {
  var defaults = QUIPS_SECRET_DEFAULTS;
  PropertiesService.getScriptProperties().setProperties({
    QUIPS_API_TOKEN: defaults.apiToken,
    QUIPS_FORM_UID: defaults.formUid,
    QUIPS_KOBO_DATA_SERVER: defaults.koboDataServer,
    QUIPS_START_DATE: defaults.startDate,
    QUIPS_SHEET_NAME: defaults.sheetName
  }, false);
  Logger.log("QuIPS secrets saved to Script Properties.");
}

function getQuipsSecrets_() {
  var defaults = QUIPS_SECRET_DEFAULTS;
  var props = PropertiesService.getScriptProperties();
  var apiToken = props.getProperty("QUIPS_API_TOKEN") || defaults.apiToken;
  var formUid = props.getProperty("QUIPS_FORM_UID") || defaults.formUid;
  var koboDataServer = props.getProperty("QUIPS_KOBO_DATA_SERVER") || defaults.koboDataServer;
  var startDate = props.getProperty("QUIPS_START_DATE") || defaults.startDate;
  var sheetName = props.getProperty("QUIPS_SHEET_NAME") || defaults.sheetName;

  if (!apiToken || !formUid) {
    throw new Error(
      "QuIPS API token or form asset UID is missing. Open QuIPS_Secrets.js and run installQuipsSecrets."
    );
  }

  return {
    apiToken: apiToken,
    formUid: formUid,
    koboDataServer: String(koboDataServer).replace(/\/$/, ""),
    startDate: startDate,
    sheetName: sheetName
  };
}
