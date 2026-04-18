import { apiRequest } from "./client";
import type { ApiCategory } from "./transactions";

export interface ApiBudget {
  id: string;
  month: string;
  limit_minor: number;
  spent_minor: number;
  remaining_minor: number;
  usage_percent: number;
  status: string;
  category: ApiCategory;
}

export interface BudgetListResponse {
  items: ApiBudget[];
}

export interface CreateBudgetPayload {
  category_id: string;
  month: string;
  limit_minor: number;
}

export interface UpdateBudgetPayload {
  category_id?: string;
  month?: string;
  limit_minor?: number;
}

export function getBudgets(month: string) {
  return apiRequest<BudgetListResponse>("/budgets", {
    method: "GET",
    params: { month },
  });
}

export function createBudget(payload: CreateBudgetPayload) {
  return apiRequest<ApiBudget>("/budgets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateBudget(budgetId: string, payload: UpdateBudgetPayload) {
  return apiRequest<ApiBudget>(`/budgets/${budgetId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteBudget(budgetId: string) {
  return apiRequest<void>(`/budgets/${budgetId}`, {
    method: "DELETE",
  });
}