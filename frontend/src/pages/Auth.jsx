import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { Spinner } from "../components/UI";

function AuthShell({ children, title, sub }) {
  return (
    <div className="auth-wrap bg-grid">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="auth-card fade-up">
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#38bdf8,#4ade80)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#020810", margin: "0 auto 14px", boxShadow: "0 0 28px rgba(56,189,248,.3)" }}>S</div>
          <h1 style={{ fontSize: "1.6rem", marginBottom: 6 }}>{title}</h1>
          <p style={{ fontSize: ".83rem", margin: 0 }}>{sub}</p>
        </div>
        <div className="card card-glow">{children}</div>
      </div>
    </div>
  );
}

function FieldRow({ label, ...props }) {
  return (
    <div>
      <label style={{ fontSize: ".68rem", color: "var(--t3)", fontFamily: "'DM Mono',monospace", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".07em" }}>{label}</label>
      <input {...props} />
    </div>
  );
}

/* ── Login ──────────────────────────────────────────────────── */
export function Login() {
  const [form,    setForm]    = useState({ email: "", password: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const submit = async e => {
    e.preventDefault(); setError(""); setLoading(true);
    try   { await login(form.email, form.password); navigate("/dashboard"); }
    catch (err) { setError(err.message || "Invalid credentials"); }
    finally     { setLoading(false); }
  };

  return (
    <AuthShell title="Welcome back" sub="Sign in to your SkillPath AI account">
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <FieldRow label="Email" type="email" value={form.email} required autoComplete="email"
          placeholder="you@example.com"
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        <FieldRow label="Password" type="password" value={form.password} required autoComplete="current-password"
          placeholder="••••••••"
          onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
        {error && <div style={{ background: "var(--rdim)", border: "1px solid rgba(248,113,113,.3)", borderRadius: 8, padding: "9px 13px", color: "var(--red)", fontSize: ".83rem" }}>{error}</div>}
        <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: "center", marginTop: 4 }}>
          {loading ? <><Spinner size={15} /> Signing in...</> : "Sign In →"}
        </button>
        <div style={{ textAlign: "center", fontSize: ".82rem", color: "var(--t3)" }}>
          <Link to="/forgot-password" style={{ color: "var(--t3)", marginRight: 12 }}>Forgot password?</Link>
          No account? <Link to="/signup" style={{ color: "var(--cyan)", fontWeight: 600 }}>Sign up</Link>
        </div>
      </form>
    </AuthShell>
  );
}

/* ── Signup ─────────────────────────────────────────────────── */
export function Signup() {
  const [form,    setForm]    = useState({ name: "", username: "", email: "", password: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate   = useNavigate();

  const submit = async e => {
    e.preventDefault();
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setError(""); setLoading(true);
    try   { await signup(form.name, form.email, form.password, form.username); navigate("/setup"); }
    catch (err) { setError(err.message || "Signup failed"); }
    finally     { setLoading(false); }
  };

  const fields = [
    { key: "name",     label: "Full Name",  type: "text",     placeholder: "Arjun Sharma" },
    { key: "username", label: "Username",   type: "text",     placeholder: "arjun_s" },
    { key: "email",    label: "Email",      type: "email",    placeholder: "you@example.com" },
    { key: "password", label: "Password",   type: "password", placeholder: "Min. 8 characters" },
  ];

  return (
    <AuthShell title="Create account" sub="Start your AI-powered career journey">
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {fields.map(f => (
          <FieldRow key={f.key} label={f.label} type={f.type} placeholder={f.placeholder}
            value={form[f.key]} required
            onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
        ))}
        {error && <div style={{ background: "var(--rdim)", border: "1px solid rgba(248,113,113,.3)", borderRadius: 8, padding: "9px 13px", color: "var(--red)", fontSize: ".83rem" }}>{error}</div>}
        <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: "center", marginTop: 4 }}>
          {loading ? <><Spinner size={15} /> Creating account...</> : "Create Account →"}
        </button>
        <div style={{ textAlign: "center", fontSize: ".82rem", color: "var(--t3)" }}>
          Have an account? <Link to="/login" style={{ color: "var(--cyan)", fontWeight: 600 }}>Sign in</Link>
        </div>
      </form>
    </AuthShell>
  );
}

/* ── Forgot Password ────────────────────────────────────────── */
export function ForgotPassword() {
  const [email,   setEmail]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault(); setLoading(true);
    try   { await api.auth.forgotPassword(email); setSent(true); }
    catch { setSent(true); }
    finally { setLoading(false); }
  };

  return (
    <AuthShell title="Reset password" sub="We'll send a reset link to your email">
      {!sent ? (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FieldRow label="Email" type="email" value={email} required placeholder="you@example.com"
            onChange={e => setEmail(e.target.value)} />
          <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: "center" }}>
            {loading ? <><Spinner size={15} /> Sending...</> : "Send Reset Link →"}
          </button>
          <div style={{ textAlign: "center", fontSize: ".82rem" }}>
            <Link to="/login" style={{ color: "var(--t2)" }}>← Back to login</Link>
          </div>
        </form>
      ) : (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📧</div>
          <h3 style={{ marginBottom: 8 }}>Check your email</h3>
          <p style={{ marginBottom: 16, fontSize: ".85rem" }}>If that email exists in our system, a reset link has been sent.</p>
          <Link to="/login" className="btn-ghost" style={{ display: "inline-flex" }}>← Back to login</Link>
        </div>
      )}
    </AuthShell>
  );
}
