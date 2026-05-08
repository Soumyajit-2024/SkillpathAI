import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { Spinner } from "../components/UI";

const ROLES = ["Backend Developer","Full Stack Developer","Data Scientist","DevOps Engineer","AI Engineer","Frontend Developer","Mobile Developer","Blockchain Developer"];
const INTERESTS = ["Web Development","Machine Learning","Cloud Computing","DevOps","Data Science","Cybersecurity","Mobile Development","Blockchain","System Design","Open Source"];
const SKILL_SUGGESTIONS = ["Python","JavaScript","React","Node.js","SQL","MongoDB","Docker","Git","Java","AWS","Machine Learning","TypeScript","Go","Kubernetes"];

export default function Setup() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [data,    setData]    = useState({
    target_role: "", career_interests: [], skills: [],
    academic: { college: "", cgpa: "", degree: "", year: "" },
    github_url: "", portfolio_url: "",
  });

  const TOTAL = 4;

  const addSkill = name => {
    if (!data.skills.find(s => s.name === name)) {
      setData(p => ({ ...p, skills: [...p.skills, { name, level: 50, source: "manual", verified: "unverified" }] }));
    }
  };
  const removeSkill = name => setData(p => ({ ...p, skills: p.skills.filter(s => s.name !== name) }));
  const toggleInterest = i => setData(p => ({
    ...p,
    career_interests: p.career_interests.includes(i)
      ? p.career_interests.filter(x => x !== i)
      : [...p.career_interests, i],
  }));

  const finish = async () => {
    setLoading(true);
    try {
      await api.profile.update({
        target_role:      data.target_role,
        career_interests: data.career_interests,
        skills:           data.skills,
        academic: {
          college: data.academic.college,
          degree:  data.academic.degree,
          cgpa:    data.academic.cgpa ? parseFloat(data.academic.cgpa) : null,
          year:    data.academic.year ? parseInt(data.academic.year)   : null,
        },
        github_url:    data.github_url    || null,
        portfolio_url: data.portfolio_url || null,
      });
      await refreshUser();
      navigate("/dashboard");
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  const s = { display: "flex", flexDirection: "column", gap: 14 };
  const label = txt => <label style={{ fontSize: ".68rem", color: "var(--t3)", fontFamily: "'DM Mono',monospace", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".07em" }}>{txt}</label>;

  return (
    <div className="auth-wrap bg-grid" style={{ alignItems: "flex-start", paddingTop: 40 }}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div style={{ width: "100%", maxWidth: 520, position: "relative", zIndex: 1 }} className="fade-up">
        {/* Progress */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: ".75rem", color: "var(--t2)" }}>
            <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: "1rem" }}>Set up your profile</span>
            <span style={{ fontFamily: "'DM Mono',monospace", color: "var(--cyan)" }}>{step}/{TOTAL}</span>
          </div>
          <div style={{ height: 4, background: "var(--bg3)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(step / TOTAL) * 100}%`, background: "var(--cyan)", borderRadius: 99, transition: "width .4s ease" }} />
          </div>
        </div>

        <div className="card card-glow">
          {/* Step 1 — Target Role */}
          {step === 1 && (
            <div style={s}>
              <h2 style={{ marginBottom: 4 }}>What's your target role?</h2>
              <p style={{ margin: 0 }}>This drives all your skill gap analysis and recommendations.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginTop: 6 }}>
                {ROLES.map(r => (
                  <button key={r} onClick={() => setData(p => ({ ...p, target_role: r }))}
                    style={{ padding: "10px 12px", borderRadius: 9, fontSize: ".82rem", fontWeight: 500, textAlign: "left", cursor: "pointer", transition: "all .15s",
                      background: data.target_role === r ? "var(--cdim)" : "var(--bg3)",
                      border: `1px solid ${data.target_role === r ? "var(--cyan)" : "var(--border)"}`,
                      color: data.target_role === r ? "var(--cyan)" : "var(--t2)" }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Skills */}
          {step === 2 && (
            <div style={s}>
              <h2 style={{ marginBottom: 4 }}>Add your current skills</h2>
              <p style={{ margin: 0 }}>Select skills you already know. You can add more later or upload your resume.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {SKILL_SUGGESTIONS.map(sk => {
                  const added = data.skills.find(s => s.name === sk);
                  return (
                    <button key={sk} onClick={() => added ? removeSkill(sk) : addSkill(sk)}
                      style={{ padding: "6px 14px", borderRadius: 99, fontSize: ".8rem", fontWeight: 500, cursor: "pointer", transition: "all .15s",
                        background: added ? "var(--cdim)" : "var(--bg3)",
                        border: `1px solid ${added ? "var(--cyan)" : "var(--border)"}`,
                        color: added ? "var(--cyan)" : "var(--t2)" }}>
                      {added ? `✓ ${sk}` : sk}
                    </button>
                  );
                })}
              </div>
              <div>
                {label("Or type a skill and press Enter")}
                <input placeholder="e.g. Rust, Kotlin, Redis..." onKeyDown={e => { if (e.key === "Enter" && e.target.value.trim()) { addSkill(e.target.value.trim()); e.target.value = ""; } }} />
              </div>
              {data.skills.length > 0 && <p style={{ fontSize: ".78rem", color: "var(--green)", margin: 0 }}>✓ {data.skills.length} skills added</p>}
            </div>
          )}

          {/* Step 3 — Academic */}
          {step === 3 && (
            <div style={s}>
              <h2 style={{ marginBottom: 4 }}>Academic background</h2>
              <p style={{ margin: 0 }}>Helps us map your subjects to skills and calculate placement readiness.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[["college","College / University","Jadavpur University"],["degree","Degree","B.Tech CSE"],["cgpa","CGPA","8.5"],["year","Grad Year","2025"]].map(([k,l,ph]) => (
                  <div key={k}>
                    {label(l)}
                    <input value={data.academic[k]} placeholder={ph} onChange={e => setData(p => ({ ...p, academic: { ...p.academic, [k]: e.target.value } }))} />
                  </div>
                ))}
              </div>
              <div>
                {label("Interests (select all that apply)")}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                  {INTERESTS.map(i => {
                    const sel = data.career_interests.includes(i);
                    return <button key={i} onClick={() => toggleInterest(i)}
                      style={{ padding: "5px 12px", borderRadius: 99, fontSize: ".75rem", cursor: "pointer", transition: "all .15s",
                        background: sel ? "var(--gdim)" : "var(--bg3)",
                        border: `1px solid ${sel ? "rgba(74,222,128,.3)" : "var(--border)"}`,
                        color: sel ? "var(--green)" : "var(--t2)" }}>{i}</button>;
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Links */}
          {step === 4 && (
            <div style={s}>
              <h2 style={{ marginBottom: 4 }}>GitHub & Portfolio</h2>
              <p style={{ margin: 0 }}>We scan your GitHub repos to auto-detect skills and score your portfolio.</p>
              <div>
                {label("GitHub Profile URL")}
                <input value={data.github_url} placeholder="https://github.com/your-username" onChange={e => setData(p => ({ ...p, github_url: e.target.value }))} />
              </div>
              <div>
                {label("Portfolio / Personal Website (optional)")}
                <input value={data.portfolio_url} placeholder="https://yoursite.com" onChange={e => setData(p => ({ ...p, portfolio_url: e.target.value }))} />
              </div>
              <div style={{ background: "var(--gdim)", border: "1px solid rgba(74,222,128,.3)", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: ".78rem", color: "var(--green)", fontWeight: 600, marginBottom: 4 }}>✓ You're all set!</div>
                <div style={{ fontSize: ".75rem", color: "var(--t2)" }}>
                  Target: <strong>{data.target_role || "Not set"}</strong> ·
                  Skills: <strong>{data.skills.length}</strong> ·
                  GitHub: <strong>{data.github_url ? "Added" : "Skipped"}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Nav */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
            {step > 1
              ? <button className="btn-ghost" onClick={() => setStep(s => s - 1)}>← Back</button>
              : <div />}
            {step < TOTAL
              ? <button className="btn-primary" onClick={() => setStep(s => s + 1)} disabled={step === 1 && !data.target_role}>
                  Next →
                </button>
              : <button className="btn-primary" onClick={finish} disabled={loading}>
                  {loading ? <><Spinner size={15} /> Saving...</> : "Go to Dashboard →"}
                </button>}
          </div>
          {step === 1 && <button onClick={() => navigate("/dashboard")} style={{ width: "100%", marginTop: 10, background: "transparent", color: "var(--t3)", fontSize: ".78rem", padding: "6px 0" }}>Skip for now</button>}
        </div>
      </div>
    </div>
  );
}
