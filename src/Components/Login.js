import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login, verifyOtp } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', otp: '' });
  const [step, setStep] = useState('credentials'); // 'credentials' or 'otp'
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const res = await login(form.username, form.password);
      if (res.requires_otp) {
        setStep('otp');
      }
    } catch {
      setErr('Invalid credentials');
    } finally {
      setBusy(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await verifyOtp(form.username, form.otp);
      nav('/admin');
    } catch {
      setErr('Invalid or expired OTP code');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#0A1B2B' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#0f253a', borderRadius: 16, padding: 24, color: '#EAF2F8', border: '1px solid rgba(255,255,255,.07)' }}>
        <h1 style={{ margin: '0 0 8px' }}>Eco Voltex</h1>
        <p style={{ margin: '0 0 16px', opacity: .8 }}>
          {step === 'credentials' ? 'Sign in to continue' : 'Enter verification code sent to email'}
        </p>

        {step === 'credentials' ? (
          <form onSubmit={handleCredentialsSubmit} style={{ display: 'grid', gap: 10 }}>
            <label>Username / Email</label>
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Enter your username or email"
              autoComplete="username"
              style={{ padding: 12, borderRadius: 12, border: '1px solid #27465f', background: '#0b1e2f', color: '#EAF2F8' }}
            />

            <label>Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 12px',
                  borderRadius: 12,
                  border: '1px solid #27465f',
                  background: '#0b1e2f',
                  color: '#EAF2F8',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  background: 'none',
                  border: 'none',
                  color: '#8CA3BA',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  outline: 'none'
                }}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>

            {err && <div style={{ background: 'rgba(255,107,107,.1)', border: '1px solid rgba(255,107,107,.3)', color: '#ffd5d5', padding: 10, borderRadius: 10 }}>{err}</div>}

            <button disabled={busy} style={{ padding: 12, borderRadius: 12, border: 'none', fontWeight: 700, background: 'linear-gradient(90deg,#16A34A,#22E57F)', color: '#052011', cursor: busy ? 'not-allowed' : 'pointer', marginTop: 6 }}>
              {busy ? 'Sending OTP…' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} style={{ display: 'grid', gap: 10 }}>
            <label>6-Digit Code</label>
            <input
              value={form.otp}
              onChange={(e) => setForm({ ...form, otp: e.target.value })}
              placeholder="123456"
              maxLength={6}
              style={{ padding: 12, borderRadius: 12, border: '1px solid #27465f', background: '#0b1e2f', color: '#EAF2F8', textAlign: 'center', letterSpacing: '4px', fontSize: '20px' }}
            />

            {err && <div style={{ background: 'rgba(255,107,107,.1)', border: '1px solid rgba(255,107,107,.3)', color: '#ffd5d5', padding: 10, borderRadius: 10 }}>{err}</div>}

            <button disabled={busy} style={{ padding: 12, borderRadius: 12, border: 'none', fontWeight: 700, background: 'linear-gradient(90deg,#16A34A,#22E57F)', color: '#052011', cursor: busy ? 'not-allowed' : 'pointer', marginTop: 6 }}>
              {busy ? 'Verifying…' : 'Verify & Sign in'}
            </button>
            
            <button 
              type="button" 
              onClick={() => setStep('credentials')} 
              style={{ background: 'none', border: 'none', color: '#8CA3BA', cursor: 'pointer', marginTop: 8 }}
            >
              Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}