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
  "label",
  "allowed"
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
  var rows = [MOH_SAC_SURVEY_HEADERS]
    .concat(getMoHSACSurveyRows_())
    .concat(getMoHSACSection1bRows_())
    .concat(getMoHSACSection1cRows_(sourceSs));

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

/**
 * Section 1b: county + facility selects (choice_filter by program).
 * Columns: type, name, label, hint, required, required_message,
 *          constraint_message, relevant, choice_filter, calculation,
 *          constraint, appearance
 */
function getMoHSACSection1bRows_() {
  var sectionRelevant =
    "${mentor_name}!='' and ${evaluation_date}!='' and ${program}!=''";

  var nextGroupHideCalc =
    "if(${JHSL_facilities}!='',${JHSL_facilities}," +
    "if(${busia_facilities}!='',${busia_facilities}," +
    "if(${kakamega_facilities}!='',${kakamega_facilities}," +
    "if(${kiambu_facilities}!='',${kiambu_facilities}," +
    "if(${kirinyaga_facilities}!='',${kirinyaga_facilities}," +
    "if(${kilifi_facilities}!='',${kilifi_facilities}," +
    "if(${kisii_facilities}!='',${kisii_facilities}," +
    "if(${machakos_facilities}!='',${machakos_facilities}," +
    "if(${makueni_facilities}!='',${makueni_facilities}," +
    "if(${meru_facilities}!='',${meru_facilities}," +
    "if(${mombasa_facilities}!='',${mombasa_facilities}," +
    "if(${muranga_facilities}!='',${muranga_facilities}," +
    "if(${nairobi_facilities}!='',${nairobi_facilities}," +
    "if(${nakuru_facilities}!='',${nakuru_facilities}," +
    "if(${siaya_facilities}!='',${siaya_facilities}," +
    "if(${nyeri_facilities}!='',${nyeri_facilities},''))))))))))))))))";

  return [
    [
      "begin_group",
      "mentee_details",
      "Section 1b: Mentee Facility Details",
      "",
      "",
      "",
      "",
      sectionRelevant,
      "",
      "",
      "",
      ""
    ],
    [
      "select_one county",
      "county",
      "4. Select your county",
      "",
      "true",
      "",
      "",
      sectionRelevant,
      "contains(allowed, ${program})",
      "",
      "",
      ""
    ],
    mohSacFacilitySelectRow_("jhsl", "JHSL_facilities", "JHSL"),
    mohSacFacilitySelectRow_("busia_facilities", "busia_facilities", "Busia"),
    mohSacFacilitySelectRow_("kakamega_facilities", "kakamega_facilities", "Kakamega"),
    mohSacFacilitySelectRow_("kiambu_facilities", "kiambu_facilities", "Kiambu"),
    mohSacFacilitySelectRow_("kilifi_facilities", "kilifi_facilities", "Kilifi"),
    mohSacFacilitySelectRow_("kisii_facilities", "kisii_facilities", "Kisii"),
    mohSacFacilitySelectRow_("kirinyaga_facilities", "kirinyaga_facilities", "Kirinyaga"),
    mohSacFacilitySelectRow_("machakos_facilities", "machakos_facilities", "Machakos"),
    mohSacFacilitySelectRow_("makueni_facilities", "makueni_facilities", "Makueni"),
    mohSacFacilitySelectRow_("meru_facilities", "meru_facilities", "Meru"),
    mohSacFacilitySelectRow_("mombasa_facilities", "mombasa_facilities", "Mombasa"),
    mohSacFacilitySelectRow_("muranga_facilities", "muranga_facilities", "Muranga"),
    mohSacFacilitySelectRow_("nairobi_facilities", "nairobi_facilities", "Nairobi"),
    mohSacFacilitySelectRow_("nakuru_facilities", "nakuru_facilities", "Nakuru"),
    mohSacFacilitySelectRow_("nyeri_facilities", "nyeri_facilities", "Nyeri"),
    mohSacFacilitySelectRow_("siaya_facilities", "siaya_facilities", "Siaya"),
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
      nextGroupHideCalc,
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", "", "", ""] // close mentee_details
  ];
}

function mohSacFacilitySelectRow_(listName, fieldName, countyLabel) {
  return [
    "select_one " + listName,
    fieldName,
    "5. Which facility are you in?",
    "",
    "true",
    "",
    "",
    "${county} = '" + countyLabel + "'",
    "contains(allowed, ${program})",
    "",
    "",
    ""
  ];
}

