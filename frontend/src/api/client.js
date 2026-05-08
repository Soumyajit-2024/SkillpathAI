const BASE = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

function token() { return localStorage.getItem("skillpath_token"); }

async function req(method, path, body = null, formData = null) {
  const headers = {};
  if (token()) headers["Authorization"] = `Bearer ${token()}`;
  if (body && !formData) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: formData || (body ? JSON.stringify(body) : null),
  });

  if (res.status === 401) {
    localStorage.removeItem("skillpath_token");
    window.location.href = "/login";
    return;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.message || `Error ${res.status}`);
  return data;
}

export const api = {

  /* ── Auth ─────────────────────────────────────────────── */
  auth: {
    signup:         d   => req("POST", "/auth/signup", d),
    login:          d   => req("POST", "/auth/login",  d),
    google:         tok => req("POST", "/auth/google", { token: tok }),
    forgotPassword: e   => req("POST", `/auth/forgot-password?email=${encodeURIComponent(e)}`),
    resetPassword:  (t, p) => req("POST", `/auth/reset-password?token=${t}&new_password=${encodeURIComponent(p)}`),
  },

  /* ── Profile ──────────────────────────────────────────── */
  profile: {
    get:            ()  => req("GET",  "/profile/me"),
    update:         d   => req("PUT",  "/profile/me", d),
    placementScore: ()  => req("GET",  "/profile/placement-score"),
    progressHistory:()  => req("GET",  "/profile/progress-history"),
    saveSnapshot:   ()  => req("POST", "/profile/progress-snapshot"),
    uploadResume:   file => {
      const fd = new FormData(); fd.append("file", file);
      return req("POST", "/profile/upload-resume", null, fd);
    },
  },

  /* ── Analyzer ─────────────────────────────────────────── */
  analyzer: {
    resume: file => {
      const fd = new FormData(); fd.append("file", file);
      return req("POST", "/analyzer/resume", null, fd);
    },
    github: url => req("POST", `/analyzer/github?github_url=${encodeURIComponent(url)}`),
  },

  /* ── Skill Gap ────────────────────────────────────────── */
  gap: {
    analyze: ()   => req("GET", "/gap/analyze"),
    roles:   ()   => req("GET", "/gap/roles"),
  },

  /* ── Roadmap ──────────────────────────────────────────── */
  roadmap: {
    get:        ()   => req("GET",    "/roadmap/"),
    markDone:   week => req("PATCH",  `/roadmap/step?week=${week}`),
    regenerate: ()   => req("DELETE", "/roadmap/regenerate"),
  },

  /* ── Chat ─────────────────────────────────────────────── */
  chat: {
    send:    (message, history) => req("POST", "/chat/",        { message, history }),
    history: ()                 => req("GET",  "/chat/history"),
  },

  /* ── JD Parser ────────────────────────────────────────── */
  jd: {
    parse:   d => req("POST", "/jd/parse",   d),
    history: () => req("GET",  "/jd/history"),
  },

  /* ── Recommendations ──────────────────────────────────── */
  recommendations: {
    internships:    () => req("GET",  "/recommendations/internships"),
    projects:       () => req("GET",  "/recommendations/projects"),
    certifications: () => req("GET",  "/recommendations/certifications"),
    feedback:       d  => req("POST", "/recommendations/feedback", d),
  },

  /* ── Interview ────────────────────────────────────────── */
  interview: {
    questions: role => req("GET",  `/interview/questions?role=${encodeURIComponent(role)}`),
    evaluate:  d    => req("POST", "/interview/evaluate", d),
  },

  /* ── Skill Verification ───────────────────────────────── */
  verify: {
    questions: skill => req("GET",  `/verify/questions/${encodeURIComponent(skill)}`),
    submit:    d     => req("POST", "/verify/submit", d),
  },

  /* ── Admin ────────────────────────────────────────────── */
  admin: {
    stats:        ()        => req("GET",    "/admin/stats"),
    users:        (page=1)  => req("GET",    `/admin/users?page=${page}`),
    updateUser:   (id, d)   => req("PUT",    `/admin/users/${id}`, d),
    deleteUser:   id        => req("DELETE", `/admin/users/${id}`),
    roles:        ()        => req("GET",    "/admin/roles"),
    addRole:      d         => req("POST",   "/admin/roles", d),
    updateRole:   (r, d)    => req("PUT",    `/admin/roles/${encodeURIComponent(r)}`, d),
    resources:    ()        => req("GET",    "/admin/resources"),
    addResource:  d         => req("POST",   "/admin/resources", d),
    feedback:     ()        => req("GET",    "/admin/feedback"),
    notifications: d        => req("POST",   "/admin/notifications/send", d),
  },

  /* ── Notifications ────────────────────────────────────── */
  notifications: {
    list: () => req("GET",  "/notifications/"),
    markRead: id => req("PATCH", `/notifications/${id}/read`),
    markAllRead: () => req("PATCH", "/notifications/read-all"),
  },
};

  /* ── Config / API Keys ────────────────────────────────── */
  config: {
    status:  ()     => req("GET",  "/config/status"),
    testKey: ()     => req("GET",  "/config/test-key"),
    update:  data   => req("POST", "/config/update", data),
  },
