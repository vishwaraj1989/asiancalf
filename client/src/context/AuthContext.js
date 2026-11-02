import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem('asianCalfSession')) || null; } catch { return null; }
  });
  const value = useMemo(() => ({
    user: session?.user || null,
    token: session?.token || null,
    signIn(data) { localStorage.setItem('asianCalfSession', JSON.stringify(data)); setSession(data); },
    signOut() { localStorage.removeItem('asianCalfSession'); setSession(null); },
  }), [session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
