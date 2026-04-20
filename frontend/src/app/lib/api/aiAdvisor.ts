const AI_ADVISOR_BASE_URL = "https://wda2026-slackers-financial-analysis.onrender.com";

export interface AIAdvisorRequest {
  message: string;
}

export interface AIAdvisorResponse {
  reply: string;
  investment_analysis: string | null;
  technical_analysis: string | null;
  fundamental_analysis: string | null;
}

export async function sendAdvisorMessage(
  payload: AIAdvisorRequest,
): Promise<AIAdvisorResponse> {
  const response = await fetch(`${AI_ADVISOR_BASE_URL}/chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.detail) {
        errorMessage =
          typeof errorBody.detail === "string"
            ? errorBody.detail
            : JSON.stringify(errorBody.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<AIAdvisorResponse>;
}