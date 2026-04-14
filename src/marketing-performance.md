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
import {kpiCard} from "./components/kpi-card.js";
```

```js
const raw = FileAttachment("data/forecast_performance.csv").csv({typed: true});
```

```js
const today = new Date();
const todayStr = today.toISOString().slice(0, 10);
const yearStart = todayStr.slice(0, 4) + "-01-01";
const monthStart = todayStr.slice(0, 7) + "-01";

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function getQuarterStart(dateStr) {
  const d = new Date(dateStr);
  const q = Math.floor(d.getMonth() / 3) * 3;
  return `${d.getFullYear()}-${String(q + 1).padStart(2, "0")}-01`;
}

function prevMonthRange() {
  const d = new Date(todayStr);
  d.setMonth(d.getMonth() - 1);
  const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return [start, end.toISOString().slice(0, 10)];
}

const datePresets = new Map([
  ["MTD", [monthStart, todayStr]],
  ["QTD", [getQuarterStart(todayStr), todayStr]],
  ["YTD", [yearStart, todayStr]],
  ["Last Month", prevMonthRange()],
  ["Last 90 Days", [addDays(today, -90), todayStr]],
  ["2025 Full Year", ["2025-01-01", "2025-12-31"]],
  ["2024 Full Year", ["2024-01-01", "2024-12-31"]],
  ["All Time", ["2024-01-01", "2026-12-31"]],
]);
```

```js
const buOptions = ["All", ...new Set(raw.map(d => d.BU).filter(Boolean))].sort();
const acqOptions = ["All", ...new Set(raw.map(d => d.acquisition_type).filter(Boolean))].sort();
const segOptions = ["All", ...new Set(raw.map(d => d.finance_segment_id).filter(Boolean))].sort();
```

```js
const period = view(Inputs.select(datePresets, {label: "Period", value: datePresets.get("MTD")}));
const buFilter = view(Inputs.select(buOptions, {label: "BU", value: "All"}));
const acqFilter = view(Inputs.select(acqOptions, {label: "Acquisition", value: "All"}));
const segFilter = view(Inputs.select(segOptions, {label: "Segment", value: "All"}));
```

```js
const [startDate, endDate] = period;

const filtered = raw.filter(d => {
  if (d.date_et < startDate || d.date_et > endDate) return false;
  if (buFilter !== "All" && d.BU !== buFilter) return false;
  if (acqFilter !== "All" && d.acquisition_type !== acqFilter) return false;
  if (segFilter !== "All" && (d.finance_segment_id || "") !== segFilter) return false;
  return true;
});

const actuals = filtered.filter(d => d.date_et <= todayStr);
const plan = filtered.filter(d => d.planned_spend_usd_amt != null || d.planned_first_cashouts_y1_cnt != null);
```

```js
const totalSpend = d3.sum(actuals, d => d.spend_usd_amt || 0);
const totalSignUps = d3.sum(actuals, d => d.sign_ups_cnt || 0);
const totalActivations = d3.sum(actuals, d => d.first_cashouts_y1_cnt || 0);
const totalMatureActivations = d3.sum(actuals, d => d.first_cashouts_mature_y1_cnt || 0);
const totalInstalls = d3.sum(actuals, d => d.installs_cnt || 0);
const totalRevenue = d3.sum(actuals, d => d.estimated_future_revenue_amt || 0);
const cac = totalActivations > 0 ? totalSpend / totalActivations : 0;

const plannedSpend = d3.sum(plan, d => d.planned_spend_usd_amt || 0);
const plannedActivations = d3.sum(plan, d => d.planned_first_cashouts_y1_cnt || 0);
const plannedCac = plannedActivations > 0 ? plannedSpend / plannedActivations : 0;

