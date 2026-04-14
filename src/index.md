---
title: Marketing Analytics
toc: false
---

# Marketing Analytics Dashboards

Interactive, Git-native dashboards for the Marketing Analytics team.

<div class="grid grid-cols-2" style="gap: 24px; margin-top: 32px;">
  <div class="card" style="padding: 24px;">
    <h2 style="color: var(--accent); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px;">Getting started</h2>
    <p style="color: var(--muted); font-size: 0.95rem;">Dashboards are listed in the sidebar. Each dashboard pulls data from governed DataMarts in <code>main_prod</code> and refreshes on the same cadence as the underlying ETL jobs.</p>
    <p style="color: var(--muted); font-size: 0.95rem; margin-top: 12px;">Use filters, date pickers, and search to explore the data. All filtering runs locally in your browser via DuckDB — no round-trips to a server.</p>
  </div>
  <div class="card" style="padding: 24px;">
    <h2 style="color: var(--accent); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px;">How it works</h2>
    <ul style="color: var(--text); font-size: 0.95rem; margin-left: 1.25rem;">
      <li style="margin-bottom: 8px;"><strong>Data source:</strong> Databricks DataMarts (<code>main_prod.*</code>)</li>
      <li style="margin-bottom: 8px;"><strong>Refresh:</strong> Automated via GitHub Actions on DM job schedule</li>
      <li style="margin-bottom: 8px;"><strong>Interactivity:</strong> DuckDB-WASM (SQL in the browser)</li>
      <li style="margin-bottom: 8px;"><strong>Version control:</strong> Every change is a PR</li>
    </ul>
  </div>
</div>
