# Project Noir

Financial management system for **LAUNDRY NOIR**, modeled on the Google Sheets workbook (sales, expenditures, income statement, balance sheet, payback period, and analytics).

## What it does

- Enter **client / order** lines (customer, service, qty, unit price, payment & delivery status)
- Enter **expenditures** (category, description, amount, source, payment method)
- Auto-calculates **quotation** (`qty × unit price`) and weekday from order date
- Builds monthly **Income Statement** by service and expense description (same SUMPRODUCT logic as the sheet)
- Maintains **Balance Sheet**, **Payback Period**, and **Dashboard** KPIs

## Run locally

```bash
cd "Project Noir"
python3 -m http.server 5173
```

Open http://localhost:5173

Data is stored in the browser (`localStorage`). Use **Reset to seed** to reload the anonymized sample imported from the spreadsheet, or **Export / Import JSON** to move your real books.

## Sheet mapping

| Sheet | App view |
| --- | --- |
| `sales_revenue` | Orders |
| `Expenditures` | Expenditures |
| `Income Statement` | Income Statement |
| `Balance Sheet` | Balance Sheet |
| `Payback Period` | Payback |
| `Data Analysis` | Dashboard |

Source workbook: [Laundry Noir Google Sheet](https://docs.google.com/spreadsheets/d/1Mc1fgr9olwLPzxfIT0kmcSvJpasDC_Z0UqnPJMuee48/edit)
