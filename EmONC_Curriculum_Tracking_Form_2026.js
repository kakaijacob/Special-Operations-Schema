// =====================================================
// EmONC Curriculum Tracking Form 2026
// Builds a Kobo-ready Google Sheet (survey / choices / settings)
// from the shared kobocreator.js output workbook.
// =====================================================

var EMONC_CTF_2026_TITLE = "EmONC Curriculum Tracking Form";

// Script Properties keys
var EMONC_CTF_2026_PROP_FORM_ID = "EMONC_CTF_2026_SPREADSHEET_ID";

var EMONC_CTF_2026_SURVEY_HEADERS = [
  "type",
  "name",
  "label",
  "hint",
  "required",
  "required_message",
  "constraint_message",
  "relevant",
  "parameters",
  "calculation"
];

var EMONC_CTF_2026_CHOICES_HEADERS = [
  "list_name",
  "name",
  "label"
];

var EMONC_CTF_2026_SETTINGS_HEADERS = [
  "allow_choice_duplicates"
];

/**
 * Create / update this form only.
 * Prefer the shared pipeline refreshAllKoboTools() from Kobo_Tools_Orchestrator.js
 * (sync → kobocreator → all registered forms). Menu/trigger live there.
 */
function createEmONCCurriculumTrackingForm2026() {
  return upsertEmONCCurriculumTrackingForm2026_(
    SpreadsheetApp.getActiveSpreadsheet()
  );
}

/**
 * Open the saved form spreadsheet (or create it), then overwrite
 * survey / choices / settings from the kobocreator workbook.
 */
function upsertEmONCCurriculumTrackingForm2026_(sourceSs) {
  var props = PropertiesService.getScriptProperties();
  var formId = props.getProperty(EMONC_CTF_2026_PROP_FORM_ID);
  var formSs;
  var created = false;

  if (formId) {
    try {
      formSs = SpreadsheetApp.openById(formId);
    } catch (err) {
      formSs = null;
    }
  }

  if (!formSs) {
    formSs = SpreadsheetApp.create(EMONC_CTF_2026_TITLE);
    props.setProperty(EMONC_CTF_2026_PROP_FORM_ID, formSs.getId());
    created = true;
  } else if (formSs.getName() !== EMONC_CTF_2026_TITLE) {
    // Keep saved form title in sync if it was created under an older name
    formSs.rename(EMONC_CTF_2026_TITLE);
  }

  var surveySheet = getOrCreateEmONCCTF2026Sheet_(formSs, "survey");
  var choicesSheet = getOrCreateEmONCCTF2026Sheet_(formSs, "choices");
  var settingsSheet = getOrCreateEmONCCTF2026Sheet_(formSs, "settings");

  // Keep only the three Kobo tabs
  removeExtraEmONCCTF2026Sheets_(formSs, ["survey", "choices", "settings"]);

  // Build choices first so the survey can be validated against the exact
  // lists that ship with the form.
  var choiceRows = getEmONCCTF2026ChoiceRows_(sourceSs);

  writeEmONCCTF2026Survey_(surveySheet, sourceSs, choiceRows);
  writeEmONCCTF2026Choices_(choicesSheet, choiceRows);
  writeEmONCCTF2026Settings_(settingsSheet);

  formSs.setActiveSheet(surveySheet);

  Logger.log(
    (created ? "Created" : "Updated in place") + ": " + formSs.getUrl()
  );
  return formSs;
}

function getOrCreateEmONCCTF2026Sheet_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function removeExtraEmONCCTF2026Sheets_(ss, keepNames) {
  var sheets = ss.getSheets();
  var keep = {};
  for (var i = 0; i < keepNames.length; i++) {
    keep[keepNames[i]] = true;
  }

  // Spreadsheet must keep at least one sheet; delete extras only when safe
  for (var s = sheets.length - 1; s >= 0; s--) {
    var sheet = sheets[s];
    if (!keep[sheet.getName()] && ss.getSheets().length > 1) {
      ss.deleteSheet(sheet);
    }
  }
}

