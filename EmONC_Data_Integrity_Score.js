/**
 * EmONC Data Integrity / Data Quality Score
 *
 * Companion to EmONC_Curriculum_Activities_Log_Transformation.js (fetchKoboData_All).
 * Framework: EmONC_Data_Audit_Framework.md
 *
 * How to run (Google Apps Script bound to the CTF Activities spreadsheet):
 *   1. Run fetchKoboData_All() so monthly sheets exist (e.g. "April-2026").
 *   2. Run scoreEmONCIntegrityFromSheet("April-2026")
 *      — or scoreEmONCIntegrityFromSheet() to auto-pick the latest month sheet.
 *   3. Optional: run scoreEmONCIntegrityFromKobo() to score directly from KoBo
 *      (includes RF-07 form-fill timing via start/end metadata).
 *
 * Outputs (overwritten each run):
 *   Integrity_Submissions  — one row per submission + score / flags
 *   Integrity_Facilities   — facility-month league table
 *   Integrity_Mentors      — mentor watchlist for the scored window
 *   Integrity_Call_List    — purposive verification targets (Amber/Red)
 */

// ===================== CONFIG / THRESHOLDS =====================
// Calibrate against known-clean facilities; see framework §3.2 / §10.

var INTEGRITY_THRESHOLDS = {
  mentorDayCreditsHard: 12,       // RF-01
  mentorDayCreditsSoft: 8,
  submissionExpandedRowsHard: 40, // RF-02
  submissionExpandedRowsSoft: 24,
  activityTypesHard: 5,           // RF-02 / RF-04
  activityTypesSoft: 3,
  topicsHard: 4,                  // RF-04 with activity types
  topicsSoft: 2,
  identicalPackageMentees: 5,     // RF-05
  delaySoftDays: 3,
  delayHardDays: 7,
  delayVeryHardDays: 14,
  formFillSecondsHard: 90,        // RF-07
  formFillMinCredits: 10,
  offHoursStart: 0,               // RF-08 local hour inclusive
  offHoursEnd: 5,                 // exclusive
  offHoursMinExpandedRows: 10,
  velocityZHard: 2.5,             // RF-09
  duplicateWindowDays: 7,         // RF-10
  skillsMenteesHard: 6,
  effortSittingMinutesHard: 120,
  effortMentorDayMinutesHard: 180
};

var INTEGRITY_PENALTIES = {
  rf02_or_rf04: 25,
  rf01: 20,
  rf03_soft: 10,   // 4–7 days
  rf03_hard: 20,   // > 7 days
  rf06: 30,
  rf07: 20,
  rf05: 15,
  rf10: 10,
  rf08: 5,
  rf09: 15,
  rf12: 20
};

var ACTIVITY_MINUTES = {
  "cmes": 30,
  "videos": 15,
  "case_scenarios": 20,
  "skill_demos_mentor": 20,
  "skills_demos_mentee": 20,
  "drills": 45
};

var SKILLS_ACTIVITIES = {
  "skill_demos_mentor": true,
  "skills_demos_mentee": true,
  "drills": true
};

// ===================== PUBLIC ENTRY POINTS =====================

/**
 * Score integrity from an existing monthly activities sheet written by fetchKoboData_All.
 * @param {string=} monthSheetName e.g. "April-2026". If omitted, uses the newest MMMM-yyyy sheet.
 */
function scoreEmONCIntegrityFromSheet(monthSheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = monthSheetName || findLatestMonthSheet_(ss);
  if (!sheetName) {
    throw new Error("No monthly activity sheet found (expected names like April-2026).");
  }

  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) {
    throw new Error("Sheet '" + sheetName + "' has no activity rows.");
  }

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String);
  const col = indexHeaders_(headers);

  const required = [
    "Submission ID", "Submission Date", "Session Date", "Mentor Name",
    "County", "Facility Code", "Facility", "Mentee ID", "Mentee Name",
    "Activity", "Topic"
  ];
  required.forEach(function (h) {
    if (col[h] === undefined) {
      throw new Error("Missing column '" + h + "' in sheet " + sheetName);
    }
  });

  const activityRows = [];
  const submissionMeta = {};

  for (var i = 1; i < values.length; i++) {
    const row = values[i];
    const submissionId = String(row[col["Submission ID"]] || "").trim();
    if (!submissionId) continue;

    const submissionDateRaw = row[col["Submission Date"]];
    const sessionDateRaw = row[col["Session Date"]];
    const submissionDt = parseSheetDateTime_(submissionDateRaw);
    const sessionDt = parseSheetDate_(sessionDateRaw);

    const activityRow = {
      submissionId: submissionId,
      submissionDateRaw: formatForOutput_(submissionDateRaw),
      sessionDateRaw: formatForOutput_(sessionDateRaw),
      submissionDt: submissionDt,
      sessionDt: sessionDt,
      mentorName: String(row[col["Mentor Name"]] || "").trim(),
      county: String(row[col["County"]] || "").trim(),
      facilityCode: String(row[col["Facility Code"]] || "").trim(),
      facilityName: String(row[col["Facility"]] || "").trim(),
      menteeId: String(row[col["Mentee ID"]] || "").trim(),
      menteeName: String(row[col["Mentee Name"]] || "").trim(),
      activity: String(row[col["Activity"]] || "").trim(),
      activityKey: normalizeActivityKey_(row[col["Activity"]]),
      topic: String(row[col["Topic"]] || "").trim()
    };
    activityRows.push(activityRow);

    if (!submissionMeta[submissionId]) {
      submissionMeta[submissionId] = {
        submissionId: submissionId,
        submissionDt: submissionDt,
        sessionDt: sessionDt,
        submissionDateRaw: activityRow.submissionDateRaw,
        sessionDateRaw: activityRow.sessionDateRaw,
        mentorName: activityRow.mentorName,
        county: activityRow.county,
        facilityCode: activityRow.facilityCode,
        facilityName: activityRow.facilityName,
        startIso: null,
        endIso: null,
        formFillSeconds: null
      };
    }
  }

  const monthKey = sheetName;
  const result = computeIntegrityScores_(activityRows, submissionMeta, monthKey);
  writeIntegrityOutputs_(ss, result, monthKey);
  Logger.log(
    "Scored " + result.submissions.length + " submissions / " +
    result.facilities.length + " facilities from sheet " + sheetName
  );
  return result;
}

