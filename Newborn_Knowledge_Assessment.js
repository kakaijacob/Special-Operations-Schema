// =====================================================
// Newborn Knowledge Assessment Kobo Tool
// Builds a Kobo-ready Google Sheet (survey / choices / settings)
// from the shared kobocreator.js output workbook.
// =====================================================

var NEWBORN_KA_TITLE = "Newborn Knowledge Assessment";

// Script Properties keys
var NEWBORN_KA_PROP_FORM_ID = "NEWBORN_KA_SPREADSHEET_ID";

var NEWBORN_KA_SURVEY_HEADERS = [
  "type",
  "name",
  "label",
  "hint",
  "required",
  "constraint_message",
  "constraint",
  "relevant",
  "calculation"
];

var NEWBORN_KA_CHOICES_HEADERS = [
  "list_name",
  "name",
  "label"
];

var NEWBORN_KA_SETTINGS_HEADERS = [
  "allow_choice_duplicates"
];

/**
 * Create / update this form only.
 * Prefer the shared pipeline refreshAllKoboTools() from Kobo_Tools_Orchestrator.js
 * (sync → kobocreator → all registered forms). Menu/trigger live there.
 */
function createNewbornKnowledgeAssessment() {
  return upsertNewbornKnowledgeAssessment_(
    SpreadsheetApp.getActiveSpreadsheet()
  );
}

/**
 * Open the saved form spreadsheet (or create it), then overwrite
 * survey / choices / settings.
 */
function upsertNewbornKnowledgeAssessment_(sourceSs) {
  var props = PropertiesService.getScriptProperties();
  var formId = props.getProperty(NEWBORN_KA_PROP_FORM_ID);
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
    formSs = SpreadsheetApp.create(NEWBORN_KA_TITLE);
    props.setProperty(NEWBORN_KA_PROP_FORM_ID, formSs.getId());
    created = true;
  } else if (formSs.getName() !== NEWBORN_KA_TITLE) {
    formSs.rename(NEWBORN_KA_TITLE);
  }

  var surveySheet = getOrCreateNewbornKASheet_(formSs, "survey");
  var choicesSheet = getOrCreateNewbornKASheet_(formSs, "choices");
  var settingsSheet = getOrCreateNewbornKASheet_(formSs, "settings");

  removeExtraNewbornKASheets_(formSs, ["survey", "choices", "settings"]);

  writeNewbornKASurvey_(surveySheet);
  writeNewbornKAChoices_(choicesSheet, sourceSs);
  writeNewbornKASettings_(settingsSheet);

  formSs.setActiveSheet(surveySheet);

  Logger.log(
    (created ? "Created" : "Updated in place") + ": " + formSs.getUrl()
  );
  return formSs;
}

