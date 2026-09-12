/**
 * FQA Scores sheet.
 *
 * Long-format totalling table: one row per facility / department /
 * scored attribute, using scores from the FQA Weighting sheet.
 * Missing facility_code and subcounty are filled from the facility
 * master spreadsheet when county + facility + level match closely.
 * thematic_area is blank until the groupings are provided.
 *
 * Run writeFqaScoreTable after the department tabs exist. It reads
 * scores from the FQA Weighting sheet when that sheet is present.
 * pullAllForms / fullRefreshAllForms refresh this table only.
 */

const FQA_SCORE_SHEET_NAME = 'FQA Scores';
const FQA_SCORE_HEADERS = [
  'county',
  'subcounty',
  'facility',
  'facility_code',
  'facility_level',
  'department',
  'thematic_area',
  'attribute',
  'score',
];

const FQA_FACILITY_REFERENCE_SPREADSHEET_ID =
  '1EEZJU-DNERkydsMIDtCu-19hzopurtAR7cN5cZ6bvFI';
const FQA_FACILITY_REFERENCE_SHEET_GID = 0;
const FQA_FACILITY_MATCH_MIN = 0.86;
const FQA_FACILITY_MATCH_UNIQUE_NAME_MIN = 0.95;

/**
 * Attribute → thematic area, by department sheet name.
 * Leave entries empty until the groupings are defined.
 */
const FQA_THEMATIC_AREA_MAP = {
  'Newborn Unit': {},
  'Inpatient Maternity': {},
  'Outpatient': {},
  'Lab': {},
  'Operating Theatre': {},
  'Pharmacy': {},
  'Central Store': {},
  'Facility General': {},
};

function thematicAreaFor_(department, attribute) {
  const byDept = FQA_THEMATIC_AREA_MAP[department];
  if (!byDept) return '';
  const area = byDept[attribute];
  return area == null || area === '' ? '' : area;
}

function isBlankScoreCell_(value) {
  return value === '' || value === undefined || value === null;
}