/**
 * Fetch CTF from KoBo (same source as fetchKoboData_All) and score with form-fill metadata.
 */
function scoreEmONCIntegrityFromKobo() {
  const apiToken = "1faf1291cb5e472b7f5a253f3888380d28e7900b";
  const formUid = "aJaBJKDs7pCRMi8zm3BXze";
  const startDate = "2026-04-01T00:00:00";

  const queryObj = { "_submission_time": { "$gte": startDate } };
  const query = JSON.stringify(queryObj);

  var url =
    "https://kc.humanitarianresponse.info/api/v2/assets/" + formUid + "/data/" +
    "?format=json&query=" + encodeURIComponent(query) +
    "&ordering=-_submission_time&limit=100";

  const options = {
    method: "get",
    headers: { Authorization: "Token " + apiToken },
    contentType: "application/json"
  };

  var allResults = [];
  while (url) {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    if (json.results && json.results.length > 0) {
      allResults = allResults.concat(json.results);
    }
    url = json.next;
    Logger.log("Fetched " + allResults.length + " KoBo records...");
  }

  if (allResults.length === 0) {
    Logger.log("No data found in KoBo.");
    return null;
  }

  const parsed = parseKoboResultsToActivityRows_(allResults);
  const monthKey = "KoBo-" + Utilities.formatDate(
    new Date(), Session.getScriptTimeZone(), "yyyy-MM"
  );
  const result = computeIntegrityScores_(
    parsed.activityRows,
    parsed.submissionMeta,
    monthKey
  );
  writeIntegrityOutputs_(SpreadsheetApp.getActiveSpreadsheet(), result, monthKey);
  Logger.log(
    "Scored " + result.submissions.length + " submissions from KoBo fetch"
  );
  return result;
}

// ===================== CORE SCORING =====================

