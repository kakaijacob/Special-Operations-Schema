/**
 * QuIPS — quality-of-care scoring.
 *
 * calculateQualityCareScore returns a proportion (0–1).
 * calculateSectionScores returns the same proportion for each section.
 * Both ignore "unable to observe", "not applicable", "resuscitation required",
 * and "not taken" via isValidResponse.
 *
 * Score rules below match the previous single-file script, including the
 * labour-care-guide branch that also holds respectful-care points.
 */

function isValidResponse(value) {
  if (value === null || value === undefined || value === "") return false;

  var v = String(value).trim().toLowerCase();

  return ![
    "unable to observe",
    "unable_to_observe",
    "not applicable",
    "not_applicable",
    "resuscitation required",
    "not taken"
  ].includes(v);
}

function scoreYes(value, points) {
  if (points === undefined) points = 2;
  return isValidResponse(value) &&
    String(value).trim().toLowerCase() === "yes"
    ? points
    : 0;
}

function scoreNo(value, points) {
  if (points === undefined) points = 2;
  return isValidResponse(value) &&
    String(value).trim().toLowerCase() === "no"
    ? points
    : 0;
}

function calculateQualityCareScore(t) {
  var score = 0;
  var totalPossible = 0;

  var essentialIndicators = [
    "hand_hygiene", "nnr_equipment_preparation", "uterotonic_preparation", "ruleout_twin",
    "timely_uterotonic_administration", "drying_stimulation", "discard_wet_towel",
    "sterilized_blade_clamp", "newborn_kept_warm", "controlled_cord_traction",
    "placenta_examination", "uterine_tone_assessed", "laceration_check",
    "take_mother_bp", "timely_mother_bp", "take_mother_temperature", "timely_mother_temp",
    "take_mother_pulse", "timely_mother_pulse", "apgar_min1", "apgar_min5",
    "administer_vitamin_k", "timely_vitamink_administration", "provider_initiate_breastfeeding",
    "timely_breastfeeding_initiation", "maternal_bleeding_assessed", "sharps_disposal",
    "waste_disposal", "birth_companion"
  ];

  essentialIndicators.forEach(function (field) {
    if (isValidResponse(t[field])) {
      score += scoreYes(t[field], 2);
      totalPossible += 2;
    }
  });

  if (isValidResponse(t.uterotonic_administered)) {
    var uterotonic = String(t.uterotonic_administered).trim().toLowerCase();
    totalPossible += 2;
    if (uterotonic !== "none of the above" && uterotonic !== "none_of_the_above") {
      score += 2;
    }
  }

  var resuscitation = String(t.baby_resuscitation || "").toLowerCase() === "yes";

  if (!resuscitation) {
    ["skin_to_skin", "adequate_skin_to_skin_time", "timely_cord_clamp"].forEach(function (field) {
      if (isValidResponse(t[field])) {
        score += scoreYes(t[field], 2);
        totalPossible += 2;
      }
    });
  }

  var hasPPH = t.pph_diagnosis_time && String(t.pph_diagnosis_time).trim() !== "";

  if (hasPPH) {
    [
      "uterine_massage_initiated",
      "oxytocin_first_line",
      "txa_administered",
      "iv_access_fluids"
    ].forEach(function (field) {
      if (isValidResponse(t[field])) {
        score += scoreYes(t[field], 2);
        totalPossible += 2;
      }
    });
  }

  [
    "ppe_gloves",
    "ppe_mask",
    "ppe_gown",
    "ppe_boots",
    "ppe_goggles",
    "ppe_cap"
  ].forEach(function (field) {
    score += scoreYes(t[field], 2 / 6);
    totalPossible += 2 / 6;
  });

  [
    "fundal_pressure",
    "perineum_stretching",
    "newborn_slapped",
    "newborn_upside_down"
  ].forEach(function (field) {
    if (isValidResponse(t[field])) {
      score += scoreNo(t[field], 2);
      totalPossible += 2;
    }
  });

  if (isValidResponse(t.observer_intervention)) {
    score += scoreNo(t.observer_intervention, 1);
    totalPossible += 1;
  }

  var tool = String(t.labor_monitoring_tool || "").toLowerCase();

  if (tool === "partograph") {
    [
      "partogragh_initiation",
      "partograph_half_hr",
      "fetal_heart_correct",
      "maternal_pulse_correct",
      "bp_4hrs",
      "partograph_summary_filled",
      "delivery_method_filled",
      "blood_loss_estimation"
    ].forEach(function (field) {
      if (isValidResponse(t[field])) {
        score += scoreYes(t[field], 2);
        totalPossible += 2;
      }
    });

    score += scoreNo(t.partograph_accuracy_concern, 1);
    totalPossible += 1;

  } else if (tool === "labor care guide") {
    [
      "lcg_initiated_correct",
      "contractions_monitored_1st",
      "fhr_monitored_1st",
      "bp_monitored_recorded",
      "contractions_monitored_2nd",
      "fhr_monitored_2nd",
      "delivery_time_documented",
      "delivery_method_documented",
      "ebl_documented_correctly"
    ].forEach(function (field) {
      if (isValidResponse(t[field])) {
        score += scoreYes(t[field], 2);
        totalPossible += 2;
      }
    });

    if (isValidResponse(t.lcg_accuracy_concern)) {
      score += scoreNo(t.lcg_accuracy_concern, 1);
      totalPossible += 1;
    }

    if (isValidResponse(t.method_blood_loss)) {
      var method = String(t.method_blood_loss).toLowerCase();

      if (method.includes("measure with a calibrated jar")) {
        score += 2;
        totalPossible += 2;
      } else if (
        method.includes("weighing of bloodsoaked materials") ||
        method.includes("weighing of blood soaked materials")
      ) {
        score += 2;
        totalPossible += 2;
      } else if (method.includes("v drape")) {
        score += 1;
        totalPossible += 1;
        totalPossible += 1;
        if (String(t.proper_vdrape_use || "").toLowerCase() === "yes") {
          score += 1;
        }
      }
    }

    // Respectful-care points stay inside this branch so totals match the
    // previous script: they apply on Labour Care Guide observations only.
    [
      "provider_explanations",
      "spoken_to_directly",
      "spoken_to_kindly"
    ].forEach(function (field) {
      if (isValidResponse(t[field])) {
        var val = String(t[field]).toLowerCase();
        if (val === "always") {
          score += 2;
        } else if (val === "sometimes") {
          score += 1;
        }
        totalPossible += 2;
      }
    });

    if (isValidResponse(t.rmc_no_disrespect_to_mother)) {
      if (String(t.rmc_no_disrespect_to_mother).toLowerCase() === "yes") {
        score += 2;
      }
      totalPossible += 2;
    }
  }

  if (totalPossible === 0) return 0;
  return Number((score / totalPossible).toFixed(3));
}

