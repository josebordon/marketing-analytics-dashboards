---
title: Marketing Analytics
toc: false
---

# Marketing Analytics Dashboards

<p style="color: var(--muted); margin-top: -8px; margin-bottom: 28px; font-size: 0.95rem;">
Interactive, Git-native dashboards for the Marketing Analytics team.
</p>

<div class="grid grid-cols-2" style="gap: 20px;">
<div class="card" style="padding: 24px;">

### Getting Started

<p style="color: var(--muted); font-size: 0.92rem;">
Dashboards are listed in the sidebar. Each pulls data from governed DataMarts in <code>main_prod</code> and refreshes on the same cadence as the underlying ETL jobs.
</p>

<p style="color: var(--muted); font-size: 0.92rem; margin-top: 12px;">
Use filters, date pickers, and search to slice the data. All filtering runs locally in your browser &mdash; no round-trips to a server.
</p>

</div>
<div class="card" style="padding: 24px;">

### How It Works

<ul style="color: var(--text); font-size: 0.92rem; margin-left: 1.25rem; margin-top: 8px;">
  <li style="margin-bottom: 8px;"><strong>Data:</strong> Databricks DataMarts (<code>main_prod.*</code>)</li>
  <li style="margin-bottom: 8px;"><strong>Refresh:</strong> GitHub Actions on DM job schedule</li>
  <li style="margin-bottom: 8px;"><strong>Interactivity:</strong> DuckDB-WASM in the browser</li>
  <li style="margin-bottom: 8px;"><strong>Version control:</strong> Every change is a PR</li>
</ul>

</div>
</div>
