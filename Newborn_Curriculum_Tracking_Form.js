// =====================================================
// Newborn Curriculum Tracking Form
// Builds a Kobo-ready Google Sheet (survey / choices / settings)
// from the shared kobocreator.js output workbook.
// =====================================================

var NEWBORN_CTF_TITLE = "Newborn Curriculum Tracking Form";

// Script Properties keys
var NEWBORN_CTF_PROP_FORM_ID = "NEWBORN_CTF_SPREADSHEET_ID";

var NEWBORN_CTF_SURVEY_HEADERS = [
  "type",
  "name",
  "label",
  "required",
  "required_message",
  "constraint_message",
  "relevant",
  "choice_filter",
  "calculation"
];

var NEWBORN_CTF_CHOICES_HEADERS = [
  "list_name",
  "name",
  "label",
  "allowed"
];

var NEWBORN_CTF_SETTINGS_HEADERS = [
  "allow_choice_duplicates"
];

/**
 * Spreadsheet menu: Newborn CTF
 * If EmONC CTF is also installed in this project, merge both menus into one onOpen.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Newborn CTF")
    .addItem("Create / Update Form", "createNewbornCurriculumTrackingForm")
    .addToUi();
}

/**
 * Create the form spreadsheet on first run; later runs overwrite in place.
 */
function createNewbornCurriculumTrackingForm() {
  return upsertNewbornCurriculumTrackingForm_(
    SpreadsheetApp.getActiveSpreadsheet()
  );
}

/**
 * Open the saved form spreadsheet (or create it), then overwrite
 * survey / choices / settings.
 */
function upsertNewbornCurriculumTrackingForm_(sourceSs) {
  var props = PropertiesService.getScriptProperties();
  var formId = props.getProperty(NEWBORN_CTF_PROP_FORM_ID);
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
    formSs = SpreadsheetApp.create(NEWBORN_CTF_TITLE);
    props.setProperty(NEWBORN_CTF_PROP_FORM_ID, formSs.getId());
    created = true;
  }

  var surveySheet = getOrCreateNewbornCTFSheet_(formSs, "survey");
  var choicesSheet = getOrCreateNewbornCTFSheet_(formSs, "choices");
  var settingsSheet = getOrCreateNewbornCTFSheet_(formSs, "settings");

  removeExtraNewbornCTFSheets_(formSs, ["survey", "choices", "settings"]);

  writeNewbornCTFSurvey_(surveySheet, sourceSs);
  writeNewbornCTFChoices_(choicesSheet, sourceSs);
  writeNewbornCTFSettings_(settingsSheet);

  formSs.setActiveSheet(surveySheet);

  Logger.log(
    (created ? "Created" : "Updated in place") + ": " + formSs.getUrl()
  );
  return formSs;
}