// =====================================================
// SURVEY
// =====================================================
function writeEmONCCTF2026Survey_(sheet, sourceSs, choiceRows) {
  var bodyRows = getEmONCCTF2026SurveyRows_()
    .concat(getEmONCCTF2026MenteeSurveyRows_(sourceSs))
    .concat([
      ["end_group", "", "", "", "", "", "", "", "", ""], // close mentee_details
      ["end_group", "", "", "", "", "", "", "", "", ""]  // close demographic_information
    ])
    .concat(getEmONCCTF2026Section2Rows_());

  bodyRows = dropEmONCCTF2026RowsWithMissingChoices_(
    bodyRows,
    collectEmONCCTF2026ChoiceListNames_(choiceRows)
  );

  var rows = [EMONC_CTF_2026_SURVEY_HEADERS].concat(bodyRows);

  sheet.clear();
  ensureEmONCCTF2026SheetCapacity_(sheet, rows.length, rows[0].length);
  var range = sheet.getRange(1, 1, rows.length, rows[0].length);
  // Keep required as text "true"/"false" (Kobo), not Sheets boolean TRUE/FALSE
  range.setNumberFormat("@");
  range.setValues(rows);
}

function getEmONCCTF2026SurveyRows_() {
  var nextGroupHideCalc =
    "if(${busia_facilities} != '', ${busia_facilities}, " +
    "if(${kakamega_facilities} != '', ${kakamega_facilities}, " +
    "if(${kiambu_facilities} != '', ${kiambu_facilities}, " +
    "if(${kilifi_facilities} != '', ${kilifi_facilities}, " +
    "if(${kisii_facilities} != '', ${kisii_facilities}, " +
    "if(${kwale_facilities} != '', ${kwale_facilities}, " +
    "if(${kirinyaga_facilities} != '', ${kirinyaga_facilities}, " +
    "if(${machakos_facilities} != '', ${machakos_facilities}, " +
    "if(${makueni_facilities} != '', ${makueni_facilities}, " +
    "if(${meru_facilities} != '', ${meru_facilities}, " +
    "if(${mombasa_facilities} != '', ${mombasa_facilities}, " +
    "if(${muranga_facilities} != '', ${muranga_facilities}, " +
    "if(${nairobi_facilities} != '', ${nairobi_facilities}, " +
    "if(${nakuru_facilities} != '', ${nakuru_facilities}, " +
    "if(${siaya_facilities} != '', ${siaya_facilities}, " +
    "if(${nyeri_facilities} != '', ${nyeri_facilities}, ''))))))))))))))))";

  // Columns: type, name, label, hint, required, required_message,
  //          constraint_message, relevant, parameters, calculation
  return [
    [
      "begin_group",
      "introduction",
      "Introduction",
      "",
      "false",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "introduction_note",
      "*The **EmONC Curriculum Tracking Form** is designed to track the implementation of MENTORS activities under the MoH EmONC Curriculum. It should be completed after each session to capture attendance, participation, and the type of activities delivered. The information collected will be used to monitor coverage, identify engagement levels, and support continuous improvement of the MENTORS program.*",
      "",
      "false",
      "",
      "",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "demographic_information",
      "Section 1: Demographic Information",
      "",
      "false",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "note_mentors_details",
      "***Section Note:*** *This section captures key information about the mentees for accurate identification and follow-up. Please record the facilitating mentor's full name (two names), select the county and facility where the mentee is based, and confirm the mentees who attended mentorship sessions. Ensure all details are filled in correctly to support monitoring and reporting.*",
      "",
      "false",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "begin_group",
      "mentor_details",
      "Section 1a: Mentor (IFM) and Session Details",
      "",
      "",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "text",
      "mentor_name",
      "1. Please enter your name",
      "Enumerator note: Write the full names of the facilitating IFMs. Use \"/\" to separate two IFM names. Example: *Julius Caesar / Ragnar Lothbrok*",
      "true",
      "Sorry, this answer is required",
      "",
      "",
      "",
      ""
    ],
    [
      "date",
      "session_date",
      "2. Record the date when the mentorship session took place.",
      "",
      "true",
      "",
      "Please enter today’s date! Only the current date is allowed.",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "facility_details",
      "Section 1b: Mentee Facility Details",
      "",
      "",
      "",
      "",
      "${session_date} != '' and ${mentor_name}!=''",
      "",
      ""
    ],
    [
      "select_one county",
      "county",
      "3. Please select the county where the mentorship training is taking place.",
      "",
      "true",
      "",
      "",
      "",
      "randomize=false",
      ""
    ],
    facilitySelectRow_("busia_facilities", "Busia"),
    facilitySelectRow_("kakamega_facilities", "Kakamega"),
    facilitySelectRow_("kiambu_facilities", "Kiambu"),
    facilitySelectRow_("kilifi_facilities", "Kilifi"),
    facilitySelectRow_("kisii_facilities", "Kisii"),
    facilitySelectRow_("kwale_facilities", "Kwale"),
    facilitySelectRow_("kirinyaga_facilities", "Kirinyaga"),
    facilitySelectRow_("machakos_facilities", "Machakos"),
    facilitySelectRow_("makueni_facilities", "Makueni"),
    facilitySelectRow_("meru_facilities", "Meru"),
    facilitySelectRow_("mombasa_facilities", "Mombasa"),
    facilitySelectRow_("muranga_facilities", "Muranga"),
    facilitySelectRow_("nairobi_facilities", "Nairobi"),
    facilitySelectRow_("nakuru_facilities", "Nakuru"),
    facilitySelectRow_("nyeri_facilities", "Nyeri"),
    facilitySelectRow_("siaya_facilities", "Siaya"),
    [
      "calculate",
      "next_group_hide1",
      "Next Group Hide 1",
      "",
      "true",
      "",
      "",
      "",
      "",
      nextGroupHideCalc
    ],
    ["end_group", "", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "mentee_details",
      "Section 1c: List of Mentees",
      "",
      "",
      "",
      "",
      "${next_group_hide1} != ''",
      "",
      ""
    ],
    [
      "note",
      "mentee_notes",
      "***Enumerator Note:*** *Please select only the mentees who were present and participated in the session delivered.*",
      "",
      "",
      "",
      "",
      "${next_group_hide1} != ''",
      "",
      ""
    ]
  ];
}

