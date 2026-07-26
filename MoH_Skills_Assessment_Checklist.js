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
 * Order: group open → ToT IFM fields + lm_po →
 *        IFM facility selects from kobocreator "Survey Sheet (IFM)" →
 *        Newborn mentees → MENTORS/EmONC mentees.
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
    .concat(getMoHSACIfmBlockRows_(sourceSs))
    .concat(getMoHSACNewbornMenteeSurveyRows_(sourceSs))
    .concat(getMoHSACMentorsMenteeSurveyRows_(sourceSs))
    .concat([
      ["end_group", "", "", "", "", "", "", "", "", "", "", ""], // close mentees
      ["end_group", "", "", "", "", "", "", "", "", "", "", ""]  // close group_mentorship_details
    ]);
}

// =====================================================
// IFM BLOCK
//   1) ToT free-text IFM fields (ifm_name / ifm_id / ifm_id_2)
//   2) lm_po (Lead Mentors & Program Officers) — kept as authored
//   3) IFM facility selects from kobocreator "Survey Sheet (IFM)"
//      columns used: type, name, label, relevant
// Related choices: getMoHSACLmPoChoices_(), getMoHSACIfmChoices_()
// =====================================================

/**
 * Full IFM block (static ToT/lm_po + Survey Sheet (IFM) selects).
 */
function getMoHSACIfmBlockRows_(sourceSs) {
  return getMoHSACIfmStaticRows_()
    .concat(getMoHSACIfmSurveyRows_(sourceSs));
}

