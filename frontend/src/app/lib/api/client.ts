const viteEnv = (import.meta as ImportMeta & {
  env?: { VITE_API_BASE_URL?: string };
}).env;

const API_BASE_URL =
  viteEnv?.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000/api/v1";

type RequestOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined | null>;
};

function buildUrl(path: string, params?: RequestOptions["params"]) {
  const url = new URL(`${API_BASE_URL}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

async function parseError(response: Response) {
  try {
    const data = await response.json();
    if (data?.detail) return String(data.detail);
    return JSON.stringify(data);
  } catch {
    return `HTTP ${response.status}`;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...rest } = options;

  const response = await fetch(buildUrl(path, params), {
    ...rest,
    headers: {
      ...(rest.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}