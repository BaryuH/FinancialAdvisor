import { apiRequest } from "./client";

export type FlowType = "income" | "expense";

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  flow_type: FlowType;
  icon_key: string;
  color_hex: string;
  sort_order: number;
  is_system: boolean;
  is_active: boolean;
}

export interface ApiTransaction {
  id: string;
  type: FlowType;
  amount_minor: number;
  currency_code: string;
  description: string;
  transaction_date: string;
  source: "manual" | "voice" | "ocr";
  created_at: string;
  updated_at: string;
  category: ApiCategory;
}

export interface TransactionListResponse {
  items: ApiTransaction[];
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
}

export type GetTransactionsParams = Record<
  string,
  string | number | boolean | undefined | null
> & {
  type?: FlowType;
  q?: string;
  category_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
};

export interface CreateTransactionPayload {
  type: FlowType;
  category_id: string;
  amount_minor: number;
  description: string;
  transaction_date: string;
  source?: "manual";
}

export interface UpdateTransactionPayload {
  type?: FlowType;
  category_id?: string;
  amount_minor?: number;
  description?: string;
  transaction_date?: string;
  source?: "manual";
}

export function getTransactions(params: GetTransactionsParams = {}) {
  return apiRequest<TransactionListResponse>("/transactions", {
    method: "GET",
    params,
  });
}

export function createTransaction(payload: CreateTransactionPayload) {
  return apiRequest<ApiTransaction>("/transactions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTransaction(transactionId: string, payload: UpdateTransactionPayload) {
  return apiRequest<ApiTransaction>(`/transactions/${transactionId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteTransaction(transactionId: string) {
  return apiRequest<void>(`/transactions/${transactionId}`, {
    method: "DELETE",
  });
}

export function getCategories(flowType?: FlowType) {
  return apiRequest<{ items: ApiCategory[] }>("/categories", {
    method: "GET",
    params: {
      flow_type: flowType,
      active_only: true,
    },
  });
}