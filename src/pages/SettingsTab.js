// src/pages/SettingsTab.js
import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';
import { EyeIcon, EyeOffIcon, LoaderIcon, LockIcon, EditIcon, PlusIcon, CheckIcon } from '../components/Icons';

function Section({ title, icon, children, action }) {
  return (
    <div style={{ background: 'var(--bg-surface)', borderRadius: 18, overflow: 'hidden', marginBottom: 14, boxShadow: 'var(--shadow)' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', flex: 1 }}>{title}</span>
        {action}
      </div>
      <div style={{ padding: 18 }}>
        {children}
      </div>
    </div>
  );
}

function ThemeSection() {
  const { themeKey, setTheme, themeOrder, themes } = useTheme();
  return (
    <Section title="থিম" icon="🎨">
      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 12 }}>
        পুরো অ্যাপের রঙ ও ব্যাকগ্রাউন্ড থিম বেছে নিন
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, minWidth: 0 }}>
        {themeOrder.map((key) => {
          const t = themes[key];
          const active = key === themeKey;
          return (
            <button
              key={key}
              onClick={() => setTheme(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 14,
                border: active ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                background: active ? 'var(--accent-soft)' : 'var(--bg-surface-alt)',
                cursor: 'pointer', textAlign: 'left', minWidth: 0, boxSizing: 'border-box',
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{t.emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--accent)' : 'var(--text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</span>
              {active && <CheckIcon width={14} height={14} color="var(--accent)" />}
            </button>
          );
        })}
      </div>
    </Section>
  );
}

export default function SettingsTab({ currentUser, onEditProfile }) {
  const { updatePassword, signOut } = useAuth();

  // Password change state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });

  async function handlePasswordChange() {
    setPwdMsg({ type: '', text: '' });
    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdMsg({ type: 'error', text: 'সব ঘর পূরণ করুন' });
      return;
    }
    if (newPwd.length < 6) {
      setPwdMsg({ type: 'error', text: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: 'error', text: 'নতুন পাসওয়ার্ড দুটো মিলছে না' });
      return;
    }
    if (newPwd === currentPwd) {
      setPwdMsg({ type: 'error', text: 'নতুন পাসওয়ার্ড আগেরটার মতো হলে চলবে না' });
      return;
    }
    setPwdLoading(true);
    const { error } = await updatePassword(currentPwd, newPwd);
    setPwdLoading(false);
    if (error) {
      setPwdMsg({ type: 'error', text: error.message });
    } else {
      setPwdMsg({ type: 'success', text: '✅ পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!' });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    }
  }

  const inputStyle = {
    width: '100%', padding: '11px 42px 11px 12px', borderRadius: 12, border: '1.5px solid var(--border)',
    fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    background: 'var(--bg-surface)', color: 'var(--text-primary)',
  };

  const customFields = Object.entries(currentUser.custom_fields || {}).filter(([, f]) => f && f.label);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '16px 14px 90px' }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>সেটিংস</h2>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{currentUser.email}</div>
      </div>

      {/* থিম */}
      <ThemeSection />

      {/* ১. পাসওয়ার্ড পরিবর্তন */}
      <Section title="পাসওয়ার্ড পরিবর্তন" icon="🔐">
        {pwdMsg.text && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 14,
            background: pwdMsg.type === 'success' ? 'var(--success-soft)' : 'var(--danger-soft)',
            color: pwdMsg.type === 'success' ? 'var(--success)' : 'var(--danger)',
          }}>
            {pwdMsg.text}
          </div>
        )}

        {[
          ['বর্তমান পাসওয়ার্ড', currentPwd, setCurrentPwd, 'current-password'],
          ['নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)', newPwd, setNewPwd, 'new-password'],
          ['নতুন পাসওয়ার্ড আবার লিখুন', confirmPwd, setConfirmPwd, 'new-password'],
        ].map(([placeholder, value, setter, autoComplete], i) => (
          <div key={i} style={{ position: 'relative', marginBottom: 10 }}>
            <input
              type={showPwd ? 'text' : 'password'}
              placeholder={placeholder}
              value={value}
              onChange={(e) => setter(e.target.value)}
              autoComplete={autoComplete}
              style={inputStyle}
            />
            {i === 2 && (
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
                tabIndex={-1}
              >
                {showPwd ? <EyeOffIcon width={16} height={16} /> : <EyeIcon width={16} height={16} />}
              </button>
            )}
          </div>
        ))}

        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
          💡 টিপস: বড় হাতের ও ছোট হাতের অক্ষর, সংখ্যা ও চিহ্ন মিলিয়ে শক্তিশালী পাসওয়ার্ড ব্যবহার করুন
        </div>

        <button
          onClick={handlePasswordChange}
          disabled={pwdLoading}
          style={{
            width: '100%', padding: 12, borderRadius: 12, border: 'none',
            background: 'var(--accent-gradient)', color: '#fff',
            fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {pwdLoading ? <LoaderIcon width={16} height={16} /> : <><LockIcon width={16} height={16} /> পাসওয়ার্ড বদলান</>}
        </button>
      </Section>

      {/* ২. অ্যাকাউন্ট তথ্য */}
      <Section
        title="অ্যাকাউন্ট তথ্য"
        icon="👤"
        action={
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onEditProfile}
              title="প্রোফাইল এডিট করুন"
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 9,
                border: 'none', background: 'var(--accent-soft)', color: 'var(--accent)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              <EditIcon width={12} height={12} /> এডিট
            </button>
            <button
              onClick={onEditProfile}
              title="নতুন ফিল্ড যোগ করুন"
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 9,
                border: 'none', background: 'var(--accent-soft)', color: 'var(--accent)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              <PlusIcon width={12} height={12} /> নতুন ফিল্ড
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['নাম', currentUser.name],
            ['ইমেইল', currentUser.email],
            ['ব্যাচ', currentUser.batch || 'Petro Special Foundation Training 2026'],
            ['প্রতিষ্ঠান', currentUser.current_company || '—'],
            ['পদবী', currentUser.designation || '—'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--bg-surface-alt)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
            </div>
          ))}
          {customFields.map(([id, f]) => (
            <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--bg-surface-alt)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{f.label}</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{f.value || '—'}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
          উপরের "এডিট" বাটনে চাপুন, অথবা হেডারে নিজের ছবিতে ক্লিক করুন → Edit
        </div>
      </Section>

      {/* ৩. নিরাপত্তা */}
      <Section title="নিরাপত্তা" icon="🛡️">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 12, background: 'var(--success-soft)', border: '1px solid var(--success)' }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--success)' }}>Session সক্রিয়</div>
              <div style={{ fontSize: 12, color: 'var(--success)' }}>আপনি লগইন আছেন</div>
            </div>
            <span style={{ fontSize: 18 }}>✅</span>
          </div>

          <div style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--bg-surface-alt)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>সর্বশেষ পরিবর্তন</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
              {new Date(currentUser.updated_at || currentUser.created_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
      </Section>

      {/* ৪. লগআউট */}
      <Section title="অ্যাকাউন্ট" icon="🚪">
        <button
          onClick={() => { if (window.confirm('লগআউট করবেন?')) signOut(); }}
          style={{
            width: '100%', padding: 12, borderRadius: 12, border: '1.5px solid var(--danger)',
            background: 'var(--bg-surface)', color: 'var(--danger)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          লগআউট করুন
        </button>
      </Section>
    </div>
  );
}
