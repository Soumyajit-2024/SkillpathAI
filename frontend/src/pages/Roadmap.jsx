// ── Roadmap.jsx ───────────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { Card, ProgressBar, Badge, SectionHeader, Spinner } from "../components/UI";

export default function Roadmap() {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.roadmap.get().then(setData).finally(() => setLoading(false)); }, []);

  const markDone = async (week) => {
    await api.roadmap.markDone(week);
    setData(d => ({ ...d, steps: d.steps.map(s => s.week === week ? { ...s, done: true } : s) }));
  };

  if (loading) return <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--text3)", padding: 40 }}><Spinner size={22} />Generating roadmap...</div>;

  const steps     = data?.steps || [];
  const doneCount = steps.filter(s => s.done).length;

  return (
    <div className="fade-up">
      <SectionHeader title="Learning Roadmap" sub={`Goal: ${data?.target_role || "—"}`}
        action={<button className="btn-ghost" onClick={async () => { await api.roadmap.regenerate(); window.location.reload(); }} style={{ fontSize: "0.8rem" }}>Regenerate</button>}
      />
      <Card style={{ marginBottom: 20, padding: "14px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.83rem", color: "var(--text3)" }}>
          <span>Overall Progress</span><span style={{ color: "var(--cyan)", fontFamily: "var(--font-mono)" }}>{doneCount}/{steps.length} weeks</span>
        </div>
        <ProgressBar value={doneCount} max={steps.length} height={8} />
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {steps.map((step, i) => {
          const isCurrent = !step.done && i === doneCount;
          return (
            <Card key={step.week} style={{ borderLeft: `3px solid ${step.done ? "var(--green)" : isCurrent ? "var(--cyan)" : "var(--border)"}`, padding: "14px 18px" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                  background: step.done ? "var(--green)" : isCurrent ? "var(--cyan-dim)" : "var(--bg4)",
                  border: `1px solid ${step.done ? "var(--green)" : isCurrent ? "var(--cyan)" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.8rem", fontWeight: 700, color: step.done ? "#020810" : isCurrent ? "var(--cyan)" : "var(--text3)",
                  fontFamily: "var(--font-mono)",
                }}>
                  {step.done ? "✓" : `W${step.week}`}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text)" }}>Week {step.week}: {step.skill}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text3)", marginTop: 3 }}>
                        📚 {step.resource} · ~{step.hours}h
                        {step.resource_url && <a href={step.resource_url} target="_blank" rel="noreferrer" style={{ marginLeft: 8, color: "var(--cyan)", fontSize: "0.75rem" }}>Open →</a>}
                      </div>
                    </div>
                    {isCurrent && (
                      <button className="btn-primary" onClick={() => markDone(step.week)} style={{ fontSize: "0.78rem", padding: "5px 14px" }}>
                        Mark Done ✓
                      </button>
                    )}
                    {!step.done && !isCurrent && <Badge label="Locked" color="gray" />}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
