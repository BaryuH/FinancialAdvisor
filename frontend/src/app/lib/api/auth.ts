import { apiRequest } from "./client";
import type { AuthUser, StoredAuthSession } from "../auth-storage";

export type AuthSessionResponse = StoredAuthSession;

export interface RegisterPayload {
  email: string;
  password: string;
  display_name?: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RefreshPayload {
  refresh_token: string;
}

export interface LogoutResponse {
  detail: string;
}

export function register(payload: RegisterPayload) {
  return apiRequest<AuthSessionResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
    retryOnUnauthorized: false,
  });
}

export function login(payload: LoginPayload) {
  return apiRequest<AuthSessionResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
    retryOnUnauthorized: false,
  });
}

export function refresh(payload: RefreshPayload) {
  return apiRequest<AuthSessionResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
    retryOnUnauthorized: false,
  });
}

export function getMe() {
  return apiRequest<AuthUser>("/auth/me", {
    method: "GET",
  });
}

export function logout() {
  return apiRequest<LogoutResponse>("/auth/logout", {
    method: "POST",
  });
}