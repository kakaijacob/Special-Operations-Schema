import {
  recompute,
  quotation,
  weekdayName,
  money,
  moneyKes,
  MONTHS,
} from "./compute.js";
import {
  loadSeed,
  loadState,
  saveState,
  clearState,
  ensureIds,
  uid,
  downloadJson,
} from "./store.js";

const VIEWS = [
  { id: "dashboard", label: "Dashboard", subtitle: "Sales volume, revenue, spend, and profit at a glance." },
  { id: "orders", label: "Orders", subtitle: "Key in client details and service lines — quotation is qty × unit price." },
  { id: "expenditures", label: "Expenditures", subtitle: "Record costs by category and description; feeds the income statement." },
  { id: "income", label: "Income Statement", subtitle: "Monthly revenue by service and costs by description (sheet logic)." },
  { id: "balance", label: "Balance Sheet", subtitle: "Assets, liabilities, and owners’ capital (Jacob / Whitney)." },
  { id: "payback", label: "Payback", subtitle: "Cumulative cash flow from capital invested to recovery." },
];

let state = null;
let view = "dashboard";
let orderFilter = "";
let expFilter = "";
let editingOrderId = null;
let editingExpId = null;

const el = {
  nav: document.getElementById("nav"),
  view: document.getElementById("view"),
  title: document.getElementById("view-title"),
  subtitle: document.getElementById("view-subtitle"),
  toast: document.getElementById("toast"),
};

function toast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.add("show");
  setTimeout(() => el.toast.classList.remove("show"), 2200);
}

function persist() {
  saveState(state);
}

function computed() {
  return recompute(state);
}

function badge(status) {
  const s = (status || "").toLowerCase();
  const cls = s.includes("paid") || s.includes("delivered") ? s.includes("pending") ? "pending" : s.includes("paid") ? "paid" : "delivered" : "pending";
  return `<span class="badge ${cls}">${escapeHtml(status || "—")}</span>`;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function optionList(values, selected = "") {
  return values
    .map((v) => `<option value="${escapeHtml(v)}" ${v === selected ? "selected" : ""}>${escapeHtml(v)}</option>`)
    .join("");
}

function renderNav() {
  el.nav.innerHTML = VIEWS.map(
    (v) => `<button type="button" data-view="${v.id}" class="${v.id === view ? "active" : ""}">${v.label}</button>`
  ).join("");
  el.nav.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      view = btn.dataset.view;
      editingOrderId = null;
      editingExpId = null;
      render();
    });
  });
}

function render() {
  const meta = VIEWS.find((v) => v.id === view);
  el.title.textContent = meta.label;
  el.subtitle.textContent = meta.subtitle;
  renderNav();
  const c = computed();
  if (view === "dashboard") el.view.innerHTML = renderDashboard(c);
  if (view === "orders") el.view.innerHTML = renderOrders(c);
  if (view === "expenditures") el.view.innerHTML = renderExpenditures(c);
  if (view === "income") el.view.innerHTML = renderIncome(c);
  if (view === "balance") el.view.innerHTML = renderBalance(c);
  if (view === "payback") el.view.innerHTML = renderPayback(c);
  bindViewEvents();
}

