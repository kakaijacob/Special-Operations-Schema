// =====================================================
// EmONC Knowledge Assessment Kobo Tool
// Form title: MoH Mentee EmONC Knowledge Assessment
// Builds a Kobo-ready Google Sheet (survey / choices / settings)
// from the shared kobocreator.js output workbook.
// =====================================================

var EMONC_KA_TITLE = "MoH Mentee EmONC Knowledge Assessment";

// Script Properties keys
var EMONC_KA_PROP_FORM_ID = "EMONC_KA_SPREADSHEET_ID";

var EMONC_KA_SURVEY_HEADERS = [
  "type",
  "name",
  "label",
  "hint",
  "required",
  "constraint_message",
  "constraint",
  "relevant",
  "required_message",
  "calculation"
];

var EMONC_KA_CHOICES_HEADERS = [
  "list_name",
  "name",
  "label"
];

var EMONC_KA_SETTINGS_HEADERS = [
  "allow_choice_duplicates"
];

var EMONC_KA_FACILITY_LISTS = [
  ["busia_facilities", "Busia"],
  ["kakamega_facilities", "Kakamega"],
  ["kiambu_facilities", "Kiambu"],
  ["kilifi_facilities", "Kilifi"],
  ["kisii_facilities", "Kisii"],
  ["kirinyaga_facilities", "Kirinyaga"],
  ["machakos_facilities", "Machakos"],
  ["makueni_facilities", "Makueni"],
  ["meru_facilities", "Meru"],
  ["mombasa_facilities", "Mombasa"],
  ["muranga_facilities", "Muranga"],
  ["nairobi_facilities", "Nairobi"],
  ["nakuru_facilities", "Nakuru"],
  ["nyeri_facilities", "Nyeri"],
  ["siaya_facilities", "Siaya"]
];

/**
 * Create / update this form only.
 * Prefer the shared pipeline refreshAllKoboTools() from Kobo_Tools_Orchestrator.js
 * (sync → kobocreator → all registered forms). Menu/trigger live there.
 */
function createEmONCKnowledgeAssessment() {
  return upsertEmONCKnowledgeAssessment_(
    SpreadsheetApp.getActiveSpreadsheet()
  );
}

/**
 * Open the saved form spreadsheet (or create it), then overwrite
 * survey / choices / settings.
 */
function upsertEmONCKnowledgeAssessment_(sourceSs) {
  var props = PropertiesService.getScriptProperties();
  var formId = props.getProperty(EMONC_KA_PROP_FORM_ID);
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
    formSs = SpreadsheetApp.create(EMONC_KA_TITLE);
    props.setProperty(EMONC_KA_PROP_FORM_ID, formSs.getId());
    created = true;
  } else if (formSs.getName() !== EMONC_KA_TITLE) {
    formSs.rename(EMONC_KA_TITLE);
  }

  var surveySheet = getOrCreateEmONCKASheet_(formSs, "survey");
  var choicesSheet = getOrCreateEmONCKASheet_(formSs, "choices");
  var settingsSheet = getOrCreateEmONCKASheet_(formSs, "settings");

  removeExtraEmONCKASheets_(formSs, ["survey", "choices", "settings"]);

  writeEmONCKASurvey_(surveySheet);
  writeEmONCKAChoices_(choicesSheet, sourceSs);
  writeEmONCKASettings_(settingsSheet);

  formSs.setActiveSheet(surveySheet);

  Logger.log(
    (created ? "Created" : "Updated in place") + ": " + formSs.getUrl()
  );
  return formSs;
}

