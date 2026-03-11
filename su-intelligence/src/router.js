import Dashboard from "./pages/Dashboard/Dashboard";
import AIChat    from "./pages/AIChat/AIChat";
import Market    from "./pages/Market/Market";

export const ROUTES = [
  { path: "/",        page: "dashboard",    label: "Dashboard",    component: Dashboard },
  { path: "/ai-chat", page: "ai-chat",      label: "AI Chat",      component: AIChat    },
  { path: "/market",  page: "market",       label: "Market",       component: Market    },
];

export default ROUTES;
