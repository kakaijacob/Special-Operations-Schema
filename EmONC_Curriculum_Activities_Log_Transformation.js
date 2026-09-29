function fetchKoboData_All() {

  const apiToken = '1faf1291cb5e472b7f5a253f3888380d28e7900b';
  const formUid  = 'aJaBJKDs7pCRMi8zm3BXze';

  const startDate = "2026-04-01T00:00:00";

  const queryObj = {
    "_submission_time": {
      "$gte": startDate
    }
  };

  const query = JSON.stringify(queryObj);
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let url = `https://kc.humanitarianresponse.info/api/v2/assets/${formUid}/data/` +
            `?format=json&query=${encodeURIComponent(query)}` +
            `&ordering=-_submission_time&limit=100`;

  const options = {
    method: "get",
    headers: {
      "Authorization": "Token " + apiToken
    },
    contentType: "application/json"
  };

  let allResults = [];

  // ================= PAGINATION =================
  while (url) {

    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());

    if (json.results && json.results.length > 0) {
      allResults = allResults.concat(json.results);
    }

    url = json.next;

    Logger.log(`Fetched ${allResults.length} records so far...`);
  }

  if (allResults.length === 0) {
    Logger.log("No data found in KoBo.");
    return;
  }

  const results = allResults;

  // ================= HELPERS =================
  const tz = Session.getScriptTimeZone();

  const toTitleCase = str =>
    str.toLowerCase()
      .split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const formatDateTime = iso =>
    iso ? Utilities.formatDate(new Date(iso), tz, "dd/MM/yyyy HH:mm") : "";

  const formatDate = iso =>
    iso ? Utilities.formatDate(new Date(iso), tz, "dd/MM/yyyy") : "";

  const getMonthSheetName = iso =>
    Utilities.formatDate(new Date(iso), tz, "MMMM-yyyy");

  const getSubmissionId = r => r._uuid || r._id;

  // Topic label maps aligned with mentee_curriculum_tracking Power Query
  const topicExactMap = {
    "Partograph_use_and_interpretation": "Labor Monitoring",
    "Maternal_Shock_Resuscitaion": "Maternal Shock",
    "Preeclampsia_Eclampsia_Management": "Preeclampsia/Eclampsia Management",
    "Preeclampsia_/_eclampsia": "Preeclampsia/Eclampsia Management",
    "Hypertension_in_pregnancy": "Preeclampsia/Eclampsia Management",
    "PPH": "Postpartum Haemorrhage (PPH)",
    "Vaginal_AVD": "Vacuum-Assisted Delivery",
    "Vacuum_Assisted_Delivery": "Vacuum-Assisted Delivery",
    "B-lynch_suture": "B-Lynch Suture",
    "Compression_of_Abdominal_Aorta": "Abdominal Aortic Compression",
    "Perineal_tear_repair": "Perineal Tear Repair",
    "Ubt_placement": "UBT Placement",
    "UBT": "UBT Placement",
    "ubt_placement_(free_flow)": "UBT Placement (Free Flow)",
    "Ubt_placement_(free_flow))": "UBT Placement (Free Flow)"
  };

  const topicAfterSpaceMap = {
    "Postpartum haemorrhage (PPH)": "Postpartum Haemorrhage (PPH)",
    "Newborn resuscitation": "Neonatal Resuscitation",
    "Postpartum Hemorrhage (PPH)": "Postpartum Haemorrhage (PPH)",
    "PPH Drill": "Postpartum Haemorrhage (PPH)",
    "Preeclampsia / Eclampsia": "Preeclampsia/Eclampsia Management"
  };

  const formatTopic = raw => {
    if (!raw) return "";
    if (Object.prototype.hasOwnProperty.call(topicExactMap, raw)) {
      return topicExactMap[raw];
    }
    const spaced = raw.replace(/_/g, " ");
    if (Object.prototype.hasOwnProperty.call(topicAfterSpaceMap, spaced)) {
      return topicAfterSpaceMap[spaced];
    }
    return spaced;
  };

  // Group prefixes — scan each submission for every field under these groups
  // instead of maintaining hardcoded facility / mentee field lists.
  const facilityGroupPrefixes = [
    "demographic_information/facility_details/",
    "demographic_information/mentee_details/"
  ];

  const menteeGroupPrefixes = [
    "demographic_information/mentee_details/",
    "demographic_information/mentee_details_001/"
  ];

  const leafName = (key, prefix) => key.slice(prefix.length);

  const isDirectGroupChild = (key, prefixes) =>
    prefixes.some(prefix =>
      key.startsWith(prefix) &&
      leafName(key, prefix).length > 0 &&
      !leafName(key, prefix).includes("/")
    );

  const isFacilityField = key =>
    isDirectGroupChild(key, facilityGroupPrefixes) &&
    key.endsWith("_facilities");

  // Any select-one / select-many under mentee groups except county & facility fields
  const isMenteeField = key => {
    if (!isDirectGroupChild(key, menteeGroupPrefixes)) return false;
    if (key.endsWith("/county") || key.endsWith("_facilities")) return false;
    return true;
  };

  // ================= ACTIVITY → TOPIC FIELD =================
  // Only topics from the field that belongs to a selected activity are emitted.
  const activityTopicFields = {
    cmes: "emonc_training_curriculum/group_cmes/cmes",
    videos: "emonc_training_curriculum/group_videos/videos",
    case_scenarios: "emonc_training_curriculum/group_case_scenarios/case_scenarios",
    skill_demos_mentor: "emonc_training_curriculum/group_mentor_demo/mentor_skills_demo",
    skills_demos_mentee: "emonc_training_curriculum/group_return_demo/mentee_skills_return_demo",
    drills: "emonc_training_curriculum/group_drills/drills"
  };

  const dataByMonth = {};

  // Guarantees one row per (Submission ID, Mentee ID, Activity, Topic)
  const seenOutputKeys = new Set();

  // ================= PROCESS DATA =================
  results.forEach(r => {

    const submissionId = getSubmissionId(r);
    const submissionTime = r._submission_time;
    const monthKey = getMonthSheetName(submissionTime);

    if (!dataByMonth[monthKey]) {
      dataByMonth[monthKey] = [];
    }

    const submissionDate = formatDateTime(submissionTime);

    const sessionDate = formatDate(
      r["demographic_information/mentor_details/session_date"]
    );

    const mentorName = toTitleCase(
      (r["demographic_information/mentor_details/mentor_name"] || "")
      .replace(/_/g, " ")
    );

    const county =
      r["demographic_information/facility_details/county"] ||
      r["demographic_information/mentee_details/county"] ||
      "";

    let facilityCode = "";
    let facilityName = "";

    Object.keys(r).forEach(f => {
      if (!isFacilityField(f) || !r[f]) return;

      const parts = String(r[f]).split("_");

      facilityCode = parts[0];

      facilityName = toTitleCase(
        parts.slice(1).join(" ").replace(/_/g, " ")
      );
    });

    // One mentee ID per submission (keep first name seen)
    let mentees = [];
    const seenMenteeIds = new Set();

    Object.keys(r).forEach(f => {
      if (!isMenteeField(f) || !r[f]) return;

      String(r[f]).split(" ").forEach(m => {
        if (!m) return;

        const parts = m.split("_");
        const menteeId = parts[0];
        if (!menteeId || seenMenteeIds.has(menteeId)) return;

        seenMenteeIds.add(menteeId);
        mentees.push({
          id: menteeId,
          name: toTitleCase(
            parts.slice(1).join(" ").replace(/_/g, " ")
          )
        });
      });
    });

    const activities = Array.from(new Set(
      (r["emonc_training_curriculum/emonc_curriculum_activities/emonc_activities"] || "")
        .split(" ")
        .filter(Boolean)
    ));

    // Pair each selected activity only with topics from its own field
    const activityTopicPairs = [];
    const seenActivityTopicPairs = new Set();

    activities.forEach(a => {
      const topicField = activityTopicFields[a];
      if (!topicField || !r[topicField]) return;

      const activityLabel = toTitleCase(a.replace(/_/g, " "));

      r[topicField].split(" ").filter(Boolean).forEach(topic => {
        const formattedTopic = formatTopic(topic);
        // Key on activity code + topic so label formatting cannot create dupes
        const pairKey = `${a}|${formattedTopic}`;

        if (!seenActivityTopicPairs.has(pairKey)) {
          seenActivityTopicPairs.add(pairKey);
          activityTopicPairs.push({
            activity: activityLabel,
            topic: formattedTopic
          });
        }
      });
    });

    mentees.forEach(m => {
      activityTopicPairs.forEach(pair => {
        const outputKey = [
          submissionId,
          m.id,
          pair.activity,
          pair.topic
        ].join("|");

        if (seenOutputKeys.has(outputKey)) {
          return;
        }
        seenOutputKeys.add(outputKey);

        dataByMonth[monthKey].push([
          submissionId,
          submissionDate,
          sessionDate,
          mentorName,
          county,
          facilityCode,
          facilityName,
          m.id,
          m.name,
          pair.activity,
          pair.topic
        ]);
      });
    });

  });

  const headers = [
    "Submission ID",
    "Submission Date",
    "Session Date",
    "Mentor Name",
    "County",
    "Facility Code",
    "Facility",
    "Mentee ID",
    "Mentee Name",
    "Activity",
    "Topic"
  ];

  // ================= MONTHLY SHEETS =================
  Object.keys(dataByMonth).forEach(month => {

    const sheet =
      ss.getSheetByName(month) ||
      ss.insertSheet(month);

    if (sheet.getLastRow() === 0) {

      sheet
        .getRange(1, 1, 1, headers.length)
        .setValues([headers]);

    }

    const existingIds = new Set();

    const lastRow = sheet.getLastRow();

    if (lastRow > 1) {

      const existingData =
        sheet
          .getRange(2, 1, lastRow, 1)
          .getValues();

      existingData.forEach(r =>
        existingIds.add(r[0])
      );

    }

    const newRows =
      dataByMonth[month].filter(
        row => !existingIds.has(row[0])
      );

    if (newRows.length > 0) {

      sheet
        .getRange(
          sheet.getLastRow() + 1,
          1,
          newRows.length,
          headers.length
        )
        .setValues(newRows);

    }

    Logger.log(
      `${month}: ${newRows.length} rows added`
    );

  });
}
