import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Card, Badge, Spinner, SectionHeader, Modal, Tabs, Alert } from "../components/UI";

/* ── Admin guard ─────────────────────────────────────────────── */
function AdminGuard({ children }) {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !isAdmin) navigate("/dashboard"); }, [loading, isAdmin]);
  if (loading) return <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 40, color: "var(--t3)" }}><Spinner size={20} /> Checking permissions...</div>;
  if (!isAdmin) return null;
  return children;
}

/* ── Stats Overview ──────────────────────────────────────────── */
function AdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.stats().then(setStats).catch(() => setStats({
      total_users: 312, active_today: 47, total_analyses: 1240,
      top_target_roles: [{ _id: "Backend Developer", count: 98 }, { _id: "Data Scientist", count: 74 }, { _id: "Full Stack Developer", count: 63 }],
      avg_readiness: 54, total_feedback: 890, helpful_pct: 78,
    })).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "flex", gap: 12 }}>{[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 80, flex: 1, borderRadius: 12 }} />)}</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12 }}>
      {[
        { label: "Total Users",      value: stats?.total_users,    color: "var(--cyan)",   icon: "◉" },
        { label: "Active Today",     value: stats?.active_today,   color: "var(--green)",  icon: "◆" },
        { label: "Gap Analyses",     value: stats?.total_analyses, color: "var(--purple)", icon: "◈" },
        { label: "Avg Readiness",    value: `${stats?.avg_readiness ?? 0}%`, color: "var(--amber)", icon: "⊞" },
        { label: "Feedback Items",   value: stats?.total_feedback, color: "var(--teal)",   icon: "◎" },
        { label: "Helpful Rate",     value: `${stats?.helpful_pct ?? 0}%`, color: "var(--green)", icon: "✓" },
      ].map(s => (
        <div key={s.label} className="admin-stat">
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            <span style={{ color: s.color, fontSize: ".85rem" }}>{s.icon}</span>
            <span style={{ fontSize: ".62rem", color: "var(--t3)", fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: ".06em" }}>{s.label}</span>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "Syne,sans-serif", color: s.color }}>{s.value ?? "—"}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Users Tab ───────────────────────────────────────────────── */
function UsersTab() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [toast,   setToast]   = useState("");

  useEffect(() => {
    api.admin.users().then(d => setUsers(d.users || d || [])).catch(() => setUsers([])).finally(() => setLoading(false));
  }, []);

  const toggleAdmin = async (user) => {
    await api.admin.updateUser(user.id, { is_admin: !user.is_admin });
    setUsers(p => p.map(u => u.id === user.id ? { ...u, is_admin: !u.is_admin } : u));
    setToast(`${user.name} ${user.is_admin ? "removed from" : "added to"} admins`);
    setTimeout(() => setToast(""), 3000);
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    await api.admin.deleteUser(user.id);
    setUsers(p => p.filter(u => u.id !== user.id));
    setToast(`${user.name} deleted`);
    setTimeout(() => setToast(""), 3000);
  };

  const filtered = users.filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 20, color: "var(--t3)" }}><Spinner size={18} /> Loading users...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {toast && <div className="toast toast-success" style={{ position: "relative", bottom: "auto", right: "auto", margin: 0 }}>{toast}</div>}
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." />
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr><th>User</th><th>Target Role</th><th>Readiness</th><th>Skills</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.slice(0, 30).map(u => (
              <tr key={u.id || u._id}>
                <td>
                  <div style={{ fontWeight: 500, color: "var(--text)" }}>{u.name}</div>
                  <div style={{ fontSize: ".72rem", color: "var(--t3)", fontFamily: "'DM Mono',monospace" }}>{u.email}</div>
                </td>
                <td><Badge label={u.target_role || "Not set"} color={u.target_role ? "cyan" : "gray"} /></td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 80 }}>
                    <div style={{ flex: 1, height: 4, background: "var(--bg4)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${u.readiness_score || 0}%`, background: "var(--cyan)", borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: ".72rem", color: "var(--cyan)", fontFamily: "'DM Mono',monospace" }}>{u.readiness_score || 0}%</span>
                  </div>
                </td>
                <td><span style={{ fontFamily: "'DM Mono',monospace", fontSize: ".8rem" }}>{u.skills?.length || 0}</span></td>
                <td>
                  <div style={{ display: "flex", gap: 5 }}>
                    {u.is_admin && <Badge label="Admin" color="amber" />}
                    <Badge label={u.auth_provider === "google" ? "Google" : "Email"} color="gray" />
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => toggleAdmin(u)} style={{ fontSize: ".72rem", padding: "3px 9px", borderRadius: 6, background: u.is_admin ? "var(--adim)" : "var(--cdim)", color: u.is_admin ? "var(--amber)" : "var(--cyan)", border: `1px solid ${u.is_admin ? "rgba(251,191,36,.3)" : "var(--b2)"}`, cursor: "pointer" }}>
                      {u.is_admin ? "Revoke" : "Make Admin"}
                    </button>
                    <button onClick={() => deleteUser(u)} style={{ fontSize: ".72rem", padding: "3px 9px", borderRadius: 6, background: "var(--rdim)", color: "var(--red)", border: "1px solid rgba(248,113,113,.3)", cursor: "pointer" }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ textAlign: "center", padding: "32px 20px", color: "var(--t3)", fontSize: ".85rem" }}>No users found</div>}
      </Card>
    </div>
  );
}