function facilitySelectRow_(listName, countyLabel) {
  return [
    "select_one " + listName,
    listName,
    "4. Please select the facility where the mentorship training is taking place.",
    "",
    "true",
    "",
    "",
    "${county}='" + countyLabel + "'",
    "",
    ""
  ];
}

/**
 * Section 1c body: pull type / name / label / relevant from
 * kobocreator's "Curriculum Tracking Form" sheet.
 * kobocreator leaves required blank — set to "true" (Kobo text) on import.
 */
function getEmONCCTF2026MenteeSurveyRows_(sourceSs) {
  var sourceSheet = sourceSs.getSheetByName("Curriculum Tracking Form");
  if (!sourceSheet) {
    throw new Error(
      "Sheet 'Curriculum Tracking Form' not found. " +
      "Run generateCurriculumTrackingForm() or generateAllOutputs() first."
    );
  }

  var data = sourceSheet.getDataRange().getValues();
  if (!data || data.length < 2) return [];

  var header = data[0];
  var typeIndex = header.indexOf("type");
  var nameIndex = header.indexOf("name");
  var labelIndex = header.indexOf("label");
  var relevantIndex = header.indexOf("relevant");

  if (
    typeIndex === -1 ||
    nameIndex === -1 ||
    labelIndex === -1 ||
    relevantIndex === -1
  ) {
    throw new Error(
      "Curriculum Tracking Form is missing required columns: type, name, label, relevant"
    );
  }

  var rows = [];

  for (var i = 1; i < data.length; i++) {
    var type = data[i][typeIndex];
    var name = data[i][nameIndex];
    var label = data[i][labelIndex];
    var relevant = data[i][relevantIndex];

    if (!type && !name) continue;

    // Map into survey columns:
    // type, name, label, hint, required, required_message,
    // constraint_message, relevant, parameters, calculation
    // required as lowercase text for Kobo compatibility
    rows.push([
      type || "",
      name || "",
      label || "",
      "",
      "true",
      "",
      "",
      relevant || "",
      "",
      ""
    ]);
  }

  return rows;
}

