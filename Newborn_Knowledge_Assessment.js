// =====================================================
// Newborn Knowledge Assessment Kobo Tool
// Builds a Kobo-ready Google Sheet (survey / choices / settings)
// from the shared kobocreator.js output workbook.
// =====================================================

var NEWBORN_KA_TITLE = "Newborn Knowledge Assessment";

// Script Properties keys
var NEWBORN_KA_PROP_FORM_ID = "NEWBORN_KA_SPREADSHEET_ID";

// Fill this sheet in to replace the questions written below.
// See Kobo_Question_Bank.js and KOBO_FORM_BUILDING_GUIDE.md.
var NEWBORN_KA_QUESTION_BANK_SHEET = "Newborn Question Bank";

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

  writeNewbornKASurvey_(surveySheet, sourceSs);
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
function writeNewbornKASurvey_(sheet, sourceSs) {
  var rows = [NEWBORN_KA_SURVEY_HEADERS]
    .concat(getNewbornKASurveyStartRows_())
    .concat(getNewbornKAAssessmentRows_(sourceSs));

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
function getNewbornKAAssessmentRows_(sourceSs) {
  var sectionRelevant = "${next_group_hide1}!=''";

  // This year's questions, when the question bank has been filled in.
  var bank = getNewbornKAQuestionBank_(sourceSs);
  if (bank.length) {
    return getNewbornKAAssessmentRowsFromBank_(bank, sectionRelevant);
  }

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

/** This year's questions, or [] while the sheet is missing or empty. */
function getNewbornKAQuestionBank_(sourceSs) {
  var ss = sourceSs || SpreadsheetApp.getActiveSpreadsheet();
  if (typeof readKoboQuestionBank_ !== "function") return [];
  return readKoboQuestionBank_(ss, NEWBORN_KA_QUESTION_BANK_SHEET);
}

/**
 * The assessment section built from the question bank. A score row is added
 * only when the bank marks correct answers, so filling in questions alone
 * keeps the form as it is today.
 */
function getNewbornKAAssessmentRowsFromBank_(questions, sectionRelevant) {
  var layout = { columns: NEWBORN_KA_SURVEY_HEADERS, relevant: sectionRelevant };
  var lastQuestion = questions[questions.length - 1].name;
  var scoreCalc = buildKoboQuestionScoreCalc_(questions, 3);

  Logger.log(
    "Newborn KA: built " + questions.length + " question(s) from '" +
    NEWBORN_KA_QUESTION_BANK_SHEET + "', " +
    countKoboScoredQuestions_(questions) + " of them scored."
  );

  var rows = [
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
      "*This section tests your understanding of key newborn care practices. Choose the most appropriate response before submitting.*",
      "",
      "false",
      "",
      "",
      sectionRelevant,
      ""
    ]
  ].concat(buildKoboQuestionSurveyRows_(questions, layout));

  if (scoreCalc) {
    rows.push(
      ["calculate", "score", "Score", "", "false", "", "", "", scoreCalc]
    );
  }

  return rows.concat([
    ["end_group", "", "", "", "", "", "", "", ""],
    [
      "note",
      "thank_you",
      "*Thank you for completing this knowledge assessment! Your feedback will help us tailor support and training to improve maternal and newborn health outcomes. Please click Submit to complete.*",
      "",
      "false",
      "",
      "",
      "${" + lastQuestion + "}!=''",
      ""
    ]
  ]);
}

// =====================================================
// CHOICES
// =====================================================
function writeNewbornKAChoices_(sheet, sourceSs) {
  var bank = getNewbornKAQuestionBank_(sourceSs);

  var rows = [NEWBORN_KA_CHOICES_HEADERS]
    .concat(getNewbornKACountyChoices_())
    .concat(getNewbornKAFacilityChoices_(sourceSs))
    .concat(
      bank.length
        ? buildKoboQuestionChoiceRows_(bank)
        : getNewbornKAQuestionChoices_()
    );

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

/**
 * Multiple-choice options for the 20 knowledge questions.
 * Columns: list_name, name, label
 */
function getNewbornKAQuestionChoices_() {
  return [
    ["initiating_breastfeeding", "a", "A. Breastfeeding should take place within the first 24 hours post birth"],
    ["initiating_breastfeeding", "b", "B. Breastfeeding should be delayed until the infant passes meconium"],
    ["initiating_breastfeeding", "c", "C. Breastfeeding should take place once the baby gives hunger signals"],
    ["initiating_breastfeeding", "Correct", "D. Breastfeeding should take place within an hour post birth"],

    ["neonatal_heatloss", "a", "A. Place the baby immediately under a radiant warmer"],
    ["neonatal_heatloss", "b", "B. Ensure no draughts from doors or windows in the delivery room"],
    ["neonatal_heatloss", "Correct", "C. Dry the newborn immediately after delivery"],
    ["neonatal_heatloss", "d", "D. Immediately take the infant's temperature"],

    ["hyperthermia_risk_factors", "a", "A. Increased risk of hypoglycaemia"],
    ["hyperthermia_risk_factors", "b", "B. Increased risk of respiratory distress"],
    ["hyperthermia_risk_factors", "c", "C. Increased risk of mortality"],
    ["hyperthermia_risk_factors", "Correct", "D. All of the above"],

    ["skin_to_skin", "a", "A. Clinically unstable babies should always be placed skin-to-skin"],
    ["skin_to_skin", "Correct", "B. Skin to skin promotes early breastfeeding and bonding"],
    ["skin_to_skin", "c", "C. There is a slight increased risk of infection"],
    ["skin_to_skin", "d", "D. If skin to skin lasts too long, a baby may develop hyperthermia"],

    ["golden_minute", "a", "A. The moment a new mother is allowed to latch her baby and initiate breastfeeding"],
    ["golden_minute", "b", "B. The minute after the neonate shows signs of life following resuscitation"],
    ["golden_minute", "c", "C. One whole minute of counting infant's first breath by the health provider"],
    ["golden_minute", "Correct", "D. The 1st 60 secs of a neonate's life"],

    ["mask_size", "Correct", "A. Size 0 - should cover the chin, mouth and nose of the infant"],
    ["mask_size", "b", "B. Size 1 - should cover the chin, mouth and nose of the infant"],
    ["mask_size", "c", "C. Size 2 - should cover the chin, mouth and nose of the infant"],
    ["mask_size", "d", "D. Appropriate size of mask depends on infant's face and size, but most often size 1"],

    ["sga_infant", "a", "A. Any infant weighing less than 1000g"],
    ["sga_infant", "b", "B. Any infant born prior to 37 weeks"],
    ["sga_infant", "Correct", "C. Any baby whose birth weight falls below the 10th percentile for that gestational age"],
    ["sga_infant", "d", "D. Any infant greater than 1499g and less than 2500g"],

    ["weight_gain", "a", "A. 5g/kg/day"],
    ["weight_gain", "Correct", "B. 15g/kg/day"],
    ["weight_gain", "c", "C. 10g/kg/day"],
    ["weight_gain", "d", "D. 20g/kg/day"],

    ["medication_seizure", "a", "A. Levetiracetam at 30mg/kg"],
    ["medication_seizure", "b", "B. Phenytoin15mg/kg IV"],
    ["medication_seizure", "c", "C. Phenytoin 20mg/kg IV"],
    ["medication_seizure", "Correct", "D. Phenobarbitone 20mg/kg IM"],

    ["hypoglycemia_prevention", "a", "A. Keep warm to prevent hypothermia"],
    ["hypoglycemia_prevention", "b", "B. Early initiation of breastfeeding"],
    ["hypoglycemia_prevention", "d", "C. Postpone infant bathing for at least 6 hours post birth"],
    ["hypoglycemia_prevention", "Correct", "D. All of the above"],

    ["cpap_contrandication", "Correct", "A. The infant is seizing"],
    ["cpap_contrandication", "b", "B. The infant weighs>1000g"],
    ["cpap_contrandication", "c", "C. The infant is hypoglycemic"],
    ["cpap_contrandication", "d", "D. O₂ saturation is <90%"],

    ["meconium_aspiration", "a", "A. Asphyxia, Pneumonia & Preterm birth"],
    ["meconium_aspiration", "b", "B. Pneumonia, Diarrhoea & HIV"],
    ["meconium_aspiration", "Correct", "C. Preterm birth, asphyxia & Infections"],
    ["meconium_aspiration", "d", "D. Infections, Diarrhoea & Pneumonia"],

    ["neonate_transfer", "a", "A. Preterm infants ALWAYS require referral to a NICU facility"],
    ["neonate_transfer", "b", "B. Infants being referred ALWAYS require IV dextrose infusion prior to transfer"],
    ["neonate_transfer", "c", "C. The ideal method of thermal care during transfer is plastic wrap"],
    ["neonate_transfer", "Correct", "D. There are high rates of hypothermia and oxygen deprivation upon arrival to receiving facilities"],

    ["nicu_admission", "a", "A. Normal weight for a term newborn"],
    ["nicu_admission", "Correct", "B. LBW"],
    ["nicu_admission", "C", "C. Very LBW"],
    ["nicu_admission", "d", "D. Above normal weight for male infants"],

    ["handling_sharps", "a", "A. All syringes should be recapped prior to being discarded in the sharps container"],
    ["handling_sharps", "b", "B. Most needles can be used more than once for cost effectiveness on the same patient"],
    ["handling_sharps", "Correct", "C. Sharps containers should be placed as close to the point of use as possible - ideally within arm’s reach"],
    ["handling_sharps", "d", "D. Sharps containers should have a fill line at 50% full"],

    ["nbu_hygiene", "a", "A. Clean windows, walls, lamps and chairs to prevent dust accumulation"],
    ["nbu_hygiene", "b", "B. Wiping of all equipment, cots and examination tables"],
    ["nbu_hygiene", "Correct", "C. Wet-mop floors with a disinfectant and detergent solution"],
    ["nbu_hygiene", "d", "D. Clean mattresses with disinfectant solution"],

    ["feeding_regimen", "a", "A. Keep newborn exclusively on IV fluids"],
    ["feeding_regimen", "b", "B. Start 10% dextrose IV at 60mls/kg/day +2ml/kg EBM (trophic feeds) 4 hourly"],
    ["feeding_regimen", "Correct", "C. Start 10% dextrose IV at 60mls/kg/day + 2ml/kg EBM (trophic feeds) 3 hourly"],
    ["feeding_regimen", "d", "D. Encourage breastfeeding on demand"],

    ["weight_monitoring", "a", "A. 10% dextrose has 50% more calories than expressed breast milk"],
    ["weight_monitoring", "Correct", "B. As babies lose weight in the first 1-2 weeks, intake should be calculated using birth weight until current weight exceeds birth weight"],
    ["weight_monitoring", "c_1", "C. Feeding in a stable neonate <1.5kg should be advanced as quickly as possible"],
    ["weight_monitoring", "d", "D. Aspiration in a neonate <1.5kg is uncommon"],

    ["cpr_ratio", "a", "A. 30 compressions to 2 breaths"],
    ["cpr_ratio", "c", "B. 15 compressions to 1 breaths"],
    ["cpr_ratio", "d", "C. 5 compressions against 1 breath"],
    ["cpr_ratio", "Correct", "D. 3 compressions and 1 breath"],

    ["starting_cpr", "a", "A. 30 beats per minute"],
    ["starting_cpr", "b", "B. 40 beats per minute"],
    ["starting_cpr", "Correct", "C. 60 beats per minute"],
    ["starting_cpr", "d", "D. 50 beats per minute"]
  ];
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
