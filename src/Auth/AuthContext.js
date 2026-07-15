import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// wraps the existing JWT auth backend. it logs people in by `username`, but
// this UI only ever asks for an email, so we just send the email as the
// username too 

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

  // on load, check whatever token we had saved is still good. if it's
  // expired or the account's gone, just quietly drop it and treat them
  // as logged out instead of showing an error
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
    return () => { cancelled = true; }; // don't set state if we unmounted mid-fetch
  }, [token]);

  const login = useCallback(async (email, password) => {
    // the token endpoint wants form-encoded OAuth2 fields, not json
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
    // signup doesn't hand back a token, so just log them in right after
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
