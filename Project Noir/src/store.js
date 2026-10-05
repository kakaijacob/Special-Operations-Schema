/**
 * Local persistence for Project Noir.
 */

const STORAGE_KEY = "project-noir-v1";

export async function loadSeed() {
  const res = await fetch("./data/seed.json");
  if (!res.ok) throw new Error("Could not load seed data");
  return res.json();
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function ensureIds(state) {
  for (const o of state.orders) {
    if (!o.id) o.id = uid("ord");
  }
  for (const e of state.expenditures) {
    if (!e.id) e.id = uid("exp");
  }
  return state;
}

export function downloadJson(state, filename = "project-noir-backup.json") {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
