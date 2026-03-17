export interface AdminUserSession {
  token: string;
  tenant_id: string;
  user_id?: string;
  email: string;
  name: string;
  role: string;
}

const TOKEN_KEY = 'rms_token';
const USER_KEY = 'rms_user';

export function setSession(session: AdminUserSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(USER_KEY, JSON.stringify(session));
}

export function getSession(): AdminUserSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUserSession;
  } catch {
    return null;
  }
}

export function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function getAccessToken(): string {
  return getToken();
}

export function getTenantId(): string {
  const s = getSession();
  return s?.tenant_id || '';
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
