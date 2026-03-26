import type { AuthSession, SessionUser, Tenant } from "@/lib/mandi/types";

const TOKEN_KEY = "mandi.token";
const USER_KEY = "mandi.user";
const TENANT_KEY = "mandi.tenant";
const REMEMBER_KEY = "mandi.remember";
const LOGIN_KEY = "mandi.login";

function isBrowser() {
  return typeof window !== "undefined";
}

function getStorage(remember = true) {
  if (!isBrowser()) return null;
  return remember ? window.localStorage : window.sessionStorage;
}

function getStoredRememberPreference() {
  if (!isBrowser()) return true;

  const localValue = window.localStorage.getItem(REMEMBER_KEY);
  if (localValue === "false") return false;
  if (localValue === "true") return true;

  const sessionValue = window.sessionStorage.getItem(REMEMBER_KEY);
  if (sessionValue === "false") return false;

  return true;
}

function readFromAvailableStorage(key: string) {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
}

export const sessionStore = {
  getToken() {
    return readFromAvailableStorage(TOKEN_KEY);
  },
  setToken(token: string, remember = getStoredRememberPreference()) {
    if (!isBrowser()) return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
    getStorage(remember)?.setItem(TOKEN_KEY, token);
  },
  getUser(): SessionUser | null {
    const value = readFromAvailableStorage(USER_KEY);
    if (!value) return null;

    try {
      return JSON.parse(value) as SessionUser;
    } catch {
      return null;
    }
  },
  setUser(user: SessionUser, remember = getStoredRememberPreference()) {
    if (!isBrowser()) return;
    window.localStorage.removeItem(USER_KEY);
    window.sessionStorage.removeItem(USER_KEY);
    getStorage(remember)?.setItem(USER_KEY, JSON.stringify(user));
  },
  getTenant(): Tenant | null {
    const value = readFromAvailableStorage(TENANT_KEY);
    if (!value) return null;

    try {
      return JSON.parse(value) as Tenant;
    } catch {
      return null;
    }
  },
  setTenant(tenant: Tenant | null | undefined, remember = getStoredRememberPreference()) {
    if (!isBrowser()) return;
    if (!tenant) {
      window.localStorage.removeItem(TENANT_KEY);
      window.sessionStorage.removeItem(TENANT_KEY);
      return;
    }
    window.localStorage.removeItem(TENANT_KEY);
    window.sessionStorage.removeItem(TENANT_KEY);
    getStorage(remember)?.setItem(TENANT_KEY, JSON.stringify(tenant));
  },
  getRememberPreference() {
    return getStoredRememberPreference();
  },
  setRememberPreference(remember: boolean) {
    if (!isBrowser()) return;
    window.localStorage.removeItem(REMEMBER_KEY);
    window.sessionStorage.removeItem(REMEMBER_KEY);
    getStorage(remember)?.setItem(REMEMBER_KEY, String(remember));
  },
  getRememberedLogin(): { tenantSlug: string; email: string; password: string } | null {
    const value = readFromAvailableStorage(LOGIN_KEY);
    if (!value) return null;

    try {
      return JSON.parse(value) as { tenantSlug: string; email: string; password: string };
    } catch {
      return null;
    }
  },
  setRememberedLogin(login: { tenantSlug: string; email: string; password: string }, remember = true) {
    if (!isBrowser()) return;
    window.localStorage.removeItem(LOGIN_KEY);
    window.sessionStorage.removeItem(LOGIN_KEY);
    if (remember) {
      window.localStorage.setItem(LOGIN_KEY, JSON.stringify(login));
    }
  },
  clearRememberedLogin() {
    if (!isBrowser()) return;
    window.localStorage.removeItem(LOGIN_KEY);
    window.sessionStorage.removeItem(LOGIN_KEY);
  },
  setSession(session: AuthSession, options?: { remember?: boolean }) {
    const remember = options?.remember ?? getStoredRememberPreference();
    this.setRememberPreference(remember);
    this.setToken(session.token, remember);
    this.setUser(session.user, remember);
    this.setTenant(session.tenant, remember);
  },
  clear() {
    if (!isBrowser()) return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.sessionStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(TENANT_KEY);
    window.sessionStorage.removeItem(TENANT_KEY);
  },
};
