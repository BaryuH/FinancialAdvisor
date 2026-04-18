import { apiRequest } from "./client";
import type { ApiTransaction } from "./transactions";

export interface DashboardSummaryStats {
  balance_minor: number;
  income_minor: number;
  expense_minor: number;
}

export interface DashboardBudgetSummary {
  total_limit_minor: number;
  total_spent_minor: number;
  usage_percent: number;
  status_text: string;
}

export interface DashboardGoalPreview {
  id: string;
  name: string;
  target_minor: number;
  current_minor: number;
  progress_percent: number;
  icon_key: string;
  deadline: string;
  is_completed: boolean;
}

export interface DashboardExpenseCalendarDay {
  date: string;
  expense_minor: number;
  transaction_count: number;
}

export interface DashboardSelectedDay {
  date: string;
  total_expense_minor: number;
  items: ApiTransaction[];
}

export interface DashboardSummaryResponse {
  month: string;
  selected_date: string;
  summary: DashboardSummaryStats;
  budget_summary: DashboardBudgetSummary;
  goals_preview: DashboardGoalPreview[];
  recent_transactions: ApiTransaction[];
  expense_calendar: {
    days: DashboardExpenseCalendarDay[];
  };
  selected_day: DashboardSelectedDay;
}

export function getDashboardSummary(month: string, selectedDate: string) {
  return apiRequest<DashboardSummaryResponse>("/dashboard/summary", {
    method: "GET",
    params: {
      month,
      selected_date: selectedDate,
    },
  });
}