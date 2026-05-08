import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { Card, Badge, SectionHeader, Spinner } from "../components/UI";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [certs,    setCerts]    = useState([]);
  const [tab,      setTab]      = useState("projects");
  const [loading,  setLoading]  = useState(true);
  const [desc,     setDesc]     = useState("");
  const [generated,setGenerated]= useState("");
  const [genLoading,setGL]      = useState(false);

  useEffect(() => {
    Promise.allSettled([
      api.recommendations.projects(),
      api.recommendations.certifications(),
    ]).then(([p, c]) => {
      if (p.status === "fulfilled") setProjects(p.value);
      if (c.status === "fulfilled") setCerts(c.value);
    }).finally(() => setLoading(false));
  }, []);

  const generateDesc = async () => {
    if (!desc.trim()) return;
    setGL(true); setGenerated("");
    try {
      // Uses the chat endpoint with a specific prompt
      const res = await api.chat.send(
        `Generate ONE professional resume bullet point for this project. Start with an action verb, include tech stack, add a measurable metric if possible. Project: "${desc}". Respond with ONLY the bullet point.`,
        []
      );
      setGenerated(res.reply);
    } catch (e) { setGenerated("Error generating. Try again."); }
    finally { setGL(false); }
  };

  const levelColor = l => l === "Advanced" ? "red" : l === "Intermediate" ? "amber" : "cyan";

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--text3)", padding: 40 }}>
      <Spinner size={22} /> Loading recommendations...
    </div>
  );

  return (
    <div className="fade-up">
      <SectionHeader title="Projects & Certifications" sub="Tailored to fill your specific skill gaps" />

      <div style={{ display: "flex", gap: 4, background: "var(--bg3)", padding: 4, borderRadius: 10, width: "fit-content", marginBottom: 20 }}>
        {[["projects", "Projects"], ["certs", "Certifications"], ["generator", "Description Generator"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} style={{
            padding: "6px 16px", borderRadius: 7, fontSize: "0.83rem", fontWeight: 500,
            background: tab === v ? "var(--cyan)" : "transparent",
            color: tab === v ? "#020810" : "var(--text3)", border: "none", transition: "all .15s",
          }}>{l}</button>
        ))}
      </div>

      {tab === "projects" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {projects.map((p, i) => (
            <Card key={p.id || i}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)" }}>{p.title}</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text3)", marginTop: 3 }}>🛠 {p.skills} · ⏱ {p.time}</div>
                </div>
                <Badge label={p.level} color={levelColor(p.level)} />
              </div>
              {p.fills?.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--text3)", fontFamily: "var(--font-mono)" }}>FILLS GAPS:</span>
                  {p.fills.map(f => <Badge key={f} label={f} color="teal" style={{ background: "var(--teal-dim, rgba(46,168,160,.12))", color: "var(--teal, #2ea8a0)", border: "1px solid rgba(46,168,160,.3)" }} />)}
                </div>
              )}
              {p.relevant && (
                <div style={{ marginTop: 8, fontSize: "0.75rem", color: "var(--green)", display: "flex", alignItems: "center", gap: 4 }}>
                  ◆ Recommended — fills your current gaps
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab === "certs" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
          {certs.map((c, i) => (
            <Card key={c.id || i}>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{c.title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                {[["Platform", c.platform], ["Cost", c.cost], ["Duration", c.duration], ["Covers", c.skill]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                    <span style={{ color: "var(--text3)", fontFamily: "var(--font-mono)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: ".05em" }}>{k}</span>
                    <span style={{ color: "var(--text2)" }}>{v}</span>
                  </div>
                ))}
              </div>
              {c.url && (
                <a href={c.url} target="_blank" rel="noreferrer" className="btn-ghost"
                  style={{ display: "inline-block", fontSize: "0.78rem", padding: "5px 14px" }}>
                  View Course →
                </a>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab === "generator" && (
        <Card style={{ borderColor: "var(--purple-dim, rgba(167,139,250,.2))" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--purple)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14 }}>AI Resume Description Generator</div>
          <p style={{ marginBottom: 14, fontSize: "0.88rem" }}>
            Type what you built in plain language — AI turns it into a professional resume bullet point with tech stack and measurable impact.
          </p>
          <label style={{ fontSize: "0.72rem", color: "var(--text3)", fontFamily: "var(--font-mono)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".07em" }}>
            Describe your project
          </label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4}
            placeholder="e.g. Movie recommendation system using Python and collaborative filtering that suggests films based on what similar users liked"
            style={{ resize: "vertical", marginBottom: 12 }}
          />
          <button className="btn-primary" onClick={generateDesc} disabled={genLoading || !desc.trim()}
            style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {genLoading ? <><Spinner size={15} /> Generating...</> : "Generate Bullet Point →"}
          </button>
          {generated && (
            <div className="fade-up" style={{ marginTop: 16, padding: 14, background: "var(--bg3)", borderRadius: 10, borderLeft: "3px solid var(--purple)" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--purple)", fontFamily: "var(--font-mono)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".08em" }}>Generated Bullet Point</div>
              <p style={{ margin: 0, color: "var(--text)", lineHeight: 1.7, fontSize: "0.9rem" }}>{generated}</p>
              <button onClick={() => navigator.clipboard.writeText(generated)}
                style={{ marginTop: 10, background: "transparent", color: "var(--purple)", fontSize: "0.75rem", padding: "3px 10px", borderRadius: 6, border: "1px solid var(--purple-dim, rgba(167,139,250,.3))" }}>
                Copy →
              </button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
