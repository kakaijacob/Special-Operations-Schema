const apiToken = '1faf1291cb5e472b7f5a253f3888380d28e7900b';
const formUid = 'a488FNw8rSGKWdJqpYfpny';

// Facility fields
const facilityFields = [
  'demographic_information/mentee_details/kakamega_facilities',
  'demographic_information/mentee_details/makueni_facilities',
  'demographic_information/mentee_details/mombasa_facilities',
  'demographic_information/mentee_details/muranga_facilities'
];

// Mentee fields
const menteeFields = [
"demographic_information/mentee_details/chombeli_nbc_mentees",
"demographic_information/mentee_details/emali_nbc_mentees",
"demographic_information/mentee_details/kalawa_nbc_mentees",
"demographic_information/mentee_details/kambu_nbc_mentees",
"demographic_information/mentee_details/kibwezi_nbc_mentees",
"demographic_information/mentee_details/kilungu_nbc_mentees",
"demographic_information/mentee_details/kisau_nbc_mentees",
"demographic_information/mentee_details/kitundu_nbc_mentees",
"demographic_information/mentee_details/makindu_nbc_mentees",
"demographic_information/mentee_details/makueni_nbc_mentees",
"demographic_information/mentee_details/matiliku_nbc_mentees",
"demographic_information/mentee_details/mbooni_nbc_mentees",
"demographic_information/mentee_details/mbooni_nbc_mentees",
"demographic_information/mentee_details/mtito_nbc_mentees",
"demographic_information/mentee_details/mukuyuni_nbc_mentees",
"demographic_information/mentee_details/nthongoni_nbc_mentees",
"demographic_information/mentee_details/sultan_nbc_mentees",
"demographic_information/mentee_details/tawa_nbc_mentees",
"demographic_information/mentee_details/bokole_nbc_mentees",
"demographic_information/mentee_details/coast_nbc_mentees",
"demographic_information/mentee_details/mbuta_nbc_mentees",
"demographic_information/mentee_details/mbuta_nbc_mentees",
"demographic_information/mentee_details/miritini_nbc_mentees",
"demographic_information/mentee_details/mlaleo_nbc_mentees",
"demographic_information/mentee_details/mrima_nbc_mentees",
"demographic_information/mentee_details/port_nbc_mentees",
"demographic_information/mentee_details/shimo_nbc_mentees",
"demographic_information/mentee_details/tudor_nbc_mentees",
"demographic_information/mentee_details/gaichanjiru_nbc_mentees",
"demographic_information/mentee_details/ithanga_nbc_mentees",
"demographic_information/mentee_details/kamahuha_nbc_mentees",
"demographic_information/mentee_details/kandara_nbc_mentees",
"demographic_information/mentee_details/kangema_nbc_mentees",
"demographic_information/mentee_details/kenol_nbc_mentees",
"demographic_information/mentee_details/kigumo_nbc_mentees",
"demographic_information/mentee_details/kiriini_nbc_mentees",
"demographic_information/mentee_details/makuyu_nbc_mentees",
"demographic_information/mentee_details/maragua_nbc_mentees",
"demographic_information/mentee_details/maragua_nbc_mentees",
"demographic_information/mentee_details/muranga_nbc_mentees",
"demographic_information/mentee_details/muriranjas_nbc_mentees"
];

// Topic fields
const topicFields = [
  'newborn_training_Curriculum/newborn_cmes/cmes_comprehensive',
  'newborn_training_Curriculum/newborn_cmes/cmes_essential',
  'newborn_training_Curriculum/newborn_cmes/drills_comprehensive',
  'newborn_training_Curriculum/newborn_cmes/drills_essential',
  'newborn_training_Curriculum/newborn_cmes/mentor_demonstrations_comprehensive',
  'newborn_training_Curriculum/newborn_cmes/practicum_comprehensive',
  'newborn_training_Curriculum/newborn_cmes/case_scenarios_comprehensive',
  'newborn_training_Curriculum/newborn_cmes/videos_comprehensive',
  'newborn_training_Curriculum/newborn_cmes/case_scenarios_essential'
];

// Mentorship activity & newborn program fields
const activityField = 'newborn_training_Curriculum/program_activities/newborn_activities';
const newbornProgramField = [
  'newborn_training_Curriculum/program_activities/newborn_program',
  'demographic_information/mentor_details/newborn_program'
  ];