const spendVsPlan = plannedSpend > 0 ? (totalSpend - plannedSpend) / plannedSpend : null;
const actVsPlan = plannedActivations > 0 ? (totalActivations - plannedActivations) / plannedActivations : null;
```

<div class="grid grid-cols-6">
  ${kpiCard({title: "Spend", value: "$" + Math.round(totalSpend).toLocaleString(), color: "accent", delta: spendVsPlan, deltaLabel: "vs plan"})}
  ${kpiCard({title: "Sign-Ups", value: Math.round(totalSignUps).toLocaleString(), color: "accent"})}
  ${kpiCard({title: "Activations (Y1)", value: Math.round(totalActivations).toLocaleString(), color: "green", delta: actVsPlan, deltaLabel: "vs plan"})}
  ${kpiCard({title: "CAC", value: "$" + cac.toFixed(2), color: cac > 0 && plannedCac > 0 && cac > plannedCac ? "warn" : "green"})}
  ${kpiCard({title: "Est. Revenue", value: "$" + Math.round(totalRevenue).toLocaleString(), color: "accent"})}
  ${kpiCard({title: "Installs", value: Math.round(totalInstalls).toLocaleString(), color: "accent"})}
</div>

---

## Weekly Spend: Actual vs. Plan

```js
const weeklySpend = d3.rollups(
  filtered,
  v => ({
    actual: d3.sum(v, d => d.spend_usd_amt || 0),
    plan: d3.sum(v, d => d.planned_spend_usd_amt || 0),
  }),
  d => d.date_week?.slice(0, 10)
).map(([week, s]) => ({week: new Date(week), ...s}))
 .filter(d => !isNaN(d.week))
 .sort((a, b) => a.week - b.week);
```

```js
Plot.plot({
  width,
  height: 320,
  x: {type: "utc", label: null},
  y: {label: "Spend ($)", grid: true, tickFormat: d => "$" + (d / 1000).toFixed(0) + "k"},
  color: {legend: true},
  marks: [
    Plot.ruleY([0]),
    Plot.lineY(weeklySpend.filter(d => d.plan > 0), {x: "week", y: "plan", stroke: "#f5a524", strokeDasharray: "6,3", strokeWidth: 2, tip: {format: {y: d => "$" + Math.round(d).toLocaleString()}}}),
    Plot.lineY(weeklySpend.filter(d => d.actual > 0), {x: "week", y: "actual", stroke: "#7c8cff", strokeWidth: 2.5, tip: {format: {y: d => "$" + Math.round(d).toLocaleString()}}}),
    Plot.dot(weeklySpend.filter(d => d.actual > 0), {x: "week", y: "actual", fill: "#7c8cff", r: 2.5}),
    Plot.text([{x: weeklySpend.at(-1)?.week, label: "Actual"}], {x: "x", y: weeklySpend.at(-1)?.actual, text: "label", fill: "#7c8cff", textAnchor: "start", dx: 8, fontWeight: 600, fontSize: 11}),
    Plot.text([{x: weeklySpend.at(-1)?.week, label: "Plan"}], {x: "x", y: weeklySpend.filter(d => d.plan > 0).at(-1)?.plan, text: "label", fill: "#f5a524", textAnchor: "start", dx: 8, fontWeight: 600, fontSize: 11}),
  ],
  style: {background: "transparent", color: "#8b93a8", fontSize: "12px"},
})
```

---

## Weekly Activations: Actual vs. Plan

```js
const weeklyAct = d3.rollups(
  filtered,
  v => ({
    actual: d3.sum(v, d => d.first_cashouts_y1_cnt || 0),
    plan: d3.sum(v, d => d.planned_first_cashouts_y1_cnt || 0),
    mature: d3.sum(v, d => d.first_cashouts_mature_y1_cnt || 0),
  }),
  d => d.date_week?.slice(0, 10)
).map(([week, s]) => ({week: new Date(week), ...s}))
 .filter(d => !isNaN(d.week))
 .sort((a, b) => a.week - b.week);
