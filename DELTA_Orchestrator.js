/****************************
 * DELTA IMPORT ORCHESTRATOR
 *
 * Keep this file in the same Apps Script project as:
 *   - DELTA_1.0_Data_Importation.js
 *   - DELTA_Newborn_Modules.js
 ****************************/

// Normal scheduled entry point. A script lock prevents overlapping time-driven
// triggers from clearing and rewriting the same spreadsheet simultaneously.
function runAllDeltaImports() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  const failures = [];

  try {
    ORCH_runStep(
      "Maternal & Newborn Curriculum",
      importRapidProAndMerge,
      failures
    );
    ORCH_runStep(
      "DELTA Newborn Modules",
      importDeltaNewbornModules,
      failures
    );
  } finally {
    lock.releaseLock();
  }

  if (failures.length) {
    throw new Error(
      "One or more DELTA imports failed:\n" + failures.join("\n")
    );
  }

  Logger.log("✔ All DELTA imports completed.");
}

// Historical backfills are separate from the normal import because archives
// are large and can consume a full Apps Script execution. Run this repeatedly
// until both backfills report no remaining archives.
function runAllDeltaArchiveBackfills() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  const failures = [];

  try {
    ORCH_runStep(
      "Maternal archive backfill",
      backfillArchivedRuns,
      failures
    );
    ORCH_runStep(
      "Newborn archive backfill",
      backfillNewbornArchivedRuns,
      failures
    );
  } finally {
    lock.releaseLock();
  }

  if (failures.length) {
    throw new Error(
      "One or more DELTA archive backfills failed:\n" +
      failures.join("\n")
    );
  }

  Logger.log("✔ All DELTA archive backfills completed this pass.");
}

function ORCH_runStep(name, callback, failures) {
  const startedAt = Date.now();
  Logger.log(`▶ Starting ${name}`);

  try {
    callback();
    Logger.log(
      `✔ Finished ${name} in ${Math.round((Date.now() - startedAt) / 1000)}s`
    );
  } catch (error) {
    const message = `${name}: ${error && error.message ? error.message : error}`;
    failures.push(message);
    Logger.log(`✖ ${message}`);
  }
}
