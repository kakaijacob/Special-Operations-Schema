/**
 * QuIPS — data extraction and transformation into columns.
 *
 * Paste these five files into one Apps Script project:
 *   QuIPS_Secrets.js
 *   QuIPS_Data_Extraction.js          (this file — run fetchKoboData_Generic)
 *   QuIPS_Facility_Targets.js
 *   QuIPS_Scoring.js
 *   QuIPS_Data_Quality.js
 *
 * fetchKoboData_Generic pulls new Kobo submissions, flattens them, and
 * appends one row per new _uuid on the transformed-data sheet. Column
 * order is the key order of quipsBuildTransformedRow_. Append new fields
 * at the end of that object so existing sheets stay aligned.
 * Scores are added by QuIPS_Scoring.js. Integrity columns are written
 * afterwards by QuIPS_Data_Quality.js.
 */

function fetchKoboData_Generic() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    Logger.log("Could not obtain script lock; another run is in progress.");
    return;
  }

  try {
    fetchKoboData_GenericLocked_();
  } finally {
    lock.releaseLock();
  }
}

function fetchKoboData_GenericLocked_() {
  var secrets = getQuipsSecrets_();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(secrets.sheetName) || ss.insertSheet(secrets.sheetName);

  var queryObj = {
    "_submission_time": { "$gte": secrets.startDate }
  };

  var url =
    secrets.koboDataServer + "/api/v2/assets/" + secrets.formUid + "/data/" +
    "?format=json&query=" + encodeURIComponent(JSON.stringify(queryObj)) +
    "&ordering=-_submission_time&limit=100";

  var options = {
    method: "get",
    headers: { "Authorization": "Token " + secrets.apiToken }
  };

  var allResults = [];

  while (url) {
    var response = UrlFetchApp.fetch(url, options);
    var json = JSON.parse(response.getContentText());

    if (json.results && json.results.length) {
      allResults = allResults.concat(json.results);
    }

    url = json.next;
  }

  if (allResults.length === 0) {
    applyNegativeDurationConditionalFormatting(sheet);
    refreshObserverTimingIntegrityChecks(sheet);
    return;
  }

  var existingIds = new Set();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow > 1 && lastCol > 0) {
    var headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var uuidCol = headerRow.indexOf("_uuid") + 1;
    if (uuidCol < 1) uuidCol = 1;

    var numDataRows = lastRow - 1;
    sheet.getRange(2, uuidCol, numDataRows, 1)
      .getValues()
      .forEach(function (r) {
        if (r[0]) existingIds.add(String(r[0]));
      });
  }

  var transformedData = [];

  allResults.forEach(function (record) {
    var uuid = record._uuid ? String(record._uuid) : "";
    if (!uuid || existingIds.has(uuid)) return;
    existingIds.add(uuid);

    var flat = quipsFlatten_(record);
    var transformed = quipsBuildTransformedRow_(flat);

    transformed.quality_care_score = calculateQualityCareScore(transformed);

    var sectionScores = calculateSectionScores(transformed);
    transformed.birth_preparedness = sectionScores.birth_preparedness;
    transformed.technical_quality_postbirth = sectionScores.technical_quality_postbirth;
    transformed.postbirth_infection_prevention = sectionScores.postbirth_infection_prevention;
    transformed.respectful_maternity_care = sectionScores.respectful_maternity_care;
    transformed.avoidance_harmful_practices = sectionScores.avoidance_harmful_practices;
    transformed.partograph_review = sectionScores.partograph_review;
    transformed.labor_care_guide_review = sectionScores.labor_care_guide_review;

    transformedData.push(transformed);
  });

  if (transformedData.length > 0) {
    var headers = Object.keys(transformedData[0]);

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    var rows = transformedData.map(function (obj) {
      return headers.map(function (h) { return obj[h] || ""; });
    });

    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length)
      .setValues(rows);

    Logger.log("Inserted " + rows.length + " new records.");
  }

  applyNegativeDurationConditionalFormatting(sheet);
  refreshObserverTimingIntegrityChecks(sheet);
}

