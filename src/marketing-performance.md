---
title: Marketing Performance
toc: false
---

<h1 style="margin-bottom: 4px;">Marketing Performance Overview</h1>
<p style="color: var(--muted); margin-bottom: 20px; font-size: 0.9rem;">
Actual vs. Plan &mdash; Spend, Activations, CAC<br>
Source: <code>main_prod.marketing_dm.rpt_marketing_performance_to_forecast_daily</code>
</p>

```js
import Plotly from "npm:plotly.js-dist-min";
```

```js
const raw = await FileAttachment("data/forecast_performance.csv").text();
const rows = d3.csvParse(raw, d => ({
  date: d.date_et,
  month: d.date_et?.slice(0, 7),
  week: d.date_week?.slice(0, 10),
  segment: d.finance_segment_id || "",
  acquisition_type: d.acquisition_type || "",
  product: d.finance_product_name || "",
  bu: d.BU || "Cash Out",
  installs: +d.installs_cnt || 0,
  sign_ups: +d.sign_ups_cnt || 0,
  activations_y1: +d.first_cashouts_y1_cnt || 0,
  activations_mature: +d.first_cashouts_mature_y1_cnt || 0,
  activations_in_month: +d.first_cashouts_in_month_cnt || 0,
  spend: +d.spend_usd_amt || 0,
  revenue: +d.estimated_future_revenue_amt || 0,
  planned_spend: +d.planned_spend_usd_amt || 0,
  planned_activations: +d.planned_first_cashouts_y1_cnt || 0,
  planned_in_month: +d.planned_first_cashouts_in_month_cnt || 0,
}));
```

```js
const today = new Date().toISOString().slice(0, 10);
const yearStr = today.slice(0, 4);

function addDays(d, n) {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
}
function qStart(d) {
  const dt = new Date(d);
  const q = Math.floor(dt.getMonth() / 3) * 3;
  return `${dt.getFullYear()}-${String(q + 1).padStart(2, "0")}-01`;
}
function prevMonth() {
  const d = new Date(today);
  d.setMonth(d.getMonth() - 1);
  const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  const e = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  return [s, e];
}

const presets = new Map([
  ["MTD", [today.slice(0, 7) + "-01", today]],
  ["QTD", [qStart(today), today]],
  ["YTD", [yearStr + "-01-01", today]],
  ["Last Month", prevMonth()],
  ["Last 90 Days", [addDays(new Date(), -90), today]],
  ["2025 Full Year", ["2025-01-01", "2025-12-31"]],
  ["2024 Full Year", ["2024-01-01", "2024-12-31"]],
  ["All Time", ["2024-01-01", "2026-12-31"]],
]);
```

```js
const buValues = [...new Set(rows.map(d => d.bu))].filter(Boolean).sort();
const acqValues = [...new Set(rows.map(d => d.acquisition_type))].filter(Boolean).sort();
const segValues = [...new Set(rows.map(d => d.segment))].filter(Boolean).sort();
```

```js
const period = view(Inputs.select(presets, {label: "Period", value: presets.get("YTD")}));
const buFilter = view(Inputs.select(["All", ...buValues], {label: "BU", value: "All"}));
const acqFilter = view(Inputs.select(["All", ...acqValues], {label: "Acquisition", value: "All"}));
const segFilter = view(Inputs.select(["All", ...segValues], {label: "Segment", value: "All"}));
```

```js
const [startDate, endDate] = period;

const filtered = rows.filter(d => {
  if (d.date < startDate || d.date > endDate) return false;
  if (buFilter !== "All" && d.bu !== buFilter) return false;
  if (acqFilter !== "All" && d.acquisition_type !== acqFilter) return false;
  if (segFilter !== "All" && d.segment !== segFilter) return false;
  return true;
});

const actuals = filtered.filter(d => d.date <= today);
```

