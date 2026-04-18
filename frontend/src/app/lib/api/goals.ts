import { apiRequest } from "./client";

export interface ApiGoal {
  id: string;
  name: string;
  target_minor: number;
  current_minor: number;
  deadline: string;
  icon_key: string;
  progress_percent: number;
  is_completed: boolean;
  days_remaining: number | null;
  required_monthly_saving_minor: number | null;
}

export interface GoalListResponse {
  items: ApiGoal[];
}

export interface CreateGoalPayload {
  name: string;
  target_minor: number;
  deadline: string;
  icon_key: string;
}

export interface UpdateGoalPayload {
  name?: string;
  target_minor?: number;
  deadline?: string;
  icon_key?: string;
}

export interface GoalTopUpPayload {
  amount_minor: number;
}

export function getGoals() {
  return apiRequest<GoalListResponse>("/goals", {
    method: "GET",
  });
}

export function getGoal(goalId: string) {
  return apiRequest<ApiGoal>(`/goals/${goalId}`, {
    method: "GET",
  });
}

export function createGoal(payload: CreateGoalPayload) {
  return apiRequest<ApiGoal>("/goals", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateGoal(goalId: string, payload: UpdateGoalPayload) {
  return apiRequest<ApiGoal>(`/goals/${goalId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function topUpGoal(goalId: string, payload: GoalTopUpPayload) {
  return apiRequest<ApiGoal>(`/goals/${goalId}/top-ups`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteGoal(goalId: string) {
  return apiRequest<void>(`/goals/${goalId}`, {
    method: "DELETE",
  });
}