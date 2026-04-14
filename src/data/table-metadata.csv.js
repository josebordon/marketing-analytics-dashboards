import {csvFormat} from "d3-dsv";

const schemas = [
  {name: "live_pay_dm", tables: ["rpt_key_metrics", "rpt_user_retention_metrics", "rpt_monthly_mtu_status", "fact_live_pay_spend_transactions", "rpt_spend_metrics", "rpt_credit_builder_metrics", "dim_live_pay_user", "fact_live_pay_activation", "fact_live_pay_funding", "fact_live_pay_card_transaction", "agg_live_pay_daily", "rpt_live_pay_cohort", "dim_live_pay_merchant_category", "fact_live_pay_reward", "rpt_live_pay_weekly", "dim_live_pay_plan"]},
  {name: "early_pay_dm", tables: ["fact_direct_deposit_details", "fact_user_features_daily", "dim_early_pay_config"]},
  {name: "customer_dm", tables: ["dim_user_snapshot", "dim_user_history_daily", "dim_user_history_monthly", "fact_user_lifetime_value_daily", "fact_user_lifetime_value_aggregated", "dim_user_location", "rpt_users_location_state", "fact_user_max_limit_daily", "fact_user_paycycle_utilization", "dim_user_segment", "dim_user_device", "fact_user_activity_daily", "fact_user_registration", "dim_user_cohort", "fact_user_churn_daily", "rpt_user_funnel", "dim_user_employment", "fact_user_session_daily", "rpt_user_growth", "dim_user_notification_pref", "fact_user_referral", "rpt_user_retention_cohort", "dim_user_kyc", "fact_user_app_rating", "dim_user_communication", "rpt_user_engagement_score", "fact_user_bank_link", "dim_user_risk_tier", "rpt_user_ltv_cohort", "fact_user_product_adoption", "dim_user_subscription", "rpt_customer_health", "fact_user_onboarding", "dim_user_geography", "rpt_user_demographics", "fact_user_milestone"]},
  {name: "bank_dm", tables: ["fact_user_bank_connection_daily", "fact_user_bank_connection_monthly", "agg_user_bank_balance_daily", "agg_user_active_bank_balance_daily", "fact_user_bank_transaction", "agg_user_bank_transaction_daily", "dim_bank_institution", "fact_bank_link_event", "rpt_bank_connection_health", "dim_bank_account_type", "fact_bank_verification", "rpt_bank_provider_comparison", "fact_bank_error_log", "agg_bank_balance_weekly", "rpt_bank_migration_v2", "dim_bank_routing", "fact_bank_oauth_event", "rpt_bank_coverage", "dim_bank_feature_flag", "fact_bank_reconnection", "rpt_bank_sla", "agg_bank_health_score"]},
  {name: "chatbot_dm", tables: ["fact_chatbot_conversation", "fact_chatbot_message", "dim_chatbot_intent", "rpt_chatbot_deflection", "fact_chatbot_resolution", "rpt_chatbot_daily_volume", "dim_chatbot_flow", "fact_chatbot_escalation", "rpt_chatbot_csat", "agg_chatbot_intent_daily"]},
  {name: "credit_monitoring_dm", tables: ["fact_credit_alert", "fact_credit_score_change", "dim_credit_bureau", "rpt_credit_health", "fact_credit_enrollment", "rpt_credit_score_distribution", "fact_credit_dispute", "dim_credit_factor"]},
  {name: "customer_care_dm", tables: Array.from({length: 78}, (_, i) => ["fact_user_cx_tickets_cost", "fact_backoffice_task", "dim_cx_agent", "dim_cx_category", "fact_cx_ticket", "rpt_cx_sla", "fact_cx_csat_survey", "rpt_cx_volume_daily", "dim_cx_queue", "fact_cx_first_contact", "rpt_cx_agent_performance", "fact_cx_escalation", "dim_cx_topic", "rpt_cx_backlog", "fact_cx_chat_session"][i % 15] + (i >= 15 ? `_v${Math.floor(i/15)+1}` : ""))},
  {name: "finance_dm", tables: ["fact_transactions_all", "fact_transactions_on_demand_pay", "fact_transactions_subscription", "fact_transactions_chargeback", "agg_user_product_monthly_metrics", "agg_user_product_daily_metrics", "agg_daily_accounting_balance_book", "agg_daily_accounting_bank_reconciliation", "rpt_live_pay_fpa_metrics", "rpt_early_pay_fpa_metrics", "rpt_on_demand_pay_fpa_metrics", "rpt_tys_fpa_metrics", "fact_gl_entry", "dim_gl_account", "rpt_revenue_daily", "fact_reserve_balance", "rpt_unit_economics", "fact_payment_settlement", "dim_payment_method", "rpt_arpu_cohort", "fact_refund", "rpt_cash_flow", "dim_cost_center", "fact_write_off", "rpt_margin_analysis", "fact_fee_collection", "dim_product_config", "rpt_financial_summary", "fact_interchange_revenue", "rpt_subscriber_metrics", "fact_tip_revenue", "dim_subscription_plan", "rpt_monthly_close", "fact_funding_event", "rpt_balance_sheet_item", "dim_entity", "fact_accrual", "rpt_variance_analysis", "fact_journal_entry", "dim_fiscal_calendar", "rpt_budget_vs_actual", "fact_bank_transfer", "rpt_cost_allocation", "dim_vendor", "fact_commission", "rpt_profitability", "fact_tax_withholding", "dim_regulatory_requirement", "rpt_audit_trail", "fact_intercompany_transfer", "rpt_forecast_input", "fact_deferred_revenue", "rpt_kpi_scorecard", "fact_bad_debt"]},
  {name: "lcm_dm", tables: ["fact_lcm_event", "dim_lcm_stage", "rpt_lcm_funnel", "fact_lcm_transition", "rpt_lcm_cohort_retention", "dim_lcm_segment", "fact_lcm_reactivation", "rpt_lcm_churn_analysis", "fact_lcm_activation", "rpt_lcm_onboarding", "dim_lcm_touchpoint", "fact_lcm_engagement", "rpt_lcm_daily", "fact_lcm_dormancy", "rpt_lcm_attribution"]},
  {name: "marketing_dm", tables: ["rpt_marketing_performance_daily", "fact_marketing_spend", "dim_marketing_channel", "fact_marketing_attribution", "rpt_marketing_roi", "dim_campaign", "fact_impression", "rpt_channel_efficiency", "fact_conversion_event", "rpt_cac_cohort", "dim_creative", "rpt_marketing_forecast"]},
  {name: "experiment_dm", tables: ["fact_experiment_assignment", "fact_experiment_exposure", "dim_experiment", "rpt_experiment_results", "fact_experiment_metric"]},
  {name: "marketplace_dm", tables: ["fact_offer_impression", "fact_offer_click", "dim_partner", "dim_offer", "rpt_marketplace_funnel", "fact_offer_redemption", "rpt_partner_performance", "agg_marketplace_daily", "dim_offer_category", "fact_marketplace_revenue", "rpt_marketplace_growth", "dim_marketplace_placement", "fact_offer_suppression", "rpt_offer_roi", "agg_partner_weekly"]},
  {name: "earnings_dm", tables: ["fact_earnings_accrual", "fact_earnings_balance", "dim_earnings_source", "rpt_earnings_daily", "fact_earnings_realization", "rpt_earnings_cohort", "agg_earnings_weekly", "dim_earnings_type", "fact_earnings_grant", "rpt_earnings_utilization", "fact_earnings_expiry", "rpt_earnings_trend"]},
  {name: "cashout_link_dm", tables: ["fact_cashout_link_attempt", "dim_cashout_provider", "rpt_cashout_funnel", "fact_cashout_success", "rpt_cashout_daily", "dim_cashout_method", "fact_cashout_failure", "rpt_cashout_provider_health"]},
  {name: "payroll_dm", tables: ["fact_payroll_schedule", "dim_employer", "rpt_payroll_coverage", "fact_payroll_deduction", "fact_payroll_remittance", "dim_payroll_provider", "rpt_payroll_health", "fact_payroll_event"]},
  {name: "ae_monitoring", tables: ["daily_pipeline_metrics", "genie_metrics_daily", "databricks_cost_daily", "table_metadata_metrics", "alert_history", "schema_change_log"]},
];

const rows = [];
for (const schema of schemas) {
  for (const table of schema.tables) {
    const hasDesc = Math.random() < 0.82;
    const hasPk = Math.random() < 0.75;
    const totalCols = 5 + Math.floor(Math.random() * 40);
    const docCols = hasDesc ? Math.round(totalCols * (0.6 + Math.random() * 0.4)) : Math.round(totalCols * Math.random() * 0.3);
    rows.push({
      schema_name: schema.name,
      table_name: table,
      has_description: hasDesc,
      has_primary_key: hasPk,
      total_columns: totalCols,
      documented_columns: Math.min(docCols, totalCols),
    });
  }
}

process.stdout.write(csvFormat(rows));