// =====================================================
// SECTION 2: EmONC Training Curriculum
// =====================================================
function getEmONCCTF2026Section2Rows_() {
  // Columns: type, name, label, hint, required, required_message,
  //          constraint_message, relevant, parameters, calculation
  return [
    [
      "begin_group",
      "emonc_training_curriculum",
      "Section 2: EmONC Training Curriculum",
      "",
      "false",
      "",
      "",
      "${next_group_hide1} != ''",
      "",
      ""
    ],
    [
      "note",
      "section2_note",
      "***Section Note:*** *This section captures the EmONC training curriculum activities delivered during mentorship sessions. It documents the participation of mentees across different learning methods, including lecturettes (CMEs), videos, case scenarios, skill demonstrations, return demonstrations, and simulation drills.*",
      "",
      "",
      "",
      "",
      "${next_group_hide1} != ''",
      "",
      ""
    ],
    [
      "begin_group",
      "emonc_curriculum_activities",
      "Section 2a: EmONC Activities",
      "",
      "",
      "",
      "",
      "${next_group_hide1} != ''",
      "",
      ""
    ],
    [
      "note",
      "activities_note",
      "***Enumerator Note:*** *This section captures the EmONC curriculum mentorship activities conducted during the session. The activities include lecturettes, videos, case scenarios and role plays, skill demonstrations by the mentor, return demonstrations by mentees, and simulations and drills. For each session, indicate which activities the selected mentee(s) participated in.*",
      "",
      "",
      "",
      "",
      "${next_group_hide1} != ''",
      "",
      ""
    ],
    [
      "select_multiple emonc_activities",
      "emonc_activities",
      "6. Please select the EmONC curriculum mentorship activities that the selected mentee(s) participated in.",
      "",
      "true",
      "Sorry, this answer is required",
      "",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "group_cmes",
      "EmONC Lecturettes (CMEs)",
      "",
      "false",
      "",
      "",
      "selected(${emonc_activities}, 'cmes')",
      "",
      ""
    ],
    [
      "note",
      "note_cme",
      "***Enumerator Note:*** *This section captures whether mentees attended CME lecturettes. Please record the specific topic covered by selecting the appropriate option from the list provided.*",
      "",
      "false",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one cmes",
      "cmes",
      "7. Please select the CME module lecturette that the selected mentee(s) participated in.",
      "Enumerator note: Select the CME lecturette completed.",
      "true",
      "",
      "",
      "selected(${emonc_activities}, 'cmes')",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "group_videos",
      "Section 2b: Videos",
      "",
      "false",
      "",
      "",
      "selected(${emonc_activities}, 'videos')",
      "",
      ""
    ],
    [
      "note",
      "note_videos",
      "***Enumerator Note:*** *This section captures whether mentees were taken through videos sessions. Please record the specific module covered by selecting the appropriate option from the list provided.*",
      "",
      "false",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one videos",
      "videos",
      "8. Please select the video session that the selected mentee(s) participated in.",
      "Enumerator note: Select the Video or case scenario completed.",
      "true",
      "",
      "",
      "selected(${emonc_activities}, 'videos')",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "group_case_scenarios",
      "Section 2b: Videos or Case Scenarios",
      "",
      "false",
      "",
      "",
      "selected(${emonc_activities}, 'case_scenarios')",
      "",
      ""
    ],
    [
      "note",
      "note_scenarios",
      "***Enumerator Note:*** *This section captures whether mentees were taken through case scenarios. Please record the specific module covered by selecting the appropriate option from the list provided.*",
      "",
      "false",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one case_scenarios",
      "case_scenarios",
      "8. Please select the case scenario session that the selected mentee(s) participated in.",
      "Enumerator note: Select the Video or case scenario completed.",
      "true",
      "",
      "",
      "selected(${emonc_activities}, 'case_scenarios')",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "group_mentor_demo",
      "Section 2c: Skill Demonstrations by Mentor",
      "",
      "false",
      "",
      "",
      "selected(${emonc_activities}, 'skill_demos_mentor')",
      "",
      ""
    ],
    [
      "note",
      "note_mentor_demo",
      "***Enumerator Note:*** *This section captures whether the mentor demonstrated specific skills during the session. Please record the skill covered by selecting the appropriate option from the list provided.*",
      "",
      "false",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_multiple mentor_skills_demo",
      "mentor_skills_demo",
      "9. Please select the skill module demonstrated to the participant mentees(s).",
      "Enumerator note: Select all skills demonstrated by the mentor during the session.",
      "true",
      "",
      "",
      "selected(${emonc_activities}, 'skill_demos_mentor')",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "group_return_demo",
      "Section 2d: Return Demonstrations by Mentee",
      "",
      "false",
      "",
      "",
      "selected(${emonc_activities}, 'skills_demos_mentee')",
      "",
      ""
    ],
    [
      "note",
      "note_retrun_demo",
      "***Enumerator Note:*** *This section captures whether mentees performed return demonstrations of specific skills. Please record the skill covered by selecting the appropriate option from the list provided.*",
      "",
      "false",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_multiple mentee_skills_return_demo",
      "mentee_skills_return_demo",
      "10. Please select the skill module demonstrated by the participant mentees(s).",
      "Enumerator note: Select all skills performed by the mentee during the return demonstration.",
      "true",
      "",
      "",
      "selected(${emonc_activities}, 'skills_demos_mentee')",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "group_drills",
      "Section 2d: Simulation & Drills",
      "",
      "false",
      "",
      "",
      "selected(${emonc_activities}, 'drills')",
      "",
      ""
    ],
    [
      "note",
      "note_drills",
      "***Enumerator Note:*** *This section captures whether mentees participated in simulation drills. Please record the drill conducted by selecting the appropriate option from the list provided.*",
      "",
      "false",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one drills",
      "drills",
      "11. Please select the simulation drill module that the selected mentee(s) participated in.",
      "Enumerator note: Select the simulation drill conducted during the session.",
      "true",
      "",
      "",
      "selected(${emonc_activities}, 'drills')",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", ""], // close group_drills
    ["end_group", "", "", "", "", "", "", "", "", ""], // close emonc_training_curriculum
    [
      "note",
      "Thank_you",
      "*The end. Thank you for completing this curriculum tracking form. The information you have provided will help monitor session coverage and support continuous improvement of MENTORS activities.*",
      "",
      "false",
      "",
      "",
      "(${emonc_activities} !='') and (${cmes} != '' or ${videos} != '' or ${case_scenarios} != '' or ${mentor_skills_demo} != '' or ${mentee_skills_return_demo} != '' or ${drills} != '')",
      "",
      ""
    ]
  ];
}

// =====================================================
// CHOICES
// =====================================================
function getEmONCCTF2026ChoiceRows_(sourceSs) {
  return getEmONCCTF2026CountyChoices_()
    .concat(getEmONCCTF2026FacilityChoices_(sourceSs))
    .concat(getEmONCCTF2026MenteeChoices_(sourceSs))
    .concat(getEmONCCTF2026ActivityChoices_());
}

function writeEmONCCTF2026Choices_(sheet, choiceRows) {
  var rows = [EMONC_CTF_2026_CHOICES_HEADERS].concat(choiceRows);

  sheet.clear();
  ensureEmONCCTF2026SheetCapacity_(sheet, rows.length, rows[0].length);
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}

/**
 * A partially written tab makes Kobo reject the deployment with
 * "List name not in choices sheet", so grow the grid before writing.
 */
function ensureEmONCCTF2026SheetCapacity_(sheet, rowCount, columnCount) {
  var maxRows = sheet.getMaxRows();
  if (maxRows < rowCount) {
    sheet.insertRowsAfter(maxRows, rowCount - maxRows);
  }

  var maxColumns = sheet.getMaxColumns();
  if (maxColumns < columnCount) {
    sheet.insertColumnsAfter(maxColumns, columnCount - maxColumns);
  }
}

/** list_name values that ship with at least one usable choice. */
function collectEmONCCTF2026ChoiceListNames_(choiceRows) {
  var lists = {};
  for (var i = 0; i < choiceRows.length; i++) {
    var listName = String(choiceRows[i][0] == null ? "" : choiceRows[i][0]).trim();
    var name = String(choiceRows[i][1] == null ? "" : choiceRows[i][1]).trim();
    if (listName && name) {
      lists[listName] = true;
    }
  }
  return lists;
}

/** "select_one x" / "select_multiple x" → "x", anything else → "". */
function extractEmONCCTF2026SelectListName_(type) {
  var match = String(type == null ? "" : type)
    .trim()
    .match(/^select_(?:one|multiple)(?:_from_file)?\s+(\S+)/);
  return match ? match[1] : "";
}

/**
 * Kobo refuses to deploy the whole form when any select references a list that
 * is absent from the choices sheet ("List name not in choices sheet: x").
 * Drop those questions, but keep any that another row references through
 * ${name}, since removing those would only trade one deploy error for another.
 */
function dropEmONCCTF2026RowsWithMissingChoices_(rows, availableChoiceLists) {
  var orphanIndexes = [];
  var i;

  for (i = 0; i < rows.length; i++) {
    var listName = extractEmONCCTF2026SelectListName_(rows[i][0]);
    if (!listName) continue;

    // Collapse stray whitespace so the type matches the trimmed choices.
    rows[i][0] = String(rows[i][0]).trim().replace(/\s+/g, " ");

    if (!availableChoiceLists[listName]) {
      orphanIndexes.push(i);
    }
  }

  if (!orphanIndexes.length) return rows;

  // relevant, parameters and calculation can reference another field.
  var expressionColumns = [7, 8, 9];
  var expressions = [];
  for (i = 0; i < rows.length; i++) {
    for (var c = 0; c < expressionColumns.length; c++) {
      var value = rows[i][expressionColumns[c]];
      if (value) expressions.push(String(value));
    }
  }
  var expressionText = expressions.join(" ");

  var dropped = {};
  var keptNames = [];
  var droppedNames = [];

  for (i = 0; i < orphanIndexes.length; i++) {
    var index = orphanIndexes[i];
    var fieldName = String(rows[index][1] == null ? "" : rows[index][1]).trim();
    var list = extractEmONCCTF2026SelectListName_(rows[index][0]);

    if (fieldName && expressionText.indexOf("${" + fieldName + "}") !== -1) {
      keptNames.push(fieldName + " (" + list + ")");
      continue;
    }

    dropped[index] = true;
    droppedNames.push(list);
  }

  if (droppedNames.length) {
    Logger.log(
      "EmONC CTF 2026: removed " + droppedNames.length + " question(s) whose " +
      "choice list is not in the generated choices sheet: " +
      droppedNames.sort().join(", ")
    );
  }
  if (keptNames.length) {
    Logger.log(
      "EmONC CTF 2026 WARNING: kept " + keptNames.length + " question(s) with " +
      "a missing choice list because other rows reference them: " +
      keptNames.sort().join(", ") + ". Kobo will reject this deployment."
    );
  }

  var filtered = [];
  for (i = 0; i < rows.length; i++) {
    if (!dropped[i]) filtered.push(rows[i]);
  }
  return filtered;
}

function getEmONCCTF2026CountyChoices_() {
  // list_name, name, label
  return [
    ["county", "Busia", "Busia"],
    ["county", "Kakamega", "Kakamega"],
    ["county", "Kiambu", "Kiambu"],
    ["county", "Kilifi", "Kilifi"],
    ["county", "Kisii", "Kisii"],
    ["county", "Kwale", "Kwale"],
    ["county", "Kirinyaga", "Kirinyaga"],
    ["county", "Machakos", "Machakos"],
    ["county", "Makueni", "Makueni"],
    ["county", "Meru", "Meru"],
    ["county", "Mombasa", "Mombasa"],
    ["county", "Muranga", "Murang'a"],
    ["county", "Nairobi", "Nairobi"],
    ["county", "Nakuru", "Nakuru"],
    ["county", "Nyeri", "Nyeri"],
    ["county", "Siaya", "Siaya"]
  ];
}

/**
 * Facility choices from kobocreator sheet
 * "EmONC Facilities List (Choices)" → list_name, name, label
 */
function getEmONCCTF2026FacilityChoices_(sourceSs) {
  return getEmONCCTF2026ChoicesFromSheet_(
    sourceSs,
    "EmONC Facilities List (Choices)",
    "generateEmONCFacilitiesChoicesSheet()"
  );
}

/**
 * Mentee choices from kobocreator sheet
 * "EmONC Mentees List (Choices)" → list_name, name, label
 */
function getEmONCCTF2026MenteeChoices_(sourceSs) {
  return getEmONCCTF2026ChoicesFromSheet_(
    sourceSs,
    "EmONC Mentees List (Choices)",
    "generateChoicesSheet()"
  );
}

/**
 * Static activity / module choice lists for Section 2.
 */
function getEmONCCTF2026ActivityChoices_() {
  // list_name, name, label
  return [
    ["emonc_activities", "cmes", "Activity 1: Lecturettes"],
    ["emonc_activities", "videos", "Activity 2: Videos"],
    ["emonc_activities", "case_scenarios", "Activity 3: Case scenarios & role plays"],
    ["emonc_activities", "skill_demos_mentor", "Activity 4: Skill demonstrations by mentor"],
    ["emonc_activities", "skills_demos_mentee", "Activity 5: Return demonstrations by mentee"],
    ["emonc_activities", "drills", "Activity 6: Simulations and drills"],

    ["cmes", "Antepartum_Haemorrhage", "1. Antepartum Haemorrhage"],
    ["cmes", "AMTSL", "2. Active management of third stage of labor (AMTSL)"],
    ["cmes", "Newborn_resuscitation", "3. Immediate newborn resuscitation"],
    ["cmes", "Partograph_use_and_interpretation", "4. Labor Monitoring - Partograph or labor care guide use"],
    ["cmes", "Maternal_resuscitation", "5. Maternal resuscitation"],
    ["cmes", "Maternal_shock", "6. Management of maternal shock"],
    ["cmes", "Cord_prolapse", "7. Management of cord prolapse"],
    ["cmes", "Postpartum_haemorrhage_(PPH)", "8. Management of postpartum haemorrhage (PPH)"],
    ["cmes", "Hypertension_in_pregnancy", "9. Management of pre-eclampsia/eclampsia"],
    ["cmes", "Obstructed_Labor", "10. Obstructed Labor"],
    ["cmes", "Shoulder_dystocia", "11. Shoulder dystocia delivery"],
    ["cmes", "Vaginal_breech_delivery", "12. Vaginal breech delivery"],
    ["cmes", "Vaginal_AVD", "13. Vaginal vacuum-assisted delivery (AVD)"],

    ["videos", "AMTSL", "1. Active Management of third stage"],
    ["videos", "Bimanual_compression", "2. Bimanual Compression of the Uterus"],
    ["videos", "Compression_of_Abdominal_Aorta", "3. Compression of Abdominal Aorta"],
    ["videos", "Cord_Prolapse", "4. First response bundle for PPH treatment"],
    ["videos", "Cervical_Tear_Repair", "5. Immediate newborn resuscitation"],
    ["videos", "Newborn_Resuscitation", "6. Management of Cord prolapse"],
    ["videos", "NASG_placement", "7. Placement of Blynch Suture"],
    ["videos", "NASG_placement", "8. Placement of Non Pneumatic garment"],
    ["videos", "Perineal_Tear_Repair", "9. Placement of Uterine Ballon Tamponade"],
    ["videos", "Postpartum_haemorrhage_(PPH)", "10. Placement of Uterine Balloon Tamponade - Free Flow System"],
    ["videos", "Retained_Placenta_Removal", "11. Repair of Cervical tear"],
    ["videos", "Shoulder_Dystocia", "12. Repair of perineal tear repair"],
    ["videos", "UBT", "13. Removal of retained Placenta"],
    ["videos", "UBT_Freeflow", "14. Shoulder dystocia delivery"],
    ["videos", "Uterine_Inversion", "15. Uterine Inversion"],
    ["videos", "Vaginal_Breech_Delivery", "16. Vaginal breech delivery"],
    ["videos", "Vacuum_Assisted_Delivery", "17. Vaginal vacuum assisted delivery"],

    ["case_scenarios", "Labor_Monitoring", "1. Labor monitoring - Partograph and labor care guide (practicum case scenarios)"],
    ["case_scenarios", "Obstructed_Labor", "2. Obstructed labour (practicum case scenarios)"],
    ["case_scenarios", "Maternal_Shock_Resuscitaion", "3. Maternal shock & resuscitation (role play)"],
    ["case_scenarios", "Preeclampsia_Eclampsia_Management", "4. Management of pre-eclampsia/eclampsia (role play)"],

    ["mentor_skills_demo", "AMTSL", "1. Active Management of Third Stage (AMTSL)"],
    ["mentor_skills_demo", "Bimanual_compression", "2. Bimanual Compression of the Uterus"],
    ["mentor_skills_demo", "Compression_abdominal_aorta", "3. Compression of the Abdominal Aorta"],
    ["mentor_skills_demo", "Postpartum_haemorrhage_(PPH)", "4. First response bundle for PPH treatment"],
    ["mentor_skills_demo", "Newborn_resuscitation", "5. Immediate newborn resuscitation"],
    ["mentor_skills_demo", "Cord_prolapse", "6. Management of Cord Prolapse"],
    ["mentor_skills_demo", "Maternal_shock", "7. Management of maternal shock"],
    ["mentor_skills_demo", "Maternal_resuscitation", "8. Maternal resuscitation"],
    ["mentor_skills_demo", "Preeclampsia_/_Eclampsia", "9. Management OF Pre-eclampsia /Eclampsia"],
    ["mentor_skills_demo", "B-lynch_suture", "10. Placement of Blynch Suture"],
    ["mentor_skills_demo", "NASG_placement", "11. Placement of Non-Pneumatic Garment"],
    ["mentor_skills_demo", "Ubt_placement", "12. Placement of Uterine Ballon Tamponade"],
    ["mentor_skills_demo", "Ubt_placement_(free_flow)", "13. Placement of Uterine Balloon Tamponade - Free Flow System"],
    ["mentor_skills_demo", "Cervical_tear_repair", "14. Repair of Cervical tear"],
    ["mentor_skills_demo", "Perineal_tear_repair", "15. Repair of perineal tear repair"],
    ["mentor_skills_demo", "Retained_placenta_removal", "16. Removal of retained Placenta"],
    ["mentor_skills_demo", "Shoulder_dystocia", "17. Shoulder dystocia delivery"],
    ["mentor_skills_demo", "Uterine_Inversion", "19. Uterine Inversion"],
    ["mentor_skills_demo", "Vaginal_breech_delivery", "20. Vaginal breech delivery"],
    ["mentor_skills_demo", "Vaginal_AVD", "21. Vaginal vacuum-assisted delivery"],

    ["mentee_skills_return_demo", "AMTSL", "1. Active Management of third stage (AMTSL)"],
    ["mentee_skills_return_demo", "Bimanual_compression", "2. Bimanual Compression of the Uterus"],
    ["mentee_skills_return_demo", "Compression_abdominal_aorta", "3. Compression of the Abdominal Aorta"],
    ["mentee_skills_return_demo", "Postpartum_haemorrhage_(PPH)", "4. First response bundle for PPH treatment"],
    ["mentee_skills_return_demo", "Newborn_resuscitation", "5. Immediate newborn resuscitation"],
    ["mentee_skills_return_demo", "Cord_prolapse", "6. Management of Cord Prolapse"],
    ["mentee_skills_return_demo", "Maternal_shock", "7. Management of maternal shock"],
    ["mentee_skills_return_demo", "Maternal_resuscitation", "8. Maternal resuscitation"],
    ["mentee_skills_return_demo", "Preeclampsia_/_Eclampsia", "9. Management OF Pre-eclampsia /Eclampsia"],
    ["mentee_skills_return_demo", "B-lynch_suture", "10. Placement of Blynch Suture"],
    ["mentee_skills_return_demo", "NASG_placement", "11. Placement of Non-Pneumatic Garment"],
    ["mentee_skills_return_demo", "Ubt_placement", "12. Placement of Uterine Ballon Tamponade"],
    ["mentee_skills_return_demo", "Ubt_placement_(free_flow)", "13. Placement of Uterine Balloon Tamponade - Free Flow System"],
    ["mentee_skills_return_demo", "Cervical_tear_repair", "14. Repair of Cervical tear"],
    ["mentee_skills_return_demo", "Perineal_tear_repair", "15. Repair of perineal tear repair"],
    ["mentee_skills_return_demo", "Retained_placenta_removal", "16. Removal of retained Placenta"],
    ["mentee_skills_return_demo", "Shoulder_dystocia", "17. Shoulder dystocia delivery"],
    ["mentee_skills_return_demo", "Uterine_Inversion", "19. Uterine Inversion"],
    ["mentee_skills_return_demo", "Vaginal_breech_delivery", "20. Vaginal breech delivery"],
    ["mentee_skills_return_demo", "Vaginal_AVD", "21. Vaginal vacuum-assisted delivery"],

    ["drills", "Neonatal_resuscitation", "1. Immediate newborn resuscitation"],
    ["drills", "Maternal_shock", "2. Management of maternal shock"],
    ["drills", "Maternal_resuscitation", "3. Maternal resuscitation"],
    ["drills", "Preeclampsia_/_eclampsia", "4. Management of Pre-eclampsia /Eclampsia"],
    ["drills", "PPH_Drill", "5. PPH drill & simulation"]
  ];
}

/**
 * Generic pull of list_name / name / label from a kobocreator choices sheet.
 */
function getEmONCCTF2026ChoicesFromSheet_(sourceSs, sheetName, generatorHint) {
  var sourceSheet = sourceSs.getSheetByName(sheetName);
  if (!sourceSheet) {
    throw new Error(
      "Sheet '" + sheetName + "' not found. " +
      "Run " + generatorHint + " or generateAllOutputs() first."
    );
  }

  var data = sourceSheet.getDataRange().getValues();
  if (!data || data.length < 2) return [];

  var header = data[0];
  var listNameIndex = header.indexOf("list_name");
  var nameIndex = header.indexOf("name");
  var labelIndex = header.indexOf("label");

  if (listNameIndex === -1 || nameIndex === -1 || labelIndex === -1) {
    throw new Error(
      sheetName + " is missing required columns: list_name, name, label"
    );
  }

  var rows = [];

  for (var i = 1; i < data.length; i++) {
    var listName = data[i][listNameIndex];
    var name = data[i][nameIndex];
    var label = data[i][labelIndex];

    if (!listName && !name) continue;

    rows.push([
      listName || "",
      name || "",
      label || ""
    ]);
  }

  return rows;
}

// =====================================================
// SETTINGS
// =====================================================
function writeEmONCCTF2026Settings_(sheet) {
  var rows = [
    EMONC_CTF_2026_SETTINGS_HEADERS,
    ["yes"]
  ];
  sheet.clear();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}
