import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, Badge, Spinner, SectionHeader } from "../components/UI";

export default function Settings() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [status,    setStatus]  = useState(null);
  const [testing,   setTesting] = useState(false);
  const [saving,    setSaving]  = useState(false);
  const [testResult,setTestRes] = useState(null);
  const [msg,       setMsg]     = useState({ text:"", type:"" });

  const [form, setForm] = useState({
    anthropic_api_key: "",
    github_token:      "",
    cloudinary_url:    "",
    sendgrid_api_key:  "",
    allowed_origins:   "",
  });

  useEffect(() => {
    if (!isAdmin) { navigate("/dashboard"); return; }
    loadStatus();
  }, [isAdmin]);

  const loadStatus = async () => {
    try {
      const s = await api.config.status();
      setStatus(s);
    } catch (e) {
      showMsg("Failed to load config status: " + e.message, "error");
    }
  };

  const testKey = async () => {
    setTesting(true); setTestRes(null);
    try {
      const r = await api.config.testKey();
      setTestRes(r);
    } catch (e) {
      setTestRes({ valid: false, error: e.message });
    } finally {
      setTesting(false);
    }
  };

  const saveKeys = async () => {
    const payload = Object.fromEntries(
      Object.entries(form).filter(([_, v]) => v.trim() !== "")
    );
    if (Object.keys(payload).length === 0) {
      showMsg("Enter at least one key to update", "error"); return;
    }
    if (payload.anthropic_api_key && !payload.anthropic_api_key.startsWith("sk-ant-")) {
      showMsg("Anthropic API key must start with sk-ant-", "error"); return;
    }
    setSaving(true);
    try {
      const r = await api.config.update(payload);
      showMsg(`✅ ${r.message}`, "success");
      setForm({ anthropic_api_key:"", github_token:"", cloudinary_url:"", sendgrid_api_key:"", allowed_origins:"" });
      setTimeout(loadStatus, 800);
    } catch (e) {
      showMsg("❌ " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const showMsg = (text, type="success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text:"", type:"" }), 6000);
  };

  const StatusDot = ({ ok }) => (
    <span style={{
      display:"inline-block", width:9, height:9, borderRadius:"50%",
      background: ok ? "var(--green,#4ade80)" : "var(--red,#f87171)",
      marginRight:7, flexShrink:0,
    }}/>
  );

  const Field = ({ label, name, placeholder, type="text", hint }) => (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:".68rem", color:"var(--t3,#4a6b8a)", display:"block", marginBottom:5,
        textTransform:"uppercase", letterSpacing:".07em", fontFamily:"monospace" }}>
        {label}
      </label>
      <input
        type={type}
        value={form[name]}
        placeholder={placeholder}
        onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
        style={{ fontFamily:"monospace", fontSize:".83rem" }}
      />
      {hint && <p style={{ margin:"4px 0 0", fontSize:".72rem", color:"var(--t3,#4a6b8a)" }}>{hint}</p>}
    </div>
  );

  return (
    <div className="fade-up">
      <SectionHeader
        title="API Key Settings"
        sub="Manage backend API keys and service connections"
        action={<Badge label="Admin Only" color="amber" />}
      />

      {msg.text && (
        <div style={{
          marginBottom:16, padding:"10px 16px", borderRadius:10, fontSize:".85rem",
          background: msg.type==="error" ? "var(--rdim,rgba(248,113,113,.1))" : "var(--gdim,rgba(74,222,128,.1))",
          border: `1px solid ${msg.type==="error" ? "rgba(248,113,113,.3)" : "rgba(74,222,128,.3)"}`,
          color: msg.type==="error" ? "var(--red,#f87171)" : "var(--green,#4ade80)",
        }}>
          {msg.text}
        </div>
      )}

      {/* Current Status */}
      <Card style={{ marginBottom:20 }}>
        <div style={{ fontSize:".65rem", color:"var(--t3)", fontFamily:"monospace",
          textTransform:"uppercase", letterSpacing:".08em", marginBottom:14 }}>
          Current Configuration Status
        </div>
        {status ? (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { key:"Anthropic API Key (REQUIRED)", ok:status.anthropic?.configured, val:status.anthropic?.masked, critical:true },
              { key:"GitHub Token (optional)",       ok:status.github?.configured,    val:status.github?.masked },
              { key:"Cloudinary (optional)",          ok:status.cloudinary?.configured, val:status.cloudinary?.masked },
              { key:"SendGrid Email (optional)",      ok:status.sendgrid?.configured,  val:status.sendgrid?.masked },
            ].map(({ key, ok, val, critical }) => (
              <div key={key} style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <StatusDot ok={ok} />
                <span style={{ fontSize:".85rem", fontWeight:500, flex:1 }}>{key}</span>
                <span style={{
                  fontSize:".72rem", fontFamily:"monospace", padding:"2px 9px", borderRadius:6,
                  background: ok ? "var(--gdim,rgba(74,222,128,.1))" : critical ? "var(--rdim,rgba(248,113,113,.1))" : "rgba(255,255,255,.05)",
                  color: ok ? "var(--green,#4ade80)" : critical ? "var(--red,#f87171)" : "var(--t3,#4a6b8a)",
                  border: `1px solid ${ok ? "rgba(74,222,128,.3)" : critical ? "rgba(248,113,113,.3)" : "rgba(255,255,255,.12)"}`,
                }}>
                  {val}
                </span>
              </div>
            ))}
            <div style={{ marginTop:6, padding:"8px 12px", background:"var(--bg3,#0d1829)", borderRadius:8,
              fontSize:".75rem", color:"var(--t3,#4a6b8a)", borderLeft:"2px solid var(--b2,rgba(56,189,248,.22))" }}>
              Claude Model: <strong style={{ color:"var(--cyan,#38bdf8)" }}>{status.claude_model}</strong>
            </div>
          </div>
        ) : (
          <div style={{ display:"flex", alignItems:"center", gap:10, color:"var(--t3)" }}>
            <Spinner size={16} /> Loading status...
          </div>
        )}

        {/* Test Key button */}
        <div style={{ marginTop:16, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <button
            className="btn-ghost"
            onClick={testKey}
            disabled={testing}
            style={{ display:"flex", alignItems:"center", gap:8, fontSize:".82rem" }}
          >
            {testing ? <><Spinner size={14} /> Testing...</> : "🔍 Test Anthropic Key"}
          </button>
          {testResult && (
            <div style={{
              padding:"7px 14px", borderRadius:8, fontSize:".82rem",
              background: testResult.valid ? "var(--gdim)" : "var(--rdim)",
              border: `1px solid ${testResult.valid ? "rgba(74,222,128,.3)" : "rgba(248,113,113,.3)"}`,
              color: testResult.valid ? "var(--green,#4ade80)" : "var(--red,#f87171)",
            }}>
              {testResult.valid
                ? `✅ Key is valid — using ${testResult.model}`
                : `❌ ${testResult.error || "Key is invalid"}`}
            </div>
          )}
        </div>
      </Card>

      {/* How to get keys */}
      <Card style={{ marginBottom:20 }}>
        <div style={{ fontSize:".65rem", color:"var(--cyan,#38bdf8)", fontFamily:"monospace",
          textTransform:"uppercase", letterSpacing:".08em", marginBottom:12 }}>
          How to get your API keys
        </div>
        {[
          {
            label:"Anthropic API Key (REQUIRED for all AI features)",
            color:"var(--red,#f87171)",
            steps:[
              "Go to console.anthropic.com",
              "Click API Keys in left sidebar",
              "Click Create Key — name it SkillPath AI",
              "Copy the key (starts with sk-ant-api03-...)",
              "Paste it in the update form below",
            ]
          },
          {
            label:"GitHub Token (optional — for GitHub repo scanner)",
            color:"var(--amber,#fbbf24)",
            steps:[
              "Go to github.com → Settings → Developer Settings",
              "Personal Access Tokens → Tokens (classic) → Generate new",
              "Select public_repo scope, set expiry",
              "Copy the token (starts with ghp_...)",
            ]
          },
          {
            label:"Cloudinary URL (optional — for resume storage)",
            color:"var(--purple,#a78bfa)",
            steps:[
              "Go to cloudinary.com → Create free account",
              "Dashboard → copy the API Environment variable",
              "Format: cloudinary://api_key:api_secret@cloud_name",
            ]
          },
        ].map(({ label, color, steps }) => (
          <div key={label} style={{ marginBottom:14 }}>
            <div style={{ fontSize:".82rem", fontWeight:600, color, marginBottom:6 }}>{label}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
              {steps.map((s, i) => (
                <div key={i} style={{ display:"flex", gap:8, fontSize:".78rem", color:"var(--t2,#8ca9c8)" }}>
                  <span style={{ color, flexShrink:0, fontFamily:"monospace" }}>{i+1}.</span> {s}
                </div>
              ))}
            </div>
          </div>
        ))}
      </Card>

      {/* Update form */}
      <Card>
        <div style={{ fontSize:".65rem", color:"var(--t3)", fontFamily:"monospace",
          textTransform:"uppercase", letterSpacing:".08em", marginBottom:14 }}>
          Update API Keys
        </div>
        <div style={{ background:"var(--adim,rgba(251,191,36,.1))", border:"1px solid rgba(251,191,36,.3)",
          borderRadius:8, padding:"9px 13px", fontSize:".78rem", color:"var(--amber,#fbbf24)", marginBottom:16 }}>
          ⚠️ Leave a field blank to keep the existing value. Keys are saved to backend/.env and take effect immediately.
        </div>

        <Field
          label="Anthropic API Key"
          name="anthropic_api_key"
          placeholder="sk-ant-api03-..."
          type="password"
          hint="Get from console.anthropic.com/api-keys"
        />
        <Field
          label="GitHub Personal Access Token"
          name="github_token"
          placeholder="ghp_..."
          type="password"
          hint="Get from github.com → Settings → Developer Settings → Tokens"
        />
        <Field
          label="Cloudinary URL"
          name="cloudinary_url"
          placeholder="cloudinary://api_key:api_secret@cloud_name"
          type="password"
          hint="Get from cloudinary.com → Dashboard"
        />
        <Field
          label="SendGrid API Key"
          name="sendgrid_api_key"
          placeholder="SG...."
          type="password"
          hint="Get from sendgrid.com → Settings → API Keys"
        />
        <Field
          label="Allowed Origins (CORS)"
          name="allowed_origins"
          placeholder="http://localhost:3000,https://yourapp.vercel.app"
          hint="Comma-separated list of frontend URLs"
        />

        <button
          className="btn-primary"
          onClick={saveKeys}
          disabled={saving}
          style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}
        >
          {saving ? <><Spinner size={15} />Saving...</> : "Save Keys →"}
        </button>

        <div style={{ marginTop:14, padding:"9px 13px", background:"var(--bg3,#0d1829)", borderRadius:8,
          fontSize:".75rem", color:"var(--t3)", borderLeft:"2px solid var(--b2)" }}>
          <strong style={{ color:"var(--t2)" }}>Alternative:</strong> Edit <code style={{ color:"var(--cyan,#38bdf8)", fontSize:".72rem" }}>backend/.env</code> directly in VS Code, then restart:{" "}
          <code style={{ color:"var(--cyan,#38bdf8)", fontSize:".72rem" }}>uvicorn main:app --reload --port 8000</code>
        </div>
      </Card>
    </div>
  );
}
