/**
 * FQA Scores sheet.
 *
 * Long-format totalling table: one row per facility / department /
 * scored attribute, using scores from the FQA Weighting sheet.
 * thematic_area is blank until the groupings are provided.
 *
 * Run writeFqaScoreTable after the department tabs and FQA Weighting
 * exist. pullAllForms / fullRefreshAllForms do this automatically.
 */

const FQA_SCORE_SHEET_NAME = 'FQA Scores';
const FQA_SCORE_HEADERS = [
  'county',
  'facility',
  'facility_level',
  'department',
  'thematic_area',
  'attribute',
  'score',
];

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
  const idx = headers.indexOf(name);
  return idx;
}

function cellAt_(row, idx) {
  if (idx < 0) return '';
  return isBlankScoreCell_(row[idx]) ? '' : row[idx];
}

function appendFqaScoreRowsFromSheetValues_(
  rows,
  department,
  values,
  lookup
) {
  if (!values || values.length < 2) return;
  const headers = values[0].map(function (header) {
    return String(header);
  });
  const countyIdx = headerIndex_(headers, 'county');
  const facilityIdx = headerIndex_(headers, 'facility');
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
    const county = cellAt_(row, countyIdx);
    const facility = cellAt_(row, facilityIdx);
    const level = cellAt_(row, levelIdx);
    scoredCols.forEach(function (col) {
      const matched = lookupScoredAttribute_(
        lookup,
        department,
        col.attribute,
        row[col.idx]
      );
      if (!matched) return;
      rows.push([
        county,
        facility,
        level,
        department,
        thematicAreaFor_(department, col.attribute),
        col.attribute,
        matched.score,
      ]);
    });
  }
}

function buildFqaScoreTableRows_(departmentSheets, weightingValues) {
  const lookup = buildFqaWeightingScoreLookupFromValues_(weightingValues);
  const rows = [];
  (departmentSheets || []).forEach(function (entry) {
    appendFqaScoreRowsFromSheetValues_(
      rows,
      entry.department,
      entry.values,
      lookup
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
  const rows = buildFqaScoreTableRows_(
    collectDepartmentSheetValues_(ss),
    loadFqaWeightingValues_(ss)
  );
  let sheet = ss.getSheetByName(FQA_SCORE_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(FQA_SCORE_SHEET_NAME);
  writeFqaScoreRowsToSheet_(sheet, rows);
  Logger.log(
    'Wrote ' + rows.length + ' score rows to "' +
    FQA_SCORE_SHEET_NAME + '"'
  );
}
