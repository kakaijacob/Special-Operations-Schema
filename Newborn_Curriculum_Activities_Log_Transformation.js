function fetchKoboData_All() {

  const apiToken = '1faf1291cb5e472b7f5a253f3888380d28e7900b';
  const formUid  = 'a488FNw8rSGKWdJqpYfpny';

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

  // Topic / activity / module / program labels from Newborn CTF choices
  const topicExactMap = {
    "infection_prevention_and_control": "Infection Prevention and Control (IPC)",
    "infant_and_family_centred_developmental_care": "Infant and Family Centred Developmental Care (IFCDC)",
    "essential_newborn_care": "Essential Newborn Care (ENC)",
    "newborn_care_transition": "Newborn Care Transition",
    "indications_and_safe_use_of_oxygen": "Indications and Safe Use of Oxygen",
    "the_use_of_pulse_oximetry": "The Use of Pulse Oximetry",
    "neonatal_thermoregulation": "Neonatal Thermoregulation",
    "the_use_of_a_radiant_warmer": "The Use of a Radiant Warmer",
    "use_of_incubator_and_different_settings": "Use of Incubator and Different Settings",
    "newborn_resuscitation": "Newborn Resuscitation",
    "danger_signs_inclusive_of_neonatal_convulsions_and_neonatal_sepsis": "Danger Signs Inclusive of Neonatal Convulsions and Neonatal Sepsis",
    "introduction_to_care_of_small_and_sick_newborns_and_discussion_of_use_of_plastic_wraps": "Introduction to Care of Small and Sick Newborns and Discussion of Use of Plastic Wraps",
    "ballard_score": "Ballard Score",
    "continuous_positive_airway_pressure": "Continuous Positive Airway Pressure (CPAP)",
    "apnea_of_prematurity_and_use_of_caffeine_citrate": "Apnea of Prematurity and Use of Caffeine Citrate",
    "kangaroo_mother_care": "Kangaroo Mother Care (KMC)",
    "neonatal_jaundice": "Neonatal Jaundice",
    "neonatal_feeding_algorithm": "Neonatal Feeding Algorithm",
    "newborn_feeding_and_discussion_of_feeding_algorithm": "Newborn Feeding and Discussion of Feeding Algorithm",
    "use_of_oxygen_blenders": "Use of Oxygen Blenders",
    "neonatal_danger_signs": "Neonatal Danger Signs",
    "use_of_plastic_wraps": "Use of Plastic Wraps",
    "testing_blood_glucose_using_heel_prick": "Testing Blood Glucose Using Heel Prick",
    "newborn_feeding": "Newborn Feeding",
    "breastfeeding_techniques": "Breastfeeding Techniques",
    "milk_expression_and_cup_feeding": "Milk Expression and Cup Feeding",
    "oral_gastric_nasogastric_tube_insertion_and_use": "Oral Gastric/Nasogastric Tube Insertion and Use",
    "resuscitation_of_a_term_baby_with_prolonged_second_stage": "Resuscitation of a Term Baby with Prolonged Second Stage",
    "resuscitation_of_a_baby_who_is_unresponsive_in_the_ward": "Resuscitation of a Baby Who Is Unresponsive in the Ward",
    "neonatal_danger_signs_and_neonatal_sepsis": "Neonatal Danger Signs and Neonatal Sepsis",
    "neonatal_convulsions": "Neonatal Convulsions",
    "management_of_a_neonate_with_persistent_convulsions_despite_receiving_an_initial_loading_dose_of_phenobarbitone": "Management of a Neonate with Persistent Convulsions Despite Receiving an Initial Loading Dose of Phenobarbitone (2-Day-Old)",
    "management_of_a_neonate_with_persistent_convulsions_despite_receiving_initial_loading_dose_and_mini_loading_dose_of_phenobarbitone": "Management of a Neonate with Persistent Convulsions Despite Receiving Initial Loading Dose and Mini Loading Dose of Phenobarbitone",
    "delivery_of_a_preterm_baby_initiation_of_cpap_and_starting_of_prophylactic_caffeine_citrate": "Delivery of a preterm baby, Initiation of CPAP and starting of prophylactic caffeine citrate",
    "how_to_wean_off_phototherapy_in_a_baby_with_neonatal_jaundice": "How to Wean Off Phototherapy in a Baby with Neonatal Jaundice",
    "effective_communication_with_a_mother_family_good_communication_skills": "Effective Communication with a Mother/Family – Good Communication Skills",
    "effective_communication_with_a_mother_family_bad_communication_skills": "Effective Communication with a Mother/Family – Bad Communication Skills",
    "oxygen_delivery_devices_prescribing_and_monitoring_oxygen": "Oxygen Delivery Devices, Prescribing, and Monitoring Oxygen",
    "warmth_airway_management_breathing_and_circulation": "Warmth, Airway Management, Breathing and Circulation",
    "monitoring_skills_using_the_air_device": "Monitoring Skills Using the AIR Device",
    "how_to_draw_samples_for_blood_culture": "How to Draw Samples for Blood Culture",
    "buccal_glucose_therapy": "Buccal Glucose Therapy",
    "hand_hygiene": "Hand Hygiene",
    "swaddling_and_nesting": "Swaddling and Nesting",
    "use_of_pulse_oximetry": "Use of Pulse Oximetry",
    "the_use_of_an_incubator_and_different_settings": "The Use of an Incubator and Different Settings",
    "identification_of_danger_signs": "Identification of Danger Signs (Bedside)",
    "bedside_mentorship_for_use_of_ballard_score": "Bedside Mentorship for Use of Ballard Score",
    "skill_of_assembly_and_use_of_cpap_and_monitoring_babies_on_cpap": "Skill of Assembly and Use of CPAP and Monitoring Babies on CPAP",
    "calculation_and_administration_of_caffeine_citrate": "Calculation and Administration of Caffeine Citrate",
    "the_use_of_nomograms_to_determine_therapy": "The Use of Nomograms to Determine Therapy",
    "skills_training_bedside_mentorship_on_phototherapy_use": "Skills Training / Bedside Mentorship on Phototherapy Use",
    "determining_mode_and_volume_of_feeding_and_hunger_cues": "Determining Mode and Volume of Feeding and Hunger Cues",
    "feeds_and_fluids_drills": "Feeds and Fluids Drills",
    "referral_form_completion_and_communication": "Referral Form Completion and Communication",
    "practical_chart_audits_for_inpatients_file_mch_handbook": "Practical Chart Audits for Inpatients File / MCH Handbook",
    "neonatal_resuscitation": "Neonatal Resuscitation",
    "identification_of_newborn_danger_signs_and_management_of_neonatal_sepsis": "Identification of Newborn Danger Signs and Management of Neonatal Sepsis",
    "care_of_the_small_and_sick_newborn": "Care of the Small and Sick Newborn",
    "neonatal_hypoglycaemia": "Neonatal Hypoglycaemia",
    "breastfeeding_techniques_and_lactation_support": "Breastfeeding Techniques and Lactation Support",
    "triple_elimination_of_hiv_syphilis_and_hepatitis_b": "Tripple elimination of HIV, Syphilis and Hepatitis B",
    "newborn_transport": "Newborn Transport",
    "indications_for_referral": "Indications for Referral",
    "referral_process_and_newborn_transport": "Referral Process and Newborn Transport",
    "primary_data_collection_tools": "Primary Data Collection Tools",
    "multidisciplinary_neonatal_death_audits": "Multidisciplinary Neonatal Death Audits",
    "neonatal_mentorship_monitoring_and_evaluation_indicators": "Neonatal Mentorship Monitoring and Evaluation (M&E) Indicators"
  };

  const activityLabelMap = {
    cmes: "CMEs",
    videos: "Videos",
    case_scenarios: "Case Scenarios",
    role_plays: "Role Plays",
    drills: "Drills",
    mentor_skills_demonstrations: "Skills Demonstrations",
    practicum: "Practicum",
    group_discussions: "Group Discussions"
  };

  const programLabelMap = {
    essential_newborn_care: "Essential Newborn Care (ENC)",
    comprehensive_newborn_care: "Comprehensive Newborn Care (CNC)"
  };

  const moduleLabelMap = {
    module_one: "Module 1: Infection Prevention and Control (IPC)",
    module_two: "Module 2: Infant and Family Centred Developmental Care (IFCDC)",
    module_three: "Module 3: Essential Newborn Care (ENC)",
    module_four: "Module 4: Oxygen Therapy",
    module_five: "Module 5: Neonatal Thermoregulation",
    module_six: "Module 6: Newborn Resuscitation",
    module_seven: "Module 7: Identification of Newborn Danger Signs and Management of Neonatal Sepsis",
    module_eight: "Module 8: Care of the Small and Sick Newborns",
    module_nine: "Module 9: Neonatal Jaundice",
    module_ten: "Module 10: Neonatal Hypoglycaemia",
    module_eleven: "Module 11: Neonatal Feeds and Fluids",
    module_twelve: "Module 12: Documentation and Referral",
    module_thirteen: "Module 13: Monitoring and Evaluation"
  };

  const formatTopic = raw => {
    if (!raw) return "";
    if (Object.prototype.hasOwnProperty.call(topicExactMap, raw)) {
      return topicExactMap[raw];
    }
    return toTitleCase(raw.replace(/_/g, " "));
  };

  const formatActivity = raw => {
    if (!raw) return "";
    if (Object.prototype.hasOwnProperty.call(activityLabelMap, raw)) {
      return activityLabelMap[raw];
    }
    return toTitleCase(raw.replace(/_/g, " "));
  };

  const formatProgram = raw => {
    if (!raw) return "";
    if (Object.prototype.hasOwnProperty.call(programLabelMap, raw)) {
      return programLabelMap[raw];
    }
    return toTitleCase(raw.replace(/_/g, " "));
  };

  const formatModule = raw => {
    if (!raw) return "";
    if (Object.prototype.hasOwnProperty.call(moduleLabelMap, raw)) {
      return moduleLabelMap[raw];
    }
    return toTitleCase(raw.replace(/_/g, " "));
  };

  // ================= FACILITY FIELDS =================
  const facilityFields = [
    "demographic_information/mentee_details/kakamega_facilities",
    "demographic_information/mentee_details/makueni_facilities",
    "demographic_information/mentee_details/mombasa_facilities",
    "demographic_information/mentee_details/muranga_facilities"
  ];

  // ================= MENTEE FIELDS =================
  const menteeSuffixes = [
    "chombeli_nbc_mentees", "kuvasali_nbc_mentees", "shivanga_nbc_mentees",
    "emali_sub_nbc_mentees", "kalawa_nbc_mentees", "kambu_sub_nbc_mentees",
    "kibwezi_nbc_mentees", "kilungu_nbc_mentees", "kisau_sub_nbc_mentees",
    "makindu_nbc_mentees", "makueni_nbc_mentees", "matiliku_nbc_mentees",
    "mbooni_nbc_mentees", "mtito_andei_nbc_mentees", "mukuyuni_nbc_mentees",
    "nthongoni_nbc_mentees", "sultan_nbc_mentees", "tawa_sub_nbc_mentees",
    "tulimani_nbc_mentees", "coast_general_nbc_mentees", "likoni_nbc_mentees",
    "mbuta_health_nbc_mentees", "mlaleo_nbc_mentees", "mrima_maternity_nbc_mentees",
    "port_reitz_nbc_mentees", "shimo_la_nbc_mentees", "gaichanjiru_nbc_mentees",
    "ithanga_nbc_mentees", "kamahuha_nbc_mentees", "kandara_nbc_mentees",
    "kangema_nbc_mentees", "kenol_hospital_nbc_mentees", "kigumo_nbc_mentees",
    "kiriaini_nbc_mentees", "kirwara_nbc_mentees", "makuyu_nbc_mentees",
    "maragua_nbc_mentees", "muriranjas_nbc_mentees"
  ];

  const menteeFields = Array.from(new Set(
    menteeSuffixes.map(
      suffix => "demographic_information/mentee_details/" + suffix
    )
  ));

  // ================= ACTIVITY → TOPIC FIELD =================
  // Only topics from the field that belongs to a selected activity are emitted.
  const activityTopicFields = {
    cmes: "newborn_training_Curriculum/newborn_cmes/cmes",
    videos: "newborn_training_Curriculum/newborn_videos/videos",
    case_scenarios: "newborn_training_Curriculum/newborn_case_scenarios/case_scenarios",
    role_plays: "newborn_training_Curriculum/newborn_role_plays/role_plays",
    mentor_skills_demonstrations: "newborn_training_Curriculum/newborn_skills_demonstrations/mentor_demonstrations",
    practicum: "newborn_training_Curriculum/newborn_practicum/practicum",
    drills: "newborn_training_Curriculum/newborn_drills/drills",
    group_discussions: "newborn_training_Curriculum/newborn_group_discussions/group_discussions"
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

    const mentorName = [
      r["demographic_information/mentor_details/first_name"] || "",
      r["demographic_information/mentor_details/second_name"] || ""
    ]
      .map(n => toTitleCase(String(n).replace(/_/g, " ").trim()))
      .filter(Boolean)
      .join(" ");

    const county =
      r["demographic_information/mentee_details/county"] ||
      "";

    const newbornProgram = formatProgram(
      r["demographic_information/mentor_details/program"] || ""
    );

    const module = formatModule(
      r["newborn_training_Curriculum/newborn_modules_section/newborn_modules"] || ""
    );

    let facilityCode = "";
    let facilityName = "";

    facilityFields.forEach(f => {
      if (r[f]) {
        const parts = r[f].split("_");
        facilityCode = parts[0];
        facilityName = toTitleCase(
          parts.slice(1).join(" ").replace(/_/g, " ")
        );
      }
    });

    // Also pick up any unexpected facility field present on the record
    if (!facilityCode) {
      Object.keys(r).forEach(k => {
        if (
          k.indexOf("demographic_information/mentee_details/") === 0 &&
          k.slice(-11) === "_facilities" &&
          r[k]
        ) {
          const parts = String(r[k]).split("_");
          facilityCode = parts[0];
          facilityName = toTitleCase(
            parts.slice(1).join(" ").replace(/_/g, " ")
          );
        }
      });
    }

    // One mentee ID per submission (keep first name seen)
    let mentees = [];
    const seenMenteeIds = new Set();

    const collectMenteeValue = mStr => {
      String(mStr).split(" ").filter(Boolean).forEach(m => {
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
    };

    menteeFields.forEach(f => {
      if (r[f]) collectMenteeValue(r[f]);
    });

    // Fallback: any mentee select present on the submission
    Object.keys(r).forEach(k => {
      if (
        k.indexOf("demographic_information/mentee_details/") === 0 &&
        k.slice(-8) === "_mentees" &&
        r[k]
      ) {
        collectMenteeValue(r[k]);
      }
    });

    const activities = Array.from(new Set(
      (r["newborn_training_Curriculum/program_activities/newborn_activities"] || "")
        .split(" ")
        .filter(Boolean)
    ));

    // Pair each selected activity only with topics from its own field
    const activityTopicPairs = [];
    const seenActivityTopicPairs = new Set();

    activities.forEach(a => {
      const topicField = activityTopicFields[a];
      if (!topicField || !r[topicField]) return;

      const activityLabel = formatActivity(a);

      r[topicField].split(" ").filter(Boolean).forEach(topic => {
        const formattedTopic = formatTopic(topic);
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
          newbornProgram,
          module,
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
    "Newborn Program",
    "Module",
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

      existingData.forEach(row =>
        existingIds.add(row[0])
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
