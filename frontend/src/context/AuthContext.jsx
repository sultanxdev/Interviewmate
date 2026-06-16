import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const AuthContext = createContext(null);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("im_token") || null);
  const [isLoaded, setIsLoaded] = useState(false);

  // On mount – try to restore session from localStorage
  useEffect(() => {
    const restore = async () => {
      const stored = localStorage.getItem("im_token");
      if (!stored) {
        setIsLoaded(true);
        return;
      }
      try {
        const res = await axios.get(`${BACKEND_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${stored}` },
        });
        setUser(res.data.user);
        setToken(stored);
      } catch {
        // Token invalid / expired – clear it
        localStorage.removeItem("im_token");
        setToken(null);
      } finally {
        setIsLoaded(true);
      }
    };
    restore();
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const login = useCallback(async (email, password) => {
    const res = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem("im_token", newToken);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }, []);

  const register = useCallback(async (email, password, firstName, lastName) => {
    const res = await axios.post(`${BACKEND_URL}/api/auth/register`, {
      email,
      password,
      firstName,
      lastName,
    });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem("im_token", newToken);
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("im_token");
    setToken(null);
    setUser(null);
  }, []);

  // Drop-in replacement for Clerk's getToken()
  const getToken = useCallback(async () => token, [token]);

  const value = {
    user,
    token,
    isLoaded,
    isSignedIn: !!user,
    getToken,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Named hook – mirrors Clerk's useAuth / useUser surface
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};

export default AuthContext;
