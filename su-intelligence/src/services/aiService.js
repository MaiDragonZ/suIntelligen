const MODELS = [
  { id: "su-text-ultra",  name: "SU Text Ultra",  type: "Language",   rps: 8820,  latency: 34, health: 100, uptime: "99.99%" },
  { id: "su-vision-pro",  name: "SU Vision Pro",  type: "Multimodal", rps: 4210,  latency: 72, health: 97,  uptime: "99.94%" },
  { id: "su-embed-fast",  name: "SU Embed Fast",  type: "Embedding",  rps: 22000, latency: 8,  health: 100, uptime: "100%" },
  { id: "su-code-assist", name: "SU Code Assist", type: "Code",       rps: 1640,  latency: 55, health: 88,  uptime: "99.71%" },
];

export async function fetchModels() {
  await delay(300);
  return MODELS;
}

export async function sendMessage(modelId, message) {
  await delay(800 + Math.random() * 600);
  return {
    id: Date.now(),
    role: "assistant",
    model: modelId,
    content: `[SU Intelligence — ${modelId}]\n\nThank you for your message: "${message}"\n\nThis is a simulated response from the SU Intelligence platform. In production, this would connect to the real model inference endpoint.`,
    tokens: Math.floor(Math.random() * 200 + 50),
    latency: Math.floor(Math.random() * 200 + 80),
  };
}

export function getModelStats() {
  return {
    totalRequests: 1_432_881,
    avgLatency: 38,
    activeModels: 4,
    errorRate: 0.02,
  };
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
