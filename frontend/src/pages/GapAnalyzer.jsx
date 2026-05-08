// ── GapAnalyzer.jsx ───────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { Card, SkillBar, ScoreRing, Badge, Tabs, SectionHeader, Spinner, EmptyState } from "../components/UI";
import { useNavigate } from "react-router-dom";

export default function GapAnalyzer() {
  const [data, setData]   = useState(null);
  const [tab, setTab]     = useState("gaps");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.gap.analyze().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--text3)", padding: 40 }}><Spinner size={22} /> Analyzing your skill gaps...</div>;

  if (data?.error) return (
    <EmptyState icon="◈" title="Set your target role first"
      desc="Go to your profile and set a target role to see your skill gap analysis."
      action={<button className="btn-primary" onClick={() => navigate("/profile")}>Set Target Role →</button>}
    />
  );

  const gaps     = data?.gaps || [];
  const critical = gaps.filter(g => g.importance === "critical" && g.gap > 0);
  const important= gaps.filter(g => g.importance === "important" && g.gap > 0);
  const met      = data?.met_skills || [];

  return (
    <div className="fade-up">
      <SectionHeader title="Skill Gap Analyzer" sub={`Target: ${data?.target_role}`}
        action={<Badge label={`${data?.peer_percentile != null ? `Top ${100 - data.peer_percentile}%` : "Analyzing..."}`} color="green" />}
      />

      {/* Score rings */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <Card style={{ flex: "0 0 auto" }}>
          <ScoreRing score={data?.readiness_score ?? 0} label="Readiness" size={100} />
        </Card>
        <Card style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Critical Gaps", v: data?.critical_count ?? 0,  c: "var(--red)" },
              { label: "Important Gaps", v: data?.important_count ?? 0, c: "var(--amber)" },
              { label: "Skills Met", v: met.length, c: "var(--green)" },
              { label: "Total Skills", v: gaps.length, c: "var(--cyan)" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center", padding: "10px 8px", background: "var(--bg3)", borderRadius: 8 }}>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, fontFamily: "var(--font-display)", color: s.c }}>{s.v}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text3)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Tabs
        tabs={[{ id: "gaps", label: "All Skills" }, { id: "critical", label: `Critical (${critical.length})` }, { id: "important", label: `Important (${important.length})` }, { id: "met", label: `Met (${met.length})` }]}
        active={tab} onChange={setTab}
      />

      <Card style={{ marginTop: 16 }}>
        {tab !== "met" ? (
          (tab === "gaps" ? gaps : tab === "critical" ? critical : important).map(g => (
            <SkillBar key={g.skill} name={g.skill} level={g.your_level} required={g.required}
              category={g.category || ""} importance={g.importance} />
          ))
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "8px 0" }}>
            {met.map(s => <Badge key={s} label={`✓ ${s}`} color="green" />)}
          </div>
        )}
      </Card>
    </div>
  );
}
