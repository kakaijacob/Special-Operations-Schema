/**
 * Project Noir — financial engines mirroring the Laundry Noir spreadsheet formulas.
 */

export const MONTHS = [
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_INDEX = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
};

export function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function monthName(value) {
  const d = parseDate(value);
  if (!d) return "";
  return d.toLocaleDateString("en-US", { month: "long" });
}

export function weekdayName(value) {
  const d = parseDate(value);
  if (!d) return "";
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

export function quotation(quantity, unitPrice) {
  const q = Number(quantity) || 0;
  const u = Number(unitPrice) || 0;
  return Math.round(q * u * 100) / 100;
}

export function money(n) {
  const v = Number(n) || 0;
  return v.toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function moneyKes(n) {
  return `KES ${money(n)}`;
}

function sumByMonth(rows, getDate, getKey, getAmount, keys, months) {
  const table = Object.fromEntries(keys.map((k) => [k, Object.fromEntries(months.map((m) => [m, 0]))]));
  for (const row of rows) {
    const key = getKey(row);
    const m = monthName(getDate(row));
    if (!key || !months.includes(m)) continue;
    if (!table[key]) table[key] = Object.fromEntries(months.map((mo) => [mo, 0]));
    table[key][m] += Number(getAmount(row)) || 0;
  }
  return table;
}

export function buildIncomeStatement(state) {
  const months = state.catalog.months || MONTHS;
  const year = state.catalog.year || 2026;

  // Revenue: sheet service list + any services present on orders (so new services still roll up)
  const orderServices = [
    ...new Set([
      ...(state.catalog.revenueServices || []),
      ...state.orders.map((o) => o.service).filter(Boolean),
    ]),
  ];

  // COS / opex: match Income Statement row labels by expenditure description (sheet SUMPRODUCT)
  const cosItems = [...new Set((state.catalog.costOfSalesItems || []).filter(Boolean))];
  const catalogOpex = [...new Set((state.catalog.operatingExpenseItems || []).filter(Boolean))];
  const known = new Set([...cosItems, ...catalogOpex]);
  const unmatched = [
    ...new Set(
      state.expenditures
        .map((e) => e.description)
        .filter((d) => d && !known.has(d))
    ),
  ];
  const opexItems = [...catalogOpex, ...unmatched];

  const revenue = sumByMonth(
    state.orders,
    (o) => o.orderDate,
    (o) => o.service,
    (o) => quotation(o.quantity, o.unitPrice),
    orderServices,
    months
  );

  const allByDesc = sumByMonth(
    state.expenditures,
    (e) => e.dateIncurred,
    (e) => e.description,
    (e) => e.amount,
    [...new Set([...cosItems, ...opexItems])],
    months
  );

  const revenueRows = orderServices.map((label) => ({
    label,
    months: Object.fromEntries(months.map((m) => [m, revenue[label]?.[m] || 0])),
  }));

  const totalRevenue = Object.fromEntries(
    months.map((m) => [m, revenueRows.reduce((s, r) => s + (r.months[m] || 0), 0)])
  );

  const cosRows = cosItems.map((label) => ({
    label,
    months: Object.fromEntries(months.map((m) => [m, allByDesc[label]?.[m] || 0])),
  }));
  const totalCos = Object.fromEntries(
    months.map((m) => [m, cosRows.reduce((s, r) => s + (r.months[m] || 0), 0)])
  );

  const grossProfit = Object.fromEntries(
    months.map((m) => [m, totalRevenue[m] - totalCos[m]])
  );

  const opexRows = opexItems.map((label) => ({
    label,
    months: Object.fromEntries(months.map((m) => [m, allByDesc[label]?.[m] || 0])),
  }));
  const totalOpex = Object.fromEntries(
    months.map((m) => [m, opexRows.reduce((s, r) => s + (r.months[m] || 0), 0)])
  );

  const operatingProfit = Object.fromEntries(
    months.map((m) => [m, grossProfit[m] - totalOpex[m]])
  );

  const otherIncome = Object.fromEntries(months.map((m) => [m, 0]));
  const otherExpenses = Object.fromEntries(months.map((m) => [m, 0]));
  const tax = Object.fromEntries(months.map((m) => [m, 0]));

  const netBeforeTax = Object.fromEntries(
    months.map((m) => [m, operatingProfit[m] + otherIncome[m] - otherExpenses[m]])
  );
  const netAfterTax = Object.fromEntries(
    months.map((m) => [m, netBeforeTax[m] - tax[m]])
  );

  const depreciation = Object.fromEntries(
    months.map((m) => [m, allByDesc["Depreciation of Equipment"]?.[m] || 0])
  );

  const annualRevenue = months.reduce((s, m) => s + totalRevenue[m], 0);
  const annualExpenditure = months.reduce((s, m) => s + totalCos[m], 0);
  const annualNetProfit = months.reduce((s, m) => s + netAfterTax[m], 0);

  return {
    year,
    months,
    revenueRows,
    totalRevenue,
    cosRows,
    totalCos,
    grossProfit,
    opexRows,
    totalOpex,
    operatingProfit,
    otherIncome,
    otherExpenses,
    netBeforeTax,
    tax,
    netAfterTax,
    depreciation,
    annualRevenue,
    annualExpenditure,
    annualNetProfit,
  };
}

export function buildBalanceSheet(state, income) {
  const bs = state.balanceSheet;
  const currentAssets = bs.currentAssets || [];
  const fixedAssets = bs.fixedAssets || [];
  const liabilities = bs.liabilities || [];

  const totalCurrentAssets = currentAssets.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const totalFixedAssets = fixedAssets.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const currentLiab = liabilities.filter((l) => l.kind !== "longterm");
  const longLiab = liabilities.filter((l) => l.kind === "longterm");
  const totalCurrentLiab = currentLiab.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const totalLongLiab = longLiab.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const whitneyCapital = Number(bs.equity?.whitneyCapital) || 0;
  // Sheet: Jacob's Capital = Total Fixed Assets − Whitney's Capital
  const jacobCapital = totalFixedAssets - whitneyCapital;
  const totalCapital = jacobCapital + whitneyCapital;
  const jacobShare = totalCapital ? jacobCapital / totalCapital : 0;
  const whitneyShare = totalCapital ? whitneyCapital / totalCapital : 0;

  const retainedEarnings = Number(bs.equity?.retainedEarnings) || 0;
  const currentYearProfit = income.annualNetProfit;
  const whitneyDrawings = Number(bs.equity?.whitneyDrawings) || 0;
  const jacobDrawings = Number(bs.equity?.jacobDrawings) || 0;
  const totalEquity =
    totalCapital + retainedEarnings + currentYearProfit + whitneyDrawings + jacobDrawings;

  return {
    asAt: bs.asAt,
    currentAssets,
    totalCurrentAssets,
    fixedAssets,
    totalFixedAssets,
    currentLiab,
    totalCurrentLiab,
    longLiab,
    totalLongLiab,
    jacobCapital,
    whitneyCapital,
    jacobShare,
    whitneyShare,
    totalCapital,
    retainedEarnings,
    currentYearProfit,
    whitneyDrawings,
    jacobDrawings,
    totalEquity,
    jacobProfit: jacobShare * currentYearProfit,
    whitneyProfit: currentYearProfit - jacobShare * currentYearProfit,
  };
}

export function buildPayback(income, balance) {
  const months = income.months;
  const rows = [
    {
      year: income.year,
      period: 0,
      month: "Initial Investment",
      netCashFlow: -balance.totalCapital,
      cumulative: -balance.totalCapital,
    },
  ];

  let cum = -balance.totalCapital;
  months.forEach((month, idx) => {
    const ncf = (income.netAfterTax[month] || 0) + (income.depreciation[month] || 0);
    cum += ncf;
    rows.push({
      year: income.year,
      period: idx + 1,
      month,
      netCashFlow: ncf,
      cumulative: cum,
      positive: cum >= 0,
    });
  });
  rows[0].positive = rows[0].cumulative >= 0;

  const firstPos = rows.findIndex((r) => r.positive);
  let paybackMonths = null;
  if (firstPos > 0) {
    const prior = rows[firstPos - 1];
    const curr = rows[firstPos];
    const absPrior = Math.abs(prior.cumulative);
    paybackMonths = firstPos - 1 + absPrior / (curr.netCashFlow || 1);
  }

  return {
    rows,
    paybackMonths,
    paybackYears: paybackMonths == null ? null : paybackMonths / 12,
    reached: firstPos > 0,
  };
}

export function buildDashboard(state, income, balance) {
  const salesVolume = state.orders.length;
  const salesRevenue = state.orders.reduce(
    (s, o) => s + quotation(o.quantity, o.unitPrice),
    0
  );
  const grossSum = income.months.reduce((s, m) => s + income.grossProfit[m], 0);
  const profitMargin = salesRevenue ? grossSum / salesRevenue : 0;
  const pending = state.orders.filter((o) => /pending/i.test(o.paymentStatus || "")).length;
  const paid = state.orders.filter((o) => /paid/i.test(o.paymentStatus || "")).length;

  return {
    salesVolume,
    salesRevenue,
    totalExpenditure: income.annualExpenditure,
    netProfit: income.annualNetProfit,
    profitMargin,
    jacobProfit: balance.jacobProfit,
    whitneyProfit: balance.whitneyProfit,
    pending,
    paid,
    totalCapital: balance.totalCapital,
    totalEquity: balance.totalEquity,
  };
}

export function recompute(state) {
  const income = buildIncomeStatement(state);
  const balance = buildBalanceSheet(state, income);
  const payback = buildPayback(income, balance);
  const dashboard = buildDashboard(state, income, balance);
  return { income, balance, payback, dashboard };
}
