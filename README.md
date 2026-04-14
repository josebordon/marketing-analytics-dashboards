# Marketing Analytics Dashboards

Interactive, Git-native dashboards replacing Tableau. Built with [Observable Framework](https://observablehq.com/framework/) + [DuckDB-WASM](https://duckdb.org/docs/api/wasm/overview.html).

## Architecture

```
Databricks DataMarts → Data Loaders (Python/SQL) → Parquet/CSV → Observable Framework → GitHub Pages
```

**Key ideas:**
- Data refreshes on the same schedule as the underlying DataMarts (extract model, like Tableau extracts)
- DuckDB-WASM runs SQL in the browser for instant filtering, drill-downs, and cross-filtering
- Dashboards are version-controlled, PR-reviewable, and AI-buildable
- Zero infrastructure — static site hosted on GitHub Pages

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000 to preview dashboards locally.

## Project structure

```
src/
  index.md                    # Home / dashboard index
  data/                       # Data loaders (run at build time)
    example.csv.py            # Python script → CSV output
  components/                 # Reusable JS components
    kpi-card.js               # KPI summary cards
    filter-bar.js             # Filter dropdowns
  my-dashboard.md             # Each .md file = one dashboard page
observablehq.config.js        # Framework config
.github/workflows/deploy.yml  # Scheduled build + deploy to GitHub Pages
```

## Adding a new dashboard

1. Create `src/my-dashboard.md`
2. Add data loaders in `src/data/` (Python scripts that query Databricks and output CSV/Parquet)
3. Import data and build interactive charts in the markdown page
4. Add the page to `observablehq.config.js`
5. Preview with `npm run dev`, then push to deploy

## Deployment

GitHub Actions builds and deploys to GitHub Pages on every push to `main`, and on a daily schedule aligned to DataMart refresh cadence.
