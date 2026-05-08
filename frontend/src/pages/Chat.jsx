import React, { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../api/client";
import { Spinner } from "../components/UI";
import { useAuth } from "../context/AuthContext";

const QUICK = ["What should I learn first?", "Am I ready to apply for internships?", "Review my skill gaps", "Give me a 30-day plan", "What projects should I build?"];

export default function Chat() {
  const { user }             = useAuth();
  const [msgs, setMsgs]      = useState([]);
  const [input, setInput]    = useState("");
  const [loading, setLoading]= useState(false);
  const [histLoading, setHL] = useState(true);
  const bottomRef            = useRef(null);

  useEffect(() => {
    api.chat.history().then(d => {
      if (d?.messages?.length) setMsgs(d.messages);
      else setMsgs([{ role: "assistant", content: `Hi ${user?.name?.split(" ")[0] || "there"}! I'm your AI Career Advisor. I have your full profile loaded. How can I help you today?` }]);
    }).catch(() => {
      setMsgs([{ role: "assistant", content: "Hi! I'm your AI Career Advisor. How can I help?" }]);
    }).finally(() => setHL(false));
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    const userMsg = { role: "user", content: msg };
    setMsgs(p => [...p, userMsg]);
    setLoading(true);
    try {
      const history = msgs.filter(m => m.role && m.content).slice(-20);
      const res     = await api.chat.send(msg, history);
      setMsgs(p => [...p, { role: "assistant", content: res.reply }]);
    } catch {
      setMsgs(p => [...p, { role: "assistant", content: "Connection error. Please try again." }]);
    } finally { setLoading(false); }
  }, [msgs, input, loading]);

  const handleKey = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 80px)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ color: "var(--text)", marginBottom: 2 }}>AI Career Advisor</h2>
          <p style={{ margin: 0, fontSize: "0.83rem" }}>Context-aware advice based on your real profile data</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem", color: "var(--green)" }}>
          <span className="dot-live" /> Live · Profile loaded
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12,
        padding: "4px 0", marginBottom: 12,
      }}>
        {histLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text3)", padding: 20 }}><Spinner size={16} /> Loading history...</div>
        ) : (
          msgs.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              {m.role === "assistant" && (
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, var(--cyan), var(--green))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#020810", flexShrink: 0, marginRight: 8, marginTop: 4 }}>S</div>
              )}
              <div className={m.role === "user" ? "bubble-user" : "bubble-ai"}>
                {m.role === "assistant" && <div style={{ fontSize: "0.65rem", color: "var(--cyan)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>AI Advisor</div>}
                <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, var(--cyan), var(--green))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#020810" }}>S</div>
            <div className="bubble-ai" style={{ display: "flex", gap: 5, alignItems: "center", padding: "12px 16px" }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--cyan)", animation: `pulse 1.2s infinite ${i * 0.2}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {QUICK.map(q => (
          <button key={q} onClick={() => send(q)} style={{ fontSize: "0.75rem", padding: "4px 11px", borderRadius: 99, background: "var(--bg3)", color: "var(--text3)", border: "1px solid var(--border)", whiteSpace: "nowrap", transition: "all .12s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)";  e.currentTarget.style.color = "var(--text3)"; }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 10 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="Ask anything about your career path..." style={{ flex: 1 }} disabled={loading} />
        <button className="btn-primary" onClick={() => send()} disabled={loading || !input.trim()} style={{ padding: "10px 18px", flexShrink: 0 }}>
          {loading ? <Spinner size={16} /> : "Send →"}
        </button>
      </div>
    </div>
  );
}
