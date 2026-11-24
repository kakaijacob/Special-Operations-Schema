/**
 * QuIPS — start the full run.
 *
 * Run runQuips from the Apps Script editor. That is the same job the old
 * single script did in fetchKoboData_Generic:
 *   1. Save the API token and asset UID into Script Properties if they
 *      are not there yet
 *   2. Fetch new Kobo submissions and append transformed columns
 *   3. Score each new row
 *   4. Highlight negative durations and refresh the integrity checks
 *
 * dedupeQuipsSheetByUuid stays manual. The old script did not run it
 * on every pull.
 */

function runQuips() {
  ensureQuipsSecretsInstalled_();
  Logger.log("Starting full QuIPS run: fetch, transform, score, data quality.");
  fetchKoboData_Generic();
  Logger.log("Full QuIPS run finished.");
}

function ensureQuipsSecretsInstalled_() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty("QUIPS_API_TOKEN") || !props.getProperty("QUIPS_FORM_UID")) {
    installQuipsSecrets();
  }
}