function computeIntegrityScores_(activityRows, submissionMeta, monthKey) {
  const T = INTEGRITY_THRESHOLDS;
  const P = INTEGRITY_PENALTIES;

  // ---- Group activity rows by submission ----
  const rowsBySubmission = {};
  activityRows.forEach(function (r) {
    if (!rowsBySubmission[r.submissionId]) rowsBySubmission[r.submissionId] = [];
    rowsBySubmission[r.submissionId].push(r);
  });

  // ---- Mentor-day credits: mentor|facility|sessionDate ----
  const mentorDayCredits = {}; // key -> Set of mentee|activity
  const mentorDaySubs = {};    // key -> Set of submissionIds
  const mentorDayEffort = {};  // key -> effort minutes
  const mentorDayFacilities = {}; // mentor|sessionDate -> Set facilities

  Object.keys(rowsBySubmission).forEach(function (sid) {
    const rows = rowsBySubmission[sid];
    const meta = submissionMeta[sid] || {};
    const sample = rows[0];
    const sessionKey = sample.sessionDt
      ? Utilities.formatDate(sample.sessionDt, Session.getScriptTimeZone(), "yyyy-MM-dd")
      : (sample.sessionDateRaw || "");
    const mdKey = [sample.mentorName, sample.facilityCode, sessionKey].join("|");
    const mfKey = [sample.mentorName, sessionKey].join("|");

    if (!mentorDayCredits[mdKey]) mentorDayCredits[mdKey] = {};
    if (!mentorDaySubs[mdKey]) mentorDaySubs[mdKey] = {};
    if (!mentorDayEffort[mdKey]) mentorDayEffort[mdKey] = 0;
    if (!mentorDayFacilities[mfKey]) mentorDayFacilities[mfKey] = {};

    mentorDaySubs[mdKey][sid] = true;
    mentorDayFacilities[mfKey][sample.facilityCode || sample.facilityName] = true;

    const menteeSet = {};
    const activityTopicByMentee = {};

    rows.forEach(function (r) {
      const creditKey = r.menteeId + "|" + r.activityKey;
      mentorDayCredits[mdKey][creditKey] = true;

      menteeSet[r.menteeId] = true;
      if (!activityTopicByMentee[r.menteeId]) activityTopicByMentee[r.menteeId] = {};
      const atKey = r.activityKey + "|" + r.topic;
      activityTopicByMentee[r.menteeId][atKey] = true;
    });

    // Effort: per activity-topic once for group didactic; linear for return demos
    const activityTopics = uniquePairs_(rows, "activityKey", "topic");
    const nMentees = Object.keys(menteeSet).length;
    activityTopics.forEach(function (pair) {
      const base = ACTIVITY_MINUTES[pair.activityKey] || 20;
      var menteeWeight;
      if (pair.activityKey === "skills_demos_mentee") {
        menteeWeight = Math.max(nMentees, 1);
      } else {
        menteeWeight = 1 + 0.15 * Math.max(nMentees - 1, 0);
      }
      mentorDayEffort[mdKey] += base * menteeWeight;
    });
  });

  const mentorDayBulkKeys = {};
  Object.keys(mentorDayCredits).forEach(function (k) {
    const credits = Object.keys(mentorDayCredits[k]).length;
    if (credits > T.mentorDayCreditsHard || mentorDayEffort[k] > T.effortMentorDayMinutesHard) {
      mentorDayBulkKeys[k] = { credits: credits, effort: mentorDayEffort[k] };
    }
  });

  // ---- Duplicate stacking: mentee|activity|topic within window ----
  const eventTimes = activityRows
    .filter(function (r) { return r.sessionDt || r.submissionDt; })
    .map(function (r) {
      return {
        key: [r.menteeId, r.activityKey, r.topic].join("|"),
        sid: r.submissionId,
        t: (r.sessionDt || r.submissionDt).getTime()
      };
    })
    .sort(function (a, b) { return a.t - b.t; });

  const duplicateSubmissionIds = {};
  const byKey = {};
  eventTimes.forEach(function (e) {
    if (!byKey[e.key]) byKey[e.key] = [];
    const windowMs = T.duplicateWindowDays * 24 * 60 * 60 * 1000;
    const prior = byKey[e.key];
    for (var i = 0; i < prior.length; i++) {
      if (e.t - prior[i].t <= windowMs && e.sid !== prior[i].sid) {
        duplicateSubmissionIds[e.sid] = true;
        duplicateSubmissionIds[prior[i].sid] = true;
      }
    }
    prior.push(e);
  });

  // ---- Weekly volume for velocity (facility) ----
  const facilityWeekVolume = {}; // facilityCode -> { weekKey: expanded rows }
  activityRows.forEach(function (r) {
    const dt = r.sessionDt || r.submissionDt;
    if (!dt) return;
    const fac = r.facilityCode || r.facilityName || "UNKNOWN";
    const weekKey = weekKey_(dt);
    if (!facilityWeekVolume[fac]) facilityWeekVolume[fac] = {};
    facilityWeekVolume[fac][weekKey] = (facilityWeekVolume[fac][weekKey] || 0) + 1;
  });

  const facilityVelocityZ = {};
  Object.keys(facilityWeekVolume).forEach(function (fac) {
    const vols = Object.keys(facilityWeekVolume[fac]).map(function (w) {
      return facilityWeekVolume[fac][w];
    });
    const stats = meanStd_(vols);
    var maxZ = 0;
    vols.forEach(function (v) {
      if (stats.std > 0) {
        maxZ = Math.max(maxZ, (v - stats.mean) / stats.std);
      }
    });
    facilityVelocityZ[fac] = maxZ;
  });

  // ---- Score each submission ----
  const submissionScores = [];

  Object.keys(rowsBySubmission).forEach(function (sid) {
    const rows = rowsBySubmission[sid];
    const meta = submissionMeta[sid] || {};
    const sample = rows[0];

    const mentees = unique_(rows.map(function (r) { return r.menteeId; }));
    const activities = unique_(rows.map(function (r) { return r.activityKey; })).filter(Boolean);
    const topics = unique_(rows.map(function (r) { return r.topic; })).filter(Boolean);
    const expandedRows = rows.length;

    const sessionKey = sample.sessionDt
      ? Utilities.formatDate(sample.sessionDt, Session.getScriptTimeZone(), "yyyy-MM-dd")
      : (sample.sessionDateRaw || "");
    const mdKey = [sample.mentorName, sample.facilityCode, sessionKey].join("|");
    const mfKey = [sample.mentorName, sessionKey].join("|");

    const creditsMentorDay = mentorDayCredits[mdKey]
      ? Object.keys(mentorDayCredits[mdKey]).length
      : 0;

    // Identical package across mentees
    const packageByMentee = {};
    rows.forEach(function (r) {
      if (!packageByMentee[r.menteeId]) packageByMentee[r.menteeId] = [];
      packageByMentee[r.menteeId].push(r.activityKey + "|" + r.topic);
    });
    Object.keys(packageByMentee).forEach(function (mid) {
      packageByMentee[mid] = packageByMentee[mid].sort().join(";");
    });
    const packageCounts = {};
    Object.keys(packageByMentee).forEach(function (mid) {
      const p = packageByMentee[mid];
      packageCounts[p] = (packageCounts[p] || 0) + 1;
    });
    var maxIdentical = 0;
    Object.keys(packageCounts).forEach(function (p) {
      maxIdentical = Math.max(maxIdentical, packageCounts[p]);
    });
    const skillsHeavy = activities.some(function (a) { return SKILLS_ACTIVITIES[a]; });

    // Delay
    var delayDays = null;
    var impossibleChronology = false;
    var futureSession = false;
    if (meta.sessionDt && meta.submissionDt) {
      const sessionDay = startOfDay_(meta.sessionDt);
      const submitDay = startOfDay_(meta.submissionDt);
      delayDays = Math.round((submitDay - sessionDay) / (24 * 60 * 60 * 1000));
      if (delayDays < 0) impossibleChronology = true;
    } else if (meta.sessionDt && !meta.submissionDt) {
      // ignore
    }
    if (meta.sessionDt && meta.submissionDt) {
      // future session relative to submission already covered by delayDays < 0
      // also flag if session is after "now"
      if (startOfDay_(meta.sessionDt).getTime() > startOfDay_(new Date()).getTime()) {
        futureSession = true;
        impossibleChronology = true;
      }
    }

    // Form fill
    var formFillSeconds = meta.formFillSeconds;
    if (formFillSeconds == null && meta.startIso && meta.endIso) {
      formFillSeconds = (new Date(meta.endIso) - new Date(meta.startIso)) / 1000;
    }

    // Off-hours
    var offHours = false;
    if (meta.submissionDt) {
      const hour = Number(
        Utilities.formatDate(meta.submissionDt, Session.getScriptTimeZone(), "H")
      );
      if (hour >= T.offHoursStart && hour < T.offHoursEnd && expandedRows >= T.offHoursMinExpandedRows) {
        offHours = true;
      }
    }

    // Effort for this sitting (submission)
    var effortMinutes = 0;
    uniquePairs_(rows, "activityKey", "topic").forEach(function (pair) {
      const base = ACTIVITY_MINUTES[pair.activityKey] || 20;
      var menteeWeight;
      if (pair.activityKey === "skills_demos_mentee") {
        menteeWeight = Math.max(mentees.length, 1);
      } else {
        menteeWeight = 1 + 0.15 * Math.max(mentees.length - 1, 0);
      }
      effortMinutes += base * menteeWeight;
    });

    // Combination mismatch (RF-04)
    const combinationMismatch =
      activities.length >= T.activityTypesHard ||
      (activities.length >= 4 && topics.length >= 3) ||
      effortMinutes > T.effortSittingMinutesHard;

    // Flags
    const flags = [];
    const highFlags = [];

    function addFlag(code, severity, detail) {
      flags.push(code + ": " + detail);
      if (severity === "High") highFlags.push(code);
    }

    if (mentorDayBulkKeys[mdKey]) {
      addFlag(
        "RF-01",
        "High",
        "mentor-day credits=" + creditsMentorDay +
          ", effort≈" + Math.round(mentorDayEffort[mdKey]) + "m"
      );
    }

    if (
      expandedRows > T.submissionExpandedRowsHard ||
      activities.length >= T.activityTypesHard
    ) {
      addFlag(
        "RF-02",
        "High",
        "expanded_rows=" + expandedRows + ", activity_types=" + activities.length
      );
    }

    if (delayDays != null && !impossibleChronology) {
      if (delayDays > T.delayHardDays) {
        addFlag("RF-03", delayDays > T.delayVeryHardDays ? "High" : "Medium", "delay_days=" + delayDays);
      } else if (delayDays > T.delaySoftDays) {
        addFlag("RF-03", "Medium", "delay_days=" + delayDays);
      }
    }

    if (combinationMismatch) {
      addFlag(
        "RF-04",
        "High",
        "types=" + activities.length + ", topics=" + topics.length +
          ", effort≈" + Math.round(effortMinutes) + "m"
      );
    }

    if (maxIdentical >= T.identicalPackageMentees && skillsHeavy) {
      addFlag("RF-05", "High", "identical_package_mentees=" + maxIdentical);
    }

    if (impossibleChronology) {
      addFlag(
        "RF-06",
        "High",
        futureSession ? "future_session_date" : "submission_before_session"
      );
    }

    if (
      formFillSeconds != null &&
      formFillSeconds < T.formFillSecondsHard &&
      expandedRows >= T.formFillMinCredits
    ) {
      addFlag(
        "RF-07",
        "High",
        "form_fill_seconds=" + Math.round(formFillSeconds) +
          ", expanded_rows=" + expandedRows
      );
    }

    if (offHours) {
      addFlag("RF-08", "Medium", "overnight_submission_burst");
    }

    const facKey = sample.facilityCode || sample.facilityName || "UNKNOWN";
    const velZ = facilityVelocityZ[facKey] || 0;
    if (velZ > T.velocityZHard) {
      addFlag("RF-09", "High", "facility_week_z=" + velZ.toFixed(2));
    }

    if (duplicateSubmissionIds[sid]) {
      addFlag("RF-10", "Medium", "duplicate_mentee_activity_topic_within_" + T.duplicateWindowDays + "d");
    }

    const facCount = mentorDayFacilities[mfKey]
      ? Object.keys(mentorDayFacilities[mfKey]).length
      : 1;
    if (facCount >= 2 && creditsMentorDay >= T.mentorDayCreditsSoft) {
      addFlag("RF-12", "High", "facilities_same_day=" + facCount);
    }

    // Score
    var score = 100;
    const flagCodes = flags.map(function (f) { return f.split(":")[0]; });

    if (flagCodes.indexOf("RF-02") >= 0 || flagCodes.indexOf("RF-04") >= 0) {
      score -= P.rf02_or_rf04;
    }
    if (flagCodes.indexOf("RF-01") >= 0) score -= P.rf01;
    if (flagCodes.indexOf("RF-03") >= 0) {
      if (delayDays != null && delayDays > T.delayHardDays) score -= P.rf03_hard;
      else score -= P.rf03_soft;
    }
    if (flagCodes.indexOf("RF-06") >= 0) score -= P.rf06;
    if (flagCodes.indexOf("RF-07") >= 0) score -= P.rf07;
    if (flagCodes.indexOf("RF-05") >= 0) score -= P.rf05;
    if (flagCodes.indexOf("RF-10") >= 0) score -= P.rf10;
    if (flagCodes.indexOf("RF-08") >= 0) score -= P.rf08;
    if (flagCodes.indexOf("RF-09") >= 0) score -= P.rf09;
    if (flagCodes.indexOf("RF-12") >= 0) score -= P.rf12;

    score = Math.max(0, Math.min(100, score));
    const band = scoreBand_(score);

    submissionScores.push({
      monthKey: monthKey,
      submissionId: sid,
      submissionDate: meta.submissionDateRaw || sample.submissionDateRaw,
      sessionDate: meta.sessionDateRaw || sample.sessionDateRaw,
      mentorName: sample.mentorName,
      county: sample.county,
      facilityCode: sample.facilityCode,
      facilityName: sample.facilityName,
      menteeCount: mentees.length,
      activityTypes: activities.length,
      topicCount: topics.length,
      expandedRows: expandedRows,
      mentorDayCredits: creditsMentorDay,
      effortMinutes: Math.round(effortMinutes),
      delayDays: delayDays,
      formFillSeconds: formFillSeconds == null ? "" : Math.round(formFillSeconds),
      integrity_dq_score: score,
      band: band,
      high_severity_flag_count: highFlags.length,
      flags: flags.join(" | "),
      flag_codes: unique_(flagCodes).join(", "),
      verification_status: "Unverified",
      recommended_action: actionForBand_(band)
    });
  });

  submissionScores.sort(function (a, b) {
    return a.integrity_dq_score - b.integrity_dq_score;
  });

  // ---- Facility-month roll-up ----
  const byFacility = {};
  submissionScores.forEach(function (s) {
    const key = (s.facilityCode || s.facilityName || "UNKNOWN") + "||" + (s.county || "");
    if (!byFacility[key]) byFacility[key] = [];
    byFacility[key].push(s);
  });

  const facilities = Object.keys(byFacility).map(function (key) {
    const subs = byFacility[key];
    const sample = subs[0];
    const meanScore =
      subs.reduce(function (a, s) { return a + s.integrity_dq_score; }, 0) / subs.length;
    const highFlagShare =
      subs.filter(function (s) { return s.high_severity_flag_count > 0; }).length / subs.length;
    const facCode = sample.facilityCode || sample.facilityName || "UNKNOWN";
    const velZ = facilityVelocityZ[facCode] || 0;
    const velocityIndex = Math.min(100, Math.max(0, (velZ / T.velocityZHard) * 100));
    const verificationPassRate = 100; // no verification log wired yet

    const facilityScore = Math.round(
      0.5 * meanScore +
      0.2 * (100 - 100 * highFlagShare) +
      0.15 * (100 - velocityIndex) +
      0.15 * verificationPassRate
    );

    const band = scoreBand_(facilityScore);
    const allFlags = {};
    subs.forEach(function (s) {
      String(s.flag_codes || "")
        .split(",")
        .map(function (x) { return x.trim(); })
        .filter(Boolean)
        .forEach(function (c) { allFlags[c] = true; });
    });

    const lateShare =
      subs.filter(function (s) {
        return s.delayDays != null && s.delayDays > INTEGRITY_THRESHOLDS.delayHardDays;
      }).length / subs.length;

    return {
      monthKey: monthKey,
      county: sample.county,
      facilityCode: sample.facilityCode,
      facilityName: sample.facilityName,
      submission_count: subs.length,
      expanded_row_count: subs.reduce(function (a, s) { return a + s.expandedRows; }, 0),
      mean_submission_score: Math.round(meanScore * 10) / 10,
      pct_submissions_high_flag: Math.round(highFlagShare * 1000) / 10,
      pct_submissions_late_gt7d: Math.round(lateShare * 1000) / 10,
      velocity_z_max: Math.round(velZ * 100) / 100,
      integrity_dq_score: Math.max(0, Math.min(100, facilityScore)),
      band: band,
      verification_status: "Unverified",
      flag_codes: Object.keys(allFlags).sort().join(", "),
      recommended_action: actionForBand_(band)
    };
  });

  facilities.sort(function (a, b) {
    return a.integrity_dq_score - b.integrity_dq_score;
  });

  // ---- Mentor watchlist ----
  const byMentor = {};
  submissionScores.forEach(function (s) {
    const key = s.mentorName || "UNKNOWN";
    if (!byMentor[key]) byMentor[key] = [];
    byMentor[key].push(s);
  });

  const mentors = Object.keys(byMentor).map(function (mentor) {
    const subs = byMentor[mentor];
    const highFlagSubs = subs.filter(function (s) { return s.high_severity_flag_count > 0; });
    const meanScore =
      subs.reduce(function (a, s) { return a + s.integrity_dq_score; }, 0) / subs.length;
    const facilitiesTouched = unique_(
      subs.map(function (s) { return s.facilityCode || s.facilityName; })
    );
    const flagCounts = {};
    subs.forEach(function (s) {
      String(s.flag_codes || "")
        .split(",")
        .map(function (x) { return x.trim(); })
        .filter(Boolean)
        .forEach(function (c) { flagCounts[c] = (flagCounts[c] || 0) + 1; });
    });

    return {
      monthKey: monthKey,
      mentorName: mentor,
      submission_count: subs.length,
      facilities_touched: facilitiesTouched.length,
      high_flag_submissions: highFlagSubs.length,
      mean_integrity_dq_score: Math.round(meanScore * 10) / 10,
      min_integrity_dq_score: Math.min.apply(
        null,
        subs.map(function (s) { return s.integrity_dq_score; })
      ),
      top_flags: Object.keys(flagCounts)
        .sort(function (a, b) { return flagCounts[b] - flagCounts[a]; })
        .slice(0, 5)
        .map(function (c) { return c + "(" + flagCounts[c] + ")"; })
        .join(", "),
      recommended_action:
        highFlagSubs.length >= 2 ? "Phone verify" : actionForBand_(scoreBand_(meanScore))
    };
  });

  mentors.sort(function (a, b) {
    return a.mean_integrity_dq_score - b.mean_integrity_dq_score;
  });

  // ---- Purposive call list: Amber/Red submissions, prefer high flags ----
  const callList = submissionScores
    .filter(function (s) { return s.band === "Amber" || s.band === "Red"; })
    .slice(0, 100)
    .map(function (s) {
      return {
        monthKey: s.monthKey,
        priority: s.band === "Red" ? 1 : 2,
        county: s.county,
        facilityCode: s.facilityCode,
        facilityName: s.facilityName,
        mentorName: s.mentorName,
        submissionId: s.submissionId,
        sessionDate: s.sessionDate,
        integrity_dq_score: s.integrity_dq_score,
        band: s.band,
        flags: s.flags,
        sample_approach:
          "Call 1–2 mentees from this submission + 1 mentee from a non-flagged recent submission at same facility",
        recommended_action: s.recommended_action
      };
    });

  return {
    monthKey: monthKey,
    submissions: submissionScores,
    facilities: facilities,
    mentors: mentors,
    callList: callList
  };
}

