/**
 * Unit tests for mentee/IFM sync status + ID helpers.
 * Mirrors pure logic from Kobo_Tools_Orchestrator.js (no Apps Script runtime).
 */

function findCaseInsensitiveHeaderIndex_(header, name) {
  var wanted = String(name).trim().toLowerCase();
  for (var i = 0; i < header.length; i++) {
    if (
      String(header[i] == null ? "" : header[i]).trim().toLowerCase() === wanted
    ) {
      return i;
    }
  }
  return -1;
}

function normalizeEligibleStatusValues_(values, sourceLabel) {
  var eligibleConverted = 0;
  var ineligibleConverted = 0;

  if (!values || !values.length) {
    return {
      values: values,
      eligibleConverted: eligibleConverted,
      ineligibleConverted: ineligibleConverted
    };
  }

  var statusIndex = findCaseInsensitiveHeaderIndex_(values[0], "Status");
  if (statusIndex === -1) {
    throw new Error(
      sourceLabel + " is missing the 'Status' column required for syncing."
    );
  }

  for (var i = 1; i < values.length; i++) {
    var raw = values[i][statusIndex];
    var cleaned = String(raw == null ? "" : raw).trim().toLowerCase();

    if (cleaned === "eligible") {
      values[i][statusIndex] = "Active";
      eligibleConverted++;
    } else if (cleaned === "ineligible") {
      values[i][statusIndex] = "Inactive";
      ineligibleConverted++;
    }
  }

  return {
    values: values,
    eligibleConverted: eligibleConverted,
    ineligibleConverted: ineligibleConverted
  };
}

function filterInactiveRows_(values, sourceLabel) {
  if (!values || !values.length) {
    return { values: values, removed: 0 };
  }

  var statusIndex = findCaseInsensitiveHeaderIndex_(values[0], "Status");
  if (statusIndex === -1) {
    throw new Error(
      sourceLabel + " is missing the 'Status' column required for syncing."
    );
  }

  var output = [values[0]];
  var removed = 0;

  for (var i = 1; i < values.length; i++) {
    var status = String(
      values[i][statusIndex] == null ? "" : values[i][statusIndex]
    ).trim().toLowerCase();

    if (status === "inactive") {
      removed++;
      continue;
    }
    output.push(values[i]);
  }

  return { values: output, removed: removed };
}

function normalizeMenteeId_(rawValue) {
  var value = String(rawValue == null ? "" : rawValue).trim();
  value = value.replace(/[\s\-()]/g, "");
  if (value.charAt(0) === "+") value = value.substring(1);

  if (!/^\d+$/.test(value)) {
    return {
      valid: false,
      value: "",
      countryCodeTrimmed: false,
      leadingZeroTrimmed: false
    };
  }

  var countryCodeTrimmed = false;
  if (/^254[17]\d{8}$/.test(value)) {
    value = value.substring(3);
    countryCodeTrimmed = true;
  }

  var leadingZeroTrimmed = false;
  if (/^0[17]\d{8}$/.test(value)) {
    value = value.substring(1);
    leadingZeroTrimmed = true;
  }

  return {
    valid: /^[17]\d{8}$/.test(value),
    value: value,
    countryCodeTrimmed: countryCodeTrimmed,
    leadingZeroTrimmed: leadingZeroTrimmed
  };
}

function normalizeAndFilterPersonIds_(values, idColumnName, sourceLabel) {
  if (!values || !values.length) {
    return {
      values: values,
      removed: 0,
      countryCodeTrimmed: 0,
      leadingZeroTrimmed: 0
    };
  }

  var idIndex = findCaseInsensitiveHeaderIndex_(values[0], idColumnName);
  if (idIndex === -1) {
    throw new Error(
      sourceLabel +
      " is missing the '" +
      idColumnName +
      "' column required for ID validation."
    );
  }

  var output = [values[0]];
  var removed = 0;
  var countryCodeTrimmed = 0;
  var leadingZeroTrimmed = 0;

  for (var i = 1; i < values.length; i++) {
    var result = normalizeMenteeId_(values[i][idIndex]);

    if (!result.valid) {
      removed++;
      continue;
    }

    var row = values[i].slice();
    row[idIndex] = result.value;
    output.push(row);

    if (result.countryCodeTrimmed) countryCodeTrimmed++;
    if (result.leadingZeroTrimmed) leadingZeroTrimmed++;
  }

  return {
    values: output,
    removed: removed,
    countryCodeTrimmed: countryCodeTrimmed,
    leadingZeroTrimmed: leadingZeroTrimmed
  };
}

