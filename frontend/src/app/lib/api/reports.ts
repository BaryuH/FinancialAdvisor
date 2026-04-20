import { apiRequest } from "./client";

export type ReportPeriod = "week" | "month" | "quarter";

export interface ReportsSummary {
  income_minor: number;
  expense_minor: number;
  balance_minor: number;
  savings_ratio_percent: number;
}

export interface ReportsExpenseByCategoryItem {
  category_id: string;
  category_name: string;
  amount_minor: number;
  color_hex: string;
  percentage: number;
}

export interface ReportsIncomeExpensePoint {
  bucket_label: string;
  income_minor: number;
  expense_minor: number;
}

export interface ReportsCashFlowPoint {
  date: string;
  balance_minor: number;
}

export interface ReportsInsights {
  top_expense_category: string | null;
  top_expense_amount_minor: number;
  average_daily_expense_minor: number;
}

export interface ReportsOverviewResponse {
  period: ReportPeriod;
  start_date: string;
  end_date: string;
  summary: ReportsSummary;
  expense_by_category: ReportsExpenseByCategoryItem[];
  income_expense_series: ReportsIncomeExpensePoint[];
  cash_flow_series: ReportsCashFlowPoint[];
  insights: ReportsInsights;
}

export function getReportsOverview(period: ReportPeriod, anchorDate: string) {
  return apiRequest<ReportsOverviewResponse>("/reports/overview", {
    method: "GET",
    params: {
      period,
      anchor_date: anchorDate,
    },
  });
}