function normalizeHeaderKey_(name) {
  return String(name == null ? '' : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function normalizeMatchText_(value) {
  return String(value == null ? '' : value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/sub[-\s]*county/g, 'subcounty')
    .replace(/health\s+center/g, 'health centre')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countyKey_(value) {
  return normalizeMatchText_(value)
    .replace(/\bcounty\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function facilityLevelKey_(value) {
  const text = String(value == null ? '' : value).toLowerCase();
  const labeled = text.match(/level\s*([2-6])/);
  if (labeled) return labeled[1];
  const bare = text.match(/\b([2-6])\b/);
  return bare ? bare[1] : '';
}

function facilityTokens_(value) {
  const stop = { the: true, of: true, and: true, at: true };
  return normalizeMatchText_(value).split(' ').filter(function (token) {
    return token && !stop[token];
  });
}

function distinctiveFacilityTokens_(value) {
  const generic = {
    hospital: true,
    referral: true,
    teaching: true,
    county: true,
    subcounty: true,
    health: true,
    centre: true,
    center: true,
    dispensary: true,
    clinic: true,
    medical: true,
    mission: true,
    district: true,
    level: true,
    model: true,
    maternity: true,
  };
  return facilityTokens_(value).filter(function (token) {
    return !generic[token] && !/^[0-9]+$/.test(token);
  });
}

function tokenJaccard_(leftTokens, rightTokens) {
  if (!leftTokens.length || !rightTokens.length) return 0;
  const counts = {};
  rightTokens.forEach(function (token) {
    counts[token] = (counts[token] || 0) + 1;
  });
  let inter = 0;
  leftTokens.forEach(function (token) {
    if (counts[token]) {
      inter += 1;
      counts[token] -= 1;
    }
  });
  return inter / (leftTokens.length + rightTokens.length - inter);
}

function sharesFacilityTypeToken_(left, right) {
  const types = {
    hospital: true,
    dispensary: true,
    clinic: true,
    centre: true,
    center: true,
  };
  const rightSet = {};
  facilityTokens_(right).forEach(function (token) {
    rightSet[token] = true;
  });
  return facilityTokens_(left).some(function (token) {
    return types[token] && rightSet[token];
  });
}

function facilityNameSimilarity_(left, right) {
  const a = normalizeMatchText_(left);
  const b = normalizeMatchText_(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const jaccard = tokenJaccard_(facilityTokens_(left), facilityTokens_(right));
  const distinctiveLeft = distinctiveFacilityTokens_(left);
  const distinctiveRight = distinctiveFacilityTokens_(right);
  let distinctive = 0;
  if (distinctiveLeft.length && distinctiveRight.length) {
    if (distinctiveLeft.join(' ') === distinctiveRight.join(' ')) {
      if (jaccard >= 0.45 || sharesFacilityTypeToken_(left, right)) {
        distinctive = 0.92;
      }
    } else {
      distinctive = tokenJaccard_(distinctiveLeft, distinctiveRight);
    }
  }
  let score = Math.max(jaccard, distinctive);
  if (
    (a.indexOf(b) !== -1 || b.indexOf(a) !== -1) &&
    distinctiveLeft.length &&
    distinctiveRight.length
  ) {
    score = Math.max(score, 0.9);
  }
  return score;
}

function detectFacilityReferenceColumns_(headers) {
  const normalized = (headers || []).map(normalizeHeaderKey_);
  function find(aliases) {
    for (let i = 0; i < aliases.length; i++) {
      const idx = normalized.indexOf(aliases[i]);
      if (idx !== -1) return idx;
    }
    return -1;
  }
  return {
    county: find(['county']),
    subcounty: find(['subcounty', 'sub_county', 'sub_county_name']),
    facility: find(['facility_name', 'facility', 'name']),
    facility_code: find([
      'dhis_code',
      'facility_code',
      'mfl_code',
      'mfl',
      'code',
    ]),
    facility_level: find([
      'facility_level',
      'keph_level',
      'level',
    ]),
  };
}

function parseFacilityReferenceRows_(values) {
  const rows = [];
  if (!values || values.length < 2) return rows;
  const cols = detectFacilityReferenceColumns_(values[0]);
  if (cols.facility < 0) return rows;
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row) continue;
    const facility = cellAt_(row, cols.facility);
    if (isBlankScoreCell_(facility)) continue;
    rows.push({
      county: cellAt_(row, cols.county),
      subcounty: cellAt_(row, cols.subcounty),
      facility: facility,
      facility_code: cellAt_(row, cols.facility_code),
      facility_level: cellAt_(row, cols.facility_level),
    });
  }
  return rows;
}

function isHighFacilityMatch_(query, candidate, similarity) {
  if (similarity < FQA_FACILITY_MATCH_MIN) return false;
  const qCounty = countyKey_(query.county);
  const cCounty = countyKey_(candidate.county);
  if (qCounty && cCounty && qCounty !== cCounty) return false;
  const qLevel = facilityLevelKey_(query.facility_level);
  const cLevel = facilityLevelKey_(candidate.facility_level);
  if (qLevel && cLevel && qLevel !== cLevel) return false;
  if (!qCounty || !cCounty) return similarity >= FQA_FACILITY_MATCH_UNIQUE_NAME_MIN;
  return true;
}

function findBestFacilityReference_(query, referenceRows) {
  if (!query || isBlankScoreCell_(query.facility) || !referenceRows) {
    return null;
  }
  const matches = [];
  referenceRows.forEach(function (candidate) {
    const similarity = facilityNameSimilarity_(query.facility, candidate.facility);
    if (!isHighFacilityMatch_(query, candidate, similarity)) return;
    matches.push({
      candidate: candidate,
      similarity: similarity,
    });
  });
  if (!matches.length) return null;
  matches.sort(function (a, b) {
    return b.similarity - a.similarity;
  });
  const best = matches[0];
  const bestCode = String(best.candidate.facility_code || '');
  const bestSubcounty = String(best.candidate.subcounty || '');
  for (let i = 1; i < matches.length; i++) {
    const other = matches[i];
    if (other.similarity < best.similarity - 0.02) continue;
    const otherCode = String(other.candidate.facility_code || '');
    const otherSubcounty = String(other.candidate.subcounty || '');
    if (otherCode !== bestCode || otherSubcounty !== bestSubcounty) {
      return null;
    }
  }
  return best.candidate;
}

function enrichFacilityIdentity_(identity, referenceRows, cache) {
  const next = {
    county: identity.county,
    subcounty: identity.subcounty,
    facility: identity.facility,
    facility_code: identity.facility_code,
    facility_level: identity.facility_level,
  };
  const needsCode = isBlankScoreCell_(next.facility_code);
  const needsSubcounty = isBlankScoreCell_(next.subcounty);
  if (!needsCode && !needsSubcounty) return next;
  if (isBlankScoreCell_(next.facility)) return next;
  const key =
    countyKey_(next.county) + '\t' +
    normalizeMatchText_(next.facility) + '\t' +
    facilityLevelKey_(next.facility_level);
  let match = null;
  if (cache && Object.prototype.hasOwnProperty.call(cache, key)) {
    match = cache[key];
  } else {
    match = findBestFacilityReference_(next, referenceRows);
    if (cache) cache[key] = match;
  }
  if (!match) return next;
  if (needsCode && !isBlankScoreCell_(match.facility_code)) {
    next.facility_code = match.facility_code;
  }
  if (needsSubcounty && !isBlankScoreCell_(match.subcounty)) {
    next.subcounty = match.subcounty;
  }
  return next;
}

function buildFqaWeightingScoreLookupFromValues_(values) {
  const lookup = {};
  if (!values || values.length < 2) return lookup;
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row || row.length < 5) continue;
    const department = String(row[0]);
    const variable = String(row[1]);
    const response = row[2];
    const label = row[3];
    const score = row[4];
    if (!lookup[department]) lookup[department] = {};
    if (!lookup[department][variable]) {
      lookup[department][variable] = { byLabel: {}, byResponse: {} };
    }
    const entry = lookup[department][variable];
    if (!isBlankScoreCell_(label)) {
      entry.byLabel[String(label)] = score;
    }
    if (!isBlankScoreCell_(response)) {
      entry.byResponse[String(response)] = score;
    }
  }
  return lookup;
}

function lookupScoredAttribute_(lookup, department, attribute, cellValue) {
  const byDept = lookup[department];
  const entry = byDept && byDept[attribute];
  if (!entry) return null;
  if (isBlankScoreCell_(cellValue)) return null;
  const asString = String(cellValue);
  if (Object.prototype.hasOwnProperty.call(entry.byLabel, asString)) {
    return { score: entry.byLabel[asString] };
  }
  if (Object.prototype.hasOwnProperty.call(entry.byResponse, asString)) {
    return { score: entry.byResponse[asString] };
  }
  return null;
}

function headerIndex_(headers, name) {
  return headers.indexOf(name);
}

function cellAt_(row, idx) {
  if (idx < 0) return '';
  return isBlankScoreCell_(row[idx]) ? '' : row[idx];
}

function appendFqaScoreRowsFromSheetValues_(
  rows,
  department,
  values,
  lookup,
  referenceRows,
  matchCache
) {
  if (!values || values.length < 2) return;
  const headers = values[0].map(function (header) {
    return String(header);
  });
  const countyIdx = headerIndex_(headers, 'county');
  const subcountyIdx = headerIndex_(headers, 'subcounty');
  const facilityIdx = headerIndex_(headers, 'facility');
  const facilityCodeIdx = headerIndex_(headers, 'facility_code');
  const levelIdx = headerIndex_(headers, 'facility_level');
  const scoredCols = [];
  headers.forEach(function (header, idx) {
    if (lookup[department] && lookup[department][header]) {
      scoredCols.push({ attribute: header, idx: idx });
    }
  });
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    if (!row) continue;
    const identity = enrichFacilityIdentity_({
      county: cellAt_(row, countyIdx),
      subcounty: cellAt_(row, subcountyIdx),
      facility: cellAt_(row, facilityIdx),
      facility_code: cellAt_(row, facilityCodeIdx),
      facility_level: cellAt_(row, levelIdx),
    }, referenceRows, matchCache);
    scoredCols.forEach(function (col) {
      const matched = lookupScoredAttribute_(
        lookup,
        department,
        col.attribute,
        row[col.idx]
      );
      if (!matched) return;
      rows.push([
        identity.county,
        identity.subcounty,
        identity.facility,
        identity.facility_code,
        identity.facility_level,
        department,
        thematicAreaFor_(department, col.attribute),
        col.attribute,
        matched.score,
      ]);
    });
  }
}

function buildFqaScoreTableRows_(
  departmentSheets,
  weightingValues,
  facilityReferenceValues
) {
  const lookup = buildFqaWeightingScoreLookupFromValues_(weightingValues);
  const referenceRows = parseFacilityReferenceRows_(facilityReferenceValues);
  const matchCache = {};
  const rows = [];
  (departmentSheets || []).forEach(function (entry) {
    appendFqaScoreRowsFromSheetValues_(
      rows,
      entry.department,
      entry.values,
      lookup,
      referenceRows,
      matchCache
    );
  });
  return rows;
}

function loadFqaWeightingValues_(ss) {
  const sheet = ss.getSheetByName(FQA_WEIGHTING_SHEET_NAME);
  if (sheet && sheet.getLastRow() > 1 && sheet.getLastColumn() > 0) {
    return sheet.getRange(1, 1, sheet.getLastRow(), 5).getValues();
  }
  return [FQA_WEIGHTING_HEADERS].concat(buildFqaWeightingTableRows_({}));
}

function sheetByGid_(ss, gid) {
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    if (String(sheets[i].getSheetId()) === String(gid)) return sheets[i];
  }
  return sheets[0];
}