```

```js
Plot.plot({
  width,
  height: 320,
  x: {type: "utc", label: null},
  y: {label: "Activations", grid: true, tickFormat: d => (d / 1000).toFixed(1) + "k"},
  marks: [
    Plot.ruleY([0]),
    Plot.lineY(weeklyAct.filter(d => d.plan > 0), {x: "week", y: "plan", stroke: "#f5a524", strokeDasharray: "6,3", strokeWidth: 2, tip: {format: {y: d => Math.round(d).toLocaleString()}}}),
    Plot.lineY(weeklyAct.filter(d => d.actual > 0), {x: "week", y: "actual", stroke: "#34d399", strokeWidth: 2.5, tip: {format: {y: d => Math.round(d).toLocaleString()}}}),
    Plot.dot(weeklyAct.filter(d => d.actual > 0), {x: "week", y: "actual", fill: "#34d399", r: 2.5}),
  ],
  style: {background: "transparent", color: "#8b93a8", fontSize: "12px"},
})
```

---

<div class="grid grid-cols-2">
<div class="card" style="padding: 20px;">

### Spend by Acquisition Type

```js
const spendByAcq = d3.rollups(
  actuals,
  v => d3.sum(v, d => d.spend_usd_amt || 0),
  d => d.acquisition_type || "unknown"
).map(([type, total]) => ({type, total}))
 .filter(d => d.total > 0)
 .sort((a, b) => b.total - a.total);
```

```js
Plot.plot({
  marginLeft: 80,
  marginRight: 100,
  height: Math.max(140, spendByAcq.length * 40),
  x: {label: "Spend ($)", grid: true, tickFormat: d => "$" + (d / 1e6).toFixed(1) + "M"},
  y: {label: null, padding: 0.3},
  marks: [
    Plot.barX(spendByAcq, {
      x: "total",
      y: "type",
      fill: "#7c8cff",
      sort: {y: "-x"},
      tip: {format: {x: d => "$" + Math.round(d).toLocaleString()}},
      rx: 3,
    }),
    Plot.text(spendByAcq, {
      x: "total",
      y: "type",
      text: d => "$" + (d.total / 1e6).toFixed(2) + "M",
      dx: 6,
      textAnchor: "start",
      fill: "#e8ecf4",
      fontSize: 11,
      fontWeight: 600,
    }),
    Plot.ruleX([0]),
  ],
  style: {background: "transparent", color: "#8b93a8", fontSize: "12px"},
})
```

</div>
<div class="card" style="padding: 20px;">

### CAC Trend (Weekly)

```js
const weeklyCac = weeklySpend.map((d, i) => ({
  week: d.week,
  cac: weeklyAct[i]?.actual > 0 ? d.actual / weeklyAct[i].actual : null,
  planCac: weeklyAct[i]?.plan > 0 && weeklySpend[i]?.plan > 0 ? weeklySpend[i].plan / weeklyAct[i].plan : null,
})).filter(d => d.cac !== null && d.cac > 0 && d.cac < 500);
```

```js
Plot.plot({
  width,
  height: Math.max(200, 200),
  x: {type: "utc", label: null},
  y: {label: "CAC ($)", grid: true, tickFormat: d => "$" + d.toFixed(0)},
  marks: [
    Plot.ruleY([0]),
    Plot.lineY(weeklyCac.filter(d => d.planCac != null && d.planCac > 0 && d.planCac < 500), {x: "week", y: "planCac", stroke: "#f5a524", strokeDasharray: "6,3", strokeWidth: 2}),
    Plot.lineY(weeklyCac, {x: "week", y: "cac", stroke: "#f87171", strokeWidth: 2.5, tip: {format: {y: d => "$" + d.toFixed(2)}}}),
    Plot.dot(weeklyCac, {x: "week", y: "cac", fill: "#f87171", r: 2.5}),
  ],
  style: {background: "transparent", color: "#8b93a8", fontSize: "12px"},
})
```

</div>
</div>

---

## Monthly Summary

```js
const monthlySummary = d3.rollups(
  filtered,
  v => ({
    spend: d3.sum(v, d => d.spend_usd_amt || 0),
    planned_spend: d3.sum(v, d => d.planned_spend_usd_amt || 0),
    sign_ups: d3.sum(v, d => d.sign_ups_cnt || 0),
    installs: d3.sum(v, d => d.installs_cnt || 0),
    activations: d3.sum(v, d => d.first_cashouts_y1_cnt || 0),
    planned_activations: d3.sum(v, d => d.planned_first_cashouts_y1_cnt || 0),
    mature_activations: d3.sum(v, d => d.first_cashouts_mature_y1_cnt || 0),
    revenue: d3.sum(v, d => d.estimated_future_revenue_amt || 0),
  }),
  d => d.date_et?.slice(0, 7)
).map(([month, s]) => ({
  month,
  ...s,
  cac: s.activations > 0 ? s.spend / s.activations : null,
  planned_cac: s.planned_activations > 0 ? s.planned_spend / s.planned_activations : null,
  spend_pacing: s.planned_spend > 0 ? ((s.spend / s.planned_spend - 1) * 100).toFixed(1) + "%" : "—",
  act_pacing: s.planned_activations > 0 ? ((s.activations / s.planned_activations - 1) * 100).toFixed(1) + "%" : "—",
}))
 .sort((a, b) => b.month.localeCompare(a.month));
