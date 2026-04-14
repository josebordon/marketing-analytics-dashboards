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

### Marketing Performance

<p style="color: var(--muted); font-size: 0.92rem;">
Spend, activations, and CAC &mdash; actual vs. plan. Powered by <code>rpt_marketing_performance_to_forecast_daily</code>.
</p>

<a href="./marketing-performance" style="display: inline-block; margin-top: 12px; padding: 8px 16px; background: var(--accent); color: var(--bg); border-radius: 6px; font-weight: 600; font-size: 0.85rem; text-decoration: none;">Open Dashboard &rarr;</a>

</div>
<div class="card" style="padding: 24px;">

### How It Works

<ul style="color: var(--text); font-size: 0.92rem; margin-left: 1.25rem; margin-top: 8px;">
  <li style="margin-bottom: 8px;"><strong>Data:</strong> Databricks DataMarts (<code>main_prod.marketing_dm</code>)</li>
  <li style="margin-bottom: 8px;"><strong>Refresh:</strong> GitHub Actions on DM job schedule</li>
  <li style="margin-bottom: 8px;"><strong>Interactivity:</strong> Filters run locally in the browser</li>
  <li style="margin-bottom: 8px;"><strong>Version control:</strong> Every change is a PR</li>
</ul>

</div>
</div>