function getOrCreateEmONCKASheet_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function removeExtraEmONCKASheets_(ss, keepNames) {
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
function writeEmONCKASurvey_(sheet) {
  var rows = [EMONC_KA_SURVEY_HEADERS]
    .concat(getEmONCKASurveyStartRows_());

  sheet.clear();
  var range = sheet.getRange(1, 1, rows.length, rows[0].length);
  // Keep required as text "true"/"false" (Kobo), not Sheets boolean TRUE/FALSE
  range.setNumberFormat("@");
  range.setValues(rows);
}

/**
 * start/end + Introduction + Section 1 demographic / facilities.
 * Columns: type, name, label, hint, required, constraint_message,
 *          constraint, relevant, required_message, calculation
 */
function getEmONCKASurveyStartRows_() {
  var nextGroupHideCalc =
    "if(${busia_facilities} != '', ${busia_facilities}, " +
    "if(${kakamega_facilities} != '', ${kakamega_facilities}, " +
    "if(${kiambu_facilities} != '', ${kiambu_facilities}, " +
    "if(${kilifi_facilities} != '', ${kilifi_facilities}, " +
    "if(${kisii_facilities} != '', ${kisii_facilities}, " +
    "if(${kirinyaga_facilities} != '', ${kirinyaga_facilities}, " +
    "if(${machakos_facilities} != '', ${machakos_facilities}, " +
    "if(${makueni_facilities} != '', ${makueni_facilities}, " +
    "if(${meru_facilities} != '', ${meru_facilities}, " +
    "if(${mombasa_facilities} != '', ${mombasa_facilities}, " +
    "if(${muranga_facilities} != '', ${muranga_facilities}, " +
    "if(${nairobi_facilities} != '', ${nairobi_facilities}, " +
    "if(${nakuru_facilities} != '', ${nakuru_facilities}, " +
    "if(${siaya_facilities} != '', ${siaya_facilities}, " +
    "if(${nyeri_facilities} != '', ${nyeri_facilities}, '')))))))))))))))";

  var rows = [
    ["start", "start", "", "", "", "", "", "", "", ""],
    ["end", "end", "", "", "", "", "", "", "", ""],
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
      "Introductory_note",
      "*The **EmONC Knowledge Assessment** is a test that consists of 24 multiple-choice questions designed to assess your understanding of Emergency Obstetric and Newborn Care (EmONC). Please read each question carefully and select the most appropriate answer from the options provided. Before submitting the form, take a moment to review your answers to ensure accuracy. Good luck!*",
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
      "mentors_facilities",
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
      "note1",
      "***Section Note:*** *This section captures the basic details of the mentee for accurate identification and follow-up. Please provide your full name, confirm your phone number in the required format, and indicate the county you are reporting from. Ensure all details are entered correctly.*",
      "",
      "false",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "text",
      "first_name",
      "1a. What is your first name?",
      "",
      "true",
      "Please enter the correct phone number.",
      "",
      "",
      "",
      ""
    ],
    [
      "text",
      "last_name",
      "1b. What is your last name?",
      "",
      "true",
      "",
      ".",
      "",
      "",
      ""
    ],
    [
      "integer",
      "mentee_id",
      "2. Please enter your phone number",
      "Use the format: 07XXXXXXXX or 01XXXXXXXXX.",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "integer",
      "mentee_id_confirm",
      "3. Please confirm your phone number.",
      "Make sure it matches exactly what you entered in Question 2a above.",
      "true",
      "Phone number does not match! Please try again.",
      ". = ${mentee_id}",
      "",
      "",
      ""
    ],
    [
      "select_one county",
      "county",
      "4. What county are you reporting on?",
      "Select your county of operation.",
      "true",
      "",
      "",
      "${mentee_id_confirm}!=''",
      "",
      ""
    ]
  ];

  for (var i = 0; i < EMONC_KA_FACILITY_LISTS.length; i++) {
    rows.push(
      emoncKAFacilitySelectRow_(
        EMONC_KA_FACILITY_LISTS[i][0],
        EMONC_KA_FACILITY_LISTS[i][1]
      )
    );
  }

  rows.push([
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
  ]);
  rows.push(["end_group", "", "", "", "", "", "", "", "", ""]);

  return rows;
}

function emoncKAFacilitySelectRow_(listName, countyLabel) {
  return [
    "select_one " + listName,
    listName,
    "5. Which facility are you in?",
    "",
    "true",
    "",
    "",
    "${county}='" + countyLabel + "'",
    "",
    ""
  ];
}

// =====================================================
// CHOICES
// =====================================================
function writeEmONCKAChoices_(sheet, sourceSs) {
  var rows = [EMONC_KA_CHOICES_HEADERS]
    .concat(getEmONCKACountyChoices_())
    .concat(getEmONCKAFacilityChoices_(sourceSs));

  sheet.clear();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}

/**
 * County options for select_one county.
 */
function getEmONCKACountyChoices_() {
  return [
    ["county", "Busia", "Busia"],
    ["county", "Kakamega", "Kakamega"],
    ["county", "Kiambu", "Kiambu"],
    ["county", "Kilifi", "Kilifi"],
    ["county", "Kisii", "Kisii"],
    ["county", "Kirinyaga", "Kirinyaga"],
    ["county", "Machakos", "Machakos"],
    ["county", "Makueni", "Makueni"],
    ["county", "Meru", "Meru"],
    ["county", "Mombasa", "Mombasa"],
    ["county", "Muranga", "Muranga"],
    ["county", "Nairobi", "Nairobi"],
    ["county", "Nakuru", "Nakuru"],
    ["county", "Nyeri", "Nyeri"],
    ["county", "Siaya", "Siaya"]
  ];
}

/**
 * Facility choices from kobocreator
 * "EmONC Facilities List (Choices)" → list_name, name, label
 */
function getEmONCKAFacilityChoices_(sourceSs) {
  var sourceSheet = sourceSs.getSheetByName("EmONC Facilities List (Choices)");
  if (!sourceSheet) {
    throw new Error(
      "Sheet 'EmONC Facilities List (Choices)' not found. " +
      "Run generateEmONCFacilitiesChoicesSheet() or generateAllOutputs() first."
    );
  }

  var allowedLists = {};
  for (var a = 0; a < EMONC_KA_FACILITY_LISTS.length; a++) {
    allowedLists[EMONC_KA_FACILITY_LISTS[a][0]] = true;
  }

  var data = sourceSheet.getDataRange().getValues();
  if (!data || data.length < 2) return [];

  var header = data[0];
  var listNameIndex = header.indexOf("list_name");
  var nameIndex = header.indexOf("name");
  var labelIndex = header.indexOf("label");

  if (listNameIndex === -1 || nameIndex === -1 || labelIndex === -1) {
    throw new Error(
      "EmONC Facilities List (Choices) is missing required columns: " +
      "list_name, name, label"
    );
  }

  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var listName = data[i][listNameIndex];
    var name = data[i][nameIndex];
    var label = data[i][labelIndex];

    if (!listName || !name) continue;
    if (!allowedLists[String(listName)]) continue;

    rows.push([listName, name, label || ""]);
  }

  return rows;
}

// =====================================================
// SETTINGS
// =====================================================
function writeEmONCKASettings_(sheet) {
  sheet.clear();
  sheet
    .getRange(1, 1, 2, EMONC_KA_SETTINGS_HEADERS.length)
    .setValues([EMONC_KA_SETTINGS_HEADERS, ["Yes"]]);
}