function renderDashboard(c) {
  const d = c.dashboard;
  const cls = (n) => (n < 0 ? "neg" : n > 0 ? "pos" : "");
  return `
    <div class="kpi-grid">
      <div class="kpi"><div class="label">Sales volume</div><div class="value">${d.salesVolume}</div></div>
      <div class="kpi"><div class="label">Sales revenue</div><div class="value">${moneyKes(d.salesRevenue)}</div></div>
      <div class="kpi"><div class="label">Cost of sales (annual)</div><div class="value">${moneyKes(d.totalExpenditure)}</div></div>
      <div class="kpi"><div class="label">Net profit</div><div class="value ${cls(d.netProfit)}">${moneyKes(d.netProfit)}</div></div>
      <div class="kpi"><div class="label">Gross margin</div><div class="value">${(d.profitMargin * 100).toFixed(1)}%</div></div>
      <div class="kpi"><div class="label">Jacob P/L</div><div class="value ${cls(d.jacobProfit)}">${moneyKes(d.jacobProfit)}</div></div>
      <div class="kpi"><div class="label">Whitney P/L</div><div class="value ${cls(d.whitneyProfit)}">${moneyKes(d.whitneyProfit)}</div></div>
      <div class="kpi"><div class="label">Total equity</div><div class="value">${moneyKes(d.totalEquity)}</div></div>
    </div>
    <div class="panel" style="margin-top:1rem">
      <h2>Collections pulse</h2>
      <p class="muted">${d.paid} paid · ${d.pending} pending · capital in books ${moneyKes(d.totalCapital)}</p>
    </div>
  `;
}

function emptyOrder() {
  return {
    id: "",
    customerName: "",
    customerId: "",
    orderDate: new Date().toISOString().slice(0, 10),
    deliveryDate: "",
    customerTag: "Household",
    location: "Gatongora",
    building: "",
    service: state.catalog.revenueServices?.[0] || "Wash & Fold",
    quantity: 1,
    unitPrice: 100,
    paymentStatus: "Pending",
    deliveryStatus: "Pending",
    notes: "",
  };
}

function orderFormValues() {
  if (!editingOrderId) return emptyOrder();
  return state.orders.find((o) => o.id === editingOrderId) || emptyOrder();
}

