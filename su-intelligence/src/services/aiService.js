import { api } from "./authService";

export async function fetchModels() {
  return api.get("/ai/models");
}

export async function fetchSessions() {
  return api.get("/ai/sessions");
}

export async function fetchSession(sessionId) {
  return api.get(`/ai/sessions/${sessionId}`);
}

export async function deleteSession(sessionId) {
  const { authService } = await import("./authService");
  const BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";
  const token = authService.getToken();
  const res = await fetch(`${BASE}/ai/sessions/${sessionId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Delete failed");
  return json.data ?? json;
}

export async function sendMessage(sessionId, modelId, message) {
  return api.post("/ai/chat", {
    session_id: sessionId || "",
    model_id:   modelId,
    message,
  });
}

export function getModelStats() {
  return api.get("/ai/stats");
}
