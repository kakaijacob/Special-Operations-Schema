# Kobo pipeline secrets

Credentials and sensitive IDs are **not** stored in source. They live in
Apps Script **Project Settings → Script properties**.

The live Kobo API token was previously committed in `setupKoboDeployConfig()`
and several transformation files. **Rotate that token in Kobo**
(Account Settings → API Key → delete / regenerate) after this change, then
store the new token as described below.

## What is a secret

| Kind | Examples | Rule |
|------|----------|------|
| Token | `KOBO_KPI_API_TOKEN` | Never in git, never logged in full |
| Identifier | Kobo asset UIDs, Google Spreadsheet IDs | Script Properties only; logs show `aJaB…Xze` |
| Public | KPI base URL, sheet names | Safe to keep as code defaults |

## One-time setup

1. Copy `Kobo_Secrets.js` into the Apps Script project **first**.
2. In the bound spreadsheet: **Kobo Tools → Secrets**
   - **Set Kobo API token…**
   - **Set source spreadsheet IDs…** (Mentee Database 2026, Mentor IFM Database 2026)
   - **Set asset UID…** for each tool: `emonc_ctf`, `newborn_ctf`, `moh_sac`, `newborn_ka`, `emonc_ka`
3. Run **Check secrets**. Every required key should say `SET` with a masked value.
4. Then run **Run Full Pipeline**.

You can also set properties by hand:

Apps Script → **Project Settings → Script properties → Add script property**

| Property | Required | Notes |
|----------|----------|-------|
| `KOBO_KPI_API_TOKEN` | yes | Kobo Account Settings → API Key |
| `KOBO_KPI_BASE_URL` | no | Defaults to `https://eu.kobotoolbox.org` |
| `MENTEE_DATABASE_2026_SPREADSHEET_ID` | yes | ID from the Google Sheet URL |
| `MENTOR_IFM_DATABASE_2026_SPREADSHEET_ID` | yes | ID from the Google Sheet URL |
| `KOBO_ASSET_UID_EMONC_CTF` | yes | Existing Kobo project UID |
| `KOBO_ASSET_UID_NEWBORN_CTF` | yes | |
| `KOBO_ASSET_UID_MOH_SAC` | yes | |
| `KOBO_ASSET_UID_NEWBORN_KA` | yes | |
| `KOBO_ASSET_UID_EMONC_KA` | yes | |
| `EMONC_CTF_2026_SPREADSHEET_ID` | no | Created by the builder if missing |
| `NEWBORN_CTF_SPREADSHEET_ID` | no | |
| `MOH_SAC_SPREADSHEET_ID` | no | |
| `NEWBORN_KA_SPREADSHEET_ID` | no | |
| `EMONC_KA_SPREADSHEET_ID` | no | |
| `KOBO_ASSET_UID_PO_EMONC_KA` | no | Used by the PO EmONC pull |
| `KOBO_ASSET_UID_QUIPS` | no | Used by the QuIPS pull |

## Editor helpers

```javascript
setKoboSecret("KOBO_KPI_API_TOKEN", "paste-here-then-delete-this-call")
promptSetKoboApiToken()
listKoboSecrets()          // safe to share the log
clearKoboSecret("KOBO_KPI_API_TOKEN")
```

Do not leave a real token in a function argument and save the file.

## How the pipeline uses secrets

- `refreshAllKoboTools()` calls `requireKoboPipelineSecrets_()` before sync.
- `getKoboApiToken_()` is the only way deploy and data-pull scripts read the token.
- Logs call `maskKoboSecret_()` so Executions never print a full token or UID.
- `setupKoboDeployConfig()` no longer embeds or overwrites credentials.

## Transformation scripts

`EmONC_Curriculum_Activities_Log_Transformation.js` and the other Kobo pulls
now call `getKoboApiToken_()` / `getKoboAssetUidSecret_()`. They need
`Kobo_Secrets.js` in the same Apps Script project.
