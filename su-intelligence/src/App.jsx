import { useState, useEffect } from "react";
import Sidebar   from "./components/Sidebar";
import Dashboard from "./pages/Dashboard/Dashboard";
import AIChat    from "./pages/AIChat/AIChat";
import Market    from "./pages/Market/Market";
import Login     from "./pages/Login/Login";
import { authService } from "./services/authService";
import "./App.css";

const PAGES = { dashboard: Dashboard, "ai-chat": AIChat, market: Market };

export default function App() {
  const [user, setUser]   = useState(null);
  const [page, setPage]   = useState("dashboard");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = authService.getStoredUser();
    if (stored && authService.isLoggedIn()) setUser(stored);
    setReady(true);
  }, []);

  const handleLogin  = ({ user: u }) => setUser(u);
  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setPage("dashboard");
  };

  if (!ready) return null;
  if (!user)  return <Login onLogin={handleLogin} />;

  const PageComponent = PAGES[page] ?? Dashboard;

  return (
    <div className="app-shell">
      <Sidebar activePage={page} onNavigate={setPage} user={user} onLogout={handleLogout} />
      <main className="app-main">
        <PageComponent onNavigate={setPage} user={user} />
      </main>
    </div>
  );
}
