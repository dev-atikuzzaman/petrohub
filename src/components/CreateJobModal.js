// src/components/CreateJobModal.js
import React, { useState } from 'react';
import Avatar from './Avatar';
import { XIcon, LoaderIcon, BriefcaseIcon } from './Icons';
import { createJobPosting } from '../lib/dataService';

const JOB_TYPES = [
  { key: 'full_time', label: 'ফুল-টাইম' },
  { key: 'part_time', label: 'পার্ট-টাইম' },
  { key: 'internship', label: 'ইন্টার্নশিপ' },
  { key: 'contract', label: 'কন্ট্রাক্ট' },
  { key: 'referral', label: 'রেফারেল' },
  { key: 'transfer', label: 'ট্রান্সফার সুযোগ' },
];

export default function CreateJobModal({ currentUser, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '', company: '', location: '', job_type: 'full_time',
    description: '', contact_info: '', deadline: '',
  });
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    if (!form.title.trim()) { setError('পদের নাম দিন'); return; }
    setPosting(true);
    const { error } = await createJobPosting(currentUser.id, form);
    setPosting(false);
    if (error) { setError(error.message); return; }
    onCreated && onCreated();
    onClose();
  }

  const inputStyle = {
    width: '100%', padding: '11px 13px', borderRadius: 12, border: '1.5px solid var(--border)',
    background: 'var(--bg-surface-alt)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)', borderRadius: 22, width: '100%', maxWidth: 480, padding: 20,
          boxShadow: '0 25px 70px rgba(0,0,0,0.3)', animation: 'slideUp 0.3s ease', maxHeight: '85vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BriefcaseIcon width={18} height={18} color="var(--accent)" /> নতুন সুযোগ পোস্ট করুন
          </h3>
          <button onClick={onClose} style={{ background: 'var(--border-soft)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XIcon width={16} height={16} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Avatar name={currentUser.name} src={currentUser.avatar_url} size={40} />
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{currentUser.name}</div>
        </div>

        {error && <div style={{ color: 'var(--danger)', fontSize: 12.5, marginBottom: 10 }}>{error}</div>}

        <div style={labelStyle}>পদের নাম *</div>
        <input
          placeholder="যেমন: Instrument Engineer"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          style={{ ...inputStyle, marginBottom: 12 }}
        />

        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>প্রতিষ্ঠান</div>
            <input
              placeholder="কোম্পানি/প্রতিষ্ঠান"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>অবস্থান</div>
            <input
              placeholder="যেমন: সিলেট"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={labelStyle}>ধরন</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {JOB_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setForm({ ...form, job_type: t.key })}
              style={{
                padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: 'none',
                background: form.job_type === t.key ? 'var(--accent-gradient)' : 'var(--bg-surface-alt)',
                color: form.job_type === t.key ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={labelStyle}>বিবরণ</div>
        <textarea
          placeholder="দায়িত্ব, প্রয়োজনীয় যোগ্যতা ইত্যাদি লিখুন..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={4}
          style={{ ...inputStyle, marginBottom: 12, resize: 'vertical', fontFamily: 'inherit' }}
        />

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>যোগাযোগ</div>
            <input
              placeholder="ইমেইল/ফোন/লিংক"
              value={form.contact_info}
              onChange={(e) => setForm({ ...form, contact_info: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>শেষ তারিখ (ঐচ্ছিক)</div>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={posting}
          style={{
            width: '100%', padding: 13, borderRadius: 14, border: 'none', background: 'var(--accent-gradient)',
            color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {posting ? <LoaderIcon width={17} height={17} /> : 'পোস্ট করুন'}
        </button>
      </div>
    </div>
  );
}
