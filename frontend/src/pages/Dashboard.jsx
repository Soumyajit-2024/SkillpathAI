import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { Card, StatCard, ScoreRing, ProgressBar, Badge, SkillBar, SectionHeader, Spinner } from "../components/UI";

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const navigate              = useNavigate();
  const [gap,     setGap]     = useState(null);
  const [place,   setPlace]   = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await refreshUser();
        const [g, p, h] = await Promise.allSettled([
          api.gap.analyze(),
          api.profile.placementScore(),
          api.profile.progressHistory(),
        ]);
        if (g.status === "fulfilled") setGap(g.value);
        if (p.status === "fulfilled") setPlace(p.value);
        if (h.status === "fulfilled") setHistory(h.value);
      } catch (e) {}
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", gap: 12, color: "var(--text3)" }}>
      <Spinner size={24} /> Loading your dashboard...
    </div>
  );

  const name        = user?.name?.split(" ")[0] || "there";
  const readiness   = gap?.readiness_score ?? user?.readiness_score ?? 0;
  const targetRole  = user?.target_role || "No role set";
  const skills      = user?.skills || [];
  const topGaps     = (gap?.gaps || []).filter(g => g.gap > 0).slice(0, 5);
  const histScores  = history.slice().reverse().map(h => h.readiness_score);

  const nextAction = gap?.gaps?.find(g => g.importance === "critical" && g.gap > 0);

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: "var(--text)", marginBottom: 4 }}>
            Good morning, <span style={{ color: "var(--cyan)" }}>{name}</span> ◐
          </h1>
          <p style={{ margin: 0 }}>
            Targeting <span style={{ color: "var(--text)" }}>{targetRole}</span>
            {gap?.peer_percentile != null && (
              <span style={{ marginLeft: 8, color: "var(--green)", fontSize: "0.85rem" }}>
                · Top {100 - gap.peer_percentile}% of aspirants
              </span>
            )}
          </p>
        </div>
        <button className="btn-ghost" onClick={() => navigate("/chat")} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="dot-live" /> AI Advisor
        </button>
      </div>

      {/* Next Best Action */}
      {nextAction && (
        <div className="fade-up" style={{
          background: "linear-gradient(135deg, var(--cyan-dim), rgba(74,222,128,.05))",
          border: "1px solid var(--border2)", borderRadius: "var(--radius-lg)",
          padding: "16px 20px", marginBottom: 24,
        }}>
          <div style={{ fontSize: "0.7rem", color: "var(--cyan)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>
            ◆ Next Best Action
          </div>
          <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
            Learn <span style={{ color: "var(--cyan)" }}>{nextAction.skill}</span> — your most critical gap for {targetRole}
          </div>
          <div style={{ fontSize: "0.83rem", color: "var(--text3)", marginBottom: 12 }}>
            Currently at {nextAction.your_level}% · Need {nextAction.required}% · Gap: {nextAction.gap}%
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => navigate("/roadmap")} style={{ fontSize: "0.83rem", padding: "7px 16px" }}>View Roadmap →</button>
            <button className="btn-ghost" onClick={() => navigate("/gap")} style={{ fontSize: "0.83rem" }}>Full Gap Analysis</button>
          </div>
        </div>
      )}

      {/* Score cards */}
      <div className="grid-4 stagger" style={{ marginBottom: 24 }}>
        <StatCard label="Role Readiness" value={`${readiness}%`} color="var(--cyan)" icon="◈" />
        <StatCard label="Placement Score" value={`${place?.placement_score ?? 0}%`} color="var(--green)" icon="◉" />
        <StatCard label="Verified Skills" value={user?.verified_skills?.length ?? 0} color="var(--purple)" icon="◎" />
        <StatCard label="Skills Tracked" value={skills.length} color="var(--amber)" icon="⬡" />
      </div>

      <div className="grid-2" style={{ marginBottom: 24, alignItems: "start" }}>
        {/* Score rings */}
        <Card>
          <div style={{ fontSize: "0.75rem", color: "var(--text3)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14 }}>Score Breakdown</div>
          <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 16 }}>
            <ScoreRing score={readiness} label="Readiness" color="var(--cyan)" />
            <ScoreRing score={place?.placement_score ?? 0} label="Placement" color="var(--green)" />
            <ScoreRing score={user?.resume_score ?? 0} label="Resume" color="var(--amber)" />
          </div>
        </Card>

        {/* Progress history mini chart */}
        <Card>
          <div style={{ fontSize: "0.75rem", color: "var(--text3)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14 }}>Progress History</div>
          {histScores.length > 0 ? (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 80 }}>
              {histScores.map((s, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: i === histScores.length - 1 ? "var(--cyan)" : "var(--bg4)", height: `${(s / 100) * 70}px`, transition: "height 1s ease" }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: "0.83rem" }}>
              No history yet — take a snapshot to track progress
            </div>
          )}
          <button className="btn-ghost" onClick={() => api.profile.saveSnapshot()} style={{ marginTop: 10, fontSize: "0.78rem", padding: "5px 12px" }}>
            Save Snapshot
          </button>
        </Card>
      </div>

      {/* Top skill gaps */}
      {topGaps.length > 0 && (
        <Card style={{ marginBottom: 24 }}>
          <SectionHeader
            title="Top Skill Gaps"
            sub={`For ${targetRole}`}
            action={<button className="btn-ghost" onClick={() => navigate("/gap")} style={{ fontSize: "0.8rem" }}>Full analysis →</button>}
          />
          {topGaps.map(g => (
            <SkillBar
              key={g.skill}
              name={g.skill} level={g.your_level} required={g.required}
              category={g.category || ""} importance={g.importance}
              verified={user?.verified_skills?.includes(g.skill)}
            />
          ))}
        </Card>
      )}

      {/* Quick actions */}
      <SectionHeader title="Quick Actions" />
      <div className="grid-4 stagger">
        {[
          { icon: "📄", label: "Analyze Resume",    sub: "Upload PDF", color: "var(--cyan)",   to: "/profile" },
          { icon: "🔍", label: "Parse Job Description", sub: "Any JD URL", color: "var(--purple)", to: "/jd" },
          { icon: "🏢", label: "Internships",       sub: `${readiness}% match`, color: "var(--amber)", to: "/internships" },
          { icon: "🤖", label: "Interview Sim",     sub: "AI Interviewer", color: "var(--green)", to: "/interview" },
        ].map(a => (
          <Card key={a.label} onClick={() => navigate(a.to)} style={{ cursor: "pointer", padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>{a.icon}</div>
            <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>{a.label}</div>
            <div style={{ fontSize: "0.75rem", color: a.color, fontFamily: "var(--font-mono)" }}>{a.sub}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
