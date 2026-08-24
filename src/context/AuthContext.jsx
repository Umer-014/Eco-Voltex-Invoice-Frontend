import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/lib';
const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then(r => setUser(r.data.user))
      .catch(() => {
        localStorage.removeItem('eco_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const r = await api.post('/auth/login', { username, password });
    if (r.data.token) {
      localStorage.setItem('eco_token', r.data.token);
    }
    setUser(r.data.user);
  };

  const logout = async () => { 
    try { 
      await api.post('/auth/logout'); 
    } catch(e) {}
    localStorage.removeItem('eco_token');
    setUser(null); 
  };

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}