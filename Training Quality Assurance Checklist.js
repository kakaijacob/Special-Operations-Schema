/**
 * Training Quality Assurance Checklist
 *
 * Pulls submissions from Kobo asset aTf8L9YVRRdoBcKnaUVWV6, maps/cleans
 * fields, computes section scores, and writes to a sheet named
 * "Training Quality Assurance Checklist".
 *
 * Secrets: set the Kobo API token in Apps Script Script Properties.
 *   Project Settings → Script properties → KOBO_API_TOKEN
 * Or run setKoboApiTokenOnce() once from the editor (prompt), then delete
 * that call. Never hard-code the token in this file.
 */

var TRAINING_QA_ASSET_UID = "aTf8L9YVRRdoBcKnaUVWV6";
var TRAINING_QA_SHEET_NAME = "Training Quality Assurance Checklist";
var TRAINING_QA_TOKEN_PROP = "KOBO_API_TOKEN";
var TRAINING_QA_KPI_BASE =
  "https://kc.humanitarianresponse.info/api/v2/assets/";

/**
 * One-time helper: prompts for the API token and stores it in Script Properties.
 * Run from the Apps Script editor; do not leave a token argument in source.
 */
function setKoboApiTokenOnce() {
  var ui = SpreadsheetApp.getUi();
  var result = ui.prompt(
    "Set Kobo API token",
    "Paste the Kobo API token (stored in Script Properties as " +
      TRAINING_QA_TOKEN_PROP +
      "). It will not be written to this file.",
    ui.ButtonSet.OK_CANCEL
  );
  if (result.getSelectedButton() !== ui.Button.OK) return;
  var token = (result.getResponseText() || "").trim();
  if (!token) {
    ui.alert("No token entered.");
    return;
  }
  PropertiesService.getScriptProperties().setProperty(
    TRAINING_QA_TOKEN_PROP,
    token
  );
  ui.alert("Kobo API token saved to Script Properties.");
}

function getTrainingQaApiToken_() {
  var token = PropertiesService.getScriptProperties().getProperty(
    TRAINING_QA_TOKEN_PROP
  );
  if (!token) {
    throw new Error(
      "Missing Script Property '" +
        TRAINING_QA_TOKEN_PROP +
        "'. Run setKoboApiTokenOnce() or set it under Project Settings → Script properties."
    );
  }
  return token;
}

/**
 * Resolve a Kobo field from a submission. Tries the exact key first, then
 * any key that ends with "/" + name (group-prefixed exports).
 */
function getKoboField_(sub, name) {
  if (!sub || !name) return "";
  if (Object.prototype.hasOwnProperty.call(sub, name) && sub[name] != null) {
    return sub[name];
  }
  var suffix = "/" + name;
  var keys = Object.keys(sub);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (k === name || k.endsWith(suffix)) {
      return sub[k] != null ? sub[k] : "";
    }
  }
  return "";
}

function fetchTrainingQaKoboSubmissions_() {
  var apiToken = getTrainingQaApiToken_();
  var formUid = TRAINING_QA_ASSET_UID;
  var url =
    TRAINING_QA_KPI_BASE +
    formUid +
    "/data/?format=json&ordering=-_submission_time&limit=1000";

  var options = {
    method: "get",
    headers: { Authorization: "Token " + apiToken },
    muteHttpExceptions: true
  };

  var allResults = [];
  while (url) {
    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();
    if (code < 200 || code >= 300) {
      throw new Error(
        "Kobo API error " + code + ": " + response.getContentText().slice(0, 500)
      );
    }
    var json = JSON.parse(response.getContentText());
    if (json.results && json.results.length) {
      allResults = allResults.concat(json.results);
    }
    url = json.next || null;
  }
  return allResults;
}

/**
 * Pull from Kobo and write the cleaned Training Quality Assurance Checklist sheet.
 */
function createCleanedSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var submissions = fetchTrainingQaKoboSubmissions_();
  if (!submissions.length) {
    SpreadsheetApp.getUi().alert("No Kobo submissions found for this asset.");
    return;
  }

  // --- Create or clear target sheet ---
  var targetSheet =
    ss.getSheetByName(TRAINING_QA_SHEET_NAME) ||
    ss.insertSheet(TRAINING_QA_SHEET_NAME);
  targetSheet.clearContents();

  // Virtual headers = all columnMap keys (order preserved). Values come from Kobo.
  var columnMap = {
    end: "Evaluation Date",
    facilitator_name: "QA Evaluator",
    county: "County",
    venue_appropriate: "Venue Appropriateness",
    seating_space: "Seating Space",
    av_equipment: "Audiovisual Equipment",
    training_materials: "Training Material",
    total_facilitators: "Total Facilitators",
    total_trainees: "Total Trainees",
    facilitators_moh_tot: "Facilitators MoH Trained",
    facilitators_available: "Facilitators Available",
    training_schedule: "Training Schedule",
    participant_criteria: "Participant Criteria",
    "partograph_use/clarity": "CME Partograph Clarity",
    "partograph_use/engagement": "CME Partograph Engagement",
    "partograph_use/time_management": "CME Partograph Time Management",
    "partograph_use/interaction": "CME Partograph Interaction",
    "amtsl/clarity": "CME AMTSL Clarity",
    "amtsl/engagement": "CME AMTSL Engagement",
    "amtsl/time_management": "CME AMTSL Time Management",
    "amtsl/interaction": "CME AMTSL Interaction",
    "pph/clarity": "CME PPH Clarity",
    "pph/engagement": "CME PPH Engagement",
    "pph/time_management": "CME PPH Time Management",
    "pph/interaction": "CME PPH Interaction",
    "cord_prolapse/clarity": "CME Cord Prolapse Clarity",
    "cord_prolapse/engagement": "CME Cord Prolapse Engagement",
    "cord_prolapse/time_management": "CME Cord Prolapse Time Management",
    "cord_prolapse/interaction": "CME Cord Prolapse Interaction",
    "shoulder_dystocia/clarity": "CME Shoulder Dystocia Clarity",
    "shoulder_dystocia/engagement": "CME Shoulder Dystocia Engagement",
    "shoulder_dystocia/time_management": "CME Shoulder Dystocia Time Management",
    "shoulder_dystocia/interaction": "CME Shoulder Dystocia Interaction",
    "vaginal_breech/clarity": "CME Vaginal Breech Clarity",
    "vaginal_breech/engagement": "CME Vaginal Breech Engagement",
    "vaginal_breech/time_management": "CME Vaginal Breech Time Management",
    "vaginal_breech/interaction": "CME Vaginal Breech Interaction",
    "vacuum_delivery/clarity": "CME AVD Clarity",
    "vacuum_delivery/engagement": "CME AVD Engagement",
    "vacuum_delivery/time_management": "CME AVD Time Management",
    "vacuum_delivery/interaction": "CME AVD Interaction",
    "preeclampsia_eclampsia/clarity": "CME Preeclampsia-Eclampsia Clarity",
    "preeclampsia_eclampsia/engagement": "CME Preeclampsia-Eclampsia Engagement",
    "preeclampsia_eclampsia/time_management":
      "CME Preeclampsia-Eclampsia Time Management",
    "preeclampsia_eclampsia/interaction": "CME Preeclampsia-Eclampsia Interaction",
    "maternal_shock/clarity": "CME Maternal Shock Clarity",
    "maternal_shock/engagement": "CME Maternal Shock Engagement",
    "maternal_shock/time_management": "CME Maternal Shock Time Management",
    "maternal_shock/interaction": "CME Maternal Shock Interaction",
    "maternal_resus/clarity": "CME Maternal Resuscitation Clarity",
    "maternal_resus/engagement": "CME Maternal Resuscitation Engagement",
    "maternal_resus/time_management": "CME Maternal Resuscitation Time Management",
    "maternal_resus/interaction": "CME Maternal Resuscitation Interaction",
    "newborn_resus/clarity": "CME NNR Clarity",
    "newborn_resus/engagement": "CME NNR Engagement",
    "newborn_resus/time_management": "CME NNR Time Management",
    "newborn_resus/interaction": "CME NNR Interaction",
    "aph/clarity": "CME APH Clarity",
    "aph/engagement": "CME APH Engagement",
    "aph/time_management": "CME APH Time Management",
    "aph/interaction": "CME APH Interaction",
    "obstructed_labor/clarity": "CME Obstructed Labor Clarity",
    "obstructed_labor/engagement": "CME Obstructed Labor Engagement",
    "obstructed_labor/time_management": "CME Obstructed Labor Time Management",
    "obstructed_labor/interaction": "CME Obstructed Labor Interaction",

    "amtsl_skill/breakout_room_setup": "AMTSL Skill Room Setup",
    "amtsl_skill/learning_outcomes": "AMTSL Skill Learning Outcomes",
    "amtsl_skill/skills_demonstration": "AMTSL Skill Demo",
    "amtsl_skill/return_demonstrations": "AMTSL Skill Return Demo",
    "amtsl_skill/debriefing_feedback": "AMTSL Skill Feedback",

    "cord_prolapse_skill/breakout_room_setup": "Cord Prolapse Skill Room Setup",
    "cord_prolapse_skill/learning_outcomes": "Cord Prolapse Skill Learning Outcomes",
    "cord_prolapse_skill/skills_demonstration": "Cord Prolapse Skill Demo",
    "cord_prolapse_skill/return_demonstrations": "Cord Prolapse Skill Return Demo",
    "cord_prolapse_skill/debriefing_feedback": "Cord Prolapse Skill Feedback",

    "bimanual_compression_skill/breakout_room_setup":
      "Bimanual Compression Skill Room Setup",
    "bimanual_compression_skill/learning_outcomes":
      "Bimanual Compression Skill Learning Outcomes",
    "bimanual_compression_skill/skills_demonstration":
      "Bimanual Compression Skill Demo",
    "bimanual_compression_skill/return_demonstrations":
      "Bimanual Compression Skill Return Demo",
    "bimanual_compression_skill/debriefing_feedback":
      "Bimanual Compression Skill Feedback",

    "abdominal_aorta_compression_skill/breakout_room_setup":
      "Abdominal Aorta Compression Skill Room Setup",
    "abdominal_aorta_compression_skill/learning_outcomes":
      "Abdominal Aorta Compression Skill Learning Outcomes",
    "abdominal_aorta_compression_skill/skills_demonstration":
      "Abdominal Aorta Compression Skill Demo",
    "abdominal_aorta_compression_skill/return_demonstrations":
      "Abdominal Aorta Compression Skill Return Demo",
    "abdominal_aorta_compression_skill/debriefing_feedback":
      "Abdominal Aorta Compression Skill Feedback",

    "retained_placenta_removal_skill/breakout_room_setup":
      "Retained Placenta Removal Skill Room Setup",
    "retained_placenta_removal_skill/learning_outcomes":
      "Retained Placenta Removal Skill Learning Outcomes",
    "retained_placenta_removal_skill/skills_demonstration":
      "Retained Placenta Removal Skill Demo",
    "retained_placenta_removal_skill/return_demonstrations":
      "Retained Placenta Removal Skill Return Demo",
    "retained_placenta_removal_skill/debriefing_feedback":
      "Retained Placenta Removal Skill Feedback",

    "uterine_inversion_skill/breakout_room_setup":
      "Uterine Inversion Skill Room Setup",
    "uterine_inversion_skill/learning_outcomes":
      "Uterine Inversion Skill Learning Outcomes",
    "uterine_inversion_skill/skills_demonstration": "Uterine Inversion Skill Demo",
    "uterine_inversion_skill/return_demonstrations":
      "Uterine Inversion Skill Return Demo",
    "uterine_inversion_skill/debriefing_feedback":
      "Uterine Inversion Skill Feedback",

    "ubt_placement_skill/breakout_room_setup": "UBT Placement Skill Room Setup",
    "ubt_placement_skill/learning_outcomes": "UBT Placement Skill Learning Outcomes",
    "ubt_placement_skill/skills_demonstration": "UBT Placement Skill Demo",
    "ubt_placement_skill/return_demonstrations": "UBT Placement Skill Return Demo",
    "ubt_placement_skill/debriefing_feedback": "UBT Placement Skill Feedback",

    "ubt_freeflow_skill/breakout_room_setup": "UBT Freeflow Skill Room Setup",
    "ubt_freeflow_skill/learning_outcomes": "UBT Freeflow Skill Learning Outcomes",
    "ubt_freeflow_skill/skills_demonstration": "UBT Freeflow Skill Demo",
    "ubt_freeflow_skill/return_demonstrations": "UBT Freeflow Skill Return Demo",
    "ubt_freeflow_skill/debriefing_feedback": "UBT Freeflow Skill Feedback",

    "perineal_tear_repair_skill/breakout_room_setup":
      "Perineal Tear Repair Skill Room Setup",
    "perineal_tear_repair_skill/learning_outcomes":
      "Perineal Tear Repair Skill Learning Outcomes",
    "perineal_tear_repair_skill/skills_demonstration":
      "Perineal Tear Repair Skill Demo",
    "perineal_tear_repair_skill/return_demonstrations":
      "Perineal Tear Repair Skill Return Demo",
    "perineal_tear_repair_skill/debriefing_feedback":
      "Perineal Tear Repair Skill Feedback",

    "cervical_tear_repair_skill/breakout_room_setup":
      "Cervical Tear Repair Skill Room Setup",
    "cervical_tear_repair_skill/learning_outcomes":
      "Cervical Tear Repair Skill Learning Outcomes",
    "cervical_tear_repair_skill/skills_demonstration":
      "Cervical Tear Repair Skill Demo",
    "cervical_tear_repair_skill/return_demonstrations":
      "Cervical Tear Repair Skill Return Demo",
    "cervical_tear_repair_skill/debriefing_feedback":
      "Cervical Tear Repair Skill Feedback",

    "blynch_suture_skill/breakout_room_setup": "B-Lynch Suture Skill Room Setup",
    "blynch_suture_skill/learning_outcomes": "B-Lynch Suture Skill Learning Outcomes",
    "blynch_suture_skill/skills_demonstration": "B-Lynch Suture Skill Demo",
    "blynch_suture_skill/return_demonstrations": "B-Lynch Suture Skill Return Demo",
    "blynch_suture_skill/debriefing_feedback": "B-Lynch Suture Skill Feedback",

    "nasg_placement_skill/breakout_room_setup": "NASG Placement Skill Room Setup",
    "nasg_placement_skill/learning_outcomes": "NASG Placement Skill Learning Outcomes",
    "nasg_placement_skill/skills_demonstration": "NASG Placement Skill Demo",
    "nasg_placement_skill/return_demonstrations": "NASG Placement Skill Return Demo",
    "nasg_placement_skill/debriefing_feedback": "NASG Placement Skill Feedback",

    "vaginal_breech_skill/breakout_room_setup": "Vaginal Breech Skill Room Setup",
    "vaginal_breech_skill/learning_outcomes":
      "Vaginal Breech Skill Learning Outcomes",
    "vaginal_breech_skill/skills_demonstration": "Vaginal Breech Skill Demo",
    "vaginal_breech_skill/return_demonstrations":
      "Vaginal Breech Skill Return Demo",
    "vaginal_breech_skill/debriefing_feedback": "Vaginal Breech Skill Feedback",

    "shoulder_dystocia_skill/breakout_room_setup":
      "Shoulder Dystocia Skill Room Setup",
    "shoulder_dystocia_skill/learning_outcomes":
      "Shoulder Dystocia Skill Learning Outcomes",
    "shoulder_dystocia_skill/skills_demonstration": "Shoulder Dystocia Skill Demo",
    "shoulder_dystocia_skill/return_demonstrations":
      "Shoulder Dystocia Skill Return Demo",
    "shoulder_dystocia_skill/debriefing_feedback":
      "Shoulder Dystocia Skill Feedback",

    "vacuum_delivery_skill/breakout_room_setup":
      "Vacuum Delivery Skill Room Setup",
    "vacuum_delivery_skill/learning_outcomes":
      "Vacuum Delivery Skill Learning Outcomes",
    "vacuum_delivery_skill/skills_demonstration": "Vacuum Delivery Skill Demo",
    "vacuum_delivery_skill/return_demonstrations":
      "Vacuum Delivery Skill Return Demo",
    "vacuum_delivery_skill/debriefing_feedback": "Vacuum Delivery Skill Feedback",

    "maternal_resuscitation_skill/breakout_room_setup":
      "Maternal Resuscitation Skill Room Setup",
    "maternal_resuscitation_skill/learning_outcomes":
      "Maternal Resuscitation Skill Learning Outcomes",
    "maternal_resuscitation_skill/skills_demonstration":
      "Maternal Resuscitation Skill Demo",
    "maternal_resuscitation_skill/return_demonstrations":
      "Maternal Resuscitation Skill Return Demo",
    "maternal_resuscitation_skill/debriefing_feedback":
      "Maternal Resuscitation Skill Feedback",

    "maternal_shock_skill/breakout_room_setup": "Maternal Shock Skill Room Setup",
    "maternal_shock_skill/learning_outcomes":
      "Maternal Shock Skill Learning Outcomes",
    "maternal_shock_skill/skills_demonstration": "Maternal Shock Skill Demo",
    "maternal_shock_skill/return_demonstrations":
      "Maternal Shock Skill Return Demo",
    "maternal_shock_skill/debriefing_feedback": "Maternal Shock Skill Feedback",

    "newborn_resuscitation_skill/breakout_room_setup":
      "Newborn Resuscitation Skill Room Setup",
    "newborn_resuscitation_skill/learning_outcomes":
      "Newborn Resuscitation Skill Learning Outcomes",
    "newborn_resuscitation_skill/skills_demonstration":
      "Newborn Resuscitation Skill Demo",
    "newborn_resuscitation_skill/return_demonstrations":
      "Newborn Resuscitation Skill Return Demo",
    "newborn_resuscitation_skill/debriefing_feedback":
      "Newborn Resuscitation Skill Feedback",

    "preeclampsia_eclampsia_skill/breakout_room_setup":
      "Preeclampsia & Eclampsia Skill Room Setup",
    "preeclampsia_eclampsia_skill/learning_outcomes":
      "Preeclampsia & Eclampsia Skill Learning Outcomes",
    "preeclampsia_eclampsia_skill/skills_demonstration":
      "Preeclampsia & Eclampsia Skill Demo",
    "preeclampsia_eclampsia_skill/return_demonstrations":
      "Preeclampsia & Eclampsia Skill Return Demo",
    "preeclampsia_eclampsia_skill/debriefing_feedback":
      "Preeclampsia & Eclampsia Skill Feedback",

    "partograph_checklist_skill/breakout_room_setup":
      "Partograph Checklist Skill Room Setup",
    "partograph_checklist_skill/learning_outcomes":
      "Partograph Checklist Skill Learning Outcomes",
    "partograph_checklist_skill/skills_demonstration":
      "Partograph Checklist Skill Demo",
    "partograph_checklist_skill/return_demonstrations":
      "Partograph Checklist Skill Return Demo",
    "partograph_checklist_skill/debriefing_feedback":
      "Partograph Checklist Skill Feedback",

    "emotive_response_skill/breakout_room_setup":
      "Emotive Response Skill Room Setup",
    "emotive_response_skill/learning_outcomes":
      "Emotive Response Skill Learning Outcomes",
    "emotive_response_skill/skills_demonstration": "Emotive Response Skill Demo",
    "emotive_response_skill/return_demonstrations":
      "Emotive Response Skill Return Demo",
    "emotive_response_skill/debriefing_feedback": "Emotive Response Skill Feedback",

    "pph_drill/room_setup": "PPH Drill Room Setup",
    "pph_drill/patient_preparation": "PPH Drill Patient Preparation",
    "pph_drill/briefing": "PPH Drill Briefing",
    "pph_drill/drill_running": "PPH Drill Running",
    "pph_drill/debriefing": "PPH Drill Debriefing",

    "eclampsia_drill/room_setup": "Eclampsia Drill Room Setup",
    "eclampsia_drill/patient_preparation": "Eclampsia Drill Patient Preparation",
    "eclampsia_drill/briefing": "Eclampsia Drill Briefing",
    "eclampsia_drill/drill_running": "Eclampsia Drill Running",
    "eclampsia_drill/debriefing": "Eclampsia Drill Debriefing"
  };

  // --- Build mapping: selectedKeys aligns with cleanedHeaders ---
  var selectedKeys = [];
  var cleanedHeaders = [];
  var oldNames = Object.keys(columnMap);
  for (var m = 0; m < oldNames.length; m++) {
    var oldName = oldNames[m];
    selectedKeys.push(oldName);
    cleanedHeaders.push(columnMap[oldName]);
  }

  // --- Add ratio columns after "Total Trainees" if present ---
  var traineeIndex = cleanedHeaders.indexOf("Total Trainees");
  if (traineeIndex !== -1) {
    cleanedHeaders.splice(
      traineeIndex + 1,
      0,
      "Facilitator Trainee Ratio",
      "Ratio Achieved"
    );
    selectedKeys.splice(traineeIndex + 1, 0, null, null);
  }

  // --- Insert section score columns after Eclampsia Drill Debriefing ---
  var sectionCols = [
    "Pre-Training Assessment",
    "Lecturette Content Delivery",
    "Skills Training Delivery",
    "Simulation Drill Delivery",
    "Training Quality Score"
  ];
  var eclampsiaIndex = cleanedHeaders.indexOf("Eclampsia Drill Debriefing");
  if (eclampsiaIndex !== -1) {
    for (var s = 0; s < sectionCols.length; s++) {
      cleanedHeaders.splice(eclampsiaIndex + 1 + s, 0, sectionCols[s]);
      selectedKeys.splice(eclampsiaIndex + 1 + s, 0, null);
    }
  } else {
    for (var s2 = 0; s2 < sectionCols.length; s2++) {
      cleanedHeaders.push(sectionCols[s2]);
      selectedKeys.push(null);
    }
  }

  var preTrainingCols = [
    "Venue Appropriateness",
    "Seating Space",
    "Audiovisual Equipment",
    "Training Material",
    "Ratio Achieved",
    "Facilitators MoH Trained",
    "Facilitators Available",
    "Training Schedule",
    "Participant Criteria"
  ];

  var lecturetteCols = [
    "CME Partograph Clarity",
    "CME Partograph Engagement",
    "CME Partograph Time Management",
    "CME Partograph Interaction",
    "CME AMTSL Clarity",
    "CME AMTSL Engagement",
    "CME AMTSL Time Management",
    "CME AMTSL Interaction",
    "CME PPH Clarity",
    "CME PPH Engagement",
    "CME PPH Time Management",
    "CME PPH Interaction",
    "CME Cord Prolapse Clarity",
    "CME Cord Prolapse Engagement",
    "CME Cord Prolapse Time Management",
    "CME Cord Prolapse Interaction",
    "CME Shoulder Dystocia Clarity",
    "CME Shoulder Dystocia Engagement",
    "CME Shoulder Dystocia Time Management",
    "CME Shoulder Dystocia Interaction",
    "CME Vaginal Breech Clarity",
    "CME Vaginal Breech Engagement",
    "CME Vaginal Breech Time Management",
    "CME Vaginal Breech Interaction",
    "CME AVD Clarity",
    "CME AVD Engagement",
    "CME AVD Time Management",
    "CME AVD Interaction",
    "CME Preeclampsia-Eclampsia Clarity",
    "CME Preeclampsia-Eclampsia Engagement",
    "CME Preeclampsia-Eclampsia Time Management",
    "CME Preeclampsia-Eclampsia Interaction",
    "CME Maternal Shock Clarity",
    "CME Maternal Shock Engagement",
    "CME Maternal Shock Time Management",
    "CME Maternal Shock Interaction",
    "CME Maternal Resuscitation Clarity",
    "CME Maternal Resuscitation Engagement",
    "CME Maternal Resuscitation Time Management",
    "CME Maternal Resuscitation Interaction",
    "CME NNR Clarity",
    "CME NNR Engagement",
    "CME NNR Time Management",
    "CME NNR Interaction",
    "CME APH Clarity",
    "CME APH Engagement",
    "CME APH Time Management",
    "CME APH Interaction",
    "CME Obstructed Labor Clarity",
    "CME Obstructed Labor Engagement",
    "CME Obstructed Labor Time Management",
    "CME Obstructed Labor Interaction"
  ];

  var skillsCols = [
    "AMTSL Skill Room Setup",
    "AMTSL Skill Learning Outcomes",
    "AMTSL Skill Demo",
    "AMTSL Skill Return Demo",
    "AMTSL Skill Feedback",
    "Cord Prolapse Skill Room Setup",
    "Cord Prolapse Skill Learning Outcomes",
    "Cord Prolapse Skill Demo",
    "Cord Prolapse Skill Return Demo",
    "Cord Prolapse Skill Feedback",
    "Bimanual Compression Skill Room Setup",
    "Bimanual Compression Skill Learning Outcomes",
    "Bimanual Compression Skill Demo",
    "Bimanual Compression Skill Return Demo",
    "Bimanual Compression Skill Feedback",
    "Abdominal Aorta Compression Skill Room Setup",
    "Abdominal Aorta Compression Skill Learning Outcomes",
    "Abdominal Aorta Compression Skill Demo",
    "Abdominal Aorta Compression Skill Return Demo",
    "Abdominal Aorta Compression Skill Feedback",
    "Retained Placenta Removal Skill Room Setup",
    "Retained Placenta Removal Skill Learning Outcomes",
    "Retained Placenta Removal Skill Demo",
    "Retained Placenta Removal Skill Return Demo",
    "Retained Placenta Removal Skill Feedback",
    "Uterine Inversion Skill Room Setup",
    "Uterine Inversion Skill Learning Outcomes",
    "Uterine Inversion Skill Demo",
    "Uterine Inversion Skill Return Demo",
    "Uterine Inversion Skill Feedback",
    "UBT Placement Skill Room Setup",
    "UBT Placement Skill Learning Outcomes",
    "UBT Placement Skill Demo",
    "UBT Placement Skill Return Demo",
    "UBT Placement Skill Feedback",
    "UBT Freeflow Skill Room Setup",
    "UBT Freeflow Skill Learning Outcomes",
    "UBT Freeflow Skill Demo",
    "UBT Freeflow Skill Return Demo",
    "UBT Freeflow Skill Feedback",
    "Perineal Tear Repair Skill Room Setup",
    "Perineal Tear Repair Skill Learning Outcomes",
    "Perineal Tear Repair Skill Demo",
    "Perineal Tear Repair Skill Return Demo",
    "Perineal Tear Repair Skill Feedback",
    "Cervical Tear Repair Skill Room Setup",
    "Cervical Tear Repair Skill Learning Outcomes",
    "Cervical Tear Repair Skill Demo",
    "Cervical Tear Repair Skill Return Demo",
    "Cervical Tear Repair Skill Feedback",
    "B-Lynch Suture Skill Room Setup",
    "B-Lynch Suture Skill Learning Outcomes",
    "B-Lynch Suture Skill Demo",
    "B-Lynch Suture Skill Return Demo",
    "B-Lynch Suture Skill Feedback",
    "NASG Placement Skill Room Setup",
    "NASG Placement Skill Learning Outcomes",
    "NASG Placement Skill Demo",
    "NASG Placement Skill Return Demo",
    "NASG Placement Skill Feedback",
    "Vaginal Breech Skill Room Setup",
    "Vaginal Breech Skill Learning Outcomes",
    "Vaginal Breech Skill Demo",
    "Vaginal Breech Skill Return Demo",
    "Vaginal Breech Skill Feedback",
    "Shoulder Dystocia Skill Room Setup",
    "Shoulder Dystocia Skill Learning Outcomes",
    "Shoulder Dystocia Skill Demo",
    "Shoulder Dystocia Skill Return Demo",
    "Shoulder Dystocia Skill Feedback",
    "Vacuum Delivery Skill Room Setup",
    "Vacuum Delivery Skill Learning Outcomes",
    "Vacuum Delivery Skill Demo",
    "Vacuum Delivery Skill Return Demo",
    "Vacuum Delivery Skill Feedback",
    "Maternal Resuscitation Skill Room Setup",
    "Maternal Resuscitation Skill Learning Outcomes",
    "Maternal Resuscitation Skill Demo",
    "Maternal Resuscitation Skill Return Demo",
    "Maternal Resuscitation Skill Feedback",
    "Maternal Shock Skill Room Setup",
    "Maternal Shock Skill Learning Outcomes",
    "Maternal Shock Skill Demo",
    "Maternal Shock Skill Return Demo",
    "Maternal Shock Skill Feedback",
    "Newborn Resuscitation Skill Room Setup",
    "Newborn Resuscitation Skill Learning Outcomes",
    "Newborn Resuscitation Skill Demo",
    "Newborn Resuscitation Skill Return Demo",
    "Newborn Resuscitation Skill Feedback",
    "Preeclampsia & Eclampsia Skill Room Setup",
    "Preeclampsia & Eclampsia Skill Learning Outcomes",
    "Preeclampsia & Eclampsia Skill Demo",
    "Preeclampsia & Eclampsia Skill Return Demo",
    "Preeclampsia & Eclampsia Skill Feedback",
    "Partograph Checklist Skill Room Setup",
    "Partograph Checklist Skill Learning Outcomes",
    "Partograph Checklist Skill Demo",
    "Partograph Checklist Skill Return Demo",
    "Partograph Checklist Skill Feedback",
    "Emotive Response Skill Room Setup",
    "Emotive Response Skill Learning Outcomes",
    "Emotive Response Skill Demo",
    "Emotive Response Skill Return Demo",
    "Emotive Response Skill Feedback"
  ];

  var drillCols = [
    "PPH Drill Room Setup",
    "PPH Drill Patient Preparation",
    "PPH Drill Briefing",
    "PPH Drill Running",
    "PPH Drill Debriefing",
    "Eclampsia Drill Room Setup",
    "Eclampsia Drill Patient Preparation",
    "Eclampsia Drill Briefing",
    "Eclampsia Drill Running",
    "Eclampsia Drill Debriefing"
  ];

  // Chronological order (API returns newest-first)
  var rows = submissions.slice().reverse();

  var cleanedData = rows.map(function (sub) {
    var newRow = [];

    var fac = parseFloat(getKoboField_(sub, "total_facilitators")) || 0;
    var tra = parseFloat(getKoboField_(sub, "total_trainees")) || 0;
    var ratio = tra > 0 ? fac / tra : 0;
    var ratioDisplay = (ratio * 100).toFixed(1) + "%";
    var ratioAchieved =
      ratio >= 0.25 ? "yes" : ratio >= 0.2 ? "partially" : "no";

    for (var i = 0; i < cleanedHeaders.length; i++) {
      var srcKey = selectedKeys[i];
      var hdr = cleanedHeaders[i];

      if (srcKey !== null && typeof srcKey !== "undefined") {
        newRow.push(getKoboField_(sub, srcKey));
      } else if (hdr === "Facilitator Trainee Ratio") {
        newRow.push(ratioDisplay);
      } else if (hdr === "Ratio Achieved") {
        newRow.push(ratioAchieved);
      } else {
        newRow.push("");
      }
    }

    function valueFor(headerName) {
      var idx = cleanedHeaders.indexOf(headerName);
      if (idx === -1) return "";
      return newRow[idx];
    }

    var preTotal = 0;
    var preMax = 0;
    preTrainingCols.forEach(function (col) {
      var val = (valueFor(col) || "").toString().toLowerCase();
      if (val === "yes") preTotal += 2;
      else if (val === "partially") preTotal += 1;
      preMax += 2;
    });
    var preScore = preMax > 0 ? (preTotal / preMax) * 100 : 0;

    var lecTotal = 0;
    var lecMax = 0;
    lecturetteCols.forEach(function (col) {
      var val = valueFor(col);
      if (val == 1) lecTotal += 0.5;
      lecMax += 0.5;
    });
    var lecScore = lecMax > 0 ? (lecTotal / lecMax) * 100 : 0;

    var skillTotal = 0;
    var skillMax = 0;
    skillsCols.forEach(function (col) {
      var val = valueFor(col);
      if (val == 1) skillTotal += 0.4;
      skillMax += 0.4;
    });
    var skillScore = skillMax > 0 ? (skillTotal / skillMax) * 100 : 0;

    var drillTotal = 0;
    var drillMax = 0;
    drillCols.forEach(function (col) {
      var val = valueFor(col);
      if (val == 1) drillTotal += 0.4;
      drillMax += 0.4;
    });
    var drillScore = drillMax > 0 ? (drillTotal / drillMax) * 100 : 0;

    var preScoreFmt = parseFloat(preScore.toFixed(1));
    var lecScoreFmt = parseFloat(lecScore.toFixed(1));
    var skillScoreFmt = parseFloat(skillScore.toFixed(1));
    var drillScoreFmt = parseFloat(drillScore.toFixed(1));
    var overallScore = parseFloat(
      ((preScore + lecScore + skillScore + drillScore) / 4).toFixed(1)
    );

    var preIdx = cleanedHeaders.indexOf("Pre-Training Assessment");
    var lecIdx = cleanedHeaders.indexOf("Lecturette Content Delivery");
    var skillIdx = cleanedHeaders.indexOf("Skills Training Delivery");
    var drillIdx = cleanedHeaders.indexOf("Simulation Drill Delivery");
    var overallIdx = cleanedHeaders.indexOf("Training Quality Score");

    if (preIdx !== -1) newRow[preIdx] = preScoreFmt;
    if (lecIdx !== -1) newRow[lecIdx] = lecScoreFmt;
    if (skillIdx !== -1) newRow[skillIdx] = skillScoreFmt;
    if (drillIdx !== -1) newRow[drillIdx] = drillScoreFmt;
    if (overallIdx !== -1) newRow[overallIdx] = overallScore;

    return newRow;
  });

  cleanedData.unshift(cleanedHeaders);
  targetSheet
    .getRange(1, 1, cleanedData.length, cleanedData[0].length)
    .setValues(cleanedData);
  targetSheet.autoResizeColumns(1, cleanedHeaders.length);

  SpreadsheetApp.getUi().alert(
    "'" +
      TRAINING_QA_SHEET_NAME +
      "' sheet created successfully with " +
      (cleanedData.length - 1) +
      " records."
  );
}
