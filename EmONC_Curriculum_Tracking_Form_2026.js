// =====================================================
// EmONC Curriculum Tracking Form 2026
// Builds a Kobo-ready Google Sheet (survey / choices / settings)
// from the shared kobocreator.js output workbook.
// =====================================================

var EMONC_CTF_2026_TITLE = "EmONC Curriculum Tracking Form 2026";

var EMONC_CTF_2026_SURVEY_HEADERS = [
  "type",
  "name",
  "label",
  "hint",
  "required",
  "required_message",
  "constraint_message",
  "relevant",
  "parameters",
  "calculation"
];

var EMONC_CTF_2026_CHOICES_HEADERS = [
  "list_name",
  "name",
  "label"
];

var EMONC_CTF_2026_SETTINGS_HEADERS = [
  "form_title",
  "form_id",
  "version",
  "default_language"
];

/**
 * Entry point: create a new Google Spreadsheet with survey, choices, settings.
 * Run this from the same Apps Script project / workbook that hosts kobocreator.js
 * (after generateCurriculumTrackingForm / generateAllOutputs).
 */
function createEmONCCurriculumTrackingForm2026() {
  var sourceSs = SpreadsheetApp.getActiveSpreadsheet();
  var ss = SpreadsheetApp.create(EMONC_CTF_2026_TITLE);

  var surveySheet = ss.getSheets()[0];
  surveySheet.setName("survey");
  var choicesSheet = ss.insertSheet("choices");
  var settingsSheet = ss.insertSheet("settings");

  writeEmONCCTF2026Survey_(surveySheet, sourceSs);
  writeEmONCCTF2026ChoicesStub_(choicesSheet);
  writeEmONCCTF2026Settings_(settingsSheet);

  // Leave the builder focused on the survey tab
  ss.setActiveSheet(surveySheet);

  Logger.log("Created: " + ss.getUrl());
  return ss;
}

// =====================================================
// SURVEY
// =====================================================
function writeEmONCCTF2026Survey_(sheet, sourceSs) {
  var rows = [EMONC_CTF_2026_SURVEY_HEADERS]
    .concat(getEmONCCTF2026SurveyRows_())
    .concat(getEmONCCTF2026MenteeSurveyRows_(sourceSs))
    .concat([
      ["end_group", "", "", "", "", "", "", "", "", ""], // close mentee_details
      ["end_group", "", "", "", "", "", "", "", "", ""]  // close demographic_information
    ]);

  sheet.clear();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}

