// =====================================================
// FULLY INTEGRATED WORKFLOW (11 SHEETS)
// =====================================================
function generateAllOutputs() {
  generateMenteeList();
  generateVariableNames();
  generateMenteeFacilityLogic();
  generateMoHSkillsChecklist();
  generateCurriculumTrackingForm();
  generateChoicesSheet();
  generateEmONCFacilitiesChoicesSheet();
  generateFacilitiesChoicesSheet();
  generateIFMAssessmentSheet();
  generateIFMChoicesSheet();
  generateNewbornAssessmentSheet();
  generateNewbornChoicesSheet()
  generateSurveySheetIFM(); // ✅ NEW;
  generateSurveySheetNewborn(); // ✅ NEW
}

// =====================================================
// 1️⃣ MENTEE LIST
// =====================================================
function generateMenteeList() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Mentee Database");
  var data = sheet.getDataRange().getValues();
  var header = data[0];

  var idIndex = header.indexOf("Mentee ID");
  var nameIndex = header.indexOf("Name");
  var countyIndex = header.indexOf("County");
  var facilityIndex = header.indexOf("Facility");
  var programIndex = header.indexOf("Program");

  var menteeSheet = getOrCreateSheet("Mentee List");
  var output = [["Mentee Kobo","County","Facility","Program"]];

  for (var i = 1; i < data.length; i++) {
    if (!data[i][idIndex] || !data[i][nameIndex]) continue;
    var menteeKobo = data[i][idIndex] + "_" + cleanForKobo(data[i][nameIndex]);
    output.push([menteeKobo,data[i][countyIndex],data[i][facilityIndex],data[i][programIndex]]);
  }

  menteeSheet.getRange(1,1,output.length,output[0].length).setValues(output);
}

// =====================================================
// 2️⃣ VARIABLE NAMES
// =====================================================
function generateVariableNames() {

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Mentee Database");
  var data = sheet.getDataRange().getValues();
  var header = data[0];

  var countyIndex = header.indexOf("County");
  var facilityIndex = header.indexOf("Facility");
  var programIndex = header.indexOf("Program");
  var facilityCodeIndex = header.indexOf("Facility Code");
  var statusIndex = header.indexOf("Status");

  var variableSheet = getOrCreateSheet("Variable Names");

  var output = [[
    "County",
    "Facility",
    "Facility Code",
    "Program",
    "Status",
    "Data Type",
    "Multiple Variable",
    "Kobo Variable",
    "Kobo Label",
    "Skills Assessments Kobo Logic",
    "Curriculum Tracking Kobo Logic"
  ]];

  // =====================================================
  // Tracks processed facility-program-status combinations
  // =====================================================
  var processed = {};

  // Facilities that have at least one selectable mentee, so a question is
  // never written for a list that the choices sheet will leave empty.
  var selectable = getSelectableMenteeFacilities_(data, header);
  var excludedFacilities = {};

  for (var i = 1; i < data.length; i++) {

    var county = data[i][countyIndex];
    var facility = data[i][facilityIndex];
    var program = data[i][programIndex];
    var code = data[i][facilityCodeIndex];
    var status = statusIndex > -1 ? data[i][statusIndex] : "";

    if (!county || !facility || !code) continue;

    // =====================================================
    // Clean status
    // =====================================================
    var cleanedStatus = String(status)
      .trim()
      .toLowerCase();

    // Allocated per facility code so two similarly named facilities cannot
    // produce two questions with the same name.
    var koboVariable =
      selectable.emoncListNameByCode[String(code).trim()] ||
      generateKoboVariable(facility);
    var cleanedFacility = cleanForKobo(facility);
    var facilityKobo = code + "_" + cleanedFacility;
    var logicCounty = cleanForKobo(county);

    // =====================================================
    // Split "both" into two program entries
    // =====================================================
    var programList = [];

    if (program && program.toLowerCase() === "both") {
      programList = [
        "mentors_curriculum",
        "newborn_curriculum"
      ];
    } else {
      programList = [cleanForKobo(program)];
    }

    for (var p = 0; p < programList.length; p++) {

      var logicProgram = programList[p];

      // =====================================================
      // Skip facilities with no mentee behind the question
      // The mentors questions built from this sheet select from
      // "<facility>_mentees"; without an Active mentee carrying an ID and a
      // name that list is empty and Kobo rejects the deployment with
      // "List name not in choices sheet".
      // =====================================================
      if (
        logicProgram === "mentors_curriculum" &&
        cleanedStatus === "active" &&
        !selectable.emoncCodes[String(code).trim()]
      ) {
        excludedFacilities[facility + " (" + koboVariable + ")"] = true;
        continue;
      }

      // =====================================================
      // Unique key now includes status
      // =====================================================
      var uniqueKey =
        code + "_" + logicProgram + "_" + cleanedStatus;

      var activeKey =
        code + "_" + logicProgram + "_active";

      // =====================================================
      // If active already exists, ignore inactive duplicates
      // =====================================================
      if (
        cleanedStatus === "inactive" &&
        processed[activeKey]
      ) {
        continue;
      }

      // =====================================================
      // Prevent duplicate rows
      // =====================================================
      if (processed[uniqueKey]) continue;

      processed[uniqueKey] = true;

      // =====================================================
      // Kobo logic
      // =====================================================
      var skillsLogic =
        `(\${${logicCounty}_facilities} = '${facilityKobo}' and (\${program} = '${logicProgram}'))`;

      var curriculumLogic =
        `(\${${logicCounty}_facilities} = '${facilityKobo}')`;

      // =====================================================
      // Kobo label formatting
      // =====================================================
      var koboLabel = koboVariable
        .split("_")
        .map(function (w) {
          return w.charAt(0).toUpperCase() + w.slice(1);
        })
        .join(" ");

      // =====================================================
      // Push output row
      // =====================================================
      output.push([
        county,
        facility,
        code,
        logicProgram,
        status,
        "select_one " + koboVariable,
        "select_multiple " + koboVariable,
        koboVariable,
        koboLabel,
        skillsLogic,
        curriculumLogic
      ]);
    }
  }

  // =====================================================
  // Sort alphabetically by Facility
  // =====================================================
  output = [output[0]].concat(
    output.slice(1).sort(function (a, b) {
      return a[1].localeCompare(b[1]);
    })
  );

  // =====================================================
  // Write output
  // =====================================================
  variableSheet
    .getRange(1, 1, output.length, output[0].length)
    .setValues(output);

  var excludedList = [];
  for (var excluded in excludedFacilities) {
    excludedList.push(excluded);
  }
  if (excludedList.length) {
    Logger.log(
      "Variable Names: excluded " + excludedList.length + " facility(ies) " +
      "with no Active MENTORS mentee carrying a Mentee ID and Name: " +
      excludedList.sort().join(", ")
    );
  }
}