/** ToT IFM text/phone fields + lm_po (leave as-is; do not pull from Survey Sheet). */
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
 * IFM facility selects from kobocreator "Survey Sheet (IFM)".
 * Pulls only: type, name, label, relevant.
 * - required always text "true"
 * - relevant kept as facility match, forced to program = ifm_assessment
 * - colliding names become name_001, name_002, ...
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
  var relevantIndex = header.indexOf("relevant");

  if (
    typeIndex === -1 ||
    nameIndex === -1 ||
    labelIndex === -1 ||
    relevantIndex === -1
  ) {
    throw new Error(
      "Survey Sheet (IFM) is missing required columns: " +
      "type, name, label, relevant"
    );
  }

  var rows = [];
  var nameCounts = {};

  for (var i = 1; i < data.length; i++) {
    var type = data[i][typeIndex];
    var baseName = data[i][nameIndex];
    var label = data[i][labelIndex];
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

    // Map into MoH SAC survey columns:
    // type, name, label, hint, required, required_message,
    // constraint_message, relevant, choice_filter, calculation,
    // constraint, appearance
    rows.push([
      type || "",
      name,
      label || "",
      "",
      "true",
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

function normalizeMoHSACRequired_(value) {
  // Always emit lowercase text "true"/"false" for Kobo (never Sheets boolean)
  if (value === true) return "true";
  if (value === false) return "false";
  var cleaned = String(value == null ? "" : value).trim().toLowerCase();
  if (cleaned === "true" || cleaned === "false") return cleaned;
  return cleaned;
}

/**
 * Keep facility equality from Survey Sheet (IFM), but show IFM selects
 * only for program = ifm_assessment (ToT uses free-text fields above lm_po).
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
 * Pulls type, name, label, relevant.
 * Source required is blank — emit text "true" for Kobo.
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
    // Source required column is blank → always write "true"
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
 * skills_assessment is closed by getMoHSACSection2ClosingRows_().
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
    .concat(getMoHSACAssistedBreechRows_())
    .concat(getMoHSACAvdRows_())
    .concat(getMoHSACShoulderDystociaRows_())
    .concat(getMoHSACAmtslRows_())
    .concat(getMoHSACNasgRows_())
    .concat(getMoHSACNnrRows_())
    .concat(getMoHSACMaternalShockRows_())
    .concat(getMoHSACBlynchRows_())
    .concat(getMoHSACPerinealTearRows_())
    .concat(getMoHSACMaternalResuscitationRows_())
    .concat(getMoHSACCervicalTearRows_())
    .concat(getMoHSACBimanualCompressionRows_())
    .concat(getMoHSACAorticCompressionRows_())
    .concat(getMoHSACHipRows_())
    .concat(getMoHSACUterineInversionRows_())
    .concat(getMoHSACEmotiveRows_())
    .concat(getMoHSACPartographRows_())
    .concat(getMoHSACSection2ClosingRows_());
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

/**
 * Section 2b: Assisted Vaginal Vacuum Delivery checklist + score.
 */
function getMoHSACAvdRows_() {
  var whenToHaltLabel =
    "19. Stop when:\n" +
    "  • The head does not advance with each pull\n" +
    "  • The cup slips and disengages three times\n" +
    "  • The fetus is not delivered after 20 minutes";

  var scoreCalc =
    "round(((" +
    "(${obtain_consent_005}='yes')+" +
    "(${ask_for_help}='yes')+" +
    "(${avd_contraindication}='yes')+" +
    "(${empty_bladder_002}='yes')+" +
    "(${alert_theatre}='yes')+" +
    "(${proper_dilatation_descent}='yes')+" +
    "(${adequate_contractions}='yes')+" +
    "(${determine_position}='yes')+" +
    "(${mcroberts_position}='yes')+" +
    "(${equipment_check}='yes')+" +
    "(${vacuum_placement}='yes')+" +
    "(${evaluates_for_episiotomy}='yes')+" +
    "(${check_maternal_soft_tissue}='yes')+" +
    "(${negative_pressure}='yes')+" +
    "(${apply_gentle_traction}='yes')+" +
    "(${cup_removal}='yes')+" +
    "(${fhr_check}='yes')+" +
    "(${proceed_as_normal_delivery}='yes')+" +
    "(${when_to_halt}='yes')+" +
    "(${message_to_mother_003}='yes')" +
    ")*100 div 20,0)";

  var items = [
    ["obtain_consent", "obtain_consent_005", "1. Address the patient and explain the diagnosis, the procedure, and reasons why, and obtain consent."],
    ["ask_for_help", "ask_for_help", "2. Ask for help from at least three people, those to assist in the delivery, and a neonatologist."],
    ["avd_contraindication", "avd_contraindication", "3. Rule out contraindications and confirm the indication for assisted vaginal vacuum delivery and that the fetus is term."],
    ["empty_bladder", "empty_bladder_002", "4. Make sure the bladder is empty and remove the catheter."],
    ["alert_theatre", "alert_theatre", "5. Make a back-up plan (alert theatre in case the procedure fails)."],
    ["proper_dilatation_descent", "proper_dilatation_descent", "6. Check that the cervix is fully dilated, membranes are ruptured, vertex presentation, and head not more than 1/5 palpable above the pelvic brim."],
    ["adequate_contractions", "adequate_contractions", "7. Confirm adequate contractions; if not adequate, augment."],
    ["determine_position", "determine_position", "8. Determine the position of the head by feeling for the posterior fontanelle, sagittal suture line, and anterior fontanelle. Then identify the flexion point."],
    ["mcroberts_position", "mcroberts_position", "9. Position the patient in a McRoberts position because of possibility of shoulder dystocia."],
    ["equipment_check", "equipment_check", "10. Make sure the equipment works, check connections, and test pressure on a gloved hand."],
    ["vacuum_placement", "vacuum_placement", "11. Place the largest vacuum cup that will fit over the flexion point, with the center of the cup at 2–3 cm anterior to the posterior fontanelle on the sagittal line."],
    ["evaluates_for_episiotomy", "evaluates_for_episiotomy", "12. Assess for need for episiotomy."],
    ["check_maternal_soft_tissue", "check_maternal_soft_tissue", "13. Check around the cup to ensure that there is no maternal soft tissue within the vacuum rim."],
    ["negative_pressure", "negative_pressure", "14. Create a vacuum of 0.2 kg/cm² negative pressure (yellow area), check for maternal tissues, and keep pumping until 0.8 kg/cm² (green area). Check again to ensure that it is on the flexion point and no maternal tissues are trapped. In case maternal tissue is trapped, release vacuum and reapply the cup."],
    ["apply_gentle_traction", "apply_gentle_traction", "15. Apply gentle traction in the line of the pelvic axis and perpendicular to the cup with each contraction in a J-shaped motion. Do not pull between contractions; do not use the vacuum cup to rotate the baby’s head."],
    ["cup_removal", "cup_removal", "16. Remove the vacuum cup when the baby’s jaw is felt."],
    ["fhr_check", "fhr_check", "17. Check fetal heart rate and the application of the cup between contractions."],
    ["proceed_as_normal_delivery", "proceed_as_normal_delivery", "18. Proceed after this as for normal delivery process."],
    ["when_to_halt", "when_to_halt", whenToHaltLabel],
    ["message_to_mother", "message_to_mother_003", "20. Explain to the mother the results of the procedure."]
  ];

  var rows = [
    [
      "begin_group",
      "group_avd",
      "Section 2b: Assisted Vaginal Vacuum Delivery",
      "",
      "true",
      "",
      "",
      "${skill_evaluation} = 'Assisted_vaginal_vacuum_delivery'",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "case_scenario_avd",
      "***Case Scenario:*** *The interns call you to perform a vacuum-assisted vaginal delivery on a para 2+0, gravida 3 at 38 weeks’ gestation. The patient is a cardiac case and is fully dilated.*",
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
      "avd_score",
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
      "avd_pass",
      "*Congratulations! Your score is **[${avd_score}%]**. You have fulfilled the requirements for this skill!*",
      "",
      "",
      "",
      "",
      "${avd_score} >= 84.5 and ${message_to_mother_003}!=''",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "avd_fail",
      "*Sorry! Your score is **[${avd_score}%]**. Please review the relevant material or content, then try again.*",
      "",
      "",
      "",
      "",
      "${avd_score} < 84.5 and ${message_to_mother_003}!=''",
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
 * Section 2b: Shoulder dystocia checklist + score.
 */
function getMoHSACShoulderDystociaRows_() {
  var scoreCalc =
    "round(((" +
    "(${shout_for_help_002}='yes')+" +
    "(${obtain_consent_006}='yes')+" +
    "(${aim_to_deliver_within_5_min}='yes')+" +
    "(${woman_not_to_push}='yes')+" +
    "(${evaluates_for_episiotomy_001}='yes')+" +
    "(${Mcrobert_position}='yes')+" +
    "(${rubin_1_maneuver}='yes')+" +
    "(${rubin_2_maneuver}='yes')+" +
    "(${wood_screw_maneuver}='yes')+" +
    "(${deliver_posterior_shoulder}='yes')+" +
    "(${gaskins_maneuver}='yes')+" +
    "(${_3rd_stage_labor}='yes')+" +
    "(${prep_for_nnr}='yes')+" +
    "(${message_to_mother_004}='yes')+" +
    "(${Monitor_the_baby}='yes')" +
    ")*100 div 15,0)";

  var items = [
    ["shout_for_help", "shout_for_help_002", "1. Shout for help."],
    ["obtain_consent", "obtain_consent_006", "2. Explain the procedure to the mother and obtain consent."],
    ["aim_to_deliver_within_5_min", "aim_to_deliver_within_5_min", "3. Aim to deliver within 5 minutes."],
    ["woman_not_to_push", "woman_not_to_push", "4. Ask the woman not to push throughout the procedure."],
    ["evaluates_for_episiotomy", "evaluates_for_episiotomy_001", "5. Evaluate for an episiotomy to prevent soft tissue obstruction and give room for other manoeuvres."],
    ["Mcrobert_position", "Mcrobert_position", "6. Put the woman in McRoberts’ position."],
    ["rubin_1_maneuver", "rubin_1_maneuver", "7. Apply suprapubic pressure while maintaining McRoberts’ position (Rubin I manoeuvre)."],
    ["rubin_2_maneuver", "rubin_2_maneuver", "8. Using two fingers, apply pressure to the anterior shoulder through the vagina in the direction of the baby’s sternum to rotate the shoulder and decrease the inter-shoulder diameter (Rubin II manoeuvre)."],
    ["wood_screw_maneuver", "wood_screw_maneuver", "9. Do internal rotation by placing two fingers behind the anterior shoulder and two fingers in front of the posterior shoulder and rotate the shoulders 180 degrees (Woods screw manoeuvre)."],
    ["deliver_posterior_shoulder", "deliver_posterior_shoulder", "10. Deliver the posterior shoulder first by grasping the humerus of the posterior arm and keeping the arm flexed at the elbow, sweep the arm across the chest (this will provide room for the anterior shoulder to move under the pelvis)."],
    ["gaskins_maneuver", "gaskins_maneuver", "11. If delivery is unsuccessful, roll over the patient and position the patient on all fours (Gaskin’s manoeuvre)."],
    ["_3rd_stage_labor", "_3rd_stage_labor", "12. If successful, initiate management of third stage of labour."],
    ["prep_for_nnr", "prep_for_nnr", "13. Always be prepared to resuscitate the newborn."],
    ["message_to_mother", "message_to_mother_004", "14. Explain results of the procedure to the mother."],
    ["Monitor_the_baby", "Monitor_the_baby", "15. Monitor the baby closely."]
  ];

  var rows = [
    [
      "begin_group",
      "group_shoulder_dystocia",
      "Section 2b: Shoulder dystocia checklist",
      "",
      "true",
      "",
      "",
      "${skill_evaluation} = 'Shoulder_dystocia'",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "case_scenario",
      "***Case Scenario:*** *During a ward round in the labor ward, a nurse calls for help: “Help, help, we have shoulder dystocia; we urgently need to perform an assisted shoulder dystocia delivery.” Run and confirm shoulder dystocia, then take charge of the delivery, giving a running commentary.*",
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
      "shoulder_score",
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
      "shoulder_pass",
      "*Congratulations! Your score is **[${shoulder_score}%]**. You have fulfilled the requirements for this skill!*",
      "",
      "",
      "",
      "",
      "${shoulder_score} >= 84.5 and ${Monitor_the_baby}!=''",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "shoulder_fail",
      "*Sorry! Your score is **[${shoulder_score}%]**. Please review the relevant material or content, then try again.*",
      "",
      "",
      "",
      "",
      "${shoulder_score} < 84.5 and ${Monitor_the_baby}!=''",
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
 * Section 2b: Active Management of Third Stage of Labor checklist + score.
 */
function getMoHSACAmtslRows_() {
  var uterotonicLabel =
    "6. Give uterotonic within 1 minute of birth of the baby:\n" +
    "  • Oxytocin 10 IU IM or 10 IU IV over 1 minute OR\n" +
    "  • Heat-stable carbetocin 100 mcg IV over 1 minute OR\n" +
    "  • Misoprostol 600 mcg may be given where applicable OR\n" +
    "  • Ergometrine 0.5 mg (ensure patient is not hypertensive) OR\n" +
    "  • Oxytocin and ergometrine fixed-dose combination (Syntometrine):\n" +
    "  ◊ Give 5 IU/500 μg IM";

  var scoreCalc =
    "round(((" +
    "(${explain_procedure}='yes')+" +
    "(${obtain_consent_007}='yes')+" +
    "(${change_goloves}='yes')+" +
    "(${check_second_twin}='yes')+" +
    "(${explain_medication}='yes')+" +
    "(${administer_uterotonic}='yes')+" +
    "(${unfold_v_drape}='yes')+" +
    "(${delayed_cord_clamp}='yes')+" +
    "(${cord_cut}='yes')+" +
    "(${cct_001}='yes')+" +
    "(${recieve_placenta}='yes')+" +
    "(${assess_fundal_tone}='yes')+" +
    "(${genital_trauma_assessment}='yes')+" +
    "(${assess_blood_loss1}='yes')+" +
    "(${_15min_uterine_massage}='yes')+" +
    "(${vital_signs_002}='yes')+" +
    "(${message_to_mother_005}='yes')+" +
    "(${health_messages}='yes')+" +
    "(${document_procedure1}='yes')" +
    ")*100 div 19,0)";

  var items = [
    ["explain_procedure", "explain_procedure", "1. Explain the procedure and blood collection drape to the mother and birth companion."],
    ["obtain_consent", "obtain_consent_007", "2. Obtain consent."],
    ["change_goloves", "change_goloves", "3. Change gloves."],
    ["check_second_twin", "check_second_twin", "4. Check for a second twin."],
    ["explain_medication", "explain_medication", "5. Explain to the mother the medication she will receive and the rationale."],
    ["administer_uterotonic", "administer_uterotonic", uterotonicLabel],
    ["unfold_v_drape", "unfold_v_drape", "7. Unfold the blood collection drape or place the blood collection device."],
    ["delayed_cord_clamp", "delayed_cord_clamp", "8. Perform delayed cord clamping and cutting after giving uterotonics (1–3 minutes)."],
    ["cord_cut", "cord_cut", "9. Change gloves before cutting the cord."],
    ["cct", "cct_001", "10. Deliver the placenta by controlled cord traction (CCT) while applying counter-traction during a contraction."],
    ["recieve_placenta", "recieve_placenta", "11. Use both hands to receive the placenta."],
    ["assess_fundal_tone", "assess_fundal_tone", "12. Assess fundal tone immediately after delivery of placenta."],
    ["genital_trauma_assessment", "genital_trauma_assessment", "13. Examine the perineum for tears and lacerations."],
    ["assess_blood_loss1", "assess_blood_loss1", "14. Assess the amount of blood loss – check the amount of blood collected in the drape or blood collection device and vaginal blood flow."],
    ["_15min_uterine_massage", "_15min_uterine_massage", "15. Demonstrate to the patient and birth companion self-uterine massage every 15 minutes for 2 hours."],
    ["vital_signs", "vital_signs_002", "16. Assess vitals (BP, pulse, respiration, temperature and tone) every 15 minutes for the first 2 hours and every 30 minutes for 6 hours postpartum. Check the baby’s colour, temperature, and breathing. Initiate breastfeeding within 1 hour and encourage skin-to-skin contact."],
    ["message_to_mother", "message_to_mother_005", "17. Explain to the mother the results of the procedure, encourage breastfeeding within 1 hour of birth, and frequent emptying of the bladder."],
    ["health_messages", "health_messages", "18. Give health message to the mother."],
    ["document_procedure1", "document_procedure1", "19. Documentation."]
  ];

  var rows = [
    [
      "begin_group",
      "group_amtsl",
      "Section 2b: Active Management of Third Stage of Labor",
      "",
      "true",
      "",
      "",
      "${skill_evaluation} = 'AMTSL'",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "case_scenario_mstl",
      "***Case scenario:*** *Natalie was admitted to the labor ward in the second stage of labor and has had a normal vaginal delivery. Manage the third stage of labor.*",
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
      "amtsl_score",
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
      "amtsl_pass",
      "*Congratulations! Your score is **[${amtsl_score}%]**. You have fulfilled the requirements for this skill!*",
      "",
      "",
      "",
      "",
      "${amtsl_score} >= 84.5 and ${document_procedure1}!=''",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "amtsl_fail",
      "*Sorry! Your score is **[${amtsl_score}%]**. Please review the relevant material or content, then try again.*",
      "",
      "",
      "",
      "",
      "${amtsl_score} < 84.5 and ${document_procedure1}!=''",
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
 * Section 2b: Non Pneumatic Antishock Garment checklist + score.
 */
function getMoHSACNasgRows_() {
  var removeNasgLabel =
    "13. Remove NASG when, for at least 2 hours:\n" +
    "  • Pulse is 100 beats per minute or less \n" +
    "  • Systolic BP is 100 mmHg or higher \n" +
    "  • Bleeding is ≤50 mL/hr \n" +
    "  • The patient is hemodynamically stable and conscious/aware";

  var scoreCalc =
    "round(((" +
    "(${obtain_consent_008}='yes')+" +
    "(${ipc_precautions}='yes')+" +
    "(${placing_woman_on_nasg}='yes')+" +
    "(${segment1_2_application}='yes')+" +
    "(${nasg_snapping_test}='yes')+" +
    "(${segment2_3_application}='yes')+" +
    "(${segment4_application}='yes')+" +
    "(${segment5_placement}='yes')+" +
    "(${segment_6_placement_001}='yes')+" +
    "(${woman_can_breathe_normally}='yes')+" +
    "(${other_pph_management}='yes')+" +
    "(${monitor_sob_oliguria}='yes')+" +
    "(${message_to_mother_006}='yes')+" +
    "(${vital_signs_before_removal}='yes')+" +
    "(${open_segment_pair_1_or_2}='yes')+" +
    "(${when_to_remove_next_segment}='yes')+" +
    "(${when_reclose_segments}='yes')+" +
    "(${message_to_mother_007}='yes')+" +
    "(${document_results}='yes')" +
    ")*100 div 19,0)";

  var items = [
    ["obtain_consent", "obtain_consent_008", "1. Briefly explain the procedure to the mother and obtain consent."],
    ["ipc_precautions", "ipc_precautions", "2. Ensure infection prevention precautions."],
    ["placing_woman_on_nasg", "placing_woman_on_nasg", "3. Place the woman correctly on open NASG. The top edge of the NASG is at the lowest rib, the pressure ball is over the umbilicus, and the dotted line between segment 5 and 6 is in line with the spine."],
    ["segment1_2_application", "segment1_2_application", "4. Start application from segment pair 1 and snap test. Fold segment 1 into 2 and start application from segment 2."],
    ["nasg_snapping_test", "nasg_snapping_test", "5. Do a snap test – check if the NASG is tight enough by placing 1–2 fingers under the top of NASG segment, pulling back the fabric and letting it go. When the segment is tight enough, it sounds like snapping fingers."],
    ["segment2_3_application", "segment2_3_application", "6. Continue to close segment pairs from segment 2 to 3 over the umbilicus, with the pressure ball over the umbilicus."],
    ["segment4_application", "segment4_application", "7. Move the legs together and apply segment 4 around the woman’s pelvis (do not snap)."],
    ["segment5_placement", "segment5_placement", "8. Place segment 5 with pressure ball over the umbilicus."],
    ["segment_6_placement_001", "segment_6_placement_001", "9. Place segment 6 over segment 5 to close."],
    ["woman_can_breathe_normally", "woman_can_breathe_normally", "10. Ensure the woman can breathe normally by observing her breaths. Slightly loosen NASG at the 5th and 6th segments as you support the pressure ball."],
    ["other_pph_management", "other_pph_management", "11. Continue with other relevant management for PPH."],
    ["monitor_sob_oliguria", "monitor_sob_oliguria", "12. Monitor for shortness of breath and decreased urine output."],
    ["message_to_mother", "message_to_mother_006", removeNasgLabel],
    ["vital_signs_before_removal", "vital_signs_before_removal", "14. Take the pulse rate and blood pressure as baseline just before opening the first segment and document."],
    ["open_segment_pair_1_or_2", "open_segment_pair_1_or_2", "15. Open segment pair 1 for short women."],
    ["when_to_remove_next_segment", "when_to_remove_next_segment", "16. After removing a segment pair, wait for 15 minutes and retake pulse and BP. If pulse does not increase by 20 beats per minute and BP does not drop by more than 20 mmHg, continue opening the next segment pair."],
    ["when_reclose_segments", "when_reclose_segments", "17. In case of any change in vitals, reclose all the segments and look for the source of bleeding."],
    ["message_to_mother", "message_to_mother_007", "18. Explain to the mother the results of the procedure."],
    ["document_results", "document_results", "19. Document the results and blood loss monitoring chart."]
  ];

  var rows = [
    [
      "begin_group",
      "group_nasg",
      "Section 2b: Non Pneumatic Antishock Garment-Checklist",
      "",
      "true",
      "",
      "",
      "${skill_evaluation} = 'NASG'",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "case_scenario_nasg",
      "***Case Scenario:*** *Madam Alwala, a 35-year-old, para 5+0, gravida 6, was admitted at 6 a.m. in labour at a health centre and delivered at 2 p.m. a healthy baby boy who scored well, with a birth weight of 4.5 kg. Thirty minutes after childbirth, during the handover shift, the nurses discover she is in a pool of blood, confused, and agitated. With the aid of a non-pneumatic anti-shock garment (NASG), demonstrate the management of the patient.*",
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
      "nasg_score",
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
      "nasg_pass",
      "*Congratulations! Your score is **[${nasg_score}%]**. You have fulfilled the requirements for this skill!*",
      "",
      "",
      "",
      "",
      "${nasg_score} >= 84.5 and ${document_results}!=''",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "nasg_fail",
      "*Sorry! Your score is **[${nasg_score}%]**. Please review the relevant material or content, then try again.*",
      "",
      "",
      "",
      "",
      "${nasg_score} < 84.5 and ${document_results}!=''",
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
 * Section 2b: Newborn resuscitation checklist + score.
 */
function getMoHSACNnrRows_() {
  var rows = [
    [
      "begin_group",
      "group_nnr",
      "Section 2b: Newborn resuscitation-Checklist",
      "",
      "true",
      "",
      "",
      "${skill_evaluation} = 'Newborn_resuscitation'",
      "",
      "",
      "",
      ""
    ],
    ["note", "case_scenario_nnr", "***Scenario:*** *A term baby is about to be delivered after a prolonged second stage, and there is a history of fetal distress. What do you do?*\n \n *In this case scenario, the assessor should observe the assessee performing and verbalizing the following steps. Only tick if the assessee performs the steps listed below.*", "", "", "", "", "", "", "", "", ""],
    ["note", "note_nnr1", "1. Check that the following steps are done during birth prepation.", "", "", "", "", "", "", "", "", ""],
    ["select_multiple review_anc_history", "review_anc_history", "a) Review ANC and Maternal History", "", "true", "", "", "", "", "", "not(selected(${review_anc_history}, 'missed_all_steps') and count-selected(${review_anc_history}) > 1)", ""],
    ["select_multiple check_safety", "check_safety", "b) Safety.", "", "true", "", "", "", "", "", "not(selected(${check_safety}, 'missed_all_steps') and count-selected(${check_safety}) > 1)", ""],
    ["select_multiple check_equipment_warmth", "check_equipment_warmth", "c) Equipment/Warmth.", "", "true", "", "", "", "", "", "not(selected(${check_equipment_warmth}, 'missed_all_steps') and count-selected(${check_equipment_warmth}) > 1)", ""],
    ["select_multiple check_airway", "check_airway", "d) Airway.", "", "true", "", "", "", "", "", "not(selected(${check_airway}, 'missed_all_steps') and count-selected(${check_airway}) > 1)", ""],
    ["select_multiple check_breathing", "check_breathing", "e) Breathing.", "", "true", "", "", "", "", "", "not(selected(${check_breathing}, 'missed_all_steps') and count-selected(${check_breathing}) > 1)", ""],
    ["select_multiple check_circulation", "check_circulation", "f) Circulation.", "", "true", "", "", "", "", "", "not(selected(${check_circulation}, 'missed_all_steps') and count-selected(${check_circulation}) > 1)", ""],
    ["select_one essential_newborn_care", "essential_newborn_care", "g) Essential Newborn Care Drugs (Chlorehexidine, T.E.O, Vitamin K).", "", "true", "", "", "", "", "", "", ""],
    ["select_one check_apgar_timing", "check_apgar_timing", "h) Wear sterile gloves and start the timer/note the time or start the APGAR timer.", "", "true", "", "", "", "", "", "", ""],
    ["select_multiple dry_stimulate", "dry_stimulate", "2. Dry or stimulate the baby with one towel (while on the mother’s abdomen). Assess for:", "", "true", "", "", "", "", "", "not(selected(${dry_stimulate}, 'missed_all_steps') and count-selected(${dry_stimulate}) > 1)", ""],
    ["select_multiple wet_dry_cloth", "wet_dry_cloth", "3. Observe whether the following steps have been followed.", "", "true", "", "", "", "", "", "not(selected(${wet_dry_cloth}, 'missed_all_steps') and count-selected(${wet_dry_cloth}) > 1)", ""],
    ["select_multiple immediate_nb_management", "immediate_nb_management", "4. Observe whether the following steps have been followed.", "", "true", "", "", "", "", "", "not(selected(${immediate_nb_management}, 'missed_all_steps') and count-selected(${immediate_nb_management}) > 1)", ""],
    ["select_multiple initial_abc_assessment", "initial_abc_assessment", "5. Observe whether the following steps have been followed.", "", "true", "", "", "", "", "", "not(selected(${initial_abc_assessment}, 'missed_all_steps') and count-selected(${initial_abc_assessment}) > 1)", ""],
    ["select_multiple abc_assessment", "abc_assessment", "6. Observe whether the following steps have been followed.", "", "true", "", "", "", "", "", "not(selected(${abc_assessment}, 'missed_all_steps') and count-selected(${abc_assessment}) > 1)", ""],
    ["select_one shout_help_nnr", "shout_help_nnr", "7. Shout for Help.", "", "true", "", "", "", "", "", "", ""],
    ["select_multiple begin_bvm", "begin_bvm", "8. Observe whether the following steps have been followed.", "", "true", "", "", "", "", "", "not(selected(${begin_bvm}, 'missed_all_steps') and count-selected(${begin_bvm}) > 1)", ""],
    ["select_multiple assess_pulse", "assess_pulse", "9. Assess large pulse/HR: umbilicus and listen.", "", "true", "", "", "", "", "", "not(selected(${assess_pulse}, 'missed_all_steps') and count-selected(${assess_pulse}) > 1)", ""],
    ["select_multiple continue_bvm", "continue_bvm", "10. Continue with BVM. The mentee asks the helper to perform hand hygiene or gives instructions to the helper as follows:", "", "true", "", "", "", "", "", "not(selected(${continue_bvm}, 'missed_all_steps') and count-selected(${continue_bvm}) > 1)", ""],
    ["select_one reassess_abc", "reassess_abc", "11. Re-assess Airway, Breathing and Circulation together.", "", "true", "", "", "", "", "", "", ""],
    ["select_multiple vetilations", "vetilations", "12. Observe whether the following steps have been followed.", "", "true", "", "", "", "", "", "not(selected(${vetilations}, 'missed_all_steps') and count-selected(${vetilations}) > 1)", ""],
    ["select_one reassess_abc_2", "reassess_abc_2", "13. Re-assess Airway, Breathing and Circulation together.", "", "true", "", "", "", "", "", "", ""],
    ["select_multiple post_resus_stablization", "post_resus_stablization", "14. Observe whether the following steps have been followed.", "", "true", "", "", "", "", "", "not(selected(${post_resus_stablization}, 'missed_all_steps') and count-selected(${post_resus_stablization}) > 1)", ""],
    ["select_multiple continue_observation", "continue_observation", "15. Continue to observe the baby:", "", "true", "", "", "", "", "", "not(selected(${continue_observation}, 'missed_all_steps') and count-selected(${continue_observation}) > 1)", ""],
    ["select_one documentation_nnr", "documentation_nnr", "16. Documentation, treatment plan.", "", "true", "", "", "", "", "", "", ""],
    [
      "calculate",
      "nnr_score",
      "Score",
      "",
      "",
      "",
      "",
      "",
      "",
      "round(((if(selected(${review_anc_history},'gestational_age'),0.5,0)+if(selected(${review_anc_history},'maternal_comorbidities_complications'),0.5,0)+if(selected(${review_anc_history},'prenatal_care_visits'),0.5,0)+if(selected(${review_anc_history},'anc_profile_lab_works'),0.5,0)+if(selected(${check_safety},'warm_room_25_28c_digital_room_thermometer'),0.5,0)+if(selected(${check_safety},'environment_no_sharps_spilage'),0.5,0)+if(selected(${check_safety},'gloves_both_sterile_and_clean'),0.5,0)+if(selected(${check_equipment_warmth},'perform_hand_hygiene_and_wear_clean_gloves'),0.5,0)+if(selected(${check_equipment_warmth},'radiant_warmer_prewarm_mode_with_two_towels_and_hat'),0.5,0)+if(selected(${check_equipment_warmth},'two_prewarmed_towels_and_hat'),0.5,0)+if(selected(${check_equipment_warmth},'mentions_about_clock'),0.5,0)+if(selected(${check_airway},'penguine_sucker_or_suction_machine'),0.5,0)+if(selected(${check_airway},'set_suction_machine_pressure_80_100mmhg'),0.5,0)+if(selected(${check_airway},'suction_catheter_6f_8f_and_wide_bore_yankauer_sucker'),0.5,0)+if(selected(${check_airway},'equipment_clean_and_functionality_checked'),0.5,0)+if(selected(${check_breathing},'bvm_size_200_300ml'),0.5,0)+if(selected(${check_breathing},'bvm_size_00_0_1'),0.5,0)+if(selected(${check_breathing},'nasal_prongs'),0.5,0)+if(selected(${check_breathing},'neonatal_non_rebreather_mask'),0.5,0)+if(selected(${check_breathing},'oxygen_source'),0.5,0)+if(selected(${check_breathing},'oxygen_tubings'),0.5,0)+if(selected(${check_breathing},'pulse_oximeter_with_neonatal_probe_cardiorespiratory_monitor'),0.5,0)+if(selected(${check_breathing},'equipment_clean_and_functionality_checked'),0.5,0)+if(selected(${check_circulation},'stethoscope'),0.5,0)+if(selected(${check_circulation},'iv_adrenaline_0_2ml_per_kg_1_10000'),0.5,0)+if(selected(${check_circulation},'normal_saline'),0.5,0)+if(${essential_newborn_care}='yes',0.5,0)+if(${check_apgar_timing}='yes',0.5,0)+if(selected(${dry_stimulate},'cry_respiratory_effort'),0.5,0)+if(selected(${dry_stimulate},'tone_activity'),0.5,0)+if(selected(${wet_dry_cloth},'remove_wet_cloth'),1,0)+if(selected(${wet_dry_cloth},'wrap_in_dry_warm_towel_cloth'),1,0)+if(selected(${wet_dry_cloth},'put_hat_on_baby_head'),1,0)+if(selected(${immediate_nb_management},'immediately_cut_cord'),1,0)+if(selected(${immediate_nb_management},'place_baby_on_prewarmed_radiant_warmer'),1,0)+if(selected(${initial_abc_assessment},'look_in_mouth_and_nose'),1,0)+if(selected(${initial_abc_assessment},'clear_airway'),1,0)+if(selected(${abc_assessment},'open_airway_sniffing_position_head_tilt_chin_lift'),1,0)+if(selected(${abc_assessment},'look_listen_feel_breathing_5_seconds'),1,0)+if(${shout_help_nnr}='yes',1,0)+if(selected(${begin_bvm},'size_bvm_mask'),1,0)+if(selected(${begin_bvm},'good_c_and_e_grip'),1,0)+if(selected(${begin_bvm},'give_40_60_continuous_ventilations_60_seconds'),1,0)+if(selected(${begin_bvm},'correct_rate_breath_two_three'),1,0)+if(selected(${begin_bvm},'ensure_chest_rises'),1,0)+if(selected(${assess_pulse},'feel_umbilical_pulse_5_seconds'),1,0)+if(selected(${assess_pulse},'connect_bvm_to_100_percent_oxygen'),1,0)+if(selected(${assess_pulse},'connect_pulse_oximeter'),1,0)+if(selected(${continue_bvm},'give_3_chest_compressions_1_ventilation_3_1_ratio_1_minute'),1,0)+if(selected(${continue_bvm},'use_2_thumb_hand_encircling_technique'),1,0)+if(selected(${continue_bvm},'location_lower_1_3_sternum'),0.5,0)+if(selected(${continue_bvm},'compress_1_3_ap_diameter'),0.5,0)+if(selected(${continue_bvm},'allow_chest_to_recoil'),0.5,0)+if(selected(${continue_bvm},'about_120_events_30_ventilations_90_chest_compressions_per_minute'),0.5,0)+if(${reassess_abc}='yes',0.5,0)+if(selected(${vetilations},'give_ventilations_40_60_breaths_per_min_60_seconds_chest_rise'),0.5,0)+if(selected(${vetilations},'checking_for_chest_movement'),0.5,0)+if(selected(${vetilations},'ensure_baby_kept_warm'),0.5,0)+if(${reassess_abc_2}='yes',0.5,0)+if(selected(${post_resus_stablization},'connect_pulse_oximeter_and_monitor_spo2'),0.5,0)+if(selected(${post_resus_stablization},'monitor_breathing_adequacy'),0.5,0)+if(selected(${post_resus_stablization},'switch_to_baby_mode_on_radiant_warmer'),0.5,0)+if(selected(${post_resus_stablization},'give_oxygen_using_nrm_10l_min_monitor_spo2_and_work_of_breathing'),0.5,0)+if(selected(${post_resus_stablization},'titrate_wean_off_oxygen_based_on_spo2'),0.5,0)+if(selected(${post_resus_stablization},'ensure_baby_kept_warm_36_5_37_5c'),0.5,0)+if(selected(${continue_observation},'airway'),0.5,0)+if(selected(${continue_observation},'breathing'),0.5,0)+if(selected(${continue_observation},'circulation'),0.5,0)+if(selected(${continue_observation},'disability'),0.5,0)+if(selected(${continue_observation},'exposure'),0.5,0)+if(selected(${continue_observation},'ifcdc'),0.5,0)+if(${documentation_nnr}='yes',1,0))*100 div 46.5),0)",
      "",
      ""
    ],
    [
      "note",
      "nnr_pass",
      "*Congratulations! Your score is **[${nnr_score}%]**. You have fulfilled the requirements for this skill!*",
      "",
      "",
      "",
      "",
      "${nnr_score} >= 84.5 and ${documentation_nnr}!=''",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "nnr_fail",
      "*Sorry! Your score is **[${nnr_score}%]**. Please review the relevant material or content, then try again.*",
      "",
      "",
      "",
      "",
      "${nnr_score} < 84.5 and ${documentation_nnr}!=''",
      "",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", "", "", ""]
  ];
  return rows;
}

/**
 * Section 2b: Maternal Shock checklist + score.
 */
function getMoHSACMaternalShockRows_() {
  var rows = [
    [
      "begin_group",
      "group_maternal_shock",
      "Section 2b: Maternal Shock",
      "",
      "true",
      "",
      "",
      "${skill_evaluation} = 'Maternal_shock'",
      "",
      "",
      "",
      ""
    ],
    ["note", "case_scenario_maternalshock", "***Case Scenario:*** *A mother has just been brought into your facility after severe postpartum hemorrhage (PPH) and is in shock. Demonstrate how you would manage the patient.*", "", "false", "", "", "", "", "", "", ""],
    ["select_one check_for_safety", "check_for_safety", "1. Rule out danger to self and patient.", "", "true", "", "", "", "", "", "", ""],
    ["select_one check_for_response", "check_for_response", "2. Check for response: “Hello Mary, are you okay?”", "", "true", "", "", "", "", "", "", ""],
    ["select_one call_for_help", "call_for_help_002", "3. If patient is unresponsive, call for help as you place patient on left lateral tilt.", "", "true", "", "", "", "", "", "", ""],
    ["select_one initiate_cpr", "initiate_cpr", "4. Start CPR as the team comes.", "", "true", "", "", "", "", "", "", ""],
    ["select_one assign_team_tasks", "assign_team_tasks", "5. Debrief and assign the team tasks: one person for airway and breathing and another for circulation.", "", "true", "", "", "", "", "", "", ""],
    ["select_one Offer_leadership", "Offer_leadership", "6. Offer leadership to the team.", "", "true", "", "", "", "", "", "", ""],
    ["select_one assess_airway", "assess_airway", "7. Assess the airway – look, listen, and feel. If airway is obstructed, perform airway opening manoeuvres (head tilt and chin lift).", "", "true", "", "", "", "", "", "", ""],
    ["select_one oropharyngeal_airway", "oropharyngeal_airway", "8. If airway is not maintained, insert an oropharyngeal airway.", "", "true", "", "", "", "", "", "", ""],
    ["select_one assess_breathing", "assess_breathing", "9. Look, listen, and feel for breathing.", "", "true", "", "", "", "", "", "", ""],
    ["select_one assess_carotid_pulse", "assess_carotid_pulse", "10. Feel for carotid pulse.", "", "true", "", "", "", "", "", "", ""],
    ["select_one cpr_30_2", "cpr_30_2", "11. Start chest compressions alternating with breaths: give 30 compressions followed by 2 slow breaths, each lasting.", "", "true", "", "", "", "", "", "", ""],
    ["select_one breathing_assessment", "breathing_assessment", "12. Look, listen, and feel for breathing.", "", "true", "", "", "", "", "", "", ""],
    ["select_one give_oxygen", "give_oxygen", "13. Give oxygen.", "", "true", "", "", "", "", "", "", ""],
    ["select_one manage_circulation", "manage_circulation", "14. Assess and treat circulation: get IV access and send blood samples.", "", "true", "", "", "", "", "", "", ""],
    ["select_one check_pulse_bp", "check_pulse_bp", "15. Check pulse and blood pressure.", "", "true", "", "", "", "", "", "", ""],
    ["select_one iv_fluids", "iv_fluids", "16. Give IV fluids: 1 litre in 20 minutes and another 1 litre in 30 minutes.", "", "true", "", "", "", "", "", "", ""],
    ["select_one transfuse_in_anemia", "transfuse_in_anemia", "17. Transfuse blood if there is severe anaemia.", "", "true", "", "", "", "", "", "", ""],
    ["select_one palpate_the_uterus", "palpate_the_uterus", "18. Palpate the uterus.", "", "true", "", "", "", "", "", "", ""],
    ["select_one inspect_external_genitalia", "inspect_external_genitalia", "19. Inspect the external genitalia.", "", "true", "", "", "", "", "", "", ""],
    ["select_one vaginal_exam", "vaginal_exam_001", "20. Do a digital vaginal examination and observe for any bleeding.", "", "true", "", "", "", "", "", "", ""],
    ["select_one repeat_vital_signs", "repeat_vital_signs", "21. Check vital signs again.", "", "true", "", "", "", "", "", "", ""],
    ["select_one input_output_monitoring", "input_output_monitoring", "22. Insert a catheter to monitor input and output.", "", "true", "", "", "", "", "", "", ""],
    ["select_one IV_antibiotics", "IV_antibiotics", "23. Give IV antibiotics.", "", "true", "", "", "", "", "", "", ""],
    [
      "calculate",
      "maternal_shock_score",
      "Score",
      "",
      "",
      "",
      "",
      "",
      "",
      "round(((${check_for_safety}='yes')+(${check_for_response}='yes')+(${call_for_help_002}='yes')+(${initiate_cpr}='yes')+(${assign_team_tasks}='yes')+(${Offer_leadership}='yes')+(${assess_airway}='yes')+(${oropharyngeal_airway}='yes')+(${assess_breathing}='yes')+(${assess_carotid_pulse}='yes')+(${cpr_30_2}='yes')+(${breathing_assessment}='yes')+(${give_oxygen}='yes')+(${manage_circulation}='yes')+(${check_pulse_bp}='yes')+(${iv_fluids}='yes')+(${transfuse_in_anemia}='yes')+(${palpate_the_uterus}='yes')+(${inspect_external_genitalia}='yes')+(${vaginal_exam_001}='yes')+(${repeat_vital_signs}='yes')+(${input_output_monitoring}='yes')+(${IV_antibiotics}='yes'))*100 div 23,0)",
      "",
      ""
    ],
    [
      "note",
      "maternal_shock_pass",
      "*Congratulations! Your score is **[${maternal_shock_score}%]**. You have fulfilled the requirements for this skill!*",
      "",
      "",
      "",
      "",
      "${maternal_shock_score} >= 84.5 and ${IV_antibiotics}!=''",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "maternal_shock_fail",
      "*Sorry! Your score is **[${maternal_shock_score}%]**. Please review the relevant material or content, then try again.*",
      "",
      "",
      "",
      "",
      "${maternal_shock_score} < 84.5 and ${IV_antibiotics}!=''",
      "",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", "", "", ""]
  ];
  return rows;
}

/**
 * Section 2b: B-Lynch checklist + score.
 */
function getMoHSACBlynchRows_() {
  var rows = [
    [
      "begin_group",
      "group_b-lynch",
      "Section 2b: B-Lynch Checklist",
      "",
      "true",
      "",
      "",
      "${skill_evaluation} = 'B-LYNCH'",
      "",
      "",
      "",
      ""
    ],
    ["note", "case_scenario_blynch", "***Case Scenario:*** *You are the consultant on call. You are urgently called to the theatre to attend to a patient with uterine atony. You arrive in the theatre just as the patient is being wheeled in. You place a B-Lynch suture in the uterus, which stops the bleeding. After the patient is successfully reversed and stable, the interns ask you to slowly demonstrate how to insert the B-Lynch suture using the model provided. Give a running commentary throughout the procedure.*", "", "false", "", "", "", "", "", "", ""],
    ["select_one qualified_medical_officer", "qualified_medical_officer", "1. The procedure is done by a qualified medical officer.", "", "true", "", "", "", "", "", "", ""],
    ["select_one obtain_consent", "obtain_consent_009", "2. Briefly explain the procedure to the mother and obtain consent.", "", "true", "", "", "", "", "", "", ""],
    ["select_one drape_in_place", "drape_in_place", "3. Ensure blood collection drape is in situ.", "", "true", "", "", "", "", "", "", ""],
    ["select_one anesthesia", "anesthesia", "4. The patient is given anaesthesia in supine position.", "", "true", "", "", "", "", "", "", ""],
    ["select_one cleaning_draping_abdomen", "cleaning_draping_abdomen", "5. The abdomen is cleaned and draped.", "", "true", "", "", "", "", "", "", ""],
    ["select_one vital_signs", "vital_signs_003", "6. Take the vital signs (BP, respiratory rate, pulse rate).", "", "true", "", "", "", "", "", "", ""],
    ["select_one open_abdomen_identify_uterus", "open_abdomen_identify_uterus", "7. Open the abdomen and identify the uterus.", "", "true", "", "", "", "", "", "", ""],
    ["select_one assess_for_atony", "assess_for_atony", "8. Assess the uterus for atony.", "", "true", "", "", "", "", "", "", ""],
    ["select_one lower_uterine_segment_incision", "lower_uterine_segment_incision", "9. Make a lower uterine segment incision.", "", "true", "", "", "", "", "", "", ""],
    ["select_one remove_pcos", "remove_pcos", "10. Remove any placental tissue or products of conception.", "", "true", "", "", "", "", "", "", ""],
    ["select_one start_from_right_side", "start_from_right_side", "11. Start from the right side (if right-handed) – 3 cm using a round-bodied large needle.", "", "true", "", "", "", "", "", "", ""],
    ["select_one insert_compression_suture", "insert_compression_suture", "12. Insert the compression suture starting from the lower edge of the lower segment uterine incision.", "", "true", "", "", "", "", "", "", ""],
    ["select_one suture_over_funds", "suture_over_funds", "13. Pass the suture over the fundus, enter the uterine cavity posteriorly at the level of the lower segment incision.", "", "true", "", "", "", "", "", "", ""],
    ["select_one loop_the_uterus_horizontally", "loop_the_uterus_horizontally", "14. Pass the suture horizontally to the left lower uterus and exit posteriorly.", "", "true", "", "", "", "", "", "", ""],
    ["select_one another_loop", "another_loop", "15. Pass the suture over the fundus anteriorly to the upper edge of the left side of the incision, and then exit from the lower edge.", "", "true", "", "", "", "", "", "", ""],
    ["select_one assistant_compress_uterus", "assistant_compress_uterus", "16. Ask assistant to compress the uterus.", "", "true", "", "", "", "", "", "", ""],
    ["select_one tie_ends_together", "tie_ends_together", "17. Pull the two ends and tie them together.", "", "true", "", "", "", "", "", "", ""],
    ["select_one vaginal_bleeding_controlled", "vaginal_bleeding_controlled", "18. Ask an assistant to confirm that vaginal bleeding is controlled.", "", "true", "", "", "", "", "", "", ""],
    ["select_one close_uterine_incision", "close_uterine_incision", "19. Close the uterine incision if bleeding is controlled.", "", "true", "", "", "", "", "", "", ""],
    ["select_one hysteroctomy_indication", "hysteroctomy_indication", "20. If the bleeding is not controlled, proceed and perform a hysterectomy.", "", "true", "", "", "", "", "", "", ""],
    ["select_one message_to_mother", "message_to_mother_008", "21. Explain the results of the procedure to the mother.", "", "true", "", "", "", "", "", "", ""],
    ["select_one document_results2", "document_results2", "22. Document the results and the blood loss monitoring chart.", "", "true", "", "", "", "", "", "", ""],
    [
      "calculate",
      "blynch_score",
      "Score",
      "",
      "",
      "",
      "",
      "",
      "",
      "round(((${qualified_medical_officer}='yes')+(${obtain_consent_009}='yes')+(${drape_in_place}='yes')+(${anesthesia}='yes')+(${cleaning_draping_abdomen}='yes')+(${vital_signs_003}='yes')+(${open_abdomen_identify_uterus}='yes')+(${assess_for_atony}='yes')+(${lower_uterine_segment_incision}='yes')+(${remove_pcos}='yes')+(${start_from_right_side}='yes')+(${insert_compression_suture}='yes')+(${suture_over_funds}='yes')+(${loop_the_uterus_horizontally}='yes')+(${another_loop}='yes')+(${assistant_compress_uterus}='yes')+(${tie_ends_together}='yes')+(${vaginal_bleeding_controlled}='yes')+(${close_uterine_incision}='yes')+(${hysteroctomy_indication}='yes')+(${message_to_mother_008}='yes')+(${document_results2}='yes'))*100 div 22,0)",
      "",
      ""
    ],
    [
      "note",
      "blynch_pass",
      "*Congratulations! Your score is **[${blynch_score}%]**. You have fulfilled the requirements for this skill!*",
      "",
      "",
      "",
      "",
      "${blynch_score} >= 84.5 and ${document_results2}!=''",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "blynch_fail",
      "*Sorry! Your score is **[${blynch_score}%]**. Please review the relevant material or content, then try again.*",
      "",
      "",
      "",
      "",
      "${blynch_score} < 84.5 and ${document_results2}!=''",
      "",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", "", "", ""]
  ];
  return rows;
}

/**
 * Section 2b: Perineal Tear Repair checklist + score.
 */
function getMoHSACPerinealTearRows_() {
  var rows = [
    [
      "begin_group",
      "group_perineal_tear",
      "Section 2b: Perineal Tear Repair-Checklist",
      "",
      "true",
      "",
      "",
      "${skill_evaluation} = 'Perineal_repair'",
      "",
      "",
      "",
      ""
    ],
    ["note", "case_scenario_perenealtear", "***Case Scenario:*** *Mary, a primigravida, had a precipitate labour. She delivered a live male infant weighing 4 kg. She subsequently started bleeding profusely. On examination, a perineal tear is identified. Using the mannequin provided, demonstrate how to repair the perineal tear.*", "", "false", "", "", "", "", "", "", ""],
    ["select_one obtain_consent", "obtain_consent_010", "1. Briefly explain the procedure to the mother and obtain consent.", "", "true", "", "", "", "", "", "", ""],
    ["select_one drape_in_place2", "drape_in_place2", "2. Ensure blood collection drape is in place.", "", "", "", "", "", "", "", "", ""],
    ["select_one high_lithotomy_position", "high_lithotomy_position", "3. Place woman in high lithotomy position and ensure proper lighting.", "", "true", "", "", "", "", "", "", ""],
    ["select_one asepsis", "asepsis", "4. Perform hand hygiene and put on sterile gloves.", "", "true", "", "", "", "", "", "", ""],
    ["select_one clean_perinuem", "clean_perinuem_001", "5. Aseptically clean the vulva.", "", "true", "", "", "", "", "", "", ""],
    ["select_one draping_catheterization", "draping_catheterization", "6. Drape the patient, catheterize the patient.", "", "true", "", "", "", "", "", "", ""],
    ["select_one local_anesthesia_examination", "local_anesthesia_examination", "7. Infiltrate the perineum with local anaesthesia, examine and classify the perineal tear.", "", "true", "", "", "", "", "", "", ""],
    ["select_one classify_tear_degree", "classify_tear_degree", "8. Classify the perineal tear: first degree, second degree, third degree, buttonhole and fourth degree. NB: third-, fourth-degree and buttonhole tears should be repaired in theatre under regional or general anaesthesia.", "", "true", "", "", "", "", "", "", ""],
    ["select_one gauze_to_improve_visibility", "gauze_to_improve_visibility", "9. Place sterile gauze to collect lochia loss to improve visibility of the perineal tear.", "", "true", "", "", "", "", "", "", ""],
    ["select_one suturing_from_appex", "suturing_from_appex", "10. Identify the apex of the vaginal trauma and insert the first stitch 5–10 mm above this point.", "", "true", "", "", "", "", "", "", ""],
    ["select_one non_locking_stitch", "non_locking_stitch", "11. Suture posterior vaginal trauma and the hymenal remnants using a loose continuous non-locking stitch.", "", "true", "", "", "", "", "", "", ""],
    ["select_one avoiding_hematoma", "avoiding_hematoma", "12. Bring the needle through the tissue underneath the hymenal ring and continue to repair the deep and superficial perineal muscles using a loose continuous stitch, sealing off any dead space to avoid haematoma formation.", "", "true", "", "", "", "", "", "", ""],
    ["select_one completing_perineal_repair", "completing_perineal_repair", "13. Appose skin edges and complete the perineal repair.", "", "true", "", "", "", "", "", "", ""],
    ["select_one message_to_mother", "message_to_mother_009", "14. Complete the subcutaneous repair to the hymenal ring, swing the needle under the tissue into the vagina, and complete the repair using a terminal loop knot.", "", "true", "", "", "", "", "", "", ""],
    ["select_one anal_sphincter_repair", "anal_sphincter_repair", "15. Ensure that for third- and fourth-degree tears, the integrity of the anal sphincter is secured by using Allis forceps to mobilize and appose the internal anal sphincter followed by the external anal sphincter.", "", "true", "", "", "", "", "", "", ""],
    ["select_one message_to_mother", "message_to_mother_010", "16. Explain to the mother the results of the procedure.", "", "true", "", "", "", "", "", "", ""],
    ["select_one health_talk", "health_talk", "17. Give health messages to the mother and companion: perineal hygiene, sex education, drug compliance, hospital delivery for 3º & 4º tears in a CEmONC facility, pelvic muscle exercises, family planning.", "", "true", "", "", "", "", "", "", ""],
    [
      "calculate",
      "perineal_tear_score",
      "Score",
      "",
      "",
      "",
      "",
      "",
      "",
      "round(((${obtain_consent_010}='yes')+(${drape_in_place2}='yes')+(${high_lithotomy_position}='yes')+(${asepsis}='yes')+(${clean_perinuem_001}='yes')+(${draping_catheterization}='yes')+(${local_anesthesia_examination}='yes')+(${classify_tear_degree}='yes')+(${gauze_to_improve_visibility}='yes')+(${suturing_from_appex}='yes')+(${non_locking_stitch}='yes')+(${avoiding_hematoma}='yes')+(${completing_perineal_repair}='yes')+(${message_to_mother_009}='yes')+(${anal_sphincter_repair}='yes')+(${message_to_mother_010}='yes')+(${health_talk}='yes'))*100 div 17,0)",
      "",
      ""
    ],
    [
      "note",
      "perineal_tear_pass",
      "*Congratulations! Your score is **[${perineal_tear_score}%]**. You have fulfilled the requirements for this skill!*",
      "",
      "",
      "",
      "",
      "${perineal_tear_score} >= 84.5 and ${health_talk}!=''",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "perineal_tear_fail",
      "*Sorry! Your score is **[${perineal_tear_score}%]**. Please review the relevant material or content, then try again.*",
      "",
      "",
      "",
      "",
      "${perineal_tear_score} < 84.5 and ${health_talk}!=''",
      "",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", "", "", ""]
  ];
  return rows;
}

/**
 * Section 2b: Maternal Resuscitation checklist + score.
 */
function getMoHSACMaternalResuscitationRows_() {
  var rows = [
    [
      "begin_group",
      "group_maternal_resuscitation",
      "Section 2b: Maternal Resuscitation",
      "",
      "true",
      "",
      "",
      "${skill_evaluation} = 'Maternal_resuscitation'",
      "",
      "",
      "",
      ""
    ],
    ["note", "case_scenario_maternalresuscitation", "***Case Scenario:*** *A gravid mother has just had a cardiopulmonary arrest, and you have been called to perform maternal resuscitation. Using the mannequin provided, demonstrate how you would proceed.*", "", "false", "", "", "", "", "", "", ""],
    ["select_one safety_assessement", "safety_assessement", "1. Rule out danger to self and patient.", "", "true", "", "", "", "", "", "", ""],
    ["select_one check_response", "check_response", "2. Check for response: “Hello Mary, are you okay?”", "", "true", "", "", "", "", "", "", ""],
    ["select_one shout_for_help", "shout_for_help_003", "3. If patient unresponsive, shout for help, give the woman a left lateral tilt, and use a pillow as a wedge.", "", "true", "", "", "", "", "", "", ""],
    ["select_one initiate_cpr", "initiate_cpr_001", "4. Start CPR as the team comes.", "", "true", "", "", "", "", "", "", ""],
    ["select_one debrief_and_assign_tasks", "debrief_or_assign_tasks", "5. Debrief the team and assign tasks: one person for airway and breathing and another for circulation.", "", "true", "", "", "", "", "", "", ""],
    ["select_one offer_leadership", "offer_leadership", "6. Offer leadership to the team.", "", "true", "", "", "", "", "", "", ""],
    ["select_one assess", "assess", "7. Assess the patient: look, listen, feel.", "", "true", "", "", "", "", "", "", ""],
    ["select_one head_titl_chin_lift", "head_titl_chin_lift", "8. If airway is obstructed, start simple airway manoeuvre: head tilt and chin lift.", "", "true", "", "", "", "", "", "", ""],
    ["select_one jaw_thrust", "jaw_thrust", "9. Do jaw thrust if airway falls back.", "", "true", "", "", "", "", "", "", ""],
    ["select_one maintain_airway", "maintain_airway", "10. Insert an oropharyngeal airway if patency of airway cannot be achieved by the above manoeuvres.", "", "true", "", "", "", "", "", "", ""],
    ["select_one identify_cpr_landmarks", "identify_cpr_lormarks", "11. Start CPR, identify the landmarks for CPR, correct positioning of the Ambu bag.", "", "true", "", "", "", "", "", "", ""],
    ["select_one demo_cpr", "demo_cpr", "12. Demonstrate cardiac compression, identify lower part of sternum (center of the chest), use of bag and mask, and observe chest rise. Ratio of compression to ventilation is 30:2.", "", "true", "", "", "", "", "", "", ""],
    ["select_one _30_2_cpr", "_30_2_cpr", "13. Give 30 compressions followed by 2 slow breaths each lasting 2–3 seconds.", "", "true", "", "", "", "", "", "", ""],
    ["select_one reassess_breathing", "reassess_breathing", "14. Reassess: look, listen, and feel for breathing.", "", "true", "", "", "", "", "", "", ""],
    ["select_one _2min_exchanges_cpr", "_2min_exchanges_cpr", "15. Change the person doing compressions after 2 minutes.", "", "true", "", "", "", "", "", "", ""],
    ["select_one perimotem_cs", "perimotem_cs", "16. Perform perimortem caesarean section if patient is still not breathing after 5 minutes of CPR. Aim is to improve circulation and not the baby.", "", "true", "", "", "", "", "", "", ""],
    ["select_one O2_recovery_room", "O2_recovery_room", "17. If patient responds and does not require perimortem C/S, give oxygen by mask 4–6 L/min and place patient in recovery position.", "", "true", "", "", "", "", "", "", ""],
    ["select_one assess_circulation_inverted_j", "assess_circulation_inverted_j", "18. Assess circulation using inverted J: capillary refill, skin temperature, pallor, pulse rate, blood pressure, axillary temperature, level of consciousness, fetal heart rate, urine output.", "", "true", "", "", "", "", "", "", ""],
    ["select_one IV_fluids", "IV_fluids", "19. If blood pressure is low, insert IV line, take blood for laboratory work, and start IV fluids.", "", "true", "", "", "", "", "", "", ""],
    ["select_one perform_secondary_survey", "perform_secondary_survey", "20. Perform a secondary survey; consider and treat causes of cardiopulmonary arrest.", "", "true", "", "", "", "", "", "", ""],
    ["select_one recovery_position", "recovery_position", "21. Place patient in recovery position.", "", "true", "", "", "", "", "", "", ""],
    [
      "calculate",
      "maternal_resuscitation_score",
      "Score",
      "",
      "",
      "",
      "",
      "",
      "",
      "round(((${safety_assessement}='yes')+(${check_response}='yes')+(${shout_for_help_003}='yes')+(${initiate_cpr_001}='yes')+(${debrief_or_assign_tasks}='yes')+(${offer_leadership}='yes')+(${assess}='yes')+(${head_titl_chin_lift}='yes')+(${jaw_thrust}='yes')+(${maintain_airway}='yes')+(${identify_cpr_lormarks}='yes')+(${demo_cpr}='yes')+(${_30_2_cpr}='yes')+(${reassess_breathing}='yes')+(${_2min_exchanges_cpr}='yes')+(${perimotem_cs}='yes')+(${O2_recovery_room}='yes')+(${assess_circulation_inverted_j}='yes')+(${IV_fluids}='yes')+(${perform_secondary_survey}='yes')+(${recovery_position}='yes'))*100 div 21,0)",
      "",
      ""
    ],
    [
      "note",
      "maternal_resuscitation_pass",
      "*Congratulations! Your score is **[${maternal_resuscitation_score}%]**. You have fulfilled the requirements for this skill!*",
      "",
      "",
      "",
      "",
      "${maternal_resuscitation_score} >= 84.5 and ${recovery_position}!=''",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "maternal_resuscitation_fail",
      "*Sorry! Your score is **[${maternal_resuscitation_score}%]**. Please review the relevant material or content, then try again.*",
      "",
      "",
      "",
      "",
      "${maternal_resuscitation_score} < 84.5 and ${recovery_position}!=''",
      "",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", "", "", ""]
  ];
  return rows;
}

/**
 * Section 2b: Cervical Tear Repair checklist + score.
 */
function getMoHSACCervicalTearRows_() {
  var rows = [
    [
      "begin_group",
      "group_cervical_tear",
      "Section 2b: Cervical Tear Repair",
      "",
      "true",
      "",
      "",
      "${skill_evaluation} = 'Cervical_tear_repair'",
      "",
      "",
      "",
      ""
    ],
    ["note", "case_scenario_cervicaltear", "***Case Scenario:*** *You are called to examine a patient with PPH. On examination, the uterus is well contracted, and the placenta was successfully delivered and complete. You confirm a cervical tear. Using the mannequin provided, demonstrate how to locate and repair a cervical tear.*", "", "false", "", "", "", "", "", "", ""],
    ["select_one obtain_consent", "obtain_consent_011", "1. Briefly explain the procedure to the mother and obtain consent.", "", "true", "", "", "", "", "", "", ""],
    ["select_one drape_in_place3", "drape_in_place3", "2. Ensure blood collection drape is in situ.", "", "true", "", "", "", "", "", "", ""],
    ["select_one analgesics_antibiotics", "analgesics_antibiotics_001", "3. Give analgesics and antibiotics.", "", "true", "", "", "", "", "", "", ""],
    ["select_one lithotomy_position", "lithotomy_position_002", "4. Place the woman in high lithotomy position.", "", "true", "", "", "", "", "", "", ""],
    ["select_one clean_perinuem", "clean_perinuem_002", "5. Clean the perineum, vulva, and vagina with antiseptic.", "", "true", "", "", "", "", "", "", ""],
    ["select_one empty_bladder", "empty_bladder_003", "6. Insert a catheter to empty the bladder.", "", "true", "", "", "", "", "", "", ""],
    ["select_one regional_anesthesia_sedation", "regional_anesthesia_sedation", "7. Administer regional anaesthesia/sedation (ketamine hydrochloride and diazepam).", "", "true", "", "", "", "", "", "", ""],
    ["select_one tear_examination", "tear_examination", "8. Examine clockwise periurethral area, perineum, vaginal opening, vagina, and cervix.", "", "true", "", "", "", "", "", "", ""],
    ["select_one apply_local_anesthetic", "apply_local_anesthetic", "9. Identify the cervical tear and apply local anaesthetic agent.", "", "true", "", "", "", "", "", "", ""],
    ["select_one grasp_cervix_oneside", "grasp_cervix_oneside", "10. Grasp the cervix on one side of the tear with sponge forceps.", "", "true", "", "", "", "", "", "", ""],
    ["select_one grasp_otherside_of_cervix", "grasp_otherside_of_cervix", "11. Grasp the other side of the cervical tear with a second sponge forceps.", "", "true", "", "", "", "", "", "", ""],
    ["select_one locate_tip_of_cervix", "locate_tip_of_cervix", "12. Gently pull the cervix and rotate the sponge forceps to make sure that the tip of the tear is located.", "", "true", "", "", "", "", "", "", ""],
    ["select_one place_both_forceps_in_one_hand", "place_both_forceps_in_one_hor", "13. After identifying the tip of the cervical tear, place both forceps in one hand.", "", "true", "", "", "", "", "", "", ""],
    ["select_one placement_1st_suture", "placement_1st_suture", "14. Place first suture above the tip (1 cm above) of the tear and then place 2 more continuous sutures.", "", "true", "", "", "", "", "", "", ""],
    ["select_one place_continous_suture", "place_continous_suture", "15. Use continuous sutures to complete repair.", "", "true", "", "", "", "", "", "", ""],
    ["select_one theatre_if_no_hemostasis", "theatre_if_no_hemostasis", "16. If haemostasis is not achieved, take the patient to theatre.", "", "true", "", "", "", "", "", "", ""],
    ["select_one message_to_mother", "message_to_mother_011", "17. Explain the results of the procedure to the mother.", "", "true", "", "", "", "", "", "", ""],
    ["select_one document_results3", "document_results3", "18. Document results and blood monitoring chart.", "", "true", "", "", "", "", "", "", ""],
    [
      "calculate",
      "cervical_tear_score",
      "Score",
      "",
      "",
      "",
      "",
      "",
      "",
      "round(((${obtain_consent_011}='yes')+(${drape_in_place3}='yes')+(${analgesics_antibiotics_001}='yes')+(${lithotomy_position_002}='yes')+(${clean_perinuem_002}='yes')+(${empty_bladder_003}='yes')+(${regional_anesthesia_sedation}='yes')+(${tear_examination}='yes')+(${apply_local_anesthetic}='yes')+(${grasp_cervix_oneside}='yes')+(${grasp_otherside_of_cervix}='yes')+(${locate_tip_of_cervix}='yes')+(${place_both_forceps_in_one_hor}='yes')+(${placement_1st_suture}='yes')+(${place_continous_suture}='yes')+(${theatre_if_no_hemostasis}='yes')+(${message_to_mother_011}='yes')+(${document_results3}='yes'))*100 div 18,0)",
      "",
      ""
    ],
    [
      "note",
      "cervical_tear_pass",
      "*Congratulations! Your score is **[${cervical_tear_score}%]**. You have fulfilled the requirements for this skill!*",
      "",
      "",
      "",
      "",
      "${cervical_tear_score} >= 84.5 and ${document_results3}!=''",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "cervical_tear_fail",
      "*Sorry! Your score is **[${cervical_tear_score}%]**. Please review the relevant material or content, then try again.*",
      "",
      "",
      "",
      "",
      "${cervical_tear_score} < 84.5 and ${document_results3}!=''",
      "",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", "", "", ""]
  ];
  return rows;
}

/**
 * Section 2b: Bimanual Uterine Compression checklist + score.
 */
function getMoHSACBimanualCompressionRows_() {
  var rows = [
    [
      "begin_group",
      "group_bimanual_compressions",
      "Section 2b: Bimanual Uterine Compression",
      "",
      "true",
      "",
      "",
      "${skill_evaluation} = 'Bimanual_uterine_compression'",
      "",
      "",
      "",
      ""
    ],
    ["note", "case_scenario_bimanualuterine", "***Case Scenario:*** *You are managing PPH and you have used all the available options, but the uterus is still not contracted. You have decided to perform bimanual uterine compression as a remedy. Give a running commentary as you perform the procedure.*", "", "false", "", "", "", "", "", "", ""],
    ["select_one shout_for_help", "shout_for_help_004", "1. Shout for help.", "", "true", "", "", "", "", "", "", ""],
    ["select_one obtain_consent", "obtain_consent_012", "2. Briefly explain the procedure to the mother depending on the client’s condition and obtain consent.", "", "true", "", "", "", "", "", "", ""],
    ["select_one hand_hygiene", "hor_hygiene", "3. Perform hand hygiene and put on gynecological gloves (double gloving).", "", "true", "", "", "", "", "", "", ""],
    ["select_one vaginal_exam", "vaginal_exam_002", "4. Perform a vaginal examination.", "", "true", "", "", "", "", "", "", ""],
    ["select_one insert_whole_hand", "insert_whole_hor", "5. Insert the whole hand into the vagina.", "", "true", "", "", "", "", "", "", ""],
    ["select_one identify_anterior_fornix", "identify_anterior_fornix", "6. With the hand in the vagina, identify the anterior fornix.", "", "true", "", "", "", "", "", "", ""],
    ["select_one fist_thumb_outside", "fist_thumb_outside", "7. Form a fist with the thumb outside.", "", "true", "", "", "", "", "", "", ""],
    ["select_one fist_on_anterior_wall", "fist_on_anterior_wall", "8. Place the fist in the anterior wall of the uterus.", "", "true", "", "", "", "", "", "", ""],
    ["select_one pressure_posterior_wall", "pressure_posterior_wall", "9. With the other hand on the suprapubic area, press deeply into the abdomen behind the uterus, applying pressure against the posterior wall of the uterus.", "", "true", "", "", "", "", "", "", ""],
    ["select_one pressure_until_hemostasis", "pressure_until_hemostasis", "10. Maintain pressure until bleeding is controlled and the uterus contracts while continuing to resuscitate the mother.", "", "true", "", "", "", "", "", "", ""],
    ["select_one message_to_mother", "message_to_mother_012", "11. Explain to the mother the results of the procedure and next steps.", "", "true", "", "", "", "", "", "", ""],
    [
      "calculate",
      "bimanual_compressions_score",
      "Score",
      "",
      "",
      "",
      "",
      "",
      "",
      "round(((${shout_for_help_004}='yes')+(${obtain_consent_012}='yes')+(${hor_hygiene}='yes')+(${vaginal_exam_002}='yes')+(${insert_whole_hor}='yes')+(${identify_anterior_fornix}='yes')+(${fist_thumb_outside}='yes')+(${fist_on_anterior_wall}='yes')+(${pressure_posterior_wall}='yes')+(${pressure_until_hemostasis}='yes')+(${message_to_mother_012}='yes'))*100 div 11,0)",
      "",
      ""
    ],
    [
      "note",
      "bimanual_compressions_pass",
      "*Congratulations! Your score is **[${bimanual_compressions_score}%]**. You have fulfilled the requirements for this skill!*",
      "",
      "",
      "",
      "",
      "${bimanual_compressions_score} >= 84.5 and ${message_to_mother_012}!=''",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "bimanual_compressions_fail",
      "*Sorry! Your score is **[${bimanual_compressions_score}%]**. Please review the relevant material or content, then try again.*",
      "",
      "",
      "",
      "",
      "${bimanual_compressions_score} < 84.5 and ${message_to_mother_012}!=''",
      "",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", "", "", ""]
  ];
  return rows;
}

/**
 * Section 2b: Compression of Abdominal Aorta checklist + score.
 */
function getMoHSACAorticCompressionRows_() {
  var rows = [
    [
      "begin_group",
      "group_aortic_compression",
      "Section 2b: Compression of Abdominal Aorta",
      "",
      "false",
      "",
      "",
      "${skill_evaluation} = 'Compression_of_abdominal_aorta'",
      "",
      "",
      "",
      ""
    ],
    ["note", "case_scenario_abdominalaorta", "***Case Scenario:*** *You are managing PPH, and you have used all the options available, but the uterus is still not contracted. You have decided to perform Compression of Abdominal Aorta as a remedy, give a running commentary as you perform the procedure.*", "", "false", "", "", "", "", "", "", ""],
    ["select_one shout_for_help", "shout_for_help_005", "1. Shout for help.", "", "true", "", "", "", "", "", "", ""],
    ["select_one obtain_consent", "obtain_consent_013", "2. Briefly explain the procedure to the mother depending on the client’s condition and obtain informed consent.", "", "true", "", "", "", "", "", "", ""],
    ["select_one v_drape2", "v_drape2", "3. Place the calibrated blood collection drape.", "", "true", "", "", "", "", "", "", ""],
    ["select_one locate_femoral_pulse", "locate_femoral_pulse", "4. Locate the femoral pulse.", "", "true", "", "", "", "", "", "", ""],
    ["select_one fist_placement", "fist_placement", "5. Place a closed fist above the umbilicus, slightly to the patient’s left.", "", "true", "", "", "", "", "", "", ""],
    ["select_one apply_down_pressure", "apply_down_pressure", "6. Apply downward pressure through the abdominal wall to the abdominal aorta.", "", "true", "", "", "", "", "", "", ""],
    ["select_one femoral_pulse_check", "femoral_pulse_check", "7. With the other hand, palpate the femoral pulse to check the adequacy of the compression.", "", "true", "", "", "", "", "", "", ""],
    ["select_one adequacy_of_compression", "adequacy_of_compression", "8. Check if the pulse is present or not. If the pulse is present, then the compression is inadequate. If the pulse is not palpable, the compression is adequate.", "", "true", "", "", "", "", "", "", ""],
    ["select_one compression_until_hemostasis", "compression_until_hemostasis", "9. Maintain compression until the bleeding is controlled or the patient reaches the operating table.", "", "true", "", "", "", "", "", "", ""],
    ["select_one message_to_mother", "message_to_mother_013", "10. Explain to the mother the results of the procedure and next steps.", "", "true", "", "", "", "", "", "", ""],
    [
      "calculate",
      "aortic_compression_score",
      "Score",
      "",
      "",
      "",
      "",
      "",
      "",
      "round(((${shout_for_help_005}='yes')+(${obtain_consent_013}='yes')+(${v_drape2}='yes')+(${locate_femoral_pulse}='yes')+(${fist_placement}='yes')+(${apply_down_pressure}='yes')+(${femoral_pulse_check}='yes')+(${adequacy_of_compression}='yes')+(${compression_until_hemostasis}='yes')+(${message_to_mother_013}='yes'))*100 div 10,0)",
      "",
      ""
    ],
    [
      "note",
      "aortic_compression_pass",
      "*Congratulations! Your score is **[${aortic_compression_score}%]**. You have fulfilled the requirements for this skill!*",
      "",
      "",
      "",
      "",
      "${aortic_compression_score} >= 84.5 and ${message_to_mother_013}!=''",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "aortic_compression_fail",
      "*Sorry! Your score is **[${aortic_compression_score}%]**. Please review the relevant material or content, then try again.*",
      "",
      "",
      "",
      "",
      "${aortic_compression_score} < 84.5 and ${message_to_mother_013}!=''",
      "",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", "", "", ""]
  ];
  return rows;
}

/**
 * Section 2b: Management of Preeclampsia or Eclampsia checklist + score.
 */
function getMoHSACHipRows_() {
  var rows = [
    [
      "begin_group",
      "group_hip",
      "Section 2b: Management of Preeclampsia or Eclampsia",
      "",
      "false",
      "",
      "",
      "${skill_evaluation} = 'Preeclampsia_/_Eclampsia'",
      "",
      "",
      "",
      ""
    ],
    ["note", "case_scenario_preeclampsia", "***Case Scenario:*** *Mrs. B presented to you at 37 weeks with severe headache unrelieved by analgesics and epigastric pains. Blood pressure 172/115 mmHg and 2+ protein on dipstick. RR 26 bpm. You are called to manage the patient.*", "", "false", "", "", "", "", "", "", ""],
    ["select_one diagnosis", "diagnosis", "1. Asks, “What is your diagnosis based on the scenario given?”\n Expected answer: Severe preeclampsia at 37 weeks’ gestation.", "", "true", "", "", "", "", "", "", ""],
    ["select_one management_principles", "management_principles", "2. Asks, \"What are the principles of managing this condition?\"\n Expected answers:\n • Prevent and treat fits\n • Blood pressure control\n • Fluid management\n • Delivery\n • Management of complications\n Says, “Now manage the patient.”", "", "true", "", "", "", "", "", "", ""],
    ["select_one explain_to_mother", "explain_to_mother", "3. Briefly explains to the mother the diagnosis and management.", "", "true", "", "", "", "", "", "", ""],
    ["select_one handwashing_and_start", "horwashing_or_start", "4. Washes hands with soap and water or uses alcohol hand rub. Says, “Start with preventing fit, use the IV regimen.”", "", "true", "", "", "", "", "", "", ""],
    ["select_one fix_iv_line", "fix_iv_line", "5. Fixes an IV line. Says, “Fix the IV.”", "", "true", "", "", "", "", "", "", ""],
    ["select_one mgso4_preparation", "mgso4_preparation", "6. In presence of infusion, draws up MgSO₄ 50% solution 4 g (1 g/2 mL × 4 ampoules) and adds to 12 mL of water for injection or normal saline to make 20 mL of 20% solution. GIVE PARENTERAL ANTIHYPERTENSIVE.", "", "true", "", "", "", "", "", "", ""],
    ["select_one iv_loading_dose", "iv_loading_dose", "7. Gives a loading dose of MgSO₄ 4 g IV 20% slow intravenously. Says, “Inject slowly.”", "", "true", "", "", "", "", "", "", ""],
    ["select_one duration_mgso4_bolus", "duration_mgso4_bolus", "8. Asks, “For how long will you give the bolus?”\n Expected answer: For 15–20 minutes.", "", "true", "", "", "", "", "", "", ""],
    ["select_one dosage_duration", "dosage_duration", "9. Asks, “For how long will you continue to give magnesium sulfate?”\n Expected answer: Give maintenance dose of 1 g/hour.", "", "true", "", "", "", "", "", "", ""],
    ["select_one maintenance_dose_duration", "maintenance_dose_duration", "10. Asks, “For how long will you give maintenance dose?”\n Expected answer: Up to 24 hours from last fit or delivery, whichever comes last.", "", "true", "", "", "", "", "", "", ""],
    ["select_one dosing_iv_im", "dosing_iv_im", "11. Asks, “How would you have given the combined IV and IM regimen?”\n Expected answer:\n \n IM Regimen \n • Loading dose: Initially 4 g of 20% MgSO₄ IV bolus dose, immediately followed by 10 g of 50% MgSO₄ IM (5 g each buttock) \n • If a convulsion persists after 15 minutes: 2 g of 20% MgSO₄ IV bolus over 5 minutes \n • Maintenance dose: 5 g of 50% MgSO₄ IM 4 hourly in alternate buttocks up to 24 hours from delivery or last fit, whichever comes last \n \n IV Regimen \n • Loading dose: Initially MgSO₄ 4 g is given as IV bolus \n • If convulsion persists after 15 minutes: 2 g of 20% MgSO₄ IV bolus over 5 minutes \n • Maintenance dose: 1 g/hour intravenous infusion up to 24 hours after the last convulsion", "", "true", "", "", "", "", "", "", ""],
    ["note", "patient_convulsing", "***Enumerator Note:*** *After one hour a relative calls: “Help, Mrs B is having a convulsion, we do not know what to do.”*", "", "false", "", "", "", "", "", "", ""],
    ["select_one eclampsia_diagnosis", "eclampsia_diagnosis", "12. Ask: “What is the most likely diagnosis now?”\n Expected answer: Eclampsia.", "", "true", "", "", "", "", "", "", ""],
    ["select_one assess_for_danger", "assess_for_danger", "13. Assess for danger and response. Call for help.\n Says: “No one is available, what would you do next to care for her?”", "", "true", "", "", "", "", "", "", ""],
    ["select_one toxicity_monitoring", "toxicity_monitoring", "14. Check airway and breathing. Says respiration 26/minute. Start oxygen at 4–6 litres/minute. If they do not verbalize, ask for rate.", "", "true", "", "", "", "", "", "", ""],
    ["select_one left_lateral_tilt_position", "left_lateral_tilt_position", "15. Turn the woman into LEFT LATERAL TILT.", "", "true", "", "", "", "", "", "", ""],
    ["select_one airway_protection", "airway_protection", "16. Do not attempt to place an object in the mouth.", "", "true", "", "", "", "", "", "", ""],
    ["select_one convulsions_controlled", "convulsions_controlled", "17. Says: she has stopped convulsing now. Checks blood pressure 152/112.", "", "true", "", "", "", "", "", "", ""],
    ["select_one _80mls_hr_infusion", "_80mls_hr_infusion", "18. States and simulates that s/he will start an infusion of normal saline or Ringer’s lactate at a rate of 1 ml/kg/hour (80 mL/hour).", "", "true", "", "", "", "", "", "", ""],
    ["select_one managing_recurrent_seizures", "managing_recurrent_seizures", "19. Ask: what will you give if a convulsion recurs?\n Expected answer: Prepare and give MgSO₄ 20% solution 2–4 g IV bolus over 15 minutes depending on whether weight is more or less than 70 kg.", "", "true", "", "", "", "", "", "", ""],
    ["select_one monitoring_before_next_dose", "monitoring_before_next_dose", "20. Asks: what will you check before giving the next dose of MgSO₄ to be sure she is not having MgSO₄ toxicity?\n Expected answer:\n • Respiratory rate <16 \n • Absent patella reflexes \n • Urine output less than 30 mL per hour over 4 hours", "", "true", "", "", "", "", "", "", ""],
    ["select_one first_signs_mgso4_toxicity", "first_signs_mgso4_toxicity", "21. Asks: what are the first signs of MgSO₄ toxicity?\n Expected answer: Loss of patella reflexes.", "", "true", "", "", "", "", "", "", ""],
    ["select_one mgso4_toxicity_checks", "mgso4_toxicity_checks", "22. Asks: how often will you check for MgSO₄ toxicity?\n Expected answer: Every hour.", "", "true", "", "", "", "", "", "", ""],
    ["select_one mgso4_antidote", "mgso4_antidote", "23. Asks: what is the antidote and dose for MgSO₄ toxicity?\n Expected answer: Calcium gluconate 10% 1 g (10 mL) IV slowly over 10 minutes.", "", "true", "", "", "", "", "", "", ""],
    [
      "calculate",
      "hip_score",
      "Score",
      "",
      "",
      "",
      "",
      "",
      "",
      "round(((${diagnosis}='yes')+(${management_principles}='yes')+(${explain_to_mother}='yes')+(${horwashing_or_start}='yes')+(${fix_iv_line}='yes')+(${mgso4_preparation}='yes')+(${iv_loading_dose}='yes')+(${duration_mgso4_bolus}='yes')+(${dosage_duration}='yes')+(${maintenance_dose_duration}='yes')+(${dosing_iv_im}='yes')+(${patient_convulsing}='yes')+(${eclampsia_diagnosis}='yes')+(${assess_for_danger}='yes')+(${toxicity_monitoring}='yes')+(${left_lateral_tilt_position}='yes')+(${airway_protection}='yes')+(${convulsions_controlled}='yes')+(${_80mls_hr_infusion}='yes')+(${managing_recurrent_seizures}='yes')+(${monitoring_before_next_dose}='yes')+(${first_signs_mgso4_toxicity}='yes')+(${mgso4_toxicity_checks}='yes')+(${mgso4_antidote}='yes'))*100 div 23,0)",
      "",
      ""
    ],
    [
      "note",
      "hip_pass",
      "*Congratulations! Your score is **[${hip_score}%]**. You have fulfilled the requirements for this skill!*",
      "",
      "",
      "",
      "",
      "${hip_score} >= 84.5 and ${mgso4_antidote}!=''",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "hip_fail",
      "*Sorry! Your score is **[${hip_score}%]**. Please review the relevant material or content, then try again.*",
      "",
      "",
      "",
      "",
      "${hip_score} < 84.5 and ${mgso4_antidote}!=''",
      "",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", "", "", ""]
  ];
  return rows;
}

/**
 * Section 2b: Uterine Inversion checklist + score.
 */
function getMoHSACUterineInversionRows_() {
  var rows = [
    [
      "begin_group",
      "group_Uterine_inversion",
      "Section 2b: Uterine Inversion",
      "",
      "",
      "",
      "",
      "${skill_evaluation} = 'Uterine_inversion'",
      "",
      "",
      "",
      ""
    ],
    ["note", "case_scenario_uterineinversion", "***Case scenario:*** *You are on duty and have been informed by the midwife that while she was trying to deliver the placenta, the patient complains of very severe lower abdominal pain and a feeling of fullness inside the vagina. On abdominal examination, the uterine fundus is not palpable and the placenta is not yet separated. Currently, the patient has only minimal bleeding.*", "", "", "", "", "", "", "", "", ""],
    ["select_one shout_for_help", "shout_for_help", "1. Shouts for help.", "", "true", "", "", "", "", "", "", ""],
    ["select_one blood_monitoring_drape", "blood_monitoring_drape", "2. Places blood monitoring drape.", "", "true", "", "", "", "", "", "", ""],
    ["select_one emergency_team_roles", "emergency_team_roles", "3. Assembles the emergency team and assigns roles.", "", "true", "", "", "", "", "", "", ""],
    ["select_one rapid_initial_assessment", "rapid_initial_assessment", "4. Performs a quick survey.", "", "true", "", "", "", "", "", "", ""],
    ["select_one ensure_patient_privacy", "ensure_patient_privacy", "5. Ensures privacy.", "", "true", "", "", "", "", "", "", ""],
    ["select_one explain_procedure_mother1", "explain_procedure_mother1", "6. Explains the procedure to the mother.", "", "true", "", "", "", "", "", "", ""],
    ["select_one obtain_informed_consent1", "obtain_informed_consent1", "7. Obtains informed consent.", "", "true", "", "", "", "", "", "", ""],
    ["select_one assess_blood_loss", "assess_blood_loss", "8. Assesses blood loss.", "", "true", "", "", "", "", "", "", ""],
    ["select_one assess_abcs_resuscitate1", "assess_abcs_resuscitate1", "9. Quickly assesses ABCs and resuscitates as necessary.", "", "true", "", "", "", "", "", "", ""],
    ["select_one stop_uterotonic_drugs", "stop_uterotonic_drugs", "10. Discontinues uterotonic drugs if any.", "", "true", "", "", "", "", "", "", ""],
    ["select_one insert_iv_cannulae", "insert_iv_cannulae", "11. Insert 2 wide-bore cannulae (gauge 16 or 18).", "", "true", "", "", "", "", "", "", ""],
    ["select_one collect_blood_samples1", "collect_blood_samples1", "12. Take blood for FHG, U/E/CR, GXM, and coagulation profile.", "", "true", "", "", "", "", "", "", ""],
    ["select_one start_crystalloid_infusion", "start_crystalloid_infusion", "13. Start infusion of crystalloids: normal saline or Ringer’s lactate.", "", "true", "", "", "", "", "", "", ""],
    ["select_one insert_urinary_catheter", "insert_urinary_catheter", "14. Insert a Foley’s catheter and empty bladder.", "", "true", "", "", "", "", "", "", ""],
    ["select_one administer_analgesics_antibiotics", "administer_analgesics_antibiotics", "15. Administers analgesics and antibiotics:\n  • Ampicillin 2 g IV, or\n  • Cefazolin 1 g IV, or\n  • Ceftriaxone 2 g IV, plus\n  • Metronidazole 500 mg IV.", "", "true", "", "", "", "", "", "", ""],
    ["select_one hand_hygiene_ppe", "hor_hygiene_ppe", "16. Perform hand hygiene, wear PPE (personal protective equipment), and put on gynecological gloves.", "", "true", "", "", "", "", "", "", ""],
    ["select_one replace_uterine_fundus", "replace_uterine_fundus", "17. Replace the uterine fundus to its correct position.", "", "true", "", "", "", "", "", "", ""],
    ["select_one remove_retained_placenta", "remove_retained_placenta", "18. Manually remove the placenta or any remaining bits of the placenta.", "", "true", "", "", "", "", "", "", ""],
    ["select_one start_oxytocin_infusion", "start_oxytocin_infusion", "19. Commence oxytocin infusion after successful removal of the placenta – oxytocin 20 units in 1 L of normal saline to run over 4 hours.", "", "true", "", "", "", "", "", "", ""],
    ["select_one examine_repair_tears", "examine_repair_tears", "20. Examine the cervix, vagina, and perineum for any tears and repair accordingly.", "", "true", "", "", "", "", "", "", ""],
    ["select_one monitor_vitals_bleeding", "monitor_vitals_bleeding", "21. Monitor uterine tone, per vaginal bleeding, and vital signs every 15 minutes for the first 2 hours, then every 30 minutes for the next 4 hours.", "", "true", "", "", "", "", "", "", ""],
    ["select_one explain_procedure_results", "explain_procedure_results", "22. Explain to the mother the results of the procedure.", "", "true", "", "", "", "", "", "", ""],
    ["select_one prepare_operating_theatre", "prepare_operating_theatre", "23. The patient should be taken promptly to the operating room, and surgical correction of the inversion under spinal or general anaesthesia should be done.", "", "true", "", "", "", "", "", "", ""],
    ["select_one inform_client_outcomes", "inform_client_outcomes", "24. Inform client on the outcomes.", "", "true", "", "", "", "", "", "", ""],
    ["select_one document_blood_loss", "document_blood_loss", "25. Document blood loss/procedure in the blood monitoring chart.", "", "true", "", "", "", "", "", "", ""],
    [
      "calculate",
      "uterine_inversion_score",
      "Score",
      "",
      "",
      "",
      "",
      "",
      "",
      "round(((${shout_for_help}='yes')+(${blood_monitoring_drape}='yes')+(${emergency_team_roles}='yes')+(${rapid_initial_assessment}='yes')+(${ensure_patient_privacy}='yes')+(${explain_procedure_mother1}='yes')+(${obtain_informed_consent1}='yes')+(${assess_blood_loss}='yes')+(${assess_abcs_resuscitate1}='yes')+(${stop_uterotonic_drugs}='yes')+(${insert_iv_cannulae}='yes')+(${collect_blood_samples1}='yes')+(${start_crystalloid_infusion}='yes')+(${insert_urinary_catheter}='yes')+(${administer_analgesics_antibiotics}='yes')+(${hor_hygiene_ppe}='yes')+(${replace_uterine_fundus}='yes')+(${remove_retained_placenta}='yes')+(${start_oxytocin_infusion}='yes')+(${examine_repair_tears}='yes')+(${monitor_vitals_bleeding}='yes')+(${explain_procedure_results}='yes')+(${prepare_operating_theatre}='yes')+(${inform_client_outcomes}='yes')+(${document_blood_loss}='yes'))*100 div 25,0)",
      "",
      ""
    ],
    [
      "note",
      "uterine_inversion_pass",
      "*Congratulations! Your score is **[${uterine_inversion_score}%]**. You have fulfilled the requirements for this skill!*",
      "",
      "",
      "",
      "",
      "${uterine_inversion_score} >= 84.5 and ${document_blood_loss}!=''",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "uterine_inversion_fail",
      "*Sorry! Your score is **[${uterine_inversion_score}%]**. Please review the relevant material or content, then try again.*",
      "",
      "",
      "",
      "",
      "${uterine_inversion_score} < 84.5 and ${document_blood_loss}!=''",
      "",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", "", "", ""]
  ];
  return rows;
}

/**
 * Section 2b: EMOTIVE checklist + score.
 */
function getMoHSACEmotiveRows_() {
  var rows = [
    [
      "begin_group",
      "group_emotive",
      "Section 2b: EMOTIVE",
      "",
      "",
      "",
      "",
      "${skill_evaluation} = 'EMOTIVE'",
      "",
      "",
      "",
      ""
    ],
    ["note", "case_scenario_emotive", "***Case scenario:*** *Nancy is a para 3+0 now. She has just successfully delivered a live male infant who scored 10/10 at 1 and 5 minutes. The placenta was successfully delivered and is complete. She has a history of prolonged labour.*", "", "", "", "", "", "", "", "", ""],
    ["select_one shout_assemble_team", "shout_assemble_team", "1. Shouts for help, quickly assembles the emergency team and asks for the PPH kit (help will be from the other mentees).", "", "true", "", "", "", "", "", "", ""],
    ["select_one assign_team_roles", "assign_team_roles", "2. The team lead assigns individual team members a role.", "", "true", "", "", "", "", "", "", ""],
    ["select_one reassure_explain_mother", "reassure_explain_mother", "3. The team leader reassures the mother and briefly explains what is going on as the other team members continue emergency management.", "", "true", "", "", "", "", "", "", ""],
    ["select_one check_bleeding_amount", "check_bleeding_amount", "4. Checks bleeding and amount of blood lost in the drape (“Keep bleeding steady, there is 500 mL in the drape”).", "", "true", "", "", "", "", "", "", ""],
    ["select_one assess_abcs_resuscitate", "assess_abcs_resuscitate", "5. Quickly assesses ABCs and resuscitates as necessary (“What will you do next?”).", "", "true", "", "", "", "", "", "", ""],
    ["select_one trigger_first_bundle", "trigger_first_bundle", "6. Triggers the first response bundle.", "", "true", "", "", "", "", "", "", ""],
    ["select_one trigger_uterus_massage", "trigger_uterus_massage", "7. Triggers the bundle – massages the uterus.", "", "true", "", "", "", "", "", "", ""],
    ["select_one check_bladder_catheter", "check_bladder_catheter", "8. Checks the bladder and catheterizes.", "", "true", "", "", "", "", "", "", ""],
    ["select_one insert_iv_cannulas", "insert_iv_cannulas", "9. Asks the assistant OR inserts 2 wide-bore cannulas.", "", "true", "", "", "", "", "", "", ""],
    ["select_one collect_blood_samples", "collect_blood_samples", "10. Asks the assistant/collects blood samples: complete blood count, grouping and cross-match (GXM), U/E/C, coagulation profile.", "", "true", "", "", "", "", "", "", ""],
    ["select_one infuse_oxytocin", "infuse_oxytocin", "11. Infuses 10 IU oxytocin in 500 mL of crystalloid over 10 minutes or as fast as possible; 20 IU oxytocin in 1 litre of crystalloid to run over 4 hours.", "", "true", "", "", "", "", "", "", ""],
    ["select_one administer_misoprostol", "administer_misoprostol", "12. Asks the assistant OR administers 800 µg misoprostol sublingually.", "", "true", "", "", "", "", "", "", ""],
    ["select_one administer_tranexamic_acid", "administer_tranexamic_acid", "13. Asks the assistant OR administers 1 g TXA at the rate of 1 mL per minute over 10 minutes.", "", "true", "", "", "", "", "", "", ""],
    ["select_one give_iv_fluids", "give_iv_fluids", "14. Gives IV fluids if clinically indicated.", "", "true", "", "", "", "", "", "", ""],
    ["select_one recheck_uterus", "recheck_uterus", "15. Asks the assistant/rechecks the uterus (“Say uterus is well contracted”).", "", "true", "", "", "", "", "", "", ""],
    ["select_one check_for_tears", "check_for_tears", "16. Asks the assistant/checks for tears (“If the mentee checks, say, ‘There are no tears’”).", "", "true", "", "", "", "", "", "", ""],
    ["select_one check_placenta_completeness", "check_placenta_completeness", "17. Asks the assistant/checks the placenta for completeness (“Say the placenta is complete”).", "", "true", "", "", "", "", "", "", ""],
    ["select_one monitor_bleeding_vitals", "monitor_bleeding_vitals", "18. Once bleeding is controlled, monitors blood in drape, uterine tone, per vaginal bleeding, and vital signs (BP, pulse) every 15 minutes for the first 2 hours, then every 30 minutes for the next 4 hours.", "", "true", "", "", "", "", "", "", ""],
    ["select_one provide_respectful_care", "provide_respectful_care", "19. Provides respectful care and good communication.", "", "true", "", "", "", "", "", "", ""],
    ["select_one inform_mother_progress", "inform_mother_progress", "20. Informs the mother of the management progress.", "", "true", "", "", "", "", "", "", ""],
    ["select_one document_management_chart", "document_management_chart", "21. Documents the findings/management including the blood loss monitoring chart.", "", "true", "", "", "", "", "", "", ""],
    [
      "calculate",
      "emotive_score",
      "Score",
      "",
      "",
      "",
      "",
      "",
      "",
      "round(((${shout_assemble_team}='yes')+(${assign_team_roles}='yes')+(${reassure_explain_mother}='yes')+(${check_bleeding_amount}='yes')+(${assess_abcs_resuscitate}='yes')+(${trigger_first_bundle}='yes')+(${trigger_uterus_massage}='yes')+(${check_bladder_catheter}='yes')+(${insert_iv_cannulas}='yes')+(${collect_blood_samples}='yes')+(${infuse_oxytocin}='yes')+(${administer_misoprostol}='yes')+(${administer_tranexamic_acid}='yes')+(${give_iv_fluids}='yes')+(${recheck_uterus}='yes')+(${check_for_tears}='yes')+(${check_placenta_completeness}='yes')+(${monitor_bleeding_vitals}='yes')+(${provide_respectful_care}='yes')+(${inform_mother_progress}='yes')+(${document_management_chart}='yes'))*100 div 21,0)",
      "",
      ""
    ],
    [
      "note",
      "emotive_pass",
      "*Congratulations! Your score is **[${emotive_score}%]**. You have fulfilled the requirements for this skill!*",
      "",
      "",
      "",
      "",
      "${emotive_score} >= 84.5 and ${document_management_chart}!=''",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "emotive_fail",
      "*Sorry! Your score is **[${emotive_score}%]**. Please review the relevant material or content, then try again.*",
      "",
      "",
      "",
      "",
      "${emotive_score} < 84.5 and ${document_management_chart}!=''",
      "",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", "", "", ""]
  ];
  return rows;
}

/**
 * Section 2b: Partograph checklist + score.
 */
function getMoHSACPartographRows_() {
  var rows = [
    [
      "begin_group",
      "group_partograph",
      "Section 2b: Partograph",
      "",
      "",
      "",
      "",
      "${skill_evaluation} = 'Partograph'",
      "",
      "",
      "",
      ""
    ],
    ["note", "case_scenario_partograph", "***Case Scenario:*** *Francisca Atieno is a 16-year-old primigravida at 40 weeks’ gestation. She has been in labour at home for 8 hours before admission. Her membranes ruptured 6 hours before admission.*", "", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "table",
      "Partograph Table",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "field-list w3"
    ],
    ["note", "note", "Time", "", "", "", "", "", "", "", "", "w1"],
    ["note", "note_001", "Dilatation", "", "", "", "", "", "", "", "", "w1"],
    ["note", "note_002", "Contraction", "", "", "", "", "", "", "", "", "w1"],
    ["note", "note_003", "FHR", "", "", "", "", "", "", "", "", "w1"],
    ["note", "note_004", "Liquor", "", "", "", "", "", "", "", "", "w1"],
    ["note", "note_005", "Descent", "", "", "", "", "", "", "", "", "w1"],
    ["note", "note_006", "Moulding", "", "", "", "", "", "", "", "", "w1"],
    ["note", "note_007", "Pulse", "", "", "", "", "", "", "", "", "w1"],
    ["note", "note_008", "BP", "", "", "", "", "", "", "", "", "w1"],
    ["note", "note_009", "Temp", "", "", "", "", "", "", "", "", "w1"],
    ["end_group", "", "", "", "", "", "", "", "", "", "", ""],
    ["select_one explain_procedure_mother", "explain_procedure_mother", "1. Explains the procedure to the mother and birth companion.", "", "true", "", "", "", "", "", "", ""],
    ["select_one obtain_informed_consent", "obtain_informed_consent", "2. Obtains informed consent.", "", "true", "", "", "", "", "", "", ""],
    ["select_one decide_partograph_case", "decide_partograph_case", "3. Decides if case is for partograph or not based on dilatation correctly.", "", "true", "", "", "", "", "", "", ""],
    ["select_one plot_patient_biodata", "plot_patient_biodata", "4. Plots patient biodata and information correctly.", "", "true", "", "", "", "", "", "", ""],
    ["select_one plot_cervical_dilatation", "plot_cervical_dilatation", "5. Plots cervical dilatation correctly (and with correct symbol).", "", "true", "", "", "", "", "", "", ""],
    ["select_one plot_descent", "plot_descent", "6. Plots descent correctly (and with correct symbol).", "", "true", "", "", "", "", "", "", ""],
    ["select_one plot_fetal_heart", "plot_fetal_heart", "7. Plots fetal heart rate correctly (and with correct symbol).", "", "true", "", "", "", "", "", "", ""],
    ["select_one plot_amniotic_fluid", "plot_amniotic_fluid", "8. Plots amniotic fluid correctly (and with correct symbol).", "", "true", "", "", "", "", "", "", ""],
    ["select_one plot_moulding", "plot_moulding", "9. Plots moulding correctly (and with correct symbol).", "", "true", "", "", "", "", "", "", ""],
    ["select_one plot_contractions", "plot_contractions", "10. Plots contractions correctly (number and strength).", "", "true", "", "", "", "", "", "", ""],
    ["select_one plot_maternal_vitals", "plot_maternal_vitals", "11. Plots maternal vitals correctly.", "", "true", "", "", "", "", "", "", ""],
    ["select_one interpret_findings", "interpret_findings", "12. Makes interpretation correctly.", "", "true", "", "", "", "", "", "", ""],
    ["select_one explain_labour_progress", "explain_labour_progress", "13. Explains to the mother the progress of labour correctly.", "", "true", "", "", "", "", "", "", ""],
    ["select_one joint_decision_mother", "joint_decision_mother", "14. Makes joint decision with mother correctly.", "", "true", "", "", "", "", "", "", ""],
    ["select_one document_procedures", "document_procedures", "15. Documentation of all procedures.", "", "true", "", "", "", "", "", "", ""],
    [
      "calculate",
      "partograph_score",
      "Score",
      "",
      "",
      "",
      "",
      "",
      "",
      "round(((${explain_procedure_mother}='yes')+(${obtain_informed_consent}='yes')+(${decide_partograph_case}='yes')+(${plot_patient_biodata}='yes')+(${plot_cervical_dilatation}='yes')+(${plot_descent}='yes')+(${plot_fetal_heart}='yes')+(${plot_amniotic_fluid}='yes')+(${plot_moulding}='yes')+(${plot_contractions}='yes')+(${plot_maternal_vitals}='yes')+(${interpret_findings}='yes')+(${explain_labour_progress}='yes')+(${joint_decision_mother}='yes')+(${document_procedures}='yes'))*100 div 15,0)",
      "",
      ""
    ],
    [
      "note",
      "partograph_pass",
      "*Congratulations! Your score is **[${partograph_score}%]**. You have fulfilled the requirements for this skill!*",
      "",
      "",
      "",
      "",
      "${partograph_score} >= 84.5 and ${document_procedures}!=''",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "partograph_fail",
      "*Sorry! Your score is **[${partograph_score}%]**. Please review the relevant material or content, then try again.*",
      "",
      "",
      "",
      "",
      "${partograph_score} < 84.5 and ${document_procedures}!=''",
      "",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", "", "", ""]
  ];
  return rows;
}

/**
 * Close Section 2 and show thank-you note after any completed skill checklist.
 */
function getMoHSACSection2ClosingRows_() {
  return [
    ["end_group", "", "", "", "", "", "", "", "", "", "", ""], // close skills_assessment
    [
      "note",
      "Thank_you",
      "*The end. Thank you for completing this skills assessment checklist. The information you have provided will help track improvements in knowledge and skills and support continuous improvement of MENTORS activities.*",
      "",
      "false",
      "",
      "",
      "(${skill_evaluation}!='') and (${Document} != '' or ${other_managment} != '' or ${documentation} != '' or ${prepare_to_resuscitate} != '' or ${documentation_001} != '' or ${message_to_mother_003} != '' or ${document_procedure1} != '' or ${document_results} != '' or ${documentation_nnr} != '' or ${IV_antibiotics} != '' or ${document_results2} != '' or ${health_talk} != '' or ${recovery_position} != '' or ${document_results3} != '' or ${message_to_mother_012} != '' or ${message_to_mother_013} != '' or ${mgso4_antidote} != '' or ${document_blood_loss} != '' or ${document_management_chart} != '' or ${document_procedures} != '')",
      "",
      "",
      "",
      ""
    ]
  ];
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
    ["skill_evaluation", "AMTSL", "AMTSL", "mentors_curriculum,po_assessment,ifm_assessment"],
    ["skill_evaluation", "Assisted_breech_delivery", "Assisted breech delivery", "mentors_curriculum,po_assessment,ifm_assessment"],
    ["skill_evaluation", "Assisted_vaginal_vacuum_delivery", "Assisted vaginal vacuum delivery", "mentors_curriculum,po_assessment,ifm_assessment"],
    ["skill_evaluation", "B-LYNCH", "B-LYNCH", "mentors_curriculum,po_assessment,ifm_assessment"],
    ["skill_evaluation", "Bimanual_uterine_compression", "Bimanual uterine compression", "mentors_curriculum,po_assessment,ifm_assessment"],
    ["skill_evaluation", "Cervical_tear_repair", "Cervical tear repair", "mentors_curriculum,po_assessment,ifm_assessment"],
    ["skill_evaluation", "Compression_of_abdominal_aorta", "Compression of abdominal aorta", "mentors_curriculum,po_assessment,ifm_assessment"],
    ["skill_evaluation", "Cord_prolapse", "Cord prolapse", "mentors_curriculum,po_assessment,ifm_assessment"],
    ["skill_evaluation", "EMOTIVE", "EMOTIVE", "mentors_curriculum,po_assessment,ifm_assessment"],
    ["skill_evaluation", "Manual_removal_of_placenta", "Manual removal of placenta", "mentors_curriculum,po_assessment,ifm_assessment"],
    ["skill_evaluation", "Maternal_resuscitation", "Maternal resuscitation", "mentors_curriculum,po_assessment,ifm_assessment"],
    ["skill_evaluation", "Maternal_shock", "Maternal shock", "mentors_curriculum,po_assessment,ifm_assessment"],
    ["skill_evaluation", "NASG", "Non pneumatic anti-shock garment", "mentors_curriculum,po_assessment,ifm_assessment"],
    ["skill_evaluation", "Newborn_resuscitation", "Newborn resuscitation", "mentors_curriculum, newborn_curriculum,ifm_assessment,po_assessment,tot"],
    ["skill_evaluation", "Partograph", "Partograph", "mentors_curriculum,po_assessment,ifm_assessment"],
    ["skill_evaluation", "Perineal_repair", "Perineal repair", "mentors_curriculum,po_assessment,ifm_assessment"],
    ["skill_evaluation", "Preeclampsia_/_Eclampsia", "Preeclampsia/Eclampsia", "mentors_curriculum,po_assessment,ifm_assessment"],
    ["skill_evaluation", "Shoulder_dystocia", "Shoulder dystocia", "mentors_curriculum,po_assessment,ifm_assessment"],
    ["skill_evaluation", "UBT", "UBT", "mentors_curriculum,po_assessment,ifm_assessment"],
    ["skill_evaluation", "UBT_(free flow)", "UBT (free flow)", "mentors_curriculum,po_assessment,ifm_assessment"],
    ["skill_evaluation", "Uterine_inversion", "Uterine Inversion", "mentors_curriculum,po_assessment,ifm_assessment"]
  ];
}

/**
 * Authored skill checklist choices (yes/no + NNR multi-select labels).
 */
function getMoHSACAuthoredSkillChoices_() {
  return [
    ["v_drape", "yes", "Yes", ""],
    ["v_drape", "no", "No", ""],
    ["fhr_check", "yes", "Yes", ""],
    ["fhr_check", "no", "No", ""],
    ["unfold_v_drape", "yes", "Yes", ""],
    ["unfold_v_drape", "no", "No", ""],
    ["cord_cut", "yes", "Yes", ""],
    ["cord_cut", "no", "No", ""],
    ["health_messages", "yes", "Yes", ""],
    ["health_messages", "no", "No", ""],
    ["document_procedure1", "yes", "Yes", ""],
    ["document_procedure1", "no", "No", ""],
    ["document_results", "yes", "Yes", ""],
    ["document_results", "no", "No", ""],
    ["drape_in_place", "yes", "Yes", ""],
    ["drape_in_place", "no", "No", ""],
    ["document_results2", "yes", "Yes", ""],
    ["document_results2", "no", "No", ""],
    ["drape_in_place2", "yes", "Yes", ""],
    ["drape_in_place2", "no", "No", ""],
    ["drape_in_place3", "yes", "Yes", ""],
    ["drape_in_place3", "no", "No", ""],
    ["document_results3", "yes", "Yes", ""],
    ["document_results3", "no", "No", ""],
    ["v_drape2", "yes", "Yes", ""],
    ["v_drape2", "no", "No", ""],
    ["obtain_consent", "yes", "Yes", ""],
    ["obtain_consent", "no", "No", ""],
    ["sterile_gloves", "yes", "Yes", ""],
    ["sterile_gloves", "no", "No", ""],
    ["assemble_ubt", "yes", "Yes", ""],
    ["assemble_ubt", "no", "No", ""],
    ["hungon_drip_stand_valve_closed", "yes", "Yes", ""],
    ["hungon_drip_stand_valve_closed", "no", "No", ""],
    ["lithotomy_position", "yes", "Yes", ""],
    ["lithotomy_position", "no", "No", ""],
    ["clean_perinuem", "yes", "Yes", ""],
    ["clean_perinuem", "no", "No", ""],
    ["catheterize", "yes", "Yes", ""],
    ["catheterize", "no", "No", ""],
    ["drape_patient", "yes", "Yes", ""],
    ["drape_patient", "no", "No", ""],
    ["visualize_cervix_sims_speculum", "yes", "Yes", ""],
    ["visualize_cervix_sims_speculum", "no", "No", ""],
    ["stabilize_uterus", "yes", "Yes", ""],
    ["stabilize_uterus", "no", "No", ""],
    ["remove_speculum", "yes", "Yes", ""],
    ["remove_speculum", "no", "No", ""],
    ["insert_balloon", "yes", "Yes", ""],
    ["insert_balloon", "no", "No", ""],
    ["withdraw_forceps", "yes", "Yes", ""],
    ["withdraw_forceps", "no", "No", ""],
    ["prevent_expulsion_when_inflati", "yes", "Yes", ""],
    ["prevent_expulsion_when_inflati", "no", "No", ""],
    ["inflate_balloon", "yes", "Yes", ""],
    ["inflate_balloon", "no", "No", ""],
    ["inflate_until_equilibrium", "yes", "Yes", ""],
    ["inflate_until_equilibrium", "no", "No", ""],
    ["balloon_insitu_check_bleeding", "yes", "Yes", ""],
    ["balloon_insitu_check_bleeding", "no", "No", ""],
    ["determine_approp_bag_height", "yes", "Yes", ""],
    ["determine_approp_bag_height", "no", "No", ""],
    ["not_level_when_bleeding_stops", "yes", "Yes", ""],
    ["not_level_when_bleeding_stops", "no", "No", ""],
    ["observe_patient", "yes", "Yes", ""],
    ["observe_patient", "no", "No", ""],
    ["secure_tubing", "yes", "Yes", ""],
    ["secure_tubing", "no", "No", ""],
    ["antibiotics", "yes", "Yes", ""],
    ["antibiotics", "no", "No", ""],
    ["documentation_time_level", "yes", "Yes", ""],
    ["documentation_time_level", "no", "No", ""],
    ["continue_iv_fluids", "yes", "Yes", ""],
    ["continue_iv_fluids", "no", "No", ""],
    ["vital_signs", "yes", "Yes", ""],
    ["vital_signs", "no", "No", ""],
    ["when_to_remove", "yes", "Yes", ""],
    ["when_to_remove", "no", "No", ""],
    ["drain_balloon", "yes", "Yes", ""],
    ["drain_balloon", "no", "No", ""],
    ["remove_balloon_gently", "yes", "Yes", ""],
    ["remove_balloon_gently", "no", "No", ""],
    ["post_removal_monitoring", "yes", "Yes", ""],
    ["post_removal_monitoring", "no", "No", ""],
    ["activity_resumption", "yes", "Yes", ""],
    ["activity_resumption", "no", "No", ""],
    ["what_if_bleeing_resumes", "yes", "Yes", ""],
    ["what_if_bleeing_resumes", "no", "No", ""],
    ["referral", "yes", "Yes", ""],
    ["referral", "no", "No", ""],
    ["close_valve_in_transfer", "yes", "Yes", ""],
    ["close_valve_in_transfer", "no", "No", ""],
    ["Document", "yes", "Yes", ""],
    ["Document", "no", "No", ""],
    ["shout_for_help1", "yes", "Yes", ""],
    ["shout_for_help1", "no", "No", ""],
    ["insert_iv_lines", "yes", "Yes", ""],
    ["insert_iv_lines", "no", "No", ""],
    ["repeat_oxytocin", "yes", "Yes", ""],
    ["repeat_oxytocin", "no", "No", ""],
    ["empty_bladder", "yes", "Yes", ""],
    ["empty_bladder", "no", "No", ""],
    ["analgesics_antibiotics", "yes", "Yes", ""],
    ["analgesics_antibiotics", "no", "No", ""],
    ["wear_gynecological_gloves", "yes", "Yes", ""],
    ["wear_gynecological_gloves", "no", "No", ""],
    ["guide_hand_into_uterus", "yes", "Yes", ""],
    ["guide_hand_into_uterus", "no", "No", ""],
    ["locate_placenta_edge", "yes", "Yes", ""],
    ["locate_placenta_edge", "no", "No", ""],
    ["placenta_removal", "yes", "Yes", ""],
    ["placenta_removal", "no", "No", ""],
    ["cct", "yes", "Yes", ""],
    ["cct", "no", "No", ""],
    ["check_for_atony", "yes", "Yes", ""],
    ["check_for_atony", "no", "No", ""],
    ["placenta_examination", "yes", "Yes", ""],
    ["placenta_examination", "no", "No", ""],
    ["explore_for_fragments", "yes", "Yes", ""],
    ["explore_for_fragments", "no", "No", ""],
    ["remove_fragments", "yes", "Yes", ""],
    ["remove_fragments", "no", "No", ""],
    ["laceration_repair", "yes", "Yes", ""],
    ["laceration_repair", "no", "No", ""],
    ["oxytocin_20_iu", "yes", "Yes", ""],
    ["oxytocin_20_iu", "no", "No", ""],
    ["message_to_mother", "yes", "Yes", ""],
    ["message_to_mother", "no", "No", ""],
    ["other_managment", "yes", "Yes", ""],
    ["other_managment", "no", "No", ""],
    ["balloon_over_catheter", "yes", "Yes", ""],
    ["balloon_over_catheter", "no", "No", ""],
    ["tie_the_balloon", "yes", "Yes", ""],
    ["tie_the_balloon", "no", "No", ""],
    ["inflate_balloon_with_20cc", "yes", "Yes", ""],
    ["inflate_balloon_with_20cc", "no", "No", ""],
    ["inflate_balloon_with_20cc_001", "yes", "Yes", ""],
    ["inflate_balloon_with_20cc_001", "no", "No", ""],
    ["grasp_anterior_cervix", "yes", "Yes", ""],
    ["grasp_anterior_cervix", "no", "No", ""],
    ["place_balloon_into_uterus", "yes", "Yes", ""],
    ["place_balloon_into_uterus", "no", "No", ""],
    ["inflate_balloon_300ml_500ml", "yes", "Yes", ""],
    ["inflate_balloon_300ml_500ml", "no", "No", ""],
    ["clamp_catheter", "yes", "Yes", ""],
    ["clamp_catheter", "no", "No", ""],
    ["balloon_insitu_24hrs", "yes", "Yes", ""],
    ["balloon_insitu_24hrs", "no", "No", ""],
    ["oxytocin_20iu_in_ns", "yes", "Yes", ""],
    ["oxytocin_20iu_in_ns", "no", "No", ""],
    ["monitoring", "yes", "Yes", ""],
    ["monitoring", "no", "No", ""],
    ["deflate_50mls_q_hr", "yes", "Yes", ""],
    ["deflate_50mls_q_hr", "no", "No", ""],
    ["reinflate_50mls_bleeding_recur", "yes", "Yes", ""],
    ["reinflate_50mls_bleeding_recur", "no", "No", ""],
    ["surgical_intervention_bleeding", "yes", "Yes", ""],
    ["surgical_intervention_bleeding", "no", "No", ""],
    ["transfusion", "yes", "Yes", ""],
    ["transfusion", "no", "No", ""],
    ["documentation", "yes", "Yes", ""],
    ["documentation", "no", "No", ""],
    ["vaginal_exam", "yes", "Yes", ""],
    ["vaginal_exam", "no", "No", ""],
    ["confirm_diagnosis", "yes", "Yes", ""],
    ["confirm_diagnosis", "no", "No", ""],
    ["confirms_cord_pulsation", "yes", "Yes", ""],
    ["confirms_cord_pulsation", "no", "No", ""],
    ["patient_position", "yes", "Yes", ""],
    ["patient_position", "no", "No", ""],
    ["manual_cord_decompression", "yes", "Yes", ""],
    ["manual_cord_decompression", "no", "No", ""],
    ["consent_prep_emergency_cs", "yes", "Yes", ""],
    ["consent_prep_emergency_cs", "no", "No", ""],
    ["patient_transfer_position", "yes", "Yes", ""],
    ["patient_transfer_position", "no", "No", ""],
    ["hand_removal", "yes", "Yes", ""],
    ["hand_removal", "no", "No", ""],
    ["bladder_filling", "yes", "Yes", ""],
    ["bladder_filling", "no", "No", ""],
    ["tocolytics", "yes", "Yes", ""],
    ["tocolytics", "no", "No", ""],
    ["when_cord_not_pulsating", "yes", "Yes", ""],
    ["when_cord_not_pulsating", "no", "No", ""],
    ["expediting_delivery", "yes", "Yes", ""],
    ["expediting_delivery", "no", "No", ""],
    ["prepare_to_resuscitate", "yes", "Yes", ""],
    ["prepare_to_resuscitate", "no", "No", ""],
    ["call_for_help", "yes", "Yes", ""],
    ["call_for_help", "no", "No", ""],
    ["consider_episiotomy", "yes", "Yes", ""],
    ["consider_episiotomy", "no", "No", ""],
    ["hands_off_breech", "yes", "Yes", ""],
    ["hands_off_breech", "no", "No", ""],
    ["pinard_manuever", "yes", "Yes", ""],
    ["pinard_manuever", "no", "No", ""],
    ["grip_pelvis_bone", "yes", "Yes", ""],
    ["grip_pelvis_bone", "no", "No", ""],
    ["lovset_maneuver", "yes", "Yes", ""],
    ["lovset_maneuver", "no", "No", ""],
    ["maurecieu_smellie_veit_maneuve", "yes", "Yes", ""],
    ["maurecieu_smellie_veit_maneuve", "no", "No", ""],
    ["amtsl", "yes", "Yes", ""],
    ["amtsl", "no", "No", ""],
    ["ask_for_help", "yes", "Yes", ""],
    ["ask_for_help", "no", "No", ""],
    ["avd_contraindication", "yes", "Yes", ""],
    ["avd_contraindication", "no", "No", ""],
    ["alert_theatre", "yes", "Yes", ""],
    ["alert_theatre", "no", "No", ""],
    ["proper_dilatation_descent", "yes", "Yes", ""],
    ["proper_dilatation_descent", "no", "No", ""],
    ["adequate_contractions", "yes", "Yes", ""],
    ["adequate_contractions", "no", "No", ""],
    ["determine_position", "yes", "Yes", ""],
    ["determine_position", "no", "No", ""],
    ["mcroberts_position", "yes", "Yes", ""],
    ["mcroberts_position", "no", "No", ""],
    ["equipment_check", "yes", "Yes", ""],
    ["equipment_check", "no", "No", ""],
    ["vacuum_placement", "yes", "Yes", ""],
    ["vacuum_placement", "no", "No", ""],
    ["evaluates_for_episiotomy", "yes", "Yes", ""],
    ["evaluates_for_episiotomy", "no", "No", ""],
    ["check_maternal_soft_tissue", "yes", "Yes", ""],
    ["check_maternal_soft_tissue", "no", "No", ""],
    ["negative_pressure", "yes", "Yes", ""],
    ["negative_pressure", "no", "No", ""],
    ["apply_gentle_traction", "yes", "Yes", ""],
    ["apply_gentle_traction", "no", "No", ""],
    ["cup_removal", "yes", "Yes", ""],
    ["cup_removal", "no", "No", ""],
    ["proceed_as_normal_delivery", "yes", "Yes", ""],
    ["proceed_as_normal_delivery", "no", "No", ""],
    ["when_to_halt", "yes", "Yes", ""],
    ["when_to_halt", "no", "No", ""],
    ["aim_to_deliver_within_5_min", "yes", "Yes", ""],
    ["aim_to_deliver_within_5_min", "no", "No", ""],
    ["woman_not_to_push", "yes", "Yes", ""],
    ["woman_not_to_push", "no", "No", ""],
    ["Mcrobert_position", "yes", "Yes", ""],
    ["Mcrobert_position", "no", "No", ""],
    ["rubin_1_maneuver", "yes", "Yes", ""],
    ["rubin_1_maneuver", "no", "No", ""],
    ["rubin_2_maneuver", "yes", "Yes", ""],
    ["rubin_2_maneuver", "no", "No", ""],
    ["wood_screw_maneuver", "yes", "Yes", ""],
    ["wood_screw_maneuver", "no", "No", ""],
    ["deliver_posterior_shoulder", "yes", "Yes", ""],
    ["deliver_posterior_shoulder", "no", "No", ""],
    ["gaskins_maneuver", "yes", "Yes", ""],
    ["gaskins_maneuver", "no", "No", ""],
    ["_3rd_stage_labor", "yes", "Yes", ""],
    ["_3rd_stage_labor", "no", "No", ""],
    ["prep_for_nnr", "yes", "Yes", ""],
    ["prep_for_nnr", "no", "No", ""],
    ["Monitor_the_baby", "yes", "Yes", ""],
    ["Monitor_the_baby", "no", "No", ""],
    ["explain_procedure", "yes", "Yes", ""],
    ["explain_procedure", "no", "No", ""],
    ["change_goloves", "yes", "Yes", ""],
    ["change_goloves", "no", "No", ""],
    ["check_second_twin", "yes", "Yes", ""],
    ["check_second_twin", "no", "No", ""],
    ["explain_medication", "yes", "Yes", ""],
    ["explain_medication", "no", "No", ""],
    ["administer_uterotonic", "yes", "Yes", ""],
    ["administer_uterotonic", "no", "No", ""],
    ["delayed_cord_clamp", "yes", "Yes", ""],
    ["delayed_cord_clamp", "no", "No", ""],
    ["recieve_placenta", "yes", "Yes", ""],
    ["recieve_placenta", "no", "No", ""],
    ["assess_fundal_tone", "yes", "Yes", ""],
    ["assess_fundal_tone", "no", "No", ""],
    ["genital_trauma_assessment", "yes", "Yes", ""],
    ["genital_trauma_assessment", "no", "No", ""],
    ["assess_blood_loss1", "yes", "Yes", ""],
    ["assess_blood_loss1", "no", "No", ""],
    ["_15min_uterine_massage", "yes", "Yes", ""],
    ["_15min_uterine_massage", "no", "No", ""],
    ["ipc_precautions", "yes", "Yes", ""],
    ["ipc_precautions", "no", "No", ""],
    ["placing_woman_on_nasg", "yes", "Yes", ""],
    ["placing_woman_on_nasg", "no", "No", ""],
    ["segment1_2_application", "yes", "Yes", ""],
    ["segment1_2_application", "no", "No", ""],
    ["nasg_snapping_test", "yes", "Yes", ""],
    ["nasg_snapping_test", "no", "No", ""],
    ["segment2_3_application", "yes", "Yes", ""],
    ["segment2_3_application", "no", "No", ""],
    ["segment4_application", "yes", "Yes", ""],
    ["segment4_application", "no", "No", ""],
    ["segment5_placement", "yes", "Yes", ""],
    ["segment5_placement", "no", "No", ""],
    ["segment_6_placement_001", "yes", "Yes", ""],
    ["segment_6_placement_001", "no", "No", ""],
    ["woman_can_breathe_normally", "yes", "Yes", ""],
    ["woman_can_breathe_normally", "no", "No", ""],
    ["other_pph_management", "yes", "Yes", ""],
    ["other_pph_management", "no", "No", ""],
    ["monitor_sob_oliguria", "yes", "Yes", ""],
    ["monitor_sob_oliguria", "no", "No", ""],
    ["vital_signs_before_removal", "yes", "Yes", ""],
    ["vital_signs_before_removal", "no", "No", ""],
    ["open_segment_pair_1_or_2", "yes", "Yes", ""],
    ["open_segment_pair_1_or_2", "no", "No", ""],
    ["when_to_remove_next_segment", "yes", "Yes", ""],
    ["when_to_remove_next_segment", "no", "No", ""],
    ["when_reclose_segments", "yes", "Yes", ""],
    ["when_reclose_segments", "no", "No", ""],
    ["review_anc_history", "gestational_age", "i) Gestational age", ""],
    ["review_anc_history", "maternal_comorbidities_complications", "ii) Maternal comorbidities/complications", ""],
    ["review_anc_history", "prenatal_care_visits", "iii) Prenatal care (Visits)", ""],
    ["review_anc_history", "anc_profile_lab_works", "iv) ANC profile (Lab works)", ""],
    ["review_anc_history", "ultrasound_report_if_any", "v) Ultrasound report (if any)", ""],
    ["review_anc_history", "missed_all_steps", "v) Mentee missed all steps", ""],
    ["check_safety", "warm_room_25_28c_digital_room_thermometer", "i) Warm room (25-28°C) - Digital room thermometer", ""],
    ["check_safety", "environment_no_sharps_spilage", "ii) Environment - no sharps/spilage", ""],
    ["check_safety", "gloves_both_sterile_and_clean", "iii) Gloves - Both sterile and clean", ""],
    ["check_safety", "missed_all_steps", "iv) Mentee missed all steps", ""],
    ["check_equipment_warmth", "perform_hand_hygiene_and_wear_clean_gloves", "i) Perform hand hygiene and wear clean gloves", ""],
    ["check_equipment_warmth", "radiant_warmer_prewarm_mode_with_two_towels_and_hat", "ii) Radiant warmer (set on prewarm mode with two towels and a hat)", ""],
    ["check_equipment_warmth", "two_prewarmed_towels_and_hat", "iii) Put the Two pre-warmed towels and a hat on the radiant warmer", ""],
    ["check_equipment_warmth", "mentions_about_clock", "v) Mentions a clock", ""],
    ["check_equipment_warmth", "missed_all_steps", "vi) Mentee missed all steps", ""],
    ["check_airway", "penguine_sucker_or_suction_machine", "i) Penguin sucker or suction machine", ""],
    ["check_airway", "set_suction_machine_pressure_80_100mmhg", "ii) Set the suction machine - pressure 80-100 mmHg", ""],
    ["check_airway", "suction_catheter_6f_8f_and_wide_bore_yankauer_sucker", "iii) Suction catheter size 6F & 8F and wide bore catheter (Yankauer sucker)", ""],
    ["check_airway", "equipment_clean_and_functionality_checked", "iv) Mentee should mention that all the above equipment should be clean and tested for functionality", ""],
    ["check_airway", "missed_all_steps", "v) Mentee missed all steps", ""],
    ["check_breathing", "bvm_size_200_300ml", "i) Bag valve mask (BVM) size 200-300 ml", ""],
    ["check_breathing", "bvm_size_00_0_1", "ii) Bag valve masks (BVM) size 00, 0, 1", ""],
    ["check_breathing", "nasal_prongs", "iii) Nasal prongs", ""],
    ["check_breathing", "neonatal_non_rebreather_mask", "iv) Neonatal non-rebreather mask", ""],
    ["check_breathing", "oxygen_source", "v) Oxygen source", ""],
    ["check_breathing", "oxygen_tubings", "vi) Oxygen tubings", ""],
    ["check_breathing", "pulse_oximeter_with_neonatal_probe_cardiorespiratory_monitor", "vii) Pulse oximetre/cardio-respiratory monitor with neonatal probe", ""],
    ["check_breathing", "equipment_clean_and_functionality_checked", "Viii) Mentee should mention that all the above equipment should be clean and tested for functionality", ""],
    ["check_breathing", "missed_all_steps", "ix) Mentee missed all steps", ""],
    ["check_circulation", "stethoscope", "i) Stethoscope", ""],
    ["check_circulation", "iv_adrenaline_0_2ml_per_kg_1_10000", "ii) I.V. Adrenaline (0.2 ml/kg of 1:10,000) if a 3rd helper is available.", ""],
    ["check_circulation", "normal_saline", "iii) Normal saline", ""],
    ["check_circulation", "missed_all_steps", "iv) Mentee missed all steps", ""],
    ["essential_newborn_care", "yes", "Yes", ""],
    ["essential_newborn_care", "no", "No", ""],
    ["check_apgar_timing", "yes", "Yes", ""],
    ["check_apgar_timing", "no", "No", ""],
    ["dry_stimulate", "cry_respiratory_effort", "i) Cry / respiratory effort", ""],
    ["dry_stimulate", "tone_activity", "ii) Tone / activity", ""],
    ["dry_stimulate", "missed_all_steps", "iv) Mentee missed all steps", ""],
    ["wet_dry_cloth", "remove_wet_cloth", "i) Remove the wet cloth", ""],
    ["wet_dry_cloth", "wrap_in_dry_warm_towel_cloth", "ii) Wrap in a dry warm towel / cloth", ""],
    ["wet_dry_cloth", "put_hat_on_baby_head", "iii) Put a hat on the baby's head", ""],
    ["wet_dry_cloth", "missed_all_steps", "iv) Mentee missed all steps", ""],
    ["immediate_nb_management", "immediately_cut_cord", "i) Immediately cut the cord", ""],
    ["immediate_nb_management", "place_baby_on_prewarmed_radiant_warmer", "ii) Place the baby on the prewarmed radiant warmer", ""],
    ["immediate_nb_management", "missed_all_steps", "iii) Mentee missed all steps", ""],
    ["initial_abc_assessment", "look_in_mouth_and_nose", "i) Look in the mouth (and nose)", ""],
    ["initial_abc_assessment", "clear_airway", "ii) Clear airway starting with the mouth then nose", ""],
    ["initial_abc_assessment", "missed_all_steps", "iii) Mentee missed all steps", ""],
    ["abc_assessment", "open_airway_sniffing_position_head_tilt_chin_lift", "i) Open the airway (position into sniffing position using head tilt and chin lift maneuver)", ""],
    ["abc_assessment", "look_listen_feel_breathing_5_seconds", "ii) Look, listen, and feel for breathing for 5 seconds (mentee verbalises a three-syllable word loudly)", ""],
    ["abc_assessment", "missed_all_steps", "iii) Mentee missed all steps", ""],
    ["shout_help_nnr", "yes", "Yes", ""],
    ["shout_help_nnr", "no", "No", ""],
    ["begin_bvm", "size_bvm_mask", "i) Size the BVM mask", ""],
    ["begin_bvm", "good_c_and_e_grip", "ii) Good C & E grip", ""],
    ["begin_bvm", "give_40_60_continuous_ventilations_60_seconds", "iii) Using room air, give 40-60 continuous ventilations for 60 seconds", ""],
    ["begin_bvm", "correct_rate_breath_two_three", "iv) Correct rate (BREATH, TWO, THREE)", ""],
    ["begin_bvm", "ensure_chest_rises", "v) Ensure the chest rises", ""],
    ["begin_bvm", "missed_all_steps", "vi) Mentee missed all steps", ""],
    ["assess_pulse", "feel_umbilical_pulse_5_seconds", "i) Feel the umbilical pulse for 5 seconds", ""],
    ["assess_pulse", "connect_bvm_to_100_percent_oxygen", "ii) Connect BVM to 100% oxygen", ""],
    ["assess_pulse", "connect_pulse_oximeter", "iii) Connect pulse oximeter", ""],
    ["assess_pulse", "missed_all_steps", "iv) Mentee missed all steps", ""],
    ["continue_bvm", "give_3_chest_compressions_1_ventilation_3_1_ratio_1_minute", "i) Give 3 chest compressions for 1 ventilation at a 3:1 ratio for 1 minute", ""],
    ["continue_bvm", "use_2_thumb_hand_encircling_technique", "ii) Use the 2-thumb hand encircling technique", ""],
    ["continue_bvm", "location_lower_1_3_sternum", "iii) Location - lower 1/3 of the sternum", ""],
    ["continue_bvm", "compress_1_3_ap_diameter", "vi) Compress to 1/3 of the AP diameter", ""],
    ["continue_bvm", "allow_chest_to_recoil", "vii) Allow chest to recoil", ""],
    ["continue_bvm", "about_120_events_30_ventilations_90_chest_compressions_per_minute", "viii) About 120 events (30 ventilations and 90 chest compressions) per minute – ONE and TWO and THREE and BREATH", ""],
    ["continue_bvm", "missed_all_steps", "ix) Mentee missed all steps", ""],
    ["reassess_abc", "yes", "Yes", ""],
    ["reassess_abc", "no", "No", ""],
    ["vetilations", "give_ventilations_40_60_breaths_per_min_60_seconds_chest_rise", "i) Give ventilations at 40-60 breaths/min for 60 seconds (chest must rise)", ""],
    ["vetilations", "checking_for_chest_movement", "ii) Check for chest movement", ""],
    ["vetilations", "ensure_baby_kept_warm", "iii) Make sure the baby is being kept warm", ""],
    ["vetilations", "missed_all_steps", "iv) Mentee missed all steps", ""],
    ["reassess_abc_2", "yes", "Yes", ""],
    ["reassess_abc_2", "no", "No", ""],
    ["post_resus_stablization", "connect_pulse_oximeter_and_monitor_spo2", "i) Connect pulse oximeter and monitor SpO2", ""],
    ["post_resus_stablization", "monitor_breathing_adequacy", "ii) Monitor breathing adequacy", ""],
    ["post_resus_stablization", "switch_to_baby_mode_on_radiant_warmer", "iii) Switch to baby mode on radiant warmer", ""],
    ["post_resus_stablization", "give_oxygen_using_nrm_10l_min_monitor_spo2_and_work_of_breathing", "iv) Give oxygen using NRM at 10 L/min while monitoring SpO2 and work of breathing", ""],
    ["post_resus_stablization", "titrate_wean_off_oxygen_based_on_spo2", "v) Titrate/wean off oxygen based on SpO2", ""],
    ["post_resus_stablization", "ensure_baby_kept_warm_36_5_37_5c", "vi) Ensure baby is kept warm (maintain body temp at 36.5°C - 37.5°C)", ""],
    ["post_resus_stablization", "missed_all_steps", "vi) Mentee missed all steps", ""],
    ["continue_observation", "airway", "i) Airway - (Check for obstruction, Position airway)", ""],
    ["continue_observation", "breathing", "ii) Breathing - (Assess adequacy of breathing, Respiratory rate, Grunting, Central cyanosis, Lower chest wall indrawing, Sternal retraction, SpO2, Switch to nasal prongs at 2 L/min, Target SpO2 of 90-95%)", ""],
    ["continue_observation", "circulation", "iii) Circulation - (Assess adequacy of circulation, Pulse rate, Capillary refill, Appearance/colour/pallor)", ""],
    ["continue_observation", "disability", "iv) Disability - (Check RBS)", ""],
    ["continue_observation", "exposure", "v) Exposure - (Temp, Head to toe examination, Perform ENC: Drugs)", ""],
    ["continue_observation", "ifcdc", "vi) Infant and Family Centred Development Care (IFCDC).", ""],
    ["continue_observation", "missed_all_steps", "vii) Mentee missed all steps", ""],
    ["documentation_nnr", "yes", "Yes", ""],
    ["documentation_nnr", "no", "No", ""],
    ["check_for_safety", "yes", "Yes", ""],
    ["check_for_safety", "no", "No", ""],
    ["check_for_response", "yes", "Yes", ""],
    ["check_for_response", "no", "No", ""],
    ["initiate_cpr", "yes", "Yes", ""],
    ["initiate_cpr", "no", "No", ""],
    ["assign_team_tasks", "yes", "Yes", ""],
    ["assign_team_tasks", "no", "No", ""],
    ["Offer_leadership", "yes", "Yes", ""],
    ["Offer_leadership", "no", "No", ""],
    ["assess_airway", "yes", "Yes", ""],
    ["assess_airway", "no", "No", ""],
    ["oropharyngeal_airway", "yes", "Yes", ""],
    ["oropharyngeal_airway", "no", "No", ""],
    ["assess_breathing", "yes", "Yes", ""],
    ["assess_breathing", "no", "No", ""],
    ["assess_carotid_pulse", "yes", "Yes", ""],
    ["assess_carotid_pulse", "no", "No", ""],
    ["cpr_30_2", "yes", "Yes", ""],
    ["cpr_30_2", "no", "No", ""],
    ["breathing_assessment", "yes", "Yes", ""],
    ["breathing_assessment", "no", "No", ""],
    ["give_oxygen", "yes", "Yes", ""],
    ["give_oxygen", "no", "No", ""],
    ["manage_circulation", "yes", "Yes", ""],
    ["manage_circulation", "no", "No", ""],
    ["check_pulse_bp", "yes", "Yes", ""],
    ["check_pulse_bp", "no", "No", ""],
    ["iv_fluids", "yes", "Yes", ""],
    ["iv_fluids", "no", "No", ""],
    ["transfuse_in_anemia", "yes", "Yes", ""],
    ["transfuse_in_anemia", "no", "No", ""],
    ["palpate_the_uterus", "yes", "Yes", ""],
    ["palpate_the_uterus", "no", "No", ""],
    ["inspect_external_genitalia", "yes", "Yes", ""],
    ["inspect_external_genitalia", "no", "No", ""],
    ["repeat_vital_signs", "yes", "Yes", ""],
    ["repeat_vital_signs", "no", "No", ""],
    ["input_output_monitoring", "yes", "Yes", ""],
    ["input_output_monitoring", "no", "No", ""],
    ["IV_antibiotics", "yes", "Yes", ""],
    ["IV_antibiotics", "no", "No", ""],
    ["qualified_medical_officer", "yes", "Yes", ""],
    ["qualified_medical_officer", "no", "No", ""],
    ["anesthesia", "yes", "Yes", ""],
    ["anesthesia", "no", "No", ""],
    ["cleaning_draping_abdomen", "yes", "Yes", ""],
    ["cleaning_draping_abdomen", "no", "No", ""],
    ["open_abdomen_identify_uterus", "yes", "Yes", ""],
    ["open_abdomen_identify_uterus", "no", "No", ""],
    ["assess_for_atony", "yes", "Yes", ""],
    ["assess_for_atony", "no", "No", ""],
    ["lower_uterine_segment_incision", "yes", "Yes", ""],
    ["lower_uterine_segment_incision", "no", "No", ""],
    ["remove_pcos", "yes", "Yes", ""],
    ["remove_pcos", "no", "No", ""],
    ["start_from_right_side", "yes", "Yes", ""],
    ["start_from_right_side", "no", "No", ""],
    ["insert_compression_suture", "yes", "Yes", ""],
    ["insert_compression_suture", "no", "No", ""],
    ["suture_over_funds", "yes", "Yes", ""],
    ["suture_over_funds", "no", "No", ""],
    ["loop_the_uterus_horizontally", "yes", "Yes", ""],
    ["loop_the_uterus_horizontally", "no", "No", ""],
    ["another_loop", "yes", "Yes", ""],
    ["another_loop", "no", "No", ""],
    ["assistant_compress_uterus", "yes", "Yes", ""],
    ["assistant_compress_uterus", "no", "No", ""],
    ["tie_ends_together", "yes", "Yes", ""],
    ["tie_ends_together", "no", "No", ""],
    ["vaginal_bleeding_controlled", "yes", "Yes", ""],
    ["vaginal_bleeding_controlled", "no", "No", ""],
    ["close_uterine_incision", "yes", "Yes", ""],
    ["close_uterine_incision", "no", "No", ""],
    ["hysteroctomy_indication", "yes", "Yes", ""],
    ["hysteroctomy_indication", "no", "No", ""],
    ["high_lithotomy_position", "yes", "Yes", ""],
    ["high_lithotomy_position", "no", "No", ""],
    ["asepsis", "yes", "Yes", ""],
    ["asepsis", "no", "No", ""],
    ["draping_catheterization", "yes", "Yes", ""],
    ["draping_catheterization", "no", "No", ""],
    ["local_anesthesia_examination", "yes", "Yes", ""],
    ["local_anesthesia_examination", "no", "No", ""],
    ["classify_tear_degree", "yes", "Yes", ""],
    ["classify_tear_degree", "no", "No", ""],
    ["gauze_to_improve_visibility", "yes", "Yes", ""],
    ["gauze_to_improve_visibility", "no", "No", ""],
    ["suturing_from_appex", "yes", "Yes", ""],
    ["suturing_from_appex", "no", "No", ""],
    ["non_locking_stitch", "yes", "Yes", ""],
    ["non_locking_stitch", "no", "No", ""],
    ["avoiding_hematoma", "yes", "Yes", ""],
    ["avoiding_hematoma", "no", "No", ""],
    ["completing_perineal_repair", "yes", "Yes", ""],
    ["completing_perineal_repair", "no", "No", ""],
    ["anal_sphincter_repair", "yes", "Yes", ""],
    ["anal_sphincter_repair", "no", "No", ""],
    ["health_talk", "yes", "Yes", ""],
    ["health_talk", "no", "No", ""],
    ["safety_assessement", "yes", "Yes", ""],
    ["safety_assessement", "no", "No", ""],
    ["check_response", "yes", "Yes", ""],
    ["check_response", "no", "No", ""],
    ["debrief_and_assign_tasks", "yes", "Yes", ""],
    ["debrief_and_assign_tasks", "no", "No", ""],
    ["offer_leadership", "yes", "Yes", ""],
    ["offer_leadership", "no", "No", ""],
    ["assess", "yes", "Yes", ""],
    ["assess", "no", "No", ""],
    ["head_titl_chin_lift", "yes", "Yes", ""],
    ["head_titl_chin_lift", "no", "No", ""],
    ["jaw_thrust", "yes", "Yes", ""],
    ["jaw_thrust", "no", "No", ""],
    ["maintain_airway", "yes", "Yes", ""],
    ["maintain_airway", "no", "No", ""],
    ["identify_cpr_landmarks", "yes", "Yes", ""],
    ["identify_cpr_landmarks", "no", "No", ""],
    ["demo_cpr", "yes", "Yes", ""],
    ["demo_cpr", "no", "No", ""],
    ["_30_2_cpr", "yes", "Yes", ""],
    ["_30_2_cpr", "no", "no", ""],
    ["reassess_breathing", "yes", "Yes", ""],
    ["reassess_breathing", "no", "No", ""],
    ["_2min_exchanges_cpr", "yes", "Yes", ""],
    ["_2min_exchanges_cpr", "no", "No", ""],
    ["perimotem_cs", "yes", "Yes", ""],
    ["perimotem_cs", "no", "No", ""],
    ["O2_recovery_room", "yes", "Yes", ""],
    ["O2_recovery_room", "no", "No", ""],
    ["assess_circulation_inverted_j", "yes", "Yes", ""],
    ["assess_circulation_inverted_j", "no", "No", ""],
    ["IV_fluids", "yes", "Yes", ""],
    ["IV_fluids", "no", "No", ""],
    ["perform_secondary_survey", "yes", "Yes", ""],
    ["perform_secondary_survey", "no", "No", ""],
    ["recovery_position", "yes", "Yes", ""],
    ["recovery_position", "no", "No", ""],
    ["regional_anesthesia_sedation", "yes", "Yes", ""],
    ["regional_anesthesia_sedation", "no", "No", ""],
    ["tear_examination", "yes", "Yes", ""],
    ["tear_examination", "no", "No", ""],
    ["apply_local_anesthetic", "yes", "Yes", ""],
    ["apply_local_anesthetic", "no", "No", ""],
    ["grasp_cervix_oneside", "yes", "Yes", ""],
    ["grasp_cervix_oneside", "no", "No", ""],
    ["grasp_otherside_of_cervix", "yes", "Yes", ""],
    ["grasp_otherside_of_cervix", "no", "No", ""],
    ["locate_tip_of_cervix", "yes", "Yes", ""],
    ["locate_tip_of_cervix", "no", "No", ""],
    ["place_both_forceps_in_one_hand", "yes", "Yes", ""],
    ["place_both_forceps_in_one_hand", "no", "No", ""],
    ["placement_1st_suture", "yes", "Yes", ""],
    ["placement_1st_suture", "no", "No", ""],
    ["place_continous_suture", "yes", "Yes", ""],
    ["place_continous_suture", "no", "No", ""],
    ["theatre_if_no_hemostasis", "yes", "Yes", ""],
    ["theatre_if_no_hemostasis", "no", "No", ""],
    ["hand_hygiene", "yes", "Yes", ""],
    ["hand_hygiene", "no", "No", ""],
    ["insert_whole_hand", "yes", "Yes", ""],
    ["insert_whole_hand", "no", "No", ""],
    ["identify_anterior_fornix", "yes", "Yes", ""],
    ["identify_anterior_fornix", "no", "No", ""],
    ["fist_thumb_outside", "yes", "Yes", ""],
    ["fist_thumb_outside", "no", "No", ""],
    ["fist_on_anterior_wall", "yes", "Yes", ""],
    ["fist_on_anterior_wall", "no", "No", ""],
    ["pressure_posterior_wall", "yes", "Yes", ""],
    ["pressure_posterior_wall", "no", "No", ""],
    ["pressure_until_hemostasis", "yes", "Yes", ""],
    ["pressure_until_hemostasis", "no", "No", ""],
    ["locate_femoral_pulse", "yes", "Yes", ""],
    ["locate_femoral_pulse", "no", "No", ""],
    ["fist_placement", "yes", "Yes", ""],
    ["fist_placement", "no", "No", ""],
    ["apply_down_pressure", "yes", "Yes", ""],
    ["apply_down_pressure", "no", "No", ""],
    ["femoral_pulse_check", "yes", "Yes", ""],
    ["femoral_pulse_check", "no", "No", ""],
    ["adequacy_of_compression", "yes", "Yes", ""],
    ["adequacy_of_compression", "no", "No", ""],
    ["compression_until_hemostasis", "yes", "Yes", ""],
    ["compression_until_hemostasis", "no", "No", ""],
    ["diagnosis", "yes", "Yes", ""],
    ["diagnosis", "no", "No", ""],
    ["management_principles", "yes", "Yes", ""],
    ["management_principles", "no", "No", ""],
    ["explain_to_mother", "yes", "Yes", ""],
    ["explain_to_mother", "no", "No", ""],
    ["handwashing_and_start", "yes", "Yes", ""],
    ["handwashing_and_start", "no", "No", ""],
    ["fix_iv_line", "yes", "Yes", ""],
    ["fix_iv_line", "no", "No", ""],
    ["mgso4_preparation", "yes", "Yes", ""],
    ["mgso4_preparation", "no", "No", ""],
    ["iv_loading_dose", "yes", "Yes", ""],
    ["iv_loading_dose", "no", "No", ""],
    ["duration_mgso4_bolus", "yes", "Yes", ""],
    ["duration_mgso4_bolus", "no", "No", ""],
    ["dosage_duration", "yes", "Yes", ""],
    ["dosage_duration", "no", "No", ""],
    ["maintenance_dose_duration", "yes", "Yes", ""],
    ["maintenance_dose_duration", "no", "No", ""],
    ["dosing_iv_im", "yes", "Yes", ""],
    ["dosing_iv_im", "no", "No", ""],
    ["eclampsia_diagnosis", "yes", "Yes", ""],
    ["eclampsia_diagnosis", "no", "No", ""],
    ["assess_for_danger", "yes", "Yes", ""],
    ["assess_for_danger", "no", "No", ""],
    ["toxicity_monitoring", "yes", "Yes", ""],
    ["toxicity_monitoring", "no", "No", ""],
    ["left_lateral_tilt_position", "yes", "Yes", ""],
    ["left_lateral_tilt_position", "no", "No", ""],
    ["airway_protection", "yes", "Yes", ""],
    ["airway_protection", "no", "No", ""],
    ["convulsions_controlled", "yes", "Yes", ""],
    ["convulsions_controlled", "no", "No", ""],
    ["_80mls_hr_infusion", "yes", "Yes", ""],
    ["_80mls_hr_infusion", "no", "No", ""],
    ["managing_recurrent_seizures", "yes", "Yes", ""],
    ["managing_recurrent_seizures", "no", "No", ""],
    ["monitoring_before_next_dose", "yes", "Yes", ""],
    ["monitoring_before_next_dose", "no", "No", ""],
    ["first_signs_mgso4_toxicity", "yes", "Yes", ""],
    ["first_signs_mgso4_toxicity", "no", "No", ""],
    ["mgso4_toxicity_checks", "yes", "Yes", ""],
    ["mgso4_toxicity_checks", "no", "No", ""],
    ["mgso4_antidote", "yes", "Yes", ""],
    ["mgso4_antidote", "no", "No", ""],
    ["shout_for_help", "yes", "Yes", ""],
    ["shout_for_help", "no", "No", ""],
    ["blood_monitoring_drape", "yes", "Yes", ""],
    ["blood_monitoring_drape", "no", "No", ""],
    ["emergency_team_roles", "yes", "Yes", ""],
    ["emergency_team_roles", "no", "No", ""],
    ["rapid_initial_assessment", "yes", "Yes", ""],
    ["rapid_initial_assessment", "no", "No", ""],
    ["ensure_patient_privacy", "yes", "Yes", ""],
    ["ensure_patient_privacy", "no", "No", ""],
    ["explain_procedure_mother", "yes", "Yes", ""],
    ["explain_procedure_mother", "no", "No", ""],
    ["obtain_informed_consent", "yes", "Yes", ""],
    ["obtain_informed_consent", "no", "No", ""],
    ["assess_blood_loss", "yes", "Yes", ""],
    ["assess_blood_loss", "no", "No", ""],
    ["assess_abcs_resuscitate", "yes", "Yes", ""],
    ["assess_abcs_resuscitate", "no", "No", ""],
    ["stop_uterotonic_drugs", "yes", "Yes", ""],
    ["stop_uterotonic_drugs", "no", "No", ""],
    ["insert_iv_cannulae", "yes", "Yes", ""],
    ["insert_iv_cannulae", "no", "No", ""],
    ["collect_blood_samples", "yes", "Yes", ""],
    ["collect_blood_samples", "no", "No", ""],
    ["start_crystalloid_infusion", "yes", "Yes", ""],
    ["start_crystalloid_infusion", "no", "No", ""],
    ["insert_urinary_catheter", "yes", "Yes", ""],
    ["insert_urinary_catheter", "no", "No", ""],
    ["administer_analgesics_antibiotics", "yes", "Yes", ""],
    ["administer_analgesics_antibiotics", "no", "No", ""],
    ["hand_hygiene_ppe", "yes", "Yes", ""],
    ["hand_hygiene_ppe", "no", "No", ""],
    ["replace_uterine_fundus", "yes", "Yes", ""],
    ["replace_uterine_fundus", "no", "No", ""],
    ["remove_retained_placenta", "yes", "Yes", ""],
    ["remove_retained_placenta", "no", "No", ""],
    ["start_oxytocin_infusion", "yes", "Yes", ""],
    ["start_oxytocin_infusion", "no", "No", ""],
    ["examine_repair_tears", "yes", "Yes", ""],
    ["examine_repair_tears", "no", "No", ""],
    ["monitor_vitals_bleeding", "yes", "Yes", ""],
    ["monitor_vitals_bleeding", "no", "No", ""],
    ["explain_procedure_results", "yes", "Yes", ""],
    ["explain_procedure_results", "no", "No", ""],
    ["prepare_operating_theatre", "yes", "Yes", ""],
    ["prepare_operating_theatre", "no", "No", ""],
    ["inform_client_outcomes", "yes", "Yes", ""],
    ["inform_client_outcomes", "no", "No", ""],
    ["document_blood_loss", "yes", "Yes", ""],
    ["document_blood_loss", "no", "No", ""],
    ["shout_assemble_team", "yes", "Yes", ""],
    ["shout_assemble_team", "no", "No", ""],
    ["assign_team_roles", "yes", "Yes", ""],
    ["assign_team_roles", "no", "No", ""],
    ["reassure_explain_mother", "yes", "Yes", ""],
    ["reassure_explain_mother", "no", "No", ""],
    ["check_bleeding_amount", "yes", "Yes", ""],
    ["check_bleeding_amount", "no", "No", ""],
    ["assess_abcs_resuscitate1", "yes", "Yes", ""],
    ["assess_abcs_resuscitate1", "no", "No", ""],
    ["trigger_first_bundle", "yes", "Yes", ""],
    ["trigger_first_bundle", "no", "No", ""],
    ["trigger_uterus_massage", "yes", "Yes", ""],
    ["trigger_uterus_massage", "no", "No", ""],
    ["check_bladder_catheter", "yes", "Yes", ""],
    ["check_bladder_catheter", "no", "No", ""],
    ["insert_iv_cannulas", "yes", "Yes", ""],
    ["insert_iv_cannulas", "no", "No", ""],
    ["collect_blood_samples1", "yes", "Yes", ""],
    ["collect_blood_samples1", "no", "No", ""],
    ["infuse_oxytocin", "yes", "Yes", ""],
    ["infuse_oxytocin", "no", "No", ""],
    ["administer_misoprostol", "yes", "Yes", ""],
    ["administer_misoprostol", "no", "No", ""],
    ["administer_tranexamic_acid", "yes", "Yes", ""],
    ["administer_tranexamic_acid", "no", "No", ""],
    ["give_iv_fluids", "yes", "Yes", ""],
    ["give_iv_fluids", "no", "No", ""],
    ["recheck_uterus", "yes", "Yes", ""],
    ["recheck_uterus", "no", "No", ""],
    ["check_for_tears", "yes", "Yes", ""],
    ["check_for_tears", "no", "No", ""],
    ["check_placenta_completeness", "yes", "Yes", ""],
    ["check_placenta_completeness", "no", "No", ""],
    ["monitor_bleeding_vitals", "yes", "Yes", ""],
    ["monitor_bleeding_vitals", "no", "No", ""],
    ["provide_respectful_care", "yes", "Yes", ""],
    ["provide_respectful_care", "no", "No", ""],
    ["inform_mother_progress", "yes", "Yes", ""],
    ["inform_mother_progress", "no", "No", ""],
    ["document_management_chart", "yes", "Yes", ""],
    ["document_management_chart", "no", "No", ""],
    ["explain_procedure_mother1", "yes", "Yes", ""],
    ["explain_procedure_mother1", "no", "No", ""],
    ["obtain_informed_consent1", "yes", "Yes", ""],
    ["obtain_informed_consent1", "no", "No", ""],
    ["decide_partograph_case", "yes", "Yes", ""],
    ["decide_partograph_case", "no", "No", ""],
    ["plot_patient_biodata", "yes", "Yes", ""],
    ["plot_patient_biodata", "no", "No", ""],
    ["plot_cervical_dilatation", "yes", "Yes", ""],
    ["plot_cervical_dilatation", "no", "No", ""],
    ["plot_descent", "yes", "Yes", ""],
    ["plot_descent", "no", "No", ""],
    ["plot_fetal_heart", "yes", "Yes", ""],
    ["plot_fetal_heart", "no", "No", ""],
    ["plot_amniotic_fluid", "yes", "Yes", ""],
    ["plot_amniotic_fluid", "no", "No", ""],
    ["plot_moulding", "yes", "Yes", ""],
    ["plot_moulding", "no", "No", ""],
    ["plot_contractions", "yes", "Yes", ""],
    ["plot_contractions", "no", "No", ""],
    ["plot_maternal_vitals", "yes", "Yes", ""],
    ["plot_maternal_vitals", "no", "No", ""],
    ["interpret_findings", "yes", "Yes", ""],
    ["interpret_findings", "no", "No", ""],
    ["explain_labour_progress", "yes", "Yes", ""],
    ["explain_labour_progress", "no", "No", ""],
    ["joint_decision_mother", "yes", "Yes", ""],
    ["joint_decision_mother", "no", "No", ""],
    ["document_procedures", "yes", "Yes", ""],
    ["document_procedures", "no", "No", ""],
  ];
}

/**
 * Yes/No choices for skill lists not yet included in the authored block.
 */
function getMoHSACRemainingYesNoChoices_() {
  // All skill yes/no lists are now in getMoHSACAuthoredSkillChoices_().
  return [];
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
    .concat(getMoHSACCountyChoices_())
    .concat(getMoHSACJhslChoices_())
    .concat(facilityRows)
    .concat(getMoHSACLmPoChoices_())
    .concat(getMoHSACIfmChoices_(sourceSs))
    .concat(getMoHSACNewbornMenteeChoices_(sourceSs))
    .concat(getMoHSACMentorsMenteeChoices_(sourceSs))
    .concat(getMoHSACSkillEvaluationChoices_())
    .concat(getMoHSACAuthoredSkillChoices_())
    .concat(getMoHSACRemainingYesNoChoices_());

  sheet.clear();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}

/**
 * Program options used by MoH Skills Assessment Checklist.
 */
function getMoHSACProgramChoices_() {
  return [
    ["program", "mentors_curriculum", "EmONC training curriculum", ""],
    ["program", "newborn_curriculum", "Newborn training curriculum", ""],
    ["program", "ifm_assessment", "IFM skills assessment", ""],
    ["program", "po_assessment", "PO skills assessment", ""],
    ["program", "tot", "Trainings (ToT)", ""]
  ];
}

/**
 * JHSL facility/site choice for PO skills assessment.
 * Kept static (not pulled from All Facilities List).
 */
function getMoHSACJhslChoices_() {
  return [
    ["jhsl", "JHSL", "JHSL", "po_assessment"]
  ];
}

/**
 * Lead Mentors & Program Officers choices (lm_po) for PO skills assessment.
 */
function getMoHSACLmPoChoices_() {
  return [
    ["lm_po", "238_Perez_Musyoki", "Perez Musyoki", "po_assessment"],
    ["lm_po", "226_Agatha_Nthenya", "Agatha Nthenya", "po_assessment"],
    ["lm_po", "214_Wilson_Maina", "Wilson Maina", "po_assessment"],
    ["lm_po", "203_Anne_Njeri", "Anne Njeri", "po_assessment"],
    ["lm_po", "192_Charles_Michieka", "Charles Michieka", "po_assessment"],
    ["lm_po", "165_Janet_Achieng", "Janet Achieng", "po_assessment"],
    ["lm_po", "154_Jedidah_Maina", "Jedidah Maina", "po_assessment"],
    ["lm_po", "146_Lucy_Kamau", "Lucy Kamau", "po_assessment"],
    ["lm_po", "135_Fridah_Gathogo", "Fridah Gathogo", "po_assessment"],
    ["lm_po", "116_John_Mbithi", "John Mbithi", "po_assessment"]
  ];
}

/**
 * IFM person choices from kobocreator "IFM List (Choices)".
 * Columns used: list_name, name, label (allowed left blank).
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
 * County choices with program filters (choice_filter contains(allowed, ${program})).
 */
function getMoHSACCountyChoices_() {
  return [
    ["county", "Busia", "Busia", "mentors_curriculum"],
    ["county", "Kakamega", "Kakamega", "mentors_curriculum, newborn_curriculum"],
    ["county", "Kiambu", "Kiambu", "mentors_curriculum"],
    ["county", "Kilifi", "Kilifi", "mentors_curriculum"],
    ["county", "Kisii", "Kisii", "mentors_curriculum"],
    ["county", "Machakos", "Machakos", "mentors_curriculum"],
    ["county", "Makueni", "Makueni", "mentors_curriculum, newborn_curriculum, ifm_assessment, tot"],
    ["county", "Meru", "Meru", "mentors_curriculum"],
    ["county", "Mombasa", "Mombasa", "mentors_curriculum, newborn_curriculum, tot"],
    ["county", "Muranga", "Muranga", "mentors_curriculum, newborn_curriculum, ifm_assessment, tot"],
    ["county", "Nairobi", "Nairobi", "mentors_curriculum"],
    ["county", "Nakuru", "Nakuru", "mentors_curriculum"],
    ["county", "Nyeri", "Nyeri", "mentors_curriculum"],
    ["county", "Siaya", "Siaya", "mentors_curriculum"],
    ["county", "JHSL", "JHSL", "po_assessment"]
  ];
}

/**
 * Facility choices from kobocreator sheet
 * "All Facilities List (Choices)" → list_name, name, label, allowed
 * JHSL rows are skipped (authored via getMoHSACJhslChoices_).
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
    // JHSL is authored statically via getMoHSACJhslChoices_()
    if (
      mappedListName.toLowerCase() === "jhsl_facilities" ||
      mappedListName.toLowerCase() === "jhsl"
    ) {
      continue;
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
