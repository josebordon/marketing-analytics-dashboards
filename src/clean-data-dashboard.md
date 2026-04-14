---
title: Clean Data Dashboard
toc: false
---

<h1 style="margin-bottom: 4px;">Clean Data Dashboard</h1>
<p style="color: var(--muted); margin-bottom: 24px; font-size: 0.9rem;">
Operational visibility into DataMart health, Genie adoption, and compute costs.<br>
Source: <code>main_prod.ae_monitoring</code>
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
const genieUsers = d3.sum(fg.filter(d => d.date === latestGenieDate), d => d.active_users);
```

<div class="grid grid-cols-6">
  ${kpiCard({title: "Avg Success Rate", value: avgSuccessRate + "%", color: "green"})}
  ${kpiCard({title: "DM Jobs Tracked", value: String(jobCount), color: "accent"})}
  ${kpiCard({title: "Genie Queries", value: genieQueries.toLocaleString(), color: "accent"})}
  ${kpiCard({title: "DM Job Cost", value: "$" + Math.round(dmCost).toLocaleString(), color: "warn"})}
  ${kpiCard({title: "Tables Governed", value: String(governedTables), color: "green"})}
  ${kpiCard({title: "Genie Active Users", value: String(genieUsers), color: "accent"})}
</div>

---

## Job Reliability

<p style="color: var(--muted); font-size: 0.85rem; margin-top: -8px;">Success rate per job. Jobs with failures are highlighted.</p>

```js
const jobReliability = d3.rollups(
  fp,
  v => ({rate: v.filter(d => d.status === "SUCCESS").length / v.length * 100, runs: v.length, failures: v.filter(d => d.status === "FAILED").length}),
  d => d.job_name
).map(([name, s]) => ({job_name: name, success_rate: s.rate, total_runs: s.runs, failures: s.failures}))
 .sort((a, b) => a.success_rate - b.success_rate);
```

```js
Plot.plot({
  marginLeft: 180,
  marginRight: 60,
  width,
  height: Math.max(300, jobReliability.length * 26),
  x: {domain: [0, 100], label: "Success rate (%)", grid: true, ticks: 5},
  y: {label: null, padding: 0.2},
  marks: [
    Plot.barX(jobReliability, {
      x: "success_rate",
      y: "job_name",
      fill: d => d.success_rate >= 99.9 ? "#34d399" : d.success_rate >= 95 ? "#f5a524" : "#f87171",
      sort: {y: "x"},
      tip: {format: {y: true, x: (d) => d.toFixed(1) + "%"}},
      rx: 3,
    }),
    Plot.text(jobReliability, {
      x: "success_rate",
      y: "job_name",
      text: d => d.success_rate.toFixed(1) + "%",
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

---

## Genie Room Usage

<p style="color: var(--muted); font-size: 0.85rem; margin-top: -8px;">Total queries per room and peak active users.</p>

```js
const genieByRoom = d3.rollups(
  fg,
  v => ({queries: d3.sum(v, d => d.query_count), users: d3.max(v, d => d.active_users)}),
  d => d.room_name
).map(([room, s]) => ({room_name: room, ...s}))
 .sort((a, b) => b.queries - a.queries);
```

```js
Plot.plot({
  marginLeft: 180,
  marginRight: 80,
  width,
  height: Math.max(200, genieByRoom.length * 34),
  x: {label: "Total queries", grid: true},
  y: {label: null, padding: 0.2},
  marks: [
    Plot.barX(genieByRoom, {
      x: "queries",
      y: "room_name",
      fill: "#7c8cff",
      sort: {y: "-x"},
      tip: true,
      rx: 3,
    }),
    Plot.text(genieByRoom, {
      x: "queries",
      y: "room_name",
      text: d => `${d.queries.toLocaleString()}  (${d.users} users)`,
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

<div class="grid grid-cols-2">
<div class="card" style="padding: 20px;">

<h3 style="margin-top: 0;">By Category &mdash; Total: $${Math.round(totalCost).toLocaleString()}</h3>

```js
Plot.plot({
  marginLeft: 80,
  marginRight: 100,
  height: 180,
  x: {label: "Cost ($)", grid: true},
  y: {label: null, padding: 0.3},
  marks: [
    Plot.barX(costByCategory, {
      x: "total",
      y: "category",
      fill: d => categoryColors[d.category],
      sort: {y: "-x"},
      tip: true,
      rx: 3,
    }),
    Plot.text(costByCategory, {
      x: "total",
      y: "category",
      text: d => `$${Math.round(d.total).toLocaleString()} (${(d.total / totalCost * 100).toFixed(0)}%)`,
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

<h3 style="margin-top: 0;">Top 10 Jobs by Cost</h3>

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
  marginLeft: 250,
  marginRight: 70,
  height: Math.max(180, topJobs.length * 28),
  x: {label: "Cost ($)", grid: true},
  y: {label: null, padding: 0.2},
  marks: [
    Plot.barX(topJobs, {
      x: "total",
      y: "job_name",
      fill: categoryColors[costCategoryFilter] || "#f5a524",
      sort: {y: "-x"},
      tip: true,
      rx: 3,
    }),
    Plot.text(topJobs, {
      x: "total",
      y: "job_name",
      text: d => "$" + Math.round(d.total).toLocaleString(),
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
</div>

---

## Daily Cost Trend

<p style="color: var(--muted); font-size: 0.85rem; margin-top: -8px;">Stacked area: daily compute spend by category.</p>

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
      fillOpacity: 0.8,
    })),
    Plot.ruleY([0]),
  ],
  style: {background: "transparent", color: "#8b93a8", fontSize: "12px"},
})
```

---

## Documentation Coverage

<p style="color: var(--muted); font-size: 0.85rem; margin-top: -8px;">Column documentation rate by schema.</p>

```js
const schemaCoverage = d3.rollups(
  tablesMeta,
  v => ({
    tables: v.length,
    docRate: d3.sum(v, d => +d.documented_columns) / d3.sum(v, d => +d.total_columns) * 100,
  }),
  d => d.schema_name
).map(([schema, s]) => ({schema_name: schema, ...s}))
 .sort((a, b) => b.tables - a.tables);
```

```js
Plot.plot({
  marginLeft: 180,
  marginRight: 80,
  width,
  height: Math.max(250, schemaCoverage.length * 26),
  x: {domain: [0, 100], label: "Column documentation rate (%)", grid: true},
  y: {label: null, padding: 0.2},
  marks: [
    Plot.barX(schemaCoverage, {
      x: "docRate",
      y: "schema_name",
      fill: d => d.docRate >= 80 ? "#34d399" : d.docRate >= 50 ? "#f5a524" : "#f87171",
      sort: {y: "x"},
      tip: true,
      rx: 3,
    }),
    Plot.text(schemaCoverage, {
      x: "docRate",
      y: "schema_name",
      text: d => `${d.docRate.toFixed(0)}%  (${d.tables} tables)`,
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

---

## Pipeline Detail

<p style="color: var(--muted); font-size: 0.85rem; margin-top: -8px;">Search and browse individual job runs.</p>

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

<p style="color: var(--muted); font-size: 0.78rem; margin-top: 20px;">Source: <code>ae_monitoring.daily_pipeline_metrics</code>, <code>ae_monitoring.genie_metrics_daily</code>, <code>ae_monitoring.databricks_cost_daily</code>, <code>ae_monitoring.table_metadata_metrics</code>.</p>
