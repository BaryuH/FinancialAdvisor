import { apiRequest } from "./client";
import { TransactionResponse } from "./transactions";
import { CategoryResponse } from "./categories";

export type SmartInputMode = "voice" | "ocr";
export type SmartInputStatus = "processing" | "draft" | "confirmed" | "failed" | "discarded";

export interface SmartInputDraftResponse {
  id: string;
  mode: SmartInputMode;
  status: SmartInputStatus;
  raw_text: string | null;
  source_file_ref: string | null;
  parsed_type: "income" | "expense" | null;
  parsed_amount_minor: number | null;
  parsed_description: string | null;
  merchant_name: string | null;
  confidence_percent: number | null;
  parser_payload: any | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  suggested_category: CategoryResponse | null;
}

export interface SmartInputDraftUpdate {
  parsed_type?: "income" | "expense";
  parsed_amount_minor?: number;
  parsed_description?: string;
  suggested_category_id?: string;
  merchant_name?: string;
}

export interface SmartInputConfirmRequest {
  transaction_date?: string; // ISO date string YYYY-MM-DD
}

export interface SmartInputConfirmResponse {
  draft_id: string;
  status: SmartInputStatus;
  transaction: TransactionResponse;
}

/**
 * Create a smart-input draft from an audio file (ASR)
 */
export async function createVoiceDraft(file: File): Promise<SmartInputDraftResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<SmartInputDraftResponse>("/smart-input/drafts/voice", {
    method: "POST",
    body: formData,
  });
}

/**
 * Create a smart-input draft from an image file (OCR)
 */
export async function createOcrDraft(file: File, hintText?: string): Promise<SmartInputDraftResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (hintText) {
    formData.append("hint_text", hintText);
  }

  return apiRequest<SmartInputDraftResponse>("/smart-input/drafts/ocr", {
    method: "POST",
    body: formData,
  });
}

/**
 * Get a specific smart-input draft by ID
 */
export async function getSmartInputDraft(draftId: string): Promise<SmartInputDraftResponse> {
  return apiRequest<SmartInputDraftResponse>(`/smart-input/drafts/${draftId}`, {
    method: "GET",
  });
}

/**
 * Update a smart-input draft (e.g., user corrects the amount or category)
 */
export async function updateSmartInputDraft(
  draftId: string,
  payload: SmartInputDraftUpdate
): Promise<SmartInputDraftResponse> {
  return apiRequest<SmartInputDraftResponse>(`/smart-input/drafts/${draftId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * Confirm a draft and turn it into a real transaction
 */
export async function confirmSmartInputDraft(
  draftId: string,
  payload: SmartInputConfirmRequest = {}
): Promise<SmartInputConfirmResponse> {
  return apiRequest<SmartInputConfirmResponse>(`/smart-input/drafts/${draftId}/confirm`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
