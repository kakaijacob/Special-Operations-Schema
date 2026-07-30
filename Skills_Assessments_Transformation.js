function fetchKoboData_Generic() {

  // ================= CONFIG =================
  const apiToken = '1faf1291cb5e472b7f5a253f3888380d28e7900b';
  const formUid = 'aR4bTSJFw3Tnev6o77S3Sg';
  const startDate = "2026-04-01T00:00:00"; // optional incremental window

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ================= OUTPUT SHEET =================
  const sheetName = 'Skills Assessment Data';
  const sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);

  // ================= QUERY =================
  const queryObj = {
    "_submission_time": {
      "$gte": startDate
    },
    "group_mentorship_details/mentor_details/program": "newborn_curriculum",
    "group_mentorship_details/mentee_details/county": {
      "$in": ["Muranga", "Mombasa", "Kakamega"]
    },
    "skills_assessment/group_skills_checklist/skill_evaluation": "Newborn_resuscitation"
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

  // ================= HELPERS =================
  function formatDateTime(value) {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return Utilities.formatDate(
      d,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd HH:mm"
    );
  }

  function formatDateOnly(value) {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      // Already a YYYY-MM-DD (or similar) string from Kobo
      const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
      return match ? match[1] : value;
    }
    return Utilities.formatDate(
      d,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd"
    );
  }

  function toTitleCase(str) {
    if (!str) return "";
    return str
      .toString()
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  }

  function splitFacility(raw) {
    if (!raw) return { facility_code: "", facility: "" };
    const value = raw.toString().trim();
    const idx = value.indexOf("_");
    if (idx === -1) {
      return { facility_code: value, facility: "" };
    }
    // e.g. 1234_ruiru_hospital -> facility_code "1234_", facility "Ruiru Hospital"
    return {
      facility_code: value.substring(0, idx + 1),
      facility: toTitleCase(value.substring(idx + 1))
    };
  }

  function splitMentee(raw) {
    if (!raw) return { mentee_id: "", mentee: "" };
    const value = raw.toString().trim();
    const idx = value.indexOf("_");
    if (idx === -1) {
      return { mentee_id: value, mentee: "" };
    }
    // e.g. 724504326_Kakai_Jacob -> mentee_id "724504326", mentee "Kakai Jacob"
    return {
      mentee_id: value.substring(0, idx).trim(),
      mentee: toTitleCase(value.substring(idx + 1))
    };
  }

  // Facility-specific mentee select fields under group_mentorship_details/mentees/
  // Union of existing fields plus provided mentees / IFM / NBC variants.
  const menteeFields = [
    "athi_ifms",
    "athi_river_mentees",
    "athi_river_nbc_mentees",
    "babadogo_mentees",
    "babadogo_nbc_mentees",
    "bahati_health_mentees",
    "bahati_health_nbc_mentees",
    "bahati_mentees",
    "bahati_mentees_001",
    "bahati_nbc_mentees",
    "bamba_subcounty_mentees",
    "bamba_subcounty_nbc_mentees",
    "bishop_mentees",
    "bishop_nbc_mentees",
    "bokole_mentees",
    "bokole_nbc_mentees",
    "bondeni_mentees",
    "bondeni_nbc_mentees",
    "bosongo_mentees",
    "bosongo_nbc_mentees",
    "bushiri_mentees",
    "bushiri_nbc_mentees",
    "butere_mentees",
    "butere_nbc_mentees",
    "cgtrh_vikwatani_mentees",
    "cgtrh_vikwatani_nbc_mentees",
    "chasimba_mentees",
    "chasimba_nbc_mentees",
    "chombeli_mentees",
    "chombeli_nbc_mentees",
    "christamarianne_mentees",
    "christamarianne_nbc_mentees",
    "coast_general_mentees",
    "coast_general_mentees_001",
    "coast_general_nbc_mentees",
    "coast_nbc_mentees",
    "dandora_11_health_center_nbc_mentees",
    "dandora_mentees",
    "eastleigh_mentees",
    "eastleigh_nbc_mentees",
    "ekalakala_mentees",
    "ekalakala_nbc_mentees",
    "elburgon_mentees",
    "elburgon_nbc_mentees",
    "emali_ifms",
    "emali_nbc_mentees",
    "emali_sub_mentees",
    "emali_sub_nbc_mentees",
    "embakasi_mentees",
    "embakasi_nbc_mentees",
    "entanda_mentees",
    "entanda_nbc_mentees",
    "etago_sub_mentees",
    "etago_sub_nbc_mentees",
    "gaichanjiru_ifms",
    "gaichanjiru_mentees",
    "gaichanjiru_nbc_mentees",
    "gatundu_mentees",
    "gatundu_nbc_mentees",
    "gatura_ifms",
    "gesusu_mentees",
    "gesusu_mentees_001",
    "gesusu_nbc_mentees",
    "gilgil_mentees",
    "gilgil_nbc_mentees",
    "githunguri_mentees",
    "githunguri_nbc_mentees",
    "gucha_sub_mentees",
    "gucha_sub_nbc_mentees",
    "huruma_mentees",
    "huruma_nbc_mentees",
    "igegania_mentees",
    "igegania_nbc_mentees",
    "iguhu_sub_mentees",
    "iguhu_sub_nbc_mentees",
    "ilatu_ifms",
    "iranda_mentees",
    "iranda_nbc_mentees",
    "ithanga_ifms",
    "ithanga_mentees",
    "ithanga_nbc_mentees",
    "itumbule_ifms",
    "iyabe_sub_mentees",
    "iyabe_sub_nbc_mentees",
    "jomvu_model_mentees",
    "jomvu_model_nbc_mentees",
    "jumuia_mentees",
    "jumuia_nbc_mentees",
    "kahawa_mentees",
    "kahawa_nbc_mentees",
    "kakamega_mentees",
    "kakamega_nbc_mentees",
    "kako_ifms",
    "kalanzoni_ifms",
    "kalawa_ifms",
    "kalawa_mentees",
    "kalawa_nbc_mentees",
    "kali_ifms",
    "kaliani_ifms",
    "kalimoni_mentees",
    "kalimoni_nbc_mentees",
    "kalulini_ifms",
    "kamahuha_mentees",
    "kamahuha_nbc_mentees",
    "kamboo_ifms",
    "kambu_ifms",
    "kambu_nbc_mentees",
    "kambu_sub_mentees",
    "kambu_sub_nbc_mentees",
    "kandara_mentees",
    "kandara_nbc_mentees",
    "kangari_ifms",
    "kangema_ifms",
    "kangema_mentees",
    "kangema_nbc_mentees",
    "kangemi_mentees",
    "kangemi_nbc_mentees",
    "kangundo_mentees",
    "kangundo_nbc_mentees",
    "kanyenyaini_ifms",
    "kanzokea_ifms",
    "karuri_mentees",
    "karuri_nbc_mentees",
    "kasikeu_ifms",
    "kathiani_mentees",
    "kathiani_nbc_mentees",
    "kathonzweni_ifms",
    "kathulumbi_ifms",
    "kathyaka_ifms",
    "kayole_1_mentees",
    "kayole_1_nbc_mentees",
    "kayole_2_mentees",
    "kayole_2_nbc_mentees",
    "kayole_mentees_001",
    "kenol_hospital_mentees",
    "kenol_hospital_nbc_mentees",
    "kenol_nbc_mentees",
    "kenyenya_mentees",
    "kenyenya_nbc_mentees",
    "keringet_mentees",
    "keringet_nbc_mentees",
    "keumbu_mentees",
    "keumbu_nbc_mentees",
    "khwisero_mentees",
    "khwisero_nbc_mentees",
    "kiambu_mentees",
    "kiambu_nbc_mentees",
    "kianda_mentees",
    "kianda_nbc_mentees",
    "kibera_community",
    "kibera_community_nbc_mentees",
    "kibera_mentees",
    "kibera_mentees_001",
    "kibera_nbc_mentees",
    "kibwezi_ifms",
    "kibwezi_mentees",
    "kibwezi_nbc_mentees",
    "kigumo_ifms",
    "kigumo_mentees",
    "kigumo_nbc_mentees",
    "kihara_mentees",
    "kihara_nbc_mentees",
    "kijabe_mentees",
    "kijabe_nbc_mentees",
    "kikoko_ifms",
    "kikumini_ifms",
    "kikuyu_mentees",
    "kikuyu_nbc_mentees",
    "kilala_ifms",
    "kilili_ifms",
    "kilungu_ifms",
    "kilungu_mentees",
    "kilungu_nbc_mentees",
    "kiptangwanyi_mentees",
    "kiptangwanyi_nbc_mentees",
    "kiriaini_nbc_mentees",
    "kiriini_nbc_mentees",
    "kirogo_ifms",
    "kirwara_ifms",
    "kirwara_mentees",
    "kirwara_nbc_mentees",
    "kisau_ifms",
    "kisau_nbc_mentees",
    "kisau_sub_mentees",
    "kisau_sub_nbc_mentees",
    "kisii_teaching_mentees",
    "kisii_teaching_nbc_mentees",
    "kisoi_ifms",
    "kithyululu_ifms",
    "kitise_ifms",
    "kitundu_nbc_mentees",
    "kitutu_mentees",
    "kitutu_nbc_mentees",
    "korogocho_mentees",
    "korogocho_nbc_mentees",
    "kuresoi_mentees",
    "kuresoi_nbc_mentees",
    "kuvasali_nbc_mentees",
    "kyambeke_ifms",
    "lanet_health_mentees",
    "lanet_health_nbc_mentees",
    "langata_mentees",
    "langata_nbc_mentees",
    "lari_level_mentees",
    "lari_level_nbc_mentees",
    "likoni_mentees",
    "likoni_nbc_mentees",
    "likuyani_mentees",
    "likuyani_nbc_mentees",
    "lumakanda_mentees",
    "lumakanda_nbc_mentees",
    "lusigetti_mentees",
    "lusigetti_nbc_mentees",
    "machakos_mentees",
    "machakos_nbc_mentees",
    "maimahiu_mentees",
    "maimahiu_nbc_mentees",
    "makadara_mentees",
    "makadara_nbc_mentees",
    "makindu_ifms",
    "makindu_mentees",
    "makindu_nbc_mentees",
    "makueni_ifms",
    "makueni_mentees",
    "makueni_nbc_mentees",
    "makuyu_ifms",
    "makuyu_mentees",
    "makuyu_nbc_mentees",
    "malava_mentees",
    "malava_nbc_mentees",
    "mama_lucy_mentees",
    "mama_lucy_nbc_mentees",
    "mama_margaret_mentees",
    "mama_margaret_nbc_mentees",
    "mangu_health_mentees",
    "mangu_health_nbc_mentees",
    "maragua_ifms",
    "maragua_mentees",
    "maragua_nbc_mentees",
    "maragua_ridge_mentees",
    "maragua_ridge_nbc_mentees",
    "maria_immaculate_mentees",
    "maria_immaculate_nbc_mentees",
    "mary_help_mentees",
    "mary_help_nbc_mentees",
    "masimba_mentees",
    "masimba_nbc_mentees",
    "masinga_mentees",
    "masinga_nbc_mentees",
    "mathare_mentees",
    "mathare_nbc_mentees",
    "matiliku_ifms",
    "matiliku_mentees",
    "matiliku_nbc_mentees",
    "matongo_mentees",
    "matongo_nbc_mentees",
    "matunda_mentees",
    "matunda_nbc_mentees",
    "matungu_mentees",
    "matungu_nbc_mentees",
    "matuu_level_mentees",
    "matuu_level_nbc_mentees",
    "mau_narok_mentees",
    "mau_narok_nbc_mentees",
    "mautuma_mentees",
    "mautuma_nbc_mentees",
    "mavindini_ifms",
    "mavivye_ifms",
    "mbagathi_mentees",
    "mbagathi_nbc_mentees",
    "mbooni_ifms",
    "mbooni_mentees",
    "mbooni_mentees_001",
    "mbooni_nbc_mentees",
    "mbungoni_mentees",
    "mbungoni_nbc_mentees",
    "mbuta_health_mentees",
    "mbuta_health_mentees_001",
    "mbuta_health_nbc_mentees",
    "mbuta_nbc_mentees",
    "mbuvo_ifms",
    "mediforte_mentees",
    "mediforte_nbc_mentees",
    "mercy_mission_mentees",
    "mercy_mission_nbc_mentees",
    "mikindani_mentees",
    "mikindani_nbc_mentees",
    "miritini_mentees",
    "miritini_nbc_mentees",
    "mirugi_mentees",
    "mirugi_nbc_mentees",
    "mlaleo_mentees",
    "mlaleo_nbc_mentees",
    "molo_subcounty_mentees",
    "molo_subcounty_nbc_mentees",
    "mosocho_mentees",
    "mosocho_nbc_mentees",
    "mrima_maternity_mentees",
    "mrima_maternity_nbc_mentees",
    "mrima_nbc_mentees",
    "mtito_andei_mentees",
    "mtito_andei_nbc_mentees",
    "mtito_ifms",
    "mtito_nbc_mentees",
    "mukumu_mentees",
    "mukumu_nbc_mentees",
    "mukuru_mentees",
    "mukuru_nbc_mentees",
    "mukuyuni_ifms",
    "mukuyuni_mentees",
    "mukuyuni_nbc_mentees",
    "mulemi_mentees",
    "mulemi_nbc_mentees",
    "mumias_mentees",
    "mumias_nbc_mentees",
    "muranga_ifms",
    "muranga_mentees",
    "muranga_nbc_mentees",
    "muriranjas_ifms",
    "muriranjas_mentees",
    "muriranjas_nbc_mentees",
    "mutituni_mentees",
    "mutituni_nbc_mentees",
    "mutuini_mentees",
    "mutuini_nbc_mentees",
    "mutyambua_ifms",
    "mwaani_ifms",
    "mwala_sub_mentees",
    "mwala_sub_nbc_mentees",
    "mwiki_health_mentees",
    "mwiki_health_nbc_mentees",
    "naivasha_aic_mentees",
    "naivasha_aic_nbc_mentees",
    "naivasha_mentees_001",
    "naivasha_subcounty_mentees",
    "naivasha_subcounty_nbc_mentees",
    "nakuru_pgh_mentees",
    "nakuru_pgh_nbc_mentees",
    "navakholo_mentees",
    "navakholo_nbc_mentees",
    "nazareth_mentees",
    "nazareth_nbc_mentees",
    "nduru_sub_mentees",
    "nduru_sub_nbc_mentees",
    "nguluni_mentees",
    "nguluni_nbc_mentees",
    "ngwata_ifms",
    "njenga_mentees",
    "njenga_nbc_mentees",
    "njiru_hospital_mentees",
    "njiru_hospital_nbc_mentees",
    "njoro_subcounty_mentees",
    "njoro_subcounty_nbc_mentees",
    "nthangu_ifms",
    "nthongoni_ifms",
    "nthongoni_mentees",
    "nthongoni_nbc_mentees",
    "nyacheki_mentees",
    "nyacheki_nbc_mentees",
    "nyakianga_ifms",
    "nyanchwa_mentees",
    "nyanchwa_nbc_mentees",
    "nzeveni_ifms",
    "nziu_ifms",
    "oasis_specialist_mentees",
    "oasis_specialist_nbc_mentees",
    "olenguruone_mentees",
    "olenguruone_nbc_mentees",
    "oresi_sub_mentees",
    "oresi_sub_nbc_mentees",
    "our_lady_mentees",
    "our_lady_nbc_mentees",
    "pgh_annex_mentees",
    "pgh_annex_nbc_mentees",
    "port_001_mentees",
    "port_nbc_mentees",
    "port_reitz_mentees",
    "port_reitz_nbc_mentees",
    "pumwani_mentees",
    "pumwani_nbc_mentees",
    "rabai_subcounty_mentees",
    "rabai_subcounty_nbc_mentees",
    "raganga_mentees",
    "raganga_nbc_mentees",
    "ram_hospital_mentees",
    "ram_hospital_nbc_mentees",
    "rapha_ifms",
    "reuben_mentees",
    "reuben_nbc_mentees",
    "rhonda_mentees",
    "rhonda_nbc_mentees",
    "riruta_mentees",
    "riruta_nbc_mentees",
    "rongai_mentees",
    "rongai_nbc_mentees",
    "royalstar_ifms",
    "ruiru_subcounty_mentees",
    "ruiru_subcounty_nbc_mentees",
    "sayyid_mentees",
    "sayyid_nbc_mentees",
    "shelly_mentees",
    "shelly_nbc_mentees",
    "shibwe_mentees",
    "shibwe_nbc_mentees",
    "shika_adabu_mentees",
    "shika_adabu_nbc_mentees",
    "shimo_la_mentees",
    "shimo_la_nbc_mentees",
    "shimo_nbc_mentees",
    "shivanga_nbc_mentees",
    "soin_subcounty_mentees",
    "soin_subcounty_nbc_mentees",
    "st_catherine_mentees",
    "st_catherine_nbc_mentees",
    "st_marys_mentees_001",
    "st_marys_mission_mentees",
    "st_marys_mission_nbc_mentees",
    "st_marys_mumias_mentees",
    "st_marys_mumias_nbc_mentees",
    "st_thomas_mentees",
    "st_thomas_nbc_mentees",
    "subukia_mentees",
    "subukia_nbc_mentees",
    "sultan_ifms",
    "sultan_mentees",
    "sultan_nbc_mentees",
    "tabaka_mentees",
    "tabaka_nbc_mentees",
    "tassia_mentees",
    "tassia_nbc_mentees",
    "tawa_ifms",
    "tawa_nbc_mentees",
    "tawa_sub_mentees",
    "tawa_sub_nbc_mentees",
    "thika_level_mentees",
    "thika_level_nbc_mentees",
    "tigoni_mentees",
    "tigoni_nbc_mentees",
    "tudor_nbc_mentees",
    "tudor_subcounty_mentees",
    "tudor_subcounty_nbc_mentees",
    "tulimani_ifms",
    "tulimani_mentees",
    "tulimani_nbc_mentees",
    "uvete_ifms",
    "vololo_ifms",
    "waithaka_mentees",
    "waithaka_nbc_mentees",
    "wangige_mentees",
    "wangige_nbc_mentees",
    "westlands_mentees",
    "westlands_nbc_mentees"
  ];

  function extractMentees(flat) {
    const pairs = menteeFields
      .map(f => flat[`group_mentorship_details/mentees/${f}`])
      .filter(v => v && v.toString().trim() !== "")
      .flatMap(v =>
        // select_multiple values may be space-separated
        v.toString().trim().split(/\s+/).filter(Boolean)
      )
      .map(splitMentee)
      .filter(m => m.mentee_id || m.mentee);

    return {
      mentee_id: pairs.map(m => m.mentee_id).filter(Boolean).join(", "),
      mentee: pairs.map(m => m.mentee).filter(Boolean).join(", ")
    };
  }

  // Facility select fields (mentee_details + group_mentorship_facilities variants)
  const facilityFields = [
    "group_mentorship_details/mentee_details/muranga_facilities",
    "group_mentorship_details/mentee_details/makueni_facilities",
    "group_mentorship_details/mentee_details/kakamega_facilities",
    "group_mentorship_details/mentee_details/mombasa_facilities",
    "group_mentorship_details/mentee_details/kiambu_facilities",
    "group_mentorship_details/mentee_details/nairobi_facilities",
    "group_mentorship_details/mentee_details/nakuru_facilities",
    "group_mentorship_details/mentee_details/kisii_facilities",
    "group_mentorship_details/mentee_details/JHSL_facilities",
    "group_mentorship_details/group_mentorship_facilities/JHSL_facilities",
    "group_mentorship_details/group_mentorship_facilities/kiambu_facilities",
    "group_mentorship_details/group_mentorship_facilities/makueni_facilities",
    "group_mentorship_details/group_mentorship_facilities/muranga_facilities",
    "group_mentorship_details/group_mentorship_facilities/nairobi_facilities",
    "group_mentorship_details/group_mentorship_facilities/nakuru_facilities",
    "group_mentorship_details/group_mentorship_facilities/kakamega_facilities",
    "group_mentorship_details/group_mentorship_facilities/kisii_facilities",
    "group_mentorship_details/group_mentorship_facilities/mombasa_facilities"
  ];

  function extractFacility(flat) {
    const raw =
      facilityFields.map(f => flat[f]).find(v => v && String(v).trim() !== "") ||
      "";
    return splitFacility(raw);
  }

  // ================= OUTPUT HEADERS =================
  const headers = [
    "submission_uuid",
    "date_started",
    "date_ended",
    "date_submitted",
    "evaluation_date",
    "submission_id",
    "mentor_name",
    "program",
    "county",
    "facility_code",
    "facility",
    "mentee_id",
    "mentee",
    "score"
  ];

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

  // ================= DEDUPLICATION (submission_uuid) =================
  const existingIds = new Set();
  const lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    const existing = sheet.getRange(2, 1, lastRow, 1).getValues();
    existing.forEach(r => {
      if (r[0]) existingIds.add(String(r[0]));
    });
  }

  // ================= FLATTEN =================
  function flatten(obj, prefix = "") {
    const result = {};

    for (const key in obj) {
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

  // ================= TRANSFORM (new rows only) =================
  const rows = [];

  allResults.forEach(r => {
    const uuid = r._uuid || "";
    if (!uuid || existingIds.has(String(uuid))) return;

    const flat = flatten(r);

    const facilityInfo = extractFacility(flat);
    const menteeInfo = extractMentees(flat);

    const row = {
      submission_uuid: uuid,
      date_started: formatDateTime(flat["start"] || r.start),
      date_ended: formatDateTime(flat["end"] || r.end),
      date_submitted: formatDateTime(flat["_submission_time"] || r._submission_time),
      evaluation_date: formatDateOnly(
        flat["group_mentorship_details/mentor_details/evaluation_date"]
      ),
      submission_id: flat["_id"] != null ? flat["_id"] : (r._id != null ? r._id : ""),
      mentor_name: toTitleCase(
        flat["group_mentorship_details/mentor_details/mentor_name"] || ""
      ),
      program: toTitleCase(
        flat["group_mentorship_details/mentor_details/program"] || ""
      ),
      county: flat["group_mentorship_details/mentee_details/county"] || "",
      facility_code: facilityInfo.facility_code,
      facility: facilityInfo.facility,
      mentee_id: menteeInfo.mentee_id,
      mentee: menteeInfo.mentee,
      score: flat["skills_assessment/group_nnr/nnr_score"] ?? ""
    };

    rows.push(headers.map(h => (row[h] != null ? row[h] : "")));
    existingIds.add(String(uuid));
  });

  if (rows.length === 0) {
    Logger.log("No new records.");
    return;
  }

  // ================= WRITE HEADERS =================
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  // ================= APPEND NEW ROWS =================
  sheet
    .getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length)
    .setValues(rows);

  Logger.log(`Inserted ${rows.length} new records.`);
}
