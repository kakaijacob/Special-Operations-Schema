/**
 * QuIPS — data quality and validation.
 *
 * After each extract, the extraction file calls:
 *   applyNegativeDurationConditionalFormatting(sheet)
 *   refreshObserverTimingIntegrityChecks(sheet)
 *
 * Checks written onto "QuIPS Transformed Data":
 *   1. date_ended - date_started < 30 minutes (likely retrospective fill)
 *   2. successive same-observer + same-facility date_ended gap < 30 minutes
 *   3. successive same-observer + same-facility date_submitted gap < 30 minutes
 *   4. birth_companion = No but directly_engaged_companion_support = Yes
 *   5. any *_duration value that starts with "-"
 *
 * qa_core is the share of applicable checks passed (1 = clean).
 * dedupeQuipsSheetByUuid() is a manual one-time cleanup.
 */

var QUIPS_QA_INDIAN_RED = "#CD5C5C";
var QUIPS_MIN_OBSERVER_GAP_MS = 30 * 60 * 1000;
var QUIPS_QA_INTEGRITY_COLUMNS = [
  "qa_short_observation",
  "qa_successive_ended_lt_30m",
  "qa_successive_submitted_lt_30m",
  "qa_companion_inconsistency",
  "qa_core",
  "qa_timing_issues"
];

function quipsParseDateTimeValue_(value) {
  if (value === null || value === undefined || value === "") return null;
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value.getTime())) {
    return value;
  }
  var s = String(value).trim();
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (m) {
    return new Date(
      Number(m[1]), Number(m[2]) - 1, Number(m[3]),
      Number(m[4]), Number(m[5]), Number(m[6])
    );
  }
  var d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function quipsFormatMinutes_(ms) {
  if (ms === null || ms === undefined || isNaN(ms)) return "";
  return (ms / 60000).toFixed(1);
}

function quipsEnsureColumns_(targetSheet, columnNames) {
  var lastCol = Math.max(targetSheet.getLastColumn(), 1);
  var headers = targetSheet.getRange(1, 1, 1, lastCol).getValues()[0]
    .map(function (h) { return String(h || ""); });
  var headerIndex = {};

  headers.forEach(function (h, i) {
    if (h) headerIndex[h] = i;
  });

  columnNames.forEach(function (name) {
    if (headerIndex[name] === undefined) {
      var newCol = targetSheet.getLastColumn() + 1;
      targetSheet.getRange(1, newCol).setValue(name);
      headerIndex[name] = newCol - 1;
    }
  });

  return headerIndex;
}

function applyNegativeDurationConditionalFormatting(targetSheet) {
  var lastCol = targetSheet.getLastColumn();
  if (lastCol < 1) return;

  var headers = targetSheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var durationCols = [];

  headers.forEach(function (header, index) {
    if (String(header || "").endsWith("_duration")) {
      durationCols.push(index + 1);
    }
  });

  if (durationCols.length === 0) return;

  var durationColSet = {};
  durationCols.forEach(function (col) { durationColSet[col] = true; });
  var maxRows = targetSheet.getMaxRows();

  var keptRules = targetSheet.getConditionalFormatRules().filter(function (rule) {
    return !rule.getRanges().some(function (range) {
      return range.getNumColumns() === 1 && durationColSet[range.getColumn()];
    });
  });

  var durationRules = durationCols.map(function (col) {
    var range = targetSheet.getRange(2, col, maxRows - 1, 1);
    return SpreadsheetApp.newConditionalFormatRule()
      .whenTextStartsWith("-")
      .setBackground(QUIPS_QA_INDIAN_RED)
      .setRanges([range])
      .build();
  });

  targetSheet.setConditionalFormatRules(keptRules.concat(durationRules));
}

function quipsApplyQaYesConditionalFormatting_(targetSheet, headerIndex) {
  var yesFlagCols = [
    "qa_short_observation",
    "qa_successive_ended_lt_30m",
    "qa_successive_submitted_lt_30m",
    "qa_companion_inconsistency"
  ]
    .map(function (name) { return headerIndex[name]; })
    .filter(function (i) { return i !== undefined; })
    .map(function (i) { return i + 1; });

  var issuesCol = headerIndex.qa_timing_issues !== undefined
    ? headerIndex.qa_timing_issues + 1
    : null;

  var scoreCol = headerIndex.qa_core !== undefined
    ? headerIndex.qa_core + 1
    : null;

  var managedCols = {};
  yesFlagCols.forEach(function (col) { managedCols[col] = true; });
  if (issuesCol) managedCols[issuesCol] = true;
  if (scoreCol) managedCols[scoreCol] = true;
  if (Object.keys(managedCols).length === 0) return;

  var maxRows = targetSheet.getMaxRows();

  var keptRules = targetSheet.getConditionalFormatRules().filter(function (rule) {
    return !rule.getRanges().some(function (range) {
      return range.getNumColumns() === 1 && managedCols[range.getColumn()];
    });
  });

  var qaRules = yesFlagCols.map(function (col) {
    return SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Yes")
      .setBackground(QUIPS_QA_INDIAN_RED)
      .setRanges([targetSheet.getRange(2, col, maxRows - 1, 1)])
      .build();
  });

  if (issuesCol) {
    qaRules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenCellNotEmpty()
        .setBackground(QUIPS_QA_INDIAN_RED)
        .setRanges([targetSheet.getRange(2, issuesCol, maxRows - 1, 1)])
        .build()
    );
  }

  if (scoreCol) {
    qaRules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenNumberLessThan(1)
        .setBackground(QUIPS_QA_INDIAN_RED)
        .setRanges([targetSheet.getRange(2, scoreCol, maxRows - 1, 1)])
        .build()
    );
  }

  targetSheet.setConditionalFormatRules(keptRules.concat(qaRules));
}

