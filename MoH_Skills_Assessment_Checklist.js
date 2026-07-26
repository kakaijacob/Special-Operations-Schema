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
    .concat(getMoHSACSection1cRows_(sourceSs))
    .concat(getMoHSACSection2Rows_());

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
// SECTION 2: Skills Assessment
// =====================================================

/**
 * Section 2 opener + skill picker + UBT (Free Flow) checklist.
 * skills_assessment group left open for additional skill groups.
 */
function getMoHSACSection2Rows_() {
  var sectionRelevant =
    "${next_group_hide1} != '' or (${next_group_hide1} != '' and ${ifm_id_2}!='') or (${next_group_hide1} != '' and ${lm_po}!='')";

  var freeflowScoreCalc =
    "round(((" +
    "(${obtain_consent}='yes')+" +
    "(${sterile_gloves}='yes')+" +
    "(${assemble_ubt}='yes')+" +
    "(${hungon_drip_stor_valve_closed}='yes')+" +
    "(${lithotomy_position}='yes')+" +
    "(${clean_perinuem}='yes')+" +
    "(${catheterize}='yes')+" +
    "(${drape_patient}='yes')+" +
    "(${visualize_cervix_sims_speculum}='yes')+" +
    "(${stabilize_uterus}='yes')+" +
    "(${remove_speculum}='yes')+" +
    "(${insert_balloon}='yes')+" +
    "(${withdraw_forceps}='yes')+" +
    "(${prevent_expulsion_when_inflati}='yes')+" +
    "(${inflate_balloon}='yes')+" +
    "(${inflate_until_equilibrium}='yes')+" +
    "(${balloon_insitu_check_bleeding}='yes')+" +
    "(${determine_approp_bag_height}='yes')+" +
    "(${not_level_when_bleeding_stops}='yes')+" +
    "(${observe_patient}='yes')+" +
    "(${secure_tubing}='yes')+" +
    "(${antibiotics}='yes')+" +
    "(${documentation_time_level}='yes')+" +
    "(${continue_iv_fluids}='yes')+" +
    "(${vital_signs}='yes')+" +
    "(${when_to_remove}='yes')+" +
    "(${drain_balloon}='yes')+" +
    "(${remove_balloon_gently}='yes')+" +
    "(${post_removal_monitoring}='yes')+" +
    "(${activity_resumption}='yes')+" +
    "(${what_if_bleeing_resumes}='yes')+" +
    "(${referral}='yes')+" +
    "(${close_valve_in_transfer}='yes')+" +
    "(${Document}='yes')" +
    ")*100 div 34)";

  return [
    [
      "begin_group",
      "skills_assessment",
      "Section 2: Skills Assessment",
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
      "note",
      "section2_note",
      "***Section Note:*** *In this section, you will assess the participant’s practical competence in selected emergency obstetric, newborn, and intrapartum care skills using standardized case scenarios, mannequins, and structured checklists. Begin by selecting the skill being evaluated, then observe the participant as they demonstrate the procedure step by step while giving a clear running commentary. Tick each checklist item only if the participant correctly performs or clearly verbalizes the required action, paying close attention to clinical accuracy, infection prevention, respectful maternity care, communication, decision-making, and documentation. At the end of each assessment, an automatic score will be generated to determine competency, identify skill gaps, and guide targeted mentorship, coaching, remediation, and continuous quality improvement within the MENTORS program.*",
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
      "group_skills_checklist",
      "Section 2a: Skills Assessment Checklists",
      "",
      "true",
      "",
      "",
      sectionRelevant,
      "",
      "",
      "",
      ""
    ],
    [
      "select_one skill_evaluation",
      "skill_evaluation",
      "8. Please select the skill being evaluated.",
      "",
      "true",
      "",
      "",
      "",
      "contains(allowed, ${program})",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "group_ubt_free_flow",
      "Section 2b: UBT (Free Flow)",
      "",
      "true",
      "",
      "",
      "${skill_evaluation} = 'UBT_(free flow)'",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "scenario_ubt_freeflow",
      "***Case Scenario:*** *The final-year midwifery students were managing a case of PPH that required placement of the Free Flow System balloon tamponade. They were hesitant to perform the procedure. Demonstrate the procedure for Free Flow System intrauterine balloon tamponade insertion, explaining every step to the students.*",
      "",
      "false",
      "",
      "",
      "",
      "",
      "",
      "",
      ""
    ]
  ]
    .concat(getMoHSACUbtFreeflowChecklistRows_())
    .concat([
      [
        "calculate",
        "freeflow_score",
        "UBT (Free Flow) Score",
        "",
        "",
        "",
        "",
        "",
        "",
        freeflowScoreCalc,
        "",
        ""
      ],
      [
        "note",
        "freeflow_pass",
        "*Congratulations! Your score is **[${freeflow_score}%]**. You have fulfilled the requirements for this skill!*",
        "",
        "",
        "",
        "",
        "${freeflow_score} >= 84.5 and ${Document}!=''",
        "",
        "",
        "",
        ""
      ],
      [
        "note",
        "freeflow_fail",
        "*Sorry! Your score is **[${freeflow_score}%]**. Please review the relevant material or content, then try again.*",
        "",
        "",
        "",
        "",
        "${freeflow_score} < 84.5 and ${Document}!=''",
        "",
        "",
        "",
        ""
      ],
      ["end_group", "", "", "", "", "", "", "", "", "", "", ""] // close group_ubt_free_flow
    ])
    .concat(getMoHSACManualPlacentaRows_())
    .concat(getMoHSACUbtRows_())
    .concat(getMoHSACCordProlapseRows_())
    .concat(getMoHSACAssistedBreechRows_());
}

