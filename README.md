# Kobo-Tool-Builder

JavaScript utilities for creating, cleaning, and structuring Kobo survey and choices sheets.

## QuIPS Kobo Tool (Google Apps Script)

Files:
- `forms/QuIPS Kobo Tool.xlsx` — XLSForm source of truth
- `QuIPS_Kobo_Tool.js` — Apps Script (sheet setup, facility rebuild, Kobo push)
- `QuIPS_Kobo_Tool_Seed.js` — seed data for `survey` / `choices` / `settings` / `Facility_Master`

### Setup
1. Create a Google Sheet → **Extensions → Apps Script**
2. Add both `QuIPS_Kobo_Tool.js` and `QuIPS_Kobo_Tool_Seed.js` to the project
3. Run **QuIPS Kobo Tool → Initialize workbook**
4. On the `Config` sheet, set:
   - `KOBO_SERVER` (default `https://kf.humanitarianresponse.info`)
   - `API_TOKEN`
   - `ASSET_UID`
5. Edit `Facility_Master` → **Rebuild facilities from master**
6. **Push form to Kobo** (or **Push + redeploy**)