// getOrCreateSheet(), cleanForKobo() and generateKoboVariable() are defined
// once, near the bottom of this file.

// =====================================================
// 3️⃣ MOH SKILLS ASSESSMENT CHECKLIST – FILTER PROGRAM FOR KOBO
// =====================================================
function generateMoHSkillsChecklist() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var variableSheet = ss.getSheetByName("Variable Names");
  if (!variableSheet) return;

  var data = variableSheet.getDataRange().getValues();
  if (!data || data.length < 2) return;

  var header = data[0];

  // Map original headers to desired output headers
  var columnMap = {
    "County": "County",
    "Facility": "Facility",
    "Facility Code": "Facility Code",
    "Program": "Program",
    "Data Type": "type",
    "Kobo Variable": "name",
    "Kobo Label": "label",
    "Skills Assessments Kobo Logic": "relevant"
  };

  // Final output headers including blank Kobo columns
  var outputHeaders = [
    "County",
    "Facility",
    "Facility Code",
    "Program",
    "type",
    "name",
    "label",
    "hint",
    "required",
    "required_message",
    "constraint_message",
    "parameters",
    "relevant"
  ];

  // Get indexes of original columns
  var indexes = {};
  for (var i = 0; i < header.length; i++) {
    if (columnMap[header[i]]) indexes[columnMap[header[i]]] = i;
  }

  // ✅ ADD STATUS INDEX
  var statusIndex = header.indexOf("Status");
  var programIndex = header.indexOf("Program");

  var outputSheet = getOrCreateSheet("MoH Skills Assessment Checklist");
  var output = [outputHeaders];

  for (var i = 1; i < data.length; i++) {
    var program = data[i][programIndex];
    if (!program) continue;

    // ✅ STATUS FILTER: must be Active
    var status = statusIndex !== -1 ? data[i][statusIndex] : "";
    if (String(status).trim().toLowerCase() !== "active") continue;

    var cleanedProgram = String(program)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");

    // Program filter
    if (cleanedProgram === "mentors_curriculum" || cleanedProgram === "both") {
      var row = [];

      outputHeaders.forEach(function(col) {
        if (col in indexes) {
          row.push(data[i][indexes[col]] || "");
        } else {
          row.push("");
        }
      });

      output.push(row);
    }
  }

  outputSheet.getRange(1, 1, output.length, output[0].length)
             .setValues(output);
}

// =====================================================
// 4️⃣ CURRICULUM TRACKING FORM – FILTER PROGRAM FOR KOBO
// =====================================================
function generateCurriculumTrackingForm() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var variableSheet = ss.getSheetByName("Variable Names");
  if (!variableSheet) return;

  var data = variableSheet.getDataRange().getValues();
  if (!data || data.length < 2) return;

  var header = data[0];

  // Map original headers to desired output headers
  var columnMap = {
    "County": "County",
    "Facility": "Facility",
    "Facility Code": "Facility Code",
    "Program": "Program",
    "Multiple Variable": "type",
    "Kobo Variable": "name",
    "Kobo Label": "label",
    "Curriculum Tracking Kobo Logic": "relevant"
  };

  // The final output order, including blank columns
  var outputHeaders = [
    "County",
    "Facility",
    "Facility Code",
    "Program",
    "type",
    "name",
    "label",
    "hint",
    "required",
    "required_message",
    "constraint_message",
    "relevant",
    "parameters"
  ];

  // Get indexes of original columns
  var indexes = {};
  for (var i = 0; i < header.length; i++) {
    if (columnMap[header[i]]) {
      indexes[columnMap[header[i]]] = i;
    }
  }

  // ✅ ADD STATUS INDEX
  var statusIndex = header.indexOf("Status");

  var outputSheet = getOrCreateSheet("Curriculum Tracking Form");
  var output = [outputHeaders];

  var programIndex = header.indexOf("Program");

  for (var i = 1; i < data.length; i++) {
    var program = data[i][programIndex];
    if (!program) continue;

    // ✅ FILTER: Status must be Active
    var status = statusIndex !== -1 ? data[i][statusIndex] : "";
    if (String(status).trim().toLowerCase() !== "active") continue;

    // Clean program value
    var cleanedProgram = String(program)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");

    // STRICT FILTER: only mentors_curriculum
    if (cleanedProgram === "mentors_curriculum") {
      var row = [];

      outputHeaders.forEach(function(col) {
        if (col in indexes) {
          row.push(data[i][indexes[col]] || "");
        } else {
          row.push("");
        }
      });

      output.push(row);
    }
  }

  // Write to sheet
  outputSheet
    .getRange(1, 1, output.length, output[0].length)
    .setValues(output);
}

// =====================================================
// 5️⃣ EmONC MENTEES LIST (CHOICES)
// =====================================================
function generateChoicesSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Mentee Database");
  var data = sheet.getDataRange().getValues();
  var header = data[0];

  var choicesSheet = getOrCreateSheet("EmONC Mentees List (Choices)");
  var output = [["County","Facility","Facility Code","Program","list_name","name","label"]];

  // One record per Mentee ID + Facility Code, so a mentee who was later
  // deactivated is not offered as a choice.
  var records = resolveMenteeRecords_(data, header);
  var seenChoices = {};

  for (var i = 0; i < records.length; i++) {
    var record = records[i];
    if (!record.isEmONCMentee) continue;

    var choiceKey = record.emoncListName + "|" + record.choiceName;
    if (seenChoices[choiceKey]) continue;
    seenChoices[choiceKey] = true;

    output.push([
      record.county,
      record.facility,
      record.code,
      record.program,
      record.emoncListName,
      record.choiceName,
      record.name
    ]);
  }

  // Sort by Facility (column index 1)
  output = [output[0]].concat(
    output.slice(1).sort((a, b) => a[1].localeCompare(b[1]))
  );

  choicesSheet.clearContents();
  choicesSheet.getRange(1,1,output.length,output[0].length).setValues(output);
}