// ===================== KOBO PARSE (activity-topic paired) =====================

function parseKoboResultsToActivityRows_(results) {
  const tz = Session.getScriptTimeZone();

  const toTitleCase = function (str) {
    return String(str || "")
      .toLowerCase()
      .split(" ")
      .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); })
      .join(" ");
  };

  const formatDateTime = function (iso) {
    return iso ? Utilities.formatDate(new Date(iso), tz, "dd/MM/yyyy HH:mm") : "";
  };
  const formatDate = function (iso) {
    return iso ? Utilities.formatDate(new Date(iso), tz, "dd/MM/yyyy") : "";
  };

  const topicExactMap = {
    Partograph_use_and_interpretation: "Labor Monitoring",
    Maternal_Shock_Resuscitaion: "Maternal Shock",
    Preeclampsia_Eclampsia_Management: "Preeclampsia/Eclampsia Management",
    "Preeclampsia_/_eclampsia": "Preeclampsia/Eclampsia Management",
    Hypertension_in_pregnancy: "Preeclampsia/Eclampsia Management",
    PPH: "Postpartum Haemorrhage (PPH)",
    Vaginal_AVD: "Vacuum-Assisted Delivery",
    Vacuum_Assisted_Delivery: "Vacuum-Assisted Delivery",
    "B-lynch_suture": "B-Lynch Suture",
    Compression_of_Abdominal_Aorta: "Abdominal Aortic Compression",
    Perineal_tear_repair: "Perineal Tear Repair",
    Ubt_placement: "UBT Placement",
    UBT: "UBT Placement",
    "ubt_placement_(free_flow)": "UBT Placement (Free Flow)",
    "Ubt_placement_(free_flow))": "UBT Placement (Free Flow)"
  };

  const topicAfterSpaceMap = {
    "Postpartum haemorrhage (PPH)": "Postpartum Haemorrhage (PPH)",
    "Newborn resuscitation": "Neonatal Resuscitation",
    "Postpartum Hemorrhage (PPH)": "Postpartum Haemorrhage (PPH)",
    "PPH Drill": "Postpartum Haemorrhage (PPH)",
    "Preeclampsia / Eclampsia": "Preeclampsia/Eclampsia Management"
  };

  const formatTopic = function (raw) {
    if (!raw) return "";
    if (Object.prototype.hasOwnProperty.call(topicExactMap, raw)) return topicExactMap[raw];
    const spaced = raw.replace(/_/g, " ");
    if (Object.prototype.hasOwnProperty.call(topicAfterSpaceMap, spaced)) {
      return topicAfterSpaceMap[spaced];
    }
    return spaced;
  };

  const facilityRoots = [
    "demographic_information/facility_details/",
    "demographic_information/mentee_details/"
  ];
  const facilitySuffixes = [
    "kiambu_facilities", "machakos_facilities", "makueni_facilities",
    "muranga_facilities", "nairobi_facilities", "nakuru_facilities",
    "kakamega_facilities", "kisii_facilities", "mombasa_facilities"
  ];
  const facilityFields = facilityRoots.reduce(function (acc, root) {
    return acc.concat(facilitySuffixes.map(function (s) { return root + s; }));
  }, []);

  // Discover mentee multi-select fields dynamically from each record's keys.
  const activityTopicFields = {
    cmes: "emonc_training_curriculum/group_cmes/cmes",
    videos: "emonc_training_curriculum/group_videos/videos",
    case_scenarios: "emonc_training_curriculum/group_case_scenarios/case_scenarios",
    skill_demos_mentor: "emonc_training_curriculum/group_mentor_demo/mentor_skills_demo",
    skills_demos_mentee: "emonc_training_curriculum/group_return_demo/mentee_skills_return_demo",
    drills: "emonc_training_curriculum/group_drills/drills"
  };

  const activityRows = [];
  const submissionMeta = {};

  results.forEach(function (r) {
    const submissionId = r._uuid || r._id;
    const submissionTime = r._submission_time;
    const submissionDt = submissionTime ? new Date(submissionTime) : null;
    const sessionRaw = r["demographic_information/mentor_details/session_date"];
    const sessionDt = sessionRaw ? new Date(sessionRaw) : null;

    const mentorName = toTitleCase(
      String(r["demographic_information/mentor_details/mentor_name"] || "").replace(/_/g, " ")
    );
    const county =
      r["demographic_information/facility_details/county"] ||
      r["demographic_information/mentee_details/county"] ||
      "";

    var facilityCode = "";
    var facilityName = "";
    facilityFields.forEach(function (f) {
      if (r[f]) {
        const parts = String(r[f]).split("_");
        facilityCode = parts[0];
        facilityName = toTitleCase(parts.slice(1).join(" ").replace(/_/g, " "));
      }
    });

    // Discover mentee multi-select fields present on this record
    const mentees = [];
    Object.keys(r).forEach(function (k) {
      const isMenteeField =
        (k.indexOf("demographic_information/mentee_details/") === 0 ||
          k.indexOf("demographic_information/mentee_details_001/") === 0) &&
        /_mentees$|_mentees_001$|kibera_community$/.test(k);
      if (!isMenteeField || !r[k]) return;
      String(r[k]).split(" ").forEach(function (m) {
        if (!m) return;
        const parts = m.split("_");
        mentees.push({
          id: parts[0],
          name: toTitleCase(parts.slice(1).join(" ").replace(/_/g, " "))
        });
      });
    });

    const activities = String(
      r["emonc_training_curriculum/emonc_curriculum_activities/emonc_activities"] || ""
    )
      .split(" ")
      .filter(Boolean);

    const activityTopicPairs = [];
    activities.forEach(function (a) {
      const topicField = activityTopicFields[a];
      if (!topicField || !r[topicField]) return;
      const activityLabel = toTitleCase(a.replace(/_/g, " "));
      String(r[topicField])
        .split(" ")
        .filter(Boolean)
        .forEach(function (topic) {
          activityTopicPairs.push({
            activity: activityLabel,
            activityKey: a,
            topic: formatTopic(topic)
          });
        });
    });

    var formFillSeconds = null;
    if (r.start && r.end) {
      formFillSeconds = (new Date(r.end) - new Date(r.start)) / 1000;
    }

    submissionMeta[submissionId] = {
      submissionId: submissionId,
      submissionDt: submissionDt,
      sessionDt: sessionDt,
      submissionDateRaw: formatDateTime(submissionTime),
      sessionDateRaw: formatDate(sessionRaw),
      mentorName: mentorName,
      county: county,
      facilityCode: facilityCode,
      facilityName: facilityName,
      startIso: r.start || null,
      endIso: r.end || null,
      formFillSeconds: formFillSeconds
    };

    mentees.forEach(function (m) {
      activityTopicPairs.forEach(function (pair) {
        activityRows.push({
          submissionId: submissionId,
          submissionDateRaw: formatDateTime(submissionTime),
          sessionDateRaw: formatDate(sessionRaw),
          submissionDt: submissionDt,
          sessionDt: sessionDt,
          mentorName: mentorName,
          county: county,
          facilityCode: facilityCode,
          facilityName: facilityName,
          menteeId: m.id,
          menteeName: m.name,
          activity: pair.activity,
          activityKey: pair.activityKey,
          topic: pair.topic
        });
      });
    });
  });

  return { activityRows: activityRows, submissionMeta: submissionMeta };
}

