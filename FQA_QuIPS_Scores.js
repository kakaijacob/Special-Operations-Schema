/**
 * FQA Scores sheet.
 *
 * Long-format totalling table: one row per facility / department /
 * scored attribute, using scores from the FQA Weighting sheet.
 * Missing facility_code and subcounty are filled from the facility
 * master spreadsheet when county, level (facility_level), and a fuzzy
 * facility-name match all agree. The master code column is dhis_code.
 * thematic_area is filled as groupings are provided. Newborn Unit
 * commodity columns are Commodities, equipment columns are Equipment,
 * adherence columns are Adherence to evidence based practice, and
 * records columns are Health Records for clients, and hours of
 * operation columns are Hours of operation, and infrastructure
 * columns are Infrastructure, privacy columns are
 * Privacy/confidentiality, SOP columns are Standard operating
 * procedures/Protocols, and WASH/IPC columns are WASH (Water,
 * Sanitation, Hygeine)/IPC. hss_building_block and attribute_name
 * stay blank until those labels are provided.
 *
 * Run writeFqaScoreTable after the department tabs exist. It reads
 * scores from the FQA Weighting sheet when that sheet is present.
 * pullAllForms / fullRefreshAllForms refresh this table only.
 */

const FQA_SCORE_SHEET_NAME = 'FQA Scores';
const FQA_SCORE_HEADERS = [
  'county',
  'subcounty',
  'facility',
  'facility_code',
  'facility_level',
  'department',
  'thematic_area',
  'hss_building_block',
  'attribute',
  'attribute_name',
  'score',
];

const FQA_FACILITY_REFERENCE_SPREADSHEET_ID =
  '1EEZJU-DNERkydsMIDtCu-19hzopurtAR7cN5cZ6bvFI';
const FQA_FACILITY_REFERENCE_SHEET_GID = 0;
const FQA_FACILITY_MATCH_MIN = 0.86;
const FQA_FACILITY_CANONICAL_TOKENS = [
  'hospital',
  'referral',
  'teaching',
  'county',
  'subcounty',
  'health',
  'centre',
  'center',
  'dispensary',
  'clinic',
  'medical',
  'mission',
  'district',
  'maternity',
];

/**
 * Attribute → thematic area, by department sheet name.
 * Newborn Unit commodity columns are Commodities, equipment columns
 * are Equipment, and adherence columns are Adherence to evidence
 * based practice, records columns are Health Records for clients,
 * hours of operation columns are Hours of operation,
 * infrastructure columns are Infrastructure, privacy columns are
 * Privacy/confidentiality, SOP columns are Standard operating
 * procedures/Protocols, and WASH/IPC columns are WASH (Water,
 * Sanitation, Hygeine)/IPC. Other departments stay empty until their
 * groupings are defined.
 */
const FQA_THEMATIC_AREA_MAP = {
  'Newborn Unit': {},
  'Inpatient Maternity': {},
  'Outpatient': {},
  'Lab': {},
  'Operating Theatre': {},
  'Pharmacy': {},
  'Central Store': {},
  'Facility General': {},
};

/**
 * Attribute → HSS building block, by department sheet name.
 * Leave entries empty until the groupings are defined.
 */
const FQA_HSS_BUILDING_BLOCK_MAP = {
  'Newborn Unit': {},
  'Inpatient Maternity': {},
  'Outpatient': {},
  'Lab': {},
  'Operating Theatre': {},
  'Pharmacy': {},
  'Central Store': {},
  'Facility General': {},
};

/**
 * Attribute → display name, by department sheet name.
 * Leave entries empty until the names are defined.
 */
const FQA_ATTRIBUTE_NAME_MAP = {
  'Newborn Unit': {},
  'Inpatient Maternity': {},
  'Outpatient': {},
  'Lab': {},
  'Operating Theatre': {},
  'Pharmacy': {},
  'Central Store': {},
  'Facility General': {},
};

function lookupMappedLabel_(map, department, attribute) {
  const byDept = map[department];
  if (!byDept) return '';
  const value = byDept[attribute];
  return value == null || value === '' ? '' : value;
}

