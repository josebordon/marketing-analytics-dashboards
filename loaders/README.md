# Databricks Data Loaders

The data loaders in `src/data/` currently generate mock data for local development and demos.

To connect to real Databricks data, replace the mock data loaders with Python scripts that query the SQL warehouse.

## Example: pipeline-metrics.csv.py

```python
import os
import sys
import csv
from databricks import sql

conn = sql.connect(
    server_hostname=os.environ["DATABRICKS_HOST"],
    http_path=os.environ["DATABRICKS_HTTP_PATH"],
    access_token=os.environ["DATABRICKS_TOKEN"],
)

cursor = conn.cursor()
cursor.execute("""
    SELECT
        date,
        job_name,
        status,
        duration_minutes
    FROM main_prod.ae_monitoring.daily_pipeline_metrics
    WHERE date >= DATEADD(DAY, -90, CURRENT_DATE())
    ORDER BY date, job_name
""")

writer = csv.writer(sys.stdout)
writer.writerow([desc[0] for desc in cursor.description])
for row in cursor.fetchall():
    writer.writerow(row)

cursor.close()
conn.close()
```

## Setup for GitHub Actions

Add these secrets to the repo:
- `DATABRICKS_HOST` — e.g. `earnin-earnin-prod.cloud.databricks.com`
- `DATABRICKS_HTTP_PATH` — SQL warehouse HTTP path
- `DATABRICKS_TOKEN` — personal access token or service principal token

Then update the GitHub Actions workflow to install `databricks-sql-connector` and set the env vars before building.
