---
title: Clean Data Dashboard
toc: false
---

# Clean Data Dashboard

<p style="color: var(--muted); margin-top: -12px; margin-bottom: 20px; font-size: 0.9rem;">
Operational visibility into DataMart health, Genie adoption, and compute costs. Source: <code>main_prod.ae_monitoring</code>.
</p>

```js
import {kpiCard} from "./components/kpi-card.js";
```

```js
const pipeline = FileAttachment("data/pipeline-metrics.csv").csv({typed: true});
const genieRaw = FileAttachment("data/genie-metrics.csv").csv({typed: true});
const costsRaw = FileAttachment("data/cost-metrics.csv").csv({typed: true});
const tablesMeta = FileAttachment("data/table-metadata.csv").csv({typed: true});
```

```js
const dateRange = view(Inputs.select(
  new Map([["7 days", 7], ["14 days", 14], ["30 days", 30], ["90 days", 90]]),
  {value: 14, label: "Date range"}
));
```

```js
const cutoff = new Date();
cutoff.setDate(cutoff.getDate() - dateRange);
const cutoffStr = cutoff.toISOString().slice(0, 10);

const fp = pipeline.filter(d => d.date >= cutoffStr);
const fg = genieRaw.filter(d => d.date >= cutoffStr);
const fc = costsRaw.filter(d => d.date >= cutoffStr);
```

```js
const totalRuns = fp.length;
const successRuns = fp.filter(d => d.status === "SUCCESS").length;
const avgSuccessRate = totalRuns > 0 ? (successRuns / totalRuns * 100).toFixed(1) : "\u2014";
const jobCount = new Set(fp.map(d => d.job_name)).size;
const genieQueries = d3.sum(fg, d => d.query_count);
const dmCost = d3.sum(fc.filter(d => d.category === "DM"), d => d.cost_dollars);
const governedTables = tablesMeta.length;
const latestGenieDate = d3.max(fg, d => d.date);
const genieUsers = d3.sum(
  fg.filter(d => d.date === latestGenieDate),
  d => d.active_users
);
```

<div class="grid grid-cols-3" style="gap: 14px;">
  ${kpiCard({title: "Avg Success Rate", value: avgSuccessRate + "%", color: "green"})}
  ${kpiCard({title: "DM Jobs Tracked", value: String(jobCount), color: "accent"})}
  ${kpiCard({title: "Genie Queries", value: genieQueries.toLocaleString(), color: "accent"})}
  ${kpiCard({title: "DM Job Cost", value: "$" + Math.round(dmCost).toLocaleString(), color: "warn"})}
  ${kpiCard({title: "Tables Governed", value: String(governedTables), color: "green"})}
  ${kpiCard({title: "Genie Active Users", value: String(genieUsers), color: "accent"})}
</div>

---

## Job Reliability

<p style="color: var(--muted); font-size: 0.85rem;">Success rate per job over the selected period. Jobs with failures are highlighted.</p>

```js
const jobReliability = d3.rollups(
  fp,
  v => ({rate: v.filter(d => d.status === "SUCCESS").length / v.length * 100, runs: v.length, failures: v.filter(d => d.status === "FAILED").length}),
  d => d.job_name
).map(([name, stats]) => ({job_name: name, success_rate: stats.rate, total_runs: stats.runs, failures: stats.failures}))
 .sort((a, b) => a.success_rate - b.success_rate);
```

```js
Plot.plot({
  marginLeft: 180,
  width,
  height: Math.max(300, jobReliability.length * 28),
  x: {domain: [0, 100], label: "Success rate (%)", grid: true},
  y: {label: null},
  marks: [
    Plot.barX(jobReliability, {
      x: "success_rate",
      y: "job_name",
      fill: d => d.success_rate >= 99.9 ? "#34d399" : d.success_rate >= 95 ? "#f5a524" : "#f87171",
      sort: {y: "x"},
      tip: true,
    }),
    Plot.text(jobReliability, {
      x: "success_rate",
      y: "job_name",
      text: d => d.success_rate.toFixed(1) + "%",
      dx: 4,
      textAnchor: "start",
      fill: "#e8ecf4",
      fontSize: 11,
    }),
    Plot.ruleX([0]),
  ],
  style: {background: "transparent", color: "#8b93a8"},
})
```

