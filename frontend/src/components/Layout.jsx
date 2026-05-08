import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../api/client";
import { ProgressBar } from "./UI";

const NAV = [
  { to: "/dashboard",   icon: "⊞", label: "Dashboard"    },
  { to: "/profile",     icon: "◎", label: "Profile"      },
  { to: "/gap",         icon: "◈", label: "Skill Gap"    },
  { to: "/roadmap",     icon: "⟶", label: "Roadmap"      },
  { to: "/chat",        icon: "◆", label: "AI Advisor",  badge: "AI" },
  { to: "/jd",          icon: "⊙", label: "JD Parser"    },
  { to: "/internships", icon: "◉", label: "Internships"  },
  { to: "/projects",    icon: "⬡", label: "Projects"     },
  { to: "/interview",   icon: "◐", label: "Interview"    },
  { to: "/verify",      icon: "◎", label: "Verify Skills"},
];

const ADMIN_NAV = [
  { to: "/admin",             icon: "⊛", label: "Admin Panel"    },
  { to: "/admin/users",       icon: "◈", label: "Users"          },
  { to: "/admin/roles",       icon: "⬡", label: "Roles & Skills" },
  { to: "/admin/analytics",   icon: "◉", label: "Analytics"      },
  { to: "/admin/notifications",icon:"◆", label: "Notifications"  },
];

function SidebarContent({ onNavClick, isAdmin }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    api.notifications.list().then(d => {
      setNotifCount((d || []).filter(n => !n.read).length);
    }).catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <>
      {/* Logo */}
      <div style={{ padding: "18px 14px 12px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,#38bdf8,#4ade80)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#020810" }}>S</div>
          <div>
            <div style={{ fontFamily: "Syne,sans-serif", fontSize: ".92rem", fontWeight: 800 }}>SkillPath</div>
            <div style={{ fontSize: ".55rem", color: "var(--t3)", fontFamily: "'DM Mono',monospace", letterSpacing: ".08em" }}>AI PLATFORM</div>
          </div>
        </div>
      </div>

      {/* User */}
      {user && (
        <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--cdim)", border: "1px solid var(--b2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--cyan)", flexShrink: 0 }}>
              {(user.name || "U").charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: ".82rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
              <div style={{ fontSize: ".62rem", color: "var(--t3)", fontFamily: "'DM Mono',monospace" }}>
                {user.readiness_score || 0}% ready {isAdmin && "· Admin"}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 7 }}>
            <ProgressBar value={user.readiness_score || 0} height={3} />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 8px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} onClick={onNavClick}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <span style={{ fontSize: 13, width: 16, textAlign: "center" }}>{n.icon}</span>
            <span style={{ flex: 1 }}>{n.label}</span>
            {n.badge && <span style={{ fontSize: ".55rem", background: "var(--cyan)", color: "#020810", padding: "2px 5px", borderRadius: 99, fontWeight: 700 }}>{n.badge}</span>}
            {n.to === "/notifications" && notifCount > 0 && <span style={{ fontSize: ".55rem", background: "var(--red)", color: "#fff", padding: "1px 5px", borderRadius: 99, fontWeight: 700 }}>{notifCount}</span>}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div style={{ padding: "10px 10px 4px", fontSize: ".6rem", color: "var(--t3)", fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: ".08em" }}>Admin</div>
            {ADMIN_NAV.map(n => (
              <NavLink key={n.to} to={n.to} onClick={onNavClick}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                <span style={{ fontSize: 13, width: 16, textAlign: "center" }}>{n.icon}</span>
                <span>{n.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div style={{ padding: "8px 8px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        {/* Theme toggle */}
        <button className="theme-toggle" onClick={toggleTheme} style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 14 }}>{isDark ? "☀️" : "🌙"}</span>
          <span style={{ flex: 1 }}>{isDark ? "Light Mode" : "Dark Mode"}</span>
          <div className="theme-toggle-track">
            <div className="theme-toggle-thumb" />
          </div>
        </button>

        <button className="nav-item" onClick={handleLogout} style={{ width: "100%", borderRadius: 9 }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.background = "var(--rdim)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = ""; e.currentTarget.style.background = ""; }}>
          <span style={{ fontSize: 13 }}>⊗</span> Sign Out
        </button>
        <div style={{ fontSize: ".6rem", color: "var(--t3)", fontFamily: "'DM Mono',monospace", padding: "5px 10px", opacity: .5 }}>
          SkillPath AI v2.0
        </div>
      </div>
    </>
  );
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAdmin } = useAuth();

  return (
    <div className="app-layout bg-grid">
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      {/* Desktop sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <SidebarContent onNavClick={() => setSidebarOpen(false)} isAdmin={isAdmin} />
      </aside>

      {/* Mobile overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* Main */}
      <div className="main-content">
        {/* Mobile top bar */}
        <header className="mobile-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: "linear-gradient(135deg,#38bdf8,#4ade80)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#020810" }}>S</div>
            <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: ".9rem" }}>SkillPath AI</span>
          </div>
          <button onClick={() => setSidebarOpen(o => !o)}
            style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 10px", color: "var(--text)", fontSize: "1rem" }}>
            {sidebarOpen ? "✕" : "☰"}
          </button>
        </header>

        <div className="page-content" style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
