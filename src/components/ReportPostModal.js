// src/components/ReportPostModal.js
import React, { useState } from 'react';
import { XIcon, FlagIcon, LoaderIcon } from './Icons';
import { reportPost } from '../lib/dataService';

const REASONS = ['স্প্যাম', 'অনুপযুক্ত বিষয়বস্তু', 'হয়রানি/আক্রমণাত্মক', 'ভুল তথ্য', 'অন্যান্য'];

export default function ReportPostModal({ postId, currentUser, onClose, onReported }) {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    const finalReason = reason === 'অন্যান্য' ? customReason.trim() : reason;
    if (!finalReason) { setError('একটা কারণ বাছাই করুন'); return; }
    setSubmitting(true);
    const { error } = await reportPost(postId, currentUser.id, finalReason);
    setSubmitting(false);
    if (error) { setError('রিপোর্ট পাঠাতে সমস্যা হয়েছে'); return; }
    setDone(true);
    onReported && onReported();
    setTimeout(onClose, 1200);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16, backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)', borderRadius: 20, width: '100%', maxWidth: 380, padding: 20,
          boxShadow: '0 25px 70px rgba(0,0,0,0.3)', animation: 'slideUp 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FlagIcon width={16} height={16} color="var(--danger)" /> পোস্ট রিপোর্ট করুন
          </h3>
          <button onClick={onClose} style={{ background: 'var(--border-soft)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XIcon width={14} height={14} />
          </button>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--success)', fontSize: 14, fontWeight: 700 }}>
            ✅ রিপোর্ট পাঠানো হয়েছে, ধন্যবাদ
          </div>
        ) : (
          <>
            {error && <div style={{ color: 'var(--danger)', fontSize: 12.5, marginBottom: 10 }}>{error}</div>}
            {REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 10, marginBottom: 6,
                  border: reason === r ? '1.5px solid var(--danger)' : '1.5px solid var(--border)',
                  background: reason === r ? 'var(--danger-soft)' : 'var(--bg-surface-alt)',
                  color: reason === r ? 'var(--danger)' : 'var(--text-primary)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {r}
              </button>
            ))}
            {reason === 'অন্যান্য' && (
              <input
                placeholder="কারণ লিখুন..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--border)',
                  background: 'var(--bg-surface-alt)', color: 'var(--text-primary)', fontSize: 13, marginBottom: 6, boxSizing: 'border-box',
                }}
              />
            )}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: '100%', padding: 11, borderRadius: 12, border: 'none', background: 'var(--danger)',
                color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', marginTop: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {submitting ? <LoaderIcon width={15} height={15} /> : 'রিপোর্ট পাঠান'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
