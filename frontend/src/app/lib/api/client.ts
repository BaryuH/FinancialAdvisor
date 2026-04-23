import {
  clearStoredAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  saveStoredAuthSession,
} from "../auth-storage";

const viteEnv = (import.meta as ImportMeta & {
  env?: { VITE_API_BASE_URL?: string };
}).env;

function getApiBaseUrl(): string {
  const fromEnv = viteEnv?.VITE_API_BASE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  // Local dev: Vite on another origin than the API
  if (import.meta.env.DEV) return "http://127.0.0.1:8001/api/v1";
  // Production: same host as the SPA (e.g. FastAPI serves frontend + API — no VITE_* needed)
  if (typeof window !== "undefined") return `${window.location.origin}/api/v1`;
  return "http://127.0.0.1:8000/api/v1";
}

const API_BASE_URL = getApiBaseUrl();

type RequestOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
  retryOnUnauthorized?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

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

function dispatchAuthCleared() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:session-cleared"));
  }
}

function canAttemptRefresh(path: string, options: RequestOptions) {
  if (options.skipAuth) return false;
  if (options.retryOnUnauthorized === false) return false;
  if (path === "/auth/login") return false;
  if (path === "/auth/register") return false;
  if (path === "/auth/refresh") return false;
  return true;
}

async function doFetch(
  path: string,
  options: RequestOptions,
  accessTokenOverride?: string | null,
): Promise<Response> {
  const { params, headers, skipAuth, ...rest } = options;

  const accessToken = skipAuth ? null : (accessTokenOverride ?? getStoredAccessToken());

  return fetch(buildUrl(path, params), {
    ...rest,
    headers: {
      ...(rest.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });
}

async function attemptRefresh(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    clearStoredAuthSession();
    dispatchAuthCleared();
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(buildUrl("/auth/refresh"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        clearStoredAuthSession();
        dispatchAuthCleared();
        return null;
      }

      const data = await response.json();
      saveStoredAuthSession(data);
      return data.access_token as string;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await doFetch(path, options);

  if (response.status === 401 && canAttemptRefresh(path, options)) {
    const refreshedAccessToken = await attemptRefresh();
    if (refreshedAccessToken) {
      response = await doFetch(path, options, refreshedAccessToken);
    }
  }

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}