# QuIPS Scorecard Alignment to Labor Care Guide Pattern

Reference: [Labor Care Guide Scorecard](https://colab.research.google.com/drive/1eTfMtn5o4iUd7CIeXjJcBel2iVl2Bh4n#scrollTo=oV_-pxSvUHP0) (cell `@title Labor Care Guide Scorecard`).

## Required pattern (from LCG)

1. **Power BI-style `Slicer`** with search, Select all, blank handling, and `set_options()` for cascading lists
2. **County → Facility cascade** via `update_facility_options` (county change rebuilds facility options)
3. **Month range** From / To dropdowns (`All` = no limit)
4. **Invalid values** excluded: `""`, `Unable to observe`, `Not applicable`, `NA`, `N/A`
5. **`normalize()`** + domain `compute_score` (Yes/No case-insensitive; inverted “No = good” where needed)
6. **Columns**: Indicator (or Section), Score, one column per month in range, Status, Trend
7. **Trend**: `'To'` month (or current calendar month if To=All) vs the month before it, scored on county/facility-filtered data **without** the month-range limit
8. **Status icons**: 🟢 ≥80, 🟠 ≥60, 🔴 &lt;60, ⚪ N/A
9. **Auto-close slicers** on outside click (`Javascript` + `_slicerCleanup`)

## Review results

| Cell | Scorecard | Before | After |
|------|-----------|--------|-------|
| 10 | Quality of Care Score Card by Section Over Time | Old Slicer (no `set_options`), no cascade, no auto-close | Aligned |
| 11 | Key QuIPS Proposed Indicators | Same gaps (+ cadre slicer kept) | Aligned |
| 12 | Birth Preparedness | Same gaps | Aligned |
| 13 | Technical Quality After Birth | Same gaps | Aligned |
| 14 | Uterotonic Administered (% by category) | Same gaps; category % scoring kept | Aligned filters/UI |
| 15 | Method of Blood Loss Measurement (% by category) | Same gaps; category % scoring kept | Aligned filters/UI |
| 16 | Maternal Vitals & Documentation | Same gaps | Aligned |
| 17 | EMOTIVE | Same gaps | Aligned |
| 18 | Infection Prevention | Same gaps; Yes/No was case-sensitive | Aligned + normalize/lower |
| 19 | Respectful Maternity Care | Had normalize; missing cascade/auto-close | Aligned |
| 20 | Avoidance of Harmful Practices | Had normalize; missing cascade/auto-close | Aligned |
| 21 | Harmful Practices (% with instance) | Same gaps; inverted trend colors kept | Aligned filters/UI |
| 22 | Partograph Review | Cascade already present; no auto-close | Auto-close added |
| 23 | **Labor Care Guide** | Reference | Unchanged |

## Intentionally not converted to LCG monthly scorecard shape

- **QuIPS-FQA** (cell 45): insight / readiness matrix with practice-level and FQA readiness filters. Different product surface (not Indicator / monthly Score / Status / Trend). Still uses classic `Dropdown`s; optional follow-up to migrate those filters to `Slicer`.
- **Deep-dive chart cells** (Birth Preparedness v1/v2, PPE, etc.): exploratory plots, not scorecards.

## How to apply in Colab

1. Open the live QuIPS Colab.
2. For each scorecard cell, paste from `colab/scorecards/NN_*.py` (or re-upload `colab/QuIPS_Scorecards_aligned.ipynb` / `colab/QuIPS_Dashboard_aligned.ipynb`).
3. Run **Data Importation** first, then each scorecard cell.
