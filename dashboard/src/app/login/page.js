'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, LogIn, UserPlus, AlertTriangle } from 'lucide-react';
import { setToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const res = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Login failed');
      }

      const data = await res.json();
      setToken(data.access_token);
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Registration failed');
      }

      setInfo('Account created! An administrator must verify your account before you can log in.');
      setMode('login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: 24,
    }}>
      <div className="glass-card" style={{ maxWidth: 420, width: '100%', padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Shield size={28} color="white" />
          </div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: 22, marginBottom: 4 }}>SmartContainer</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Risk Engine — {mode === 'login' ? 'Sign In' : 'Create Account'}</p>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 20,
            color: 'var(--accent-red)', fontSize: 13,
          }}>
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {info && (
          <div style={{
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 20,
            color: 'var(--accent-emerald)', fontSize: 13,
          }}>
            {info}
          </div>
        )}

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: 13, marginBottom: 6 }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                color: 'var(--text-primary)', fontSize: 14, outline: 'none',
              }}
            />
          </div>

          {mode === 'register' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: 13, marginBottom: 6 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: 13, marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                color: 'var(--text-primary)', fontSize: 14, outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="upload-btn"
            style={{ width: '100%', padding: '12px 0', fontSize: 15, cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading ? 'Please wait...' : (
              <>
                {mode === 'login' ? <><LogIn size={16} /> Sign In</> : <><UserPlus size={16} /> Create Account</>}
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); setInfo(null); }}
            style={{
              background: 'none', border: 'none', color: 'var(--accent-cyan)',
              cursor: 'pointer', fontSize: 13, textDecoration: 'underline',
            }}
          >
            {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