// =====================================================
// 6️⃣a EmONC FACILITIES CHOICES
// =====================================================
function generateEmONCFacilitiesChoicesSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Mentee Database");
  var data = sheet.getDataRange().getValues();
  var header = data[0];

  var countyIndex = header.indexOf("County");
  var facilityIndex = header.indexOf("Facility");
  var facilityCodeIndex = header.indexOf("Facility Code");
  var programIndex = header.indexOf("Program");

  var facilitiesSheet = getOrCreateSheet("EmONC Facilities List (Choices)");
  var output = [["County","Facility","Facility Code","Program","list_name","name","label"]];
  var processed = {};

  for (var i = 1; i < data.length; i++) {
    var county = data[i][countyIndex];
    var facility = data[i][facilityIndex];
    var code = data[i][facilityCodeIndex];
    var program = data[i][programIndex];

    if (!county || !facility || !code) continue;

    // FILTER: EmONC facilities are those with a MENTORS or Both mentee.
    // Program is typed by hand ("Both", "both ", "MENTORS Curriculum "), so a
    // strict comparison silently drops facilities and they never appear under
    // their county in Kobo — normalize before comparing.
    var normalizedProgram = String(program).trim().toLowerCase();
    if (
      normalizedProgram !== "mentors curriculum" &&
      normalizedProgram !== "both"
    ) continue;

    var listName = cleanForKobo(county) + "_facilities";
    var combinedName = code + "_" + cleanForKobo(facility);

    if (processed[combinedName]) continue;
    processed[combinedName] = true;

    output.push([
      county,
      facility,
      code,
      program,
      listName,
      combinedName,
      facility
    ]);
  }

  // Sort by Facility (column index 1)
  output = [output[0]].concat(
    output.slice(1).sort((a,b)=>a[1].localeCompare(b[1]))
  );

  facilitiesSheet.clearContents();
  facilitiesSheet.getRange(1,1,output.length,output[0].length).setValues(output);
}

// =====================================================
// 6️⃣ All FACILITIES CHOICES
// =====================================================
function generateFacilitiesChoicesSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Mentee Database");
  var data = sheet.getDataRange().getValues();
  var header = data[0];

  var countyIndex = header.indexOf("County");
  var facilityIndex = header.indexOf("Facility");
  var facilityCodeIndex = header.indexOf("Facility Code");
  var programIndex = header.indexOf("Program");

  var facilitiesSheet = getOrCreateSheet("All Facilities List (Choices)");
  var output = [[
  "County",
  "Facility",
  "Facility Code",
  "Program",
  "list_name",
  "name",
  "label",
  "allowed"
]];

  // One facility can appear on many mentee rows and those rows can carry
  // different Program values. Aggregate every program by Facility Code before
  // writing one choice; first-row-wins would drop newborn_curriculum whenever
  // a MENTORS row happened to appear first.
  var facilitiesByCode = {};
  var facilityOrder = [];

  for (var i = 1; i < data.length; i++) {
    var county = data[i][countyIndex];
    var facility = data[i][facilityIndex];
    var code = data[i][facilityCodeIndex];
    var program = data[i][programIndex];

    if (!county || !facility || !code) continue;

    var normalizedProgram = String(program).trim().toLowerCase();
    var isMentors = normalizedProgram === "mentors curriculum";
    var isNewborn = normalizedProgram === "newborn curriculum";
    var isBoth = normalizedProgram === "both";
    if (!isMentors && !isNewborn && !isBoth) continue;

    var codeKey = String(code).trim();
    if (!facilitiesByCode[codeKey]) {
      facilitiesByCode[codeKey] = {
        county: county,
        facility: facility,
        code: code,
        hasMentors: false,
        hasNewborn: false
      };
      facilityOrder.push(codeKey);
    }

    if (isMentors || isBoth) facilitiesByCode[codeKey].hasMentors = true;
    if (isNewborn || isBoth) facilitiesByCode[codeKey].hasNewborn = true;
  }

  for (var f = 0; f < facilityOrder.length; f++) {
    var record = facilitiesByCode[facilityOrder[f]];
    var aggregateProgram;

    if (record.hasMentors && record.hasNewborn) {
      aggregateProgram = "Both";
    } else if (record.hasNewborn) {
      aggregateProgram = "Newborn Curriculum";
    } else {
      aggregateProgram = "MENTORS Curriculum";
    }

    var allowedParts = [];
    if (record.hasMentors) allowedParts.push("mentors_curriculum");
    if (record.hasNewborn) allowedParts.push("newborn_curriculum");
    allowedParts.push("ifm_assessment");
    allowedParts.push("tot");

    var listName = cleanForKobo(record.county) + "_facilities";
    var combinedName =
      record.code + "_" + cleanForKobo(record.facility);

    output.push([
      record.county,
      record.facility,
      record.code,
      aggregateProgram,
      listName,
      combinedName,
      record.facility,
      allowedParts.join(",")
    ]);
  }

  // Sort by Facility (column index 1)
  output = [output[0]].concat(
    output.slice(1).sort((a, b) => a[1].localeCompare(b[1]))
  );

  facilitiesSheet.clearContents();
  facilitiesSheet.getRange(1, 1, output.length, output[0].length).setValues(output);
}

// =====================================================
// 7️⃣ IFM ASSESSMENT (FACILITY-BASED)
// Source: local "IFM List" (synced + headers normalized by orchestrator)
// Original kobocreator columns: County, Facility, Facility Code, Status
// =====================================================
function generateIFMAssessmentSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sourceSheet = ss.getSheetByName("IFM List");
  if (!sourceSheet) return;

  var data = sourceSheet.getDataRange().getValues();
  var header = data[0];

  var countyIndex = header.indexOf("County");
  var facilityIndex = header.indexOf("Facility");
  var facilityCodeIndex = header.indexOf("Facility Code");
  var statusIndex = header.indexOf("Status");

  var sheet = getOrCreateSheet("IFM Assessment Facilities List (Choices)");
  var output = [["County","Facility","Facility Code","list_name","name","label"]];

  var seenFacilities = {}; // Track unique facility codes

  for (var i = 1; i < data.length; i++) {
    var county = data[i][countyIndex];
    var facility = data[i][facilityIndex];
    var code = data[i][facilityCodeIndex];
    var status = statusIndex === -1 ? "" : data[i][statusIndex];

    if (!county || !facility || !code) continue;

    // Status filter: Active only
    if (String(status == null ? "" : status).trim().toLowerCase() !== "active") {
      continue;
    }

    // Skip if this facility code is already processed
    if (seenFacilities[code]) continue;
    seenFacilities[code] = true;

    // Clean facility name for list_name
    var cleanedFacility = cleanForKobo(facility);
    var firstWord = cleanedFacility.split("_")[0];
    var listName = firstWord + "_ifms";

    // Name is facility code + cleaned facility
    var combinedName = code + "_" + cleanedFacility;

    output.push([county, facility, code, listName, combinedName, facility]);
  }

  // Sort alphabetically by Facility
  output = [output[0]].concat(output.slice(1).sort((a,b)=>a[1].localeCompare(b[1])));

  sheet.getRange(1,1,output.length,output[0].length).setValues(output);
}