function selectMultipleAttributeNames_(prefix, choices) {
  return (choices || []).map(function (choice) {
    return prefix + '_' + choice.slug;
  });
}

function assignMappedLabels_(map, department, attributes, value) {
  if (!map[department]) map[department] = {};
  (attributes || []).forEach(function (attribute) {
    if (attribute) map[department][attribute] = value;
  });
}

// cups → feeding_cups, inf_form → infant_formula, syringes → syringe_sizes,
// needles → needles_sizes. catheters/1-4, tubes/1-4, suction/1-4, and
// materials/1-6 are the select_multiple indicators.
assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Newborn Unit', [
  'tetraycline',
  'chlorhexidine',
  'iv_fluid',
  'vitk',
  'latex',
  'sterile',
  'soluset',
  'infant_formula',
  'feeding_cups',
  'syringe_sizes',
  'needles_sizes',
  'microdrippers',
  'iv_sets',
].concat(
  selectMultipleAttributeNames_('commodities_catheters', SIZE_4_6_8_CHOICES),
  selectMultipleAttributeNames_('commodities_materials', MATERIALS_CHOICES),
  selectMultipleAttributeNames_('commodities_suction', SIZE_4_6_8_CHOICES),
  selectMultipleAttributeNames_('commodities_tubes', SIZE_4_6_8_CHOICES)
), 'Commodities');

// beds → baby_beds, resuscitaires → resuscitaires_nbu, lamp → phototherapy_lamp,
// warmer → radiant_warmer, heat → heat_source, clock → wall_clock,
// thermometer → wall_thermometer, exam_light → exam_light_available,
// cpap → equipment_cpap, neobp → neonatal_bp, oximeters → oximeters_neonates,
// trans_kit → transfusion_kit, stethoscopes → stethoscopes_nbu,
// glucometer → glucometer_nbu, pump → sunction_pump, bulbs → sunction_bulbs,
// therm → thermometer_nbu, low_therm → thermometer_readings, scale → weighing_scale.
// resus_equip/1-6, oxy_source/1-6, and cannulae/1-3 are select_multiple indicators.
assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Newborn Unit', [
  'baby_beds',
  'resuscitaires_nbu',
  'bed_space',
  'phototherapy_lamp',
  'radiant_warmer',
  'heat_source',
  'wall_clock',
  'wall_thermometer',
  'exam_light_available',
  'equipment_cpap',
  'monitors',
  'neonatal_bp',
  'oximeters_neonates',
  'transfusion_kit',
  'drip_stands',
  'stethoscopes_nbu',
  'glucometer_nbu',
  'sunction_pump',
  'sunction_bulbs',
  'thermometer_nbu',
  'thermometer_readings',
  'weighing_scale',
].concat(
  selectMultipleAttributeNames_('equip_resus_equip', RESUS_EQUIP_CHOICES),
  selectMultipleAttributeNames_('equip_oxy_source', OXY_SOURCE_CHOICES),
  selectMultipleAttributeNames_('equip_cannulae', CANNULAE_CHOICES)
), 'Equipment');

// kmc2 → kmc_initiated, preterm → preterm_lowbirth, feeding → feeding_freq,
// express → express_milk, plan → monitoring_plan, neonates → neonate_review,
// disch_note → discharge_note, inf_refer → infact_referral,
// system → system_near_nbu, weight → weight_gain, condition → condition_stable,
// gestation → gestation_34wks, paediatric → paediatric_rco, care → specialized_care.
assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Newborn Unit', [
  'kmc_initiated',
  'preterm_lowbirth',
  'feeding_freq',
  'breastmilk',
  'express_milk',
  'monitoring_plan',
  'neonate_review',
  'discharge',
  'discharge_note',
  'infact_referral',
  'system_near_nbu',
  'caregiver',
  'weight_gain',
  'birth_weight',
  'condition_stable',
  'gestation_34wks',
  'paediatric_rco',
  'specialized_care',
], 'Adherence to evidence based practice');

