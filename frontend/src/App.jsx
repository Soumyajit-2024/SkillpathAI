import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Layout from "./components/Layout";
import { LoadingPage } from "./components/UI";

/* ── Lazy page imports ───────────────────────────────────────── */
import { Login, Signup, ForgotPassword } from "./pages/Auth";
import Setup         from "./pages/Setup";
import Dashboard     from "./pages/Dashboard";
import Profile       from "./pages/Profile";
import GapAnalyzer   from "./pages/GapAnalyzer";
import Roadmap       from "./pages/Roadmap";
import Chat          from "./pages/Chat";
import JDParser      from "./pages/JDParser";
import Internships   from "./pages/Internships";
import Projects      from "./pages/Projects";
import Interview     from "./pages/Interview";
import Verification  from "./pages/Verification";
import Admin         from "./pages/Admin";
import Notifications from "./pages/Notifications";

import "./styles/globals.css";

/* ── Route guards ────────────────────────────────────────────── */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading)  return <LoadingPage message="Loading SkillPath AI..." />;
  if (!user)    return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingPage />;
  if (user)    return <Navigate to="/dashboard" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading)  return <LoadingPage />;
  if (!user)    return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

/* ── App ─────────────────────────────────────────────────────── */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* ── Public ───────────────────────────────────────── */}
          <Route path="/login"           element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup"          element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

          {/* ── Onboarding (auth required, no sidebar) ───────── */}
          <Route path="/setup" element={
            <AuthProvider><Setup /></AuthProvider>
          } />

          {/* ── Protected user routes ─────────────────────────── */}
          <Route path="/dashboard"   element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile"     element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/gap"         element={<ProtectedRoute><GapAnalyzer /></ProtectedRoute>} />
          <Route path="/roadmap"     element={<ProtectedRoute><Roadmap /></ProtectedRoute>} />
          <Route path="/chat"        element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/jd"          element={<ProtectedRoute><JDParser /></ProtectedRoute>} />
          <Route path="/internships" element={<ProtectedRoute><Internships /></ProtectedRoute>} />
          <Route path="/projects"    element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/interview"   element={<ProtectedRoute><Interview /></ProtectedRoute>} />
          <Route path="/verify"      element={<ProtectedRoute><Verification /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

          {/* ── Admin routes ───────────────────────────────────── */}
          <Route path="/admin"                element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/admin/users"          element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/admin/roles"          element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/admin/analytics"      element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/admin/notifications"  element={<AdminRoute><Admin /></AdminRoute>} />

          {/* ── Default ────────────────────────────────────────── */}
          <Route path="/"   element={<Navigate to="/dashboard" replace />} />
          <Route path="*"   element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}
