import { useState } from "react";
import Sidebar   from "./components/Sidebar";
import Dashboard from "./pages/Dashboard/Dashboard";
import AIChat    from "./pages/AIChat/AIChat";
import Market    from "./pages/Market/Market";
import "./App.css";

const PAGES = { dashboard: Dashboard, "ai-chat": AIChat, market: Market };

export default function App() {
  const [page, setPage] = useState("dashboard");
  const PageComponent = PAGES[page] ?? Dashboard;

  return (
    <div className="app-shell">
      <Sidebar activePage={page} onNavigate={setPage} />
      <main className="app-main">
        <PageComponent onNavigate={setPage} />
      </main>
    </div>
  );
}