/**
 * Section 1c: mentees / IFMs / POs.
 * Order: group open → IFM block (adjustment pending) →
 *        Newborn mentees → MENTORS/EmONC mentees from
 *        kobocreator "MoH Skills Assessment Checklist".
 * Group left open for later close rows.
 */
function getMoHSACSection1cRows_(sourceSs) {
  return [
    [
      "begin_group",
      "mentees",
      "Section 1c: List of Mentees, IFMs or POs",
      "",
      "false",
      "",
      "",
      "${next_group_hide1} != ''",
      "",
      "",
      "",
      ""
    ]
  ]
    // >>> IFM BLOCK START — ADJUSTMENT PENDING <<<
    .concat(getMoHSACIfmBlockRows_(sourceSs))
    // >>> IFM BLOCK END — ADJUSTMENT PENDING <<<
    .concat(getMoHSACNewbornMenteeSurveyRows_(sourceSs))
    .concat(getMoHSACMentorsMenteeSurveyRows_(sourceSs))
    .concat([
      ["end_group", "", "", "", "", "", "", "", "", "", "", ""], // close mentees
      ["end_group", "", "", "", "", "", "", "", "", "", "", ""]  // close group_mentorship_details
    ]);
}

// =====================================================
// IFM BLOCK — ADJUSTMENT PENDING
// Marked for later revision. Currently includes:
//   1) ToT free-text IFM fields (ifm_name / ifm_id / ifm_id_2)
//   2) lm_po (Lead Mentors & Program Officers)
//   3) IFM facility selects from "Survey Sheet (IFM)"
// Related choices: getMoHSACLmPoChoices_(), getMoHSACIfmChoices_()
// =====================================================

/**
 * Full IFM block (static ToT/lm_po + imported IFM selects).
 * ADJUSTMENT PENDING — do not rely on final shape yet.
 */
function getMoHSACIfmBlockRows_(sourceSs) {
  return getMoHSACIfmStaticRows_()
    .concat(getMoHSACIfmSurveyRows_(sourceSs));
}

/** ADJUSTMENT PENDING: ToT IFM text/phone fields + lm_po. */
function getMoHSACIfmStaticRows_() {
  return [
    [
      "text",
      "ifm_name",
      "6. Please record the first and last name of the IFM being trained.",
      "Enumerator Note: Record only the first and last names, in Title Case e.g Leonard Omusula",
      "true",
      "Enumerator Note: Record only the first and last names, in Title Case e.g Leonard Omusula",
      "",
      "${program}='tot'",
      "",
      "",
      "",
      ""
    ],
    [
      "integer",
      "ifm_id",
      "7a. Please enter the phone number of the IFM being trained.",
      "Please enter the phone number in this format: 07XXXXXXXX or 01XXXXXXXX.",
      "true",
      "Please enter the phone number in this format: 07XXXXXXXX or 01XXXXXXXX.",
      "Please enter a 10-digit phone number starting with 07 or 01.",
      "${program}='tot'",
      "",
      "",
      "regex(., '^[0-9]{9}$')",
      ""
    ],
    [
      "integer",
      "ifm_id_2",
      "7b. Please confirm the phone number of the IFM being trained.",
      "Ensure that this number matches the phone number entered above.",
      "true",
      "Ensure that this number matches the phone number entered above.",
      "The phone numbers do not match! Please check and try again.",
      "${program}='tot'",
      "",
      "",
      ". = ${ifm_id}",
      ""
    ],
    [
      "select_one lm_po",
      "lm_po",
      "Lead Mentors & Program Officers",
      "",
      "true",
      "",
      "",
      "${JHSL_facilities} = 'JHSL'",
      "contains(allowed, ${program})",
      "",
      "",
      ""
    ]
  ];
}

/**
 * ADJUSTMENT PENDING: IFM facility selects from "Survey Sheet (IFM)".
 * - Forces relevant to ifm_assessment only (ToT uses free-text fields above)
 * - Deduplicates colliding names as name_001, name_002, ...
 */
