# Project Noir

Shared financial books for **LAUNDRY NOIR**. Shop staff submit client orders and expenditures; the manager sees them live and runs income statement, balance sheet, payback, and dashboard.

## Roles

| Login | Password (default) | Can do |
| --- | --- | --- |
| `staff` | `staff123` | Submit orders & expenses from phone or shop PC |
| `manager` | `manager123` | Full books, edit/delete, balance sheet, statements |

Change passwords with env vars `NOIR_STAFF_PASSWORD` and `NOIR_MANAGER_PASSWORD`.

## Where data goes

Data is stored in a **shared SQLite database** on the computer running the server:

`Project Noir/server/data/noir.db`

When staff submits an order on her phone, it is written there. When you sign in as manager (any device pointing at the same server), you see it immediately and the income statement / KPIs recalculate.

## Run (manager computer or always-on shop PC)

```bash
cd "Project Noir"
pip install -r requirements.txt
python3 server/app.py
```

Open **http://localhost:5173**

### Phone / shop tablet (same Wi‑Fi)

1. On the server computer, find its LAN IP (e.g. `192.168.1.40`).
2. On the phone browser open: `http://192.168.1.40:5173`
3. Sign in as `staff` / `staff123`
4. Submit orders or expenses → manager refreshes (or reopens Dashboard) to process

Keep `python3 server/app.py` running while people are entering data.

## Sheet mapping

| Sheet | App |
| --- | --- |
| sales_revenue | Orders |
| Expenditures | Expenditures |
| Income Statement | Income Statement |
| Balance Sheet | Balance Sheet |
| Payback Period | Payback |
| Data Analysis | Dashboard |

Source workbook: [Laundry Noir Google Sheet](https://docs.google.com/spreadsheets/d/1Mc1fgr9olwLPzxfIT0kmcSvJpasDC_Z0UqnPJMuee48/edit)