/**
 * Section 2b: Manual Removal of Placenta checklist + score.
 */
function getMoHSACManualPlacentaRows_() {
  var emptyBladderLabel =
    "7. Administer analgesics and antibiotics:\n" +
    "  • Give Diazepam 10 mg IM/IV (if woman is not in shock)\n" +
    "  • Give 2 g Ampicillin IV or 1 g Cefazolin IV or IV Ceftriaxone 2 g plus IV Metronidazole 500 mg";

  var scoreCalc =
    "round(((" +
    "(${shout_for_help1}='yes')+" +
    "(${obtain_consent_001}='yes')+" +
    "(${v_drape}='yes')+" +
    "(${insert_iv_lines}='yes')+" +
    "(${lithotomy_position_001}='yes')+" +
    "(${repeat_oxytocin}='yes')+" +
    "(${empty_bladder}='yes')+" +
    "(${analgesics_antibiotics}='yes')+" +
    "(${wear_gynecological_gloves}='yes')+" +
    "(${guide_hor_into_uterus}='yes')+" +
    "(${locate_placenta_edge}='yes')+" +
    "(${placenta_removal}='yes')+" +
    "(${cct}='yes')+" +
    "(${check_for_atony}='yes')+" +
    "(${placenta_examination}='yes')+" +
    "(${explore_for_fragments}='yes')+" +
    "(${remove_fragments}='yes')+" +
    "(${laceration_repair}='yes')+" +
    "(${oxytocin_20_iu}='yes')+" +
    "(${vital_signs_001}='yes')+" +
    "(${message_to_mother}='yes')+" +
    "(${other_managment}='yes')" +
    ")*100 div 22,0)";

  var items = [
    ["shout_for_help1", "shout_for_help1", "1. Shout for help."],
    ["obtain_consent", "obtain_consent_001", "2. Briefly explain the procedure to the mother depending on the client’s condition and obtain consent."],
    ["v_drape", "v_drape", "3. Place a blood loss measuring drape."],
    ["insert_iv_lines", "insert_iv_lines", "4. Insert large-bore IV lines."],
    ["lithotomy_position", "lithotomy_position_001", "5. Place patient in lithotomy position."],
    ["repeat_oxytocin", "repeat_oxytocin", "6. Insert a Foley’s catheter and empty bladder."],
    ["empty_bladder", "empty_bladder", emptyBladderLabel],
    ["analgesics_antibiotics", "analgesics_antibiotics", "8. Perform hand hygiene and wear PPE (personal protective equipment) and put on gynecological gloves."],
    ["wear_gynecological_gloves", "wear_gynecological_gloves", "9. Hold the umbilical cord with a clamp and gently pull, using the cord to guide your other hand into the uterus."],
    ["guide_hand_into_uterus", "guide_hor_into_uterus", "10. Place fingers of one hand into the uterus and follow the cord to locate the placenta and identify the edge of the placenta."],
    ["locate_placenta_edge", "locate_placenta_edge", "11. Identify the rough surface behind the placenta and carefully separate it from the uterine wall by smoothly sweeping fingers back and forth while stabilizing the uterine fundus with the other hand, using smooth lateral motion until the placenta separates from the uterine wall."],
    ["placenta_removal", "placenta_removal", "12. Withdraw the hand, bringing the placenta with it, and provide counter-traction abdominally."],
    ["cct", "cct", "13. Once the placenta is out, check uterine tone and massage if soft (after massage, say “uterus well contracted”)."],
    ["check_for_atony", "check_for_atony", "14. Examine the placenta for completeness."],
    ["placenta_examination", "placenta_examination", "15. Perform exploration for any fragments."],
    ["explore_for_fragments", "explore_for_fragments", "16. If fragments are present, remove by hand, ovum forceps, or wide curette."],
    ["remove_fragments", "remove_fragments", "17. Examine the cervix, vagina, and perineum for any tears and repair accordingly."],
    ["laceration_repair", "laceration_repair", "18. Give oxytocin 20 IU in 1 litre normal saline at 60 drops per minute."],
    ["oxytocin_20_iu", "oxytocin_20_iu", "19. Check vital signs every 15 minutes for the first 2 hours after the placenta is out and every 30 minutes for the next 6 hours."],
    ["vital_signs", "vital_signs_001", "20. Explain to the mother the results of the procedure."],
    ["message_to_mother", "message_to_mother", "21. If the placenta is still adherent despite manual attempt at removal, consider manual removal in theatre under anaesthesia, laparotomy, or subtotal hysterectomy in extreme cases."],
    ["other_managment", "other_managment", "22. Document on the blood loss monitoring chart."]
  ];

  var rows = [
    [
      "begin_group",
      "group_manual_placenta_removal",
      "Section 2b: Manual Removal of Placenta",
      "",
      "true",
      "",
      "",
      "${skill_evaluation} = 'Manual_removal_of_placenta'",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "case_scenario_manualplacenta",
      "***Case Scenario:*** *You are on duty and are informed that it has been one hour since the patient delivered, and the placenta has not been delivered. On further inquiry, the patient is para 2+0, all previous deliveries were SVDs. She is currently having minimal bleeding, with normal vital signs. The baby had a good Apgar score and is stable. Using the mannequin provided, describe step by step how you will perform manual removal of the placenta. Give a running commentary throughout the procedure.*",
      "",
      "false",
      "",
      "",
      "",
      "",
      "",
      "",
      ""
    ]
  ];

  for (var i = 0; i < items.length; i++) {
    rows.push(mohSacYesNoSelectRow_(items[i][0], items[i][1], items[i][2]));
  }

  rows.push(
    [
      "calculate",
      "manual_placenta_score",
      "Score",
      "",
      "",
      "",
      "",
      "",
      "",
      scoreCalc,
      "",
      ""
    ],
    [
      "note",
      "manual_placenta_pass",
      "*Congratulations! Your score is **[${manual_placenta_score}%]**. You have fulfilled the requirements for this skill!*",
      "",
      "",
      "",
      "",
      "${manual_placenta_score} >= 84.5 and ${other_managment}!=''",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "manual_placenta_fail",
      "*Sorry! Your score is **[${manual_placenta_score}%]**. Please review the relevant material or content, then try again.*",
      "",
      "",
      "",
      "",
      "${manual_placenta_score} < 84.5 and ${other_managment}!=''",
      "",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", "", "", ""]
  );

  return rows;
}

/**
 * Section 2b: UBT (standard) checklist + score.
 */
function getMoHSACUbtRows_() {
  var scoreCalc =
    "round(((" +
    "(${obtain_consent_002}='yes')+" +
    "(${sterile_gloves_001}='yes')+" +
    "(${balloon_over_catheter}='yes')+" +
    "(${tie_the_balloon}='yes')+" +
    "(${inflate_balloon_with_20cc}='yes')+" +
    "(${inflate_balloon_with_20cc_001}='yes')+" +
    "(${grasp_anterior_cervix}='yes')+" +
    "(${place_balloon_into_uterus}='yes')+" +
    "(${inflate_balloon_300ml_500ml}='yes')+" +
    "(${clamp_catheter}='yes')+" +
    "(${balloon_insitu_24hrs}='yes')+" +
    "(${oxytocin_20iu_in_ns}='yes')+" +
    "(${antibiotics_001}='yes')+" +
    "(${monitoring}='yes')+" +
    "(${deflate_50mls_q_hr}='yes')+" +
    "(${reinflate_50mls_bleeding_recur}='yes')+" +
    "(${surgical_intervention_bleeding}='yes')+" +
    "(${transfusion}='yes')+" +
    "(${message_to_mother_001}='yes')+" +
    "(${documentation}='yes')" +
    ")*100 div 20,0)";

  var items = [
    ["obtain_consent", "obtain_consent_002", "1. Briefly explain the procedure to the mother depending on the client’s condition and obtain consent."],
    ["sterile_gloves", "sterile_gloves_001", "2. Wear sterile gloves."],
    ["balloon_over_catheter", "balloon_over_catheter", "3. Place balloon (condom) over the end of Foley’s catheter and balloon the catheter."],
    ["tie_the_balloon", "tie_the_balloon", "4. Tie the lower end of the balloon tightly below the level of the balloon using suture/string. Tie tightly enough to prevent leakage of water but do not strangulate the catheter to prevent inflow of water into the balloon."],
    ["inflate_balloon_with_20cc", "inflate_balloon_with_20cc", "5. Inflate the urinary catheter balloon with about 20 cc of water."],
    ["inflate_balloon_with_20cc_001", "inflate_balloon_with_20cc_001", "6. Place the speculum into the vagina and identify the cervix."],
    ["grasp_anterior_cervix", "grasp_anterior_cervix", "7. Grasp the anterior aspect of the cervix with ovum forceps."],
    ["place_balloon_into_uterus", "place_balloon_into_uterus", "8. Aseptically place the end of the balloon high into the uterus with forceps and ensure the entire balloon is in position."],
    ["inflate_balloon_300ml_500ml", "inflate_balloon_300ml_500ml", "9. Connect Foley’s catheter to an IV set connected to an infusion set and inflate the balloon with 300–500 mL of saline until bleeding stops."],
    ["clamp_catheter", "clamp_catheter", "10. Clamp the catheter when the desired volume is achieved and bleeding is controlled."],
    ["balloon_insitu_24hrs", "balloon_insitu_24hrs", "11. The balloon is maintained in situ for 24 hours after bleeding is controlled and the patient is stable."],
    ["oxytocin_20iu_in_ns", "oxytocin_20iu_in_ns", "12. Give oxytocin 20 IU in 500 mL normal saline at 60 drops per minute."],
    ["antibiotics", "antibiotics_001", "13. Give broad-spectrum antibiotic cover."],
    ["monitoring", "monitoring", "14. Monitor vital signs, uterine tone, bleeding, and urinary output every 15 minutes for the first 2 hours, then every 30 minutes until 6 hours postpartum."],
    ["deflate_50mls_q_hr", "deflate_50mls_q_hr", "15. When the patient is stable (after 24 hours), slowly deflate the balloon by letting out 50 mL of water/saline every hour."],
    ["reinflate_50mls_bleeding_recur", "reinflate_50mls_bleeding_recur", "16. Re-inflate with 50 mL to the previous level if bleeding recurs."],
    ["surgical_intervention_bleeding", "surgical_intervention_bleeding", "17. If bleeding is not controlled within 15 minutes or if the mother is hemodynamically unstable, abandon the procedure and seek surgical intervention immediately."],
    ["transfusion", "transfusion", "18. Transfuse as indicated."],
    ["message_to_mother", "message_to_mother_001", "19. Explain the results of the procedure to the mother."],
    ["documentation", "documentation", "20. Documentation."]
  ];

  var rows = [
    [
      "begin_group",
      "group_UBT",
      "Section 2b: UBT",
      "",
      "true",
      "",
      "",
      "${skill_evaluation} = 'UBT'",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "case_scenario_ubt",
      "***Case Scenario:*** *The final-year midwifery students were managing a case of PPH that required placement of a balloon tamponade. They were hesitant to perform the procedure. Demonstrate the procedure to the students for intrauterine balloon tamponade insertion, explaining every step to the students.*",
      "",
      "false",
      "",
      "",
      "",
      "",
      "",
      "",
      ""
    ]
  ];

  for (var i = 0; i < items.length; i++) {
    rows.push(mohSacYesNoSelectRow_(items[i][0], items[i][1], items[i][2]));
  }

  rows.push(
    [
      "calculate",
      "ubt_score",
      "Score",
      "",
      "",
      "",
      "",
      "",
      "",
      scoreCalc,
      "",
      ""
    ],
    [
      "note",
      "ubt_pass",
      "*Congratulations! Your score is **[${ubt_score}%]**. You have fulfilled the requirements for this skill!*",
      "",
      "",
      "",
      "",
      "${ubt_score} >= 84.5 and ${documentation}!=''",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "ubt_fail",
      "*Sorry! Your score is **[${ubt_score}%]**. Please review the relevant material or content, then try again.*",
      "",
      "",
      "",
      "",
      "${ubt_score} < 84.5 and ${documentation}!=''",
      "",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", "", "", ""]
  );

  return rows;
}

/**
 * Section 2b: Management of Cord Prolapse checklist + score.
 */
function getMoHSACCordProlapseRows_() {
  var tocolyticsLabel =
    "12. Give tocolytics (Nifedipine, MgSO4).\n" +
    "  • Patient to be transported in knee-elbow or knee-chest position.\n" +
    "  • Catheter to be deflated before the caesarean section.";

  var expeditingLabel =
    "14. Expedite delivery with vacuum extraction.\n" +
    "  • If the baby is breech, perform breech extraction.";

  var scoreCalc =
    "round(((" +
    "(${shout_for_help_001}='yes')+" +
    "(${obtain_consent_003}='yes')+" +
    "(${vaginal_exam}='yes')+" +
    "(${confirm_diagnosis}='yes')+" +
    "(${confirms_cord_pulsation}='yes')+" +
    "(${patient_position}='yes')+" +
    "(${manual_cord_decompression}='yes')+" +
    "(${consent_prep_emergency_cs}='yes')+" +
    "(${patient_transfer_position}='yes')+" +
    "(${hor_removal}='yes')+" +
    "(${bladder_filling}='yes')+" +
    "(${tocolytics}='yes')+" +
    "(${when_cord_not_pulsating}='yes')+" +
    "(${expediting_delivery}='yes')+" +
    "(${prepare_to_resuscitate}='yes')" +
    ")*100 div 15,0)";

  var items = [
    ["shout_for_help", "shout_for_help_001", "1. Shouts for help."],
    ["obtain_consent", "obtain_consent_003", "2. Briefly explains to the mother the diagnosis and the procedure and obtain informed consent."],
    ["vaginal_exam", "vaginal_exam", "3. Gently performs a sterile vaginal examination."],
    ["confirm_diagnosis", "confirm_diagnosis", "4. Confirms diagnosis of cord prolapse, cervical dilation at 6 cm, cephalic presentation in longitudinal lie."],
    ["confirms_cord_pulsation", "confirms_cord_pulsation", "5. Confirms that the cord is pulsating."],
    ["patient_position", "patient_position", "6. Positions the patient in knee-elbow, exaggerated Sims, or knee-chest position on a stretcher."],
    ["manual_cord_decompression", "manual_cord_decompression", "7. Repeats a vaginal examination, manually displaces the presenting part from the pelvis, and does not remove the hand."],
    ["consent_prep_emergency_cs", "consent_prep_emergency_cs", "8. Obtain consent and prepare for emergency caesarean section."],
    ["patient_transfer_position", "patient_transfer_position", "9. Patient is taken to theatre in knee-elbow or knee-chest position, with the presenting part manually displaced from the pelvis, or in exaggerated Sims position."],
    ["hand_removal", "hor_removal", "10. Remove hand from the vagina when the patient is ready for caesarean section."],
    ["bladder_filling", "bladder_filling", "11. Fill the bladder with 500 mL normal saline and clamp the catheter after displacing the presenting part."],
    ["tocolytics", "tocolytics", tocolyticsLabel],
    ["when_cord_not_pulsating", "when_cord_not_pulsating", "13. If the cord is not pulsating, the fetus may be dead. Deliver in the manner safest for the mother (it is no longer an emergency)."],
    ["expediting_delivery", "expediting_delivery", expeditingLabel],
    ["prepare_to_resuscitate", "prepare_to_resuscitate", "15. Prepare to resuscitate the newborn."]
  ];

  var rows = [
    [
      "begin_group",
      "group_cord_prolapse",
      "Section 2b: Management of Cord Prolapse",
      "",
      "true",
      "",
      "",
      "${skill_evaluation} = 'Cord_prolapse'",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "case_scenario_cordprolapse",
      "***Case Scenario:*** *You are a healthcare provider working in a health facility when a pregnant mother comes in. On vaginal examination, you discover cord prolapse at 6 cm cervical dilatation, with a pulsating cord. Conduct the management using the mannequin provided. Give a running commentary.*",
      "",
      "false",
      "",
      "",
      "",
      "",
      "",
      "",
      ""
    ]
  ];

  for (var i = 0; i < items.length; i++) {
    var required = items[i][1] === "expediting_delivery" ? "false" : "true";
    rows.push([
      "select_one " + items[i][0],
      items[i][1],
      items[i][2],
      "",
      required,
      "",
      "",
      "",
      "",
      "",
      "",
      ""
    ]);
  }

  rows.push(
    [
      "calculate",
      "cord_prolapse_score",
      "Score",
      "",
      "",
      "",
      "",
      "",
      "",
      scoreCalc,
      "",
      ""
    ],
    [
      "note",
      "cord_prolapse_pass",
      "*Congratulations! Your score is **[${cord_prolapse_score}%]**. You have fulfilled the requirements for this skill!*",
      "",
      "",
      "",
      "",
      "${cord_prolapse_score} >= 84.5 and ${prepare_to_resuscitate}!=''",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "cord_prolapse_fail",
      "*Sorry! Your score is **[${cord_prolapse_score}%]**. Please review the relevant material or content, then try again.*",
      "",
      "",
      "",
      "",
      "${cord_prolapse_score} < 84.5 and ${prepare_to_resuscitate}!=''",
      "",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", "", "", ""]
  );

  return rows;
}

/**
 * Section 2b: Assisted Breech Delivery checklist + score.
 */
function getMoHSACAssistedBreechRows_() {
  var scoreCalc =
    "round(((" +
    "(${confirm_diagnosis_001}='yes')+" +
    "(${obtain_consent_004}='yes')+" +
    "(${call_for_help}='yes')+" +
    "(${empty_bladder_001}='yes')+" +
    "(${consider_episiotomy}='yes')+" +
    "(${hands_off_breech}='yes')+" +
    "(${pinard_manuever}='yes')+" +
    "(${grip_pelvis_bone}='yes')+" +
    "(${lovset_maneuver}='yes')+" +
    "(${maurecieu_smellie_veit_maneuve}='yes')+" +
    "(${amtsl}='yes')+" +
    "(${message_to_mother_002}='yes')+" +
    "(${documentation_001}='yes')" +
    ")*100 div 13,0)";

  var items = [
    ["confirm_diagnosis", "confirm_diagnosis_001", "1. Confirm diagnosis both abdominally and vaginally and rule out any contraindications."],
    ["obtain_consent", "obtain_consent_004", "2. Explain the diagnosis, procedure, and risks, and obtain consent."],
    ["call_for_help", "call_for_help", "3. Calls for help."],
    ["empty_bladder", "empty_bladder_001", "4. Empty bladder."],
    ["consider_episiotomy", "consider_episiotomy", "5. Consider episiotomy if necessary."],
    ["hands_off_breech", "hands_off_breech", "6. Employ “hands-off breech”."],
    ["pinard_manuever", "pinard_manuever", "7. If legs do not deliver, deliver one at a time using Pinard manoeuvre."],
    ["grip_pelvis_bone", "grip_pelvis_bone", "8. Wrap up the body with a towel to allow support and grip at the pelvic bone and keep encouraging the mother to push."],
    ["lovset_maneuver", "lovset_maneuver", "9. If arms do not deliver spontaneously, use Lovset’s manoeuvre to deliver."],
    ["maurecieu_smellie_veit_maneuve", "maurecieu_smellie_veit_maneuve", "10. Deliver the head using Mauriceau-Smellie-Veit manoeuvre."],
    ["amtsl", "amtsl", "11. Initiate active management of third stage of labour."],
    ["message_to_mother", "message_to_mother_002", "12. Explain the results to the mother."],
    ["documentation", "documentation_001", "13. Documentation."]
  ];

  var rows = [
    [
      "begin_group",
      "group_assisted_breech",
      "Section 2b: Assisted Breech Delivery",
      "",
      "true",
      "",
      "",
      "${skill_evaluation} = 'Assisted_breech_delivery'",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "case_scenario_breech",
      "***Case scenario:*** *Agnes, a para 2+0, gravida 3, comes to your maternity unit at full dilatation with a breech presentation. Using the mannequins provided, demonstrate, with a running commentary, how to conduct an assisted vaginal breech delivery.*",
      "",
      "false",
      "",
      "",
      "",
      "",
      "",
      "",
      ""
    ]
  ];

  for (var i = 0; i < items.length; i++) {
    rows.push(mohSacYesNoSelectRow_(items[i][0], items[i][1], items[i][2]));
  }

  rows.push(
    [
      "calculate",
      "breech_score",
      "Score",
      "",
      "",
      "",
      "",
      "",
      "",
      scoreCalc,
      "",
      ""
    ],
    [
      "note",
      "breech_pass",
      "*Congratulations! Your score is **[${breech_score}%]**. You have fulfilled the requirements for this skill!*",
      "",
      "",
      "",
      "",
      "${breech_score} >= 84.5 and ${documentation_001}!=''",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "breech_fail",
      "*Sorry! Your score is **[${breech_score}%]**. Please review the relevant material or content, then try again.*",
      "",
      "",
      "",
      "",
      "${breech_score} < 84.5 and ${documentation_001}!=''",
      "",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", "", "", ""]
  );

  return rows;
}

function getMoHSACUbtFreeflowChecklistRows_() {
  var items = [
    ["obtain_consent", "obtain_consent", "1. Briefly explain the procedure to the mother depending on the client's condition and obtain consent."],
    ["sterile_gloves", "sterile_gloves", "2. Wear sterile gloves."],
    ["assemble_ubt", "assemble_ubt", "3. Assemble the Free Flow System (FFS) UBT by filling the supply bag manually or using the spike with a litre of sterile water or normal saline."],
    ["hungon_drip_stand_valve_closed", "hungon_drip_stor_valve_closed", "4. Hang the supply bag on a drip stand with the T-valve closed."],
    ["lithotomy_position", "lithotomy_position", "5. Position the patient in the dorsal or lithotomy position."],
    ["clean_perinuem", "clean_perinuem", "6. Clean the vulva and perineum with antiseptic solution."],
    ["catheterize", "catheterize", "7. Catheterize the mother and ensure that the bladder is empty, leaving the catheter in situ for monitoring urine output."],
    ["drape_patient", "drape_patient", "8. Drape the patient using sterile drapes."],
    ["visualize_cervix_sims_speculum", "visualize_cervix_sims_speculum", "9. Introduce the Sim’s speculum to visualize the cervix."],
    ["stabilize_uterus", "stabilize_uterus", "10. Apply 2 sponge-holding or Kelly’s forceps to the anterior lip of the cervix to stabilize the uterus by applying gentle traction."],
    ["remove_speculum", "remove_speculum", "11. Remove the Sim’s speculum."],
    ["insert_balloon", "insert_balloon", "12. Introduce the balloon unit into the uterus by holding it in the palm of the inserting hand, with the thumb, index, and middle fingers inserted into the cervical canal."],
    ["withdraw_forceps", "withdraw_forceps", "13. Gently withdraw the forceps to release the anterior lip of the cervix, leaving the balloon unit in position within the uterus."],
    ["prevent_expulsion_when_inflati", "prevent_expulsion_when_inflati", "14. Position 2 fingers (index and middle) at the cervix to maintain the balloon unit in position and prevent expulsion when inflating."],
    ["inflate_balloon", "inflate_balloon", "15. Open the T-valve to allow water to flow into the balloon from the water bag by gravity, and continue to inflate the balloon while keeping the 2 fingers in place and checking to ensure that the balloon is still well secured within the uterine cavity (balloon fills within 45 seconds)."],
    ["inflate_until_equilibrium", "inflate_until_equilibrium", "16. Allow water to flow until the flow stops, indicating equilibrium with the uterine cavity."],
    ["balloon_insitu_check_bleeding", "balloon_insitu_check_bleeding", "17. Remove the 2 fingers at the cervix and wait for 2 minutes after inflation, then recheck whether the balloon remains in the uterine cavity (observe the vulva to monitor the level of vaginal bleeding)."],
    ["determine_approp_bag_height", "determine_approp_bag_height", "18. The appropriate height for the supply bag is determined by the patient’s systolic blood pressure. The device tubing has 4 markings corresponding as follows: 60 mmHg (0.8 m), 80 mmHg (1.1 m), 100 mmHg (1.3 m), and 120 mmHg (1.6 m), read from the T-valve towards the supply bag."],
    ["not_level_when_bleeding_stops", "not_level_when_bleeding_stops", "19. Keep the T-valve open and note the level of the water in the bag when bleeding ceases."],
    ["observe_patient", "observe_patient", "20. Observe the patient and note any discomfort."],
    ["secure_tubing", "secure_tubing", "21. Tape the tubing to the patient’s thigh to secure it in place, leaving enough leeway to allow for movement of the thigh."],
    ["antibiotics", "antibiotics", "22. Administer broad-spectrum intravenous antibiotics."],
    ["documentation_time_level", "documentation_time_level", "23. Document the time of insertion and record total volume of water inflated into the balloon and the level in the bag."],
    ["continue_iv_fluids", "continue_iv_fluids", "24. Continue with intravenous fluid resuscitation and uterotonic treatment."],
    ["vital_signs", "vital_signs", "25. Continue to monitor the patient closely for active bleeding: vital signs (blood pressure, pulse, respiratory rate) every 15 minutes for the first hour, 30 minutes for the second hour, and hourly thereafter."],
    ["when_to_remove", "when_to_remove", "26. Consider removal after 6–8 hours (to allow for physiological contraction and relaxation of the uterus) or after a maximum of 24 hours."],
    ["drain_balloon", "drain_balloon", "27. Drain water from the balloon tamponade into the water bag by positioning the water bag at the same level as the patient or lower, with the T-valve open (60 seconds)."],
    ["remove_balloon_gently", "remove_balloon_gently", "28. When all water has drained out of the balloon (1 litre of fluid in the supply bag), remove the balloon by gently pulling on the tubing."],
    ["post_removal_monitoring", "post_removal_monitoring", "29. After balloon tamponade removal, confirm that the uterus is firmly contracted, check for active vaginal bleeding, and monitor the mother’s vital signs (every 15 minutes for the first hour, 30 minutes for the second hour, and hourly thereafter)."],
    ["activity_resumption", "activity_resumption", "30. Observe closely for resumption of active bleeding during decompression of the balloon."],
    ["what_if_bleeing_resumes", "what_if_bleeing_resumes", "31. If bleeding resumes after 6–8 hours, reposition the bag above the level of the patient and re-inflate the balloon for continued tamponade effect."],
    ["referral", "referral", "32. If not at a referral center, arrange to transfer the patient to a CEmONC facility with the balloon in situ."],
    ["close_valve_in_transfer", "close_valve_in_transfer", "33. Close the T-valve for the duration of the journey."],
    ["Document", "Document", "34. Document procedure findings and all outcomes in the client record."]
  ];

  var rows = [];
  for (var i = 0; i < items.length; i++) {
    rows.push(mohSacYesNoSelectRow_(items[i][0], items[i][1], items[i][2]));
  }
  return rows;
}

function mohSacYesNoSelectRow_(listName, fieldName, label) {
  return [
    "select_one " + listName,
    fieldName,
    label,
    "",
    "true",
    "",
    "",
    "",
    "",
    "",
    "",
    ""
  ];
}

function getMoHSACSkillEvaluationChoices_() {
  // list_name, name, label, allowed
  return [
    [
      "skill_evaluation",
      "UBT_(free flow)",
      "UBT (Free Flow)",
      "mentors_curriculum,ifm_assessment,tot"
    ],
    [
      "skill_evaluation",
      "Manual_removal_of_placenta",
      "Manual Removal of Placenta",
      "mentors_curriculum,ifm_assessment,tot"
    ],
    [
      "skill_evaluation",
      "UBT",
      "UBT",
      "mentors_curriculum,ifm_assessment,tot"
    ],
    [
      "skill_evaluation",
      "Cord_prolapse",
      "Management of Cord Prolapse",
      "mentors_curriculum,ifm_assessment,tot"
    ],
    [
      "skill_evaluation",
      "Assisted_breech_delivery",
      "Assisted Breech Delivery",
      "mentors_curriculum,ifm_assessment,tot"
    ]
  ];
}

function getMoHSACUbtFreeflowYesNoChoices_() {
  return getMoHSACYesNoChoicesForLists_([
    "obtain_consent",
    "sterile_gloves",
    "assemble_ubt",
    "hungon_drip_stand_valve_closed",
    "lithotomy_position",
    "clean_perinuem",
    "catheterize",
    "drape_patient",
    "visualize_cervix_sims_speculum",
    "stabilize_uterus",
    "remove_speculum",
    "insert_balloon",
    "withdraw_forceps",
    "prevent_expulsion_when_inflati",
    "inflate_balloon",
    "inflate_until_equilibrium",
    "balloon_insitu_check_bleeding",
    "determine_approp_bag_height",
    "not_level_when_bleeding_stops",
    "observe_patient",
    "secure_tubing",
    "antibiotics",
    "documentation_time_level",
    "continue_iv_fluids",
    "vital_signs",
    "when_to_remove",
    "drain_balloon",
    "remove_balloon_gently",
    "post_removal_monitoring",
    "activity_resumption",
    "what_if_bleeing_resumes",
    "referral",
    "close_valve_in_transfer",
    "Document"
  ]);
}

function getMoHSACManualPlacentaYesNoChoices_() {
  // Only lists not already covered by UBT Free Flow yes/no choices
  return getMoHSACYesNoChoicesForLists_([
    "shout_for_help1",
    "v_drape",
    "insert_iv_lines",
    "repeat_oxytocin",
    "empty_bladder",
    "analgesics_antibiotics",
    "wear_gynecological_gloves",
    "guide_hand_into_uterus",
    "locate_placenta_edge",
    "placenta_removal",
    "cct",
    "check_for_atony",
    "placenta_examination",
    "explore_for_fragments",
    "remove_fragments",
    "laceration_repair",
    "oxytocin_20_iu",
    "message_to_mother",
    "other_managment"
  ]);
}

function getMoHSACUbtYesNoChoices_() {
  // Only lists not already covered by earlier skill checklists
  return getMoHSACYesNoChoicesForLists_([
    "balloon_over_catheter",
    "tie_the_balloon",
    "inflate_balloon_with_20cc",
    "inflate_balloon_with_20cc_001",
    "grasp_anterior_cervix",
    "place_balloon_into_uterus",
    "inflate_balloon_300ml_500ml",
    "clamp_catheter",
    "balloon_insitu_24hrs",
    "oxytocin_20iu_in_ns",
    "monitoring",
    "deflate_50mls_q_hr",
    "reinflate_50mls_bleeding_recur",
    "surgical_intervention_bleeding",
    "transfusion",
    "documentation"
  ]);
}

function getMoHSACCordProlapseYesNoChoices_() {
  return getMoHSACYesNoChoicesForLists_([
    "shout_for_help",
    "vaginal_exam",
    "confirm_diagnosis",
    "confirms_cord_pulsation",
    "patient_position",
    "manual_cord_decompression",
    "consent_prep_emergency_cs",
    "patient_transfer_position",
    "hand_removal",
    "bladder_filling",
    "tocolytics",
    "when_cord_not_pulsating",
    "expediting_delivery",
    "prepare_to_resuscitate"
  ]);
}

function getMoHSACAssistedBreechYesNoChoices_() {
  return getMoHSACYesNoChoicesForLists_([
    "call_for_help",
    "consider_episiotomy",
    "hands_off_breech",
    "pinard_manuever",
    "grip_pelvis_bone",
    "lovset_maneuver",
    "maurecieu_smellie_veit_maneuve",
    "amtsl"
  ]);
}

function getMoHSACYesNoChoicesForLists_(listNames) {
  var rows = [];
  for (var i = 0; i < listNames.length; i++) {
    rows.push([listNames[i], "yes", "Yes", ""]);
    rows.push([listNames[i], "no", "No", ""]);
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
    .concat(getMoHSACMentorsMenteeChoices_(sourceSs))
    .concat(getMoHSACSkillEvaluationChoices_())
    .concat(getMoHSACUbtFreeflowYesNoChoices_())
    .concat(getMoHSACManualPlacentaYesNoChoices_())
    .concat(getMoHSACUbtYesNoChoices_())
    .concat(getMoHSACCordProlapseYesNoChoices_())
    .concat(getMoHSACAssistedBreechYesNoChoices_());

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
