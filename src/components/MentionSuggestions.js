// src/components/MentionSuggestions.js
import React from 'react';
import Avatar from './Avatar';

export default function MentionSuggestions({ matches, onSelect }) {
  if (!matches || matches.length === 0) return null;

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12,
      marginTop: 6, boxShadow: 'var(--shadow-lg)', overflow: 'hidden', maxHeight: 180, overflowY: 'auto',
    }}>
      {matches.map((m) => (
        <div
          key={m.id}
          onMouseDown={(e) => { e.preventDefault(); onSelect(m); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', cursor: 'pointer' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-alt)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          <Avatar name={m.name} src={m.avatar_url} size={26} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</span>
        </div>
      ))}
    </div>
  );
}