function fetchKoboIncrementalFull() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Track existing submission IDs to prevent duplicates
  const existingSubmissions = {};
  ss.getSheets().forEach(sheet => {
    if (sheet.getLastRow() > 1) {
      const ids = sheet.getRange(2, 12, sheet.getLastRow() - 1, 1).getValues(); 
      ids.forEach(idRow => { if (idRow[0]) existingSubmissions[idRow[0]] = true; });
    }
  });

  // Find latest timestamp
  let latestTimestamp = '2026-03-26T00:00:00';
  ss.getSheets().forEach(sheet => {
    if (sheet.getLastRow() > 1) {
      const col = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
      col.forEach(row => {
        if (row[0]) {
          const dt = new Date(row[0]);
          if (dt > new Date(latestTimestamp)) latestTimestamp = dt.toISOString();
        }
      });
    }
  });

  // KoBo API query
  const query = encodeURIComponent(JSON.stringify({ "_submission_time": { "$gt": latestTimestamp } }));
  const url = `https://kc.humanitarianresponse.info/api/v2/assets/${formUid}/data/?format=json&query=${query}&ordering=-_submission_time`;
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { "Authorization": "Token " + apiToken },
    muteHttpExceptions: true
  });

  const data = JSON.parse(response.getContentText());
  const submissions = data.results;

  if (!submissions || submissions.length === 0) {
    Logger.log("No new submissions after " + latestTimestamp);
    return;
  }

  // Group by Month-Year
  const grouped = {};
  submissions.forEach(record => {
    const monthYear = getMonthYear(record._submission_time);
    if (!grouped[monthYear]) grouped[monthYear] = [];
    grouped[monthYear].push(record);
  });

  // Process each month-year
  for (const monthYear in grouped) {
    let sheet = ss.getSheetByName(monthYear);
    if (!sheet) {
      sheet = ss.insertSheet(monthYear);
      const headers = [
        'Submission Date', 'Session Date', 'IFM Name', 'County',
        'Facility Code', 'Facility',
        'Mentee ID', 'Mentee Name', 'Newborn Program',
        'Mentorship Activity', 'Topic', 'Submission ID'
      ];
      sheet.appendRow(headers);
    }

    const rows = [];

    grouped[monthYear].forEach(record => {
      const submissionId = record._id;
      if (existingSubmissions[submissionId]) return; // Skip duplicates

      const sessionDate = record['demographic_information/mentor_details/session_date'] || '';
      const firstName = record['demographic_information/mentor_details/first_name'] || '';
      const secondName = record['demographic_information/mentor_details/second_name'] || '';
      // Merge with space, no slash
      const ifmName = [firstName, secondName].filter(Boolean).map(n => toTitleCase(n.trim())).join(' ');

      const county = record['demographic_information/mentee_details/county'] || '';
      const submissionDate = formatSubmissionDate(record._submission_time);

      // Facilities
      const facilities = facilityFields
        .map(f => record[f])
        .filter(Boolean)
        .map(fac => {
          const [code, ...nameParts] = fac.split('_');
          return { code, name: toTitleCase(nameParts.join(' ')) };
        });

      // Mentees
      const mentees = [];
      menteeFields.forEach(mField => {
        const mStr = record[mField];
        if (mStr) {
          mStr.split(' ').forEach(m => {
            const [id, ...nameParts] = m.split('_');
            mentees.push({ id, name: toTitleCase(nameParts.join(' ')) });
          });
        }
      });

      // Topics
      const topics = [];
      topicFields.forEach(tField => {
        const tStr = record[tField];
        if (tStr) tStr.split(' ').filter(Boolean).forEach(t => topics.push(formatTitleWithAbbrev(t)));
      });

      // Activities
      const activities = [];
      const aStr = record[activityField];
      if (aStr) aStr.split(' ').filter(Boolean).forEach(a => activities.push(formatTitleWithAbbrev(a)));

      // Newborn Program (replace _ with space & Title Case)
      let newbornProgram = record[newbornProgramField] || '';
      newbornProgram = toTitleCase(newbornProgram.replace(/_/g, ' '));

      // Build combinations
      mentees.forEach(mentee => {
        facilities.forEach(fac => {
          topics.forEach(topic => {
            activities.forEach(activity => {
              rows.push([
                submissionDate, sessionDate, ifmName, county,
                fac.code, fac.name,
                mentee.id, mentee.name, newbornProgram,
                activity, topic, submissionId
              ]);
            });
          });
        });
      });
    });

    if (rows.length > 0) {
      const startRow = sheet.getLastRow() === 0 ? 2 : sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
      Logger.log(`Appended ${rows.length} new rows to ${monthYear}`);
    } else {
      Logger.log(`No new data to append for ${monthYear}`);
    }
  }
}

// Helpers
function getMonthYear(timestamp) {
  const date = new Date(timestamp);
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `${month} ${year}`;
}

function formatSubmissionDate(timestamp) {
  const date = new Date(timestamp);
  const yyyy = date.getFullYear();
  const mm = ('0' + (date.getMonth() + 1)).slice(-2);
  const dd = ('0' + date.getDate()).slice(-2);
  const hh = ('0' + date.getHours()).slice(-2);
  const min = ('0' + date.getMinutes()).slice(-2);
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function toTitleCase(str) {
  return str.split(' ').map(word => word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : '').join(' ');
}

function formatTitleWithAbbrev(str) {
  const ABBREVIATIONS = {
    'cmes': 'CMEs',
    'pph': 'PPH',
    'avd': 'AVD',
    'ubt': 'UBT',
    'nasg': 'NASG',
    'amtsl': 'AMTSL'
  };
  let text = str.replace(/_/g, ' ');
  return text.split(' ').map(word => {
    const key = word.toLowerCase();
    if (ABBREVIATIONS[key]) return ABBREVIATIONS[key];
    return word[0].toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}
