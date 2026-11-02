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

// One topic field per activity. The live form stores each select_multiple
// under its own group; pairing them avoids counting a drill topic as a CME.
const activityTopicFields = {
  cmes: 'newborn_training_Curriculum/newborn_cmes/cmes',
  videos: 'newborn_training_Curriculum/newborn_videos/videos',
  case_scenarios: 'newborn_training_Curriculum/newborn_case_scenarios/case_scenarios',
  role_plays: 'newborn_training_Curriculum/newborn_role_plays/role_plays',
  mentor_skills_demonstrations: 'newborn_training_Curriculum/newborn_skills_demonstrations/mentor_demonstrations',
  practicum: 'newborn_training_Curriculum/newborn_practicum/practicum',
  drills: 'newborn_training_Curriculum/newborn_drills/drills',
  group_discussions: 'newborn_training_Curriculum/newborn_group_discussions/group_discussions'
};

// Mentorship activity & newborn program fields
const activityField = 'newborn_training_Curriculum/program_activities/newborn_activities';
const newbornProgramField = 'demographic_information/mentor_details/program';

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

      // Keep the Kobo program code. The progress SQL matches
      // essential_newborn_care / comprehensive_newborn_care exactly.
      const newbornProgram = (record[newbornProgramField] || '').toString().trim();

      const selectedActivities = (record[activityField] || '')
        .toString()
        .split(' ')
        .filter(Boolean);

      const activityTopics = [];
      selectedActivities.forEach(activityCode => {
        const field = activityTopicFields[activityCode];
        const rawTopics = field ? (record[field] || '') : '';
        rawTopics.toString().split(' ').filter(Boolean).forEach(topicCode => {
          activityTopics.push({
            activity: activityLabel(activityCode, newbornProgram),
            topic: formatTitleWithAbbrev(topicCode)
          });
        });
      });

      // One row per mentee × facility × activity × topic
      mentees.forEach(mentee => {
        facilities.forEach(fac => {
          activityTopics.forEach(item => {
            rows.push([
              submissionDate, sessionDate, ifmName, county,
              fac.code, fac.name,
              mentee.id, mentee.name, newbornProgram,
              item.activity, item.topic, submissionId
            ]);
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

function activityLabel(activityCode, program) {
  if (activityCode === 'cmes') return 'CMEs';
  if (activityCode === 'drills') return 'Drills';
  if (activityCode === 'videos') return 'Videos';
  if (activityCode === 'role_plays') return 'Role plays';
  if (activityCode === 'case_scenarios') return 'Case scenarios';
  if (activityCode === 'group_discussions') return 'Group discussions';
  if (activityCode === 'mentor_skills_demonstrations') return 'skill_demonstrations';
  if (activityCode === 'practicum') {
    return program === 'comprehensive_newborn_care' ? 'Practicums' : 'practicums';
  }
  return formatTitleWithAbbrev(activityCode);
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