function quipsComputeQaCore_(rec, hasCompanionCols) {
  var passed = 0;
  var total = 0;

  if (rec.started && rec.ended) {
    total += 1;
    if (!rec.shortObservation) passed += 1;
  }

  total += 1;
  if (!rec.successiveEnded) passed += 1;

  total += 1;
  if (!rec.successiveSubmitted) passed += 1;

  if (hasCompanionCols) {
    total += 1;
    if (!rec.companionInconsistency) passed += 1;
  }

  if (rec.hasDurationValue) {
    total += 1;
    if (!rec.negativeDuration) passed += 1;
  }

  if (total === 0) return 1;
  return Number((passed / total).toFixed(3));
}

function refreshObserverTimingIntegrityChecks(targetSheet) {
  var lastRow = targetSheet.getLastRow();
  var lastCol = targetSheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return;

  var headerIndex = quipsEnsureColumns_(targetSheet, QUIPS_QA_INTEGRITY_COLUMNS);
  var required = [
    "_uuid",
    "observer_name",
    "facility_code",
    "date_started",
    "date_ended",
    "date_submitted"
  ];
  if (required.some(function (name) { return headerIndex[name] === undefined; })) {
    Logger.log("Timing QA skipped: missing required metadata columns.");
    return;
  }

  var width = targetSheet.getLastColumn();
  var values = targetSheet.getRange(2, 1, lastRow - 1, width).getValues();

  var headersNow = targetSheet.getRange(1, 1, 1, width).getValues()[0];
  var durationColIdxs = [];
  headersNow.forEach(function (h, i) {
    if (String(h || "").endsWith("_duration")) durationColIdxs.push(i);
  });

  var hasCompanionCols =
    headerIndex.birth_companion !== undefined &&
    headerIndex.directly_engaged_companion_support !== undefined;

  var records = values.map(function (row, idx) {
    var started = quipsParseDateTimeValue_(row[headerIndex.date_started]);
    var ended = quipsParseDateTimeValue_(row[headerIndex.date_ended]);
    var submitted = quipsParseDateTimeValue_(row[headerIndex.date_submitted]);
    var birthCompanion = hasCompanionCols
      ? String(row[headerIndex.birth_companion] || "").trim().toLowerCase()
      : "";
    var engagedCompanion = hasCompanionCols
      ? String(row[headerIndex.directly_engaged_companion_support] || "").trim().toLowerCase()
      : "";

    var hasDurationValue = false;
    var negativeDuration = false;
    durationColIdxs.forEach(function (i) {
      var raw = row[i];
      if (raw === null || raw === undefined || raw === "") return;
      hasDurationValue = true;
      if (String(raw).trim().startsWith("-")) negativeDuration = true;
    });

    return {
      rowIndex: idx,
      uuid: String(row[headerIndex._uuid] || ""),
      observer: String(row[headerIndex.observer_name] || "").trim(),
      facilityCode: String(row[headerIndex.facility_code] || "").trim(),
      started: started,
      ended: ended,
      submitted: submitted,
      birthCompanion: birthCompanion,
      engagedCompanion: engagedCompanion,
      hasDurationValue: hasDurationValue,
      negativeDuration: negativeDuration,
      shortObservation: false,
      successiveEnded: false,
      successiveSubmitted: false,
      companionInconsistency: false,
      qaCore: 1,
      notes: []
    };
  });

  records.forEach(function (rec) {
    if (rec.started && rec.ended) {
      var windowMs = rec.ended.getTime() - rec.started.getTime();
      if (windowMs < QUIPS_MIN_OBSERVER_GAP_MS) {
        rec.shortObservation = true;
        rec.notes.push(
          windowMs < 0
            ? "form_window_negative(" + quipsFormatMinutes_(windowMs) + "m)"
            : "form_window_lt_30m(" + quipsFormatMinutes_(windowMs) + "m)"
        );
      }
    }

    if (rec.birthCompanion === "no" && rec.engagedCompanion === "yes") {
      rec.companionInconsistency = true;
      rec.notes.push("companion_support_without_birth_companion");
    }

    if (rec.negativeDuration) {
      rec.notes.push("negative_duration");
    }
  });

  function flagSuccessiveGaps(timeKey, flagKey, label) {
    var byObserverFacility = {};
    records.forEach(function (rec) {
      if (!rec.observer || !rec.facilityCode || !rec[timeKey]) return;
      var key = rec.observer + "||" + rec.facilityCode;
      if (!byObserverFacility[key]) byObserverFacility[key] = [];
      byObserverFacility[key].push(rec);
    });

    Object.keys(byObserverFacility).forEach(function (key) {
      var group = byObserverFacility[key].slice().sort(function (a, b) {
        return a[timeKey].getTime() - b[timeKey].getTime();
      });

      for (var i = 1; i < group.length; i++) {
        var prev = group[i - 1];
        var curr = group[i];
        var gapMs = curr[timeKey].getTime() - prev[timeKey].getTime();
        if (gapMs < QUIPS_MIN_OBSERVER_GAP_MS) {
          prev[flagKey] = true;
          curr[flagKey] = true;
          curr.notes.push(label + "_gap_lt_30m(" + quipsFormatMinutes_(gapMs) + "m vs " + (prev.uuid || "prior") + ")");
          prev.notes.push(label + "_gap_lt_30m(" + quipsFormatMinutes_(gapMs) + "m vs " + (curr.uuid || "next") + ")");
        }
      }
    });
  }

  flagSuccessiveGaps("ended", "successiveEnded", "successive_date_ended");
  flagSuccessiveGaps("submitted", "successiveSubmitted", "successive_date_submitted");

  records.forEach(function (rec) {
    rec.qaCore = quipsComputeQaCore_(rec, hasCompanionCols);
  });

  var shortCol = headerIndex.qa_short_observation + 1;
  var endedCol = headerIndex.qa_successive_ended_lt_30m + 1;
  var submittedCol = headerIndex.qa_successive_submitted_lt_30m + 1;
  var companionCol = headerIndex.qa_companion_inconsistency + 1;
  var scoreCol = headerIndex.qa_core + 1;
  var issuesCol = headerIndex.qa_timing_issues + 1;

  targetSheet.getRange(2, shortCol, records.length, 1).setValues(records.map(function (r) {
    return [r.shortObservation ? "Yes" : ""];
  }));
  targetSheet.getRange(2, endedCol, records.length, 1).setValues(records.map(function (r) {
    return [r.successiveEnded ? "Yes" : ""];
  }));
  targetSheet.getRange(2, submittedCol, records.length, 1).setValues(records.map(function (r) {
    return [r.successiveSubmitted ? "Yes" : ""];
  }));
  targetSheet.getRange(2, companionCol, records.length, 1).setValues(records.map(function (r) {
    return [r.companionInconsistency ? "Yes" : ""];
  }));
  targetSheet.getRange(2, scoreCol, records.length, 1).setValues(records.map(function (r) {
    return [r.qaCore];
  }));
  targetSheet.getRange(2, issuesCol, records.length, 1).setValues(records.map(function (r) {
    var uniqueNotes = [];
    var seen = {};
    r.notes.forEach(function (note) {
      if (!seen[note]) {
        seen[note] = true;
        uniqueNotes.push(note);
      }
    });
    return [uniqueNotes.join("; ")];
  }));

  quipsApplyQaYesConditionalFormatting_(targetSheet, headerIndex);

  var flaggedCount = records.filter(function (r) {
    return r.shortObservation ||
      r.successiveEnded ||
      r.successiveSubmitted ||
      r.companionInconsistency ||
      r.negativeDuration;
  }).length;

  var flaggedPct = records.length === 0
    ? "0.0"
    : ((flaggedCount / records.length) * 100).toFixed(1);

  var avgQa = records.length === 0
    ? "1.000"
    : (records.reduce(function (sum, r) { return sum + r.qaCore; }, 0) / records.length).toFixed(3);

  Logger.log(
    "Integrity QA on '" + targetSheet.getName() + "': flagged " + flaggedCount +
    " of " + records.length + " (" + flaggedPct + "%) observations; avg qa_core=" + avgQa + "."
  );
}

/**
 * One-time cleanup: remove duplicate rows by _uuid, keeping the first
 * occurrence of each UUID. Run manually from the Apps Script editor.
 */
function dedupeQuipsSheetByUuid() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = getQuipsSecrets_().sheetName;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log('Sheet "' + sheetName + '" not found.');
    return;
  }

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) {
    Logger.log("No data rows to dedupe.");
    return;
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var uuidCol = headers.indexOf("_uuid");
  if (uuidCol < 0) uuidCol = 0;

  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var seen = {};
  var kept = [];
  var removed = 0;

  data.forEach(function (row) {
    var uuid = row[uuidCol] ? String(row[uuidCol]) : "";
    if (uuid && seen[uuid]) {
      removed++;
      return;
    }
    if (uuid) seen[uuid] = true;
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

  Logger.log("Removed " + removed + " duplicate row(s); kept " + kept.length + ".");
}