```js
const totalSpend = d3.sum(actuals, d => d.spend);
const totalSignUps = d3.sum(actuals, d => d.sign_ups);
const totalActivations = d3.sum(actuals, d => d.activations_y1);
const totalInstalls = d3.sum(actuals, d => d.installs);
const totalRevenue = d3.sum(actuals, d => d.revenue);
const cac = totalActivations > 0 ? totalSpend / totalActivations : 0;

const plannedSpend = d3.sum(filtered, d => d.planned_spend);
const plannedAct = d3.sum(filtered, d => d.planned_activations);
const spendVsPlan = plannedSpend > 0 ? (totalSpend - plannedSpend) / plannedSpend : null;
const actVsPlan = plannedAct > 0 ? (totalActivations - plannedAct) / plannedAct : null;
```

```js
function fmt$(v) { return "$" + Math.round(v).toLocaleString(); }
function fmtN(v) { return Math.round(v).toLocaleString(); }
function fmtPct(v) { return v == null ? "" : (v > 0 ? "+" : "") + (v * 100).toFixed(1) + "% vs plan"; }

function kpi(title, value, delta, color) {
  const el = document.createElement("div");
  el.className = "kpi-card";
  const deltaColor = delta == null ? "" : delta >= 0 ? "#34d399" : "#f87171";
  const deltaHtml = delta == null ? "" : `<div style="font-size:0.8rem;margin-top:4px;color:${deltaColor};font-weight:600">${fmtPct(delta)}</div>`;
  el.innerHTML = `
    <div class="kpi-value" style="color:${color}">${value}</div>
    <div class="kpi-label">${title}</div>
    ${deltaHtml}
  `;
  return el;
}
```

<div class="grid grid-cols-6">
  ${kpi("Spend", fmt$(totalSpend), spendVsPlan, "#7c8cff")}
  ${kpi("Sign-Ups", fmtN(totalSignUps), null, "#7c8cff")}
  ${kpi("Activations (Y1)", fmtN(totalActivations), actVsPlan, "#34d399")}
  ${kpi("CAC", "$" + cac.toFixed(2), null, cac > 150 ? "#f87171" : "#34d399")}
  ${kpi("Est. Revenue", fmt$(totalRevenue), null, "#7c8cff")}
  ${kpi("Installs", fmtN(totalInstalls), null, "#7c8cff")}
</div>

---

## Weekly Spend: Actual vs. Plan

```js
const weeklyData = d3.rollups(filtered, v => ({
  spend: d3.sum(v, d => d.spend),
  plan: d3.sum(v, d => d.planned_spend),
  activations: d3.sum(v, d => d.activations_y1),
  plan_act: d3.sum(v, d => d.planned_activations),
}), d => d.week).map(([w, s]) => ({week: w, ...s})).filter(d => d.week).sort((a, b) => a.week.localeCompare(b.week));

const spendWeeks = weeklyData.filter(d => d.spend > 0);
const planWeeks = weeklyData.filter(d => d.plan > 0);
```

```js
const spendChart = document.createElement("div");
{
  const traces = [];
  if (spendWeeks.length > 0) traces.push({x: spendWeeks.map(d => d.week), y: spendWeeks.map(d => d.spend), name: "Actual", type: "scatter", mode: "lines+markers", line: {color: "#7c8cff", width: 2.5}, marker: {size: 4}});
  if (planWeeks.length > 0) traces.push({x: planWeeks.map(d => d.week), y: planWeeks.map(d => d.plan), name: "Plan", type: "scatter", mode: "lines", line: {color: "#f5a524", width: 2, dash: "dash"}});
  Plotly.newPlot(spendChart, traces, {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: {color: "#8b93a8", size: 12},
    xaxis: {gridcolor: "#2a3148", linecolor: "#2a3148"},
    yaxis: {gridcolor: "#2a3148", linecolor: "#2a3148", tickprefix: "$", tickformat: ",.0f", title: {text: "Weekly Spend", font: {size: 12}}},
    legend: {orientation: "h", y: 1.12, font: {color: "#e8ecf4"}},
    margin: {t: 40, b: 40, l: 80, r: 20},
    height: 340,
    hovermode: "x unified",
  }, {responsive: true, displayModeBar: false});
}
display(spendChart);
```

