const API_BASE = import.meta.env.VITE_API_URL || "/api";

function getToken() {
  try {
    return localStorage.getItem("bsptcl_auth_token") || "";
  } catch {
    return "";
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  getMe: () => request("/auth/me"),
  getMeta: () => request("/meta"),
  getStats: () => request("/grievances/stats"),
  listGrievances: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "" && v !== "All")
    ).toString();
    return request(`/grievances${qs ? `?${qs}` : ""}`);
  },
  trackGrievance: (query) => request(`/grievances/track/${encodeURIComponent(query)}`),
  createGrievance: (payload) =>
    request("/grievances", { method: "POST", body: JSON.stringify(payload) }),
  updateGrievance: (id, payload) =>
    request(`/grievances/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  escalateByCitizen: (id) =>
    request(`/grievances/${encodeURIComponent(id)}/escalate`, { method: "POST" }),
  submitFeedback: (id, payload) =>
    request(`/grievances/${encodeURIComponent(id)}/feedback`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  autoEscalate: () => request("/grievances/auto-escalate", { method: "POST" })
};