// ===================== OUTPUT WRITERS =====================

function writeIntegrityOutputs_(ss, result, monthKey) {
  writeTable_(ss, "Integrity_Submissions", [
    "Month", "Submission ID", "Submission Date", "Session Date", "Mentor Name",
    "County", "Facility Code", "Facility", "Mentee Count", "Activity Types",
    "Topic Count", "Expanded Rows", "Mentor-Day Credits", "Effort Minutes",
    "Delay Days", "Form Fill Seconds", "integrity_dq_score", "Band",
    "High Severity Flag Count", "Flag Codes", "Flags", "verification_status",
    "Recommended Action"
  ], result.submissions.map(function (s) {
    return [
      s.monthKey, s.submissionId, s.submissionDate, s.sessionDate, s.mentorName,
      s.county, s.facilityCode, s.facilityName, s.menteeCount, s.activityTypes,
      s.topicCount, s.expandedRows, s.mentorDayCredits, s.effortMinutes,
      s.delayDays == null ? "" : s.delayDays, s.formFillSeconds,
      s.integrity_dq_score, s.band, s.high_severity_flag_count, s.flag_codes,
      s.flags, s.verification_status, s.recommended_action
    ];
  }));

  writeTable_(ss, "Integrity_Facilities", [
    "Month", "County", "Facility Code", "Facility", "Submissions",
    "Expanded Rows", "Mean Submission Score", "% Submissions High Flag",
    "% Submissions Late >7d", "Velocity Z Max", "integrity_dq_score", "Band",
    "verification_status", "Flag Codes", "Recommended Action"
  ], result.facilities.map(function (f) {
    return [
      f.monthKey, f.county, f.facilityCode, f.facilityName, f.submission_count,
      f.expanded_row_count, f.mean_submission_score, f.pct_submissions_high_flag,
      f.pct_submissions_late_gt7d, f.velocity_z_max, f.integrity_dq_score, f.band,
      f.verification_status, f.flag_codes, f.recommended_action
    ];
  }));

  writeTable_(ss, "Integrity_Mentors", [
    "Month", "Mentor Name", "Submissions", "Facilities Touched",
    "High-Flag Submissions", "Mean integrity_dq_score", "Min integrity_dq_score",
    "Top Flags", "Recommended Action"
  ], result.mentors.map(function (m) {
    return [
      m.monthKey, m.mentorName, m.submission_count, m.facilities_touched,
      m.high_flag_submissions, m.mean_integrity_dq_score, m.min_integrity_dq_score,
      m.top_flags, m.recommended_action
    ];
  }));

  writeTable_(ss, "Integrity_Call_List", [
    "Month", "Priority", "County", "Facility Code", "Facility", "Mentor Name",
    "Submission ID", "Session Date", "integrity_dq_score", "Band", "Flags",
    "Sample Approach", "Recommended Action"
  ], result.callList.map(function (c) {
    return [
      c.monthKey, c.priority, c.county, c.facilityCode, c.facilityName, c.mentorName,
      c.submissionId, c.sessionDate, c.integrity_dq_score, c.band, c.flags,
      c.sample_approach, c.recommended_action
    ];
  }));

  // Small thresholds reference tab
  writeTable_(ss, "Integrity_Thresholds", [
    "Parameter", "Value", "Notes"
  ], Object.keys(INTEGRITY_THRESHOLDS).map(function (k) {
    return [k, INTEGRITY_THRESHOLDS[k], "Calibrate via EmONC_Data_Audit_Framework.md"];
  }));

  Logger.log("Wrote integrity sheets for " + monthKey);
}