function getMoHSACIfmSurveyRows_(sourceSs) {
  var sourceSheet = sourceSs.getSheetByName("Survey Sheet (IFM)");
  if (!sourceSheet) {
    throw new Error(
      "Sheet 'Survey Sheet (IFM)' not found. " +
      "Run generateSurveySheetIFM() or generateAllOutputs() first."
    );
  }

  var data = sourceSheet.getDataRange().getValues();
  if (!data || data.length < 2) return [];

  var header = data[0];
  var typeIndex = header.indexOf("type");
  var nameIndex = header.indexOf("name");
  var labelIndex = header.indexOf("label");
  var requiredIndex = header.indexOf("required");
  var requiredMessageIndex = header.indexOf("required_message");
  var relevantIndex = header.indexOf("relevant");

  if (
    typeIndex === -1 ||
    nameIndex === -1 ||
    labelIndex === -1 ||
    requiredIndex === -1 ||
    relevantIndex === -1
  ) {
    throw new Error(
      "Survey Sheet (IFM) is missing required columns: " +
      "type, name, label, required, relevant"
    );
  }

  var rows = [];
  var nameCounts = {};

  for (var i = 1; i < data.length; i++) {
    var type = data[i][typeIndex];
    var baseName = data[i][nameIndex];
    var label = data[i][labelIndex];
    var required = normalizeMoHSACRequired_(data[i][requiredIndex]);
    var requiredMessage =
      requiredMessageIndex === -1 ? "" : (data[i][requiredMessageIndex] || "");
    var relevant = normalizeMoHSACIfmRelevant_(data[i][relevantIndex]);

    if (!type && !baseName) continue;

    var name = String(baseName || "");
    if (name) {
      if (nameCounts[name] === undefined) {
        nameCounts[name] = 0;
      } else {
        nameCounts[name] += 1;
        name = name + "_" + padMoHSACNumber_(nameCounts[name], 3);
      }
    }

    rows.push([
      type || "",
      name,
      label || "",
      "",
      required,
      requiredMessage || "",
      "",
      relevant || "",
      "",
      "",
      "",
      ""
    ]);
  }

  return rows;
}

function normalizeMoHSACRequired_(value) {
  // Always emit lowercase text "true"/"false" for Kobo (never Sheets boolean)
  if (value === true) return "true";
  if (value === false) return "false";
  var cleaned = String(value == null ? "" : value).trim().toLowerCase();
  if (cleaned === "true" || cleaned === "false") return cleaned;
  return cleaned;
}

/**
 * ADJUSTMENT PENDING helper for IFM relevant.
 * Keep facility equality from Survey Sheet (IFM), but show IFM selects
 * only for program = ifm_assessment.
 */
function normalizeMoHSACIfmRelevant_(relevant) {
  var raw = String(relevant == null ? "" : relevant);
  var match = raw.match(/(\$\{[^}]+_facilities\}\s*=\s*'[^']+')/);
  if (match) {
    return match[1] + " and ((${program} = 'ifm_assessment'))";
  }
  return raw;
}

function padMoHSACNumber_(num, width) {
  var s = String(num);
  while (s.length < width) s = "0" + s;
  return s;
}

/**
 * Newborn mentee selects from kobocreator "Survey Sheet (Newborn)".
 * Pulls type, name, label, required, relevant.
 * - required forced to text "true"/"false"
 * - select_one left as select_one (no conversion)
 */
function getMoHSACNewbornMenteeSurveyRows_(sourceSs) {
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
    var type = data[i][typeIndex];
    var name = data[i][nameIndex];
    var label = data[i][labelIndex];
    var required = normalizeMoHSACRequired_(data[i][requiredIndex]);
    var relevant = data[i][relevantIndex];

    if (!type && !name) continue;

    // Map into survey columns:
    // type, name, label, hint, required, required_message,
    // constraint_message, relevant, choice_filter, calculation,
    // constraint, appearance
    rows.push([
      type || "",
      name || "",
      label || "",
      "",
      required,
      "",
      "",
      relevant || "",
      "",
      "",
      "",
      ""
    ]);
  }

  return rows;
}

/**
 * MENTORS / EmONC mentee selects from kobocreator sheet
 * "MoH Skills Assessment Checklist".
 * Pulls type, name, label, relevant only.
 */
