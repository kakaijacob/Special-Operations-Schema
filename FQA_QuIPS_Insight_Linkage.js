/**
 * FQA ↔ QuIPS insight linkage runner (Google Apps Script)
 *
 * Required sources:
 *   - QuIPS Cleaned Data  (practice observations)
 *   - FQA Scores          (facility_code join + readiness scores)
 *
 * Optional detail:
 *   - Inpatient Maternity / Facility General / Newborn Unit
 *     Used only to enrich enabler text with categorical responses.
 *     When present, categorical values override scores for that attribute.
 *
 * Writes:
 *   - FQA-QuIPS Crosswalk
 *   - FQA-QuIPS Facility Insights
 *   - FQA-QuIPS Insight Summary
 *
 * Join key: facility_code
 *
 * Depends on FQA_QuIPS_Insight_Crosswalk.js
 * Run: writeFqaQuipsInsightLinkage()
 */

var FQA_INSIGHT_DEPARTMENT_SHEETS = [
  'Inpatient Maternity',
  'Facility General',
  'Newborn Unit',
];

/**
 * Main entry point.
 */
function writeFqaQuipsInsightLinkage() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  writeInsightCrosswalkSheet_(ss);
  var insightRows = buildAllFacilityThemeInsights_(ss);
  writeInsightFacilitySheet_(ss, insightRows);
  writeInsightSummarySheet_(ss, insightRows);

  Logger.log(
    'FQA-QuIPS insight linkage complete: ' +
      insightRows.length +
      ' facility×theme row(s).'
  );
}

/**
 * Catalog of QuIPS indicators linked to FQA enablers.
 */
function writeInsightCrosswalkSheet_(ss) {
  var rows = buildCrosswalkCatalogRows_();
  var headers = [
    'theme_id',
    'theme_name',
    'insight_question',
    'quips_section',
    'quips_fields',
    'fqa_department',
    'fqa_thematic_area',
    'fqa_attribute',
    'fqa_attribute_label',
    'readiness_kind',
  ];
  overwriteSheetWithObjects_(ss, FQA_QUIPS_CROSSWALK_SHEET, headers, rows);
}

/**
 * Facility × theme insight table.
 */
function writeInsightFacilitySheet_(ss, insightRows) {
  var headers = [
    'county',
    'facility_code',
    'facility',
    'theme_id',
    'theme_name',
    'insight_question',
    'quips_observations',
    'quips_scored_responses',
    'quips_practice_rate',
    'quips_practice_level',
    'fqa_readiness_level',
    'fqa_ready_count',
    'fqa_partial_count',
    'fqa_not_ready_count',
    'fqa_unknown_count',
    'insight_quadrant',
    'fqa_ready_enablers',
    'fqa_gap_enablers',
  ];
  overwriteSheetWithObjects_(
    ss,
    FQA_QUIPS_FACILITY_INSIGHTS_SHEET,
    headers,
    insightRows
  );
}

/**
 * Theme-level summary of insight quadrants.
 */
function writeInsightSummarySheet_(ss, insightRows) {
  var byTheme = {};

  (insightRows || []).forEach(function (row) {
    var id = row.theme_id;
    if (!byTheme[id]) {
      byTheme[id] = {
        theme_id: id,
        theme_name: row.theme_name,
        insight_question: row.insight_question,
        facilities: 0,
        enabled_and_practiced: 0,
        practice_gap: 0,
        adaptive_practice: 0,
        structural_gap: 0,
        mixed_or_insufficient: 0,
      };
    }

    var bucket = byTheme[id];
    bucket.facilities += 1;

    var q = String(row.insight_quadrant || '');
    if (q.indexOf('Enabled') !== -1) {
      bucket.enabled_and_practiced += 1;
    } else if (q.indexOf('Practice gap') !== -1) {
      bucket.practice_gap += 1;
    } else if (q.indexOf('Adaptive') !== -1) {
      bucket.adaptive_practice += 1;
    } else if (q.indexOf('Structural') !== -1) {
      bucket.structural_gap += 1;
    } else {
      bucket.mixed_or_insufficient += 1;
    }
  });

  var rows = Object.keys(byTheme)
    .sort()
    .map(function (id) {
      return byTheme[id];
    });

  var headers = [
    'theme_id',
    'theme_name',
    'insight_question',
    'facilities',
    'enabled_and_practiced',
    'practice_gap',
    'adaptive_practice',
    'structural_gap',
    'mixed_or_insufficient',
  ];
  overwriteSheetWithObjects_(ss, FQA_QUIPS_INSIGHT_SUMMARY_SHEET, headers, rows);
}

/**
 * Build facility × theme insights from QuIPS + FQA Scores (+ optional tabs).
 */