function writeTable_(ss, sheetName, headers, rows) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  try {
    sheet.setFrozenRows(1);
  } catch (e) {
    // ignore
  }
}

// ===================== HELPERS =====================

function indexHeaders_(headers) {
  const col = {};
  headers.forEach(function (h, i) { col[String(h).trim()] = i; });
  return col;
}

function findLatestMonthSheet_(ss) {
  const monthNames = {
    January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
    July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
  };
  var best = null;
  var bestKey = -1;
  ss.getSheets().forEach(function (sh) {
    const name = sh.getName();
    const m = name.match(/^([A-Za-z]+)-(\d{4})$/);
    if (!m) return;
    const monthNum = monthNames[m[1]];
    if (!monthNum) return;
    const key = Number(m[2]) * 100 + monthNum;
    if (key > bestKey) {
      bestKey = key;
      best = name;
    }
  });
  return best;
}

function normalizeActivityKey_(activity) {
  const s = String(activity || "").trim().toLowerCase().replace(/\s+/g, "_");
  const aliases = {
    cmes: "cmes",
    cme: "cmes",
    videos: "videos",
    video: "videos",
    case_scenarios: "case_scenarios",
    case_scenario: "case_scenarios",
    skill_demos_mentor: "skill_demos_mentor",
    mentor_skills_demo: "skill_demos_mentor",
    skills_demos_mentee: "skills_demos_mentee",
    mentee_skills_return_demo: "skills_demos_mentee",
    drills: "drills",
    drill: "drills"
  };
  return aliases[s] || s;
}

