import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import { Card, Badge, Spinner, SectionHeader } from "../components/UI";

export default function Notifications() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  const FALLBACK = [
    { _id: "1", title: "Docker resources added",       message: "New Docker fundamentals course added to your roadmap.",                  type: "info",      read: false, created_at: new Date(Date.now()-3600000).toISOString() },
    { _id: "2", title: "Readiness milestone reached!", message: "🎉 You reached 60% readiness for Backend Developer. Keep pushing!",     type: "milestone", read: false, created_at: new Date(Date.now()-86400000).toISOString() },
    { _id: "3", title: "Weekly progress summary",      message: "This week you verified 2 skills and completed Week 2 of your roadmap.", type: "success",   read: true,  created_at: new Date(Date.now()-172800000).toISOString() },
    { _id: "4", title: "New internship match",         message: "A new Full Stack Intern role at Swiggy matches 81% of your skills.",    type: "info",      read: true,  created_at: new Date(Date.now()-259200000).toISOString() },
    { _id: "5", title: "Skill update reminder",        message: "You haven't updated your skills in 7 days. Keep your profile fresh!",   type: "warning",   read: true,  created_at: new Date(Date.now()-604800000).toISOString() },
  ];

  useEffect(() => {
    api.notifications.list().then(d => setItems(d || FALLBACK)).catch(() => setItems(FALLBACK)).finally(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    try { await api.notifications.markRead(id); } catch {}
    setItems(p => p.map(n => n._id === id ? { ...n, read: true } : n));
  };

  const markAll = async () => {
    try { await api.notifications.markAllRead(); } catch {}
    setItems(p => p.map(n => ({ ...n, read: true })));
  };

  const typeIcon  = t => ({ info: "ℹ", success: "✓", warning: "⚠", milestone: "🏆", error: "✕" }[t] || "◆");
  const typeColor = t => ({ info: "cyan", success: "green", warning: "amber", milestone: "purple", error: "red" }[t] || "cyan");

  const timeAgo = ts => {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000);
    return d > 0 ? `${d}d ago` : h > 0 ? `${h}h ago` : `${m}m ago`;
  };

  const unread = items.filter(n => !n.read).length;

  if (loading) return <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 40, color: "var(--t3)" }}><Spinner size={20} /> Loading notifications...</div>;

  return (
    <div className="fade-up">
      <SectionHeader
        title="Notifications"
        sub="Platform updates, milestones, and reminders"
        action={
          unread > 0
            ? <button className="btn-ghost" onClick={markAll} style={{ fontSize: ".78rem" }}>Mark all read</button>
            : <Badge label="All caught up ✓" color="green" />
        }
      />

      {unread > 0 && (
        <div style={{ background: "var(--cdim)", border: "1px solid var(--b2)", borderRadius: 10, padding: "10px 14px", fontSize: ".83rem", color: "var(--cyan)", marginBottom: 16 }}>
          You have <strong>{unread}</strong> unread notification{unread > 1 ? "s" : ""}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.length === 0 ? (
          <Card style={{ textAlign: "center", padding: "48px 20px" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 10 }}>🔔</div>
            <h3 style={{ marginBottom: 6 }}>All caught up</h3>
            <p>No notifications yet. They'll appear here when something happens.</p>
          </Card>
        ) : (
          items.map(n => (
            <Card key={n._id} style={{ borderLeft: `3px solid var(--${typeColor(n.type)})`, opacity: n.read ? 0.7 : 1, cursor: n.read ? "default" : "pointer" }}
              onClick={() => !n.read && markRead(n._id)}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: `var(--${typeColor(n.type)}dim, rgba(56,189,248,.12))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>
                  {typeIcon(n.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: ".9rem", fontWeight: 600, color: "var(--text)" }}>{n.title}</span>
                      {!n.read && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--cyan)", display: "inline-block" }} />}
                    </div>
                    <span style={{ fontSize: ".68rem", color: "var(--t3)", fontFamily: "'DM Mono',monospace" }}>{timeAgo(n.created_at)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: ".82rem", lineHeight: 1.55 }}>{n.message}</p>
                  <div style={{ marginTop: 7 }}><Badge label={n.type} color={typeColor(n.type)} /></div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