---

## Genie Room Usage

<p style="color: var(--muted); font-size: 0.85rem;">Total queries per room and peak active users.</p>

```js
const genieByRoom = d3.rollups(
  fg,
  v => ({queries: d3.sum(v, d => d.query_count), users: d3.max(v, d => d.active_users)}),
  d => d.room_name
).map(([room, stats]) => ({room_name: room, ...stats}))
 .sort((a, b) => b.queries - a.queries);
```

```js
Plot.plot({
  marginLeft: 180,
  width,
  height: Math.max(200, genieByRoom.length * 36),
  x: {label: "Total queries", grid: true},
  y: {label: null},
  marks: [
    Plot.barX(genieByRoom, {
      x: "queries",
      y: "room_name",
      fill: "#7c8cff",
      sort: {y: "-x"},
      tip: true,
    }),
    Plot.text(genieByRoom, {
      x: "queries",
      y: "room_name",
      text: d => `${d.queries.toLocaleString()} (${d.users} users)`,
      dx: 4,
      textAnchor: "start",
      fill: "#e8ecf4",
      fontSize: 11,
    }),
    Plot.ruleX([0]),
  ],
  style: {background: "transparent", color: "#8b93a8"},
})
```

---

## Cost Breakdown

```js
const categoryColors = {"DM": "#7c8cff", "Non-DM": "#f87171", "MV": "#34d399", "Genie": "#2dd4bf"};
```

```js
const costByCategory = d3.rollups(
  fc,
  v => d3.sum(v, d => d.cost_dollars),
  d => d.category
).map(([category, total]) => ({category, total}))
 .sort((a, b) => b.total - a.total);

const totalCost = d3.sum(costByCategory, d => d.total);
```

<div class="grid grid-cols-2" style="gap: 24px;">
<div class="card" style="padding: 20px;">

### Cost by Category &mdash; Total: $${Math.round(totalCost).toLocaleString()}

```js
Plot.plot({
  marginLeft: 80,
  width: 420,
  height: 200,
  x: {label: "Cost ($)", grid: true},
  y: {label: null},
  marks: [
    Plot.barX(costByCategory, {
      x: "total",
      y: "category",
      fill: d => categoryColors[d.category] || "#8b93a8",
      sort: {y: "-x"},
      tip: true,
    }),
    Plot.text(costByCategory, {
      x: "total",
      y: "category",
      text: d => `$${Math.round(d.total).toLocaleString()} (${(d.total / totalCost * 100).toFixed(0)}%)`,
      dx: 4,
      textAnchor: "start",
      fill: "#e8ecf4",
      fontSize: 11,
    }),
    Plot.ruleX([0]),
  ],
  style: {background: "transparent", color: "#8b93a8"},
})
```

</div>
<div class="card" style="padding: 20px;">

### Top 10 Jobs by Cost

```js
const costCategoryFilter = view(Inputs.select(
  ["All", "DM", "Non-DM", "MV", "Genie"],
  {value: "DM", label: "Category"}
));
```

```js
const topJobs = d3.rollups(
  fc.filter(d => costCategoryFilter === "All" || d.category === costCategoryFilter),
  v => d3.sum(v, d => d.cost_dollars),
  d => d.job_name
).map(([name, total]) => ({job_name: name, total}))
 .sort((a, b) => b.total - a.total)
 .slice(0, 10);
```

```js
Plot.plot({
  marginLeft: 260,
  width: 480,
  height: Math.max(200, topJobs.length * 30),
  x: {label: "Cost ($)", grid: true},
  y: {label: null},
  marks: [
    Plot.barX(topJobs, {
      x: "total",
      y: "job_name",
      fill: categoryColors[costCategoryFilter] || "#f5a524",
      sort: {y: "-x"},
      tip: true,
    }),
    Plot.text(topJobs, {
      x: "total",
      y: "job_name",
      text: d => "$" + Math.round(d.total).toLocaleString(),
      dx: 4,
      textAnchor: "start",
      fill: "#e8ecf4",
      fontSize: 11,
    }),
    Plot.ruleX([0]),
  ],
  style: {background: "transparent", color: "#8b93a8"},
})
```

