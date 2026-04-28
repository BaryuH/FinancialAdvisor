import { apiRequest } from "./client";

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  flow_type: "income" | "expense";
  icon_key: string | null;
  color_hex: string | null;
  is_active: boolean;
  is_system: boolean;
}

export interface CategoryListResponse {
  items: CategoryResponse[];
}

/**
 * List all accessible categories for the current user
 */
export async function listCategories(): Promise<CategoryListResponse> {
  return apiRequest<CategoryListResponse>("/categories", {
    method: "GET",
  });
}
