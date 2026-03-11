import { useState } from "react";
import {
  LayoutDashboard, Brain, TrendingUp,
  Settings, LogOut, HelpCircle, ChevronLeft, ChevronRight,
  Bell, Shield, FileText,
} from "lucide-react";
import "./Sidebar.css";

const NAV = [
  { id: "dashboard", label: "Dashboard",  icon: LayoutDashboard, badge: null },
  { id: "ai-chat",   label: "AI Chat",    icon: Brain,           badge: "New" },
  { id: "market",    label: "Market",     icon: TrendingUp,      badge: null },
  { id: "reports",   label: "Reports",    icon: FileText,        badge: "3" },
  { id: "security",  label: "Security",   icon: Shield,          badge: null },
];

const BOTTOM = [
  { id: "help",     label: "Help",     icon: HelpCircle },
  { id: "settings", label: "Settings", icon: Settings   },
  { id: "logout",   label: "Sign Out", icon: LogOut     },
];

export default function Sidebar({ activePage, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark">
          <Brain size={15} color="#fff" />
        </div>
        {!collapsed && (
          <div className="logo-text">
            <span className="logo-name">SU Intelligence</span>
            <span className="logo-version">v2.4.1</span>
          </div>
        )}
        <button className="collapse-btn" onClick={() => setCollapsed(c => !c)} title="Toggle sidebar">
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Main Nav */}
      <nav className="sidebar-nav">
        {!collapsed && <div className="nav-section-label">NAVIGATION</div>}
        {NAV.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? "active" : ""}`}
            onClick={() => onNavigate(item.id)}
            title={collapsed ? item.label : undefined}
          >
            <span className="nav-icon"><item.icon size={16} /></span>
            {!collapsed && (
              <>
                <span className="nav-label">{item.label}</span>
                {item.badge && (
                  <span className={`nav-badge ${item.badge === "New" ? "badge-new" : "badge-count"}`}>
                    {item.badge}
                  </span>
                )}
              </>
            )}
            {collapsed && item.badge && <span className="nav-dot" />}
          </button>
        ))}
      </nav>

      {/* User card */}
      {!collapsed && (
        <div className="sidebar-user">
          <div className="user-avatar">SU</div>
          <div className="user-info">
            <span className="user-name">Admin User</span>
            <span className="user-role">Super Admin</span>
          </div>
          <button className="user-bell">
            <Bell size={14} />
            <span className="bell-dot" />
          </button>
        </div>
      )}

      {/* Bottom */}
      <div className="sidebar-bottom">
        {BOTTOM.map(item => (
          <button key={item.id} className="nav-item bottom-item" title={collapsed ? item.label : undefined}>
            <span className="nav-icon"><item.icon size={15} /></span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </button>
        ))}
      </div>
    </aside>
  );
}