function getMoHSACMentorsMenteeSurveyRows_(sourceSs) {
  var sourceSheet = sourceSs.getSheetByName("MoH Skills Assessment Checklist");
  if (!sourceSheet) {
    throw new Error(
      "Sheet 'MoH Skills Assessment Checklist' not found. " +
      "Run generateMoHSkillsChecklist() or generateAllOutputs() first."
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
      "MoH Skills Assessment Checklist is missing required columns: " +
      "type, name, label, relevant"
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
    // constraint_message, relevant, choice_filter, calculation,
    // constraint, appearance
    rows.push([
      type || "",
      name || "",
      label || "",
      "",
      "",
      "",
      "",
      relevant || "",
      "",
      "",
      "",
      ""
    ]);
  }

  return rows;
}

// =====================================================
// CHOICES
// =====================================================
function writeMoHSACChoices_(sheet, sourceSs) {
  var facilityRows = getMoHSACFacilityChoices_(sourceSs);
  var rows = [MOH_SAC_CHOICES_HEADERS]
    .concat(getMoHSACProgramChoices_())
    .concat(getMoHSACCountyChoices_(facilityRows))
    .concat(facilityRows)
    // >>> IFM CHOICES START — ADJUSTMENT PENDING <<<
    .concat(getMoHSACLmPoChoices_())
    .concat(getMoHSACIfmChoices_(sourceSs))
    // >>> IFM CHOICES END — ADJUSTMENT PENDING <<<
    .concat(getMoHSACNewbornMenteeChoices_(sourceSs))
    .concat(getMoHSACMentorsMenteeChoices_(sourceSs));

  sheet.clear();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}

/**
 * Program options used by MoH Skills Assessment Checklist.
 */
function getMoHSACProgramChoices_() {
  return [
    ["program", "mentors_curriculum", "MENTORS Curriculum (EmONC)", ""],
    ["program", "newborn_curriculum", "Newborn Curriculum", ""],
    ["program", "ifm_assessment", "IFM Assessment", ""],
    ["program", "tot", "Training of Trainers (ToT)", ""]
  ];
}

/**
 * ADJUSTMENT PENDING: Lead Mentors & Program Officers choices (lm_po).
 * Populate when the source list is provided.
 */
function getMoHSACLmPoChoices_() {
  return [];
}

/**
 * ADJUSTMENT PENDING: IFM person choices from kobocreator "IFM List (Choices)".
 */
function getMoHSACIfmChoices_(sourceSs) {
  var sourceSheet = sourceSs.getSheetByName("IFM List (Choices)");
  if (!sourceSheet) {
    throw new Error(
      "Sheet 'IFM List (Choices)' not found. " +
      "Run generateIFMChoicesSheet() or generateAllOutputs() first."
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
      "IFM List (Choices) is missing required columns: list_name, name, label"
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
      label || "",
      ""
    ]);
  }

  return rows;
}

/**
 * Newborn mentee choices from kobocreator
 * "Newborn Mentees List (Choices)" → list_name, name, label.
 */
function getMoHSACNewbornMenteeChoices_(sourceSs) {
  return getMoHSACChoicesFromSheet_(
    sourceSs,
    "Newborn Mentees List (Choices)",
    "generateNewbornChoicesSheet()"
  );
}

/**
 * MENTORS / EmONC mentee choices from kobocreator
 * "EmONC Mentees List (Choices)" → list_name, name, label.
 */
function getMoHSACMentorsMenteeChoices_(sourceSs) {
  return getMoHSACChoicesFromSheet_(
    sourceSs,
    "EmONC Mentees List (Choices)",
    "generateChoicesSheet()"
  );
}

/**
 * Generic pull of list_name / name / label from a kobocreator choices sheet.
 */
function getMoHSACChoicesFromSheet_(sourceSs, sheetName, generatorHint) {
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
      label || "",
      ""
    ]);
  }

  return rows;
}

/**
 * County choices derived from All Facilities List (Choices).
 * allowed is the union of facility allowed values in that county
 * so contains(allowed, ${program}) works on the county select.
 */
