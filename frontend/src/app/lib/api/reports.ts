import { apiRequest } from "./client";

export type ReportPeriod = "week" | "month" | "quarter";

export interface ReportsSummary {
  income_minor: number;
  expense_minor: number;
  net_minor: number;
  savings_rate_percent: number;
}

export interface ReportsExpenseByCategoryItem {
  category_id: string;
  category_name: string;
  amount_minor: number;
  percent: number;
}

export interface ReportsIncomeExpensePoint {
  label: string;
  income_minor: number;
  expense_minor: number;
}

export interface ReportsCashFlowPoint {
  label: string;
  net_minor: number;
}

export interface ReportsOverviewResponse {
  period: ReportPeriod;
  anchor_date: string;
  summary: ReportsSummary;
  expense_by_category: ReportsExpenseByCategoryItem[];
  income_expense_series: ReportsIncomeExpensePoint[];
  cash_flow_series: ReportsCashFlowPoint[];
  insights: string[];
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