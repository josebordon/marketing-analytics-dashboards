#!/usr/bin/env python3
"""Export marketing data from Databricks to Parquet files for the dashboard.

Usage:
    pip install -r scripts/requirements.txt
    python scripts/export_data.py

Supports:
  - databricks-cli auth (~/.databrickscfg with auth_type = databricks-cli)
  - Personal access token (DATABRICKS_TOKEN env var)
  - Any auth method supported by databricks-sdk
"""
import os
import sys
import time
from pathlib import Path

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "src" / "data"

FORECAST_QUERY = """
SELECT
    *,
    CASE
        WHEN finance_product_name = 'Basic Account' OR finance_product_name IS NULL THEN 'Cash Out'
        ELSE finance_product_name
    END AS BU
FROM main_prod.marketing_dm.rpt_marketing_performance_to_forecast_daily
WHERE date_et >= '2024-01-01'
"""

ATTRIBUTION_QUERY = """
SELECT
    DATE(DATE_TRUNC('day', date_est)) AS dt,
    platform,
    CASE
        WHEN finance_product_name = 'Basic Account' OR finance_product_name IS NULL THEN 'Cash Out'
        ELSE finance_product_name
    END AS BU,
    CASE WHEN source = 'IMPACT' THEN 'web' ELSE s.reporting_platform END AS reporting_platform,
    s.acquisition_type,
    CASE WHEN s.acquisition_type = 'organic' AND s.source = 'UNATTRIBUTED' THEN 'ORGANIC' ELSE s.source END AS source,
    CASE WHEN s.source = 'OXFORDROAD' THEN 'Podcast' ELSE s.ua_segment END AS ua_segment,
    s.publisher_type,
    s.partner_alias,
    s.partner_name,
    s.campaign_name,
    SUM(impressions_cnt) AS impressions,
    SUM(clicks_cnt) AS clicks,
    SUM(spend_usd_amt) AS spend,
    SUM(sign_ups_cnt) AS sign_ups,
    SUM(first_cashouts_d7_cnt) AS on_demand_activations_d7_cnt,
    SUM(first_cashouts_y1_cnt) AS on_demand_activations_y1_cnt,
    AVG(cac_target_avg) AS avg_cac_target
FROM main_prod.marketing_dm.rpt_marketing_attribution_skan_kpi_daily s
LEFT JOIN main_prod.marketing_dm.dim_ua_campaign d
    ON s.campaign_name = d.campaign_name
WHERE DATE_TRUNC('month', date_est) >= '2024-01-01'
    AND attribution_event = 'sign_up'
GROUP BY 1,2,3,4,5,6,7,8,9,10,11
"""

HTTP_PATH = "/sql/1.0/warehouses/6a2b398a53d1d612"


def get_connection():
    """Connect to Databricks using the best available auth method."""
    token = os.environ.get("DATABRICKS_TOKEN")
    host = os.environ.get("DATABRICKS_HOST", "earnin-earnin-prod.cloud.databricks.com")
    http_path = os.environ.get("DATABRICKS_HTTP_PATH", HTTP_PATH)

    if token:
        from databricks import sql as dbsql
        print(f"Auth: using DATABRICKS_TOKEN env var")
        return dbsql.connect(
            server_hostname=host,
            http_path=http_path,
            access_token=token,
        )

    try:
        from databricks.sdk import WorkspaceClient
        from databricks import sql as dbsql

        w = WorkspaceClient()
        config = w.config
        print(f"Auth: using databricks-sdk ({config.auth_type})")
        print(f"Host: {config.host}")

        def credential_provider():
            header_factory = config.authenticate
            def provide():
                headers = header_factory()
                return headers
            return provide

        return dbsql.connect(
            server_hostname=config.host.replace("https://", ""),
            http_path=http_path,
            credentials_provider=credential_provider(),
        )
    except Exception as e:
        print(f"databricks-sdk auth failed: {e}")
        pass

    cfg_path = Path.home() / ".databrickscfg"
    if cfg_path.exists():
        import configparser
        config = configparser.ConfigParser()
        config.read(cfg_path)
        profile = os.environ.get("DATABRICKS_PROFILE", "DEFAULT")
        if profile in config and "token" in config[profile]:
            from databricks import sql as dbsql
            h = config[profile].get("host", host).replace("https://", "")
            t = config[profile]["token"]
            print(f"Auth: using ~/.databrickscfg [{profile}] with PAT")
            return dbsql.connect(
                server_hostname=h,
                http_path=http_path,
                access_token=t,
            )

    print("Error: No Databricks credentials found.")
    print("Options:")
    print("  1. Set DATABRICKS_TOKEN env var")
    print("  2. pip install databricks-sdk (uses databricks-cli auth)")
    print("  3. Add token to ~/.databrickscfg")
    sys.exit(1)


def export_query(conn, name, query, output_path):
    import pyarrow.parquet as pq

    print(f"\n{'='*60}")
    print(f"Exporting: {name}")
    print(f"Output:    {output_path}")
    print(f"{'='*60}")

    start = time.time()
    cursor = conn.cursor()

    print("Running query...")
    cursor.execute(query)

    print("Fetching results as Arrow...")
    table = cursor.fetchall_arrow()
    elapsed = time.time() - start

    print(f"Rows:      {table.num_rows:,}")
    print(f"Columns:   {table.num_columns}")
    print(f"Query time: {elapsed:.1f}s")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    pq.write_table(table, output_path, compression="snappy")

    size_mb = output_path.stat().st_size / (1024 * 1024)
    print(f"File size: {size_mb:.1f} MB")
    print(f"Done: {name}")

    cursor.close()
    return table.num_rows


def main():
    print("Connecting to Databricks...")
    conn = get_connection()
    print("Connected.\n")

    total_rows = 0
    total_rows += export_query(
        conn,
        "marketing_dm_forecast_performance",
        FORECAST_QUERY,
        OUTPUT_DIR / "forecast_performance.parquet",
    )
    total_rows += export_query(
        conn,
        "datamart_transition (attribution)",
        ATTRIBUTION_QUERY,
        OUTPUT_DIR / "attribution.parquet",
    )

    conn.close()

    print(f"\n{'='*60}")
    print(f"Export complete: {total_rows:,} total rows")
    print(f"Files written to: {OUTPUT_DIR}/")
    print(f"\nNext steps:")
    print(f"  cd {OUTPUT_DIR.parent.parent}")
    print(f"  git add src/data/*.parquet")
    print(f"  git commit -m 'Update data export'")
    print(f"  git push")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