---

## Weekly Activations: Actual vs. Plan

```js
const actWeeks = weeklyData.filter(d => d.activations > 0);
const planActWeeks = weeklyData.filter(d => d.plan_act > 0);
```

```js
const actChart = document.createElement("div");
{
  const traces = [];
  if (actWeeks.length > 0) traces.push({x: actWeeks.map(d => d.week), y: actWeeks.map(d => d.activations), name: "Actual", type: "scatter", mode: "lines+markers", line: {color: "#34d399", width: 2.5}, marker: {size: 4}});
  if (planActWeeks.length > 0) traces.push({x: planActWeeks.map(d => d.week), y: planActWeeks.map(d => d.plan_act), name: "Plan", type: "scatter", mode: "lines", line: {color: "#f5a524", width: 2, dash: "dash"}});
  Plotly.newPlot(actChart, traces, {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: {color: "#8b93a8", size: 12},
    xaxis: {gridcolor: "#2a3148", linecolor: "#2a3148"},
    yaxis: {gridcolor: "#2a3148", linecolor: "#2a3148", tickformat: ",.0f", title: {text: "Weekly Activations (Y1)", font: {size: 12}}},
    legend: {orientation: "h", y: 1.12, font: {color: "#e8ecf4"}},
    margin: {t: 40, b: 40, l: 80, r: 20},
    height: 340,
    hovermode: "x unified",
  }, {responsive: true, displayModeBar: false});
}
display(actChart);
```

---

<div class="grid grid-cols-2">
<div class="card" style="padding: 20px;">

### Spend by Acquisition Type

```js
const spendByAcq = d3.rollups(actuals, v => d3.sum(v, d => d.spend), d => d.acquisition_type)
  .map(([t, v]) => ({type: t, spend: v})).filter(d => d.spend > 0).sort((a, b) => b.spend - a.spend);
```

```js
const acqChart = document.createElement("div");
Plotly.newPlot(acqChart, [{
  x: spendByAcq.map(d => d.spend),
  y: spendByAcq.map(d => d.type),
  type: "bar", orientation: "h",
  marker: {color: "#7c8cff", line: {width: 0}},
  text: spendByAcq.map(d => "$" + (d.spend / 1e6).toFixed(2) + "M"),
  textposition: "outside", textfont: {color: "#e8ecf4", size: 12},
  hovertemplate: "%{y}: $%{x:,.0f}<extra></extra>",
}], {
  paper_bgcolor: "transparent", plot_bgcolor: "transparent",
  font: {color: "#8b93a8", size: 12},
  xaxis: {gridcolor: "#2a3148", linecolor: "#2a3148", tickprefix: "$", tickformat: ",.0s"},
  yaxis: {gridcolor: "#2a3148", linecolor: "#2a3148", automargin: true},
  margin: {t: 10, b: 30, l: 80, r: 80},
  height: Math.max(160, spendByAcq.length * 50),
}, {responsive: true, displayModeBar: false});
display(acqChart);
```

</div>
<div class="card" style="padding: 20px;">

### CAC Trend (Weekly)

```js
const weeklyCac = weeklyData
  .filter(d => d.spend > 0 && d.activations > 0)
  .map(d => ({week: d.week, cac: d.spend / d.activations, planCac: d.plan > 0 && d.plan_act > 0 ? d.plan / d.plan_act : null}))
  .filter(d => d.cac < 500);
```

