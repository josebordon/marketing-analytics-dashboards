import {csvFormat} from "d3-dsv";

const allJobs = [
  {name: "Finance DM", category: "DM", avgCost: 138},
  {name: "Earnings DM ETL", category: "DM", avgCost: 39},
  {name: "Bank DM ETL", category: "DM", avgCost: 32},
  {name: "Customer DM (max)", category: "DM", avgCost: 17},
  {name: "Customer DM ETL", category: "DM", avgCost: 13},
  {name: "Payroll DM ETL", category: "DM", avgCost: 7},
  {name: "Marketplace DM ETL", category: "DM", avgCost: 3},
  {name: "Marketing DM ETL", category: "DM", avgCost: 3},
  {name: "LCM DM ETL", category: "DM", avgCost: 2},
  {name: "Finance DM (longrun)", category: "DM", avgCost: 1.5},
  {name: "Chatbot DM ETL", category: "DM", avgCost: 1},
  {name: "Credit Monitoring DM", category: "DM", avgCost: 1},
  {name: "Experiment DM ETL", category: "DM", avgCost: 1},
  {name: "Early Pay DM ETL", category: "DM", avgCost: 1},
  {name: "Live Pay DM ETL", category: "DM", avgCost: 1},
  {name: "MBR Pipeline", category: "DM", avgCost: 1},
  {name: "marketing_analysis_low_latency", category: "Non-DM", avgCost: 77},
  {name: "analysis_derived_tables_core", category: "Non-DM", avgCost: 46},
  {name: "Identity_analysis_silver_to_gold", category: "Non-DM", avgCost: 45},
  {name: "fact_user_earnings_daily", category: "Non-DM", avgCost: 44},
  {name: "ledger_analysis_high_freq", category: "Non-DM", avgCost: 39},
  {name: "segment_mtu_tracking", category: "Non-DM", avgCost: 34},
  {name: "marketplace_analysis (Redshift)", category: "Non-DM", avgCost: 29},
  {name: "finance_analysis", category: "Non-DM", avgCost: 28},
  {name: "Bank DM ETL: Backfill", category: "Non-DM", avgCost: 27},
  {name: "rehoboam_activation_rate (Archive)", category: "Non-DM", avgCost: 27},
  {name: "marketplace_segmentation_funnel_mv", category: "MV", avgCost: 109},
  {name: "earnings_signal_grants_paycycle", category: "MV", avgCost: 35},
  {name: "actual_ltv_crawl_datamart_mv", category: "MV", avgCost: 14},
  {name: "marketplace_discovery_segmentation_mv", category: "MV", avgCost: 13},
  {name: "actual_ltv_crawl_mv", category: "MV", avgCost: 12},
  {name: "earlypay_key_metrics", category: "MV", avgCost: 11},
  {name: "secured_account_ledger_rollforward", category: "MV", avgCost: 11},
  {name: "va_ledger_dd_activation_rollforward_mv", category: "MV", avgCost: 9},
  {name: "customer_datamart_cashout_mv", category: "MV", avgCost: 8},
  {name: "cash_mgmt_open_loop_dd_cashflow_mv", category: "MV", avgCost: 6},
  {name: "LCM Genie Room", category: "Genie", avgCost: 50},
  {name: "Live Pay Genie Room", category: "Genie", avgCost: 25},
  {name: "Customer Genie Room", category: "Genie", avgCost: 20},
  {name: "Other Genie Rooms", category: "Genie", avgCost: 29},
];

const rows = [];
const today = new Date();
for (const job of allJobs) {
  for (let d = 89; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    rows.push({
      date: date.toISOString().slice(0, 10),
      job_name: job.name,
      category: job.category,
      cost_dollars: +(job.avgCost * (0.8 + Math.random() * 0.4)).toFixed(2),
    });
  }
}

process.stdout.write(csvFormat(rows));
