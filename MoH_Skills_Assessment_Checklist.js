// =====================================================
// MoH Skills Assessment Checklist
// Builds a Kobo-ready Google Sheet (survey / choices / settings)
// from the shared kobocreator.js output workbook.
// =====================================================

var MOH_SAC_TITLE = "MoH Skills Assessment Checklist";

// Script Properties keys
var MOH_SAC_PROP_FORM_ID = "MOH_SAC_SPREADSHEET_ID";

var MOH_SAC_SURVEY_HEADERS = [
  "type",
  "name",
  "label",
  "hint",
  "required",
  "required_message",
  "constraint_message",
  "relevant",
  "choice_filter",
  "calculation",
  "constraint",
  "appearance"
];

var MOH_SAC_CHOICES_HEADERS = [
  "list_name",
  "name",
  "label"
];

var MOH_SAC_SETTINGS_HEADERS = [
  "allow_choice_duplicates"
];

/**
 * Create / update this form only.
 * Prefer the shared pipeline refreshAllKoboTools() from Kobo_Tools_Orchestrator.js
 * (sync → kobocreator → all registered forms). Menu/trigger live there.
 */
function createMoHSkillsAssessmentChecklist() {
  return upsertMoHSkillsAssessmentChecklist_(
    SpreadsheetApp.getActiveSpreadsheet()
  );
}

/**
 * Open the saved form spreadsheet (or create it), then overwrite
 * survey / choices / settings.
 */
function upsertMoHSkillsAssessmentChecklist_(sourceSs) {
  var props = PropertiesService.getScriptProperties();
  var formId = props.getProperty(MOH_SAC_PROP_FORM_ID);
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
    formSs = SpreadsheetApp.create(MOH_SAC_TITLE);
    props.setProperty(MOH_SAC_PROP_FORM_ID, formSs.getId());
    created = true;
  } else if (formSs.getName() !== MOH_SAC_TITLE) {
    formSs.rename(MOH_SAC_TITLE);
  }

  var surveySheet = getOrCreateMoHSACSheet_(formSs, "survey");
  var choicesSheet = getOrCreateMoHSACSheet_(formSs, "choices");
  var settingsSheet = getOrCreateMoHSACSheet_(formSs, "settings");

  removeExtraMoHSACSheets_(formSs, ["survey", "choices", "settings"]);

  writeMoHSACSurvey_(surveySheet, sourceSs);
  writeMoHSACChoices_(choicesSheet, sourceSs);
  writeMoHSACSettings_(settingsSheet);

  formSs.setActiveSheet(surveySheet);

  Logger.log(
    (created ? "Created" : "Updated in place") + ": " + formSs.getUrl()
  );
  return formSs;
}

function getOrCreateMoHSACSheet_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function removeExtraMoHSACSheets_(ss, keepNames) {
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
function writeMoHSACSurvey_(sheet, sourceSs) {
  // sourceSs reserved for later dynamic mentee / facility rows
  var rows = [MOH_SAC_SURVEY_HEADERS]
    .concat(getMoHSACSurveyRows_());

  sheet.clear();
  var range = sheet.getRange(1, 1, rows.length, rows[0].length);
  // Keep required as text "true"/"false" (Kobo), not Sheets boolean TRUE/FALSE
  range.setNumberFormat("@");
  range.setValues(rows);
}

/**
 * Intro + Section 1 / 1a (mentor, evaluation date, program).
 * Columns: type, name, label, hint, required, required_message,
 *          constraint_message, relevant, choice_filter, calculation,
 *          constraint, appearance
 */
function getMoHSACSurveyRows_() {
  var introductionNote =
    "***The MoH Skills Assessment Checklist*** *is a structured tool designed to evaluate the practical competencies of healthcare providers in delivering essential maternal or newborn care services. It serves as a step-by-step guide for assessing specific Emergency Obstetric or Newborn Care (EmONC) skills. During each assessment session, the mentor will use this checklist to evaluate the mentee through the following process:*\n" +
    " \n" +
    "  *I. Present a relevant case scenario to simulate real-life practice.*\n" +
    " \n" +
    "  *II. Allow each mentee to participate in performing the skill.*\n" +
    " \n" +
    "  *III. Score the mentee's performance using the checklist.*\n" +
    " \n" +
    "  *IV. Share the completed checklist or score with the mentee for feedback.*\n" +
    " \n" +
    "  *V. To pass a skill assessment, the mentee must achieve a score of 85% or higher.*\n" +
    " \n" +
    "  *VI. The mentee should repeat the skill assessment until they achieve the required score **[≥85%].***\n" +
    "  *VII. Conduct a collective or individual debrief after the assessment to reinforce learning or clarify gaps.*\n" +
    " \n" +
    " *This checklist is intended to promote consistent, competency-based evaluation or ensure that all mentees demonstrate proficiency in critical EmONC skills before independent clinical application.*";

  return [
    ["start", "start", "", "", "", "", "", "", "", "", "", ""],
    ["end", "end", "", "", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "group_introduction",
      "Introduction",
      "",
      "false",
      "",
      "",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "note_introduction",
      introductionNote,
      "",
      "false",
      "",
      "",
      "",
      "",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "group_mentorship_details",
      "Section 1: Demographic Information",
      "",
      "false",
      "",
      "",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "note_section1",
      "***Section Note:*** *Please provide the following background information before beginning the skills assessment. These details will help identify who conducted the assessment, when or where it was carried out, or the specific program under review. Ensure all information is entered accurately before proceeding to the next section.*",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "begin_group",
      "mentor_details",
      "Section 1a: Mentor (IFM) or Session Details",
      "",
      "",
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
      "1. Please enter your first and last name.",
      "Enumerator note: Write your first and last name, e.g., Ragnar Lothbrok.",
      "true",
      "Sorry, this answer is required",
      "",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "date",
      "evaluation_date",
      "2. Record the date when the skill assessment was conducted.",
      "Enumerator note: Record the date when the skill assessment was conducted.",
      "true",
      "Sorry, this answer is required",
      "Date recorded must be today! This tool is to be filled in real-time.",
      "",
      "",
      "",
      ". = today()",
      ""
    ],
    [
      "select_one program",
      "program",
      "3. Please indicate the program you are currently assessing skills for.",
      "",
      "true",
      "Sorry, this answer is required",
      "",
      "",
      "",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", "", "", ""]
  ];
}

// =====================================================
// CHOICES
// =====================================================
function writeMoHSACChoices_(sheet, sourceSs) {
  // sourceSs reserved for later dynamic mentee / facility rows
  var rows = [MOH_SAC_CHOICES_HEADERS]
    .concat(getMoHSACProgramChoices_());

  sheet.clear();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}

/**
 * Program options aligned with kobocreator Skills Assessments logic:
 * mentors_curriculum / newborn_curriculum.
 */
function getMoHSACProgramChoices_() {
  return [
    ["program", "mentors_curriculum", "MENTORS Curriculum (EmONC)"],
    ["program", "newborn_curriculum", "Newborn Curriculum"]
  ];
}

// =====================================================
// SETTINGS
// =====================================================
function writeMoHSACSettings_(sheet) {
  var rows = [
    MOH_SAC_SETTINGS_HEADERS,
    ["yes"]
  ];
  sheet.clear();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}