function getOrCreateNewbornCTFSheet_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function removeExtraNewbornCTFSheets_(ss, keepNames) {
  var sheets = ss.getSheets();
  var keep = {};
  for (var i = 0; i < keepNames.length; i++) {
    keep[keepNames[i]] = true;
  }

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
function writeNewbornCTFSurvey_(sheet, sourceSs) {
  var menteeRows = getNewbornCTFMenteeSurveyRows_(sourceSs);

  var rows = [NEWBORN_CTF_SURVEY_HEADERS]
    .concat(getNewbornCTFSurveyRows_())
    .concat(getNewbornCTFSection1bRows_())
    .concat(menteeRows)
    .concat(getNewbornCTFCloseSection1Rows_(menteeRows))
    .concat(getNewbornCTFSection2Rows_());

  sheet.clear();
  var range = sheet.getRange(1, 1, rows.length, rows[0].length);
  // Keep required as text "true"/"false" (Kobo), not Sheets boolean TRUE/FALSE
  range.setNumberFormat("@");
  range.setValues(rows);
}

/**
 * Intro + Section 1 / 1a (Mentor, session date, newborn program).
 * Columns: type, name, label, required, required_message,
 *          constraint_message, relevant, choice_filter, calculation
 */
function getNewbornCTFSurveyRows_() {
  return [
    [
      "begin_group",
      "introduction",
      "Introduction",
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
      "*The **Newborn Curriculum Tracking Form** is designed to track newborn mentorship activities conducted by in-facility mentors (IFMs). It captures essential details about mentees, the facilities where they are based, and the topics covered through each module. The information provided will help track mentee participation, monitor progress across facilities, and guide ongoing training and support.*",
      "false",
      "",
      "",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "demographic_information",
      "Section 1: Demographic Information",
      "false",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "details_note",
      "***Section Note:*** *This section captures key information about the mentees for accurate identification and follow-up. Please record the mentee’s full name (two names), select the county and facility where the mentee is based, and confirm the mentees who attended mentorship sessions. Ensure all details are filled in correctly to support monitoring and reporting.*",
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
      ""
    ],
    [
      "note",
      "mentor_details_notes",
      "***Enumerator Note:*** *This section captures details of the mentor conducting the mentorship session, the date the session took place, and the newborn program being delivered. Please record the mentor’s full name (first and second name), the session date, and select the appropriate newborn program. Ensure all information is entered accurately to support session tracking and reporting.*",
      "",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "text",
      "first_name",
      "1a. Please enter your first name.",
      "true",
      "Sorry, this answer is required",
      "",
      "",
      "",
      ""
    ],
    [
      "text",
      "second_name",
      "1b. Please enter your second name.",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "date",
      "session_date",
      "2. When was the mentorship session conducted?",
      "true",
      "",
      "Please enter today’s date! Only the current date is allowed.",
      "",
      "",
      ""
    ],
    [
      "select_one program",
      "program",
      "3. Please select the newborn program that the selected mentee(s) were trained in.",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", ""]
  ];
}

/**
 * Section 1b: county + facility selects (choice_filter by program).
 * Mentee select rows are appended from Survey Sheet (Newborn).
 */
function getNewbornCTFSection1bRows_() {
  var sectionRelevant =
    "${first_name}!='' and ${second_name}!='' and ${session_date}!='' and ${program}!=''";

  return [
    [
      "begin_group",
      "mentee_details",
      "Section 1b: Mentee Details",
      "false",
      "",
      "",
      sectionRelevant,
      "",
      ""
    ],
    [
      "note",
      "mentee_details_note",
      "***Enumerator Note:*** *This section captures the location and participating mentees for the mentorship session. Please select the county and facility where the session was conducted, then identify all mentees who participated from the selected facility. Ensure the correct facility is selected before marking mentee attendance to support accurate participation tracking and reporting.*",
      "",
      "",
      "",
      sectionRelevant,
      "",
      ""
    ],
    [
      "select_one county",
      "county",
      "4. Which county are you in?",
      "true",
      "Sorry, this answer is required",
      "",
      "",
      "",
      ""
    ],
    newbornFacilitySelectRow_("kakamega_facilities", "Kakamega"),
    newbornFacilitySelectRow_("makueni_facilities", "Makueni"),
    newbornFacilitySelectRow_("mombasa_facilities", "Mombasa"),
    newbornFacilitySelectRow_("muranga_facilities", "Muranga")
  ];
}

function newbornFacilitySelectRow_(listName, countyLabel) {
  return [
    "select_one " + listName,
    listName,
    "5. Which facility are you in?",
    "true",
    "Sorry, this answer is required",
    "",
    "${county} = '" + countyLabel + "'",
    "contains(allowed, ${program})",
    ""
  ];
}

/**
 * Section 1b body: pull type / name / label / required / relevant from
 * kobocreator's "Survey Sheet (Newborn)".
 * Converts select_one → select_multiple on import.
 */
function getNewbornCTFMenteeSurveyRows_(sourceSs) {
  var sourceSheet = sourceSs.getSheetByName("Survey Sheet (Newborn)");
  if (!sourceSheet) {
    throw new Error(
      "Sheet 'Survey Sheet (Newborn)' not found. " +
      "Run generateSurveySheetNewborn() or generateAllOutputs() first."
    );
  }

  var data = sourceSheet.getDataRange().getValues();
  if (!data || data.length < 2) return [];

  var header = data[0];
  var typeIndex = header.indexOf("type");
  var nameIndex = header.indexOf("name");
  var labelIndex = header.indexOf("label");
  var requiredIndex = header.indexOf("required");
  var relevantIndex = header.indexOf("relevant");

  if (
    typeIndex === -1 ||
    nameIndex === -1 ||
    labelIndex === -1 ||
    requiredIndex === -1 ||
    relevantIndex === -1
  ) {
    throw new Error(
      "Survey Sheet (Newborn) is missing required columns: " +
      "type, name, label, required, relevant"
    );
  }

  var rows = [];

  for (var i = 1; i < data.length; i++) {
    var type = convertNewbornCTFSelectOneToMultiple_(data[i][typeIndex]);
    var name = data[i][nameIndex];
    var label = data[i][labelIndex];
    var required = normalizeNewbornCTFRequired_(data[i][requiredIndex]);
    var relevant = data[i][relevantIndex];

    if (!type && !name) continue;

    // Map into survey columns:
    // type, name, label, required, required_message,
    // constraint_message, relevant, choice_filter, calculation
    rows.push([
      type || "",
      name || "",
      label || "",
      required,
      "",
      "",
      relevant || "",
      "",
      ""
    ]);
  }

  return rows;
}

function normalizeNewbornCTFRequired_(value) {
  var cleaned = String(value == null ? "" : value).trim().toLowerCase();
  if (cleaned === "true" || cleaned === "false") return cleaned;
  return cleaned;
}

/**
 * When importing Survey Sheet (Newborn), convert select_one → select_multiple
 * so mentees can be multi-selected for attendance.
 */
function convertNewbornCTFSelectOneToMultiple_(type) {
  if (type == null || type === "") return type;
  var raw = String(type);
  // Only replace the leading question type token
  return raw.replace(/^select_one\b/i, "select_multiple");
}

/**
 * After mentee selects: next_group_hide1 calculate, then close
 * mentee_details + demographic_information.
 * Calculation is built dynamically from imported mentee question names.
 */
function getNewbornCTFCloseSection1Rows_(menteeRows) {
  return [
    [
      "calculate",
      "next_group_hide1",
      "Next Group Hide 1",
      "true",
      "",
      "",
      "",
      "",
      buildNewbornCTFNextGroupHideCalc_(menteeRows)
    ],
    ["end_group", "", "", "", "", "", "", "", ""], // close mentee_details
    ["end_group", "", "", "", "", "", "", "", ""]  // close demographic_information
  ];
}

function buildNewbornCTFNextGroupHideCalc_(menteeRows) {
  var names = [];
  for (var i = 0; i < menteeRows.length; i++) {
    var name = menteeRows[i][1];
    if (name) names.push(String(name));
  }

  if (names.length === 0) return "''";

  var calc = "''";
  for (var j = names.length - 1; j >= 0; j--) {
    var n = names[j];
    calc = "if(${" + n + "} != '', ${" + n + "}, " + calc + ")";
  }
  return calc;
}

// =====================================================
// SECTION 2: Newborn Training Curriculum
// =====================================================
function getNewbornCTFSection2Rows_() {
  // Columns: type, name, label, required, required_message,
  //          constraint_message, relevant, choice_filter, calculation
  var activityFilter =
    "contains(allowed, ${program}) and contains(module_constraint, ${newborn_modules})";

  return [
    [
      "begin_group",
      "newborn_training_Curriculum",
      "Section 2: Newborn Training Curriculum",
      "false",
      "",
      "",
      "${next_group_hide1}!=''",
      "",
      ""
    ],
    [
      "note",
      "sec2_note",
      "***Section Note:*** *This section captures newborn curriculum training conducted for the selected mentee(s) during this mentorship session. Record all newborn modules covered and the specific learning activities completed. Only select items that were actually delivered during this session.*",
      "",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "begin_group",
      "newborn_modules_section",
      "Section 2 (a): Newborn Modules",
      "",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "modules_note",
      "***Enumerator note:*** *Select the newborn curriculum module covered during the session. Module selection determines the curriculum content delivered and guides the available training activities in subsequent sections.*",
      "",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one newborn_modules",
      "newborn_modules",
      "6. Please select the newborn module that the selected mentee(s) were trained in.",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "program_activities",
      "Section 2 (b): Newborn Curriculum Activities",
      "",
      "",
      "",
      "${newborn_modules}!=''",
      "",
      ""
    ],
    [
      "note",
      "activities_note",
      "***Enumerator note:*** *Select the training activities or sessions conducted for the selected module during this session. Only activities actually delivered to the selected mentee(s) should be recorded.*",
      "",
      "",
      "",
      "${newborn_modules}!=''",
      "",
      ""
    ],
    [
      "select_multiple newborn_activities",
      "newborn_activities",
      "7. Please select the newborn activities that the mentees were trained in.",
      "true",
      "",
      "",
      "",
      activityFilter,
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "newborn_cmes",
      "Section 2 (c): Newborn CME Lecturettes & Discussions",
      "",
      "",
      "",
      "selected(${newborn_activities}, 'cmes')",
      "",
      ""
    ],
    [
      "note",
      "cmes_note",
      "***Enumerator note:*** *Select the CME lecturette and discussion module completed by the selected mentee(s). Record only the CME topic that was conducted during this mentorship session.*",
      "",
      "",
      "",
      "selected(${newborn_activities}, 'cmes')",
      "",
      ""
    ],
    [
      "select_multiple cmes",
      "cmes",
      "8. Please select the CME lecture topic that the selected mentee(s) participated in.",
      "true",
      "",
      "",
      "selected(${newborn_activities}, 'cmes')",
      activityFilter,
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "newborn_videos",
      "Section 2 (d): Newborn Videos",
      "",
      "",
      "",
      "selected(${newborn_activities}, 'videos')",
      "",
      ""
    ],
    [
      "note",
      "videos_note",
      "***Enumerator note:*** *Select the video-based learning module viewed by the selected mentee(s) during this session. Only include videos that were fully or substantially delivered as part of the training.*",
      "",
      "",
      "",
      "selected(${newborn_activities}, 'videos')",
      "",
      ""
    ],
    [
      "select_multiple videos",
      "videos",
      "9. Please select the videos that the mentee(s) participated in.",
      "true",
      "",
      "",
      "selected(${newborn_activities}, 'videos')",
      activityFilter,
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "newborn_case_scenarios",
      "Section 2 (e): Case Scenarios",
      "",
      "",
      "",
      "selected(${newborn_activities}, 'case_scenarios')",
      "",
      ""
    ],
    [
      "note",
      "case_scenarios_note",
      "***Enumerator note:*** *Select the case scenario module(s) discussed or worked through by the selected mentee(s). Record only scenario-based learning activities completed during this session.*",
      "",
      "",
      "",
      "selected(${newborn_activities}, 'case_scenarios')",
      "",
      ""
    ],
    [
      "select_multiple case_scenarios",
      "case_scenarios",
      "10. Please select the case scenario that the mentee(s) participated in.",
      "true",
      "",
      "",
      "selected(${newborn_activities}, 'case_scenarios')",
      activityFilter,
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "newborn_role_plays",
      "Section 2 (f): Role Plays",
      "",
      "",
      "",
      "selected(${newborn_activities}, 'role_plays')",
      "",
      ""
    ],
    [
      "note",
      "role_plays_note",
      "***Enumerator note:*** *Select the role play module participated in by the selected mentee(s). Only include facilitated role-play exercises conducted during this session.*",
      "",
      "",
      "",
      "selected(${newborn_activities}, 'role_plays')",
      "",
      ""
    ],
    [
      "select_multiple role_plays",
      "role_plays",
      "11. Please select the role play that the mentee(s) participated in.",
      "true",
      "",
      "",
      "selected(${newborn_activities}, 'role_plays')",
      activityFilter,
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "newborn_skills_demonstrations",
      "Section 2 (g): Newborn Skill Demonstrations",
      "",
      "",
      "",
      "selected(${newborn_activities}, 'mentor_skills_demonstrations')",
      "",
      ""
    ],
    [
      "note",
      "skill_demo_note",
      "***Enumerator note:*** *Select the skill demonstration module demonstrated to the selected mentee(s). Record only practical demonstrations performed as part of the training session.*",
      "",
      "",
      "",
      "selected(${newborn_activities}, 'mentor_skills_demonstrations')",
      "",
      ""
    ],
    [
      "select_multiple skill_demonstrations",
      "mentor_demonstrations",
      "12. Please select the skill topic demonstrated to the selected mentees(s).",
      "true",
      "",
      "",
      "selected(${newborn_activities}, 'mentor_skills_demonstrations')",
      activityFilter,
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "newborn_practicum",
      "Section 2 (h): Newborn Practicum",
      "",
      "",
      "",
      "selected(${newborn_activities}, 'practicum')",
      "",
      ""
    ],
    [
      "note",
      "practicum_note",
      "***Enumerator note:*** *Select the practicum module session completed by the selected mentee(s). Only include supervised hands-on practice conducted during this session.*",
      "",
      "",
      "",
      "selected(${newborn_activities}, 'practicum')",
      "",
      ""
    ],
    [
      "select_multiple practicums",
      "practicum",
      "13. Please select the practicum topic session that the selected mentee(s) participated in.",
      "true",
      "",
      "",
      "selected(${newborn_activities}, 'practicum')",
      activityFilter,
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "newborn_drills",
      "Section 2 (i): Newborn Simulation Drills",
      "",
      "",
      "",
      "selected(${newborn_activities}, 'drills')",
      "",
      ""
    ],
    [
      "note",
      "drills_note",
      "***Enumerator note:*** *Select the simulation drill module completed by the selected mentee(s). Record only structured simulation exercises conducted during this session.*",
      "",
      "",
      "",
      "selected(${newborn_activities}, 'drills')",
      "",
      ""
    ],
    [
      "select_multiple drills",
      "drills",
      "14. Please select the simulation drill topic that the selected mentee(s) participated in.",
      "true",
      "",
      "",
      "selected(${newborn_activities}, 'drills')",
      activityFilter,
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "newborn_group_discussions",
      "Section 2 (j): Group Discussions",
      "",
      "",
      "",
      "selected(${newborn_activities}, 'group_discussions')",
      "",
      ""
    ],
    [
      "note",
      "discussions_note",
      "***Enumerator note:** Select the group discussion topic conducted during this session. Record only structured group discussions facilitated as part of the mentorship session.*",
      "",
      "",
      "",
      "selected(${newborn_activities}, 'group_discussions')",
      "",
      ""
    ],
    [
      "select_multiple group_discussions",
      "group_discussions",
      "15. Please select the group discussion topic that the selected mentee(s) participated in.",
      "true",
      "",
      "",
      "selected(${newborn_activities}, 'group_discussions')",
      activityFilter,
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", ""], // close newborn_group_discussions
    ["end_group", "", "", "", "", "", "", "", ""], // close newborn_training_Curriculum
    [
      "note",
      "thank_you",
      "*Thank you for completing this tool! The information recorded will be used to track mentorship activities, assess mentee progress, and strengthen newborn care practices across facilities. Please ensure all sections are accurately filled before submitting.*",
      "false",
      "",
      "",
      "(${next_group_hide1}!='' and ${program}!='' and ${newborn_modules}!='' and ${newborn_activities}!='') and (${cmes}!='' or ${videos}!='' or ${case_scenarios}!='' or ${role_plays}!='' or ${mentor_demonstrations}!='' or ${practicum}!='' or ${drills}!='' or ${group_discussions}!='')",
      "",
      ""
    ]
  ];
}

// =====================================================
// CHOICES
// =====================================================
function writeNewbornCTFChoices_(sheet, sourceSs) {
  var rows = [NEWBORN_CTF_CHOICES_HEADERS]
    .concat(getNewbornCTFProgramChoices_())
    .concat(getNewbornCTFCountyChoices_())
    .concat(getNewbornCTFFacilityChoices_(sourceSs))
    .concat(getNewbornCTFMenteeChoices_(sourceSs));

  // Later: modules will append here.

  sheet.clear();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}

/**
 * Newborn program options for select_one program.
 */
function getNewbornCTFProgramChoices_() {
  // list_name, name, label, allowed
  return [
    ["program", "essential_newborn_care", "Essential Newborn Care", ""],
    ["program", "comprehensive_newborn_care", "Comprehensive Newborn Care", ""]
  ];
}

function getNewbornCTFCountyChoices_() {
  // list_name, name, label, allowed
  return [
    ["county", "Kakamega", "Kakamega", ""],
    ["county", "Makueni", "Makueni", ""],
    ["county", "Mombasa", "Mombasa", ""],
    ["county", "Muranga", "Murang'a", ""]
  ];
}

/**
 * Facility choices from kobocreator sheet
 * "Newborn Facilities List (Choices)" → list_name, name, label, allowed
 */
function getNewbornCTFFacilityChoices_(sourceSs) {
  return getNewbornCTFChoicesFromSheet_(
    sourceSs,
    "Newborn Facilities List (Choices)",
    "generateNewbornAssessmentSheet()",
    true
  );
}

/**
 * Mentee choices from kobocreator sheet
 * "Newborn Mentees List (Choices)" → list_name, name, label
 */
function getNewbornCTFMenteeChoices_(sourceSs) {
  return getNewbornCTFChoicesFromSheet_(
    sourceSs,
    "Newborn Mentees List (Choices)",
    "generateNewbornChoicesSheet()",
    false
  );
}

/**
 * Generic pull of list_name / name / label [/ allowed] from a kobocreator choices sheet.
 */
function getNewbornCTFChoicesFromSheet_(
  sourceSs,
  sheetName,
  generatorHint,
  includeAllowed
) {
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
  var allowedIndex = header.indexOf("allowed");

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
    var allowed =
      includeAllowed && allowedIndex !== -1 ? data[i][allowedIndex] : "";

    if (!listName && !name) continue;

    rows.push([
      listName || "",
      name || "",
      label || "",
      allowed || ""
    ]);
  }

  return rows;
}

// =====================================================
// SETTINGS
// =====================================================
function writeNewbornCTFSettings_(sheet) {
  var rows = [
    NEWBORN_CTF_SETTINGS_HEADERS,
    ["yes"]
  ];
  sheet.clear();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}