function quipsFlatten_(obj, prefix) {
  var result = {};
  prefix = prefix || "";

  for (var key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    var value = obj[key];
    var newKey = prefix ? prefix + "/" + key : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      var nested = quipsFlatten_(value, newKey);
      for (var nestedKey in nested) {
        if (Object.prototype.hasOwnProperty.call(nested, nestedKey)) {
          result[nestedKey] = nested[nestedKey];
        }
      }
    } else {
      result[newKey] = Array.isArray(value) ? value.join(" ") : value;
    }
  }

  return result;
}

function quipsIncludes_(value, token) {
  return String(value || "").split(" ").includes(token);
}

function quipsYesNo_(value, token) {
  return quipsIncludes_(value, token) ? "Yes" : "No";
}

function quipsFormatDateTime_(value) {
  if (!value) return "";
  var d = new Date(value);
  if (isNaN(d)) return value;
  return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
}

function quipsFormatTime_(value) {
  if (!value) return "";
  var d = new Date(value);
  if (!isNaN(d)) {
    return Utilities.formatDate(d, Session.getScriptTimeZone(), "HH:mm:ss");
  }
  var match = String(value).match(/(\d{2}:\d{2}:\d{2})/);
  return match ? match[1] : "";
}

function quipsTimeToSeconds_(value) {
  if (!value) return null;
  var parts = value.toString().split(":");
  if (parts.length < 2) return null;

  var hh = parseInt(parts[0], 10);
  var mm = parseInt(parts[1], 10);
  var ss = parseInt(parts[2] || "0", 10);

  if (isNaN(hh) || isNaN(mm)) return null;

  return (hh * 3600) + (mm * 60) + ss;
}

function quipsSecondsToHHMMSS_(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined || totalSeconds === "") return "";

  var sign = totalSeconds < 0 ? "-" : "";
  var abs = Math.abs(Math.round(totalSeconds));
  var hh = Math.floor(abs / 3600);
  var mm = Math.floor((abs % 3600) / 60);
  var ss = abs % 60;

  return sign +
    String(hh).padStart(2, "0") + ":" +
    String(mm).padStart(2, "0") + ":" +
    String(ss).padStart(2, "0");
}

function quipsDuration_(start, end) {
  var s = quipsTimeToSeconds_(start);
  var e = quipsTimeToSeconds_(end);
  if (s == null || e == null) return "";
  return quipsSecondsToHHMMSS_(e - s);
}

function quipsTitleCase_(str) {
  if (!str) return "";
  return str.toString()
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, function (l) { return l.toUpperCase(); });
}

function quipsCleanText_(str) {
  if (!str) return "";
  return str.toString().replace(/_/g, " ");
}

function quipsExtractFacilityDetails_(value) {
  if (!value) return { facility_code: "", facility: "" };
  var parts = value.split("_");
  return {
    facility_code: parts[0] || "",
    facility: quipsTitleCase_(parts.slice(1).join(" "))
  };
}

function quipsClassifySelectMultiple_(value, requiredItems) {
  if (!value) return "";

  var selected = String(value).split(" ").filter(Boolean);
  var set = {};
  selected.forEach(function (item) { set[item] = true; });

  if (set.none_of_above) return "Never";
  if (set.unable_to_observe) return "Unable to observe";

  var hasAll = requiredItems.every(function (item) { return set[item]; });
  var hasAny = requiredItems.some(function (item) { return set[item]; });

  if (hasAll) return "Always";
  if (hasAny) return "Sometimes";

  return "";
}