function getMoHSACCountyChoices_(facilityRows) {
  var byCounty = {};

  for (var i = 0; i < facilityRows.length; i++) {
    var listName = String(facilityRows[i][0] || "");
    var allowed = String(facilityRows[i][3] || "");
    var countyName = countyNameFromMoHSACFacilityList_(listName);
    if (!countyName) continue;

    if (!byCounty[countyName]) {
      byCounty[countyName] = {
        name: countyName,
        label: countyLabelForMoHSAC_(countyName),
        allowedParts: {}
      };
    }

    var parts = allowed.split(",");
    for (var p = 0; p < parts.length; p++) {
      var part = String(parts[p] || "").trim();
      if (part) byCounty[countyName].allowedParts[part] = true;
    }
  }

  var order = [
    "JHSL",
    "Busia",
    "Kakamega",
    "Kiambu",
    "Kilifi",
    "Kisii",
    "Kirinyaga",
    "Machakos",
    "Makueni",
    "Meru",
    "Mombasa",
    "Muranga",
    "Nairobi",
    "Nakuru",
    "Nyeri",
    "Siaya"
  ];

  var rows = [];
  var seen = {};

  for (var o = 0; o < order.length; o++) {
    var key = order[o];
    if (!byCounty[key]) continue;
    seen[key] = true;
    rows.push([
      "county",
      byCounty[key].name,
      byCounty[key].label,
      Object.keys(byCounty[key].allowedParts).join(",")
    ]);
  }

  // Any unexpected counties from source, sorted
  var extras = Object.keys(byCounty).filter(function (k) {
    return !seen[k];
  }).sort();
  for (var e = 0; e < extras.length; e++) {
    var extra = byCounty[extras[e]];
    rows.push([
      "county",
      extra.name,
      extra.label,
      Object.keys(extra.allowedParts).join(",")
    ]);
  }

  return rows;
}

function countyNameFromMoHSACFacilityList_(listName) {
  var cleaned = String(listName || "").trim().toLowerCase();
  if (!cleaned) return "";

  // Survey uses select_one jhsl (not jhsl_facilities)
  if (cleaned === "jhsl" || cleaned === "jhsl_facilities") return "JHSL";

  if (cleaned.slice(-11) === "_facilities") {
    cleaned = cleaned.slice(0, -11);
  }

  var map = {
    busia: "Busia",
    kakamega: "Kakamega",
    kiambu: "Kiambu",
    kilifi: "Kilifi",
    kisii: "Kisii",
    kirinyaga: "Kirinyaga",
    machakos: "Machakos",
    makueni: "Makueni",
    meru: "Meru",
    mombasa: "Mombasa",
    muranga: "Muranga",
    nairobi: "Nairobi",
    nakuru: "Nakuru",
    nyeri: "Nyeri",
    siaya: "Siaya"
  };

  return map[cleaned] || "";
}

function countyLabelForMoHSAC_(countyName) {
  if (countyName === "Muranga") return "Murang'a";
  return countyName;
}

/**
 * Facility choices from kobocreator sheet
 * "All Facilities List (Choices)" → list_name, name, label, allowed
 * Remap jhsl_facilities → jhsl to match select_one jhsl.
 */
function getMoHSACFacilityChoices_(sourceSs) {
  var sourceSheet = sourceSs.getSheetByName("All Facilities List (Choices)");
  if (!sourceSheet) {
    throw new Error(
      "Sheet 'All Facilities List (Choices)' not found. " +
      "Run generateFacilitiesChoicesSheet() or generateAllOutputs() first."
    );
  }

  var data = sourceSheet.getDataRange().getValues();
  if (!data || data.length < 2) return [];

  var header = data[0];
  var listNameIndex = header.indexOf("list_name");
  var nameIndex = header.indexOf("name");
  var labelIndex = header.indexOf("label");
  var allowedIndex = header.indexOf("allowed");

  if (
    listNameIndex === -1 ||
    nameIndex === -1 ||
    labelIndex === -1 ||
    allowedIndex === -1
  ) {
    throw new Error(
      "All Facilities List (Choices) is missing required columns: " +
      "list_name, name, label, allowed"
    );
  }

  var rows = [];

  for (var i = 1; i < data.length; i++) {
    var listName = data[i][listNameIndex];
    var name = data[i][nameIndex];
    var label = data[i][labelIndex];
    var allowed = data[i][allowedIndex];

    if (!listName && !name) continue;

    var mappedListName = String(listName || "");
    if (mappedListName.toLowerCase() === "jhsl_facilities") {
      mappedListName = "jhsl";
    }

    rows.push([
      mappedListName,
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
function writeMoHSACSettings_(sheet) {
  var rows = [
    MOH_SAC_SETTINGS_HEADERS,
    ["yes"]
  ];
  sheet.clear();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}
