function updateAllStatusesByName() {

  const MASTER_FACILITIES_SHEET_ID =
    "1EEZJU-DNERkydsMIDtCu-19hzopurtAR7cN5cZ6bvFI";

  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName("Mentees");

  const headerRow = 1;
  const commentRow = 2;

  const headers = sheet
    .getRange(headerRow, 1, 1, sheet.getLastColumn())
    .getValues()[0];

  // Core columns
  const colDateActivated = headers.indexOf("Date Activated") + 1;
  const colDateReactivated = headers.indexOf("Date Reactivated") + 1;
  const colDateDeactivated = headers.indexOf("Date Deactivated") + 1;
  const colStatus = headers.indexOf("Status") + 1;
  const colReasonForDeactivation = headers.indexOf("Reason for Deactivation") + 1;
  const colLearningMode = headers.indexOf("Learning Mode") + 1;

  // Validation columns
  const colFacilityCode = headers.indexOf("Facility Code") + 1;
  const colFacility = headers.indexOf("Facility") + 1;
  const colMenteeID = headers.indexOf("Mentee ID") + 1;
  const colProgram = headers.indexOf("Program") + 1;

  const colEmONC = headers.indexOf("EmONC In-person") + 1;
  const colEssentialNB = headers.indexOf("Essential Newborn In-person") + 1;
  const colComprehensiveNB = headers.indexOf("Comprehensive Newborn In-person") + 1;

  const colDeltaEmONC = headers.indexOf("EmONC DELTA") + 1;
  const colDeltaEssential = headers.indexOf("Essential Newborn DELTA") + 1;
  const colDeltaContinuum = headers.indexOf("Continuum of Care") + 1;

  const lastRow = sheet.getLastRow();

  if (lastRow <= commentRow) return;

  const numRows = lastRow - commentRow;

  const data = sheet
    .getRange(
      commentRow + 1,
      1,
      numRows,
      sheet.getLastColumn()
    )
    .getValues();

  // ----------------------------
  // NORMALIZATION
  // ----------------------------
  function normalizeFacility(name) {

    return String(name || "")
      .toLowerCase()
      .replace(/['".\-_]/g, "")
      .replace(/\s+/g, "")
      .trim();

  }

  function normalizeCode(code) {

    return String(code || "")
      .replace(/\.0$/, "")
      .trim();

  }

  function findHeaderIndex(headerValues, label) {

    const target = String(label || "")
      .toLowerCase()
      .trim();

    return headerValues.findIndex(
      h => String(h || "").toLowerCase().trim() === target
    );

  }

  // ----------------------------
  // MASTER FACILITY LIST
  // ----------------------------
  // dhis code → canonical facility name
  const masterByCode = {};

  // normalized facility name → [{ code, facility }]
  const masterByNormName = {};

  const masterSheet = SpreadsheetApp
    .openById(MASTER_FACILITIES_SHEET_ID)
    .getSheets()[0];

  const masterLastRow = masterSheet.getLastRow();
  const masterLastCol = masterSheet.getLastColumn();

  if (masterLastRow > 1 && masterLastCol > 0) {

    const masterValues = masterSheet
      .getRange(1, 1, masterLastRow, masterLastCol)
      .getValues();

    const masterHeaders = masterValues[0];
    const idxMasterCode = findHeaderIndex(masterHeaders, "dhis code");
    const idxMasterFacility = findHeaderIndex(masterHeaders, "facility");

    if (idxMasterCode === -1 || idxMasterFacility === -1) {
      throw new Error(
        "Master facilities sheet must include 'dhis code' and 'facility' columns."
      );
    }

    for (let r = 1; r < masterValues.length; r++) {

      const masterRow = masterValues[r];
      const codeStr = normalizeCode(masterRow[idxMasterCode]);
      const facilityName = String(
        masterRow[idxMasterFacility] || ""
      ).trim();

      if (!codeStr || !facilityName) continue;

      masterByCode[codeStr] = facilityName;

      const norm = normalizeFacility(facilityName);

      if (!masterByNormName[norm]) {
        masterByNormName[norm] = [];
      }

      masterByNormName[norm].push({
        code: codeStr,
        facility: facilityName
      });

    }

  }

  // ----------------------------
  // INTRA-SHEET FACILITY MAPS
  // ----------------------------

  // normalized facility → codes
  const facilityToCodes = {};

  data.forEach(row => {

    const facility = row[colFacility - 1];
    const code = row[colFacilityCode - 1];

    if (!facility || !code) return;

    const norm = normalizeFacility(facility);
    const codeStr = normalizeCode(code);

    // Same facility linked to multiple codes
    if (!facilityToCodes[norm]) {
      facilityToCodes[norm] = new Set();
    }

    facilityToCodes[norm].add(codeStr);

  });
  // ----------------------------
  // CLEAR FORMATTING
  // ----------------------------
  const fullRange = sheet.getRange(
    commentRow + 1,
    1,
    numRows,
    sheet.getLastColumn()
  );

  fullRange.setBackground(null);
  fullRange.clearNote();

  // ----------------------------
  // MAIN LOOP
  // ----------------------------
  data.forEach((row, i) => {

    const rowNum = commentRow + 1 + i;

    const dateActivated = row[colDateActivated - 1];
    const dateReactivated = row[colDateReactivated - 1];
    const dateDeactivated = row[colDateDeactivated - 1];

    let status = "Inactive";

    let invalidMap = {};

    function addError(col, msg) {

      if (!invalidMap[col]) {
        invalidMap[col] = [];
      }

      invalidMap[col].push(msg);

    }

    // ----------------------------
    // STATUS LOGIC
    // Eligible → Active, Ineligible → Inactive; otherwise derive from dates.
    // ----------------------------
    var existingStatus = String(row[colStatus - 1] || "")
      .trim()
      .toLowerCase();

    if (existingStatus === "eligible") {
      status = "Active";

    } else if (existingStatus === "ineligible") {
      status = "Inactive";

    } else if (dateReactivated) {
      status = "Active";

    } else if (dateDeactivated) {
      status = "Inactive";

    } else if (dateActivated) {
      status = "Active";

    } else {
      status = "Inactive";
    }

    sheet
      .getRange(rowNum, colStatus)
      .setValue(status);

    // ----------------------------
    // LEARNING MODE
    // ----------------------------
    if (colLearningMode > 0) {

      const anyInPerson =
        row[colEmONC - 1] === "Yes" ||
        row[colEssentialNB - 1] === "Yes" ||
        row[colComprehensiveNB - 1] === "Yes";

      const anyDelta =
        row[colDeltaEmONC - 1] === "Yes" ||
        row[colDeltaEssential - 1] === "Yes";

      let learningMode = "";

      if (anyInPerson && anyDelta) {
        learningMode = "Hybrid (Both)";

      } else if (anyInPerson) {
        learningMode = "In-person Only";

      } else if (anyDelta) {
        learningMode = "Virtually (DELTA)";
      }

      sheet
        .getRange(rowNum, colLearningMode)
        .setValue(learningMode);

    }

    // ----------------------------
    // ROW START CHECK
    // ----------------------------
    const isRowStarted = row.some(
      v => v !== "" && v !== null
    );

    const requiredFields = [
      "Program",
      "EmONC In-person",
      "EmONC DELTA",
      "Essential Newborn In-person",
      "Essential Newborn DELTA",
      "Comprehensive Newborn In-person",
      "Continuum of Care",
      "Name",
      "Mentee ID",
      "County",
      "Facility Code",
      "Facility",
      "Cadre",
      "Gender",
      "New or Existing?",
      "Date Activated"
    ];

    if (isRowStarted) {

      requiredFields.forEach(field => {

        const idx = headers.indexOf(field);

        if (idx !== -1 && !row[idx]) {

          addError(
            idx + 1,
            `${field} is required.`
          );

        }

      });

      const reasonForDeactivation = row[colReasonForDeactivation - 1];

      if (
        status === "Inactive" &&
        (
          reasonForDeactivation === null ||
          String(reasonForDeactivation).trim() === ""
        )
      ) {

        addError(
          colReasonForDeactivation,
          "Required if mentee is mapped as 'Inactive'!"
        );

      }

    }

    // ----------------------------
    // DATE VALIDATIONS
    // ----------------------------
    if (
      dateActivated &&
      dateReactivated &&
      dateReactivated < dateActivated
    ) {

      addError(
        colDateReactivated,
        "Cannot be earlier than Date Activated."
      );

    }

    if (
      dateActivated &&
      dateDeactivated &&
      dateDeactivated < dateActivated
    ) {

      addError(
        colDateDeactivated,
        "Cannot be earlier than Date Activated."
      );

    }

    if (
      dateDeactivated &&
      dateReactivated &&
      dateReactivated < dateDeactivated
    ) {

      addError(
        colDateReactivated,
        "Cannot be earlier than Date Deactivated."
      );

    }

    // ----------------------------
    // FACILITY CODE VALIDATION
    // ----------------------------
    const facilityCode = row[colFacilityCode - 1];
    const codeStr = normalizeCode(facilityCode);

    if (
      facilityCode &&
      !/^\d{1,5}$/.test(codeStr)
    ) {

      addError(
        colFacilityCode,
        "Must be up to 5 digits."
      );

    }

    // ----------------------------
    // MENTEE ID VALIDATION
    // ----------------------------
    const menteeID = row[colMenteeID - 1];

    if (
      menteeID &&
      !/^[17]\d{8}$/.test(
        String(menteeID)
      )
    ) {

      addError(
        colMenteeID,
        "Must be 9 digits starting with 1 or 7."
      );

    }

    // ----------------------------
    // FACILITY MASTER + CONSISTENCY
    // ----------------------------
    const facility = row[colFacility - 1];
    const facilityName = String(facility || "").trim();
    const norm = normalizeFacility(facilityName);

    if (facilityName) {

      // Same facility linked to multiple codes in mentee sheet
      if (
        facilityToCodes[norm] &&
        facilityToCodes[norm].size > 1
      ) {

        addError(
          colFacility,
          "Facility maps to multiple codes."
        );

      }

    }

    // Master list: code + spelling checks
    if (codeStr && /^\d{1,5}$/.test(codeStr)) {

      const masterFacility = masterByCode[codeStr];

      if (!masterFacility) {

        addError(
          colFacilityCode,
          "Facility Code not found in master facilities list."
        );

      } else if (facilityName) {

        const masterNorm =
          normalizeFacility(masterFacility);

        if (norm !== masterNorm) {

          // Name may belong to a different master facility
          const matchesByName =
            masterByNormName[norm] || [];

          if (matchesByName.length > 0) {

            const suggested = matchesByName
              .map(m => `${m.facility} (${m.code})`)
              .join("; ");

            addError(
              colFacility,
              `Facility name does not match this code. Master name for code ${codeStr} is "${masterFacility}". Name matches: ${suggested}.`
            );

            addError(
              colFacilityCode,
              `Code/name mismatch. Expected facility "${masterFacility}" for this code.`
            );

          } else {

            addError(
              colFacility,
              `Facility name has likely been misspelt! Expected "${masterFacility}" for code ${codeStr}.`
            );

          }

        }

      }

    } else if (facilityName) {

      // No usable code: still check if facility name exists in master
      const matchesByName =
        masterByNormName[norm] || [];

      if (matchesByName.length === 0) {

        addError(
          colFacility,
          "Facility name not found in master facilities list."
        );

      } else if (!codeStr) {

        const suggested = matchesByName
          .map(m => `${m.facility} (${m.code})`)
          .join("; ");

        addError(
          colFacilityCode,
          `Facility Code is missing. Possible master match: ${suggested}.`
        );

      }

    }

    // ----------------------------
    // PROGRAM LOGIC
    // ----------------------------
    const program =
      row[colProgram - 1];

    if (
      program ===
      "EmONC Curriculum"
    ) {

      if (
        row[colEmONC - 1] === "No"
      ) {

        addError(
          colProgram,
          "EmONC must be Yes for EmONC Curriculum."
        );

      }

      if (row[colEssentialNB - 1] === "Yes") {

        addError(
          colEssentialNB,
          `Program mismatch! Mentee mapped for ${program}.`
        );

      }

      if (row[colComprehensiveNB - 1] === "Yes") {

        addError(
          colComprehensiveNB,
          `Program mismatch! Mentee mapped for ${program}.`
        );

      }

    }

    if (
      program ===
      "Newborn Curriculum"
    ) {

      const essential =
        row[colEssentialNB - 1];

      const comp =
        row[colComprehensiveNB - 1];

      if (row[colEmONC - 1] === "Yes") {

        addError(
          colEmONC,
          `Program mismatch! Mentee mapped for ${program}.`
        );

      }

      if (
        essential !== "Yes" &&
        comp !== "Yes"
      ) {

        addError(
          colProgram,
          "At least one newborn option must be Yes."
        );

      }

    }

    if (program === "Other") {

      const d1 =
        row[colDeltaEmONC - 1];

      const d2 =
        row[colDeltaEssential - 1];

      const d3 =
        row[colDeltaContinuum - 1];

      if (row[colEmONC - 1] === "Yes") {

        addError(
          colEmONC,
          `Program mismatch! Mentee mapped for ${program}.`
        );

      }

      if (row[colEssentialNB - 1] === "Yes") {

        addError(
          colEssentialNB,
          `Program mismatch! Mentee mapped for ${program}.`
        );

      }

      if (row[colComprehensiveNB - 1] === "Yes") {

        addError(
          colComprehensiveNB,
          `Program mismatch! Mentee mapped for ${program}.`
        );

      }

      if (
        d1 !== "Yes" &&
        d2 !== "Yes" &&
        d3 !== "Yes"
      ) {

        addError(
          colDeltaEmONC,
          "At least one DELTA must be Yes."
        );

        addError(
          colDeltaEssential,
          "At least one DELTA must be Yes."
        );

        addError(
          colDeltaContinuum,
          "At least one DELTA must be Yes."
        );

      }

    }

    if (program === "Both") {

      const emoncYes =
        row[colEmONC - 1] === "Yes";

      const essentialYes =
        row[colEssentialNB - 1] === "Yes";

      const compYes =
        row[colComprehensiveNB - 1] === "Yes";

      if (
        !emoncYes ||
        (
          !essentialYes &&
          !compYes
        )
      ) {

        addError(
          colProgram,
          "For 'Both': EmONC must be Yes AND one newborn option must be Yes."
        );

      }

    }

    // ----------------------------
    // APPLY ERRORS
    // ----------------------------
    if (
      Object.keys(invalidMap).length > 0
    ) {

      Object.keys(
        invalidMap
      ).forEach(col => {

        const cell =
          sheet.getRange(
            rowNum,
            Number(col)
          );

        cell
          .setBackground(
            "#F4CCCC"
          );

        cell
          .setNote(
            invalidMap[col]
              .join("\n")
          );

      });

    }

  });

}
