/**
 * QuIPS Analysis Export and Data Sharing
 * ------------------------------------------------------------------
 * Monthly share-out of the Matrix Scorecards dashboard.
 *
 * Each report month produces one Google spreadsheet per county, saved in
 * the shared Drive folder under a year subfolder (2026, 2027, ...):
 *
 *   QuIPS CQI Nakuru November 2026
 *
 * Each facility tab is named as the facility. Row 1 names the facility and
 * month. From row 2, each dashboard section is a titled matrix, with two
 * blank rows between matrices.
 *
 * Spreadsheets:
 *
 *   Index             how to read the file, who submitted, who did not
 *   All facilities    county roll-up
 *   <facility>        one tab per facility that submitted that month
 *
 * Every data tab stacks the dashboard sections from first to last:
 *   1.  Overview: all sections
 *   2.  Key QuIPS indicators
 *   3.  Birth Preparedness
 *   4.  Labor Care Guide
 *   5.  Partograph Review
 *   6.  Technical Quality After Birth
 *   7.  Maternal Vitals & Documentation
 *   8.  Postbirth Infection Prevention
 *   9.  Respectful Maternity Care
 *   10. Avoidance of Harmful Practices
 *   11. Harmful Practices (% with instance)
 *   12. EMOTIVE
 *   13. Uterotonic administered (% by type)
 *   14. Method of blood loss measurement (% by method)
 *
 * Scoring matches the Colab dashboard. "Score" and "Status" cover the last
 * 6 months, including the report month. The highlighted column is the
 * report month. Trend is that month versus the previous calendar month.
 * Cadre and complication stay on "All" (nothing ticked).
 *
 * Re-running a month updates the same files, so links keep working.
 *
 * Setup
 *   1. Create a Google Sheet. Extensions → Apps Script. Paste this file.
 *   2. Project Settings → Timezone → Africa/Nairobi.
 *   3. Reload the sheet. Menu: QuIPS Analysis Export →
 *      Create Config and Sharing sheets.
 *   4. DESTINATION_FOLDER_ID is the shared QuIPS folder. Files are created
 *      in a year subfolder inside it (2026, then 2027, and so on).
 *   5. Optional Sharing sheet — one person per row:
 *        Email | Role | Counties
 *        Role: reader, commenter, or writer.
 *        Counties blank = every county file. Otherwise comma-separated
 *        names as they appear in the data (Nakuru, Mombasa, Muranga).
 *      LINK_SHARING TRUE also lets anyone with the link view.
 *   6. Run "Run scoring self-check", then "Preview previous month",
 *      then "Export previous month" and authorise the script.
 *   7. "Install monthly trigger" checks every day at midnight and, on the
 *      last day of the month, exports that month plus the five before it.
 *      Set the project timezone to Africa/Nairobi first, so midnight is
 *      Nairobi midnight.
 *
 * A standalone script (no spreadsheet) can skip steps 3–5 and edit
 * QUIPS_EXPORT below, including SHARE_WITH.
 */

// =====================================================
// CONFIG (used when no Config sheet is available)
// =====================================================

var QUIPS_EXPORT = {
  DATA_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRPEUzmFeJeSDdQySj9OinUnelYoHGaWtVaU0UIaKJU0v4UZoGp3VSTnlroBkl6GDmW1YZ9w1y4bAIY/pub?gid=1114469965&single=true&output=csv',
  DESTINATION_FOLDER_ID: '1r0U51qVnj7aPGrDP5VxzxVVDMtWp8U-a',
  LINK_SHARING: false,
  TIMEZONE: 'Africa/Nairobi',
  WINDOW_MONTHS: 6,
  ROOT_FOLDER_NAME: 'QuIPS Analysis Export and Data Sharing',
  // { email: 'person@example.org', role: 'reader', counties: 'Nakuru, Mombasa' }
  SHARE_WITH: []
};

// =====================================================
// DASHBOARD RULES
// =====================================================

var INVALID_VALUES = {
  '': true,
  'Unable to observe': true,
  'Not applicable': true,
  'NA': true,
  'N/A': true,
  'Resuscitation required': true,
  'Not taken': true
};

// Exact phrases from the dashboard, after trim + lower case.
// "Weighing of bloodsoaked materials pads gauze drapes" does not match
// the third phrase, so the dashboard counts it as not objective.
var BLOOD_LOSS_VALID = {
  'measure with a calibrated jar': true,
  'v drape': true,
  'weighing of bloodsoaked materials': true
};

var FREQUENCY_COLS = {
  provider_explanations: true,
  spoken_to_directly: true,
  spoken_to_kindly: true
};

var INVERTED_COLS = {
  fundal_pressure: true,
  perineum_stretching: true,
  newborn_slapped: true,
  newborn_upside_down: true,
  partograph_accuracy_concern: true,
  lcg_accuracy_concerns: true
};

var CATEGORY_INVALID = {
  '': true,
  'unable to observe': true,
  'not applicable': true,
  'na': true,
  'n/a': true,
  'nan': true
};

var CADRE_MENTEE = 'enrolled jh mentee';

var MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

var BIRTH_PREPAREDNESS = [
  ['hand_hygiene', 'Hand Hygiene'],
  ['ppe_gloves', 'PPE Gloves'],
  ['ppe_mask', 'PPE Mask'],
  ['ppe_gown', 'PPE Gown'],
  ['ppe_boots', 'PPE Boots'],
  ['ppe_goggles', 'PPE Goggles'],
  ['ppe_cap', 'PPE Cap'],
  ['nnr_equipment_preparation', 'Preparation of NNR Equipment'],
  ['uterotonic_preparation', 'Uterotonic Preparation']
];

var LCG_INDICATORS = [
  ['lcg_initiated_correct', 'LCG initiated at correct time'],
  ['contractions_monitored_1st', 'Contractions recorded first stage'],
  ['fhr_monitored_1st', 'Foetal heart recorded first stage'],
  ['bp_monitored_recorded', 'Blood pressure correctly recorded'],
  ['contractions_monitored_2nd', 'Contractions recorded second stage'],
  ['fhr_monitored_2nd', 'Foetal heart recorded second stage'],
  ['delivery_time_documented', 'Delivery time correctly documented'],
  ['delivery_method_documented', 'Delivery method correctly documented'],
  ['ebl_documented_correctly', 'Blood loss correctly documented'],
  ['lcg_accuracy_concerns', 'No data accuracy concerns']
];

var PARTOGRAPH_INDICATORS = [
  ['partogragh_initiation', 'Partograph initiated at correct time'],
  ['partograph_half_hr', 'Contractions recorded every 30 minutes'],
  ['fetal_heart_correct', 'Foetal heart rate correctly recorded'],
  ['maternal_pulse_correct', 'Maternal pulse correctly recorded'],
  ['bp_4hrs', 'Blood pressure recorded every 4 hours'],
  ['partograph_summary_filled', 'Partograph completed after delivery'],
  ['delivery_method_filled', 'Delivery method correctly documented'],
  ['blood_loss_estimation', 'Estimated blood loss correctly recorded'],
  ['partograph_accuracy_concern', 'No data accuracy concerns']
];

var TQAB_INDICATORS = [
  ['ruleout_twin', 'Ruling out second twin'],
  ['uterotonic_administered', 'Uterotonic administration'],
  ['timely_uterotonic_administration', 'Timely administration of uterotonics'],
  ['drying_stimulation', 'Baby dried and stimulated'],
  ['discard_wet_towel', 'Wet towel discarded'],
  ['skin_to_skin', 'Skin-to-skin initiated'],
  ['adequate_skin_to_skin_time', 'Adequate skin-to-skin duration'],
  ['timely_cord_clamp', 'Timely cord clamping'],
  ['sterilized_blade_clamp', 'Use of sterilized blade for cord cut'],
  ['newborn_kept_warm', 'Newborn kept warm for resuscitation or stimulation'],
  ['controlled_cord_traction', 'Use of controlled cord traction placenta delivery'],
  ['placenta_examination', 'Placenta examination postbirth'],
  ['uterine_tone_assessed', 'Uterine tone assessed'],
  ['laceration_check', 'Birth canal checked for lacerations'],
  ['method_blood_loss', 'Objective method of estimating blood loss used'],
  ['proper_vdrape_use', 'V drape used appropriately'],
  ['maternal_bleeding_assessed', 'Maternal bleeding assessed'],
  ['administer_vitamin_k', 'Vitamin K administered'],
  ['timely_vitamink_administration', 'Timely administration of Vitamin K'],
  ['provider_initiate_breastfeeding', 'Breastfeeding initiated'],
  ['timely_breastfeeding_initiation', 'Timely initiation of breastfeeding'],
  ['take_mother_bp', 'Maternal blood pressure taken'],
  ['timely_mother_bp', 'Timely maternal blood pressure measurement'],
  ['take_mother_temperature', 'Maternal temperature taken'],
  ['timely_mother_temp', 'Timely maternal temperature measurement'],
  ['take_mother_pulse', 'Maternal pulse taken'],
  ['timely_mother_pulse', 'Timely maternal pulse measurement'],
  ['apgar_min1', 'Apgar score documented at 1 minute'],
  ['apgar_min5', 'Apgar score documented at 5 minutes']
];

var VITALS_INDICATORS = [
  ['take_mother_bp', 'Mother BP taken'],
  ['timely_mother_bp', 'Timely taking of mother BP'],
  ['take_mother_temperature', 'Mother temperature taken'],
  ['timely_mother_temp', 'Timely taking of mother temperature'],
  ['take_mother_pulse', 'Mother pulse taken'],
  ['timely_mother_pulse', 'Timely taking of mother pulse'],
  ['apgar_min1', 'APGAR score at 1 minute'],
  ['apgar_min5', 'APGAR score at 5 minutes']
];

