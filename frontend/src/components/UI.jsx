import React from "react";

/* ── Badge ─────────────────────────────────────────────────── */
export function Badge({ label, color = "cyan", style = {} }) {
  const m = {
    cyan:   { bg: "rgba(56,189,248,.12)",  c: "#38bdf8", b: "rgba(56,189,248,.28)"  },
    green:  { bg: "rgba(74,222,128,.1)",   c: "#4ade80", b: "rgba(74,222,128,.28)"  },
    amber:  { bg: "rgba(251,191,36,.1)",   c: "#fbbf24", b: "rgba(251,191,36,.28)"  },
    red:    { bg: "rgba(248,113,113,.1)",  c: "#f87171", b: "rgba(248,113,113,.28)" },
    purple: { bg: "rgba(167,139,250,.1)",  c: "#a78bfa", b: "rgba(167,139,250,.28)" },
    teal:   { bg: "rgba(45,212,191,.1)",   c: "#2dd4bf", b: "rgba(45,212,191,.28)"  },
    gray:   { bg: "rgba(255,255,255,.05)", c: "#8ca9c8", b: "rgba(255,255,255,.12)" },
  };
  const s = m[color] || m.cyan;
  return (
    <span className="badge" style={{ background: s.bg, color: s.c, border: `1px solid ${s.b}`, ...style }}>
      {label}
    </span>
  );
}

/* ── Card ──────────────────────────────────────────────────── */
export function Card({ children, style = {}, glow, onClick, className = "" }) {
  return (
    <div className={`card ${glow ? "card-glow" : ""} ${className}`}
      style={{ cursor: onClick ? "pointer" : undefined, ...style }}
      onClick={onClick}>
      {children}
    </div>
  );
}

/* ── ProgressBar ───────────────────────────────────────────── */
export function ProgressBar({ value = 0, max = 100, color = "var(--cyan)", height = 6 }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="progress-track" style={{ height }}>
      <div className="progress-fill" style={{ width: `${pct}%`, background: color, height }} />
    </div>
  );
}

/* ── ScoreRing ─────────────────────────────────────────────── */
export function ScoreRing({ score = 0, label, color = "var(--cyan)", size = 84 }) {
  const r = 34, circ = 2 * Math.PI * r, dash = circ * (Math.min(score, 100) / 100);
  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={size} viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={r} fill="none" stroke="var(--bg4)" strokeWidth="5" />
        <circle cx="42" cy="42" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          transform="rotate(-90 42 42)"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)" }} />
        <text x="42" y="38" textAnchor="middle" fill={color} fontSize="15" fontWeight="700" fontFamily="Syne,sans-serif">{score}%</text>
        {label && <text x="42" y="55" textAnchor="middle" fill="var(--t3)" fontSize="8" fontFamily="DM Mono,monospace">{label}</text>}
      </svg>
    </div>
  );
}

/* ── StatCard ──────────────────────────────────────────────── */
export function StatCard({ label, value, color = "var(--cyan)", icon, onClick }) {
  return (
    <Card style={{ textAlign: "center", padding: "16px 10px" }} onClick={onClick}>
      {icon && <div style={{ fontSize: "1.3rem", marginBottom: 6 }}>{icon}</div>}
      <div style={{ fontSize: "1.7rem", fontWeight: 800, fontFamily: "Syne,sans-serif", color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: ".62rem", color: "var(--t3)", marginTop: 5, fontFamily: "'DM Mono',monospace", textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
    </Card>
  );
}

/* ── SkillBar ──────────────────────────────────────────────── */
export function SkillBar({ name, level, required, importance, category, verified }) {
  const color = level >= required ? "var(--green)"
    : importance === "critical" ? "var(--red)" : "var(--cyan)";
  const impColor = importance === "critical" ? "red"
    : importance === "important" ? "amber" : "gray";
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: ".88rem", fontWeight: 500 }}>{name}</span>
          {verified && <Badge label="✓ verified" color="green" />}
          {category && <Badge label={category} color="gray" />}
          {level < required && <Badge label={importance} color={impColor} />}
          {level >= required && <Badge label="met ✓" color="green" />}
        </div>
        <span style={{ fontSize: ".7rem", fontFamily: "'DM Mono',monospace", color: "var(--t3)" }}>
          {level}% / {required}%
        </span>
      </div>
      <div style={{ position: "relative" }}>
        <div className="progress-track" style={{ height: 7 }}>
          <div style={{ position: "absolute", height: "100%", width: `${required}%`, background: "rgba(255,255,255,.07)", borderRadius: 99 }} />
          <div style={{ position: "absolute", height: "100%", width: `${level}%`, background: color, borderRadius: 99, transition: "width 1.2s cubic-bezier(.4,0,.2,1)" }} />
        </div>
      </div>
    </div>
  );
}