function normalizeSourceProgramValues_(values, requireProgramColumn) {
  var converted = 0;
  if (!values || values.length < 2) {
    return { values: values, converted: converted };
  }

  var programIndex = findCaseInsensitiveHeaderIndex_(values[0], "Program");

  if (programIndex === -1) {
    if (requireProgramColumn) {
      throw new Error("Source Mentee Database is missing a 'Program' column.");
    }
    return { values: values, converted: converted };
  }

  for (var i = 1; i < values.length; i++) {
    var raw = values[i][programIndex];
    var cleaned = String(raw == null ? "" : raw).trim();
    if (cleaned.toLowerCase() === "emonc curriculum") {
      values[i][programIndex] = "MENTORS Curriculum";
      converted++;
    }
  }

  return { values: values, converted: converted };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function testMenteeEligibleStatusSync() {
  var values = [
    ["Name", "Status", "Mentee ID", "Program"],
    ["Ann", "Eligible", "712345678", "EmONC Curriculum"],
    ["Ben", "Ineligible", "712345679", "MENTORS Curriculum"],
    ["Cara", "Active", "712345680", "Newborn Curriculum"],
    ["Dan", " eligible ", "0712345681", "Both"]
  ];

  var statusNormalize = normalizeEligibleStatusValues_(
    values,
    "Mentee Database 2026"
  );
  assert(statusNormalize.eligibleConverted === 2, "expected 2 Eligible→Active");
  assert(
    statusNormalize.ineligibleConverted === 1,
    "expected 1 Ineligible→Inactive"
  );
  assert(values[1][1] === "Active", "Eligible should become Active");
  assert(values[2][1] === "Inactive", "Ineligible should become Inactive");

  var statusFilter = filterInactiveRows_(values, "Mentee Database 2026");
  assert(statusFilter.removed === 1, "Ineligible→Inactive row should drop");
  assert(statusFilter.values.length === 4, "header + 3 active rows");

  var idFilter = normalizeAndFilterPersonIds_(
    statusFilter.values,
    "Mentee ID",
    "Mentee Database 2026"
  );
  assert(idFilter.leadingZeroTrimmed === 1, "leading zero trimmed once");
  assert(idFilter.values[3][2] === "712345681", "zero-stripped mentee id");

  var programNormalize = normalizeSourceProgramValues_(idFilter.values, true);
  assert(programNormalize.converted === 1, "EmONC Curriculum remapped once");
  assert(
    programNormalize.values[1][3] === "MENTORS Curriculum",
    "program remapped"
  );
}

function testIfmSyncWithoutEligibleRemap() {
  var values = [
    ["Name", "Status", "IFM ID", "Program"],
    ["Eve", "Eligible", "712345678", "EmONC Curriculum"],
    ["Fay", "Inactive", "712345679", "MENTORS Curriculum"],
    ["Gus", "Active", "254712345680", "Both"],
    ["Hal", "Active", "bad-id", "Both"]
  ];

  // IFM must NOT convert Eligible → Active.
  assert(values[1][1] === "Eligible", "Eligible left unchanged for IFM");

  var statusFilter = filterInactiveRows_(values, "Mentor (IFM) Database 2026");
  assert(statusFilter.removed === 1, "Inactive IFM dropped");
  // Eligible is not "inactive", so it stays (no mentee remap on IFM).
  assert(
    statusFilter.values.some(function (row) {
      return row[1] === "Eligible";
    }),
    "Eligible IFM row kept because IFM skips Eligible remap"
  );

  var idFilter = normalizeAndFilterPersonIds_(
    statusFilter.values,
    "IFM ID",
    "Mentor (IFM) Database 2026"
  );
  assert(idFilter.removed === 1, "invalid IFM ID dropped");
  assert(idFilter.countryCodeTrimmed === 1, "254 trimmed once");

  var programNormalize = normalizeSourceProgramValues_(idFilter.values, false);
  assert(programNormalize.converted === 1, "IFM EmONC program remapped");
}

function testProgramOptionalForIfm() {
  var values = [
    ["Name", "Status", "IFM ID"],
    ["Ivy", "Active", "712345678"]
  ];
  var result = normalizeSourceProgramValues_(values, false);
  assert(result.converted === 0, "missing Program is ok for IFM");
}

testMenteeEligibleStatusSync();
testIfmSyncWithoutEligibleRemap();
testProgramOptionalForIfm();
console.log("All sync status/validation tests passed.");