function renderOrders() {
  const draft = orderFormValues();
  const q = orderFilter.trim().toLowerCase();
  const rows = state.orders
    .filter((o) => {
      if (!q) return true;
      return [o.customerName, o.customerId, o.service, o.building, o.location, o.paymentStatus]
        .join(" ")
        .toLowerCase()
        .includes(q);
    })
    .slice()
    .reverse();

  const services = [
    ...new Set([...(state.catalog.revenueServices || []), ...state.orders.map((o) => o.service).filter(Boolean), "Sweaters", "Wedding Gown"]),
  ];

  return `
    <div class="panel">
      <h2>${editingOrderId ? "Edit order" : "New client order"}</h2>
      <form class="grid" id="order-form">
        <label>Customer name<input name="customerName" required value="${escapeHtml(draft.customerName)}" /></label>
        <label>Customer ID / phone<input name="customerId" value="${escapeHtml(draft.customerId)}" /></label>
        <label>Order date<input type="date" name="orderDate" required value="${escapeHtml(draft.orderDate || "")}" /></label>
        <label>Delivery date<input type="date" name="deliveryDate" value="${escapeHtml(draft.deliveryDate || "")}" /></label>
        <label>Customer tag<select name="customerTag">${optionList(state.catalog.customerTags, draft.customerTag)}</select></label>
        <label>Location<input name="location" value="${escapeHtml(draft.location)}" /></label>
        <label>Building<input name="building" value="${escapeHtml(draft.building)}" /></label>
        <label>Service<select name="service">${optionList(services, draft.service)}</select></label>
        <label>Quantity (kg / pieces)<input type="number" step="0.1" min="0" name="quantity" required value="${draft.quantity}" /></label>
        <label>Unit price (KES)<input type="number" step="0.01" min="0" name="unitPrice" required value="${draft.unitPrice}" /></label>
        <label>Payment status<select name="paymentStatus">${optionList(state.catalog.paymentStatuses, draft.paymentStatus)}</select></label>
        <label>Delivery status<select name="deliveryStatus">${optionList(state.catalog.deliveryStatuses, draft.deliveryStatus)}</select></label>
        <label class="span-4">Notes<textarea name="notes">${escapeHtml(draft.notes || "")}</textarea></label>
        <div class="actions">
          ${editingOrderId ? `<button type="button" class="btn ghost" id="cancel-order-edit">Cancel</button>` : ""}
          <button type="submit" class="btn primary">${editingOrderId ? "Save order" : "Add order"}</button>
        </div>
      </form>
    </div>
    <div class="panel">
      <div class="toolbar">
        <input type="search" id="order-search" placeholder="Search clients, services…" value="${escapeHtml(orderFilter)}" />
        <span class="muted">${rows.length} lines</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Customer</th><th>Order</th><th>Day</th><th>Service</th>
              <th class="num">Qty</th><th class="num">Unit</th><th class="num">Quotation</th>
              <th>Pay</th><th>Delivery</th><th></th>
            </tr>
          </thead>
          <tbody>
            ${
              rows.length
                ? rows
                    .map((o) => {
                      const qt = quotation(o.quantity, o.unitPrice);
                      return `<tr>
                        <td>
                          <strong>${escapeHtml(o.customerName)}</strong><br />
                          <span class="muted">${escapeHtml(o.customerId || "—")} · ${escapeHtml(o.customerTag || "")}</span><br />
                          <span class="muted">${escapeHtml(o.building || o.location || "")}</span>
                        </td>
                        <td>${escapeHtml(o.orderDate || "—")}</td>
                        <td>${escapeHtml(weekdayName(o.orderDate))}</td>
                        <td>${escapeHtml(o.service)}</td>
                        <td class="num">${money(o.quantity)}</td>
                        <td class="num">${money(o.unitPrice)}</td>
                        <td class="num">${money(qt)}</td>
                        <td>${badge(o.paymentStatus)}</td>
                        <td>${badge(o.deliveryStatus)}</td>
                        <td>
                          <button class="btn ghost" data-edit-order="${o.id}" type="button">Edit</button>
                          <button class="btn danger ghost" data-del-order="${o.id}" type="button">Del</button>
                        </td>
                      </tr>`;
                    })
                    .join("")
                : `<tr><td colspan="10" class="empty">No orders yet — add a client order above.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function emptyExp() {
  return {
    id: "",
    dateIncurred: new Date().toISOString().slice(0, 10),
    category: "Operating Expenses",
    description: "",
    supplier: "",
    paymentMethod: "M-Pesa",
    amount: 0,
    source: "Business Account",
    notes: "",
  };
}

function expFormValues() {
  if (!editingExpId) return emptyExp();
  return state.expenditures.find((e) => e.id === editingExpId) || emptyExp();
}

function renderExpenditures() {
  const draft = expFormValues();
  const q = expFilter.trim().toLowerCase();
  const rows = state.expenditures
    .filter((e) => {
      if (!q) return true;
      return [e.category, e.description, e.source, e.paymentMethod, e.supplier]
        .join(" ")
        .toLowerCase()
        .includes(q);
    })
    .slice()
    .reverse();

  const descriptions = [
    ...new Set([
      ...(state.catalog.costOfSalesItems || []),
      ...(state.catalog.operatingExpenseItems || []),
      ...state.expenditures.map((e) => e.description).filter(Boolean),
    ]),
  ];

  return `
    <div class="panel">
      <h2>${editingExpId ? "Edit expenditure" : "New expenditure"}</h2>
      <form class="grid" id="exp-form">
        <label>Date incurred<input type="date" name="dateIncurred" required value="${escapeHtml(draft.dateIncurred || "")}" /></label>
        <label>Category<select name="category">${optionList(state.catalog.expenseCategories, draft.category)}</select></label>
        <label class="span-2">Description
          <input name="description" list="desc-list" required value="${escapeHtml(draft.description)}" placeholder="e.g. Rent, Powder Detergent" />
          <datalist id="desc-list">${descriptions.map((d) => `<option value="${escapeHtml(d)}"></option>`).join("")}</datalist>
        </label>
        <label>Supplier / vendor<input name="supplier" value="${escapeHtml(draft.supplier || "")}" /></label>
        <label>Payment method<select name="paymentMethod">${optionList(state.catalog.paymentMethods, draft.paymentMethod)}</select></label>
        <label>Amount (KES)<input type="number" step="0.01" min="0" name="amount" required value="${draft.amount}" /></label>
        <label>Source<select name="source">${optionList(state.catalog.expenseSources, draft.source)}</select></label>
        <label class="span-4">Notes<textarea name="notes">${escapeHtml(draft.notes || "")}</textarea></label>
        <div class="actions">
          ${editingExpId ? `<button type="button" class="btn ghost" id="cancel-exp-edit">Cancel</button>` : ""}
          <button type="submit" class="btn primary">${editingExpId ? "Save expenditure" : "Add expenditure"}</button>
        </div>
      </form>
    </div>
    <div class="panel">
      <div class="toolbar">
        <input type="search" id="exp-search" placeholder="Search expenditures…" value="${escapeHtml(expFilter)}" />
        <span class="muted">${rows.length} lines · total ${moneyKes(rows.reduce((s, e) => s + (Number(e.amount) || 0), 0))}</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Category</th><th>Description</th><th>Method</th>
              <th>Source</th><th class="num">Amount</th><th></th>
            </tr>
          </thead>
          <tbody>
            ${
              rows.length
                ? rows
                    .map(
                      (e) => `<tr>
                        <td>${escapeHtml(e.dateIncurred || "—")}</td>
                        <td>${escapeHtml(e.category)}</td>
                        <td>${escapeHtml(e.description)}</td>
                        <td>${escapeHtml(e.paymentMethod)}</td>
                        <td>${escapeHtml(e.source)}</td>
                        <td class="num">${money(e.amount)}</td>
                        <td>
                          <button class="btn ghost" data-edit-exp="${e.id}" type="button">Edit</button>
                          <button class="btn danger ghost" data-del-exp="${e.id}" type="button">Del</button>
                        </td>
                      </tr>`
                    )
                    .join("")
                : `<tr><td colspan="7" class="empty">No expenditures yet.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function monthCells(obj, months, strong = false) {
  return months.map((m) => {
    const v = obj[m] || 0;
    const cls = v < 0 ? "neg" : "";
    return `<td class="num ${cls}">${money(v)}</td>`;
  }).join("");
}

function renderIncome(c) {
  const { income } = c;
  const months = income.months;
  const head = months.map((m) => `<th class="num">${m}</th>`).join("");

  const block = (title, rows, totals, totalsLabel) => `
    <div class="section-title">${title}</div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Line</th>${head}</tr></thead>
        <tbody>
          ${rows
            .map(
              (r) => `<tr><td>${escapeHtml(r.label)}</td>${monthCells(r.months, months)}</tr>`
            )
            .join("")}
          <tr class="row-strong"><td>${totalsLabel}</td>${monthCells(totals, months)}</tr>
        </tbody>
      </table>
    </div>
  `;

  return `
    <div class="panel">
      <h2>LAUNDRY NOIR · Income Statement ${income.year}</h2>
      ${block("Revenue", income.revenueRows, income.totalRevenue, "Total Revenue")}
      ${block("Cost of Sales (Direct Costs)", income.cosRows, income.totalCos, "Total Cost of Sales")}
      <div class="section-title">Gross Profit</div>
      <div class="table-wrap"><table><thead><tr><th></th>${head}</tr></thead>
        <tbody><tr class="row-strong"><td>Gross Profit</td>${monthCells(income.grossProfit, months)}</tr></tbody></table></div>
      ${block("Operating Expenses", income.opexRows, income.totalOpex, "Total Operating Expenses")}
      <div class="section-title">Net results</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th></th>${head}</tr></thead>
          <tbody>
            <tr><td>Operating Profit</td>${monthCells(income.operatingProfit, months)}</tr>
            <tr class="row-strong"><td>Net Profit After Tax</td>${monthCells(income.netAfterTax, months)}</tr>
          </tbody>
        </table>
      </div>
      <div class="kpi-grid" style="margin-top:1rem">
        <div class="kpi"><div class="label">Annual revenue</div><div class="value">${moneyKes(income.annualRevenue)}</div></div>
        <div class="kpi"><div class="label">Annual COS</div><div class="value">${moneyKes(income.annualExpenditure)}</div></div>
        <div class="kpi"><div class="label">Annual net profit</div><div class="value ${income.annualNetProfit < 0 ? "neg" : "pos"}">${moneyKes(income.annualNetProfit)}</div></div>
        <div class="kpi"><div class="label">Profit share (J)</div><div class="value">${(c.balance.jacobShare * 100).toFixed(1)}%</div></div>
      </div>
    </div>
  `;
}

function renderBalance(c) {
  const b = c.balance;
  const assetRows = (rows) =>
    rows
      .map(
        (r, i) => `<tr>
          <td>${escapeHtml(r.label)}</td>
          <td class="num">
            <input data-asset-kind="${r._kind}" data-asset-idx="${i}" type="number" step="0.01" value="${Number(r.amount) || 0}" style="width:8.5rem;text-align:right" />
          </td>
        </tr>`
      )
      .join("");

  const current = b.currentAssets.map((r) => ({ ...r, _kind: "current" }));
  const fixed = b.fixedAssets.map((r) => ({ ...r, _kind: "fixed" }));

  return `
    <div class="panel">
      <h2>Balance Sheet · as at ${escapeHtml(b.asAt || "—")}</h2>
      <div class="section-title">Current assets</div>
      <div class="table-wrap"><table><thead><tr><th>Item</th><th class="num">Amount (KES)</th></tr></thead>
        <tbody>${assetRows(current)}
        <tr class="row-strong"><td>Total Current Assets</td><td class="num">${money(b.totalCurrentAssets)}</td></tr></tbody></table></div>

      <div class="section-title">Fixed assets</div>
      <div class="table-wrap"><table><thead><tr><th>Item</th><th class="num">Amount (KES)</th></tr></thead>
        <tbody>${assetRows(fixed)}
        <tr class="row-strong"><td>Total Fixed Assets</td><td class="num">${money(b.totalFixedAssets)}</td></tr></tbody></table></div>

      <div class="section-title">Equity</div>
      <form class="grid" id="equity-form">
        <label>Whitney capital invested<input type="number" step="0.01" name="whitneyCapital" value="${b.whitneyCapital}" /></label>
        <label>Whitney drawings (negative)<input type="number" step="0.01" name="whitneyDrawings" value="${b.whitneyDrawings}" /></label>
        <label>Jacob drawings (negative)<input type="number" step="0.01" name="jacobDrawings" value="${b.jacobDrawings}" /></label>
        <label>Retained earnings<input type="number" step="0.01" name="retainedEarnings" value="${b.retainedEarnings}" /></label>
        <div class="actions"><button class="btn primary" type="submit">Update equity inputs</button></div>
      </form>
      <div class="table-wrap" style="margin-top:0.8rem">
        <table>
          <tbody>
            <tr><td>Jacob's Capital Invested</td><td class="num">${money(b.jacobCapital)}</td><td class="num muted">${(b.jacobShare * 100).toFixed(2)}%</td></tr>
            <tr><td>Whitney's Capital Invested</td><td class="num">${money(b.whitneyCapital)}</td><td class="num muted">${(b.whitneyShare * 100).toFixed(2)}%</td></tr>
            <tr class="row-strong"><td>Total Capital Invested</td><td class="num">${money(b.totalCapital)}</td><td class="num">100%</td></tr>
            <tr><td>Current Year Profit</td><td class="num ${b.currentYearProfit < 0 ? "neg" : ""}">${money(b.currentYearProfit)}</td><td></td></tr>
            <tr><td>Whitney Drawings</td><td class="num">${money(b.whitneyDrawings)}</td><td></td></tr>
            <tr><td>Jacob Drawings</td><td class="num">${money(b.jacobDrawings)}</td><td></td></tr>
            <tr class="row-strong"><td>Total Equity</td><td class="num">${money(b.totalEquity)}</td><td></td></tr>
          </tbody>
        </table>
      </div>
      <p class="muted" style="margin-top:0.75rem">Jacob capital follows the sheet: Total Fixed Assets − Whitney Capital.</p>
    </div>
  `;
}

function renderPayback(c) {
  const p = c.payback;
  return `
    <div class="panel">
      <h2>Payback Period Analysis</h2>
      <p class="muted">Initial investment = total capital invested. Monthly net cash flow = net profit after tax + depreciation.</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Period</th><th>Month</th><th class="num">Net Cash Flow</th>
              <th class="num">Cumulative</th><th>Cum. ≥ 0?</th>
            </tr>
          </thead>
          <tbody>
            ${p.rows
              .map(
                (r) => `<tr>
                  <td>${r.period}</td>
                  <td>${escapeHtml(r.month)}</td>
                  <td class="num ${r.netCashFlow < 0 ? "neg" : ""}">${money(r.netCashFlow)}</td>
                  <td class="num ${r.cumulative < 0 ? "neg" : "pos"}">${money(r.cumulative)}</td>
                  <td>${r.positive ? "Yes" : "No"}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <div class="kpi-grid" style="margin-top:1rem">
        <div class="kpi"><div class="label">Payback (months)</div><div class="value">${p.reached ? p.paybackMonths.toFixed(2) : "Not yet"}</div></div>
        <div class="kpi"><div class="label">Payback (years)</div><div class="value">${p.reached ? p.paybackYears.toFixed(2) : "N/A"}</div></div>
      </div>
    </div>
  `;
}

function readForm(form) {
  const data = new FormData(form);
  const obj = {};
  for (const [k, v] of data.entries()) obj[k] = typeof v === "string" ? v.trim() : v;
  return obj;
}

function bindViewEvents() {
  const orderForm = document.getElementById("order-form");
  if (orderForm) {
    orderForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const raw = readForm(orderForm);
      const row = {
        id: editingOrderId || uid("ord"),
        customerName: raw.customerName,
        customerId: raw.customerId,
        orderDate: raw.orderDate,
        deliveryDate: raw.deliveryDate || "",
        customerTag: raw.customerTag,
        location: raw.location,
        building: raw.building,
        service: raw.service,
        quantity: Number(raw.quantity) || 0,
        unitPrice: Number(raw.unitPrice) || 0,
        paymentStatus: raw.paymentStatus,
        deliveryStatus: raw.deliveryStatus,
        notes: raw.notes || "",
      };
      row.quotation = quotation(row.quantity, row.unitPrice);
      if (editingOrderId) {
        const idx = state.orders.findIndex((o) => o.id === editingOrderId);
        if (idx >= 0) state.orders[idx] = row;
      } else {
        state.orders.push(row);
      }
      editingOrderId = null;
      persist();
      toast("Order saved");
      render();
    });
  }

  document.getElementById("cancel-order-edit")?.addEventListener("click", () => {
    editingOrderId = null;
    render();
  });

  document.getElementById("order-search")?.addEventListener("input", (e) => {
    orderFilter = e.target.value;
    // soft re-render table only would be nicer; full render is fine at this scale
    const start = e.target.selectionStart;
    render();
    const input = document.getElementById("order-search");
    if (input) {
      input.focus();
      input.setSelectionRange(start, start);
    }
  });

  document.querySelectorAll("[data-edit-order]").forEach((btn) => {
    btn.addEventListener("click", () => {
      editingOrderId = btn.dataset.editOrder;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
  document.querySelectorAll("[data-del-order]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!confirm("Delete this order line?")) return;
      state.orders = state.orders.filter((o) => o.id !== btn.dataset.delOrder);
      persist();
      toast("Order deleted");
      render();
    });
  });

  const expForm = document.getElementById("exp-form");
  if (expForm) {
    expForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const raw = readForm(expForm);
      const row = {
        id: editingExpId || uid("exp"),
        dateIncurred: raw.dateIncurred,
        category: raw.category,
        description: raw.description,
        supplier: raw.supplier || "",
        paymentMethod: raw.paymentMethod,
        amount: Number(raw.amount) || 0,
        source: raw.source,
        notes: raw.notes || "",
      };
      if (editingExpId) {
        const idx = state.expenditures.findIndex((x) => x.id === editingExpId);
        if (idx >= 0) state.expenditures[idx] = row;
      } else {
        state.expenditures.push(row);
      }
      editingExpId = null;
      persist();
      toast("Expenditure saved");
      render();
    });
  }

  document.getElementById("cancel-exp-edit")?.addEventListener("click", () => {
    editingExpId = null;
    render();
  });

  document.getElementById("exp-search")?.addEventListener("input", (e) => {
    expFilter = e.target.value;
    const start = e.target.selectionStart;
    render();
    const input = document.getElementById("exp-search");
    if (input) {
      input.focus();
      input.setSelectionRange(start, start);
    }
  });

  document.querySelectorAll("[data-edit-exp]").forEach((btn) => {
    btn.addEventListener("click", () => {
      editingExpId = btn.dataset.editExp;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
  document.querySelectorAll("[data-del-exp]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!confirm("Delete this expenditure?")) return;
      state.expenditures = state.expenditures.filter((x) => x.id !== btn.dataset.delExp);
      persist();
      toast("Expenditure deleted");
      render();
    });
  });

  document.querySelectorAll("[data-asset-kind]").forEach((input) => {
    input.addEventListener("change", () => {
      const kind = input.dataset.assetKind;
      const idx = Number(input.dataset.assetIdx);
      const amount = Number(input.value) || 0;
      if (kind === "current") state.balanceSheet.currentAssets[idx].amount = amount;
      if (kind === "fixed") state.balanceSheet.fixedAssets[idx].amount = amount;
      persist();
      toast("Asset updated");
      render();
    });
  });

  const equityForm = document.getElementById("equity-form");
  if (equityForm) {
    equityForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const raw = readForm(equityForm);
      state.balanceSheet.equity = {
        ...state.balanceSheet.equity,
        whitneyCapital: Number(raw.whitneyCapital) || 0,
        whitneyDrawings: Number(raw.whitneyDrawings) || 0,
        jacobDrawings: Number(raw.jacobDrawings) || 0,
        retainedEarnings: Number(raw.retainedEarnings) || 0,
      };
      persist();
      toast("Equity updated");
      render();
    });
  }
}

async function boot() {
  const saved = loadState();
  if (saved) {
    state = ensureIds(saved);
  } else {
    const seed = await loadSeed();
    state = ensureIds(seed);
    persist();
  }

  document.getElementById("btn-export").addEventListener("click", () => {
    downloadJson(state);
    toast("Exported JSON");
  });

  document.getElementById("btn-reset").addEventListener("click", async () => {
    if (!confirm("Reset all local data to the spreadsheet seed?")) return;
    clearState();
    state = ensureIds(await loadSeed());
    persist();
    view = "dashboard";
    toast("Reset to seed");
    render();
  });

  document.getElementById("import-file").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.orders || !parsed.expenditures || !parsed.catalog) {
        throw new Error("Missing orders / expenditures / catalog");
      }
      state = ensureIds(parsed);
      persist();
      toast("Imported JSON");
      render();
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    } finally {
      e.target.value = "";
    }
  });

  render();
}

boot().catch((err) => {
  el.view.innerHTML = `<div class="panel"><h2>Could not start Project Noir</h2><p class="muted">${escapeHtml(err.message)}</p></div>`;
});
