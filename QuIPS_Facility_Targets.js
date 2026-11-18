/**
 * QuIPS — facility observation targets.
 *
 * Lookup key is the MFL facility code (the part before "_" on the Kobo
 * facility choice). Missing codes contribute a blank target_observations
 * cell. A target of 0 is kept.
 *
 * Two live form choices still use the previous code. Those aliases point
 * at the same target so current submissions still match:
 *   Shimo La Tewa Annex: table 11393, form choice 11395
 *   Naivasha (AIC) Medical Centre: table 15282, form choice 28410
 */

function getQuipsFacilityTargets_() {
  return {
    // Nakuru
    "14224": 22,
    "15358": 12,
    "15156": 12,
    "15212": 22,
    "14431": 12,
    "15398": 16,
    "14836": 12,
    "15188": 3,
    "15008": 13,
    "14265": 15,
    "22859": 10,
    "15200": 3,
    "15495": 5,
    "15119": 2,
    "15678": 8,
    "14207": 7,
    "15288": 71,
    "20137": 6,
    "16683": 4,
    "14510": 18,
    "14926": 6,
    "15282": 7,
    "28410": 7,
    "15250": 3,
    "15280": 59,
    "15108": 10,

    // Mombasa
    "11436": 4,
    "26142": 1,
    "11620": 4,
    "11740": 18,
    "11254": 4,
    "11774": 3,
    "18210": 10,
    "18043": 5,
    "11861": 17,
    "11289": 40,
    "25221": 4,
    "11393": 2,
    "11395": 2,
    "11522": 21,
    "19606": 27,
    "18435": 3,
    "11785": 3,
    "11592": 2,
    "23053": 5,

    // Muranga
    "10777": 30,
    "10639": 14,
    "10782": 7,
    "10459": 15,
    "10199": 5,
    "10627": 5,
    "10588": 13,
    "10470": 6,
    "10357": 4,
    "10686": 22,
    "10674": 7,
    "10441": 1,
    "10687": 0,

    // Kisii
    "13772": 5,
    "13545": 4,
    "13673": 7,
    "13594": 19,
    "13891": 6,
    "13867": 2,
    "13564": 4,
    "20914": 9,
    "13783": 4,
    "13680": 9,
    "13527": 6,
    "13918": 6,
    "13847": 5,
    "13550": 4,
    "14139": 6,
    "13631": 4,
    "13703": 46,
    "13620": 2,
    "14025": 2,
    "13991": 7,
    "14028": 1,
    "25454": 1,
    "20633": 4,
    "13925": 1,
    "13515": 3,

    // Makueni
    "12508": 8,
    "12787": 8,
    "12808": 2,
    "12147": 3,
    "12341": 3,
    "12314": 8,
    "12565": 3,
    "12291": 12,
    "18596": 10,
    "12547": 3,
    "12455": 13,
    "18260": 4,
    "12676": 1,
    "12485": 7,
    "12457": 21,
    "12777": 16,

    // Kakamega
    "15915": 36,
    "16078": 13,
    "15833": 13,
    "15940": 6,
    "15836": 13,
    "15969": 14,
    "16010": 5,
    "16037": 10,
    "15996": 25,
    "15961": 14,
    "16008": 9,
    "15899": 11,
    "16107": 8,
    "16030": 13,
    "25166": 10,
    "16141": 4
  };
}

function getQuipsFacilityTarget_(facilityCode) {
  if (!facilityCode) return "";
  var targets = getQuipsFacilityTargets_();
  var code = String(facilityCode);
  return Object.prototype.hasOwnProperty.call(targets, code) ? targets[code] : "";
}