</div>
</div>

---

## Daily Cost Trend

<p style="color: var(--muted); font-size: 0.85rem;">Stacked area showing daily compute spend by category.</p>

```js
const dailyCost = d3.rollups(
  fc,
  v => d3.sum(v, d => d.cost_dollars),
  d => d.date,
  d => d.category
).flatMap(([date, cats]) => cats.map(([cat, total]) => ({date: new Date(date), category: cat, total})));
```

```js
Plot.plot({
  width,
  height: 320,
  x: {type: "utc", label: null},
  y: {label: "Daily cost ($)", grid: true},
  color: {
    domain: ["DM", "Non-DM", "MV", "Genie"],
    range: ["#7c8cff", "#f87171", "#34d399", "#2dd4bf"],
    legend: true,
  },
  marks: [
    Plot.areaY(dailyCost, Plot.stackY({
      x: "date",
      y: "total",
      fill: "category",
      curve: "step",
      tip: true,
    })),
    Plot.ruleY([0]),
  ],
  style: {background: "transparent", color: "#8b93a8"},
})
```

---

## Documentation Coverage

<p style="color: var(--muted); font-size: 0.85rem;">Column documentation and primary key coverage by schema.</p>

```js
const schemaCoverage = d3.rollups(
  tablesMeta,
  v => ({
    tables: v.length,
    withDesc: v.filter(d => d.has_description === true || d.has_description === "true").length,
    withPk: v.filter(d => d.has_primary_key === true || d.has_primary_key === "true").length,
    docRate: d3.sum(v, d => d.documented_columns) / d3.sum(v, d => d.total_columns) * 100,
  }),
  d => d.schema_name
).map(([schema, s]) => ({schema_name: schema, ...s}))
 .sort((a, b) => b.tables - a.tables);
```

```js
Plot.plot({
  marginLeft: 170,
  width,
  height: Math.max(250, schemaCoverage.length * 28),
  x: {domain: [0, 100], label: "Column documentation rate (%)", grid: true},
  y: {label: null},
  marks: [
    Plot.barX(schemaCoverage, {
      x: "docRate",
      y: "schema_name",
      fill: d => d.docRate >= 80 ? "#34d399" : d.docRate >= 50 ? "#f5a524" : "#f87171",
      sort: {y: "x"},
      tip: true,
    }),
    Plot.text(schemaCoverage, {
      x: "docRate",
      y: "schema_name",
      text: d => `${d.docRate.toFixed(0)}% (${d.tables} tables)`,
      dx: 4,
      textAnchor: "start",
      fill: "#e8ecf4",
      fontSize: 11,
    }),
    Plot.ruleX([0]),
  ],
  style: {background: "transparent", color: "#8b93a8"},
})
```

---

## Pipeline Detail

<p style="color: var(--muted); font-size: 0.85rem;">Search and filter individual job runs.</p>

```js
const jobSearch = view(Inputs.search(fp, {placeholder: "Search jobs\u2026"}));
```

```js
Inputs.table(jobSearch, {
  columns: ["date", "job_name", "status", "duration_minutes"],
  header: {
    date: "Date",
    job_name: "Job",
    status: "Status",
    duration_minutes: "Duration (min)",
  },
  sort: "date",
  reverse: true,
  rows: 20,
})
```

<p style="color: var(--muted); font-size: 0.78rem; margin-top: 16px;">Source tables: <code>ae_monitoring.daily_pipeline_metrics</code>, <code>ae_monitoring.genie_metrics_daily</code>, <code>ae_monitoring.databricks_cost_daily</code>, <code>ae_monitoring.table_metadata_metrics</code>.</p>