// =====================================================
// 8️⃣ MENTEE-FACILITY LOGIC (WITHOUT CURRICULUM COLUMN)
// =====================================================
function generateMenteeFacilityLogic() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var menteeSheet = ss.getSheetByName("Mentee Database");
  if (!menteeSheet) return;
  var menteeData = menteeSheet.getDataRange().getValues();
  var header = menteeData[0];

  var countyIndex = header.indexOf("County");
  var facilityIndex = header.indexOf("Facility");
  var programIndex = header.indexOf("Program");
  var facilityCodeIndex = header.indexOf("Facility Code");

  var ifmSheet = ss.getSheetByName("IFM List");
  if (!ifmSheet) return;
  var ifmData = ifmSheet.getDataRange().getValues();
  var ifmHeader = ifmData[0];

  var ifmFacilityIndex = ifmHeader.indexOf("Facility");
  var ifmFacilityCodeIndex = ifmHeader.indexOf("Facility Code");
  var ifmCountyIndex = ifmHeader.indexOf("County");
  var ifmStatusIndex = ifmHeader.indexOf("Status");

  // Map of IFM facility codes to cleaned names (Active rows only)
  var ifmMap = {};
  for (var i = 1; i < ifmData.length; i++) {
    var code = ifmData[i][ifmFacilityCodeIndex];
    var facility = ifmData[i][ifmFacilityIndex];
    var county = ifmData[i][ifmCountyIndex];
    var status = ifmStatusIndex === -1 ? "" : ifmData[i][ifmStatusIndex];
    if (!code || !facility || !county) continue;
    if (String(status == null ? "" : status).trim().toLowerCase() !== "active") {
      continue;
    }
    ifmMap[code] = {
      facility: code + "_" + cleanForKobo(facility),
      county: cleanForKobo(county) + "_facilities",
      firstWord: cleanForKobo(facility).split("_")[0]
    };
  }

  var outputSheet = getOrCreateSheet("Mentee-Facility Logic");
  // Removed Curriculum Tracking Kobo Logic column
  var output = [["County","Facility","Program","Skills Assessments Kobo Logic","IFM Logic"]];

  // Track facilityCode + program to prevent duplicates
  var processed = {};

  for (var i = 1; i < menteeData.length; i++) {
    var county = menteeData[i][countyIndex];
    var facility = menteeData[i][facilityIndex];
    var program = menteeData[i][programIndex];
    var code = menteeData[i][facilityCodeIndex];
    if (!county || !facility || !program || !code) continue;

    var cleanedFacility = cleanForKobo(facility);
    var firstWordNBC = cleanedFacility.split("_")[0]; // for Skills Assessment
    var facilityKobo = code + "_" + cleanedFacility;

    // Split program if it's "both"
    var programList = [];
    if (program.toLowerCase() === "both") {
      programList = ["MENTORS Curriculum", "Newborn Curriculum"];
    } else {
      programList = [program.toLowerCase().replace(/\s+/g, "_")];
    }

    for (var p = 0; p < programList.length; p++) {
      var cleanedProgram = programList[p];

      // Unique per facility code + program
      var uniqueKey = code + "_" + cleanedProgram;
      if (processed[uniqueKey]) continue;
      processed[uniqueKey] = true;

      // Skills Assessment Kobo Logic
      var skillsLogic = `(\${${firstWordNBC}_nbc_mentees} = '${facilityKobo}' and (\${program} = '${cleanedProgram}'))`;

      // IFM Logic
      var ifmLogic = "";
      if (ifmMap[code]) {
        ifmLogic = `(\${${ifmMap[code].firstWord}_ifms} = '${ifmMap[code].facility}' and (\${program} = 'ifm_assessment'))`;
      }

      output.push([county, facility, cleanedProgram, skillsLogic, ifmLogic]);
    }
  }

  outputSheet.getRange(1,1,output.length,output[0].length).setValues(output);
}

// =====================================================
// 9️⃣ IFM (CHOICES) – FIRST WORD BASED
// Source: local "IFM List" (synced + headers normalized by orchestrator)
// Original kobocreator columns: County, Facility, Facility Code, Name, IFM ID, Status
// =====================================================
function generateIFMChoicesSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ifmSheet = ss.getSheetByName("IFM List");
  if (!ifmSheet) return;

  var data = ifmSheet.getDataRange().getValues();
  var header = data[0];

  var countyIndex = header.indexOf("County");
  var facilityIndex = header.indexOf("Facility");
  var facilityCodeIndex = header.indexOf("Facility Code");
  var nameIndex = header.indexOf("Name");
  var idIndex = header.indexOf("IFM ID");
  var statusIndex = header.indexOf("Status");

  var sheet = getOrCreateSheet("IFM List (Choices)");
  var output = [["County","Facility","Facility Code","list_name","name","label"]];

  // One record per IFM ID + Facility Code, so a mentor who was later
  // deactivated is not offered as a choice.
  var records = resolveIFMRecords_(data, header);
  var seenChoices = {};

  for (var i = 0; i < records.length; i++) {
    var record = records[i];
    if (!record.isActive) continue;

    var choiceKey = record.listName + "|" + record.choiceName;
    if (seenChoices[choiceKey]) continue;
    seenChoices[choiceKey] = true;

    output.push([
      record.county,
      record.facility,
      record.code,
      record.listName,
      record.choiceName,
      record.name
    ]);
  }

  // Sort alphabetically by Facility
  output = [output[0]].concat(
    output.slice(1).sort((a,b)=>a[1].localeCompare(b[1]))
  );

  sheet.getRange(1,1,output.length,output[0].length)
       .setValues(output);
}

// =====================================================
// 10️⃣ NEWBORN FACILITIES LIST (AGGREGATED)
// =====================================================
function generateNewbornAssessmentSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Mentee Database");
  var data = sheet.getDataRange().getValues();
  var header = data[0];

  var countyIndex = header.indexOf("County");
  var facilityIndex = header.indexOf("Facility");
  var facilityCodeIndex = header.indexOf("Facility Code");
  var programIndex = header.indexOf("Program");

  var essentialIndex = header.indexOf("Essential Newborn In-person");
  var comprehensiveIndex = header.indexOf("Comprehensive Newborn In-person");

  var facilitiesSheet = getOrCreateSheet("Newborn Facilities List (Choices)");

  // ✅ HEADER (allowed moved to last column)
  var output = [[
    "County",
    "Facility",
    "Facility Code",
    "Program",
    "list_name",
    "name",
    "label",
    "allowed"
  ]];

  // ✅ GROUPING OBJECT (by Facility Code)
  var facilityMap = {};

  for (var i = 1; i < data.length; i++) {
    var county = data[i][countyIndex];
    var facility = data[i][facilityIndex];
    var code = data[i][facilityCodeIndex];
    var program = data[i][programIndex];

    var essential = data[i][essentialIndex];
    var comprehensive = data[i][comprehensiveIndex];

    if (!county || !facility || !code) continue;

    // FILTER: Program is typed by hand, so normalize before comparing or
    // "both"/"Newborn Curriculum " variants drop the facility silently.
    var normalizedProgram = String(program).trim().toLowerCase();
    if (
      normalizedProgram !== "newborn curriculum" &&
      normalizedProgram !== "both"
    ) continue;

    // ✅ INITIALIZE FACILITY
    if (!facilityMap[code]) {
      facilityMap[code] = {
        county: county,
        facility: facility,
        program: program,
        hasEssential: false,
        hasComprehensive: false
      };
    }

    // ✅ UPDATE FLAGS
    if (essential === "Yes") {
      facilityMap[code].hasEssential = true;
    }
    if (comprehensive === "Yes") {
      facilityMap[code].hasComprehensive = true;
    }
  }

  // ✅ BUILD OUTPUT FROM AGGREGATED DATA
  for (var code in facilityMap) {
    var f = facilityMap[code];

    var allowed = "";
    if (f.hasEssential && f.hasComprehensive) {
      allowed = "essential_newborn_care,comprehensive_newborn_care";
    } else if (f.hasEssential) {
      allowed = "essential_newborn_care";
    } else if (f.hasComprehensive) {
      allowed = "comprehensive_newborn_care";
    } else {
      allowed = "Error!";
    }

    var listName = cleanForKobo(f.county) + "_facilities";
    var combinedName = code + "_" + cleanForKobo(f.facility);

    output.push([
      f.county,
      f.facility,
      code,
      f.program,
      listName,
      combinedName,
      f.facility,
      allowed
    ]);
  }

  // ✅ SORT by Facility
  output = [output[0]].concat(
    output.slice(1).sort((a,b)=>a[1].localeCompare(b[1]))
  );

  facilitiesSheet.clearContents();
  facilitiesSheet.getRange(1,1,output.length,output[0].length).setValues(output);
}


