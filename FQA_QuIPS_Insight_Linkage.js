/**
 * FQA ↔ QuIPS insight linkage runner (Google Apps Script)
 *
 * Reads:
 *   - QuIPS Cleaned Data (from QuIPS_data_transformation.md)
 *   - FQA department tabs (Inpatient Maternity, Facility General, Newborn Unit)
 *
 * Writes:
 *   - FQA-QuIPS Crosswalk          (theme ↔ indicator catalog)
 *   - FQA-QuIPS Facility Insights  (facility × theme quadrants)
 *   - FQA-QuIPS Insight Summary    (theme-level quadrant counts)
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
 * Build facility × theme insights from QuIPS + FQA sheets.
 */
function buildAllFacilityThemeInsights_(ss) {
  var quipsByFacility = loadQuipsObservationsByFacility_(ss);
  var fqaByFacility = loadFqaEnablersByFacility_(ss);

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
      var fqaValues = fqaByFacility[code] || {};

      FQA_QUIPS_INSIGHT_THEMES.forEach(function (theme) {
        insights.push(
          buildFacilityThemeInsight_(
            quipsBundle.meta,
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
 * QuIPS cleaned rows grouped by facility_code.
 */
function loadQuipsObservationsByFacility_(ss) {
  var sheet = ss.getSheetByName(QUIPS_CLEANED_SHEET_NAME);
  if (!sheet) {
    Logger.log(
      'QuIPS sheet "' +
        QUIPS_CLEANED_SHEET_NAME +
        '" not found. Facility insights will use FQA-only facilities where available.'
    );
    return {};
  }

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
 * Latest FQA department-row values keyed as "Department::attribute".
 */
function loadFqaEnablersByFacility_(ss) {
  var needed = collectNeededFqaAttributes_();
  var byFacility = {};

  FQA_INSIGHT_DEPARTMENT_SHEETS.forEach(function (department) {
    var sheet = ss.getSheetByName(department);
    if (!sheet) {
      Logger.log('FQA department sheet "' + department + '" not found.');
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
      if (!byFacility[code]) byFacility[code] = {};
      var row = latestByCode[code];
      attrs.forEach(function (attribute) {
        var key = department + '::' + attribute;
        if (row[attribute] !== undefined && row[attribute] !== null) {
          byFacility[code][key] = row[attribute];
        }
      });
    });
  });

  return byFacility;
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