```js
const cacChart = document.createElement("div");
{
  const traces = [{x: weeklyCac.map(d => d.week), y: weeklyCac.map(d => d.cac), name: "Actual CAC", type: "scatter", mode: "lines+markers", line: {color: "#f87171", width: 2.5}, marker: {size: 4}, hovertemplate: "%{x}<br>CAC: $%{y:.2f}<extra></extra>"}];
  const planCac = weeklyCac.filter(d => d.planCac != null && d.planCac < 500);
  if (planCac.length > 0) traces.push({x: planCac.map(d => d.week), y: planCac.map(d => d.planCac), name: "Plan CAC", type: "scatter", mode: "lines", line: {color: "#f5a524", width: 2, dash: "dash"}});
  Plotly.newPlot(cacChart, traces, {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent",
    font: {color: "#8b93a8", size: 12},
    xaxis: {gridcolor: "#2a3148", linecolor: "#2a3148"},
    yaxis: {gridcolor: "#2a3148", linecolor: "#2a3148", tickprefix: "$", title: {text: "CAC", font: {size: 12}}},
    legend: {orientation: "h", y: 1.15, font: {color: "#e8ecf4"}},
    margin: {t: 40, b: 40, l: 70, r: 20},
    height: Math.max(200, 240),
    hovermode: "x unified",
  }, {responsive: true, displayModeBar: false});
}
display(cacChart);
```

</div>
</div>

---

## Monthly Summary

```js
const monthly = d3.rollups(filtered, v => ({
  spend: d3.sum(v, d => d.spend),
  planned_spend: d3.sum(v, d => d.planned_spend),
  sign_ups: d3.sum(v, d => d.sign_ups),
  installs: d3.sum(v, d => d.installs),
  activations: d3.sum(v, d => d.activations_y1),
  planned_act: d3.sum(v, d => d.planned_activations),
  mature_act: d3.sum(v, d => d.activations_mature),
  revenue: d3.sum(v, d => d.revenue),
}), d => d.month).map(([m, s]) => ({
  month: m, ...s,
  cac: s.activations > 0 ? s.spend / s.activations : null,
  spend_pace: s.planned_spend > 0 ? ((s.spend / s.planned_spend - 1) * 100).toFixed(1) + "%" : "—",
  act_pace: s.planned_act > 0 ? ((s.activations / s.planned_act - 1) * 100).toFixed(1) + "%" : "—",
})).sort((a, b) => b.month.localeCompare(a.month));
```

```js
const tableEl = document.createElement("div");
const cols = ["Month", "Spend", "Plan Spend", "Spend Pace", "Activations", "Plan Acts", "Act Pace", "CAC", "Sign-Ups", "Installs", "Est. Revenue"];

const headerCells = cols.map(c => `<th style="padding:10px 14px;text-align:right;background:#141824;color:#8b93a8;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #2a3148;position:sticky;top:0;z-index:1">${c}</th>`);
headerCells[0] = headerCells[0].replace("text-align:right", "text-align:left");

function paceColor(v) {
  if (v === "—") return "#8b93a8";
  const n = parseFloat(v);
  if (n > 5) return "#34d399";
  if (n < -5) return "#f87171";
  return "#f5a524";
}

const bodyRows = monthly.map(r => {
  const isFuture = r.month > today.slice(0, 7);
  const opacity = isFuture ? "opacity:0.5" : "";
  return `<tr style="${opacity}">
    <td style="padding:10px 14px;border-bottom:1px solid #1c2130;color:#e8ecf4;font-weight:600;text-align:left">${r.month}</td>
    <td style="padding:10px 14px;border-bottom:1px solid #1c2130;color:#e8ecf4;text-align:right">${fmt$(r.spend)}</td>
    <td style="padding:10px 14px;border-bottom:1px solid #1c2130;color:#8b93a8;text-align:right">${r.planned_spend > 0 ? fmt$(r.planned_spend) : "—"}</td>
    <td style="padding:10px 14px;border-bottom:1px solid #1c2130;text-align:right;font-weight:600;color:${paceColor(r.spend_pace)}">${r.spend_pace}</td>
    <td style="padding:10px 14px;border-bottom:1px solid #1c2130;color:#e8ecf4;text-align:right">${fmtN(r.activations)}</td>
    <td style="padding:10px 14px;border-bottom:1px solid #1c2130;color:#8b93a8;text-align:right">${r.planned_act > 0 ? fmtN(r.planned_act) : "—"}</td>
    <td style="padding:10px 14px;border-bottom:1px solid #1c2130;text-align:right;font-weight:600;color:${paceColor(r.act_pace)}">${r.act_pace}</td>
    <td style="padding:10px 14px;border-bottom:1px solid #1c2130;color:#e8ecf4;text-align:right;font-weight:600">${r.cac != null ? "$" + r.cac.toFixed(2) : "—"}</td>
    <td style="padding:10px 14px;border-bottom:1px solid #1c2130;color:#e8ecf4;text-align:right">${fmtN(r.sign_ups)}</td>
    <td style="padding:10px 14px;border-bottom:1px solid #1c2130;color:#e8ecf4;text-align:right">${fmtN(r.installs)}</td>
    <td style="padding:10px 14px;border-bottom:1px solid #1c2130;color:#e8ecf4;text-align:right">${fmt$(r.revenue)}</td>
  </tr>`;
}).join("");

tableEl.innerHTML = `<div style="max-height:520px;overflow-y:auto;border:1px solid #2a3148;border-radius:10px">
  <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
    <thead><tr>${headerCells.join("")}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
