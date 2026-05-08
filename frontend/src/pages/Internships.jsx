import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { Card, Badge, ProgressBar, SectionHeader, Spinner } from "../components/UI";

export default function Internships() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");

  useEffect(() => {
    api.recommendations.internships().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? data : data.filter(i => i.type.toLowerCase() === filter);
  const matchColor = p => p >= 75 ? "var(--green)" : p >= 55 ? "var(--amber)" : "var(--red)";

  const feedback = async (id, helpful) => {
    await api.recommendations.feedback({ item_type: "internship", item_id: id, helpful });
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--text3)", padding: 40 }}>
      <Spinner size={22} /> Finding matching internships...
    </div>
  );

  return (
    <div className="fade-up">
      <SectionHeader title="Internship Recommendations" sub="Ranked by your current skill match percentage" />

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {[["all", "All"], ["remote", "Remote"], ["hybrid", "Hybrid"], ["on-site", "On-site"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{
            padding: "6px 16px", borderRadius: 8, fontSize: "0.83rem",
            background: filter === v ? "var(--cyan)" : "var(--bg3)",
            color: filter === v ? "#020810" : "var(--text3)",
            border: "none", fontWeight: filter === v ? 600 : 400, transition: "all .15s",
          }}>{l}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <p>No internships found for this filter.</p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map((item, i) => (
            <Card key={item.id || i} style={{ borderLeft: `3px solid ${matchColor(item.match)}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)" }}>{item.title}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text2)", marginTop: 3 }}>
                    {item.company} · {item.type} · {item.stipend}
                  </div>
                </div>
                <div style={{ textAlign: "center", minWidth: 60 }}>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, fontFamily: "var(--font-display)", color: matchColor(item.match), lineHeight: 1 }}>
                    {item.match}%
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text3)", fontFamily: "var(--font-mono)" }}>MATCH</div>
                </div>
              </div>

              <ProgressBar value={item.match} color={matchColor(item.match)} height={4} />

              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text3)", fontFamily: "var(--font-mono)" }}>SKILLS:</span>
                {item.skills?.map(s => (
                  <Badge key={s} label={s} color={item.matched_skills?.includes(s) ? "green" : "red"} />
                ))}
              </div>

              {item.reason && (
                <div style={{ marginTop: 10, padding: "8px 12px", background: "var(--bg3)", borderRadius: 8, fontSize: "0.8rem", color: "var(--text3)", borderLeft: "2px solid var(--border2)" }}>
                  💡 {item.reason}
                </div>
              )}

              <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
                <button className="btn-primary" style={{ fontSize: "0.78rem", padding: "5px 14px" }}>Apply Now →</button>
                <span style={{ fontSize: "0.75rem", color: "var(--text3)" }}>Helpful?</span>
                <button onClick={() => feedback(item.id, true)}  style={{ background: "var(--green-dim)", border: "1px solid rgba(74,222,128,.3)", color: "var(--green)", padding: "3px 10px", borderRadius: 6, fontSize: "0.78rem" }}>👍</button>
                <button onClick={() => feedback(item.id, false)} style={{ background: "var(--red-dim)",   border: "1px solid rgba(248,113,113,.3)", color: "var(--red)",   padding: "3px 10px", borderRadius: 6, fontSize: "0.78rem" }}>👎</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
