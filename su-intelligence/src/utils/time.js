export function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)     return "just now";
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" });
}

export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" });
}

export function now() { return new Date().toISOString(); }
