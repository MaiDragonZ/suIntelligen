const ASSETS = [
  { symbol: "BTC",  name: "Bitcoin",  price: 67420.50, change: 2.34,  volume: "28.4B", cap: "1.32T" },
  { symbol: "ETH",  name: "Ethereum", price: 3521.80,  change: 1.87,  volume: "14.1B", cap: "423B" },
  { symbol: "SOL",  name: "Solana",   price: 182.40,   change: -0.94, volume: "3.2B",  cap: "81B" },
  { symbol: "AAPL", name: "Apple",    price: 213.32,   change: 0.54,  volume: "4.1B",  cap: "3.3T" },
  { symbol: "NVDA", name: "NVIDIA",   price: 875.40,   change: 3.21,  volume: "19.7B", cap: "2.15T" },
  { symbol: "TSLA", name: "Tesla",    price: 248.50,   change: -1.42, volume: "11.3B", cap: "793B" },
];

export async function fetchAssets() {
  await delay(400);
  // Simulate live price jitter
  return ASSETS.map(a => ({
    ...a,
    price: +(a.price * (1 + (Math.random() - 0.5) * 0.002)).toFixed(2),
  }));
}

export function generateChartData(points = 24) {
  let v = 100;
  return Array.from({ length: points }, (_, i) => {
    v = v + (Math.random() - 0.48) * 4;
    return { t: i, value: Math.max(60, +v.toFixed(2)) };
  });
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