function parseSheetDateTime_(value) {
  if (!value && value !== 0) return null;
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value)) {
    return new Date(value.getTime());
  }
  const s = String(value).trim();
  // dd/MM/yyyy HH:mm
  var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) {
    return new Date(
      Number(m[3]),
      Number(m[2]) - 1,
      Number(m[1]),
      Number(m[4] || 0),
      Number(m[5] || 0),
      0
    );
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function parseSheetDate_(value) {
  const d = parseSheetDateTime_(value);
  return d ? startOfDay_(d) : null;
}

function startOfDay_(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatForOutput_(value) {
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value)) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
  }
  return value == null ? "" : String(value);
}

function unique_(arr) {
  const seen = {};
  const out = [];
  arr.forEach(function (x) {
    const k = String(x);
    if (seen[k]) return;
    seen[k] = true;
    out.push(x);
  });
  return out;
}

function uniquePairs_(rows, keyA, keyB) {
  const seen = {};
  const out = [];
  rows.forEach(function (r) {
    const a = r[keyA];
    const b = r[keyB];
    const k = a + "||" + b;
    if (seen[k]) return;
    seen[k] = true;
    const obj = {};
    obj[keyA] = a;
    obj[keyB] = b;
    // also expose activityKey/topic shorthand used by callers
    if (keyA === "activityKey") obj.activityKey = a;
    if (keyB === "topic") obj.topic = b;
    out.push(obj);
  });
  return out;
}

function weekKey_(d) {
  // ISO-ish week: year + week number
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNo =
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    );
  return date.getFullYear() + "-W" + ("0" + weekNo).slice(-2);
}

function meanStd_(arr) {
  if (!arr.length) return { mean: 0, std: 0 };
  const mean = arr.reduce(function (a, b) { return a + b; }, 0) / arr.length;
  if (arr.length < 2) return { mean: mean, std: 0 };
  const variance =
    arr.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) /
    (arr.length - 1);
  return { mean: mean, std: Math.sqrt(variance) };
}

function scoreBand_(score) {
  if (score >= 80) return "Green";
  if (score >= 50) return "Amber";
  return "Red";
}

function actionForBand_(band) {
  if (band === "Green") return "Monitor";
  if (band === "Amber") return "Phone verify";
  return "Field audit";
}
