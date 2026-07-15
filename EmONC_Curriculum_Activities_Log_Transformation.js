function fetchKoboData_All() {

  const apiToken = '1faf1291cb5e472b7f5a253f3888380d28e7900b';
  const formUid  = 'aJaBJKDs7pCRMi8zm3BXze';
  const runId = Utilities.getUuid();

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

  // ================= FACILITY FIELDS =================
  const facilityRoots = [
    "demographic_information/facility_details/",
    "demographic_information/mentee_details/"
  ];

  const facilitySuffixes = [
    "kiambu_facilities","machakos_facilities","makueni_facilities",
    "muranga_facilities","nairobi_facilities","nakuru_facilities",
    "kakamega_facilities","kisii_facilities","mombasa_facilities"
  ];

  const facilityFields = facilityRoots.flatMap(root =>
    facilitySuffixes.map(suffix => root + suffix)
  );

  // ================= MENTEE FIELDS =================
  const roots = [
    "demographic_information/mentee_details/",
    "demographic_information/mentee_details_001/"
  ];

  const menteeSuffixes = [
    "bushiri_mentees","butere_mentees","chombeli_mentees","iguhu_sub_mentees","kakamega_mentees","khwisero_mentees","likuyani_mentees","lumakanda_mentees","malava_mentees","matunda_mentees","matungu_mentees","mautuma_mentees","mukumu_mentees","mumias_mentees","navakholo_mentees","shibwe_mentees","st_marys_mumias_mentees","gatundu_mentees","githunguri_mentees","igegania_mentees","kalimoni_mentees","karuri_mentees","kiambu_mentees","kihara_mentees","kijabe_mentees","kikuyu_mentees","lari_level_mentees","lusigetti_mentees","mary_help_mentees","nazareth_mentees","ruiru_subcounty_mentees","thika_level_mentees","tigoni_mentees","wangige_mentees","bamba_subcounty_mentees", "baolala_mentees", "chasimba_mentees", "ganze_health_mentees", "gede_subcounty_mentees", "gongoni_mentees", "gotani_mentees", "kilifi_mentees", "malindi_mentees", "marereni_mentees", "matsangoni_mentees", "rabai_subcounty_mentees", "tawfiq_mentees", "tsangatsini_mentees","christamarianne_mentees","entanda_mentees","etago_sub_mentees","gesusu_mentees_001","gesusu_mentees","gucha_sub_mentees","iranda_mentees","iyabe_sub_mentees","kenyenya_mentees","keumbu_mentees","kisii_teaching_mentees","kitutu_mentees","masimba_mentees","matongo_mentees","mediforte_mentees","mosocho_mentees","nduru_sub_mentees","nyacheki_mentees","nyanchwa_mentees","oasis_specialist_mentees","oresi_sub_mentees","raganga_mentees","ram_hospital_mentees","st_catherine_mentees","tabaka_mentees","athi_river_mentees","bishop_mentees","ekalakala_mentees","kangundo_mentees","kathiani_mentees","machakos_mentees","masinga_mentees","matuu_level_mentees","mutituni_mentees","mwala_sub_mentees","nguluni_mentees","emali_sub_mentees","kalawa_mentees","kambu_sub_mentees","kibwezi_mentees","kilungu_mentees","kisau_sub_mentees","makindu_mentees","makueni_mentees","matiliku_mentees","mbooni_mentees_001","mbooni_mentees","mtito_andei_mentees","mukuyuni_mentees","nthongoni_mentees","sultan_mentees","tawa_sub_mentees","tulimani_mentees","bokole_mentees","cgtrh_vikwatani_mentees","coast_general_mentees_001","coast_general_mentees","jomvu_model_mentees","likoni_mentees","mbungoni_mentees","mbuta_health_mentees_001","mbuta_health_mentees","mikindani_mentees","miritini_mentees","mlaleo_mentees","mrima_maternity_mentees","port_reitz_mentees","sayyid_mentees","shelly_mentees","shika_adabu_mentees","shimo_la_mentees","st_thomas_mentees","tudor_subcounty_mentees","gaichanjiru_mentees","ithanga_mentees","kamahuha_mentees","kandara_mentees","kangema_mentees","kenol_hospital_mentees","kigumo_mentees","kirwara_mentees","makuyu_mentees","maragua_ridge_mentees","maragua_mentees","muranga_mentees","muriranjas_mentees","babadogo_mentees","bahati_health_mentees","dandora_mentees","eastleigh_mentees","embakasi_mentees","huruma_mentees","jumuia_mentees","kahawa_mentees","kangemi_mentees","kayole_mentees_001","kayole_1_mentees","kayole_2_mentees","kianda_mentees","kibera_community","kibera_mentees_001","kibera_mentees","korogocho_mentees","langata_mentees","makadara_mentees","mama_lucy_mentees","mama_margaret_mentees","maria_immaculate_mentees","mathare_mentees","mbagathi_mentees","mercy_mission_mentees","mukuru_mentees","mutuini_mentees","mwiki_health_mentees","njenga_mentees","njiru_hospital_mentees","pumwani_mentees","reuben_mentees","riruta_mentees","st_marys_mentees_001","st_marys_mission_mentees","tassia_mentees","waithaka_mentees","westlands_mentees","bahati_mentees_001","bahati_mentees","bondeni_mentees","elburgon_mentees","gilgil_mentees","keringet_mentees","kiptangwanyi_mentees","kuresoi_mentees","lanet_health_mentees","maimahiu_mentees","mangu_health_mentees","mau_narok_mentees","mirugi_mentees","molo_subcounty_mentees","mulemi_mentees","naivasha_mentees_001","naivasha_aic_mentees","naivasha_subcounty_mentees","nakuru_pgh_mentees","njoro_subcounty_mentees","olenguruone_mentees","our_lady_mentees","pgh_annex_mentees","rhonda_mentees","rongai_mentees","soin_subcounty_mentees","subukia_mentees", "alupe_sub_mentees","amukura_mentees","bumala_mentees","busia_county_mentees","khunyangu_mentees","matayos_mentees",
    "nambale_mentees","port_victoria_mentees","sio_port_mentees","teso_north_mentees","bushiri_mentees","butere_mentees",
    "chombeli_mentees","iguhu_sub_mentees","kakamega_mentees","khwisero_mentees","likuyani_mentees","lumakanda_mentees",
    "malava_mentees","matunda_mentees","matungu_mentees","mautuma_mentees","mukumu_mentees","mumias_mentees",
    "navakholo_mentees","shibwe_mentees","st_marys_mumias_mentees","gatundu_mentees","githunguri_mentees","igegania_mentees",
    "kalimoni_mentees","karuri_mentees","kiambu_mentees","kihara_mentees","kijabe_mentees","kikuyu_mentees",
    "lari_level_mentees","lusigetti_mentees","mary_help_mentees","nazareth_mentees","ruiru_subcounty_mentees","thika_level_mentees",
    "tigoni_mentees","wangige_mentees","bamba_subcounty_mentees","baolala_mentees","chasimba_mentees","ganze_health_mentees",
    "gede_subcounty_mentees","gongoni_mentees","gotani_mentees","kilifi_mentees","malindi_mentees","marereni_mentees",
    "mariakani_mentees","matsangoni_mentees","mtwapa_mentees","muyeye_mentees","rabai_subcounty_mentees","tawfiq_mentees",
    "tsangatsini_mentees","vipingo_mentees","vitengeni_mentees","kerugoya_mentees","kianyaga_mentees","kimbimbi_mentees",
    "mutithi_mentees","sagana_mentees","bosongo_mentees","christamarianne_mentees","entanda_mentees","etago_sub_mentees",
    "gesusu_mentees","gucha_sub_mentees","iranda_mentees","iyabe_sub_mentees","kenyenya_mentees","keumbu_mentees",
    "kisii_teaching_mentees","kitutu_mentees","masimba_mentees","mediforte_mentees","nduru_sub_mentees","nyacheki_mentees",
    "nyamache_mentees","nyanchwa_mentees","nyangena_mentees","oasis_specialist_mentees","oresi_sub_mentees","raganga_mentees",
    "ram_hospital_mentees","st_catherine_mentees","tabaka_mentees","athi_river_mentees","bishop_mentees","ekalakala_mentees",
    "kangundo_mentees","kathiani_mentees","machakos_mentees","masinga_mentees","matuu_level_mentees","mutituni_mentees",
    "mwala_sub_mentees","nguluni_mentees","emali_sub_mentees","kalawa_mentees","kambu_sub_mentees","kibwezi_mentees",
    "kilungu_mentees","kisau_sub_mentees","makindu_mentees","makueni_mentees","matiliku_mentees","mbooni_mentees",
    "mtito_andei_mentees","mukuyuni_mentees","nthongoni_mentees","sultan_mentees","tawa_sub_mentees","tulimani_mentees",
    "cottolengo_mentees","kanyakine_mentees","meru_teaching_mentees","miathene_mentees","muthara_mentees","mutuati_mentees",
    "nyambene_mentees","st_theresa_mentees","bokole_mentees","cgtrh_vikwatani_mentees","coast_general_mentees","jomvu_model_mentees",
    "likoni_mentees","mbungoni_mentees","mbuta_health_mentees","mikindani_mentees","miritini_mentees","mlaleo_mentees",
    "mrima_maternity_mentees","port_reitz_mentees","sayyid_mentees","shelly_mentees","shika_adabu_mentees","shimo_la_mentees",
    "st_thomas_mentees","tudor_subcounty_mentees","gaichanjiru_mentees","ithanga_mentees","kamahuha_mentees","kandara_mentees",
    "kangema_mentees","kenol_hospital_mentees","kigumo_mentees","kiriaini_mentees","kirwara_mentees","makuyu_mentees",
    "maragua_ridge_mentees","maragua_mentees","muranga_mentees","muriranjas_mentees","babadogo_mentees","bahati_health_mentees",
    "dandora_mentees","eastleigh_mentees","embakasi_mentees","huruma_mentees","jumuia_mentees","kahawa_mentees",
    "kangemi_mentees","kayole_1_mentees","kayole_2_mentees","kianda_mentees","kibera_community_mentees","kibera_mentees",
    "korogocho_mentees","langata_mentees","makadara_mentees","mama_lucy_mentees","mama_margaret_mentees","maria_immaculate_mentees",
    "mathare_mentees","mbagathi_mentees","mercy_mission_mentees","mukuru_mentees","mutuini_mentees","mwiki_health_mentees",
    "njenga_mentees","njiru_hospital_mentees","pumwani_mentees","reuben_mentees","riruta_mentees","st_marys_mission_mentees",
    "tassia_mentees","waithaka_mentees","westlands_mentees","bahati_mentees","bondeni_mentees","elburgon_mentees",
    "gilgil_mentees","keringet_mentees","kiptangwanyi_mentees","kuresoi_mentees","lanet_health_mentees","maimahiu_mentees",
    "mangu_health_mentees","mau_narok_mentees","mirugi_mentees","molo_subcounty_mentees","mulemi_mentees","naivasha_aic_mentees",
    "naivasha_mentees","nakuru_pgh_mentees","njoro_subcounty_mentees","olenguruone_mentees","our_lady_mentees","pgh_annex_mentees",
    "rhonda_mentees","rongai_mentees","soin_subcounty_mentees","subukia_mentees","bellevue_mentees","endarasha_mentees",
    "gichiche_mentees","gichira_mentees","gumba_health_mentees","ihururu_mentees","island_mentees","kamoko_mentees",
    "karaba_mentees","karatina_mentees","karemeno_mentees","kenyatta_mentees","kiamabara_mentees","kiganjo_mentees",
    "kinunga_mentees","mary_immaculate_mentees","mugunda_mentees","mukurweini_mentees","mweiga_mentees","naromoru_mentees",
    "ngorano_mentees","nyeri_provincial_mentees","nyeri_town_mentees","othaya_mentees","ruguru_mentees","thangathi_mentees",
    "tumutumu_mentees","unjiru_mentees","wamagana_mentees","warazo_mentees","witima_mentees","akala_health_mentees",
    "ambira_mentees","bar_ndege_mentees","bondo_county_mentees","got_agulu_mentees","madiany_mentees","rwambwa_mentees",
    "siaya_county_mentees","sigomere_mentees","tingwangi_mentees","ukwala_mentees","yala_sub_mentees","gesusu_mentees_001",
    "matongo_mentees","mosocho_mentees","mbooni_mentees_001","coast_general_mentees_001","mbuta_health_mentees_001","kayole_mentees_001",
    "kibera_community","kibera_mentees_001","st_marys_mentees_001","bahati_mentees_001","naivasha_mentees_001","naivasha_subcounty_mentees"
  ];
    
  const menteeFields = roots.flatMap(root =>
    menteeSuffixes.map(suffix => root + suffix)
  );

  // ================= TOPIC FIELDS =================
  const topicFields = [
    "emonc_training_curriculum/group_cmes/cmes",
    "emonc_training_curriculum/group_videos/videos",
    "emonc_training_curriculum/group_case_scenarios/case_scenarios",
    "emonc_training_curriculum/group_mentor_demo/mentor_skills_demo",
    "emonc_training_curriculum/group_return_demo/mentee_skills_return_demo",
    "emonc_training_curriculum/group_drills/drills"
  ];

const dataByMonth = {};

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

    facilityFields.forEach(f => {

      if (r[f]) {

        const parts = r[f].split("_");

        facilityCode = parts[0];

        facilityName = toTitleCase(
          parts.slice(1).join(" ").replace(/_/g, " ")
        );
      }

    });

    let mentees = [];

    menteeFields.forEach(f => {

      if (r[f]) {

        r[f].split(" ").forEach(m => {

          const parts = m.split("_");

          mentees.push({
            id: parts[0],
            name: toTitleCase(
              parts.slice(1).join(" ").replace(/_/g, " ")
            )
          });

        });

      }

    });

    const activities =
      (r["emonc_training_curriculum/emonc_curriculum_activities/emonc_activities"] || "")
      .split(" ")
      .filter(Boolean);

    let topics = [];

    topicFields.forEach(t => {

      if (r[t]) {

        r[t].split(" ").forEach(topic => {

          topics.push(formatTopic(topic));

        });

      }

    });

    mentees.forEach(m => {

      activities.forEach(a => {

        topics.forEach(t => {

     const row = [
  submissionId,
  submissionDate,
  sessionDate,
  mentorName,
  county,
  facilityCode,
  facilityName,
  m.id,
  m.name,
  toTitleCase(a.replace(/_/g, " ")),
  t,
  runId
];

   dataByMonth[monthKey].push(row);

        });

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
  "Topic",
  "Run ID"
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
          .getRange(2, 1, lastRow - 1, 1)
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
