function fetchKoboData_All() {

  const apiToken = '1faf1291cb5e472b7f5a253f3888380d28e7900b';
  const formUid  = 'aJaBJKDs7pCRMi8zm3BXze';
  const startDate = '2026-04-01T00:00:00';
  const sheetName = 'EmONC Activities';

  const headers = [
    'Submission ID', 'Submission Date', 'Session Date', 'Mentor Name',
    'County', 'Facility Code', 'Facility', 'Mentee ID', 'Mentee Name',
    'Activity', 'Topic'
  ];

  // Activity code → topic field (only topics from selected activities are emitted)
  const activityTopicFields = {
    cmes: 'emonc_training_curriculum/group_cmes/cmes',
    videos: 'emonc_training_curriculum/group_videos/videos',
    case_scenarios: 'emonc_training_curriculum/group_case_scenarios/case_scenarios',
    skill_demos_mentor: 'emonc_training_curriculum/group_mentor_demo/mentor_skills_demo',
    skills_demos_mentee: 'emonc_training_curriculum/group_return_demo/mentee_skills_return_demo',
    drills: 'emonc_training_curriculum/group_drills/drills'
  };

  // Topic labels aligned with mentee_curriculum_tracking Power Query
  const topicMap = {
    Partograph_use_and_interpretation: 'Labor Monitoring',
    Maternal_Shock_Resuscitaion: 'Maternal Shock',
    Preeclampsia_Eclampsia_Management: 'Preeclampsia/Eclampsia Management',
    'Preeclampsia_/_eclampsia': 'Preeclampsia/Eclampsia Management',
    Hypertension_in_pregnancy: 'Preeclampsia/Eclampsia Management',
    PPH: 'Postpartum Haemorrhage (PPH)',
    Vaginal_AVD: 'Vacuum-Assisted Delivery',
    Vacuum_Assisted_Delivery: 'Vacuum-Assisted Delivery',
    'B-lynch_suture': 'B-Lynch Suture',
    Compression_of_Abdominal_Aorta: 'Abdominal Aortic Compression',
    Perineal_tear_repair: 'Perineal Tear Repair',
    Ubt_placement: 'UBT Placement',
    UBT: 'UBT Placement',
    'ubt_placement_(free_flow)': 'UBT Placement (Free Flow)',
    'Ubt_placement_(free_flow))': 'UBT Placement (Free Flow)',
    'Postpartum haemorrhage (PPH)': 'Postpartum Haemorrhage (PPH)',
    'Postpartum Hemorrhage (PPH)': 'Postpartum Haemorrhage (PPH)',
    'PPH Drill': 'Postpartum Haemorrhage (PPH)',
    'Newborn resuscitation': 'Neonatal Resuscitation',
    'Preeclampsia / Eclampsia': 'Preeclampsia/Eclampsia Management'
  };

  const facilityPrefixes = [
    'demographic_information/facility_details/',
    'demographic_information/mentee_details/'
  ];
  const menteePrefixes = [
    'demographic_information/mentee_details/',
    'demographic_information/mentee_details_001/'
  ];

  const tz = Session.getScriptTimeZone();
  const title = s => String(s || '').toLowerCase().replace(/_/g, ' ')
    .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const fmt = (iso, pattern) =>
    iso ? Utilities.formatDate(new Date(iso), tz, pattern) : '';
  const tokens = v => String(v || '').split(' ').filter(Boolean);
  const parseCoded = v => {
    const parts = String(v).split('_');
    return { id: parts[0], name: title(parts.slice(1).join(' ')) };
  };
  const formatTopic = raw => {
    if (!raw) return '';
    if (topicMap[raw]) return topicMap[raw];
    const spaced = raw.replace(/_/g, ' ');
    return topicMap[spaced] || spaced;
  };
  const isLeafUnder = (key, prefixes) => prefixes.some(p => {
    if (!key.startsWith(p)) return false;
    const leaf = key.slice(p.length);
    return leaf && !leaf.includes('/');
  });

  // ================= FETCH =================
  const options = {
    method: 'get',
    headers: { Authorization: 'Token ' + apiToken },
    contentType: 'application/json'
  };

  let url =
    `https://kc.humanitarianresponse.info/api/v2/assets/${formUid}/data/` +
    `?format=json&query=${encodeURIComponent(JSON.stringify({
      _submission_time: { $gte: startDate }
    }))}&ordering=-_submission_time&limit=100`;

  const results = [];
  while (url) {
    const json = JSON.parse(UrlFetchApp.fetch(url, options).getContentText());
    if (json.results?.length) results.push(...json.results);
    url = json.next;
    Logger.log(`Fetched ${results.length} records so far...`);
  }

  if (!results.length) {
    Logger.log('No data found in KoBo.');
    return;
  }

  // ================= SHEET (load existing IDs early to skip work) =================
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  const existingIds = new Set();
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 1).getValues()
      .forEach(([id]) => { if (id) existingIds.add(id); });
  }

  // ================= TRANSFORM =================
  const rows = [];
  const seen = new Set(); // submission|mentee|activity|topic

  results.forEach(r => {
    const submissionId = r._uuid || r._id;
    if (existingIds.has(submissionId)) return;

    let facilityCode = '';
    let facilityName = '';
    const mentees = [];
    const seenMentees = new Set();

    // One pass over keys for facility + mentees
    Object.keys(r).forEach(key => {
      const val = r[key];
      if (!val) return;

      if (isLeafUnder(key, facilityPrefixes) && key.endsWith('_facilities')) {
        const f = parseCoded(val);
        facilityCode = f.id;
        facilityName = f.name;
        return;
      }

      if (
        isLeafUnder(key, menteePrefixes) &&
        !key.endsWith('/county') &&
        !key.endsWith('_facilities')
      ) {
        tokens(val).forEach(m => {
          const parsed = parseCoded(m);
          if (!parsed.id || seenMentees.has(parsed.id)) return;
          seenMentees.add(parsed.id);
          mentees.push(parsed);
        });
      }
    });

    if (!mentees.length) return;

    // Pair each selected activity only with topics from its own field
    const pairs = [];
    const seenPairs = new Set();

    [...new Set(tokens(
      r['emonc_training_curriculum/emonc_curriculum_activities/emonc_activities']
    ))].forEach(activity => {
      const field = activityTopicFields[activity];
      if (!field || !r[field]) return;

      const activityLabel = title(activity);
      tokens(r[field]).forEach(topic => {
        const topicLabel = formatTopic(topic);
        const pairKey = activity + '|' + topicLabel;
        if (seenPairs.has(pairKey)) return;
        seenPairs.add(pairKey);
        pairs.push([activityLabel, topicLabel]);
      });
    });

    if (!pairs.length) return;

    const submissionDate = fmt(r._submission_time, 'dd/MM/yyyy HH:mm');
    const sessionDate = fmt(
      r['demographic_information/mentor_details/session_date'],
      'dd/MM/yyyy'
    );
    const mentorName = title(
      r['demographic_information/mentor_details/mentor_name']
    );
    const county =
      r['demographic_information/facility_details/county'] ||
      r['demographic_information/mentee_details/county'] ||
      '';

    mentees.forEach(m => {
      pairs.forEach(([activity, topic]) => {
        const key = [submissionId, m.id, activity, topic].join('|');
        if (seen.has(key)) return;
        seen.add(key);
        rows.push([
          submissionId, submissionDate, sessionDate, mentorName,
          county, facilityCode, facilityName, m.id, m.name, activity, topic
        ]);
      });
    });
  });

  if (rows.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length)
      .setValues(rows);
  }

  Logger.log(`${sheetName}: ${rows.length} rows added`);
}