var INFECTION_INDICATORS = [
  ['sharps_disposal', 'Sharps Disposal'],
  ['waste_disposal', 'Waste Disposal']
];

var RMC_INDICATORS = [
  ['birth_companion', 'Birth companion present'],
  ['provider_explanations', 'Provider explained process to mother clearly throughout'],
  ['spoken_to_directly', 'Provider spoke to the mother directly throughout'],
  ['spoken_to_kindly', 'Provider spoke to the mother kindly throughout'],
  ['rmc_no_disrespect_to_mother', 'Mother was treated with respect throughout']
];

var HARM_AVOIDANCE_INDICATORS = [
  ['fundal_pressure', 'No instance of fundal pressure'],
  ['perineum_stretching', 'No instance of perineum stretching'],
  ['newborn_slapped', 'No instance of newborn slapping'],
  ['newborn_upside_down', 'No instance of newborn being held upside down']
];

var HARM_RATE_INDICATORS = [
  ['fundal_pressure', '% deliveries with fundal pressure'],
  ['perineum_stretching', '% deliveries with perineum stretching'],
  ['newborn_slapped', '% deliveries with newborn slapping'],
  ['newborn_upside_down', '% deliveries with newborn held upside down']
];

var EMOTIVE_INDICATORS = [
  ['uterine_massage_initiated', 'Uterine massage initiated'],
  ['timely_uterine_massage', 'Timely uterine massage'],
  ['oxytocin_first_line', 'Oxytocin first-line administered'],
  ['timely_oxytocin_administration', 'Timely administration of oxytocin'],
  ['txa_administered', 'Tranexamic Acid (TXA) administered'],
  ['timely_txa_administration', 'Timely administration of TXA'],
  ['iv_access_fluids', 'IV access established'],
  ['timely_iv_establishment', 'Timely establishment of IV access']
];

var SECTION_MAPPING = [
  ['Birth Preparedness', colsOf_(BIRTH_PREPAREDNESS)],
  ['Technical Quality After Birth', colsOf_(TQAB_INDICATORS)],
  ['Postbirth Infection Prevention', colsOf_(INFECTION_INDICATORS)],
  ['Respectful Maternity Care', colsOf_(RMC_INDICATORS)],
  ['Avoidance Harmful Practices', colsOf_(HARM_AVOIDANCE_INDICATORS)],
  ['Partograph Review', colsOf_(PARTOGRAPH_INDICATORS)],
  ['Labor Care Guide Review', colsOf_(LCG_INDICATORS)],
  ['EMOTIVE', colsOf_(EMOTIVE_INDICATORS)]
];

var TQIFB_COLS = colsOf_(TQAB_INDICATORS).slice(0, 21);
var NEWBORN_ESSENTIAL_CARE_COLS = ['drying_stimulation', 'skin_to_skin', 'timely_cord_clamp', 'timely_breastfeeding_initiation'];
var TIMELY_VITALS_COLS = ['timely_mother_bp', 'timely_mother_temp', 'timely_mother_pulse'];

var QUIPS_SPECS = [
  { label: '% of deliveries by JH enrolled mentees', kind: 'mentee' },
  { label: '% of deliveries with Birth Preparedness Score of 100%', kind: 'threshold', cols: colsOf_(BIRTH_PREPAREDNESS), threshold: 100 },
  { label: '% of deliveries with Respectful Maternity Care (RMC) Score of 100%', kind: 'threshold', cols: colsOf_(RMC_INDICATORS), threshold: 100 },
  { label: '% of deliveries with Technical Quality Immediately Following Birth Score ≥ 90%', kind: 'threshold', cols: TQIFB_COLS, threshold: 90 },
  { label: '% of deliveries with Post-Birth Infection Prevention Score of 100%', kind: 'threshold', cols: colsOf_(INFECTION_INDICATORS), threshold: 100 },
  { label: '% of deliveries with Avoidance of Harmful Practices Score of 100%', kind: 'threshold', cols: colsOf_(HARM_AVOIDANCE_INDICATORS), threshold: 100 },
  { label: '% of deliveries using Labor Care Guide', kind: 'single', cols: ['lcg_initiated_correct'] },
  { label: 'Overall Intrapartum Quality of Care Score', kind: 'qoc' },
  { label: '% of live deliveries with all essential newborn care components', kind: 'all', cols: NEWBORN_ESSENTIAL_CARE_COLS },
  { label: '% of live deliveries with timely administration of Vitamin K', kind: 'single', cols: ['timely_vitamink_administration'] },
  { label: '% of live deliveries with timely administration of uterotonics', kind: 'single', cols: ['timely_uterotonic_administration'] },
  { label: '% of live deliveries with delayed cord clamping', kind: 'single', cols: ['timely_cord_clamp'] },
  { label: '% of deliveries with timely recording of vitals (BP, Temp, Pulse)', kind: 'all', cols: TIMELY_VITALS_COLS },
  { label: '% of live deliveries with timely initiation of breastfeeding', kind: 'single', cols: ['timely_breastfeeding_initiation'] }
];

// kind: sections | quips | indicators | category
// mode: good_high (default) | harm_rate | neutral
var SCORECARD_VIEWS = [
  { title: 'Overview: all sections', kind: 'sections', sort: true },
  { title: 'Key QuIPS indicators', kind: 'quips', sort: true },
  { title: 'Birth Preparedness', kind: 'indicators', indicators: BIRTH_PREPAREDNESS, sort: true },
  { title: 'Labor Care Guide', kind: 'indicators', indicators: LCG_INDICATORS },
  { title: 'Partograph Review', kind: 'indicators', indicators: PARTOGRAPH_INDICATORS },
  { title: 'Technical Quality After Birth', kind: 'indicators', indicators: TQAB_INDICATORS, sort: true },
  { title: 'Maternal Vitals & Documentation', kind: 'indicators', indicators: VITALS_INDICATORS, sort: true },
  { title: 'Postbirth Infection Prevention', kind: 'indicators', indicators: INFECTION_INDICATORS },
  { title: 'Respectful Maternity Care', kind: 'indicators', indicators: RMC_INDICATORS },
  { title: 'Avoidance of Harmful Practices', kind: 'indicators', indicators: HARM_AVOIDANCE_INDICATORS },
  { title: 'Harmful Practices (% with instance)', kind: 'indicators', indicators: HARM_RATE_INDICATORS, mode: 'harm_rate' },
  { title: 'EMOTIVE', kind: 'indicators', indicators: EMOTIVE_INDICATORS, sort: true },
  { title: 'Uterotonic administered (% by type)', kind: 'category', field: 'uterotonic_administered', rowLabel: 'Uterotonic', multi: false },
  { title: 'Method of blood loss measurement (% by method)', kind: 'category', field: 'method_blood_loss', rowLabel: 'Method of blood loss measurement', multi: false }
];

var SHEET_INDEX = 'Index';
var SHEET_ALL = 'All facilities';

// =====================================================
// MENU
// =====================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('QuIPS Analysis Export')
    .addItem('Export previous month', 'exportPreviousMonth')
    .addItem('Export current month to date', 'exportCurrentMonth')
    .addItem('Export a chosen month…', 'exportChosenMonth')
    .addSeparator()
    .addItem('Preview previous month (no files)', 'previewPreviousMonth')
    .addItem('Run scoring self-check', 'runScoringSelfCheck')
    .addSeparator()
    .addItem('Install monthly trigger (last day, midnight)', 'installMonthlyTrigger')
    .addItem('Remove monthly trigger', 'removeMonthlyTrigger')
    .addSeparator()
    .addItem('Create Config and Sharing sheets', 'createExportConfigSheets')
    .addToUi();
}

function exportPreviousMonth() {
  exportYearMonth_(previousMonthKey_(), false);
}

function exportCurrentMonth() {
  exportYearMonth_(currentMonthKey_(), false);
}

function exportChosenMonth() {
  var ui = SpreadsheetApp.getUi();
  var res = ui.prompt(
    'Export a month',
    'Enter the report month as YYYY-MM (for example 2026-10). The file for that month is created or updated.',
    ui.ButtonSet.OK_CANCEL
  );
  if (res.getSelectedButton() !== ui.Button.OK) return;
  var ym = String(res.getResponseText() || '').trim();
  if (!/^\d{4}-\d{2}$/.test(ym) || Number(ym.slice(5, 7)) < 1 || Number(ym.slice(5, 7)) > 12) {
    ui.alert('Enter a month as YYYY-MM, for example 2026-10.');
    return;
  }
  exportYearMonth_(ym, false);
}

function previewPreviousMonth() {
  exportYearMonth_(previousMonthKey_(), true);
}

function runScoringSelfCheck() {
  var errors = scoringSelfCheckErrors_();
  var message = errors.length
    ? 'Scoring self-check failed:\n\n' + errors.join('\n')
    : 'Scoring self-check passed. Indicator rules match the Matrix Scorecards dashboard.';
  alert_(message);
  if (errors.length) throw new Error(message);
}

function installMonthlyTrigger() {
  removeMonthlyTrigger();
  // Apps Script has no "last day of the month" clock. A daily midnight
  // trigger returns immediately except on that last day.
  ScriptApp.newTrigger('exportOnLastDay')
    .timeBased()
    .everyDays(1)
    .atHour(0)
    .nearMinute(0)
    .create();
  alert_('Monthly trigger installed.\n\nOn the last day of each month, at midnight in the project timezone, the script exports that month and the five months before it.\n\nSet Project Settings → Timezone to Africa/Nairobi before relying on the clock. If an older trigger was set for the 1st, it has been removed.');
}