function quipsFormatCellValue_(value) {
  if (!value) return "";

  var cleaned = value
    .toString()
    .replace(/_/g, " ")
    .toLowerCase()
    .trim();

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function quipsTimelyUterotonic_(flat) {
  var d = quipsTimeToSeconds_(flat["technical_quality/delivery_time"]);
  var u = quipsTimeToSeconds_(flat["technical_quality/uterotonic_time"]);
  var take = flat["technical_quality/uterotonic_administered"];

  if (d != null && u != null) {
    var diff = u - d;
    if (diff < 0) return "";
    return (u - d <= 60) ? "Yes" : "No";
  }

  if (!take || take === "") return "";
  if (take === "none_of_the_above") return "Not Given";
  if (take === "Unable_to_observe") return "Unable to observe";
  return "";
}

function quipsAdequateSkinToSkin_(flat) {
  var s = quipsTimeToSeconds_(flat["technical_quality/skin_to_skin_initiation"]);
  var e = quipsTimeToSeconds_(flat["technical_quality/skin_to_skin_discontinued"]);
  var status = flat["technical_quality/skin_to_skin"];

  if (s != null && e != null) {
    var diff = e - s;
    if (diff < 0) return "";
    return (e - s >= 3600) ? "Yes" : "No";
  }

  if (!status || status === "") return "Resuscitation required";
  if (status === "No") return "Not initiated";
  if (status === "unable_to_observe") return "Unable to observe";
  return "";
}

function quipsTimelyCordClamp_(flat) {
  var d = quipsTimeToSeconds_(flat["technical_quality/delivery_time"]);
  var c = quipsTimeToSeconds_(flat["technical_quality/delayed_cord_clamp"]);
  var status = flat["technical_quality/delayed_cord_clamp"];

  if (d != null && c != null) {
    var diff = c - d;
    if (diff < 0) return "";
    return (diff >= 120 && diff <= 180) ? "Yes" : "No";
  }

  if (!status || status === "") return "Resuscitation required";
  if (status === "no") return "Not performed";
  if (status === "Unable_to_observe") return "Unable to observe";
  return "";
}

function quipsTimelyWithin_(startRaw, endRaw, take, limitSeconds, noLabel, unableToken) {
  var start = quipsTimeToSeconds_(startRaw);
  var end = quipsTimeToSeconds_(endRaw);

  if (start != null && end != null) {
    var diff = end - start;
    if (diff < 0) return "";
    return (diff <= limitSeconds) ? "Yes" : "No";
  }

  if (take === "no") return noLabel;
  if (unableToken && take === unableToken) return "Unable to observe";
  return "Unable to observe";
}

function quipsTimelyMotherBp_(flat) {
  var p = quipsTimeToSeconds_(flat["technical_quality/placenta_delivery_time"]);
  var b = quipsTimeToSeconds_(flat["technical_quality/mother_bp_time"]);
  var take = flat["technical_quality/take_mother_bp"];

  if (p != null && b != null) {
    var diff = b - p;
    if (diff < 0) return "";
    return (b - p <= 900) ? "Yes" : "No";
  }

  if (!take || take === "") return "";
  if (take === "no") return "Not taken";
  if (take === "") return "Unable to observe";
  return "Unable to observe";
}

function quipsTimelyFromDiagnosis_(diagnosisRaw, eventRaw) {
  var p = quipsTimeToSeconds_(quipsFormatTime_(diagnosisRaw));
  var event = quipsTimeToSeconds_(quipsFormatTime_(eventRaw));
  if (p == null || event == null) return "";
  var diff = event - p;
  if (diff < 0) return "";
  return (diff <= 900) ? "Yes" : "No";
}

function quipsBuildTransformedRow_(flat) {
  var facilityRaw =
    flat["facility_observer_details/facility_mombasa"] ||
    flat["facility_observer_details/facility_nakuru"] ||
    flat["facility_observer_details/facility_muranga"] || "";

  var facilityInfo = quipsExtractFacilityDetails_(facilityRaw);
  var gear = flat["birth_preparation/protective_gear"];
  var explanations = flat["respectful_maternity_care/provider_explanations"];
  var spokenDirectly = flat["respectful_maternity_care/spoken_to_directly"];
  var spokenKindly = flat["respectful_maternity_care/spoken_to_kindly"];
  var disrespect = flat["respectful_maternity_care/disrespect_to_mother"];
  var partographAccuracy = flat["partograph_review/accuracy_concern_category"];
  var lcgAccuracy = flat["labor_care_guide/accuracy_concern_category_lcg"];
  var intervention = flat["group_observer_feedback/observer_intervention"];

  return {
    _uuid: flat["_uuid"],
    date_started: quipsFormatDateTime_(flat["start"]),
    date_ended: quipsFormatDateTime_(flat["end"]),
    date_submitted: quipsFormatDateTime_(flat["_submission_time"]),

    month: Utilities.formatDate(
      new Date(flat["_submission_time"]),
      Session.getScriptTimeZone(),
      "MMMM"
    ),

    observation_date: quipsFormatDateTime_(flat["facility_observer_details/date"]),
    county: flat["facility_observer_details/county"],
    facility_code: facilityInfo.facility_code,
    facility: facilityInfo.facility,

    observer_name: quipsTitleCase_(
      ((flat["facility_observer_details/first_name"] || "") + " " +
        (flat["facility_observer_details/second_name"] || "")).trim()
    ),

    cadre: quipsFormatCellValue_(quipsCleanText_(flat["facility_observer_details/primary_provider"])),
    target_observations: getQuipsFacilityTarget_(facilityInfo.facility_code),
    labor_monitoring_tool: quipsFormatCellValue_(flat["facility_observer_details/labor_monitoring_tool"]),

    hand_hygiene: quipsFormatCellValue_(flat["birth_preparation/hand_washing"]),

    ppe_gloves: quipsYesNo_(gear, "gloves"),
    ppe_mask: quipsYesNo_(gear, "mask"),
    ppe_gown: quipsYesNo_(gear, "gown"),
    ppe_boots: quipsYesNo_(gear, "boots"),
    ppe_goggles: quipsYesNo_(gear, "face_shield_goggles"),
    ppe_cap: quipsYesNo_(gear, "cap"),
    no_ppe_used: quipsYesNo_(gear, "no_ppe_was_used"),

    nnr_equipment_preparation: quipsFormatCellValue_(flat["birth_preparation/nnr_equipment_prep"]),
    uterotonic_preparation: quipsFormatCellValue_(flat["birth_preparation/uterotonic_prep"]),

    delivery_time: quipsFormatTime_(flat["technical_quality/delivery_time"]),

    ruleout_twin: quipsFormatCellValue_(flat["technical_quality/ruleout_twin"]),
    drying_stimulation: quipsFormatCellValue_(flat["technical_quality/drying_stimulation"]),
    discard_wet_towel: quipsFormatCellValue_(flat["technical_quality/discard_wet_towel"]),
    baby_resuscitation: quipsFormatCellValue_(flat["technical_quality/baby_resuscitation"]),

    uterotonic_administered: quipsFormatCellValue_(flat["technical_quality/uterotonic_administered"]),
    uterotonic_administration_time: quipsFormatTime_(flat["technical_quality/uterotonic_time"]),
    uterotonic_administration_duration: quipsDuration_(
      flat["technical_quality/delivery_time"],
      flat["technical_quality/uterotonic_time"]
    ),
    timely_uterotonic_administration: quipsTimelyUterotonic_(flat),

    skin_to_skin: quipsFormatCellValue_(flat["technical_quality/skin_to_skin"]),
    skin_to_skin_initiation_time: quipsFormatTime_(flat["technical_quality/skin_to_skin_initiation"]),
    skin_to_skin_discontinued_time: quipsFormatTime_(flat["technical_quality/skin_to_skin_discontinued"]),
    skin_to_skin_duration: quipsDuration_(
      flat["technical_quality/skin_to_skin_initiation"],
      flat["technical_quality/skin_to_skin_discontinued"]
    ),
    adequate_skin_to_skin_time: quipsAdequateSkinToSkin_(flat),

    placenta_delivery_time: quipsFormatCellValue_(quipsFormatTime_(flat["technical_quality/placenta_delivery_time"])),

    delayed_cord_clamp_time: quipsFormatTime_(flat["technical_quality/delayed_cord_clamp"]),
    cord_clamp_duration: quipsDuration_(
      flat["technical_quality/delivery_time"],
      flat["technical_quality/delayed_cord_clamp"]
    ),
    timely_cord_clamp: quipsTimelyCordClamp_(flat),

    take_mother_bp: quipsFormatCellValue_(flat["technical_quality/take_mother_bp"]),
    mother_bp_time: quipsFormatTime_(flat["technical_quality/mother_bp_time"]),
    mother_bp_duration: quipsDuration_(
      flat["technical_quality/placenta_delivery_time"],
      flat["technical_quality/mother_bp_time"]
    ),
    timely_mother_bp: quipsTimelyMotherBp_(flat),

    take_mother_temperature: quipsFormatCellValue_(flat["technical_quality/take_mother_temperature"]),
    mother_temp_time: quipsFormatTime_(flat["technical_quality/mother_temp_time"]),
    mother_temp_duration: quipsDuration_(
      flat["technical_quality/placenta_delivery_time"],
      flat["technical_quality/mother_temp_time"]
    ),
    timely_mother_temp: quipsTimelyWithin_(
      flat["technical_quality/placenta_delivery_time"],
      flat["technical_quality/mother_temp_time"],
      flat["technical_quality/take_mother_temperature"],
      900,
      "Not taken",
      "Unable_to_observe"
    ),

    take_mother_pulse: quipsFormatCellValue_(flat["technical_quality/take_mother_pulse"]),
    mother_pulse_time: quipsFormatTime_(flat["technical_quality/mother_pulse_time"]),
    mother_pulse_duration: quipsDuration_(
      flat["technical_quality/placenta_delivery_time"],
      flat["technical_quality/mother_pulse_time"]
    ),
    timely_mother_pulse: quipsTimelyWithin_(
      flat["technical_quality/placenta_delivery_time"],
      flat["technical_quality/mother_pulse_time"],
      flat["technical_quality/take_mother_pulse"],
      900,
      "Not taken",
      "Unable_to_observe"
    ),

    administer_vitamin_k: quipsFormatCellValue_(flat["technical_quality/administer_vitamin"]),
    vitamink_administration_time: quipsFormatTime_(flat["technical_quality/vitamin_K_time"]),
    vitamink_administration_duration: quipsDuration_(
      flat["technical_quality/delivery_time"],
      flat["technical_quality/vitamin_K_time"]
    ),
    timely_vitamink_administration: quipsTimelyWithin_(
      flat["technical_quality/delivery_time"],
      flat["technical_quality/vitamin_K_time"],
      flat["technical_quality/administer_vitamin"],
      3600,
      "Not given",
      "Unable_to_observe"
    ),

    provider_initiate_breastfeeding: quipsFormatCellValue_(flat["technical_quality/initiate_breastfeeding"]),
    breastfeeding_initiation_time: quipsFormatTime_(flat["technical_quality/breastfeeding_initiation_time"]),
    breastfeeding_initiation_duration: quipsDuration_(
      flat["technical_quality/delivery_time"],
      flat["technical_quality/breastfeeding_initiation_time"]
    ),
    timely_breastfeeding_initiation: quipsTimelyWithin_(
      flat["technical_quality/delivery_time"],
      flat["technical_quality/breastfeeding_initiation_time"],
      flat["technical_quality/initiate_breastfeeding"],
      3600,
      "Not initiated",
      "Unable_to_observe"
    ),

    sterilized_blade_clamp: quipsFormatCellValue_(flat["technical_quality/sterilized_blade_clamp"]),
    newborn_kept_warm: quipsFormatCellValue_(flat["technical_quality/newborn_kept_warm"]),
    controlled_cord_traction: quipsFormatCellValue_(flat["technical_quality/controlled_cord_traction"]),
    placenta_examination: quipsFormatCellValue_(flat["technical_quality/placenta_examination"]),
    uterine_tone_assessed: flat["technical_quality/uterine_tone_assessed"],
    laceration_check: quipsFormatCellValue_(flat["technical_quality/laceration_check"]),
    method_blood_loss: quipsFormatCellValue_(flat["technical_quality/method_blood_loss"]),
    apgar_min1: quipsFormatCellValue_(flat["technical_quality/apgar_min1"]),
    apgar_min5: quipsFormatCellValue_(flat["technical_quality/apgar_min5"]),

    proper_vdrape_use: quipsFormatCellValue_(flat["technical_quality/proper_vdrape_use"]),
    blood_loss_over_500ml: quipsFormatCellValue_(flat["technical_quality/blood_loss_amount"]),
    pph_suspicion_diagnosis: quipsFormatCellValue_(flat["technical_quality/pph_suspicion_diagnosis"]),
    pph_clinical_signs: quipsFormatCellValue_(flat["technical_quality/pph_clinical_signs"]),
    pph_diagnosis_time: quipsFormatTime_(flat["technical_quality/pph_diagnosis_time"]),
    uterine_massage_initiated: quipsFormatCellValue_(flat["technical_quality/uterine_massage_initiated"]),
    uterine_massage_time: quipsFormatTime_(flat["technical_quality/uterine_massage_time"]),
    uterine_massage_duration: quipsDuration_(
      flat["technical_quality/pph_diagnosis_time"],
      flat["technical_quality/uterine_massage_time"]
    ),
    timely_uterine_massage: quipsTimelyFromDiagnosis_(
      flat["technical_quality/pph_diagnosis_time"],
      flat["technical_quality/uterine_massage_time"]
    ),

    oxytocin_first_line: quipsFormatCellValue_(flat["technical_quality/oxytocin_first_line"]),
    oxytocin_administration_time: quipsFormatTime_(flat["technical_quality/oxytocin_administration_time"]),
    oxytocin_administration_duration: quipsDuration_(
      flat["technical_quality/pph_diagnosis_time"],
      flat["technical_quality/oxytocin_administration_time"]
    ),
    timely_oxytocin_administration: quipsTimelyFromDiagnosis_(
      flat["technical_quality/pph_diagnosis_time"],
      flat["technical_quality/oxytocin_administration_time"]
    ),

    txa_administered: quipsFormatCellValue_(flat["technical_quality/txa_administered"]),
    txa_administration_time: quipsFormatTime_(flat["technical_quality/txa_administration_time"]),
    txa_administration_duration: quipsDuration_(
      flat["technical_quality/pph_diagnosis_time"],
      flat["technical_quality/txa_administration_time"]
    ),
    timely_txa_administration: quipsTimelyFromDiagnosis_(
      flat["technical_quality/pph_diagnosis_time"],
      flat["technical_quality/txa_administration_time"]
    ),

    iv_access_fluids: quipsFormatCellValue_(flat["technical_quality/iv_access_fluids"]),
    iv_establishment_time: quipsFormatTime_(flat["technical_quality/iv_establishment_time"]),
    iv_establishment_duration: quipsDuration_(
      flat["technical_quality/pph_diagnosis_time"],
      flat["technical_quality/iv_establishment_time"]
    ),
    timely_iv_establishment: quipsTimelyFromDiagnosis_(
      flat["technical_quality/pph_diagnosis_time"],
      flat["technical_quality/iv_establishment_time"]
    ),

    pph_identified_cause: quipsFormatCellValue_(flat["technical_quality/pph_identified_cause"]),
    maternal_bleeding_assessed: quipsFormatCellValue_(flat["technical_quality/mbleeding_assessed"]),

    sharps_disposal: quipsFormatCellValue_(flat["post_birth_ip/sharps_disposal"]),
    waste_disposal: quipsFormatCellValue_(flat["post_birth_ip/waste_disposal"]),

    birth_companion: quipsFormatCellValue_(flat["respectful_maternity_care/birth_companion"]),
    provider_explanations: quipsClassifySelectMultiple_(explanations, [
      "labor_explained_mother",
      "language_simple_clear",
      "procedure_explained_first",
      "mother_informed_choices",
      "consent_obtained_before",
      "progress_updated_regularly",
      "questions_asked_mother"
    ]),
    spoken_to_directly: quipsClassifySelectMultiple_(spokenDirectly, [
      "introduced_self_mother",
      "addressed_mother_name",
      "spoke_directly_mother",
      "encouraged_needs_expression",
      "engaged_companion_support"
    ]),
    spoken_to_kindly: quipsClassifySelectMultiple_(spokenKindly, [
      "responded_mother_needs",
      "showed_empathy_compassion",
      "used_encouragement_praise",
      "listened_actively_mother",
      "positive_attitude_respect",
      "privacy_confidentiality_ensured"
    ]),

    explanations_labor_explained_mother: quipsYesNo_(explanations, "labor_explained_mother"),
    explanations_language_simple_clear: quipsYesNo_(explanations, "language_simple_clear"),
    explanations_procedure_explained_first: quipsYesNo_(explanations, "procedure_explained_first"),
    explanations_mother_informed_choices: quipsYesNo_(explanations, "mother_informed_choices"),
    explanations_consent_obtained_before: quipsYesNo_(explanations, "consent_obtained_before"),
    explanations_progress_updated_regularly: quipsYesNo_(explanations, "progress_updated_regularly"),
    explanations_questions_asked_mother: quipsYesNo_(explanations, "questions_asked_mother"),
    explanations_unable_to_observe: quipsYesNo_(explanations, "unable_to_observe"),
    explanations_none_of_above: quipsYesNo_(explanations, "none_of_above"),

    directly_introduced_self_mother: quipsYesNo_(spokenDirectly, "introduced_self_mother"),
    directly_addressed_mother_name: quipsYesNo_(spokenDirectly, "addressed_mother_name"),
    directly_spoke_directly_mother: quipsYesNo_(spokenDirectly, "spoke_directly_mother"),
    directly_encouraged_needs_expression: quipsYesNo_(spokenDirectly, "encouraged_needs_expression"),
    directly_engaged_companion_support: quipsYesNo_(spokenDirectly, "engaged_companion_support"),
    directly_unable_to_observe: quipsYesNo_(spokenDirectly, "unable_to_observe"),
    directly_none_of_above: quipsYesNo_(spokenDirectly, "none_of_above"),

    kindly_responded_mother_needs: quipsYesNo_(spokenKindly, "responded_mother_needs"),
    kindly_showed_empathy_compassion: quipsYesNo_(spokenKindly, "showed_empathy_compassion"),
    kindly_used_encouragement_praise: quipsYesNo_(spokenKindly, "used_encouragement_praise"),
    kindly_listened_actively_mother: quipsYesNo_(spokenKindly, "listened_actively_mother"),
    kindly_positive_attitude_respect: quipsYesNo_(spokenKindly, "positive_attitude_respect"),
    kindly_privacy_confidentiality_ensured: quipsYesNo_(spokenKindly, "privacy_confidentiality_ensured"),
    kindly_unable_to_observe: quipsYesNo_(spokenKindly, "unable_to_observe"),
    kindly_none_of_above: quipsYesNo_(spokenKindly, "none_of_above"),

    rmc_lack_of_privacy: quipsYesNo_(disrespect, "lack_of_privacy"),
    rmc_non_consented_care: quipsYesNo_(disrespect, "non_consented_care"),
    rmc_physical_abuse: quipsYesNo_(disrespect, "physical_abuse"),
    rmc_verbal_abuse: quipsYesNo_(disrespect, "verbal_abuse"),
    rmc_discrimination: quipsYesNo_(disrespect, "discrimination"),
    rmc_abandonment: quipsYesNo_(disrespect, "abandonment"),
    rmc_denied_pain_relief: quipsYesNo_(disrespect, "denied_pain_relief"),
    rmc_coerced_procedures: quipsYesNo_(disrespect, "coerced_procedures"),
    rmc_unable_to_observe: quipsYesNo_(disrespect, "Unable_to_observe"),
    rmc_no_disrespect_to_mother: quipsIncludes_(disrespect, "Unable_to_observe")
      ? "Unable to observe"
      : quipsIncludes_(disrespect, "mother_did_not_experience_disrespect")
        ? "Yes"
        : "No",

    fundal_pressure: quipsFormatCellValue_(flat["harmful_practices/fundal_pressure"]),
    perineum_stretching: quipsFormatCellValue_(flat["harmful_practices/perineum_stretching"]),
    newborn_slapped: quipsFormatCellValue_(flat["harmful_practices/nb_slapped"]),
    newborn_upside_down: quipsFormatCellValue_(flat["harmful_practices/nb_upside_down"]),

    partogragh_initiation: quipsFormatCellValue_(flat["partograph_review/partogragh_initiation"]),
    partograph_half_hr: quipsFormatCellValue_(flat["partograph_review/partograph_half_hr"]),
    fetal_heart_correct: quipsFormatCellValue_(flat["partograph_review/fetal_heart_correct"]),
    maternal_pulse_correct: flat["partograph_review/maternal_pulse_correct"],
    bp_4hrs: quipsFormatCellValue_(flat["partograph_review/bp_4hrs"]),
    partograph_summary_filled: quipsFormatCellValue_(flat["partograph_review/partograph_summary_filled"]),
    delivery_method_filled: quipsFormatCellValue_(flat["partograph_review/delivery_method_filled"]),
    blood_loss_estimation: quipsFormatCellValue_(flat["partograph_review/blood_loss_estimation"]),
    partograph_accuracy_concern: quipsFormatCellValue_(flat["partograph_review/partograph_accuracy_concern"]),

    accuracy_passenger: quipsYesNo_(partographAccuracy, "passenger__foetal_heart_rate__moulding_a"),
    accuracy_passage: quipsYesNo_(partographAccuracy, "passage__cervical_dilatation_and_head_de"),
    accuracy_powers: quipsYesNo_(partographAccuracy, "powers__contractions"),
    accuracy_maternal_status_vital_signs: quipsYesNo_(partographAccuracy, "maternal_status__vital_signs"),
    accuracy_labour_summary: quipsYesNo_(partographAccuracy, "summary_of_labour_after_delivery"),

    lcg_initiated_correct: quipsFormatCellValue_(flat["labor_care_guide/lcg_initiated_correct"]),
    contractions_monitored_1st: quipsFormatCellValue_(flat["labor_care_guide/contractions_monitored_1st"]),
    fhr_monitored_1st: quipsFormatCellValue_(flat["labor_care_guide/fhr_monitored_1st"]),
    bp_monitored_recorded: quipsFormatCellValue_(flat["labor_care_guide/bp_monitored_recorded"]),
    contractions_monitored_2nd: quipsFormatCellValue_(flat["labor_care_guide/contractions_monitored_2nd"]),
    fhr_monitored_2nd: quipsFormatCellValue_(flat["labor_care_guide/fhr_monitored_2nd"]),
    delivery_time_documented: quipsFormatCellValue_(flat["labor_care_guide/delivery_time_documented"]),
    delivery_method_documented: quipsFormatCellValue_(flat["labor_care_guide/delivery_method_documented"]),
    ebl_documented_correctly: quipsFormatCellValue_(flat["labor_care_guide/ebl_documented_correctly"]),
    lcg_accuracy_concerns: quipsFormatCellValue_(flat["labor_care_guide/lcg_data_concerns"]),

    lcg_accuracy_passenger: quipsYesNo_(lcgAccuracy, "passenger__foetal_heart_rate__moulding_a"),
    lcg_accuracy_passage: quipsYesNo_(lcgAccuracy, "passage__cervical_dilatation_and_head_de"),
    lcg_accuracy_powers: quipsYesNo_(lcgAccuracy, "powers__contractions"),
    lcg_accuracy_maternal_vital_signs: quipsYesNo_(lcgAccuracy, "maternal_status__vital_signs"),
    lcg_accuracy_labour_summary: quipsYesNo_(lcgAccuracy, "summary_of_labour_after_delivery"),

    observer_intervention: quipsFormatCellValue_(intervention),
    observer_intervention_birth_preparedness: quipsYesNo_(intervention, "birth_preparedness"),
    observer_intervention_technical_quality_immediately_following: quipsYesNo_(intervention, "Technical_quality_immediately_following_"),
    observer_intervention_post_birth_infection_prevention: quipsYesNo_(intervention, "Post-birth_infection_prevention"),
    observer_intervention_respectful_maternity_care: quipsYesNo_(intervention, "Respectful_maternity_care"),
    observer_intervention_avoidance_of_harmful_practices: quipsYesNo_(intervention, "Avoidance_of_harmful_practices"),
    observer_intervention_partograph: quipsYesNo_(intervention, "partograph"),
    observer_intervention_labor_care_guide: quipsYesNo_(intervention, "labor_care_guide"),

    observer_intervention_description: quipsFormatCellValue_(flat["group_observer_feedback/intervention_description"]),
    further_feedback: quipsFormatCellValue_(flat["group_observer_feedback/further_feedback"]),
    observer_confidence: quipsFormatCellValue_(flat["group_observer_feedback/observer_confidence"])
  };
}
