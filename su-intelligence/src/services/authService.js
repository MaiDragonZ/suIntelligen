const BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";

async function request(path, options = {}) {
  const token = localStorage.getItem("su_token");
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || json.message || "Request failed");
  return json.data ?? json;
}

export const authService = {
  async login(email, password) {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("su_token", data.token);
    localStorage.setItem("su_user",  JSON.stringify(data.user));
    return data;
  },

  async logout() {
    try { await request("/auth/logout", { method: "POST" }); } catch (_) {}
    localStorage.removeItem("su_token");
    localStorage.removeItem("su_user");
  },

  async me() {
    return request("/auth/me");
  },

  async refreshToken() {
    const data = await request("/auth/refresh", { method: "POST" });
    localStorage.setItem("su_token", data.token);
    return data;
  },

  getStoredUser() {
    try { return JSON.parse(localStorage.getItem("su_user") || "null"); } catch { return null; }
  },

  getToken() {
    return localStorage.getItem("su_token");
  },

  isLoggedIn() {
    return !!this.getToken();
  },
};

// Generic API helpers (reused by other services)
export const api = { get: (p) => request(p), post: (p, b) => request(p, { method:"POST", body:JSON.stringify(b) }) };