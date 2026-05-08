import React, { useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Card, Badge, SectionHeader, Spinner } from "../components/UI";

const ROLES = ["Backend Developer", "Full Stack Developer", "Data Scientist", "DevOps Engineer", "AI Engineer"];

export default function Interview() {
  const { user }              = useAuth();
  const [role,      setRole]  = useState(user?.target_role || "Backend Developer");
  const [questions, setQs]    = useState([]);
  const [stage,     setStage] = useState("setup");   // setup | question | feedback | done
  const [qIndex,    setQIdx]  = useState(0);
  const [answer,    setAnswer]= useState("");
  const [feedback,  setFB]    = useState(null);
  const [loading,   setLoading]= useState(false);
  const [scores,    setScores] = useState([]);

  const start = async () => {
    setLoading(true);
    try {
      const res = await api.interview.questions(role);
      setQs(res.questions || []);
      setQIdx(0); setScores([]); setStage("question");
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  const submit = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    try {
      const res = await api.interview.evaluate({ question: questions[qIndex].question, answer, role });
      setFB(res); setScores(p => [...p, res.score]);
      setStage("feedback");
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  const next = () => {
    if (qIndex < questions.length - 1) {
      setQIdx(i => i + 1); setAnswer(""); setFB(null); setStage("question");
    } else {
      setStage("done");
    }
  };

  const catColor = c => c === "technical" ? "cyan" : c === "system_design" ? "purple" : "amber";
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return (
    <div className="fade-up">
      <SectionHeader title="Interview Simulation" sub="AI evaluates your answers like a real interviewer" />

      {stage === "setup" && (
        <Card style={{ maxWidth: 480, textAlign: "center", padding: "36px 28px", margin: "0 auto" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
          <h3 style={{ color: "var(--text)", marginBottom: 8 }}>Ready to interview?</h3>
          <p style={{ marginBottom: 20 }}>
            5 questions for your target role. Answer naturally — AI evaluates concepts, not word-for-word matching.
          </p>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: "0.72rem", color: "var(--text3)", fontFamily: "var(--font-mono)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".07em" }}>
              Select Role
            </label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={start} disabled={loading}
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            {loading ? <><Spinner size={16} /> Loading...</> : "Start Interview →"}
          </button>
        </Card>
      )}

      {(stage === "question" || stage === "feedback") && questions[qIndex] && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 680 }}>
          {/* Progress */}
          <div style={{ display: "flex", gap: 6 }}>
            {questions.map((_, i) => (
              <div key={i} style={{
                height: 4, flex: 1, borderRadius: 99,
                background: i < qIndex ? "var(--green)" : i === qIndex ? "var(--cyan)" : "var(--bg4)",
                transition: "background .3s",
              }} />
            ))}
          </div>

          {/* Question */}
          <Card style={{ borderColor: "var(--cyan-dim)" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <Badge label={`Q${qIndex + 1}/${questions.length}`} color="cyan" />
              <Badge label={questions[qIndex].category?.replace("_", " ")} color={catColor(questions[qIndex].category)} />
            </div>
            <p style={{ margin: 0, fontSize: "1rem", color: "var(--text)", lineHeight: 1.7, fontWeight: 500 }}>
              {questions[qIndex].question}
            </p>
          </Card>

          {stage === "question" && (
            <>
              <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={8}
                placeholder="Type your answer here. Explain your reasoning — be as detailed as you would in a real interview..."
                style={{ resize: "vertical" }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-primary" onClick={submit} disabled={loading || !answer.trim()}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {loading ? <><Spinner size={15} /> Evaluating...</> : "Submit Answer →"}
                </button>
                <button className="btn-ghost" onClick={next} style={{ fontSize: "0.83rem" }}>Skip</button>
              </div>
            </>
          )}

          {stage === "feedback" && feedback && (
            <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Score */}
              <Card style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ textAlign: "center", minWidth: 80 }}>
                  <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-display)", color: feedback.score >= 7 ? "var(--green)" : feedback.score >= 5 ? "var(--amber)" : "var(--red)" }}>
                    {feedback.score}/10
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text3)", fontFamily: "var(--font-mono)" }}>SCORE</div>
                </div>
                <div style={{ flex: 1, fontSize: "0.85rem", color: "var(--text2)" }}>{feedback.suggestion}</div>
              </Card>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Card>
                  <div style={{ fontSize: "0.7rem", color: "var(--green)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>What you got right</div>
                  {feedback.correct_points?.map((p, i) => (
                    <div key={i} style={{ fontSize: "0.83rem", color: "var(--text2)", padding: "3px 0", display: "flex", gap: 6 }}>
                      <span style={{ color: "var(--green)", flexShrink: 0 }}>✓</span>{p}
                    </div>
                  ))}
                </Card>
                <Card>
                  <div style={{ fontSize: "0.7rem", color: "var(--red)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>What was missing</div>
                  {feedback.missing_points?.map((p, i) => (
                    <div key={i} style={{ fontSize: "0.83rem", color: "var(--text2)", padding: "3px 0", display: "flex", gap: 6 }}>
                      <span style={{ color: "var(--red)", flexShrink: 0 }}>→</span>{p}
                    </div>
                  ))}
                </Card>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-primary" onClick={next}>
                  {qIndex < questions.length - 1 ? "Next Question →" : "See Results →"}
                </button>
                <button className="btn-ghost" onClick={() => { setAnswer(""); setFB(null); setStage("question"); }} style={{ fontSize: "0.83rem" }}>
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {stage === "done" && (
        <Card style={{ maxWidth: 480, textAlign: "center", padding: "36px 28px", margin: "0 auto" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, fontFamily: "var(--font-display)", color: avgScore >= 7 ? "var(--green)" : avgScore >= 5 ? "var(--amber)" : "var(--red)", marginBottom: 8 }}>
            {avgScore}/10
          </div>
          <h3 style={{ color: "var(--text)", marginBottom: 8 }}>Interview Complete</h3>
          <p style={{ marginBottom: 8 }}>Average score across {scores.length} questions</p>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
            {scores.map((s, i) => (
              <div key={i} style={{ textAlign: "center", padding: "8px 12px", background: "var(--bg3)", borderRadius: 8, minWidth: 50 }}>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: s >= 7 ? "var(--green)" : s >= 5 ? "var(--amber)" : "var(--red)" }}>{s}</div>
                <div style={{ fontSize: "0.65rem", color: "var(--text3)", fontFamily: "var(--font-mono)" }}>Q{i + 1}</div>
              </div>
            ))}
          </div>
          <button className="btn-primary" onClick={() => { setStage("setup"); setScores([]); setQs([]); }}>
            Try Again →
          </button>
        </Card>
      )}
    </div>
  );
}
