import { api } from "./authService";

export async function fetchAssets() {
  return api.get("/market/assets");
}

export async function fetchAsset(symbol) {
  return api.get(`/market/assets/${symbol}`);
}

export async function fetchChart(symbol) {
  return api.get(`/market/assets/${symbol}/chart`);
}

export async function fetchSummary() {
  return api.get("/market/summary");
}