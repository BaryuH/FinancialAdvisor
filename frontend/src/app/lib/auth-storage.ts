export interface AuthUser {
  id: string;
  email: string;
  display_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoredAuthSession {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  token_type?: string;
  access_token_expires_in?: number;
  refresh_token_expires_in?: number;
}

const STORAGE_KEY = "fainance:auth-session";

export function readStoredAuthSession(): StoredAuthSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuthSession;
  } catch {
    return null;
  }
}

export function saveStoredAuthSession(session: StoredAuthSession): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredAuthSession(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getStoredAccessToken(): string | null {
  return readStoredAuthSession()?.access_token ?? null;
}

export function getStoredRefreshToken(): string | null {
  return readStoredAuthSession()?.refresh_token ?? null;
}

export function updateStoredUser(user: AuthUser): void {
  const existing = readStoredAuthSession();
  if (!existing) return;
  saveStoredAuthSession({
    ...existing,
    user,
  });
}