// death_reg → death_register, consistent_use → deathreg_consistent_use,
// integrated_rh_mch → summary_register, inpatient_neonatal_reg → neonatal_register,
// nb_admission → newborn_admission. patient_files/1-13 are the
// select_multiple indicators (the form has 13 choices, not 14).
assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Newborn Unit', [
  'death_register',
  'deathreg_consistent_use',
  'summary_register',
  'neonatal_register',
  'newborn_admission',
  'perinatal_notification',
  'perinatal_review',
].concat(
  selectMultipleAttributeNames_('patient_files', PATIENT_FILES_CHOICES)
), 'Health Records for clients');

// lab_open → nbu_open
assignMappedLabels_(
  FQA_THEMATIC_AREA_MAP,
  'Newborn Unit',
  ['nbu_open'],
  'Hours of operation'
);

// maintenance → maintenance_infrastructure, lighting → well_lit,
// proc_rooms → procedure_rooms, chang_area → changing_area,
// fire → fire_extinguishers, signs → clear_signage, charter → clear_charter,
// cots → cots_incubator, priv_room → private_room, couns_room → counselling_room,
// desk → nurse_desk, neo_space → space_sick_neonates, iso_room → isolation_room,
// resus_area → resuscitation_area, sluice → sluice_room,
// temp_store → temporary_storage, dust → dust_evidence.
assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Newborn Unit', [
  'maintenance_infrastructure',
  'well_lit',
  'ventilation',
  'procedure_rooms',
  'changing_area',
  'kitchionette',
  'fire_extinguishers',
  'clear_signage',
  'clear_charter',
  'cots_incubator',
  'kmc_area',
  'room_temp',
  'draught',
  'private_room',
  'counselling_room',
  'worktop',
  'nurse_desk',
  'space_sick_neonates',
  'isolation_room',
  'resuscitation_area',
  'sluice_room',
  'temporary_storage',
  'cctv',
  'dust_evidence',
], 'Infrastructure');

assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Newborn Unit', [
  'visual_privacy',
  'auditory_privacy',
], 'Privacy/confidentiality');

// sepsis → sepsis_sop, jaundice → jaundice_sop, neo_resus →
// neonatal_resuscitation_sop, kmc → kmc_sop, handwash → handwash_sop,
// referral → referral_sop. policy/1-19 are the select_multiple
// indicators (19 choices including none).
assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Newborn Unit', [
  'sepsis_sop',
  'jaundice_sop',
  'hypoglycemia_sop',
  'neonatal_resuscitation_sop',
  'kmc_sop',
  'handwash_sop',
  'referral_sop',
].concat(
  selectMultipleAttributeNames_('sop_policy', SOP_POLICY_CHOICES)
), 'Standard operating procedures/Protocols');

// wat_sour → water_source, wav_avail → water_available_consistently,
// drainage → drainage_system, sinks → separate_sink, hand → hand_hygiene,
// waste → waste_management, bins → waste_segregation,
// clean_reg → cleaning_register, decontamination → decontamination_area,
// checklist → decontamination_checklist, utensil → utensil_cleaning_area,
// sharp → sharp_container, lat_client → latrine_clients,
// station → handwashing_station, disinfect → disinfect_washrooms,
// clean → clean_washroom, access → access_disability,
// menstrual → menstrual_hygiene.
assignMappedLabels_(FQA_THEMATIC_AREA_MAP, 'Newborn Unit', [
  'water_source',
  'water_available_consistently',
  'drainage_system',
  'separate_sink',
  'hand_hygiene',
  'waste_management',
  'waste_segregation',
  'cleaning_register',
  'decontamination_area',
  'decontamination_checklist',
  'utensil_cleaning_area',
  'laundry',
  'linen',
  'sharp_container',
  'sharp_full',
  'latrine',
  'latrine_clients',
  'handwashing_station',
  'disinfect_washrooms',
  'clean_washroom',
  'access_disability',
  'menstrual_hygiene',
], 'WASH (Water, Sanitation, Hygeine)/IPC');