function buildAllFacilityThemeInsights_(ss) {
  var quipsByFacility = loadQuipsObservationsByFacility_(ss);
  var fqaBundle = loadFqaInsightInputsByFacility_(ss);
  var fqaByFacility = fqaBundle.values;
  var fqaMetaByFacility = fqaBundle.meta;

  var facilityCodes = {};
  Object.keys(quipsByFacility).forEach(function (code) {
    facilityCodes[code] = true;
  });
  Object.keys(fqaByFacility).forEach(function (code) {
    facilityCodes[code] = true;
  });

  var insights = [];
  Object.keys(facilityCodes)
    .sort()
    .forEach(function (code) {
      var quipsBundle = quipsByFacility[code] || {
        meta: { facility_code: code, facility: '', county: '' },
        rows: [],
      };
      var fqaMeta = fqaMetaByFacility[code] || {};
      // Prefer FQA Scores facility identity for linkage details.
      var meta = {
        facility_code: code,
        facility:
          fqaMeta.facility ||
          quipsBundle.meta.facility ||
          '',
        county:
          fqaMeta.county ||
          quipsBundle.meta.county ||
          '',
      };
      var fqaValues = fqaByFacility[code] || {};

      FQA_QUIPS_INSIGHT_THEMES.forEach(function (theme) {
        insights.push(
          buildFacilityThemeInsight_(
            meta,
            theme,
            quipsBundle.rows,
            fqaValues
          )
        );
      });
    });

  return insights;
}

/**
 * Resolve QuIPS Cleaned Data sheet.
 * Prefer a local tab; otherwise open the external QuIPS workbook by ID/gid.
 */
function resolveQuipsCleanedSheet_(activeSs) {
  var local = activeSs.getSheetByName(QUIPS_CLEANED_SHEET_NAME);
  if (local) return local;

  try {
    var remoteSs = SpreadsheetApp.openById(QUIPS_CLEANED_SPREADSHEET_ID);
    if (typeof sheetByGid_ === 'function') {
      return sheetByGid_(remoteSs, QUIPS_CLEANED_SHEET_GID);
    }
    var sheets = remoteSs.getSheets();
    for (var i = 0; i < sheets.length; i++) {
      if (String(sheets[i].getSheetId()) === String(QUIPS_CLEANED_SHEET_GID)) {
        return sheets[i];
      }
    }
    var byName = remoteSs.getSheetByName(QUIPS_CLEANED_SHEET_NAME);
    return byName || sheets[0] || null;
  } catch (err) {
    Logger.log(
      'Unable to open QuIPS cleaned workbook ' +
        QUIPS_CLEANED_SPREADSHEET_ID +
        ': ' +
        err.message
    );
    return null;
  }
}

/**
 * QuIPS cleaned rows grouped by facility_code.
 */
function loadQuipsObservationsByFacility_(ss) {
  var sheet = resolveQuipsCleanedSheet_(ss);
  if (!sheet) {
    Logger.log(
      'QuIPS cleaned data not found locally or in spreadsheet ' +
        QUIPS_CLEANED_SPREADSHEET_ID +
        ' (gid ' +
        QUIPS_CLEANED_SHEET_GID +
        '). Facility insights will use FQA-only facilities where available.'
    );
    return {};
  }

  Logger.log(
    'Reading QuIPS cleaned data from "' +
      sheet.getParent().getName() +
      '" / "' +
      sheet.getName() +
      '".'
  );

  var objects = sheetToObjects_(sheet);
  var byFacility = {};

  objects.forEach(function (row) {
    var code = String(row.facility_code || '').trim();
    if (!code) return;

    if (!byFacility[code]) {
      byFacility[code] = {
        meta: {
          facility_code: code,
          facility: row.facility || '',
          county: row.county || '',
        },
        rows: [],
      };
    }

    if (!byFacility[code].meta.facility && row.facility) {
      byFacility[code].meta.facility = row.facility;
    }
    if (!byFacility[code].meta.county && row.county) {
      byFacility[code].meta.county = row.county;
    }
    byFacility[code].rows.push(row);
  });

  return byFacility;
}

/**
 * Load FQA insight inputs by facility_code.
 *
 * Primary: FQA Scores (facility identity + numeric readiness).
 * Optional: department tabs overlay categorical detail when present.
 *
 * Returns { values, meta } where values[code]["Department::attribute"] = value.
 */
function loadFqaInsightInputsByFacility_(ss) {
  var needed = collectNeededFqaAttributes_();
  var valuesByFacility = {};
  var metaByFacility = {};

  loadFqaScoresIntoInsightInputs_(ss, needed, valuesByFacility, metaByFacility);
  overlayFqaDepartmentDetail_(ss, needed, valuesByFacility);

  return { values: valuesByFacility, meta: metaByFacility };
}

