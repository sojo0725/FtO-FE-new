// Railway backend. Override with VITE_API_URL for local development.
const API_URL = (import.meta.env.VITE_API_URL ?? "https://fto-be-production.up.railway.app").replace(/\/$/, "");
const TOKEN_KEY = "hospital-staff-app-token";

// Fired when the backend refuses the stored token, so the app can log out.
export const AUTH_EXPIRED_EVENT = "auth:expired";

export const tokenStore = {
  get: () => window.localStorage.getItem(TOKEN_KEY),
  set: (token: string) => window.localStorage.setItem(TOKEN_KEY, token),
  clear: () => window.localStorage.removeItem(TOKEN_KEY),
};

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${tokenStore.get() ?? ""}` },
  });
  if (response.status === 401 || response.status === 403) {
    tokenStore.clear();
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
  if (!response.ok) throw new Error(`GET ${path} failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export async function apiPost(path: string, body: unknown): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