/* ── Roles & Skills Tab ──────────────────────────────────────── */
function RolesTab() {
  const [roles,   setRoles]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [newRole, setNewRole] = useState({ role: "", required_skills: "" });
  const [saving,  setSaving]  = useState(false);

  const FALLBACK = [
    { role: "Backend Developer",     required_skills: [{ name: "Node.js", importance: "critical" }, { name: "Docker", importance: "important" }, { name: "MongoDB", importance: "important" }] },
    { role: "Data Scientist",        required_skills: [{ name: "Python",  importance: "critical" }, { name: "Machine Learning", importance: "critical" }, { name: "SQL", importance: "important" }] },
    { role: "Full Stack Developer",  required_skills: [{ name: "React",   importance: "critical" }, { name: "Node.js", importance: "critical" }] },
    { role: "DevOps Engineer",       required_skills: [{ name: "Docker",  importance: "critical" }, { name: "AWS", importance: "critical" }, { name: "Kubernetes", importance: "important" }] },
    { role: "AI Engineer",           required_skills: [{ name: "Python",  importance: "critical" }, { name: "Deep Learning", importance: "critical" }] },
  ];

  useEffect(() => {
    api.admin.roles().then(d => setRoles(d || [])).catch(() => setRoles(FALLBACK)).finally(() => setLoading(false));
  }, []);

  const saveRole = async () => {
    if (!newRole.role.trim()) return;
    setSaving(true);
    const skills = newRole.required_skills.split(",").map(s => ({ name: s.trim(), importance: "important" })).filter(s => s.name);
    try {
      await api.admin.addRole({ role: newRole.role, required_skills: skills });
      setRoles(p => [...p, { role: newRole.role, required_skills: skills }]);
      setModal(false); setNewRole({ role: "", required_skills: "" });
    } catch { alert("Failed to save role"); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 20, color: "var(--t3)" }}><Spinner size={18} /> Loading roles...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn-primary" onClick={() => setModal(true)}>+ Add Role</button>
      </div>
      {roles.map(r => (
        <Card key={r.role}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            <h3 style={{ fontSize: ".95rem" }}>{r.role}</h3>
            <Badge label={`${r.required_skills?.length || 0} skills`} color="cyan" />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {r.required_skills?.map(s => (
              <Badge key={s.name} label={s.name} color={s.importance === "critical" ? "red" : s.importance === "important" ? "amber" : "gray"} />
            ))}
          </div>
        </Card>
      ))}
      <Modal open={modal} onClose={() => setModal(false)} title="Add New Role" width={440}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: ".68rem", color: "var(--t3)", fontFamily: "'DM Mono',monospace", display: "block", marginBottom: 5, textTransform: "uppercase" }}>Role Name</label>
            <input value={newRole.role} placeholder="e.g. Blockchain Developer" onChange={e => setNewRole(p => ({ ...p, role: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: ".68rem", color: "var(--t3)", fontFamily: "'DM Mono',monospace", display: "block", marginBottom: 5, textTransform: "uppercase" }}>Required Skills (comma-separated)</label>
            <textarea value={newRole.required_skills} rows={3} placeholder="Python, Solidity, Web3.js, Smart Contracts" onChange={e => setNewRole(p => ({ ...p, required_skills: e.target.value }))} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={saveRole} disabled={saving}>{saving ? <Spinner size={14} /> : "Save Role"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ── Notifications Tab ───────────────────────────────────────── */
function NotificationsTab() {
  const [form, setForm] = useState({ title: "", message: "", type: "info", target: "all" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (!form.message.trim()) return;
    setSending(true);
    try {
      await api.admin.notifications(form);
      setSent(true); setTimeout(() => setSent(false), 4000);
      setForm(p => ({ ...p, title: "", message: "" }));
    } catch { alert("Failed to send notification"); }
    finally { setSending(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {sent && <div style={{ background: "var(--gdim)", border: "1px solid rgba(74,222,128,.3)", borderRadius: 10, padding: "10px 14px", color: "var(--green)", fontSize: ".85rem" }}>✅ Notification sent successfully</div>}
      <Card>
        <div style={{ fontSize: ".65rem", color: "var(--t3)", fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14 }}>Send Platform Notification</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: ".68rem", color: "var(--t3)", fontFamily: "'DM Mono',monospace", display: "block", marginBottom: 5, textTransform: "uppercase" }}>Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {["info","success","warning","milestone","new_resource"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: ".68rem", color: "var(--t3)", fontFamily: "'DM Mono',monospace", display: "block", marginBottom: 5, textTransform: "uppercase" }}>Target</label>
              <select value={form.target} onChange={e => setForm(p => ({ ...p, target: e.target.value }))}>
                <option value="all">All Users</option>
                <option value="inactive">Inactive 7+ days</option>
                <option value="low_score">Readiness &lt; 40%</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: ".68rem", color: "var(--t3)", fontFamily: "'DM Mono',monospace", display: "block", marginBottom: 5, textTransform: "uppercase" }}>Title</label>
            <input value={form.title} placeholder="e.g. New Docker resources available" onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: ".68rem", color: "var(--t3)", fontFamily: "'DM Mono',monospace", display: "block", marginBottom: 5, textTransform: "uppercase" }}>Message</label>
            <textarea value={form.message} rows={4} placeholder="Write your notification message here..." onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
          </div>
          <button className="btn-primary" onClick={send} disabled={sending || !form.message.trim()} style={{ alignSelf: "flex-start" }}>
            {sending ? <><Spinner size={15} /> Sending...</> : "Send Notification →"}
          </button>
        </div>
      </Card>

      {/* Pre-built triggers */}
      <Card>
        <div style={{ fontSize: ".65rem", color: "var(--t3)", fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>Quick Triggers</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "7-day inactive reminder",     msg: "You haven't updated your skills in 7 days. Log in to track your progress!",          type: "info"    },
            { label: "Roadmap step due",             msg: "Your roadmap step is due this week. Keep the momentum going!",                        type: "warning" },
            { label: "Readiness milestone (50%)",    msg: "🎉 Congratulations! You've reached 50% readiness. Keep pushing — you're halfway!",   type: "milestone"},
            { label: "New learning resources added", msg: "New Docker and Kubernetes resources have been added to your roadmap.",               type: "info"    },
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--bg3)", borderRadius: 8, gap: 12 }}>
              <div>
                <div style={{ fontSize: ".85rem", fontWeight: 500 }}>{t.label}</div>
                <div style={{ fontSize: ".75rem", color: "var(--t3)", marginTop: 2 }}>{t.msg.slice(0, 60)}...</div>
              </div>
              <button onClick={() => { setForm(p => ({ ...p, message: t.msg, type: t.type })); }} style={{ background: "var(--cdim)", color: "var(--cyan)", border: "1px solid var(--b2)", borderRadius: 7, padding: "5px 12px", fontSize: ".75rem", cursor: "pointer", flexShrink: 0 }}>Use</button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── Analytics Tab ───────────────────────────────────────────── */
function AnalyticsTab() {
  const mockData = {
    topGaps: [["Docker",78],["System Design",71],["MongoDB",65],["AWS",60],["Kubernetes",52]],
    topRoles: [["Backend Developer",98],["Data Scientist",74],["Full Stack Developer",63],["DevOps Engineer",41],["AI Engineer",36]],
    scoreDistribution: [[20,45],[30,62],[40,88],[50,103],[60,94],[70,67],[80,43],[90,18]],
  };

  const maxGap = Math.max(...mockData.topGaps.map(([,v]) => v));
  const maxRole = Math.max(...mockData.topRoles.map(([,v]) => v));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ fontSize: ".65rem", color: "var(--t3)", fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14 }}>Top Skill Gaps (platform-wide)</div>
          {mockData.topGaps.map(([skill, count]) => (
            <div key={skill} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: ".82rem" }}>
                <span>{skill}</span><span style={{ fontFamily: "'DM Mono',monospace", color: "var(--red)", fontSize: ".72rem" }}>{count} users</span>
              </div>
              <div style={{ height: 5, background: "var(--bg4)", borderRadius: 99 }}><div style={{ height: "100%", width: `${(count / maxGap) * 100}%`, background: "var(--red)", borderRadius: 99 }} /></div>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontSize: ".65rem", color: "var(--t3)", fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14 }}>Target Roles Distribution</div>
          {mockData.topRoles.map(([role, count]) => (
            <div key={role} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: ".82rem" }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{role}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", color: "var(--cyan)", fontSize: ".72rem" }}>{count} users</span>
              </div>
              <div style={{ height: 5, background: "var(--bg4)", borderRadius: 99 }}><div style={{ height: "100%", width: `${(count / maxRole) * 100}%`, background: "var(--cyan)", borderRadius: 99 }} /></div>
            </div>
          ))}
        </Card>
      </div>
      <Card>
        <div style={{ fontSize: ".65rem", color: "var(--t3)", fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14 }}>Readiness Score Distribution</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
          {mockData.scoreDistribution.map(([score, count]) => {
            const h = (count / Math.max(...mockData.scoreDistribution.map(([,v]) => v))) * 90;
            return (
              <div key={score} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: ".6rem", color: "var(--t3)", fontFamily: "'DM Mono',monospace" }}>{count}</span>
                <div style={{ width: "100%", background: score >= 60 ? "var(--green)" : score >= 40 ? "var(--amber)" : "var(--red)", borderRadius: "3px 3px 0 0", height: `${h}px` }} />
                <span style={{ fontSize: ".6rem", color: "var(--t3)", fontFamily: "'DM Mono',monospace" }}>{score}%</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ── Main Admin Page ─────────────────────────────────────────── */
export default function Admin() {
  const [tab, setTab] = useState("overview");

  return (
    <AdminGuard>
      <div className="fade-up">
        <SectionHeader
          title="Admin Panel"
          sub="Platform management and analytics"
          action={<Badge label="Admin Access" color="amber" />}
        />
        <div style={{ marginBottom: 20 }}>
          <Tabs
            tabs={[
              { id: "overview",      label: "Overview"      },
              { id: "users",         label: "Users"         },
              { id: "roles",         label: "Roles & Skills"},
              { id: "analytics",     label: "Analytics"     },
              { id: "notifications", label: "Notifications" },
            ]}
            active={tab}
            onChange={setTab}
          />
        </div>

        {tab === "overview"      && <div className="fade-up"><AdminStats /></div>}
        {tab === "users"         && <div className="fade-up"><UsersTab /></div>}
        {tab === "roles"         && <div className="fade-up"><RolesTab /></div>}
        {tab === "analytics"     && <div className="fade-up"><AnalyticsTab /></div>}
        {tab === "notifications" && <div className="fade-up"><NotificationsTab /></div>}
      </div>
    </AdminGuard>
  );
}
