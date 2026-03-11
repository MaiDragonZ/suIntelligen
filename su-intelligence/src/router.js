import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard/Dashboard";
import AIChat from "./pages/AIChat/AIChat";
import Market from "./pages/Market/Market";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ai" element={<AIChat />} />
        <Route path="/market" element={<Market />} />
      </Routes>
    </BrowserRouter>
  );
}
