function fetchKoboData_Generic() {

  // ================= CONFIG =================
  const apiToken = getKoboApiToken_();
  const formUid = getKoboAssetUidSecret_('KOBO_ASSET_UID_MOH_SAC');
  const startDate = "2026-01-01T00:00:00";

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheetName = 'NNR Assessment';
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  // ================= QUERY =================
  const queryObj = {
    "_submission_time": { "$gte": startDate },
    "group_mentorship_details/mentor_details/program": "newborn_curriculum"
  };

  let url =
    `https://kc.humanitarianresponse.info/api/v2/assets/${formUid}/data/` +
    `?format=json&query=${encodeURIComponent(JSON.stringify(queryObj))}` +
    `&ordering=-_submission_time&limit=100`;

  const options = {
    method: "get",
    headers: {
      "Authorization": "Token " + apiToken
    }
  };

  // ================= FETCH ALL DATA =================
  let allResults = [];

  while (url) {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());

    if (json.results?.length) {
      allResults = allResults.concat(json.results);
    }

    url = json.next;
  }

  if (allResults.length === 0) {
    Logger.log("No data found.");
    return;
  }

  // ================= DEDUPLICATION =================
  const existingIds = new Set();
  const lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    const existing = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    existing.forEach(r => existingIds.add(r[0]));
  }

  // ================= HELPERS =================
  function formatDate(dateString) {
    if (!dateString) return "";

    const d = new Date(dateString);

    return Utilities.formatDate(
      d,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd HH:mm"
    );
  }

  function toTitleCase(str) {
    if (!str) return "";

    return str
      .toString()
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  // ================= HEADERS =================
  const headers = [
    "_uuid",
    "date_started",
    "date_ended",
    "date_submitted",
    "session_date",
    "mentor_name",
    "assessment_type",
    "county",
    "facility_code",
    "facility",

    "mentee_id",
    "mentee_name",

    "mentor_id",
    "skill_evaluation",

    "review_anc_history",
    "check_safety",
    "check_equipment_warmth",
    "check_airway",
    "check_breathing",
    "check_circulation",
    "essential_newborn_care",
    "check_apgar_timing",
    "dry_stimulate",
    "wet_dry_cloth",
    "immediate_nb_management",
    "initial_abc_assessment",
    "abc_assessment",
    "shout_help_nnr",
    "begin_bvm",
    "assess_pulse",
    "continue_bvm",
    "reassess_abc",
    "vetilations",
    "reassess_abc_2",
    "post_resus_stablization",
    "continue_observation",
    "documentation_nnr",
    "score"
  ];

  // ================= FLATTEN =================
  function flatten(obj, prefix = "") {
    let result = {};

    for (let key in obj) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}/${key}` : key;

      if (value && typeof value === "object" && !Array.isArray(value)) {
        Object.assign(result, flatten(value, newKey));
      } else {
        result[newKey] = Array.isArray(value) ? value.join(" ") : value;
      }
    }

    return result;
  }

  // ================= PROCESS DATA =================
  const rows = [];

  allResults.forEach(r => {

    if (existingIds.has(r._uuid)) return;

    const flat = flatten(r);

    // ================= FACILITY =================
    const facilityRaw =
      flat["group_mentorship_details/mentee_details/muranga_facilities"] ||
      flat["group_mentorship_details/mentee_details/makueni_facilities"] ||
      flat["group_mentorship_details/mentee_details/kakamega_facilities"] ||
      flat["group_mentorship_details/mentee_details/mombasa_facilities"] ||
      "";

    let facility_code = "";
    let facility = "";

    if (facilityRaw) {
      const parts = facilityRaw.split("_");
      facility_code = parts[0] || "";
      facility = toTitleCase(parts.slice(1).join(" "));
    }

    // ================= SCORE =================
 // ================= SCORE =================
const hasSelected = (field, value) =>
  (` ${field || ""} `).includes(` ${value} `);

let totalScore = 0;

// ANC history (0.5 each)
const reviewAnc = flat["skills_assessment/group_nnr/review_anc_history"] || "";
[
  "gestational_age",
  "maternal_comorbidities_complications",
  "prenatal_care_visits",
  "anc_profile_lab_works"
].forEach(v => { if (hasSelected(reviewAnc, v)) totalScore += 0.5; });

// Safety (0.5 each)
const safety = flat["skills_assessment/group_nnr/check_safety"] || "";
[
  "warm_room_25_28c_digital_room_thermometer",
  "environment_no_sharps_spilage",
  "gloves_both_sterile_and_clean"
].forEach(v => { if (hasSelected(safety, v)) totalScore += 0.5; });

// Equipment warmth (0.5 each)
const warmth = flat["skills_assessment/group_nnr/check_equipment_warmth"] || "";
[
  "perform_hand_hygiene_and_wear_clean_gloves",
  "radiant_warmer_prewarm_mode_with_two_towels_and_hat",
  "two_prewarmed_towels_and_hat",
  "mentions_about_clock"
].forEach(v => { if (hasSelected(warmth, v)) totalScore += 0.5; });

// Airway (0.5 each)
const airway = flat["skills_assessment/group_nnr/check_airway"] || "";
[
  "penguine_sucker_or_suction_machine",
  "set_suction_machine_pressure_80_100mmhg",
  "suction_catheter_6f_8f_and_wide_bore_yankauer_sucker",
  "equipment_clean_and_functionality_checked"
].forEach(v => { if (hasSelected(airway, v)) totalScore += 0.5; });

// Breathing (0.5 each)
const breathing = flat["skills_assessment/group_nnr/check_breathing"] || "";
[
  "bvm_size_200_300ml",
  "bvm_size_00_0_1",
  "nasal_prongs",
  "neonatal_non_rebreather_mask",
  "oxygen_source",
  "oxygen_tubings",
  "pulse_oximeter_with_neonatal_probe_cardiorespiratory_monitor",
  "equipment_clean_and_functionality_checked"
].forEach(v => { if (hasSelected(breathing, v)) totalScore += 0.5; });

// Circulation (0.5 each)
const circulation = flat["skills_assessment/group_nnr/check_circulation"] || "";
[
  "stethoscope",
  "iv_adrenaline_0_2ml_per_kg_1_10000",
  "normal_saline"
].forEach(v => { if (hasSelected(circulation, v)) totalScore += 0.5; });

if (flat["skills_assessment/group_nnr/essential_newborn_care"] === "yes") totalScore += 0.5;
if (flat["skills_assessment/group_nnr/check_apgar_timing"] === "yes") totalScore += 0.5;

// Dry stimulate (0.5 each)
const dryStim = flat["skills_assessment/group_nnr/dry_stimulate"] || "";
[
  "cry_respiratory_effort",
  "tone_activity"
].forEach(v => { if (hasSelected(dryStim, v)) totalScore += 0.5; });

// Wet dry cloth (1 each)
const wetDry = flat["skills_assessment/group_nnr/wet_dry_cloth"] || "";
[
  "remove_wet_cloth",
  "wrap_in_dry_warm_towel_cloth",
  "put_hat_on_baby_head"
].forEach(v => { if (hasSelected(wetDry, v)) totalScore += 1; });

// Immediate newborn management (1 each)
const immediate = flat["skills_assessment/group_nnr/immediate_nb_management"] || "";
[
  "immediately_cut_cord",
  "place_baby_on_prewarmed_radiant_warmer"
].forEach(v => { if (hasSelected(immediate, v)) totalScore += 1; });

// Initial ABC (1 each)
const initialABC = flat["skills_assessment/group_nnr/initial_abc_assessment"] || "";
[
  "look_in_mouth_and_nose",
  "clear_airway"
].forEach(v => { if (hasSelected(initialABC, v)) totalScore += 1; });

// ABC assessment (1 each)
const abc = flat["skills_assessment/group_nnr/abc_assessment"] || "";
[
  "open_airway_sniffing_position_head_tilt_chin_lift",
  "look_listen_feel_breathing_5_seconds"
].forEach(v => { if (hasSelected(abc, v)) totalScore += 1; });

if (flat["skills_assessment/group_nnr/shout_help_nnr"] === "yes") {
  totalScore += 1;
}

// Begin BVM (1 each)
const beginBvm = flat["skills_assessment/group_nnr/begin_bvm"] || "";
[
  "size_bvm_mask",
  "good_c_and_e_grip",
  "give_40_60_continuous_ventilations_60_seconds",
  "correct_rate_breath_two_three",
  "ensure_chest_rises"
].forEach(v => { if (hasSelected(beginBvm, v)) totalScore += 1; });

// Assess pulse (1 each)
const assessPulse = flat["skills_assessment/group_nnr/assess_pulse"] || "";
[
  "feel_umbilical_pulse_5_seconds",
  "connect_bvm_to_100_percent_oxygen",
  "connect_pulse_oximeter"
].forEach(v => { if (hasSelected(assessPulse, v)) totalScore += 1; });

// Continue BVM
const continueBvm = flat["skills_assessment/group_nnr/continue_bvm"] || "";

[
  "give_3_chest_compressions_1_ventilation_3_1_ratio_1_minute",
  "use_2_thumb_hand_encircling_technique"
].forEach(v => { if (hasSelected(continueBvm, v)) totalScore += 1; });

[
  "location_lower_1_3_sternum",
  "compress_1_3_ap_diameter",
  "allow_chest_to_recoil",
  "about_120_events_30_ventilations_90_chest_compressions_per_minute"
].forEach(v => { if (hasSelected(continueBvm, v)) totalScore += 0.5; });

if (flat["skills_assessment/group_nnr/reassess_abc"] === "yes") {
  totalScore += 0.5;
}

// Ventilations
const ventilations = flat["skills_assessment/group_nnr/vetilations"] || "";
[
  "give_ventilations_40_60_breaths_per_min_60_seconds_chest_rise",
  "checking_for_chest_movement",
  "ensure_baby_kept_warm"
].forEach(v => { if (hasSelected(ventilations, v)) totalScore += 0.5; });

if (flat["skills_assessment/group_nnr/reassess_abc_2"] === "yes") {
  totalScore += 0.5;
}

// Post resuscitation stabilization
const postResus = flat["skills_assessment/group_nnr/post_resus_stablization"] || "";
[
  "connect_pulse_oximeter_and_monitor_spo2",
  "monitor_breathing_adequacy",
  "switch_to_baby_mode_on_radiant_warmer",
  "give_oxygen_using_nrm_10l_min_monitor_spo2_and_work_of_breathing",
  "titrate_wean_off_oxygen_based_on_spo2",
  "ensure_baby_kept_warm_36_5_37_5c"
].forEach(v => { if (hasSelected(postResus, v)) totalScore += 0.5; });

// Continue observation
const continueObs = flat["skills_assessment/group_nnr/continue_observation"] || "";
[
  "airway",
  "breathing",
  "circulation",
  "disability",
  "exposure",
  "ifcdc"
].forEach(v => { if (hasSelected(continueObs, v)) totalScore += 0.5; });

if (flat["skills_assessment/group_nnr/documentation_nnr"] === "yes") {
  totalScore += 1;
}

// Exact Kobo formula:
// round((points_earned ) div 46.5,0)
const score = Number((totalScore / 46.5).toFixed(3));

    // ================= MENTEE CLEAN SPLIT =================
    const menteeFields = [
      "mrima_nbc_mentees",
      "matungu_nbc_mentees",
      "port_nbc_mentees",
      "port_001_mentees",
      "shimo_nbc_mentees","mbuta_nbc_mentees","chombeli_nbc_mentees",
      "kuvasali_nbc_mentees",
      "shivanga_nbc_mentees",
      "emali_sub_nbc_mentees",
      "kalawa_nbc_mentees",
      "kambu_sub_nbc_mentees",
      "kibwezi_nbc_mentees",
      "kilungu_nbc_mentees",
      "kisau_sub_nbc_mentees",
      "makindu_nbc_mentees",
      "makueni_nbc_mentees",
      "matiliku_nbc_mentees",
      "mbooni_nbc_mentees",
      "mtito_andei_nbc_mentees",
      "mukuyuni_nbc_mentees",
      "nthongoni_nbc_mentees",
      "sultan_nbc_mentees",
      "tawa_sub_nbc_mentees",
      "bokole_nbc_mentees",
      "coast_general_nbc_mentees",
      "likoni_nbc_mentees",
      "mbuta_health_nbc_mentees",
      "mlaleo_nbc_mentees",
      "mrima_maternity_nbc_mentees",
      "port_reitz_nbc_mentees",
      "shimo_la_nbc_mentees",
      "gaichanjiru_nbc_mentees",
      "ithanga_nbc_mentees",
      "kamahuha_nbc_mentees",
      "kandara_nbc_mentees",
      "kangema_nbc_mentees",
      "kenol_hospital_nbc_mentees",
      "kigumo_nbc_mentees",
      "kiriaini_nbc_mentees",
      "makuyu_nbc_mentees",
      "maragua_ridge_nbc_mentees",
      "maragua_nbc_mentees",
      "muranga_nbc_mentees",
      "muriranjas_nbc_mentees"
    ];

    const menteePairs = menteeFields
      .map(f => flat[`group_mentorship_details/mentees/${f}`])
      .filter(v => v && v.toString().trim() !== "")
      .map(v => {

        const raw = v.toString().trim();
        const idx = raw.indexOf("_");

        let mentee_id = "";
        let mentee_name = "";

        if (idx !== -1) {
          mentee_id = raw.substring(0, idx).trim();

          mentee_name = raw
            .substring(idx + 1)
            .replace(/_/g, " ")
            .trim();
        } else {
          mentee_name = raw;
        }

        return {
          mentee_id,
          mentee_name: toTitleCase(mentee_name)
        };
      });

    const mentee_id = menteePairs
      .map(m => m.mentee_id)
      .filter(Boolean)
      .join(", ");

    const mentee_name = menteePairs
      .map(m => m.mentee_name)
      .filter(Boolean)
      .join(", ");

    // ================= ROW =================
    const row = {

      "_uuid": r._uuid || "",

      "date_started": formatDate(flat["start"]),
      "date_ended": formatDate(flat["end"]),
      "date_submitted": formatDate(flat["_submission_time"]),

      "session_date": formatDate(
        flat["group_mentorship_details/mentor_details/evaluation_date"]
      ),

      "mentor_name": toTitleCase(
        flat["group_mentorship_details/mentor_details/mentor_name"]
      ),

      "assessment_type":
        flat["group_mentorship_details/mentor_details/program"] || "",

      "county": toTitleCase(
        flat["group_mentorship_details/mentee_details/county"]
      ),

      "facility_code": facility_code,
      "facility": facility,

      "mentee_id": mentee_id,
      "mentee_name": mentee_name,

      "mentor_id": "",

      "skill_evaluation":
        flat["skills_assessment/group_skills_checklist/skill_evaluation"] || "",

      "review_anc_history":
        flat["skills_assessment/group_nnr/review_anc_history"] || "",

      "check_safety":
        flat["skills_assessment/group_nnr/check_safety"] || "",

      "check_equipment_warmth":
        flat["skills_assessment/group_nnr/check_equipment_warmth"] || "",

      "check_airway":
        flat["skills_assessment/group_nnr/check_airway"] || "",

      "check_breathing":
        flat["skills_assessment/group_nnr/check_breathing"] || "",

      "check_circulation":
        flat["skills_assessment/group_nnr/check_circulation"] || "",

      "essential_newborn_care":
        flat["skills_assessment/group_nnr/essential_newborn_care"] || "",

      "check_apgar_timing":
        flat["skills_assessment/group_nnr/check_apgar_timing"] || "",

      "dry_stimulate":
        flat["skills_assessment/group_nnr/dry_stimulate"] || "",

      "wet_dry_cloth":
        flat["skills_assessment/group_nnr/wet_dry_cloth"] || "",

      "immediate_nb_management":
        flat["skills_assessment/group_nnr/immediate_nb_management"] || "",

      "initial_abc_assessment":
        flat["skills_assessment/group_nnr/initial_abc_assessment"] || "",

      "abc_assessment":
        flat["skills_assessment/group_nnr/abc_assessment"] || "",

      "shout_help_nnr":
        flat["skills_assessment/group_nnr/shout_help_nnr"] || "",

      "begin_bvm":
        flat["skills_assessment/group_nnr/begin_bvm"] || "",

      "assess_pulse":
        flat["skills_assessment/group_nnr/assess_pulse"] || "",

      "continue_bvm":
        flat["skills_assessment/group_nnr/continue_bvm"] || "",

      "reassess_abc":
        flat["skills_assessment/group_nnr/reassess_abc"] || "",

      "vetilations":
        flat["skills_assessment/group_nnr/vetilations"] || "",

      "reassess_abc_2":
        flat["skills_assessment/group_nnr/reassess_abc_2"] || "",

      "post_resus_stablization":
        flat["skills_assessment/group_nnr/post_resus_stablization"] || "",

      "continue_observation":
        flat["skills_assessment/group_nnr/continue_observation"] || "",

      "documentation_nnr":
        flat["skills_assessment/group_nnr/documentation_nnr"] || "",

      "score": score
    };

    rows.push(headers.map(h => row[h] ?? ""));
  });

  if (rows.length === 0) {
    Logger.log("No new records.");
    return;
  }

  // ================= WRITE HEADERS =================
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  // ================= WRITE DATA =================
  sheet.getRange(
    sheet.getLastRow() + 1,
    1,
    rows.length,
    headers.length
  ).setValues(rows);

  Logger.log(`Inserted ${rows.length} new records.`);
}
