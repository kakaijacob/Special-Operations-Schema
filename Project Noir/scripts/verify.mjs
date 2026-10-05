import { readFileSync } from "fs";
import { recompute } from "../src/compute.js";

const state = JSON.parse(readFileSync(new URL("../data/seed.json", import.meta.url), "utf8"));
const { income, balance } = recompute(state);

const checks = [
  ["July revenue", income.totalRevenue.July, 5922],
  ["August revenue (incl. services beyond sheet list)", income.totalRevenue.August, 13440],
  ["annual COS", Math.round(income.annualExpenditure * 100) / 100, 34065],
  ["total fixed assets", balance.totalFixedAssets, 493864],
  ["total capital", balance.totalCapital, 493864],
  ["jacob capital", balance.jacobCapital, 463864],
];

let failed = 0;
for (const [label, got, want] of checks) {
  const ok = Math.abs(got - want) < 0.05;
  console.log(`${ok ? "OK" : "FAIL"} ${label}: got ${got} want ${want}`);
  if (!ok) failed++;
}
process.exit(failed ? 1 : 0);