function exportOnLastDay() {
  var tz = QUIPS_EXPORT.TIMEZONE || 'Africa/Nairobi';
  try {
    tz = loadConfig_().timezone || tz;
  } catch (ignore) {}
  var stamp = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  var year = Number(stamp.slice(0, 4));
  var month = Number(stamp.slice(5, 7));
  var day = Number(stamp.slice(8, 10));
  if (day !== lastDayOfMonth_(year, month)) return;
  exportYearMonth_(stamp.slice(0, 7), false);
}

function lastDayOfMonth_(year, month) {
  var days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  var leap = month === 2 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0);
  return leap ? 29 : days[month - 1];
}

function removeMonthlyTrigger() {
  var handlers = { exportOnLastDay: true, exportPreviousMonth: true };
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (handlers[triggers[i].getHandlerFunction()]) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

function createExportConfigSheets() {
  var ss = activeSpreadsheet_();
  if (!ss) {
    throw new Error('Open this script from a Google Sheet to create Config and Sharing, or edit QUIPS_EXPORT at the top of the file.');
  }
  writeConfigSheet_(ss);
  writeSharingSheet_(ss);
  alert_('Config and Sharing sheets are ready.\n\nSet DESTINATION_FOLDER_ID on Config (a Drive folder recipients can open). Add people on Sharing if you want the script to invite them to each county file.');
}

// =====================================================
// EXPORT RUN
// =====================================================

function exportYearMonth_(yearMonth, dryRun) {
  var errors = scoringSelfCheckErrors_();
  if (errors.length) {
    throw new Error('Scoring self-check failed, so nothing was exported.\n' + errors.join('\n'));
  }

  var loaded = fetchRecords_();
  var plan = buildExportPlan_(loaded.records, loaded.headers, yearMonth);
  var summary = describePlan_(plan, yearMonth);

  if (!plan.length) {
    alert_('No submissions in ' + monthLabel_(yearMonth) + '. No files created.\n\n' + summary);
    return;
  }
  if (dryRun) {
    alert_('Preview only. No files were created or changed.\n\n' + summary);
    return;
  }

  var cfg = loadConfig_();
  var root = rootFolder_(cfg);
  var yearFolder = getOrCreateFolder_(root, yearMonth.slice(0, 4));
  var generatedAt = Utilities.formatDate(new Date(), cfg.timezone, 'dd MMM yyyy HH:mm');
  var lines = [summary, ''];

  for (var i = 0; i < plan.length; i++) {
    var county = plan[i];
    try {
      var written = writeCountyFile_(yearFolder, county, yearMonth, generatedAt, cfg.dataUrl);
      shareFile_(written.file, county.countyKey, cfg);
      appendLog_(root, [
        generatedAt,
        yearMonth,
        county.countyLabel,
        written.action,
        county.facilities.length,
        county.thisMonth,
        written.url,
        ''
      ]);
      lines.push(county.countyLabel + ' (' + written.action + '): ' + written.url);
    } catch (err) {
      var message = err && err.message ? err.message : String(err);
      appendLog_(root, [generatedAt, yearMonth, county.countyLabel, 'failed', county.facilities.length, county.thisMonth, '', message]);
      lines.push(county.countyLabel + ' FAILED: ' + message);
    }
  }

  alert_(lines.join('\n'));
}

function describePlan_(plan, yearMonth) {
  if (!plan.length) {
    return 'Report month ' + monthLabel_(yearMonth) + ': no counties with submissions.';
  }
  var lines = ['Report month ' + monthLabel_(yearMonth) + ' — ' + plan.length + ' county file(s).'];
  for (var i = 0; i < plan.length; i++) {
    var county = plan[i];
    lines.push(
      '• ' + county.countyLabel + ': ' + county.thisMonth + ' deliveries, ' +
      county.facilities.length + ' facility tab(s)' +
      (county.silent.length ? ', ' + county.silent.length + ' with no submission this month' : '')
    );
  }
  return lines.join('\n');
}

// =====================================================
// DATA
// =====================================================

function parseCsv_(text) {
  if (text && text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  var rows = [];
  var row = [];
  var cell = '';
  var inQuotes = false;
  for (var i = 0; i < text.length; i++) {
    var ch = text.charAt(i);
    if (inQuotes) {
      if (ch === '"') {
        if (text.charAt(i + 1) === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ',') {
      row.push(cell);
      cell = '';
      continue;
    }
    if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }
    if (ch === '\r') continue;
    cell += ch;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  while (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
    rows.pop();
  }
  return rows;
}

function recordsFromMatrix_(matrix) {
  var headers = (matrix[0] || []).map(function (h) { return String(h == null ? '' : h).trim(); });
  var records = [];
  for (var r = 1; r < matrix.length; r++) {
    var src = matrix[r];
    var blank = true;
    for (var c = 0; c < src.length; c++) {
      if (src[c] != null && String(src[c]) !== '') { blank = false; break; }
    }
    if (blank) continue;
    var rec = {};
    for (var h = 0; h < headers.length; h++) {
      rec[headers[h]] = src[h] == null ? '' : String(src[h]);
    }
    var monthKey = monthKeyFromSubmitted_(rec.date_submitted);
    if (!monthKey) continue;
    rec.monthKey = monthKey;
    if (!rec._uuid) rec._uuid = 'row-' + r;
    rec.county = String(rec.county || '').trim();
    rec.facility = String(rec.facility || '').trim();
    records.push(rec);
  }
  return { headers: headers, records: records };
}

function monthKeyFromSubmitted_(value) {
  var match = String(value || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '';
  var month = Number(match[2]);
  if (month < 1 || month > 12) return '';
  return match[1] + '-' + match[2];
}

function monthLabel_(key) {
  var year = key.slice(0, 4);
  var month = Number(key.slice(5, 7));
  return MONTH_NAMES[month - 1] + ' ' + year;
}

function monthLabelLong_(key) {
  var full = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return full[Number(key.slice(5, 7)) - 1] + ' ' + key.slice(0, 4);
}

function prevMonthKey_(key) {
  var year = Number(key.slice(0, 4));
  var month = Number(key.slice(5, 7)) - 1;
  if (month === 0) {
    month = 12;
    year -= 1;
  }
  return year + '-' + (month < 10 ? '0' : '') + month;
}

function windowMonthKeys_(exportMonth) {
  var count = QUIPS_EXPORT.WINDOW_MONTHS || 6;
  var keys = [];
  var key = exportMonth;
  for (var i = 0; i < count; i++) {
    keys.push(key);
    key = prevMonthKey_(key);
  }
  keys.reverse();
  return keys;
}

function formatSubmitted_(value) {
  var match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '';
  return Number(match[3]) + ' ' + MONTH_NAMES[Number(match[2]) - 1] + ' ' + match[1];
}

function displayPlace_(value) {
  return value ? String(value) : '(Blank)';
}

function colsOf_(pairs) {
  return pairs.map(function (pair) { return pair[0]; });
}

// =====================================================
// SCORING (same rules as the Colab dashboard)
// =====================================================

function flagRow_(value, col, invert) {
  if (value == null || INVALID_VALUES[String(value)] === true) {
    return { yes: false, no: false };
  }
  var text = String(value).trim().toLowerCase();
  if (col === 'uterotonic_administered') {
    var none = text === 'none of the above';
    return { yes: !none, no: none };
  }
  if (col === 'method_blood_loss') {
    var good = BLOOD_LOSS_VALID[text] === true;
    return { yes: good, no: !good };
  }
  if (FREQUENCY_COLS[col]) {
    return {
      yes: text === 'yes' || text === 'always',
      no: text === 'no' || text === 'sometimes' || text === 'rarely' || text === 'never'
    };
  }
  if (invert == null) invert = INVERTED_COLS[col] === true;
  var pos = invert ? 'no' : 'yes';
  var neg = invert ? 'yes' : 'no';
  return { yes: text === pos, no: text === neg };
}

function computeScore_(records, col, invert) {
  var yes = 0;
  var no = 0;
  for (var i = 0; i < records.length; i++) {
    var flag = flagRow_(records[i][col], col, invert);
    if (flag.yes) yes++;
    if (flag.no) no++;
  }
  var denom = yes + no;
  return denom === 0 ? null : (yes / denom) * 100;
}

function sectionScore_(records, cols) {
  var scores = [];
  for (var i = 0; i < cols.length; i++) {
    if (!columnPresent_(records, cols[i])) continue;
    var score = computeScore_(records, cols[i], null);
    if (score != null) scores.push(score);
  }
  return mean_(scores);
}

function yesMask_(value) {
  return String(value == null ? '' : value).trim().toLowerCase() === 'yes';
}

function countUnique_(records, pred) {
  var seen = Object.create(null);
  var n = 0;
  for (var i = 0; i < records.length; i++) {
    if (pred && !pred(records[i])) continue;
    var id = String(records[i]._uuid);
    if (seen[id]) continue;
    seen[id] = 1;
    n++;
  }
  return n;
}

function columnPresent_(records, col) {
  if (!records.length) return false;
  return Object.prototype.hasOwnProperty.call(records[0], col);
}

function pctSingleYes_(records, col, total) {
  if (!columnPresent_(records, col)) return 0;
  return countUnique_(records, function (rec) { return yesMask_(rec[col]); }) / total * 100;
}

function pctAllYes_(records, cols, total) {
  for (var i = 0; i < cols.length; i++) {
    if (!columnPresent_(records, cols[i])) return 0;
  }
  return countUnique_(records, function (rec) {
    for (var c = 0; c < cols.length; c++) {
      if (!yesMask_(rec[cols[c]])) return false;
    }
    return true;
  }) / total * 100;
}

function pctSectionThreshold_(records, cols, threshold, total) {
  var present = [];
  for (var i = 0; i < cols.length; i++) {
    if (columnPresent_(records, cols[i])) present.push(cols[i]);
  }
  if (!present.length) return 0;

  var byId = Object.create(null);
  var order = [];
  for (var r = 0; r < records.length; r++) {
    var id = String(records[r]._uuid);
    if (!byId[id]) {
      byId[id] = {};
      order.push(id);
      for (var p = 0; p < present.length; p++) byId[id][present[p]] = { y: 0, n: 0 };
    }
    for (var c = 0; c < present.length; c++) {
      var flag = flagRow_(records[r][present[c]], present[c], null);
      if (flag.yes) byId[id][present[c]].y++;
      if (flag.no) byId[id][present[c]].n++;
    }
  }

  var hits = 0;
  for (var u = 0; u < order.length; u++) {
    var bucket = byId[order[u]];
    var scores = [];
    for (var k = 0; k < present.length; k++) {
      var den = bucket[present[k]].y + bucket[present[k]].n;
      if (den > 0) scores.push(bucket[present[k]].y / den);
    }
    if (!scores.length) continue;
    var deliveryScore = mean_(scores) * 100;
    if (deliveryScore >= threshold - 1e-9) hits++;
  }
  return hits / total * 100;
}

function qualityScore_(records) {
  if (!columnPresent_(records, 'quality_care_score')) return null;
  var vals = [];
  for (var i = 0; i < records.length; i++) {
    var raw = records[i].quality_care_score;
    if (raw == null || String(raw).trim() === '') continue;
    var n = Number(raw);
    if (!isNaN(n)) vals.push(n);
  }
  var avg = mean_(vals);
  return avg == null ? null : avg * 100;
}

function quipsScore_(records, spec) {
  if (!records.length) return null;
  var total = countUnique_(records);
  if (!total) return null;
  if (spec.kind === 'mentee') {
    if (!columnPresent_(records, 'cadre')) return 0;
    return countUnique_(records, function (rec) {
      return String(rec.cadre || '').trim().toLowerCase() === CADRE_MENTEE;
    }) / total * 100;
  }
  if (spec.kind === 'single') return pctSingleYes_(records, spec.cols[0], total);
  if (spec.kind === 'all') return pctAllYes_(records, spec.cols, total);
  if (spec.kind === 'threshold') return pctSectionThreshold_(records, spec.cols, spec.threshold, total);
  if (spec.kind === 'qoc') return qualityScore_(records);
  return null;
}

function validAnswers_(records, field) {
  var out = [];
  for (var i = 0; i < records.length; i++) {
    var raw = records[i][field];
    if (raw == null) continue;
    var text = String(raw).trim();
    if (CATEGORY_INVALID[text.toLowerCase()] === true) continue;
    out.push(text);
  }
  return out;
}

function categoryPct_(records, field, cat, multi) {
  if (!columnPresent_(records, field)) return null;
  var answers = validAnswers_(records, field);
  if (!answers.length) return null;
  var hits = 0;
  for (var i = 0; i < answers.length; i++) {
    if (multi) {
      if (answers[i].split(/\s+/).indexOf(cat) !== -1) hits++;
    } else if (answers[i] === cat) {
      hits++;
    }
  }
  return hits / answers.length * 100;
}

function discoverCategories_(records, field, multi) {
  var answers = validAnswers_(records, field);
  var counts = Object.create(null);
  var firstSeen = Object.create(null);
  var order = [];
  for (var i = 0; i < answers.length; i++) {
    var parts = multi ? answers[i].split(/\s+/) : [answers[i]];
    for (var p = 0; p < parts.length; p++) {
      var cat = parts[p];
      if (!cat) continue;
      if (counts[cat] == null) {
        counts[cat] = 0;
        firstSeen[cat] = order.length;
        order.push(cat);
      }
      counts[cat]++;
    }
  }
  order.sort(function (a, b) {
    if (counts[b] !== counts[a]) return counts[b] - counts[a];
    return firstSeen[a] - firstSeen[b];
  });
  return order;
}

function mean_(nums) {
  if (!nums.length) return null;
  var sum = 0;
  for (var i = 0; i < nums.length; i++) sum += nums[i];
  return sum / nums.length;
}

function statusIcon_(score, mode) {
  if (score == null || isNaN(score)) return '⚪';
  if (mode === 'harm_rate') {
    if (score === 0) return '🟢';
    if (score <= 5) return '🟠';
    return '🔴';
  }
  if (mode === 'neutral') return '';
  if (score >= 80) return '🟢';
  if (score >= 60) return '🟠';
  return '🔴';
}

function scoreColor_(score, mode) {
  if (score == null || isNaN(score)) return '#808080';
  if (mode === 'neutral') return '#202124';
  if (mode === 'harm_rate') {
    if (score === 0) return '#188038';
    if (score <= 5) return '#e37400';
    return '#d93025';
  }
  if (score >= 80) return '#188038';
  if (score >= 60) return '#e37400';
  return '#d93025';
}

function trendPresentation_(current, previous, mode) {
  if (current == null || previous == null || isNaN(current) || isNaN(previous)) {
    return { text: '▬ N/A', color: '#808080' };
  }
  var diff = current - previous;
  var text = ' (' + Math.abs(diff).toFixed(1) + '%)';
  var up = '#188038';
  var down = '#d93025';
  if (mode === 'harm_rate') {
    up = '#d93025';
    down = '#188038';
  } else if (mode === 'neutral') {
    up = '#1f77b4';
    down = '#e37400';
  }
  if (diff > 0) return { text: '▲' + text, color: up };
  if (diff < 0) return { text: '▼' + text, color: down };
  return { text: '▬' + text, color: '#808080' };
}

function scoringSelfCheckErrors_() {
  var errors = [];
  function expect(name, actual, expected) {
    if (actual == null && expected == null) return;
    if (typeof expected === 'number') {
      if (actual == null || Math.abs(actual - expected) > 1e-6) {
        errors.push(name + ': expected ' + expected + ', got ' + actual);
      }
      return;
    }
    if (actual !== expected) errors.push(name + ': expected ' + expected + ', got ' + actual);
  }

  function rec(uuid, values) {
    var row = { _uuid: uuid, county: 'Test', facility: 'Test', monthKey: '2026-10' };
    for (var key in values) row[key] = values[key];
    return row;
  }

  var hygiene = [
    rec('1', { hand_hygiene: 'Yes' }),
    rec('2', { hand_hygiene: 'No' }),
    rec('3', { hand_hygiene: 'Unable to observe' }),
    rec('4', { hand_hygiene: '' })
  ];
  expect('hand hygiene', computeScore_(hygiene, 'hand_hygiene', null), 50);

  var pressure = [
    rec('1', { fundal_pressure: 'Yes' }),
    rec('2', { fundal_pressure: 'No' }),
    rec('3', { fundal_pressure: 'No' })
  ];
  expect('fundal avoidance', computeScore_(pressure, 'fundal_pressure', null), 200 / 3);
  expect('fundal harm rate', computeScore_(pressure, 'fundal_pressure', false), 100 / 3);

  var utero = [
    rec('1', { uterotonic_administered: 'Oxytocin 10iu im or 5iu iv push' }),
    rec('2', { uterotonic_administered: 'None of the above' }),
    rec('3', { uterotonic_administered: 'Unable to observe' })
  ];
  expect('uterotonic', computeScore_(utero, 'uterotonic_administered', null), 50);

  var blood = [
    rec('1', { method_blood_loss: 'V drape' }),
    rec('2', { method_blood_loss: 'Estimate by just observing' }),
    rec('3', { method_blood_loss: 'Weighing of bloodsoaked materials pads gauze drapes' })
  ];
  expect('blood loss', computeScore_(blood, 'method_blood_loss', null), 100 / 3);

  var frequency = [
    rec('1', { provider_explanations: 'Always' }),
    rec('2', { provider_explanations: 'Sometimes' }),
    rec('3', { provider_explanations: 'Never' }),
    rec('4', { provider_explanations: 'Unable to observe' })
  ];
  expect('frequency', computeScore_(frequency, 'provider_explanations', null), 100 / 3);

  var cadre = [
    rec('1', { cadre: 'Enrolled jh mentee' }),
    rec('2', { cadre: 'Enrolled jh mentee' }),
    rec('3', { cadre: 'Student' }),
    rec('4', { cadre: '' })
  ];
  expect('mentee', quipsScore_(cadre, { kind: 'mentee' }), 50);

  var threshold = [
    rec('1', { hand_hygiene: 'Yes', ppe_gloves: 'Yes' }),
    rec('2', { hand_hygiene: 'Yes', ppe_gloves: 'No' })
  ];
  expect('threshold 100', pctSectionThreshold_(threshold, ['hand_hygiene', 'ppe_gloves'], 100, 2), 50);
  expect('threshold 50', pctSectionThreshold_(threshold, ['hand_hygiene', 'ppe_gloves'], 50, 2), 100);

  var essential = [
    rec('1', { drying_stimulation: 'Yes', skin_to_skin: 'Yes', timely_cord_clamp: 'Yes', timely_breastfeeding_initiation: 'Yes' }),
    rec('2', { drying_stimulation: 'Yes', skin_to_skin: 'No', timely_cord_clamp: 'Yes', timely_breastfeeding_initiation: 'Yes' })
  ];
  expect('all essential', pctAllYes_(essential, NEWBORN_ESSENTIAL_CARE_COLS, 2), 50);
  expect('missing column is zero', pctAllYes_(essential, ['not_a_column'], 1), 0);

  var qoc = [rec('1', { quality_care_score: '0.5' }), rec('2', { quality_care_score: '1' })];
  expect('qoc', qualityScore_(qoc), 75);
  expect('empty quips', quipsScore_([], { kind: 'mentee' }), null);
  expect('status high', statusIcon_(80, 'good_high'), '🟢');
  expect('status mid', statusIcon_(60, 'good_high'), '🟠');
  expect('status low', statusIcon_(59.9, 'good_high'), '🔴');
  expect('status harm zero', statusIcon_(0, 'harm_rate'), '🟢');
  expect('status harm five', statusIcon_(5, 'harm_rate'), '🟠');
  expect('status harm over', statusIcon_(5.1, 'harm_rate'), '🔴');
  expect('status empty', statusIcon_(null, 'good_high'), '⚪');
  expect('trend up', trendPresentation_(70, 60, 'good_high').text, '▲ (10.0%)');
  expect('trend harm up color', trendPresentation_(10, 0, 'harm_rate').color, '#d93025');
  expect('views', SCORECARD_VIEWS.length, 14);
  expect('tqifb', TQIFB_COLS.length, 21);
  expect('tqab', TQAB_INDICATORS.length, 29);

  var categories = discoverCategories_([
    rec('1', { uterotonic_administered: 'Oxytocin 10iu im or 5iu iv push' }),
    rec('2', { uterotonic_administered: 'Carbetocin 100mcg' }),
    rec('3', { uterotonic_administered: 'Oxytocin 10iu im or 5iu iv push' }),
    rec('4', { uterotonic_administered: 'Unable to observe' }),
    rec('5', { uterotonic_administered: '' })
  ], 'uterotonic_administered', false);
  expect('category order', categories.join('|'), 'Oxytocin 10iu im or 5iu iv push|Carbetocin 100mcg');

  return errors;
}

// =====================================================
// SCORECARD MODEL
// =====================================================

function buildScorecard_(records, exportMonth) {
  var months = windowMonthKeys_(exportMonth);
  var allowed = Object.create(null);
  var monthMap = Object.create(null);
  for (var m = 0; m < months.length; m++) {
    allowed[months[m]] = true;
    monthMap[months[m]] = [];
  }
  var scoped = [];
  for (var i = 0; i < records.length; i++) {
    var key = records[i].monthKey;
    if (!allowed[key]) continue;
    monthMap[key].push(records[i]);
    scoped.push(records[i]);
  }
  records = scoped;
  var prevKey = prevMonthKey_(exportMonth);
  var prevRecords = monthMap[prevKey] || [];
  var trendRecords = monthMap[exportMonth] || [];

  var sections = [];
  for (var v = 0; v < SCORECARD_VIEWS.length; v++) {
    sections.push(buildSection_(SCORECARD_VIEWS[v], records, months, monthMap, trendRecords, prevRecords));
  }

  var deliveriesByMonth = {};
  for (var m = 0; m < months.length; m++) {
    deliveriesByMonth[months[m]] = countUnique_(monthMap[months[m]]);
  }

  return {
    exportMonth: exportMonth,
    prevMonth: prevKey,
    months: months,
    deliveries: countUnique_(records),
    deliveriesThisMonth: countUnique_(trendRecords),
    deliveriesByMonth: deliveriesByMonth,
    latest: latestSubmission_(records),
    sections: sections
  };
}

function buildSection_(view, records, months, monthMap, trendRecords, prevRecords) {
  var mode = view.mode || (view.kind === 'category' ? 'neutral' : 'good_high');
  var showStatus = view.kind !== 'category';
  var firstCol = 'Indicator';
  var defs = [];

  if (view.kind === 'sections') {
    firstCol = 'Section';
    for (var s = 0; s < SECTION_MAPPING.length; s++) {
      var cols = SECTION_MAPPING[s][1];
      if (!records.length || !cols.every(function (col) { return columnPresent_(records, col); })) continue;
      defs.push({ label: SECTION_MAPPING[s][0], scoreOf: sectionScorer_(cols) });
    }
  } else if (view.kind === 'quips') {
    for (var q = 0; q < QUIPS_SPECS.length; q++) {
      defs.push({ label: QUIPS_SPECS[q].label, scoreOf: quipsScorer_(QUIPS_SPECS[q]) });
    }
  } else if (view.kind === 'indicators') {
    var invert = mode === 'harm_rate' ? false : null;
    for (var n = 0; n < view.indicators.length; n++) {
      var pair = view.indicators[n];
      if (records.length && !columnPresent_(records, pair[0])) continue;
      defs.push({ label: pair[1], scoreOf: indicatorScorer_(pair[0], invert) });
    }
  } else if (view.kind === 'category') {
    firstCol = view.rowLabel;
    var categories = discoverCategories_(records, view.field, view.multi);
    for (var c = 0; c < categories.length; c++) {
      defs.push({ label: categories[c], scoreOf: categoryScorer_(view.field, categories[c], view.multi) });
    }
  }

  var rows = [];
  for (var d = 0; d < defs.length; d++) {
    var byMonth = {};
    for (var m = 0; m < months.length; m++) {
      byMonth[months[m]] = defs[d].scoreOf(monthMap[months[m]]);
    }
    rows.push({
      label: defs[d].label,
      order: d,
      score: defs[d].scoreOf(records),
      byMonth: byMonth,
      trend: trendPresentation_(defs[d].scoreOf(trendRecords), defs[d].scoreOf(prevRecords), mode)
    });
  }

  if (view.sort) {
    rows.sort(function (a, b) {
      var av = a.score == null ? Infinity : a.score;
      var bv = b.score == null ? Infinity : b.score;
      if (av !== bv) return av - bv;
      return a.order - b.order;
    });
  }

  return {
    title: view.title,
    mode: mode,
    showStatus: showStatus,
    firstCol: firstCol,
    rows: rows
  };
}

function sectionScorer_(cols) {
  return function (records) { return sectionScore_(records, cols); };
}

function quipsScorer_(spec) {
  return function (records) { return quipsScore_(records, spec); };
}

function indicatorScorer_(col, invert) {
  return function (records) { return computeScore_(records, col, invert); };
}

function categoryScorer_(field, cat, multi) {
  return function (records) { return categoryPct_(records, field, cat, multi); };
}

function latestSubmission_(records) {
  var latest = '';
  for (var i = 0; i < records.length; i++) {
    var raw = String(records[i].date_submitted || '');
    if (raw > latest) latest = raw;
  }
  return formatSubmitted_(latest);
}

function sliceThrough_(records, exportMonth) {
  var keys = windowMonthKeys_(exportMonth);
  var start = keys[0];
  return records.filter(function (rec) {
    return rec.monthKey && rec.monthKey >= start && rec.monthKey <= exportMonth;
  });
}

function buildExportPlan_(records, headers, exportMonth) {
  // headers is accepted so a future column check can use the full file.
  void headers;
  var inWindow = sliceThrough_(records, exportMonth);
  var byCounty = Object.create(null);
  for (var i = 0; i < inWindow.length; i++) {
    var key = inWindow[i].county;
    if (!byCounty[key]) byCounty[key] = [];
    byCounty[key].push(inWindow[i]);
  }

  var countyKeys = Object.keys(byCounty).filter(function (key) {
    return byCounty[key].some(function (rec) { return rec.monthKey === exportMonth; });
  });
  countyKeys.sort(function (a, b) {
    if (!a) return 1;
    if (!b) return -1;
    return a.localeCompare(b);
  });

  var plan = [];
  for (var c = 0; c < countyKeys.length; c++) {
    plan.push(planCounty_(countyKeys[c], byCounty[countyKeys[c]], exportMonth));
  }
  return plan;
}

function planCounty_(countyKey, records, exportMonth) {
  var byFacility = Object.create(null);
  for (var i = 0; i < records.length; i++) {
    var key = records[i].facility;
    if (!byFacility[key]) byFacility[key] = [];
    byFacility[key].push(records[i]);
  }

  var usedNames = {};
  usedNames[SHEET_INDEX.toLowerCase()] = true;
  usedNames[SHEET_ALL.toLowerCase()] = true;

  var facilityKeys = Object.keys(byFacility);
  facilityKeys.sort(function (a, b) {
    if (!a) return 1;
    if (!b) return -1;
    return a.localeCompare(b);
  });

  var facilities = [];
  var silent = [];
  for (var f = 0; f < facilityKeys.length; f++) {
    var rows = byFacility[facilityKeys[f]];
    var thisMonth = countUnique_(rows.filter(function (rec) { return rec.monthKey === exportMonth; }));
    var entry = {
      facilityKey: facilityKeys[f],
      facilityLabel: displayPlace_(facilityKeys[f]),
      thisMonth: thisMonth,
      through: countUnique_(rows),
      latest: latestSubmission_(rows)
    };
    if (!thisMonth) {
      silent.push(entry);
      continue;
    }
    entry.sheetName = uniqueSheetName_(entry.facilityLabel, usedNames);
    entry.scorecard = buildScorecard_(rows, exportMonth);
    facilities.push(entry);
  }

  var countyLabel = displayPlace_(countyKey);
  return {
    countyKey: countyKey,
    countyLabel: countyLabel,
    fileName: 'QuIPS CQI ' + countyLabel + ' ' + monthLabelLong_(exportMonth),
    thisMonth: countUnique_(records.filter(function (rec) { return rec.monthKey === exportMonth; })),
    through: countUnique_(records),
    latest: latestSubmission_(records),
    allScorecard: buildScorecard_(records, exportMonth),
    facilities: facilities,
    silent: silent
  };
}

function sanitizeSheetName_(name) {
  var clean = String(name || '').replace(/[\]\[*?/\\:]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) clean = '(Blank)';
  if (clean.length > 99) clean = clean.slice(0, 99).trim();
  return clean;
}

function uniqueSheetName_(name, used) {
  var base = sanitizeSheetName_(name);
  var candidate = base;
  var n = 2;
  while (used[candidate.toLowerCase()]) {
    var suffix = ' (' + n + ')';
    candidate = base.slice(0, 100 - suffix.length).trim() + suffix;
    n++;
  }
  used[candidate.toLowerCase()] = true;
  return candidate;
}

// =====================================================
// SHEET LAYOUT
// =====================================================

var COLOR_TITLE = '#2b8aa8';
var COLOR_SECTION = '#1f6f8a';
var COLOR_HEADER = '#f2f2f2';
var COLOR_MONTH = '#e7f5f8';
var COLOR_ZEBRA = '#f7fbfc';
var COLOR_NOTE = '#5f6368';
var COLOR_WHITE = '#ffffff';
var COLOR_INK = '#202124';

function layoutScorecardSheet_(scorecard, heading) {
  var months = scorecard.months;
  var colCount = 4 + months.length; // label, score, months, status, trend
  var reportAt = months.indexOf(scorecard.exportMonth);
  var layout = createLayout_(colCount);
  var reportLabel = monthLabelLong_(scorecard.exportMonth);
  var span = months.length
    ? '  ·  scores ' + monthLabel_(months[0]) + ' – ' + monthLabel_(months[months.length - 1])
    : '';

  // Row 1 names the facility and month. The first matrix title is row 2.
  addMerged_(layout, plainCell_(
    heading.place + '  ·  ' + reportLabel + '  ·  ' + scorecard.deliveriesThisMonth + ' deliveries this month' + span,
    { bg: '#e8f4f8', color: COLOR_INK, bold: true, size: 12 }
  ), 24);

  for (var s = 0; s < scorecard.sections.length; s++) {
    appendSection_(layout, scorecard.sections[s], s + 1, months, reportAt);
  }

  layout.reportCol = reportAt < 0 ? -1 : reportAt + 2; // 0-based column of the report month
  return layout;
}

function appendSection_(layout, section, number, months, reportAt) {
  addMerged_(layout, plainCell_(number + '. ' + section.title, {
    bg: COLOR_SECTION, color: COLOR_WHITE, bold: true, size: 12
  }), 24);

  var header = [section.firstCol, 'Score'];
  for (var m = 0; m < months.length; m++) header.push(monthLabel_(months[m]));
  header.push(section.showStatus ? 'Status' : '');
  header.push('Trend');
  var headerRow = pushTableRow_(layout, header, { header: true, reportAt: reportAt, text: true });

  if (!section.rows.length) {
    var empty = ['No valid answers in this period'];
    for (var e = 1; e < layout.colCount; e++) empty.push('');
    pushTableRow_(layout, empty, { reportAt: reportAt, text: true });
    layout.borders.push({ row: headerRow, col: 1, numRows: 2, numCols: layout.colCount });
    addBlank_(layout);
    addBlank_(layout);
    return;
  }

  for (var r = 0; r < section.rows.length; r++) {
    var item = section.rows[r];
    // Score and the report month are coloured. Earlier months stay neutral.
    var values = [asLabel_(item.label), scoreCell_(item.score, section.mode)];
    for (var h = 0; h < months.length; h++) {
      values.push(scoreCell_(item.byMonth[months[h]], h === reportAt ? section.mode : 'plain'));
    }
    values.push(section.showStatus ? statusIcon_(item.score, section.mode) : '');
    values.push({
      v: item.trend.text,
      trend: item.trend,
      color: item.trend.color,
      align: 'center',
      bold: true
    });
    pushTableRow_(layout, values, { reportAt: reportAt, zebra: r % 2 === 1 });
  }

  layout.borders.push({
    row: headerRow,
    col: 1,
    numRows: section.rows.length + 1,
    numCols: layout.colCount
  });
  addBlank_(layout);
  addBlank_(layout);
}

function scoreCell_(score, mode) {
  if (score == null || isNaN(score)) {
    return { v: 'N/A', color: '#808080', align: 'center' };
  }
  return {
    v: score,
    // Quoted percent sign so Sheets shows 57.1 as 57.1%, not 5710%.
    fmt: '0.0"%"',
    color: mode === 'plain' ? COLOR_INK : scoreColor_(score, mode),
    align: 'center',
    bold: mode !== 'plain'
  };
}

function asLabel_(value) {
  var text = String(value == null ? '' : value);
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return { v: text, align: 'left' };
}

function layoutIndexSheet_(county, generatedAt) {
  var layout = createLayout_(4);
  var reportLabel = monthLabel_(county.allScorecard.exportMonth);
  var firstLabel = monthLabel_(county.allScorecard.months[0] || county.allScorecard.exportMonth);

  addMerged_(layout, plainCell_('Quality Intrapartum Care Surveillance', {
    bg: COLOR_TITLE, color: COLOR_WHITE, bold: true, size: 16
  }), 36);
  addMerged_(layout, plainCell_(county.countyLabel + '  ·  ' + reportLabel, {
    bg: '#e8f4f8', bold: true, size: 13
  }), 24);
  addMerged_(layout, plainCell_(
    'Generated ' + generatedAt + '  ·  Latest submission in this file: ' + (county.latest || '—'),
    { color: COLOR_NOTE, size: 9 }
  ), 18);
  addMerged_(layout, plainCell_(
    county.thisMonth + ' deliveries in ' + reportLabel + ' across ' + county.facilities.length +
    ' facilities. Scores on each tab include ' + county.through + ' deliveries from ' +
    firstLabel + ' through ' + reportLabel + '.',
    { size: 10 }
  ), 32);
  addBlank_(layout);
  addMerged_(layout, plainCell_('Tabs', { bg: COLOR_SECTION, color: COLOR_WHITE, bold: true, size: 12 }), 22);

  var tableHeader = pushTableRow_(layout, ['Facility', 'Deliveries this month', 'Deliveries in the score', 'Open'], {
    header: true, text: true, reportAt: -1
  });
  layout.links = [{ row: layout.cells.length + 1, sheetName: SHEET_ALL }];
  pushTableRow_(layout, [SHEET_ALL, county.thisMonth, county.through, 'Open'], { integer: true, linkCol: 3 });

  for (var i = 0; i < county.facilities.length; i++) {
    var facility = county.facilities[i];
    layout.links.push({ row: layout.cells.length + 1, sheetName: facility.sheetName });
    pushTableRow_(layout, [facility.facilityLabel, facility.thisMonth, facility.through, 'Open'], {
      integer: true,
      zebra: i % 2 === 1,
      linkCol: 3
    });
  }
  layout.borders.push({
    row: tableHeader,
    col: 1,
    numRows: county.facilities.length + 2,
    numCols: 4
  });

  if (county.silent.length) {
    addBlank_(layout);
    addMerged_(layout, plainCell_('No submission in ' + reportLabel, {
      bg: COLOR_SECTION, color: COLOR_WHITE, bold: true, size: 12
    }), 22);
    var silentHeader = pushTableRow_(layout, ['Facility', 'Deliveries before this month', 'Latest previous submission', ''], {
      header: true, text: true, reportAt: -1
    });
    for (var s = 0; s < county.silent.length; s++) {
      pushTableRow_(layout, [
        county.silent[s].facilityLabel,
        county.silent[s].through,
        county.silent[s].latest || '—',
        ''
      ], { integer: true, zebra: s % 2 === 1 });
    }
    layout.borders.push({
      row: silentHeader,
      col: 1,
      numRows: county.silent.length + 1,
      numCols: 4
    });
  }

  addBlank_(layout);
  addMerged_(layout, plainCell_('Sections on every tab, first to last', {
    bg: COLOR_SECTION, color: COLOR_WHITE, bold: true, size: 12
  }), 22);
  for (var v = 0; v < SCORECARD_VIEWS.length; v++) {
    addMerged_(layout, plainCell_((v + 1) + '. ' + SCORECARD_VIEWS[v].title, { size: 10 }), 18);
  }

  addBlank_(layout);
  addMerged_(layout, plainCell_('How to read the scores', { bg: COLOR_SECTION, color: COLOR_WHITE, bold: true, size: 12 }), 22);
  addMerged_(layout, plainCell_('🟢 80% or above     🟠 60% up to 80%     🔴 below 60%     ⚪ no valid answers.', { size: 10 }), 18);
  addMerged_(layout, plainCell_('Harmful Practices (% with instance) reads the other way: 🟢 0%, 🟠 up to 5%, 🔴 above 5%. Lower is better.', { size: 10 }), 18);
  addMerged_(layout, plainCell_('Score and Status cover the last 6 months, including the report month. Trend compares the report month with the previous month. The report month column is highlighted.', { size: 10 }), 32);
  addMerged_(layout, plainCell_('Key QuIPS percentages use every delivery as the denominator. The other indicator scores use valid answers only.', { size: 10 }), 18);
  addMerged_(layout, plainCell_('This file is replaced in place if this month is exported again, so the link stays the same.', { size: 10, color: COLOR_NOTE }), 18);

  return layout;
}

function createLayout_(colCount) {
  return {
    colCount: colCount,
    cells: [],
    merges: [],
    borders: [],
    rowHeights: [],
    links: []
  };
}

function plainCell_(value, opt) {
  opt = opt || {};
  return {
    v: value,
    bg: opt.bg || COLOR_WHITE,
    color: opt.color || COLOR_INK,
    bold: !!opt.bold,
    size: opt.size || 10,
    align: opt.align || 'left'
  };
}

function addMerged_(layout, cell, height) {
  var row = [];
  row.push(cell);
  for (var c = 1; c < layout.colCount; c++) {
    row.push({ v: '', bg: cell.bg || COLOR_WHITE });
  }
  layout.cells.push(padRow_(row, layout.colCount));
  layout.rowHeights.push(height || 0);
  layout.merges.push({ row: layout.cells.length, col: 1, numRows: 1, numCols: layout.colCount });
}

function addBlank_(layout) {
  var row = [];
  for (var c = 0; c < layout.colCount; c++) row.push({ v: '', bg: COLOR_WHITE });
  layout.cells.push(row);
  layout.rowHeights.push(10);
}

function pushTableRow_(layout, values, opt) {
  opt = opt || {};
  var row = [];
  for (var c = 0; c < layout.colCount; c++) {
    var raw = values[c];
    var cell = (raw != null && typeof raw === 'object') ? raw : { v: raw == null ? '' : raw };
    if (cell.bg == null) {
      if (opt.header) cell.bg = (opt.reportAt === c - 2) ? COLOR_MONTH : COLOR_HEADER;
      else if (opt.reportAt === c - 2) cell.bg = COLOR_MONTH;
      else if (opt.zebra) cell.bg = COLOR_ZEBRA;
      else cell.bg = COLOR_WHITE;
    }
    if (cell.color == null) cell.color = COLOR_INK;
    if (cell.bold == null) cell.bold = !!opt.header;
    if (cell.size == null) cell.size = 10;
    if (cell.align == null) cell.align = c === 0 ? 'left' : 'center';
    if (typeof cell.v === 'string' && /^[=+\-@]/.test(cell.v)) cell.v = "'" + cell.v;
    if (opt.header || opt.text) {
      if (cell.fmt == null) cell.fmt = '@';
    } else if (opt.integer && c > 0 && typeof cell.v === 'number') {
      cell.fmt = '0';
    }
    if (opt.linkCol === c) {
      cell.link = true;
      // Plain-text format would stop the Open formula from calculating.
      cell.fmt = 'General';
    }
    row.push(cell);
  }
  layout.cells.push(padRow_(row, layout.colCount));
  layout.rowHeights.push(opt.header ? 22 : 20);
  return layout.cells.length;
}

function padRow_(row, colCount) {
  while (row.length < colCount) row.push({ v: '', bg: COLOR_WHITE });
  return row;
}

// =====================================================
// GOOGLE SHEETS / DRIVE
// =====================================================

function writeCountyFile_(monthFolder, county, yearMonth, generatedAt, dataUrl) {
  void yearMonth;
  void dataUrl;
  var existing = monthFolder.getFilesByName(county.fileName);
  var ss;
  var action;
  if (existing.hasNext()) {
    ss = SpreadsheetApp.openById(existing.next().getId());
    action = 'updated';
  } else {
    ss = SpreadsheetApp.create(county.fileName);
    DriveApp.getFileById(ss.getId()).moveTo(monthFolder);
    action = 'created';
  }
  ss.rename(county.fileName);
  try { ss.setSpreadsheetTimeZone(loadConfig_().timezone); } catch (ignore) {}

  var wanted = {};
  wanted[SHEET_INDEX] = layoutIndexSheet_(county, generatedAt);
  wanted[SHEET_ALL] = layoutScorecardSheet_(county.allScorecard, {
    title: 'Quality Intrapartum Care Surveillance',
    place: county.countyLabel + '  ·  All facilities'
  });
  for (var i = 0; i < county.facilities.length; i++) {
    var facility = county.facilities[i];
    wanted[facility.sheetName] = layoutScorecardSheet_(facility.scorecard, {
      title: 'Quality Intrapartum Care Surveillance',
      place: county.countyLabel + '  ·  ' + facility.facilityLabel
    });
  }

  var order = [SHEET_INDEX, SHEET_ALL];
  for (var f = 0; f < county.facilities.length; f++) order.push(county.facilities[f].sheetName);

  for (var s = 0; s < order.length; s++) {
    var sheet = ss.getSheetByName(order[s]) || ss.insertSheet(order[s]);
    paintSheet_(sheet, wanted[order[s]]);
  }

  // Index links need the tab ids, which exist only after the sheets do.
  var index = ss.getSheetByName(SHEET_INDEX);
  var indexLayout = wanted[SHEET_INDEX];
  for (var link = 0; link < indexLayout.links.length; link++) {
    var item = indexLayout.links[link];
    var target = ss.getSheetByName(item.sheetName);
    if (!target) continue;
    var linkCell = index.getRange(item.row, 4);
    linkCell.setNumberFormat('General');
    linkCell.setFormula('=HYPERLINK("#gid=' + target.getSheetId() + '","Open")');
  }

  var sheets = ss.getSheets();
  for (var d = sheets.length - 1; d >= 0; d--) {
    if (!wanted[sheets[d].getName()] && ss.getSheets().length > 1) {
      ss.deleteSheet(sheets[d]);
    }
  }
  reorderSheets_(ss, order);

  var all = ss.getSheetByName(SHEET_ALL);
  if (all) all.setTabColor(COLOR_TITLE);
  if (index) index.setTabColor('#5f6368');

  return {
    action: action,
    url: ss.getUrl(),
    file: DriveApp.getFileById(ss.getId())
  };
}

function paintSheet_(sheet, layout) {
  sheet.clear();
  try { sheet.clearNotes(); } catch (ignore) {}
  sheet.setConditionalFormatRules([]);
  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).breakApart();
  ensureGrid_(sheet, layout.cells.length, layout.colCount);

  var values = [];
  var backgrounds = [];
  var colors = [];
  var weights = [];
  var sizes = [];
  var formats = [];
  var aligns = [];
  var trendCol = [];

  for (var r = 0; r < layout.cells.length; r++) {
    var valueRow = [];
    var bgRow = [];
    var colorRow = [];
    var weightRow = [];
    var sizeRow = [];
    var formatRow = [];
    var alignRow = [];
    var trendCell = null;
    for (var c = 0; c < layout.colCount; c++) {
      var cell = layout.cells[r][c] || { v: '' };
      var shown = cell.v == null ? '' : cell.v;
      if (typeof shown === 'string' && /^[=+\-@]/.test(shown)) shown = "'" + shown;
      valueRow.push(shown);
      bgRow.push(cell.bg || COLOR_WHITE);
      colorRow.push(cell.color || COLOR_INK);
      weightRow.push(cell.bold ? 'bold' : 'normal');
      sizeRow.push(cell.size || 10);
      formatRow.push(cell.fmt || (typeof cell.v === 'number' ? 'General' : '@'));
      alignRow.push(cell.align || 'left');
      if (c === layout.colCount - 1) trendCell = cell.trend || null;
    }
    values.push(valueRow);
    backgrounds.push(bgRow);
    colors.push(colorRow);
    weights.push(weightRow);
    sizes.push(sizeRow);
    formats.push(formatRow);
    aligns.push(alignRow);
    trendCol.push(trendCell);
  }

  var range = sheet.getRange(1, 1, layout.cells.length, layout.colCount);
  range.setValues(values);
  range.setBackgrounds(backgrounds);
  range.setFontColors(colors);
  range.setFontWeights(weights);
  range.setFontSizes(sizes);
  range.setNumberFormats(formats);
  range.setHorizontalAlignments(aligns);
  range.setVerticalAlignment('middle');
  range.setFontFamily('Arial');
  range.setWrap(false);

  for (var m = 0; m < layout.merges.length; m++) {
    var merge = layout.merges[m];
    sheet.getRange(merge.row, merge.col, merge.numRows, merge.numCols).merge();
  }
  for (var b = 0; b < layout.borders.length; b++) {
    var box = layout.borders[b];
    sheet.getRange(box.row, box.col, box.numRows, box.numCols)
      .setBorder(true, true, true, true, true, true, '#e0e0e0', SpreadsheetApp.BorderStyle.SOLID);
  }

  // Rich text is only applied to trend figures. Writing it across the whole
  // column would wipe the "Trend" header and merged title cells.
  for (var t = 0; t < trendCol.length; t++) {
    var trend = trendCol[t];
    if (!trend) continue;
    sheet.getRange(t + 1, layout.colCount).setRichTextValue(
      SpreadsheetApp.newRichTextValue()
        .setText(trend.text)
        .setTextStyle(SpreadsheetApp.newTextStyle()
          .setForegroundColor(trend.color)
          .setBold(true)
          .build())
        .build()
    );
  }

  for (var h = 0; h < layout.rowHeights.length; h++) {
    if (!layout.rowHeights[h]) continue;
    sheet.setRowHeight(h + 1, layout.rowHeights[h]);
    if (layout.rowHeights[h] >= 30) sheet.getRange(h + 1, 1, 1, layout.colCount).setWrap(true);
  }

  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(0);
  if (layout.colCount === 4) {
    sheet.setColumnWidth(1, 360);
    sheet.setColumnWidth(2, 180);
    sheet.setColumnWidth(3, 240);
    sheet.setColumnWidth(4, 90);
  } else {
    sheet.setColumnWidth(1, 640);
    for (var col = 2; col <= layout.colCount; col++) {
      sheet.setColumnWidth(col, col === layout.colCount ? 120 : 112);
    }
  }
}

function ensureGrid_(sheet, rows, cols) {
  if (sheet.getMaxRows() < rows) {
    sheet.insertRowsAfter(sheet.getMaxRows(), rows - sheet.getMaxRows());
  }
  if (sheet.getMaxColumns() < cols) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), cols - sheet.getMaxColumns());
  }
}

function reorderSheets_(ss, order) {
  try {
    SpreadsheetApp.setActiveSpreadsheet(ss);
  } catch (ignore) {}
  for (var i = 0; i < order.length; i++) {
    var sheet = ss.getSheetByName(order[i]);
    if (!sheet) continue;
    try {
      ss.setActiveSheet(sheet);
      ss.moveActiveSheet(i + 1);
    } catch (ignoreMove) {
      return;
    }
  }
}

function shareFile_(file, countyKey, cfg) {
  var rules = loadShareRules_(cfg);
  for (var i = 0; i < rules.length; i++) {
    var rule = rules[i];
    if (rule.counties.length && !countyListed_(rule.counties, countyKey)) continue;
    if (alreadyShared_(file, rule.email)) continue;
    try {
      if (rule.role === 'writer') file.addEditor(rule.email);
      else if (rule.role === 'commenter') file.addCommenter(rule.email);
      else file.addViewer(rule.email);
    } catch (err) {
      Logger.log('Could not share %s with %s: %s', file.getName(), rule.email, err);
    }
  }
  if (cfg.linkSharing) {
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (err) {
      Logger.log('Could not turn on link sharing for %s: %s', file.getName(), err);
    }
  }
}

function countyListed_(counties, countyKey) {
  var name = String(countyKey || '').trim().toLowerCase();
  for (var i = 0; i < counties.length; i++) {
    if (counties[i] === name) return true;
  }
  return false;
}

function alreadyShared_(file, email) {
  var target = email.toLowerCase();
  var people = [];
  try { people = people.concat(file.getViewers(), file.getEditors()); } catch (ignore) {}
  for (var i = 0; i < people.length; i++) {
    if (String(people[i].getEmail() || '').toLowerCase() === target) return true;
  }
  try {
    if (String(file.getOwner().getEmail() || '').toLowerCase() === target) return true;
  } catch (ignore) {}
  return false;
}

function appendLog_(root, row) {
  try {
    var folderFiles = root.getFilesByName('Export log');
    var ss = folderFiles.hasNext()
      ? SpreadsheetApp.openById(folderFiles.next().getId())
      : SpreadsheetApp.create('Export log');
    var file = DriveApp.getFileById(ss.getId());
    var parents = file.getParents();
    var inRoot = false;
    while (parents.hasNext()) {
      if (parents.next().getId() === root.getId()) inRoot = true;
    }
    if (!inRoot) file.moveTo(root);

    var sheet = ss.getSheetByName('Log') || ss.getSheets()[0];
    sheet.setName('Log');
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Generated', 'Report month', 'County', 'Action', 'Facility tabs', 'Deliveries this month', 'URL', 'Error']);
      sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground(COLOR_HEADER);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow(row);
  } catch (err) {
    Logger.log('Export log was not written: %s', err);
  }
}

// =====================================================
// CONFIG, FOLDERS, CLOCK
// =====================================================

function loadConfig_() {
  var cfg = {
    dataUrl: QUIPS_EXPORT.DATA_URL,
    folderId: String(QUIPS_EXPORT.DESTINATION_FOLDER_ID || '').trim(),
    linkSharing: !!QUIPS_EXPORT.LINK_SHARING,
    timezone: QUIPS_EXPORT.TIMEZONE || 'Africa/Nairobi',
    rootFolderName: QUIPS_EXPORT.ROOT_FOLDER_NAME
  };
  var ss = activeSpreadsheet_();
  if (!ss) return cfg;
  var sheet = ss.getSheetByName('Config');
  if (!sheet) return cfg;
  var values = sheet.getDataRange().getValues();
  for (var i = 0; i < values.length; i++) {
    var key = String(values[i][0] || '').trim();
    var value = values[i][1];
    if (!key || key === 'Key') continue;
    if (key === 'DATA_URL' && String(value || '').trim()) cfg.dataUrl = String(value).trim();
    if (key === 'DESTINATION_FOLDER_ID' && String(value || '').trim()) cfg.folderId = String(value).trim();
    if (key === 'LINK_SHARING') cfg.linkSharing = /^true$/i.test(String(value || '').trim());
    if (key === 'TIMEZONE' && String(value || '').trim()) cfg.timezone = String(value).trim();
  }
  return cfg;
}

function loadShareRules_(cfg) {
  var rules = [];
  var seen = Object.create(null);
  function add(email, role, counties) {
    email = String(email || '').trim();
    if (!email || email.indexOf('@') === -1) return;
    var key = email.toLowerCase();
    if (seen[key]) return;
    seen[key] = true;
    var list = String(counties || '').split(',').map(function (part) {
      return part.trim().toLowerCase();
    }).filter(Boolean);
    var cleanRole = String(role || 'reader').trim().toLowerCase();
    if (cleanRole !== 'writer' && cleanRole !== 'commenter') cleanRole = 'reader';
    rules.push({ email: email, role: cleanRole, counties: list });
  }

  var embedded = QUIPS_EXPORT.SHARE_WITH || [];
  for (var i = 0; i < embedded.length; i++) {
    add(embedded[i].email, embedded[i].role, embedded[i].counties);
  }

  var ss = activeSpreadsheet_();
  if (!ss) return rules;
  var sheet = ss.getSheetByName('Sharing');
  if (!sheet) return rules;
  var values = sheet.getDataRange().getValues();
  if (!values.length) return rules;
  var header = values[0].map(function (h) { return String(h || '').trim().toLowerCase(); });
  var emailCol = header.indexOf('email');
  var roleCol = header.indexOf('role');
  var countyCol = header.indexOf('counties');
  if (emailCol === -1) emailCol = 0;
  for (var r = 1; r < values.length; r++) {
    add(
      values[r][emailCol],
      roleCol === -1 ? 'reader' : values[r][roleCol],
      countyCol === -1 ? '' : values[r][countyCol]
    );
  }
  return rules;
}

function writeConfigSheet_(ss) {
  var sheet = ss.getSheetByName('Config') || ss.insertSheet('Config');
  if (sheet.getLastRow() > 1) return;
  var rows = [
    ['Key', 'Value', 'Notes'],
    ['DATA_URL', QUIPS_EXPORT.DATA_URL, 'Published CSV used by the Matrix Scorecards dashboard.'],
    ['DESTINATION_FOLDER_ID', QUIPS_EXPORT.DESTINATION_FOLDER_ID || '', 'Shared Drive folder. A year subfolder (2026, 2027, ...) is created inside it.'],
    ['LINK_SHARING', QUIPS_EXPORT.LINK_SHARING ? 'TRUE' : 'FALSE', 'TRUE lets anyone with the link view each county file.'],
    ['TIMEZONE', QUIPS_EXPORT.TIMEZONE, 'Used for the generated timestamp. The trigger clock follows the Apps Script project timezone.']
  ];
  sheet.getRange(1, 1, rows.length, 3).setValues(rows);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground(COLOR_HEADER);
  sheet.setColumnWidth(1, 240);
  sheet.setColumnWidth(2, 420);
  sheet.setColumnWidth(3, 520);
  sheet.setFrozenRows(1);
}

function writeSharingSheet_(ss) {
  var sheet = ss.getSheetByName('Sharing') || ss.insertSheet('Sharing');
  if (sheet.getLastRow() > 0) return;
  sheet.getRange(1, 1, 1, 3).setValues([['Email', 'Role', 'Counties']]);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground(COLOR_HEADER);
  sheet.getRange(2, 2).setValue('reader');
  sheet.getRange(2, 3).setNote('Leave blank to share every county file. Otherwise comma-separated county names, for example Nakuru, Mombasa.');
  sheet.setColumnWidth(1, 280);
  sheet.setColumnWidth(2, 140);
  sheet.setColumnWidth(3, 360);
  sheet.setFrozenRows(1);
}

function fetchRecords_() {
  var cfg = loadConfig_();
  var response = UrlFetchApp.fetch(cfg.dataUrl, { muteHttpExceptions: true, followRedirects: true });
  var code = response.getResponseCode();
  var text = response.getContentText();
  if (code !== 200) {
    throw new Error('Could not read the scorecard CSV (HTTP ' + code + '). Check DATA_URL on the Config sheet.');
  }
  var matrix = parseCsv_(text);
  if (!matrix.length || matrix[0].indexOf('date_submitted') === -1 || matrix[0].indexOf('county') === -1) {
    throw new Error('DATA_URL did not return the scorecard CSV. Check the published link on the Config sheet.');
  }
  return recordsFromMatrix_(matrix);
}

function rootFolder_(cfg) {
  if (cfg.folderId) {
    try {
      return DriveApp.getFolderById(cfg.folderId);
    } catch (err) {
      throw new Error('DESTINATION_FOLDER_ID is not a Drive folder this script can open.');
    }
  }
  var props = PropertiesService.getScriptProperties();
  var stored = props.getProperty('ROOT_FOLDER_ID');
  if (stored) {
    try { return DriveApp.getFolderById(stored); } catch (ignore) {}
  }
  var found = DriveApp.getFoldersByName(cfg.rootFolderName);
  var folder = found.hasNext() ? found.next() : DriveApp.createFolder(cfg.rootFolderName);
  props.setProperty('ROOT_FOLDER_ID', folder.getId());
  return folder;
}

function getOrCreateFolder_(parent, name) {
  var found = parent.getFoldersByName(name);
  return found.hasNext() ? found.next() : parent.createFolder(name);
}

function activeSpreadsheet_() {
  try {
    return SpreadsheetApp.getActive();
  } catch (ignore) {
    return null;
  }
}

function currentMonthKey_() {
  return Utilities.formatDate(new Date(), loadConfig_().timezone, 'yyyy-MM');
}

function previousMonthKey_() {
  return prevMonthKey_(currentMonthKey_());
}

function alert_(message) {
  Logger.log(message);
  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (ignore) {}
}

// =====================================================
// NODE TEST HOOK (ignored by Apps Script)
// =====================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseCsv_: parseCsv_,
    recordsFromMatrix_: recordsFromMatrix_,
    buildScorecard_: buildScorecard_,
    buildExportPlan_: buildExportPlan_,
    layoutScorecardSheet_: layoutScorecardSheet_,
    layoutIndexSheet_: layoutIndexSheet_,
    scoringSelfCheckErrors_: scoringSelfCheckErrors_,
    computeScore_: computeScore_,
    quipsScore_: quipsScore_,
    sectionScore_: sectionScore_,
    monthLabel_: monthLabel_,
    prevMonthKey_: prevMonthKey_,
    windowMonthKeys_: windowMonthKeys_,
    lastDayOfMonth_: lastDayOfMonth_,
    SCORECARD_VIEWS: SCORECARD_VIEWS,
    QUIPS_SPECS: QUIPS_SPECS
  };
}
