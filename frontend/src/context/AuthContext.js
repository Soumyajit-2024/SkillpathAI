import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  /* Restore session on mount */
  useEffect(() => {
    const token = localStorage.getItem("skillpath_token");
    if (token) {
      api.profile.get()
        .then(u => setUser(u))
        .catch(() => {
          localStorage.removeItem("skillpath_token");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    const res = await api.auth.login({ email, password });
    localStorage.setItem("skillpath_token", res.access_token);
    const profile = await api.profile.get();
    setUser(profile);
    return profile;
  }, []);

  const signup = useCallback(async (name, email, password, username) => {
    setError(null);
    const res = await api.auth.signup({ name, email, password, username });
    localStorage.setItem("skillpath_token", res.access_token);
    const profile = await api.profile.get();
    setUser(profile);
    return profile;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("skillpath_token");
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await api.profile.get();
      setUser(profile);
      return profile;
    } catch (e) {
      console.error("refreshUser failed:", e);
    }
  }, []);

  const updateUser = useCallback((patch) => {
    setUser(u => u ? { ...u, ...patch } : u);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading, error,
      login, signup, logout, refreshUser, updateUser,
      isAdmin: user?.is_admin === true,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
