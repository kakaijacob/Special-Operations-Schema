/**
 * QuIPS — secret keys and asset details.
 *
 * One Apps Script project. All files share a global function scope.
 * Run runQuips in QuIPS_Run.js. That starts the full pull.
 *
 * The Kobo API token and form asset UID live only in this file.
 * runQuips copies them into Script Properties on the first run.
 * The other files read getQuipsSecrets_().
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
