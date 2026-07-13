import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Wraps the existing hand-rolled JWT auth backend (/api/login/access-token,
// /api/users/signup, /api/users/me). That backend logs users in by `username`,
// so we register/login with the email itself as the username — there's no
// separate handle in this UI, just email + password.

const AuthContext = createContext(null);

const TOKEN_KEY = 'dp_auth_token';

async function fetchMe(token) {
  const res = await fetch('/api/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    let cancelled = false;
    fetchMe(token).then(me => {
      if (cancelled) return;
      if (me) {
        setUser(me);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [token]);

  const login = useCallback(async (email, password) => {
    const res = await fetch('/api/login/access-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: email, password }),
    });
    if (!res.ok) {
      return { ok: false, error: "That email and password don't match. Try again." };
    }
    const data = await res.json();
    const me = await fetchMe(data.access_token);
    if (!me) return { ok: false, error: "That email and password don't match. Try again." };
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setToken(data.access_token);
    setUser(me);
    return { ok: true };
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await fetch('/api/users/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: email,
        email,
        password,
        full_name: name || null,
      }),
    });
    if (res.status === 409) {
      return { ok: false, error: 'An account with that email already exists.' };
    }
    if (!res.ok) {
      return { ok: false, error: 'Something went wrong. Try again.' };
    }
    return login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
