/**
 * Unit tests for kobocreator Eligible/Ineligible → Active/Inactive mapping.
 */

function mapEligibleStatusValue_(rawStatus) {
  var cleaned = String(rawStatus == null ? "")
    .trim()
    .toLowerCase();

  if (cleaned === "eligible") return "Active";
  if (cleaned === "ineligible") return "Inactive";
  return null;
}

function findStatusColumnIndex_(headerRow) {
  for (var c = 0; c < headerRow.length; c++) {
    if (
      String(headerRow[c] == null ? "" : headerRow[c])
        .trim()
        .toLowerCase() === "status"
    ) {
      return c;
    }
  }
  return -1;
}

/** Pure in-memory rewrite mirroring normalizeEligibleStatusOnSheet_. */
function normalizeEligibleStatusInMemory_(data) {
  if (!data || data.length < 2) return { data: data, changed: false };

  var statusIndex = findStatusColumnIndex_(data[0]);
  if (statusIndex === -1) return { data: data, changed: false };

  var changed = false;
  for (var i = 1; i < data.length; i++) {
    var mapped = mapEligibleStatusValue_(data[i][statusIndex]);
    if (mapped !== null) {
      data[i][statusIndex] = mapped;
      changed = true;
    }
  }
  return { data: data, changed: changed };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function testMapValues() {
  assert(mapEligibleStatusValue_("Eligible") === "Active", "Eligible");
  assert(mapEligibleStatusValue_(" eligible ") === "Active", "Eligible padded");
  assert(mapEligibleStatusValue_("INELIGIBLE") === "Inactive", "Ineligible");
  assert(mapEligibleStatusValue_("Active") === null, "Active unchanged");
  assert(mapEligibleStatusValue_("Inactive") === null, "Inactive unchanged");
  assert(mapEligibleStatusValue_("") === null, "blank unchanged");
}

function testMenteeAndIfmTables() {
  var mentee = [
    ["Name", "Status", "Mentee ID"],
    ["Ann", "Eligible", "712345678"],
    ["Ben", "Ineligible", "712345679"],
    ["Cara", "Active", "712345680"]
  ];
  var ifm = [
    ["Name", "status", "IFM ID"],
    ["Eve", "Eligible", "712345681"],
    ["Fay", "Inactive", "712345682"]
  ];

  var menteeResult = normalizeEligibleStatusInMemory_(mentee);
  assert(menteeResult.changed === true, "mentee changed");
  assert(mentee[1][1] === "Active", "mentee Eligible→Active");
  assert(mentee[2][1] === "Inactive", "mentee Ineligible→Inactive");
  assert(mentee[3][1] === "Active", "mentee Active kept");

  var ifmResult = normalizeEligibleStatusInMemory_(ifm);
  assert(ifmResult.changed === true, "ifm changed");
  assert(ifm[1][1] === "Active", "ifm Eligible→Active");
  assert(ifm[2][1] === "Inactive", "ifm Inactive kept");
}

testMapValues();
testMenteeAndIfmTables();
console.log("All kobocreator Eligible→Active status tests passed.");