// =====================================================
// 11️⃣ NEWBORN MENTEES LIST (CHOICES) – USING HELPER LOGIC
// =====================================================
function generateNewbornChoicesSheet() {

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sourceSheet = ss.getSheetByName("Mentee Database");
  if (!sourceSheet) return;

  var data = sourceSheet.getDataRange().getValues();
  var header = data[0];

  var sheet = getOrCreateSheet("Newborn Mentees List (Choices)");

  var output = [[
    "County",
    "Facility",
    "Facility Code",
    "Program",
    "list_name",
    "name",
    "label"
  ]];

  var records = resolveMenteeRecords_(data, header);
  var seenChoices = {};

  for (var i = 0; i < records.length; i++) {
    var record = records[i];
    if (!record.isNewbornMentee) continue;

    var choiceKey = record.newbornListName + "|" + record.choiceName;
    if (seenChoices[choiceKey]) continue;
    seenChoices[choiceKey] = true;

    output.push([
      record.county,
      record.facility,
      record.code,
      record.program,
      record.newbornListName,
      record.choiceName,
      record.name
    ]);
  }

  // Sort alphabetically by Facility
  output = [output[0]].concat(
    output.slice(1).sort((a,b) => a[1].localeCompare(b[1]))
  );

  sheet.getRange(1, 1, output.length, output[0].length)
       .setValues(output);
}

// =====================================================
// 1️⃣2️⃣ SURVEY SHEET (IFM) – UPDATED COLUMN ORDER
// Source: local "IFM List" (synced + headers normalized by orchestrator)
// Original kobocreator columns: County, Facility, Facility Code, Status
// Unique Facility Code + Status Active
// =====================================================
function generateSurveySheetIFM() {

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ifmSheet = ss.getSheetByName("IFM List");

  if (!ifmSheet) return;

  var ifmData = ifmSheet.getDataRange().getValues();
  var ifmHeader = ifmData[0];

  var countyIndex = ifmHeader.indexOf("County");
  var facilityIndex = ifmHeader.indexOf("Facility");
  var facilityCodeIndex = ifmHeader.indexOf("Facility Code");
  var statusIndex = ifmHeader.indexOf("Status");

  var sheet = getOrCreateSheet("Survey Sheet (IFM)");

  // Reordered columns: type, name, label, hint, required, required_message, relevant
  var output = [[
    "County",
    "Facility",
    "Facility Code",
    "type",
    "name",
    "label",
    "hint",
    "required",
    "required_message",
    "relevant"
  ]];

  // A facility only earns a question when it still has a selectable IFM, i.e.
  // an Active row carrying both a Name and an IFM ID. Facilities whose IFMs are
  // all Inactive (or lack a Name/ID) produce no choices, and Kobo rejects the
  // whole form with "List name not in choices sheet".
  var eligible = getSelectableIFMFacilities_(ifmData, ifmHeader);
  var excludedCodes = {};

  var processed = {}; // ensure facility appears once

  for (var i = 1; i < ifmData.length; i++) {

    var county = ifmData[i][countyIndex];
    var facility = ifmData[i][facilityIndex];
    var code = ifmData[i][facilityCodeIndex];
    var status = statusIndex === -1 ? "" : ifmData[i][statusIndex];

    if (!county || !facility || !code) continue;

    // Status filter: Active only (unique Facility Code among Active rows)
    if (String(status == null ? "" : status).trim().toLowerCase() !== "active") {
      continue;
    }

    if (!eligible.codes[String(code).trim()]) {
      excludedCodes[String(code).trim()] = facility;
      continue;
    }

    if (processed[code]) continue;
    processed[code] = true;

    // Clean facility
    var cleanedFacility = cleanForKobo(facility);

    // Allocated per facility code, so facilities sharing a first word still
    // get one question each instead of two questions with the same name.
    var listName = eligible.listNameByCode[String(code).trim()];
    if (!listName) {
      excludedCodes[String(code).trim()] = facility;
      continue;
    }

    var type = "select_one " + listName;

    // Proper Label
    var label = listName
      .replace(/_/g, " ")
      .replace(/\b\w/g, function(l){ return l.toUpperCase(); })
      .replace("Ifms","IFMs");

    // ===== NEW RELEVANT LOGIC =====
    var facilityValue = code + "_" + cleanedFacility;

    // County variable for ${county_facilities} format. Cleaned the same way as
    // the facility choices sheets, so "Murang'a" cannot become a name no
    // survey element has.
    var countyVar = cleanForKobo(county);

    // Relevant string
    var relevant = `\${${countyVar}_facilities} = '${facilityValue}' and (\${program} = 'ifm_assessment' or \${program} = 'tot')`;

    // New columns: hint (blank), required (true), required_message
    var hint = "";
    var required = "true".toString().toLowerCase();
    var required_message = "Sorry, this answer is required";

    // Push row with reordered columns
    output.push([
      county,
      facility,
      code,
      type,
      listName,
      label,
      hint,
      required,
      required_message,
      relevant
    ]);
  }

  // Sort alphabetically by Facility
  output = [output[0]].concat(
    output.slice(1).sort((a,b)=>a[1].localeCompare(b[1]))
  );

  sheet.getRange(1,1,output.length,output[0].length)
       .setValues(output);

  var excludedList = [];
  for (var excludedCode in excludedCodes) {
    excludedList.push(excludedCodes[excludedCode] + " (" + excludedCode + ")");
  }
  if (excludedList.length) {
    Logger.log(
      "Survey Sheet (IFM): excluded " + excludedList.length + " facility(ies) " +
      "with no Active IFM having both a Name and an IFM ID: " +
      excludedList.sort().join(", ")
    );
  }
}

