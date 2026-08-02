function updateAllStatusesByName() {

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

  // ----------------------------
  // FACILITY MAPS
  // ----------------------------

  // normalized facility → codes
  const facilityToCodes = {};

  // code → raw names
  const facilityVariants = {};

  data.forEach(row => {

    const facility = row[colFacility - 1];
    const code = row[colFacilityCode - 1];

    if (!facility || !code) return;

    const norm = normalizeFacility(facility);
    const codeStr = String(code);

    // Same facility linked to multiple codes
    if (!facilityToCodes[norm]) {
      facilityToCodes[norm] = new Set();
    }

    facilityToCodes[norm].add(codeStr);

    // Raw names per code
    if (!facilityVariants[codeStr]) {
      facilityVariants[codeStr] = new Set();
    }

    facilityVariants[codeStr]
      .add(String(facility).trim());

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
    // ----------------------------
    if (dateReactivated) {
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

    if (
      facilityCode &&
      !/^\d{1,5}$/.test(
        String(facilityCode)
      )
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
    // FACILITY CONSISTENCY
    // ----------------------------
    const facility = row[colFacility - 1];

    if (facility) {

      const norm =
        normalizeFacility(facility);

      // Same facility linked to multiple codes
      if (
        facilityToCodes[norm] &&
        facilityToCodes[norm].size > 1
      ) {

        addError(
          colFacility,
          "Facility maps to multiple codes."
        );

      }

      // Same code but spelling variation
      if (facilityCode) {

        const codeStr =
          String(facilityCode);

        const variants =
          facilityVariants[codeStr];

        if (
          variants &&
          variants.size > 1
        ) {

          const normalizedVariants =
            new Set(
              [...variants].map(v =>
                normalizeFacility(v)
              )
            );

          if (
            normalizedVariants.size === 1
          ) {

            addError(
              colFacility,
              "Facility name has likely been misspelt!"
            );

          }

        }

      }

    }

    // ----------------------------
    // PROGRAM LOGIC
    // ----------------------------
    const program =
      row[colProgram - 1];

    if (
      program ===
      "MENTORS Curriculum"
    ) {

      if (
        row[colEmONC - 1] === "No"
      ) {

        addError(
          colProgram,
          "EmONC must be Yes for MENTORS Curriculum."
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