function thematicAreaFor_(department, attribute) {
  return lookupMappedLabel_(FQA_THEMATIC_AREA_MAP, department, attribute);
}

function hssBuildingBlockFor_(department, attribute) {
  return lookupMappedLabel_(FQA_HSS_BUILDING_BLOCK_MAP, department, attribute);
}

function attributeNameFor_(department, attribute) {
  return lookupMappedLabel_(FQA_ATTRIBUTE_NAME_MAP, department, attribute);
}

function isBlankScoreCell_(value) {
  return value === '' || value === undefined || value === null;
}

function normalizeHeaderKey_(name) {
  return String(name == null ? '' : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function normalizeMatchText_(value) {
  return String(value == null ? '' : value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/sub[-\s]*county/g, 'subcounty')
    .replace(/health\s+center/g, 'health centre')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countyKey_(value) {
  // Muranga, Murang'a, and Murang'a County are the same county.
  return normalizeMatchText_(
    String(value == null ? '' : value).replace(/['\u2018\u2019`]/g, '')
  )
    .replace(/\bcounty\b/g, '')
    .replace(/\s+/g, '')
    .trim();
}

function facilityLevelKey_(value) {
  const text = String(value == null ? '' : value).toLowerCase();
  const labeled = text.match(/level\s*([2-6])/);
  if (labeled) return labeled[1];
  const bare = text.match(/\b([2-6])\b/);
  return bare ? bare[1] : '';
}

function canonicalizeFacilityToken_(token) {
  let best = token;
  let bestSim = 0.8;
  FQA_FACILITY_CANONICAL_TOKENS.forEach(function (canon) {
    const similarity = levenshteinSimilarity_(token, canon);
    if (similarity >= bestSim) {
      best = canon;
      bestSim = similarity;
    }
  });
  return best;
}

function facilityTokens_(value) {
  const stop = { the: true, of: true, and: true, at: true };
  return normalizeMatchText_(value).split(' ').filter(function (token) {
    return token && !stop[token];
  }).map(canonicalizeFacilityToken_);
}

function distinctiveFacilityTokens_(value) {
  const generic = {
    hospital: true,
    referral: true,
    teaching: true,
    county: true,
    subcounty: true,
    health: true,
    centre: true,
    center: true,
    dispensary: true,
    clinic: true,
    medical: true,
    mission: true,
    district: true,
    level: true,
    model: true,
    maternity: true,
  };
  return facilityTokens_(value).filter(function (token) {
    return !generic[token] && !/^[0-9]+$/.test(token);
  });
}

function levenshteinDistance_(left, right) {
  const a = String(left || '');
  const b = String(right || '');
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const prev = [];
  const curr = [];
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      const insertion = curr[j - 1] + 1;
      const deletion = prev[j] + 1;
      const substitution = prev[j - 1] + cost;
      curr[j] = Math.min(insertion, deletion, substitution);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

function levenshteinSimilarity_(left, right) {
  const a = normalizeMatchText_(left);
  const b = normalizeMatchText_(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const distance = levenshteinDistance_(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

function tokenJaccard_(leftTokens, rightTokens) {
  if (!leftTokens.length || !rightTokens.length) return 0;
  const counts = {};
  rightTokens.forEach(function (token) {
    counts[token] = (counts[token] || 0) + 1;
  });
  let inter = 0;
  leftTokens.forEach(function (token) {
    if (counts[token]) {
      inter += 1;
      counts[token] -= 1;
    }
  });
  return inter / (leftTokens.length + rightTokens.length - inter);
}

function sharesFacilityTypeToken_(left, right) {
  const types = {
    hospital: true,
    dispensary: true,
    clinic: true,
    centre: true,
    center: true,
  };
  const rightSet = {};
  facilityTokens_(right).forEach(function (token) {
    rightSet[token] = true;
  });
  return facilityTokens_(left).some(function (token) {
    return types[token] && rightSet[token];
  });
}

function facilityNameSimilarity_(left, right) {
  const a = normalizeMatchText_(left);
  const b = normalizeMatchText_(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const jaccard = tokenJaccard_(facilityTokens_(left), facilityTokens_(right));
  const distinctiveLeft = distinctiveFacilityTokens_(left);
  const distinctiveRight = distinctiveFacilityTokens_(right);
  let distinctive = 0;
  if (distinctiveLeft.length && distinctiveRight.length) {
    if (distinctiveLeft.join(' ') === distinctiveRight.join(' ')) {
      if (jaccard >= 0.45 || sharesFacilityTypeToken_(left, right)) {
        distinctive = 0.92;
      }
    } else {
      distinctive = tokenJaccard_(distinctiveLeft, distinctiveRight);
    }
  }
  let score = Math.max(jaccard, distinctive, levenshteinSimilarity_(left, right));
  if (
    (a.indexOf(b) !== -1 || b.indexOf(a) !== -1) &&
    distinctiveLeft.length &&
    distinctiveRight.length
  ) {
    score = Math.max(score, 0.9);
  }
  return score;
}

function detectFacilityReferenceColumns_(headers) {
  const normalized = (headers || []).map(normalizeHeaderKey_);
  function find(aliases) {
    for (let i = 0; i < aliases.length; i++) {
      const idx = normalized.indexOf(aliases[i]);
      if (idx !== -1) return idx;
    }
    return -1;
  }
  return {
    county: find(['county']),
    subcounty: find(['subcounty', 'sub_county', 'sub_county_name']),
    facility: find(['facility_name', 'facility', 'name']),
    facility_code: find([
      'dhis_code',
      'facility_code',
      'mfl_code',
      'mfl',
      'code',
    ]),
    facility_level: find([
      'facility_level',
      'keph_level',
      'level',
    ]),
  };
}

function parseFacilityReferenceRows_(values) {
  const rows = [];
  if (!values || values.length < 2) return rows;
  const cols = detectFacilityReferenceColumns_(values[0]);
  if (cols.facility < 0) return rows;
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row) continue;
    const facility = cellAt_(row, cols.facility);
    if (isBlankScoreCell_(facility)) continue;
    rows.push({
      county: cellAt_(row, cols.county),
      subcounty: cellAt_(row, cols.subcounty),
      facility: facility,
      facility_code: cellAt_(row, cols.facility_code),
      facility_level: cellAt_(row, cols.facility_level),
    });
  }
  return rows;
}

function isHighFacilityMatch_(query, candidate, similarity) {
  if (similarity < FQA_FACILITY_MATCH_MIN) return false;
  const qCounty = countyKey_(query.county);
  const cCounty = countyKey_(candidate.county);
  if (!qCounty || !cCounty || qCounty !== cCounty) return false;
  const qLevel = facilityLevelKey_(query.facility_level);
  const cLevel = facilityLevelKey_(candidate.facility_level);
  if (!qLevel || !cLevel || qLevel !== cLevel) return false;
  return true;
}

function findBestFacilityReference_(query, referenceRows) {
  if (!query || isBlankScoreCell_(query.facility) || !referenceRows) {
    return null;
  }
  const matches = [];
  referenceRows.forEach(function (candidate) {
    const similarity = facilityNameSimilarity_(query.facility, candidate.facility);
    if (!isHighFacilityMatch_(query, candidate, similarity)) return;
    matches.push({
      candidate: candidate,
      similarity: similarity,
    });
  });
  if (!matches.length) return null;
  matches.sort(function (a, b) {
    return b.similarity - a.similarity;
  });
  const best = matches[0];
  const bestCode = String(best.candidate.facility_code || '');
  const bestSubcounty = String(best.candidate.subcounty || '');
  for (let i = 1; i < matches.length; i++) {
    const other = matches[i];
    if (other.similarity < best.similarity - 0.02) continue;
    const otherCode = String(other.candidate.facility_code || '');
    const otherSubcounty = String(other.candidate.subcounty || '');
    if (otherCode !== bestCode || otherSubcounty !== bestSubcounty) {
      return null;
    }
  }
  return best.candidate;
}

function enrichFacilityIdentity_(identity, referenceRows, cache) {
  const next = {
    county: identity.county,
    subcounty: identity.subcounty,
    facility: identity.facility,
    facility_code: identity.facility_code,
    facility_level: identity.facility_level,
  };
  const needsCode = isBlankScoreCell_(next.facility_code);
  const needsSubcounty = isBlankScoreCell_(next.subcounty);
  if (!needsCode && !needsSubcounty) return next;
  if (isBlankScoreCell_(next.facility)) return next;
  const key =
    countyKey_(next.county) + '\t' +
    normalizeMatchText_(next.facility) + '\t' +
    facilityLevelKey_(next.facility_level);
  let match = null;
  if (cache && Object.prototype.hasOwnProperty.call(cache, key)) {
    match = cache[key];
  } else {
    match = findBestFacilityReference_(next, referenceRows);
    if (cache) cache[key] = match;
  }
  if (!match) return next;
  if (needsCode && !isBlankScoreCell_(match.facility_code)) {
    next.facility_code = match.facility_code;
  }
  if (needsSubcounty && !isBlankScoreCell_(match.subcounty)) {
    next.subcounty = match.subcounty;
  }
  return next;
}

function buildFqaWeightingScoreLookupFromValues_(values) {
  const lookup = {};
  if (!values || values.length < 2) return lookup;
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row || row.length < 5) continue;
    const department = String(row[0]);
    const variable = String(row[1]);
    const response = row[2];
    const label = row[3];
    const score = row[4];
    if (!lookup[department]) lookup[department] = {};
    if (!lookup[department][variable]) {
      lookup[department][variable] = { byLabel: {}, byResponse: {} };
    }
    const entry = lookup[department][variable];
    if (!isBlankScoreCell_(label)) {
      entry.byLabel[String(label)] = score;
    }
    if (!isBlankScoreCell_(response)) {
      entry.byResponse[String(response)] = score;
    }
  }
  return lookup;
}

function lookupScoredAttribute_(lookup, department, attribute, cellValue) {
  const byDept = lookup[department];
  const entry = byDept && byDept[attribute];
  if (!entry) return null;
  if (isBlankScoreCell_(cellValue)) return null;
  const asString = String(cellValue);
  if (Object.prototype.hasOwnProperty.call(entry.byLabel, asString)) {
    return { score: entry.byLabel[asString] };
  }
  if (Object.prototype.hasOwnProperty.call(entry.byResponse, asString)) {
    return { score: entry.byResponse[asString] };
  }
  return null;
}

function headerIndex_(headers, name) {
  return headers.indexOf(name);
}

function cellAt_(row, idx) {
  if (idx < 0) return '';
  return isBlankScoreCell_(row[idx]) ? '' : row[idx];
}

function appendFqaScoreRowsFromSheetValues_(
  rows,
  department,
  values,
  lookup,
  referenceRows,
  matchCache
) {
  if (!values || values.length < 2) return;
  const headers = values[0].map(function (header) {
    return String(header);
  });
  const countyIdx = headerIndex_(headers, 'county');
  const subcountyIdx = headerIndex_(headers, 'subcounty');
  const facilityIdx = headerIndex_(headers, 'facility');
  const facilityCodeIdx = headerIndex_(headers, 'facility_code');
  const levelIdx = headerIndex_(headers, 'facility_level');
  const scoredCols = [];
  headers.forEach(function (header, idx) {
    if (lookup[department] && lookup[department][header]) {
      scoredCols.push({ attribute: header, idx: idx });
    }
  });
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    if (!row) continue;
    const identity = enrichFacilityIdentity_({
      county: cellAt_(row, countyIdx),
      subcounty: cellAt_(row, subcountyIdx),
      facility: cellAt_(row, facilityIdx),
      facility_code: cellAt_(row, facilityCodeIdx),
      facility_level: cellAt_(row, levelIdx),
    }, referenceRows, matchCache);
    scoredCols.forEach(function (col) {
      const matched = lookupScoredAttribute_(
        lookup,
        department,
        col.attribute,
        row[col.idx]
      );
      if (!matched) return;
      rows.push([
        identity.county,
        identity.subcounty,
        identity.facility,
        identity.facility_code,
        identity.facility_level,
        department,
        thematicAreaFor_(department, col.attribute),
        hssBuildingBlockFor_(department, col.attribute),
        col.attribute,
        attributeNameFor_(department, col.attribute),
        matched.score,
      ]);
    });
  }
}

function buildFqaScoreTableRows_(
  departmentSheets,
  weightingValues,
  facilityReferenceValues
) {
  const lookup = buildFqaWeightingScoreLookupFromValues_(weightingValues);
  const referenceRows = parseFacilityReferenceRows_(facilityReferenceValues);
  const matchCache = {};
  const rows = [];
  (departmentSheets || []).forEach(function (entry) {
    appendFqaScoreRowsFromSheetValues_(
      rows,
      entry.department,
      entry.values,
      lookup,
      referenceRows,
      matchCache
    );
  });
  return rows;
}

function loadFqaWeightingValues_(ss) {
  const sheet = ss.getSheetByName(FQA_WEIGHTING_SHEET_NAME);
  if (sheet && sheet.getLastRow() > 1 && sheet.getLastColumn() > 0) {
    return sheet.getRange(1, 1, sheet.getLastRow(), 5).getValues();
  }
  return [FQA_WEIGHTING_HEADERS].concat(buildFqaWeightingTableRows_({}));
}

function sheetByGid_(ss, gid) {
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    if (String(sheets[i].getSheetId()) === String(gid)) return sheets[i];
  }
  return sheets[0];
}

function loadFacilityReferenceValues_() {
  const ss = SpreadsheetApp.openById(FQA_FACILITY_REFERENCE_SPREADSHEET_ID);
  const sheet = sheetByGid_(ss, FQA_FACILITY_REFERENCE_SHEET_GID);
  if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() < 1) {
    return [];
  }
  return sheet.getRange(
    1,
    1,
    sheet.getLastRow(),
    sheet.getLastColumn()
  ).getValues();
}

function collectDepartmentSheetValues_(ss) {
  return FORM_CONFIG.map(function (form) {
    const sheet = ss.getSheetByName(form.sheetName);
    if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() < 1) {
      return { department: form.sheetName, values: [] };
    }
    return {
      department: form.sheetName,
      values: sheet.getRange(
        1,
        1,
        sheet.getLastRow(),
        sheet.getLastColumn()
      ).getValues(),
    };
  });
}

function writeFqaScoreRowsToSheet_(sheet, rows) {
  sheet.clearContents();
  ensureSheetCapacity_(sheet, rows.length + 1, FQA_SCORE_HEADERS.length);
  sheet.getRange(1, 1, 1, FQA_SCORE_HEADERS.length)
    .setValues([FQA_SCORE_HEADERS]);
  const CHUNK = 500;
  let offset = 0;
  while (offset < rows.length) {
    const slice = rows.slice(offset, offset + CHUNK);
    sheet.getRange(
      2 + offset,
      1,
      slice.length,
      FQA_SCORE_HEADERS.length
    ).setValues(slice);
    offset += slice.length;
  }
  sheet.setFrozenRows(1);
}

/**
 * Create or refresh the FQA Scores totalling sheet from the department
 * tabs and the FQA Weighting catalog.
 */
function writeFqaScoreTable() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let facilityReferenceValues = [];
  try {
    facilityReferenceValues = loadFacilityReferenceValues_();
  } catch (err) {
    Logger.log(
      'Could not read facility reference spreadsheet: ' +
      err.message +
      (err.stack ? '\n' + err.stack : '')
    );
  }
  const rows = buildFqaScoreTableRows_(
    collectDepartmentSheetValues_(ss),
    loadFqaWeightingValues_(ss),
    facilityReferenceValues
  );
  let sheet = ss.getSheetByName(FQA_SCORE_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(FQA_SCORE_SHEET_NAME);
  writeFqaScoreRowsToSheet_(sheet, rows);
  Logger.log(
    'Wrote ' + rows.length + ' score rows to "' +
    FQA_SCORE_SHEET_NAME + '"'
  );
}