function getEmONCCTF2026SurveyRows_() {
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

  // Columns: type, name, label, hint, required, required_message,
  //          constraint_message, relevant, parameters, calculation
  return [
    [
      "begin_group",
      "introduction",
      "Introduction",
      "",
      "FALSE",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "introduction_note",
      "*The **EmONC Curriculum Tracking Form** is designed to track the implementation of MENTORS activities under the MoH EmONC Curriculum. It should be completed after each session to capture attendance, participation, and the type of activities delivered. The information collected will be used to monitor coverage, identify engagement levels, and support continuous improvement of the MENTORS program.*",
      "",
      "FALSE",
      "",
      "",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "demographic_information",
      "Section 1: Demographic Information",
      "",
      "FALSE",
      "",
      "",
      "",
      "",
      ""
    ],
    [
      "note",
      "note_mentors_details",
      "***Section Note:*** *This section captures key information about the mentees for accurate identification and follow-up. Please record the facilitating mentor's full name (two names), select the county and facility where the mentee is based, and confirm the mentees who attended mentorship sessions. Ensure all details are filled in correctly to support monitoring and reporting.*",
      "",
      "FALSE",
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
      "",
      ""
    ],
    [
      "text",
      "mentor_name",
      "1. Please enter your name",
      "Enumerator note: Write the full names of the facilitating IFMs. Use \"/\" to separate two IFM names. Example: *Julius Caesar / Ragnar Lothbrok*",
      "TRUE",
      "Sorry, this answer is required",
      "",
      "",
      "",
      ""
    ],
    [
      "date",
      "session_date",
      "2. Record the date when the mentorship session took place.",
      "",
      "TRUE",
      "",
      "Please enter today’s date! Only the current date is allowed.",
      "",
      "",
      ""
    ],
    ["end_group", "", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "facility_details",
      "Section 1b: Mentee Facility Details",
      "",
      "",
      "",
      "",
      "${session_date} != '' and ${mentor_name}!=''",
      "",
      ""
    ],
    [
      "select_one county",
      "county",
      "3. Please select the county where the mentorship training is taking place.",
      "",
      "TRUE",
      "",
      "",
      "",
      "randomize=false",
      ""
    ],
    facilitySelectRow_("busia_facilities", "Busia"),
    facilitySelectRow_("kakamega_facilities", "Kakamega"),
    facilitySelectRow_("kiambu_facilities", "Kiambu"),
    facilitySelectRow_("kilifi_facilities", "Kilifi"),
    facilitySelectRow_("kisii_facilities", "Kisii"),
    facilitySelectRow_("kirinyaga_facilities", "Kirinyaga"),
    facilitySelectRow_("machakos_facilities", "Machakos"),
    facilitySelectRow_("makueni_facilities", "Makueni"),
    facilitySelectRow_("meru_facilities", "Meru"),
    facilitySelectRow_("mombasa_facilities", "Mombasa"),
    facilitySelectRow_("muranga_facilities", "Muranga"),
    facilitySelectRow_("nairobi_facilities", "Nairobi"),
    facilitySelectRow_("nakuru_facilities", "Nakuru"),
    facilitySelectRow_("nyeri_facilities", "Nyeri"),
    facilitySelectRow_("siaya_facilities", "Siaya"),
    [
      "calculate",
      "next_group_hide1",
      "Next Group Hide 1",
      "",
      "TRUE",
      "",
      "",
      "",
      "",
      nextGroupHideCalc
    ],
    ["end_group", "", "", "", "", "", "", "", "", ""],
    [
      "begin_group",
      "mentee_details",
      "Section 1c: List of Mentees",
      "",
      "",
      "",
      "",
      "${next_group_hide1} != ''",
      "",
      ""
    ],
    [
      "note",
      "mentee_notes",
      "***Enumerator Note:*** *Please select only the mentees who were present and participated in the session delivered.*",
      "",
      "",
      "",
      "",
      "${next_group_hide1} != ''",
      "",
      ""
    ]
  ];
}

function facilitySelectRow_(listName, countyLabel) {
  return [
    "select_one " + listName,
    listName,
    "4. Please select the facility where the mentorship training is taking place.",
    "",
    "TRUE",
    "",
    "",
    "${county}='" + countyLabel + "'",
    "",
    ""
  ];
}

/**
 * Section 1c body: pull type / name / label / relevant from
 * kobocreator's "Curriculum Tracking Form" sheet.
 */
function getEmONCCTF2026MenteeSurveyRows_(sourceSs) {
  var sourceSheet = sourceSs.getSheetByName("Curriculum Tracking Form");
  if (!sourceSheet) {
    throw new Error(
      "Sheet 'Curriculum Tracking Form' not found. " +
      "Run generateCurriculumTrackingForm() or generateAllOutputs() first."
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
      "Curriculum Tracking Form is missing required columns: type, name, label, relevant"
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
    // constraint_message, relevant, parameters, calculation
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
      ""
    ]);
  }

  return rows;
}

// =====================================================
// CHOICES (stub — next step: feed from kobocreator sheets)
// =====================================================
function writeEmONCCTF2026ChoicesStub_(sheet) {
  sheet.clear();
  sheet.getRange(1, 1, 1, EMONC_CTF_2026_CHOICES_HEADERS.length)
    .setValues([EMONC_CTF_2026_CHOICES_HEADERS]);
}

// =====================================================
// SETTINGS
// =====================================================
function writeEmONCCTF2026Settings_(sheet) {
  var rows = [
    EMONC_CTF_2026_SETTINGS_HEADERS,
    [
      EMONC_CTF_2026_TITLE,
      "emonc_curriculum_tracking_form_2026",
      "2026.01.01",
      "English (en)"
    ]
  ];
  sheet.clear();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}
