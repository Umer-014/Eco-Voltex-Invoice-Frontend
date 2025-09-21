import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ username:'', password:'' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      await login(form.username, form.password);
      nav('/admin');
    } catch {
      setErr('Invalid credentials');
    } finally { setBusy(false); }
  };

  return (
    <div style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24,background:'#0A1B2B'}}>
      <div style={{width:'100%',maxWidth:420,background:'#0f253a',borderRadius:16,padding:24,color:'#EAF2F8',border:'1px solid rgba(255,255,255,.07)'}}>
        <h1 style={{margin:'0 0 8px'}}>Eco Voltex Admin</h1>
        <p style={{margin:'0 0 16px',opacity:.8}}>Sign in to continue</p>
        <form onSubmit={submit} style={{display:'grid',gap:10}}>
          <label>Username</label>
          <input
            value={form.username}
            onChange={(e)=>setForm({...form, username:e.target.value})}
            placeholder="admin"
            autoComplete="username"
            style={{padding:12,borderRadius:12,border:'1px solid #27465f',background:'#0b1e2f',color:'#EAF2F8'}}
          />
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e)=>setForm({...form, password:e.target.value})}
            placeholder="••••••••"
            autoComplete="current-password"
            style={{padding:12,borderRadius:12,border:'1px solid #27465f',background:'#0b1e2f',color:'#EAF2F8'}}
          />
          {err && <div style={{background:'rgba(255,107,107,.1)',border:'1px solid rgba(255,107,107,.3)',color:'#ffd5d5',padding:10,borderRadius:10}}>{err}</div>}
          <button disabled={busy} style={{padding:12,borderRadius:12,border:'none',fontWeight:700,background:'linear-gradient(90deg,#16A34A,#22E57F)',color:'#052011'}}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
