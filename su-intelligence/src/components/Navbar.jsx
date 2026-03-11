import { Search } from "lucide-react";
import "./Navbar.css";

export default function Navbar({ title, subtitle, children }) {
  return (
    <div className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        {subtitle && <div className="topbar-sub">{subtitle}</div>}
      </div>
      <div className="topbar-search">
        <Search size={13} />
        <input placeholder="Search…" />
        <kbd>⌘K</kbd>
      </div>
      <div className="topbar-actions">{children}</div>
      <div className="topbar-status">
        <span className="status-dot" />
        <span>All Systems Operational</span>
      </div>
    </div>
  );
}
