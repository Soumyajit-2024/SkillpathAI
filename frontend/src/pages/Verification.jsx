import React, { useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Card, Badge, SectionHeader, Spinner } from "../components/UI";

const COMMON_SKILLS = ["Python", "JavaScript", "React", "Node.js", "SQL", "MongoDB", "Docker", "Machine Learning", "REST APIs", "Git", "AWS", "System Design"];

export default function Verification() {
  const { user, refreshUser } = useAuth();
  const [skill,     setSkill]    = useState("");
  const [custom,    setCustom]   = useState("");
  const [questions, setQs]       = useState([]);
  const [answers,   setAnswers]  = useState({});
  const [result,    setResult]   = useState(null);
  const [stage,     setStage]    = useState("select");  // select | quiz | result
  const [loading,   setLoading]  = useState(false);

  const startQuiz = async (sk) => {
    const target = sk || custom.trim();
    if (!target) return;
    setSkill(target); setLoading(true); setQs([]); setAnswers({}); setResult(null);
    try {
      const res = await api.verify.questions(target);
      setQs(res.questions || []);
      setStage("quiz");
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  const submit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all questions before submitting."); return;
    }
    setLoading(true);
    try {
      const res = await api.verify.submit({ skill, answers });
      setResult(res);
      setStage("result");
      if (res.passed) await refreshUser();
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  const verifiedList = user?.verified_skills || [];

  return (
    <div className="fade-up">
      <SectionHeader
        title="Skill Verification"
        sub="Take a 5-question quiz to earn a verified badge on your profile"
        action={<Badge label={`${verifiedList.length} verified`} color="green" />}
      />

      {/* Already verified */}
      {verifiedList.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontSize: "0.72rem", color: "var(--green)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>
            Verified Skills
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {verifiedList.map(s => <Badge key={s} label={`✓ ${s}`} color="green" />)}
          </div>
        </Card>
      )}

      {stage === "select" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <div style={{ fontSize: "0.75rem", color: "var(--text3)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>
              Quick Select
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {COMMON_SKILLS.map(s => {
                const done = verifiedList.includes(s);
                return (
                  <button key={s} onClick={() => !done && startQuiz(s)} disabled={loading || done}
                    style={{
                      padding: "7px 16px", borderRadius: 99, fontSize: "0.83rem", fontWeight: 500,
                      background: done ? "var(--green-dim)" : "var(--bg3)",
                      color: done ? "var(--green)" : "var(--text2)",
                      border: `1px solid ${done ? "rgba(74,222,128,.3)" : "var(--border)"}`,
                      cursor: done ? "default" : "pointer", transition: "all .15s",
                    }}
                    onMouseEnter={e => { if (!done) { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--text)"; }}}
                    onMouseLeave={e => { if (!done) { e.currentTarget.style.borderColor = "var(--border)";  e.currentTarget.style.color = "var(--text2)"; }}}
                  >
                    {done ? `✓ ${s}` : s}
                  </button>
                );
              })}
            </div>
          </Card>
          <Card>
            <div style={{ fontSize: "0.75rem", color: "var(--text3)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>
              Or type any skill
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <input value={custom} onChange={e => setCustom(e.target.value)} placeholder="e.g. Kubernetes, Redis, TypeScript..." onKeyDown={e => e.key === "Enter" && startQuiz()} />
              <button className="btn-primary" onClick={() => startQuiz()} disabled={loading || !custom.trim()}
                style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
                {loading ? <Spinner size={15} /> : "Start Quiz →"}
              </button>
            </div>
          </Card>
        </div>
      )}

      {stage === "quiz" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 640 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ fontSize: "0.85rem", color: "var(--text2)" }}>
              Verifying: <strong style={{ color: "var(--cyan)" }}>{skill}</strong>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text3)", fontFamily: "var(--font-mono)" }}>
              {Object.keys(answers).length}/{questions.length} answered
            </div>
          </div>

          {questions.map((q, qi) => (
            <Card key={q.id}>
              <div style={{ fontSize: "0.75rem", color: "var(--text3)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>Q{qi + 1}</div>
              <p style={{ margin: "0 0 14px", color: "var(--text)", fontWeight: 500, lineHeight: 1.6 }}>{q.question}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {q.options?.map((opt, oi) => {
                  const selected = answers[q.id] === oi;
                  return (
                    <button key={oi} onClick={() => setAnswers(p => ({ ...p, [q.id]: oi }))}
                      style={{
                        padding: "10px 14px", borderRadius: 8, textAlign: "left", fontSize: "0.87rem",
                        background: selected ? "var(--cyan-dim)" : "var(--bg3)",
                        color: selected ? "var(--cyan)" : "var(--text2)",
                        border: `1px solid ${selected ? "var(--cyan)" : "var(--border)"}`,
                        transition: "all .15s", fontWeight: selected ? 600 : 400,
                      }}>
                      <span style={{ fontFamily: "var(--font-mono)", color: selected ? "var(--cyan)" : "var(--text3)", marginRight: 8, fontSize: "0.78rem" }}>
                        {String.fromCharCode(65 + oi)}.
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </Card>
          ))}

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-primary" onClick={submit}
              disabled={loading || Object.keys(answers).length < questions.length}
              style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {loading ? <><Spinner size={15} /> Submitting...</> : "Submit Answers →"}
            </button>
            <button className="btn-ghost" onClick={() => setStage("select")} style={{ fontSize: "0.83rem" }}>Cancel</button>
          </div>
        </div>
      )}

      {stage === "result" && result && (
        <Card style={{
          maxWidth: 460, margin: "0 auto", textAlign: "center", padding: "36px 28px",
          borderColor: result.passed ? "rgba(74,222,128,.4)" : "rgba(248,113,113,.3)",
        }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>{result.passed ? "✅" : "❌"}</div>
          <h3 style={{ color: result.passed ? "var(--green)" : "var(--red)", marginBottom: 8 }}>
            {result.passed ? `${skill} Verified!` : "Not Yet Verified"}
          </h3>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, fontFamily: "var(--font-display)", color: result.passed ? "var(--green)" : "var(--red)", marginBottom: 4 }}>
            {result.score}/{result.total}
          </div>
          <div style={{ fontSize: "0.83rem", color: "var(--text3)", marginBottom: 6 }}>{result.percent}% correct</div>
          <p style={{ fontSize: "0.88rem", marginBottom: 20 }}>{result.message}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {!result.passed && (
              <button className="btn-primary" onClick={() => startQuiz(skill)}>Try Again →</button>
            )}
            <button className="btn-ghost" onClick={() => setStage("select")}>Verify Another Skill</button>
          </div>
        </Card>
      )}
    </div>
  );
}