/**
 * Facility codes and list names that will actually appear in
 * "IFM List (Choices)" — Active rows that carry a Name and an IFM ID.
 * Kept in sync with generateIFMChoicesSheet().
 */
function getSelectableIFMFacilities_(data, header) {
  var records = resolveIFMRecords_(data, header);
  var codes = {};
  var listNames = {};
  var listNameByCode = {};

  for (var i = 0; i < records.length; i++) {
    if (!records[i].isActive) continue;
    codes[records[i].code] = true;
    listNames[records[i].listName] = true;
    listNameByCode[records[i].code] = records[i].listName;
  }

  return { codes: codes, listNames: listNames, listNameByCode: listNameByCode };
}

/**
 * One authoritative record per mentor posting.
 *
 * A mentor posting is identified by IFM ID + Facility Code; Status is that
 * posting's current state. The same posting can appear on several rows (for
 * example an activation row and a later deactivation row), so the last row
 * wins — otherwise a mentor who has since been deactivated would still count
 * as Active and produce a facility question with no choices.
 */
function resolveIFMRecords_(data, header) {
  var countyIndex = header.indexOf("County");
  var facilityIndex = header.indexOf("Facility");
  var facilityCodeIndex = header.indexOf("Facility Code");
  var nameIndex = header.indexOf("Name");
  var idIndex = header.indexOf("IFM ID");
  var statusIndex = header.indexOf("Status");

  var byPosting = {};
  var order = [];

  for (var i = 1; i < data.length; i++) {
    var county = data[i][countyIndex];
    var facility = data[i][facilityIndex];
    var code = data[i][facilityCodeIndex];
    var name = nameIndex === -1 ? "" : data[i][nameIndex];
    var rawID = idIndex === -1 ? "" : data[i][idIndex];
    var status = statusIndex === -1 ? "" : data[i][statusIndex];

    if (!county || !facility || !code || !name || !rawID) continue;

    var cleanedID = String(rawID).replace(/\s+/g, "").trim();
    var cleanedCode = String(code).trim();
    var cleanedFacility = cleanForKobo(facility);
    var key = cleanedID + "|" + cleanedCode;

    if (!byPosting[key]) order.push(key);

    byPosting[key] = {
      county: county,
      facility: facility,
      code: cleanedCode,
      name: name,
      ifmId: cleanedID,
      isActive:
        String(status == null ? "" : status).trim().toLowerCase() === "active",
      choiceName: cleanedID + "_" + cleanForKobo(name)
    };
  }

  var records = [];
  for (var o = 0; o < order.length; o++) {
    records.push(byPosting[order[o]]);
  }

  applyIFMListNames_(records);
  return records;
}

/**
 * IFM list names come from the first word of the facility, which two
 * facilities can share, so allocate one name per facility code over the
 * postings that actually reach a form.
 */
function applyIFMListNames_(records) {
  var entries = [];
  var i;

  for (i = 0; i < records.length; i++) {
    if (records[i].isActive) {
      entries.push({ code: records[i].code, facility: records[i].facility });
    }
  }

  var names = assignFacilityListNames_(entries, "_ifms", function (facility) {
    return cleanForKobo(facility).split("_")[0];
  });

  for (i = 0; i < records.length; i++) {
    var record = records[i];
    record.listName =
      names[record.code] || cleanForKobo(record.facility).split("_")[0] + "_ifms";
  }
}

/**
 * Facility codes and list names that will actually appear in the mentee
 * choices sheets. Kept in sync with generateChoicesSheet() (EmONC) and
 * generateNewbornChoicesSheet() (Newborn).
 */
function getSelectableMenteeFacilities_(data, header) {
  var records = resolveMenteeRecords_(data, header);

  var selectable = {
    emoncCodes: {},
    emoncListNames: {},
    emoncListNameByCode: {},
    newbornCodes: {},
    newbornListNames: {},
    newbornListNameByCode: {}
  };

  for (var i = 0; i < records.length; i++) {
    var record = records[i];

    if (record.isEmONCMentee) {
      selectable.emoncCodes[record.code] = true;
      selectable.emoncListNames[record.emoncListName] = true;
      selectable.emoncListNameByCode[record.code] = record.emoncListName;
    }
    if (record.isNewbornMentee) {
      selectable.newbornCodes[record.code] = true;
      selectable.newbornListNames[record.newbornListName] = true;
      selectable.newbornListNameByCode[record.code] = record.newbornListName;
    }
  }

  return selectable;
}

/**
 * One authoritative record per mentee posting.
 *
 * A posting is identified by Mentee ID + Facility Code and the last row wins,
 * so a mentee who was later deactivated or moved does not keep an obsolete
 * Active state. Program and Status are normalised here because the database is
 * typed by hand ("Both", "both ", "MENTORS curriculum" all occur): a strict
 * comparison drops the mentee from the choices while the facility question is
 * still generated, and Kobo then rejects the whole deployment with
 * "List name not in choices sheet".
 */
function resolveMenteeRecords_(data, header) {
  var countyIndex = header.indexOf("County");
  var facilityIndex = header.indexOf("Facility");
  var facilityCodeIndex = header.indexOf("Facility Code");
  var programIndex = header.indexOf("Program");
  var idIndex = header.indexOf("Mentee ID");
  var nameIndex = header.indexOf("Name");
  var statusIndex = header.indexOf("Status");

  var byPosting = {};
  var order = [];

  for (var i = 1; i < data.length; i++) {
    var county = countyIndex === -1 ? "" : data[i][countyIndex];
    var facility = facilityIndex === -1 ? "" : data[i][facilityIndex];
    var code = facilityCodeIndex === -1 ? "" : data[i][facilityCodeIndex];
    var program = programIndex === -1 ? "" : data[i][programIndex];
    var rawID = idIndex === -1 ? "" : data[i][idIndex];
    var name = nameIndex === -1 ? "" : data[i][nameIndex];
    var status = statusIndex === -1 ? "" : data[i][statusIndex];

    if (!county || !facility || !code || !program || !rawID || !name) continue;

    var cleanedID = String(rawID).replace(/\s+/g, "").trim();
    var cleanedCode = String(code).trim();
    var normalizedProgram = String(program)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");
    var isActive =
      String(status == null ? "" : status).trim().toLowerCase() === "active";

    var key = cleanedID + "|" + cleanedCode;
    if (!byPosting[key]) order.push(key);

    byPosting[key] = {
      county: county,
      facility: facility,
      code: cleanedCode,
      program: program,
      name: name,
      menteeId: cleanedID,
      isActive: isActive,
      isEmONCMentee:
        isActive &&
        (normalizedProgram === "mentors_curriculum" ||
          normalizedProgram === "both"),
      isNewbornMentee:
        isActive &&
        (normalizedProgram === "newborn_curriculum" ||
          normalizedProgram === "both"),
      choiceName: cleanedID + "_" + cleanForKobo(name)
    };
  }

  var records = [];
  for (var o = 0; o < order.length; o++) {
    records.push(byPosting[order[o]]);
  }

  applyMenteeListNames_(records);
  return records;
}

