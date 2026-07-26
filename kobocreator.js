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

    var koboVariable = generateKoboVariable(facility);
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
}


// =====================================================
// Helper: get or create sheet
// =====================================================
function getOrCreateSheet(name) {

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);

  if (!sh) {
    sh = ss.insertSheet(name);
  }

  sh.clear();

  return sh;
}


// =====================================================
// Helper: Find header column by exact or case-insensitive alias
// =====================================================
function findHeaderIndex_(header, names) {
  var aliases =
    Object.prototype.toString.call(names) === "[object Array]"
      ? names
      : [names];
  var i;
  var c;
  var want;

  for (i = 0; i < aliases.length; i++) {
    var exact = header.indexOf(aliases[i]);
    if (exact !== -1) return exact;
  }

  for (i = 0; i < aliases.length; i++) {
    want = String(aliases[i] == null ? "" : aliases[i]).trim().toLowerCase();
    for (c = 0; c < header.length; c++) {
      if (
        String(header[c] == null ? "" : header[c]).trim().toLowerCase() ===
        want
      ) {
        return c;
      }
    }
  }

  return -1;
}

// =====================================================
// Helper: Clean for Kobo variable naming
// =====================================================
function cleanForKobo(str) {

  if (!str) return "";

  return str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}


// =====================================================
// Helper: Generate Kobo Variable
// =====================================================
function generateKoboVariable(str) {
  return cleanForKobo(str);
}

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

  var idIndex = header.indexOf("Mentee ID");
  var nameIndex = header.indexOf("Name");
  var countyIndex = header.indexOf("County");
  var facilityIndex = header.indexOf("Facility");
  var facilityCodeIndex = header.indexOf("Facility Code");
  var programIndex = header.indexOf("Program");
  var statusIndex = header.indexOf("Status"); // ✅ NEW

  var choicesSheet = getOrCreateSheet("EmONC Mentees List (Choices)");
  var output = [["County","Facility","Facility Code","Program","list_name","name","label"]];

  for (var i = 1; i < data.length; i++) {
    var rawID = data[i][idIndex];
    var name = data[i][nameIndex];

    if (!rawID || !name) continue;

    // ✅ Clean Mentee ID: remove all spaces
    var cleanedID = rawID.toString().replace(/\s+/g, "").trim();

    var programValue = data[i][programIndex];
    var statusValue = data[i][statusIndex]; // ✅ NEW

    // ✅ FILTER: Only include specific Program values + Active status
    if ((programValue !== "MENTORS Curriculum" &&
         programValue !== "Both") ||
        statusValue !== "Active") continue;

    var facility = data[i][facilityIndex];
    var koboVariable = generateKoboVariable(facility);

    // ✅ Generate Kobo name using cleaned ID
    var menteeKobo = cleanedID + "_" + cleanForKobo(name);

    output.push([
      data[i][countyIndex],
      facility,
      data[i][facilityCodeIndex],
      programValue,
      koboVariable,
      menteeKobo,
      name
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

    // ✅ FILTER: Only include specific Program values
    if (
    program !== "MENTORS Curriculum" &&
    program !== "Both") continue;

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

  var processed = {};

  for (var i = 1; i < data.length; i++) {
    var county = data[i][countyIndex];
    var facility = data[i][facilityIndex];
    var code = data[i][facilityCodeIndex];
    var program = data[i][programIndex];

    if (!county || !facility || !code) continue;

    // ✅ FILTER: Only include specific Program values
    if (
      program !== "MENTORS Curriculum" &&
      program !== "Newborn Curriculum" &&
      program !== "Both"
    ) continue;

    // ✅ Map Program → allowed
    var allowed = "";
    
    if (program === "MENTORS Curriculum") {
      allowed = "mentors_curriculum,ifm_assessment,tot";
    } 
    else if (program === "Newborn Curriculum") {
      allowed = "newborn_curriculum,ifm_assessment,tot";
    } 
    else if (program === "Both") {
      allowed = "mentors_curriculum,newborn_curriculum,ifm_assessment,tot";
    }

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
    facility,
    allowed
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
// =====================================================
function generateIFMAssessmentSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sourceSheet = ss.getSheetByName("IFM List");
  if (!sourceSheet) return;

  var data = sourceSheet.getDataRange().getValues();
  var header = data[0];

  // Mentor (IFM) Database 2026 headers: county (was County), Facility, Facility Code
  var countyIndex = findHeaderIndex_(header, ["county", "County"]);
  var facilityIndex = findHeaderIndex_(header, "Facility");
  var facilityCodeIndex = findHeaderIndex_(header, "Facility Code");

  if (countyIndex === -1 || facilityIndex === -1 || facilityCodeIndex === -1) {
    throw new Error(
      "IFM List is missing required columns: county/County, Facility, Facility Code"
    );
  }

  var sheet = getOrCreateSheet("IFM Assessment Facilities List (Choices)");
  var output = [["County","Facility","Facility Code","list_name","name","label"]];

  var seenFacilities = {}; // Track unique facility codes

  for (var i = 1; i < data.length; i++) {
    var county = data[i][countyIndex];
    var facility = data[i][facilityIndex];
    var code = data[i][facilityCodeIndex];

    if (!county || !facility || !code) continue;

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

  var ifmFacilityIndex = findHeaderIndex_(ifmHeader, "Facility");
  var ifmFacilityCodeIndex = findHeaderIndex_(ifmHeader, "Facility Code");
  var ifmCountyIndex = findHeaderIndex_(ifmHeader, ["county", "County"]);

  // Map of IFM facility codes to cleaned names
  var ifmMap = {};
  for (var i = 1; i < ifmData.length; i++) {
    var code = ifmData[i][ifmFacilityCodeIndex];
    var facility = ifmData[i][ifmFacilityIndex];
    var county = ifmData[i][ifmCountyIndex];
    if (!code || !facility || !county) continue;
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
// =====================================================
function generateIFMChoicesSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ifmSheet = ss.getSheetByName("IFM List");
  if (!ifmSheet) return;

  var data = ifmSheet.getDataRange().getValues();
  var header = data[0];

  // Mentor (IFM) Database 2026: county, Facility, Facility Code, Name, Mentor ID
  // (Mentor ID replaces legacy "IFM ID")
  var countyIndex = findHeaderIndex_(header, ["county", "County"]);
  var facilityIndex = findHeaderIndex_(header, "Facility");
  var facilityCodeIndex = findHeaderIndex_(header, "Facility Code");
  var nameIndex = findHeaderIndex_(header, "Name");
  var idIndex = findHeaderIndex_(header, ["Mentor ID", "IFM ID"]);

  if (
    countyIndex === -1 ||
    facilityIndex === -1 ||
    facilityCodeIndex === -1 ||
    nameIndex === -1 ||
    idIndex === -1
  ) {
    throw new Error(
      "IFM List is missing required columns: county/County, Facility, " +
      "Facility Code, Name, Mentor ID (or IFM ID)"
    );
  }

  var sheet = getOrCreateSheet("IFM List (Choices)");
  var output = [["County","Facility","Facility Code","list_name","name","label"]];

  for (var i = 1; i < data.length; i++) {
    var county = data[i][countyIndex];
    var facility = data[i][facilityIndex];
    var code = data[i][facilityCodeIndex];
    var name = data[i][nameIndex];
    var rawID = data[i][idIndex];

    if (!county || !facility || !code || !name || !rawID) continue;

    // ✅ Clean Mentor ID / IFM ID: remove all spaces
    var cleanedID = rawID.toString().replace(/\s+/g, "").trim();

    // Clean facility
    var cleanedFacility = cleanForKobo(facility);

    // Take FIRST word only
    var firstWord = cleanedFacility.split("_")[0];

    var listName = firstWord + "_ifms";

    // ✅ Use cleaned ID for Kobo name
    var fullName = cleanedID + "_" + cleanForKobo(name);

    output.push([
      county,
      facility,
      code,
      listName,
      fullName,
      name
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

    // ✅ FILTER
    if (
      program !== "Newborn Curriculum" &&
      program !== "Both"
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

  var countyIndex = header.indexOf("County");
  var facilityIndex = header.indexOf("Facility");
  var facilityCodeIndex = header.indexOf("Facility Code");
  var programIndex = header.indexOf("Program");
  var idIndex = header.indexOf("Mentee ID");
  var nameIndex = header.indexOf("Name");
  var statusIndex = header.indexOf("Status");

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

  for (var i = 1; i < data.length; i++) {

    var county = data[i][countyIndex];
    var facility = data[i][facilityIndex];
    var code = data[i][facilityCodeIndex];
    var program = data[i][programIndex];
    var rawID = data[i][idIndex];
    var name = data[i][nameIndex];
    var status = data[i][statusIndex];

    if (!county || !facility || !code || !program || !rawID || !name) continue;

    // ✅ FILTER: Program + Status
    if ((program !== "Newborn Curriculum" && program !== "Both") ||
        status !== "Active") continue;

    // Clean ID
    var cleanedID = rawID.toString().replace(/\s+/g, "").trim();

    // === NEW: USE HELPER INSTEAD OF FIRST-WORD LOGIC ===
    var listName = generateKoboVariable(facility, true);

    // Kobo choice value
    var fullName = cleanedID + "_" + cleanForKobo(name);

    output.push([
      county,
      facility,
      code,
      program,
      listName,
      fullName,
      name
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
// Unique Facility Code rows where at least one IFM at that
// facility has Status = Active. Prefer details from an Active
// row; fall back to any complete row for that facility code.
// =====================================================
function generateSurveySheetIFM() {

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ifmSheet = ss.getSheetByName("IFM List");

  if (!ifmSheet) return;

  var range = ifmSheet.getDataRange();
  // Display labels for dropdown Status; raw values as fallback.
  var displayData = range.getDisplayValues();
  var valueData = range.getValues();
  var ifmHeader = displayData[0];

  // Mentor (IFM) Database 2026 headers: county (was County), Facility, Facility Code, Status
  var countyIndex = findHeaderIndex_(ifmHeader, ["county", "County"]);
  var facilityIndex = findHeaderIndex_(ifmHeader, "Facility");
  var facilityCodeIndex = findHeaderIndex_(ifmHeader, "Facility Code");
  var statusIndex = findHeaderIndex_(ifmHeader, ["Status", "status", "STATUS"]);

  if (
    countyIndex === -1 ||
    facilityIndex === -1 ||
    facilityCodeIndex === -1 ||
    statusIndex === -1
  ) {
    throw new Error(
      "IFM List is missing required columns: county/County, Facility, " +
      "Facility Code, Status. Found headers: " + ifmHeader.join(" | ")
    );
  }

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

  // code -> { hasActive, activeDetail, anyDetail }
  var facilitiesByCode = {};
  var statusUnique = {};

  for (var i = 1; i < displayData.length; i++) {
    var county = String(
      displayData[i][countyIndex] == null ? "" : displayData[i][countyIndex]
    ).trim();
    var facility = String(
      displayData[i][facilityIndex] == null ? "" : displayData[i][facilityIndex]
    ).trim();
    var code = String(
      displayData[i][facilityCodeIndex] == null
        ? ""
        : displayData[i][facilityCodeIndex]
    ).trim();

    var statusRaw = valueData[i][statusIndex];
    var statusDisplay = displayData[i][statusIndex];
    var statusKey = normalizeIFMStatus_(statusDisplay) || normalizeIFMStatus_(statusRaw);
    if (statusKey) statusUnique[statusKey] = true;

    if (!code) continue;

    if (!facilitiesByCode[code]) {
      facilitiesByCode[code] = {
        hasActive: false,
        activeDetail: null,
        anyDetail: null
      };
    }

    var detail = null;
    if (county && facility) {
      detail = { county: county, facility: facility, code: code };
      if (!facilitiesByCode[code].anyDetail) {
        facilitiesByCode[code].anyDetail = detail;
      }
    }

    if (isIFMStatusActive_(statusDisplay) || isIFMStatusActive_(statusRaw)) {
      facilitiesByCode[code].hasActive = true;
      if (detail) {
        facilitiesByCode[code].activeDetail = detail;
      }
    }
  }

  for (var codeKey in facilitiesByCode) {
    if (!facilitiesByCode.hasOwnProperty(codeKey)) continue;

    var entry = facilitiesByCode[codeKey];
    if (!entry.hasActive) continue;

    var rec = entry.activeDetail || entry.anyDetail;
    if (!rec) continue;

    var county = rec.county;
    var facility = rec.facility;
    var code = rec.code;

    // Clean facility
    var cleanedFacility = cleanForKobo(facility);
    var firstWord = cleanedFacility.split("_")[0];

    var listName = firstWord + "_ifms";
    var type = "select_one " + listName;

    // Proper Label
    var label = listName
      .replace(/_/g, " ")
      .replace(/\b\w/g, function(l){ return l.toUpperCase(); })
      .replace("Ifms","IFMs");

    // ===== NEW RELEVANT LOGIC =====
    var facilityValue = code + "_" + cleanedFacility;

    // County variable for ${county_facilities} format
    var countyVar = county.toLowerCase().replace(/\s+/g, "_");

    // Relevant string
    var relevant =
      "${" + countyVar + "_facilities} = '" + facilityValue +
      "' and (${program} = 'ifm_assessment' or ${program} = 'tot')";

    output.push([
      county,
      facility,
      code,
      type,
      listName,
      label,
      "",
      "true",
      "Sorry, this answer is required",
      relevant
    ]);
  }

  if (output.length < 2) {
    var statusList = [];
    for (var s in statusUnique) {
      if (statusUnique.hasOwnProperty(s)) statusList.push(s);
    }
    throw new Error(
      "Survey Sheet (IFM) produced 0 rows from IFM List (" +
      (displayData.length - 1) +
      " data row(s)). Unique Status values found: [" +
      (statusList.length ? statusList.join(", ") : "(all blank)") +
      "]. Need Status = Active (case-insensitive) plus county, Facility, Facility Code."
    );
  }

  Logger.log(
    "Survey Sheet (IFM): wrote " + (output.length - 1) +
    " unique Active facility code row(s)."
  );

  // Sort alphabetically by Facility
  output = [output[0]].concat(
    output.slice(1).sort(function(a, b) {
      return String(a[1]).localeCompare(String(b[1]));
    })
  );

  // Clear/write only after rows are built (avoids blank sheet on errors)
  var sheet = getOrCreateSheet("Survey Sheet (IFM)");
  sheet.getRange(1, 1, output.length, output[0].length).setValues(output);
}

/**
 * Normalize IFM Status cell text for Active checks.
 */
function normalizeIFMStatus_(value) {
  return String(value == null ? "" : value)
    .replace(/[\u200b\u200c\u200d\ufeff]/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * True when Status means Active (not Inactive).
 * Accepts "Active", "ACTIVE", and values that contain "active"
 * without "inactive".
 */
function isIFMStatusActive_(value) {
  var s = normalizeIFMStatus_(value);
  if (!s) return false;
  if (s.indexOf("inactive") !== -1 || s.indexOf("not active") !== -1) {
    return false;
  }
  if (s === "active") return true;
  if (s.replace(/[^a-z]/g, "") === "active") return true;
  return /(^|[^a-z])active([^a-z]|$)/.test(s);
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

  for (var i = 1; i < data.length; i++) {

    var county = data[i][countyIndex];
    var facility = data[i][facilityIndex];
    var code = data[i][facilityCodeIndex];
    var program = data[i][programIndex];

    if (!county || !facility || !code || !program) continue;

    // === FILTER PROGRAM ===
    var cleanedProgram = program.toLowerCase().replace(/\s+/g, "_");
    if (cleanedProgram !== "newborn_curriculum" && cleanedProgram !== "both") continue;

    // === Remove duplicates by facility code ===
    if (processedFacilities[code]) continue;
    processedFacilities[code] = true;

    if (cleanedProgram === "both") 
      cleanedProgram = "newborn_curriculum";

    // === KOBO VARIABLE (NBC CONTEXT) ===
    var listName = generateKoboVariable(facility, true);
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
  return text.toString().toLowerCase()
    .replace(/[^a-z0-9 ]/g,"")
    .trim()
    .replace(/\s+/g,"_")
    .replace(/_+/g,"_")
    .replace(/^_+|_+$/g,"");
}

// =====================================================
// 🔧 HELPER: KOBO VARIABLE GENERATOR (CONTEXT-AWARE)
// =====================================================
function generateKoboVariable(facility, isNewbornSheet) {
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

  // ✅ Context-based suffix
  var suffix = isNewbornSheet ? "_nbc_mentees" : "_mentees";

  return base + suffix;
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