/* ── Spinner ───────────────────────────────────────────────── */
export function Spinner({ size = 18 }) {
  return <div className="spin" style={{ width: size, height: size, border: "2px solid var(--border)", borderTop: "2px solid var(--cyan)", borderRadius: "50%", flexShrink: 0 }} />;
}

/* ── Tabs ──────────────────────────────────────────────────── */
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tab-nav">
      {tabs.map(t => (
        <button key={t.id} className={`tab-item ${active === t.id ? "active" : ""}`} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ── SectionHeader ─────────────────────────────────────────── */
export function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
      <div>
        <h2 style={{ marginBottom: 3 }}>{title}</h2>
        {sub && <p style={{ margin: 0, fontSize: ".82rem" }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── EmptyState ────────────────────────────────────────────── */
export function EmptyState({ icon = "📭", title, desc, action }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px" }}>
      <div style={{ fontSize: "2.8rem", marginBottom: 12 }}>{icon}</div>
      <h3 style={{ marginBottom: 8 }}>{title}</h3>
      <p style={{ maxWidth: 320, margin: "0 auto 20px" }}>{desc}</p>
      {action}
    </div>
  );
}

/* ── Alert ─────────────────────────────────────────────────── */
export function Alert({ type = "info", message, onClose }) {
  const map = { info: "cyan", success: "green", warning: "amber", error: "red" };
  const c = map[type] || "cyan";
  return (
    <div style={{ padding: "10px 14px", borderRadius: "var(--r-md)", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center",
      background: `var(--${c}dim, rgba(56,189,248,.12))`, border: `1px solid rgba(var(--${c}-rgb,56,189,248),.3)`, color: `var(--${c})`, fontSize: ".85rem" }}>
      <span>{message}</span>
      {onClose && <button onClick={onClose} style={{ background: "transparent", color: "inherit", fontSize: "1.1rem", padding: "0 4px", lineHeight: 1 }}>×</button>}
    </div>
  );
}

/* ── Modal ─────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, width = 480 }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="card" style={{ width, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto", position: "relative", zIndex: 201 }}>
        {title && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3>{title}</h3>
            <button onClick={onClose} style={{ background: "transparent", color: "var(--t2)", fontSize: "1.3rem", lineHeight: 1, padding: "0 4px" }}>×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* ── Toast ─────────────────────────────────────────────────── */
export function Toast({ message, type = "info", onClose }) {
  React.useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return <div className={`toast toast-${type}`}>{message}</div>;
}

/* ── Divider ───────────────────────────────────────────────── */
export function GlowDivider() {
  return <div style={{ height: 1, background: "linear-gradient(90deg,transparent,var(--cdim),var(--b2),var(--cdim),transparent)", margin: "20px 0" }} />;
}

/* ── Field ─────────────────────────────────────────────────── */
export function Field({ label, children, hint }) {
  return (
    <div>
      {label && <label style={{ fontSize: ".68rem", color: "var(--t3)", fontFamily: "'DM Mono',monospace", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".07em" }}>{label}</label>}
      {children}
      {hint && <p style={{ margin: "4px 0 0", fontSize: ".72rem", color: "var(--t3)" }}>{hint}</p>}
    </div>
  );
}

/* ── LoadingPage ────────────────────────────────────────────── */
export function LoadingPage({ message = "Loading..." }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", gap: 12, color: "var(--t3)" }}>
      <Spinner size={22} /> {message}
    </div>
  );
}