</div>`;

display(tableEl);
```

---

## Spend by Segment

```js
const spendBySeg = d3.rollups(actuals.filter(d => d.segment), v => ({
  spend: d3.sum(v, d => d.spend),
  act: d3.sum(v, d => d.activations_y1),
}), d => d.segment).map(([s, v]) => ({
  segment: s, spend: v.spend, act: v.act, cac: v.act > 0 ? v.spend / v.act : null,
})).filter(d => d.spend > 0).sort((a, b) => b.spend - a.spend);
```

```js
const segChart = document.createElement("div");
Plotly.newPlot(segChart, [{
  x: spendBySeg.map(d => d.spend),
  y: spendBySeg.map(d => d.segment),
  type: "bar", orientation: "h",
  marker: {color: spendBySeg.map(d => d.cac && d.cac < 100 ? "#34d399" : d.cac && d.cac < 200 ? "#f5a524" : "#f87171")},
  text: spendBySeg.map(d => `$${(d.spend / 1e6).toFixed(1)}M  (CAC: $${d.cac?.toFixed(0) || "—"})`),
  textposition: "outside", textfont: {color: "#e8ecf4", size: 12},
  hovertemplate: "Segment %{y}<br>Spend: $%{x:,.0f}<extra></extra>",
}], {
  paper_bgcolor: "transparent", plot_bgcolor: "transparent",
  font: {color: "#8b93a8", size: 12},
  xaxis: {gridcolor: "#2a3148", linecolor: "#2a3148", tickprefix: "$", tickformat: ",.0s"},
  yaxis: {gridcolor: "#2a3148", linecolor: "#2a3148", automargin: true},
  margin: {t: 10, b: 30, l: 40, r: 120},
  height: Math.max(160, spendBySeg.length * 60),
}, {responsive: true, displayModeBar: false});
display(segChart);
```

```js
{
  const footer = document.createElement("p");
  footer.style.cssText = "color:#8b93a8;font-size:0.78rem;margin-top:24px";
  footer.innerHTML = `Data: <code style="background:#1c2130;padding:2px 6px;border-radius:4px;color:#7c8cff">${rows.length.toLocaleString()}</code> rows &bull; Showing: <code style="background:#1c2130;padding:2px 6px;border-radius:4px;color:#7c8cff">${startDate}</code> to <code style="background:#1c2130;padding:2px 6px;border-radius:4px;color:#7c8cff">${endDate}</code> &bull; Filtered: <code style="background:#1c2130;padding:2px 6px;border-radius:4px;color:#7c8cff">${filtered.length.toLocaleString()}</code> rows`;
  display(footer);
}
```
