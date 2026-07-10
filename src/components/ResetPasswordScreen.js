// src/components/ResetPasswordScreen.js
import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { LoaderIcon, LockIcon, EyeIcon, EyeOffIcon } from './Icons';

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0ea5e9 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    fontFamily: 'inherit',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    background: 'rgba(255,255,255,0.97)',
    backdropFilter: 'blur(20px)',
    borderRadius: 24,
    padding: '36px 28px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    animation: 'slideUp 0.4s ease',
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    background: 'linear-gradient(135deg, #0ea5e9, #1e3a5f)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    fontSize: 28,
    boxShadow: '0 8px 20px rgba(14,165,233,0.35)',
  },
  title: { textAlign: 'center', fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 },
  subtitle: { textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 6, marginBottom: 24, lineHeight: 1.6 },
  label: { fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6, display: 'block' },
  input: {
    width: '100%',
    padding: '12px 44px 12px 14px',
    borderRadius: 12,
    border: '1.5px solid #e2e8f0',
    fontSize: 14,
    outline: 'none',
    marginBottom: 16,
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '13px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #0ea5e9, #1e3a5f)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: '0 6px 16px rgba(14,165,233,0.3)',
  },
  error: { background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 },
  success: { background: '#dcfce7', color: '#16a34a', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 },
};

export default function ResetPasswordScreen() {
  const { completePasswordReset, cancelPasswordRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }
    if (password !== confirmPassword) {
      setError('দুটো পাসওয়ার্ড মিলছে না');
      return;
    }

    setLoading(true);
    const { error } = await completePasswordReset(password);
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('✅ পাসওয়ার্ড বদলানো হয়েছে! এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।');
    }
  }

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform: translateY(20px);} to {opacity:1; transform:translateY(0);} }
        input:focus { border-color: #0ea5e9 !important; }
      `}</style>
      <div style={styles.card}>
        <div style={styles.logo}>🔑</div>
        <h1 style={styles.title}>নতুন পাসওয়ার্ড সেট করুন</h1>
        <p style={styles.subtitle}>আপনার একাউন্টের জন্য একটা নতুন পাসওয়ার্ড দিন</p>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        {success ? (
          <button onClick={cancelPasswordRecovery} style={styles.button}>
            লগইন স্ক্রিনে যান
          </button>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={styles.label}>নতুন পাসওয়ার্ড</label>
            <div style={{ position: 'relative' }}>
              <input
                style={styles.input}
                type={showPwd ? 'text' : 'password'}
                placeholder="কমপক্ষে ৬ অক্ষর"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, display: 'flex' }}
                tabIndex={-1}
              >
                {showPwd ? <EyeOffIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
              </button>
            </div>

            <label style={styles.label}>নতুন পাসওয়ার্ড আবার লিখুন</label>
            <input
              style={styles.input}
              type={showPwd ? 'text' : 'password'}
              placeholder="আবার লিখুন"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? <LoaderIcon width={18} height={18} /> : <><LockIcon width={18} height={18} /> পাসওয়ার্ড বদলান</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