function calculateSectionScore(t, fields, weight) {
  if (weight === undefined) weight = 2;
  var score = 0;
  var total = 0;

  fields.forEach(function (f) {
    if (isValidResponse(t[f])) {
      score += scoreYes(t[f], weight);
      total += weight;
    }
  });

  return total === 0 ? 0 : Number((score / total).toFixed(3));
}

function calculateSectionScores(t) {
  return {
    birth_preparedness: calculateSectionScore(t, [
      "hand_hygiene",
      "ppe_gloves",
      "ppe_mask",
      "ppe_gown",
      "ppe_boots",
      "ppe_goggles",
      "ppe_cap",
      "nnr_equipment_preparation",
      "uterotonic_preparation"
    ]),

    technical_quality_postbirth: calculateSectionScore(t, [
      "ruleout_twin",
      "uterotonic_administered",
      "timely_uterotonic_administration",
      "drying_stimulation",
      "discard_wet_towel",
      "skin_to_skin",
      "adequate_skin_to_skin_time",
      "timely_cord_clamp",
      "sterilized_blade_clamp",
      "newborn_kept_warm",
      "controlled_cord_traction",
      "placenta_examination",
      "uterine_tone_assessed",
      "laceration_check",
      "method_blood_loss",
      "proper_vdrape_use",
      "uterine_massage_initiated",
      "oxytocin_first_line",
      "txa_administered",
      "iv_access_fluids",
      "take_mother_bp",
      "timely_mother_bp",
      "take_mother_temperature",
      "timely_mother_temp",
      "take_mother_pulse",
      "timely_mother_pulse",
      "apgar_min1",
      "apgar_min5",
      "administer_vitamin_k",
      "timely_vitamink_administration",
      "provider_initiate_breastfeeding",
      "timely_breastfeeding_initiation",
      "maternal_bleeding_assessed"
    ]),

    postbirth_infection_prevention: calculateSectionScore(t, [
      "sharps_disposal",
      "waste_disposal"
    ]),

    respectful_maternity_care: calculateSectionScore(t, [
      "birth_companion",
      "provider_explanations",
      "spoken_to_directly",
      "spoken_to_kindly",
      "rmc_no_disrespect_to_mother"
    ]),

    avoidance_harmful_practices: calculateSectionScore(t, [
      "fundal_pressure",
      "perineum_stretching",
      "newborn_slapped",
      "newborn_upside_down"
    ]),

    partograph_review: calculateSectionScore(t, [
      "partogragh_initiation",
      "partograph_half_hr",
      "fetal_heart_correct",
      "maternal_pulse_correct",
      "bp_4hrs",
      "partograph_summary_filled",
      "delivery_method_filled",
      "blood_loss_estimation",
      "partograph_accuracy_concern"
    ]),

    labor_care_guide_review: calculateSectionScore(t, [
      "lcg_initiated_correct",
      "contractions_monitored_1st",
      "fhr_monitored_1st",
      "bp_monitored_recorded",
      "contractions_monitored_2nd",
      "fhr_monitored_2nd",
      "delivery_time_documented",
      "delivery_method_documented",
      "ebl_documented_correctly",
      "lcg_accuracy_concerns"
    ])
  };
}