```

```js
Inputs.table(monthlySummary, {
  columns: ["month", "spend", "planned_spend", "spend_pacing", "activations", "planned_activations", "act_pacing", "cac", "sign_ups", "installs", "revenue"],
  header: {
    month: "Month",
    spend: "Spend",
    planned_spend: "Plan Spend",
    spend_pacing: "Spend Pace",
    activations: "Activations",
    planned_activations: "Plan Acts",
    act_pacing: "Act Pace",
    cac: "CAC",
    sign_ups: "Sign-Ups",
    installs: "Installs",
    revenue: "Est. Revenue",
  },
  format: {
    spend: d => "$" + Math.round(d).toLocaleString(),
    planned_spend: d => d ? "$" + Math.round(d).toLocaleString() : "—",
    activations: d => Math.round(d).toLocaleString(),
    planned_activations: d => d ? Math.round(d).toLocaleString() : "—",
    cac: d => d != null ? "$" + d.toFixed(2) : "—",
    sign_ups: d => Math.round(d).toLocaleString(),
    installs: d => Math.round(d).toLocaleString(),
    revenue: d => "$" + Math.round(d).toLocaleString(),
  },
  rows: 18,
  sort: "month",
  reverse: true,
})
```

---

## Spend by Segment

```js
const spendBySeg = d3.rollups(
  actuals.filter(d => d.finance_segment_id),
  v => ({
    spend: d3.sum(v, d => d.spend_usd_amt || 0),
    activations: d3.sum(v, d => d.first_cashouts_y1_cnt || 0),
  }),
  d => d.finance_segment_id
).map(([seg, s]) => ({
  segment: seg,
  spend: s.spend,
  activations: s.activations,
  cac: s.activations > 0 ? s.spend / s.activations : null,
}))
 .filter(d => d.spend > 0)
 .sort((a, b) => b.spend - a.spend);
```

```js
Plot.plot({
  marginLeft: 50,
  marginRight: 100,
  width,
  height: Math.max(160, spendBySeg.length * 40),
  x: {label: "Spend ($)", grid: true, tickFormat: d => "$" + (d / 1e6).toFixed(1) + "M"},
  y: {label: null, padding: 0.3},
  marks: [
    Plot.barX(spendBySeg, {
      x: "spend",
      y: "segment",
      fill: d => d.cac && d.cac < 100 ? "#34d399" : d.cac && d.cac < 200 ? "#f5a524" : "#f87171",
      sort: {y: "-x"},
      tip: {format: {x: d => "$" + Math.round(d).toLocaleString()}},
      rx: 3,
    }),
    Plot.text(spendBySeg, {
      x: "spend",
      y: "segment",
      text: d => `$${(d.spend / 1e6).toFixed(1)}M  (CAC: $${d.cac?.toFixed(0) || "—"})`,
      dx: 6,
      textAnchor: "start",
      fill: "#e8ecf4",
      fontSize: 11,
      fontWeight: 600,
    }),
    Plot.ruleX([0]),
  ],
  style: {background: "transparent", color: "#8b93a8", fontSize: "12px"},
})
```

<p style="color: var(--muted); font-size: 0.78rem; margin-top: 24px;">
Data refreshed: <code>${raw.length.toLocaleString()}</code> rows &bull;
Date range: <code>${startDate}</code> to <code>${endDate}</code> &bull;
Last updated: ${new Date().toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"})}
</p>