function getOrCreateNewbornKASheet_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function removeExtraNewbornKASheets_(ss, keepNames) {
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
function writeNewbornKASurvey_(sheet) {
  var rows = [NEWBORN_KA_SURVEY_HEADERS]
    .concat(getNewbornKASurveyStartRows_())
    .concat(getNewbornKAAssessmentRows_());

  sheet.clear();
  var range = sheet.getRange(1, 1, rows.length, rows[0].length);
  // Keep required as text "true"/"false" (Kobo), not Sheets boolean TRUE/FALSE
  range.setNumberFormat("@");
  range.setValues(rows);
}

/**
 * start/end + Introduction + Mentors Details (county/facility).
 * Columns: type, name, label, hint, required, constraint_message,
 *          constraint, relevant, calculation
 */
function getNewbornKASurveyStartRows_() {
  var nextGroupHideCalc =
    "if(${kakamega_facilities} != '', ${kakamega_facilities}, " +
    "if(${makueni_facilities} != '', ${makueni_facilities}, " +
    "if(${mombasa_facilities} != '', ${mombasa_facilities}, " +
    "if(${muranga_facilities} != '', ${muranga_facilities}, ''))))";

  return [
    ["start", "start", "", "", "", "", "", "", ""],
    ["end", "end", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "introduction",
      "Introduction",
      "",
      "false",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "welcome_note",
      "*Welcome to the **Newborn Knowledge Assessment**. This tool evaluates your knowledge on essential newborn care and emergency management practices. You will be asked 20 multiple-choice questions covering immediate newborn care, prevention of complications, neonatal resuscitation, care of small and vulnerable infants, safe referral, and facility-level protocols. Please select the single best answer for each question before submitting. Your responses will help guide mentorship, training, and support. Good luck!*",
      "",
      "false",
      "",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "mentors_details",
      "Mentors Details",
      "",
      "false",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "mentors_details_note",
      "*This section captures the basic details of the mentee for accurate identification and follow-up. Please provide your full name, confirm your phone number in the required format, and indicate the county you are reporting from. Ensure all details are entered correctly.*",
      "",
      "false",
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
      ".",
      "",
      "",
      ""
    ],
    [
      "integer",
      "mentee_id",
      "2a. Please enter your phone number.",
      "Please use the format 07XXXXXXXX or 01XXXXXXXX.",
      "true",
      "Please enter the phone number in the correct format! number",
      "regex(., '^[0-9]{9}$')",
      "",
      ""
    ],
    [
      "integer",
      "phone_confirm",
      "2b. Please confirm your phone number.",
      "Make sure it matches exactly what you entered in Question 1a above.",
      "true",
      "Does not match 2a above! Please check and try again.",
      ". = ${mentee_id}",
      "",
      ""
    ],
    [
      "select_one county",
      "county",
      "3. Select your county",
      "",
      "true",
      "",
      "",
      "",
      ""
    ],
    newbornKAFacilitySelectRow_("kakamega_facilities", "Kakamega"),
    newbornKAFacilitySelectRow_("makueni_facilities", "Makueni"),
    newbornKAFacilitySelectRow_("mombasa_facilities", "Mombasa"),
    newbornKAFacilitySelectRow_("muranga_facilities", "Muranga"),
    [
      "calculate",
      "next_group_hide1",
      "Next Group Hide 1",
      "",
      "true",
      "",
      "",
      "",
      nextGroupHideCalc
    ],
    ["end_group", "", "", "", "", "", "", "", ""]
  ];
}

function newbornKAFacilitySelectRow_(listName, countyLabel) {
  return [
    "select_one " + listName,
    listName,
    "4. Which facility are you in?",
    "",
    "true",
    "",
    "",
    "${county} = '" + countyLabel + "'",
    ""
  ];
}

/**
 * Newborn Knowledge Assessment questions + thank-you note.
 * Columns: type, name, label, hint, required, constraint_message,
 *          constraint, relevant, calculation
 */
function getNewbornKAAssessmentRows_() {
  var sectionRelevant = "${next_group_hide1}!=''";

  return [
    [
      "begin_group",
      "newborn_assessment",
      "Newborn Knowledge Assessment",
      "",
      "false",
      "",
      "",
      sectionRelevant,
      ""
    ],
    [
      "note",
      "note",
      "*This section tests your understanding of key newborn care practices, including breastfeeding initiation, thermoregulation, hypoglycemia prevention, resuscitation protocols, neonatal feeding regimens, infection prevention, and safe transfer procedures. Choose the most appropriate response before submitting.*",
      "",
      "false",
      "",
      "",
      sectionRelevant,
      ""
    ],
    ["select_one initiating_breastfeeding", "initiating_breastfeeding", "1. What is the recommendation regarding breastfeeding in a stable/term neonate?", "", "true", "", "", "", ""],
    ["select_one neonatal_heatloss", "neonatal_heatloss", "2. Evaporation is the main source of heat loss in a neonate. Which of the following should be routinely done to prevent evaporation?", "", "true", "", "", "", ""],
    ["select_one hyperthermia_risk_factors", "hyperthermia_risk_factors", "3. What are the risks associated with hypothermia in a neonate?", "", "true", "", "", "", ""],
    ["select_one skin_to_skin", "skin_to_skin", "4. Which of the following is true regarding skin to skin mother care?", "", "true", "", "", "", ""],
    ["select_one golden_minute", "golden_minute", "5. In neonatal resuscitation, the \"golden minute\" refers to:", "", "true", "", "", "", ""],
    ["select_one mask_size", "mask_size", "6. The most appropriate mask for a preterm newborn is:", "", "true", "", "", "", ""],
    ["select_one sga_infant", "sga_infant", "7. What is a small for gestational age (SGA) infant?", "", "true", "", "", "", ""],
    ["select_one weight_gain", "weight_gain", "8. What is the goal for weight gain in a small vulnerable infant?", "", "true", "", "", "", ""],
    ["select_one medication_seizure", "medication_seizure", "9. In a neonatal seizure, the first line pharmacological agent and dose is:", "", "true", "", "", "", ""],
    ["select_one hypoglycemia_prevention", "hypoglycemia_prevention", "10. Which of the following is a key intervention to prevent hypoglycemia in a neonate?", "", "true", "", "", "", ""],
    ["select_one cpap_contrandication", "cpap_contrandication", "11. In a neonate with respiratory distress, do NOT start CPAP if:", "", "true", "", "", "", ""],
    ["select_one meconium_aspiration", "causes_newborn_mortality", "12. The main causes of newborn mortality are:", "", "true", "", "", "", ""],
    ["select_one neonate_transfer", "neonate_transfer", "13. Which of the following is true regarding transfer of sick TERM neonates?", "", "true", "", "", "", ""],
    ["select_one nicu_admission", "birth_weight", "14. Baby Musa is born and weighs 2000 grams. Baby Musa is:", "", "true", "", "", "", ""],
    ["select_one handling_sharps", "handling_sharps", "15. Which of the following is true regarding proper handling of sharps?", "", "true", "", "", "", ""],
    ["select_one nbu_hygiene", "nbu_hygiene", "16. Which of the following cleaning practices should be performed DAILY in the NBU?", "", "true", "", "", "", ""],
    ["select_one feeding_regimen", "feeding_regimen", "17. Which of the following is the most appropriate feeding regimen for an 1800g unstable neonate who is one day old?", "", "true", "", "", "", ""],
    ["select_one weight_monitoring", "weight_monitoring", "18. Which of the following statements is true?", "", "true", "", "", "", ""],
    ["select_one cpr_ratio", "cpr_ratio", "19. What is the recommended compression-to-ventilation ratio during neonatal cardiopulmonary resuscitation (CPR)?", "", "true", "", "", "", ""],
    ["select_one starting_cpr", "starting_cpr", "20. When resuscitating a newborn, cardiac compressions should be started if the heart rate is less than how many beats per minute?", "", "true", "", "", "", ""],
    ["end_group", "", "", "", "", "", "", "", ""],
    [
      "note",
      "thank_you",
      "*Thank you for completing this knowledge assessment! Your feedback will help us tailor support and training to improve maternal and newborn health outcomes. Please click Submit to complete.*",
      "",
      "false",
      "",
      "",
      "${starting_cpr}!=''",
      ""
    ]
  ];
}

// =====================================================
// CHOICES
// =====================================================
function writeNewbornKAChoices_(sheet, sourceSs) {
  var rows = [NEWBORN_KA_CHOICES_HEADERS]
    .concat(getNewbornKACountyChoices_())
    .concat(getNewbornKAFacilityChoices_(sourceSs));

  sheet.clear();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}

/**
 * County options for select_one county.
 */
function getNewbornKACountyChoices_() {
  return [
    ["county", "Kakamega", "Kakamega"],
    ["county", "Makueni", "Makueni"],
    ["county", "Mombasa", "Mombasa"],
    ["county", "Muranga", "Muranga"]
  ];
}

/**
 * Facility choices from kobocreator
 * "Newborn Facilities List (Choices)" → list_name, name, label
 * Limited to Kakamega / Makueni / Mombasa / Muranga lists used in survey.
 */
function getNewbornKAFacilityChoices_(sourceSs) {
  var sourceSheet = sourceSs.getSheetByName("Newborn Facilities List (Choices)");
  if (!sourceSheet) {
    throw new Error(
      "Sheet 'Newborn Facilities List (Choices)' not found. " +
      "Run generateNewbornAssessmentSheet() or generateAllOutputs() first."
    );
  }

  var allowedLists = {
    kakamega_facilities: true,
    makueni_facilities: true,
    mombasa_facilities: true,
    muranga_facilities: true
  };

  var data = sourceSheet.getDataRange().getValues();
  if (!data || data.length < 2) return [];

  var header = data[0];
  var listNameIndex = header.indexOf("list_name");
  var nameIndex = header.indexOf("name");
  var labelIndex = header.indexOf("label");

  if (listNameIndex === -1 || nameIndex === -1 || labelIndex === -1) {
    throw new Error(
      "Newborn Facilities List (Choices) is missing required columns: " +
      "list_name, name, label"
    );
  }

  var rows = [];

  for (var i = 1; i < data.length; i++) {
    var listName = String(data[i][listNameIndex] || "").trim();
    var name = data[i][nameIndex];
    var label = data[i][labelIndex];

    if (!listName && !name) continue;
    if (!allowedLists[listName]) continue;

    rows.push([
      listName,
      name || "",
      label || ""
    ]);
  }

  return rows;
}

// =====================================================
// SETTINGS
// =====================================================
function writeNewbornKASettings_(sheet) {
  var rows = [
    NEWBORN_KA_SETTINGS_HEADERS,
    ["yes"]
  ];
  sheet.clear();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}
