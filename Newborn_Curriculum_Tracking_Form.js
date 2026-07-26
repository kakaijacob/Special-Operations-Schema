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
  "label"
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
  var rows = [NEWBORN_CTF_SURVEY_HEADERS]
    .concat(getNewbornCTFSurveyRows_());

  // Later sections (facility / mentee lists / curriculum) will append here.

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

// =====================================================
// CHOICES
// =====================================================
function writeNewbornCTFChoices_(sheet, sourceSs) {
  var rows = [NEWBORN_CTF_CHOICES_HEADERS]
    .concat(getNewbornCTFProgramChoices_());

  // Later: counties, facilities, mentees, modules will append here.

  sheet.clear();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}

/**
 * Newborn program options for select_one program.
 */
function getNewbornCTFProgramChoices_() {
  // list_name, name, label
  return [
    ["program", "essential_newborn_care", "Essential Newborn Care"],
    ["program", "comprehensive_newborn_care", "Comprehensive Newborn Care"]
  ];
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
