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
    .concat(getEmONCKASurveyStartRows_())
    .concat(getEmONCKAAssessmentRows_());

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

/**
 * Section 2: 24 EmONC knowledge questions + score + thank-you.
 * Columns: type, name, label, hint, required, constraint_message,
 *          constraint, relevant, required_message, calculation
 */
function getEmONCKAAssessmentRows_() {
  var sectionRelevant = "${next_group_hide1}!=''";

  var scoreCalc =
    "round(((" +
    "${amtsl_uterotonic_drug}='Correct') + " +
    "(${Augmentation_performed}='Correct') + " +
    "(${cephalic_presentation}='Correct') + " +
    "(${Obstracted_labor}='Correct') + " +
    "(${postpartum_hemorrhage}='Correct') + " +
    "(${pulsating_cord}='Correct') + " +
    "(${PPH_prevention}='Correct') + " +
    "(${vaginal_breech_maneuver}='Correct') + " +
    "(${Managing_shoulder_dystocia}='Correct') + " +
    "(${NASG_removal}='Correct') + " +
    "(${vacuum_cup_placement}='Correct') + " +
    "(${Correct_NNR_action}='Correct') + " +
    "(${cardiopulmonary_resuscitation}='Correct') + " +
    "(${Maternal_resuscitation}='Correct') + " +
    "(${Types_of_shock}='Correct') + " +
    "(${Preeclampsia_MgSO}='Correct') + " +
    "(${Magnesium_Sulfate_toxicity}='Correct') + " +
    "(${next_step_resuscitation}='Correct') + " +
    "(${antepartum_hemorrhage}='Correct') + " +
    "(${complication_shoulder_dystocia}='Correct') + " +
    "(${Cause_PPH}='Correct') + " +
    "(${vacuum_assisted_delivery}='Correct') + " +
    "(${Breech_delivery_duration}='Correct') + " +
    "(${refractory_PPH}='Correct')" +
    ") div 24,3)";

  return [
    [
      "begin_group",
      "introduction_001",
      "Section 2: EmONC Knowledge Assessment",
      "",
      "false",
      "",
      "",
      sectionRelevant,
      "",
      ""
    ],
    [
      "note",
      "introduction_note",
      "***Section Note:*** *This section assesses your knowledge of critical areas in Emergency Obstetric and Newborn Care (EmONC), including recognition of common complications, appropriate management steps, principles of respectful maternity care, infection prevention, neonatal resuscitation, and effective communication. Please read each question carefully and provide the most appropriate answer before submitting.*",
      "",
      "false",
      "",
      "",
      sectionRelevant,
      "",
      ""
    ],
    [
      "select_one amtsl_uterotonic_drug",
      "amtsl_uterotonic_drug",
      "1. You are assisting a mother during the third stage of labor. To prevent postpartum hemorrhage as part of Active Management of the Third Stage of Labour (AMTSL), you need to administer an appropriate uterotonic drug. Which of the following is recommended for administration during AMTSL?",
      "",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one Augmentation_performed",
      "Augmentation_performed",
      "2. Augmentation should be performed to ensure safe delivery of the fetus in a woman who is fully dilated, has a fetal heart rate of 140 beats per minute, a descent of ⅗, moulding graded as ++, and strong contractions.",
      "",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one cephalic_presentation",
      "cephalic_presentation",
      "3. A 25-year-old woman, Gravida 2 Para 1+0, presents to the labor ward at 39 weeks gestation with strong uterine contractions every 2–3 minutes. She reports her membranes ruptured 30 minutes ago at home and mentions feeling something unusual near her vaginal opening. On examination, the foetus is in cephalic presentation, the foetal heart rate is 90 bpm, and meconium-stained liquor is noted. What is the most likely diagnosis?",
      "",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one Obstracted_labor",
      "Obstracted_labor",
      "4. Naomi ,a 28-year-old woman in prolonged labor is suspected to have obstructed labor. During the abdominal examination, which finding is most likely to confirm the diagnosis?",
      "",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one postpartum_hemorrhage",
      "postpartum_hemorrhage",
      "5. A woman with postpartum hemorrhage has a soft, boggy uterus and no visible tears. For which cause of PPH is bimanual uterine compression most effective?",
      "",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one pulsating_cord",
      "pulsating_cord",
      "6. A 25-year-old woman at 38 weeks gestation presents in active labor with spontaneous rupture of membranes an hour ago. On examination, she's 6 cm dilated with a fetal heart rate is 80 bpm. A vaginal exam reveals a pulsating cord ahead of the presenting part. What is the most appropriate immediate action to manage this situation?",
      "",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one PPH_prevention",
      "PPH_prevention",
      "7. Nancy, a 22-year-old woman has just delivered a healthy baby via SVD. To prevent PPH, what actions should the midwife take as part of AMTSL?",
      "",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one vaginal_breech_maneuver",
      "vaginal_breech_maneuver",
      "8. During a vaginal breech delivery, the baby's body and shoulders are delivered, but the head remains in the birth canal. Which maneuver should the midwife use to deliver the head?",
      "",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one Managing_shoulder_dystocia",
      "Managing_shoulder_dystocia",
      "9. During delivery, the baby’s head delivers, but the anterior shoulder is stuck behind the symphysis pubis. What is the first step in managing shoulder dystocia?",
      "",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one NASG_removal",
      "NASG_removal",
      "10. A healthcare provider removes the NASG segment pair #1 and waits 15 minutes. She notes no significant change in vital signs. After opening segment pair #2, how long should she wait before proceeding to the next segment pair?",
      "",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one vacuum_cup_placement",
      "vacuum_cup_placement",
      "11. A 28-year-old woman in labor has been pushing for two hours without progress. The fetal head is at +2 station, and the obstetrician decides to perform a vacuum-assisted delivery. The midwife is assisting with positioning the vacuum cup. Where should the vacuum cup be placed to ensure proper application?",
      "",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one Correct_NNR_action",
      "Correct_NNR_action",
      "12. A newborn is not breathing adequately and has a heart rate of 50 bpm despite initial ventilation. The midwife begins chest compressions. What is the correct action during neonatal resuscitation?",
      "",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one cardiopulmonary_resuscitation",
      "cardiopulmonary_resuscitation",
      "13. During a shift in a maternity unit, a 30-year-old woman collapses in the labor ward. The midwife rushes to assess her condition. She is unresponsive, not breathing, and no pulse is detected on palpation. When should the midwife initiate cardiopulmonary resuscitation (CPR) in this patient?",
      "",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one Maternal_resuscitation",
      "Maternal_resuscitation",
      "14. A 32-year-old woman undergoing a caesarean section becomes unresponsive with no pulse or breathing. What is the correct compression-to-ventilation ratio for maternal resuscitation?",
      "",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one Types_of_shock",
      "Types_of_shock",
      "15. A postpartum woman presents with severe bleeding and signs of shock, including low blood pressure ,rapid pulse and cold clammy skin. Which types of shock are most common in obstetrical care?",
      "",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one Preeclampsia_MgSO",
      "Preeclampsia_MgSO",
      "16. A 36 year-old woman at 32 weeks gestation presents with pre-eclampsia with severe features. Blood pressure of 170/110 mmHg, severe headache, and blurred vision. The obstetrician orders administration of Magnesium Sulphate (MgSO₄) to prevent seizures. What is the correct loading dose for Magnesium Sulphate for this patient?",
      "",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one Magnesium_Sulfate_toxicity",
      "Magnesium_Sulfate_toxicity",
      "17. A 39-week pregnant woman in labour diagnosed with pre-eclampsia with severe features is receiving IV Magnesium Sulfate. Which of the following should the midwife look out for as the first sign of Magnesium Sulfate toxicity ?",
      "",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one next_step_resuscitation",
      "next_step_resuscitation",
      "18.A term newborn is being resuscitated. After one minute of chest compressions and ventilation, the heart rate improves to 80 bpm. What is the next step in resuscitation?",
      "",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one antepartum_hemorrhage",
      "antepartum_hemorrhage",
      "19. A patient presents to the hospital at 30 weeks with painful vaginal bleeding. You check the fetal heart rate and note fetal distress. You diagnose antepartum hemorrhage and call the on-call physician for review. Based on her current presentation, you suspect:",
      "",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one complication_shoulder_dystocia",
      "complication_shoulder_dystocia",
      "20. A term baby is delivered following a prolonged labor complicated by shoulder dystocia. The baby is assessed for potential complications resulting from the delivery. Which of the following is a potential neonatal complication of shoulder dystocia?",
      "",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one Cause_PPH",
      "Cause_PPH",
      "21. A 32-year-old woman develops postpartum hemorrhage (PPH) shortly after a vaginal delivery. The midwife evaluates the patient to determine the underlying cause. On examination, the uterus is boggy, the placenta is complete, there are no visible perineal tears, and clotting appears normal. Which of the 4 Ts (Tone, Trauma, Tissue, Thrombin) is the most likely cause of this patient's PPH?",
      "",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one vacuum_assisted_delivery",
      "vacuum_assisted_delivery",
      "22. Which of the following is an indication for vacuum-assisted delivery?",
      "",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one Breech_delivery_duration",
      "Breech_delivery_duration",
      "23. Breech delivery should be completed within 30 minutes after the buttocks are delivered to ensure a safe birth.",
      "",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "select_one refractory_PPH",
      "refractory_PPH",
      "24. A woman with postpartum hemorrhage continues to bleed despite uterotonics and uterine massage. The attending Doctor diagnoses the condition as refractory PPH which is defined as:",
      "",
      "true",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "calculate",
      "score",
      "Score",
      "",
      "false",
      "",
      "",
      "",
      "",
      scoreCalc
    ],
    ["end_group", "", "", "", "", "", "", "", "", ""],
    [
      "note",
      "thank_you",
      "*Thank you for participating in this survey! Your responses will be analized and used to strengthen the MENTORS program and improve the quality of maternal and newborn care.*",
      "",
      "false",
      "",
      "",
      "${refractory_PPH}!=''",
      "",
      ""
    ]
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
