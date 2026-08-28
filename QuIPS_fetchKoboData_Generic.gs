function fetchKoboData_Generic() {

  // Prevent overlapping runs from inserting the same _uuid twice
  const lock = LockService.getScriptLock();
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

  // ================= CONFIGURATION =================
  const apiToken = '1faf1291cb5e472b7f5a253f3888380d28e7900b';
  const formUid = 'aSwMMq2L7UbfpRAvLFkL6d';
  const startDate = "2026-04-30T00:00:00";

  const facilityTargets = {
  "11436": 5,
  "26142": 5,
  "11620": 5,
  "11740": 18,
  "11254": 5,
  "11774": 5,
  "18210": 10,
  "18043": 5,
  "11861": 17,
  "11289": 40,
  "25221": 5,
  "11395": 5,
  "11522": 21,
  "19606": 27,
  "18435": 5,
  "11785": 5,
  "11592": 5,
  "23053": 5,
  "14224": 22,
  "15358": 12,
  "15156": 12,
  "15212": 22,
  "14431": 12,
  "15398": 16,
  "14836": 12,
  "15188": 5,
  "15008": 13,
  "14265": 15,
  "22859": 10,
  "15200": 5,
  "15495": 5,
  "15119": 5,
  "15678": 8,
  "14207": 7,
  "15288": 71,
  "20137": 6,
  "16683": 5,
  "14510": 18,
  "14926": 6,
  "28410": 7,
  "15250": 5,
  "15280": 59,
  "15108": 10,
  "10777": 30,
  "10639": 14,
  "10782": 7,
  "10459": 15,
  "10199": 5,
  "10627": 5,
  "10588": 13,
  "10470": 6,
  "10357": 5,
  "10686": 22,
  "10674": 7
};

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = 'QuIPS Transformed Data ';
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  // ================= HELPERS =================

  function formatDateTime(value) {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d)) return value;
    return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  }

  function formatTime(value) {
    if (!value) return "";
    const d = new Date(value);
    if (!isNaN(d)) {
      return Utilities.formatDate(d, Session.getScriptTimeZone(), "HH:mm:ss");
    }
    const match = String(value).match(/(\d{2}:\d{2}:\d{2})/);
    return match ? match[1] : "";
  }

  function timeToSeconds(value) {
    if (!value) return null;
    const parts = value.toString().split(":");
    if (parts.length < 2) return null;

    const hh = parseInt(parts[0], 10);
    const mm = parseInt(parts[1], 10);
    const ss = parseInt(parts[2] || "0", 10);

    if (isNaN(hh) || isNaN(mm)) return null;

    return (hh * 3600) + (mm * 60) + ss;
  }

  function secondsToHHMMSS(totalSeconds) {
    if (totalSeconds === null || totalSeconds === undefined || totalSeconds === "") return "";

    const sign = totalSeconds < 0 ? "-" : "";
    const abs = Math.abs(Math.round(totalSeconds));

    const hh = Math.floor(abs / 3600);
    const mm = Math.floor((abs % 3600) / 60);
    const ss = abs % 60;

    return `${sign}${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }

  function duration(start, end) {
    const s = timeToSeconds(start);
    const e = timeToSeconds(end);
    if (s == null || e == null) return "";
    return secondsToHHMMSS(e - s);
  }

  function titleCase(str) {
    if (!str) return "";
    return str.toString()
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  function cleanText(str) {
    if (!str) return "";
    return str.toString().replace(/_/g, " ");
  }

  function extractFacilityDetails(value) {
    if (!value) return { facility_code: "", facility: "" };
    const parts = value.split("_");
    return {
      facility_code: parts[0] || "",
      facility: titleCase(parts.slice(1).join(" "))
    };
  }

  function classifySelectMultiple(value, requiredItems) {
    if (!value) return "";

    const selected = String(value).split(" ").filter(Boolean);
    const set = new Set(selected);

    if (set.has("none_of_above")) return "Never";
    if (set.has("unable_to_observe")) return "Unable to observe";

    const hasAll = requiredItems.every(item => set.has(item));
    const hasAny = requiredItems.some(item => set.has(item));

    if (hasAll) return "Always";
    if (hasAny) return "Sometimes";

    return "";
  }

  function formatCellValue(value) {
  if (!value) return "";

  const cleaned = value
    .toString()
    .replace(/_/g, " ")
    .toLowerCase()
    .trim();

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

  const INDIAN_RED = "#CD5C5C";
  const MIN_OBSERVER_GAP_MS = 30 * 60 * 1000; // 30 minutes
  const QA_INTEGRITY_COLUMNS = [
    "qa_short_observation",
    "qa_successive_ended_lt_30m",
    "qa_successive_submitted_lt_30m",
    "qa_companion_inconsistency",
    "qa_timing_issues"
  ];

  function parseDateTimeValue(value) {
    if (value === null || value === undefined || value === "") return null;
    if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
      return value;
    }
    const s = String(value).trim();
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
    if (m) {
      return new Date(
        Number(m[1]), Number(m[2]) - 1, Number(m[3]),
        Number(m[4]), Number(m[5]), Number(m[6])
      );
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  function formatMinutes(ms) {
    if (ms === null || ms === undefined || isNaN(ms)) return "";
    return (ms / 60000).toFixed(1);
  }

  // Flags negative HH:MM:SS duration values (strings starting with "-") in Indian Red.
  function applyNegativeDurationConditionalFormatting(targetSheet) {
    const lastCol = targetSheet.getLastColumn();
    if (lastCol < 1) return;

    const headers = targetSheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const durationCols = [];

    headers.forEach((header, index) => {
      if (String(header || "").endsWith("_duration")) {
        durationCols.push(index + 1);
      }
    });

    if (durationCols.length === 0) return;

    const durationColSet = new Set(durationCols);
    const maxRows = targetSheet.getMaxRows();

    // Drop prior negative-duration rules on these columns so re-runs stay idempotent.
    const keptRules = targetSheet.getConditionalFormatRules().filter(rule => {
      return !rule.getRanges().some(range =>
        range.getNumColumns() === 1 && durationColSet.has(range.getColumn())
      );
    });

    const durationRules = durationCols.map(col => {
      const range = targetSheet.getRange(2, col, maxRows - 1, 1);
      return SpreadsheetApp.newConditionalFormatRule()
        .whenTextStartsWith("-")
        .setBackground(INDIAN_RED)
        .setRanges([range])
        .build();
    });

    targetSheet.setConditionalFormatRules(keptRules.concat(durationRules));
  }

  function ensureColumns(targetSheet, columnNames) {
    const lastCol = Math.max(targetSheet.getLastColumn(), 1);
    const headers = targetSheet.getRange(1, 1, 1, lastCol).getValues()[0]
      .map(h => String(h || ""));
    const headerIndex = {};

    headers.forEach((h, i) => {
      if (h) headerIndex[h] = i;
    });

    columnNames.forEach(name => {
      if (headerIndex[name] === undefined) {
        const newCol = targetSheet.getLastColumn() + 1;
        targetSheet.getRange(1, newCol).setValue(name);
        headerIndex[name] = newCol - 1;
      }
    });

    return headerIndex;
  }

  function applyQaYesConditionalFormatting(targetSheet, headerIndex) {
    const yesFlagCols = [
      "qa_short_observation",
      "qa_successive_ended_lt_30m",
      "qa_successive_submitted_lt_30m",
      "qa_companion_inconsistency"
    ]
      .map(name => headerIndex[name])
      .filter(i => i !== undefined)
      .map(i => i + 1);

    const issuesCol = headerIndex.qa_timing_issues !== undefined
      ? headerIndex.qa_timing_issues + 1
      : null;

    const managedCols = new Set(yesFlagCols.concat(issuesCol ? [issuesCol] : []));
    if (managedCols.size === 0) return;

    const maxRows = targetSheet.getMaxRows();

    const keptRules = targetSheet.getConditionalFormatRules().filter(rule => {
      return !rule.getRanges().some(range =>
        range.getNumColumns() === 1 && managedCols.has(range.getColumn())
      );
    });

    const qaRules = yesFlagCols.map(col =>
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo("Yes")
        .setBackground(INDIAN_RED)
        .setRanges([targetSheet.getRange(2, col, maxRows - 1, 1)])
        .build()
    );

    if (issuesCol) {
      qaRules.push(
        SpreadsheetApp.newConditionalFormatRule()
          .whenCellNotEmpty()
          .setBackground(INDIAN_RED)
          .setRanges([targetSheet.getRange(2, issuesCol, maxRows - 1, 1)])
          .build()
      );
    }

    targetSheet.setConditionalFormatRules(keptRules.concat(qaRules));
  }

  // Data integrity / malpractice checks on QuIPS Transformed Data:
  // 1) date_ended - date_started < 30m → likely retrospective fill (not real-time)
  // 2) successive same-observer date_ended gap < 30m
  // 3) successive same-observer date_submitted gap < 30m
  // 4) birth_companion = No but directly_engaged_companion_support = Yes
  // date_started can be stale (form left open); date_ended / date_submitted are preferred anchors.
  function refreshObserverTimingIntegrityChecks(targetSheet) {
    const lastRow = targetSheet.getLastRow();
    const lastCol = targetSheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) return;

    const headerIndex = ensureColumns(targetSheet, QA_INTEGRITY_COLUMNS);
    const required = ["_uuid", "observer_name", "date_started", "date_ended", "date_submitted"];
    if (required.some(name => headerIndex[name] === undefined)) {
      Logger.log("Timing QA skipped: missing required metadata columns.");
      return;
    }

    const width = targetSheet.getLastColumn();
    const values = targetSheet.getRange(2, 1, lastRow - 1, width).getValues();

    const hasCompanionCols =
      headerIndex.birth_companion !== undefined &&
      headerIndex.directly_engaged_companion_support !== undefined;

    const records = values.map((row, idx) => {
      const started = parseDateTimeValue(row[headerIndex.date_started]);
      const ended = parseDateTimeValue(row[headerIndex.date_ended]);
      const submitted = parseDateTimeValue(row[headerIndex.date_submitted]);
      const birthCompanion = hasCompanionCols
        ? String(row[headerIndex.birth_companion] || "").trim().toLowerCase()
        : "";
      const engagedCompanion = hasCompanionCols
        ? String(row[headerIndex.directly_engaged_companion_support] || "").trim().toLowerCase()
        : "";

      return {
        rowIndex: idx,
        uuid: String(row[headerIndex._uuid] || ""),
        observer: String(row[headerIndex.observer_name] || "").trim(),
        started,
        ended,
        submitted,
        birthCompanion,
        engagedCompanion,
        shortObservation: false,
        successiveEnded: false,
        successiveSubmitted: false,
        companionInconsistency: false,
        notes: []
      };
    });

    records.forEach(rec => {
      if (rec.started && rec.ended) {
        const windowMs = rec.ended.getTime() - rec.started.getTime();
        if (windowMs < MIN_OBSERVER_GAP_MS) {
          rec.shortObservation = true;
          rec.notes.push(
            windowMs < 0
              ? `form_window_negative(${formatMinutes(windowMs)}m)`
              : `form_window_lt_30m(${formatMinutes(windowMs)}m)`
          );
        }
      }

      // Companion present = No cannot pair with engaged companion support = Yes
      if (rec.birthCompanion === "no" && rec.engagedCompanion === "yes") {
        rec.companionInconsistency = true;
        rec.notes.push("companion_support_without_birth_companion");
      }
    });

    function flagSuccessiveGaps(timeKey, flagKey, label) {
      const byObserver = {};
      records.forEach(rec => {
        if (!rec.observer || !rec[timeKey]) return;
        if (!byObserver[rec.observer]) byObserver[rec.observer] = [];
        byObserver[rec.observer].push(rec);
      });

      Object.keys(byObserver).forEach(observer => {
        const group = byObserver[observer].slice().sort((a, b) =>
          a[timeKey].getTime() - b[timeKey].getTime()
        );

        for (let i = 1; i < group.length; i++) {
          const prev = group[i - 1];
          const curr = group[i];
          const gapMs = curr[timeKey].getTime() - prev[timeKey].getTime();
          if (gapMs < MIN_OBSERVER_GAP_MS) {
            prev[flagKey] = true;
            curr[flagKey] = true;
            const detail = `${label}_gap_lt_30m(${formatMinutes(gapMs)}m vs ${prev.uuid || "prior"})`;
            curr.notes.push(detail);
            prev.notes.push(`${label}_gap_lt_30m(${formatMinutes(gapMs)}m vs ${curr.uuid || "next"})`);
          }
        }
      });
    }

    flagSuccessiveGaps("ended", "successiveEnded", "successive_date_ended");
    flagSuccessiveGaps("submitted", "successiveSubmitted", "successive_date_submitted");

    const shortCol = headerIndex.qa_short_observation + 1;
    const endedCol = headerIndex.qa_successive_ended_lt_30m + 1;
    const submittedCol = headerIndex.qa_successive_submitted_lt_30m + 1;
    const companionCol = headerIndex.qa_companion_inconsistency + 1;
    const issuesCol = headerIndex.qa_timing_issues + 1;

    const shortValues = records.map(r => [r.shortObservation ? "Yes" : ""]);
    const endedValues = records.map(r => [r.successiveEnded ? "Yes" : ""]);
    const submittedValues = records.map(r => [r.successiveSubmitted ? "Yes" : ""]);
    const companionValues = records.map(r => [r.companionInconsistency ? "Yes" : ""]);
    const issuesValues = records.map(r => {
      const uniqueNotes = [...new Set(r.notes)];
      return [uniqueNotes.join("; ")];
    });

    targetSheet.getRange(2, shortCol, records.length, 1).setValues(shortValues);
    targetSheet.getRange(2, endedCol, records.length, 1).setValues(endedValues);
    targetSheet.getRange(2, submittedCol, records.length, 1).setValues(submittedValues);
    targetSheet.getRange(2, companionCol, records.length, 1).setValues(companionValues);
    targetSheet.getRange(2, issuesCol, records.length, 1).setValues(issuesValues);

    applyQaYesConditionalFormatting(targetSheet, headerIndex);

    const flaggedCount = records.filter(r =>
      r.shortObservation ||
      r.successiveEnded ||
      r.successiveSubmitted ||
      r.companionInconsistency
    ).length;

    Logger.log(
      `Integrity QA on '${targetSheet.getName()}': flagged ${flaggedCount} of ${records.length} observations.`
    );
  }


//=============SCORING HELPER FUNCTION ====================
  function isValidResponse(value) {
  if (value === null || value === undefined || value === "") return false;

  const v = String(value).trim().toLowerCase();

  return ![
    "unable to observe",
    "unable_to_observe",
    "not applicable",
    "not_applicable",
    "resuscitation required",
    "not taken"
  ].includes(v);
}

function scoreYes(value, points = 2) {
  return isValidResponse(value) &&
    String(value).trim().toLowerCase() === "yes"
    ? points
    : 0;
}

function scoreNo(value, points = 2) {
  return isValidResponse(value) &&
    String(value).trim().toLowerCase() === "no"
    ? points
    : 0;
}

function calculateQualityCareScore(t) {

  let score = 0;
  let totalPossible = 0;

  // =====================================================
  // ESSENTIAL CARE PRACTICES
  // =====================================================

  const essentialIndicators = [
    "hand_hygiene", "nnr_equipment_preparation", "uterotonic_preparation", "ruleout_twin","timely_uterotonic_administration", "drying_stimulation", "discard_wet_towel", "sterilized_blade_clamp", "newborn_kept_warm", "controlled_cord_traction", "placenta_examination", "uterine_tone_assessed", "laceration_check", "take_mother_bp", "timely_mother_bp", "take_mother_temperature", "timely_mother_temp", "take_mother_pulse", "timely_mother_pulse", "apgar_min1", "apgar_min5", "administer_vitamin_k", "timely_vitamink_administration", "provider_initiate_breastfeeding", "timely_breastfeeding_initiation", "maternal_bleeding_assessed", "sharps_disposal", "waste_disposal", "birth_companion"
  ];

  essentialIndicators.forEach(field => {
  if (isValidResponse(t[field])) {
    score += scoreYes(t[field], 2);
    totalPossible += 2;
    }
   });

// UTEROTONIC ADMINISTERED
// =====================================================

if (isValidResponse(t.uterotonic_administered)) {

  const uterotonic = String(t.uterotonic_administered)
    .trim()
    .toLowerCase();

  totalPossible += 2;

  if (
    uterotonic !== "none of the above" &&
    uterotonic !== "none_of_the_above"
  ) {
    score += 2;
  }
}
  // =====================================================
  // NEWBORN ROUTINE CARE
  // =====================================================

  const resuscitation =
    String(t.baby_resuscitation || "").toLowerCase() === "yes";

  if (!resuscitation) {
    ["skin_to_skin", "adequate_skin_to_skin_time", "timely_cord_clamp"]
      .forEach(field => {if (isValidResponse(t[field])) {
    score += scoreYes(t[field], 2);
    totalPossible += 2;
  }
   });
  }
  // =====================================================
  // PPH PATHWAY
  // =====================================================

  const hasPPH =
    t.pph_diagnosis_time &&
    String(t.pph_diagnosis_time).trim() !== "";

  if (hasPPH) {

    [
  "uterine_massage_initiated",
  "oxytocin_first_line",
  "txa_administered",
  "iv_access_fluids"
].forEach(field => {
  if (isValidResponse(t[field])) {
    score += scoreYes(t[field], 2);
    totalPossible += 2;
  }
});

  }

  // =====================================================
  // PPE COMPLIANCE
  // =====================================================

  const ppeFields = [
    "ppe_gloves",
    "ppe_mask",
    "ppe_gown",
    "ppe_boots",
    "ppe_goggles",
    "ppe_cap"
  ];

  ppeFields.forEach(field => {
    score += scoreYes(t[field], 2 / 6);
    totalPossible += 2 / 6;
  });

  // =====================================================
  // HARMFUL PRACTICES
  // =====================================================

  [
  "fundal_pressure",
  "perineum_stretching",
  "newborn_slapped",
  "newborn_upside_down"
  ].forEach(field => {
  if (isValidResponse(t[field])) {
    score += scoreNo(t[field], 2);
    totalPossible += 2;
  }
});

  // =====================================================
  // OBSERVER INTERVENTION
  // =====================================================

  if (isValidResponse(t.observer_intervention)) {
  score += scoreNo(t.observer_intervention, 1);
  totalPossible += 1;
  }

  // =====================================================
  // LABOR MONITORING TOOL
  // =====================================================

  const tool = String(t.labor_monitoring_tool || "").toLowerCase();

 if (tool === "partograph") {

    [
      "partogragh_initiation",
      "partograph_half_hr",
      "fetal_heart_correct",
      "maternal_pulse_correct",
      "bp_4hrs",
      "partograph_summary_filled",
      "delivery_method_filled",
      "blood_loss_estimation"
    ].forEach(field => {
    if (isValidResponse(t[field])) {
    score += scoreYes(t[field], 2);
    totalPossible += 2;
  }
});

    score += scoreNo(t.partograph_accuracy_concern, 1);
    totalPossible += 1;

  } else if (tool === "labor care guide") {

    [
      "lcg_initiated_correct",
      "contractions_monitored_1st",
      "fhr_monitored_1st",
      "bp_monitored_recorded",
      "contractions_monitored_2nd",
      "fhr_monitored_2nd",
      "delivery_time_documented",
      "delivery_method_documented",
      "ebl_documented_correctly"
    ].forEach(field => {if (isValidResponse(t[field])) {
    score += scoreYes(t[field], 2);
    totalPossible += 2;
}
});

if (isValidResponse(t.lcg_accuracy_concern)) {
   score += scoreNo(t.lcg_accuracy_concern, 1);
   totalPossible += 1;
}

// Blood loss measurement method
if (isValidResponse(t.method_blood_loss)) {
  const method = String(t.method_blood_loss).toLowerCase();

  if (method.includes("measure with a calibrated jar")) {
    score += 2;
    totalPossible += 2;

  } else if (
    method.includes("weighing of bloodsoaked materials") ||
    method.includes("weighing of blood soaked materials")
  ) {
    score += 2;
    totalPossible += 2;

  } else if (method.includes("v drape")) {
  score += 1;
  totalPossible += 1;

  totalPossible += 1;

  if (String(t.proper_vdrape_use || "").toLowerCase() === "yes") {
    score += 1;
  }
}
}

// =====================================================
// RESPECTFUL CARE COMMUNICATION SCORING (NEW)
// =====================================================

const respectfulCareFields = [
  "provider_explanations",
  "spoken_to_directly",
  "spoken_to_kindly"
];

respectfulCareFields.forEach(field => {
  if (isValidResponse(t[field])) {
    const val = String(t[field]).toLowerCase();

    if (val === "always") {
      score += 2;
    } else if (val === "sometimes") {
      score += 1;
    }

    totalPossible += 2;
  }
});

// =====================================================
// RESPECT FOR MOTHER (NEW)
// =====================================================

if (isValidResponse(t.rmc_no_disrespect_to_mother)) {
  if (String(t.rmc_no_disrespect_to_mother).toLowerCase() === "yes") {
    score += 2;
  }
  totalPossible += 2;
}
  }

  // =====================================================
  // FINAL SCORE (PROPORTION)
  // =====================================================

  if (totalPossible === 0) return 0;

  return Number((score / totalPossible).toFixed(3));

}


//===============SECTION SCORES =====================

function calculateSectionScore(t, fields, weight = 2) {
  let score = 0;
  let total = 0;

  fields.forEach(f => {
    if (isValidResponse(t[f])) {
      score += scoreYes(t[f], weight);
      total += weight;
    }
  });

  return total === 0 ? 0 : Number((score / total).toFixed(3));
}


function calculateSectionScores(t) {
  return {
    birth_preparedness: calculateSectionScore(t, [
      "hand_hygiene",
      "ppe_gloves",
      "ppe_mask",
      "ppe_gown",
      "ppe_boots",
      "ppe_goggles",
      "ppe_cap",
      "nnr_equipment_preparation",
      "uterotonic_preparation"
    ]),

    technical_quality_postbirth: calculateSectionScore(t, [
      "ruleout_twin",
      "uterotonic_administered",
      "timely_uterotonic_administration",
      "drying_stimulation",
      "discard_wet_towel",
      "skin_to_skin",
      "adequate_skin_to_skin_time",
      "timely_cord_clamp",
      "sterilized_blade_clamp",
      "newborn_kept_warm",
      "controlled_cord_traction",
      "placenta_examination",
      "uterine_tone_assessed",
      "laceration_check",
      "method_blood_loss",
      "proper_vdrape_use",
      "uterine_massage_initiated",
      "oxytocin_first_line",
      "txa_administered",
      "iv_access_fluids",
      "take_mother_bp",
      "timely_mother_bp",
      "take_mother_temperature",
      "timely_mother_temp",
      "take_mother_pulse",
      "timely_mother_pulse",
      "apgar_min1",
      "apgar_min5",
      "administer_vitamin_k",
      "timely_vitamink_administration",
      "provider_initiate_breastfeeding",
      "timely_breastfeeding_initiation",
      "maternal_bleeding_assessed"
    ]),

    postbirth_infection_prevention: calculateSectionScore(t, [
      "sharps_disposal",
      "waste_disposal"
    ]),

    respectful_maternity_care: calculateSectionScore(t, [
      "birth_companion",
      "provider_explanations",
      "spoken_to_directly",
      "spoken_to_kindly",
      "rmc_no_disrespect_to_mother"
    ]),

    avoidance_harmful_practices: calculateSectionScore(t, [
      "fundal_pressure",
      "perineum_stretching",
      "newborn_slapped",
      "newborn_upside_down"
    ]),

    partograph_review: calculateSectionScore(t, [
      "partogragh_initiation",
      "partograph_half_hr",
      "fetal_heart_correct",
      "maternal_pulse_correct",
      "bp_4hrs",
      "partograph_summary_filled",
      "delivery_method_filled",
      "blood_loss_estimation",
      "partograph_accuracy_concern"
    ]),

    labor_care_guide_review: calculateSectionScore(t, [
      "lcg_initiated_correct",
      "contractions_monitored_1st",
      "fhr_monitored_1st",
      "bp_monitored_recorded",
      "contractions_monitored_2nd",
      "fhr_monitored_2nd",
      "delivery_time_documented",
      "delivery_method_documented",
      "ebl_documented_correctly",
      "lcg_accuracy_concerns"
    ])
  };
}
  // ================= QUERY =================

  const queryObj = {
    "_submission_time": { "$gte": startDate }
  };

  let url =
    `https://kc.humanitarianresponse.info/api/v2/assets/${formUid}/data/` +
    `?format=json&query=${encodeURIComponent(JSON.stringify(queryObj))}` +
    `&ordering=-_submission_time&limit=100`;

  const options = {
    method: "get",
    headers: { "Authorization": "Token " + apiToken }
  };

  // ================= FETCH =================

  let allResults = [];

  while (url) {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());

    if (json.results?.length) {
      allResults = allResults.concat(json.results);
    }

    url = json.next;
  }

  if (allResults.length === 0) {
    applyNegativeDurationConditionalFormatting(sheet);
    refreshObserverTimingIntegrityChecks(sheet);
    return;
  }

  // ================= DEDUPE =================
  // Load existing _uuid values from the sheet (by header name, not assumed column A).
  // Also track IDs accepted in THIS run so pagination / API overlap cannot
  // insert the same submission twice in one execution.

  const existingIds = new Set();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow > 1 && lastCol > 0) {
    const headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    let uuidCol = headerRow.indexOf("_uuid") + 1; // 1-based
    if (uuidCol < 1) uuidCol = 1; // fallback if header missing

    // getRange(row, column, numRows, numColumns): numDataRows covers rows 2..lastRow
    const numDataRows = lastRow - 1;
    sheet.getRange(2, uuidCol, numDataRows, 1)
      .getValues()
      .forEach(r => {
        if (r[0]) existingIds.add(String(r[0]));
      });
  }

  // ================= FLATTEN =================

  function flatten(obj, prefix = "") {
    let result = {};

    for (let key in obj) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}/${key}` : key;

      if (value && typeof value === "object" && !Array.isArray(value)) {
        Object.assign(result, flatten(value, newKey));
      } else {
        result[newKey] = Array.isArray(value) ? value.join(" ") : value;
      }
    }
    return result;
  }

  // ================= TRANSFORM =================

  const transformedData = [];

  allResults.forEach(record => {

    const uuid = record._uuid ? String(record._uuid) : "";
    if (!uuid || existingIds.has(uuid)) return;
    // Reserve immediately so duplicate pages / repeated API rows are skipped
    existingIds.add(uuid);

    const flat = flatten(record);

    const facilityRaw =
      flat["facility_observer_details/facility_mombasa"] ||
      flat["facility_observer_details/facility_nakuru"] ||
      flat["facility_observer_details/facility_muranga"] || "";

    const facilityInfo = extractFacilityDetails(facilityRaw);

    const transformed = {

      // ================= METADATA =================
      _uuid: flat["_uuid"],
      date_started: formatDateTime(flat["start"]),
      date_ended: formatDateTime(flat["end"]),
      date_submitted: formatDateTime(flat["_submission_time"]),

      month: Utilities.formatDate(
      new Date(flat["_submission_time"]),
      Session.getScriptTimeZone(),
      "MMMM"
      ),

      //==================DEMOGRAPHIC INFORMATION====================


      observation_date: formatDateTime(flat["facility_observer_details/date"]),
      county: flat["facility_observer_details/county"],
      facility_code: facilityInfo.facility_code,
      facility: facilityInfo.facility,

      observer_name: titleCase(
        `${flat["facility_observer_details/first_name"] || ""} ${flat["facility_observer_details/second_name"] || ""}`.trim()
      ),

      cadre: formatCellValue(cleanText(flat["facility_observer_details/primary_provider"])),
      target_observations: facilityTargets[facilityInfo.facility_code] || "",
      labor_monitoring_tool: formatCellValue(flat["facility_observer_details/labor_monitoring_tool"]),

      //=============SECTION 1: BIRTH PREPAREDNESS==========================
      hand_hygiene: formatCellValue(flat["birth_preparation/hand_washing"]),

      ppe_gloves:
      (flat["birth_preparation/protective_gear"] || "")
      .split(" ")
      .includes("gloves") ? "Yes" : "No",

      ppe_mask:
      (flat["birth_preparation/protective_gear"] || "")
      .split(" ")
      .includes("mask") ? "Yes" : "No",

      ppe_gown:
      (flat["birth_preparation/protective_gear"] || "")
      .split(" ")
      .includes("gown") ? "Yes" : "No",

     ppe_boots:
     (flat["birth_preparation/protective_gear"] || "")
     .split(" ")
     .includes("boots") ? "Yes" : "No",

     ppe_goggles:
     (flat["birth_preparation/protective_gear"] || "")
     .split(" ")
     .includes("face_shield_goggles") ? "Yes" : "No",

     ppe_cap:
     (flat["birth_preparation/protective_gear"] || "")
     .split(" ")
     .includes("cap") ? "Yes" : "No",

     no_ppe_used:
     (flat["birth_preparation/protective_gear"] || "")
     .split(" ")
     .includes("no_ppe_was_used") ? "Yes" : "No",

      nnr_equipment_preparation: formatCellValue(flat["birth_preparation/nnr_equipment_prep"]),
      uterotonic_preparation: formatCellValue(flat["birth_preparation/uterotonic_prep"]),

      // ================= SECTION 2: TECHNICAL QUALITY FOLLOWING DELIVERY =================
      delivery_time: formatTime(flat["technical_quality/delivery_time"]),

      ruleout_twin: formatCellValue(flat["technical_quality/ruleout_twin"]),
      drying_stimulation: formatCellValue(flat["technical_quality/drying_stimulation"]),
      discard_wet_towel: formatCellValue(flat["technical_quality/discard_wet_towel"]),

      baby_resuscitation: formatCellValue(flat["technical_quality/baby_resuscitation"]),

      // ================= Uterotonic administration =================
      uterotonic_administered: formatCellValue(flat["technical_quality/uterotonic_administered"]),
      uterotonic_administration_time: formatTime(flat["technical_quality/uterotonic_time"]),
      uterotonic_administration_duration:
        duration(flat["technical_quality/delivery_time"], flat["technical_quality/uterotonic_time"]),

      timely_uterotonic_administration:
       (function () {

      const d = timeToSeconds(flat["technical_quality/delivery_time"]);
      const u = timeToSeconds(flat["technical_quality/uterotonic_time"]);
      const take = flat["technical_quality/uterotonic_administered"];

      if (d != null && u != null) {
      const diff = u - d;
      if (diff < 0) return "";
      return (u - d <= 60) ? "Yes" : "No";
      }

      if (!take || take === "") return "";
      if (take === "none_of_the_above") return "Not Given";
      if (take === "Unable_to_observe") return "Unable to observe";

      return "";

      })(),

      // ================= Skin-to-skin =================
      skin_to_skin: formatCellValue(flat["technical_quality/skin_to_skin"]),
      skin_to_skin_initiation_time: formatTime(flat["technical_quality/skin_to_skin_initiation"]),
      skin_to_skin_discontinued_time: formatTime(flat["technical_quality/skin_to_skin_discontinued"]),
      skin_to_skin_duration:
        duration(flat["technical_quality/skin_to_skin_initiation"], flat["technical_quality/skin_to_skin_discontinued"]),

      adequate_skin_to_skin_time:
      (function () {
      const s = timeToSeconds(flat["technical_quality/skin_to_skin_initiation"]);
      const e = timeToSeconds(flat["technical_quality/skin_to_skin_discontinued"]);
      const status = flat["technical_quality/skin_to_skin"];
      if (s != null && e != null) {
      const diff = e - s;
      if (diff < 0) return "";
      return (e - s >= 3600) ? "Yes" : "No";
      }
      if (!status || status === "") return "Resuscitation required";
      if (status === "No") return "Not initiated";
      if (status === "unable_to_observe") return "Unable to observe";

      return "";

      })(),

      //Placenta time
      placenta_delivery_time: formatTime(flat["technical_quality/placenta_delivery_time"]),

      // ================= Delayed cord clamping =================
    delayed_cord_clamp_time: formatTime(flat["technical_quality/delayed_cord_clamp"]),
    cord_clamp_duration:
        duration(flat["technical_quality/delivery_time"], flat["technical_quality/delayed_cord_clamp"]),

    timely_cord_clamp:
    (function () {

    const d = timeToSeconds(flat["technical_quality/delivery_time"]);
    const c = timeToSeconds(flat["technical_quality/delayed_cord_clamp"]);
    const status = flat["technical_quality/delayed_cord_clamp"];
    if (d != null && c != null) {
      const diff = c - d;
      if (diff < 0) return "";
      return (diff >= 120 && diff <= 180) ? "Yes" : "No";
    }
    if (!status || status === "") return "Resuscitation required";
    if (status === "no") return "Not performed";
    if (status === "Unable_to_observe") return "Unable to observe";

    return "";

  })(),

   //=================MATERNAL VITAL SIGNS================
  // ================= Maternal Blood Pressure =================
      take_mother_bp: formatCellValue(flat["technical_quality/take_mother_bp"]),
      mother_bp_time: formatTime(flat["technical_quality/mother_bp_time"]),
      mother_bp_duration:
        duration(flat["technical_quality/placenta_delivery_time"], flat["technical_quality/mother_bp_time"]),

   timely_mother_bp:
   (function () {

    const p = timeToSeconds(flat["technical_quality/placenta_delivery_time"]);
    const b = timeToSeconds(flat["technical_quality/mother_bp_time"]);
    const take = flat["technical_quality/take_mother_bp"];
    if (p != null && b != null) {
      const diff = b - p;
    //If negative, return blank
      if (diff < 0) return "";
      return (b - p <= 900) ? "Yes" : "No";
    }
    if (!take || take === "") return "";
    if (take === "no") return "Not taken";
    if (take === "") return "Unable to observe";
    return "Unable to observe";
    })(),

  // ================= Maternal Temperature =================
      take_mother_temperature: formatCellValue(flat["technical_quality/take_mother_temperature"]),
      mother_temp_time: formatTime(flat["technical_quality/mother_temp_time"]),
      mother_temp_duration:
        duration(flat["technical_quality/placenta_delivery_time"], flat["technical_quality/mother_temp_time"]),

    timely_mother_temp:
    (function () {

    const p = timeToSeconds(flat["technical_quality/placenta_delivery_time"]);
    const t = timeToSeconds(flat["technical_quality/mother_temp_time"]);
    const take = flat["technical_quality/take_mother_temperature"];
    if (p != null && t != null) {
      const diff = t - p;
      if (diff < 0) return "";
      return (t - p <= 900) ? "Yes" : "No";
    }
    if (take === "no") return "Not taken";
    if (take === "Unable_to_observe") return "Unable to observe";
    return "Unable to observe";

    })(),

  // ================= Maternal Pulse ================================
      take_mother_pulse: formatCellValue(flat["technical_quality/take_mother_pulse"]),
      mother_pulse_time: formatTime(flat["technical_quality/mother_pulse_time"]),
      mother_pulse_duration:
        duration(flat["technical_quality/placenta_delivery_time"], flat["technical_quality/mother_pulse_time"]),

    timely_mother_pulse:
    (function () {

    const p = timeToSeconds(flat["technical_quality/placenta_delivery_time"]);
    const m = timeToSeconds(flat["technical_quality/mother_pulse_time"]);
    const take = flat["technical_quality/take_mother_pulse"];
    if (p != null && m != null) {
      const diff = m - p;
      if (diff < 0) return "";
      return (m - p <= 900) ? "Yes" : "No";
    }
    if (take === "no") return "Not taken";
    if (take === "Unable_to_observe") return "Unable to observe";

    return "Unable to observe";

  })(),

// ================= VITAMIN K =================
      administer_vitamin_k: formatCellValue(flat["technical_quality/administer_vitamin"]),
      vitamink_administration_time: formatTime(flat["technical_quality/vitamin_K_time"]),
      vitamink_administration_duration:
        duration(flat["technical_quality/delivery_time"], flat["technical_quality/vitamin_K_time"]),

    timely_vitamink_administration:
    (function () {

    const d = timeToSeconds(flat["technical_quality/delivery_time"]);
    const v = timeToSeconds(flat["technical_quality/vitamin_K_time"]);
    const take = flat["technical_quality/administer_vitamin"];

    // ===== CASE 1: TIMING AVAILABLE =====
    if (d != null && v != null) {
      const diff = v - d;
      if (diff < 0) return "";
      return (v - d <= 3600) ? "Yes" : "No";
    }

    // ===== CASE 2: TIMING MISSING → STATUS FALLBACK =====
    if (take === "no") return "Not given";
    if (take === "Unable_to_observe") return "Unable to observe";

    // ===== FINAL FALLBACK (NO BLANKS) =====
    return "Unable to observe";

  })(),

// ================= BREASTFEEDING =================
      provider_initiate_breastfeeding: formatCellValue(flat["technical_quality/initiate_breastfeeding"]),
      breastfeeding_initiation_time: formatTime(flat["technical_quality/breastfeeding_initiation_time"]),
      breastfeeding_initiation_duration:
        duration(flat["technical_quality/delivery_time"], flat["technical_quality/breastfeeding_initiation_time"]),

    timely_breastfeeding_initiation:
    (function () {

    const d = timeToSeconds(flat["technical_quality/delivery_time"]);
    const b = timeToSeconds(flat["technical_quality/breastfeeding_initiation_time"]);
    const take = flat["technical_quality/initiate_breastfeeding"];

    // ===== CASE 1: TIMING AVAILABLE =====
    if (d != null && b != null) {
      const diff = b - d;
      if (diff < 0) return "";
      return (b - d <= 3600) ? "Yes" : "No";
    }

    // ===== CASE 2: TIMING MISSING → STATUS FALLBACK =====
    if (take === "no") return "Not initiated";
    if (take === "Unable_to_observe") return "Unable to observe";

    // ===== FINAL FALLBACK (NO BLANKS) =====
    return "Unable to observe";

  })(),

      // ================= REMAINING FIELDS =================
      sterilized_blade_clamp: formatCellValue(flat["technical_quality/sterilized_blade_clamp"]),
      newborn_kept_warm: formatCellValue(flat["technical_quality/newborn_kept_warm"]),
      placenta_delivery_time: formatCellValue(formatTime(flat["technical_quality/placenta_delivery_time"])),
      controlled_cord_traction: formatCellValue(flat["technical_quality/controlled_cord_traction"]),
      placenta_examination: formatCellValue(flat["technical_quality/placenta_examination"]),
      uterine_tone_assessed: flat["technical_quality/uterine_tone_assessed"],
      laceration_check: formatCellValue(flat["technical_quality/laceration_check"]),
      method_blood_loss: formatCellValue(flat["technical_quality/method_blood_loss"]),
      apgar_min1: formatCellValue(flat["technical_quality/apgar_min1"]),
      apgar_min5: formatCellValue(flat["technical_quality/apgar_min5"]),

//==============EMOTIVE FIELDS====================================
      proper_vdrape_use: formatCellValue(flat["technical_quality/proper_vdrape_use"]),
      blood_loss_over_500ml: formatCellValue(flat["technical_quality/blood_loss_amount"]),
      pph_suspicion_diagnosis: formatCellValue(flat["technical_quality/pph_suspicion_diagnosis"]),
      pph_clinical_signs: formatCellValue(flat["technical_quality/pph_clinical_signs"]),
      pph_diagnosis_time: formatTime(flat["technical_quality/pph_diagnosis_time"]),
      uterine_massage_initiated: formatCellValue(flat["technical_quality/uterine_massage_initiated"]),
      uterine_massage_time: formatTime(flat["technical_quality/uterine_massage_time"]),

      uterine_massage_duration:
        duration(
          flat["technical_quality/pph_diagnosis_time"],
          flat["technical_quality/uterine_massage_time"]
        ),

      timely_uterine_massage:
      (function () {
        const p = timeToSeconds(formatTime(flat["technical_quality/pph_diagnosis_time"]));
        const u = timeToSeconds(formatTime(flat["technical_quality/uterine_massage_time"]));

        if (p == null || u == null) return "";
        const diff = u - p;
        if (diff < 0) return "";
        return (u - p <= 300) ? "Yes" : "No";
      })(),

      oxytocin_first_line: formatCellValue(flat["technical_quality/oxytocin_first_line"]),
      oxytocin_administration_time: formatTime(flat["technical_quality/oxytocin_administration_time"]),

      oxytocin_administration_duration:
        duration(
          flat["technical_quality/pph_diagnosis_time"],
          flat["technical_quality/oxytocin_administration_time"]
        ),

      timely_oxytocin_administration:
      (function () {
        const p = timeToSeconds(formatTime(flat["technical_quality/pph_diagnosis_time"]));
        const o = timeToSeconds(formatTime(flat["technical_quality/oxytocin_administration_time"]));

        if (p == null || o == null) return "";
        const diff = o - p;
        if (diff < 0) return "";
        return (o - p <= 600) ? "Yes" : "No";
      })(),

      txa_administered: formatCellValue(flat["technical_quality/txa_administered"]),
      txa_administration_time: formatTime(flat["technical_quality/txa_administration_time"]),

      txa_administration_duration:
        duration(
          flat["technical_quality/pph_diagnosis_time"],
          flat["technical_quality/txa_administration_time"]
        ),

      timely_txa_administration:
      (function () {
        const p = timeToSeconds(formatTime(flat["technical_quality/pph_diagnosis_time"]));
        const t = timeToSeconds(formatTime(flat["technical_quality/txa_administration_time"]));

        if (p == null || t == null) return "";
        const diff = t - p;
        if (diff < 0) return "";
        return (t - p <= 900) ? "Yes" : "No";
      })(),

      iv_access_fluids: formatCellValue(flat["technical_quality/iv_access_fluids"]),
      iv_establishment_time: formatTime(flat["technical_quality/iv_establishment_time"]),

      iv_establishment_duration:
        duration(
          flat["technical_quality/pph_diagnosis_time"],
          flat["technical_quality/iv_establishment_time"]
        ),

      timely_iv_establishment:
      (function () {
        const p = timeToSeconds(formatTime(flat["technical_quality/pph_diagnosis_time"]));
        const i = timeToSeconds(formatTime(flat["technical_quality/iv_establishment_time"]));

        if (p == null || i == null) return "";
        const diff = i - p;
        if (diff < 0) return "";
        return (i - p <= 600) ? "Yes" : "No";
      })(),
      
      pph_identified_cause: formatCellValue(flat["technical_quality/pph_identified_cause"]),

      maternal_bleeding_assessed: formatCellValue(flat["technical_quality/mbleeding_assessed"]),

      sharps_disposal: formatCellValue(flat["post_birth_ip/sharps_disposal"]),
      waste_disposal: formatCellValue(flat["post_birth_ip/waste_disposal"]),

      birth_companion: formatCellValue(flat["respectful_maternity_care/birth_companion"]),
      provider_explanations: classifySelectMultiple(
        flat["respectful_maternity_care/provider_explanations"],
        [
          "labor_explained_mother",
          "language_simple_clear",
          "procedure_explained_first",
          "mother_informed_choices",
          "consent_obtained_before",
          "progress_updated_regularly",
          "questions_asked_mother"
        ]
      ),

      spoken_to_directly: classifySelectMultiple(
        flat["respectful_maternity_care/spoken_to_directly"],
        [
          "introduced_self_mother",
          "addressed_mother_name",
          "spoke_directly_mother",
          "encouraged_needs_expression",
          "engaged_companion_support"
        ]
      ),

      spoken_to_kindly: classifySelectMultiple(
        flat["respectful_maternity_care/spoken_to_kindly"],
        [
          "responded_mother_needs",
          "showed_empathy_compassion",
          "used_encouragement_praise",
          "listened_actively_mother",
          "positive_attitude_respect",
          "privacy_confidentiality_ensured"
        ]
      ),

// ================= PROVIDER EXPLANATIONS =================
explanations_labor_explained_mother:
  (flat["respectful_maternity_care/provider_explanations"] || "")
    .split(" ")
    .includes("labor_explained_mother") ? "Yes" : "No",

explanations_language_simple_clear:
  (flat["respectful_maternity_care/provider_explanations"] || "")
    .split(" ")
    .includes("language_simple_clear") ? "Yes" : "No",

explanations_procedure_explained_first:
  (flat["respectful_maternity_care/provider_explanations"] || "")
    .split(" ")
    .includes("procedure_explained_first") ? "Yes" : "No",

explanations_mother_informed_choices:
  (flat["respectful_maternity_care/provider_explanations"] || "")
    .split(" ")
    .includes("mother_informed_choices") ? "Yes" : "No",

explanations_consent_obtained_before:
  (flat["respectful_maternity_care/provider_explanations"] || "")
    .split(" ")
    .includes("consent_obtained_before") ? "Yes" : "No",

explanations_progress_updated_regularly:
  (flat["respectful_maternity_care/provider_explanations"] || "")
    .split(" ")
    .includes("progress_updated_regularly") ? "Yes" : "No",

explanations_questions_asked_mother:
  (flat["respectful_maternity_care/provider_explanations"] || "")
    .split(" ")
    .includes("questions_asked_mother") ? "Yes" : "No",

explanations_unable_to_observe:
  (flat["respectful_maternity_care/provider_explanations"] || "")
    .split(" ")
    .includes("unable_to_observe") ? "Yes" : "No",

explanations_none_of_above:
  (flat["respectful_maternity_care/provider_explanations"] || "")
    .split(" ")
    .includes("none_of_above") ? "Yes" : "No",


// ================= SPOKEN TO DIRECTLY =================
directly_introduced_self_mother:
  (flat["respectful_maternity_care/spoken_to_directly"] || "")
    .split(" ")
    .includes("introduced_self_mother") ? "Yes" : "No",

directly_addressed_mother_name:
  (flat["respectful_maternity_care/spoken_to_directly"] || "")
    .split(" ")
    .includes("addressed_mother_name") ? "Yes" : "No",

directly_spoke_directly_mother:
  (flat["respectful_maternity_care/spoken_to_directly"] || "")
    .split(" ")
    .includes("spoke_directly_mother") ? "Yes" : "No",

directly_encouraged_needs_expression:
  (flat["respectful_maternity_care/spoken_to_directly"] || "")
    .split(" ")
    .includes("encouraged_needs_expression") ? "Yes" : "No",

directly_engaged_companion_support:
  (flat["respectful_maternity_care/spoken_to_directly"] || "")
    .split(" ")
    .includes("engaged_companion_support") ? "Yes" : "No",

directly_unable_to_observe:
  (flat["respectful_maternity_care/spoken_to_directly"] || "")
    .split(" ")
    .includes("unable_to_observe") ? "Yes" : "No",

directly_none_of_above:
  (flat["respectful_maternity_care/spoken_to_directly"] || "")
    .split(" ")
    .includes("none_of_above") ? "Yes" : "No",


// ================= SPOKEN TO KINDLY =================
kindly_responded_mother_needs:
  (flat["respectful_maternity_care/spoken_to_kindly"] || "")
    .split(" ")
    .includes("responded_mother_needs") ? "Yes" : "No",

kindly_showed_empathy_compassion:
  (flat["respectful_maternity_care/spoken_to_kindly"] || "")
    .split(" ")
    .includes("showed_empathy_compassion") ? "Yes" : "No",

kindly_used_encouragement_praise:
  (flat["respectful_maternity_care/spoken_to_kindly"] || "")
    .split(" ")
    .includes("used_encouragement_praise") ? "Yes" : "No",

kindly_listened_actively_mother:
  (flat["respectful_maternity_care/spoken_to_kindly"] || "")
    .split(" ")
    .includes("listened_actively_mother") ? "Yes" : "No",

kindly_positive_attitude_respect:
  (flat["respectful_maternity_care/spoken_to_kindly"] || "")
    .split(" ")
    .includes("positive_attitude_respect") ? "Yes" : "No",

kindly_privacy_confidentiality_ensured:
  (flat["respectful_maternity_care/spoken_to_kindly"] || "")
    .split(" ")
    .includes("privacy_confidentiality_ensured") ? "Yes" : "No",

kindly_unable_to_observe:
  (flat["respectful_maternity_care/spoken_to_kindly"] || "")
    .split(" ")
    .includes("unable_to_observe") ? "Yes" : "No",

kindly_none_of_above:
  (flat["respectful_maternity_care/spoken_to_kindly"] || "")
    .split(" ")
    .includes("none_of_above") ? "Yes" : "No",


//========FORMS OF DISRESPECT TO MOM=========================
      rmc_lack_of_privacy:
       (flat["respectful_maternity_care/disrespect_to_mother"] || "")
       .split(" ")
       .includes("lack_of_privacy") ? "Yes" : "No",

      rmc_non_consented_care:
       (flat["respectful_maternity_care/disrespect_to_mother"] || "")
       .split(" ")
       .includes("non_consented_care") ? "Yes" : "No",

      rmc_physical_abuse:
      (flat["respectful_maternity_care/disrespect_to_mother"] || "")
      .split(" ")
      .includes("physical_abuse") ? "Yes" : "No",

      rmc_verbal_abuse:
      (flat["respectful_maternity_care/disrespect_to_mother"] || "")
      .split(" ")
      .includes("verbal_abuse") ? "Yes" : "No",

      rmc_discrimination:
      (flat["respectful_maternity_care/disrespect_to_mother"] || "")
      .split(" ")
      .includes("discrimination") ? "Yes" : "No",

      rmc_abandonment:
      (flat["respectful_maternity_care/disrespect_to_mother"] || "")
      .split(" ")
      .includes("abandonment") ? "Yes" : "No",

      rmc_denied_pain_relief:
      (flat["respectful_maternity_care/disrespect_to_mother"] || "")
      .split(" ")
      .includes("denied_pain_relief") ? "Yes" : "No",

      rmc_coerced_procedures:
      (flat["respectful_maternity_care/disrespect_to_mother"] || "")
      .split(" ")
      .includes("coerced_procedures") ? "Yes" : "No",

      rmc_unable_to_observe:
      (flat["respectful_maternity_care/disrespect_to_mother"] || "")
      .split(" ")
      .includes("Unable_to_observe") ? "Yes" : "No",


       rmc_no_disrespect_to_mother:
       (flat["respectful_maternity_care/disrespect_to_mother"] || "")
       .split(" ")
       .includes("Unable_to_observe")
       ? "Unable to observe"
       : (flat["respectful_maternity_care/disrespect_to_mother"] || "")
        .split(" ")
        .includes("mother_did_not_experience_disrespect")
       ? "Yes"
       : "No",

      fundal_pressure: formatCellValue(flat["harmful_practices/fundal_pressure"]),
      perineum_stretching: formatCellValue(flat["harmful_practices/perineum_stretching"]),
      newborn_slapped: formatCellValue(flat["harmful_practices/nb_slapped"]),
      newborn_upside_down: formatCellValue(flat["harmful_practices/nb_upside_down"]),

      partogragh_initiation: formatCellValue(flat["partograph_review/partogragh_initiation"]),
      partograph_half_hr: formatCellValue(flat["partograph_review/partograph_half_hr"]),
      fetal_heart_correct: formatCellValue(flat["partograph_review/fetal_heart_correct"]),
      maternal_pulse_correct: flat["partograph_review/maternal_pulse_correct"],
      bp_4hrs: formatCellValue(flat["partograph_review/bp_4hrs"]),
      partograph_summary_filled: formatCellValue(flat["partograph_review/partograph_summary_filled"]),
      delivery_method_filled: formatCellValue(flat["partograph_review/delivery_method_filled"]),
      blood_loss_estimation: formatCellValue(flat["partograph_review/blood_loss_estimation"]),
      partograph_accuracy_concern: formatCellValue(flat["partograph_review/partograph_accuracy_concern"]),

      accuracy_passenger:
      (flat["partograph_review/accuracy_concern_category"] || "")
      .split(" ")
      .includes("passenger__foetal_heart_rate__moulding_a") ? "Yes" : "No",

      accuracy_passage:
      (flat["partograph_review/accuracy_concern_category"] || "")
      .split(" ")
      .includes("passage__cervical_dilatation_and_head_de") ? "Yes" : "No",

      accuracy_powers:
      (flat["partograph_review/accuracy_concern_category"] || "")
      .split(" ")
      .includes("powers__contractions") ? "Yes" : "No",

      accuracy_maternal_status_vital_signs:
      (flat["partograph_review/accuracy_concern_category"] || "")
      .split(" ")
      .includes("maternal_status__vital_signs") ? "Yes" : "No",

      accuracy_labour_summary:
      (flat["partograph_review/accuracy_concern_category"] || "")
      .split(" ")
      .includes("summary_of_labour_after_delivery") ? "Yes" : "No",
 

      lcg_initiated_correct: formatCellValue(flat["labor_care_guide/lcg_initiated_correct"]),
      contractions_monitored_1st: formatCellValue(flat["labor_care_guide/contractions_monitored_1st"]),
      fhr_monitored_1st: formatCellValue(flat["labor_care_guide/fhr_monitored_1st"]),
      bp_monitored_recorded: formatCellValue(flat["labor_care_guide/bp_monitored_recorded"]),
      contractions_monitored_2nd: formatCellValue(flat["labor_care_guide/contractions_monitored_2nd"]),
      fhr_monitored_2nd: formatCellValue(flat["labor_care_guide/fhr_monitored_2nd"]),
      delivery_time_documented: formatCellValue(flat["labor_care_guide/delivery_time_documented"]),
      delivery_method_documented: formatCellValue(flat["labor_care_guide/delivery_method_documented"]),
      ebl_documented_correctly: formatCellValue(flat["labor_care_guide/ebl_documented_correctly"]),
      lcg_accuracy_concerns: formatCellValue(flat["labor_care_guide/lcg_data_concerns"]),
      
      lcg_accuracy_passenger:
      (flat["labor_care_guide/accuracy_concern_category_lcg"] || "")
      .split(" ")
      .includes("passenger__foetal_heart_rate__moulding_a") ? "Yes" : "No",

      lcg_accuracy_passage:
      (flat["labor_care_guide/accuracy_concern_category_lcg"] || "")
      .split(" ")
      .includes("passage__cervical_dilatation_and_head_de") ? "Yes" : "No",

      lcg_accuracy_powers:
      (flat["labor_care_guide/accuracy_concern_category_lcg"] || "")
      .split(" ")
      .includes("powers__contractions") ? "Yes" : "No",

      lcg_accuracy_maternal_vital_signs:
      (flat["labor_care_guide/accuracy_concern_category_lcg"] || "")
      .split(" ")
      .includes("maternal_status__vital_signs") ? "Yes" : "No",

      lcg_accuracy_labour_summary:
      (flat["labor_care_guide/accuracy_concern_category_lcg"] || "")
      .split(" ")
      .includes("summary_of_labour_after_delivery") ? "Yes" : "No",


      observer_intervention: formatCellValue(flat["group_observer_feedback/observer_intervention"]),

      observer_intervention_birth_preparedness:
     (flat["group_observer_feedback/observer_intervention"] || "")
     .split(" ")
     .includes("birth_preparedness") ? "Yes" : "No",

      observer_intervention_technical_quality_immediately_following:
      (flat["group_observer_feedback/observer_intervention"] || "")
      .split(" ")
      .includes("Technical_quality_immediately_following_") ? "Yes" : "No",

      observer_intervention_post_birth_infection_prevention:
      (flat["group_observer_feedback/observer_intervention"] || "")
      .split(" ")
      .includes("Post-birth_infection_prevention") ? "Yes" : "No",

      observer_intervention_respectful_maternity_care:
      (flat["group_observer_feedback/observer_intervention"] || "")
      .split(" ")
      .includes("Respectful_maternity_care") ? "Yes" : "No",

      observer_intervention_avoidance_of_harmful_practices:
      (flat["group_observer_feedback/observer_intervention"] || "")
      .split(" ")
      .includes("Avoidance_of_harmful_practices") ? "Yes" : "No",

      observer_intervention_partograph:
      (flat["group_observer_feedback/observer_intervention"] || "")
      .split(" ")
      .includes("partograph") ? "Yes" : "No",

      observer_intervention_labor_care_guide:
      (flat["group_observer_feedback/observer_intervention"] || "")
      .split(" ")
      .includes("labor_care_guide") ? "Yes" : "No",

      observer_intervention_description: formatCellValue(flat["group_observer_feedback/intervention_description"]),
      further_feedback: formatCellValue(flat["group_observer_feedback/further_feedback"]),
      observer_confidence: formatCellValue(flat["group_observer_feedback/observer_confidence"])
      
    };

   transformed.quality_care_score =
      calculateQualityCareScore(transformed);

   const sectionScores = calculateSectionScores(transformed);

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
    const headers = Object.keys(transformedData[0]);

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    const rows = transformedData.map(obj =>
      headers.map(h => obj[h] || "")
    );

    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length)
      .setValues(rows);

    Logger.log(`Inserted ${rows.length} new records.`);
  }

  // Data integrity: highlight negative durations on all *_duration columns.
  applyNegativeDurationConditionalFormatting(sheet);

  // Data integrity: observer timing + companion consistency checks.
  refreshObserverTimingIntegrityChecks(sheet);
}

/**
 * One-time cleanup: remove duplicate rows in "QuIPS Transformed Data " by _uuid,
 * keeping the first occurrence of each UUID. Run manually from the Apps Script editor.
 */
function dedupeQuipsSheetByUuid() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = "QuIPS Transformed Data ";
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log('Sheet "' + sheetName + '" not found.');
    return;
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1) {
    Logger.log("No data rows to dedupe.");
    return;
  }

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  let uuidCol = headers.indexOf("_uuid");
  if (uuidCol < 0) uuidCol = 0; // 0-based index into row arrays

  const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const seen = new Set();
  const kept = [];
  let removed = 0;

  data.forEach(row => {
    const uuid = row[uuidCol] ? String(row[uuidCol]) : "";
    if (uuid && seen.has(uuid)) {
      removed++;
      return;
    }
    if (uuid) seen.add(uuid);
    kept.push(row);
  });

  if (removed === 0) {
    Logger.log("No duplicate _uuid rows found.");
    return;
  }

  sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  if (kept.length > 0) {
    sheet.getRange(2, 1, kept.length, lastCol).setValues(kept);
  }

  Logger.log(`Removed ${removed} duplicate row(s); kept ${kept.length}.`);
}