/**
 * Primary path: read FQA Scores long rows into Department::attribute values.
 */
function loadFqaScoresIntoInsightInputs_(
  ss,
  needed,
  valuesByFacility,
  metaByFacility
) {
  var sheetName =
    typeof FQA_SCORE_SHEET_NAME !== 'undefined'
      ? FQA_SCORE_SHEET_NAME
      : FQA_INSIGHT_SCORE_SHEET_NAME;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log(
      'FQA Scores sheet "' +
        sheetName +
        '" not found. Insight linkage needs FQA Scores as the primary join source.'
    );
    return;
  }

  var objects = sheetToObjects_(sheet);
  objects.forEach(function (row) {
    var code = String(row.facility_code || '').trim();
    if (!code) return;

    if (!metaByFacility[code]) {
      metaByFacility[code] = {
        facility_code: code,
        facility: row.facility || '',
        county: row.county || '',
      };
    } else {
      if (!metaByFacility[code].facility && row.facility) {
        metaByFacility[code].facility = row.facility;
      }
      if (!metaByFacility[code].county && row.county) {
        metaByFacility[code].county = row.county;
      }
    }

    var department = String(row.department || '').trim();
    var attribute = String(row.attribute || '').trim();
    if (!department || !attribute) return;

    var neededAttrs = needed[department];
    if (!neededAttrs || neededAttrs.indexOf(attribute) === -1) return;

    if (!valuesByFacility[code]) valuesByFacility[code] = {};
    var key = department + '::' + attribute;
    // Keep the last non-empty score for the attribute.
    if (row.score !== '' && row.score !== null && row.score !== undefined) {
      valuesByFacility[code][key] = row.score;
    }
  });
}

/**
 * Optional path: overlay department-tab categorical responses when available.
 * Categorical detail replaces the numeric score for that attribute.
 */
function overlayFqaDepartmentDetail_(ss, needed, valuesByFacility) {
  FQA_INSIGHT_DEPARTMENT_SHEETS.forEach(function (department) {
    var sheet = ss.getSheetByName(department);
    if (!sheet) {
      Logger.log(
        'Optional FQA department sheet "' +
          department +
          '" not found; continuing with FQA Scores only for that department.'
      );
      return;
    }

    var objects = sheetToObjects_(sheet);
    var attrs = needed[department] || [];
    if (!attrs.length) return;

    var latestByCode = {};
    objects.forEach(function (row) {
      var code = String(row.facility_code || '').trim();
      if (!code) return;
      latestByCode[code] = row;
    });

    Object.keys(latestByCode).forEach(function (code) {
      if (!valuesByFacility[code]) valuesByFacility[code] = {};
      var row = latestByCode[code];
      attrs.forEach(function (attribute) {
        var key = department + '::' + attribute;
        if (
          row[attribute] !== undefined &&
          row[attribute] !== null &&
          row[attribute] !== ''
        ) {
          valuesByFacility[code][key] = row[attribute];
        }
      });
    });
  });
}

/**
 * Unique FQA attributes required by the crosswalk, by department.
 */
function collectNeededFqaAttributes_() {
  var needed = {};
  FQA_QUIPS_INSIGHT_THEMES.forEach(function (theme) {
    (theme.fqa_enablers || []).forEach(function (enabler) {
      if (!needed[enabler.department]) needed[enabler.department] = {};
      needed[enabler.department][enabler.attribute] = true;
    });
  });
  Object.keys(needed).forEach(function (dept) {
    needed[dept] = Object.keys(needed[dept]).sort();
  });
  return needed;
}

/**
 * Sheet → array of objects using header row.
 */
function sheetToObjects_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return [];

  var headers = values[0].map(function (h) {
    return String(h || '').trim();
  });
  var rows = [];

  for (var r = 1; r < values.length; r++) {
    var obj = {};
    var empty = true;
    for (var c = 0; c < headers.length; c++) {
      if (!headers[c]) continue;
      var val = values[r][c];
      if (val !== '' && val !== null && val !== undefined) empty = false;
      obj[headers[c]] = val;
    }
    if (!empty) rows.push(obj);
  }
  return rows;
}

/**
 * Replace a sheet with header + object rows.
 */
function overwriteSheetWithObjects_(ss, sheetName, headers, objects) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  sheet.clearContents();

  if (!headers || !headers.length) return sheet;

  var rows = [headers];
  (objects || []).forEach(function (obj) {
    rows.push(
      headers.map(function (h) {
        var v = obj[h];
        return v === null || v === undefined ? '' : v;
      })
    );
  });

  sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
  sheet.setFrozenRows(1);
  return sheet;
}