/**
 * Give every facility its own mentee list names, allocated over the facilities
 * that actually reach a form so the survey and the choices sheets agree.
 */
function applyMenteeListNames_(records) {
  var emoncEntries = [];
  var newbornEntries = [];
  var i;

  for (i = 0; i < records.length; i++) {
    if (records[i].isEmONCMentee) {
      emoncEntries.push({ code: records[i].code, facility: records[i].facility });
    }
    if (records[i].isNewbornMentee) {
      newbornEntries.push({ code: records[i].code, facility: records[i].facility });
    }
  }

  var emoncNames = assignFacilityListNames_(emoncEntries, "_mentees");
  var newbornNames = assignFacilityListNames_(newbornEntries, "_nbc_mentees");

  for (i = 0; i < records.length; i++) {
    var record = records[i];
    record.emoncListName =
      emoncNames[record.code] || generateKoboVariable(record.facility);
    record.newbornListName =
      newbornNames[record.code] || generateKoboVariable(record.facility, true);
  }
}

// =====================================================
// HELPER: COPY FROM VARIABLE NAMES
// =====================================================
function copyFromVariableNames(logicColumnName, sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var variableSheet = ss.getSheetByName("Variable Names");
  var data = variableSheet.getDataRange().getValues();
  var header = data[0];
  var logicIndex = header.indexOf(logicColumnName);

  var sheet = getOrCreateSheet(sheetName);
  var output = [["County","Facility","Facility Code","Program","Data Type","Kobo Variable","Kobo Label","Relevant"]];

  for (var i = 1; i < data.length; i++) {
    output.push([data[i][0],data[i][1],data[i][2],data[i][3],data[i][4],data[i][6],data[i][7],data[i][logicIndex]]);
  }

  output = [output[0]].concat(output.slice(1).sort((a,b)=>a[1].localeCompare(b[1])));
  sheet.getRange(1,1,output.length,output[0].length).setValues(output);
}

// =====================================================
// 1️⃣3️⃣ SURVEY SHEET (NEWBORN)
// =====================================================
function generateSurveySheetNewborn() {

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sourceSheet = ss.getSheetByName("Mentee Database");
  var variableSheet = ss.getSheetByName("Variable Names");
  if (!sourceSheet || !variableSheet) return;

  var data = sourceSheet.getDataRange().getValues();
  var header = data[0];

  var countyIndex = header.indexOf("County");
  var facilityIndex = header.indexOf("Facility");
  var facilityCodeIndex = header.indexOf("Facility Code");
  var programIndex = header.indexOf("Program");

  // Build map: facilityCode + program -> logic
  var varData = variableSheet.getDataRange().getValues();
  var varHeader = varData[0];

  var varFacilityCodeIndex = varHeader.indexOf("Facility Code");
  var varProgramIndex = varHeader.indexOf("Program");
  var varSkillsLogicIndex = varHeader.indexOf("Skills Assessments Kobo Logic");

  var skillsLogicMap = {};

  for (var i = 1; i < varData.length; i++) {
    var code = varData[i][varFacilityCodeIndex];
    var program = varData[i][varProgramIndex];
    var skillsLogic = varData[i][varSkillsLogicIndex];

    if (!code || !program || !skillsLogic) continue;

    var key = code + "_" + program.toLowerCase().replace(/\s+/g, "_");
    skillsLogicMap[key] = skillsLogic;
  }

  var sheet = getOrCreateSheet("Survey Sheet (Newborn)");

  var output = [[
    "County",
    "Facility",
    "Facility Code",
    "Program",
    "type",
    "name",
    "label",
    "hint",
    "required",
    "required_message",
    "relevant"
  ]];

  var processedFacilities = {};

  // Facilities whose "<facility>_nbc_mentees" list will carry choices.
  var selectable = getSelectableMenteeFacilities_(data, header);
  var excludedFacilities = {};

  for (var i = 1; i < data.length; i++) {

    var county = data[i][countyIndex];
    var facility = data[i][facilityIndex];
    var code = data[i][facilityCodeIndex];
    var program = data[i][programIndex];

    if (!county || !facility || !code || !program) continue;

    // === FILTER PROGRAM ===
    var cleanedProgram = program.toLowerCase().replace(/\s+/g, "_");
    if (cleanedProgram !== "newborn_curriculum" && cleanedProgram !== "both") continue;

    // === Skip facilities with no selectable newborn mentee ===
    if (!selectable.newbornCodes[String(code).trim()]) {
      excludedFacilities[
        facility + " (" + generateKoboVariable(facility, true) + ")"
      ] = true;
      continue;
    }

    // === Remove duplicates by facility code ===
    if (processedFacilities[code]) continue;
    processedFacilities[code] = true;

    if (cleanedProgram === "both") 
      cleanedProgram = "newborn_curriculum";

    // === KOBO VARIABLE (NBC CONTEXT) ===
    var listName = selectable.newbornListNameByCode[String(code).trim()];
    var type = "select_one " + listName;

    var label = listName
      .replace(/_/g, " ")
      .replace(/\bnbc\b/gi, "Newborn Curriculum")
      .replace(/\b\w/g, function(l){ return l.toUpperCase(); });

    var uniqueKey = code + "_" + cleanedProgram;
    var relevant = skillsLogicMap[uniqueKey] || "";

    var hint = "";
    var required = "true";
    var required_message = "Sorry, this answer is required";

    output.push([
      county,
      facility,
      code,
      cleanedProgram,
      type,
      listName,
      label,
      hint,
      required,
      required_message,
      relevant
    ]);
  }

  // Sort by Facility name
  output = [output[0]].concat(
    output.slice(1).sort((a,b) => a[1].localeCompare(b[1]))
  );

  sheet.getRange(1, 1, output.length, output[0].length)
       .setValues(output);

  var excludedList = [];
  for (var excluded in excludedFacilities) {
    excludedList.push(excluded);
  }
  if (excludedList.length) {
    Logger.log(
      "Survey Sheet (Newborn): excluded " + excludedList.length +
      " facility(ies) with no Active Newborn mentee carrying a Mentee ID " +
      "and Name: " + excludedList.sort().join(", ")
    );
  }
}


