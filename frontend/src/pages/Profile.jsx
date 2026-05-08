import React, { useState, useRef } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Card, Badge, SectionHeader, Spinner } from "../components/UI";

const ROLES = ["Backend Developer", "Full Stack Developer", "Data Scientist", "DevOps Engineer", "AI Engineer"];

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [githubUrl, setGithubUrl] = useState(user?.github_url || "");
  const [scanningGH, setScanGH]   = useState(false);
  const [msg, setMsg]             = useState("");
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name:       user?.name         || "",
    target_role: user?.target_role || "",
    github_url:  user?.github_url  || "",
    academic: {
      college: user?.academic?.college || "",
      cgpa:    user?.academic?.cgpa    || "",
      degree:  user?.academic?.degree  || "",
      year:    user?.academic?.year    || "",
    },
  });

  const save = async () => {
    setSaving(true); setMsg("");
    try {
      await api.profile.update({
        ...form,
        academic: { ...form.academic, cgpa: form.academic.cgpa ? parseFloat(form.academic.cgpa) : null },
      });
      await refreshUser();
      setMsg("✅ Profile saved");
    } catch (e) { setMsg("❌ " + e.message); }
    finally { setSaving(false); }
  };

  const uploadResume = async (file) => {
    if (!file) return;
    setUploading(true); setMsg("");
    try {
      const res = await api.analyzer.resume(file);
      await refreshUser();
      setMsg(`✅ Resume analyzed · ${res.extracted_skills?.length || 0} skills extracted · ATS: ${res.ats_score}%`);
    } catch (e) { setMsg("❌ " + e.message); }
    finally { setUploading(false); }
  };

  const scanGitHub = async () => {
    if (!githubUrl.startsWith("https://github.com/")) { setMsg("❌ Enter a valid github.com URL"); return; }
    setScanGH(true); setMsg("");
    try {
      const res = await api.analyzer.github(githubUrl);
      await refreshUser();
      setMsg(`✅ GitHub scanned · ${res.repos_count} repos · Score: ${res.github_score}%`);
    } catch (e) { setMsg("❌ " + e.message); }
    finally { setScanGH(false); }
  };

  const Field = ({ label, children }) => (
    <div>
      <label style={{ fontSize: "0.72rem", color: "var(--text3)", fontFamily: "var(--font-mono)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".07em" }}>
        {label}
      </label>
      {children}
    </div>
  );

  return (
    <div className="fade-up">
      <SectionHeader title="Profile" sub="Manage your career profile and uploaded data" />

      {msg && (
        <div style={{
          marginBottom: 16, padding: "10px 16px", borderRadius: 10, fontSize: "0.85rem",
          background: msg.startsWith("✅") ? "var(--green-dim)" : "var(--red-dim)",
          border: `1px solid ${msg.startsWith("✅") ? "rgba(74,222,128,.3)" : "rgba(248,113,113,.3)"}`,
          color: msg.startsWith("✅") ? "var(--green)" : "var(--red)",
        }}>
          {msg}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Basic info */}
        <Card>
          <div style={{ fontSize: "0.75rem", color: "var(--text3)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14 }}>Basic Info</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            <Field label="Full Name">
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name" />
            </Field>
            <Field label="Target Role">
              <select value={form.target_role} onChange={e => setForm(p => ({ ...p, target_role: e.target.value }))}>
                <option value="">Select a role...</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
          </div>
        </Card>

        {/* Academic */}
        <Card>
          <div style={{ fontSize: "0.75rem", color: "var(--text3)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14 }}>Academic Record</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
            {[
              { key: "college", label: "College / University", placeholder: "Jadavpur University" },
              { key: "degree",  label: "Degree",               placeholder: "B.Tech CSE" },
              { key: "cgpa",    label: "CGPA",                 placeholder: "8.5" },
              { key: "year",    label: "Graduation Year",      placeholder: "2025" },
            ].map(f => (
              <Field key={f.key} label={f.label}>
                <input value={form.academic[f.key]} placeholder={f.placeholder}
                  onChange={e => setForm(p => ({ ...p, academic: { ...p.academic, [f.key]: e.target.value } }))} />
              </Field>
            ))}
          </div>
        </Card>

        {/* Resume upload */}
        <Card>
          <div style={{ fontSize: "0.75rem", color: "var(--text3)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14 }}>Resume Analyzer</div>
          <div
            onClick={() => !uploading && fileRef.current?.click()}
            style={{
              border: "2px dashed var(--border2)", borderRadius: 12, padding: "28px 20px",
              textAlign: "center", cursor: uploading ? "not-allowed" : "pointer",
              background: "var(--bg3)", transition: "all .2s",
            }}
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--cyan)"; }}
            onDragLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; }}
            onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = "var(--border2)"; uploadResume(e.dataTransfer.files[0]); }}
          >
            {uploading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--cyan)" }}>
                <Spinner size={18} /> Analyzing resume...
              </div>
            ) : (
              <>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                <div style={{ fontSize: "0.9rem", color: "var(--text)", fontWeight: 500 }}>Drop resume PDF here or click to browse</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text3)", marginTop: 4 }}>PDF · Max 5MB · Skills extracted automatically by AI</div>
                {user?.resume_url && <div style={{ marginTop: 8 }}><Badge label="Resume on file ✓" color="green" /></div>}
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => uploadResume(e.target.files[0])} />
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {user?.resume_score != null && <Badge label={`Resume: ${user.resume_score}%`} color="amber" />}
            {user?.ats_score    != null && <Badge label={`ATS: ${user.ats_score}%`}    color="purple" />}
          </div>
        </Card>

        {/* GitHub */}
        <Card>
          <div style={{ fontSize: "0.75rem", color: "var(--text3)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14 }}>GitHub Analyzer</div>
          <div style={{ display: "flex", gap: 10 }}>
            <input value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/your-username" style={{ flex: 1 }} />
            <button className="btn-primary" onClick={scanGitHub} disabled={scanningGH}
              style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
              {scanningGH ? <><Spinner size={14} /> Scanning...</> : "Scan →"}
            </button>
          </div>
          {user?.github_data?.repos_count != null && (
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Badge label={`${user.github_data.repos_count} repos`}          color="cyan" />
              <Badge label={`Score: ${user.github_data.github_score}%`}        color="green" />
              {user.github_data.languages?.slice(0, 4).map(l => <Badge key={l} label={l} color="gray" />)}
            </div>
          )}
        </Card>

        {/* Skills list */}
        <Card>
          <div style={{ fontSize: "0.75rem", color: "var(--text3)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14 }}>
            Skills on Profile ({user?.skills?.length || 0})
          </div>
          {user?.skills?.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {user.skills.map(s => {
                const name = typeof s === "string" ? s : s.name;
                const verified = user?.verified_skills?.includes(name);
                return <Badge key={name} label={verified ? `✓ ${name}` : name} color={verified ? "green" : "gray"} />;
              })}
            </div>
          ) : (
            <p style={{ margin: 0 }}>No skills yet. Upload your resume or connect GitHub to auto-extract skills.</p>
          )}
        </Card>

        <button className="btn-primary" onClick={save} disabled={saving}
          style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8 }}>
          {saving ? <><Spinner size={15} /> Saving...</> : "Save Profile →"}
        </button>
      </div>
    </div>
  );
}