function loadFacilityReferenceValues_() {
  const ss = SpreadsheetApp.openById(FQA_FACILITY_REFERENCE_SPREADSHEET_ID);
  const sheet = sheetByGid_(ss, FQA_FACILITY_REFERENCE_SHEET_GID);
  if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() < 1) {
    return [];
  }
  return sheet.getRange(
    1,
    1,
    sheet.getLastRow(),
    sheet.getLastColumn()
  ).getValues();
}

function collectDepartmentSheetValues_(ss) {
  return FORM_CONFIG.map(function (form) {
    const sheet = ss.getSheetByName(form.sheetName);
    if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() < 1) {
      return { department: form.sheetName, values: [] };
    }
    return {
      department: form.sheetName,
      values: sheet.getRange(
        1,
        1,
        sheet.getLastRow(),
        sheet.getLastColumn()
      ).getValues(),
    };
  });
}

function writeFqaScoreRowsToSheet_(sheet, rows) {
  sheet.clearContents();
  ensureSheetCapacity_(sheet, rows.length + 1, FQA_SCORE_HEADERS.length);
  sheet.getRange(1, 1, 1, FQA_SCORE_HEADERS.length)
    .setValues([FQA_SCORE_HEADERS]);
  const CHUNK = 500;
  let offset = 0;
  while (offset < rows.length) {
    const slice = rows.slice(offset, offset + CHUNK);
    sheet.getRange(
      2 + offset,
      1,
      slice.length,
      FQA_SCORE_HEADERS.length
    ).setValues(slice);
    offset += slice.length;
  }
  sheet.setFrozenRows(1);
}

/**
 * Create or refresh the FQA Scores totalling sheet from the department
 * tabs and the FQA Weighting catalog.
 */
function writeFqaScoreTable() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let facilityReferenceValues = [];
  try {
    facilityReferenceValues = loadFacilityReferenceValues_();
  } catch (err) {
    Logger.log(
      'Could not read facility reference spreadsheet: ' +
      err.message +
      (err.stack ? '\n' + err.stack : '')
    );
  }
  const rows = buildFqaScoreTableRows_(
    collectDepartmentSheetValues_(ss),
    loadFqaWeightingValues_(ss),
    facilityReferenceValues
  );
  let sheet = ss.getSheetByName(FQA_SCORE_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(FQA_SCORE_SHEET_NAME);
  writeFqaScoreRowsToSheet_(sheet, rows);
  Logger.log(
    'Wrote ' + rows.length + ' score rows to "' +
    FQA_SCORE_SHEET_NAME + '"'
  );
}