// =====================================================
// HELPER: CLEAN MENTEE ID (removes all spaces)
// =====================================================
function cleanMenteeID(idValue) {
  if (!idValue) return "";
  return idValue.toString().replace(/\s+/g, "").trim();
}

// =====================================================
// HELPER: CLEAN FOR KOBO
// =====================================================
function cleanForKobo(text) {
  return foldKoboText_(text).toLowerCase()
    .replace(/[^a-z0-9 ]/g,"")
    .trim()
    .replace(/\s+/g,"_")
    .replace(/_+/g,"_")
    .replace(/^_+|_+$/g,"");
}

/**
 * Names are typed by hand, so one county arrives as "Murang'a", "Murangá" and
 * "Muranga". Kobo field names hold plain ASCII only, and every generator has
 * to land on the same spelling, so drop apostrophes and fold accented letters
 * onto their base letter before the rest of the cleaning: all three become
 * "muranga", never "murang_a" or "murang".
 */
function foldKoboText_(text) {
  var value = text == null ? "" : String(text);

  // A curly apostrophe that lost its encoding on the way out of Sheets arrives
  // as three characters; drop it before the accented letters are folded, or
  // "Murangâ€™a" would keep the stray "a" from "â".
  value = value.replace(/\u00E2\u20AC\u2122/g, "");

  // Straight, curly and modifier apostrophes, plus the acute accent when it is
  // typed as a standalone character.
  value = value.replace(/['\u2018\u2019\u02BC\u0060\u00B4]/g, "");

  if (typeof value.normalize === "function") {
    value = value.normalize("NFD").replace(/[\u0300-\u036F]/g, "");
  }

  return foldKoboLatinLetters_(value);
}

/**
 * Accent folding for runtimes without String.prototype.normalize.
 * Grouped by the base letter so the two halves of the mapping cannot drift
 * out of alignment.
 */
var KOBO_LATIN_FOLD_GROUPS = {
  a: "àáâãäåāăą",
  c: "çćĉċč",
  e: "èéêëēĕėęě",
  i: "ìíîïĩīĭįı",
  n: "ñńņň",
  o: "òóôõöøōŏő",
  r: "ŕř",
  s: "śŝşš",
  u: "ùúûüũūŭůűų",
  y: "ýÿŷ",
  z: "źżž"
};

function foldKoboLatinLetters_(value) {
  var out = "";

  for (var i = 0; i < value.length; i++) {
    var ch = value.charAt(i);
    var lower = ch.toLowerCase();
    var plain = "";

    for (var base in KOBO_LATIN_FOLD_GROUPS) {
      if (KOBO_LATIN_FOLD_GROUPS[base].indexOf(lower) !== -1) {
        plain = base;
        break;
      }
    }

    if (!plain) out += ch;
    else if (ch === lower) out += plain;
    else out += plain.toUpperCase();
  }

  return out;
}

// =====================================================
// 🔧 HELPER: KOBO VARIABLE GENERATOR (CONTEXT-AWARE)
// =====================================================
function generateKoboVariable(facility, isNewbornSheet) {
  // ✅ Context-based suffix
  var suffix = isNewbornSheet ? "_nbc_mentees" : "_mentees";
  return getFacilityVariableBase_(facility) + suffix;
}

/**
 * Shortened facility name used to build a Kobo variable.
 *
 * Several facilities can share one base ("Mary Immaculate Mission Hospital"
 * and "Mary Immaculate Hospital" both give "mary_immaculate"), so callers must
 * pass the result through assignFacilityListNames_() to keep one name per
 * facility code.
 */
function getFacilityVariableBase_(facility) {
  var cleaned = cleanForKobo(facility);
  var words = cleaned.split("_");

  var base;

  if (cleaned === "bahati_health_center") 
    base = "bahati_health";

  else if (cleaned === "maragua_ridge_health_centre") 
    base = "maragua_ridge";

  else if (cleaned === "coast_general_teaching_and_referral_hospital_vikwatani") 
    base = "cgtrh_vikwatani";

  else if (cleaned === "st_marys_mission_hospital") 
    base = "st_marys_mission";

  else if (cleaned === "st_marys_hospital_mumias") 
    base = "st_marys_mumias";

  else if (cleaned === "naivasha_subcounty_hospital") 
    base = "naivasha_subcounty";

  else if (cleaned === "naivasha_aic_medical_centre") 
    base = "naivasha_aic";

  else if (cleaned === "shimo_la_tewa_anex") 
    base = "shimo_la_tewa";

  else if (cleaned === "kayole_1_health_center") 
    base = "kayole_1";

  else if (cleaned === "kayole_2_health_center") 
    base = "kayole_2";

  else if (cleaned === "kibera_community_health_centre_amref") 
    base = "kibera_community";

  else if (words[0] === "phg" && words.length > 1) 
    base = words[1];

  else if (cleaned.includes("nakuru") && cleaned.includes("teaching")) 
    base = "nakuru_pgh";

  else if (words.length >= 2 && words[0].length <= 5) 
    base = words[0] + "_" + words[1];

  else 
    base = words[0];

  return base;
}

/**
 * One list name per facility code.
 *
 * Two facilities that shorten to the same base would otherwise produce two
 * questions with the same name, and Kobo rejects the form with "Duplicate
 * question name". The first facility to claim a base keeps it, so established
 * question names stay put. Later facilities with that base receive a ranking
 * suffix after the complete field name: sagana_mentees_02,
 * sagana_mentees_03, and so on.
 *
 * entries: [{ code: "16002", facility: "Kanyakine Sub County Hospital" }, ...]
 * Returns { code: listName }.
 */
function assignFacilityListNames_(entries, suffix, baseOf) {
  var namesByCode = {};
  var rankByBase = {};

  for (var i = 0; i < entries.length; i++) {
    var code = String(entries[i].code == null ? "" : entries[i].code).trim();
    var facility = entries[i].facility;
    if (!code || !facility || namesByCode[code]) continue;

    var base = baseOf ? baseOf(facility) : getFacilityVariableBase_(facility);
    var rank = (rankByBase[base] || 0) + 1;
    rankByBase[base] = rank;

    var listName = base + suffix;
    if (rank > 1) {
      listName += "_" + padKoboFacilityRank_(rank);
    }

    namesByCode[code] = listName;
  }

  return namesByCode;
}

/** At least two digits: 2 → "02", 10 → "10", 100 → "100". */
function padKoboFacilityRank_(rank) {
  return rank < 10 ? "0" + rank : String(rank);
}


// =====================================================
// HELPER: GET OR CREATE SHEET
// =====================================================
function getOrCreateSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);

  if (!sheet) 
    sheet = ss.insertSheet(name);
  else 
    sheet.clear();

  return sheet;
}