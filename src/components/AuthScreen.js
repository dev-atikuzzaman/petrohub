// src/components/AuthScreen.js
import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { LoaderIcon, MailIcon, ShieldIcon, EyeIcon, EyeOffIcon } from './Icons';

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
  title: { textAlign: 'center', fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 },
  subtitle: { textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 6, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6, display: 'block' },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: '1.5px solid #e2e8f0',
    fontSize: 14,
    outline: 'none',
    marginBottom: 16,
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
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
  switchRow: { textAlign: 'center', marginTop: 18, fontSize: 13, color: '#64748b' },
  switchLink: { color: '#0ea5e9', fontWeight: 700, cursor: 'pointer', marginLeft: 4 },
  forgotLink: { textAlign: 'right', fontSize: 12.5, color: '#0ea5e9', fontWeight: 700, cursor: 'pointer', marginTop: -8, marginBottom: 16 },
  error: {
    background: '#fee2e2',
    color: '#dc2626',
    padding: '10px 14px',
    borderRadius: 10,
    fontSize: 13,
    marginBottom: 16,
  },
  success: {
    background: '#dcfce7',
    color: '#16a34a',
    padding: '10px 14px',
    borderRadius: 10,
    fontSize: 13,
    marginBottom: 16,
  },
};

export default function AuthScreen() {
  const { signIn, signUp, sendPasswordReset } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function switchMode(newMode) {
    setMode(newMode);
    setError('');
    setSuccess('');
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('ইমেইল লিখুন');
      return;
    }

    setLoading(true);
    const { error } = await sendPasswordReset(email.trim());
    setLoading(false);

    if (error) {
      setError(translateError(error.message));
    } else {
      setSuccess('✅ রিসেট লিংক পাঠানো হয়েছে! ইমেইল (বা Spam ফোল্ডার) চেক করুন।');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('নাম লিখুন');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email.trim(), password, name.trim());
        if (error) {
          setError(translateError(error.message));
        } else {
          setSuccess('✅ Account তৈরি হয়েছে! এখন লগইন করুন।');
          setMode('login');
        }
      } else {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          setError(translateError(error.message));
        }
      }
    } catch (err) {
      setError('কিছু একটা সমস্যা হয়েছে, আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  }

  function translateError(msg) {
    if (/invalid login credentials/i.test(msg)) return 'ইমেইল বা পাসওয়ার্ড ভুল';
    if (/already registered/i.test(msg)) return 'এই ইমেইল দিয়ে আগেই account আছে, লগইন করুন';
    if (/email/i.test(msg) && /invalid/i.test(msg)) return 'সঠিক ইমেইল দিন';
    if (/email not confirmed/i.test(msg)) return 'ইমেইল ভেরিফাই করা হয়নি। ইনবক্স (বা Spam ফোল্ডার) চেক করে confirmation লিংকে ক্লিক করুন।';
    if (/rate limit|too many requests/i.test(msg)) return 'একটু বেশি চেষ্টা হয়ে গেছে, কিছুক্ষণ পর আবার চেষ্টা করুন';
    return msg;
  }

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform: translateY(20px);} to {opacity:1; transform:translateY(0);} }
        input:focus { border-color: #0ea5e9 !important; }
      `}</style>
      <div style={styles.card}>
        <div style={styles.logo}>🎓</div>
        <h1 style={styles.title}>Petro Knowledge Hub</h1>
        <p style={styles.subtitle}>
          {mode === 'login' ? 'আপনার একাউন্টে লগইন করুন' : mode === 'signup' ? 'নতুন একাউন্ট তৈরি করুন' : 'ইমেইল দিন, পাসওয়ার্ড রিসেট করার লিংক পাঠানো হবে'}
        </p>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        {mode === 'forgot' ? (
          <form onSubmit={handleForgotPassword}>
            <label style={styles.label}>ইমেইল</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? <LoaderIcon width={18} height={18} /> : <><MailIcon width={18} height={18} /> রিসেট লিংক পাঠান</>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <label style={styles.label}>পূর্ণ নাম</label>
              <input
                style={styles.input}
                type="text"
                placeholder="যেমন: মো. আকিব হোসেন"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </>
          )}

          <label style={styles.label}>ইমেইল</label>
          <input
            style={styles.input}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <label style={styles.label}>পাসওয়ার্ড</label>
          <div style={{ position: 'relative', marginBottom: 4 }}>
            <input
              style={{ ...styles.input, paddingRight: 44 }}
              type={showPassword ? 'text' : 'password'}
              placeholder="কমপক্ষে ৬ অক্ষর"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: 12, top: '12px', background: 'none', border: 'none',
                cursor: 'pointer', color: '#94a3b8', padding: 4, display: 'flex',
              }}
              tabIndex={-1}
            >
              {showPassword ? <EyeOffIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
            </button>
          </div>

          {mode === 'login' && (
            <div style={styles.forgotLink} onClick={() => switchMode('forgot')}>
              পাসওয়ার্ড ভুলে গেছেন?
            </div>
          )}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? (
              <LoaderIcon width={18} height={18} />
            ) : mode === 'login' ? (
              <>
                <ShieldIcon width={18} height={18} /> লগইন করুন
              </>
            ) : (
              <>
                <MailIcon width={18} height={18} /> Account তৈরি করুন
              </>
            )}
          </button>
        </form>
        )}

        <div style={styles.switchRow}>
          {mode === 'login' ? (
            <>
              নতুন এখানে?
              <span style={styles.switchLink} onClick={() => switchMode('signup')}>
                Account তৈরি করুন
              </span>
            </>
          ) : mode === 'signup' ? (
            <>
              আগে থেকেই account আছে?
              <span style={styles.switchLink} onClick={() => switchMode('login')}>
                লগইন করুন
              </span>
            </>
          ) : (
            <>
              পাসওয়ার্ড মনে পড়েছে?
              <span style={styles.switchLink} onClick={() => switchMode('login')}>
                লগইনে ফিরে যান
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
