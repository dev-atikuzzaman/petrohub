// src/components/CreatePollModal.js
import React, { useState } from 'react';
import Avatar from './Avatar';
import { XIcon, LoaderIcon, PlusIcon, TrashIcon, PollIcon } from './Icons';
import { createPoll } from '../lib/dataService';

export default function CreatePollModal({ currentUser, onClose, onCreated }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  function updateOption(i, value) {
    const next = [...options];
    next[i] = value;
    setOptions(next);
  }

  function addOption() {
    if (options.length >= 8) return;
    setOptions([...options, '']);
  }

  function removeOption(i) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== i));
  }

  async function handleSubmit() {
    setError('');
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim()) { setError('প্রশ্ন লিখুন'); return; }
    if (cleanOptions.length < 2) { setError('কমপক্ষে ২টি অপশন দিন'); return; }

    setPosting(true);
    const { error } = await createPoll(currentUser.id, question.trim(), cleanOptions);
    setPosting(false);
    if (error) { setError(error.message); return; }
    onCreated && onCreated();
    onClose();
  }

  const inputStyle = {
    width: '100%', padding: '11px 13px', borderRadius: 12, border: '1.5px solid var(--border)',
    background: 'var(--bg-surface-alt)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box',
  };

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
            <PollIcon width={18} height={18} color="var(--accent)" /> নতুন পোল / জরিপ
          </h3>
          <button onClick={onClose} style={{ background: 'var(--border-soft)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XIcon width={16} height={16} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Avatar name={currentUser.name} src={currentUser.avatar_url} size={40} />
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{currentUser.name}</div>
        </div>

        {error && <div style={{ color: 'var(--danger)', fontSize: 12.5, marginBottom: 10 }}>{error}</div>}

        <textarea
          placeholder="আপনার প্রশ্ন লিখুন..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          style={{ ...inputStyle, marginBottom: 12, resize: 'vertical', fontFamily: 'inherit' }}
        />

        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>অপশনসমূহ</div>
        {options.map((opt, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input
              placeholder={`অপশন ${i + 1}`}
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              style={inputStyle}
            />
            {options.length > 2 && (
              <button onClick={() => removeOption(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex', flexShrink: 0 }}>
                <TrashIcon width={16} height={16} />
              </button>
            )}
          </div>
        ))}

        {options.length < 8 && (
          <button
            onClick={addOption}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1.5px dashed var(--border)',
              borderRadius: 10, padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 12.5, fontWeight: 700,
              cursor: 'pointer', marginBottom: 16,
            }}
          >
            <PlusIcon width={13} height={13} /> আরেকটি অপশন যোগ করুন
          </button>
        )}

        <button
          onClick={handleSubmit}
          disabled={posting}
          style={{
            width: '100%', padding: 13, borderRadius: 14, border: 'none', background: 'var(--accent-gradient)',
            color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {posting ? <LoaderIcon width={17} height={17} /> : 'পোল প্রকাশ করুন'}
        </button>
      </div>
    </div>
  );
}
