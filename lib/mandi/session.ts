import type { AuthSession, SessionUser, Tenant } from "@/lib/mandi/types";

const TOKEN_KEY = "mandi.token";
const USER_KEY = "mandi.user";
const TENANT_KEY = "mandi.tenant";

function isBrowser() {
  return typeof window !== "undefined";
}

export const sessionStore = {
  getToken() {
    if (!isBrowser()) return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    if (!isBrowser()) return;
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  getUser(): SessionUser | null {
    if (!isBrowser()) return null;
    const value = window.localStorage.getItem(USER_KEY);
    if (!value) return null;

    try {
      return JSON.parse(value) as SessionUser;
    } catch {
      return null;
    }
  },
  setUser(user: SessionUser) {
    if (!isBrowser()) return;
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  getTenant(): Tenant | null {
    if (!isBrowser()) return null;
    const value = window.localStorage.getItem(TENANT_KEY);
    if (!value) return null;

    try {
      return JSON.parse(value) as Tenant;
    } catch {
      return null;
    }
  },
  setTenant(tenant: Tenant | null | undefined) {
    if (!isBrowser()) return;
    if (!tenant) {
      window.localStorage.removeItem(TENANT_KEY);
      return;
    }
    window.localStorage.setItem(TENANT_KEY, JSON.stringify(tenant));
  },
  setSession(session: AuthSession) {
    this.setToken(session.token);
    this.setUser(session.user);
    this.setTenant(session.tenant);
  },
  clear() {
    if (!isBrowser()) return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.localStorage.removeItem(TENANT_KEY);
  },
};
