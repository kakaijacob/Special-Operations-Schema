/**
 * QuIPS — facility observation targets.
 *
 * Lookup key is the MFL facility code (the part before "_" on the Kobo
 * facility choice). Missing codes contribute a blank target_observations
 * cell. Edit the map here when a facility's monthly target changes.
 */

function getQuipsFacilityTargets_() {
  return {
    "11436": 5,
    "26142": 5,
    "11620": 5,
    "11740": 18,
    "11254": 5,
    "11774": 5,
    "18210": 10,
    "18043": 5,
    "11861": 17,
    "11289": 40,
    "25221": 5,
    "11395": 5,
    "11522": 21,
    "19606": 27,
    "18435": 5,
    "11785": 5,
    "11592": 5,
    "23053": 5,
    "14224": 22,
    "15358": 12,
    "15156": 12,
    "15212": 22,
    "14431": 12,
    "15398": 16,
    "14836": 12,
    "15188": 5,
    "15008": 13,
    "14265": 15,
    "22859": 10,
    "15200": 5,
    "15495": 5,
    "15119": 5,
    "15678": 8,
    "14207": 7,
    "15288": 71,
    "20137": 6,
    "16683": 5,
    "14510": 18,
    "14926": 6,
    "28410": 7,
    "15250": 5,
    "15280": 59,
    "15108": 10,
    "10777": 30,
    "10639": 14,
    "10782": 7,
    "10459": 15,
    "10199": 5,
    "10627": 5,
    "10588": 13,
    "10470": 6,
    "10357": 5,
    "10686": 22,
    "10674": 7
  };
}

function getQuipsFacilityTarget_(facilityCode) {
  if (!facilityCode) return "";
  var targets = getQuipsFacilityTargets_();
  var code = String(facilityCode);
  return Object.prototype.hasOwnProperty.call(targets, code) ? targets[code] : "";
}
