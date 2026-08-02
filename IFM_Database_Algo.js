function updateAllStatusesByName() {

  const MASTER_FACILITIES_SHEET_ID =
    "1EEZJU-DNERkydsMIDtCu-19hzopurtAR7cN5cZ6bvFI";

  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName("Mentors (IFMs)");

  const headerRow = 1;
  const commentRow = 2;

  const headers = sheet
    .getRange(headerRow, 1, 1, sheet.getLastColumn())
    .getValues()[0];

  // ----------------------------
  // CORE COLUMNS
  // ----------------------------
  const colName = headers.indexOf("Name") + 1;
  const colMentorID = headers.indexOf("Mentor ID") + 1;
  const colCounty = headers.indexOf("County") + 1;
  const colFacilityCode = headers.indexOf("Facility Code") + 1;
  const colFacility = headers.indexOf("Facility") + 1;
  const colCadre = headers.indexOf("Cadre") + 1;
  const colGender = headers.indexOf("Gender") + 1;
  const colProgram = headers.indexOf("Program") + 1;

  const colDateActivated = headers.indexOf("Date Activated") + 1;
  const colDateReactivated = headers.indexOf("Date Reactivated") + 1;
  const colDateDeactivated = headers.indexOf("Date Deactivated") + 1;

  const colTrainedAfter2024 = headers.indexOf("Trained After 2024?") + 1;
  const colStatus = headers.indexOf("Status") + 1;
  const colReasonInactivity = headers.indexOf("Reason for Inactivity") + 1;

  const lastRow = sheet.getLastRow();
  if (lastRow <= commentRow) return;

  const numRows = lastRow - commentRow;

  const data = sheet
    .getRange(commentRow + 1, 1, numRows, sheet.getLastColumn())
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
      header => String(header || "").toLowerCase().trim() === target
    );
  }

  // ----------------------------
  // MASTER FACILITY LIST
  // ----------------------------
  const masterByCode = {};
  const masterByNormName = {};

  const masterSheet = SpreadsheetApp
    .openById(MASTER_FACILITIES_SHEET_ID)
    .getSheets()[0];

  const masterLastRow = masterSheet.getLastRow();
  const masterLastColumn = masterSheet.getLastColumn();

  if (masterLastRow <= 1 || masterLastColumn === 0) {
    throw new Error(
      "The master facilities sheet contains no facility data."
    );
  }

  const masterValues = masterSheet
    .getRange(1, 1, masterLastRow, masterLastColumn)
    .getValues();

  const masterHeaders = masterValues[0];
  const idxMasterCode = findHeaderIndex(masterHeaders, "dhis code");
  const idxMasterFacility = findHeaderIndex(masterHeaders, "facility");

  if (idxMasterCode === -1 || idxMasterFacility === -1) {
    throw new Error(
      "Master facilities sheet must include 'dhis code' and 'facility' columns."
    );
  }

  for (let rowIndex = 1; rowIndex < masterValues.length; rowIndex++) {
    const masterRow = masterValues[rowIndex];
    const code = normalizeCode(masterRow[idxMasterCode]);
    const facilityName = String(
      masterRow[idxMasterFacility] || ""
    ).trim();

    if (!code || !facilityName) continue;

    masterByCode[code] = facilityName;

    const normalizedName = normalizeFacility(facilityName);

    if (!masterByNormName[normalizedName]) {
      masterByNormName[normalizedName] = [];
    }

    masterByNormName[normalizedName].push({
      code: code,
      facility: facilityName
    });
  }

  // ----------------------------
  // INTRA-SHEET FACILITY MAP
  // ----------------------------
  const facilityToCodes = {};

  data.forEach(row => {

    const facility = row[colFacility - 1];
    const code = row[colFacilityCode - 1];

    if (!facility || !code) return;

    const norm = normalizeFacility(facility);
    const codeStr = normalizeCode(code);

    if (!facilityToCodes[norm]) {
      facilityToCodes[norm] = new Set();
    }
    facilityToCodes[norm].add(codeStr);
  });

  // ----------------------------
  // CLEAR PREVIOUS FORMATTING
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
      if (!invalidMap[col]) invalidMap[col] = [];
      invalidMap[col].push(msg);
    }

    // ----------------------------
    // STATUS LOGIC (SIMPLIFIED)
    // ----------------------------
    if (dateReactivated) {
      status = "Active";
    } else if (dateActivated && !dateDeactivated) {
      status = "Active";
    } else {
      status = "Inactive";
    }

    sheet.getRange(rowNum, colStatus).setValue(status);

    // ----------------------------
    // REQUIRED FIELD VALIDATION (STRICT CORE ONLY)
    // ----------------------------
    const requiredFields = [
      "Name",
      "Mentor ID",
      "County",
      "Facility Code",
      "Facility",
      "Cadre",
      "Gender",
      "Program",
      "Trained After 2024?",
      "Status",
      "Reason for Inactivity"
    ];

    const isRowStarted = row.some(v => v !== "" && v !== null);

    if (isRowStarted) {
      requiredFields.forEach(field => {
        const idx = headers.indexOf(field);
        if (idx !== -1 && !row[idx]) {
          addError(idx + 1, `${field} is required.`);
        }
      });
    }

    // ----------------------------
    // DATE VALIDATIONS (ONLY CONSISTENCY CHECKS)
    // ----------------------------
    if (dateActivated && dateReactivated && dateReactivated < dateActivated) {
      addError(colDateReactivated, "Cannot be earlier than Date Activated.");
    }

    if (dateActivated && dateDeactivated && dateDeactivated < dateActivated) {
      addError(colDateDeactivated, "Cannot be earlier than Date Activated.");
    }

    if (dateDeactivated && dateReactivated && dateReactivated < dateDeactivated) {
      addError(colDateReactivated, "Cannot be earlier than Date Deactivated.");
    }

    // ----------------------------
    // FACILITY CODE VALIDATION
    // ----------------------------
    const facilityCode = row[colFacilityCode - 1];
    const codeStr = normalizeCode(facilityCode);

    if (facilityCode && !/^\d{1,5}$/.test(codeStr)) {
      addError(colFacilityCode, "Must be up to 5 digits.");
    }

    // ----------------------------
    // MENTOR ID VALIDATION
    // ----------------------------
    const mentorID = row[colMentorID - 1];

    if (mentorID && !/^[17]\d{8}$/.test(String(mentorID))) {
      addError(colMentorID, "Must be 9 digits starting with 1 or 7.");
    }

    // ----------------------------
    // FACILITY MASTER + CONSISTENCY
    // ----------------------------
    const facility = row[colFacility - 1];
    const facilityName = String(facility || "").trim();
    const normalizedFacility = normalizeFacility(facilityName);

    if (facilityName) {
      if (
        facilityToCodes[normalizedFacility] &&
        facilityToCodes[normalizedFacility].size > 1
      ) {
        addError(colFacility, "Facility maps to multiple codes.");
      }
    }

    if (codeStr && /^\d{1,5}$/.test(codeStr)) {
      const masterFacility = masterByCode[codeStr];

      if (!masterFacility) {
        addError(
          colFacilityCode,
          "Facility Code not found in master facilities list."
        );
      } else if (facilityName) {
        const normalizedMasterFacility =
          normalizeFacility(masterFacility);

        if (normalizedFacility !== normalizedMasterFacility) {
          const matchesByName =
            masterByNormName[normalizedFacility] || [];

          if (matchesByName.length > 0) {
            const possibleMatches = matchesByName
              .map(match => `${match.facility} (${match.code})`)
              .join("; ");

            addError(
              colFacility,
              `Facility name does not match code ${codeStr}. Expected "${masterFacility}". Entered name matches: ${possibleMatches}.`
            );

            addError(
              colFacilityCode,
              `Code/name mismatch. Code ${codeStr} belongs to "${masterFacility}".`
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
      const matchesByName =
        masterByNormName[normalizedFacility] || [];

      if (matchesByName.length === 0) {
        addError(
          colFacility,
          "Facility name not found in master facilities list."
        );
      } else if (!codeStr) {
        const possibleMatches = matchesByName
          .map(match => `${match.facility} (${match.code})`)
          .join("; ");

        addError(
          colFacilityCode,
          `Facility Code is missing. Possible master match: ${possibleMatches}.`
        );
      }
    }

    // ----------------------------
    // INACTIVITY RULE
    // ----------------------------
    const reason = row[colReasonInactivity - 1];

    if (status === "Inactive" && !reason) {
      addError(colReasonInactivity, "Reason for Inactivity is required when status is Inactive.");
    }

    // ----------------------------
    // APPLY ERRORS
    // ----------------------------
    if (Object.keys(invalidMap).length > 0) {

      Object.keys(invalidMap).forEach(col => {

        const cell = sheet.getRange(rowNum, Number(col));

        cell.setBackground("#F4CCCC");
        cell.setNote(invalidMap[col].join("\n"));

      });
    }

  });
}
