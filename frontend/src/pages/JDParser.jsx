import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import { Card, Badge, ProgressBar, SectionHeader, Spinner } from "../components/UI";

export default function JDParser() {
  const [jd,      setJd]      = useState("");
  const [result,  setResult]  = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab,     setTab]     = useState("parse");

  useEffect(() => {
    api.jd.history().then(setHistory).catch(() => {});
  }, []);

  const parse = async () => {
    if (!jd.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await api.jd.parse({ jd_text: jd });
      setResult(res);
      api.jd.history().then(setHistory).catch(() => {});
    } catch (e) {
      setResult({ error: e.message });
    } finally { setLoading(false); }
  };

  const matchColor = pct => pct >= 75 ? "var(--green)" : pct >= 50 ? "var(--amber)" : "var(--red)";

  return (
    <div className="fade-up">
      <SectionHeader
        title="Job Description Parser"
        sub="Paste any JD — get instant personalized skill match analysis"
      />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "var(--bg3)", padding: 4, borderRadius: 10, width: "fit-content", marginBottom: 20 }}>
        {["parse", "history"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "6px 18px", borderRadius: 7, fontSize: "0.83rem", fontWeight: 500,
              background: tab === t ? "var(--cyan)" : "transparent",
              color: tab === t ? "#020810" : "var(--text3)", border: "none", transition: "all .15s", textTransform: "capitalize" }}>
            {t} {t === "history" && history.length > 0 && `(${history.length})`}
          </button>
        ))}
      </div>

      {tab === "parse" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <label style={{ fontSize: "0.72rem", color: "var(--text3)", fontFamily: "var(--font-mono)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".08em" }}>
              Paste Job Description
            </label>
            <textarea value={jd} onChange={e => setJd(e.target.value)} rows={9}
              placeholder={"We are looking for a Backend Developer with experience in Node.js, Docker, MongoDB...\n\nPaste the full job description here and we'll instantly show how well your skills match."}
              style={{ resize: "vertical" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text3)", fontFamily: "var(--font-mono)" }}>
                {jd.length} / 5000 chars
              </span>
              <button className="btn-primary" onClick={parse} disabled={loading || !jd.trim()}
                style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {loading ? <><Spinner size={15} /> Analyzing...</> : "Analyze JD →"}
              </button>
            </div>
          </Card>

          {result?.error && (
            <div style={{ background: "var(--red-dim)", border: "1px solid rgba(248,113,113,.3)", borderRadius: 10, padding: "10px 16px", color: "var(--red)", fontSize: "0.88rem" }}>
              {result.error}
            </div>
          )}

          {result && !result.error && (
            <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Match score */}
              <Card style={{ textAlign: "center", padding: "28px 20px", borderColor: matchColor(result.match_percent) + "55" }}>
                <div style={{ fontSize: "3rem", fontWeight: 800, fontFamily: "var(--font-display)", color: matchColor(result.match_percent), lineHeight: 1 }}>
                  {result.match_percent}%
                </div>
                <div style={{ fontSize: "0.9rem", color: "var(--text2)", marginTop: 6 }}>
                  Match for <strong style={{ color: "var(--text)" }}>{result.role}</strong>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text3)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
                  {result.experience_level} level · {result.matched_skills?.length} of {result.required_skills?.length} required skills
                </div>
                <div style={{ maxWidth: 380, margin: "14px auto 0", height: 8, background: "var(--bg4)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${result.match_percent}%`, background: matchColor(result.match_percent), borderRadius: 99, transition: "width 1s ease" }} />
                </div>
              </Card>

              {/* Skills breakdown */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                <Card>
                  <div style={{ fontSize: "0.7rem", color: "var(--green)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>You Have ✓</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {result.matched_skills?.length ? result.matched_skills.map(s => <Badge key={s} label={s} color="green" />) : <span style={{ fontSize: "0.83rem", color: "var(--text3)" }}>None matched</span>}
                  </div>
                </Card>
                <Card>
                  <div style={{ fontSize: "0.7rem", color: "var(--red)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>Missing Skills</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {result.missing_skills?.length ? result.missing_skills.map(s => <Badge key={s} label={s} color="red" />) : <span style={{ fontSize: "0.83rem", color: "var(--text3)" }}>All matched!</span>}
                  </div>
                </Card>
              </div>

              {result.nice_to_have?.length > 0 && (
                <Card>
                  <div style={{ fontSize: "0.7rem", color: "var(--amber)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>Nice to Have</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {result.nice_to_have.map(s => <Badge key={s} label={s} color="amber" />)}
                  </div>
                </Card>
              )}

              {result.explanation && (
                <Card style={{ borderColor: "var(--cyan-dim)" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--cyan)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>AI Explanation</div>
                  <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.7 }}>{result.explanation}</p>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text3)" }}>
              No JD analyses yet. Parse your first job description above.
            </div>
          ) : history.map((h, i) => (
            <Card key={h.id || i}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text)" }}>{h.result?.role || "Role"}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text3)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
                    {new Date(h.analyzed_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, fontFamily: "var(--font-display)", color: matchColor(h.result?.match_percent ?? 0) }}>
                    {h.result?.match_percent ?? 0}%
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text3)", fontFamily: "var(--font-mono)" }}>match</div>
                </div>
              </div>
              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 5 }}>
                {h.result?.matched_skills?.slice(0, 5).map(s => <Badge key={s} label={s} color="green" />)}
                {h.result?.missing_skills?.slice(0, 3).map(s => <Badge key={s} label={s} color="red" />)}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
